// Narration engines behind one interface: the phone's system voice (Web Speech) and downloaded neural voices
// (sherpa-onnx via the "LocalTts" plugin). The lesson view only talks to `createSpeaker()`.
import { LocalTts, ensureLoaded, neuralAvailable, wavToBuffer, type SynthResult } from './native';
import { loadTtsPrefs, saveVoiceSpeed } from './prefs';
import { PlaybackModel, type Plan } from './schedule';
import { SAMPLE_TEXT } from './catalog';

export interface SpeakHooks {
	/** The word with this index is being spoken now. */
	onWord(idx: number): void;
	onEnd(): void;
	onError(): void;
	/** True while the neural voice is loading or catching up, so the UI can say "Preparing voice…" (`pct` 0-100 when known). */
	onPreparing(on: boolean, pct?: number): void;
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
		// a ramp: the first chunks are kept short (5-12 words, then 6-16) so the first audio is ready quickly and the scheduler
		// can start after one sentence; later chunks are sentence-sized
		const k = out.length;
		const end = (SENTENCE_END.test(w) && !ABBREV.has(w.toLowerCase())) || (k === 0 ? (n >= 5 && SOFT_END.test(w)) || n >= 12 : k === 1 ? (n >= 6 && SOFT_END.test(w)) || n >= 16 : (n >= 24 && SOFT_END.test(w)) || n >= 40);
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

	/**
	 * Synthesizes sentence by sentence and plays them back to back. *When* to start, how far ahead to synthesize and when to
	 * re-buffer are decided by PlaybackModel (schedule.ts) from the measured real-time factor, so a slow phone waits once up
	 * front instead of stuttering at every sentence. Decoded audio is dropped as soon as a sentence has played.
	 */
	async speakFrom(words: string[], start: number, rate: number, h: SpeakHooks, voice: string, sid: number) {
		this.clear();
		const my = ++this.token;
		const alive = () => my === this.token;
		const chunks = chunkWords(words, start);
		if (chunks.length === 0) { h.onEnd(); return; }
		const ctx = this.audio();
		h.onPreparing(true, 0);
		await ctx.resume();
		await ensureLoaded(voice);
		if (!alive()) return;

		const chars = chunks.map((c) => words.slice(c.from, c.to).join(' ').length);
		const model = new PlaybackModel(chars);
		const decoded = new Map<number, AudioBuffer>(); // synthesized, waiting to be scheduled
		const timeline: { t: number; idx: number }[] = [];
		let cursor = 0;
		let wantSynth = true;
		let savedSpeed = false;
		const lastIndex = chunks.length - 1;

		const apply = (plan: Plan) => {
			for (const s of plan.schedule) {
				const buf = decoded.get(s.i);
				if (!buf) continue;
				decoded.delete(s.i);
				const src = ctx.createBufferSource();
				src.buffer = buf;
				src.connect(ctx.destination);
				src.start(s.startAt);
				this.sources.push(src);
				const c = chunks[s.i];
				const wts = wordWeights(words, c.from, c.to);
				const sum = wts.reduce((a, b) => a + b, 0);
				let t = s.startAt;
				for (let k = 0; k < wts.length; k++) {
					timeline.push({ t, idx: c.from + k });
					t += (wts[k] / sum) * buf.duration;
				}
				src.onended = () => {
					// release the decoded audio of a sentence that has played
					src.onended = null;
					this.sources = this.sources.filter((x) => x !== src);
					if (s.i === lastIndex && alive()) { this.clear(); h.onEnd(); }
				};
			}
			if (plan.preparing) h.onPreparing(plan.preparing.on, plan.preparing.pct);
			if (plan.notice) h.onNotice(plan.notice);
			wantSynth = plan.wantSynth;
			if (!savedSpeed && model.rtf.n >= 3) { savedSpeed = true; saveVoiceSpeed(voice, model.rtf.value); }
		};

		this.tick = window.setInterval(() => {
			if (!alive()) return;
			const now = ctx.currentTime;
			let hit = -1;
			while (cursor < timeline.length && timeline[cursor].t <= now) hit = timeline[cursor++].idx;
			if (hit >= 0) h.onWord(hit);
			apply(model.step(now));
		}, 50);

		try {
			for (let i = 0; i < chunks.length; i++) {
				while (alive() && !wantSynth) await new Promise((r) => setTimeout(r, 80));
				if (!alive()) return;
				const c = chunks[i];
				const r = await LocalTts.synthesize({ text: words.slice(c.from, c.to).join(' '), sid, speed: rate });
				if (!alive()) return;
				const buf = await ctx.decodeAudioData(wavToBuffer(r.wav));
				if (!alive()) return;
				decoded.set(i, buf);
				model.onChunk(i, buf.duration, r.synthSec, chars[i]);
				apply(model.step(ctx.currentTime));
			}
			if (model.rtf.n >= 1) saveVoiceSpeed(voice, model.rtf.value);
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
