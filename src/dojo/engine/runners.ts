// Main-thread clients for the Python/SQL workers. Each run has a timeout; on timeout the worker is
// terminated (the only way to stop an infinite loop) and respawned on the next run.
import PythonWorker from './python.worker.ts?worker';
import SqlWorker from './sql.worker.ts?worker';
import DrillsWorker from '../../drills/drills.worker.ts?worker';
import type { DrillResult } from '../../drills/drills-core';
import type { PyResult, PyTest } from './python-core';
import type { SqlResult } from './sql-core';

const INIT_TIMEOUT_MS = 120_000; // first Pyodide/PGlite load on a phone can be slow
const RUN_TIMEOUT_MS = 8_000;

class Runner<Req extends object, Res> {
	private worker?: Worker;
	private ready?: Promise<void>;
	private seq = 0;

	constructor(private make: () => Worker, private timeoutMsg: string) {}

	private spawn() {
		const w = this.make();
		this.worker = w;
		this.ready = new Promise<void>((resolve, reject) => {
			const timer = setTimeout(() => reject(new Error('Engine took too long to start.')), INIT_TIMEOUT_MS);
			const on = (e: MessageEvent) => {
				if (e.data?.type === 'ready') {
					clearTimeout(timer);
					w.removeEventListener('message', on);
					resolve();
				} else if (e.data?.type === 'init-error') {
					clearTimeout(timer);
					reject(new Error(e.data.message));
				}
			};
			w.addEventListener('message', on);
			w.addEventListener('error', (e) => reject(new Error(e.message || 'Worker failed to load')), { once: true });
		});
		this.ready.catch(() => this.kill());
	}

	private kill() {
		this.worker?.terminate();
		this.worker = undefined;
		this.ready = undefined;
	}

	/** Start loading the engine in the background (called when the learner opens an exercise). */
	warm() {
		if (!this.worker) this.spawn();
		this.ready?.catch(() => {});
	}

	async run(req: Req, onTimeout: () => Res, onError: (m: string) => Res): Promise<Res> {
		if (!this.worker) this.spawn();
		try {
			await this.ready;
		} catch (e: any) {
			return onError(String(e?.message ?? e));
		}
		const w = this.worker!;
		const id = ++this.seq;
		return new Promise<Res>((resolve) => {
			const timer = setTimeout(() => {
				w.removeEventListener('message', on);
				this.kill();
				resolve(onTimeout());
			}, RUN_TIMEOUT_MS);
			const on = (e: MessageEvent) => {
				if (e.data?.type === 'result' && e.data.id === id) {
					clearTimeout(timer);
					w.removeEventListener('message', on);
					resolve(e.data.result as Res);
				}
			};
			w.addEventListener('message', on);
			w.postMessage({ ...req, id });
		});
	}
}

const python = new Runner<{ code: string; tests: PyTest[] }, PyResult>(() => new PythonWorker(), 'python');
const sql = new Runner<{ seed: string; query: string; expected: unknown[]; orderSensitive: boolean }, SqlResult>(() => new SqlWorker(), 'sql');

export const warmPython = () => python.warm();
export const warmSql = () => sql.warm();

export const execPython = (code: string, tests: PyTest[]) =>
	python.run(
		{ code, tests },
		() => ({ all_passed: false, results: [], error_category: 'timeout', detail: `Execution exceeded ${RUN_TIMEOUT_MS / 1000}s (possible infinite loop).` }),
		(m) => ({ all_passed: false, results: [], error_category: 'engine_error', detail: m })
	);

export const execSql = (seed: string, query: string, expected: unknown[], orderSensitive: boolean) =>
	sql.run(
		{ seed, query, expected, orderSensitive },
		() => ({ all_passed: false, rows: [], error_category: 'timeout', detail: `Query exceeded ${RUN_TIMEOUT_MS / 1000}s.` }),
		(m) => ({ all_passed: false, rows: [], error_category: 'engine_error', detail: m })
	);

const drills = new Runner<{ drillId: string; code: string }, DrillResult>(() => new DrillsWorker(), 'drills');
export const warmDrills = () => drills.warm();
export const execDrill = (drillId: string, code: string) =>
	drills.run(
		{ drillId, code },
		() => ({ all_passed: false, results: [], error_category: 'timeout', detail: 'Timed out — is there an infinite loop? (The drill was stopped.)' }),
		(m) => ({ all_passed: false, results: [], error_category: 'engine_error', detail: m })
	);
