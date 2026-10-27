import type { Scene, SceneNode } from '../../types';

/** A thin vertical lifeline for a message diagram (a client or a server). */
const lifeline = (id: string, cx: number, y: number, h: number): SceneNode => ({ id, kind: 'box', x: cx - 2, y, w: 4, h, label: '', visible: true });

/** Computer science lessons, networking series part 2: HTTP versions, proxies, CDNs, realtime and debugging. */
export const csNet2: Scene[] = [
	// ───────── net-http-evolution ─────────
	{
		id: 'cs-net-http1-hol',
		topic: 'cs',
		group: 'net-http-evolution',
		title: 'HTTP/1.1 head-of-line blocking',
		blurb: 'Why does one slow response hold up everything behind it?',
		stage: { w: 360, h: 300 },
		nodes: [
			{ id: 'conn', kind: 'box', x: 20, y: 10, w: 320, h: 32, label: 'One connection to the server', visible: true },
			{ id: 'r1', kind: 'box', x: 20, y: 56, w: 320, h: 40, label: 'GET /app.js', sub: 'slow: the server needs 800 ms', tone: 'warn' },
			{ id: 'r2', kind: 'box', x: 20, y: 108, w: 320, h: 40, label: 'GET /style.css', sub: 'tiny (20 ms) but must wait its turn' },
			{ id: 'r3', kind: 'box', x: 20, y: 160, w: 320, h: 40, label: 'GET /logo.png', sub: 'also waits behind app.js' },
			{ id: 'tx', kind: 'text', x: 20, y: 224, text: 'Workaround: about 6 connections at once', w: 320, size: 'sm' },
			{ id: 'p1', kind: 'box', x: 20, y: 234, w: 46, h: 28, label: 'c1' },
			{ id: 'p2', kind: 'box', x: 74, y: 234, w: 46, h: 28, label: 'c2' },
			{ id: 'p3', kind: 'box', x: 128, y: 234, w: 46, h: 28, label: 'c3' },
			{ id: 'p4', kind: 'box', x: 182, y: 234, w: 46, h: 28, label: 'c4' },
			{ id: 'p5', kind: 'box', x: 236, y: 234, w: 46, h: 28, label: 'c5' },
			{ id: 'p6', kind: 'box', x: 290, y: 234, w: 46, h: 28, label: 'c6' },
			{ id: 'tk', kind: 'text', x: 20, y: 286, text: 'Keep-alive: reuse a connection, skip the setup', w: 320, size: 'sm', tone: 'accent' }
		],
		steps: [
			{ say: 'HTTP/1.1 handles one request at a time per connection: send a request, wait for the whole response, then send the next one.', focus: ['conn'] },
			{ say: 'The page needs app.js first, and the server takes 800 ms to produce it. Everything else has to wait for that answer.', show: ['r1'], pulse: ['r1'] },
			{ say: 'style.css and logo.png need only about 20 ms each, but they queue behind app.js. This is head-of-line blocking: the front of the line holds up the rest.', show: ['r2', 'r3'], set: { r2: { tone: 'warn' }, r3: { tone: 'warn' } } },
			{ say: 'Browsers work around it by opening about 6 connections per host, so up to 6 requests run side by side. Each connection still queues its own requests.', show: ['tx', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'] },
			{ say: 'Keep-alive leaves a connection open after a response, so the next request skips a new TCP and TLS handshake. It saves setup time but does not remove the queue.', show: ['tk'], set: { conn: { label: 'Connection stays open (keep-alive)', tone: 'accent' } } }
		]
	},
	{
		id: 'cs-net-http2-multiplex',
		topic: 'cs',
		group: 'net-http-evolution',
		title: 'HTTP/2 multiplexing',
		blurb: 'How can many requests share one connection?',
		stage: { w: 360, h: 310 },
		nodes: [
			{ id: 'br', kind: 'box', x: 110, y: 10, w: 140, h: 34, label: 'Browser', visible: true },
			{ id: 'conn', kind: 'box', x: 20, y: 60, w: 320, h: 44, label: 'One TCP connection', sub: 'HTTP/2', visible: true },
			{ id: 'f1', kind: 'box', x: 20, y: 120, w: 46, h: 30, label: 'js' },
			{ id: 'f2', kind: 'box', x: 74, y: 120, w: 46, h: 30, label: 'css' },
			{ id: 'f3', kind: 'box', x: 128, y: 120, w: 46, h: 30, label: 'img' },
			{ id: 'f4', kind: 'box', x: 182, y: 120, w: 46, h: 30, label: 'js' },
			{ id: 'f5', kind: 'box', x: 236, y: 120, w: 46, h: 30, label: 'css' },
			{ id: 'f6', kind: 'box', x: 290, y: 120, w: 46, h: 30, label: 'img' },
			{ id: 'fl', kind: 'text', x: 20, y: 170, text: 'Pieces (frames) of three streams, interleaved', w: 320, size: 'sm' },
			{ id: 'hd', kind: 'text', x: 20, y: 196, text: 'Headers are compressed too: a repeated header costs a few bytes.', w: 320, size: 'sm', tone: 'accent' },
			{ id: 'lost', kind: 'box', x: 20, y: 222, w: 320, h: 36, label: 'One TCP packet is lost', sub: 'every stream waits for the resend', tone: 'warn' },
			{ id: 'h3', kind: 'box', x: 20, y: 268, w: 320, h: 36, label: 'HTTP/3 (QUIC over UDP)', sub: 'streams are independent', tone: 'accent' }
		],
		steps: [
			{ say: 'HTTP/2 uses one connection for everything and gives each request its own numbered stream. Here the browser asks for js, css and img together.', show: ['f1', 'f2', 'f3'], focus: ['conn'] },
			{ say: 'Responses are cut into small frames that are interleaved on the wire, so a slow js response no longer blocks css and img. No more 6 connections.', show: ['f4', 'f5', 'f6', 'fl'] },
			{ say: 'HTTP/2 also compresses headers (HPACK). Cookies and user-agent strings repeat on every request, so this saves a lot of bytes.', show: ['hd'], pulse: ['hd'] },
			{ say: 'One limit remains: TCP delivers bytes in order. If one packet is lost, every stream on the connection stalls until it is resent.', show: ['lost'], set: { conn: { tone: 'warn' } } },
			{ say: 'HTTP/3 runs on QUIC over UDP, where each stream recovers on its own. A lost packet only delays the stream it belongs to.', show: ['h3'], set: { conn: { tone: 'accent', sub: 'HTTP/3' }, lost: { tone: 'neutral' } } }
		]
	},

	// ───────── net-proxies-lb ─────────
	{
		id: 'cs-net-reverse-proxy-lb',
		topic: 'cs',
		group: 'net-proxies-lb',
		title: 'Reverse proxy and load balancer',
		blurb: 'How do many servers sit behind one address?',
		stage: { w: 360, h: 290 },
		nodes: [
			{ id: 'cl', kind: 'box', x: 110, y: 8, w: 140, h: 34, label: 'Clients', visible: true },
			{ id: 'px', kind: 'box', x: 90, y: 90, w: 180, h: 44, label: 'Reverse proxy', sub: 'public address shop.example', visible: true },
			{ id: 's1', kind: 'box', x: 10, y: 190, w: 100, h: 40, label: 'Server 1', sub: '10.0.0.1' },
			{ id: 's2', kind: 'box', x: 130, y: 190, w: 100, h: 40, label: 'Server 2', sub: '10.0.0.2' },
			{ id: 's3', kind: 'box', x: 250, y: 190, w: 100, h: 40, label: 'Server 3', sub: '10.0.0.3' },
			{ id: 'e0', kind: 'edge', from: 'cl', to: 'px', label: 'HTTPS' },
			{ id: 'g1', kind: 'edge', from: 'px', to: 's1' },
			{ id: 'g2', kind: 'edge', from: 'px', to: 's2' },
			{ id: 'g3', kind: 'edge', from: 'px', to: 's3' },
			{ id: 't', kind: 'token', x: 180, y: 150, label: 'req' },
			{ id: 'hc', kind: 'text', x: 130, y: 250, text: 'health check fails: no traffic', w: 100, anchor: 'start', size: 'sm', tone: 'neg' },
			{ id: 'tls', kind: 'text', x: 20, y: 276, text: 'Client to proxy: HTTPS. Proxy to servers: plain HTTP.', w: 330, size: 'sm', tone: 'accent' }
		],
		steps: [
			{ say: 'Clients only know one public address. A reverse proxy sits there and receives every request on behalf of the real servers.', show: ['e0'], focus: ['px'] },
			{ say: 'Behind it run three identical app servers on private addresses. Clients never see them, so you can add or remove servers freely.', show: ['s1', 's2', 's3', 'g1', 'g2', 'g3'] },
			{ say: 'A request arrives. The proxy, acting as a load balancer, has to pick a server.', show: ['t'], pulse: ['px'] },
			{ say: 'Round robin hands out requests in turn: server 1, then 2, then 3, then back to 1. Each server gets an even share of the work.', move: { t: { x: 60, y: 168 } }, pulse: ['s1'] },
			{ say: 'The proxy also health-checks each server (for example GET /health). Server 2 stops answering, so it is taken out of the rotation.', show: ['hc'], set: { s2: { tone: 'neg', sub: 'down' }, g2: { tone: 'neg', dashed: true } }, move: { t: { x: 300, y: 168 } } },
			{ say: 'TLS ends at the proxy: it decrypts HTTPS once, so the app servers speak simple HTTP. Certificates live in one place.', show: ['tls'], focus: ['px'] }
		]
	},
	{
		id: 'cs-net-cdn-edge',
		topic: 'cs',
		group: 'net-proxies-lb',
		title: 'How a CDN edge cache works',
		blurb: 'Why is the second visitor served so much faster?',
		stage: { w: 360, h: 300 },
		nodes: [
			{ id: 'us', kind: 'box', x: 100, y: 10, w: 150, h: 40, label: 'User', sub: 'Mumbai', visible: true },
			{ id: 'ed', kind: 'box', x: 100, y: 110, w: 150, h: 44, label: 'Edge cache', sub: 'Mumbai, empty', visible: true },
			{ id: 'or', kind: 'box', x: 100, y: 212, w: 150, h: 44, label: 'Origin server', sub: 'Virginia, USA', visible: true },
			{ id: 'e1', kind: 'edge', from: 'us', to: 'ed', label: 'GET /hero.jpg' },
			{ id: 'e2', kind: 'edge', from: 'ed', to: 'or', label: 'miss' },
			{ id: 'e3', kind: 'edge', from: 'or', to: 'ed', label: 'image', tone: 'accent' },
			{ id: 'e4', kind: 'edge', from: 'ed', to: 'us', label: 'image', tone: 'accent' },
			{ id: 't1', kind: 'text', x: 270, y: 86, text: 'edge is about 5 ms away', w: 84, size: 'sm' },
			{ id: 't2', kind: 'text', x: 270, y: 192, text: 'origin is about 200 ms away', w: 84, size: 'sm', tone: 'warn' },
			{ id: 'ttl', kind: 'text', x: 20, y: 284, text: 'Cache-Control: max-age=3600', w: 320, size: 'md', tone: 'accent' }
		],
		steps: [
			{ say: 'A user in Mumbai asks for hero.jpg. The request goes to the nearest CDN edge, a cache server in their own region.', show: ['e1'], focus: ['us'] },
			{ say: 'This is the first request, so the edge has no copy: a cache miss. It has to ask the origin server in Virginia, on the other side of the world.', show: ['e2', 't2'], set: { ed: { tone: 'warn' } } },
			{ say: 'The origin answers. That long round trip costs about 200 ms, far more than the user would pay to reach the edge.', show: ['e3'], pulse: ['or'] },
			{ say: 'The edge keeps a copy and passes the image on. This first user waited about 200 ms in total.', show: ['e4'], set: { ed: { tone: 'accent', sub: 'Mumbai, stored copy' } }, hide: [] },
			{ say: 'Later, a second user in Mumbai asks for the same file. The edge already has it, so the origin is not involved at all.', hide: ['e2', 'e3', 'e4', 't2'], set: { us: { sub: 'Mumbai, second visitor' }, ed: { sub: 'cache hit' } }, show: ['t1'] },
			{ say: 'A cache hit: the edge replies straight away in about 5 ms. The origin also handles far less traffic.', show: ['e4'], pulse: ['us'] },
			{ say: 'The origin decides how long a copy stays fresh with the Cache-Control header. max-age=3600 means one hour; after that, the edge checks the origin again.', show: ['ttl'], focus: ['ttl'] }
		]
	},

	// ───────── net-realtime ─────────
	{
		id: 'cs-net-polling-vs-ws',
		topic: 'cs',
		group: 'net-realtime',
		title: 'Polling vs WebSocket',
		blurb: 'How does a server tell the browser something new happened?',
		stage: { w: 360, h: 340 },
		nodes: [
			{ id: 'cl', kind: 'box', x: 20, y: 8, w: 100, h: 34, label: 'Browser', visible: true },
			{ id: 'sv', kind: 'box', x: 240, y: 8, w: 100, h: 34, label: 'Server', visible: true },
			lifeline('lc', 70, 46, 288), lifeline('ls', 290, 46, 288),
			{ id: 'pl', kind: 'text', x: 180, y: 66, text: 'Polling', anchor: 'middle', size: 'sm', tone: 'warn' },
			{ id: 'p1', kind: 'edge', from: { x: 72, y: 82 }, to: { x: 288, y: 92 }, label: 'GET /updates' },
			{ id: 'p2', kind: 'edge', from: { x: 288, y: 108 }, to: { x: 72, y: 118 }, label: 'nothing yet', tone: 'warn' },
			{ id: 'p3', kind: 'edge', from: { x: 72, y: 134 }, to: { x: 288, y: 144 }, label: 'GET /updates' },
			{ id: 'p4', kind: 'edge', from: { x: 288, y: 160 }, to: { x: 72, y: 170 }, label: 'new message', tone: 'accent' },
			{ id: 'wl', kind: 'text', x: 180, y: 200, text: 'WebSocket', anchor: 'middle', size: 'sm', tone: 'accent' },
			{ id: 'u1', kind: 'edge', from: { x: 72, y: 216 }, to: { x: 288, y: 226 }, label: 'GET + Upgrade: websocket' },
			{ id: 'u2', kind: 'edge', from: { x: 288, y: 242 }, to: { x: 72, y: 252 }, label: '101 Switching Protocols', tone: 'accent' },
			{ id: 'w1', kind: 'edge', from: { x: 288, y: 270 }, to: { x: 72, y: 278 }, label: 'push: new message', tone: 'accent' },
			{ id: 'w2', kind: 'edge', from: { x: 72, y: 294 }, to: { x: 288, y: 302 }, label: 'client message' },
			{ id: 'w3', kind: 'edge', from: { x: 288, y: 318 }, to: { x: 72, y: 326 }, label: 'push: new message', tone: 'accent' }
		],
		steps: [
			{ say: 'HTTP only answers when asked. With short polling the browser keeps asking "anything new?" on a timer, and the server replies.', show: ['pl', 'p1', 'p2'] },
			{ say: 'Most answers are empty, yet each one is a full request with headers. News is delayed until the next poll. Long polling holds the request open until there is news, then reconnects.', show: ['p3', 'p4'] },
			{ say: 'A WebSocket begins as an ordinary HTTP request that asks to Upgrade the connection.', show: ['wl', 'u1'], pulse: ['cl'] },
			{ say: 'The server answers 101 Switching Protocols. The same TCP connection now carries WebSocket frames instead of HTTP.', show: ['u2'], pulse: ['sv'] },
			{ say: 'Now the server can push a message the moment it happens, without waiting to be asked.', show: ['w1'], pulse: ['cl'] },
			{ say: 'Either side can send at any time over the one open channel, with tiny per-message overhead. Good for chat, games and live cursors.', show: ['w2', 'w3'] }
		]
	},
	{
		id: 'cs-net-sse-stream',
		topic: 'cs',
		group: 'net-realtime',
		title: 'Server-Sent Events stream',
		blurb: 'How does a server stream updates over plain HTTP?',
		stage: { w: 360, h: 310 },
		nodes: [
			{ id: 'cl', kind: 'box', x: 20, y: 8, w: 100, h: 34, label: 'Browser', visible: true },
			{ id: 'sv', kind: 'box', x: 240, y: 8, w: 100, h: 34, label: 'Server', visible: true },
			lifeline('lc', 70, 46, 256), lifeline('ls', 290, 46, 256),
			{ id: 'rq', kind: 'edge', from: { x: 72, y: 66 }, to: { x: 288, y: 76 }, label: 'GET /stream' },
			{ id: 'hd', kind: 'edge', from: { x: 288, y: 98 }, to: { x: 72, y: 108 }, label: '200 text/event-stream', tone: 'accent' },
			{ id: 'v1', kind: 'edge', from: { x: 288, y: 132 }, to: { x: 72, y: 140 }, label: 'id: 1  data: Hel', tone: 'accent' },
			{ id: 'v2', kind: 'edge', from: { x: 288, y: 158 }, to: { x: 72, y: 166 }, label: 'id: 2  data: lo', tone: 'accent' },
			{ id: 'v3', kind: 'edge', from: { x: 288, y: 184 }, to: { x: 72, y: 192 }, label: 'id: 3  data: wor', tone: 'accent' },
			{ id: 'dr', kind: 'text', x: 180, y: 222, text: 'connection drops', anchor: 'middle', size: 'sm', tone: 'neg' },
			{ id: 'rc', kind: 'edge', from: { x: 72, y: 238 }, to: { x: 288, y: 248 }, label: 'Last-Event-ID: 3', tone: 'warn' },
			{ id: 'v4', kind: 'edge', from: { x: 288, y: 270 }, to: { x: 72, y: 278 }, label: 'id: 4  data: ld', tone: 'accent' }
		],
		steps: [
			{ say: 'In the browser, new EventSource("/stream") makes an ordinary HTTP GET request. Nothing special is needed on the network.', show: ['rq'], pulse: ['cl'] },
			{ say: 'The server replies 200 with Content-Type: text/event-stream and then never finishes the response. One long-lived response stays open.', show: ['hd'], pulse: ['sv'] },
			{ say: 'When something happens, the server writes a few lines (id and data, ending with a blank line) onto that open response. The browser fires an event for each.', show: ['v1'] },
			{ say: 'Events arrive the moment they are produced. This is how an LLM answer streams in token by token. Data flows one way only, server to browser.', show: ['v2', 'v3'] },
			{ say: 'Networks drop. The browser notices that the stream ended.', show: ['dr'], pulse: ['dr'] },
			{ say: 'EventSource reconnects by itself and sends the last id it saw in a Last-Event-ID header.', show: ['rc'], pulse: ['cl'] },
			{ say: 'The server resumes after id 3, so nothing is lost. You get auto-reconnect for free, which WebSocket does not give you.', show: ['v4'] }
		]
	},

	// ───────── net-debugging ─────────
	{
		id: 'cs-net-traceroute',
		topic: 'cs',
		group: 'net-debugging',
		title: 'How traceroute finds the path',
		blurb: 'How can you see every router between you and a server?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'cmd', kind: 'text', x: 20, y: 24, text: '$ traceroute example.com', w: 200, size: 'md', visible: true },
			{ id: 'ttl', kind: 'text', x: 20, y: 46, text: 'probe TTL = 1', w: 200, size: 'sm', tone: 'warn' },
			{ id: 'h1', kind: 'box', x: 20, y: 60, w: 190, h: 36, label: '1  192.168.1.1', sub: 'home router' },
			{ id: 'r1', kind: 'text', x: 224, y: 83, text: 'time exceeded: 2 ms', w: 120, size: 'sm' },
			{ id: 'h2', kind: 'box', x: 20, y: 104, w: 190, h: 36, label: '2  10.20.0.1', sub: 'ISP gateway' },
			{ id: 'r2', kind: 'text', x: 224, y: 127, text: 'time exceeded: 9 ms', w: 120, size: 'sm' },
			{ id: 'h3', kind: 'box', x: 20, y: 148, w: 190, h: 36, label: '3  72.14.8.5', sub: 'ISP backbone' },
			{ id: 'r3', kind: 'text', x: 224, y: 171, text: 'time exceeded: 12 ms', w: 120, size: 'sm' },
			{ id: 'h4', kind: 'box', x: 20, y: 192, w: 190, h: 36, label: '4  142.250.1.9', sub: 'exchange point' },
			{ id: 'r4', kind: 'text', x: 224, y: 215, text: 'time exceeded: 14 ms', w: 120, size: 'sm' },
			{ id: 'h5', kind: 'box', x: 20, y: 236, w: 190, h: 36, label: '5  203.0.113.50', sub: 'undersea cable', tone: 'warn' },
			{ id: 'r5', kind: 'text', x: 224, y: 259, text: 'time exceeded: 182 ms', w: 120, size: 'sm', tone: 'warn' },
			{ id: 'h6', kind: 'box', x: 20, y: 280, w: 190, h: 36, label: '6  198.51.100.7', sub: 'example.com', tone: 'accent' },
			{ id: 'r6', kind: 'text', x: 224, y: 303, text: 'reply: 185 ms', w: 120, size: 'sm', tone: 'accent' }
		],
		steps: [
			{ say: 'Every IP packet carries a TTL (time to live) counter. Each router lowers it by 1, and a router that sees it reach 0 drops the packet and sends back "time exceeded".', show: ['ttl'], focus: ['cmd'] },
			{ say: 'traceroute sends its first probe with TTL 1. The first router drops it and replies, which reveals the router\'s address and the round trip time: 2 ms.', show: ['h1', 'r1'], pulse: ['h1'] },
			{ say: 'Probe two has TTL 2, so it survives one router and dies at the second. That router now reveals itself: 9 ms.', show: ['h2', 'r2'], set: { ttl: { text: 'probe TTL = 2' } }, pulse: ['h2'] },
			{ say: 'TTL 3 reaches the third router: 12 ms. Each probe goes one hop further than the last, so the list grows hop by hop.', show: ['h3', 'r3'], set: { ttl: { text: 'probe TTL = 3' } }, pulse: ['h3'] },
			{ say: 'TTL 4 reaches the fourth router at 14 ms. So far the path is quick, with small steps of a few milliseconds.', show: ['h4', 'r4'], set: { ttl: { text: 'probe TTL = 4' } }, pulse: ['h4'] },
			{ say: 'TTL 5 shows a jump from 14 ms to 182 ms. That hop is a long-distance link, so most of the delay is here, not in your code.', show: ['h5', 'r5'], set: { ttl: { text: 'probe TTL = 5' } }, focus: ['h5'] },
			{ say: 'TTL 6 reaches the destination, which answers normally: 185 ms. You now know the route and exactly where the latency comes from.', show: ['h6', 'r6'], set: { ttl: { text: 'probe TTL = 6' } }, pulse: ['h6'] }
		]
	},
	{
		id: 'cs-net-latency-budget',
		topic: 'cs',
		group: 'net-debugging',
		title: 'Where 300 ms of a page load goes',
		blurb: 'Which parts of a request can you actually shorten?',
		stage: { w: 360, h: 290 },
		nodes: [
			{ id: 'l1', kind: 'text', x: 8, y: 56, text: 'DNS 30 ms', w: 100, size: 'sm', visible: true },
			{ id: 'b1', kind: 'box', x: 110, y: 40, w: 24, h: 22, label: '', visible: true },
			{ id: 'l2', kind: 'text', x: 8, y: 90, text: 'TCP 40 ms', w: 100, size: 'sm', visible: true },
			{ id: 'b2', kind: 'box', x: 134, y: 74, w: 32, h: 22, label: '', visible: true },
			{ id: 'l3', kind: 'text', x: 8, y: 124, text: 'TLS 40 ms', w: 100, size: 'sm', visible: true },
			{ id: 'b3', kind: 'box', x: 166, y: 108, w: 32, h: 22, label: '', visible: true },
			{ id: 'l4', kind: 'text', x: 8, y: 158, text: 'Request 20 ms', w: 100, size: 'sm' },
			{ id: 'b4', kind: 'box', x: 198, y: 142, w: 16, h: 22, label: '' },
			{ id: 'l5', kind: 'text', x: 8, y: 192, text: 'Server 100 ms', w: 100, size: 'sm' },
			{ id: 'b5', kind: 'box', x: 214, y: 176, w: 80, h: 22, label: '', tone: 'warn' },
			{ id: 'l6', kind: 'text', x: 8, y: 226, text: 'Download 70 ms', w: 100, size: 'sm' },
			{ id: 'b6', kind: 'box', x: 294, y: 210, w: 56, h: 22, label: '' },
			{ id: 'tot', kind: 'text', x: 8, y: 270, text: 'Setup so far: 110 ms', w: 340, size: 'lg', visible: true }
		],
		steps: [
			{ say: 'A cold page load starts with setup, before any page data moves: DNS 30 ms, a TCP handshake 40 ms and a TLS handshake 40 ms. That is 110 ms of waiting.', focus: ['b1', 'b2', 'b3'] },
			{ say: 'Then the request travels (20 ms) and the server thinks for 100 ms: database queries, rendering. This is usually the one part your own code controls.', show: ['l4', 'b4', 'l5', 'b5'], set: { tot: { text: 'So far: 230 ms' } } },
			{ say: 'Finally the response downloads for 70 ms. Add it up: 30 + 40 + 40 + 20 + 100 + 70 = 300 ms.', show: ['l6', 'b6'], set: { tot: { text: 'Total: 300 ms' } } },
			{ say: 'HTTP/3 merges the transport and TLS handshakes into a single round trip, so the two 40 ms steps become one 40 ms step. Total: 260 ms.', hide: ['b3'], set: { l2: { text: 'QUIC+TLS 40 ms', tone: 'accent' }, l3: { text: 'TLS: merged', tone: 'accent' }, b2: { tone: 'accent' }, tot: { text: 'With HTTP/3: 260 ms' } } },
			{ say: 'On a repeat visit, connection reuse (keep-alive) skips TCP and TLS entirely. Only DNS, request, server and download remain: 220 ms.', hide: ['b2'], set: { l2: { text: 'Setup 0 ms (reused)' }, tot: { text: 'With reuse: 220 ms', tone: 'accent' } } },
			{ say: 'A CDN edge near the user answers from cache: server time drops to about 10 ms and the download to about 30 ms. Total: 30 + 20 + 10 + 30 = 90 ms.', set: { l5: { text: 'Server 10 ms', tone: 'accent' }, b5: { w: 8, tone: 'accent' }, l6: { text: 'Download 30 ms', tone: 'accent' }, b6: { w: 24, tone: 'accent' }, tot: { text: 'With a CDN: 90 ms' } } }
		]
	}
];
