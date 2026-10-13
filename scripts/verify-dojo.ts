// Runs every Backend Dojo exercise's reference_solution through the in-browser engines
// (Pyodide + PGlite) under Node. Each must PASS; also each starter must be gradeable (no crash).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPyodide } from 'pyodide';
import { PGlite } from '@electric-sql/pglite';
import { runPython, initPython } from '../src/dojo/engine/python-core';
import { runSql } from '../src/dojo/engine/sql-core';

const ROOT = fileURLToPath(new URL('../src/dojo/content', import.meta.url));
const SEEDS = fileURLToPath(new URL('../src/dojo/seeds', import.meta.url));
const exercises: any[] = [];
for (const ch of readdirSync(ROOT).sort()) {
	const dir = join(ROOT, ch, 'exercises');
	try {
		for (const f of readdirSync(dir).sort()) exercises.push(JSON.parse(readFileSync(join(dir, f), 'utf8')));
	} catch {}
}

const only = process.argv[2];
const py = await loadPyodide();
await initPython(py as any);
const db = new PGlite();
let pass = 0, fail = 0, skipped = 0;
const failures: string[] = [];

for (const ex of exercises) {
	if (only && !ex.id.includes(only)) continue;
	if (ex.type === 'quiz') {
		const ok = Number.isInteger(ex.correct_index) && ex.correct_index >= 0 && ex.correct_index < ex.options.length;
		ok ? pass++ : (fail++, failures.push(`${ex.id}: bad quiz correct_index`));
		continue;
	}
	const started = Date.now();
	if (ex.type === 'python') {
		const r = await Promise.race([
			runPython(py as any, ex.reference_solution, ex.tests),
			new Promise<any>((res) => setTimeout(() => res({ all_passed: false, detail: 'TIMEOUT 20s' }), 20000))
		]);
		r.all_passed ? pass++ : (fail++, failures.push(`${ex.id}: ${r.error_category} ${r.detail}`));
		// the starter must run without crashing the harness (it is allowed to fail the tests)
		const s = await runPython(py as any, ex.starter_code, ex.tests);
		if (s.all_passed) skipped++; // starter already passes (info only)
	} else if (ex.type === 'sql') {
		const seed = readFileSync(join(SEEDS, ex.schema_key + '.sql'), 'utf8');
		const r = await runSql(db, seed, ex.reference_solution, ex.expected_query_result ?? [], !!ex.order_sensitive);
		r.all_passed ? pass++ : (fail++, failures.push(`${ex.id}: ${r.error_category} ${(r.detail ?? '').slice(0, 300)}`));
	}
	if (Date.now() - started > 3000) console.log(`  slow: ${ex.id} ${Date.now() - started}ms`);
}
console.log(`\nPASS ${pass}  FAIL ${fail}  (starters that already pass: ${skipped})`);
for (const f of failures) console.log(' ✗', f);
process.exit(fail ? 1 : 0);
