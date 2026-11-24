import type { Scene } from '../../types';

// Reading a real online store's API traffic. Names, hosts, ids and handles are changed; paths, methods, statuses, headers and counts are as observed.

export const apCalls: Scene[] = [
	// ───────────── ap-store-map ─────────────
	{
		id: 'ap-system-map',
		topic: 'apis',
		group: 'ap-store-map',
		title: 'The store on one page',
		blurb: 'Who talks to whom when a visitor opens an online store?',
		stage: { w: 360, h: 424 },
		nodes: [
			{ id: 'br', kind: 'box', x: 16, y: 10, w: 150, h: 44, label: 'Browser', sub: 'the visitor', visible: true },
			{ id: 'sv', kind: 'box', x: 194, y: 10, w: 150, h: 44, label: 'Store server', sub: 'pages, /api routes', visible: true },
			{ id: 'e0', kind: 'edge', from: 'br', to: 'sv', visible: true },
			{ id: 'pl', kind: 'box', x: 194, y: 110, w: 150, h: 44, label: 'Platform APIs', sub: 'catalog, cart, search' },
			{ id: 'e1', kind: 'edge', from: 'sv', to: 'pl' },
			{ id: 'e2', kind: 'edge', from: 'br', to: 'pl' },
			{ id: 'vd', kind: 'box', x: 16, y: 110, w: 150, h: 44, label: 'Vendor scripts', sub: 'login, checkout, ads' },
			{ id: 'e3', kind: 'edge', from: 'br', to: 'vd' },
			{ id: 'an', kind: 'box', x: 16, y: 210, w: 150, h: 44, label: 'Analytics', sub: 'event collector' },
			{ id: 'e4', kind: 'edge', from: 'vd', to: 'an' },
			{ id: 'wh', kind: 'box', x: 194, y: 210, w: 150, h: 44, label: 'Webhook calls', sub: 'platform tells the store' },
			{ id: 'e5', kind: 'edge', from: 'pl', to: 'wh' },
			{ id: 'ca', kind: 'box', x: 16, y: 268, w: 328, h: 40, label: 'Caches', sub: 'Data Cache by tag, finished pages' },
			{ id: 'nt', kind: 'doc', x: 16, y: 322, w: 328, title: 'About these lessons', lines: ['- names, hosts, ids and handles are changed', '- paths, statuses, headers, counts are real', '- tracker loads and writes were blocked', '- the store ran locally, in dev mode'] }
		],
		steps: [
			{ say: 'A visitor’s browser asks the store’s own Next.js server for a page. The server renders it, often from a cache.', focus: ['sv'] },
			{ say: 'To build the page, the server reads the commerce platform’s APIs. Catalog data comes this way, with a merchant id header.', show: ['pl', 'e1'], focus: ['pl'] },
			{ say: 'Some calls skip the server: the browser asks the platform directly for the cart, reviews, search and recommendations.', show: ['e2'], focus: ['br'] },
			{ say: 'The page also loads vendor scripts for login, checkout and ads. Those scripts send events to an analytics collector.', show: ['vd', 'e3', 'an', 'e4'], focus: ['vd'] },
			{ say: 'Caches sit in between. The server keeps reads in a Data Cache by tag, and finished pages are reused until they are revalidated.', show: ['ca'], set: { ca: { tone: 'accent' } } },
			{ say: 'Webhooks run the other way. The platform calls the store when a product changes, so the right cache entries can be purged.', show: ['wh', 'e5'], focus: ['wh'] },
			{ say: 'Names, hosts, ids and handles in these lessons were changed. The paths, statuses, headers and counts are what was observed.', show: ['nt'] }
		]
	},
	{
		id: 'ap-lanes-key',
		topic: 'apis',
		group: 'ap-store-map',
		title: 'Five lanes of traffic',
		blurb: 'Which caller talks to which destination, and about what?',
		stage: { w: 360, h: 280 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 24,
				y: 14,
				colW: 104,
				cols: ['Who calls', 'Goes to', 'For example'],
				rows: [
					['Server', 'Platform API', 'catalog read'],
					['Browser', 'Platform API', 'cart, reviews'],
					['Browser', 'Store /api', 'apps list'],
					['Platform', 'Store /api', 'webhook'],
					['Browser', 'Vendor host', 'login, ads']
				],
				visible: true
			},
			{ id: 'rule', kind: 'doc', x: 16, y: 170, w: 328, title: 'Reading the traffic', lines: ['for each call ask three things:', '  who makes it?', '  where does it go?', '  why is it in that lane?'] }
		],
		steps: [
			{ say: 'Every call in this store falls into one of five lanes. This table is the key for reading its traffic.', focus: ['t'] },
			{ say: 'The server reads the catalog from the platform while rendering, so visitors get a ready page.', set: { t: { hl: [0] } } },
			{ say: 'The browser calls the platform directly for personal or live data: the cart, reviews, search and recommendations.', set: { t: { hl: [1] } } },
			{ say: 'The browser also calls the store’s own /api routes. The apps list goes through one so the store’s credentials stay on the server.', set: { t: { hl: [2] } } },
			{ say: 'The platform calls the store back with webhooks when a product changes.', set: { t: { hl: [3] } } },
			{ say: 'Vendor hosts serve scripts for login, checkout and ads, and those scripts then call their own services.', set: { t: { hl: [4] } } },
			{ say: 'Three questions turn a pile of URLs into a reading: who makes the call, where does it go, and why is it in that lane?', show: ['rule'], set: { t: { hl: [] } } }
		]
	},

	// ───────────── ap-server-vs-browser ─────────────
	{
		id: 'ap-server-reads',
		topic: 'apis',
		group: 'ap-server-vs-browser',
		title: 'What the server reads',
		blurb: 'Which calls happen on the server, out of the visitor’s sight?',
		stage: { w: 360, h: 296 },
		nodes: [
			{ id: 'b0', kind: 'box', x: 16, y: 14, w: 170, h: 44, label: 'Page request', sub: 'a visitor asks the store', visible: true },
			{ id: 'b1', kind: 'box', x: 16, y: 86, w: 170, h: 44, label: 'Store server', sub: 'renders the page', visible: true },
			{ id: 'e0', kind: 'edge', from: 'b0', to: 'b1', visible: true },
			{ id: 'b2', kind: 'box', x: 16, y: 158, w: 170, h: 44, label: 'Platform catalog API', sub: 'a GET read' },
			{ id: 'e1', kind: 'edge', from: 'b1', to: 'b2' },
			{ id: 'b3', kind: 'box', x: 16, y: 230, w: 170, h: 44, label: 'Data Cache', sub: 'keeps the answer by tag' },
			{ id: 'e2', kind: 'edge', from: 'b2', to: 'b3', label: 'stored' },
			{ id: 'd1', kind: 'doc', x: 196, y: 158, w: 148, title: 'Sent with the read', lines: ['x-merchant-id: <id>', 'no shopper IP'] },
			{ id: 'd2', kind: 'doc', x: 196, y: 230, w: 148, title: 'Kept under tags', lines: ['tag: product:<handle>', 'tag: collections'] }
		],
		steps: [
			{ say: 'While rendering a page, the store’s server does the reading. The visitor’s browser never sees these calls.', focus: ['b1'] },
			{ say: 'It asks the platform’s catalog API for the data, sending a merchant id header.', show: ['b2', 'e1', 'd1'], focus: ['b2'] },
			{ say: 'The answer is kept in the server’s Data Cache under tags, such as one tag per product and one for the collections list.', show: ['b3', 'e2', 'd2'], focus: ['b3'] },
			{ say: 'This lane sends no shopper IP, so one answer can serve many visitors. That is what makes caching safe here.', set: { d1: { hl: [1] } } },
			{ say: 'Later a webhook can purge exactly the tags that changed, and the next visit rebuilds only the pages that used them.', set: { b3: { tone: 'accent' }, d2: { hl: [0] } } },
			{ say: 'Secrets are safe in this lane because the code runs on the server. The cost: you will not find these calls in the browser’s network panel.', set: { b2: { tone: 'warn' } }, focus: ['b2'] }
		]
	},
	{
		id: 'ap-browser-direct',
		topic: 'apis',
		group: 'ap-server-vs-browser',
		title: 'Calls the browser makes itself',
		blurb: 'What does a page ask the platform for directly, and how is it allowed?',
		stage: { w: 360, h: 340 },
		nodes: [
			{ id: 'pg', kind: 'box', x: 16, y: 14, w: 150, h: 44, label: 'Page', sub: 'in the browser', visible: true },
			{ id: 'pf', kind: 'box', x: 194, y: 14, w: 150, h: 44, label: 'Platform API', sub: 'cart, reviews, search', visible: true },
			{ id: 'e0', kind: 'edge', from: 'pg', to: 'pf', label: 'GET', visible: true },
			{ id: 'd1', kind: 'doc', x: 16, y: 86, w: 328, title: 'Request (the cart call)', lines: ['GET <platform>/v1/cart?storeId=<id>', 'headers: accept, content-type, x-merchant-id'] },
			{ id: 'd2', kind: 'doc', x: 16, y: 158, w: 328, title: 'Answer (cart, reviews, search)', lines: ['access-control-allow-origin: <page origin>'] },
			{ id: 'd3', kind: 'doc', x: 16, y: 214, w: 328, title: 'Answer (recommendations list)', lines: ['access-control-allow-origin: *', 'cache-control: public, max-age=60'] },
			{ id: 'nt', kind: 'box', x: 16, y: 286, w: 328, h: 40, label: 'CORS lets the page read the answer', sub: 'a browser rule, not a login' }
		],
		steps: [
			{ say: 'Some calls skip the store’s server. The page itself asks the platform for the cart, reviews, search results and recommendations.', focus: ['e0'] },
			{ say: 'The cart request carried a merchant id header. The server cannot add one here, so the page sends it.', show: ['d1'], set: { d1: { hl: [1] } } },
			{ say: 'The platform answered with the page’s own origin: an allow-list it checks and then echoes back. The browser lets the page read the reply.', show: ['d2'], set: { d2: { hl: [0] } } },
			{ say: 'Public data can be wide open: the recommendations list answered with a star and a one-minute cache.', show: ['d3'], set: { d3: { hl: [0] } } },
			{ say: 'CORS is the platform telling browsers which pages may read its answers. It is a browser rule, not a login.', show: ['nt'], set: { nt: { tone: 'accent' } } },
			{ say: 'The price: the page now depends on the platform’s CORS rules, and anyone who opens the network panel can see the API’s shape.', set: { pg: { tone: 'warn' } }, focus: ['pg'] }
		]
	},
	{
		id: 'ap-where-it-lives',
		topic: 'apis',
		group: 'ap-server-vs-browser',
		title: 'Where should this call live?',
		blurb: 'Which lane fits a call, given its secrets, audience and caching?',
		stage: { w: 360, h: 270 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 24,
				y: 14,
				colW: 156,
				cols: ['If the call...', 'Put it'],
				rows: [
					['needs a secret', 'server or proxy'],
					['is the same for all', 'server, cached by tag'],
					['is personal to a visitor', 'browser, if CORS allows'],
					['must be live', 'browser or proxy']
				],
				visible: true
			},
			{ id: 'ex', kind: 'doc', x: 16, y: 150, w: 328, title: 'Examples from the store', lines: ['catalog read   -> server', 'cart, search   -> browser', 'reviews        -> browser', 'apps list      -> proxy'] }
		],
		steps: [
			{ say: 'Four questions decide the lane. They are about secrets, audience and freshness, not about taste.', focus: ['t'] },
			{ say: 'A call that needs a secret must not reach the browser. Make it on the server, or let a proxy route make it for the page.', set: { t: { hl: [0] } } },
			{ say: 'A call with the same answer for everybody belongs on the server, where one cached fetch serves many visitors.', set: { t: { hl: [1] } } },
			{ say: 'A call that is personal to a visitor, like the cart, can run in the browser when the API’s CORS allows the page.', set: { t: { hl: [2] } } },
			{ say: 'A call that must be live cannot sit in a cache. The browser or a proxy route fits, depending on secrets and CORS.', set: { t: { hl: [3] } } },
			{ say: 'In this store: the catalog is read on the server, the cart and search in the browser, and the apps list through a proxy.', show: ['ex'], set: { t: { hl: [] } } }
		]
	},

	// ───────────── ap-own-routes ─────────────
	{
		id: 'ap-own-health',
		topic: 'apis',
		group: 'ap-own-routes',
		title: 'Health and the webhook probe',
		blurb: 'What do the store’s two probe routes tell you, and what do they hide?',
		stage: { w: 360, h: 240 },
		nodes: [
			{ id: 'd1', kind: 'doc', x: 16, y: 14, w: 328, title: 'GET /health', lines: ['-> 200', '{"success":true,"data":null}'] },
			{ id: 'd2', kind: 'doc', x: 16, y: 90, w: 328, title: 'GET /api/webhooks/cache-invalidation', lines: ['-> 200', '{"status":"healthy",', ' "timestamp":"<iso>"}'] },
			{ id: 'nt', kind: 'box', x: 16, y: 182, w: 328, h: 44, label: 'A deeper check is a separate job', sub: 'whether the cache and platform are reachable' }
		],
		steps: [
			{ say: 'The simplest door is a health route. It answers 200 with an empty data field.', show: ['d1'], focus: ['d1'] },
			{ say: 'It checks nothing behind it, so a 200 only proves that the server process is up, not that the cache or the platform is reachable.', set: { d1: { hl: [1] } } },
			{ say: 'The webhook route has its own probe on GET. It answers healthy together with a timestamp.', show: ['d2'], focus: ['d2'] },
			{ say: 'The probe says nothing about configuration: no secret, no version, no hosts. A probe should not help an attacker.', set: { d2: { hl: [1, 2] } } },
			{ say: 'If you need to know the dependencies are reachable, ask for that explicitly with a deeper check.', show: ['nt'], set: { nt: { tone: 'accent' } } }
		]
	},
	{
		id: 'ap-own-nav-apps',
		topic: 'apis',
		group: 'ap-own-routes',
		title: 'The menu and apps routes',
		blurb: 'How do the nav-menu and apps-list routes answer good and bad input?',
		stage: { w: 360, h: 320 },
		nodes: [
			{ id: 'd1', kind: 'doc', x: 16, y: 10, w: 328, title: 'A known menu', lines: ['GET /api/nav-menu/main-menu', '-> 200 {"handle":"main-menu",', '   "title":"Main Menu","items":[...]}'] },
			{ id: 'd2', kind: 'doc', x: 16, y: 98, w: 328, title: 'Characters that are not allowed', lines: ['GET /api/nav-menu/..%2F..%2Fetc', '-> 400 null'] },
			{ id: 'd3', kind: 'doc', x: 16, y: 170, w: 328, title: 'A menu that does not exist', lines: ['GET /api/nav-menu/no-such-menu', '-> 200 null'] },
			{ id: 'd4', kind: 'doc', x: 16, y: 242, w: 328, title: 'Installed apps list', lines: ['GET /api/v1/apps/installed?surface=...', '-> 200 {"apps":[]}  (0.7 to 2.0 s, dev)'] }
		],
		steps: [
			{ say: 'A known menu handle returns 200 with the menu: its handle, title and items. The route is a proxy to the platform.', show: ['d1'], set: { d1: { hl: [1] } } },
			{ say: 'Only letters, digits, underscore and hyphen are allowed. Anything else is refused before the proxy forwards a request.', show: ['d2'], set: { d2: { hl: [1] } } },
			{ say: 'A well-formed handle that does not exist answers 200 with null: the route returns what the platform returned.', show: ['d3'], set: { d3: { hl: [1] } } },
			{ say: 'The apps list route is dynamic on purpose: its answer is per merchant, so it must not be cached and served to another shop.', show: ['d4'] },
			{ say: 'It took 0.7 to 2 seconds in dev mode because each call goes on to the apps service. If that service is unreachable the route returns an empty list.', set: { d4: { hl: [1] } }, focus: ['d4'] }
		]
	},
	{
		id: 'ap-own-refusals',
		topic: 'apis',
		group: 'ap-own-routes',
		title: 'Refusals: 401 and 405',
		blurb: 'How does the store refuse a request it will not handle?',
		stage: { w: 360, h: 310 },
		nodes: [
			{ id: 'd1', kind: 'doc', x: 16, y: 10, w: 328, title: 'POST webhook, no signature', lines: ['POST /api/webhooks/cache-invalidation', '-> 401 {"error":"Invalid signature",', '   "requestId":"wh_<uuid>"}'] },
			{ id: 'd2', kind: 'doc', x: 16, y: 98, w: 328, title: 'POST, bad signature header', lines: ['x-webhook-signature: sha256=deadbeef', '-> 401, same body, new requestId'] },
			{ id: 'd3', kind: 'doc', x: 16, y: 170, w: 328, title: 'The wrong method', lines: ['PUT webhook route -> 405', 'GET /api/data-source-options -> 405'] },
			{ id: 'nt', kind: 'box', x: 16, y: 246, w: 328, h: 44, label: 'Refuse, but give nothing away', sub: 'same 401, a request id to quote' }
		],
		steps: [
			{ say: 'A webhook POST with no signature is refused with 401 and a short JSON body. The body carries a request id.', show: ['d1'], set: { d1: { hl: [1, 2] } } },
			{ say: 'A POST with a made-up signature header gets the same 401, and the same body shape with a new request id.', show: ['d2'], set: { d2: { hl: [1] } } },
			{ say: 'Because both cases look alike, a caller cannot tell how close it came. The request id is what you quote when reporting a failed delivery.', set: { d1: { hl: [] }, d2: { hl: [] } }, show: ['nt'] },
			{ say: 'A different problem gets a different status: a method the route does not handle is 405, on the webhook route and on the data-source route.', show: ['d3'], set: { d3: { hl: [0, 1] } } },
			{ say: 'So 401 means “who are you”, 405 means “not that way”, and neither one reveals how the route works inside.', set: { nt: { tone: 'accent' } }, focus: ['nt'] }
		]
	},

	// ───────────── ap-page-load-calls ─────────────
	{
		id: 'ap-pageview-counts',
		topic: 'apis',
		group: 'ap-page-load-calls',
		title: 'One page view, counted',
		blurb: 'How many requests does a single page view really cause?',
		stage: { w: 360, h: 270 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 24,
				y: 14,
				colW: 78,
				cols: ['Page', 'Store', 'Outside', 'Hosts'],
				rows: [
					['home', '9', '21', '9'],
					['collection', '9', '16', '9'],
					['product', '9', '20', '10'],
					['search', '9', '18', '10']
				],
				visible: true
			},
			{
				id: 'b',
				kind: 'table',
				x: 24,
				y: 150,
				colW: 156,
				title: 'Blocked by the test, on every page',
				cols: ['What', 'How many'],
				rows: [
					['tracker script loads', '4'],
					['write requests (POST)', '4 to 5']
				]
			}
		],
		steps: [
			{ say: 'Four page views, four rows. Store counts requests to the store itself, Outside counts successful calls to other hosts.', focus: ['t'] },
			{ say: 'Nine requests to the store each time. Three of them are the same apps-list call, so only seven are different.', set: { t: { hl: [0, 1, 2, 3] } } },
			{ say: 'The busiest column is Outside: 16 to 21 successful calls per page, spread over 9 or 10 different hosts.', set: { t: { hl: [0, 2] } } },
			{ say: 'On top of that, the test blocked four tracker script loads and four or five write requests on every page.', show: ['b'], set: { t: { hl: [] } } },
			{ say: 'Counting like this is a cheap first review: duplicates, many hosts and writes on page load show up before any code is read.', set: { b: { hl: [0, 1] } } }
		]
	},
	{
		id: 'ap-apps-three-times',
		topic: 'apis',
		group: 'ap-page-load-calls',
		title: 'The same call, three times',
		blurb: 'How long did the repeated apps-list call take each time?',
		stage: { w: 360, h: 290 },
		nodes: [
			{ id: 'd1', kind: 'doc', x: 16, y: 8, w: 328, title: 'Every page view', lines: ['GET /api/v1/apps/installed?surface=...  x3', 'answers {"apps":[]} each time'] },
			...[980, 1030, 1178, 1234, 1727, 2051, 668, 714, 898, 825, 849, 958].map((ms, i) => ({
				id: `r${i}`,
				kind: 'box' as const,
				x: 14 + i * 27,
				y: 250 - Math.round((ms / 2051) * 120),
				w: 22,
				h: Math.round((ms / 2051) * 120),
				label: '',
				tone: 'accent' as const
			})),
			{ id: 'ax', kind: 'text', x: 180, y: 272, text: 'the 12 calls, in the order the answers arrived', size: 'sm', anchor: 'middle' }
		],
		steps: [
			{ say: 'On each page view the browser asked the store’s own /api for the installed apps list three times, and got the same empty list.', show: ['d1'], set: { d1: { hl: [0] } } },
			{ say: 'Twelve calls over four page views. Each bar is one call: the shortest took 0.67 seconds and the longest 2.05 seconds, in dev mode.', show: ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'ax'] },
			{ say: 'The tallest bar is a full two seconds for an answer that was empty.', set: { r5: { tone: 'warn' } }, focus: ['r5'] },
			{ say: 'Each call goes to the store’s server, which asks the apps service: a hop per call, repeated three times for the same answer.', set: { d1: { hl: [1] } } },
			{ say: 'Fix options: fetch it once, share the result between widgets, or cache it per page, so the visitor does not wait three times.', set: { r5: { tone: 'accent' }, d1: { hl: [] } } }
		]
	},
	{
		id: 'ap-direct-calls',
		topic: 'apis',
		group: 'ap-page-load-calls',
		title: 'Calls the page made to outside APIs',
		blurb: 'Which calls did the browser send itself, and how did each CORS answer look?',
		stage: { w: 360, h: 300 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 24,
				y: 14,
				colW: 104,
				cols: ['Call', 'Headers', 'CORS answer'],
				rows: [
					['cart', 'merchant id', 'page origin'],
					['reviews (2)', 'merchant id', 'page origin'],
					['search', 'merchant id', 'page origin'],
					['recommendations', 'none extra', '*'],
					['login widget', 'id + request id', '*']
				],
				visible: true
			},
			{ id: 'd', kind: 'doc', x: 16, y: 164, w: 328, title: 'Header names seen', lines: ['cart, search: accept, content-type,', '  merchant id header', 'reviews: accept, merchant id header,', '  and a merchant-mid header'] }
		],
		steps: [
			{ say: 'These are the calls the page sent straight to outside APIs, with the header names and the CORS answer for each.', focus: ['t'] },
			{ say: 'The cart call carried a merchant id header and got the page origin back, which means the platform checked an allow-list.', set: { t: { hl: [0] } } },
			{ say: 'The two review calls, a list and an average, did the same. One more header named the merchant a second way.', set: { t: { hl: [1] } } },
			{ say: 'Search, on the search page, also carried the merchant id and was answered with the page origin.', set: { t: { hl: [2] } } },
			{ say: 'The recommendations calls and the login widget’s config calls were answered with a star: any origin may read them.', set: { t: { hl: [3, 4] } } },
			{ say: 'The names of the headers are in the request; the values were ids, which is why this lesson shows only the names.', show: ['d'], set: { t: { hl: [] } } }
		]
	},
	{
		id: 'ap-optional-404',
		topic: 'apis',
		group: 'ap-page-load-calls',
		title: 'A 404 the page shrugged off',
		blurb: 'What happens when an optional call fails and the page does not care?',
		stage: { w: 360, h: 270 },
		nodes: [
			{ id: 'pg', kind: 'box', x: 16, y: 14, w: 150, h: 44, label: 'A page script', sub: 'asks for optional config', visible: true },
			{ id: 'ep', kind: 'box', x: 194, y: 14, w: 150, h: 44, label: 'Config endpoint', sub: 'an optional SDK config', visible: true },
			{ id: 'e0', kind: 'edge', from: 'pg', to: 'ep', label: 'GET', visible: true },
			{ id: 'd1', kind: 'doc', x: 16, y: 86, w: 328, title: 'The answer', lines: ['404', 'cache-control: public, max-age=300,', '  stale-while-revalidate=86400', 'access-control-allow-origin: *'] },
			{ id: 'ok', kind: 'box', x: 16, y: 200, w: 328, h: 44, label: 'The page carried on', sub: 'it did not need the answer' }
		],
		steps: [
			{ say: 'A script on the page asks a session-backend endpoint for an optional SDK config. The page does not depend on it.', focus: ['ep'] },
			{ say: 'The endpoint answered 404, and the page still worked.', show: ['d1'], set: { d1: { hl: [0] } } },
			{ say: 'The answer even said it could be cached for five minutes, and kept for a day while a fresh one is fetched.', set: { d1: { hl: [1, 2] } } },
			{ say: 'The page carried on, so whatever made the call does not depend on the answer.', show: ['ok'], set: { ok: { tone: 'accent' } } },
			{ say: 'An optional call should fail softly, and a cached failure protects the endpoint from being asked on every single page view.', focus: ['ok'] }
		]
	},

	// ───────────── ap-status-and-headers ─────────────
	{
		id: 'ap-status-table',
		topic: 'apis',
		group: 'ap-status-and-headers',
		title: 'Statuses seen, and what they meant',
		blurb: 'Which status did each kind of request get from the store?',
		stage: { w: 360, h: 260 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 24,
				y: 14,
				colW: 104,
				cols: ['Status', 'Seen on', 'Meaning'],
				rows: [
					['200', 'pages, health', 'served'],
					['200 + noindex', 'unknown product', 'soft not-found'],
					['200 null', 'unknown menu', 'nothing found'],
					['400', 'bad menu handle', 'rejected input'],
					['401', 'unsigned webhook', 'not allowed'],
					['404', 'unknown route', 'no such page'],
					['405', 'wrong HTTP verb', 'not handled']
				],
				visible: true
			}
		],
		steps: [
			{ say: 'Across pages and routes, five statuses showed up. Each layer of the store used them in its own way.', focus: ['t'] },
			{ say: 'Known pages and the health route answer 200: served as asked.', set: { t: { hl: [0] } } },
			{ say: 'An unknown product page is also 200, with a not-found body and a noindex tag, because the page streams before it knows the product is missing.', set: { t: { hl: [1] } } },
			{ say: 'An unknown menu is 200 with null, but a malformed menu handle is 400. The first is a lookup that found nothing, the second is refused input.', set: { t: { hl: [2, 3] } } },
			{ say: 'An unsigned webhook is 401: the caller is not allowed in, whatever it asked for.', set: { t: { hl: [4] } } },
			{ say: 'An unknown route is a real 404 page, and a method the route does not handle is 405.', set: { t: { hl: [5, 6] } } },
			{ say: 'So “unknown” has four answers here: 200 with noindex, 200 with null, 400 and 404. Each layer picked its own rule.', set: { t: { hl: [1, 2, 3, 5] } } }
		]
	},
	{
		id: 'ap-header-shapes',
		topic: 'apis',
		group: 'ap-status-and-headers',
		title: 'Headers worth reading',
		blurb: 'Which cache, cookie and CORS headers did the store and its APIs send?',
		stage: { w: 360, h: 264 },
		nodes: [
			{ id: 'd1', kind: 'doc', x: 16, y: 10, w: 328, title: 'A page (dev mode)', lines: ['cache-control: no-store, must-revalidate', 'x-nextjs-cache: HIT', 'content-security-policy: frame-ancestors'] },
			{ id: 'd2', kind: 'doc', x: 16, y: 98, w: 328, title: 'Any /api route, even an error', lines: ['cache-control: public, max-age=0,', '  s-maxage=600, stale-while-revalidate=3600'] },
			{ id: 'd3', kind: 'doc', x: 16, y: 170, w: 328, title: 'Cookie and CORS', lines: ['set-cookie: locale=en; Path=/; SameSite=lax', 'access-control-allow-origin: <page origin>', 'access-control-allow-origin: *'] }
		],
		steps: [
			{ say: 'A page in dev mode is never cached by the browser. The cache hit header shows the server reused a rendered page.', show: ['d1'], set: { d1: { hl: [0, 1] } } },
			{ say: 'The only content security policy directive was frame-ancestors, which limits who may put the store in a frame.', set: { d1: { hl: [2] } } },
			{ say: 'Every /api response carried one blanket cache rule, even a 401 or a 400. Check the headers that really arrive, not only the ones a route sets.', show: ['d2'], set: { d2: { hl: [0, 1] } } },
			{ say: 'Pages set a locale cookie for a year, scoped to the whole site with SameSite=lax. It carries a language, not a login.', show: ['d3'], set: { d3: { hl: [0] } } },
			{ say: 'The platform APIs answered CORS two ways: the page origin echoed from an allow-list, or a star for public data.', set: { d3: { hl: [1, 2] } } },
			{ say: 'Read headers as decisions. Each line says who may keep the answer, who may read it, or who may embed the page.', focus: ['d1', 'd2', 'd3'] }
		]
	}
];
