// Optional web lookup for the assistant. The app does the searching (a small model cannot browse) and hands the
// top results to the model as plain text. Off by default: a question leaves the phone only when the learner has
// picked a provider in Settings → Web lookup, and only for the questions that need it.
import { STOP } from './knowledge';

export type WebProvider = 'off' | 'wikipedia' | 'tavily' | 'serper';

export interface WebSettings {
	provider: WebProvider;
	/** Tavily or Serper API key. Stored only on this phone and sent only to that provider. */
	key: string;
	/** Search on every question (true) or only when Preppy's own notes have nothing relevant (false). */
	always: boolean;
}

export interface WebHit {
	title: string;
	url: string;
	snippet: string;
}

const KEY = 'prep-pocket:web-lookup:v1';
export const DEFAULT_WEB: WebSettings = { provider: 'off', key: '', always: false };

export function loadWebSettings(): WebSettings {
	try {
		const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
		if (raw && typeof raw === 'object') return { ...DEFAULT_WEB, ...raw };
	} catch {
		/* ignore */
	}
	return { ...DEFAULT_WEB };
}

export function saveWebSettings(s: WebSettings) {
	try {
		localStorage.setItem(KEY, JSON.stringify(s));
	} catch {
		/* ignore */
	}
}

/** True when a provider is chosen and has what it needs (Wikipedia needs no key). */
export const webReady = (s: WebSettings) => s.provider === 'wikipedia' || ((s.provider === 'tavily' || s.provider === 'serper') && s.key.trim().length > 0);

export const WEB_PROVIDERS: { id: WebProvider; label: string; note: string; needsKey: boolean }[] = [
	{ id: 'off', label: 'Off', note: 'Nothing is ever sent from the phone. Answers use the model and Preppy’s own notes.', needsKey: false },
	{ id: 'wikipedia', label: 'Wikipedia', note: 'No account or key. Good for definitions and concepts; will not know every library or version.', needsKey: false },
	{ id: 'tavily', label: 'Tavily', note: 'General web search built for AI apps. Needs an API key from tavily.com (the free plan has a monthly allowance).', needsKey: true },
	{ id: 'serper', label: 'Serper (Google results)', note: 'Google search results through serper.dev. Needs an API key (new accounts get free queries).', needsKey: true }
];

/** The words of a question that carry meaning, for search engines that expect keywords. */
export function searchQuery(question: string): string {
	const words = (question.toLowerCase().match(/[a-z0-9+#.]+/g) ?? []).map((w) => w.replace(/^\.+|\.+$/g, '')).filter((w) => w && !STOP.has(w));
	const kept = words.slice(0, 10);
	// One or two bare words (an acronym like "MCP") are ambiguous on the open web.
	if (kept.length && kept.length <= 2) kept.push('software');
	return kept.join(' ') || question.slice(0, 120);
}

async function getJson(url: string, init: RequestInit, signal?: AbortSignal, timeoutMs = 9000): Promise<any> {
	const ctl = new AbortController();
	const stop = () => ctl.abort();
	signal?.addEventListener('abort', stop);
	const timer = setTimeout(stop, timeoutMs);
	try {
		const res = await fetch(url, { ...init, signal: ctl.signal });
		if (!res.ok) {
			let body = '';
			try {
				body = (await res.text()).slice(0, 160);
			} catch {
				/* ignore */
			}
			throw new Error(`${res.status} ${res.statusText} ${body}`.trim());
		}
		return await res.json();
	} catch (e: any) {
		if (signal?.aborted) throw e;
		if (e?.name === 'AbortError') throw new Error('The search took too long.');
		throw e;
	} finally {
		clearTimeout(timer);
		signal?.removeEventListener('abort', stop);
	}
}

const clean = (s: string, n: number) => {
	const t = s.replace(/\s+/g, ' ').trim();
	return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t;
};

async function wikipedia(q: string, signal?: AbortSignal): Promise<WebHit[]> {
	const url =
		'https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrlimit=3&prop=extracts|info&inprop=url&exintro=1&explaintext=1&exsentences=3&format=json&formatversion=2&origin=*&gsrsearch=' +
		encodeURIComponent(q);
	const d = await getJson(url, {}, signal);
	const pages: any[] = d?.query?.pages ?? [];
	// Wikipedia's search is full-text, so it returns loosely related pages for topics it has no article on (a search for
	// "WebTransport" lists browser engines). Keep a page only if its title or intro actually mentions a keyword.
	const keys = q.split(' ').filter((w) => w.length >= 3 && w !== 'software').map((w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w));
	return pages
		.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
		.filter((p) => p.extract && keys.some((k) => `${p.title} ${p.extract}`.toLowerCase().includes(k)))
		.map((p) => ({ title: String(p.title), url: String(p.fullurl), snippet: clean(String(p.extract), 420) }));
}

async function tavily(q: string, key: string, signal?: AbortSignal): Promise<WebHit[]> {
	const d = await getJson(
		'https://api.tavily.com/search',
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
			body: JSON.stringify({ query: q, max_results: 4, search_depth: 'basic', include_answer: false })
		},
		signal
	);
	return ((d?.results ?? []) as any[]).filter((r) => r.url && r.content).map((r) => ({ title: String(r.title ?? r.url), url: String(r.url), snippet: clean(String(r.content), 380) }));
}

async function serper(q: string, key: string, signal?: AbortSignal): Promise<WebHit[]> {
	const d = await getJson(
		'https://google.serper.dev/search',
		{ method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-KEY': key }, body: JSON.stringify({ q, num: 5 }) },
		signal
	);
	const out: WebHit[] = [];
	const box = d?.answerBox;
	if (box?.snippet || box?.answer) out.push({ title: String(box.title ?? 'Google answer'), url: String(box.link ?? ''), snippet: clean(String(box.answer ?? box.snippet), 380) });
	for (const r of (d?.organic ?? []) as any[]) if (r.link && r.snippet) out.push({ title: String(r.title ?? r.link), url: String(r.link), snippet: clean(String(r.snippet), 340) });
	return out.slice(0, 4);
}

/** Runs one search with the provider from Settings. Throws on network or key problems; the caller decides what to tell the learner. */
export async function webSearch(question: string, s: WebSettings, signal?: AbortSignal): Promise<WebHit[]> {
	if (!webReady(s)) return [];
	const q = searchQuery(question);
	const hits = s.provider === 'wikipedia' ? await wikipedia(q, signal) : s.provider === 'tavily' ? await tavily(q, s.key.trim(), signal) : await serper(q, s.key.trim(), signal);
	return hits.filter((h) => /^https?:\/\//.test(h.url) || !h.url);
}

/** True when it makes sense to try the network at all. */
export const isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false;

/** Words that signal the learner wants something newer than a model's training data. */
export const wantsFresh = (q: string) => /\b(latest|newest|recent|recently|new|current|currently|today|now|this year|20(2[4-9]|3\d)|release[ds]?|version|changelog|announced?|deprecated)\b/i.test(q);
