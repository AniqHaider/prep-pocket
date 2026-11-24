import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');

// APIs in practice, part 1: reading a real API by calling it. Every request, response and number comes from running Cardify Lite
// locally (backend :4100, admin :5173, demo storefront :4200) and from its source; the admin key is shown as <ADMIN_API_KEY>.

export const topics: DbTopic[] = [
	// ───────────────────────── ap-map ─────────────────────────
	{
		id: 'ap-map',
		title: 'The whole system on one page',
		level: 'basic',
		summary: 'See the parts of Cardify Lite, which one calls which route, and what the settings resource looks like.',
		scenes: ['ap-system-map', 'ap-settings-resource'],
		notes: md(
			'Cardify Lite lets a merchant swap a store\'s product cards for one of five designs with one switch. It is small enough to hold in your head, which makes it a good API to read. For these lessons it was started on a laptop and called for real.',
			'',
			'**The parts**',
			'',
			'- **Backend** (Fastify, port 4100): keeps one settings record per merchant and serves the files of the SDK.',
			'- **Storefront** (a demo shop, port 4200): includes one script tag, the loader, which asks the backend what to do.',
			'- **Admin website** (React, port 5173): the merchant edits the settings here.',
			'- **Store**: settings live in memory by default and reset on restart; with `DATABASE_URL` set they live in MySQL.',
			'',
			'**Five routes carry everything**',
			'',
			'- `GET /health`: is the server up?',
			'- `GET /cardify/sdk/config/:merchantId`: public, what the loader reads.',
			'- `GET /cardify/sdk/cardify-loader.js` and `cardify-widget.js`: the public SDK files.',
			'- `GET` and `PUT /cardify/admin/:merchantId/settings`: the admin reads and saves, guarded by an `x-admin-key` header.',
			'',
			'**The resource** is the settings object: `enabled`, `design`, and `options` (three colours, a radius, an image shape and four show/hide toggles). The server adds `version`, the time of the last save in milliseconds, and `0` when nothing was ever saved.',
			'',
			'**How to read an API:** list its routes, mark which are public and which need a key, then follow one real request through every part. The next lessons do exactly that.'
		),
		try: [
			{
				label: 'Sort the routes into public and key-guarded',
				code: md(
					'// The five routes of Cardify Lite and what each one needs.',
					'const routes = [',
					"  ['GET', '/health', 'none'],",
					"  ['GET', '/cardify/sdk/config/:merchantId', 'none'],",
					"  ['GET', '/cardify/sdk/cardify-loader.js', 'none'],",
					"  ['GET', '/cardify/sdk/cardify-widget.js', 'none'],",
					"  ['GET', '/cardify/admin/:merchantId/settings', 'x-admin-key'],",
					"  ['PUT', '/cardify/admin/:merchantId/settings', 'x-admin-key']",
					'];',
					"const guarded = routes.filter(([, , auth]) => auth !== 'none');",
					"console.log('public:', routes.length - guarded.length, '| key-guarded:', guarded.length);",
					'for (const [method, path, auth] of routes) console.log(method.padEnd(4), path.padEnd(38), auth);'
				)
			}
		]
	},

	// ───────────────────────── ap-first-calls ─────────────────────────
	{
		id: 'ap-first-calls',
		title: 'Your first calls with curl',
		level: 'basic',
		summary: 'Call an API by hand and read its answer: the status line, the headers that explain how it may be used, and the body.',
		scenes: ['ap-health-call', 'ap-config-call', 'ap-bad-id-call'],
		notes: md(
			'The fastest way to understand an API is to call it. `curl -i` prints the status line, the response headers and the body, which is everything a client receives.',
			'',
			'**Health.** `GET /health` answered `200 OK` with `{"ok":true}`: the server is up, and nothing more is promised.',
			'',
			'**Public config for a merchant that never saved.** `GET /cardify/sdk/config/demostore` answered `200` with the default settings and `"version":0`. The headers say how the answer may be used:',
			'',
			'- `access-control-allow-origin: *`: a page on any website may read it in a browser, which a storefront needs.',
			'- `cross-origin-resource-policy: cross-origin`: any site may load it.',
			'- `cache-control: no-store`: no cache may keep a copy, so a toggle in the admin is seen on the next read.',
			'- `content-type: application/json; charset=utf-8`.',
			'',
			'**A bad id.** `NOT_VALID!`, `DemoStore` (capitals) and `abc` (too short) all returned `400` with `{"error":"invalid merchant id"}`. The rule is lowercase letters and digits, 6 to 32 characters. A valid id nobody ever saved, such as `nobodyhere`, still returns `200` with the defaults, so the loader always gets a usable answer and a caller cannot learn which merchants exist.',
			'',
			'**Take away:** read the status first, then the headers, then the body. The headers often explain design decisions that the code only hints at.'
		),
		try: [
			{
				label: 'Parse a raw HTTP response',
				code: md(
					'// What curl -i prints, as one string: status line, headers, blank line, body.',
					'const raw = [',
					"  'HTTP/1.1 200 OK',",
					"  'access-control-allow-origin: *',",
					"  'cache-control: no-store',",
					"  'content-type: application/json; charset=utf-8',",
					"  '',",
					'  \'{"enabled":false,"design":"classic","version":0}\'',
					"].join('\\r\\n');",
					'',
					'function parseResponse(text) {',
					"  const cut = text.indexOf('\\r\\n\\r\\n');",
					"  const lines = text.slice(0, cut).split('\\r\\n');",
					"  const [, status, ...reason] = lines[0].split(' ');",
					'  const headers = {};',
					"  for (const line of lines.slice(1)) { const i = line.indexOf(':'); headers[line.slice(0, i).toLowerCase()] = line.slice(i + 1).trim(); }",
					"  return { status: Number(status), reason: reason.join(' '), headers, body: JSON.parse(text.slice(cut + 4)) };",
					'}',
					'',
					'const res = parseResponse(raw);',
					"console.log(res.status, res.reason);",
					"console.log('cached by browsers?', res.headers['cache-control'] !== 'no-store');",
					"console.log('any site may read it?', res.headers['access-control-allow-origin'] === '*');",
					"console.log('version:', res.body.version);"
				)
			}
		]
	},

	// ───────────────────────── ap-admin-calls ─────────────────────────
	{
		id: 'ap-admin-calls',
		title: 'Calling the admin routes',
		level: 'mid',
		summary: 'See what the key-guarded routes answer to a missing key, a wrong key, bad settings, good settings and a few mistakes of the client.',
		scenes: ['ap-admin-401', 'ap-admin-put-400', 'ap-admin-put-ok', 'ap-admin-edge-cases'],
		notes: md(
			'The admin routes are `GET` and `PUT /cardify/admin/:merchantId/settings`. Every call needs the `x-admin-key` header. This is what happened when they were called well and badly.',
			'',
			'**The key.** No key, the wrong key `nope-nope` and a one-character key all returned `401` with the same body, `{"error":"invalid or missing x-admin-key"}`. With the right key (shown here as `<ADMIN_API_KEY>`) a `GET` returned `200` with the settings.',
			'',
			'**Invalid settings.** A `PUT` with `enabled` as the string `"yes"`, an unknown design `neon`, the colour `red` and a `radius` of 99 returned `400` with `{"error":"invalid settings","issues":[...]}`. There is one issue per mistake, each with a `path` such as `["options","radius"]` and a plain message. The design message lists the allowed designs.',
			'',
			'**A good save.** A valid `PUT` returned `200` with the saved settings and a `version`. The identical `PUT` sent again returned the same settings with a later `version`: same state, new time stamp.',
			'',
			'**Other mistakes a client can make**',
			'',
			'- no `content-type` header: `415`',
			'- malformed JSON: `400`, and the connection is closed',
			'- a body over 1 MiB: `100 Continue`, then `413`',
			'- a `DELETE` or a `POST` on a route that only knows `GET` and `PUT`: `404`',
			'',
			'**Take away:** every failure had its own status, and the `400` told the caller which field to fix.'
		),
		try: [
			{
				label: 'Turn status codes into friendly messages',
				code: md(
					'// A client helper like the admin\'s: one readable message per failure.',
					'function explain(status, body) {',
					"  if (status === 401) return 'The admin key is missing or wrong.';",
					"  if (status === 400 && body.issues) return body.issues.map((i) => i.path.join('.') + ': ' + i.message).join('; ');",
					'  if (status === 400) return body.error ?? body.message;',
					"  if (status === 413) return 'The settings are too large to save.';",
					"  if (status === 415) return 'Send the body as application/json.';",
					"  return 'Request failed (' + status + ')';",
					'}',
					'',
					'const samples = [',
					"  [401, { error: 'invalid or missing x-admin-key' }],",
					"  [400, { error: 'invalid settings', issues: [{ path: ['design'], message: 'Invalid enum value' }, { path: ['options', 'radius'], message: 'Number must be less than or equal to 24' }] }],",
					"  [415, { statusCode: 415, error: 'Unsupported Media Type' }],",
					"  [404, { error: 'Not Found' }]",
					'];',
					'for (const [status, body] of samples) console.log(status, "->", explain(status, body));'
				)
			}
		]
	},

	// ───────────────────────── ap-website-calls ─────────────────────────
	{
		id: 'ap-website-calls',
		title: 'What the websites actually send',
		level: 'mid',
		summary: 'Follow the real browser run: the storefront loader, the admin with a wrong and a right key, three edits becoming one save, and the focus refresh.',
		scenes: ['ap-web-first-load', 'ap-web-admin-keys', 'ap-web-one-put', 'ap-web-focus-refresh', 'ap-web-network-log'],
		notes: md(
			'Calling an API with curl shows what the server does. Opening the websites in a real browser and logging every request shows what the clients really send. This is that run, with Cardify Lite\'s own screenshots.',
			'',
			'**The storefront.** It loaded `cardify-loader.js?store=demostore`, then the loader called `GET /cardify/sdk/config/demostore`. Cardify was off, so the widget bundle was not fetched and the native cards stayed.',
			'',
			'**The admin, first load.** With no key stored it fetched the widget (for its preview tiles) and called `GET .../settings` twice back to back, both `401`. The two calls come from React StrictMode, which runs an effect twice in development. The pill then said `invalid or missing x-admin-key`.',
			'',
			'**Keys.** A wrong key sent one `GET` and got `401`; the right key got `200` and the pill said `Connected`. Every admin call carried `content-type: application/json` and `x-admin-key`. The public config call carried no key.',
			'',
			'**Edits.** Three edits inside about 300 ms (switch on, Editorial, badge off) became one `PUT`: autosave waits for 500 ms without a new edit and then sends the whole settings object. A later colour change sent a second `PUT`.',
			'',
			'**Focus.** Back in the storefront tab, the loader re-read the config on the focus event, saw `enabled: true`, fetched the widget, and the cards changed with no reload. There is no timer, so idle tabs never call the backend.',
			'',
			'Screenshots: Cardify Lite, run locally.'
		),
		try: [
			{
				label: 'How many saves do these edits cause?',
				code: md(
					'// Autosave fires after 500 ms without a new edit. Edit times are in milliseconds.',
					'function saves(editTimes, wait = 500) {',
					'  const out = [];',
					'  editTimes.forEach((t, i) => {',
					'    const next = editTimes[i + 1];',
					'    if (next === undefined || next - t >= wait) out.push(t + wait);',
					'  });',
					'  return out;',
					'}',
					'',
					"console.log('three quick edits:', saves([0, 120, 250]));",
					"console.log('plus a colour change later:', saves([0, 120, 250, 1750]));",
					"console.log('edits 600 ms apart:', saves([0, 600, 1200]));"
				)
			}
		]
	},

	// ───────────────────────── ap-status-and-errors ─────────────────────────
	{
		id: 'ap-status-and-errors',
		title: 'Status codes and error shapes',
		level: 'mid',
		summary: 'Learn what each status this API returned means, when 401 and 403 differ, and why two error shapes make clients harder to write.',
		scenes: ['ap-status-codes', 'ap-error-shapes'],
		notes: md(
			'Status codes are the first thing a client reads. These are the ones this API really returned during the runs.',
			'',
			'- `200 OK` for most calls. `204 No Content` for the CORS preflight (`OPTIONS`): headers only. `304 Not Modified` for a conditional request for the loader file with its `ETag`: the browser reuses its copy.',
			'- `400`: the request is wrong (bad merchant id, invalid settings, malformed JSON). `401`: no valid key. `403`: a path-traversal attempt on the static files was refused. `404`: no such route. `413`: body over 1 MiB. `415`: no `content-type`.',
			'',
			'**401 or 403?** `401` means the server cannot tell who you are, or the credentials are wrong. `403` means it understood the request and refuses it. A wrong key is a `401`; a refused file path is a `403`.',
			'',
			'**404 where 405 fits.** A `DELETE` on the admin route and a `POST` on the public config both answered `404`. The route exists for other methods, so `405 Method Not Allowed` with an `Allow` header would say more.',
			'',
			'**Two error shapes.** The app writes `{"error":"..."}`, plus `issues` for settings. The framework writes `{"statusCode","code","error","message"}` for `415`, `413`, malformed JSON and unknown routes. The admin\'s helper throws `body.error ?? "Request failed (status)"`, so it copes with both, but only because both happen to have an `error` field. One shape would be easier to rely on.',
			'',
			'**Take away:** choose one error shape and one meaning per code, then keep to them.'
		),
		try: [
			{
				label: 'Read both error shapes',
				code: md(
					'// Real bodies from the runs: the app\'s shape and the framework\'s shape.',
					'const answers = [',
					"  { status: 401, body: { error: 'invalid or missing x-admin-key' } },",
					"  { status: 415, body: { statusCode: 415, code: 'FST_ERR_CTP_INVALID_MEDIA_TYPE', error: 'Unsupported Media Type', message: 'Unsupported Media Type' } },",
					"  { status: 404, body: { message: 'Route GET:/cardify/nothing-here not found', error: 'Not Found', statusCode: 404 } }",
					'];',
					"const kind = (s) => (s < 300 ? 'success' : s < 400 ? 'not modified' : s < 500 ? 'client error' : 'server error');",
					"for (const { status, body } of answers) console.log(status, kind(status).padEnd(12), '| shape:', 'statusCode' in body ? 'framework' : 'app', '| shown:', body.error);"
				)
			}
		]
	}
];

// ───────────────────────── questions ─────────────────────────
const t = (topic: string) => builder('AP', topic);

// ap-map
const mp = t('ap-map');
mp.add('basic', 'callers',
	'In Cardify Lite, which part asks the backend for `GET /cardify/sdk/config/:merchantId`?',
	'The loader script on the storefront page',
	['The admin website, each time the merchant saves a change', 'The MySQL store, once when the backend starts up', 'The backend itself, on a timer, to refresh its cache'],
	'The loader is the only script a storefront includes, and its job is to read this public config. The admin uses the key-guarded admin routes, the store is only a place to keep data, and the backend does not call its own public routes.');
mp.add('basic', 'guard',
	'Which requests must carry the `x-admin-key` header?',
	'`GET` and `PUT` on `/cardify/admin/:merchantId/settings`',
	['Every request to the backend, including `/health`', 'The public config and the SDK files the storefront loads', 'Only `PUT`; reading settings with `GET` is open'],
	'Both admin methods are guarded. `/health`, the public config and the SDK files are open on purpose because storefront visitors need them, and a `GET` of the admin settings is protected too, since it returns the same data the key is meant to guard.');
mp.add('basic', 'version',
	'A response contains `"version":0`. What does that tell you?',
	'Nothing was ever saved; these are the defaults',
	['The settings are locked until an admin unlocks them', 'The cached copy expired and must be fetched again', 'The server restarted and the old version was lost'],
	'The server sets `version` to the time of the last save in milliseconds, and `0` when the merchant has no saved record, in which case the defaults are returned. It is not a lock, a cache marker or a restart counter.');
mp.add('mid', 'storage',
	'The backend starts without `DATABASE_URL`. Where do the settings live?',
	'In memory, so a restart resets them',
	['In a file next to the server that survives restarts', 'In the browser\'s localStorage on the admin page', 'Inside the SDK bundle that the storefront loads'],
	'With no database URL the repository keeps settings in a map in memory, which is fine for a local demo and is lost on restart. With `DATABASE_URL` set they go to MySQL. The browser and the SDK bundle never hold the settings record.');
mp.add('mid', 'widget',
	'The storefront loader reads a config with `enabled: false`. What does it do next?',
	'Leaves the page alone: no widget fetch, native cards stay',
	['Fetches the widget bundle anyway and hides it with CSS rules', 'Retries the config every second until it becomes enabled', 'Calls the admin route to find out why it is switched off'],
	'The widget bundle is fetched only when the config says `enabled: true`, so a switched-off merchant costs the page nothing. The loader has no timer (it re-reads on focus), and it never uses the admin route or key.');

// ap-first-calls
const fc = t('ap-first-calls');
fc.add('basic', 'curl-i',
	'What does adding `-i` to a `curl` call show?',
	'The status line and response headers before the body',
	['The headers the client sent, but not the response', 'How long each phase of the request took, in milliseconds', 'The TLS certificate chain of the server'],
	'`curl -i` includes the response status line and headers in the output, followed by the body. Timing breakdowns need `-w`, request headers need `-v`, and certificate details need other options.');
fc.add('basic', 'no-store',
	'The public config answers with `cache-control: no-store`. What follows?',
	'No cache may keep it, so every read asks the server',
	['It may be cached for an hour, then it must be refreshed', 'Only the browser may keep it, a CDN must not', 'The body is encrypted so caches cannot read it'],
	'`no-store` tells every cache, browser and shared, not to keep the response at all. That is why a switch flipped in the admin shows up on the next read. It is not a time limit and it has nothing to do with encryption.');
fc.add('mid', 'cors-star',
	'What does `access-control-allow-origin: *` on the config response allow?',
	'Any website\'s page may read it in the browser',
	['Any client may change the settings without a key', 'Only pages served from localhost may read it', 'The browser may skip HTTPS for that request'],
	'The header tells browsers that a page from any origin may read this response, which a public config for any storefront needs. It grants no write access, it is not limited to localhost, and it does not relax HTTPS.');
fc.add('mid', 'bad-id',
	'`GET /cardify/sdk/config/DemoStore` returned 400. Why?',
	'Ids must be lowercase letters or digits, 6 to 32 long',
	['No merchant with that name exists, so there is nothing to return', 'The admin key header was missing from the request', 'The server could not parse the JSON body of the request'],
	'The id is checked against a pattern first, and capitals break it, as do too-short ids like `abc`. A valid id with no saved settings, such as `nobodyhere`, returns 200 with defaults, so "does not exist" is not what 400 means here. A `GET` has no body and the public route needs no key.');
fc.add('mid', 'defaults',
	'A valid merchant id with no saved settings gets `200` with defaults, not `404`. What does that give the loader?',
	'A usable answer every time, and ids cannot be probed',
	['A faster response, because defaults are cached for a day', 'A reason to retry once the merchant has been created', 'A smaller body, because defaults are left out entirely'],
	'Returning defaults means the loader never has to handle a missing merchant, and a caller cannot tell which ids exist from 404s. The answer is still `no-store`, not cached for a day, and the body is the full default settings.');

// ap-admin-calls
const ac = t('ap-admin-calls');
ac.add('mid', 'same-401',
	'No key, a wrong key and a one-character key all got the identical 401 body. What does a caller learn?',
	'Nothing about which part was wrong or how close it was',
	['That the real key is at least eight characters long', 'That the server compares keys with plain string equality', 'That a key was received but could not be decoded'],
	'One message for every failure gives an attacker no hint about whether the key was missing, too short or nearly right. A different message or status for a short key would leak information about the key.');
ac.add('mid', 'issues',
	'What does the `400` for invalid settings add to the error text?',
	'An `issues` list: each item has a `path` and a message',
	['A `retryAfter` value saying when to send it again', 'The corrected settings object the server would accept', 'A stack trace pointing to the line that failed'],
	'The validator reports one issue per mistake with the field path, such as `["options","radius"]`, and a readable message, so a form can mark the exact field. The server does not suggest a corrected object, and it does not expose stack traces.');
ac.add('mid', 'same-put',
	'The identical valid `PUT` was sent twice. How did the second answer differ?',
	'Same settings, but a later `version`',
	['It returned 409 Conflict because nothing had changed', 'It returned 304 with no body, since nothing changed', 'Same settings and the same `version`, as it was a no-op'],
	'`PUT` replaces the whole resource, so repeating it leaves the same state, and each save stamps a new `version` (the time of the save). It is not treated as a conflict or as a cache hit.');
ac.add('mid', 'too-big',
	'A `PUT` body bigger than 1 MiB came back as what?',
	'`413`, and the connection is closed',
	['`400` with an `issues` list naming the field', '`401`, since large bodies need a stronger key', '`200`, with the settings cut off at 1 MiB'],
	'The framework\'s default body limit is 1 MiB; above it the server answers `413 Payload Too Large` and closes the connection, before any validation of the content happens.');
ac.add('advanced', 'no-type',
	'A `PUT` with a valid key and JSON text but no `content-type` header returned which status?',
	'`415 Unsupported Media Type`',
	['`400 Bad Request` with an `issues` list', '`422 Unprocessable Entity` with the field errors', '`200`, because the body is parsed as JSON anyway'],
	'The framework only parses a body whose media type it knows, so without `content-type: application/json` it refuses the request with 415 before the app\'s own validation runs. That is why the admin client always sets the header.');

// ap-website-calls
const wc = t('ap-website-calls');
wc.add('mid', 'debounce',
	'Three edits were made inside about 300 ms in the admin. How many `PUT` requests did the page send?',
	'One, because autosave waits for 500 ms without a new edit',
	['Three, one for each edit, sent as soon as it was made', 'Three, and the server merged them into one save', 'Two: one for the first edit and one for the last'],
	'Each edit restarts a 500 ms timer, and the `PUT` is sent only when the timer finishes, so quick edits are coalesced into one request. The server never sees the intermediate edits.');
wc.add('mid', 'strict-mode',
	'The admin\'s first load sent two identical `GET` settings calls. What explains them in development?',
	'React StrictMode runs the effect twice in development',
	['A CORS preflight followed by the real request', 'The browser retried after the first 401 answer', 'One for the settings and one for the design list'],
	'The admin renders inside React StrictMode, which runs effects twice in development, so the load effect fired two identical calls. A preflight is an `OPTIONS` request, not a second `GET`, and browsers do not retry a 401 by themselves.');
wc.add('mid', 'focus',
	'After the merchant saved settings, what made the open storefront tab pick them up?',
	'The loader re-reads config when the tab gets focus',
	['A timer in the loader that polls every few seconds', 'The backend pushed the new settings over a WebSocket', 'The admin page reloaded the storefront in the other tab'],
	'The loader refreshes on page load, on the window `focus` event and when the tab becomes visible. There is no timer and no push channel, so idle tabs cost the backend nothing.');
wc.add('mid', 'whole-body',
	'After only the accent colour changed, what did the second `PUT` body contain?',
	'The whole settings object, with the new `accentColor`',
	['Only the changed field, `accentColor`, with its new value', 'A list of changes, such as `[{op, path, value}]`', 'Just the version number to bump'],
	'The admin sends the full settings object on every save, and the server validates and replaces the whole record. Partial updates or patch lists would need a different route and method.');
wc.add('mid', 'widget-fetch',
	'When did the storefront fetch `cardify-widget.js`?',
	'Only after the config said `enabled: true`',
	['On every page load, before the config was read', 'Each time the merchant moved a slider in the admin', 'Only when the admin sent an invalid key'],
	'The loader reads the config first and fetches the widget bundle only when Cardify is switched on. While it was off, the storefront made just two requests: the loader and the config.');

// ap-status-and-errors
const se = t('ap-status-and-errors');
se.add('mid', 'no-content',
	'Which kind of call got `204 No Content` with only headers?',
	'A CORS preflight `OPTIONS` request',
	['A `GET` for a merchant that has no settings', 'A `DELETE` on the admin settings route', 'A `PUT` whose body matched the saved settings'],
	'The server answers every `OPTIONS` preflight with 204 and, for allowed admin origins, the CORS headers. A `GET` for an unsaved merchant returns 200 with defaults, a `DELETE` returned 404, and a repeated `PUT` returned 200 with a new `version`.');
se.add('mid', 'not-modified',
	'A request for the loader file with `If-None-Match` got `304`. What came back?',
	'Only headers; the browser keeps its copy',
	['The full file again, but with a fresh `ETag` value', 'An error saying the `ETag` you sent does not match', 'A redirect to a newer copy of the same file'],
	'304 Not Modified means the cached copy is still current, so the server sends headers and no body and the browser reuses what it stored. The `ETag` matched, which is why there is no error and no redirect.');
se.add('advanced', '401-403',
	'Which pair matches how this API used 401 and 403?',
	'401 for a bad key, 403 for a refused path',
	['401 for an invalid JSON body, 403 for a bad key', '401 for an unknown route, 403 for a body over 1 MiB', '401 for a refused path, 403 for a bad key'],
	'401 means the caller is not authenticated: the key is missing or wrong. 403 means the request was understood and refused, as with the path-traversal attempt on the static files. Malformed JSON is 400, an unknown route is 404 and an oversized body is 413.');
se.add('mid', 'error-field',
	'The admin helper throws `body.error ?? "Request failed (status)"`. A framework `415` carries `error: "Unsupported Media Type"`. What does the user see?',
	'Unsupported Media Type',
	['Request failed (415)', 'invalid settings', 'invalid or missing x-admin-key'],
	'The framework\'s body has an `error` field, so the helper uses it and shows "Unsupported Media Type". It works for both error shapes only because both include `error`; a shape without it would fall back to the generic text.');
se.add('mid', '405',
	'A `DELETE` on a route that only knows `GET` and `PUT` returned `404` here. What status describes it better?',
	'`405 Method Not Allowed`, with an `Allow` header',
	['`403 Forbidden`, as the caller lacks the right', '`409 Conflict`, as the route exists', '`410 Gone`, because DELETE was removed'],
	'The route exists but not for that method, which is exactly what 405 means, and the `Allow` header lists the methods that would work. 403 is for refused access, 409 for state conflicts and 410 for resources that used to exist.');

export const banks: { out: Question[] }[] = [mp, fc, ac, wc, se];
