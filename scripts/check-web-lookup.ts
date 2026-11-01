// Checks the assistant's web lookup: query building, the exact requests sent to Tavily and Serper (mocked, no key
// needed), the parsing of their replies, and a live Wikipedia search (skipped when offline).
// Run: bun scripts/check-web-lookup.ts
import { searchQuery, webReady, webSearch, wantsFresh, type WebSettings } from '../src/assistant/web';

let failed = 0;
const check = (name: string, ok: boolean, extra = '') => {
	if (!ok) failed++;
	console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${extra ? '  ' + extra : ''}`);
};

// --- query building
check('keywords drop filler words (two keywords get "software" added)', searchQuery('What is the difference between a process and a thread?') === 'process thread software', searchQuery('What is the difference between a process and a thread?'));
check('three or more keywords are left alone', searchQuery('how do postgres indexes speed up queries') === 'postgres indexes speed queries', searchQuery('how do postgres indexes speed up queries'));
check('a bare acronym gets "software"', searchQuery('What is MCP?') === 'mcp software', searchQuery('What is MCP?'));
check('long questions are capped at 10 keywords', searchQuery('how does postgres handle multiversion concurrency control vacuum autovacuum bloat indexes replication slots wal').split(' ').length <= 10);
check('wantsFresh spots recency words', wantsFresh('what is the latest React version') && wantsFresh('new in 2026') && !wantsFresh('explain closures'));

// --- readiness
const base: WebSettings = { provider: 'off', key: '', always: false };
check('off is not ready', !webReady(base));
check('wikipedia needs no key', webReady({ ...base, provider: 'wikipedia' }));
check('tavily needs a key', !webReady({ ...base, provider: 'tavily' }) && webReady({ ...base, provider: 'tavily', key: ' k ' }));

// --- mocked Tavily / Serper
const realFetch = globalThis.fetch;
let seen: { url: string; init: any } | null = null;
const mock = (body: unknown) => {
	globalThis.fetch = (async (url: any, init: any) => {
		seen = { url: String(url), init };
		return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
	}) as any;
};

mock({ results: [{ title: 'Model Context Protocol', url: 'https://modelcontextprotocol.io', content: 'MCP is an open protocol. '.repeat(40), score: 0.9 }, { title: 'No url', content: 'x' }] });
let hits = await webSearch('What is MCP?', { ...base, provider: 'tavily', key: 'tvly-test' });
check('tavily: POST to /search with a Bearer key', seen!.url === 'https://api.tavily.com/search' && seen!.init.method === 'POST' && seen!.init.headers.Authorization === 'Bearer tvly-test');
check('tavily: body has the keyword query and max_results', JSON.parse(seen!.init.body).query === 'mcp software' && JSON.parse(seen!.init.body).max_results === 4);
check('tavily: results parsed, entries without a url dropped, snippet trimmed', hits.length === 1 && hits[0].title === 'Model Context Protocol' && hits[0].snippet.length <= 400, `${hits.length} hit, ${hits[0]?.snippet.length} chars`);

mock({ answerBox: { title: 'MCP', answer: 'Model Context Protocol', link: 'https://example.com/a' }, organic: [{ title: 'Intro', link: 'https://modelcontextprotocol.io/intro', snippet: 'An open standard.' }, { title: 'Bad', link: 'javascript:alert(1)', snippet: 'x' }] });
hits = await webSearch('What is MCP?', { ...base, provider: 'serper', key: 'serper-test' });
check('serper: POST with X-API-KEY and q', seen!.url === 'https://google.serper.dev/search' && seen!.init.headers['X-API-KEY'] === 'serper-test' && JSON.parse(seen!.init.body).q === 'mcp software');
check('serper: answer box first, javascript: links dropped', hits.length === 2 && hits[0].snippet === 'Model Context Protocol' && hits.every((h) => /^https?:/.test(h.url)), hits.map((h) => h.title).join(' | '));

mock({ error: 'x' });
globalThis.fetch = (async () => new Response('{"detail":"Unauthorized"}', { status: 401, statusText: 'Unauthorized' })) as any;
let msg = '';
try {
	await webSearch('anything', { ...base, provider: 'tavily', key: 'bad' });
} catch (e: any) {
	msg = String(e?.message);
}
check('a bad key surfaces the HTTP error', msg.startsWith('401'), msg.slice(0, 60));
globalThis.fetch = realFetch;

// --- Wikipedia relevance filter (mocked)
mock({ query: { pages: [{ title: 'Gecko (software)', index: 1, fullurl: 'https://en.wikipedia.org/wiki/Gecko', extract: 'Gecko is a browser engine developed by Mozilla.' }, { title: 'WebTransport', index: 2, fullurl: 'https://en.wikipedia.org/wiki/WebTransport', extract: 'WebTransport is a web API.' }] } });
hits = await webSearch('Tell me about WebTransport', { ...base, provider: 'wikipedia' });
check('wikipedia: pages that never mention the keyword are dropped', hits.length === 1 && hits[0].title === 'WebTransport', hits.map((h) => h.title).join(' | '));
mock({ query: { pages: [{ title: 'Gecko (software)', index: 1, fullurl: 'https://en.wikipedia.org/wiki/Gecko', extract: 'Gecko is a browser engine developed by Mozilla.' }] } });
hits = await webSearch('Tell me about WebTransport', { ...base, provider: 'wikipedia' });
check('wikipedia: an unrelated-only result becomes "nothing found"', hits.length === 0);
globalThis.fetch = realFetch;

// --- live Wikipedia
try {
	const live = await webSearch('What is MCP?', { ...base, provider: 'wikipedia' });
	check('wikipedia (live): finds the Model Context Protocol page first', live[0]?.title === 'Model Context Protocol', live.map((h) => h.title).join(' | '));
	check('wikipedia (live): hits have a url and a snippet', live.every((h) => h.url.startsWith('https://en.wikipedia.org/') && h.snippet.length > 20));
	const none = await webSearch('Tell me about WebTransport', { ...base, provider: 'wikipedia' });
	check('wikipedia (live): an uncovered topic returns no unrelated pages', none.every((h) => /webtransport/i.test(h.title + h.snippet)), none.map((h) => h.title).join(' | ') || '(none)');
} catch (e: any) {
	console.log('skip wikipedia (live):', e?.message);
}

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
