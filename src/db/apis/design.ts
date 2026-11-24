import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');

// Names, hosts and ids from the observed store are changed. The shapes (paths, methods, statuses, headers, counts) are what was seen.

export const topics: DbTopic[] = [
	// ───────────────────────── Configuration ─────────────────────────
	{
		id: 'ap-env-and-config',
		title: 'Configuration that fails loudly',
		level: 'mid',
		summary: 'See which environment variables reach the browser, why an empty value is a trap, and how one value under two names hid a bug.',
		scenes: ['ap-env-visibility', 'ap-empty-env', 'ap-two-names-silent-400'],
		notes: md(
			'**What was observed.** The store runs on Next.js. Its configuration lives in environment variables, and the framework sorts them into two groups: variables that stay on the server, and variables with a public prefix that are copied into the browser code when the app is built.',
			'',
			'**The rule.** Anything with the public prefix is published to every visitor. So a token, a signing key or a store address that must stay private never goes in a public variable. The store keeps its platform token on the server and lets the browser call a same-origin route that adds it.',
			'',
			'**The empty-string trap.** An example env file often ships variables with no value, such as `MERCHANT_ID=`. A variable that is present but empty is the empty string, not undefined. The nullish operator `??` only falls back for undefined, so an empty value slipped straight through. The code uses `||`, which treats the empty string as missing.',
			'',
			'**One value, two names.** The same merchant id was exposed as a server-only name and as a public name. An operator who set only the public one produced an empty `x-merchant-id` header, a 400 from the platform and, because the handler degrades to an empty list, no apps on the page and no visible error.',
			'',
			'**What to do.** Read both names, validate required values at boot so a bad value stops the start, and log every time a handler degrades. Degrading quietly is kind to visitors and unkind to operators unless it leaves a trace.',
			'',
			'**Trade-off.** Failing at boot is stricter, but a wrong value is found in seconds instead of weeks.'
		),
		try: [
			{
				label: 'Empty env values and a boot check',
				code: md(
					'// Empty env values: ?? versus ||, plus a boot-time check.',
					'const env = { MERCHANT_ID: "", STORE_NAME: undefined, API_TOKEN: "abc123" };',
					'console.log("?? on empty :", JSON.stringify(env.MERCHANT_ID ?? "fallback"));',
					'console.log("|| on empty :", JSON.stringify(env.MERCHANT_ID || "fallback"));',
					'console.log("?? on unset :", JSON.stringify(env.STORE_NAME ?? "fallback"));',
					'',
					'function checkConfig(e, required) {',
					'  const missing = required.filter((k) => !e[k] || String(e[k]).trim() === "");',
					'  return { ok: missing.length === 0, missing };',
					'}',
					'console.log(checkConfig(env, ["MERCHANT_ID", "API_TOKEN"]));',
					'console.log(checkConfig({ ...env, MERCHANT_ID: "store-1" }, ["MERCHANT_ID", "API_TOKEN"]));'
				)
			}
		]
	},

	// ───────────────────────── Third-party surface ─────────────────────────
	{
		id: 'ap-third-party-surface',
		title: 'The third-party surface',
		level: 'advanced',
		summary: 'Count the outside hosts a page reaches, understand what a vendor script can do, and learn the controls that shrink that reach.',
		scenes: ['ap-hosts-per-page', 'ap-script-reach', 'ap-script-controls'],
		notes: md(
			"**What was observed.** In a real browser, four page views of the store each reached 9 or 10 different outside hosts. The store answered 9 calls itself per page. Outside hosts answered 16 to 21: platform APIs for cart, reviews, search and recommendations, scripts for login and checkout, analytics, a pixel helper and a browser translation widget from Google (four hosts).",
			'',
			"**Why it matters.** A script loaded on the page runs with the same rights as the store's own code. It can read the page, local storage and every cookie that is not HttpOnly, and it can send requests anywhere. Each vendor is a trust decision.",
			'',
			'**What I blocked.** To keep the run read-only I blocked tracker scripts (4 per page) and write requests (19 in all: 14 POSTs to the platform API and 5 batches of 1.5 to 9 KB to the analytics collector). Those writes are the pings and events a page sends while you browse.',
			'',
			'**Controls that shrink the surface**',
			'',
			'- Load only what you need.',
			'- Wait for consent where the rules require it.',
			'- Use a first-party endpoint so a vendor sees less of the visitor.',
			'- Add a content security policy with a `script-src` allow-list. The store sets only `frame-ancestors`, which controls who may embed it, not what may run on it.',
			'',
			'**Trade-off.** Vendor scripts bring checkout, login and analytics. Every one you remove is a feature you must build or give up, so measure what each one earns.'
		),
		try: [
			{
				label: 'Count outside hosts by role',
				code: md(
					'// Classify requests by host role and count them, like the run summary.',
					'const ROLE = {',
					'  "store.example": "store",',
					'  "api.platform.example": "platform API",',
					'  "scripts.vendor.example": "vendor script",',
					'  "events.analytics.example": "analytics",',
					'  "translate.widget.example": "translation widget",',
					'};',
					'const requests = [',
					'  { host: "store.example", method: "GET" },',
					'  { host: "api.platform.example", method: "GET" },',
					'  { host: "api.platform.example", method: "POST" },',
					'  { host: "scripts.vendor.example", method: "GET" },',
					'  { host: "events.analytics.example", method: "POST" },',
					'  { host: "translate.widget.example", method: "GET" },',
					'  { host: "translate.widget.example", method: "GET" },',
					'];',
					'const byRole = {};',
					'for (const r of requests) {',
					'  const role = ROLE[r.host] || "unknown";',
					'  byRole[role] = (byRole[role] || 0) + 1;',
					'}',
					'console.log(byRole);',
					'const outside = requests.filter((r) => ROLE[r.host] !== "store");',
					'console.log("outside hosts:", new Set(outside.map((r) => r.host)).size);',
					'console.log("writes:", requests.filter((r) => r.method !== "GET").length);'
				)
			}
		]
	},

	// ───────────────────────── Client storage ─────────────────────────
	{
		id: 'ap-client-storage',
		title: 'What the browser ends up holding',
		level: 'advanced',
		summary: 'Inventory the keys and cookies a visitor collects, read their flags, and judge what is sensitive and where it should live.',
		scenes: ['ap-storage-inventory', 'ap-cookie-flags-seen', 'ap-guest-vs-credential'],
		notes: md(
			'**What was observed.** After four page views the browser held 13 local storage keys, 6 session storage keys and 15 cookies, several of them duplicated per domain. A per-store cart token was one of the local storage keys. The store itself set only one cookie, `locale`. The rest came from vendor scripts running on the page.',
			'',
			'**Flags.** Every cookie was readable by script: none was HttpOnly. Most vendor cookies used `SameSite=None; Secure` so they work across sites. A session-id cookie used the `__Host-` prefix and `Secure`, but a vendor script wrote it from the page, which is why it could not be HttpOnly.',
			'',
			'**Sensitive and not.** A guest cart id only names a cart, so local storage is an acceptable home for it. A login credential acts as the user: it belongs in a server session behind an HttpOnly, Secure cookie, or on the server of a backend-for-frontend. No login credential was seen in this run.',
			'',
			'**Why the prefix still helps.** Browsers accept a `__Host-` cookie only if it is Secure, has `Path=/` and sets no `Domain`, so another subdomain cannot overwrite it.',
			'',
			'**Link to Auth and tokens.** The token-storage lessons in that section compare local storage, memory, HttpOnly cookies and the backend-for-frontend pattern.',
			'',
			'**Trade-off.** Script-set cookies are easy for vendors to use but cannot be HttpOnly. Decide what each stored value is worth before you decide where it lives.'
		),
		try: [
			{
				label: 'Audit a list of cookie records',
				code: md(
					'// Audit cookie records for missing protections.',
					'const cookies = [',
					'  { name: "locale", secure: false, httpOnly: false, sameSite: "Lax", path: "/", days: 365 },',
					'  { name: "__Host-session", secure: true, httpOnly: false, sameSite: "None", path: "/", days: 1 },',
					'  { name: "vendor_uid", secure: true, httpOnly: false, sameSite: "None", path: "/", days: 365 },',
					'  { name: "ana_id", secure: true, httpOnly: false, sameSite: "None", path: "/", days: 400 },',
					'];',
					'function audit(c) {',
					'  const issues = [];',
					'  if (!c.httpOnly) issues.push("readable by script");',
					'  if (!c.secure) issues.push("not Secure");',
					'  if (c.sameSite === "None" && !c.secure) issues.push("None needs Secure");',
					'  if (c.name.startsWith("__Host-") && (!c.secure || c.path !== "/")) issues.push("prefix rules broken");',
					'  if (c.days > 365) issues.push("lives over a year");',
					'  return issues;',
					'}',
					'for (const c of cookies) console.log(c.name.padEnd(16), audit(c).join(", ") || "ok");'
				)
			}
		]
	},

	// ───────────────────────── Observability ─────────────────────────
	{
		id: 'ap-observability',
		title: 'Request ids, logs and health checks',
		level: 'mid',
		summary: 'Follow one request through responses and logs with an id, tell three kinds of health check apart, and see why silent skips hurt.',
		scenes: ['ap-request-id-trace', 'ap-health-and-silence'],
		notes: md(
			'**What was observed.** The webhook route answers every request with a request id. An unsigned delivery got `401 {"error":"Invalid signature","requestId":"wh_<id>"}`. The id exists so anyone reporting a failed delivery can quote it.',
			'',
			"**Tagged logs.** A browser-events route in the design logs every line with a `[PREFIX:<requestId>]` tag and a step name. One search for the id then follows a single request through every step, and the lines of other requests do not appear. The sender's own event id can serve as the correlation id.",
			'',
			'**Health checks.** The design has three kinds of probe: a shallow `/health` that returns 200 without checking anything behind it, a probe on the webhook route that returns only a status and a time and reveals nothing about configuration, and, where you need one, a deep check that verifies dependencies. A deep check tells more, so protect it.',
			'',
			'**No silent skips.** After a purge the handler can pre-render pages. If no base address is configured it logs that warming is disabled instead of skipping the step quietly.',
			'',
			'**Trade-off.** Logging every step costs storage and needs care not to log secrets. A short, consistent prefix and a request id give most of the value for little cost.'
		),
		try: [
			{
				label: 'A tagged logger and a grep',
				code: md(
					'// A tagged logger: one search follows one request.',
					'const lines = [];',
					'const logger = (prefix, id) => (step, msg) => lines.push(`[${prefix}:${id}] [${step}] ${msg}`);',
					'const a = logger("EVT", "r1a2");',
					'const b = logger("EVT", "r9z8");',
					'a("AUTH", "OK");',
					'b("AUTH", "missing signature");',
					'a("SEND", "2 events");',
					'b("RESPOND", "401");',
					'const grep = (id) => lines.filter((l) => l.includes(":" + id + "]"));',
					'console.log(grep("r9z8").join("\\n"));',
					'console.log("r1a2 has", grep("r1a2").length, "lines");'
				)
			}
		]
	},

	// ───────────────────────── Review ─────────────────────────
	{
		id: 'ap-review-and-next',
		title: 'A balanced review and what to fix first',
		level: 'advanced',
		summary: 'Weigh what the traffic shows working against eight outside-visible items, and put the fixes in a sensible order.',
		scenes: ['ap-works-well', 'ap-review-findings', 'ap-fix-order'],
		notes: md(
			"**What works.** The traffic shows five practices holding up: a same-origin proxy that keeps credentials on the server, signed webhooks with a timestamp that refuse replays, tagged caching with webhook purges and page warming, shopper-aware rate limits (the shopper's IP is forwarded on uncached calls), and fail-soft reads that keep a last good page when the platform is unavailable.",
			'',
			'**What a reviewer would flag.** These items are all visible from outside, in dev mode, and each has an easy fix:',
			'',
			'- The same same-origin call fires three times per page view. Fetch once, share the result.',
			'- One blanket cache header covers every `/api` response, including errors and routes that wanted no-store. Scope it.',
			'- Not found is handled three ways: 200 with `noindex`, 200 `null` and 400. Pick one rule.',
			'- No Strict-Transport-Security, X-Content-Type-Options or Referrer-Policy in dev, and the policy header only has `frame-ancestors`. Add them at the edge.',
			'- Some pages send the `locale` cookie twice. Set it once.',
			'- `/health` checks nothing. Keep it for liveness and add a protected deep check.',
			'- About ten outside hosts per page. Trim, gate on consent and add a `script-src` list.',
			'- A guest cart token lives in local storage. Fine for a cart id, never for a login.',
			'',
			'**What first.** Third-party scripts, then the repeated call, then the cache header, then hardening headers, then the small fixes.',
			'',
			'**Trade-off.** Dev mode changes headers and timings, so confirm each item against a production build before spending time on it.'
		),
		try: [
			{
				label: 'Score response headers',
				code: md(
					'// Score a response for hardening headers and for leaks.',
					'const WANTED = ["strict-transport-security", "x-content-type-options", "referrer-policy", "content-security-policy"];',
					'const LEAKS = ["x-powered-by", "server"];',
					'function score(headers) {',
					'  const names = Object.keys(headers).map((h) => h.toLowerCase());',
					'  const missing = WANTED.filter((h) => !names.includes(h));',
					'  const leaks = LEAKS.filter((h) => names.includes(h));',
					'  return { points: WANTED.length - missing.length - leaks.length, of: WANTED.length, missing, leaks };',
					'}',
					'console.log(score({ "Content-Security-Policy": "frame-ancestors self", "X-Powered-By": "Next.js" }));',
					'console.log(score({ "Strict-Transport-Security": "max-age=31536000", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "same-origin", "Content-Security-Policy": "script-src self" }));'
				)
			}
		]
	}
];

// ───────────────────────── ap-env-and-config ─────────────────────────
const env = builder('AP', 'ap-env-and-config');

env.add('basic', 'public-prefix',
	"In a Next.js app, which environment variables end up in the code sent to every visitor's browser?",
	'Only the ones with the public prefix, copied in at build time',
	['All of them, because the server and the browser share one process', 'None, since the browser only ever talks to the server', 'Those marked required in the example env file'],
	'The framework copies only public-prefixed variables into the client code during the build. Everything else stays on the server. The server and browser are separate runtimes, and being listed in the example file has no effect on visibility.');

env.add('mid', 'secret-in-public',
	'A teammate puts an API token in a public-prefixed variable so a client component can call the platform. What is the right fix?',
	'Keep it server-only and call the API from a same-origin route',
	['Minify the production bundle so the token is much harder to find', 'Rename the variable to something less obvious to a casual reader', 'Encode the token in base64 before putting it in the variable'],
	'A public-prefixed value is published with the JavaScript, so obscuring it does not help: minifying, renaming and encoding all leave it readable. The store keeps its token on the server and lets the browser call a same-origin route that adds it.');

env.add('mid', 'empty-string',
	'An env var is set to nothing (MERCHANT_ID=). What does process.env.MERCHANT_ID ?? "fallback" evaluate to?',
	'An empty string, because ?? only replaces null and undefined',
	['The word fallback, because a variable with no value counts as unset', 'Undefined, because an empty variable is treated as not set at all', 'A runtime error, because empty values are rejected when the app starts'],
	'A variable that is present but empty is the empty string, not undefined. The nullish operator only falls back for null or undefined, so the empty string passes through. The || operator treats it as missing and would use the fallback.');

env.add('mid', 'two-names',
	'A merchant id is exposed under a server-only name and a public name, and an operator sets only the public one. What happened in the observed store?',
	'The server sent an empty header, got a 400 and showed an empty list',
	['The server used the public value automatically and everything worked fine', 'The build failed with a clear message about the missing variable', 'The browser blocked the request because of the mismatched names'],
	'The server-only name stayed empty, so the x-merchant-id header was empty and the platform answered 400. The handler is built to degrade to an empty list, so no apps showed and nothing visible explained why.');

env.add('advanced', 'validate-boot',
	'Why does validating configuration at boot beat degrading quietly when a value is missing?',
	'A bad value stops the start instead of hiding in an empty page',
	['It lets the app retry the request until the missing value appears', 'It makes the environment variables available to the browser too', 'It removes the need to keep an example env file in the repository'],
	'Quiet degrading is kind to visitors but hides configuration bugs, as the empty merchant id showed. Checking required values at startup surfaces the mistake in seconds. It does not retry anything, expose variables or replace the example file.');

// ───────────────────────── ap-third-party-surface ─────────────────────────
const tp = builder('AP', 'ap-third-party-surface');

tp.add('basic', 'host-count',
	'How many distinct outside hosts did a product page of the observed store reach?',
	'Ten outside hosts',
	['Three outside hosts', 'Five outside hosts', 'Twenty-five outside hosts'],
	'The four page views reached 9, 9, 10 and 10 distinct outside hosts, and the product page was one of the ten-host pages. The count includes platform APIs, vendor scripts, analytics and the translation widget.');

tp.add('mid', 'script-reach',
	'What can a vendor script loaded on your page read?',
	'Whatever your own scripts can: the page, storage and readable cookies',
	['Only the page parts named in the vendor settings screen', 'Nothing outside its own iframe, because scripts are sandboxed by default', 'Only data the visitor agreed to share in the consent banner'],
	'A script loaded into the page runs with the same rights as the store code. It can read the page, local storage and any cookie that is not HttpOnly, and it can send requests anywhere. It is not sandboxed in an iframe by default.');

tp.add('mid', 'frame-ancestors',
	"The store's policy header only sets frame-ancestors. What does that directive control?",
	'Which sites may embed the store in a frame',
	['Which hosts may run scripts on the store pages', 'Which origins the store may send API requests to', 'Which cookies the store may set on its own domain'],
	'frame-ancestors lists the sites allowed to embed the page in a frame. It does not restrict which scripts run, where requests may go or which cookies exist. Those need other directives such as script-src and connect-src.');

tp.add('advanced', 'script-src',
	'Which control stops a script from an unlisted host from running on the page?',
	'A script-src allow-list in the content security policy',
	['Setting SameSite=None on every cookie that the page sets', 'Putting the vendor script after the closing body tag', 'Serving the page with a long cache lifetime header'],
	'A script-src list names the hosts allowed to run code and the browser refuses the rest. Cookie flags, script position and cache headers do not decide which scripts execute.');

tp.add('advanced', 'blocked-writes',
	'In the run, 19 write requests were blocked across four page views. Where were they sent?',
	'14 to the platform API and 5 to the analytics collector',
	['19 to the platform API and none to any analytics host at all', "All 19 to the store's own server routes under the API path", '10 to ad networks and 9 to the browser translation widget'],
	'The blocked POSTs were 14 calls to the platform API (discount lookups and activity pings) and 5 batches of 1.5 to 9 KB to the analytics collector. None of them went to the store routes or the translation widget.');

// ───────────────────────── ap-client-storage ─────────────────────────
const cs = builder('AP', 'ap-client-storage');

cs.add('basic', 'own-cookie',
	'Which cookie did the store itself set during the run?',
	'Only the locale cookie',
	['A session id cookie with the __Host- prefix', 'A cart token cookie readable only by the server', 'An analytics cookie lasting 400 days'],
	'The store set one cookie, locale, which holds a language. The __Host- session id, the analytics cookies and the others were written by vendor scripts running on the page.');

cs.add('mid', 'cookie-count',
	'How many cookies did the browser hold after the four page views?',
	'Fifteen, several of them duplicated per domain',
	['Two, the locale cookie and a cart token', 'One per vendor, about five in total', 'None, since every value lived in local storage and session storage'],
	'The run ended with 15 cookies, some appearing once per domain, alongside 13 local storage keys and 6 session storage keys. The cart token was in local storage, not in a cookie.');

cs.add('mid', 'host-prefix',
	'Why is the __Host- prefixed session cookie in the run not HttpOnly?',
	'A script sets it from the page, so script code can read it',
	['The prefix rules forbid the HttpOnly flag on prefixed cookies', 'Browsers drop HttpOnly on localhost during development', 'HttpOnly would stop the cookie being sent to the server'],
	'HttpOnly can only be set by the server in a Set-Cookie header. A cookie that a vendor script writes through document.cookie is readable by script by definition. The prefix and HttpOnly are separate and compatible, and HttpOnly cookies are still sent to the server.');

cs.add('advanced', 'guest-cart-id',
	'A guest cart id sits in local storage. When is that acceptable?',
	'When it only names a cart and cannot act as a login',
	['When it is encrypted with a key kept next to the data', 'When the site also sets the HttpOnly flag on it', 'When it is copied into a cookie with SameSite=None'],
	'The risk of a stored value is what it can do if a script reads it. A guest cart id only names a cart, so the harm is small. Encrypting it beside the key, flagging it HttpOnly (impossible for local storage) or copying it into a cookie changes nothing.');

cs.add('advanced', 'credential-home',
	'Where should a login credential live instead of local storage?',
	'In a server session behind an HttpOnly Secure cookie',
	['In a cookie with SameSite=None so vendors can also read it', 'In session storage, which scripts cannot read at all', 'In a hidden field that is posted with every form'],
	'A credential acts as the user, so scripts must not be able to read it. An HttpOnly, Secure cookie holding a session id, or a backend-for-frontend, keeps it out of script reach. Session storage is readable by script and a SameSite=None cookie is for cross-site vendors.');

// ───────────────────────── ap-observability ─────────────────────────
const ob = builder('AP', 'ap-observability');

ob.add('basic', 'request-id',
	'Why does every webhook response carry a request id?',
	'So a failed delivery can be quoted and traced in the logs',
	['So the sender can sign its next request using that same id', 'So the browser can cache each response under that identifier', 'So the cache tags can be purged for the matching request'],
	'The id lets whoever reports a failed delivery quote it, and the team then finds the matching log lines. It plays no part in signing, browser caching or cache purging.');

ob.add('mid', 'log-prefix',
	'What does a log prefix like [PREFIX:requestId] make possible?',
	'One search that follows a single request through every step',
	['Faster requests because logging is skipped on all tagged lines', 'Automatic redaction of secrets from every logged line', 'Sending the logs to the browser for debugging'],
	'A consistent tag with the request id means one grep returns every step of one request and nothing from other requests. It does not speed anything up, redact secrets or ship logs to the browser.');

ob.add('mid', 'shallow-health',
	'What is true of a shallow /health endpoint?',
	'It answers 200 without checking anything behind it',
	['It verifies the database and the cache before answering', 'It returns the full configuration for operators to read', 'It restarts the service when a dependency is down'],
	'A shallow health check only proves the process is up. It does not test dependencies, expose configuration or repair anything. A deep check does the dependency testing and should sit behind protection.');

ob.add('advanced', 'probe-reveals',
	'A public health probe should reveal nothing about configuration. Why?',
	'Anyone can call it, so it should only say that it is healthy',
	['Configuration is always secret and can never be logged anywhere', 'Probes are cached for an hour so details would go stale', 'Load balancers refuse probes that contain a JSON body'],
	'A probe is reachable by anyone who finds the URL, so extra detail helps an attacker and not the operator. The reason is exposure, not caching or load balancer rules, and configuration can be logged safely when it is not secret.');

ob.add('advanced', 'silent-skip',
	'What should a pipeline do when page warming after a purge is switched off?',
	'Log that warming is off rather than skipping it silently',
	['Skip it silently, since a disabled step needs no log message', 'Fail the whole purge so the operator notices at once', 'Warm the pages anyway using a default base address'],
	'When no base address is set, the handler logs that warming is disabled. A silent skip hides a missing setting, failing the purge is too harsh and warming with a guessed address could hit the wrong site.');

// ───────────────────────── ap-review-and-next ─────────────────────────
const rv = builder('AP', 'ap-review-and-next');

rv.add('basic', 'proxy-practice',
	'Which practice keeps the platform token out of the browser?',
	'A same-origin route that calls the platform server-side',
	['Calling the platform API directly from a client component', 'Storing the token in a cookie with SameSite=None set', 'Hiding the token in the page HTML comments instead'],
	'The browser calls a route on the store, and that route adds the token and store address on the server. Direct client calls, cookies and comments all put the token where a script or a visitor can read it.');

rv.add('mid', 'repeated-call',
	'The same same-origin call fired three times per page view. What is the sensible fix?',
	'Fetch it once and share the result across the page',
	['Raise the server timeout so the three calls all finish', 'Add a longer cache header to the browser-side script', 'Move the call into a vendor script so it is hidden'],
	'Three identical calls waste time and load, and each took up to 2 s in dev mode. Fetching once and sharing the result removes the duplicates. A longer timeout, a script cache header or hiding the call in a vendor script do not.');

rv.add('mid', 'blanket-cache',
	'Why can one blanket cache header on all /api routes be a problem?',
	'It also covers error responses and routes that wanted no-store',
	['It turns off caching for static assets such as fonts and images', 'It makes every route slower because the headers are so large', 'It stops cookies from being set on any response from an API route'],
	'A rule on /api/:path* applies to every route under it, including 400 and 401 answers and routes that set their own no-store. It does not affect static assets, response speed or cookies.');

rv.add('advanced', 'fix-first',
	'Which item belongs first in the fix order, and why?',
	'Trim third-party scripts: they have the widest reach into the page',
	['Remove the doubled locale cookie, because it would break every login flow', 'Add a deep health check, because every probe must verify the cache first', 'Unify the not-found handling, because crawlers need one exact status code'],
	'Third-party scripts can read the page and its storage, so trimming and gating them reduces the most risk for the visitor. The doubled cookie, the health check and not-found handling are real but small fixes.');

rv.add('advanced', 'cart-token',
	'A guest cart token is kept in local storage. What is the balanced judgment?',
	'Acceptable as a guest id, but never as a login credential',
	['Unacceptable, because any value in local storage is a leak', 'Fine for logins too, since the origin is the same for all scripts', 'Only acceptable when the token is longer than 64 characters'],
	'What matters is what the value can do if a script reads it. A cart id names a cart, so local storage is acceptable. A login credential must not be readable by script, and token length does not change that.');

export const banks: { out: Question[] }[] = [env, tp, cs, ob, rv];
