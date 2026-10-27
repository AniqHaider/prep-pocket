import type { DbTopic } from '../types';

const md = (...lines: string[]) => lines.join('\n');

// `try` snippets are plain JavaScript run by the in-app JS playground: no imports, no DOM, deterministic output via console.log.
export const netTopics: DbTopic[] = [
	{
		id: 'net-layers',
		title: 'Network layers and packets',
		level: 'basic',
		summary: 'See how data is wrapped layer by layer and hops across routers to reach another machine.',
		scenes: ['cs-net-encapsulation', 'cs-net-packet-journey'],
		notes: md(
			'Networking is split into **layers**, each solving one problem and trusting the one below it. The 7-layer **OSI model** is a teaching vocabulary. Real networks follow the 4-layer **TCP/IP model**:',
			'',
			'- **Link**: moves a frame across one local network (Ethernet, Wi-Fi), addressed by **MAC address**.',
			'- **Internet**: moves a packet across many networks, addressed by **IP address**.',
			'- **Transport**: TCP or UDP, which add **ports** so the data reaches the right program.',
			'- **Application**: HTTP, DNS, TLS and so on.',
			'',
			'**Encapsulation** means each layer wraps the data from the layer above with its own header. Your HTTP request becomes a TCP segment, then an IP packet, then an Ethernet frame. The receiver unwraps in reverse.',
			'',
			'A packet crosses the internet in **hops**. At each router the MAC addresses are rewritten for the next link, but the source and destination IP stay the same. Every router lowers the **TTL** (time to live) by one and drops the packet at zero, which stops routing loops.',
			'',
			'```js',
			"let msg = 'GET /';",
			"msg = '[TCP :443]' + msg;",
			"msg = '[IP 10.0.0.5>93.184.216.34]' + msg;",
			"msg = '[ETH aa:bb>cc:dd]' + msg;",
			'```',
			'',
			'**Common trap:** a MAC address only matters on the local link, an IP address identifies the destination end to end. Mixing them up makes routing and NAT hard to reason about.'
		),
		try: [
			{
				label: 'Wrap and unwrap layers',
				code: `const layers = ['TCP :443', 'IP 10.0.0.5>93.184.216.34', 'ETH aa:bb>cc:dd'];\nlet packet = 'GET /';\nfor (const h of layers) {\n  packet = '[' + h + ']' + packet;\n  console.log(packet);\n}\nconsole.log('--- receiver unwraps ---');\nfor (const h of [...layers].reverse()) {\n  packet = packet.slice(h.length + 2);\n  console.log(packet);\n}`
			},
			{
				label: 'TTL across hops',
				code: `const path = ['home-router', 'isp', 'backbone-1', 'backbone-2', 'datacenter', 'server'];\nlet ttl = 4;\nfor (const hop of path) {\n  if (ttl === 0) {\n    console.log('TTL expired before', hop, '- packet dropped');\n    break;\n  }\n  console.log(hop, 'ttl left:', ttl);\n  ttl -= 1;\n}`
			},
			{
				label: 'MAC changes, IP stays',
				code: `const macs = ['laptop', 'router-A', 'router-B', 'server'];\nconst ip = { src: '10.0.0.5', dst: '93.184.216.34' };\nfor (let i = 0; i < macs.length - 1; i++) {\n  console.log('hop ' + (i + 1) + ': MAC ' + macs[i] + ' -> ' + macs[i + 1] + ' | IP ' + ip.src + ' -> ' + ip.dst);\n}`
			}
		]
	},
	{
		id: 'net-ip-addressing',
		title: 'IP addresses, subnets and NAT',
		level: 'basic',
		summary: 'Read CIDR notation, tell private from public addresses, and understand how NAT shares one address.',
		scenes: ['cs-net-cidr-subnet', 'cs-net-nat'],
		notes: md(
			'An **IPv4** address is 32 bits, written as four bytes: `192.168.1.20`. There are only about 4.3 billion, so **IPv6** (128 bits, written in hex like `2001:db8::1`) exists to fix the shortage.',
			'',
			'**CIDR** notation `192.168.1.0/24` means the first 24 bits are the **network** part and the remaining 8 are for **hosts**. A `/n` block holds 2^(32-n) addresses, and two are reserved (the network address and the broadcast), so a `/24` has 254 usable hosts. A **subnet mask** is the same idea as a bit pattern: AND it with an address to get the network.',
			'',
			'**Private ranges** are not routed on the public internet:',
			'',
			'- `10.0.0.0/8`',
			'- `172.16.0.0/12`',
			'- `192.168.0.0/16`',
			'',
			'`127.0.0.1` (or `::1`) is **localhost**, the machine itself. A **port** (0 to 65535) picks the program on a host.',
			'',
			'**NAT** lets many private devices share one public IP. The router rewrites the source address and port and remembers the mapping so replies find their way back.',
			'',
			'```js',
			'const prefix = 24;',
			'const mask = (~0 << (32 - prefix)) >>> 0; // 255.255.255.0',
			'console.log(2 ** (32 - prefix) - 2);      // 254 usable hosts',
			'```',
			'',
			'**Common trap:** `172.16/12` covers 172.16 to 172.31 only. `172.32.x.x` is a public address.'
		),
		try: [
			{
				label: 'Mask math with bit operations',
				code: `const toInt = (ip) => ip.split('.').reduce((a, o) => ((a << 8) | Number(o)) >>> 0, 0);\nconst toIp = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');\nconst ip = toInt('192.168.1.130');\nconst prefix = 26;\nconst mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;\nconst network = (ip & mask) >>> 0;\nconst broadcast = (network | ~mask) >>> 0;\nconsole.log('mask:', toIp(mask));\nconsole.log('network:', toIp(network));\nconsole.log('broadcast:', toIp(broadcast));\nconsole.log('usable hosts:', 2 ** (32 - prefix) - 2);`
			},
			{
				label: 'Host counts by prefix',
				code: `for (const p of [8, 16, 24, 26, 30]) {\n  console.log('/' + p, '->', 2 ** (32 - p), 'addresses,', 2 ** (32 - p) - 2, 'usable');\n}`
			},
			{
				label: 'Is it a private address?',
				code: `const toInt = (ip) => ip.split('.').reduce((a, o) => ((a << 8) | Number(o)) >>> 0, 0);\nconst ranges = [['10.0.0.0', 8], ['172.16.0.0', 12], ['192.168.0.0', 16], ['127.0.0.0', 8]];\nconst isPrivate = (ip) => ranges.some(([base, p]) => {\n  const m = (~0 << (32 - p)) >>> 0;\n  return ((toInt(ip) & m) >>> 0) === toInt(base);\n});\nfor (const ip of ['10.1.2.3', '172.31.0.9', '172.32.0.9', '192.168.0.1', '8.8.8.8', '127.0.0.1']) {\n  console.log(ip, isPrivate(ip) ? 'private' : 'public');\n}`
			}
		]
	},
	{
		id: 'net-tcp-reliability',
		title: 'TCP: reliability and congestion',
		level: 'mid',
		summary: 'Understand how TCP numbers bytes, resends losses, limits its sending rate and closes a connection.',
		scenes: ['cs-net-tcp-retransmit', 'cs-net-tcp-congestion'],
		notes: md(
			'TCP gives you a reliable, ordered byte stream on top of an unreliable network.',
			'',
			'- **Sequence and ack numbers**: every byte is numbered. The receiver sends **ACKs** saying "I have everything up to here". If an ACK does not arrive in time (or three duplicate ACKs arrive), the sender **retransmits**.',
			'- **Flow control**: the receiver advertises a **receive window**, how much more data it can buffer. The sender never has more unacknowledged data than that, so a slow reader cannot be flooded.',
			'- **Congestion control**: the sender also keeps a **congestion window** (cwnd) to protect the network. It starts small (**slow start**, roughly doubling each round trip), then grows slowly, and shrinks sharply when it detects loss. The effective window is the smaller of the two.',
			'- **Closing**: each side sends a **FIN**. The side that closes first lingers in **TIME_WAIT** (often about a minute) so stray late packets cannot confuse a new connection.',
			'- **Nagle**: small writes are held back and merged until earlier data is acknowledged. Great for efficiency, bad for tiny interactive messages, which is why latency-sensitive code sets `TCP_NODELAY`.',
			'',
			'```js',
			'let cwnd = 1;',
			'for (let rtt = 1; rtt <= 4; rtt++) cwnd *= 2; // slow start',
			'```',
			'',
			'**Common trap:** TCP is reliable, not fast. One lost packet stalls everything behind it until it is resent, and a loss also halves the sending rate.'
		),
		try: [
			{
				label: 'Slow start then congestion avoidance',
				code: `let cwnd = 1;\nconst ssthresh = 16;\nfor (let rtt = 1; rtt <= 9; rtt++) {\n  console.log('RTT', rtt, 'cwnd', cwnd, 'segments');\n  cwnd = cwnd < ssthresh ? Math.min(cwnd * 2, ssthresh) : cwnd + 1;\n}`
			},
			{
				label: 'Cumulative ACKs and a lost segment',
				code: `const sent = [1, 2, 3, 4, 5];\nconst lost = 3;\nconst got = new Set(sent.filter((s) => s !== lost));\nlet ack = 1;\nfor (const s of sent) {\n  if (got.has(s)) {\n    while (got.has(ack)) ack++;\n    console.log('received', s, '-> ACK', ack);\n  } else {\n    console.log('segment', s, 'lost');\n  }\n}\nconsole.log('three duplicate ACKs for 3 trigger a fast retransmit of segment 3');`
			},
			{
				label: 'Window limits throughput',
				code: `const rttMs = 100;\nfor (const windowKB of [16, 64, 256]) {\n  const mbps = (windowKB * 1024 * 8) / (rttMs / 1000) / 1e6;\n  console.log(windowKB + ' KB window at ' + rttMs + ' ms RTT -> max ' + mbps.toFixed(1) + ' Mbit/s');\n}`
			}
		]
	},
	{
		id: 'net-udp-quic',
		title: 'UDP, QUIC and HTTP/3',
		level: 'mid',
		summary: 'Compare UDP with TCP and see why QUIC, built on UDP, makes HTTP/3 faster to start and less blocked.',
		scenes: ['cs-net-udp-vs-tcp', 'cs-net-quic-handshake'],
		notes: md(
			'**UDP** sends independent datagrams: no connection, no ordering, no retransmission, no congestion control. It adds only ports and a checksum. That makes it light and fast, and it suits DNS, live video, voice and games, where a late packet is worthless anyway.',
			'',
			'**QUIC** is a modern transport built **on top of UDP** (so it passes through existing networks) that rebuilds the good parts of TCP and TLS in user space:',
			'',
			'- **Faster setup**: transport and TLS 1.3 handshakes are combined, so a new connection needs one round trip, and a returning client can send data in zero (**0-RTT**, with replay caveats).',
			'- **Independent streams**: a lost packet only stalls the stream it belongs to. Over TCP, one loss blocks every request sharing the connection (**head-of-line blocking**).',
			'- **Connection IDs**: a connection survives a network change, such as Wi-Fi to mobile data, because it is not tied to the IP and port pair.',
			'- Encryption is mandatory.',
			'',
			'**HTTP/3** is simply HTTP carried over QUIC.',
			'',
			'```js',
			'const tcpTls = 1 + 1; // TCP handshake + TLS 1.3, in round trips',
			'const quic = 1;       // combined handshake',
			'```',
			'',
			'**Common trap:** "UDP is unreliable" does not mean QUIC is. QUIC adds its own acknowledgements, retransmission and congestion control on top.'
		),
		try: [
			{
				label: 'Round trips before the first request',
				code: `const rtt = 100;\nconst setups = { 'HTTP/1.1 + TLS 1.3 (TCP)': 2, 'HTTP/3 first visit (QUIC)': 1, 'HTTP/3 returning (0-RTT)': 0 };\nfor (const [name, trips] of Object.entries(setups)) {\n  console.log(name, '->', trips * rtt, 'ms before the request is sent');\n}`
			},
			{
				label: 'Head-of-line blocking, one loss',
				code: `// 3 streams, 3 packets each. Packet "B2" is lost and arrives one round later.\nconst packets = ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3'];\nconst lost = 'B2';\nconst tcpDelivered = [];\nlet blocked = false;\nfor (const p of packets) {\n  if (p === lost) blocked = true;\n  if (!blocked) tcpDelivered.push(p);\n}\nconsole.log('TCP delivers before the retransmit:', tcpDelivered.join(' '));\nconst quicDelivered = packets.filter((p) => !(p[0] === lost[0] && p >= lost));\nconsole.log('QUIC delivers before the retransmit:', quicDelivered.join(' '));`
			}
		]
	},
	{
		id: 'net-http-evolution',
		title: 'HTTP/1.1, HTTP/2 and HTTP/3',
		level: 'mid',
		summary: 'See how HTTP versions changed how requests share a connection, plus methods, status codes and caching.',
		scenes: ['cs-net-http1-hol', 'cs-net-http2-multiplex'],
		notes: md(
			'**HTTP/1.1** is text-based and handles one request at a time per connection. A slow response blocks the ones behind it, so browsers open about six connections per host. Keep-alive reuses a connection for many requests.',
			'',
			'**HTTP/2** is binary and **multiplexes** many requests as interleaved streams over one TCP connection, and compresses headers. It fixes HTTP-level blocking, but a lost TCP packet still stalls every stream. **HTTP/3** moves to QUIC and removes that.',
			'',
			'**Methods** carry meaning. `GET` reads and is safe. `PUT` and `DELETE` are **idempotent** (repeating them has the same effect as doing it once). `POST` is not, so retrying it can create duplicates.',
			'',
			'**Status classes**: `2xx` success, `3xx` redirect, `4xx` client error, `5xx` server error.',
			'',
			'**Caching** is steered by headers: `Cache-Control: max-age=3600` allows reuse for an hour, `no-store` forbids storing, and `no-cache` means "revalidate first" (often with an `ETag`, answered by `304 Not Modified`).',
			'',
			'```js',
			"const status = 404;",
			"const klass = Math.floor(status / 100) + 'xx'; // '4xx'",
			'```',
			'',
			'**Common trap:** `no-cache` does not mean "do not cache". It means "check with the server before reusing". The header to forbid storing is `no-store`.'
		),
		try: [
			{
				label: 'Status class and idempotency',
				code: `const klass = (s) => ({ 1: 'info', 2: 'success', 3: 'redirect', 4: 'client error', 5: 'server error' })[Math.floor(s / 100)];\nfor (const s of [200, 301, 304, 404, 503]) console.log(s, klass(s));\nconst methods = { GET: [true, true], PUT: [false, true], DELETE: [false, true], POST: [false, false] };\nfor (const [m, [safe, idem]] of Object.entries(methods)) {\n  console.log(m, 'safe:', safe, 'idempotent:', idem);\n}`
			},
			{
				label: 'Six connections vs multiplexing',
				code: `const requests = 20;\nconst msEach = 100; // each response takes 100 ms, ignoring bandwidth limits\nconst http1 = Math.ceil(requests / 6) * msEach;\nconst http2 = msEach; // all streams share one connection and run in parallel\nconsole.log('HTTP/1.1 with 6 connections:', http1, 'ms');\nconsole.log('HTTP/2 multiplexed:', http2, 'ms');`
			},
			{
				label: 'Read a Cache-Control header',
				code: `const parse = (h) => Object.fromEntries(h.split(',').map((p) => {\n  const [k, v] = p.trim().split('=');\n  return [k, v === undefined ? true : Number(v)];\n}));\nconsole.log(parse('public, max-age=3600'));\nconsole.log(parse('no-store'));\nconst fresh = (ageSeconds, h) => ageSeconds < (parse(h)['max-age'] ?? 0);\nconsole.log('age 100s fresh?', fresh(100, 'max-age=3600'));\nconsole.log('age 4000s fresh?', fresh(4000, 'max-age=3600'));`
			}
		]
	},
	{
		id: 'net-proxies-lb',
		title: 'Proxies, load balancers and CDNs',
		level: 'mid',
		summary: 'Tell forward from reverse proxies, pick a balancing strategy, and see how a CDN cuts latency.',
		scenes: ['cs-net-reverse-proxy-lb', 'cs-net-cdn-edge'],
		notes: md(
			'A **forward proxy** sits in front of clients and speaks for them (a corporate proxy, a VPN). A **reverse proxy** sits in front of servers and speaks for them: clients talk to it and never see the backends. Nginx and cloud load balancers are reverse proxies.',
			'',
			'A **load balancer** spreads requests over several servers:',
			'',
			'- **L4** balances on IP and port, without reading the traffic. It is fast and protocol-agnostic.',
			'- **L7** reads HTTP, so it can route by path, host or header, terminate TLS and retry.',
			'',
			'**Algorithms**: **round robin** (take turns), **least connections** (pick the least busy), **hashing** (the same client or key always lands on the same server). **Health checks** remove a failing server from rotation. **Sticky sessions** pin a user to one server, which is convenient but makes scaling and failover harder. Keep state in a shared store instead.',
			'',
			'A **CDN** is a fleet of reverse proxies near users that cache your content. The key number is the **cache hit ratio**: hits divided by all requests.',
			'',
			'```js',
			'const servers = ["a", "b", "c"];',
			'let i = 0;',
			'const next = () => servers[i++ % servers.length];',
			'```',
			'',
			'**Common trap:** behind a proxy, the TCP peer address is the proxy. Read the original client IP from `X-Forwarded-For`, and only trust it from your own proxy.'
		),
		try: [
			{
				label: 'Round robin vs least connections',
				code: `const servers = ['a', 'b', 'c'];\nlet i = 0;\nconst roundRobin = () => servers[i++ % servers.length];\nconsole.log('round robin:', [1, 2, 3, 4, 5, 6].map(roundRobin).join(' '));\nconst load = { a: 5, b: 1, c: 3 };\nconst least = () => Object.keys(load).reduce((x, y) => (load[y] < load[x] ? y : x));\nconsole.log('least connections picks:', least());`
			},
			{
				label: 'Hashing keeps a user on one server',
				code: `const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);\nconst servers = ['a', 'b', 'c'];\nfor (const user of ['alice', 'bob', 'carol', 'alice', 'bob']) {\n  console.log(user, '->', servers[hash(user) % servers.length]);\n}`
			},
			{
				label: 'Cache hit ratio and origin load',
				code: `const requests = 10000;\nfor (const ratio of [0.5, 0.9, 0.99]) {\n  const origin = Math.round(requests * (1 - ratio));\n  console.log('hit ratio', ratio, '-> origin serves', origin, 'of', requests);\n}`
			}
		]
	},
	{
		id: 'net-realtime',
		title: 'Real-time: polling, SSE, WebSockets',
		level: 'mid',
		summary: 'Choose between polling, server-sent events and WebSockets, and plan for reconnects and scale.',
		scenes: ['cs-net-polling-vs-ws', 'cs-net-sse-stream'],
		notes: md(
			'HTTP is request and response, so the server cannot speak first. Three common ways to get live updates:',
			'',
			'- **Polling**: the client asks every N seconds. Simple and works everywhere, but wasteful (most replies are "nothing new") and delayed by up to N seconds. **Long polling** holds the request open until there is news.',
			'- **SSE** (Server-Sent Events): one long HTTP response where the server streams text events. One-way (server to client), plain HTTP, and the browser `EventSource` reconnects by itself and resumes using `Last-Event-ID`.',
			'- **WebSocket**: an HTTP upgrade into a persistent two-way channel with small frames. Best for chat, games and collaboration. You handle reconnection, heartbeats and message formats yourself.',
			'',
			'**Pick** the simplest that fits: SSE for feeds, notifications and progress; WebSocket when the client sends a lot too; polling for slow-changing data.',
			'',
			'**Scaling**: every open connection holds memory and a socket on one server, so you need a pub/sub layer (Redis, a broker) to fan messages out across servers. On reconnect, use **exponential backoff with jitter** so thousands of clients do not stampede.',
			'',
			'```js',
			'const delay = (n) => Math.min(30000, 1000 * 2 ** n);',
			'```',
			'',
			'**Common trap:** a connection that looks open can be dead (a sleeping phone, a dropped NAT mapping). Send heartbeats and treat silence as a disconnect.'
		),
		try: [
			{
				label: 'Polling cost',
				code: `const clients = 10000;\nconst everySeconds = 5;\nconst perSecond = clients / everySeconds;\nconsole.log('requests per second:', perSecond);\nconst eventsPerHour = 10;\nconst wastedShare = 1 - eventsPerHour / (3600 / everySeconds);\nconsole.log('polls that find nothing new per client:', (wastedShare * 100).toFixed(1) + '%');`
			},
			{
				label: 'Parse a Server-Sent Events stream',
				code: `const raw = 'id: 1\\nevent: price\\ndata: 101.5\\n\\nid: 2\\ndata: hello\\ndata: world\\n\\n';\nconst events = raw.trim().split('\\n\\n').map((block) => {\n  const e = { event: 'message', data: [] };\n  for (const line of block.split('\\n')) {\n    const i = line.indexOf(':');\n    const k = line.slice(0, i);\n    const v = line.slice(i + 1).trim();\n    if (k === 'data') e.data.push(v);\n    else e[k] = v;\n  }\n  e.data = e.data.join('\\n');\n  return e;\n});\nconsole.log(events);`
			},
			{
				label: 'Reconnect backoff schedule',
				code: `const delay = (attempt) => Math.min(30000, 1000 * 2 ** attempt);\nconsole.log([0, 1, 2, 3, 4, 5, 6].map(delay).join(', '), '(ms, capped at 30000)');\n// Real clients add random jitter so they do not all return at the same moment.\nconst withJitter = (attempt, r) => Math.round(delay(attempt) * (0.5 + r / 2));\nconsole.log('attempt 3 with r=0 and r=1:', withJitter(3, 0), withJitter(3, 1));`
			}
		]
	},
	{
		id: 'net-debugging',
		title: 'Debugging the network',
		level: 'advanced',
		summary: 'Use the standard tools and a latency budget to find where a slow or failing request loses time.',
		scenes: ['cs-net-traceroute', 'cs-net-latency-budget'],
		notes: md(
			'Start by asking which layer is failing, then pick the tool:',
			'',
			'- `ping host`: is it reachable, and what is the round-trip time and packet loss? (Some hosts block ICMP, so no reply is not proof of "down".)',
			'- `traceroute host`: lists each hop by sending packets with increasing TTL. It shows where latency jumps or the path dies.',
			'- `dig example.com`: shows the DNS answer, its TTL, and which resolver replied.',
			'- `curl -v URL`: shows DNS, TCP, TLS and the HTTP headers. `curl -w` with timing variables (`time_namelookup`, `time_connect`, `time_appconnect`, `time_starttransfer`) splits the total into phases.',
			'- `tcpdump` or Wireshark: capture the actual packets when you need proof of what went on the wire.',
			'',
			'**MTU** is the largest packet a link carries, usually 1500 bytes. Bigger packets get fragmented or dropped, which causes odd "small requests work, large ones hang" bugs, especially behind VPNs.',
			'',
			'Know the three limits: **latency** (delay), **bandwidth** (capacity) and **packet loss** (which cripples TCP throughput). Build a **latency budget**: add up DNS, connect, TLS, server time and transfer, and fix the biggest piece.',
			'',
			'```bash',
			'curl -s -o /dev/null -w "dns %{time_namelookup} tls %{time_appconnect} ttfb %{time_starttransfer}\\n" https://example.com',
			'```',
			'',
			'**Common trap:** buying more bandwidth to fix a slow page. For small requests, round trips dominate, so reduce them (reuse connections, cache, move closer) first.'
		),
		try: [
			{
				label: 'A latency budget',
				code: `const phases = { dns: 40, tcp: 30, tls: 30, server: 220, transfer: 60 };\nlet total = 0;\nfor (const [k, v] of Object.entries(phases)) total += v;\nfor (const [k, v] of Object.entries(phases)) {\n  console.log(k.padEnd(9), String(v).padStart(4), 'ms', ((v / total) * 100).toFixed(0) + '%');\n}\nconsole.log('total', total, 'ms');`
			},
			{
				label: 'Latency vs bandwidth',
				code: `const rttMs = 100;\nconst fetchMs = (kb, mbps) => rttMs + (kb * 8) / mbps; // kilobits / (Mbit/s) = ms\nfor (const kb of [2, 500, 20000]) {\n  console.log(kb + ' KB: 10 Mbit/s ->', Math.round(fetchMs(kb, 10)), 'ms,', '100 Mbit/s ->', Math.round(fetchMs(kb, 100)), 'ms');\n}`
			},
			{
				label: 'Packet loss and TCP throughput',
				code: `// Rough Mathis estimate: rate ~ (MSS / RTT) * (1.22 / sqrt(loss))\nconst mss = 1460 * 8; // bits\nconst rtt = 0.05;\nfor (const loss of [0.0001, 0.001, 0.01]) {\n  const mbps = ((mss / rtt) * (1.22 / Math.sqrt(loss))) / 1e6;\n  console.log('loss', (loss * 100).toFixed(2) + '%', '-> about', mbps.toFixed(1), 'Mbit/s');\n}`
			},
			{
				label: 'MTU and packet counts',
				code: `const mtu = 1500;\nconst headers = 40; // IPv4 + TCP headers\nconst payload = mtu - headers;\nfor (const bytes of [500, 1460, 100000]) {\n  console.log(bytes, 'bytes ->', Math.ceil(bytes / payload), 'packet(s)');\n}`
			}
		]
	}
];
