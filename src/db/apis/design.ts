import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');

// APIs in practice, part 3: design choices that keep Cardify Lite's API safe to call and safe to depend on, and an honest list of its gaps.
// Every call number (15, 16, 24, 31, 32, 33 ...) refers to the live run recorded for this section; code facts come from backend/src,
// admin/src/App.tsx, sdk/src/loader.ts and backend/test/app.test.ts of the project.

export const topics: DbTopic[] = [
	// ───────────────────────── Idempotent saves ─────────────────────────
	{
		id: 'ap-idempotent-save',
		title: 'Idempotent saves and one request per burst',
		level: 'mid',
		summary: 'See why replacing a whole resource with PUT is safe to repeat, how an upsert and a debounce keep the API calm, and why the store sits behind one interface.',
		scenes: ['ap-put-twice', 'ap-debounce-one-put', 'ap-repo-interface'],
		notes: md(
			'**What the code does.** The admin saves settings with `PUT /cardify/admin/:merchantId/settings`. The body is the whole settings object (enabled, the design and the options), not a patch. The server validates it, then the repo saves it as an upsert: `onDuplicateKeyUpdate` inserts the merchant\'s row or updates it if it exists, in one statement.',
			'',
			'**What the real runs showed.** Call 15 saved an overlay design and returned 200 with `"version":1795534284883`. Call 16 sent the identical body again: 200, the same settings, and `"version":1795534284949`, 66 ms later. The state is the same; only the stamp moved. That is idempotent: doing it twice leaves what doing it once would.',
			'',
			'**Why it matters.** A client can retry a PUT after a timeout without asking whether the first attempt landed. A POST that creates something, such as an order, would create a second one, so it needs an idempotency key that lets the server recognise the repeat.',
			'',
			'**Fewer requests too.** In the browser run, switching Cardify on, picking Editorial and unticking Product badge produced one PUT, not three. The admin restarts a 500 ms timer on every change (`admin/src/App.tsx`) and sends only when it stays quiet, and the status pill says Saving at once so the wait does not look like a hang. A later accent-colour change sent its own PUT about half a second after it.',
			'',
			'**One interface, two stores.** The routes talk to `SettingsRepo` (`get` and `save`). `MemorySettingsRepo` keeps a Map and is used by tests and the local demo; `KyselySettingsRepo` writes MySQL. With no `DATABASE_URL` the server prints a warning and uses memory, so settings reset on restart.',
			'',
			'**Trade-off.** Replacing the whole resource is simple and safe to repeat, but two admins saving at once means the last write wins: the save carries no version check.'
		),
		try: [
			{
				label: 'An idempotent upsert and a debounce',
				code: md(
					'// A store like SettingsRepo: save is an upsert keyed by merchant id.',
					'const rows = new Map();',
					'let clock = 1000;',
					'function save(id, settings) {',
					'  const stored = { settings: { ...settings }, updatedAt: ++clock };',
					'  rows.set(id, stored); // insert the row, or replace it: one step either way',
					'  return { ...stored.settings, version: stored.updatedAt };',
					'}',
					"const body = { enabled: true, design: 'overlay', radius: 12 };",
					"const a = save('demostore', body);",
					"const b = save('demostore', body);",
					'const same = (x, y) => JSON.stringify({ ...x, version: 0 }) === JSON.stringify({ ...y, version: 0 });',
					"console.log('same settings after the repeat?', same(a, b));",
					"console.log('rows stored:', rows.size, '| version', a.version, '->', b.version);",
					'',
					'// Debounce: every change restarts a 500 ms timer, and only the last one sends.',
					'function debounced(send, ms) {',
					'  let t;',
					'  return (value) => {',
					'    clearTimeout(t);',
					'    t = setTimeout(() => send(value), ms);',
					'  };',
					'}',
					'const sent = [];',
					"const autosave = debounced((s) => { sent.push(s); console.log('PUT', JSON.stringify(s)); }, 500);",
					'autosave({ enabled: true });',
					"autosave({ enabled: true, design: 'editorial' });",
					"autosave({ enabled: true, design: 'editorial', showBadge: false });",
					'await new Promise((r) => setTimeout(r, 600));',
					"console.log('edits: 3, PUT requests:', sent.length);"
				)
			}
		]
	},

	// ───────────────────────── Fail-safe clients ─────────────────────────
	{
		id: 'ap-fail-safe-clients',
		title: 'Fail-safe clients and safe defaults',
		level: 'advanced',
		summary: 'Understand how a script on someone else\'s page can fail without breaking it, why unknown ids get defaults, and what the silence costs you.',
		scenes: ['ap-loader-failsafe', 'ap-failsafe-shots', 'ap-defaults-not-404'],
		notes: md(
			'**The rule.** The loader is a guest on someone else\'s page, so its first duty is to do no harm. `sdk/src/loader.ts` is built so every failure ends the same way: the store\'s own cards stay as they were.',
			'',
			'**What it does.** It runs `refresh()` on page load and again whenever the tab regains focus or becomes visible; there is no timer. It fetches the public config with `cache: "no-store"` and sends no credentials. If the reply is not OK it returns. If anything throws, it is caught and written as a console warning. It loads the widget bundle only when the config says Cardify is on.',
			'',
			'**Failure cases.** Backend down: the fetch throws and nothing changes. Bundle blocked: the stored promise is reset to null, so the next refresh tries again. Config turned off after being on: the loader asks the widget to stop and the native cards return, because Cardify hides the native card and never removes it. The "seen" fingerprint (`version:enabled`) is saved only after success, so a failed load is retried and an unchanged config does no work.',
			'',
			'**Defaults, not errors, on the server.** A valid merchant id that was never saved gets 200, the default settings and `version: 0` (call 36); a malformed id gets 400. In the repo, a stored row that no longer validates, for example after a design was retired, reads as never configured instead of crashing the fetch. There is no 404 status to probe ids with, though version 0 against a timestamp still shows whether a merchant saved settings. That is fine for a config every storefront must read anyway.',
			'',
			'**The cost.** A failure that never reaches the shopper also never reaches the team unless it is recorded. The loader writes `console.warn("[cardify]", err)`; watching the API itself (the request log and `/health`) is the other half.'
		),
		try: [
			{
				label: 'A loader that fails safe, with a fingerprint',
				code: md(
					"// A loader-like refresh: on any failure the page keeps its native cards.",
					"const page = { cards: 'native' };",
					"let seen = '';",
					'let widgetPromise = null;',
					'const loadWidget = (blocked) =>',
					'  (widgetPromise ??= (blocked',
					"    ? Promise.reject(new Error('bundle blocked'))",
					"    : Promise.resolve({ apply: () => (page.cards = 'cardify'), stop: () => (page.cards = 'native') })",
					'  ).catch((e) => { widgetPromise = null; throw e; }));',
					'',
					'async function refresh(fetchConfig, blocked = false) {',
					'  try {',
					'    const res = await fetchConfig();',
					"    if (!res.ok) return 'ignored: status ' + res.status;",
					'    const cfg = res.body;',
					"    const fingerprint = cfg.version + ':' + cfg.enabled;",
					"    if (fingerprint === seen) return 'unchanged, no work done';",
					'    if (cfg.enabled) (await loadWidget(blocked)).apply();',
					'    else if (widgetPromise) (await widgetPromise).stop();',
					'    seen = fingerprint; // only after success, so a failure is retried',
					"    return 'applied ' + fingerprint;",
					'  } catch (err) {',
					"    return 'warned: ' + err.message;",
					'  }',
					'}',
					'const on = { ok: true, body: { version: 5, enabled: true } };',
					"const show = async (label, run) => console.log(label.padEnd(22), (await run()).padEnd(26), '| cards:', page.cards);",
					"await show('backend down', () => refresh(async () => { throw new Error('backend down'); }));",
					"await show('reply is 503', () => refresh(async () => ({ ok: false, status: 503 })));",
					"await show('bundle blocked', () => refresh(async () => on, true));",
					"await show('next focus, retry', () => refresh(async () => on));",
					"await show('same config again', () => refresh(async () => on));",
					"await show('switched off', () => refresh(async () => ({ ok: true, body: { version: 6, enabled: false } })));"
				)
			}
		]
	},

	// ───────────────────────── Testing and operations ─────────────────────────
	{
		id: 'ap-testing-and-ops',
		title: 'Tests, logs and running it',
		level: 'mid',
		summary: 'Learn how the API\'s rules are checked without a port, what its log does and does not record, and what happens at start and stop.',
		scenes: ['ap-inject-tests', 'ap-logs-and-boot'],
		notes: md(
			'**Tests without a port.** `backend/test/app.test.ts` uses vitest and Fastify\'s `app.inject`. `buildApp` is called with a memory repo and a fixed test key; `inject` sends a fake request straight into the app and returns the response, so there is no port to clash with, no database and no network.',
			'',
			'**What they cover:** the public config defaults and their headers (CORS `*`, `no-store`), a 400 for a malformed merchant id, a 401 for no key, a wrong key and a wrong-length key, saving settings and reading them back through the public route, 400 for an unknown design and an out-of-range radius, the CORS allow-list (204 with the origin for `http://localhost:5173`, no CORS header for `https://evil.example`), and start-up refusing to build without an admin key. They do not cover rate limiting, security headers or the MySQL repo, which is worth knowing before you lean on them.',
			'',
			'**Seeing it run.** `/health` returns `{"ok":true}`. With logging on, Fastify writes each request as JSON with a request id: method, URL, host and the caller\'s address, then a second line with the status code and the response time. Request headers are not logged, so a key sent in `x-admin-key` never appears. It did appear once in the run, because call 33 put the key in the query string and the URL is logged. Keep secrets out of URLs.',
			'',
			'**Start and stop.** At boot the table is created with `CREATE TABLE IF NOT EXISTS`, so it is safe on every start. On SIGINT or SIGTERM the server closes the app and the database before exiting. With no `DATABASE_URL` it skips the database and keeps settings in memory, so a developer starts it with one command.'
		),
		try: [
			{
				label: 'A mini inject-style test of a handler',
				code: md(
					'// A tiny version of app.inject: call the handler directly with a fake request, no port.',
					"const KEY = 'test-admin-key';",
					'// Same shape as the real keyMatches: check the length first, then compare every character.',
					'function keyMatches(provided, expected) {',
					"  if (typeof provided !== 'string' || provided.length !== expected.length) return false;",
					'  let diff = 0;',
					'  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);',
					'  return diff === 0;',
					'}',
					'function handle(req) {',
					"  if (!keyMatches(req.headers['x-admin-key'], KEY)) return { status: 401, body: { error: 'invalid or missing x-admin-key' } };",
					"  if (!/^[a-z0-9]{6,32}$/.test(req.merchantId)) return { status: 400, body: { error: 'invalid merchant id' } };",
					'  return { status: 200, body: { ok: true } };',
					'}',
					"const inject = (req) => handle({ headers: {}, merchantId: 'demostore', ...req });",
					'const cases = [',
					"  ['401 without a key', inject({}), 401],",
					"  ['401 with a wrong-length key', inject({ headers: { 'x-admin-key': 'x' } }), 401],",
					"  ['400 for a bad merchant id', inject({ headers: { 'x-admin-key': KEY }, merchantId: 'BAD!' }), 400],",
					"  ['200 with the right key', inject({ headers: { 'x-admin-key': KEY } }), 200]",
					'];',
					'let bad = 0;',
					'for (const [name, res, want] of cases) {',
					'  const pass = res.status === want;',
					'  if (!pass) bad++;',
					"  console.log((pass ? 'ok   ' : 'MISS ') + name + ' -> ' + res.status);",
					'}',
					"console.log(bad ? bad + ' not as expected' : 'all passed');"
				)
			}
		]
	},

	// ───────────────────────── Gaps and next steps ─────────────────────────
	{
		id: 'ap-gaps-and-next',
		title: 'The honest review: gaps and what to fix first',
		level: 'advanced',
		summary: 'List the gaps the real runs exposed, put them in a sensible fix order, and see what a safer admin login would look like.',
		scenes: ['ap-gap-review', 'ap-fix-order', 'ap-safer-admin-login'],
		notes: md(
			'**A review needs evidence.** The runs found real strengths (fail-closed config, a constant-time key check, per-path CORS, one shared schema) and real gaps. Each gap points at a call or a file.',
			'',
			'- **One shared admin key** for everyone. The README lists per-merchant admin auth as not included: no user identity, no audit trail of who changed what, no rotation story.',
			'- **The key lives in `localStorage`** as plain text (`cardify.key`). A password field only masks it on screen; any script on that page can read it.',
			'- **No rate limit:** 60 wrong keys in a row all got 401 (call 31), with no delay.',
			'- **No security headers:** all six checked were absent (call 32).',
			'- **Two error shapes:** an `error` field from the app, and `statusCode`, `code`, `error` and `message` from the framework (calls 19, 20, 25, 30).',
			'- **Small contract slips:** 404 instead of 405 for a wrong method (calls 26, 27), and bundles sent with `public, max-age=0` although the source asks for `no-cache` (call 24).',
			'- **A secret in a URL was logged** (call 33).',
			'',
			'**Fix order.** Cheapest risk first: a rate limit and a long random key, then security headers including a Content-Security-Policy. Then the structural change: replace the shared key with a real sign-in (OpenID Connect, or a password plus a second factor) that gives the browser only an HttpOnly session cookie, behind a small admin server that keeps any API credential to itself, with a role and a name on every change. Last, tidy the contract: one error shape, 405, the intended cache header.',
			'',
			'The Auth and tokens section covers each piece: token storage, cookies, CSRF and XSS, OAuth and OpenID Connect, API keys and authorization.'
		),
		try: [
			{
				label: 'A gap checklist scorer',
				code: md(
					"// Score a response and a burst against a short hardening checklist (the headers and counts of calls 31 and 32).",
					"const wanted = ['strict-transport-security', 'x-content-type-options', 'x-frame-options', 'content-security-policy', 'referrer-policy', 'permissions-policy'];",
					"const adminResponse = { 'content-type': 'application/json; charset=utf-8', 'content-length': '253' };",
					'const have = Object.keys(adminResponse).map((h) => h.toLowerCase());',
					'const missing = wanted.filter((h) => !have.includes(h));',
					'',
					'const burst = Array(60).fill(401); // 60 wrong keys, as in call 31',
					'const limited = burst.filter((s) => s === 429).length;',
					'',
					'const checks = [',
					"  { name: 'rate limit answers 429', pass: limited > 0, fix: 'add a rate limit and lockout' },",
					"  { name: 'security headers present', pass: missing.length === 0, fix: 'add ' + missing.join(', ') },",
					"  { name: 'one error shape', pass: false, fix: 'wrap framework errors in the app shape' }",
					'];',
					"console.log('headers present:', wanted.length - missing.length, 'of', wanted.length);",
					"console.log('60 wrong keys ->', limited ? limited + ' were 429' : 'no 429 at all');",
					"for (const c of checks) console.log((c.pass ? 'ok    ' : 'TODO  ') + c.name + (c.pass ? '' : ' -> ' + c.fix));",
					"console.log('score:', checks.filter((c) => c.pass).length + ' / ' + checks.length);"
				)
			}
		]
	}
];

// ───────────────────────── Questions ─────────────────────────
const t = (topic: string) => builder('AP', topic);

// ap-idempotent-save
const ids = t('ap-idempotent-save');

ids.add('basic', 'idempotent',
	'The admin sends the same PUT with identical settings twice (calls 15 and 16). What differs between the two 200 answers?',
	'Only the version stamp; the settings are the same',
	['The settings themselves, because the second save adds to the first one',
	 'Nothing at all, since the server quietly ignores a PUT it has already seen',
	 'The status code, which becomes 409 Conflict for a duplicate request'],
	'The second PUT replaced the row with the same values, so the settings match and only the version (the time of the save) moved, by 66 ms. The server does not ignore it, does not merge it, and does not answer 409.');

ids.add('mid', 'retry',
	'A PUT times out and the client cannot tell whether it landed. What is the safe move?',
	'Send it again, because repeating a PUT leaves the same state',
	['Send a POST first, to find out what the server did with the PUT',
	 'Never retry, and ask the user to reload the page and start over',
	 'Wait a full day so the first request is certainly finished'],
	'PUT replaces the whole resource, so a repeat lands on the same state. Switching to POST would create the risk the PUT avoids, and refusing to retry or waiting a day only leaves the user stuck.');

ids.add('mid', 'upsert',
	'Why does the repo save with onDuplicateKeyUpdate?',
	'One statement inserts a new merchant row or updates the existing one',
	['It lets two admins edit the same row at once without any conflict ever',
	 'It keeps a full history of every earlier version of the settings row',
	 'It encrypts each row with a per-merchant key as it is written to MySQL'],
	'An upsert covers both cases, a merchant who has never saved and one who has, in a single statement. It does not merge concurrent edits (the last write wins), keep history or encrypt anything.');

ids.add('mid', 'debounce',
	'The browser run switched Cardify on, picked Editorial and unticked Product badge, yet the log shows one PUT. What explains it?',
	'Each change restarts a 500 ms timer, and only the last timer fires',
	['The server merges requests that arrive close together into a single save',
	 'The browser refuses a second request to the same URL within a second',
	 'The PUT is only sent when the user presses a Save button at the bottom'],
	'The admin autosaves with a debounce: every change clears the old timer and starts a new one, so a quick burst sends one request with the final settings. The server does not merge, the browser does not block, and there is no Save button.');

ids.add('advanced', 'post-vs-put',
	'Why would creating an order with POST need an idempotency key when this PUT does not?',
	'Repeating the POST can create a second order; repeating the PUT lands on the same state',
	['A POST body is much larger than a PUT body, so sending it twice wastes bandwidth',
	 'Idempotency keys are only needed when the request travels over HTTPS',
	 'PUT requests are never retried by clients, so they cannot be repeated'],
	'The point is the effect of a repeat. A PUT that replaces a resource ends in the same state either way, while a POST that creates something can create it again. An idempotency key lets the server recognise the repeat and return the first result.');

// ap-fail-safe-clients
const fs = t('ap-fail-safe-clients');

fs.add('basic', 'backend-down',
	'The backend is down when a storefront page loads. What do shoppers see?',
	'The store\'s own native cards, exactly as before',
	['An error banner drawn by the loader across the top of the product grid',
	 'Blank card slots while the loader keeps waiting for the backend to return',
	 'The last Cardify design that the merchant chose before the outage began'],
	'The config fetch throws, the loader catches it and writes a console warning, and nothing on the page is touched. The native cards stay, so shoppers notice nothing.');

fs.add('mid', 'retry-bundle',
	'The widget bundle is blocked, for example by an ad blocker. What does the loader do with its stored promise?',
	'Resets it to null, so the next refresh tries again',
	['Keeps the rejected promise, so it never tries to load the bundle again',
	 'Switches to polling the backend every second until the bundle loads',
	 'Reloads the whole page repeatedly until the bundle finally loads'],
	'A failed import would otherwise be remembered forever. Resetting it to null lets the next focus or visibility change retry, and there is no polling and no page reload involved.');

fs.add('mid', 'fingerprint',
	'When does the loader record a config fingerprint (version and enabled) as seen?',
	'Only after the config was applied successfully',
	['As soon as the response arrives, before the config is applied',
	 'Only when the config says enabled is false, to remember it was off',
	 'Every five seconds, from a timer that runs while the tab is open'],
	'Saving it after success means a failed load leaves the old fingerprint, so the next refresh tries again. An unchanged fingerprint lets the loader skip work. It is not tied to enabled being false, and there is no timer.');

fs.add('advanced', 'defaults',
	'An unknown but valid merchant id gets 200 with defaults and version 0. What does that choice achieve, and what does it not?',
	'No 404 status to probe, yet version 0 against a timestamp still shows whether anything was saved',
	['It hides completely whether a merchant has saved settings, since every reply looks identical',
	 'It lets anyone overwrite the settings for that id without presenting any key',
	 'It makes the config route require the admin key, so storefronts must authenticate'],
	'The status code no longer separates known from unknown ids, and the loader always has a config to read. The version field still differs (0 against a timestamp), which is acceptable because the config is public by design. Writing still needs the key.');

fs.add('advanced', 'silent',
	'What is the real cost of a loader that fails silently for shoppers?',
	'Nobody notices a broken backend unless it is logged or monitored',
	['Shoppers see half-broken pages while the loader tries to recover from it',
	 'The host store\'s own cards get removed and have to be restored by hand',
	 'The loader retries without limit and floods the backend with new requests'],
	'Failing safe protects the page, but it also hides the failure from the people who could fix it. That is why the loader writes a console warning and the API has a request log and a health check. The page is not broken and the native cards are never removed.');

// ap-testing-and-ops
const ops = t('ap-testing-and-ops');

ops.add('basic', 'inject',
	'What does app.inject do in the Cardify tests?',
	'Sends a fake request straight into the app without opening a port',
	['Starts the server on port 4100 for each test and shuts it down after',
	 'Adds the admin key to every request automatically so tests need not',
	 'Replays recorded production traffic against the app to compare answers'],
	'inject calls the app\'s request handling directly and returns the response object, so tests need no port, no network and no running server. It does not add a key for you, and nothing is replayed.');

ops.add('mid', 'coverage',
	'Which rule does the test file actually check?',
	'A 401 for no key, a wrong key and a wrong-length key',
	['That 60 wrong keys in a row eventually get a 429 from the server',
	 'That every response carries the standard set of security headers',
	 'That the MySQL repo survives a failure of its connection pool'],
	'The tests cover the three 401 cases, validation, the CORS allow-list, saving and reading back, and the refusal to build without a key. Rate limiting, security headers and the MySQL repo are not in the file, so passing tests say nothing about them.');

ops.add('mid', 'log-key',
	'In the real run, where did the admin key appear in the server log?',
	'Only in the URL of the call that put the key in the query string',
	['In every request line, as the x-admin-key header the admin sends',
	 'In the response lines of each 401 answer, to explain the refusal',
	 'Nowhere at all, because Fastify redacts query strings in its logs'],
	'Request headers are not logged, so the key sent as a header never showed. Call 33 sent it in the query string, the URL was logged, and the secret was written out. Fastify does not redact query strings.');

ops.add('mid', 'migrate',
	'The table is created with CREATE TABLE IF NOT EXISTS at every boot. Why is that safe?',
	'Running it again changes nothing when the table already exists',
	['It drops and recreates the table, so that every start is a clean one',
	 'It only runs when a person confirms the change in the terminal',
	 'It copies the whole table to a backup before each start of the server'],
	'IF NOT EXISTS makes the statement idempotent: the first boot creates the table, and every later boot finds it and does nothing. It never drops data, asks for confirmation or makes backups.');

ops.add('advanced', 'shutdown',
	'On SIGINT or SIGTERM the server closes the app and the database before it exits. Why?',
	'So open requests and database connections are closed cleanly',
	['So the admin key is wiped from memory before the process ends',
	 'So the process can restart itself with a fresh copy of the code',
	 'So the in-memory settings are written to disk for the next start'],
	'A clean stop lets the server finish and close what is open instead of dropping connections mid-way. It does not wipe keys, restart anything, or persist the memory repo, which loses its settings on exit.');

// ap-gaps-and-next
const gaps = t('ap-gaps-and-next');

gaps.add('basic', 'localstorage',
	'The admin keeps the key in localStorage. What is the main risk?',
	'Any script running on the admin page can read it',
	['It is sent to the server twice with every single call it makes',
	 'It expires as soon as the browser tab is closed by the user',
	 'It shows up in the address bar for anyone looking over a shoulder'],
	'localStorage is readable by every script on that origin, so one injected script can copy the key. The password-type field only masks it visually. The storage persists across tabs and restarts, and it is not part of the URL.');

gaps.add('mid', 'rate-limit',
	'Sixty wrong keys in a row all got 401 (call 31). What does that show?',
	'Nothing slows or stops guessing: there is no rate limit',
	['The key is hashed, so each guess costs the server noticeable time',
	 'The server locks the account after ten tries and sends an alert',
	 'CORS is blocking the requests before they reach the key check'],
	'A constant 401 with no delay and no 429 means guesses are not limited. Only the key\'s length protects it. There is no hashing delay, no lockout, and CORS is not involved because the calls came from curl.');

gaps.add('mid', 'headers',
	'Call 32 looked for six security headers on an authenticated admin response. How many were present?',
	'None of the six',
	['All six, each with its recommended value',
	 'Only content-security-policy, set to a strict value',
	 'Only strict-transport-security, with a long max-age'],
	'The response carried just content-type and content-length. Strict-transport-security, x-content-type-options, x-frame-options, content-security-policy, referrer-policy and permissions-policy were all absent.');

gaps.add('advanced', 'fix-order',
	'Why does the fix list put a rate limit before a full admin sign-in?',
	'It is cheap and closes the easiest attack while the bigger change is built',
	['A sign-in cannot work at all until a rate limit has first been put in place',
	 'A rate limit also removes the key from localStorage as a useful side effect',
	 'A rate limit makes every error use the same shape on all of the routes'],
	'Order by cheapest risk reduction first: a rate limit and a long key are small changes that block guessing now, while a real sign-in is a larger project with the biggest payoff. The rate limit does not depend on the sign-in, nor fix storage or error shapes.');

gaps.add('advanced', 'safer-login',
	'In the safer admin design, what does the browser hold?',
	'Only a session cookie that scripts cannot read (HttpOnly)',
	['The API key, kept in sessionStorage so it ends with the tab',
	 'A long-lived token kept in localStorage for the next visit',
	 'The key, encrypted with a key derived from the user\'s password'],
	'The aim is to keep credentials out of anything a script can read. The browser gets one HttpOnly cookie for the session, and a small admin server keeps any API credential. Storage in sessionStorage or localStorage stays readable by scripts.');

export const banks: { out: Question[] }[] = [ids, fs, ops, gaps];
