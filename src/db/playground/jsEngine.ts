import JsWorker from './js.worker.ts?worker';
import type { RunLine, RunResult } from './jsRun';

/** A run is stopped when the worker sends nothing (no heartbeat, no output) for this long: a synchronous endless loop never yields. */
const WATCHDOG_MS = 5000;

interface Active { id: number; lines: RunLine[]; t0: number; beat: number; resolve: (r: RunResult) => void; timer: ReturnType<typeof setInterval>; onLine?: (l: RunLine) => void }

/** Talks to the playground worker. An endless loop (or Stop) terminates the worker; the next run gets a fresh one. */
class JsEngine {
	private w: Worker | null = null;
	private seq = 0;
	private cur: Active | null = null;

	private worker() {
		if (this.w) return this.w;
		const w = new JsWorker();
		w.onmessage = (e: MessageEvent) => {
			const m = e.data;
			const a = this.cur;
			if (!a) return;
			a.beat = performance.now();
			if (m.type === 'line' && m.id === a.id) { const l = { level: m.level, text: m.text } as RunLine; a.lines.push(l); a.onLine?.(l); }
			else if (m.type === 'done' && m.id === a.id) this.finish(a, m.result as RunResult);
		};
		w.onerror = () => { const a = this.cur; if (a) this.kill(a, 'The playground worker stopped unexpectedly.'); };
		return (this.w = w);
	}

	private finish(a: Active, r: RunResult) {
		clearInterval(a.timer);
		if (this.cur === a) this.cur = null;
		a.resolve(r);
	}

	/** Terminates the worker and settles the current run with what it printed so far. */
	private kill(a: Active, message: string) {
		this.w?.terminate();
		this.w = null;
		const lines = [...a.lines, { level: 'error', text: message } as RunLine];
		this.finish(a, { lines, error: { message, stopped: true }, notes: [], ms: Math.round(performance.now() - a.t0) });
	}

	run(code: string, ts: boolean, onLine?: (l: RunLine) => void): Promise<RunResult> {
		if (this.cur) this.kill(this.cur, 'Stopped.');
		return new Promise((resolve) => {
			const a: Active = { id: ++this.seq, lines: [], t0: performance.now(), beat: performance.now(), resolve, onLine, timer: 0 as any };
			a.timer = setInterval(() => { if (performance.now() - a.beat > WATCHDOG_MS) this.kill(a, 'Stopped: the script ran for more than 5 seconds (an endless loop?)'); }, 500);
			this.cur = a;
			this.worker().postMessage({ id: a.id, code, ts });
		});
	}

	stop() {
		if (this.cur) this.kill(this.cur, 'Stopped.');
		else { this.w?.terminate(); this.w = null; }
	}
}

export const jsEngine = new JsEngine();
