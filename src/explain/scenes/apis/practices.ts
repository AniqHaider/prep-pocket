import type { Scene } from '../../types';

// Practices a real online store follows, seen in its API traffic. Names, hosts and ids are changed; the shapes are what was observed.
export const apPractices: Scene[] = [
	// ───────────── ap-bff-proxy ─────────────
	{
		id: 'ap-proxy-hop',
		topic: 'apis',
		group: 'ap-bff-proxy',
		title: 'The browser never calls the service',
		blurb: 'Why does the page ask its own server instead of the apps service?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'b', kind: 'box', x: 16, y: 14, w: 164, h: 44, label: 'Browser', sub: 'the store page', visible: true },
			{ id: 's', kind: 'box', x: 16, y: 108, w: 164, h: 44, label: 'Store server', sub: '/api/v1/apps/installed' },
			{ id: 'u', kind: 'box', x: 16, y: 202, w: 164, h: 44, label: 'Apps service', sub: 'private upstream' },
			{ id: 'e1', kind: 'edge', from: 'b', to: 's', label: 'same origin' },
			{ id: 'e2', kind: 'edge', from: 's', to: 'u', label: 'with credentials' },
			{ id: 'd1', kind: 'doc', x: 196, y: 14, w: 152, title: 'Browser sends', lines: ['GET /api/v1/apps/', ' installed?surface=', 'Cookie: locale=en'] },
			{ id: 'd2', kind: 'doc', x: 196, y: 108, w: 152, title: 'Server adds', lines: ['storefront token', 'x-merchant-id: <id>', 'x-forwarded-for: <ip>'] },
			{ id: 'd3', kind: 'doc', x: 196, y: 202, w: 152, title: 'Answer back', lines: ['200 {"apps":[]}', '0.7 to 2.0 s (dev)'] },
			{ id: 'note', kind: 'text', x: 16, y: 292, w: 328, text: 'The route is force-dynamic: the answer is per merchant, so it is never cached and served to another shop.', size: 'sm' }
		],
		steps: [
			{ say: 'The store page needs the list of installed apps. It does not call the apps service. It asks its own server, on the same origin.', focus: ['b'] },
			{ say: 'The call carries only what the browser already has for that origin, such as cookies. No token and no store address.', show: ['s', 'e1', 'd1'], focus: ['s'] },
			{ say: 'The store server adds the credentials: the storefront token, the merchant header and the shopper IP. They never leave the server.', show: ['d2'], focus: ['d2'] },
			{ say: 'It then calls the apps service, which only the server can reach with those credentials.', show: ['u', 'e2'], focus: ['u'] },
			{ say: 'The answer comes back through the server. In dev mode the real call took 0.7 to 2.0 seconds and returned 200.', show: ['d3'], focus: ['d3'] },
			{ say: 'If the service cannot be reached, the handler does not fail the page. It answers 200 with an empty list instead.', set: { u: { tone: 'neg', sub: 'unreachable' }, d3: { lines: ['200 {"apps":[]}', 'service was down'] } }, pulse: ['u'] },
			{ say: 'Because the answer belongs to one merchant, the route opts out of caching with force-dynamic.', show: ['note'], focus: ['note'] }
		]
	},
	{
		id: 'ap-proxy-calls',
		topic: 'apis',
		group: 'ap-bff-proxy',
		title: 'What the proxy routes answered',
		blurb: 'What came back from the store\'s own routes in the real run?',
		stage: { w: 360, h: 250 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 108,
				cols: ['Request', 'Status', 'Body'],
				rows: [
					['apps/installed', '200', '{"apps":[]}'],
					['menu main-menu', '200', 'menu JSON'],
					['menu ../../etc', '400', 'null'],
					['menu a.b c', '400', 'null'],
					['menu unknown', '200', 'null']
				],
				visible: true
			},
			{ id: 'd', kind: 'doc', x: 16, y: 164, w: 328, title: 'Three outcomes', lines: ['data    : 200 and JSON', 'nothing : 200 and null', 'refused : 400 and null'] }
		],
		steps: [
			{ say: 'Five requests against the store\'s own routes, and what each answered. The table is real output from the run.', focus: ['t'] },
			{ say: 'The apps route answered 200 with an empty list. The browser asked the store, and the store asked the service.', set: { t: { hl: [0] } } },
			{ say: 'A menu handle that is allowed gets the menu back as JSON.', set: { t: { hl: [1] } } },
			{ say: 'Handles with dots, slashes or spaces never reach the upstream. The route answers 400 with null before any call is made.', set: { t: { hl: [2, 3] } } },
			{ say: 'A well-formed handle with no menu behind it gets 200 and null. The route documents that unknown means null, not an error.', set: { t: { hl: [4] } } },
			{ say: 'So one route has three outcomes: data, null for nothing there, and a quick refusal for a malformed handle.', show: ['d'], set: { t: { hl: [] } } }
		]
	},
	{
		id: 'ap-handle-guard',
		topic: 'apis',
		group: 'ap-bff-proxy',
		title: 'A handle that cannot walk the path',
		blurb: 'How does the nav-menu route keep a visitor\'s handle from reaching other paths?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'b0', kind: 'box', x: 16, y: 14, w: 190, h: 44, label: 'Handle from the URL', sub: 'chosen by the visitor', visible: true },
			{ id: 'b1', kind: 'box', x: 16, y: 98, w: 190, h: 44, label: 'Allowed characters only?', sub: 'letters, digits, _ and -' },
			{ id: 'b2', kind: 'box', x: 16, y: 182, w: 190, h: 44, label: 'Call the upstream', sub: 'menu fetch, cached' },
			{ id: 'b3', kind: 'box', x: 232, y: 98, w: 112, h: 44, label: 'Refuse 400', sub: 'body null', tone: 'neg' },
			{ id: 'e1', kind: 'edge', from: 'b0', to: 'b1' },
			{ id: 'e2', kind: 'edge', from: 'b1', to: 'b2', label: 'yes' },
			{ id: 'e3', kind: 'edge', from: 'b1', to: 'b3' },
			{ id: 'd', kind: 'doc', x: 16, y: 242, w: 328, title: 'The real handles', lines: ['main-menu : allowed, 200 and menu', '../../etc : refused, 400', 'a.b c     : refused, 400'] }
		],
		steps: [
			{ say: 'The handle in the URL is chosen by the visitor, so for a public proxy it is untrusted input.', focus: ['b0'] },
			{ say: 'The route allows only letters, digits, underscore and hyphen. Anything else stops here.', show: ['b1', 'e1'], focus: ['b1'] },
			{ say: 'A clean handle is passed on to the upstream menu fetch, which is cached.', show: ['b2', 'e2'] },
			{ say: 'Dots, slashes and spaces get a 400 and a null body. The upstream is never called.', show: ['b3', 'e3'], pulse: ['b3'] },
			{ say: 'The real calls match: main-menu was served, and ../../etc and a.b c were refused with 400.', show: ['d'], focus: ['d'] },
			{ say: 'Without the check, a handle like ../../x could be glued into the upstream URL and reach other paths of the internal API. The check removes that whole class of bug.', set: { b1: { tone: 'accent' } }, pulse: ['b1'] }
		]
	},

	// ───────────── ap-webhook-security ─────────────
	{
		id: 'ap-webhook-sign',
		topic: 'apis',
		group: 'ap-webhook-security',
		title: 'What the sender signs',
		blurb: 'How is a webhook delivery signed?',
		stage: { w: 360, h: 340 },
		nodes: [
			{ id: 'd1', kind: 'doc', x: 16, y: 14, w: 328, title: 'Delivery headers', lines: ['x-platform-timestamp: 1764000000', 'x-platform-event-id: evt_123', 'x-platform-signature: <hex digest>'], visible: true },
			{ id: 'd2', kind: 'doc', x: 16, y: 106, w: 328, title: 'Body (raw bytes)', lines: ['{"type":"product.updated",', ' "data":{"handle":"<handle>"}}'] },
			{ id: 's', kind: 'box', x: 16, y: 186, w: 328, h: 44, label: 'Signed string: timestamp, a dot, the raw body', sub: '1764000000.{"type":"product.updated",...}' },
			{ id: 'm', kind: 'box', x: 16, y: 260, w: 328, h: 44, label: 'HMAC-SHA256 with the shared secret', sub: 'hex digest goes in x-platform-signature' },
			{ id: 'e', kind: 'edge', from: 's', to: 'm' },
			{ id: 'note', kind: 'text', x: 16, y: 328, w: 328, text: 'The secret never travels. Only the digest does.', size: 'sm' }
		],
		steps: [
			{ say: 'A signed delivery has three headers: when it was sent, which delivery it is, and the signature.', focus: ['d1'] },
			{ say: 'The body is JSON, such as a product.updated event with a handle. The sender signs the exact raw bytes, not a re-formatted copy.', show: ['d2'], focus: ['d2'] },
			{ say: 'It builds one string: the timestamp, a dot, then the raw body. The timestamp is inside what is signed.', show: ['s'], focus: ['s'] },
			{ say: 'It runs HMAC-SHA256 over that string with a shared secret and sends the hex digest in the signature header.', show: ['m', 'e'], focus: ['m'] },
			{ say: 'The secret never travels. A copied request cannot be given a new timestamp, because the new string would need a new digest.', show: ['note'] },
			{ say: 'The event id is not for security. It is the correlation id the receiver logs, so one delivery can be followed end to end.', focus: ['d1'], pulse: ['d1'] }
		]
	},
	{
		id: 'ap-webhook-verify',
		topic: 'apis',
		group: 'ap-webhook-security',
		title: 'What the receiver checks',
		blurb: 'In what order does the webhook route accept or refuse a delivery?',
		stage: { w: 360, h: 370 },
		nodes: [
			{ id: 'b0', kind: 'box', x: 16, y: 14, w: 200, h: 44, label: 'Read the raw body', sub: 'before any parsing', visible: true },
			{ id: 'b1', kind: 'box', x: 16, y: 86, w: 200, h: 44, label: 'Timestamp within the window?', sub: 'about 5 minutes either way' },
			{ id: 'b2', kind: 'box', x: 16, y: 158, w: 200, h: 44, label: 'Signature matches?', sub: 'recompute, then compare' },
			{ id: 'b3', kind: 'box', x: 16, y: 230, w: 200, h: 44, label: 'Accept: purge, answer 200', sub: 'purged: tags, paths' },
			{ id: 'r', kind: 'box', x: 236, y: 122, w: 108, h: 44, label: 'Refuse 401', sub: 'same body', tone: 'neg' },
			{ id: 'e0', kind: 'edge', from: 'b0', to: 'b1' },
			{ id: 'e1', kind: 'edge', from: 'b1', to: 'b2' },
			{ id: 'e2', kind: 'edge', from: 'b2', to: 'b3' },
			{ id: 'e3', kind: 'edge', from: 'b1', to: 'r', dashed: true },
			{ id: 'e4', kind: 'edge', from: 'b2', to: 'r', dashed: true },
			{ id: 'd', kind: 'doc', x: 16, y: 288, w: 328, title: 'Real probes', lines: ['no signature  : 401 and a requestId', 'bad signature : 401, same shape', 'PUT           : 405'] }
		],
		steps: [
			{ say: 'A delivery arrives. The route first reads the raw body, because the signature covers the exact bytes.', focus: ['b0'] },
			{ say: 'It checks the timestamp. A delivery outside about plus or minus five minutes is stale, so a recorded request cannot be replayed later.', show: ['b1', 'e0'], focus: ['b1'] },
			{ say: 'It recomputes the HMAC from the timestamp and body with its own copy of the secret and compares it with the header.', show: ['b2', 'e1'], focus: ['b2'] },
			{ say: 'Only a match reaches the purge. The answer is 200 with the tags and paths that were purged.', show: ['b3', 'e2'], focus: ['b3'] },
			{ say: 'Anything else gets 401. Unsigned and badly signed requests look the same: one body, a different requestId each time.', show: ['r', 'e3', 'e4'], pulse: ['r'] },
			{ say: 'Both real probes got the same 401 shape, so a caller learns nothing about how close its guess was.', show: ['d'], focus: ['d'] },
			{ say: 'With no secret configured the route refuses every delivery. Unsigned requests pass only if an explicit local-development flag is set.', set: { b2: { tone: 'accent' } }, pulse: ['b2'] }
		]
	},
	{
		id: 'ap-webhook-responses',
		topic: 'apis',
		group: 'ap-webhook-security',
		title: 'The answers a delivery can get',
		blurb: 'Which status codes does the webhook route use, and what does each mean?',
		stage: { w: 360, h: 330 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 108,
				cols: ['Status', 'Meaning', 'Seen'],
				rows: [
					['200', 'tags purged', 'documented'],
					['400', 'malformed body', 'documented'],
					['401', 'bad signature', 'seen live'],
					['405', 'wrong method', 'seen live'],
					['413', 'body too large', 'documented'],
					['500', 'internal error', 'documented']
				],
				visible: true
			},
			{ id: 'd1', kind: 'doc', x: 16, y: 184, w: 328, title: 'A 401 body', lines: ['{"error":"Invalid signature",', ' "requestId":"wh_<uuid>"}'] },
			{ id: 'd2', kind: 'doc', x: 16, y: 258, w: 328, title: 'GET is a health probe', lines: ['{"status":"healthy",', ' "timestamp":"<iso>"}'] }
		],
		steps: [
			{ say: 'Every answer a delivery can get is a status the sender can act on. The table lists them, and marks which ones were seen live.', focus: ['t'] },
			{ say: 'Success is 200 with the purged tags and paths.', set: { t: { hl: [0] } } },
			{ say: '400 means the body was malformed and 413 means it was too large. Both are refused before any work is done.', set: { t: { hl: [1, 4] } } },
			{ say: '401 means the signature was missing or wrong. The body carries a requestId to quote when reporting a failed delivery.', show: ['d1'], set: { t: { hl: [2] } } },
			{ say: '405: only POST handles a delivery. A PUT to the route got 405 in the real probe.', set: { t: { hl: [3] } } },
			{ say: '500 means an internal error. Every response has a requestId, so sender and receiver can find the same delivery in their logs.', set: { t: { hl: [5] } } },
			{ say: 'A GET on the same route is a health probe. It says healthy and a time, and reveals nothing about secrets or configuration.', show: ['d2'], set: { t: { hl: [] } } }
		]
	},

	// ───────────── ap-caching-isr ─────────────
	{
		id: 'ap-isr-flow',
		topic: 'apis',
		group: 'ap-caching-isr',
		title: 'ISR: serve fast, refresh later',
		blurb: 'How does a page stay fast and still get fresh data?',
		stage: { w: 360, h: 420 },
		nodes: [
			{ id: 'v', kind: 'box', x: 16, y: 14, w: 200, h: 44, label: 'Visitor', sub: 'asks for a product page', visible: true },
			{ id: 'c', kind: 'box', x: 16, y: 98, w: 200, h: 44, label: 'Cached page', sub: 'HTML from the last render' },
			{ id: 'r', kind: 'box', x: 16, y: 182, w: 200, h: 44, label: 'Render on the server', sub: 'reads data, builds HTML' },
			{ id: 'p', kind: 'box', x: 16, y: 266, w: 200, h: 44, label: 'Platform API', sub: 'catalog reads' },
			{ id: 'e1', kind: 'edge', from: 'v', to: 'c' },
			{ id: 'e2', kind: 'edge', from: 'c', to: 'r', dashed: true },
			{ id: 'e3', kind: 'edge', from: 'r', to: 'p' },
			{ id: 'd1', kind: 'doc', x: 16, y: 330, w: 328, title: 'Headers on the real page answers', lines: ['x-nextjs-cache: HIT', 'x-nextjs-prerender: 1', 'cache-control: no-store, must-revalidate (dev)'] }
		],
		steps: [
			{ say: 'A product page uses incremental static regeneration: built once, cached, and refreshed on a schedule instead of on every visit.', focus: ['v'] },
			{ say: 'A visit is answered from the cached page. The real page headers said x-nextjs-cache HIT and x-nextjs-prerender 1.', show: ['c', 'e1', 'd1'], focus: ['c'] },
			{ say: 'The cached page was made by rendering on the server, which reads the data it needs.', show: ['r', 'e2'] },
			{ say: 'Those reads go to the platform API. Because the page and the reads are cached, most visits never reach it.', show: ['p', 'e3'], focus: ['p'] },
			{ say: 'revalidate is 3600. After an hour the next visit still gets the cached page, and a fresh render starts in the background.', set: { c: { tone: 'warn', sub: 'older than 3600 s' } }, pulse: ['r'] },
			{ say: 'generateStaticParams lists handles to build ahead of time. dynamicParams = true lets a handle that was not listed be rendered on its first request.', set: { c: { tone: 'neutral', sub: 'HTML from the last render' } }, focus: ['r'] },
			{ say: 'The result is fast pages, few upstream calls, and data at most an hour old unless a webhook purges it sooner.', set: { c: { tone: 'accent' } }, pulse: ['c'] }
		]
	},
	{
		id: 'ap-cache-tags',
		topic: 'apis',
		group: 'ap-caching-isr',
		title: 'Tags connect reads to purges',
		blurb: 'How does a purge find exactly the pages that changed?',
		stage: { w: 360, h: 310 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 164,
				cols: ['Tag', 'Meaning'],
				rows: [
					['product:{handle}', 'one product'],
					['collection:{handle}', 'one collection'],
					['products', 'lists of products'],
					['collections', 'lists of collections']
				],
				visible: true
			},
			{ id: 'd', kind: 'doc', x: 16, y: 150, w: 328, title: 'The two sides of the contract', lines: ['read side : tags the cached read', 'event side: names tags to purge', 'same strings from one shared module'] },
			{ id: 'x', kind: 'box', x: 16, y: 252, w: 328, h: 44, label: 'Tests fail if a tag has no purging event', sub: 'or if the planner invents a tag' }
		],
		steps: [
			{ say: 'Cached reads carry tags, short labels that say what a cached entry is about. Four tag shapes appear in the contract.', focus: ['t'] },
			{ say: 'A read about one thing gets a tag with its handle: one product, one collection.', set: { t: { hl: [0, 1] } } },
			{ say: 'Lists get a plain tag with no handle, because a created or deleted item changes the list.', set: { t: { hl: [2, 3] } } },
			{ say: 'A purge only reaches a page if the read that built it attached the same tag. Both sides take the strings from one shared module.', show: ['d'], set: { t: { hl: [] } } },
			{ say: 'Invariant tests guard the contract: one fails if a tag has no event that purges it, or if the planner invents a tag.', show: ['x'], focus: ['x'] },
			{ say: 'That is why a webhook can purge exactly the pages that changed instead of flushing the whole cache.', focus: ['d', 'x'] }
		]
	},
	{
		id: 'ap-purge-warm',
		topic: 'apis',
		group: 'ap-caching-isr',
		title: 'Purge, then warm',
		blurb: 'What happens between a webhook and the next visitor?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'd', kind: 'doc', x: 16, y: 14, w: 328, title: 'The event', lines: ['{"type":"product.updated",', ' "data":{"handle":"<handle>"}}'], visible: true },
			{ id: 'b0', kind: 'box', x: 16, y: 90, w: 328, h: 38, label: 'Verify the signature and the payload', sub: 'shared handler, same for every store' },
			{ id: 'b1', kind: 'box', x: 16, y: 150, w: 328, h: 38, label: 'Plan the tags', sub: 'which tags does this event touch?' },
			{ id: 'b2', kind: 'box', x: 16, y: 210, w: 328, h: 38, label: 'Purge the tags', sub: 'pages carrying them are now stale' },
			{ id: 'b3', kind: 'box', x: 16, y: 270, w: 328, h: 38, label: 'Warm the pages', sub: 'pre-render created or updated pages' },
			{ id: 'e0', kind: 'edge', from: 'b0', to: 'b1' },
			{ id: 'e1', kind: 'edge', from: 'b1', to: 'b2' },
			{ id: 'e2', kind: 'edge', from: 'b2', to: 'b3' }
		],
		steps: [
			{ say: 'A product.updated event names the handle that changed. It is signed like any other delivery.', focus: ['d'] },
			{ say: 'The shared handler verifies the signature and validates the payload before it does anything else.', show: ['b0'], focus: ['b0'] },
			{ say: 'It plans which tags the event touches. A product event names that product, and a created or deleted item also touches the lists.', show: ['b1', 'e0'], focus: ['b1'] },
			{ say: 'It purges those tags. Every cached page whose read carried one of them is now stale.', show: ['b2', 'e1'], focus: ['b2'] },
			{ say: 'Then it pre-renders the created or updated pages, so the first real visitor gets a cache hit instead of paying for a cold render.', show: ['b3', 'e2'], focus: ['b3'] },
			{ say: 'If no base address is configured, the handler logs that warming is disabled. It does not skip the step silently.', set: { b3: { tone: 'warn', sub: 'disabled: logged, not silent' } }, pulse: ['b3'] }
		]
	},
	{
		id: 'ap-cache-headers',
		topic: 'apis',
		group: 'ap-caching-isr',
		title: 'The headers that really arrived',
		blurb: 'What cache-control did the real responses carry?',
		stage: { w: 360, h: 290 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 164,
				cols: ['Response', 'cache-control'],
				rows: [
					['page (dev mode)', 'no-store'],
					['/api/ answer 200', 'public, s-maxage=600'],
					['/api/ 400 and 401', 'public, s-maxage=600'],
					['sitemap.xml', 'public, must-revalidate']
				],
				visible: true
			},
			{ id: 'd', kind: 'doc', x: 16, y: 150, w: 328, title: 'The rule on every /api/ route', lines: ['public, max-age=0, s-maxage=600,', 'stale-while-revalidate=3600'] },
			{ id: 'note', kind: 'text', x: 16, y: 232, w: 328, text: 'Compare the headers that arrive with the intent, and scope a blanket rule to the routes that want it.', size: 'sm' }
		],
		steps: [
			{ say: 'These are cache-control values from the real responses, in dev mode. Four kinds of response, three different answers.', focus: ['t'] },
			{ say: 'In dev mode the pages told the browser not to store them. What a production edge does is a separate setting.', set: { t: { hl: [0] } } },
			{ say: 'Every route under /api/ carried one blanket rule, set once in the framework config.', show: ['d'], set: { t: { hl: [1] } } },
			{ say: 'The same rule rode on the 400 answers to bad handles and on the 401 answers to unsigned deliveries. A shared cache may keep a GET refusal for 600 seconds.', set: { t: { hl: [2] } } },
			{ say: 'A generated file such as the sitemap sets its own, stricter rule: public, but revalidate before reuse.', set: { t: { hl: [3] } } },
			{ say: 'A header rule in the config wins over what a route sets for itself, so look at what really arrives.', show: ['note'], set: { t: { hl: [] } } }
		]
	},

	// ───────────── ap-shopper-ip-rate-limits ─────────────
	{
		id: 'ap-shopper-why',
		topic: 'apis',
		group: 'ap-shopper-ip-rate-limits',
		title: 'One server, many shoppers',
		blurb: 'Why must a server say who the shopper is?',
		stage: { w: 360, h: 270 },
		nodes: [
			{ id: 's1', kind: 'box', x: 16, y: 14, w: 100, h: 40, label: 'Shopper A', visible: true },
			{ id: 's2', kind: 'box', x: 16, y: 74, w: 100, h: 40, label: 'Shopper B', visible: true },
			{ id: 's3', kind: 'box', x: 16, y: 134, w: 100, h: 40, label: 'Shopper C', visible: true },
			{ id: 'st', kind: 'box', x: 140, y: 74, w: 100, h: 40, label: 'Store server' },
			{ id: 'gw', kind: 'box', x: 264, y: 74, w: 80, h: 40, label: 'Gateway' },
			{ id: 'e1', kind: 'edge', from: 's1', to: 'st' },
			{ id: 'e2', kind: 'edge', from: 's2', to: 'st' },
			{ id: 'e3', kind: 'edge', from: 's3', to: 'st' },
			{ id: 'e4', kind: 'edge', from: 'st', to: 'gw' },
			{ id: 'd', kind: 'doc', x: 16, y: 190, w: 328, title: 'What the gateway counts', lines: ['without IP: 1 client (the server)'] }
		],
		steps: [
			{ say: 'Three shoppers load pages at the same time. The store server makes the platform calls for them.', focus: ['s1', 's2', 's3'] },
			{ say: 'Every call leaves from the one store server, so they all arrive from the same address.', show: ['st', 'e1', 'e2', 'e3'], focus: ['st'] },
			{ say: 'The platform gateway rate-limits per shopper IP and per merchant, so it needs to know who is who.', show: ['gw', 'e4'], focus: ['gw'] },
			{ say: 'If the server does not say who the shopper is, all three look like one client and share one limit. A busy hour can rate-limit everybody.', show: ['d'], set: { gw: { tone: 'warn' } } },
			{ say: 'Forward the shopper IP and the gateway counts three clients, each with its own limit.', set: { d: { lines: ['without IP: 1 client (the server)', 'with IP   : 3 clients, 3 limits'] }, gw: { tone: 'accent' } }, pulse: ['d'] },
			{ say: 'The apps route does exactly this: it forwards the shopper IP on its uncached call, once per page view.', focus: ['st'] }
		]
	},
	{
		id: 'ap-xff-trust',
		topic: 'apis',
		group: 'ap-shopper-ip-rate-limits',
		title: 'Which address can be trusted',
		blurb: 'Which entry of x-forwarded-for is the shopper?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'd1', kind: 'doc', x: 16, y: 14, w: 328, title: 'x-forwarded-for as the server receives it', lines: ['x-forwarded-for: 10.0.0.1, 203.0.113.7'], visible: true },
			{ id: 't', kind: 'table', x: 16, y: 76, colW: 108, cols: ['Entry', 'Written by', 'Trust'], rows: [['10.0.0.1', 'the shopper', 'never'], ['203.0.113.7', 'load balancer', 'yes']] },
			{ id: 'd2', kind: 'doc', x: 16, y: 162, w: 328, title: 'Headers the shopper controls (ignored)', lines: ['cf-connecting-ip', 'true-client-ip', 'x-real-ip'] },
			{ id: 'd3', kind: 'doc', x: 16, y: 252, w: 328, title: 'Reading it', lines: ['trusted hops = 1  ->  right-most entry', 'a client port is stripped'] }
		],
		steps: [
			{ say: 'The header lists addresses left to right as the request passed proxies. The shopper can write anything in it before the first proxy.', focus: ['d1'] },
			{ say: 'The left entry here is whatever the shopper claimed. It is not evidence of anything.', show: ['t'], set: { t: { hl: [0] } } },
			{ say: 'The right-most entry was appended by the load balancer the server trusts, so it is the one address nobody can fake.', set: { t: { hl: [1] } } },
			{ say: 'Other headers that carry a client address are ignored too, because they come from the shopper.', show: ['d2'], set: { t: { hl: [] } } },
			{ say: 'The number of trusted hops is configurable and is one by default, so a second trusted proxy moves the position. A port on the address is stripped.', show: ['d3'], focus: ['d3'] },
			{ say: 'The result is one address per shopper, passed to the platform as x-forwarded-for.', focus: ['t'], set: { t: { hl: [1] } } }
		]
	},
	{
		id: 'ap-uncached-only',
		topic: 'apis',
		group: 'ap-shopper-ip-rate-limits',
		title: 'Only on uncached fetches',
		blurb: 'Why does the shopper IP never ride on a cached read, and what is a 429?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'a', kind: 'doc', x: 16, y: 14, w: 328, title: 'Cached read (tags, revalidate)', lines: ['key = url + request headers'], visible: true },
			{ id: 'b', kind: 'doc', x: 16, y: 106, w: 328, title: 'Uncached route (no-store)', lines: ['fetch(url, no-store, shopper ip)', 'nothing stored: no entry per ip'] },
			{ id: 'c', kind: 'box', x: 16, y: 192, w: 328, h: 44, label: 'A 429 from the gateway', sub: 'treated like a 5xx: backend unavailable', tone: 'warn' },
			{ id: 'd', kind: 'box', x: 16, y: 266, w: 328, h: 44, label: 'The read reports success: false', sub: 'not "not found": the page keeps its last good copy' },
			{ id: 'e', kind: 'edge', from: 'c', to: 'd' }
		],
		steps: [
			{ say: 'Next builds the key of a cached fetch from the URL and the request headers. Keep that in mind when adding a header.', focus: ['a'] },
			{ say: 'A per-shopper header on a cached fetch makes a new entry for every IP. The cache fills with near-duplicates and stops helping.', set: { a: { lines: ['key = url + request headers', 'x-forwarded-for ip-1 -> entry 1', 'x-forwarded-for ip-2 -> entry 2'] } }, pulse: ['a'] },
			{ say: 'So the shopper IP goes only on uncached fetches, such as the apps route. ISR renders send no shopper IP at all.', show: ['b'], focus: ['b'] },
			{ say: 'When the gateway rate-limits a call, it answers 429.', show: ['c'], focus: ['c'] },
			{ say: 'A 429 counts as backend unavailable, like a 5xx. The read reports failure, not "not found", so the page keeps its last good copy.', show: ['d', 'e'], focus: ['d'] },
			{ say: 'Static generation at build time can run with lower concurrency for the same reason: a 429 fails one page render, and ISR keeps the previous page.', pulse: ['d'] },
			{ say: 'Rule of thumb: identify the shopper only where nothing is cached, and treat a rate limit as an outage, never as an empty catalog.', set: { d: { tone: 'accent' } } }
		]
	},

	// ───────────── ap-fail-soft ─────────────
	{
		id: 'ap-soft-defaults',
		topic: 'apis',
		group: 'ap-fail-soft',
		title: 'Empty, not broken',
		blurb: 'Where does the store return a default instead of failing?',
		stage: { w: 360, h: 290 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 164,
				cols: ['When this fails', 'The page gets'],
				rows: [
					['apps service down', 'an empty list'],
					['menu handle unknown', 'null'],
					['optional config 404', 'a working page'],
					['tracker script blocked', 'a working page']
				],
				visible: true
			},
			{ id: 'd', kind: 'doc', x: 16, y: 140, w: 328, title: 'Seen in the run', lines: ['apps       : 200 {"apps":[]}', 'unknown menu: 200 null', 'optional cfg: 404, cached 300 s', 'trackers    : 16 loads blocked'] },
			{ id: 'note', kind: 'text', x: 16, y: 262, w: 328, text: 'An optional feature must never take the store down.', size: 'sm' }
		],
		steps: [
			{ say: 'Several parts of the store return a default instead of failing the page. The table lists four of them.', focus: ['t'] },
			{ say: 'The apps route turns an unreachable service into an empty list. The page simply shows no apps.', set: { t: { hl: [0] } } },
			{ say: 'An unknown nav-menu handle answers null. The caller handles a missing menu without an error.', set: { t: { hl: [1] } } },
			{ say: 'An optional configuration call to a session backend answered 404, cached for 300 seconds. The page loaded anyway.', show: ['d'], set: { t: { hl: [2] } } },
			{ say: 'With the tracker scripts blocked, 16 loads over four page views, every page still rendered and worked.', set: { t: { hl: [3] } } },
			{ say: 'A missing apps list or a blocked tracker is a small loss. A failed page is a lost sale.', show: ['note'], set: { t: { hl: [] } } }
		]
	},
	{
		id: 'ap-silent-bug',
		topic: 'apis',
		group: 'ap-fail-soft',
		title: 'The bug a silent fallback hid',
		blurb: 'How can a good fallback hide a real misconfiguration?',
		stage: { w: 360, h: 380 },
		nodes: [
			{ id: 'b0', kind: 'box', x: 16, y: 14, w: 328, h: 38, label: 'Operator sets only the public merchant id', sub: 'one id, two env names', visible: true },
			{ id: 'b1', kind: 'box', x: 16, y: 74, w: 328, h: 38, label: 'The server-only variable stays empty', sub: 'the example file ships it empty' },
			{ id: 'b2', kind: 'box', x: 16, y: 134, w: 328, h: 38, label: 'Upstream gets an empty merchant header', sub: 'the platform answers 400', tone: 'neg' },
			{ id: 'b3', kind: 'box', x: 16, y: 194, w: 328, h: 38, label: 'The handler degrades to an empty list', sub: 'it answers 200 {"apps":[]}' },
			{ id: 'b4', kind: 'box', x: 16, y: 254, w: 328, h: 38, label: 'No apps on the page, no error anywhere', sub: 'the fallback hid the bug', tone: 'warn' },
			{ id: 'e0', kind: 'edge', from: 'b0', to: 'b1' },
			{ id: 'e1', kind: 'edge', from: 'b1', to: 'b2' },
			{ id: 'e2', kind: 'edge', from: 'b2', to: 'b3' },
			{ id: 'e3', kind: 'edge', from: 'b3', to: 'b4' },
			{ id: 'd', kind: 'doc', x: 16, y: 306, w: 328, title: 'The fixes', lines: ['empty env var: use ||, not ??', 'accept either name, and log it'] }
		],
		steps: [
			{ say: 'A real bug that a code comment describes. The merchant id lived under two names, a public one and a server-only one, and an operator set only the public one.', focus: ['b0'] },
			{ say: 'The server-only variable stayed empty. The example env file ships it empty, so it was present but empty.', show: ['b1', 'e0'], focus: ['b1'] },
			{ say: 'The call to the upstream went out with an empty merchant header, and the platform answered 400.', show: ['b2', 'e1'], focus: ['b2'] },
			{ say: 'The handler is built to degrade when the service fails, so it turned that 400 into an empty list and a 200.', show: ['b3', 'e2'], focus: ['b3'] },
			{ say: 'The page rendered with no apps and no error anywhere. The fallback worked so well that it hid the bug.', show: ['b4', 'e3'], pulse: ['b4'] },
			{ say: 'Two fixes in the code: treat an empty value as unset with ||, because ?? only falls back on undefined, and accept either name.', show: ['d'], focus: ['d'] },
			{ say: 'The third fix is the lesson of this topic: whatever you swallow, log it.', set: { d: { lines: ['empty env var: use ||, not ??', 'accept either name, and LOG it'] } }, pulse: ['d'] }
		]
	},
	{
		id: 'ap-log-swallowed',
		topic: 'apis',
		group: 'ap-fail-soft',
		title: 'Degrade, but say so',
		blurb: 'How can a fallback stay quiet for the visitor and loud for the team?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'd1', kind: 'doc', x: 16, y: 14, w: 328, title: 'Silent fallback', lines: ['try { upstream() }', 'catch { return [] }', '// nobody ever knows'], visible: true },
			{ id: 'd2', kind: 'doc', x: 16, y: 106, w: 328, title: 'Fallback that says so', lines: ['try { upstream() }', 'catch (e) { warnOnce(label, e);', '            return [] }'] },
			{ id: 'r', kind: 'box', x: 16, y: 206, w: 328, h: 44, label: 'One log line per kind of failure', sub: 'label, status, error, request id' },
			{ id: 's', kind: 'box', x: 16, y: 272, w: 328, h: 44, label: 'Someone can alert on it', sub: 'the 400 above would have shown up' },
			{ id: 'e', kind: 'edge', from: 'r', to: 's' }
		],
		steps: [
			{ say: 'Degrading is right for a page: a missing apps list should not take down the store.', focus: ['d1'] },
			{ say: 'But a bare catch removes the only signal that something is wrong. Nobody ever learns that the fallback is in use.', set: { d1: { lines: ['try { upstream() }', 'catch { return [] }', '// nobody ever knows'] } }, pulse: ['d1'] },
			{ say: 'The same fallback can log what it swallowed: a label, the error and the status.', show: ['d2'], focus: ['d2'] },
			{ say: 'Log once per kind, not once per request, so a failing service does not flood the logs.', show: ['r'], focus: ['r'] },
			{ say: 'With the 400 logged, the empty merchant header bug would have been found on the first day.', show: ['s', 'e'], focus: ['s'] },
			{ say: 'Degrade for the visitor, be loud for the team.', set: { r: { tone: 'accent' }, s: { tone: 'accent' } }, pulse: ['s'] }
		]
	}
];
