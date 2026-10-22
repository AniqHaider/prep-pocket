// The playground's OWN PostgreSQL (PGlite) instance: separate from the Backend lab's worker, so nothing here can touch
// Dojo progress or Dojo schemas. Holds the sample shop; "reset" rebuilds it.
import { PGlite } from '@electric-sql/pglite';
import { SHOP_SQL } from './shop.sql';
import { PARSERS, seedStatements } from '../../dojo/engine/sql-core';

let db: PGlite;

async function seed() {
	await db.exec('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; SET search_path TO public;');
	for (const stmt of seedStatements(SHOP_SQL)) await db.exec(stmt);
}

const ready = (async () => {
	db = new PGlite();
	await db.waitReady;
	await seed();
})();

ready.then(
	() => postMessage({ type: 'ready' }),
	(e) => postMessage({ type: 'init-error', message: String(e?.message ?? e) })
);

self.onmessage = async (e: MessageEvent) => {
	const { id, kind, sql } = e.data as { id: number; kind: 'run' | 'reset'; sql?: string };
	try {
		await ready;
		if (kind === 'reset') {
			await seed();
			postMessage({ type: 'done', id, ok: true });
			return;
		}
		const t0 = performance.now();
		const res = await db.exec(sql ?? '', { parsers: PARSERS });
		const ms = Math.round(performance.now() - t0);
		const last = res[res.length - 1];
		const columns = last?.fields.map((f: { name: string }) => f.name) ?? [];
		postMessage({ type: 'done', id, ok: true, columns, rows: columns.length ? last.rows : [], ms, statements: res.length });
	} catch (err: any) {
		postMessage({ type: 'done', id, ok: false, error: String(err?.message ?? err).trim() });
	}
};
