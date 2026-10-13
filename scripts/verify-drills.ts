// Reference solutions must pass every drill test; untouched stubs must fail.
import { readFileSync } from 'node:fs';
import { DRILLS } from '../src/drills/drills';
import { runDrill } from '../src/drills/drills-core';

const dir = new URL('../src/drills/', import.meta.url).pathname;
let bad = 0;
for (const d of DRILLS) {
	const ref = await runDrill(d, readFileSync(`${dir}ref/solutions/${d.file}.ts`, 'utf8'));
	const stub = await runDrill(d, readFileSync(`${dir}stubs/${d.file}.ts`, 'utf8'));
	const refOk = ref.all_passed;
	const stubFails = !stub.all_passed;
	if (!refOk || !stubFails) bad++;
	console.log(`${refOk && stubFails ? '✓' : '✗'} ${d.id.padEnd(12)} solution ${refOk ? 'passes' : 'FAILS: ' + ref.detail}  | stub ${stubFails ? 'fails (good)' : 'PASSES (bad)'}`);
}
process.exit(bad ? 1 : 0);
