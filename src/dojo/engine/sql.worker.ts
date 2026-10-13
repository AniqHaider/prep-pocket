import { PGlite } from '@electric-sql/pglite';
import { runSql } from './sql-core';

const ready = (async () => {
	const db = new PGlite();
	await db.waitReady;
	return db;
})();

ready.then(
	() => postMessage({ type: 'ready' }),
	(e) => postMessage({ type: 'init-error', message: String(e?.message ?? e) })
);

self.onmessage = async (e: MessageEvent) => {
	const { id, seed, query, expected, orderSensitive } = e.data;
	try {
		const db = await ready;
		postMessage({ type: 'result', id, result: await runSql(db, seed, query, expected, orderSensitive) });
	} catch (err: any) {
		postMessage({ type: 'result', id, result: { all_passed: false, rows: [], error_category: 'sql_error', detail: String(err?.message ?? err) } });
	}
};
