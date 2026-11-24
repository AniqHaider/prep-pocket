import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');

// APIs in practice, part 2: the practices Cardify Lite's API follows and what each bought it.
// Every request, header and number comes from running Cardify Lite locally. The admin key is always shown as <ADMIN_API_KEY>.

export const topics: DbTopic[] = [
	{
		id: "ap-fail-closed-config",
		title: "Failing closed at boot",
		level: "mid",
		summary: "See why the backend refuses to start without an admin key, what the refusal looks like, and where the check still falls short.",
		scenes: ['ap-boot-check', 'ap-boot-refusal'],
		notes: md(
			"Cardify Lite's backend would rather not start than start open. `backend/src/config.ts` reads the environment with a zod schema, and `ADMIN_API_KEY` must be a string of at least 8 characters, with no default. `buildApp` in `app.ts` checks again and throws if the key is empty, so even code that skips the config loader cannot build an open admin API.",
			"",
			"**What it looks like.** The server was started twice, once with `ADMIN_API_KEY=` empty and once with `ADMIN_API_KEY=short`. Both times the process exited at once and nothing listened on the port. The message named the variable and the rule: `ADMIN_API_KEY must be set (min 8 chars) \u2014 refusing to start with an open admin API`.",
			"",
			"**Why it matters.** A missing environment variable is one of the most common deployment mistakes. If an unset key meant \"no check\", a forgotten variable would quietly publish the admin API. Failing at boot turns that mistake into a loud error before the first request arrives. The rule is that unset must never mean open.",
			"",
			"**Decisions.**",
			"",
			"- Parse the environment once, at the edge of the process, and give the rest of the code a typed config.",
			"- Put the explanation in the schema's own message, so whoever sees the failure knows the fix.",
			"- Keep a second guard where the key is used, so other callers of `buildApp` are covered too.",
			"",
			"**Limits seen in the same runs.** The failure is an uncaught `ZodError` with a stack trace, not a one-line message. And 8 characters is a low floor: the dev default `change-me-please` in the example file passes it, so a copied example would still run. A stronger design would require a longer key and refuse the known placeholder."
		),
		try: [
			{
				label: "A config check that refuses to start",
				code: md(
					"// A config check in the style of config.ts: refuse to start instead of running open.",
					"function loadConfig(env) {",
					"  const issues = [];",
					"  const key = env.ADMIN_API_KEY ?? '';",
					"  if (key.length < 8) issues.push('ADMIN_API_KEY must be set (min 8 chars): refusing to start with an open admin API');",
					"  const port = env.PORT === undefined ? 4100 : Number(env.PORT);",
					"  if (!Number.isInteger(port) || port <= 0) issues.push('PORT must be a positive integer');",
					"  return issues.length ? { ok: false, issues } : { ok: true, config: { port, adminApiKey: key } };",
					"}",
					"const cases = [{}, { ADMIN_API_KEY: '' }, { ADMIN_API_KEY: 'short' }, { ADMIN_API_KEY: 'a-long-enough-key', PORT: '4100' }];",
					"for (const env of cases) {",
					"  const r = loadConfig(env);",
					"  console.log(JSON.stringify(env), '->', r.ok ? 'starts on port ' + r.config.port : 'EXIT: ' + r.issues.join('; '));",
					"}"
				)
			}
		]
	},
	{
		id: "ap-key-auth",
		title: "Admin key auth in a header",
		level: "mid",
		summary: "Follow how one admin key is checked, why every failure looks the same, why the key stays out of the URL, and what the same runs showed is missing.",
		scenes: ['ap-key-compare', 'ap-key-401s', 'ap-key-url-log'],
		notes: md(
			"**The practice.** Cardify Lite guards its two admin routes with one key, sent in the `x-admin-key` header. In `app.ts` a `requireAdmin` hook runs before the handlers and calls `keyMatches`.",
			"",
			"**Constant-time compare.** `keyMatches` turns both keys into bytes and calls Node's `timingSafeEqual`, which takes the same time wherever the bytes differ. That function throws when the two buffers have different lengths, so the code compares lengths first and returns `false`. Only the length can leak.",
			"",
			"**One answer for every failure.** Calls with no key, a wrong key and a one-character key all returned `401` with the same body, `{\"error\":\"invalid or missing x-admin-key\"}`. A caller cannot tell a near miss from a blind guess.",
			"",
			"**Header, not URL.** A probe that sent `?x-admin-key=...` also got a 401, because only the header is read. But the server's request log recorded the whole URL, key included, while a key sent in a header never appears in it. Secrets in URLs leak into logs, browser history and proxies.",
			"",
			"**What it bought.** A key check that is small, easy to test and hard to get subtly wrong, and that fails the same way every time.",
			"",
			"**Limits seen in the same runs.**",
			"",
			"- One shared key: no names, so no record of who changed what.",
			"- No rate limit: 60 wrong keys in a row got 60 times `401`.",
			"- No rotation: the key comes from the environment, so changing it means a restart.",
			"- The admin page stores the key in `localStorage` in plain text, readable by any script on that page.",
			"",
			"The topics on API keys and on token storage in Auth and tokens cover the fixes."
		),
		try: [
			{
				label: "Naive compare against constant time",
				code: md(
					"// A naive compare stops at the first difference; the constant-time one always looks at every byte.",
					"function naive(a, b) {",
					"  let steps = 0;",
					"  if (a.length !== b.length) return { ok: false, steps };",
					"  for (let i = 0; i < a.length; i++) { steps++; if (a[i] !== b[i]) return { ok: false, steps }; }",
					"  return { ok: true, steps };",
					"}",
					"function constantTime(a, b) {",
					"  let steps = 0;",
					"  if (a.length !== b.length) return { ok: false, steps };",
					"  let diff = 0;",
					"  for (let i = 0; i < a.length; i++) { steps++; diff |= a.charCodeAt(i) ^ b.charCodeAt(i); }",
					"  return { ok: diff === 0, steps };",
					"}",
					"const real = 'change-me-please';",
					"for (const guess of ['xxxxxxxxxxxxxxxx', 'change-me-pleasX', 'change-me-please', 'x']) {",
					"  console.log(guess.padEnd(18), 'naive', JSON.stringify(naive(guess, real)), 'constant', JSON.stringify(constantTime(guess, real)));",
					"}"
				)
			}
		]
	},
	{
		id: "ap-cors-by-path",
		title: "CORS chosen by path",
		level: "mid",
		summary: "Learn why public and admin routes get different CORS rules, what the real preflights returned, and why CORS is not a login.",
		scenes: ['ap-cors-paths', 'ap-cors-preflight', 'ap-cors-not-auth'],
		notes: md(
			"**The practice.** One `onRequest` hook in `app.ts` chooses the CORS rule from the URL path.",
			"",
			"- Paths under `/cardify/sdk/` (the loader, the widget and the public config) are for every storefront. They get `access-control-allow-origin: *` and `cross-origin-resource-policy: cross-origin`, so any site may read or embed them.",
			"- Paths under `/cardify/admin/` answer only origins on an allow-list (`ADMIN_ALLOWED_ORIGINS`, by default `http://localhost:5173`). A listed origin is echoed back with the allowed methods and headers, plus `vary: Origin` so a cache never serves one origin's answer to another.",
			"",
			"**Real calls.** The preflight from the admin page came back 204 with all of those headers. The same preflight from `https://evil.example` came back 204 with none, so a browser would drop the real request.",
			"",
			"**What CORS is not.** A call with the right key from `https://evil.example` got 200 and the full body, just without an allow-origin header. CORS tells a browser whether a page may read a reply. It does not authenticate anyone, and `curl` ignores it. A script already running on the allowed admin origin is trusted by the browser as the admin, so CORS cannot protect against it.",
			"",
			"**What it bought.** The public parts stay open to every store, and the admin parts can be read by a browser only from the admin page.",
			"",
			"**Limit seen.** The key, not CORS, is the real gate, and the key sits in the admin's `localStorage`. A cross-site scripting bug on the admin page would hand a script both."
		),
		try: [
			{
				label: "A CORS decision by path and origin",
				code: md(
					"// The decision in app.ts: pick the CORS headers by path and origin.",
					"const ADMIN_ORIGINS = ['http://localhost:5173'];",
					"function corsHeaders(url, origin) {",
					"  if (url.startsWith('/cardify/sdk/')) return { 'access-control-allow-origin': '*', 'cross-origin-resource-policy': 'cross-origin' };",
					"  if (url.startsWith('/cardify/admin/') && origin && ADMIN_ORIGINS.includes(origin)) {",
					"    return { 'access-control-allow-origin': origin, vary: 'Origin', 'access-control-allow-methods': 'GET,PUT,OPTIONS', 'access-control-allow-headers': 'content-type,x-admin-key' };",
					"  }",
					"  return {};",
					"}",
					"const cases = [",
					"  ['/cardify/sdk/config/demostore', 'https://some-store.example'],",
					"  ['/cardify/admin/demostore/settings', 'http://localhost:5173'],",
					"  ['/cardify/admin/demostore/settings', 'https://evil.example'],",
					"  ['/cardify/admin/demostore/settings', undefined]",
					"];",
					"for (const [url, origin] of cases) console.log(url, '|', origin ?? '(no Origin)', '->', JSON.stringify(corsHeaders(url, origin)));"
				)
			}
		]
	},
	{
		id: "ap-validation",
		title: "Validating at the edge",
		level: "mid",
		summary: "See how one shared schema checks the merchant id and the settings, what the 400 answers contain, and which answers come from the framework.",
		scenes: ['ap-validate-edge', 'ap-validate-issues', 'ap-validate-limits'],
		notes: md(
			"**The practice.** Nothing is trusted until it has passed a check at the edge, and there is one set of rules. `shared/src/schema.ts` defines a zod `SettingsSchema` (a design from five allowed values, three 6-digit hex colours, a radius from 0 to 24, an image ratio and four true or false toggles) and a `MerchantIdSchema` (`^[a-z0-9]{6,32}$`). The admin form and the server import the same file, so they cannot disagree about what is valid.",
			"",
			"**Real calls.** Merchant ids `NOT_VALID!`, `DemoStore` and `abc` each got `400` with `{\"error\":\"invalid merchant id\"}`. A PUT with four wrong values got `400` with `{\"error\":\"invalid settings\",\"issues\":[...]}`: one entry per problem, each with a `path` and a `message`.",
			"",
			"**Defaults from the framework.** A PUT with no content-type got 415, malformed JSON got 400, and a body over 1 MiB got 413. These are Fastify's own defaults, not Cardify Lite's code, and they use a different JSON shape from the app's `{\"error\": \"...\"}`.",
			"",
			"**Parameterised queries.** The repo writes through Kysely, so input values are bound as parameters and never glued into SQL text.",
			"",
			"**No existence leak.** A valid but never-seen id returns the default settings with `version: 0`, not a 404, so nobody can probe which merchants exist.",
			"",
			"**What it bought.** Bad input is turned away early with a useful message, and the database only ever sees valid values.",
			"",
			"**Limit seen.** Two error shapes, so a client has to read both."
		),
		try: [
			{
				label: "A small validator that lists every issue",
				code: md(
					"// A tiny validator in the style of SettingsSchema: collect every issue, not only the first.",
					"const DESIGNS = ['classic', 'minimal', 'overlay', 'hover-reveal', 'editorial'];",
					"function validate(s) {",
					"  const issues = [];",
					"  if (typeof s.enabled !== 'boolean') issues.push({ path: ['enabled'], message: 'Expected boolean, received ' + typeof s.enabled });",
					"  if (!DESIGNS.includes(s.design)) issues.push({ path: ['design'], message: 'Invalid enum value, received ' + s.design });",
					"  if (!/^#[0-9a-fA-F]{6}$/.test(s.options.accentColor)) issues.push({ path: ['options', 'accentColor'], message: 'must be a 6-digit hex colour like #ed186f' });",
					"  const r = s.options.radius;",
					"  if (!Number.isInteger(r) || r < 0 || r > 24) issues.push({ path: ['options', 'radius'], message: 'radius must be an integer from 0 to 24' });",
					"  return issues;",
					"}",
					"console.log(JSON.stringify(validate({ enabled: 'yes', design: 'neon', options: { accentColor: 'red', radius: 99 } }), null, 1));",
					"console.log(['demostore', 'NOT_VALID!', 'DemoStore', 'abc'].map((id) => id + ': ' + /^[a-z0-9]{6,32}$/.test(id)).join(', '));",
					"console.log(validate({ enabled: true, design: 'overlay', options: { accentColor: '#ed186f', radius: 12 } }).length, 'issues for a good body');"
				)
			}
		]
	},
	{
		id: "ap-caching-versioning",
		title: "Caching and versions",
		level: "mid",
		summary: "Follow the cache header each response carries, how a version and a fingerprint avoid needless work, and why checking the real headers matters.",
		scenes: ['ap-cache-headers', 'ap-etag-304', 'ap-version-fingerprint', 'ap-focus-refresh'],
		notes: md(
			"**The practice.** Each response carries the cache headers its job needs.",
			"",
			"- The public config is `cache-control: no-store`. It is the one answer that must never be stale, because a merchant's switch should show on the store as soon as the shopper's tab looks again.",
			"- The SDK files (loader and widget) are served by a static plugin with an `etag` and `last-modified`. A conditional request with `If-None-Match` got `304 Not Modified`: headers only, no file bytes.",
			"- Admin responses carry no cache headers; only the admin page fetches them.",
			"",
			"**A version in the body.** Every config has a `version`: the time of the last save in epoch milliseconds, or `0` if the merchant never saved. The loader builds a fingerprint `version:enabled` and does work only when it changes. It records the fingerprint only after the work succeeded, so a failed widget load is retried.",
			"",
			"**No polling.** The loader asks on page load, on window focus and when the tab becomes visible. A tab left open in the background never calls the backend. In the real browser run, returning to the storefront tab caused one config request, then the widget file, and the cards changed with no reload.",
			"",
			"**Check the real headers.** The source asks for `cache-control: no-cache` on the bundles, but the response that arrived said `public, max-age=0`: the plugin's own default won. The effect is similar, but only reading the real response revealed it.",
			"",
			"**Limit seen.** `max-age=0` makes every use ask again. That is cheap with a 304, but it is still one request per page."
		),
		try: [
			{
				label: "A fingerprint and refresh decision",
				code: md(
					"// The loader's decision: do work only when version:enabled changed, and remember it only after success.",
					"let seen = '';",
					"let widgetLoaded = false;",
					"function refresh(cfg, loadWorks = true) {",
					"  const fingerprint = cfg.version + ':' + cfg.enabled;",
					"  if (fingerprint === seen) return 'nothing (seen ' + fingerprint + ')';",
					"  let action;",
					"  if (cfg.enabled) {",
					"    if (!loadWorks) return 'widget load did not work, will retry on the next focus';",
					"    widgetLoaded = true;",
					"    action = 'load widget and apply ' + cfg.design;",
					"  } else if (widgetLoaded) {",
					"    widgetLoaded = false;",
					"    action = 'stop widget, native cards come back';",
					"  } else action = 'nothing to stop';",
					"  seen = fingerprint;",
					"  return action;",
					"}",
					"const on = { version: 1795534284949, enabled: true, design: 'overlay' };",
					"const events = [[{ version: 0, enabled: false, design: 'classic' }], [on, false], [on], [on], [{ version: 1795534290000, enabled: false, design: 'overlay' }]];",
					"for (const [cfg, works] of events) console.log(cfg.version + ':' + cfg.enabled, '->', refresh(cfg, works));"
				)
			}
		]
	}
];

const q1 = builder('AP', "ap-fail-closed-config");
const q2 = builder('AP', "ap-key-auth");
const q3 = builder('AP', "ap-cors-by-path");
const q4 = builder('AP', "ap-validation");
const q5 = builder('AP', "ap-caching-versioning");

q1.add("basic", "boot",
	"What does Cardify Lite's backend do when it is started with ADMIN_API_KEY empty?",
	"It exits at once with an error, and nothing listens on the port",
	["It starts and leaves the admin routes open until someone adds a key later on", "It starts and answers every admin request with 401 for now", "It makes up a random key and prints it to the log at boot"],
	"The config schema requires at least 8 characters, so an empty key fails the parse and the process exits before the server listens. Starting open, or inventing a key, would hide a deployment mistake.");
q1.add("mid", "rule",
	"Why is \"unset must never mean open\" a good rule for configuration?",
	"A forgotten variable fails loudly at boot instead of silently removing protection",
	["It lets the server pick a safe default key for itself whenever the variable is missing", "It makes the server start faster because the key check is skipped", "It lets clients find out which variables the operator has set"],
	"A missing environment variable is a common deployment mistake. If missing meant no check, the admin API would be public without anyone noticing. Failing at boot makes the mistake impossible to miss.");
q1.add("mid", "second-guard",
	"buildApp throws on an empty key even though config.ts already checks it. What does the second check add?",
	"A guard where the key is used, so no caller of buildApp can build an open API",
	["A faster check, because parsing the config with zod is too slow to repeat at startup", "Support for one key per merchant instead of a single shared key", "A way to change the key while the server keeps running"],
	"The loader is one way to get a config, but buildApp is where the key is used. Checking there as well means a test, a script or a future entry point cannot create admin routes without a key.");
q1.add("advanced", "limits",
	"Which limit of this fail-closed check did the boot runs show?",
	"The refusal is a raw stack trace, and an 8-character minimum still lets weak keys through",
	["The server keeps listening for a few seconds before it notices that the key is bad or empty", "The error never says which variable is wrong or what is needed", "The check runs only after the first admin request has been served"],
	"The message was clear and the exit was immediate, so those claims are wrong. The real gaps are the uncaught ZodError stack trace and a low floor: the documented dev key passes the 8 character rule.");
q1.add("mid", "message",
	"Where should the explanation of a failed config check live so the operator can act on it?",
	"In the schema message itself, naming the variable and the fix",
	["In the README only, because the process should print nothing at all", "In an HTTP response sent to the first client that connects", "In a log file that is created only after the server starts"],
	"The failure happens before any server or log exists, so the message has to travel with the check. Cardify Lite puts the variable name and the rule into the zod message, which is what the operator sees.");

q2.add("basic", "header",
	"Where does Cardify Lite's admin API read the key from?",
	"The x-admin-key request header, and nowhere else",
	["A query string parameter named key on every admin URL", "A cookie that the server sets after the first request", "The JSON body of each PUT and each GET request"],
	"Only the header is read. A probe that put the key in the query string got a 401. Keeping the key out of the URL matters because URLs are written to logs and browser history.");
q2.add("mid", "length-first",
	"Why does keyMatches compare lengths before calling timingSafeEqual?",
	"timingSafeEqual throws when the lengths differ, so unequal lengths must return false first",
	["timingSafeEqual is slow on long input, so short keys are turned away early to save some time", "A length difference is the only thing an attacker could ever learn from a key", "Buffers of equal length are needed before the key can be hashed and stored"],
	"Node's timingSafeEqual throws on buffers of different length. Without the pre-check, a wrong-length key would raise an error instead of getting a clean 401. Returning false early leaks only the length.");
q2.add("mid", "same-401",
	"A call with no key, a wrong key and a one-character key all got the same 401 body. What does that protect?",
	"A caller cannot tell how close a guess was, or whether a key was sent at all",
	["It lets the browser cache the 401 response and skip later checks of the key itself", "It hides the route, so unknown callers see a 404 instead", "It stops the server from writing the request to its log"],
	"Identical status and body mean the response carries no signal about the guess. The caller learns nothing about length, content or a near miss beyond the plain fact that it failed.");
q2.add("mid", "url-log",
	"A probe sent the key as ?x-admin-key=... and got a 401. What did the server log show?",
	"The whole URL with the key in it, since the log records the URL but not the headers",
	["Only a masked key, because Fastify hides query string parameters in its logs by default", "Nothing, because a 401 response is never written to the log", "The key twice, once from the URL and once from the headers"],
	"The request log line held the method and URL, and the URL contained the key. A key sent in a header never appeared. That is why secrets belong in headers and not in URLs.");
q2.add("advanced", "no-rate-limit",
	"Sixty wrong keys in a row all got 401. What does that show about the API?",
	"Nothing slows or blocks guessing, so the strength of the key is the only defence",
	["The key is rotated after every tenth failure, so that older guesses stop being useful", "Each 401 makes the client wait a minute before it may retry", "The server counts failures per origin and will start sending 429 soon"],
	"All sixty answers were 401, with no 429 and no delay. There is no rate limit or lockout, so a short or guessable key would fall to repeated attempts. The same runs also showed one shared key and no rotation.");

q3.add("basic", "public",
	"Which CORS rule applies to the public config route, /cardify/sdk/config/:merchantId?",
	"Any origin may read it: access-control-allow-origin is *",
	["Only http://localhost:5173 may read it, and the answer has Vary: Origin", "No origin may read it, because it needs the admin key", "Only the origin of the first caller, which the server remembers"],
	"The SDK and the public config belong to every storefront, so they are open to any origin. The admin routes are the ones restricted to an allow-list.");
q3.add("mid", "vary",
	"Why do the admin CORS responses carry Vary: Origin?",
	"The allowed origin in the answer changes with the caller, so caches must keep the answers apart",
	["It tells browsers to attach the admin key only to requests sent to the origins on the allow-list", "It makes the browser skip the preflight request entirely", "It marks the response as safe to cache for a long time"],
	"Because the server echoes the caller's origin, two origins get different headers for the same URL. Vary: Origin stops a cache from serving one origin's answer to another.");
q3.add("mid", "preflight",
	"A preflight OPTIONS from https://evil.example got 204. What was different about it?",
	"It had no CORS headers, so the browser would drop the real request",
	["It had a 403 status, so the browser stopped at the preflight and sent nothing more", "It carried a body listing the origins that are allowed", "It set a cookie to remember the refused origin"],
	"The hook answers every OPTIONS with 204, but adds the access-control headers only for a listed origin. Without them the browser does not send the real PUT.");
q3.add("advanced", "not-auth",
	"A request with the right key from Origin https://evil.example still got 200 and the body. What does that show?",
	"CORS only stops a browser page from reading the reply; it is not authentication",
	["The key check ran after the CORS hook and wrongly ignored the origin of the caller", "The allow-list failed because Vary: Origin was missing", "The server trusts any origin once the key is valid, as CORS demands"],
	"The server answered because the key was right. The missing allow-origin header means a browser page on that origin cannot read the reply, but curl or any script outside a browser can.");
q3.add("advanced", "xss",
	"A script is injected into the allowed admin page. Can it call the admin API?",
	"Yes: the browser treats it as the allowed origin, and CORS cannot tell it from the admin",
	["No, because the preflight answer lists only the individual scripts that the admin page trusts", "No, because JavaScript cannot set the key header on a request", "Yes, but only for GET, because the preflight blocks every PUT"],
	"CORS works per origin, not per script. Code running on the allowed origin may send the key header, and the key itself sits in localStorage there. Protecting the admin page from injected scripts matters as much as CORS.");

q4.add("basic", "merchant-id",
	"What does the public config route return for the merchant id NOT_VALID! ?",
	"400 with {\"error\":\"invalid merchant id\"}",
	["404 with a message that the merchant was not found", "200 with the default settings and version 0", "401 because the id looks like a stolen key"],
	"The id fails the pattern ^[a-z0-9]{6,32}$ and is turned away with a 400 before any lookup. A valid but unseen id is different: it gets default settings.");
q4.add("mid", "shared-schema",
	"Why do the admin UI and the server share one zod schema?",
	"Both apply the same rules, so the form and the API cannot drift apart",
	["The server can skip its own validation because the page has already checked the input", "The browser can then trust any value that the server returns", "It keeps the PUT body small enough to avoid the size limit"],
	"A shared schema is one definition of valid. The server still validates, because a request does not have to come from the form, but the two cannot disagree about the rules.");
q4.add("mid", "issues",
	"A PUT with four wrong values got a 400. What did the response body contain?",
	"An issues list with a path and a message for each wrong field",
	["Only the first wrong field, because zod stops at the first error", "A plain text line saying that the body is invalid", "The corrected settings that the server would have accepted"],
	"The body was {\"error\":\"invalid settings\",\"issues\":[...]} with one entry per problem, each naming its path and message. The caller sees every fault at once.");
q4.add("mid", "framework",
	"Which of these answers come from Fastify's defaults, not from Cardify Lite's own code?",
	"The 1 MiB body limit and the content-type checks behind the 413, 415 and 400 answers",
	["The merchant id pattern, the list of allowed designs and the range of the corner radius", "The 401 for a missing admin key", "The list of allowed designs in the 400 body"],
	"The size limit and content-type handling are framework behaviour, and their error JSON has a different shape from the app's {\"error\": \"...\"}. The id pattern, ranges, key check and design list are written in the app.");
q4.add("advanced", "no-404",
	"Why does a valid but never-seen merchant id get 200 with version 0 instead of a 404?",
	"Nobody can probe the API to find out which merchants exist, and a store still gets safe defaults",
	["The merchant row is created in the database on the very first read, so a default row always exists", "A 404 is reserved for routes that need the admin key", "The version 0 is a signed proof that the merchant exists"],
	"Returning defaults means the answer looks the same for known and unknown ids, so ids cannot be enumerated, and a store with no settings simply keeps its native cards.");

q5.add("basic", "no-store",
	"Which cache-control value does the public config response send?",
	"no-store",
	["public, max-age=0", "max-age=31536000, immutable", "private, max-age=60"],
	"The config must never be stale, so the browser is told not to keep it. The bundles are different: they carry an ETag and are revalidated.");
q5.add("mid", "304",
	"A conditional GET of the loader with If-None-Match got 304. What came back?",
	"Only headers, so the browser reuses its copy once the server confirms it is current",
	["The whole file again, together with a new ETag that replaces the old one on the browser", "A redirect to the widget bundle", "An error saying that the ETag is unknown"],
	"A 304 Not Modified has no body. It tells the browser its stored copy still matches, which makes asking again almost free.");
q5.add("mid", "intent",
	"The source sets cache-control: no-cache for the bundles, but public, max-age=0 arrived. What is the lesson?",
	"Check the headers that actually arrive, because a plugin default can override the intent",
	["Headers set in code are ignored by every browser unless the page itself asks for them too", "no-cache and max-age=0 are rejected by proxies", "Static files can never have their cache headers changed"],
	"The static file plugin's own value won over the setHeaders call. The behaviour is similar, but only reading the real response from a running server showed the difference.");
q5.add("mid", "version",
	"What is the version in a config response?",
	"The epoch milliseconds of the last save, or 0 when the merchant never saved",
	["A counter that goes up by one on every public read", "The version number of the SDK bundle that is in use", "A hash of the options that changes only with the colours"],
	"The version comes from the stored updatedAt time. The loader joins it with enabled into a fingerprint, so an unchanged config causes no work.");
q5.add("advanced", "no-timer",
	"Why does the loader refresh only on focus and visibility, with no timer?",
	"Idle tabs would otherwise call the backend forever, and focus catches the moment a change matters",
	["Browsers forbid timers in any script that was loaded from an origin other than the page it runs in", "The config changes only when the shopper clicks on a card", "A timer would make the version fingerprint change on its own"],
	"A timer would make every open tab poll the backend for as long as it stays open. Refreshing when the tab regains focus gives the merchant a fast result without that background traffic.");

export const banks: { out: Question[] }[] = [q1, q2, q3, q4, q5];
