import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');

// Reading a real online store's API traffic. The store was run locally and browsed like a visitor; names, hosts, ids and handles are changed,
// the shapes (paths, methods, statuses, headers, counts) are what was observed.
export const topics: DbTopic[] = [
	// ───────────────────────── ap-store-map ─────────────────────────
	{
		id: 'ap-store-map',
		title: 'The store on one page',
		level: 'basic',
		summary: 'See every party in a real online store’s traffic: the browser, the store’s server, the platform’s APIs, vendor scripts and the caches.',
		scenes: ['ap-system-map', 'ap-lanes-key'],
		notes: md(
			'**A note first.** These lessons describe a real online store that was run on a computer and browsed like a visitor. Its name, the platform it runs on, and every host, id and product handle were changed. The paths, methods, statuses, headers and counts are what was observed. Tracker scripts and every write request were blocked, so nothing was sent to real analytics or carts.',
			'',
			'**The parties.**',
			'',
			'- **The browser** loads a page, then keeps calling APIs while the visitor looks around.',
			'- **The store’s own server** is a Next.js app. It renders pages (many are cached and refreshed on a schedule, called ISR), answers a few same-origin `/api` routes, and runs middleware for language and A/B tests.',
			'- **The platform’s APIs** hold the data: catalog, search, cart, reviews, discounts, recommendations and an apps service.',
			'- **Vendor scripts** add login, checkout and advertising, and send events to an analytics collector.',
			'- **Caches** sit in between: the server’s Data Cache keeps reads by tag, and finished pages are reused until they are revalidated.',
			'- **Webhooks** run the other way: the platform calls the store when something changes.',
			'',
			'**Why a map first.** Reading traffic without a map gives a pile of URLs. With one, every request has an owner and a reason. For each call the next lessons ask: who makes it, where does it go, and why there?',
			'',
			'**What to take from it.** A modern storefront is not “a page and an API”. It has several callers and several lanes, and good design decides which lane each call belongs in.'
		)
	},

	// ───────────────────────── ap-server-vs-browser ─────────────────────────
	{
		id: 'ap-server-vs-browser',
		title: 'Server, browser or proxy',
		level: 'basic',
		summary: 'Decide where a call should live: on the server while rendering, in the browser, or behind a same-origin proxy route.',
		scenes: ['ap-server-reads', 'ap-browser-direct', 'ap-where-it-lives'],
		try: [
			{
				label: 'Pick a lane for a call',
				code: md(
					'// Pick a lane for a call from four yes/no questions.',
					'function lane({ needsSecret, perShopper, cacheable, corsOk }) {',
					"  if (needsSecret) return perShopper || !cacheable ? 'proxy' : 'server';",
					"  if (!perShopper && cacheable) return 'server';",
					"  return corsOk ? 'browser' : 'proxy';",
					'}',
					'const calls = [',
					"  ['catalog read', { needsSecret: false, perShopper: false, cacheable: true, corsOk: false }],",
					"  ['cart', { needsSecret: false, perShopper: true, cacheable: false, corsOk: true }],",
					"  ['reviews', { needsSecret: false, perShopper: false, cacheable: false, corsOk: true }],",
					"  ['apps list', { needsSecret: true, perShopper: false, cacheable: false, corsOk: false }],",
					"  ['search', { needsSecret: false, perShopper: true, cacheable: false, corsOk: true }],",
					'];',
					"for (const [name, q] of calls) console.log(name.padEnd(13), '->', lane(q));"
				)
			}
		],
		notes: md(
			'**Three lanes, one rule.** Every call a storefront makes lives in one of three lanes, and the choice is about secrets, people and caching, not taste.',
			'',
			'- **Server reads.** While rendering a page, the server asks the platform’s catalog API. It sends a merchant id header, keeps the answer in its Data Cache under tags such as `product:<handle>`, and one fetch can serve many visitors. Tags also let a webhook purge exactly what changed. Secrets stay on the server, and these calls never show in the browser’s network panel.',
			'- **Browser-direct.** The cart, reviews, search and recommendations are fetched by the page itself, because they depend on the visitor or must be live. The platform allows it with CORS: its answer to the cart call echoed the exact page origin in `access-control-allow-origin` (an allow-list), while the recommendations call answered `*`.',
			'- **Same-origin proxy.** Some calls need a credential or the store’s own address. The page calls the store’s `/api/v1/apps/installed`, and the server makes the real call, so the token never reaches the browser.',
			'',
			'**A quick test.** Does the call need a secret? Use the server or a proxy. Is it the same for everybody and cacheable? The server, with a tag. Is it personal or live and safe to expose? The browser, if the API’s CORS allows it.',
			'',
			'**Trade-off.** Browser-direct calls are quick to build, but they expose the API’s shape and depend on its CORS rules. A proxy hides credentials but adds a hop, which the timings later in this section show.'
		)
	},

	// ───────────────────────── ap-own-routes ─────────────────────────
	{
		id: 'ap-own-routes',
		title: 'The store’s own routes',
		level: 'mid',
		summary: 'Call the store’s own routes by hand and read what each answer promises: health, menus, the apps list, and refused requests.',
		scenes: ['ap-own-health', 'ap-own-nav-apps', 'ap-own-refusals'],
		try: [
			{
				label: 'Read the verdict of each response',
				code: md(
					'function verdict(status, body) {',
					'  let data;',
					'  try { data = JSON.parse(body); } catch { data = undefined; }',
					"  if (status === 405) return 'wrong method for this route';",
					"  if (status === 401) return 'refused: ' + (data && data.error ? data.error : 'not signed');",
					"  if (status === 400) return 'rejected the input';",
					"  if (status === 200 && data === null) return 'ok, but nothing found';",
					"  if (status === 200 && data && data.success === true && data.data === null) return 'ok, shallow: checks nothing behind it';",
					"  if (status === 200) return 'ok, has data';",
					"  return 'unexpected ' + status;",
					'}',
					'const seen = [',
					"  ['GET /health', 200, '{\"success\":true,\"data\":null}'],",
					"  ['GET /api/nav-menu/..%2F..%2Fetc', 400, 'null'],",
					"  ['GET /api/nav-menu/no-such-menu', 200, 'null'],",
					"  ['POST /api/webhooks/cache-invalidation', 401, '{\"error\":\"Invalid signature\",\"requestId\":\"wh_1\"}'],",
					"  ['GET /api/data-source-options', 405, ''],",
					"  ['GET /api/v1/apps/installed', 200, '{\"apps\":[]}'],",
					'];',
					"for (const [req, s, b] of seen) console.log(req.padEnd(40), s, verdict(s, b));"
				)
			}
		],
		notes: md(
			'**Try the store’s own doors.** Besides pages, the store has a few routes under `/api` and a health check. Calling them by hand with curl shows what each one promises.',
			'',
			'- `GET /health` answers 200 with `{"success":true,"data":null}`. It checks nothing behind it, so it only says the server process is up.',
			'- `GET /api/webhooks/cache-invalidation` is a probe that answers `{"status":"healthy","timestamp":...}` and reveals nothing about configuration.',
			'- `GET /api/nav-menu/<handle>` proxies a menu from the platform. A known handle gives 200 with the menu JSON. Characters outside letters, digits, underscore and hyphen give 400 with `null`. An unknown but well-formed handle gives 200 with `null`.',
			'- `GET /api/v1/apps/installed` gave `{"apps":[]}` in 0.7 to 2.0 seconds in dev mode, because the server asks the apps service on every call.',
			'- `GET /api/data-source-options` gave 405: that route only handles POST.',
			'- `POST /api/webhooks/cache-invalidation` with no signature, or with `x-webhook-signature: sha256=deadbeef`, gave 401 `{"error":"Invalid signature","requestId":"wh_<uuid>"}`. A `PUT` to the same route gave 405.',
			'',
			'**What the answers teach.** The menu route validates its input before it forwards anything, because it is a public door into an internal API. The webhook refuses unsigned and badly signed requests the same way, so a caller learns nothing about how close it was, and every answer carries a request id to quote when reporting a failure. And each route chose its own answer for “not found”, which the status and header lessons come back to.'
		)
	},

	// ───────────────────────── ap-page-load-calls ─────────────────────────
	{
		id: 'ap-page-load-calls',
		title: 'What one page view does',
		level: 'mid',
		summary: 'Count the calls behind a single page view, and see which ones the browser makes itself, which repeat, and which fail without harm.',
		scenes: ['ap-pageview-counts', 'ap-apps-three-times', 'ap-direct-calls', 'ap-optional-404'],
		try: [
			{
				label: 'Group a request log by host',
				code: md(
					'const log = [',
					"  ['store.test', 'GET', 200], ['store.test', 'GET', 200], ['store.test', 'GET', 200],",
					"  ['api.platform.test', 'GET', 200], ['api.platform.test', 'GET', 200], ['search.platform.test', 'GET', 200],",
					"  ['scripts.vendor.test', 'GET', 200], ['scripts.vendor.test', 'GET', 200],",
					"  ['analytics.example', 'POST', 0], ['pixel.example', 'GET', 0],",
					'];',
					"const kind = (host, method) => host === 'store.test' ? 'store itself'",
					"  : host.endsWith('platform.test') ? 'platform API'",
					"  : host.startsWith('scripts.') ? 'vendor scripts'",
					"  : method === 'POST' ? 'analytics write' : 'tracker';",
					'const counts = {};',
					'for (const [host, method] of log) { const k = kind(host, method); counts[k] = (counts[k] || 0) + 1; }',
					'console.log(counts);',
					'const blocked = log.filter(([, , status]) => status === 0).length;',
					"console.log('blocked by the test:', blocked, 'of', log.length);"
				)
			}
		],
		notes: md(
			'**What one page view really does.** A Chrome session visited four pages as a visitor: home, collection, product and search. Each page showed the same shape.',
			'',
			'- **9 requests to the store itself** (documents and same-origin API calls, not counting static assets), of which **3 were the same `/api/v1/apps/installed` call**. Over four pages that was 12 calls, each taking 0.7 to 2.0 seconds in dev mode.',
			'- **16 to 21 successful calls to outside hosts**, spread over **9 or 10 hosts**: platform APIs, vendor scripts for login and checkout, a translation widget and a pixel library.',
			'- **4 tracker script loads and 4 or 5 write requests** that the test blocked. The writes were POSTs: discount lookups with a 93 byte body, activity pings with a 101 byte body, and analytics batches of 1.5 to 9 KB.',
			'',
			'**Browser-direct calls.** The cart, the two review calls and the search call all carried a merchant id header and got the page origin back in `access-control-allow-origin`. The recommendations calls answered `*`.',
			'',
			'**A 404 that did not matter.** An optional SDK-config call returned 404 with `public, max-age=300, stale-while-revalidate=86400`, and the page worked anyway: its caller treats the call as optional, and even the failure is cached for five minutes.',
			'',
			'**What to take from it.** Counting is the first review step. Duplicate calls, many hosts and writes on page load are visible before you read any code.'
		)
	},

	// ───────────────────────── ap-status-and-headers ─────────────────────────
	{
		id: 'ap-status-and-headers',
		title: 'Statuses and headers seen',
		level: 'mid',
		summary: 'Read the statuses, cache headers, cookies and CORS answers the store really sent, and why “unknown” is answered differently by each layer.',
		scenes: ['ap-status-table', 'ap-header-shapes'],
		notes: md(
			'**Status lines.** Across pages and routes, five statuses showed up: 200, 400, 401, 404 and 405. Each layer used them in its own way.',
			'',
			'- A known product page is 200. An **unknown product** page is also status 200, with a not-found body and `<meta name="robots" content="noindex">`, because the page streams before it knows the product is missing. The noindex keeps it out of search results.',
			'- An **unknown route** is a true 404 with the store’s own not-found page.',
			'- An **unknown nav menu** is 200 with `null`, a **malformed handle** is 400 with `null`, an **unsigned webhook** is 401, and a **wrong method** on a route is 405.',
			'',
			'**Headers.** In dev mode pages carried `cache-control: no-store, must-revalidate`. Every `/api` response, errors included, carried `public, max-age=0, s-maxage=600, stale-while-revalidate=3600` from one blanket rule. Every response had `content-security-policy: frame-ancestors ...` (only that directive) and a `vary` list for the framework’s router. Pages set a `locale` cookie with `Path=/; Max-Age=31536000; SameSite=lax`.',
			'',
			'**CORS answers.** Platform APIs that the browser called directly answered with the page origin (an allow-list) or `*` (public data).',
			'',
			'**Why “unknown” differs.** Different layers decide: the framework page, the proxy route, the router. Clients are easier to write when one rule covers them all, so check which rule each route really applies instead of assuming.'
		)
	}
];

// ───────────────────────── questions ─────────────────────────
const t = (topic: string) => builder('AP', topic);

const sm = t('ap-store-map');
sm.add('basic', 'parties',
	'In this store, which party renders the pages and answers a few same-origin /api routes?',
	'The store’s own Next.js server',
	['The commerce platform’s catalog API', 'A vendor script host', 'The analytics collector'],
	'The store runs its own Next.js server, which renders pages (many cached as ISR) and answers routes such as /api/nav-menu. The platform’s APIs hold the data, vendor scripts add login and ads, and the collector only receives events.');
sm.add('basic', 'webhook-direction',
	'In which direction does a webhook travel here?',
	'From the platform to the store, when something changes',
	['From the browser to the platform on every page view', 'From the store to the analytics collector after each order', 'From a vendor script to the visitor’s browser'],
	'A webhook is the platform calling the store, for example when a product changes, so that the store can purge the matching cache entries. Calls the browser or the store make to the platform are ordinary requests, not webhooks.');
sm.add('basic', 'caches',
	'Which of these is a cache in the picture?',
	'The server’s Data Cache, which keeps reads by tag',
	['The cart API, which stores the visitor’s items between page views', 'The search API, which indexes the catalog', 'The login widget, which keeps the user signed in'],
	'The Data Cache keeps platform reads so that one fetch can serve many visitors, and finished pages are reused until revalidated. The cart, the search index and the login widget hold real state or data, which is a different job from caching.');
sm.add('mid', 'anonymity',
	'What was changed in these lessons, and what is real?',
	'Names, hosts, ids and handles were changed; paths, statuses, headers and counts are real',
	['Everything was invented to look like a real store', 'Only the counts were changed to keep the traffic private, while every name and path stayed as it was', 'Names are real but the statuses were made up'],
	'The store is a real one that was run locally, and it must not be identifiable, so names, hosts, ids and handles were changed. What the lessons teach comes from the shapes that were observed: paths, methods, statuses, headers and counts.');
sm.add('mid', 'blocking',
	'Why were tracker scripts and write requests blocked during the run?',
	'So that browsing a real store from a laptop sent nothing to its analytics or carts',
	['Because the store refuses requests that carry cookies', 'Because blocking makes the pages load faster to measure', 'Because the platform’s API only answers read requests when they come from a browser and not from a script'],
	'The test was a read-only visit to a live store. Blocking trackers and every POST, PUT and DELETE meant no events reached real analytics and nothing was written to real carts, while the attempts were still recorded in the log.');

const sb = t('ap-server-vs-browser');
sb.add('basic', 'secret',
	'A call needs a secret token and gives the same answer to every visitor. Where should it live?',
	'On the server, so the token never reaches the browser',
	['In the browser, protected by CORS', 'In a vendor script that holds the token on behalf of the page and calls the platform', 'In localStorage next to the cart token'],
	'Anything shipped to the browser can be read there, and CORS is a rule about reading answers, not a lock on a token. A call that needs a secret and is the same for everyone belongs on the server, where it can also be cached by tag.');
sb.add('basic', 'proxy',
	'Why does the page call the store’s own /api/v1/apps/installed instead of the apps service directly?',
	'The token and the service address must stay on the server',
	['Same-origin calls are always faster than cross-origin ones', 'Browsers are not allowed to send GET requests to other sites', 'The page needs the answer before it can load any scripts'],
	'The proxy route holds the storefront token and the service address, so the browser never sees them. Speed is not the reason: the proxy adds a hop, and the timings in this section show it taking up to two seconds in dev mode.');
sb.add('mid', 'cors-echo',
	'The cart call’s answer had access-control-allow-origin set to the page’s own origin. What does that suggest?',
	'The platform keeps an allow-list and echoes back an origin it accepts',
	['The platform answered every origin with a wildcard', 'The cart call never left the store’s server', 'The browser added the header itself before it sent the request to the platform’s server'],
	'A wildcard would show as *, and the recommendations call did answer that way. Echoing the caller’s own origin means the server compared it with a list and chose to allow it. The header is part of the response, not something the browser adds.');
sb.add('mid', 'tags',
	'Why are server-side catalog reads stored under tags like product:<handle>?',
	'So a webhook can later purge exactly the entries that changed',
	['So the browser can find the product again later in its own localStorage cache', 'So the platform can rate-limit each shopper', 'So the page can skip the merchant id header'],
	'Tags name what a cached answer is about. When the platform says a product changed, the store purges that tag and rebuilds only the pages that used it. Tags do nothing for localStorage, rate limits or the merchant header.');
sb.add('advanced', 'tradeoff',
	'What is the main cost of calling the platform straight from the browser?',
	'It exposes the API’s shape and depends on its CORS rules',
	['It cannot send the merchant id header', 'It forces every answer to be cached by the server before the browser may read it', 'It prevents the page from showing personal data'],
	'Browser-direct calls are easy and fast to build, but anyone with the network panel can see the paths and headers, and the call works only while the platform’s CORS allows the page’s origin. Headers can be sent and personal data shown just fine.');

const or = t('ap-own-routes');
or.add('basic', 'health',
	'What does the store’s /health route answer?',
	'200 with {"success":true,"data":null}, checking nothing behind it',
	['200 with a small report on the status of the cache and of each platform API', '204 with no body once the database responds', '200 with the build id and the merchant id'],
	'The route returns a fixed success body, so it only proves the server process answers. It does not test the cache or the platform, and it shows no build or merchant details.');
or.add('basic', 'bad-handle',
	'What does a request to /api/nav-menu/..%2F..%2Fetc get?',
	'400 with a null body, because the handle has disallowed characters',
	['200 with a menu called etc', '404 with the store’s own not-found page, because the route does not exist', '401 because the route needs a signature'],
	'The route only accepts letters, digits, underscore and hyphen, because it is a public door into an internal API and must not allow path traversal. Anything else is refused with 400 before any call is forwarded.');
or.add('mid', 'unknown-menu',
	'What does an unknown but well-formed nav-menu handle return?',
	'200 with null',
	['404 with an error object', '400 with null', '500 because the platform has no such menu'],
	'The handle passes the character check, so the route forwards it and returns whatever the platform gave back, which is nothing: null. A malformed handle is 400, and a missing route would be a 404 page, so three situations get three different answers.');
or.add('mid', 'same-401',
	'Why do an unsigned webhook POST and one with a bad signature get the same kind of 401?',
	'A caller learns nothing about how close its signature was',
	['The server never reads the signature header at all', 'Both are cached by the CDN and replayed', 'The platform rewrites unsigned requests into signed ones before the store sees them'],
	'If the two cases looked different, a caller could probe step by step. One generic answer, with a request id to quote when reporting a failed delivery, refuses both without giving a hint.');
or.add('advanced', '405',
	'GET /api/data-source-options returned 405. What does that tell you?',
	'The route exists but handles only other methods, here POST',
	['The route does not exist on this server', 'The visitor is not logged in, so the route will not answer a GET at all', 'The route is rate limited for this IP'],
	'A 405 means the path is known but the method is not handled. A missing route is a 404, a missing login is a 401, and rate limiting would be a 429.');

const pl = t('ap-page-load-calls');
pl.add('basic', 'store-count',
	'How many requests to the store itself did each page view make, counting documents and same-origin API calls?',
	'9, of which 3 were the same /api call',
	['3, all of them documents', '25, mostly images and fonts', 'About 60, one request for each of the outside hosts the page talked to'],
	'Static assets are not counted. Each of the four pages made nine requests to the store, and three of those were the same /api/v1/apps/installed call. The calls to outside hosts are counted separately.');
pl.add('basic', 'repeat',
	'Which call was repeated three times per page view?',
	'The store’s own /api/v1/apps/installed',
	['The cart call that the page sends to the platform’s own cart API', 'The search call to the gateway', 'The reviews average call'],
	'The apps list call was made three times on each page, twelve times over four pages, and each took 0.7 to 2.0 seconds in dev mode. The cart, search and reviews calls appeared once per page where they apply.');
pl.add('mid', 'optional-404',
	'The optional SDK-config call returned 404 and the page still worked. What does that show?',
	'Its caller treats the call as optional and carries on',
	['The platform retried it in the background and recovered', 'The browser cached the 404 as a success', 'The page waited for the call and then timed out gracefully'],
	'Nothing recovered: the call simply failed, and the code that made it did not need the answer. The response even said it could be cached for five minutes, so a missing config does not hit the endpoint on every page.');
pl.add('mid', 'counting',
	'Why is counting requests a useful first review step?',
	'Duplicate calls, many hosts and writes on page load show up before any code is read',
	['It proves each call is correctly authenticated', 'It shows which calls will be slow only in production, once the real traffic arrives at the store', 'It replaces the need to check status codes'],
	'A count is cheap and needs no source code, and it points at questions worth asking: why three identical calls, why ten hosts, why writes before the visitor did anything. It proves nothing about authentication, production timing or statuses.');
pl.add('advanced', 'post-read',
	'The discount lookup is a POST with a small body. What is likely going on?',
	'A read that uses POST because its query travels in a body',
	['A write that changes the contents of the visitor’s cart on the platform', 'A webhook sent by the platform', 'An analytics event batch sent by a pixel'],
	'Some APIs use POST for lookups whose input is too structured for a URL. Reading the method alone is not enough: look at the path, the body size and what comes back. That is why the test blocked it but did not assume it was a write.');

const sh = t('ap-status-and-headers');
sh.add('basic', 'unknown-product',
	'What did an unknown product page return?',
	'Status 200 with a not-found body and a noindex meta tag',
	['Status 404 with the store’s own not-found page, like any unknown route', 'Status 301 to the home page', 'Status 500 with an error id'],
	'The page streams its first bytes before it learns the product is missing, so the status is already 200. The not-found body and the noindex meta tag tell people and search engines the truth. An unknown route, by contrast, is a true 404.');
sh.add('basic', 'put-405',
	'Which status did a PUT request to the webhook route get?',
	'405, because that route handles other methods',
	['401, because the signature was missing', '404, because no PUT route exists anywhere on the store’s server', '200, because PUT is allowed on any route'],
	'The route handles GET and POST, so another method on the same path is refused as not allowed. The 401 belongs to the unsigned POST, and a 404 would mean the path itself is unknown.');
sh.add('mid', 'api-cache',
	'Which Cache-Control did every /api response carry in dev mode, even a 401?',
	'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
	['no-store, must-revalidate', 'private, max-age=60', 'public, max-age=31536000, s-maxage=31536000, immutable, no-transform'],
	'One blanket rule for /api applied to every answer, errors and webhook refusals included. Pages carried no-store, must-revalidate in dev mode. Check the headers that really arrive, because a rule in the config can differ from what a route intends.');
sh.add('mid', 'cors-answers',
	'The cart API answered access-control-allow-origin with the page’s origin, and the recommendations API with *. What is the difference?',
	'An allow-list echo is chosen per caller; a wildcard answers every origin',
	['The wildcard is stricter, because it names no origin and so reveals no list', 'The echo means the browser blocked the call', 'Only the wildcard lets the browser send cookies'],
	'Echoing the page’s origin means the platform checked it against a list. A wildcard means any page may read the answer, which suits public data like a product list. Neither one by itself says anything about cookies.');
sh.add('advanced', 'seo-200',
	'Why can an unknown product be status 200 and still be handled well for search engines?',
	'The page carries noindex, so crawlers drop it despite the status',
	['Crawlers ignore the status code and read only the body', 'The 200 tells crawlers to retry the page later, once the product exists again', 'The CSP header forbids indexing of unknown pages'],
	'The robots meta tag tells crawlers not to index the page, whatever the status line says. The CSP header here only limits who may frame the site, and the status does not ask for a retry.');

export const banks: { out: Question[] }[] = [sm, sb, or, pl, sh];
