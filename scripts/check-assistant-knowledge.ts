// Checks that the assistant's notes lookup finds the right part of Preppy and stays quiet for generic chat.
// Run: bun scripts/check-assistant-knowledge.ts
import { searchKnowledge } from '../src/assistant/knowledge';

// [question, text the top results must mention (any, case-insensitive) or null when nothing should be found]
const cases: [string, string[] | null][] = [
	['What is MCP?', ['model context protocol']],
	['what is model context protocol', ['model context protocol']],
	['explain closures simply', ['closure']],
	['What is idempotency?', ['idempoten']],
	['How does autograd work in PyTorch?', ['autograd']],
	['difference between a process and a thread', ['thread']],
	['What is RAG?', ['retrieval']],
	['What is OpenSearch?', ['opensearch']],
	['difference between Elasticsearch and OpenSearch', ['elasticsearch']],
	['How many shards should an index have', ['shard']],
	['why three cluster manager nodes', ['cluster manager']],
	['How do database indexes speed up queries', ['index']],
	['What does the event loop do', ['event loop']],
	['Give me a hint', null],
	['Explain the concept behind this', null],
	['Why might the wrong options be tempting?', null],
	['hello', null]
];

let failed = 0;
const t0 = performance.now();
searchKnowledge('warm up');
const build = Math.round(performance.now() - t0);
for (const [q, want] of cases) {
	const t = performance.now();
	const r = searchKnowledge(q);
	const ms = (performance.now() - t).toFixed(1);
	const joined = r.hits.map((h) => h.label + ' ' + h.text).join('\n').toLowerCase();
	const ok = want === null ? r.hits.length === 0 : r.hits.length > 0 && want.some((w) => joined.includes(w));
	if (!ok) failed++;
	console.log(`${ok ? 'ok  ' : 'FAIL'} ${ms.padStart(5)}ms  ${q}`);
	for (const h of r.hits) console.log(`        ${h.score.toFixed(1).padStart(6)}  ${h.label}  (${h.text.length} chars)`);
}
console.log(`\nindex built in ${build} ms; ${failed ? failed + ' failed' : 'all passed'}`);
process.exit(failed ? 1 : 0);
