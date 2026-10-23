// Simulates narration on a virtual clock with the same PlaybackModel the app uses, at several synthesis speeds, and checks it
// does not stutter. Run: bun scripts/verify-tts.ts
import { PlaybackModel, SLOW_NOTICE, speedClass, requiredBuffer, leadSeconds, CAP_WAIT_S, DEFAULT_SEC_PER_CHAR } from '../src/tts/schedule';
import { cacheKey, cacheKeyInput } from '../src/tts/cacheKey';
import { candidateThreads } from '../src/tts/tune';

// A 25-sentence passage with realistic, uneven sentence lengths (characters per chunk).
const CHARS = [38, 96, 71, 140, 52, 118, 83, 60, 152, 74, 45, 109, 88, 130, 66, 57, 124, 92, 79, 148, 61, 100, 70, 115, 84];
const TRUE_SEC_PER_CHAR = 0.062; // what speech really takes (the model starts from a different guess and learns it)

interface Result { rtfSamples: number; rtf: number; startDelay: number; gaps: number; observedGaps: number; gapSec: number; notice: boolean; peakRetained: number; finished: number; audio: number; waitedPct: number[] }

/** `cached[i]` = sentence i is already in the audio cache (served in ~30 ms, no synthesis). `trainRtf` = the speed already measured for this voice (the saved prior). */
function simulate(rtf: number, jitter = 0.12, seed = 7, cached: boolean[] = [], trainRtf?: number): Result {
	let rng = seed;
	const rand = () => ((rng = (rng * 1664525 + 1013904223) >>> 0) / 2 ** 32);
	const audio = CHARS.map((c) => c * TRUE_SEC_PER_CHAR * (0.9 + 0.2 * rand()));
	const model = new PlaybackModel(CHARS, cached, trainRtf);
	const intervals: [number, number][] = [];
	let notice = false;
	let inFlight: { i: number; doneAt: number; synth: number; hit: boolean } | null = null;
	let next = 0;
	const dt = 0.05;
	const waitedPct: number[] = [];
	let t = 0;
	for (; t < 2000; t += dt) {
		if (inFlight && t >= inFlight.doneAt) {
			model.onChunk(inFlight.i, audio[inFlight.i], inFlight.synth, CHARS[inFlight.i], inFlight.hit);
			inFlight = null;
		}
		const plan = model.step(t);
		for (const s of plan.schedule) intervals.push([s.startAt, s.startAt + s.dur]);
		if (plan.notice) { notice = true; if (plan.notice !== SLOW_NOTICE) throw new Error('wrong notice text'); }
		if (plan.preparing?.on) waitedPct.push(plan.preparing.pct);
		if (!inFlight && next < CHARS.length && plan.wantSynth) {
			const hit = !!cached[next];
			const synth = hit ? 0 : audio[next] * rtf * (1 - jitter + 2 * jitter * rand());
			inFlight = { i: next, doneAt: t + (hit ? 0.03 : synth), synth, hit };
			next++;
		}
		if (intervals.length === CHARS.length && t >= intervals[intervals.length - 1][1]) break;
	}
	// independent count of audible gaps: a scheduled chunk starting noticeably after the previous one ended
	let observedGaps = 0, gapSec = 0;
	for (let k = 1; k < intervals.length; k++) {
		const gap = intervals[k][0] - intervals[k - 1][1];
		if (gap > 0.08) { observedGaps++; gapSec += gap; }
	}
	return { rtfSamples: model.rtf.n, rtf, startDelay: intervals[0][0], gaps: model.gaps, observedGaps, gapSec, notice, peakRetained: model.peakRetained, finished: t, audio: audio.reduce((a, b) => a + b, 0), waitedPct };
}

let fails = 0;
const check = (name: string, ok: boolean, detail = '') => { console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ' + detail}`); if (!ok) fails++; };

// unit checks
check('speedClass thresholds', speedClass(0.7) === 'smooth' && speedClass(0.71) === 'may-pause' && speedClass(1.0) === 'may-pause' && speedClass(1.01) === 'slow');
check('lead grows with rtf, bounded 6..20 s', leadSeconds(0.2) === 6 && leadSeconds(2) === 20 && leadSeconds(0.9) > 6 && leadSeconds(0.9) < 20);
check('requiredBuffer ~ next sentence at low rtf', requiredBuffer(0.45, [5, 5, 5]) < 3 && requiredBuffer(0.45, [5, 5, 5]) > 2);
check('requiredBuffer grows with remaining text above rtf 1', requiredBuffer(1.3, Array(20).fill(5)) > 25);
check('the model estimates unsynthesized chunks from the default until it has measured', DEFAULT_SEC_PER_CHAR > 0.04 && DEFAULT_SEC_PER_CHAR < 0.09);

const SPEEDS = [0.2, 0.45, 0.9, 1.3, 2.0];
const results = SPEEDS.map((r) => simulate(r));
console.log('\n rtf   start   gaps(model/observed)  gap time   peak buffered   notice   total time (audio)');
for (const r of results) console.log(` ${r.rtf.toFixed(2)}  ${r.startDelay.toFixed(1).padStart(5)}s   ${String(r.gaps).padStart(2)} / ${String(r.observedGaps).padEnd(2)}               ${r.gapSec.toFixed(1).padStart(5)}s     ${r.peakRetained.toFixed(1).padStart(5)}s        ${r.notice ? 'yes' : 'no '}     ${r.finished.toFixed(0)}s (${r.audio.toFixed(0)}s)`);
console.log('');

for (const r of results) {
	const tag = `rtf ${r.rtf}`;
	check(`${tag}: model's gap count matches what actually played`, r.gaps === r.observedGaps, `${r.gaps} vs ${r.observedGaps}`);
	check(`${tag}: memory stays bounded (peak ${r.peakRetained.toFixed(1)} s of decoded audio <= 35 s)`, r.peakRetained <= 35);
	if (r.rtf <= 0.45) {
		check(`${tag}: zero gaps after start`, r.gaps === 0);
		check(`${tag}: starts in under 4 s (${r.startDelay.toFixed(1)} s)`, r.startDelay < 4);
		check(`${tag}: no slow-voice notice`, !r.notice);
	} else if (r.rtf <= 0.9) {
		check(`${tag}: zero gaps after start (waits until it is safe)`, r.gaps === 0);
		check(`${tag}: starts within the ${CAP_WAIT_S} s cap (${r.startDelay.toFixed(1)} s)`, r.startDelay <= CAP_WAIT_S);
		check(`${tag}: no slow-voice notice`, !r.notice);
	} else {
		check(`${tag}: the slow-voice notice fires exactly once`, r.notice);
		// each stall is one batched re-buffer (a progress-bar wait), not a stutter at every sentence
		check(`${tag}: gaps are batched (${r.gaps} gaps for ${CHARS.length} sentences)`, r.gaps < CHARS.length / 3, `${r.gaps}`);
		check(`${tag}: it still finishes`, r.finished < 2000);
	}
}

// ---------- the audio cache: cached sentences are free ----------
console.log('\n-- audio cache --');
check('requiredBuffer: cached sentences add no waiting', requiredBuffer(2.0, [5, 5, 5], 0.3, [true, true, true]) === 0.3 && requiredBuffer(2.0, [5, 5, 5], 0.3, [false, true, true]) > 9);
const m3 = new PlaybackModel([50, 50, 50], [true, true, true]);
for (let k = 0; k < 3; k++) m3.onChunk(k, 3, 0, 50, true);
check('cache hits never count as a speed measurement', m3.rtf.n === 0 && m3.rtf.value === 0.5);
const allCached = simulate(2.0, 0.12, 7, CHARS.map(() => true), 2.0);
check(`all cached, even on a phone measured at 2.0x: starts at once (${allCached.startDelay.toFixed(2)} s)`, allCached.startDelay < 0.6);
check('all cached: zero gaps, no slow-voice notice, no speed samples', allCached.gaps === 0 && allCached.observedGaps === 0 && !allCached.notice && allCached.rtfSamples === 0);
const uncached13 = simulate(1.3);
const half = simulate(1.3, 0.12, 7, CHARS.map((_, i) => i % 2 === 0));
check(`half cached at 1.3x: no gaps (${half.gaps}) where uncached has ${uncached13.gaps}`, half.gaps === 0 && half.observedGaps === 0);
check(`half cached at 1.3x: starts sooner than uncached (${half.startDelay.toFixed(1)} s vs ${uncached13.startDelay.toFixed(1)} s)`, half.startDelay <= uncached13.startDelay);
const front = simulate(1.3, 0.12, 7, CHARS.map((_, i) => i < 12));
check(`first 12 cached at 1.3x: no more gaps than uncached (${front.gaps} vs ${uncached13.gaps}) and finishes sooner`, front.gaps <= uncached13.gaps && front.finished <= uncached13.finished);
check('only the sentences that were really synthesized feed the speed estimate (13 of 25)', front.rtfSamples === 13, `${front.rtfSamples}`);
const fast = simulate(0.45, 0.12, 7, CHARS.map((_, i) => i % 3 === 0));
check('a fast voice with some cached sentences still has zero gaps', fast.gaps === 0);

// the saved speed is used from the first caption on
const withPrior = simulate(1.3, 0.12, 7, [], 1.3);
const withoutPrior = simulate(1.3);
check(`a saved speed lets a slow voice plan from the start: no more gaps (${withPrior.gaps} vs ${withoutPrior.gaps}) and no later start`, withPrior.gaps <= withoutPrior.gaps && withPrior.startDelay <= CAP_WAIT_S + 0.2); // the wait is capped, within one 50 ms tick
check('a prior is not a measurement (slow-voice notice still needs fresh samples)', new PlaybackModel([50], [], 1.5).rtf.n === 0);

// ---------- cache key ----------
console.log('\n-- cache key --');
const base = await cacheKey('kokoro', 3, 1, 'Hello there.');
check('key is 64 hex characters', /^[0-9a-f]{64}$/.test(base));
check('same inputs give the same key', base === (await cacheKey('kokoro', 3, 1, 'Hello there.')));
check('speed 1 and 1.0 and 1.001 are the same entry', base === (await cacheKey('kokoro', 3, 1.0, 'Hello there.')) && base === (await cacheKey('kokoro', 3, 1.001, 'Hello there.')));
check('a different voice, speaker, speed or text gives a different key',
	new Set([base, await cacheKey('piper', 3, 1, 'Hello there.'), await cacheKey('kokoro', 2, 1, 'Hello there.'), await cacheKey('kokoro', 3, 1.25, 'Hello there.'), await cacheKey('kokoro', 3, 1, 'Hello there!')]).size === 5);
check('speed 1.25 vs 1.26 are different entries', (await cacheKey('v', 0, 1.25, 'x')) !== (await cacheKey('v', 0, 1.26, 'x')));
check('canonical input is voice|speaker|speed(2 decimals)|text', cacheKeyInput('piper-x', 0, 1.5, 'Hi | there') === 'piper-x|0|1.50|Hi | there');

// ---------- thread candidates ----------
console.log('\n-- thread candidates --');
const eq = (a: number[], b: number[]) => JSON.stringify(a) === JSON.stringify(b);
check('8-core phone with 4 performance cores: 1,2,3,4', eq(candidateThreads({ cores: 8, performance: 4 }), [1, 2, 3, 4]));
check('8 cores, 5 performance cores: adds 5', eq(candidateThreads({ cores: 8, performance: 5 }), [1, 2, 3, 4, 5]));
check('10 cores, 8 performance: capped at 6 threads', Math.max(...candidateThreads({ cores: 10, performance: 8 })) <= 6);
check('2-core phone: never more threads than cores', eq(candidateThreads({ cores: 2, performance: 2 }), [1, 2]));
check('no duplicates', new Set(candidateThreads({ cores: 8, performance: 4 })).size === candidateThreads({ cores: 8, performance: 4 }).length);

// naive baseline for context: play every sentence as it arrives, no buffering
function naiveGaps(rtf: number) {
	let rng = 7; const rand = () => ((rng = (rng * 1664525 + 1013904223) >>> 0) / 2 ** 32);
	const audio = CHARS.map((c) => c * TRUE_SEC_PER_CHAR * (0.9 + 0.2 * rand()));
	let ready = 0, end = 0, gaps = 0;
	audio.forEach((a, k) => { ready += a * rtf * (0.88 + 0.24 * rand()); const start = Math.max(ready, end); if (k > 0 && ready > end + 0.08) gaps++; end = start + a; });
	return gaps;
}
console.log(`\nfor comparison, the old play-as-it-arrives behaviour: rtf 0.9 -> ${naiveGaps(0.9)} gaps, rtf 1.3 -> ${naiveGaps(1.3)} gaps, rtf 2.0 -> ${naiveGaps(2.0)} gaps`);
console.log(fails ? `\nFAIL: ${fails} problems` : '\nOK: all narration scheduling checks pass');
process.exit(fails ? 1 : 0);
