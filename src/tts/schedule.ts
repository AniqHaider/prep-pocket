// Pure scheduling for neural narration: no audio, no DOM, no clock of its own, so the real speaker (speaker.ts) and
// `scripts/verify-tts.ts` (a simulation on a virtual clock) run exactly the same decisions.
//
// The problem: a voice synthesizes `rtf` seconds of CPU per second of audio (real-time factor). With rtf < 1 the next sentence is
// ready before the current one finishes. With rtf >= 1 it never catches up, so playing sentence by sentence stutters. The fix is to
// (1) measure rtf as we go, (2) not start until enough audio is buffered that playback will not run dry, (3) when it does run dry anyway,
// wait and re-buffer once instead of stuttering at every sentence, and (4) say plainly when the voice is too slow for this phone.

export const MIN_LEAD_S = 6; // how far ahead of the speakers we synthesize when the voice is fast
export const MAX_LEAD_S = 20; // ... and when it is slow
export const CAP_WAIT_S = 25; // never make the listener wait longer than this for one buffering stretch
export const DEFAULT_SEC_PER_CHAR = 0.065; // ~15 characters of speech per second, until we have measured the voice

/** Running real-time factor (synthesis seconds / audio seconds). Recent sentences count more, because load changes. */
export class RtfTracker {
	n = 0;
	value = 0.5;
	add(synthSec: number, audioSec: number) {
		if (audioSec <= 0.05) return;
		const r = synthSec / audioSec;
		this.value = this.n === 0 ? r : 0.45 * r + 0.55 * this.value;
		this.n++;
	}
}

export type SpeedClass = 'smooth' | 'may-pause' | 'slow';
/** How a measured rtf will feel: smooth <= 0.7 < may pause <= 1.0 < too slow. */
export const speedClass = (rtf: number): SpeedClass => (rtf <= 0.7 ? 'smooth' : rtf <= 1.0 ? 'may-pause' : 'slow');
export const SPEED_LABEL: Record<SpeedClass, string> = { smooth: 'Smooth on this phone', 'may-pause': 'May pause', slow: 'Too slow, will pause' };

/** Seconds of audio to keep synthesized ahead of the speakers: 6 s for a fast voice, up to 20 s for a slow one. */
export const leadSeconds = (rtf: number) => Math.min(MAX_LEAD_S, Math.max(MIN_LEAD_S, MIN_LEAD_S + (rtf - 0.5) * 20));

/** Safety margin: small for a fast voice, 1.5 s once it is close to real time. */
export const marginSeconds = (rtf: number) => 0.3 + 1.2 * Math.min(1, Math.max(0, (rtf - 0.5) / 0.5));

/**
 * Seconds of audio that must already be buffered so that playback never runs dry, given the audio lengths of the chunks still to
 * synthesize (in order). Synthesis is sequential: chunk j finishes after rtf * (L0 + ... + Lj) seconds, while the listener has
 * consumed that many seconds minus nothing, and has been handed L0..L(j-1) in between. So the buffer needed is
 *   max over j of [ rtf * sum(L0..Lj) - sum(L0..L(j-1)) ]  + margin.
 * For rtf < 1 this is about rtf * (the next sentence); for rtf > 1 it grows with the remaining text (and the wait cap takes over).
 * `free[k]` marks chunks already in the persistent cache: they take no synthesis time, so they add nothing to the wait.
 */
export function requiredBuffer(rtf: number, upcoming: number[], margin = marginSeconds(rtf), free: boolean[] = []): number {
	let worst = 0;
	let synth = 0;
	let given = 0;
	for (let k = 0; k < upcoming.length; k++) {
		const L = upcoming[k];
		synth += free[k] ? 0 : rtf * L; // a sentence already in the cache costs no synthesis
		worst = Math.max(worst, synth - given);
		given += L;
	}
	return worst + margin;
}

export const SLOW_NOTICE =
	'This voice is slower than this phone can keep up with, so narration pauses to catch up. A lighter voice (Clear or Warm) will read without pauses.';

export interface PreparingState { on: boolean; pct: number }
export interface Plan {
	/** Chunks to start playing now, in order, with the audio-clock time each should start at. */
	schedule: { i: number; dur: number; startAt: number }[];
	/** The 'Preparing voice...' state, or null if unchanged since the last step. */
	preparing: PreparingState | null;
	/** Set once per session when the voice proved too slow. */
	notice: string | null;
	/** True when the speaker should synthesize the next chunk now. */
	wantSynth: boolean;
	/** True when everything has been synthesized and scheduled (the speaker can wait for the end). */
	allScheduled: boolean;
}

/**
 * The playback state machine. Callers feed it events (`onChunk` when a chunk finished synthesizing) and call `step(now)` often
 * (every 50 ms is plenty). `now` is the audio clock in seconds: AudioContext.currentTime, or a virtual clock in tests.
 */
export class PlaybackModel {
	readonly rtf = new RtfTracker();
	private secPerChar = DEFAULT_SEC_PER_CHAR;
	private measuredChars = 0;
	private pending: { i: number; dur: number }[] = [];
	private nextToSynth = 0;
	private produced = 0;
	private scheduledEnd = 0; // audio-clock time at which everything scheduled so far finishes
	private started = false;
	private state: 'buffering' | 'playing' = 'buffering';
	private waitStart: number | null = null;
	private noticed = false;
	private lastPreparing = '';
	/** Audible gaps after playback first started (each is one re-buffering stretch). */
	gaps = 0;
	gapSeconds = 0;
	private gapStart = 0;
	/** Peak seconds of synthesized audio held in memory (pending + scheduled but not yet played). */
	peakRetained = 0;

	/**
	 * `cached[i]` = chunk i is already in the audio cache (known up front), so it is treated as free.
	 * `priorRtf` = the speed last measured for this voice on this phone: planning starts from it instead of a guess, so a slow voice does
	 * not have to re-learn its speed at every new caption (a prior is not a measurement: the slow-voice notice still needs fresh ones).
	 */
	constructor(private readonly chunkChars: number[], private readonly cached: boolean[] = [], priorRtf?: number) {
		if (priorRtf && Number.isFinite(priorRtf) && priorRtf > 0) this.rtf.value = Math.min(4, Math.max(0.05, priorRtf));
	}

	get total() { return this.chunkChars.length; }
	get synthesized() { return this.produced; }
	get isBuffering() { return this.state === 'buffering'; }

	private get pendingDur() { return this.pending.reduce((a, c) => a + c.dur, 0); }
	private estimate(i: number) { return this.chunkChars[i] * this.secPerChar; }
	private upcoming() { return this.chunkChars.slice(this.produced).map((_, k) => this.estimate(this.produced + k)); }
	/** Audio seconds that must be buffered before (re)starting. */
	private target(now: number) { return Math.min(requiredBuffer(this.rtf.value, this.upcoming(), undefined, this.cached.slice(this.produced)), this.reachable(now)); }
	/** The most audio we could possibly accumulate within the wait cap (cap / rtf), so the target and the percentage stay honest. */
	private reachable(_now: number) { return Math.max(1, CAP_WAIT_S / Math.max(this.rtf.value, 0.05)); }

	/**
	 * Record that chunk `i` is ready: `audioSec` of audio, produced in `synthSec` of CPU time. A chunk served from the cache
	 * (`cached`) says nothing about how fast this phone synthesizes, so it never feeds the real-time factor.
	 */
	onChunk(i: number, audioSec: number, synthSec: number, chars = this.chunkChars[i], cached = false) {
		if (!cached) this.rtf.add(synthSec, audioSec);
		if (chars > 0 && audioSec > 0.05) {
			// running average of seconds of audio per character, used to estimate chunks not yet synthesized
			const w = Math.min(0.5, 0.2 + this.measuredChars / 4000);
			const spc = audioSec / chars;
			this.secPerChar = this.measuredChars === 0 ? spc : w * spc + (1 - w) * this.secPerChar;
			this.measuredChars += chars;
		}
		this.pending.push({ i, dur: audioSec });
		this.produced = Math.max(this.produced, i + 1);
		this.nextToSynth = Math.max(this.nextToSynth, i + 1);
	}

	private ready(now: number): boolean {
		if (this.pending.length === 0) return false;
		if (this.produced >= this.total) return true; // nothing left to wait for
		if (this.waitStart !== null && now - this.waitStart >= CAP_WAIT_S) return true; // gave it the full cap
		return this.pendingDur >= this.target(now);
	}

	step(now: number): Plan {
		const plan: Plan = { schedule: [], preparing: null, notice: null, wantSynth: false, allScheduled: false };
		if (this.waitStart === null && this.state === 'buffering') this.waitStart = now;

		// ran dry while more is coming: re-buffer once instead of stuttering at every sentence
		if (this.state === 'playing' && this.pending.length === 0 && this.produced < this.total && now >= this.scheduledEnd - 0.02) {
			this.state = 'buffering';
			this.waitStart = now;
			this.gaps++;
			this.gapStart = Math.max(now, this.scheduledEnd);
		}

		if (this.state === 'buffering' && this.ready(now)) {
			this.state = 'playing';
			if (this.started) this.gapSeconds += Math.max(0, now - this.gapStart);
			this.started = true;
			this.waitStart = null;
		}
		if (this.state === 'playing') {
			for (const c of this.pending) {
				const startAt = Math.max(now + 0.03, this.scheduledEnd);
				plan.schedule.push({ i: c.i, dur: c.dur, startAt });
				this.scheduledEnd = startAt + c.dur;
			}
			this.pending = [];
		}

		const ahead = Math.max(0, this.scheduledEnd - now) + this.pendingDur;
		this.peakRetained = Math.max(this.peakRetained, ahead);
		const moreToSynth = this.nextToSynth < this.total;
		plan.wantSynth = moreToSynth && (this.state === 'buffering' || ahead < leadSeconds(this.rtf.value));
		plan.allScheduled = this.produced >= this.total && this.pending.length === 0;

		// 'Preparing voice... 40%': progress is whichever is further along, the buffer or the wait cap
		if (this.state === 'buffering') {
			const t = this.target(now);
			const pct = Math.round(100 * Math.min(1, Math.max(t > 0 ? this.pendingDur / t : 1, this.waitStart !== null ? (now - this.waitStart) / CAP_WAIT_S : 0)));
			const key = `1:${pct}`;
			if (key !== this.lastPreparing) { this.lastPreparing = key; plan.preparing = { on: true, pct }; }
		} else if (this.lastPreparing !== '0') {
			this.lastPreparing = '0';
			plan.preparing = { on: false, pct: 100 };
		}

		if (!this.noticed && this.rtf.n >= 3 && this.rtf.value > 1.0) { this.noticed = true; plan.notice = SLOW_NOTICE; }
		return plan;
	}
}
