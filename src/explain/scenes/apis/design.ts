import type { Scene, SceneNode, Tone } from '../../types';

/**
 * APIs in practice, design area: configuration, the third-party surface, client storage, observability and a balanced review.
 * Names, hosts and ids from the observed store are changed; the shapes (methods, statuses, headers, counts) are what was seen.
 */

// A vertical chain of boxes joined by arrows: box ids `<p>0..n`, edge ids `<p>e0..` (edge i joins box i and box i+1). The first box starts visible.
type Item = { l: string; s?: string; tone?: Tone };
const stack = (p: string, items: Item[], o: { x?: number; w?: number; y?: number; h?: number; gap?: number } = {}): SceneNode[] => {
	const { x = 16, w = 328, y = 14, h = 44, gap = 28 } = o;
	const out: SceneNode[] = [];
	items.forEach((it, i) => {
		out.push({ id: p + i, kind: 'box', x, y: y + i * (h + gap), w, h, label: it.l, sub: it.s, tone: it.tone, visible: i === 0 ? true : undefined });
		if (i) out.push({ id: p + 'e' + (i - 1), kind: 'edge', from: p + (i - 1), to: p + i });
	});
	return out;
};

// One review line: a short problem, padded, then the fix.
const row = (problem: string, fix: string) => problem.padEnd(22) + '-> ' + fix;

export const apDesign: Scene[] = [
	// ───────────── ap-env-and-config ─────────────
	{
		id: 'ap-env-visibility',
		topic: 'apis',
		group: 'ap-env-and-config',
		title: 'Which variables reach the browser',
		blurb: 'Which environment variables end up in code that every visitor can read?',
		stage: { w: 360, h: 290 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				title: 'One env file, two readers',
				colW: 110,
				cols: ['Variable', 'Prefix', 'Browser sees?'],
				rows: [
					['API_TOKEN', 'none', 'No'],
					['MERCHANT_ID', 'none', 'No'],
					['NEXT_PUBLIC_ID', 'public', 'Yes'],
					['NEXT_PUBLIC_KEY', 'public', 'Yes, in the JS']
				],
				visible: true
			},
			{ id: 'warn', kind: 'box', x: 16, y: 160, w: 328, h: 46, label: 'A secret in a public variable', sub: 'is published to every visitor', tone: 'neg' },
			{ id: 'fix', kind: 'box', x: 16, y: 222, w: 328, h: 46, label: 'Keep it server-only', sub: 'the browser calls a same-origin route', tone: 'accent' }
		],
		steps: [
			{ say: 'One env file feeds two readers. The server reads every variable, but the browser bundle only receives the public-prefixed ones.', focus: ['t'] },
			{ say: 'A token or a merchant id without the prefix stays on the server and never reaches a visitor.', set: { t: { hl: [0, 1] } } },
			{ say: 'A public-prefixed variable is copied into the client code when the app is built, so anyone can read it.', set: { t: { hl: [2] } } },
			{ say: 'Put a key in a public variable and it is published with the JavaScript. A cleverly chosen name does not hide it.', set: { t: { hl: [3] } }, show: ['warn'], pulse: ['warn'] },
			{ say: 'The rule: secrets stay server-side, and the browser calls a same-origin route that adds them.', show: ['fix'], focus: ['fix'] },
			{ say: 'This is how the store keeps its platform token off the client: the route holds it, the page never sees it.', set: { t: { hl: [0, 1] } }, pulse: ['fix'] }
		]
	},
	{
		id: 'ap-empty-env',
		topic: 'apis',
		group: 'ap-env-and-config',
		title: 'The empty-string trap',
		blurb: 'Why does an env var that is present but empty slip past a fallback?',
		stage: { w: 360, h: 250 },
		nodes: [
			{ id: 'd1', kind: 'doc', x: 16, y: 14, w: 328, title: '.env.example ships empty values', lines: ['MERCHANT_ID=', 'API_TOKEN='], visible: true },
			{ id: 'd2', kind: 'doc', x: 16, y: 90, w: 328, title: 'With the nullish operator', lines: ['value = ""', 'value ?? "fallback"   ->  ""'] },
			{ id: 'd3', kind: 'doc', x: 16, y: 166, w: 328, title: 'With the or operator', lines: ['value = ""', 'value || "fallback"   ->  "fallback"'] },
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				title: 'Which one falls back?',
				colW: 100,
				cols: ['Input', 'Nullish', 'Or'],
				rows: [
					['undefined', 'fallback', 'fallback'],
					['"" (empty)', '"" (empty)', 'fallback'],
					['"abc"', 'abc', 'abc']
				]
			},
			{ id: 'rule', kind: 'box', x: 16, y: 140, w: 328, h: 50, label: 'Use the or operator for env values', sub: 'an empty value should count as not set', tone: 'accent' }
		],
		steps: [
			{ say: 'An example env file often ships variables with no value. A variable that is present but empty is the empty string, not undefined.', focus: ['d1'] },
			{ say: 'The nullish operator only falls back on null or undefined, so the empty string passes straight through to the code.', show: ['d2'], focus: ['d2'] },
			{ say: 'The or operator treats the empty string as missing, so the fallback is used and the empty value does not slip by.', show: ['d3'], focus: ['d3'] },
			{ say: 'Side by side: both fall back for undefined, but only the or operator falls back for an empty value.', hide: ['d1', 'd2', 'd3'], show: ['t'], set: { t: { hl: [1] } } },
			{ say: 'Use the or operator for env values, because an empty value should count as not set.', show: ['rule'], focus: ['rule'] },
			{ say: 'A boot check goes one step further: an empty merchant id stops the app at start instead of failing later.', set: { t: { hl: [] } }, pulse: ['rule'] }
		]
	},
	{
		id: 'ap-two-names-silent-400',
		topic: 'apis',
		group: 'ap-env-and-config',
		title: 'One value, two names, no error',
		blurb: 'How did a missing server-only variable end in an empty list and no visible error?',
		stage: { w: 360, h: 362 },
		nodes: stack('c', [
			{ l: 'Only the public name is set', s: 'the server-only name stays empty' },
			{ l: 'The route builds its request', s: 'x-merchant-id is an empty string' },
			{ l: 'The platform answers 400', s: 'it does not know that merchant', tone: 'warn' },
			{ l: 'The handler returns an empty list', s: 'no apps shown and no visible error', tone: 'warn' },
			{ l: 'Fix: validate and log', s: 'read both names, log every degrade', tone: 'accent' }
		]),
		steps: [
			{ say: 'An operator sets only the public merchant id. The same value is exposed under two names, and the server-only one is empty.', focus: ['c0'] },
			{ say: 'The server route copies the empty value into the x-merchant-id header of its request to the platform.', show: ['c1', 'ce0'], focus: ['c1'] },
			{ say: 'The platform cannot match an empty id, so it answers with a 400 error.', show: ['c2', 'ce1'], focus: ['c2'] },
			{ say: 'The handler is built to degrade when the platform fails, so it returns an empty list and the page shows no apps.', show: ['c3', 'ce2'], focus: ['c3'] },
			{ say: 'Nothing on screen or in the logs says why. A graceful fallback hid a configuration bug.', set: { c3: { tone: 'neg' } }, pulse: ['c3'] },
			{ say: 'The fix: read both names, check the value at boot, and log every time the handler degrades.', show: ['c4', 'ce3'], focus: ['c4'] }
		]
	},

	// ───────────── ap-third-party-surface ─────────────
	{
		id: 'ap-hosts-per-page',
		topic: 'apis',
		group: 'ap-third-party-surface',
		title: 'Outside hosts per page view',
		blurb: 'How many outside hosts does one page view of the store reach?',
		stage: { w: 360, h: 300 },
		nodes: [
			{
				id: 't1',
				kind: 'table',
				x: 16,
				y: 14,
				title: 'Requests per page view',
				colW: 80,
				cols: ['Page', 'Store', 'Outside', 'Hosts'],
				rows: [
					['Home', '9', '21', '9'],
					['Collection', '9', '16', '9'],
					['Product', '9', '20', '10'],
					['Search', '9', '18', '10']
				],
				visible: true
			},
			{
				id: 't2',
				kind: 'table',
				x: 16,
				y: 160,
				title: 'Blocked during the run',
				colW: 108,
				cols: ['Page', 'Trackers', 'Writes'],
				rows: [
					['Home', '4', '5'],
					['Collection', '4', '5'],
					['Product', '4', '5'],
					['Search', '4', '4']
				]
			}
		],
		steps: [
			{ say: 'Four page views in a real browser. The store answered 9 calls each time, and outside hosts answered 16 to 21.', focus: ['t1'] },
			{ say: 'The product page reached 10 different outside hosts, as many as any of the four.', set: { t1: { hl: [2] } } },
			{ say: 'To keep the run read-only I blocked tracker scripts, 4 per page, and write requests, 4 or 5 per page.', show: ['t2'], set: { t1: { hl: [] } } },
			{ say: '19 writes were blocked in all: 14 to the platform API and 5 to the analytics collector, in batches of 1.5 to 9 KB.', set: { t2: { hl: [0, 1, 2, 3] } } },
			{ say: 'The search page added the platform search API, called straight from the browser.', set: { t1: { hl: [3] }, t2: { hl: [] } } },
			{ say: 'Every host is a company whose code or servers the page now depends on.', set: { t1: { hl: [0, 1, 2, 3] } }, pulse: ['t1'] }
		]
	},
	{
		id: 'ap-script-reach',
		topic: 'apis',
		group: 'ap-third-party-surface',
		title: 'What a vendor script can reach',
		blurb: 'What can a script from another company do once it runs on your page?',
		stage: { w: 360, h: 250 },
		nodes: [
			{ id: 'sc', kind: 'box', x: 110, y: 14, w: 140, h: 44, label: 'Vendor script', sub: 'loaded on your page', visible: true },
			{ id: 'pg', kind: 'box', x: 16, y: 110, w: 76, h: 56, label: 'Page', sub: 'reads and edits' },
			{ id: 'st', kind: 'box', x: 104, y: 110, w: 76, h: 56, label: 'Storage', sub: 'localStorage' },
			{ id: 'ck', kind: 'box', x: 192, y: 110, w: 76, h: 56, label: 'Cookies', sub: 'not HttpOnly' },
			{ id: 'nw', kind: 'box', x: 280, y: 110, w: 76, h: 56, label: 'Network', sub: 'sends anywhere' },
			{ id: 'e1', kind: 'edge', from: 'sc', to: 'pg' },
			{ id: 'e2', kind: 'edge', from: 'sc', to: 'st' },
			{ id: 'e3', kind: 'edge', from: 'sc', to: 'ck' },
			{ id: 'e4', kind: 'edge', from: 'sc', to: 'nw' },
			{ id: 'note', kind: 'text', x: 16, y: 204, w: 328, text: 'It runs with the same rights as your own code.' }
		],
		steps: [
			{ say: 'A vendor script is loaded onto your page so it can do its job: analytics, login, translation or ads.', focus: ['sc'] },
			{ say: 'It can read and change the page the visitor sees.', show: ['pg', 'e1'], focus: ['pg'] },
			{ say: 'It can read local storage, where the store kept a per-store cart token and vendors kept ids and queues.', show: ['st', 'e2'], focus: ['st'] },
			{ say: 'It can read every cookie that is not HttpOnly. In the run, none of the 15 cookies was HttpOnly.', show: ['ck', 'e3'], focus: ['ck'] },
			{ say: 'It can send requests to any host, including its own servers.', show: ['nw', 'e4'], focus: ['nw'] },
			{ say: 'It runs with the same rights as your own code, so each vendor is a trust decision.', show: ['note'], set: { sc: { tone: 'warn' } }, pulse: ['sc'] }
		]
	},
	{
		id: 'ap-script-controls',
		topic: 'apis',
		group: 'ap-third-party-surface',
		title: 'Controls that shrink the surface',
		blurb: 'Which controls limit what third-party scripts can do?',
		stage: { w: 360, h: 244 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 164,
				cols: ['Control', 'What it limits'],
				rows: [
					['Load only what you need', 'fewer hosts and scripts'],
					['Wait for consent', 'no script before a yes'],
					['First-party endpoint', 'the vendor sees less'],
					['CSP script-src list', 'only listed hosts run']
				],
				visible: true
			},
			{
				id: 'd',
				kind: 'doc',
				x: 16,
				y: 150,
				w: 328,
				title: 'Example header (illustrative)',
				lines: ['Content-Security-Policy:', "  script-src 'self' scripts.vendor.example", "  frame-ancestors 'self'"]
			}
		],
		steps: [
			{ say: 'Four controls shrink the third-party surface. They work best together.', focus: ['t'] },
			{ say: 'Load only what you need: every script removed is one less host with access to the page.', set: { t: { hl: [0] } } },
			{ say: 'Wait for consent where the rules require it, so tracking scripts do not run before a yes.', set: { t: { hl: [1] } } },
			{ say: 'A first-party endpoint lets the store forward an event itself, so the vendor sees less of the visitor.', set: { t: { hl: [2] } } },
			{ say: 'A content security policy script-src list names the hosts allowed to run code. Anything else is refused.', set: { t: { hl: [3] } }, show: ['d'] },
			{ say: 'In the run the store set only frame-ancestors, which controls who may embed the store, not what runs on it.', set: { d: { hl: [2] }, t: { hl: [] } } }
		]
	},

	// ───────────── ap-client-storage ─────────────
	{
		id: 'ap-storage-inventory',
		topic: 'apis',
		group: 'ap-client-storage',
		title: 'What a visitor collects',
		blurb: 'How many keys and cookies does a visitor end up with after four page views?',
		stage: { w: 360, h: 232 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				title: 'After four page views',
				colW: 110,
				cols: ['Place', 'Keys', 'Set by'],
				rows: [
					['localStorage', '13', 'store + vendors'],
					['sessionStorage', '6', 'vendors'],
					['Cookies', '15', 'store + vendors'],
					['Store cookies', '1', 'locale only']
				],
				visible: true
			},
			{ id: 'note', kind: 'box', x: 16, y: 160, w: 328, h: 46, label: 'Every one is readable by script', sub: 'none of the 15 cookies was HttpOnly', tone: 'warn' }
		],
		steps: [
			{ say: 'After four page views the browser held 13 local storage keys, 6 session storage keys and 15 cookies.', focus: ['t'] },
			{ say: 'Local storage kept a per-store cart token beside vendor ids, analytics queues, config caches and offer timers.', set: { t: { hl: [0] } } },
			{ say: 'The 15 cookies included several duplicates, one per domain, from the store and from vendor scripts.', set: { t: { hl: [2] } } },
			{ say: 'The store itself set one cookie, locale. Everything else came from vendor scripts running on the page.', set: { t: { hl: [3] } } },
			{ say: 'Every cookie was readable by script, because none was HttpOnly.', set: { t: { hl: [] } }, show: ['note'], pulse: ['note'] }
		]
	},
	{
		id: 'ap-cookie-flags-seen',
		topic: 'apis',
		group: 'ap-client-storage',
		title: 'Cookie flags seen in the run',
		blurb: 'Which flags did the cookies carry, and which protection was missing?',
		stage: { w: 360, h: 290 },
		nodes: [
			{
				id: 'd',
				kind: 'doc',
				x: 16,
				y: 14,
				w: 328,
				title: 'Cookie flags seen (names changed)',
				lines: [
					'store locale      Lax, 365 days',
					'__Host- session   Secure, None, JS-set',
					'vendor config     Secure, SameSite=None',
					'analytics ids     Secure, up to 400 days',
					'pixel cookie      Lax, 90 days',
					'vendor user id    Secure, 365 days',
					'HttpOnly on any of them: none'
				],
				visible: true
			},
			{ id: 'warn', kind: 'box', x: 16, y: 172, w: 328, h: 46, label: 'The session-like cookie is JS-set', sub: 'a script writes it, so script can read it', tone: 'warn' },
			{ id: 'ok', kind: 'box', x: 16, y: 232, w: 328, h: 46, label: 'The prefix still helps', sub: '__Host- means Secure, Path=/ and no Domain', tone: 'accent' }
		],
		steps: [
			{ say: 'Cookie flags seen in the run, with names changed. Vendor cookies mostly carry Secure and SameSite=None.', focus: ['d'] },
			{ say: "The store's own cookie, locale, is Lax and lasts 365 days. It holds a language, so script access is harmless.", set: { d: { hl: [0] } } },
			{ say: 'A session id cookie uses the __Host- prefix and Secure, but it is not HttpOnly because a vendor script writes it from the page.', set: { d: { hl: [1] } }, show: ['warn'] },
			{ say: 'Vendor cookies use SameSite=None with Secure so they work across sites. That suits vendor features, not the store sessions.', set: { d: { hl: [2, 3, 5] } } },
			{ say: 'A pixel cookie is Lax and lives 90 days.', set: { d: { hl: [4] } } },
			{ say: 'The __Host- prefix is still useful: browsers accept it only if the cookie is Secure, has Path=/ and sets no Domain.', set: { d: { hl: [1] } }, show: ['ok'] },
			{ say: 'HttpOnly was missing on every cookie, so script could read all of them.', set: { d: { hl: [6] } }, pulse: ['d'] }
		]
	},
	{
		id: 'ap-guest-vs-credential',
		topic: 'apis',
		group: 'ap-client-storage',
		title: 'A guest id is not a credential',
		blurb: 'Which stored values are sensitive, and where should each one live?',
		stage: { w: 360, h: 290 },
		nodes: [
			{ id: 'a', kind: 'box', x: 16, y: 14, w: 154, h: 52, label: 'Guest cart id', sub: 'names a cart', visible: true },
			{ id: 'b', kind: 'box', x: 190, y: 14, w: 154, h: 52, label: 'Login credential', sub: 'acts as the user', tone: 'warn' },
			{ id: 'a2', kind: 'box', x: 16, y: 110, w: 154, h: 60, label: 'Local storage is acceptable', sub: 'low value if read' },
			{ id: 'b2', kind: 'box', x: 190, y: 110, w: 154, h: 60, label: 'Server session cookie', sub: 'HttpOnly and Secure', tone: 'accent' },
			{ id: 'ea', kind: 'edge', from: 'a', to: 'a2' },
			{ id: 'eb', kind: 'edge', from: 'b', to: 'b2' },
			{ id: 'note', kind: 'text', x: 16, y: 206, w: 328, text: 'In the run: a per-store cart token, and no login credential.' },
			{ id: 'link', kind: 'text', x: 16, y: 252, w: 328, text: 'See the token-storage lessons in Auth and tokens.', size: 'sm' }
		],
		steps: [
			{ say: 'Not every stored value is equally sensitive. A guest cart id only names a cart.', focus: ['a'] },
			{ say: 'A login credential acts as the user. Whoever holds it can use the account.', show: ['b'], focus: ['b'] },
			{ say: 'If a script reads a guest cart id the harm is small, so local storage is an acceptable place for it.', show: ['a2', 'ea'], focus: ['a2'] },
			{ say: 'A login credential belongs in a server session behind an HttpOnly, Secure cookie that scripts cannot read.', show: ['b2', 'eb'], focus: ['b2'] },
			{ say: 'In the run the browser held a per-store cart token and no login credential at all.', show: ['note'] },
			{ say: 'The Auth and tokens section covers token storage in depth: memory, cookies and the backend-for-frontend pattern.', show: ['link'], pulse: ['b2'] }
		]
	},

	// ───────────── ap-observability ─────────────
	{
		id: 'ap-request-id-trace',
		topic: 'apis',
		group: 'ap-observability',
		title: 'One request id, one trail',
		blurb: 'How does a request id let you follow one request through responses and logs?',
		stage: { w: 360, h: 304 },
		nodes: [
			{ id: 'b1', kind: 'box', x: 16, y: 14, w: 328, h: 40, label: 'The sender posts a delivery', sub: 'with its own event id', visible: true },
			{ id: 'resp', kind: 'doc', x: 16, y: 70, w: 328, title: 'Response', lines: ['HTTP 401', '{"error":"Invalid signature",', ' "requestId":"wh_<id>"}'] },
			{
				id: 'log',
				kind: 'doc',
				x: 16,
				y: 160,
				w: 328,
				title: 'Server log (illustrative)',
				lines: ['[EVT:r1a2] [AUTH] bad signature', '[EVT:r1a2] [RESPOND] 401', '[EVT:r9z8] [AUTH] OK']
			},
			{ id: 'b2', kind: 'box', x: 16, y: 252, w: 328, h: 40, label: 'Search for r1a2 follows one request', tone: 'accent' }
		],
		steps: [
			{ say: 'The platform sends a webhook delivery. It carries its own event id, which the store can use to correlate.', focus: ['b1'] },
			{ say: 'The store refuses the unsigned request with a 401. Every response carries a request id.', show: ['resp'], focus: ['resp'] },
			{ say: 'Whoever reports the failed delivery can quote that id, so nobody has to guess which request it was.', set: { resp: { hl: [2] } } },
			{ say: 'Each log line is tagged with a prefix and the request id, so lines of different requests can be told apart.', show: ['log'], focus: ['log'] },
			{ say: 'One search for the id returns every step of that request and nothing from other requests.', set: { log: { hl: [0, 1] } }, show: ['b2'] },
			{ say: 'The line tagged with another id stays out of the result.', set: { log: { hl: [2] } }, pulse: ['b2'] }
		]
	},
	{
		id: 'ap-health-and-silence',
		topic: 'apis',
		group: 'ap-observability',
		title: 'Health checks and silent skips',
		blurb: 'What can a health check reveal, and why should a skipped step say so?',
		stage: { w: 360, h: 270 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				title: 'Three kinds of probe',
				colW: 108,
				cols: ['Probe', 'Checks', 'Reveals'],
				rows: [
					['Shallow health', 'nothing behind', 'up or not'],
					['Safe probe', 'no config shown', 'healthy + time'],
					['Deep check', 'dependencies', 'needs protecting']
				],
				visible: true
			},
			{ id: 'b', kind: 'box', x: 16, y: 140, w: 328, h: 50, label: 'A disabled step says so', sub: 'warming off is logged, not skipped silently', tone: 'accent' },
			{ id: 'b2', kind: 'box', x: 16, y: 204, w: 328, h: 50, label: 'Silence hides mistakes', sub: 'a missing base address would go unnoticed', tone: 'warn' }
		],
		steps: [
			{ say: 'A health check can do very different jobs. Three kinds appeared in the store design.', focus: ['t'] },
			{ say: 'A shallow health check returns 200 without checking anything behind it. It proves the process is up, nothing more.', set: { t: { hl: [0] } } },
			{ say: 'A safe probe answers healthy with a time and reveals nothing about configuration, because anyone can call it.', set: { t: { hl: [1] } } },
			{ say: 'A deep check verifies dependencies such as the cache or the database. It tells more, so it should sit behind protection.', set: { t: { hl: [2] } } },
			{ say: 'When a step is switched off, the code logs that it is disabled. After a purge, page warming says so if no base address is set.', set: { t: { hl: [] } }, show: ['b'] },
			{ say: 'Skipping a step silently would hide a missing setting, the same trap as an empty value that degrades to an empty list.', show: ['b2'], pulse: ['b2'] }
		]
	},

	// ───────────── ap-review-and-next ─────────────
	{
		id: 'ap-works-well',
		topic: 'apis',
		group: 'ap-review-and-next',
		title: 'What the traffic shows working',
		blurb: 'Which practices held up in the observed traffic, and what did each buy?',
		stage: { w: 360, h: 180 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				title: 'Practices that hold up',
				colW: 164,
				cols: ['Practice', 'What it buys'],
				rows: [
					['Same-origin proxy', 'secrets stay on server'],
					['Signed webhooks', 'replays are refused'],
					['Tagged cache + purge', 'fresh pages, few renders'],
					['Shopper-aware limits', 'one shopper, one budget'],
					['Fail-soft reads', 'last good page survives']
				],
				visible: true
			}
		],
		steps: [
			{ say: 'The observed traffic shows five practices working. They are why the store holds up.', focus: ['t'] },
			{ say: 'A same-origin proxy keeps the platform token and the store address on the server, so the browser never holds them.', set: { t: { hl: [0] } } },
			{ say: 'Signed webhooks with a timestamp refuse unsigned and replayed deliveries, and every answer carries a request id.', set: { t: { hl: [1] } } },
			{ say: 'Tagged caching with webhook purges keeps pages fresh with few renders, and page warming gives the first visitor a hit.', set: { t: { hl: [2] } } },
			{ say: "Forwarding the shopper's IP on uncached calls lets the platform rate-limit each shopper on their own.", set: { t: { hl: [3] } } },
			{ say: 'Fail-soft reads keep a last good page when the platform is unavailable, and a 429 counts as unavailable.', set: { t: { hl: [4] } } }
		]
	},
	{
		id: 'ap-review-findings',
		topic: 'apis',
		group: 'ap-review-and-next',
		title: 'Eight items a reviewer would flag',
		blurb: 'Which outside-visible items stood out, and what is the easy fix for each?',
		stage: { w: 360, h: 190 },
		nodes: [
			{
				id: 'd',
				kind: 'doc',
				x: 16,
				y: 14,
				w: 328,
				title: 'What a reviewer would flag',
				lines: [
					row('apps call x3 per page', 'fetch it once'),
					row('blanket /api header', 'scope by route'),
					row('not found, 3 ways', 'one rule'),
					row('no hardening headers', 'add at the edge'),
					row('locale cookie twice', 'set it once'),
					row('shallow /health', 'add a deep check'),
					row('~10 third-party hosts', 'trim, gate'),
					row('cart token in storage', 'guest id only')
				],
				visible: true
			}
		],
		steps: [
			{ say: 'Eight items stood out from outside, each with an easy fix. Most are small.', focus: ['d'] },
			{ say: 'The same same-origin call fired three times per page view and took up to 2 s in dev mode. Fetch it once and share it.', set: { d: { hl: [0] } } },
			{ say: 'A blanket cache header on every /api route also lands on errors and on routes that wanted no-store. Scope it per route.', set: { d: { hl: [1] } } },
			{ say: 'A missing product gave 200 with noindex, an unknown menu gave 200 null and a bad handle gave 400. Pick one rule for not found.', set: { d: { hl: [2] } } },
			{ say: 'In dev mode there was no Strict-Transport-Security, X-Content-Type-Options or Referrer-Policy, and the policy only had frame-ancestors.', set: { d: { hl: [3] } } },
			{ say: 'Some pages sent two locale cookies, a sign the middleware ran twice. Set it once.', set: { d: { hl: [4] } } },
			{ say: 'The /health route checks nothing behind it. Keep it for liveness and add a protected deep check.', set: { d: { hl: [5] } } },
			{ say: 'About ten outside hosts per page, every cookie readable by script. Trim, gate on consent and add a script-src list.', set: { d: { hl: [6] } } },
			{ say: 'A guest cart token in local storage is fine as a cart id. Never let a login credential live there.', set: { d: { hl: [7] } } }
		]
	},
	{
		id: 'ap-fix-order',
		topic: 'apis',
		group: 'ap-review-and-next',
		title: 'What to fix first',
		blurb: 'In what order should the findings be fixed, and why?',
		stage: { w: 360, h: 362 },
		nodes: stack('c', [
			{ l: '1. Trim and gate third-party scripts', s: 'the widest reach into the page', tone: 'warn' },
			{ l: '2. Fetch the repeated call once', s: 'cuts load and latency on every page' },
			{ l: '3. Scope the /api cache header', s: 'errors and no-store routes first' },
			{ l: '4. Add hardening headers', s: 'at the edge or in config' },
			{ l: '5. The small fixes', s: 'one cookie, deep health check, one not-found rule' }
		]),
		steps: [
			{ say: 'Start with third-party scripts: trim and gate them, because they reach the page and its storage, the widest exposure.', focus: ['c0'] },
			{ say: 'Second, fetch the repeated call once. It cuts load and latency on every page view.', show: ['c1', 'ce0'], focus: ['c1'] },
			{ say: 'Third, scope the blanket cache header so error responses and no-store routes are not cached by accident.', show: ['c2', 'ce1'], focus: ['c2'] },
			{ say: 'Fourth, hardening headers. Set them at the edge or in config.', show: ['c3', 'ce2'], focus: ['c3'] },
			{ say: 'Last, the small fixes: one locale cookie, a deep health check, one not-found rule and only a guest id in storage.', show: ['c4', 'ce3'], focus: ['c4'] },
			{ say: 'Confirm each item against a production build first, because dev mode changes headers and timings.', set: { c0: { tone: 'accent' } }, pulse: ['c0'] }
		]
	}
];
