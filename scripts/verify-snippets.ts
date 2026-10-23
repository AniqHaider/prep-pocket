// Runs every topic's "Try it" snippet against the real playground engines (PGlite for PostgreSQL, mingo for MongoDB, the JS runner for
// the Computer science / AI / JavaScript / TypeScript sections; a section with no topics yet simply has nothing to run).
// A snippet must run without error, unless its label says it fails on purpose ("violate", "error", "fails").
// Run: bun scripts/verify-snippets.ts
import { PGlite } from '@electric-sql/pglite';
import { SHOP_SQL } from '../src/db/playground/shop.sql';
import { shopCollections } from '../src/db/playground/shop.mongo';
import { runMongo } from '../src/db/playground/mongoEval';
import { seedStatements } from '../src/dojo/engine/sql-core';
import { postgres } from '../src/db/postgres';
import { mongodb } from '../src/db/mongodb';
import { cs } from '../src/db/cs';
import { ai } from '../src/db/ai';
import { aws } from '../src/db/aws';
import { javascript } from '../src/db/javascript';
import { typescript } from '../src/db/typescript';
import { runScript } from '../src/db/playground/jsRun';

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

// JavaScript / TypeScript snippets run through the same pure runner the playground's worker uses. A snippet must finish without an
// uncaught error or a "stopped" note, unless its label says it fails on purpose.
for (const eng of [cs, ai, aws, javascript, typescript]) {
	for (const t of eng.topics) {
		for (const s of t.try ?? []) {
			total++;
			const r = await runScript(s.code, { ts: eng.id === 'typescript', timeoutMs: 3000 });
			const stopped = r.notes.find((n) => n.startsWith('Stopped'));
			const err = r.error?.message ?? stopped ?? '';
			// JS/TS snippets are meant to run cleanly; one that throws on purpose says so in its label with "(throws)"
			const bad = /\(throws\)/i.test(s.label) ? !r.error : !!err;
			if (bad) fails++;
			console.log(`${bad ? '✗' : '✓'} js    ${eng.id} ${t.id} / ${s.label}${err ? '  -> ' + err : `  (${r.lines.length} lines, ${r.ms} ms)`}`);
		}
	}
}
console.log(`${total} snippets, ${fails} problems`);
process.exit(fails ? 1 : 0);
