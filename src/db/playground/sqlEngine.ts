import SqlWorker from './sql.worker.ts?worker';

export interface SqlRun {
	columns: string[];
	rows: Record<string, unknown>[];
	ms: number;
	statements: number;
}

const TIMEOUT_MS = 5000;

/** Talks to the playground worker. A statement that runs past 5 s is stopped by restarting the worker (and the data resets). */
class SqlEngine {
	private w: Worker | null = null;
	private ready: Promise<void> | null = null;
	private seq = 0;
	private pending = new Map<number, (m: any) => void>();
	booted = false;

	private start() {
		const w = new SqlWorker();
		this.w = w;
		this.ready = new Promise<void>((resolve, reject) => {
			w.onmessage = (e: MessageEvent) => {
				const m = e.data;
				if (m.type === 'ready') { this.booted = true; resolve(); }
				else if (m.type === 'init-error') reject(new Error(m.message));
				else if (m.type === 'done') { this.pending.get(m.id)?.(m); this.pending.delete(m.id); }
			};
			w.onerror = (e) => reject(new Error(e.message || 'The PostgreSQL worker failed to start'));
		});
		return this.ready;
	}

	warm() { return this.ready ?? this.start(); }

	private async call(kind: 'run' | 'reset', sql?: string): Promise<any> {
		await this.warm();
		const id = ++this.seq;
		return new Promise((resolve) => {
			const timer = setTimeout(() => {
				this.pending.delete(id);
				this.w?.terminate();
				this.w = null; this.ready = null; this.booted = false;
				resolve({ ok: false, timeout: true });
			}, TIMEOUT_MS);
			this.pending.set(id, (m) => { clearTimeout(timer); resolve(m); });
			this.w!.postMessage({ id, kind, sql });
		});
	}

	async run(sql: string): Promise<SqlRun> {
		const m = await this.call('run', sql);
		if (m.timeout) throw new Error('That statement ran for more than 5 seconds, so I stopped it. The database was restarted and the sample data is back to its original state. Check for a missing join condition or an endless loop.');
		if (!m.ok) throw new Error(m.error);
		return { columns: m.columns, rows: m.rows, ms: m.ms, statements: m.statements };
	}

	async reset() {
		const m = await this.call('reset');
		if (!m.ok) throw new Error(m.error ?? 'Reset failed');
	}
}

export const sqlEngine = new SqlEngine();
