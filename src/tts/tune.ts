// "Find fastest setting": which thread count synthesizes a voice fastest on THIS phone. Phones mix fast and efficiency cores, so
// more threads is not always faster (a thread on an efficiency core can hold up all the others). We try a few counts with the
// real engine and keep the best. Everything runs on the user's phone; nothing is assumed about its CPU.
import { LocalTts, getCpuInfo, forgetLoaded, threadsFor, type CpuInfo } from './native';
import { saveVoiceThreads } from './prefs';
import { isNarrating } from './speaker';

/** About six seconds of speech: long enough for a stable reading, short enough that the whole search takes a minute or two. */
export const TUNE_TEXT = 'Every request travels from the app to the server, which looks up the data and sends back a response.';

export interface TuneProgress { text: string; pct: number }
export interface TuneResult { cancelled: boolean; best: number | null; bestRtf: number | null; tried: { n: number; rtf: number }[] }

/** 1, 2, 3, 4 and the number of performance cores, never more than 6 or more than the phone has, without duplicates. */
export function candidateThreads(info: Pick<CpuInfo, 'cores' | 'performance'>): number[] {
	const cap = Math.max(1, Math.min(6, info.cores));
	const out = [...new Set([1, 2, 3, 4, info.performance])].filter((n) => n >= 1 && n <= cap).sort((a, b) => a - b);
	return out.length ? out : [cap];
}

const round2 = (x: number) => Math.round(x * 100) / 100;
const plural = (n: number) => `${n} thread${n === 1 ? '' : 's'}`;

/**
 * For each candidate: load the voice with that many threads, one warm-up synthesis (discarded: the first run after a load is slower),
 * then two timed runs; the candidate's speed is their mean (the median of two). The fastest wins and is saved for the voice.
 * Cancelling keeps the previous setting. Throws if narration is playing.
 */
export async function tuneVoice(id: string, sid: number, onProgress: (p: TuneProgress) => void, cancelled: () => boolean): Promise<TuneResult> {
	if (isNarrating()) throw new Error('Stop the narration first, then try again.');
	const before = await threadsFor(id);
	const info = await getCpuInfo();
	const cands = candidateThreads(info);
	const steps = cands.length * 3;
	let done = 0;
	const tried: { n: number; rtf: number }[] = [];
	const pct = () => Math.round((done / steps) * 100);
	const run = async () => {
		const r = await LocalTts.synthesize({ text: TUNE_TEXT, sid, speed: 1, nocache: true }); // real synthesis, never from the cache
		return r.synthSec / Math.max(0.05, r.audioSec);
	};
	try {
		for (const n of cands) {
			if (cancelled()) break;
			onProgress({ text: `Trying ${plural(n)}: loading the voice`, pct: pct() });
			await LocalTts.load({ id, threads: n });
			forgetLoaded();
			await run(); // warm-up, discarded
			done++;
			if (cancelled()) break;
			onProgress({ text: `Trying ${plural(n)}: measuring`, pct: pct() });
			const a = await run();
			done++;
			if (cancelled()) break;
			const b = await run();
			done++;
			tried.push({ n, rtf: round2((a + b) / 2) });
			onProgress({ text: `${plural(n)}: ${round2((a + b) / 2).toFixed(2)}x real time`, pct: pct() });
		}
	} finally {
		// leave the engine loaded the way narration will use it
		forgetLoaded();
	}
	const complete = !cancelled() && tried.length === cands.length;
	if (!complete) {
		try { await LocalTts.load({ id, threads: before }); } catch { /* it reloads on first use */ }
		return { cancelled: true, best: null, bestRtf: null, tried };
	}
	const best = tried.reduce((a, b) => (b.rtf < a.rtf ? b : a));
	saveVoiceThreads(id, best.n, best.rtf, tried);
	try { await LocalTts.load({ id, threads: best.n }); } catch { /* it reloads on first use */ }
	return { cancelled: false, best: best.n, bestRtf: best.rtf, tried };
}
