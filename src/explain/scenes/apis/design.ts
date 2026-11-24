import type { Scene, SceneNode, Tone } from '../../types';
import { credit, ring, shot } from '../consoleKit';

/**
 * APIs in practice, part 3: design choices that keep Cardify Lite's API safe to call and safe to depend on, and an honest list of its gaps.
 * Ids `ap-*`; `group` = a topic id in src/db/apis/design.ts. Every request, header and number comes from the live run recorded in the
 * evidence notes (calls 02 to 41, the browser network log) and from the project's own code.
 */

// A vertical chain of boxes joined by arrows: box ids `<p>0..n`, edge ids `<p>e0..` (edge i joins box i and box i+1). The first box starts visible.
type Item = { l: string; s?: string; tone?: Tone };
const stack = (p: string, items: Item[], o: { x?: number; w?: number; y?: number; h?: number; gap?: number } = {}): SceneNode[] => {
	const { x = 16, w = 200, y = 14, h = 44, gap = 28 } = o;
	const out: SceneNode[] = [];
	items.forEach((it, i) => {
		out.push({ id: p + i, kind: 'box', x, y: y + i * (h + gap), w, h, label: it.l, sub: it.s, tone: it.tone, visible: i === 0 ? true : undefined });
		if (i) out.push({ id: p + 'e' + (i - 1), kind: 'edge', from: p + (i - 1), to: p + i });
	});
	return out;
};

const SHOT_CREDIT = 'Screenshot: Cardify Lite, run locally';
const SHOT = { w: 336, y: 10 };
// The demo-store screenshots are 1100 x 481 and drawn 336 wide, so 1 file pixel = 0.305 stage units; zoomed to a view 380 px wide it is 0.884.
const ZOOM = { x: 60, y: 300, w: 380 };
const WHOLE = { x: 0, y: 0, w: 1100 };

export const apDesign: Scene[] = [
	// ───────────── ap-idempotent-save ─────────────
	{
		id: 'ap-put-twice',
		topic: 'apis',
		group: 'ap-idempotent-save',
		title: 'Why a repeated PUT is safe',
		blurb: 'What changes when the admin sends an identical save a second time?',
		stage: { w: 360, h: 332 },
		nodes: [
			{ id: 'admin', kind: 'box', x: 16, y: 14, w: 150, h: 44, label: 'Admin', sub: 'PUT, same body twice', visible: true },
			{ id: 'server', kind: 'box', x: 16, y: 98, w: 150, h: 44, label: 'Server', sub: 'checks key, validates' },
			{ id: 'store', kind: 'box', x: 16, y: 182, w: 150, h: 44, label: 'Settings row', sub: 'one row per merchant' },
			{ id: 'e0', kind: 'edge', from: 'admin', to: 'server', label: 'PUT' },
			{ id: 'e1', kind: 'edge', from: 'server', to: 'store', label: 'upsert' },
			{ id: 'r1', kind: 'doc', x: 180, y: 14, w: 168, title: 'Response to call 15', lines: ['200 OK', 'design: overlay', 'radius: 12', 'version: 1795534284883'] },
			{ id: 'r2', kind: 'doc', x: 180, y: 124, w: 168, title: 'Response to call 16', lines: ['200 OK', 'design: overlay', 'radius: 12', 'version: 1795534284949'] },
			{ id: 'same', kind: 'box', x: 16, y: 246, w: 328, h: 46, label: 'Same settings, new stamp', sub: 'only the version moved, by 66 ms', tone: 'accent' },
			{ id: 'note', kind: 'text', x: 180, y: 318, text: 'A retried PUT lands on the same state.', size: 'sm', anchor: 'middle' }
		],
		steps: [
			{ say: 'The admin saves with PUT. The body is the whole settings object, not a patch: enabled, the design and all the options.', focus: ['admin'] },
			{ say: 'The server checks the admin key and validates the body against the shared schema, then hands it to the repo.', show: ['server', 'e0'], focus: ['server'] },
			{ say: 'The repo upserts one row per merchant: onDuplicateKeyUpdate inserts the row, or updates it if it already exists, in one statement.', show: ['store', 'e1'], focus: ['store'] },
			{ say: 'Call 15 comes back 200 with the saved settings and a version stamp, 1795534284883.', show: ['r1'], focus: ['r1'] },
			{ say: 'Call 16 sends the identical body again. Same 200, same settings, and the stamp is now 1795534284949.', show: ['r2'], focus: ['r2'] },
			{ say: 'The state is the same; only the stamp moved, 66 ms later. That is idempotent: doing it twice leaves what doing it once would.', show: ['same'], pulse: ['same'] },
			{ say: 'So a client may retry a PUT after a timeout without asking whether the first one landed. Repeating a POST that creates something would not be safe.', show: ['note'] }
		]
	},
	{
		id: 'ap-debounce-one-put',
		topic: 'apis',
		group: 'ap-idempotent-save',
		title: 'Three edits, one PUT',
		blurb: 'Why did the browser run show one PUT for three changes?',
		stage: { w: 360, h: 330 },
		nodes: [
			{
				id: 'tl',
				kind: 'doc',
				x: 16,
				y: 14,
				w: 328,
				title: 'Admin edits and the timer',
				lines: ['edit 1  switch Cardify on', 'edit 2  pick the Editorial design', 'edit 3  untick Product badge', '500 ms of quiet: the timer fires', 'PUT {"enabled":true,"design":"editorial",...}', '200 OK, the status pill shows Saved'],
				hl: [],
				visible: true
			},
			{
				id: 'code',
				kind: 'doc',
				x: 16,
				y: 158,
				w: 328,
				title: 'Simplified from admin/src/App.tsx',
				lines: ['useEffect(() => {', '  const t = setTimeout(save, 500);', '  return () => clearTimeout(t);', '}, [settings]);']
			},
			{ id: 'note', kind: 'text', x: 16, y: 292, w: 328, text: 'A later accent-colour change sent its own PUT about half a second after it.', size: 'sm' }
		],
		steps: [
			{ say: 'In the admin, every change to a setting restarts a 500 ms timer instead of sending a request at once.', focus: ['tl'] },
			{ say: 'The run in the browser: first switch Cardify on, then pick the Editorial design. Each one restarted the timer.', set: { tl: { hl: [0, 1] } } },
			{ say: 'Then untick Product badge. Three edits had arrived in quick succession and no request had gone out yet.', set: { tl: { hl: [0, 1, 2] } } },
			{ say: 'Nothing changed for 500 ms, so the timer fired.', set: { tl: { hl: [3] } } },
			{ say: 'One PUT carried all three changes, as the final settings. The network log shows a single PUT, answered 200.', set: { tl: { hl: [4, 5] } }, pulse: ['tl'] },
			{ say: 'The effect clears the old timer on every change. That cleanup is what turns a timer into a debounce.', show: ['code'], focus: ['code'] },
			{ say: 'The pill says Saving at once, so the wait never looks like a hang. The accent colour change later sent its own PUT.', show: ['note'] }
		]
	},
	{
		id: 'ap-repo-interface',
		topic: 'apis',
		group: 'ap-idempotent-save',
		title: 'One interface, two stores',
		blurb: 'How can the same routes run on memory or on MySQL?',
		stage: { w: 360, h: 366 },
		nodes: [
			{ id: 'h', kind: 'box', x: 100, y: 12, w: 160, h: 44, label: 'Route handlers', sub: 'repo.get, repo.save', visible: true },
			{ id: 'iface', kind: 'doc', x: 16, y: 90, w: 328, title: 'SettingsRepo', lines: ['get(merchantId): StoredSettings | null', 'save(merchantId, settings): StoredSettings'] },
			{ id: 'mem', kind: 'box', x: 16, y: 186, w: 150, h: 52, label: 'MemorySettingsRepo', sub: 'a Map in memory' },
			{ id: 'sql', kind: 'box', x: 194, y: 186, w: 150, h: 52, label: 'KyselySettingsRepo', sub: 'MySQL via Kysely' },
			{ id: 'e0', kind: 'edge', from: 'h', to: 'iface' },
			{ id: 'e1', kind: 'edge', from: 'iface', to: 'mem' },
			{ id: 'e2', kind: 'edge', from: 'iface', to: 'sql' },
			{ id: 't1', kind: 'text', x: 91, y: 262, w: 150, text: 'tests and the local demo', size: 'sm', anchor: 'middle' },
			{ id: 't2', kind: 'text', x: 269, y: 262, w: 150, text: 'when DATABASE_URL is set', size: 'sm', anchor: 'middle' },
			{ id: 'boot', kind: 'doc', x: 16, y: 292, w: 328, title: 'Real server log with no database', lines: ['[cardify] DATABASE_URL not set: settings live', 'in memory and reset on restart.'] }
		],
		steps: [
			{ say: 'The route handlers only ever call repo.get and repo.save. They do not know which store is behind them.', focus: ['h'] },
			{ say: 'SettingsRepo is a two-method contract: get returns the stored settings or null, save writes them and returns them with the time of the save.', show: ['iface', 'e0'], focus: ['iface'] },
			{ say: 'MemorySettingsRepo keeps rows in a Map. Tests and the local demo use it, so they need no database.', show: ['mem', 'e1', 't1'], focus: ['mem'] },
			{ say: 'KyselySettingsRepo keeps one row per merchant in MySQL. Its save is the upsert, so insert and update are one statement.', show: ['sql', 'e2', 't2'], focus: ['sql'] },
			{ say: 'With no DATABASE_URL the real server prints this warning and uses memory, so restarting it forgets every setting.', show: ['boot'], focus: ['boot'] },
			{ say: 'The same PUT behaves the same on either store. The interface is the contract; the store is a detail you can swap.', set: { iface: { tone: 'accent' } }, pulse: ['iface'] }
		]
	},

	// ───────────── ap-fail-safe-clients ─────────────
	{
		id: 'ap-loader-failsafe',
		topic: 'apis',
		group: 'ap-fail-safe-clients',
		title: 'A loader that never breaks the store',
		blurb: 'What does the storefront loader do when something goes wrong?',
		stage: { w: 360, h: 372 },
		nodes: [
			{ id: 'refresh', kind: 'box', x: 16, y: 12, w: 150, h: 44, label: 'refresh()', sub: 'on load and on focus', visible: true },
			{ id: 'fetch', kind: 'box', x: 16, y: 92, w: 150, h: 44, label: 'Fetch the config', sub: 'no-store, no credentials' },
			{ id: 'e0', kind: 'edge', from: 'refresh', to: 'fetch' },
			{
				id: 'cases',
				kind: 'table',
				x: 16,
				y: 168,
				colW: 164,
				cols: ['What goes wrong', 'What the page sees'],
				rows: [
					['Backend is down', 'native cards stay'],
					['Reply is not 200', 'returns, no change'],
					['Bundle is blocked', 'reset, retried next time'],
					['Config says off', 'widget.stop()']
				],
				hl: []
			},
			{ id: 'fp', kind: 'doc', x: 16, y: 300, w: 328, title: 'Remembered only after success', lines: ['fingerprint = version + ":" + enabled', 'seen is set after the work is done'] }
		],
		steps: [
			{ say: 'On page load, and again whenever the tab regains focus, the loader runs refresh(). There is no timer.', focus: ['refresh'] },
			{ say: 'It fetches the public config with cache: no-store and sends no credentials.', show: ['fetch', 'e0'], focus: ['fetch'] },
			{ say: 'Whatever goes wrong, the rule is the same: leave the store\'s own cards alone. The table walks the cases.', show: ['cases'], set: { cases: { hl: [0] } } },
			{ say: 'If the reply is not OK, refresh simply returns. If anything throws, it is caught and written to the console as a warning.', set: { cases: { hl: [1] } } },
			{ say: 'If the widget bundle fails to load, the stored promise is reset to null, so the next refresh tries again.', set: { cases: { hl: [2] } } },
			{ say: 'If the config turns Cardify off after it was on, the loader tells the widget to stop and the native cards come back.', set: { cases: { hl: [3] } } },
			{ say: 'The version and enabled fingerprint is saved only after success: a failed load is retried, and an unchanged config does no work.', show: ['fp'], focus: ['fp'] }
		]
	},
	{
		id: 'ap-failsafe-shots',
		topic: 'apis',
		group: 'ap-fail-safe-clients',
		title: 'Native cards, then Cardify cards',
		blurb: 'What does a shopper actually see on the demo store?',
		stage: { w: 360, h: 332 },
		nodes: [
			shot('b', 'lessons/apis/demo-before.webp', 1100, 481, { ...SHOT, alt: 'The demo storefront with its own product cards' }),
			shot('a', 'lessons/apis/demo-after.webp', 1100, 481, { ...SHOT, alt: 'The demo storefront with Cardify editorial cards', visible: false }),
			ring('r1', 30, 74, 152, 76),
			ring('r2', 30, 74, 152, 80),
			credit('c', 174, SHOT_CREDIT),
			{ id: 'bk', kind: 'box', x: 16, y: 196, w: 328, h: 44, label: 'Backend down? The page stays native', sub: 'the config fetch fails, nothing is touched', tone: 'accent' },
			{ id: 'cost', kind: 'box', x: 16, y: 254, w: 328, h: 52, label: 'The cost: silent for shoppers', sub: 'so log it: console.warn("[cardify]", err)', tone: 'warn' }
		],
		steps: [
			{ say: 'The demo storefront with Cardify off: the shop\'s own cards, each with a name, a price and a Quick buy button.', focus: ['b'] },
			{ say: 'The first card up close. With Cardify off the loader fetched the config and left this card alone.', set: { b: { view: ZOOM } }, show: ['r1'] },
			{ say: 'The merchant switched Cardify on. When this tab regained focus the loader fetched the config again and a Cardify card took its place.', hide: ['b', 'r1'], show: ['a', 'r2'], set: { a: { view: ZOOM } } },
			{ say: 'Cardify hides the native card and never removes it, so switching it off brings the original back.', hide: ['r2'], set: { a: { view: WHOLE }, b: { view: WHOLE } } },
			{ say: 'If the backend were down, the config fetch would fail and the page would stay exactly as it was at the start.', hide: ['a'], show: ['b', 'bk'] },
			{ say: 'The price of failing safe: the shopper never notices, so the team must. The loader writes a console warning with the error.', show: ['cost'], pulse: ['cost'] }
		]
	},
	{
		id: 'ap-defaults-not-404',
		topic: 'apis',
		group: 'ap-fail-safe-clients',
		title: 'Defaults, not 404s',
		blurb: 'What does the config route answer for ids it has never seen?',
		stage: { w: 360, h: 326 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 164,
				cols: ['Config request for', 'The answer'],
				rows: [
					['A saved merchant id', '200, the saved settings'],
					['Valid, never saved', '200, defaults, version 0'],
					['A malformed id', '400 invalid merchant id'],
					['An out-of-date stored row', '200, defaults, version 0']
				],
				hl: [],
				visible: true
			},
			{
				id: 'calls',
				kind: 'doc',
				x: 16,
				y: 150,
				w: 328,
				title: 'Real calls on the running server',
				lines: ['GET /cardify/sdk/config/nobodyhere   (call 36)', '200  enabled:false design:classic version:0', 'GET /cardify/sdk/config/NOT_VALID!   (call 03)', '400  {"error":"invalid merchant id"}'],
				hl: []
			},
			{ id: 'note', kind: 'text', x: 16, y: 278, w: 328, text: 'No 404 to probe, but version 0 against a timestamp still shows whether settings were saved.', size: 'sm' }
		],
		steps: [
			{ say: 'The public config route has three outcomes for a merchant id, plus one that the repo handles quietly. The table lists them.', focus: ['t'] },
			{ say: 'A valid id that was never saved gets the default settings with version 0, so Cardify is off. Call 36 did exactly this.', set: { t: { hl: [1] } }, show: ['calls'], pulse: ['t'] },
			{ say: 'So the loader always has something to read. A new store works before anyone opens the admin, and no 404 handling is needed.', set: { calls: { hl: [0, 1] } } },
			{ say: 'A malformed id is refused with 400 before it reaches the store. Uppercase and too-short ids (calls 34 and 35) got the same answer.', set: { t: { hl: [2] }, calls: { hl: [2, 3] } } },
			{ say: 'In the repo, a row that no longer validates, for example after a design was retired, reads as never configured instead of crashing the fetch.', set: { t: { hl: [3] }, calls: { hl: [] } } },
			{ say: 'There is no 404 status to probe ids with. The version field still tells saved from unsaved, which is fine for a config every storefront must read.', show: ['note'] }
		]
	},

	// ───────────── ap-testing-and-ops ─────────────
	{
		id: 'ap-inject-tests',
		topic: 'apis',
		group: 'ap-testing-and-ops',
		title: 'Testing without opening a port',
		blurb: 'How are the API\'s rules checked without starting a server?',
		stage: { w: 360, h: 330 },
		nodes: [
			...stack(
				's',
				[
					{ l: 'A test', s: 'vitest' },
					{ l: 'app.inject()', s: 'a fake request, no port' },
					{ l: 'buildApp', s: 'memory repo, test key' },
					{ l: 'The response', s: 'status, headers, body' }
				],
				{ x: 16, w: 170, y: 14, h: 44, gap: 28 }
			),
			{
				id: 'cases',
				kind: 'doc',
				x: 200,
				y: 14,
				w: 148,
				title: 'In app.test.ts',
				lines: ['public defaults', '400 bad merchant id', '401: no/wrong/short', 'save, then read', '400 bad design/radius', 'CORS allow-list', 'refuses without key']
			},
			{ id: 'gaps', kind: 'doc', x: 200, y: 180, w: 148, title: 'Not in the file', lines: ['rate limiting', 'security headers', 'the MySQL repo'] },
			{ id: 'note', kind: 'text', x: 16, y: 308, w: 328, text: 'No port to clash with, and nothing to clean up afterwards.', size: 'sm' }
		],
		steps: [
			{ say: 'A test is plain vitest code. It never starts the API on a port.', focus: ['s0'] },
			{ say: 'app.inject sends a fake HTTP request straight into the app and gives back the response object.', show: ['s1', 'se0'], focus: ['s1'] },
			{ say: 'The app is made by the same buildApp the server uses, with a memory repo and a fixed test key.', show: ['s2', 'se1'], focus: ['s2'] },
			{ say: 'The test then checks the status, the headers and the body of what came back.', show: ['s3', 'se2'], focus: ['s3'] },
			{ say: 'The file covers the three 401 cases, validation, the CORS allow-list and the refusal to build without an admin key.', show: ['cases'], focus: ['cases'] },
			{ say: 'Be clear about what it does not cover: rate limiting, security headers and the MySQL repo. Passing tests are not a security review.', show: ['gaps'], pulse: ['gaps'] },
			{ say: 'Because nothing opens a port or a database, tests can run anywhere.', show: ['note'] }
		]
	},
	{
		id: 'ap-logs-and-boot',
		topic: 'apis',
		group: 'ap-testing-and-ops',
		title: 'What the log shows, and does not',
		blurb: 'Where did the admin key end up in the server log?',
		stage: { w: 360, h: 376 },
		nodes: [
			{ id: 'd1', kind: 'doc', x: 16, y: 14, w: 328, title: 'Real log line for HEAD /health', lines: ['reqId: req-2r', 'req.method: HEAD', 'req.url: /health', 'req.host: 127.0.0.1:4100', 'req.remoteAddress: 127.0.0.1', 'msg: incoming request'], hl: [] },
			{
				id: 'd2',
				kind: 'doc',
				x: 16,
				y: 14,
				w: 328,
				title: 'Real log line for call 33',
				lines: ['reqId: req-2n', 'req.method: GET', 'req.url: /cardify/admin/demostore/settings', '        ?x-admin-key=<ADMIN_API_KEY>', 'req.host: 127.0.0.1:4100', 'msg: incoming request'],
				hl: [],
				tone: 'neg'
			},
			{ id: 'hb', kind: 'box', x: 16, y: 158, w: 328, h: 46, label: 'Request headers are not logged', sub: 'so x-admin-key never reaches the log' },
			{ id: 'rule', kind: 'box', x: 16, y: 226, w: 328, h: 46, label: 'Secrets go in headers, not URLs', sub: 'URLs end up in logs, history and proxies', tone: 'accent' },
			{ id: 'ops', kind: 'doc', x: 16, y: 288, w: 328, title: 'At start and stop', lines: ['GET /health returns {"ok":true}', 'table: CREATE TABLE IF NOT EXISTS', 'SIGINT/SIGTERM: close app, close DB'] }
		],
		steps: [
			{ say: 'Fastify writes each request as a JSON log line with a request id, so the incoming and completed lines of one request can be matched.', show: ['d1'], focus: ['d1'] },
			{ say: 'It records the method, the URL, the host and the caller\'s address. Nothing about request headers.', set: { d1: { hl: [1, 2, 3, 4] } } },
			{ say: 'So a key sent in the x-admin-key header never reaches the log. In the whole probing session the key appeared in it exactly once.', show: ['hb'], focus: ['hb'] },
			{ say: 'That once was call 33, which put the key in the query string. The URL is logged, so the secret was written out in plain text.', hide: ['d1'], show: ['d2'], set: { d2: { hl: [2, 3] } } },
			{ say: 'The rule: secrets go in headers, never in URLs. URLs are logged, kept in browser history and seen by proxies.', show: ['rule'], pulse: ['rule'] },
			{ say: 'The rest of operations is small: /health answers, the table is created IF NOT EXISTS on every boot, and a stop signal closes the app and the database.', show: ['ops'], focus: ['ops'] },
			{ say: 'With no DATABASE_URL the database is skipped entirely, so a developer starts the API with one command and an admin key.', set: { ops: { hl: [] } }, focus: ['ops'] }
		]
	},

	// ───────────── ap-gaps-and-next ─────────────
	{
		id: 'ap-gap-review',
		topic: 'apis',
		group: 'ap-gaps-and-next',
		title: 'Eight gaps seen in the real runs',
		blurb: 'What did the runs find that the API still needs to fix?',
		stage: { w: 360, h: 292 },
		nodes: [
			{
				id: 'g',
				kind: 'doc',
				x: 16,
				y: 14,
				w: 328,
				title: 'Gaps seen in the real runs',
				lines: [
					'1 One shared admin key, no user identity',
					'2 Key kept in localStorage in plain text',
					'3 No rate limit: 60 bad keys, 60 times 401',
					'4 No security headers (6 of 6 absent)',
					'5 Two error shapes (app and framework)',
					'6 404 where 405 is expected',
					'7 Bundle cache header differs from source',
					'8 A secret in a URL is logged'
				],
				hl: [],
				visible: true
			},
			{ id: 'ev', kind: 'box', x: 16, y: 200, w: 328, h: 52, label: 'Each gap has a call or a file behind it', sub: 'calls 19 to 33, App.tsx, the README', tone: 'accent' }
		],
		steps: [
			{ say: 'The runs found good practice and real gaps. These are the gaps, each tied to a call or a file, because a review needs evidence.', focus: ['g'] },
			{ say: 'One shared admin key serves everyone. The README lists per-merchant admin auth as not included, so there is no user identity and no audit trail.', set: { g: { hl: [0] } } },
			{ say: 'The admin saves that key in localStorage as plain text. The password field only masks it on screen; any script on the page can read it.', set: { g: { hl: [1] } } },
			{ say: 'Sixty wrong keys in a row all got 401 with no delay and no 429 (call 31). Only the length of the key slows a guesser.', set: { g: { hl: [2] } } },
			{ say: 'Call 32 looked for six security headers on an admin response: HSTS, nosniff, frame, CSP, referrer and permissions policy. None was there.', set: { g: { hl: [3] } } },
			{ say: 'Errors come in two shapes: an error field from the app, and statusCode, code, error and message from the framework (calls 19, 20, 25, 30).', set: { g: { hl: [4] } } },
			{ say: 'A wrong method gets 404, not 405 (calls 26, 27), and bundles go out as public, max-age=0 although the source asks for no-cache (call 24).', set: { g: { hl: [5, 6] } } },
			{ say: 'Call 33 showed a key in the URL landing in the server log. That was the caller\'s mistake, but the server can log paths without query strings.', set: { g: { hl: [7] } } },
			{ say: 'None of these breaks the demo. They are what to fix before real merchants rely on it.', show: ['ev'], pulse: ['ev'] }
		]
	},
	{
		id: 'ap-fix-order',
		topic: 'apis',
		group: 'ap-gaps-and-next',
		title: 'What to fix first',
		blurb: 'In what order should the gaps be closed, and why?',
		stage: { w: 360, h: 380 },
		nodes: [
			...stack(
				'f',
				[
					{ l: '1  Rate limit and lockout', s: 'cheap, and it blocks key guessing', tone: 'accent' },
					{ l: '2  Security headers', s: 'cheap, and a CSP shrinks XSS risk', tone: 'accent' },
					{ l: '3  A real admin sign-in', s: 'takes the key out of localStorage', tone: 'warn' },
					{ l: '4  Roles and an audit log', s: 'who changed what, and when' },
					{ l: '5  Tidy the contract', s: 'one error shape, 405, the cache header' }
				],
				{ x: 16, w: 328, y: 14, h: 44, gap: 22 }
			),
			{ id: 'note', kind: 'text', x: 180, y: 352, text: 'Cheapest risk first, structure next, tidying last.', size: 'sm', anchor: 'middle' }
		],
		steps: [
			{ say: 'First, a rate limit and lockout, plus a long random key. It is cheap, and today only the key\'s length slows a guesser (call 31).', focus: ['f0'] },
			{ say: 'Second, security headers, above all a Content-Security-Policy. Also cheap, and it lowers the chance of script injection reaching the stored key.', show: ['f1', 'fe0'], focus: ['f1'] },
			{ say: 'Third, a real sign-in so the browser never holds the key. The biggest risk reduction and the biggest change, so it follows the quick wins.', show: ['f2', 'fe1'], focus: ['f2'] },
			{ say: 'Fourth, a role and a name on every change, with an audit log, so you can answer who changed what.', show: ['f3', 'fe2'], focus: ['f3'] },
			{ say: 'Last, tidy the contract: one error shape, 405 for a wrong method, the cache header the source intended. These change clarity, not risk.', show: ['f4', 'fe3'], focus: ['f4'] },
			{ say: 'The order is not a law. It is cheapest risk reduction first, then the structural change, then the clean-up.', show: ['note'] }
		]
	},
	{
		id: 'ap-safer-admin-login',
		topic: 'apis',
		group: 'ap-gaps-and-next',
		title: 'A safer admin login',
		blurb: 'What would replace the key in localStorage?',
		stage: { w: 360, h: 408 },
		nodes: [
			...stack(
				'p',
				[
					{ l: 'Admin page', s: 'holds no key' },
					{ l: 'Sign in', s: 'OIDC, or password + MFA' },
					{ l: 'Server session', s: 'an HttpOnly cookie' },
					{ l: 'Admin server (BFF)', s: 'adds the API credential' },
					{ l: 'Cardify API', s: 'checks user and role' }
				],
				{ x: 16, w: 170, y: 14, h: 44, gap: 28 }
			),
			{ id: 'today', kind: 'doc', x: 196, y: 14, w: 152, title: 'Today', lines: ['key in localStorage', 'sent as x-admin-key', 'one key for everyone'], tone: 'neg' },
			{ id: 'safer', kind: 'doc', x: 196, y: 120, w: 152, title: 'Safer', lines: ['HttpOnly cookie', 'tokens stay on server', 'a role on every call'], tone: 'accent' },
			{ id: 'note', kind: 'text', x: 16, y: 392, w: 328, text: 'For a local demo the shared key is fine; for real merchants it is not.', size: 'sm' }
		],
		steps: [
			{ say: 'Today the admin page holds the key itself and sends it with every call.', show: ['today'], focus: ['today'] },
			{ say: 'Instead the admin signs in. That can be OpenID Connect with an identity provider, or a password with a second factor.', show: ['p1', 'pe0'], focus: ['p1'] },
			{ say: 'The server starts a session and gives the browser one cookie: HttpOnly so scripts cannot read it, Secure, and SameSite.', show: ['p2', 'pe1'], focus: ['p2'] },
			{ say: 'A small admin server, a backend-for-frontend, receives that cookie and keeps any API credential to itself.', show: ['p3', 'pe2'], focus: ['p3'] },
			{ say: 'The API checks who the user is and what role they hold on every call, so it can record who changed what.', show: ['p4', 'pe3'], focus: ['p4'] },
			{ say: 'A script injected into the page can no longer copy a key out of storage, each change has a name on it, and a lost session can be revoked.', show: ['safer'], pulse: ['safer'] },
			{ say: 'This is the pattern the Auth and tokens section teaches: token storage, cookies and CSRF, OAuth and OpenID Connect, roles.', set: { p0: { tone: 'accent' } } },
			{ say: 'It costs more than a shared key, which is why the demo does not have it.', show: ['note'] }
		]
	}
];
