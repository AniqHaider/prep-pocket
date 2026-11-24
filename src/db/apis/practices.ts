import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');

// Practices a real online store follows, seen in its API traffic. Names, hosts and ids are changed; the shapes are what was observed.
export const topics: DbTopic[] = [
	// ───────────────────────── Same-origin proxy ─────────────────────────
	{
		id: 'ap-bff-proxy',
		title: 'A same-origin proxy',
		level: 'mid',
		summary: 'See why the browser asks the store\'s own server for data, how the proxy keeps credentials private, and how it guards the URL it builds.',
		scenes: ['ap-proxy-hop', 'ap-proxy-calls', 'ap-handle-guard'],
		notes: md(
			'**What it is.** A same-origin proxy, often called a backend for frontend, is a route on the store\'s own server that the browser calls instead of calling a service directly. In the real traffic the page asks `/api/v1/apps/installed?surface=...` on the store itself. It never calls the apps service.',
			'',
			'**Why.** The apps service needs a storefront token and the store address. Those are credentials, so they stay on the server. The browser only sends what it already has for its own origin, such as cookies. The server adds the credentials, the merchant header and the shopper IP, calls the service, and passes the answer back.',
			'',
			'**Per merchant means not cached.** The route is marked `force-dynamic`: its answer belongs to one merchant, so it must never be cached and served to another shop.',
			'',
			'**It degrades.** If the service cannot be reached, the handler answers with an empty list instead of failing the page. The real call returned `200 {"apps":[]}` in 0.7 to 2.0 seconds in dev mode.',
			'',
			'**Guarding the URL tail.** The nav-menu route is a public proxy to an internal API, so it allows only letters, digits, underscore and hyphen in the handle. `main-menu` returned the menu, `..%2F..%2Fetc` and `a.b%20c` got `400` with `null`, and an unknown but well-formed handle got `200` with `null`.',
			'',
			'**The limit.** A proxy is an extra hop. The page called the apps route three times per page view, and each call took up to two seconds in dev, so calls like that are worth deduplicating or caching.'
		),
		try: [
			{
				label: 'A handle guard and a proxy URL builder',
				code: md(
					'// The nav-menu proxy only lets safe handles through to the internal API.',
					'const SAFE = /^[a-zA-Z0-9_-]+$/;',
					'const known = new Set(["main-menu", "footer"]);',
					'function proxyMenu(rawHandle) {',
					'  const handle = decodeURIComponent(rawHandle);',
					'  if (!SAFE.test(handle)) return { status: 400, body: null };',
					'  // the token and store address are added here, on the server, never in the browser',
					'  const upstream = "https://internal.example/menus/" + handle;',
					'  return known.has(handle) ? { status: 200, upstream } : { status: 200, body: null, upstream };',
					'}',
					'for (const h of ["main-menu", "..%2F..%2Fetc", "a.b%20c", "no-such-menu"]) {',
					'  console.log(h.padEnd(16), JSON.stringify(proxyMenu(h)));',
					'}'
				)
			}
		]
	},

	// ───────────────────────── Signed webhooks ─────────────────────────
	{
		id: 'ap-webhook-security',
		title: 'Signed webhooks',
		level: 'mid',
		summary: 'Follow how a webhook is signed and checked, why the timestamp is inside the signature, and why every refusal looks the same.',
		scenes: ['ap-webhook-sign', 'ap-webhook-verify', 'ap-webhook-responses'],
		notes: md(
			'**What it is.** The platform tells the store when something changed by posting to `/api/webhooks/cache-invalidation`. Anyone on the internet can post there, so the store must know the sender holds the shared secret.',
			'',
			'**The preferred scheme.** The sender computes an HMAC-SHA256 over `<timestamp>.<rawBody>` with the shared secret and sends the hex digest in `x-platform-signature`, with `x-platform-timestamp` and `x-platform-event-id`. The timestamp is inside what is signed, so a recorded request goes stale: the window is about plus or minus five minutes. The event id is the correlation id for logs.',
			'',
			'**One endpoint, two schemes.** Two producers post to the same route and sign differently, so the verifier looks at which headers are present and picks the matching scheme.',
			'',
			'**Fail closed.** Without a secret the route refuses every delivery. Unsigned requests are accepted only when an explicit local-development flag is set.',
			'',
			'**What the real probes showed.** A post with no signature and a post with `sha256=deadbeef` both got `401 {"error":"Invalid signature","requestId":"wh_<uuid>"}`, with only the requestId different. A `PUT` got `405`. A `GET` is a health probe: `{"status":"healthy","timestamp":"<iso>"}`, nothing about configuration.',
			'',
			'**Other answers.** `200` carries the purged tags and paths, `400` means malformed, `413` too large, `500` internal. Every response carries a requestId to quote when reporting a failed delivery.',
			'',
			'**The limit.** A signature proves the sender, not that the event is true or new: keep handlers idempotent.'
		),
		try: [
			{
				label: 'Sign and verify a delivery with a pure-JS HMAC',
				code: md(
					'// Tiny SHA-256 and HMAC (no Web Crypto) so the webhook check can run here.',
					'const primes = [];',
					'for (let n = 2; primes.length < 64; n++) if (primes.every((p) => n % p)) primes.push(n);',
					'const frac = (x) => Math.floor((x - Math.floor(x)) * 4294967296);',
					'const K = primes.map((p) => frac(Math.cbrt(p)));',
					'const rotr = (x, n) => (x >>> n) | (x << (32 - n));',
					'function sha256(bytes) {',
					'  let H = primes.slice(0, 8).map((p) => frac(Math.sqrt(p)));',
					'  const pad = [...bytes, 0x80];',
					'  while (pad.length % 64 !== 56) pad.push(0);',
					'  const bits = bytes.length * 8;',
					'  for (const v of [Math.floor(bits / 4294967296), bits >>> 0]) for (let s = 24; s >= 0; s -= 8) pad.push((v >>> s) & 255);',
					'  for (let o = 0; o < pad.length; o += 64) {',
					'    const w = [];',
					'    for (let i = 0; i < 16; i++) w[i] = (pad[o + 4 * i] << 24) | (pad[o + 4 * i + 1] << 16) | (pad[o + 4 * i + 2] << 8) | pad[o + 4 * i + 3];',
					'    for (let i = 16; i < 64; i++) {',
					'      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);',
					'      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);',
					'      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;',
					'    }',
					'    let [a, b, c, d, e, f, g, h] = H;',
					'    for (let i = 0; i < 64; i++) {',
					'      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;',
					'      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;',
					'      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;',
					'    }',
					'    H = H.map((x, i) => (x + [a, b, c, d, e, f, g, h][i]) | 0);',
					'  }',
					'  return H.flatMap((x) => [x >>> 24, (x >>> 16) & 255, (x >>> 8) & 255, x & 255]);',
					'}',
					'const bytes = (s) => [...unescape(encodeURIComponent(s))].map((c) => c.charCodeAt(0));',
					'function hmac(key, msg) {',
					'  let k = bytes(key);',
					'  if (k.length > 64) k = sha256(k);',
					'  k = [...k, ...new Array(64 - k.length).fill(0)];',
					'  const inner = sha256([...k.map((b) => b ^ 0x36), ...bytes(msg)]);',
					'  return sha256([...k.map((b) => b ^ 0x5c), ...inner]);',
					'}',
					'const hex = (arr) => arr.map((b) => b.toString(16).padStart(2, "0")).join("");',
					'console.log("self-test:", hex(hmac("key", "The quick brown fox jumps over the lazy dog")) === "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8");',
					'',
					'// The receiver: signature over "<timestamp>.<rawBody>", window of 300 seconds. (Real code also compares in constant time.)',
					'const SECRET = "demo-shared-secret";',
					'const WINDOW_SEC = 300;',
					'const REFUSE = { status: 401, error: "Invalid signature" };',
					'function verify(req, nowSec) {',
					'  const { timestamp, signature } = req.headers;',
					'  if (!timestamp || !signature) return REFUSE;',
					'  if (Math.abs(nowSec - Number(timestamp)) > WINDOW_SEC) return REFUSE;',
					'  const expected = hex(hmac(SECRET, timestamp + "." + req.rawBody));',
					'  return expected === signature ? { status: 200 } : REFUSE;',
					'}',
					'const now = 1764000000;',
					'const body = JSON.stringify({ type: "product.updated", data: { handle: "striped-tee" } });',
					'const sign = (ts, raw) => hex(hmac(SECRET, ts + "." + raw));',
					'console.log("good delivery  ", verify({ headers: { timestamp: String(now), signature: sign(now, body) }, rawBody: body }, now + 20));',
					'console.log("tampered body  ", verify({ headers: { timestamp: String(now), signature: sign(now, body) }, rawBody: body + " " }, now + 20));',
					'console.log("replayed later ", verify({ headers: { timestamp: String(now), signature: sign(now, body) }, rawBody: body }, now + 900));',
					'console.log("no signature   ", verify({ headers: {}, rawBody: body }, now));'
				)
			}
		]
	},

	// ───────────────────────── Caching and revalidation ─────────────────────────
	{
		id: 'ap-caching-isr',
		title: 'ISR, tags and purging',
		level: 'mid',
		summary: 'See how pages are cached and refreshed on a schedule, how tags let a webhook purge exactly what changed, and where a blanket header can mislead.',
		scenes: ['ap-isr-flow', 'ap-cache-tags', 'ap-purge-warm', 'ap-cache-headers'],
		notes: md(
			'**ISR.** Home, collection and product pages use incremental static regeneration: `revalidate = 3600`, `dynamicParams = true` and `generateStaticParams`. A page is built once, cached, and refreshed on a schedule. After an hour the next visit still gets the cached page while a fresh render runs in the background. A handle that was not listed ahead of time is rendered on its first request. The real page responses showed `x-nextjs-cache: HIT` and `x-nextjs-prerender: 1`.',
			'',
			'**Tags.** Reads from the platform are cached in the Data Cache with tags: `product:{handle}`, `collection:{handle}`, `collections` and `products`. A webhook event names tags to purge, and a purge only reaches a page if the read that built it carried the same tag. Both sides import the strings from one module, and invariant tests fail if a tag has no event that purges it or if the planner invents a tag.',
			'',
			'**Purge, then warm.** After a purge the handler pre-renders created or updated pages, so the first real visitor gets a hit instead of a cold render. If no base address is configured, it logs that warming is disabled rather than skipping silently.',
			'',
			'**Why no shopper header on a cached fetch.** The fetch cache keys on request headers, so a per-shopper header would store one entry per IP. The shopper-IP lesson covers it.',
			'',
			'**Check the headers that arrive.** In dev mode pages said `no-store, must-revalidate`. Every `/api/*` answer, including `400` and `401`, carried `public, max-age=0, s-maxage=600, stale-while-revalidate=3600` from one blanket rule in the config. A config-level header rule wins over what a route handler sets, so look at what really arrives and scope the rule to routes that want it.'
		),
		try: [
			{
				label: 'Which tags does an event purge (simplified rules)',
				code: md(
					'// Simplified rules for teaching: an event names the cache tags to purge.',
					'function planPurge(event) {',
					'  const [entity, action] = event.type.split(".");',
					'  const tags = [];',
					'  if (entity === "product") {',
					'    tags.push("product:" + event.data.handle);',
					'    if (action !== "updated") tags.push("products"); // a created or deleted item changes the lists',
					'  }',
					'  if (entity === "collection") {',
					'    tags.push("collection:" + event.data.handle);',
					'    if (action !== "updated") tags.push("collections");',
					'  }',
					'  return tags;',
					'}',
					'// Each cached read attached tags when it was made.',
					'const reads = [',
					'  { page: "/products/striped-tee", tags: ["product:striped-tee"] },',
					'  { page: "/products/linen-shirt", tags: ["product:linen-shirt"] },',
					'  { page: "/collections/all", tags: ["collection:all", "products"] },',
					'];',
					'const events = [',
					'  { type: "product.updated", data: { handle: "striped-tee" } },',
					'  { type: "product.created", data: { handle: "new-hat" } },',
					'  { type: "collection.updated", data: { handle: "all" } },',
					'];',
					'for (const ev of events) {',
					'  const tags = planPurge(ev);',
					'  const stale = reads.filter((r) => r.tags.some((t) => tags.includes(t))).map((r) => r.page);',
					'  console.log(ev.type.padEnd(18), "purge", JSON.stringify(tags), "-> stale pages", JSON.stringify(stale));',
					'}'
				)
			}
		]
	},

	// ───────────────────────── Shopper IP and rate limits ─────────────────────────
	{
		id: 'ap-shopper-ip-rate-limits',
		title: 'Shopper IPs and rate limits',
		level: 'advanced',
		summary: 'Understand why a server forwards the shopper\'s IP, which address in x-forwarded-for can be trusted, and how a 429 is treated.',
		scenes: ['ap-shopper-why', 'ap-xff-trust', 'ap-uncached-only'],
		notes: md(
			'**The problem.** The platform gateway rate-limits per shopper IP and per merchant. When the store server calls the platform for a shopper, every call comes from the one server. Unless the call says who the shopper is, all shoppers look like one client and share one limit.',
			'',
			'**The fix.** Calls made for a shopper forward the shopper IP as `x-forwarded-for`. The apps route does this on its uncached call, once per page view.',
			'',
			'**Which address.** The header lists addresses as a request passes proxies, and the shopper can write anything in it. The right-most entry was appended by the load balancer the server trusts, so that is the one that is read. The number of trusted hops is configurable and is one by default. A client port is stripped. `cf-connecting-ip`, `true-client-ip` and `x-real-ip` come from the shopper and are ignored.',
			'',
			'**Uncached fetches only.** Next keys its fetch cache on request headers. A per-shopper header on a cached fetch would store one entry per IP and the cache would stop helping. ISR renders send no shopper IP.',
			'',
			'**A 429 is an outage.** A gateway `429` counts as backend unavailable, like a `5xx`. The read returns `success: false` instead of "not found", so a page keeps its last good copy. For the same reason static generation at build time can run with lower concurrency: a `429` fails one page render and ISR keeps the previous page.',
			'',
			'**The limit.** This trusts the load balancer. If the number of trusted hops is set wrong, the wrong address is used.'
		),
		try: [
			{
				label: 'Read the shopper IP from x-forwarded-for',
				code: md(
					'// Read the entry the trusted proxy appended: right-most with one hop, second from the right with two.',
					'function getShopperIp(headers, trustedHops = 1) {',
					'  const parts = (headers["x-forwarded-for"] || "").split(",").map((s) => s.trim()).filter(Boolean);',
					'  if (parts.length < trustedHops) return "";',
					'  let ip = parts[parts.length - trustedHops];',
					'  if (ip.startsWith("[")) ip = ip.slice(1, ip.indexOf("]")); // [::1]:443',
					'  else if (/^\\d+\\.\\d+\\.\\d+\\.\\d+:\\d+$/.test(ip)) ip = ip.split(":")[0]; // 203.0.113.7:51234',
					'  return ip;',
					'}',
					'const cases = [',
					'  ["spoofed left entry", { "x-forwarded-for": "10.0.0.1, 203.0.113.7" }, 1],',
					'  ["port stripped", { "x-forwarded-for": "203.0.113.7:51234" }, 1],',
					'  ["shopper-set header ignored", { "x-forwarded-for": "203.0.113.7", "cf-connecting-ip": "10.9.9.9" }, 1],',
					'  ["two trusted hops", { "x-forwarded-for": "198.51.100.4, 203.0.113.7, 192.0.2.1" }, 2],',
					'  ["no header", {}, 1],',
					'];',
					'for (const [label, headers, hops] of cases) {',
					'  console.log(label.padEnd(28), JSON.stringify(getShopperIp(headers, hops)));',
					'}'
				)
			}
		]
	},

	// ───────────────────────── Failing soft ─────────────────────────
	{
		id: 'ap-fail-soft',
		title: 'Failing soft, and saying so',
		level: 'mid',
		summary: 'See where the store degrades on purpose, and the bug a silent fallback hid, so you log what you swallow.',
		scenes: ['ap-soft-defaults', 'ap-silent-bug', 'ap-log-swallowed'],
		notes: md(
			'**Degrading on purpose.** Several parts of the store return a default instead of failing the page. The apps route turns an unreachable service into `{"apps":[]}`. An unknown nav-menu handle is `null`. An optional configuration call to a session backend answered `404` with `cache-control: public, max-age=300, stale-while-revalidate=86400`, and the page worked. With the tracker scripts blocked, 16 loads over four page views, every page still rendered.',
			'',
			'**Why it is right.** An optional feature must not take the store down. A missing apps list or a blocked tracker is a small loss, a failed page is a lost sale.',
			'',
			'**The cost, written in a code comment.** A merchant id existed under two names, a public one and a server-only one, and the example env file ships the server-only one empty. An operator set only the public one. The server sent an empty merchant header, the platform answered `400`, and because the handler degrades when the service fails, the page showed no apps and nothing anywhere showed an error.',
			'',
			'**Two fixes in the code.** An env var that is present but empty is the empty string, and `??` only falls back on `undefined`, so `||` is used. And the route accepts either name.',
			'',
			'**The lesson.** Degrade for the visitor, but log what you swallow: a label, the status and the error, once per kind so a failing service does not flood the logs. A logged `400` would have shown that bug on the first day.'
		),
		try: [
			{
				label: 'A fallback that degrades but logs once',
				code: md(
					'// Return a default for the visitor, but say what was swallowed, once per kind.',
					'const seen = new Set();',
					'function warnOnce(label, err) {',
					'  if (seen.has(label)) return;',
					'  seen.add(label);',
					'  console.log("[warn]", label, "->", err.message);',
					'}',
					'async function soft(label, fn, fallback) {',
					'  try {',
					'    return await fn();',
					'  } catch (e) {',
					'    warnOnce(label, e);',
					'    return fallback;',
					'  }',
					'}',
					'const failing = async () => { throw new Error("400 from upstream (empty merchant header)"); };',
					'const working = async () => ({ apps: ["bundle-offer"] });',
					'(async () => {',
					'  for (let i = 1; i <= 3; i++) console.log("call", i, JSON.stringify(await soft("apps-installed", failing, { apps: [] })));',
					'  console.log("healthy call", JSON.stringify(await soft("apps-installed", working, { apps: [] })));',
					'})();'
				)
			}
		]
	}
];

// ───────────────────────── Quiz ─────────────────────────
const t = (topic: string) => builder('AP', topic);

const bf = t('ap-bff-proxy');
bf.add('basic', 'credentials',
	'Why does the store page call /api/v1/apps/installed on its own server instead of calling the apps service directly?',
	'The storefront token and store address are credentials that must stay on the server',
	['The browser is not able to make requests to any other origin, so every call has to go through the store server first',
	 'The apps service only answers requests that arrive from the same origin as the page',
	 'It removes one DNS lookup from every page view'],
	'A same-origin proxy keeps the token and the store address on the server and adds them there. Browsers can call other origins (subject to CORS), the apps service is not described as same-origin only, and saving a DNS lookup is not the reason.');
bf.add('mid', 'force-dynamic',
	'The apps route is marked force-dynamic. Why?',
	'Its answer is per merchant, so it must not be cached and served to another shop',
	['Next.js cannot cache route handlers at all, so the setting only documents what already happens',
	 'It needs a longer timeout than a cached route gets, because the upstream is slow',
	 'It must run in the visitor\'s browser, not on the server'],
	'The answer belongs to one merchant. Caching it could hand one shop\'s data to another, so the route opts out of caching. Next.js can cache route handlers, timeouts are unrelated, and the route runs on the server.');
bf.add('mid', 'url-tail',
	'The nav-menu route allows only letters, digits, underscore and hyphen in the handle. Which risk does that remove?',
	'A crafted handle reaching other paths of the internal API through the URL tail',
	['Two different menus ending up with the same cache entry and showing each other\'s links',
	 'Slow pages caused by very long menu names',
	 'Visitors being able to see which menus exist'],
	'A public proxy that glues a visitor-chosen handle into an upstream URL can be pushed into path traversal or server-side request forgery. Restricting the charset closes that. It does not address cache sharing, name length or discovery of menus.');
bf.add('mid', 'real-calls',
	'In the real calls, which answers did the nav-menu route give to main-menu, to ..%2F..%2Fetc, and to a well-formed handle with no menu?',
	'200 with the menu, 400 with null, and 200 with null',
	['200 with the menu, 404 with null, and 404 with null for the well-formed handle',
	 '200 with the menu, 500 with an error body, and 200 with an empty list',
	 '400 with null for all three'],
	'The route served main-menu, refused the traversal-looking handle with 400 and a null body before any upstream call, and answered 200 with null for an unknown but safe handle, because it documents that unknown means null.');
bf.add('advanced', 'degrade',
	'The apps route answers 200 with an empty list when the service cannot be reached. What is the main price of that choice?',
	'A real failure can hide behind it unless the handler logs what it swallowed',
	['Visitors see an error page whenever the service is slow or the call times out',
	 'The empty list is cached for a year and shared with other shops',
	 'The browser must hold the token so it can retry the call itself'],
	'Degrading keeps the page working, which is the point, but it removes the visible symptom. Without a log line a misconfiguration looks like "no apps". The other options contradict how the route behaves: no error page, no long cache, no token in the browser.');

const wh = t('ap-webhook-security');
wh.add('basic', 'signed-string',
	'In the preferred webhook scheme, what does the sender run HMAC-SHA256 over?',
	'The timestamp, a dot, and the raw body',
	['The event id alone, so it can be quoted in support requests',
	 'The destination URL together with the HTTP method',
	 'The JSON body after it has been parsed and printed again in a standard layout'],
	'The signed string is timestamp, a dot, then the exact raw bytes of the body. A re-formatted body could differ byte for byte and fail the check, and the URL, method and event id are not what is signed.');
wh.add('mid', 'replay',
	'Why does the timestamp sit inside the signed string?',
	'A recorded request goes stale, because the window of about five minutes expires',
	['It lets the receiver sort deliveries into the exact order in which they were sent',
	 'It makes the digest shorter and cheaper to compare',
	 'It proves which of the sender\'s servers made the request'],
	'If the timestamp were only a header, an attacker could replay a captured body with a fresh time. Signing it ties the signature to the moment, so an old request fails the freshness check. Ordering, digest length and server identity are not what it does.');
wh.add('mid', 'identical-401',
	'A post with no signature and a post with a made-up signature both got the same 401 body shape. What does that give a caller?',
	'Nothing about how close the guess was',
	['A hint about which of the headers is missing from the request',
	 'The length of the real shared secret and its character set',
	 'A retry-after time telling it when to try again'],
	'Both answers were 401 with "Invalid signature" and only a different requestId, so unsigned and badly signed requests look the same. A more talkative error would help someone probing the endpoint.');
wh.add('mid', 'fail-closed',
	'What does the webhook route do when no shared secret is configured?',
	'It refuses every delivery, unless an explicit local-development flag allows unsigned ones',
	['It accepts every delivery, so that no event is lost while the missing secret gets fixed later',
	 'It queues deliveries until a secret is set',
	 'It accepts only deliveries whose IP address it has seen before'],
	'The route fails closed: no secret means no way to verify, so it refuses. Only an explicit flag meant for local development relaxes that. Accepting everything would turn a missing setting into an open door.');
wh.add('advanced', 'correlation',
	'What are the requestId in every response and the x-platform-event-id header for?',
	'The requestId is quoted when reporting a failed delivery; the event id is the correlation id',
	['Both are secrets that prove the sender is genuine, which is why they are sent in every request',
	 'The requestId is the signature and the event id is the timestamp',
	 'They let the receiver skip verification on a retry'],
	'They are for tracing, not security. A requestId in each response lets sender and receiver find the same delivery in their logs, and the event id identifies the delivery on the sending side. Verification still runs on every request.');

const ca = t('ap-caching-isr');
ca.add('basic', 'revalidate',
	'With revalidate = 3600, what happens to the first visit after the hour has passed?',
	'It still gets the cached page while a fresh render runs in the background',
	['It waits while the page is rendered again from scratch and then gets the new version',
	 'It gets a 404 until the page has been rebuilt',
	 'It is redirected to the platform API'],
	'ISR serves the cached page and refreshes it in the background, so the visitor never waits for a render. Data can be up to an hour old unless a webhook purge makes it fresher sooner.');
ca.add('mid', 'dynamic-params',
	'What does dynamicParams = true allow on a product page?',
	'A handle not listed by generateStaticParams is rendered on its first request',
	['The page may change its own URL at run time',
	 'Handles may contain any characters, including slashes and spaces, without any validation',
	 'The cache may ignore the revalidate setting'],
	'generateStaticParams builds known handles ahead of time. With dynamicParams = true a handle that was not listed is rendered when first requested instead of failing. It does not change URLs, character rules or revalidation.');
ca.add('mid', 'tags',
	'Why must the read side and the purge side use the same tag strings?',
	'A purge only reaches a page if the read that built it carried the same tag',
	['Tags are encrypted with a key that both the read side and the purge side share',
	 'The platform refuses a tag it has not seen before',
	 'Shorter tags are faster for the cache to compare'],
	'The contract is two-sided. A read attaches a tag, an event names a tag, and the purge matches them by string. Both import the strings from one module, and invariant tests catch a tag with no purging event.');
ca.add('mid', 'warming',
	'After a purge, why does the handler pre-render the created or updated pages?',
	'So the first real visitor gets a cache hit instead of a cold render',
	['To check that the webhook signature was valid before the event is written to the logs',
	 'To tell the platform which pages exist',
	 'To free memory used by the old pages'],
	'A purge empties the entries. Without warming, the first visitor pays for the render. Pre-rendering fills the cache first. If no base address is configured the handler logs that warming is disabled.');
ca.add('advanced', 'blanket-header',
	'Every /api/ answer, including 400 and 401, carried the same public s-maxage header. What does that show?',
	'One blanket rule in the config can override what a route sets, so check the headers that arrive',
	['Browsers always keep every error answer for ten minutes, whatever headers the server sends with it',
	 'All the routes call the same upstream service',
	 'The server ignores the Cache-Control that browsers send'],
	'The rule was set once in the framework config for every /api/ path, and a config header rule wins over what a route handler sets. The lesson is to compare what really arrives with the intent and to scope blanket rules.');

const ip = t('ap-shopper-ip-rate-limits');
ip.add('basic', 'why-ip',
	'Why does the server forward the shopper\'s IP when it calls the platform for a shopper?',
	'So rate limits count each shopper, not the one server',
	['So the platform can show prices in the currency that suits the shopper',
	 'Because the platform rejects any request that has no IP header',
	 'So the server does not need an address of its own'],
	'The gateway rate-limits per shopper IP and per merchant. Without the forwarded IP every shopper looks like the one store server and they all share one limit. The other options invent behaviors.');
ip.add('mid', 'rightmost',
	'The header says x-forwarded-for: 10.0.0.1, 203.0.113.7, with one trusted hop. Which address is used?',
	'203.0.113.7, the right-most entry appended by the trusted load balancer',
	['10.0.0.1, because the first entry in the header is always the original client',
	 'Both, joined into one string',
	 'Neither: the cf-connecting-ip header is used instead'],
	'The shopper can write anything on the left of the header. The right-most entry is the one the trusted load balancer added, so with one trusted hop that is the address to use. Client-set headers such as cf-connecting-ip are ignored.');
ip.add('mid', 'ignored-headers',
	'Why are cf-connecting-ip, true-client-ip and x-real-ip ignored?',
	'They come from the shopper, so they prove nothing',
	['They were removed from the HTTP standard and no longer mean anything',
	 'They are only sent by mobile browsers',
	 'They are always empty behind a load balancer'],
	'Any header a client can set can be forged. Only the entry that the trusted proxy appends can be relied on, so the other client-address headers are not used.');
ip.add('advanced', 'uncached',
	'Why is the shopper IP sent only on uncached fetches?',
	'The fetch cache keys on request headers, so a per-shopper header would make one entry per IP',
	['Cached fetches cannot carry request headers at all, so the header would simply be dropped on the way',
	 'An IP address must not be stored for more than an hour',
	 'The platform ignores the header on cached routes'],
	'Next builds the key of a cached fetch from the URL and the request headers. A different IP per shopper means a different key per shopper, so the cache fills with near-duplicates. ISR renders therefore send no shopper IP.');
ip.add('advanced', 'rate-limit',
	'The gateway answers 429. How does the data layer treat it, and what does the page do?',
	'Like a 5xx: the read reports failure and the page keeps its last good copy',
	['As not found: the read says the product does not exist and the page shows a 404',
	 'As success with an empty catalog',
	 'As a redirect to checkout'],
	'A 429 counts as backend unavailable, so the read returns success false instead of not found. That is why a throttled render fails and ISR keeps the previous page, rather than showing an empty catalog.');

const fs = t('ap-fail-soft');
fs.add('basic', 'optional-call',
	'An optional configuration call answered 404 during the run. What did the page do?',
	'It loaded and worked normally',
	['It showed an error banner and stopped',
	 'It retried until the call succeeded',
	 'It waited for the call before showing anything'],
	'The 404 came from an optional service. The page tolerated it, which is the point of failing soft: an optional feature must not take the store down.');
fs.add('mid', 'why-soft',
	'Why is an empty list a better answer than a crash for the apps route?',
	'The store keeps working without its optional apps',
	['Empty lists are cached for longer than full lists, which saves upstream calls',
	 'The platform requires every route to return a list',
	 'It makes the failure invisible to the team on purpose'],
	'An optional feature should not cost a sale. Showing no apps is a small loss, while failing the page is a large one. Hiding the failure from the team is a side effect to manage with logging, not a goal.');
fs.add('mid', 'silent-bug',
	'What went wrong in the empty merchant header bug?',
	'An empty variable produced an empty header, the platform answered 400, and the fallback hid it',
	['The platform rate-limited the store for sending too many calls in one page view and blocked it',
	 'The cache served another shop\'s menu',
	 'The webhook signature expired during delivery'],
	'The merchant id lived under two names, only the public one was set, the server one stayed empty, the platform replied 400, and the handler degraded to an empty list, so nothing showed an error.');
fs.add('mid', 'empty-env',
	'An env var is present but empty. Why does || rescue it while ?? does not?',
	'?? falls back only on undefined, while || also falls back on the empty string',
	['|| is evaluated at build time and ?? at run time, so the empty value is already baked in',
	 '?? throws an error when it sees an empty string',
	 '|| turns the value into a number first'],
	'A variable set to nothing is the empty string, which is not undefined. ?? keeps it, || replaces it. The code comment explains that copying the example env produced an empty merchant id for this reason.');
fs.add('advanced', 'log-swallowed',
	'How should a fallback that swallows errors be written?',
	'Return the default and log what was swallowed, once per kind',
	['Return the default and log nothing at all, to keep the logs quiet and cheap',
	 'Return the default and then throw the error anyway',
	 'Log every request in full, including secrets, for later study'],
	'Degrade for the visitor, be loud for the team. One line with a label, the status and the error, logged once per kind, shows a misconfiguration without flooding the logs. Logging secrets is never right.');

export const banks: { out: Question[] }[] = [bf, wh, ca, ip, fs];
