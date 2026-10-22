// Narration engines behind one interface: the phone's system voice (Web Speech) and downloaded neural voices
// (sherpa-onnx via the "LocalTts" plugin). The lesson view only talks to `createSpeaker()`.
import { LocalTts, ensureLoaded, neuralAvailable, wavToBuffer, type SynthResult } from './native';
import { loadTtsPrefs } from './prefs';
import { SAMPLE_TEXT } from './catalog';

export interface SpeakHooks {
	/** The word with this index is being spoken now. */
	onWord(idx: number): void;
	onEnd(): void;
	onError(): void;
	/** True while the neural voice is loading or catching up, so the UI can say "Preparing voice…". */
	onPreparing(on: boolean): void;
	onNotice(msg: string): void;
}

export interface Speaker {
	readonly supported: boolean;
	speakFrom(words: string[], start: number, rate: number, hooks: SpeakHooks): void;
	pause(): void;
	resume(): void;
	stop(): void;
}

const systemSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

// ---------- system voice (Web Speech) ----------
class SystemSpeaker {
	// Bumped on every stop/restart so a stale utterance's onend/onerror (fired asynchronously after cancel()) can't
	// clobber the state of whatever replaced it.
	private token = 0;

	speakFrom(words: string[], start: number, rate: number, h: SpeakHooks) {
		speechSynthesis.cancel();
		const slice = words.slice(start);
		if (slice.length === 0) { h.onEnd(); return; }
		let idx = start;
		const token = ++this.token;
		const u = new SpeechSynthesisUtterance(slice.join(' '));
		u.rate = rate;
		u.onboundary = (e) => {
			if (token !== this.token || e.name !== 'word') return;
			h.onWord(idx);
			idx++;
		};
		u.onend = () => { if (token === this.token) h.onEnd(); };
		u.onerror = () => { if (token === this.token) h.onError(); };
		speechSynthesis.speak(u);
	}
	pause() { speechSynthesis.pause(); }
	resume() { speechSynthesis.resume(); }
	stop() { this.token++; speechSynthesis.cancel(); }
}

// ---------- neural voice ----------
interface Chunk { from: number; to: number }

const ABBREV = new Set(['e.g.', 'i.e.', 'vs.', 'etc.', 'mr.', 'mrs.', 'dr.', 'no.']);
const SENTENCE_END = /[.!?…]["'”’)\]]*$/;
const SOFT_END = /[,;:]["'”’)\]]*$/;

/** Splits words[start..] into sentence-sized chunks (the unit we synthesize and queue). */
export function chunkWords(words: string[], start: number): Chunk[] {
	const out: Chunk[] = [];
	let from = start;
	for (let i = start; i < words.length; i++) {
		const w = words[i];
		const n = i - from + 1;
		const end = (SENTENCE_END.test(w) && !ABBREV.has(w.toLowerCase())) || (n >= 24 && SOFT_END.test(w)) || n >= 40;
		if (end || i === words.length - 1) {
			out.push({ from, to: i + 1 });
			from = i + 1;
		}
	}
	// A very short chunk sounds clipped: fold it into the next one.
	for (let i = 0; i < out.length - 1; ) {
		if (out[i].to - out[i].from < 4) { out[i + 1].from = out[i].from; out.splice(i, 1); } else i++;
	}
	return out;
}

/** Relative time each word takes inside a clip: proportional to its length, with a longer beat at punctuation. */
function wordWeights(words: string[], from: number, to: number): number[] {
	const w: number[] = [];
	for (let i = from; i < to; i++) {
		const s = words[i];
		w.push(s.length + 1 + (SENTENCE_END.test(s) ? 6 : SOFT_END.test(s) ? 3 : 0));
	}
	return w;
}

const LEAD_SECONDS = 6; // how far ahead of the speaker audio we keep synthesizing

class NeuralSpeaker {
	private ctx: AudioContext | null = null;
	private token = 0;
	private sources: AudioBufferSourceNode[] = [];
	private tick: number | undefined;

	private audio() {
		if (!this.ctx) this.ctx = new AudioContext();
		return this.ctx;
	}

	private clear() {
		if (this.tick !== undefined) { clearInterval(this.tick); this.tick = undefined; }
		for (const s of this.sources) { s.onended = null; try { s.stop(); } catch { /* not started */ } }
		this.sources = [];
	}

	async speakFrom(words: string[], start: number, rate: number, h: SpeakHooks, voice: string, sid: number) {
		this.clear();
		const my = ++this.token;
		const alive = () => my === this.token;
		const chunks = chunkWords(words, start);
		if (chunks.length === 0) { h.onEnd(); return; }
		const ctx = this.audio();
		h.onPreparing(true);
		await ctx.resume();
		await ensureLoaded(voice);
		if (!alive()) return;

		const timeline: { t: number; idx: number }[] = [];
		let cursor = 0;
		let nextStart = 0;
		let scheduledAll = false;
		let waiting = true;
		this.tick = window.setInterval(() => {
			if (!alive()) return;
			const now = ctx.currentTime;
			let hit = -1;
			while (cursor < timeline.length && timeline[cursor].t <= now) hit = timeline[cursor++].idx;
			if (hit >= 0) h.onWord(hit);
			const starved = !scheduledAll && nextStart > 0 && now >= nextStart - 0.02;
			if (starved !== waiting) { waiting = starved; h.onPreparing(starved); }
		}, 50);

		const ahead = 3;
		const reqs: Promise<{ buf: AudioBuffer; r: SynthResult }>[] = [];
		let issued = 0;
		const issue = (upTo: number) => {
			while (issued < chunks.length && issued < upTo) {
				const c = chunks[issued];
				reqs[issued] = LocalTts.synthesize({ text: words.slice(c.from, c.to).join(' '), sid, speed: rate }).then(async (r) => ({ buf: await ctx.decodeAudioData(wavToBuffer(r.wav)), r }));
				issued++;
			}
		};

		try {
			for (let i = 0; i < chunks.length; i++) {
				issue(i + ahead);
				const { buf } = await reqs[i];
				if (!alive()) return;
				const startAt = Math.max(ctx.currentTime + 0.03, nextStart);
				const src = ctx.createBufferSource();
				src.buffer = buf;
				src.connect(ctx.destination);
				src.start(startAt);
				this.sources.push(src);

				const c = chunks[i];
				const wts = wordWeights(words, c.from, c.to);
				const sum = wts.reduce((a, b) => a + b, 0);
				let t = startAt;
				for (let k = 0; k < wts.length; k++) {
					timeline.push({ t, idx: c.from + k });
					t += (wts[k] / sum) * buf.duration;
				}
				nextStart = startAt + buf.duration;
				if (waiting) { waiting = false; h.onPreparing(false); }

				if (i === chunks.length - 1) {
					scheduledAll = true;
					src.onended = () => { if (alive()) { this.clear(); h.onEnd(); } };
					break;
				}
				// Don't synthesize the whole chapter at once: stay a few seconds ahead of the audio.
				while (alive() && nextStart - ctx.currentTime > LEAD_SECONDS) await new Promise((r) => setTimeout(r, 200));
				if (!alive()) return;
			}
		} catch (e) {
			if (!alive()) return;
			this.clear();
			h.onPreparing(false);
			throw e;
		}
	}

	pause() { void this.ctx?.suspend(); }
	resume() { void this.ctx?.resume(); }
	stop(h?: SpeakHooks) {
		this.token++;
		this.clear();
		h?.onPreparing(false);
		void this.ctx?.resume();
	}
}

// ---------- facade ----------
export function createSpeaker(): Speaker {
	const sys = new SystemSpeaker();
	const neural = new NeuralSpeaker();
	let active: 'system' | 'neural' | null = null;
	let hooks: SpeakHooks | null = null;

	const startSystem = (words: string[], start: number, rate: number, h: SpeakHooks) => {
		active = 'system';
		sys.speakFrom(words, start, rate, h);
	};

	return {
		get supported() { return systemSupported() || neuralAvailable(); },
		speakFrom(words, start, rate, h) {
			if (systemSupported()) sys.stop();
			neural.stop(hooks ?? undefined);
			hooks = h;
			const prefs = loadTtsPrefs();
			if (prefs.voice !== 'system' && neuralAvailable()) {
				active = 'neural';
				neural.speakFrom(words, start, rate, h, prefs.voice, prefs.sid).catch((e) => {
					if (active !== 'neural') return;
					h.onNotice(`Couldn't use the downloaded voice (${e?.message ?? e}). Using the system voice.`);
					if (systemSupported()) startSystem(words, start, rate, h);
					else h.onError();
				});
				return;
			}
			if (systemSupported()) startSystem(words, start, rate, h);
			else h.onError();
		},
		pause() { if (active === 'neural') neural.pause(); else if (systemSupported()) sys.pause(); },
		resume() { if (active === 'neural') neural.resume(); else if (systemSupported()) sys.resume(); },
		stop() {
			if (systemSupported()) sys.stop();
			neural.stop(hooks ?? undefined);
			active = null;
		}
	};
}

// ---------- sample playback for Settings ----------
let sampleCtx: AudioContext | null = null;
let sampleSrc: AudioBufferSourceNode | null = null;

export interface SampleReport { audioSec: number; synthSec: number; rtf: number; rms: number }

/** Synthesizes and plays one sentence with the given voice. Resolves with timing once synthesis is done. */
export async function playSample(voice: string, sid: number): Promise<SampleReport> {
	stopSample();
	await ensureLoaded(voice);
	const r = await LocalTts.synthesize({ text: SAMPLE_TEXT, sid, speed: 1 });
	sampleCtx = sampleCtx ?? new AudioContext();
	await sampleCtx.resume();
	const buf = await sampleCtx.decodeAudioData(wavToBuffer(r.wav));
	const src = sampleCtx.createBufferSource();
	src.buffer = buf;
	src.connect(sampleCtx.destination);
	src.start();
	sampleSrc = src;
	return { audioSec: r.audioSec, synthSec: r.synthSec, rtf: r.synthSec / Math.max(0.001, r.audioSec), rms: r.rms };
}

export function stopSample() {
	try { sampleSrc?.stop(); } catch { /* not started */ }
	sampleSrc = null;
}
