// Runs every topic's "Try it" snippet against the real playground engines (PGlite for PostgreSQL, mingo for MongoDB).
// A snippet must run without error, unless its label says it fails on purpose ("violate", "error", "fails").
// Run: bun scripts/verify-snippets.ts
import { PGlite } from '@electric-sql/pglite';
import { SHOP_SQL } from '../src/db/playground/shop.sql';
import { shopCollections } from '../src/db/playground/shop.mongo';
import { runMongo } from '../src/db/playground/mongoEval';
import { seedStatements } from '../src/dojo/engine/sql-core';
import { postgres } from '../src/db/postgres';
import { mongodb } from '../src/db/mongodb';

let fails = 0, total = 0;
const expectsError = (label: string) => /violat|error|fail|reject/i.test(label);

const fresh = async () => {
	const db = new PGlite();
	await db.waitReady;
	for (const s of seedStatements(SHOP_SQL)) await db.exec(s);
	return db;
};

for (const t of postgres.topics) {
	for (const s of t.try ?? []) {
		total++;
		const db = await fresh(); // each snippet on a clean copy, as after "Reset data"
		let err = '';
		let rows = 0;
		try {
			const res = await db.exec(s.code);
			rows = res.at(-1)?.rows.length ?? 0;
		} catch (e: any) { err = String(e.message ?? e).split('\n')[0]; }
		const bad = expectsError(s.label) ? !err : !!err;
		if (bad) fails++;
		console.log(`${bad ? '✗' : '✓'} pg    ${t.id} / ${s.label}${err ? '  -> ' + err : `  (${rows} rows)`}`);
		await db.close();
	}
}

const data = shopCollections();
for (const t of mongodb.topics) {
	for (const s of t.try ?? []) {
		total++;
		let err = '', n = 0;
		try {
			const r = runMongo(s.code, data);
			n = r.kind === 'docs' ? r.docs.length : 1;
		} catch (e: any) { err = String(e.message ?? e).split('\n')[0]; }
		const bad = expectsError(s.label) ? !err : !!err;
		if (bad) fails++;
		console.log(`${bad ? '✗' : '✓'} mongo ${t.id} / ${s.label}${err ? '  -> ' + err : `  (${n} results)`}`);
	}
}
console.log(`${total} snippets, ${fails} problems`);
process.exit(fails ? 1 : 0);
