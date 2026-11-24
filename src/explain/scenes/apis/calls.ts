import type { Scene, SceneNode } from '../../types';
import { credit, ring, shot } from '../consoleKit';

/** APIs in practice, part 1: reading a real API by calling it (Cardify Lite, run locally). Ids `ap-*`; `group` = a topic id in src/db/apis/calls.ts. */

type View = { x: number; y: number; w: number };
const FULL = (nw: number): View => ({ x: 0, y: 0, w: nw });

/** A ring round a region given in FILE pixels, for a picture box at (bx, by) of width bw that shows `view`. */
const rg = (id: string, bx: number, by: number, bw: number, view: View, fx: number, fy: number, fw: number, fh: number, pad = 3): SceneNode => {
	const s = bw / view.w;
	return ring(id, Math.round(bx + (fx - view.x) * s - pad), Math.round(by + (fy - view.y) * s - pad), Math.round(fw * s + pad * 2), Math.round(fh * s + pad * 2));
};

const SHOT_CREDIT = 'Screenshot: Cardify Lite, run locally';

// the browser run, one line per request (times are ms since the run began)
const logRow = (ms: string | number, who: string, call: string, status: string) => `${String(ms).padStart(4)} ${who.padEnd(5)} ${call.padEnd(26)} ${status}`;

export const apCalls: Scene[] = [
	// ───────────── ap-map ─────────────
	{
		id: 'ap-system-map',
		topic: 'apis',
		group: 'ap-map',
		title: 'The parts of Cardify Lite',
		blurb: 'Which part calls which route, and which routes need a key?',
		stage: { w: 360, h: 320 },
		nodes: [
			{ id: 'sf', kind: 'box', x: 16, y: 14, w: 150, h: 52, label: 'Storefront', sub: 'port 4200, loader script', visible: true },
			{ id: 'be', kind: 'box', x: 80, y: 130, w: 200, h: 56, label: 'Backend', sub: 'port 4100, Fastify' },
			{ id: 'ad', kind: 'box', x: 194, y: 14, w: 150, h: 52, label: 'Admin website', sub: 'port 5173, React' },
			{ id: 'st', kind: 'db', x: 120, y: 238, w: 120, h: 40, label: 'Settings', sub: 'memory or MySQL' },
			{ id: 'e1', kind: 'edge', from: 'sf', to: 'be', label: 'public config', tone: 'accent' },
			{ id: 'e2', kind: 'edge', from: 'ad', to: 'be', label: 'key needed', tone: 'warn' },
			{ id: 'e3', kind: 'edge', from: 'be', to: 'st' }
		],
		steps: [
			{ say: 'A storefront includes one script tag, the loader. That script is its only link to Cardify Lite.', focus: ['sf'] },
			{ say: 'The backend keeps one settings record per merchant and serves the SDK files. It listens on port 4100.', show: ['be'], focus: ['be'] },
			{ say: 'The loader reads the public config route, GET /cardify/sdk/config/:merchantId. No key is needed, because every shopper\'s page makes this call.', show: ['e1'], focus: ['e1'] },
			{ say: 'The admin website is where a merchant edits the settings.', show: ['ad'], focus: ['ad'] },
			{ say: 'The admin calls GET and PUT on the admin settings route, and every call carries the x-admin-key header.', show: ['e2'], focus: ['e2'] },
			{ say: 'Settings are kept in memory by default and in MySQL when DATABASE_URL is set.', show: ['st', 'e3'], set: { st: { tone: 'accent' } }, focus: ['st'] }
		]
	},
	{
		id: 'ap-settings-resource',
		topic: 'apis',
		group: 'ap-map',
		title: 'The settings resource',
		blurb: 'What is in the one object this API reads and writes?',
		stage: { w: 360, h: 312 },
		nodes: [
			{
				id: 'd',
				kind: 'doc',
				x: 16,
				y: 14,
				w: 328,
				title: 'Public config after a save (merchant demostore)',
				lines: [
					'{',
					'  "enabled": true,',
					'  "design": "overlay",',
					'  "options": {',
					'    "accentColor": "#ed186f",',
					'    "textColor": "#111111",',
					'    "backgroundColor": "#ffffff",',
					'    "radius": 12,',
					'    "imageRatio": "4/5",',
					'    "showBadge": true,',
					'    "showQuickBuy": true,',
					'    "showRating": true,',
					'    "showCompareAt": false',
					'  },',
					'  "version": 1795534284949',
					'}'
				],
				hl: [],
				visible: true
			}
		],
		steps: [
			{ say: 'Everything this API stores for a merchant is one object. This is the real answer from the public config route after a save.', focus: ['d'] },
			{ say: 'enabled is the main switch: should the storefront use Cardify cards at all?', set: { d: { hl: [1] } } },
			{ say: 'design is one of five names: classic, minimal, overlay, hover-reveal or editorial.', set: { d: { hl: [2] } } },
			{ say: 'Three colours, each a 6-digit hex value. That is the only colour format the server accepts.', set: { d: { hl: [4, 5, 6] } } },
			{ say: 'radius rounds the corners (0 to 24) and imageRatio sets the picture shape.', set: { d: { hl: [7, 8] } } },
			{ say: 'Four toggles show or hide the badge, quick buy, rating and crossed-out compare price.', set: { d: { hl: [9, 10, 11, 12] } } },
			{ say: 'version is added by the server: the time of the last save in milliseconds. A merchant that never saved has version 0 and the defaults.', set: { d: { hl: [14] } } }
		]
	},

	// ───────────── ap-first-calls ─────────────
	{
		id: 'ap-health-call',
		topic: 'apis',
		group: 'ap-first-calls',
		title: 'The first call: /health',
		blurb: 'What does a plain curl call show, line by line?',
		stage: { w: 360, h: 240 },
		nodes: [
			{ id: 'rq', kind: 'doc', x: 16, y: 14, w: 328, lines: ['$ curl -i http://127.0.0.1:4100/health'], visible: true },
			{
				id: 'rs',
				kind: 'doc',
				x: 16,
				y: 66,
				w: 328,
				title: 'What comes back',
				lines: ['HTTP/1.1 200 OK', 'content-type: application/json; charset=utf-8', 'content-length: 11', '', '{"ok":true}'],
				hl: []
			},
			{ id: 'note', kind: 'text', x: 16, y: 212, w: 328, text: 'Open on purpose: no key was sent and none was needed.', size: 'sm' }
		],
		steps: [
			{ say: 'One command, one request. The -i flag makes curl print the response headers as well as the body.', focus: ['rq'] },
			{ say: 'The status line comes first: the HTTP version, the code 200 and its reason, OK.', show: ['rs'], set: { rs: { hl: [0] } } },
			{ say: 'Then headers, which describe the body: JSON text, 11 bytes long.', set: { rs: { hl: [1, 2] } } },
			{ say: 'A blank line ends the headers. The body is {"ok":true}: health only says that the server is up.', set: { rs: { hl: [4] } } },
			{ say: 'Health is open on purpose, so an uptime checker can call it without any secret.', show: ['note'], set: { rs: { hl: [] } }, focus: ['note'] }
		]
	},
	{
		id: 'ap-config-call',
		topic: 'apis',
		group: 'ap-first-calls',
		title: 'Reading the public config answer',
		blurb: 'What do the headers say about how this answer may be used?',
		stage: { w: 360, h: 312 },
		nodes: [
			{
				id: 'h',
				kind: 'doc',
				x: 16,
				y: 14,
				w: 328,
				title: 'GET /cardify/sdk/config/demostore',
				lines: [
					'HTTP/1.1 200 OK',
					'access-control-allow-origin: *',
					'cross-origin-resource-policy: cross-origin',
					'cache-control: no-store',
					'content-type: application/json; charset=utf-8',
					'content-length: 240'
				],
				hl: [],
				visible: true
			},
			{
				id: 'b',
				kind: 'doc',
				x: 16,
				y: 152,
				w: 328,
				title: 'Body (wrapped here for reading)',
				lines: [
					'{"enabled":false,"design":"classic",',
					'"options":{"accentColor":"#111111",',
					'"textColor":"#111111",',
					'"backgroundColor":"#ffffff","radius":8,',
					'"imageRatio":"4/5","showBadge":true,',
					'"showQuickBuy":true,"showRating":true,',
					'"showCompareAt":true},"version":0}'
				],
				hl: []
			}
		],
		steps: [
			{ say: 'The same kind of call to the public config route, for a merchant that never saved. The status is 200 and the headers say how the answer may be used.', focus: ['h'] },
			{ say: 'access-control-allow-origin: * means a page on any website may read this response in a browser, which any storefront needs.', set: { h: { hl: [1] } } },
			{ say: 'cross-origin-resource-policy: cross-origin lets any site load the response as a resource.', set: { h: { hl: [2] } } },
			{ say: 'cache-control: no-store: nothing may cache the answer, so a switch flipped in the admin shows on the next read.', set: { h: { hl: [3] } } },
			{ say: 'The body is the merchant\'s settings. Nothing was saved, so enabled is false and the design is classic.', show: ['b'], set: { h: { hl: [] }, b: { hl: [0] } } },
			{ say: '"version":0 marks "never saved". After a save the same call returns a version in milliseconds.', set: { b: { hl: [6] } } }
		]
	},
	{
		id: 'ap-bad-id-call',
		topic: 'apis',
		group: 'ap-first-calls',
		title: 'Good and bad merchant ids',
		blurb: 'Which ids does the config route accept, and what does it say to the others?',
		stage: { w: 360, h: 300 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 110,
				cols: ['Merchant id', 'Status', 'Meaning'],
				rows: [
					['demostore', '200', 'the settings'],
					['nobodyhere', '200', 'defaults'],
					['NOT_VALID!', '400', 'bad characters'],
					['DemoStore', '400', 'capital letters'],
					['abc', '400', 'too short']
				],
				hl: [],
				visible: true
			},
			{ id: 'err', kind: 'doc', x: 16, y: 166, w: 328, title: 'Body of every 400 here', lines: ['{"error":"invalid merchant id"}'], hl: [] },
			{ id: 'rule', kind: 'text', x: 16, y: 262, w: 328, text: 'The rule: lowercase letters and digits, 6 to 32 characters.', size: 'sm' }
		],
		steps: [
			{ say: 'The same route called with five different ids. Two are accepted and three are not.', focus: ['t'] },
			{ say: 'Valid ids get 200. A merchant that never saved gets the defaults, not an error.', set: { t: { hl: [0, 1] } } },
			{ say: 'NOT_VALID!, DemoStore and abc are refused with 400 before any lookup happens.', set: { t: { hl: [2, 3, 4] } } },
			{ say: 'All three 400s have the same short body, and they still carry the CORS headers, so a page can read the error.', show: ['err'], set: { err: { hl: [0] } } },
			{ say: 'The rule behind them is written in one pattern: lowercase letters and digits, 6 to 32 characters.', show: ['rule'], set: { t: { hl: [] }, err: { hl: [] } }, focus: ['rule'] }
		]
	},

	// ───────────── ap-admin-calls ─────────────
	{
		id: 'ap-admin-401',
		topic: 'apis',
		group: 'ap-admin-calls',
		title: 'Four keys, one answer',
		blurb: 'What does the admin route say to a missing, wrong or right key?',
		stage: { w: 360, h: 262 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 112,
				cols: ['Header sent', 'Status', 'Body'],
				rows: [
					['none', '401', 'same body'],
					['nope-nope', '401', 'same body'],
					['x', '401', 'same body'],
					['<ADMIN_API_KEY>', '200', 'the settings']
				],
				hl: [],
				visible: true
			},
			{ id: 'body', kind: 'doc', x: 16, y: 146, w: 328, title: 'The body of all three 401s', lines: ['{"error":"invalid or missing x-admin-key"}'], hl: [] },
			{ id: 'note', kind: 'text', x: 16, y: 232, w: 328, text: 'A caller learns nothing about how close a guess was.', size: 'sm' }
		],
		steps: [
			{ say: 'Four calls to GET /cardify/admin/demostore/settings, each with a different x-admin-key header.', focus: ['t'] },
			{ say: 'No header at all: the answer is 401.', set: { t: { hl: [0] } } },
			{ say: 'A wrong key, and a one-character key: 401 as well.', set: { t: { hl: [1, 2] } } },
			{ say: 'All three have the identical body. The server does not say which part was wrong.', show: ['body'], set: { body: { hl: [0] } } },
			{ say: 'The right key, written here as <ADMIN_API_KEY>, returns 200 and the settings.', set: { t: { hl: [3] }, body: { hl: [] } } },
			{ say: 'So a caller learns nothing about whether a guess was missing, short or close.', show: ['note'], set: { t: { hl: [] } }, focus: ['note'] }
		]
	},
	{
		id: 'ap-admin-put-400',
		topic: 'apis',
		group: 'ap-admin-calls',
		title: 'A PUT with four mistakes',
		blurb: 'How does the API describe what is wrong with a body?',
		stage: { w: 360, h: 360 },
		nodes: [
			{
				id: 'rq',
				kind: 'doc',
				x: 16,
				y: 14,
				w: 328,
				title: 'PUT body (the other fields were valid)',
				lines: ['{"enabled":"yes",', '"design":"neon",', '"options":{"accentColor":"red",', '"radius":99, ...}}'],
				hl: [],
				visible: true
			},
			{
				id: 'rs',
				kind: 'doc',
				x: 16,
				y: 122,
				w: 328,
				title: '400 Bad Request (issues, laid out to read)',
				lines: [
					'{"error":"invalid settings","issues":[',
					'path ["enabled"]',
					'  Expected boolean, received string',
					'path ["design"]',
					"  Invalid enum value. Expected 'classic' |",
					"  'minimal' | 'overlay' | 'hover-reveal' |",
					"  'editorial', received 'neon'",
					'path ["options","accentColor"]',
					'  must be a 6-digit hex colour like #ed186f',
					'path ["options","radius"]',
					'  Number must be less than or equal to 24',
					']}'
				],
				hl: []
			}
		],
		steps: [
			{ say: 'A PUT with four mistakes: a string for a boolean, an unknown design, a colour name instead of hex, and a radius over 24.', focus: ['rq'] },
			{ say: 'The server answers 400 with an error and a list of issues, one for each mistake.', show: ['rs'], set: { rs: { hl: [0] } } },
			{ say: 'First: enabled should be true or false, but a string arrived.', set: { rq: { hl: [0] }, rs: { hl: [1, 2] } } },
			{ say: 'Second: neon is not a design, and the message lists the five allowed ones.', set: { rq: { hl: [1] }, rs: { hl: [3, 4, 5, 6] } } },
			{ say: 'Third: the colour must be six hex digits, like #ed186f.', set: { rq: { hl: [2] }, rs: { hl: [7, 8] } } },
			{ say: 'Fourth: radius may be at most 24.', set: { rq: { hl: [3] }, rs: { hl: [9, 10] } } },
			{ say: 'One request, four precise messages. A form can mark every wrong field at once.', set: { rq: { hl: [] }, rs: { hl: [] } }, focus: ['rs'] }
		]
	},
	{
		id: 'ap-admin-put-ok',
		topic: 'apis',
		group: 'ap-admin-calls',
		title: 'Saving twice: what comes back',
		blurb: 'What changes when a valid request is repeated?',
		stage: { w: 360, h: 220 },
		nodes: [
			{
				id: 'v',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 110,
				cols: ['Call', 'Settings', 'Version'],
				rows: [
					['PUT (first)', 'overlay, #ed186f', '1795534284883'],
					['PUT (again)', 'same', '1795534284949'],
					['GET public', 'same', '1795534284949']
				],
				hl: []
			},
			{ id: 'rq', kind: 'doc', x: 16, y: 112, w: 328, title: 'PUT body, both times', lines: ['{"enabled":true,"design":"overlay",', '"options":{"accentColor":"#ed186f",', '"radius":12, ...}}'], hl: [], visible: true }
		],
		steps: [
			{ say: 'A valid body for PUT /cardify/admin/demostore/settings. It is sent twice, with the same content.', focus: ['rq'] },
			{ say: 'The first PUT returns 200 with the saved settings and a version, 1795534284883.', show: ['v'], set: { v: { hl: [0] } } },
			{ say: 'The identical PUT again returns the same settings. Only the version moved on, to 1795534284949.', set: { v: { hl: [1] } } },
			{ say: 'A public GET right afterwards shows the same settings and that same version.', set: { v: { hl: [2] } } },
			{ say: 'Repeating the request left the same state, which is what makes a PUT safe to retry.', set: { v: { hl: [] } }, focus: ['v'] }
		]
	},
	{
		id: 'ap-admin-edge-cases',
		topic: 'apis',
		group: 'ap-admin-calls',
		title: 'Other ways a client goes wrong',
		blurb: 'Which status does each malformed request get?',
		stage: { w: 360, h: 262 },
		nodes: [
			{
				id: 'e',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 112,
				cols: ['Mistake', 'Answer', 'Notes'],
				rows: [
					['no content-type', '415', 'framework shape'],
					['bad JSON text', '400', 'closes the link'],
					['body over 1 MiB', '413', 'closes the link'],
					['DELETE or POST', '404', 'route not found']
				],
				hl: [],
				visible: true
			},
			{
				id: 'fb',
				kind: 'doc',
				x: 16,
				y: 150,
				w: 328,
				title: 'Body of the 415',
				lines: ['{"statusCode":415,', '"code":"FST_ERR_CTP_INVALID_MEDIA_TYPE",', '"error":"Unsupported Media Type",', '"message":"Unsupported Media Type"}'],
				hl: []
			}
		],
		steps: [
			{ say: 'Four more ways a client can go wrong. Each gets its own answer.', focus: ['e'] },
			{ say: 'No content-type: application/json: the framework refuses the body with 415 Unsupported Media Type.', show: ['fb'], set: { e: { hl: [0] }, fb: { hl: [] } } },
			{ say: 'Text that is not JSON, such as {"enabled": tru, gets 400, and the connection is closed.', set: { e: { hl: [1] } } },
			{ say: 'A body over 1 MiB first gets 100 Continue, then 413 Payload Too Large, and the connection is closed.', set: { e: { hl: [2] } } },
			{ say: 'A DELETE or POST on a route that only knows GET and PUT gets 404, not 405.', set: { e: { hl: [3] } } }
		]
	},

	// ───────────── ap-website-calls ─────────────
	{
		id: 'ap-web-first-load',
		topic: 'apis',
		group: 'ap-website-calls',
		title: 'The storefront loads the loader',
		blurb: 'What does the storefront ask the backend when Cardify is off?',
		stage: { w: 360, h: 300 },
		nodes: [
			shot('pic', 'lessons/apis/demo-before.webp', 1100, 481, { x: 12, y: 12, w: 336, h: 147, alt: 'The demo storefront showing its own product cards' }),
			credit('cr', 176, SHOT_CREDIT),
			rg('r1', 12, 12, 336, { x: 60, y: 290, w: 400 }, 89, 419, 75, 31),
			{
				id: 'rq',
				kind: 'doc',
				x: 16,
				y: 186,
				w: 328,
				title: 'Requests the page made',
				lines: ['1. GET /cardify/sdk/cardify-loader.js', '   ?store=demostore  -> 200', '2. GET /cardify/sdk/config/demostore', '   -> 200  enabled: false', '(no widget request: Cardify is off)'],
				hl: []
			}
		],
		steps: [
			{ say: 'The demo storefront before anything is switched on. These are the shop\'s own cards.', focus: ['pic'] },
			{ say: 'Each card is the store\'s own: a name, a price and a plain Quick buy button.', set: { pic: { view: { x: 60, y: 290, w: 400 } } }, show: ['r1'] },
			{ say: 'The page includes one script. The browser fetched the loader and passed the merchant in ?store=demostore.', hide: ['r1'], set: { pic: { view: FULL(1100) }, rq: { hl: [0, 1] } }, show: ['rq'] },
			{ say: 'The loader\'s first act is to read the public config for that merchant.', set: { rq: { hl: [2, 3] } } },
			{ say: 'The config says Cardify is off, so the loader stops there. The widget file is never requested.', set: { rq: { hl: [4] } } }
		]
	},
	{
		id: 'ap-web-admin-keys',
		topic: 'apis',
		group: 'ap-website-calls',
		title: 'Connecting the admin with a key',
		blurb: 'What does the admin send, and what does the page show?',
		stage: { w: 360, h: 280 },
		nodes: [
			shot('pic', 'lessons/apis/admin-wrong-key.webp', 1100, 284, { x: 12, y: 12, w: 336, h: 87, alt: 'The Cardify admin after a wrong key' }),
			credit('cr', 116, SHOT_CREDIT),
			rg('rk', 12, 12, 336, FULL(1100), 434, 124, 349, 32),
			rg('rc', 12, 12, 336, { x: 520, y: 20, w: 560 }, 795, 123, 82, 33),
			rg('rp1', 12, 12, 336, { x: 520, y: 20, w: 560 }, 864, 34, 180, 26),
			rg('rp2', 12, 12, 336, { x: 520, y: 20, w: 560 }, 964, 35, 79, 24),
			{
				id: 'rq',
				kind: 'doc',
				x: 16,
				y: 130,
				w: 328,
				title: 'The call behind Connect',
				lines: ['GET /cardify/admin/demostore/settings', 'x-admin-key: wrong-key-123', '-> 401', '{"error":"invalid or missing x-admin-key"}'],
				hl: []
			},
			{ id: 'dbl', kind: 'text', x: 16, y: 250, w: 328, text: 'First load, no key stored: two identical GETs, both 401 (React StrictMode in development).', size: 'sm' }
		],
		steps: [
			{ say: 'In the admin, a wrong key was typed into the Admin key field. The field shows dots, so the key is masked on screen.', show: ['rk'], focus: ['pic'] },
			{ say: 'Pressing Connect saves the typed key and the merchant id, then calls the API with them.', hide: ['rk'], set: { pic: { view: { x: 520, y: 20, w: 560 } } }, show: ['rc'] },
			{ say: 'The call is a GET on the admin settings route with the typed key in the x-admin-key header.', hide: ['rc'], show: ['rq'], set: { rq: { hl: [0, 1] } } },
			{ say: 'The answer is 401, and the page shows the server\'s own message in a red pill.', show: ['rp1'], set: { rq: { hl: [2, 3] } } },
			{
				say: 'With the right key the same call returns 200, and the pill says Connected.',
				hide: ['rp1'],
				show: ['rp2'],
				set: { pic: { src: 'lessons/apis/admin-connected.webp' }, rq: { hl: [2], lines: ['GET /cardify/admin/demostore/settings', 'x-admin-key: <ADMIN_API_KEY>', '-> 200', '{"enabled":false,"design":"classic", ...}'] } }
			},
			{ say: 'On the very first load, before any key is stored, the admin sends the same GET twice (React StrictMode in development), and both get 401.', hide: ['rp2'], show: ['dbl'], set: { rq: { hl: [] } }, focus: ['dbl'] }
		]
	},
	{
		id: 'ap-web-one-put',
		topic: 'apis',
		group: 'ap-website-calls',
		title: 'Three edits, one save',
		blurb: 'How does the admin avoid sending a request for every click?',
		stage: { w: 360, h: 200 },
		nodes: [
			shot('pic', 'lessons/apis/admin-saved.webp', 1100, 481, { x: 12, y: 12, w: 336, h: 147, alt: 'The Cardify admin after the edits' }),
			credit('cr', 176, SHOT_CREDIT),
			rg('rt', 12, 12, 336, { x: 560, y: 0, w: 540 }, 978, 43, 49, 29),
			rg('rb', 12, 12, 336, { x: 50, y: 170, w: 540 }, 74, 378, 180, 20),
			{
				id: 'tl',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 110,
				cols: ['Edit', 'Change', 'Request'],
				rows: [
					['1', 'switch on', 'none yet'],
					['2', 'Editorial', 'none yet'],
					['3', 'badge off', 'none yet'],
					['500 ms quiet', 'save', 'one PUT, 200']
				],
				hl: []
			},
			{
				id: 'pb',
				kind: 'doc',
				x: 16,
				y: 14,
				w: 328,
				title: 'The PUT body',
				lines: ['{"enabled":true,"design":"editorial",', '"options":{"accentColor":"#111111",', '"textColor":"#111111","backgroundColor":', '"#ffffff","radius":8,"imageRatio":"4/5",', '"showBadge":false,"showQuickBuy":true,', '"showRating":true,"showCompareAt":true}}'],
				hl: []
			}
		],
		steps: [
			{ say: 'After three quick edits in the admin the switch is on and Product badge is unticked. The Editorial design was picked further down the page.', focus: ['pic'] },
			{ say: 'The first edit: the main switch, turned on.', set: { pic: { view: { x: 560, y: 0, w: 540 } } }, show: ['rt'] },
			{ say: 'The third edit: Product badge, unticked. The three edits came within about 300 ms of each other.', hide: ['rt'], set: { pic: { view: { x: 50, y: 170, w: 540 } } }, show: ['rb'] },
			{ say: 'Each edit restarted a 500 ms timer. None of them sent a request.', hide: ['pic', 'cr', 'rb'], show: ['tl'], set: { tl: { hl: [0, 1, 2] } } },
			{ say: 'When 500 ms passed with no new edit, one PUT went out.', set: { tl: { hl: [3] } } },
			{ say: 'Its body is the whole settings object, here with showBadge false and the design editorial.', hide: ['tl'], show: ['pb'], set: { pb: { hl: [4] } } },
			{
				say: 'Later the accent colour changed to #ed186f. The same body with that one value different went out as a second PUT after another quiet 500 ms.',
				set: { pb: { hl: [1], lines: ['{"enabled":true,"design":"editorial",', '"options":{"accentColor":"#ed186f",', '"textColor":"#111111","backgroundColor":', '"#ffffff","radius":8,"imageRatio":"4/5",', '"showBadge":false,"showQuickBuy":true,', '"showRating":true,"showCompareAt":true}}'] } }
			}
		]
	},
	{
		id: 'ap-web-focus-refresh',
		topic: 'apis',
		group: 'ap-website-calls',
		title: 'The storefront notices the change',
		blurb: 'How does an open storefront tab pick up a saved setting without a reload?',
		stage: { w: 360, h: 312 },
		nodes: [
			shot('pic', 'lessons/apis/demo-before.webp', 1100, 481, { x: 12, y: 12, w: 336, h: 147, alt: 'The demo storefront' }),
			credit('cr', 176, SHOT_CREDIT),
			rg('rz', 12, 12, 336, { x: 70, y: 300, w: 400 }, 80, 390, 170, 70),
			{
				id: 'ev',
				kind: 'doc',
				x: 16,
				y: 190,
				w: 328,
				title: 'What the storefront tab did',
				lines: ['focus event on the storefront tab', 'GET /cardify/sdk/config/demostore -> 200', '   enabled: true, a newer version', 'GET /cardify/sdk/cardify-widget.js -> 200', 'no page reload'],
				hl: []
			}
		],
		steps: [
			{ say: 'While the merchant used the admin in another tab, the storefront tab kept showing the shop\'s own cards.', focus: ['pic'] },
			{ say: 'Switching back to the storefront tab fires the window focus event, and the loader listens for it.', show: ['ev'], set: { ev: { hl: [0] } } },
			{ say: 'It reads the public config again. This time enabled is true, with a newer version.', set: { ev: { hl: [1, 2] } } },
			{ say: 'Because Cardify is now on, the loader fetches the widget bundle.', set: { ev: { hl: [3] } } },
			{ say: 'The cards are restyled in place, with no reload.', set: { pic: { src: 'lessons/apis/demo-after.webp' }, ev: { hl: [4] } }, focus: ['pic'] },
			{ say: 'Same products, new design: serif names, ratings and a price with a discount chip.', set: { pic: { view: { x: 70, y: 300, w: 400 } } }, show: ['rz'] },
			{ say: 'There is no timer. The loader reads again on page load, on focus and when the tab becomes visible, so idle tabs cost the backend nothing.', hide: ['rz'], set: { pic: { view: FULL(1100) }, ev: { hl: [] } }, focus: ['ev'] }
		]
	},
	{
		id: 'ap-web-network-log',
		topic: 'apis',
		group: 'ap-website-calls',
		title: 'The whole run as a request log',
		blurb: 'Which requests did the two pages make, in order?',
		stage: { w: 360, h: 250 },
		nodes: [
			{
				id: 'log',
				kind: 'doc',
				x: 16,
				y: 14,
				w: 328,
				title: 'Requests to the backend (ms since the run began)',
				lines: [
					logRow('ms', 'page', 'call', 'status'),
					logRow(246, 'demo', 'GET loader.js', '200'),
					logRow(282, 'demo', 'GET config/demostore', '200'),
					logRow(1909, 'admin', 'GET cardify-widget.js', '200'),
					logRow(1910, 'admin', 'GET settings (no key) x2', '401'),
					logRow(3237, 'admin', 'GET settings (wrong key)', '401'),
					logRow(4545, 'admin', 'GET settings (right key)', '200'),
					logRow(6400, 'admin', 'PUT settings (3 edits)', '200'),
					logRow(7905, 'admin', 'PUT settings (colour)', '200'),
					logRow(9014, 'demo', 'GET config/demostore', '200'),
					logRow(9015, 'demo', 'GET cardify-widget.js', '200')
				],
				hl: [],
				visible: true
			}
		],
		steps: [
			{ say: 'Every request the two pages sent to the backend during the run, in order. The times are in milliseconds since the run began.', focus: ['log'] },
			{ say: 'The storefront: the loader, then the config. Nothing else, because Cardify was off.', set: { log: { hl: [1, 2] } } },
			{ say: 'The admin opened with no key: the widget for its preview tiles, then the settings call twice, both refused.', set: { log: { hl: [3, 4] } } },
			{ say: 'A wrong key is refused. The right key is accepted.', set: { log: { hl: [5, 6] } } },
			{ say: 'Two saves, 1.5 seconds apart, however many edits came before each of them.', set: { log: { hl: [7, 8] } } },
			{ say: 'Back in the storefront: the config again, then the widget, because Cardify is now on.', set: { log: { hl: [9, 10] } } }
		]
	},

	// ───────────── ap-status-and-errors ─────────────
	{
		id: 'ap-status-codes',
		topic: 'apis',
		group: 'ap-status-and-errors',
		title: 'Nine status codes, three groups',
		blurb: 'Which statuses did this API return, and what does each one mean?',
		stage: { w: 360, h: 290 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 112,
				cols: ['Status', 'Seen on', 'Meaning'],
				rows: [
					['200', 'most calls', 'OK, body returned'],
					['204', 'preflight', 'No Content'],
					['304', 'loader file', 'Not Modified'],
					['400', 'bad id or body', 'request is wrong'],
					['401', 'no or wrong key', 'not authenticated'],
					['403', 'path traversal', 'refused to serve'],
					['404', 'unknown route', 'no such route'],
					['413', 'body over 1 MiB', 'body too large'],
					['415', 'no content-type', 'wrong media type']
				],
				hl: [],
				visible: true
			},
			{ id: 'note', kind: 'text', x: 16, y: 262, w: 328, text: 'A DELETE or POST on a GET-only route got 404. 405 with an Allow header would say more.', size: 'sm' }
		],
		steps: [
			{ say: 'Nine status codes appeared during the runs. They fall into three groups.', focus: ['t'] },
			{ say: '2xx and 3xx: it worked. 200 returns a body, 204 only headers, and 304 says the cached copy is still good.', set: { t: { hl: [0, 1, 2] } } },
			{ say: '400, 401 and 403: the request or the caller is the problem. 401 is about who you are, 403 about what you may do.', set: { t: { hl: [3, 4, 5] } } },
			{ say: '404, 413 and 415: no such route, a body that is too large, and a body in a format the server will not read.', set: { t: { hl: [6, 7, 8] } } },
			{ say: 'One more detail: the 404 for a wrong method. The route exists for other methods, so 405 Method Not Allowed would be more precise.', set: { t: { hl: [] } }, show: ['note'], focus: ['note'] }
		]
	},
	{
		id: 'ap-error-shapes',
		topic: 'apis',
		group: 'ap-status-and-errors',
		title: 'Two shapes of error body',
		blurb: 'Why is it harder to write a client when errors have two shapes?',
		stage: { w: 360, h: 330 },
		nodes: [
			{
				id: 'app',
				kind: 'doc',
				x: 16,
				y: 14,
				w: 328,
				title: 'The app\'s shape',
				lines: ['{"error":"invalid or missing x-admin-key"}', '{"error":"invalid merchant id"}', '{"error":"invalid settings","issues":[...]}'],
				visible: true
			},
			{
				id: 'fw',
				kind: 'doc',
				x: 16,
				y: 104,
				w: 328,
				title: 'The framework\'s shape',
				lines: ['{"statusCode":415,', '"code":"FST_ERR_CTP_INVALID_MEDIA_TYPE",', '"error":"Unsupported Media Type",', '"message":"Unsupported Media Type"}']
			},
			{
				id: 'cl',
				kind: 'doc',
				x: 16,
				y: 210,
				w: 328,
				title: 'The admin\'s helper (api.ts)',
				lines: ['if (!res.ok) throw new Error(', '  body.error ?? `Request failed (${res.status})`', ');']
			},
			{ id: 'note', kind: 'text', x: 16, y: 312, w: 328, text: 'It works for both only because both have an error field.', size: 'sm' }
		],
		steps: [
			{ say: 'Errors the app writes itself have one field, error. The settings error adds a list of issues.', focus: ['app'] },
			{ say: 'Errors the framework writes for 415, 413, bad JSON and unknown routes have four fields: statusCode, code, error and message.', show: ['fw'], focus: ['fw'] },
			{ say: 'The admin\'s helper reads body.error, and falls back to "Request failed (status)" when there is none.', show: ['cl'], focus: ['cl'] },
			{ say: 'It copes with both shapes, but only because both happen to have an error field. A client should not depend on luck.', show: ['note'], focus: ['note'] },
			{ say: 'Better: one shape for every error, such as always error plus message, so every client reads errors the same way.', focus: ['app', 'fw'] }
		]
	}
];
