import type { Scene, SceneNode } from '../../types';

/** A thin vertical lifeline for a message diagram (a client or a server). */
const lifeline = (id: string, cx: number, y: number, h: number): SceneNode => ({ id, kind: 'box', x: cx - 2, y, w: 4, h, label: '', visible: true });

/** One bar of the congestion-window chart: value v segments, 12 units tall each, baseline y = 258. */
const BAR_VALUES = [2, 4, 8, 16, 8, 9, 10, 11];
const bar = (i: number, tone: 'accent' | 'neg' | 'warn' | 'neutral'): SceneNode => ({
	id: `b${i + 1}`,
	kind: 'box',
	x: 16 + i * 42,
	y: 258 - 12 * BAR_VALUES[i],
	w: 34,
	h: 12 * BAR_VALUES[i],
	label: '',
	tone
});
const barLabel = (i: number): SceneNode => ({ id: `v${i + 1}`, kind: 'text', x: 33 + i * 42, y: 274, text: String(BAR_VALUES[i]), anchor: 'middle', size: 'sm' });

/** Computer science lessons: the networking series, part 1 (layers, addressing, TCP reliability, UDP and QUIC). */
export const csNet1: Scene[] = [
	// ───────── net-layers ─────────
	{
		id: 'cs-net-encapsulation',
		topic: 'cs',
		group: 'net-layers',
		title: 'Wrapping data in layers',
		blurb: 'What gets added to your HTTP request before it leaves the machine?',
		stage: { w: 360, h: 262 },
		nodes: [
			{ id: 'ts', kind: 'text', x: 85, y: 20, text: 'Sender', anchor: 'middle', size: 'md', visible: true },
			{ id: 'tr', kind: 'text', x: 275, y: 20, text: 'Receiver', anchor: 'middle', size: 'md', visible: true },
			{ id: 'sh', kind: 'box', x: 10, y: 34, w: 150, h: 40, label: 'HTTP data', sub: 'GET /cart' },
			{ id: 'st', kind: 'box', x: 10, y: 90, w: 150, h: 40, label: 'TCP header', sub: 'ports 52100 > 443' },
			{ id: 'si', kind: 'box', x: 10, y: 146, w: 150, h: 40, label: 'IP header', sub: '10.0.0.5 > 203.0.113.7' },
			{ id: 'se', kind: 'box', x: 10, y: 202, w: 150, h: 40, label: 'Ethernet header', sub: 'MAC a1 > b2' },
			{ id: 'wire', kind: 'edge', from: 'se', to: 're', label: 'wire' },
			{ id: 'rh', kind: 'box', x: 200, y: 34, w: 150, h: 40, label: 'HTTP data', sub: 'GET /cart' },
			{ id: 'rt', kind: 'box', x: 200, y: 90, w: 150, h: 40, label: 'TCP header', sub: 'ports 52100 > 443' },
			{ id: 'ri', kind: 'box', x: 200, y: 146, w: 150, h: 40, label: 'IP header', sub: '10.0.0.5 > 203.0.113.7' },
			{ id: 're', kind: 'box', x: 200, y: 202, w: 150, h: 40, label: 'Ethernet header', sub: 'MAC a1 > b2' }
		],
		steps: [
			{ say: 'Your app hands over an HTTP request: just the data, a GET /cart line and headers. Each network layer will wrap it in its own header, like envelopes inside envelopes.', show: ['sh'], focus: ['sh'] },
			{ say: 'TCP adds a header with the source and destination ports, plus sequence numbers. Ports say which program gets the data: 443 is the web server.', show: ['st'], focus: ['st'] },
			{ say: 'IP adds the source and destination addresses. This is what lets routers across the world know where to send it. TCP data plus an IP header is a packet.', show: ['si'], focus: ['si'] },
			{ say: 'Ethernet (or Wi-Fi) adds MAC addresses of the next device on the local link. The finished unit, header plus everything inside, is a frame.', show: ['se'], focus: ['se'] },
			{ say: 'The frame travels the wire. The receiver gets the same stack of headers, outermost first.', show: ['wire', 're', 'ri', 'rt', 'rh'], pulse: ['re'] },
			{ say: 'Ethernet checks the MAC is its own and strips its header, then hands the rest up.', hide: ['re'], focus: ['ri'] },
			{ say: 'IP checks the destination address is this machine, strips its header, and passes the rest up.', hide: ['ri'], focus: ['rt'] },
			{ say: 'TCP uses the port to pick the right program and rebuilds the byte stream. The server sees your plain HTTP request, as if no layers existed.', hide: ['rt'], set: { rh: { tone: 'accent' } }, pulse: ['rh'] }
		]
	},
	{
		id: 'cs-net-packet-journey',
		topic: 'cs',
		group: 'net-layers',
		title: 'A packet crossing the internet',
		blurb: 'What changes, and what stays the same, at every hop?',
		stage: { w: 360, h: 280 },
		nodes: [
			{ id: 'h1', kind: 'box', x: 10, y: 10, w: 110, h: 36, label: 'Laptop', visible: true },
			{ id: 'h2', kind: 'box', x: 10, y: 66, w: 110, h: 36, label: 'Wi-Fi router', visible: true },
			{ id: 'h3', kind: 'box', x: 10, y: 122, w: 110, h: 36, label: 'ISP router', visible: true },
			{ id: 'h4', kind: 'box', x: 10, y: 178, w: 110, h: 36, label: 'Internet router', visible: true },
			{ id: 'h5', kind: 'box', x: 10, y: 234, w: 110, h: 36, label: 'Server', visible: true },
			{ id: 'g1', kind: 'edge', from: 'h1', to: 'h2', visible: true },
			{ id: 'g2', kind: 'edge', from: 'h2', to: 'h3', visible: true },
			{ id: 'g3', kind: 'edge', from: 'h3', to: 'h4', visible: true },
			{ id: 'g4', kind: 'edge', from: 'h4', to: 'h5', visible: true },
			{
				id: 'pk', kind: 'doc', x: 150, y: 70, w: 200, title: 'Packet headers',
				lines: ['src IP  198.51.100.20', 'dst IP  203.0.113.7', 'src MAC aa:01', 'dst MAC bb:01', 'TTL     64'], hl: [2, 3, 4]
			},
			{ id: 'nt', kind: 'text', x: 150, y: 218, w: 200, size: 'sm', text: 'MAC and TTL change at every router. The IP addresses never do.' }
		],
		steps: [
			{ say: 'Your laptop sends a packet to a server far away. The IP header names the final destination; the MAC addresses only name the next device on this link.', show: ['pk'], focus: ['h1'] },
			{ say: 'The Wi-Fi router receives it, lowers TTL (time to live) by 1, and forwards it. It rewrites the MAC addresses for its next link. The IP addresses are untouched.', set: { pk: { lines: ['src IP  198.51.100.20', 'dst IP  203.0.113.7', 'src MAC bb:02', 'dst MAC cc:01', 'TTL     63'], hl: [2, 3, 4] } }, focus: ['h2'] },
			{ say: 'The ISP router does the same: a new pair of MACs for the next link, TTL down to 62. Each router looks only at the destination IP to choose the next hop.', set: { pk: { lines: ['src IP  198.51.100.20', 'dst IP  203.0.113.7', 'src MAC cc:02', 'dst MAC dd:01', 'TTL     62'], hl: [2, 3, 4] } }, focus: ['h3'] },
			{ say: 'Another router, another rewrite: TTL 61. The real internet path is often 10 to 20 hops, and you can list them with traceroute.', set: { pk: { lines: ['src IP  198.51.100.20', 'dst IP  203.0.113.7', 'src MAC dd:02', 'dst MAC ee:01', 'TTL     61'], hl: [2, 3, 4] } }, focus: ['h4'] },
			{ say: 'The last hop delivers it to the server, whose MAC is ee:01. The IP header still holds the same two addresses it left with.', set: { h5: { tone: 'accent' } }, pulse: ['h5'], focus: ['pk'] },
			{ say: 'Why TTL? If a routing mistake made a loop, TTL would reach 0 and a router would drop the packet and send back an error. Without it, packets could circle forever.', set: { pk: { tone: 'neg', lines: ['src IP  198.51.100.20', 'dst IP  203.0.113.7', 'src MAC dd:02', 'dst MAC ee:01', 'TTL     0 = dropped'], hl: [4] } } }
		]
	},

	// ───────── net-ip-addressing ─────────
	{
		id: 'cs-net-cidr-subnet',
		topic: 'cs',
		group: 'net-ip-addressing',
		title: 'Reading 192.168.1.0/24',
		blurb: 'What does the slash number mean, and how do you split a network?',
		stage: { w: 360, h: 340 },
		nodes: [
			{ id: 'tx', kind: 'text', x: 20, y: 22, text: '192.168.1.0/24', size: 'lg', visible: true },
			{
				id: 'd1', kind: 'doc', x: 15, y: 34, w: 330, title: 'In binary', visible: true,
				lines: ['IP   11000000.10101000.00000001.00000000', 'mask 11111111.11111111.11111111.00000000'], hl: [1]
			},
			{ id: 'net', kind: 'box', x: 15, y: 128, w: 218, h: 34, label: 'First 24 bits: network' },
			{ id: 'host', kind: 'box', x: 241, y: 128, w: 104, h: 34, label: 'Last 8: host' },
			{ id: 'c1', kind: 'text', x: 15, y: 186, w: 330, text: '8 host bits give 2^8 = 256 addresses.', size: 'sm' },
			{ id: 'c2', kind: 'text', x: 15, y: 222, w: 330, text: 'The first (.0) names the network and the last (.255) is broadcast, so 254 are usable for hosts.', size: 'sm', tone: 'accent' },
			{ id: 'a1', kind: 'box', x: 15, y: 262, w: 160, h: 46, label: '192.168.1.0/25', sub: '.0 to .127', tone: 'accent' },
			{ id: 'a2', kind: 'box', x: 185, y: 262, w: 160, h: 46, label: '192.168.1.128/25', sub: '.128 to .255', tone: 'accent' },
			{ id: 'c3', kind: 'text', x: 15, y: 328, w: 330, text: '128 addresses and 126 usable hosts in each.', size: 'sm' }
		],
		steps: [
			{ say: 'An address like 192.168.1.0/24 is a network: the address plus a prefix length. /24 says that the first 24 of the 32 bits are fixed.', focus: ['tx'] },
			{ say: 'The mask is that many 1s followed by 0s. Wherever the mask has a 1, the bit is the network part, and the same for every device on it.', set: { d1: { hl: [1] } }, focus: ['d1'] },
			{ say: 'So 24 bits name the network and the remaining 8 name the host, the device inside it.', show: ['net', 'host'], pulse: ['net', 'host'] },
			{ say: 'Eight host bits mean 256 combinations.', show: ['c1'], focus: ['host'] },
			{ say: 'Two are reserved, so a /24 holds 254 devices. A bigger prefix number means a smaller network.', show: ['c2'], focus: ['c2'] },
			{ say: 'Now split it: make the mask one bit longer, /25. Binary mask 11111111.11111111.11111111.10000000 borrows one host bit for the network.', hide: ['net', 'host', 'c1', 'c2'], set: { tx: { text: '192.168.1.0/25' }, d1: { lines: ['IP   11000000.10101000.00000001.00000000', 'mask 11111111.11111111.11111111.10000000'], hl: [1] } } },
			{ say: 'That one bit can be 0 or 1, so the block becomes two subnets: .0 to .127, and .128 to .255. Each keeps 7 host bits.', show: ['a1', 'a2'], pulse: ['a1', 'a2'] },
			{ say: '7 host bits give 128 addresses, minus 2 reserved, so 126 usable hosts per subnet. Subnets separate things like servers and guest Wi-Fi.', show: ['c3'], focus: ['c3'] }
		]
	},
	{
		id: 'cs-net-nat',
		topic: 'cs',
		group: 'net-ip-addressing',
		title: 'NAT: many devices, one IP',
		blurb: 'How do a whole home share a single public address?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'd1', kind: 'box', x: 8, y: 24, w: 104, h: 36, label: 'Phone', sub: '192.168.1.10', visible: true },
			{ id: 'd2', kind: 'box', x: 8, y: 74, w: 104, h: 36, label: 'Laptop', sub: '192.168.1.11', visible: true },
			{ id: 'd3', kind: 'box', x: 8, y: 124, w: 104, h: 36, label: 'Tablet', sub: '192.168.1.12', visible: true },
			{ id: 'rt', kind: 'box', x: 140, y: 64, w: 90, h: 54, label: 'Router (NAT)', sub: '198.51.100.4', visible: true },
			{ id: 'sv', kind: 'box', x: 272, y: 70, w: 80, h: 42, label: 'Server', sub: '203.0.113.7' },
			{ id: 'e1', kind: 'edge', from: 'd1', to: 'rt' },
			{ id: 'e2', kind: 'edge', from: 'd2', to: 'rt' },
			{ id: 'e3', kind: 'edge', from: 'd3', to: 'rt' },
			{ id: 'eo', kind: 'edge', from: 'rt', to: 'sv' },
			{ id: 'er', kind: 'edge', from: 'sv', to: 'rt', tone: 'accent' },
			{ id: 'rb', kind: 'edge', from: 'rt', to: 'd1', tone: 'accent' },
			{ id: 'ein', kind: 'edge', from: 'sv', to: 'rt', tone: 'neg' },
			{
				id: 'nat', kind: 'doc', x: 20, y: 190, w: 320, title: 'NAT table in the router',
				lines: ['192.168.1.10:51000 <-> 198.51.100.4:40001'], hl: []
			},
			{ id: 'tn', kind: 'text', x: 20, y: 318, w: 320, size: 'sm', text: '', visible: true }
		],
		steps: [
			{ say: 'Every device at home has a private address (192.168.x.x). Those are reused in millions of homes and the internet will not route them, so on their own they cannot reach it.', focus: ['d1', 'd2', 'd3'] },
			{ say: 'The phone contacts the server. The router replaces the private source 192.168.1.10:51000 with its public address and a free port, 198.51.100.4:40001, and notes the pair.', show: ['sv', 'e1', 'eo', 'nat'], pulse: ['rt'] },
			{ say: 'The laptop and tablet do the same, each with its own public port. The server sees a single IP with three different ports.', show: ['e2', 'e3'], set: { nat: { lines: ['192.168.1.10:51000 <-> 198.51.100.4:40001', '192.168.1.11:51000 <-> 198.51.100.4:40002', '192.168.1.12:49200 <-> 198.51.100.4:40003'] } }, focus: ['nat'] },
			{ say: 'The server replies to 198.51.100.4:40001. The router looks that port up in its table.', show: ['er'], set: { nat: { hl: [0] } }, focus: ['rt'] },
			{ say: 'The match says it belongs to 192.168.1.10:51000, so the router rewrites the destination and delivers it to the phone.', show: ['rb'], pulse: ['d1'] },
			{ say: 'Now a server tries to connect in first, to 198.51.100.4:8080. No table row matches, the router has nobody to give it to, and the packet is dropped.', hide: ['er', 'rb'], show: ['ein'], set: { rt: { tone: 'neg' }, nat: { hl: [] }, tn: { text: 'no row for port 8080: dropped', tone: 'neg' } } },
			{ say: 'Port forwarding fixes this: you add a permanent row, port 8080 goes to 192.168.1.10:3000. Now inbound connections to that one device work.', set: { rt: { tone: 'accent' }, ein: { tone: 'accent' }, tn: { text: 'forwarded: a row now exists', tone: 'accent' }, nat: { lines: ['192.168.1.10:51000 <-> 198.51.100.4:40001', '192.168.1.11:51000 <-> 198.51.100.4:40002', '192.168.1.12:49200 <-> 198.51.100.4:40003', ':8080 forwards to 192.168.1.10:3000'], hl: [3] } } }
		]
	},

	// ───────── net-tcp-reliability ─────────
	{
		id: 'cs-net-tcp-retransmit',
		topic: 'cs',
		group: 'net-tcp-reliability',
		title: 'TCP resends what is lost',
		blurb: 'How does TCP deliver everything even when packets disappear?',
		stage: { w: 360, h: 290 },
		nodes: [
			{ id: 'cl', kind: 'box', x: 20, y: 8, w: 100, h: 34, label: 'Sender', visible: true },
			{ id: 'sv', kind: 'box', x: 240, y: 8, w: 100, h: 34, label: 'Receiver', visible: true },
			lifeline('lc', 70, 46, 236), lifeline('ls', 290, 46, 236),
			{ id: 'm1', kind: 'edge', from: { x: 72, y: 64 }, to: { x: 288, y: 76 }, label: 'seq 1' },
			{ id: 'm2', kind: 'edge', from: { x: 72, y: 92 }, to: { x: 186, y: 98 }, label: 'seq 2', tone: 'neg', dashed: true },
			{ id: 'x2', kind: 'text', x: 194, y: 102, text: 'lost', size: 'sm', tone: 'neg' },
			{ id: 'm3', kind: 'edge', from: { x: 72, y: 120 }, to: { x: 288, y: 132 }, label: 'seq 3' },
			{ id: 'a1', kind: 'edge', from: { x: 288, y: 150 }, to: { x: 72, y: 162 }, label: 'ACK 2', tone: 'accent' },
			{ id: 'a2', kind: 'edge', from: { x: 288, y: 178 }, to: { x: 72, y: 190 }, label: 'ACK 2 again', tone: 'warn' },
			{ id: 'm4', kind: 'edge', from: { x: 72, y: 208 }, to: { x: 288, y: 220 }, label: 'seq 2 again', tone: 'warn' },
			{ id: 'a3', kind: 'edge', from: { x: 288, y: 238 }, to: { x: 72, y: 250 }, label: 'ACK 4', tone: 'accent' }
		],
		steps: [
			{ say: 'TCP numbers what it sends. Here the sender sends three segments in a row, 1, 2 and 3 (really it numbers bytes, but small numbers are easier to follow).', focus: ['cl'], show: ['m1'], pulse: ['cl'] },
			{ say: 'Segment 2 is sent, but a congested router drops it somewhere on the way. Nobody tells the sender; the packet is simply gone.', show: ['m2', 'x2'] },
			{ say: 'Segment 3 is sent and arrives fine. The receiver now has 1 and 3, but is missing 2.', show: ['m3'], pulse: ['sv'] },
			{ say: 'An ACK means "I have everything up to here, send me this next". After segment 1 the receiver says ACK 2: it expects segment 2 next.', show: ['a1'], pulse: ['cl'] },
			{ say: 'Segment 3 arrives, but 2 is still missing, so the receiver repeats ACK 2. Duplicate ACKs are a hint that something was lost.', show: ['a2'], focus: ['a2'] },
			{ say: 'After about three duplicate ACKs, or a timeout if no ACKs come back at all, the sender resends only segment 2.', show: ['m4'], pulse: ['sv'] },
			{ say: 'Now the receiver has 1, 2 and 3 in order. Its ACK 4 is cumulative: everything before 4 is safe. Your app never saw a gap.', show: ['a3'], set: { sv: { tone: 'accent' } }, pulse: ['cl'] }
		]
	},
	{
		id: 'cs-net-tcp-congestion',
		topic: 'cs',
		group: 'net-tcp-reliability',
		title: 'TCP congestion control',
		blurb: 'How does TCP find out how fast it may send?',
		stage: { w: 360, h: 310 },
		nodes: [
			{ id: 'tt', kind: 'text', x: 16, y: 18, w: 330, size: 'sm', text: 'Congestion window: segments sent per round trip', visible: true },
			{ id: 'ax', kind: 'text', x: 180, y: 298, text: 'one bar per round trip', anchor: 'middle', size: 'sm', visible: true },
			bar(0, 'accent'), bar(1, 'accent'), bar(2, 'accent'), bar(3, 'accent'),
			bar(4, 'warn'), bar(5, 'accent'), bar(6, 'accent'), bar(7, 'accent'),
			barLabel(0), barLabel(1), barLabel(2), barLabel(3), barLabel(4), barLabel(5), barLabel(6), barLabel(7),
			{ id: 'p1', kind: 'text', x: 16, y: 46, w: 118, size: 'sm', text: 'slow start: doubles each round trip', tone: 'accent' },
			{ id: 'ls', kind: 'text', x: 159, y: 60, text: 'loss!', anchor: 'middle', size: 'sm', tone: 'neg' },
			{ id: 'p2', kind: 'text', x: 232, y: 64, w: 120, size: 'sm', text: 'congestion avoidance: +1 each round trip', tone: 'accent' }
		],
		steps: [
			{ say: 'TCP does not know how much the network can carry, and sending too much makes routers drop packets. So it starts with a small congestion window: 2 segments per round trip.', show: ['b1', 'v1'] },
			{ say: 'Each ACK that comes back lets the window grow. In slow start it doubles every round trip: 2, then 4, then 8. The name is ironic, it grows fast.', show: ['b2', 'v2', 'b3', 'v3', 'p1'] },
			{ say: 'One more doubling takes it to 16 segments in flight. Each bar is the amount of data sent in one round trip.', show: ['b4', 'v4'] },
			{ say: 'At 16 the network cannot keep up and a packet is lost. TCP takes loss as a sign of congestion.', set: { b4: { tone: 'neg' } }, show: ['ls'], pulse: ['b4'] },
			{ say: 'TCP cuts the window in half, to 8, and stops doubling. (A full timeout is harsher and drops back to the start.)', show: ['b5', 'v5'], pulse: ['b5'] },
			{ say: 'From here it grows slowly, 9, 10, 11: only one more segment per round trip. This probes for spare capacity without overshooting.', show: ['b6', 'v6', 'b7', 'v7', 'b8', 'v8', 'p2'], set: { b5: { tone: 'accent' } } },
			{ say: 'This is AIMD: additive increase, multiplicative decrease. Repeating it makes a sawtooth, and lets many connections share a link fairly.', set: { tt: { text: 'AIMD: add 1 per round trip, halve on loss', tone: 'accent' } }, focus: ['tt'] }
		]
	},

	// ───────── net-udp-quic ─────────
	{
		id: 'cs-net-udp-vs-tcp',
		topic: 'cs',
		group: 'net-udp-quic',
		title: 'UDP versus TCP',
		blurb: 'Why would anyone pick the protocol that can lose data?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'tl', kind: 'text', x: 86, y: 20, text: 'TCP', anchor: 'middle', size: 'md', visible: true },
			{ id: 'ul', kind: 'text', x: 274, y: 20, text: 'UDP', anchor: 'middle', size: 'md', visible: true },
			{ id: 'tc', kind: 'box', x: 8, y: 22, w: 60, h: 28, label: 'Sender', visible: true },
			{ id: 'tr', kind: 'box', x: 100, y: 22, w: 64, h: 28, label: 'Receiver', visible: true },
			{ id: 'uc', kind: 'box', x: 196, y: 22, w: 60, h: 28, label: 'Sender', visible: true },
			{ id: 'ur', kind: 'box', x: 288, y: 22, w: 64, h: 28, label: 'Receiver', visible: true },
			lifeline('l1', 38, 54, 206), lifeline('l2', 132, 54, 206), lifeline('l3', 226, 54, 206), lifeline('l4', 320, 54, 206),
			{ id: 't1', kind: 'edge', from: { x: 40, y: 66 }, to: { x: 130, y: 74 }, label: 'SYN' },
			{ id: 't2', kind: 'edge', from: { x: 130, y: 84 }, to: { x: 40, y: 92 }, label: 'SYN-ACK', tone: 'accent' },
			{ id: 't3', kind: 'edge', from: { x: 40, y: 104 }, to: { x: 130, y: 112 }, label: 'pkt 1' },
			{ id: 't4', kind: 'edge', from: { x: 40, y: 122 }, to: { x: 88, y: 126 }, label: 'pkt 2', tone: 'neg', dashed: true },
			{ id: 't5', kind: 'edge', from: { x: 40, y: 140 }, to: { x: 130, y: 148 }, label: 'pkt 3' },
			{ id: 'tw', kind: 'text', x: 140, y: 172, w: 80, size: 'sm', text: 'pkt 3 waits for pkt 2', tone: 'warn' },
			{ id: 't6', kind: 'edge', from: { x: 40, y: 200 }, to: { x: 130, y: 208 }, label: 'pkt 2 again', tone: 'warn' },
			{ id: 'u1', kind: 'edge', from: { x: 228, y: 66 }, to: { x: 318, y: 74 }, label: 'pkt 1' },
			{ id: 'u2', kind: 'edge', from: { x: 228, y: 84 }, to: { x: 276, y: 88 }, label: 'pkt 2', tone: 'neg', dashed: true },
			{ id: 'u3', kind: 'edge', from: { x: 228, y: 102 }, to: { x: 318, y: 110 }, label: 'pkt 3' },
			{ id: 'to', kind: 'text', x: 8, y: 262, w: 160, size: 'sm', text: 'All 3 delivered, in order, but late.', tone: 'warn' },
			{ id: 'uo', kind: 'text', x: 196, y: 262, w: 156, size: 'sm', text: 'Pkt 1 and 3 arrive at once. Pkt 2 is skipped.', tone: 'accent' },
			{ id: 'an', kind: 'text', x: 8, y: 306, w: 344, size: 'sm', text: 'A live call: skipping a lost word is better than hearing it 2 seconds late.', tone: 'accent' }
		],
		steps: [
			{ say: 'Same job, two protocols: send three small packets from a sender to a receiver. Think of a voice call or an online game.', focus: ['tc', 'uc'] },
			{ say: 'TCP must connect first. SYN and SYN-ACK cost a full round trip before the first byte of data is sent.', show: ['t1', 't2'], pulse: ['tc'] },
			{ say: 'UDP has no handshake and no connection. It just sends packet 1 straight away, while TCP is still setting up. TCP sends its own packet 1 after.', show: ['u1', 't3'], pulse: ['uc'] },
			{ say: 'Packet 2 gets lost in both cases. UDP does not notice and does not care. TCP will notice, but only later.', show: ['u2', 't4'] },
			{ say: 'Packet 3 arrives. UDP hands it to the app immediately. TCP holds it back, because it must hand data over in order and 2 is missing.', show: ['u3', 't5', 'tw'], pulse: ['ur'] },
			{ say: 'TCP resends packet 2 after a timeout or duplicate ACKs. Everything after the gap waited for it: this is head-of-line blocking.', show: ['t6'], hide: ['tw'], pulse: ['tr'] },
			{ say: 'TCP delivered everything, perfectly ordered, but late. UDP delivered what it could, on time, and left any repair to the app.', show: ['to', 'uo'] },
			{ say: 'So pick UDP for live things such as calls, games and video, where fresh beats complete. Pick TCP when every byte matters, like a web page or a file.', show: ['an'], focus: ['an'] }
		]
	},
	{
		id: 'cs-net-quic-handshake',
		topic: 'cs',
		group: 'net-udp-quic',
		title: 'HTTP/3 and QUIC',
		blurb: 'How does QUIC connect faster and survive a switch from Wi-Fi to mobile data?',
		stage: { w: 360, h: 300 },
		nodes: [
			{ id: 'tl', kind: 'text', x: 86, y: 20, text: 'TCP + TLS 1.3', anchor: 'middle', size: 'md' },
			{ id: 'ql', kind: 'text', x: 274, y: 20, text: 'QUIC (HTTP/3)', anchor: 'middle', size: 'md' },
			{ id: 'tc', kind: 'box', x: 8, y: 22, w: 60, h: 28, label: 'Client' },
			{ id: 'ts', kind: 'box', x: 100, y: 22, w: 64, h: 28, label: 'Server' },
			{ id: 'qc', kind: 'box', x: 196, y: 22, w: 60, h: 28, label: 'Client' },
			{ id: 'qs', kind: 'box', x: 288, y: 22, w: 64, h: 28, label: 'Server' },
			{ ...lifeline('l1', 38, 54, 170), visible: false },
			{ ...lifeline('l2', 132, 54, 170), visible: false },
			{ ...lifeline('l3', 226, 54, 170), visible: false },
			{ ...lifeline('l4', 320, 54, 170), visible: false },
			{ id: 'a1', kind: 'edge', from: { x: 40, y: 66 }, to: { x: 130, y: 74 }, label: 'SYN' },
			{ id: 'a2', kind: 'edge', from: { x: 130, y: 84 }, to: { x: 40, y: 92 }, label: 'SYN-ACK', tone: 'accent' },
			{ id: 'a3', kind: 'edge', from: { x: 40, y: 108 }, to: { x: 130, y: 116 }, label: 'ClientHello' },
			{ id: 'a4', kind: 'edge', from: { x: 130, y: 126 }, to: { x: 40, y: 134 }, label: 'ServerHello', tone: 'accent' },
			{ id: 'a5', kind: 'edge', from: { x: 40, y: 150 }, to: { x: 130, y: 158 }, label: 'request', tone: 'warn' },
			{ id: 'tn', kind: 'text', x: 8, y: 196, w: 158, size: 'sm', text: '2 round trips before the request (3 with TLS 1.2).', tone: 'warn' },
			{ id: 'q1', kind: 'edge', from: { x: 228, y: 66 }, to: { x: 318, y: 74 }, label: 'Initial' },
			{ id: 'q2', kind: 'edge', from: { x: 318, y: 84 }, to: { x: 228, y: 92 }, label: 'Handshake', tone: 'accent' },
			{ id: 'q3', kind: 'edge', from: { x: 228, y: 108 }, to: { x: 318, y: 116 }, label: 'request', tone: 'accent' },
			{ id: 'qn', kind: 'text', x: 196, y: 196, w: 156, size: 'sm', text: '1 round trip: connect and encrypt together.', tone: 'accent' },
			{ id: 'z1', kind: 'edge', from: { x: 228, y: 66 }, to: { x: 318, y: 74 }, label: '0-RTT GET', tone: 'accent' },
			{ id: 'z2', kind: 'edge', from: { x: 318, y: 84 }, to: { x: 228, y: 92 }, label: 'response', tone: 'accent' },
			{ id: 'zn', kind: 'text', x: 196, y: 196, w: 156, size: 'sm', text: '0 round trips: the request rides in the first packet.', tone: 'accent' },
			{ id: 'ph', kind: 'box', x: 15, y: 130, w: 80, h: 44, label: 'Phone' },
			{ id: 'wf', kind: 'box', x: 140, y: 44, w: 90, h: 38, label: 'Wi-Fi', sub: '192.168.1.10' },
			{ id: 'md', kind: 'box', x: 140, y: 226, w: 90, h: 38, label: 'Mobile data', sub: '100.64.3.9' },
			{ id: 'sv', kind: 'box', x: 270, y: 130, w: 80, h: 44, label: 'Server' },
			{ id: 'cb', kind: 'box', x: 135, y: 128, w: 100, h: 48, label: 'Connection ID', sub: '7f3a', tone: 'accent' },
			{ id: 'w1', kind: 'edge', from: 'ph', to: 'wf' },
			{ id: 'w2', kind: 'edge', from: 'wf', to: 'sv' },
			{ id: 'm1', kind: 'edge', from: 'ph', to: 'md', tone: 'accent' },
			{ id: 'm2', kind: 'edge', from: 'md', to: 'sv', tone: 'accent' },
			{ id: 'mn', kind: 'text', x: 20, y: 286, w: 320, size: 'sm', text: 'A download over HTTP/3 keeps going.', tone: 'accent' }
		],
		steps: [
			{ say: 'HTTP/3 runs on QUIC, a newer transport built on UDP. QUIC adds its own reliability and encryption, so one protocol does the job of TCP plus TLS.', show: ['tl', 'ql', 'tc', 'ts', 'qc', 'qs', 'l1', 'l2', 'l3', 'l4'] },
			{ say: 'Old way: TCP connects first (SYN, SYN-ACK: one round trip), then TLS runs its own handshake (ClientHello, ServerHello: a second round trip).', show: ['a1', 'a2', 'a3', 'a4'], pulse: ['tc'] },
			{ say: 'Only now can the browser send its request. That is two round trips of pure setup, three with the older TLS 1.2. On a slow mobile link each one is noticeable.', show: ['a5', 'tn'], focus: ['tn'] },
			{ say: 'QUIC combines the two: the very first exchange carries connection setup and TLS keys together. After one round trip the request can go out.', show: ['q1', 'q2', 'q3', 'qn'], pulse: ['qc'] },
			{ say: 'On a repeat visit the client remembers keys from last time. 0-RTT sends the request in its very first packet. It is replayable, so only for safe requests such as GET.', hide: ['q1', 'q2', 'q3', 'qn'], show: ['z1', 'z2', 'zn'], pulse: ['qc'] },
			{ say: 'Now a phone on Wi-Fi. A TCP connection is identified by the IP addresses and ports, so changing network breaks it. QUIC tags packets with a connection ID instead.', hide: ['tl', 'ql', 'tc', 'ts', 'qc', 'qs', 'l1', 'l2', 'l3', 'l4', 'a1', 'a2', 'a3', 'a4', 'a5', 'tn', 'z1', 'z2', 'zn'], show: ['ph', 'wf', 'sv', 'cb', 'w1', 'w2'] },
			{ say: 'You walk out of range: Wi-Fi drops, and the phone gets a new IP address on mobile data.', set: { wf: { tone: 'neg' } }, hide: ['w1', 'w2'], show: ['md', 'm1'] },
			{ say: 'The phone keeps sending the same connection ID, so the server recognises the connection. No new handshake, the download continues. That is connection migration.', show: ['m2', 'mn'], pulse: ['cb'] }
		]
	}
];
