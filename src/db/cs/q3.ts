import { builder } from '../../quiz/types';

// Computer science quiz bank, part 3: networking deep dive (layers, IP, TCP, UDP/QUIC, HTTP, proxies, realtime, debugging).
const t = (topic: string) => builder('CS', topic);

// ───────────────────────── net-layers ─────────────────────────
const nl = t('net-layers');

nl.add('basic', 'layer-roles',
	"In the TCP/IP model, which layer is responsible for getting a packet across many networks from the source host to the destination host?",
	"The internet (IP) layer, which addresses packets and routers forward hop by hop",
	["The transport layer, which picks the route through the routers on the way",
	 "The link layer, which carries the packet end to end between the two hosts",
	 "The application layer, which decides which cables the packet uses"],
	"The IP layer gives every packet a source and destination address and routers use it to forward the packet one hop at a time. The transport layer (TCP/UDP) only runs on the two end hosts and deals with ports, reliability and ordering. The link layer moves a frame across one local hop only, and the application layer defines the message format, not the path.");

nl.add('basic', 'encapsulation',
	"What does encapsulation mean when an HTTP request is sent over a network?",
	"Each layer wraps the data from the layer above with its own header, so the request ends up inside a TCP segment, inside an IP packet, inside a frame",
	["The request is compressed so that it fits into a single packet",
	 "The request is encrypted once by the application and the lower layers pass it along unchanged",
	 "Each layer copies the request and sends it separately so that at least one copy arrives"],
	"Going down the stack, every layer adds a header (ports for TCP, addresses for IP, MAC addresses for Ethernet) around the payload it received. The receiver peels the headers off in reverse order. Wrapping is not compression, it is not encryption (TLS is a separate step), and layers do not send duplicate copies.");

nl.add('basic', 'protocol-placement',
	"Which pairing of protocol and layer is correct?",
	"HTTP is an application layer protocol, TCP is a transport layer protocol, and IP is an internet layer protocol",
	["HTTP is a transport layer protocol, because it moves data between client and server",
	 "TCP is an internet layer protocol, because it makes sure packets reach the right host",
	 "IP is an application layer protocol, because it is visible to every program"],
	"HTTP defines requests and responses, so it is an application protocol. TCP provides ordered, reliable byte streams between ports, which is the transport job. IP only addresses and forwards packets and gives no reliability. Reaching the right host is IP's work, and reaching the right program on that host is the job of the port numbers in TCP or UDP.");

nl.add('basic', 'ports',
	"Two browser tabs connect to the same server on port 443 from the same laptop. How does the laptop tell the replies apart?",
	"Each connection uses a different local (ephemeral) port, so the full source and destination address and port combination is unique",
	["The replies are told apart by the order in which they arrive",
	 "Each tab gets its own IP address from the router",
	 "The server's port number changes for every connection"],
	"A connection is identified by source IP, source port, destination IP and destination port. The operating system picks a different ephemeral source port per connection, so replies addressed to different local ports go to different sockets. The tabs share one IP, and the server keeps listening on 443, so neither of those can be the distinguishing factor.");

nl.add('mid', 'switch-vs-router',
	"What is the practical difference between a switch and a router?",
	"A switch forwards frames inside one network using MAC addresses, while a router forwards packets between networks using IP addresses",
	["A switch forwards packets between different networks, and a router only repeats signals within one network",
	 "A router works with MAC addresses and a switch works with ports in the URL",
	 "A switch can only connect two devices and a router connects any number of them"],
	"A switch learns which MAC address sits behind which port and forwards Ethernet frames within one LAN. A router has an interface in each network, looks at the destination IP address and chooses the next hop, which is how traffic leaves your LAN. Both can connect many devices, and neither looks at URLs.");

nl.add('mid', 'hop-addresses',
	"A packet travels from your laptop through three routers to a server. Which addresses change at each hop?",
	"The source and destination MAC addresses change at every hop, while the source and destination IP addresses stay the same",
	["The IP addresses change at every hop, while the MAC addresses stay the same from end to end",
	 "Nothing changes, because the header is built once and stays untouched until the destination",
	 "Both the MAC and IP addresses change at every hop, so that each router can verify the sender"],
	"MAC addresses only matter on one link, so each router builds a new frame with its own MAC as the source and the next hop's MAC as the destination. The IP header keeps the original endpoints so that every router can decide where to send the packet (only the TTL is decremented and the checksum updated). NAT would rewrite IPs, but that is a separate device, not normal forwarding.");

nl.add('mid', 'arp',
	"Your host knows the IP address of a device on the same LAN but needs to send it an Ethernet frame. What fills the gap?",
	"ARP, which broadcasts a question asking who owns that IP and learns the matching MAC address from the reply",
	["DNS, which converts the IP address into a MAC address",
	 "The router, which is always asked first to look up the MAC address from its routing table",
	 "DHCP, which sends the MAC address of every neighbour when the host joins"],
	"Ethernet delivers frames by MAC address, so the sender uses ARP: a broadcast 'who has 192.168.1.20?' answered by the owner with its MAC, then cached for a while. DNS maps names to IPs, not IPs to MACs. A routing table holds networks and next hops, and DHCP hands out configuration to the joining host, not neighbour MACs.");

nl.add('advanced', 'nat-layering',
	"A NAT gateway rewrites the source IP address and the source port of outgoing packets. Why does it have to track a table of connections?",
	"So that replies arriving at the shared public IP and port can be translated back to the right private host and port",
	["So that it can encrypt each connection separately before it leaves the private network",
	 "So that it can retransmit lost packets on behalf of the private hosts",
	 "So that it can reuse the same public port for all hosts and tell them apart by their MAC addresses"],
	"Many private hosts share one public IP, so the gateway gives each flow a distinct public source port and remembers the mapping. An inbound reply is matched to that entry and rewritten back. It needs per-flow state, which is also why unsolicited inbound traffic is dropped by default. NAT does not encrypt or retransmit, and MAC addresses never cross a router, so they cannot be used to tell hosts apart.");

nl.add('advanced', 'layer-isolation',
	"From your laptop, ping to a server's IP works, but curl to https://example.com hangs. Which approach best narrows down the problem?",
	"Walk up the layers: check that the name resolves, that a TCP connection to port 443 opens, then that the TLS handshake and the HTTP response complete",
	["Reinstall the browser, because ping working proves that the network is healthy",
	 "Run ping with a larger packet size, because the server must be rejecting small packets",
	 "Replace the server's IP address, because IP addresses cannot be reached partially"],
	"A successful ping only shows that ICMP gets through at the IP layer. Higher layers can fail separately: DNS may return a different address, a firewall may drop port 443, TLS may fail, or the application may not answer. Testing each layer in order, for example with dig, nc -vz host 443 and curl -v, finds the first one that breaks. Reinstalling or changing addresses is guessing.");

// ───────────────────────── net-ip-addressing ─────────────────────────
const ip = t('net-ip-addressing');

ip.add('basic', 'cidr-size',
	"How many addresses does a /24 IPv4 network contain, and how many can be assigned to hosts?",
	"256 addresses in total, 254 usable because the network and broadcast addresses are reserved",
	["254 addresses in total, 252 usable because the gateway and DNS take two",
	 "255 addresses in total, 253 usable because the router takes one",
	 "256 addresses in total, all 256 usable because the broadcast address is optional"],
	"A /24 leaves 32 - 24 = 8 host bits, so 2^8 = 256 addresses. The first (all host bits 0) names the network and the last (all host bits 1) is the broadcast address, which leaves 254 for hosts. The gateway is one of those 254, not an extra reservation.");

ip.add('basic', 'private-ranges',
	"Which of these is a private (RFC 1918) IPv4 address?",
	"172.20.4.9",
	["172.32.4.9", "192.169.1.10", "11.0.0.5"],
	"The private ranges are 10.0.0.0/8, 172.16.0.0/12 (172.16.0.0 to 172.31.255.255) and 192.168.0.0/16. 172.20.4.9 sits inside the middle range. 172.32.x.x is just past it, 192.169.x.x is outside 192.168.0.0/16, and 11.0.0.5 is an ordinary public address.");

ip.add('basic', 'loopback',
	"What does connecting to 127.0.0.1 do?",
	"It reaches the same machine through the loopback interface, without sending anything onto the network",
	["It reaches the default gateway of the local network",
	 "It reaches every device on the local network at once",
	 "It reaches the first server found by DNS for the local domain"],
	"127.0.0.0/8 is reserved for loopback: the operating system hands the packet straight back to local software, so it never leaves the machine. That is why a dev server bound to 127.0.0.1 cannot be reached from another computer. Reaching all devices is broadcast, and the gateway has its own LAN address.");

ip.add('basic', 'link-local',
	"A laptop shows the address 169.254.37.12 and cannot reach the internet. What most likely happened?",
	"It could not get an address from a DHCP server, so it gave itself a link-local address",
	["The router assigned it a public address that is blocked by the provider",
	 "The laptop is connected through a VPN that always uses this range",
	 "DNS failed to resolve the name of the laptop"],
	"169.254.0.0/16 is the link-local range that hosts auto-assign when no DHCP answer arrives. It only works for talking to neighbours on the same link, and no gateway is configured, so the internet is unreachable. The fix is to restore DHCP, for example by checking the router or cable. It is not a public address, and DNS is not involved in addressing the host.");

ip.add('mid', 'subnet-math',
	"A host has the address 10.0.0.77/26. What are the network address and the broadcast address of its subnet?",
	"Network 10.0.0.64 and broadcast 10.0.0.127",
	["Network 10.0.0.0 and broadcast 10.0.0.255",
	 "Network 10.0.0.76 and broadcast 10.0.0.79",
	 "Network 10.0.0.77 and broadcast 10.0.0.126"],
	"A /26 leaves 6 host bits, so blocks are 64 addresses long: 0 to 63, 64 to 127, 128 to 191 and so on. 77 falls in the block starting at 64, so the network address is 10.0.0.64 and the last address, the broadcast, is 10.0.0.127. The 0 to 255 answer would be a /24, and a host address is never its own network address.");

ip.add('mid', 'default-gateway',
	"A host at 192.168.1.20/24 sends a packet to 8.8.8.8. What does it do?",
	"It sees that the destination is outside its subnet and sends the frame to its default gateway for forwarding",
	["It broadcasts the packet to the whole subnet and waits for the owner of 8.8.8.8 to answer",
	 "It asks DNS which router to use for 8.8.8.8",
	 "It sends the packet directly to 8.8.8.8 using ARP to find the MAC address of that server"],
	"The host compares the destination with its own network and mask. 8.8.8.8 is not in 192.168.1.0/24, so it ARPs for the gateway's MAC and sends the frame there, with the destination IP still 8.8.8.8. ARP only works for addresses on the local link, and DNS maps names, not routes.");

ip.add('mid', 'cidr-sizing',
	"A team needs at least 3,000 host addresses in one network. What is the smallest CIDR block that works?",
	"/20, which has 4,096 addresses",
	["/21, which has 2,048 addresses", "/22, which has 1,024 addresses", "/19, which has 4,096 addresses"],
	"Each bit taken from the prefix doubles the size: /24 is 256, /23 is 512, /22 is 1,024, /21 is 2,048 and /20 is 4,096. 2,048 is too small for 3,000 hosts, so /20 is the smallest that fits. /19 would hold 8,192 addresses, so the figure attached to it in the last option is also wrong.");

ip.add('advanced', 'longest-prefix',
	"A router has two routes: 10.0.0.0/8 via router A and 10.1.0.0/16 via router B. Where does a packet for 10.1.2.3 go?",
	"To router B, because the most specific matching prefix wins",
	["To router A, because the route with the shorter prefix is checked first and applies to larger traffic",
	 "To whichever router was added to the table first",
	 "It is split between A and B, because both routes match"],
	"Routers use longest prefix match: among all routes containing the destination, the one with the most prefix bits is chosen, because it describes the destination most precisely. 10.1.2.3 is in both, and /16 is longer than /8. Insertion order does not decide, and a single packet is never split across routes (load balancing happens only between equal-cost routes).");

ip.add('advanced', 'overlapping-cidr',
	"Two private networks that both use 10.0.0.0/16 need to be connected with a VPN or peering link. Why is this a problem?",
	"The same address exists on both sides, so routers cannot tell which network a destination such as 10.0.5.9 refers to",
	["Private ranges cannot cross a VPN, so the connection is impossible by definition",
	 "The VPN would need to encrypt each address twice, which breaks the headers",
	 "DHCP would give the same address to every device in both networks"],
	"A route table needs a destination prefix to point to exactly one place. With both sides claiming 10.0.0.0/16 the prefix is ambiguous, and traffic for it stays local rather than crossing the link. Practical fixes are renumbering one side or translating addresses with NAT. Private ranges are routed over VPNs all the time, and DHCP is per network, so duplicates between networks only matter when they must talk to each other.");

// ───────────────────────── net-tcp-reliability ─────────────────────────
const tr = t('net-tcp-reliability');

tr.add('basic', 'ack',
	"How does TCP know that data sent to the receiver has arrived?",
	"The receiver sends acknowledgements stating the next byte number it expects, and the sender tracks them",
	["The network layer reports every dropped packet back to the sender immediately",
	 "The sender assumes delivery once the data has left its network card",
	 "The receiver sends back a copy of every packet so that the sender can compare them"],
	"TCP numbers every byte. An acknowledgement carries the next sequence number the receiver expects, which cumulatively confirms everything before it. Handing data to the NIC proves nothing about delivery, IP itself reports no loss, and echoing full copies would double the traffic for no benefit.");

tr.add('basic', 'retransmission',
	"A TCP segment is lost on the way. How does the sender recover?",
	"It retransmits the segment, after a timeout or after receiving several duplicate acknowledgements for the same byte",
	["It gives up on the segment and the application sees a gap in the data",
	 "It waits for the receiver to send a separate request containing the lost data",
	 "It sends all later segments again from the start of the connection"],
	"TCP keeps unacknowledged data and resends it. A retransmission timer covers the general case, and three duplicate ACKs (the receiver repeating 'I still need byte X' as later segments arrive) trigger a faster resend. Applications never see gaps, the receiver does not pull data, and only the missing part is resent, not the whole connection.");

tr.add('basic', 'flow-vs-congestion',
	"What is the difference between TCP flow control and congestion control?",
	"Flow control protects the receiver from being overwhelmed, while congestion control protects the network between the two hosts",
	["Flow control protects the network, while congestion control protects the receiver's buffer",
	 "Flow control applies only to downloads and congestion control only to uploads",
	 "They are two names for the same window, and the sender uses the larger of the two"],
	"Flow control uses the receive window advertised by the receiver: how many more bytes it can buffer. Congestion control uses the sender's own congestion window, grown and shrunk based on signs of loss or delay in the path. The sender may have in flight at most the smaller of the two. Both apply to either direction.");

tr.add('mid', 'zero-window',
	"A receiver's application is slow to read, so its buffer fills up and it advertises a window of 0. What does the sender do?",
	"It stops sending data and periodically probes until the receiver advertises space again",
	["It keeps sending at the same rate, and the receiver drops the excess",
	 "It closes the connection, because a zero window means a protocol error",
	 "It switches to UDP so that the data is not blocked"],
	"The window tells the sender how many bytes may still be sent. At zero it must pause, and it sends small window probes so that it learns when the receiver has drained its buffer, even if the update packet was lost. This is flow control working as intended, not an error, and TCP never switches protocols.");

tr.add('mid', 'slow-start',
	"What does TCP slow start do at the beginning of a connection?",
	"It begins with a small congestion window and roughly doubles it each round trip until loss or a threshold is reached",
	["It sends at the full link rate straight away and slows down only when the receiver complains",
	 "It waits a fixed number of seconds before it sends any data",
	 "It sends one byte at a time for the whole life of the connection"],
	"The sender does not know the capacity of the path, so it starts with a few segments and grows the window exponentially, since each ACK lets it send more. After reaching a threshold or seeing loss it switches to slower, linear growth and cuts the window on loss. This is why short transfers rarely reach full speed.");

tr.add('mid', 'time-wait',
	"A client program opens and closes tens of thousands of short connections per second to one server and starts failing to connect. netstat shows a huge number of sockets in TIME_WAIT. What is the cause?",
	"The side that closes first keeps each closed connection in TIME_WAIT for a while, so the pool of local ports can run out",
	["TIME_WAIT sockets are leaked, and the server never answers the closing handshake",
	 "The server's firewall blocks sockets that are waiting, so they pile up",
	 "TIME_WAIT means the data is still being sent, so the connections are not actually closed"],
	"After an active close, TCP holds the 4-tuple for about two minutes so that delayed packets from the old connection cannot be mistaken for a new one. Each held connection occupies a local ephemeral port, and with one destination the supply of ports is limited. The usual fix is to reuse connections with keep-alive or pooling. The sockets are not leaks, and they are in a normal part of closing.");

tr.add('mid', 'nagle-delayed-ack',
	"A request/response protocol sends a small header and then a small body in two writes, and every call takes an extra ~40 ms. Which explanation and fix match?",
	"Nagle's algorithm holds the second small write until the first is acknowledged while the peer delays its ACK, so enable TCP_NODELAY or send the message in one write",
	["The receiver's window is too small, so increase the SO_RCVBUF size to several megabytes",
	 "The congestion window is stuck at slow start, so restart the connection for every request",
	 "DNS resolves slowly on every write, so cache the address of the server"],
	"Nagle's algorithm avoids small packets by waiting for an ACK before sending more tiny data, and the receiver's delayed ACK may wait about 40 ms for data to piggy-back on. The two together stall the second write. Disabling Nagle with TCP_NODELAY or coalescing writes removes the stall. Window size, slow start and DNS would not produce a constant 40 ms.");

tr.add('advanced', 'bdp',
	"A transfer runs over a 100 Mbit/s link with an 80 ms round-trip time, and the sender's effective window is capped at 64 KB. Roughly what throughput is possible, and what window would fill the link?",
	"About 6.5 Mbit/s, and a window of about 1 MB (the bandwidth-delay product)",
	["About 100 Mbit/s, because the link is the only limit and the window is irrelevant",
	 "About 0.8 Mbit/s, and a window of about 10 KB",
	 "About 65 Mbit/s, and a window of about 100 KB"],
	"A sender can have at most one window of data in flight per round trip, so throughput is window / RTT = 65,535 bytes x 8 / 0.08 s, about 6.5 Mbit/s. To keep the pipe full you need bandwidth x delay = 12.5 MB/s x 0.08 s = 1 MB in flight. That is why window scaling matters on high-latency paths, and why a fast link does not give a fast single connection by itself.");

tr.add('advanced', 'syn-flood',
	"What is a SYN flood and how do SYN cookies help?",
	"Attackers send many SYNs and never finish the handshake to fill the server's half-open queue, and cookies let the server encode the state in the SYN-ACK sequence number instead of storing it",
	["Attackers send many complete requests to overload the application, and cookies rate-limit each browser session",
	 "Attackers send corrupted SYN packets that crash the TCP stack, and cookies add a checksum to detect them",
	 "Attackers replay old SYN packets to hijack connections, and cookies encrypt the payload"],
	"Each SYN makes the server allocate state and wait for the final ACK of the handshake. Spoofed SYNs that never complete exhaust that memory. With SYN cookies the server keeps nothing: it derives the initial sequence number from a hash of the connection details, and only builds a real connection when a valid ACK echoes it back. The other options describe application floods, malformed packets or replay, which are different attacks.");

// ───────────────────────── net-udp-quic ─────────────────────────
const uq = t('net-udp-quic');

uq.add('basic', 'udp-nature',
	"What is true about sending a message over UDP?",
	"No connection is set up, and the message may be lost, duplicated or reordered without UDP telling anyone",
	["It is retried automatically until the receiver acknowledges it",
	 "It is split into a byte stream and delivered in order to the receiver",
	 "It is encrypted by default, so intermediate routers cannot read it"],
	"UDP adds only ports, a length and a checksum to IP. There is no handshake, no acknowledgements, no retransmission and no ordering, so each datagram stands alone. Reliability, if wanted, must be built by the application. Encryption is not part of UDP either, though protocols such as DTLS and QUIC add it on top.");

uq.add('basic', 'udp-use-cases',
	"Why do DNS queries and live game traffic typically use UDP?",
	"A small request and response fits one datagram, and waiting for retransmission of an old message is often worse than skipping it",
	["UDP is the only protocol that can cross a firewall",
	 "UDP guarantees that every packet arrives in order, which a game needs",
	 "UDP traffic is automatically encrypted, which keeps queries private"],
	"For a DNS lookup a handshake would cost more than the data itself, and a lost query is simply asked again. In a game or call, a stale position or audio frame is useless by the time a retransmission arrives, so skipping it beats delaying everything. UDP offers none of ordering, guaranteed delivery or encryption.");

uq.add('basic', 'udp-header',
	"Which fields make up the UDP header?",
	"Source port, destination port, length and checksum, 8 bytes in total",
	["Source port, destination port, sequence number and acknowledgement number",
	 "Source address, destination address, TTL and protocol",
	 "Connection id, window size, urgent pointer and options"],
	"UDP is deliberately minimal: two 16-bit ports, a 16-bit length and a 16-bit checksum give 8 bytes. Sequence and acknowledgement numbers and window size belong to TCP. Addresses and TTL are in the IP header, and a connection id is something QUIC adds inside its own UDP payload.");

uq.add('mid', 'why-udp-for-quic',
	"Why is QUIC built on top of UDP instead of being a new transport protocol next to TCP?",
	"Routers, NATs and firewalls already pass UDP, but would drop unknown protocols, and QUIC can be updated in user space without waiting for operating systems",
	["UDP is faster than any protocol because it skips encryption",
	 "TCP cannot carry encrypted traffic, so another protocol was needed",
	 "UDP provides the stream ordering that QUIC needs, so QUIC only adds compression"],
	"Middleboxes in the internet block or mangle protocols they do not know, which made new transport protocols nearly undeployable. A UDP payload gets through, and QUIC implements reliability, congestion control and encryption itself, in libraries that ship with applications. TCP carries TLS traffic perfectly well, and UDP offers no ordering at all.");

uq.add('mid', 'quic-handshake',
	"How does the connection setup of HTTP/3 over QUIC compare with HTTP/2 over TCP and TLS 1.3?",
	"QUIC combines the transport and TLS handshakes, so a new connection needs one round trip instead of two, and a resumed one can send data immediately (0-RTT)",
	["QUIC skips the encryption handshake completely, so the data is sent in the clear",
	 "QUIC needs three round trips because it performs a TCP handshake first and then adds its own",
	 "QUIC always needs the same number of round trips, because the handshake is defined by TLS alone"],
	"With TCP the three-way handshake finishes first (1 RTT) and then TLS 1.3 needs another (1 RTT). QUIC folds the cryptographic handshake into its own, so the first request can go after one round trip, and a client that has talked to the server before may send application data in its first flight. QUIC is always encrypted and never uses a TCP handshake.");

uq.add('mid', 'connection-migration',
	"A phone is downloading a file over HTTP/3 and moves from Wi-Fi to mobile data, so its IP address changes. What happens to the connection?",
	"It can continue, because QUIC identifies the connection by a connection id and not by the IP and port 4-tuple",
	["It always breaks and must be restarted, the same as TCP",
	 "It continues only if the new network gives the phone the same IP address",
	 "It continues because QUIC sends every packet through both networks at once"],
	"A TCP connection is the 4-tuple of addresses and ports, so a new address means a new connection. QUIC packets carry a connection id inside the encrypted header, so the server can keep matching them to the same session after the client path changes, after validating the new path. It does not need the same address, and it does not duplicate traffic over both networks.");

uq.add('mid', 'stream-independence',
	"On a lossy network, how does HTTP/3 deal better than HTTP/2 with a packet that carries data for one of many parallel requests?",
	"Streams are independent in QUIC, so the loss delays only the stream that lost data while other streams keep delivering",
	["QUIC never loses packets, because UDP delivery is acknowledged by the network",
	 "QUIC resends the lost packet over TCP so that it is guaranteed to arrive",
	 "QUIC sends every packet twice, so a lost one is always covered"],
	"HTTP/2 multiplexes streams over one TCP byte stream, so the kernel holds back everything after a lost segment until it is resent. QUIC does loss recovery per stream and delivers later data of unaffected streams right away. Packets can still be lost, and QUIC does not rely on TCP or send duplicates by default.");

uq.add('advanced', 'zero-rtt-replay',
	"What is the security caveat of QUIC and TLS 1.3 0-RTT data?",
	"The early data can be replayed by an attacker, so servers should accept it only for idempotent requests such as a GET",
	["The early data is sent in clear text, so no password should ever be included",
	 "The early data can only be read by the first router, so it is safe once it leaves the network",
	 "The early data is limited to one byte, so it is useless for real requests"],
	"0-RTT data is encrypted with keys from the previous session, but the server cannot tell whether a copy captured on the wire was sent before. An attacker can replay it, and a replayed payment or state-changing request would run twice. Servers therefore restrict 0-RTT to safe, idempotent operations or add their own replay protection. It is encrypted, and it can carry full requests.");

uq.add('advanced', 'quic-fallback',
	"A site serves HTTP/3, but some corporate networks drop all outbound UDP on port 443. How do browsers keep the site working?",
	"The server advertises h3 through Alt-Svc after a normal HTTPS connection, and the client falls back to HTTP/2 over TCP if the QUIC attempt fails",
	["The browser always starts with HTTP/3 and shows an error if UDP is blocked",
	 "The browser converts the QUIC packets into TCP segments at the network edge",
	 "The server detects the blocked network and moves its HTTP/3 listener to a TCP port"],
	"Clients usually learn about HTTP/3 from an Alt-Svc header (or a DNS record) received over TCP and TLS, then try QUIC and keep the TCP connection as a fallback, so blocked UDP only costs a slight delay. Nothing converts packet types in the network, and a server cannot detect blocking that happens on the client side.");

// ───────────────────────── net-http-evolution ─────────────────────────
const he = t('net-http-evolution');

he.add('basic', 'keep-alive',
	"What problem do persistent connections (keep-alive) in HTTP/1.1 solve?",
	"They reuse one TCP connection for several requests, avoiding a new handshake and slow start for each one",
	["They make the server remember the user between requests",
	 "They encrypt every request with a key from the previous one",
	 "They let the server push new files to the browser without a request"],
	"HTTP/1.0 normally closed the connection after every response, so each request paid for a TCP handshake (and TLS) plus a fresh slow start. HTTP/1.1 keeps the connection open by default. Remembering users is the job of cookies, encryption is TLS, and server-initiated pushes are a different feature.");

he.add('basic', 'six-connections',
	"Why do browsers open several parallel connections (typically six) to the same host with HTTP/1.1?",
	"A single connection handles one request at a time, so a slow response blocks later ones, and parallel connections work around this",
	["Each connection is limited to six files, so more connections are needed for big pages",
	 "The server requires one connection per file type",
	 "Six connections are needed so that the data is spread over several encryption keys"],
	"On one HTTP/1.1 connection responses come back in order, so a large or slow response holds up the ones behind it (HTTP-level head-of-line blocking). Browsers open a handful of connections per host to get parallelism, at the cost of extra handshakes and congestion windows. There is no per-connection file limit or key rule.");

he.add('basic', 'multiplexing',
	"What does HTTP/2 multiplexing allow?",
	"Many requests and responses are interleaved as separate streams over a single connection at the same time",
	["Many different websites share the same domain name",
	 "The server can answer without ever reading the request",
	 "Requests are sent over UDP so that they cannot be delayed"],
	"HTTP/2 splits messages into frames tagged with a stream id, so frames of many requests can be interleaved on one connection, and a slow response no longer blocks others at the HTTP level. It still runs on TCP (HTTP/3 is the one on UDP), and the server still needs the request before replying.");

he.add('mid', 'hpack',
	"What is HPACK in HTTP/2?",
	"A header compression scheme that keeps a table of previously sent headers, so repeated ones such as cookies are sent as short references",
	["A way of compressing the response body with gzip before it is sent",
	 "A checksum that detects whether headers were changed on the way",
	 "A method to encrypt cookies separately from the rest of the request"],
	"Requests to the same site repeat almost identical headers (user agent, cookies, accept lines), which HTTP/1.1 sends in full each time. HPACK indexes headers in a table shared by both ends and uses a static Huffman code for new values, so most are sent in a few bytes. Body compression is Content-Encoding, and integrity and encryption are separate matters.");

he.add('mid', 'tcp-hol',
	"HTTP/2 removed HTTP-level head-of-line blocking. Why can one lost packet still stall every request on the connection?",
	"All streams share one TCP byte stream, and TCP delivers bytes in order, so data after the missing segment waits until it is retransmitted",
	["The server stops answering until all clients confirm that nothing was lost",
	 "HTTP/2 sends all streams one after another, so a loss in the first stream stops the others by design",
	 "A lost packet forces the browser to rebuild the TLS session for every stream"],
	"TCP knows nothing about HTTP streams. It presents one ordered byte stream to the application, so segments that arrived after a lost one are held in the kernel buffer until the gap is filled. Every multiplexed stream is blocked meanwhile, even those whose data was intact. HTTP/3 puts streams on QUIC to avoid exactly this.");

he.add('mid', 'http3',
	"What is the main change in HTTP/3 compared with HTTP/2?",
	"It runs over QUIC on UDP instead of TCP, so streams recover from loss independently and connection setup is shorter",
	["It replaces HTTP methods and status codes with a new binary set",
	 "It removes encryption, because QUIC makes it unnecessary",
	 "It adds multiplexing, which HTTP/2 did not have"],
	"HTTP semantics (methods, status codes, headers) stay the same across versions. What changes is the transport: QUIC gives per-stream loss recovery, built-in TLS 1.3 and faster setup. Multiplexing already existed in HTTP/2, and HTTP/3 is always encrypted.");

he.add('mid', 'h1-workarounds',
	"Which HTTP/1.1 optimization becomes less useful, or even harmful, under HTTP/2?",
	"Domain sharding, which spreads assets over several hostnames to get more parallel connections",
	["Caching static files with long max-age values",
	 "Compressing text responses with gzip or brotli",
	 "Using a CDN to place files closer to users"],
	"Sharding existed to get past the per-host connection limit. With HTTP/2 one connection already carries many streams, and extra hostnames mean extra DNS lookups, handshakes and separate congestion windows, plus they break prioritisation. Caching, compression and CDNs help on every version.");

he.add('advanced', 'server-push',
	"HTTP/2 server push was designed to send resources before the browser asked. Why did major browsers drop support for it?",
	"Servers often pushed files the client already had cached, wasting bandwidth, and hints such as preload and 103 Early Hints achieved the benefit more safely",
	["Push could not be used with TLS, so it was never secure",
	 "Push made the connection use UDP, which many networks block",
	 "Push only worked for images, so it was too limited to keep"],
	"A pushed response could not reliably know what the client had cached, so pushes often wasted bandwidth and competed with needed requests. In practice it rarely beat simply letting the browser start requests early. Preload links and 103 Early Hints let the client decide using its own cache. Push worked over TLS and TCP, for any resource type.");

he.add('advanced', 'h2-lossy-mobile',
	"A site moved to HTTP/2 and became slower on a high-loss mobile network, compared with HTTP/1.1 using six connections. What is a plausible reason?",
	"All requests now share one TCP connection, so each loss stalls everything and cuts one congestion window, while six connections spread the damage",
	["HTTP/2 headers are bigger, so every request exceeds the packet size",
	 "HTTP/2 disables TCP retransmission to save bandwidth",
	 "Browsers refuse to cache any resource that was delivered over HTTP/2"],
	"With six HTTP/1.1 connections a loss only freezes one of them and halves just its window. With one HTTP/2 connection the same loss blocks all streams and shrinks the single window, so the multiplexing advantage reverses on lossy links. HTTP/3 exists to fix this. HPACK makes headers smaller, TCP still retransmits, and caching rules do not depend on the version.");

// ───────────────────────── net-proxies-lb ─────────────────────────
const pl = t('net-proxies-lb');

pl.add('basic', 'forward-vs-reverse',
	"What is the difference between a forward proxy and a reverse proxy?",
	"A forward proxy acts for clients and fetches sites for them, while a reverse proxy sits in front of servers and receives requests on their behalf",
	["A forward proxy is used only for HTTP and a reverse proxy is used only for HTTPS",
	 "A forward proxy hides the servers from the internet, while a reverse proxy hides the clients",
	 "A forward proxy stores passwords for the client and a reverse proxy stores them for the server"],
	"A forward proxy is configured by the client side (for example a corporate gateway) and makes requests out to the internet. A reverse proxy such as nginx or a CDN edge is what clients talk to as if it were the site, and it passes requests to backends. So it is the reverse proxy that hides the servers, not the other way round, and either can handle HTTP or HTTPS.");

pl.add('basic', 'l4-vs-l7',
	"What is the difference between a layer 4 and a layer 7 load balancer?",
	"Layer 4 balances by IP address and port without reading the request, while layer 7 reads the HTTP request and can route by path, host or header",
	["Layer 4 can only balance four servers, and layer 7 can balance seven",
	 "Layer 4 balances UDP only, and layer 7 balances TCP only",
	 "Layer 4 terminates TLS, and layer 7 passes encrypted traffic through untouched"],
	"A layer 4 balancer decides from connection details, which is fast and protocol-agnostic. A layer 7 balancer parses the application protocol, so it can send /api to one pool and /static to another, rewrite headers or retry safely, at the cost of more work per request. The numbers refer to the layers of the model, not to server counts.");

pl.add('basic', 'client-ip',
	"Behind a reverse proxy, the application logs the proxy's address for every request. How can it find the real client address?",
	"Read the X-Forwarded-For (or Forwarded) header that the proxy adds, trusting it only when it comes from a known proxy",
	["Look at the Host header of the request",
	 "Ask the TCP stack for the original client address of the connection",
	 "Use the first IP found in the response headers"],
	"The TCP connection really comes from the proxy, so the socket's peer address is the proxy's. Proxies record the original address in X-Forwarded-For, and the app must only trust it when the immediate peer is a proxy it controls, since clients can send fake values themselves. The Host header names the site, and responses do not carry the client IP.");

pl.add('mid', 'algorithms',
	"Requests to a service vary widely in duration, from 5 ms to several seconds. Which balancing algorithm usually spreads load best?",
	"Least connections, which sends each request to the server with the fewest requests in progress",
	["Round robin, because it gives every server exactly the same amount of work",
	 "Random choice, because it is guaranteed to give equal load in the short term",
	 "Always the first server in the list, until it reports that it is full"],
	"Round robin equalises the count of requests, not the work. If a few servers receive several slow requests in a row they fall behind while others idle. Least connections reacts to actual in-flight load, so busy servers get less. Random equalises only on average over many requests, and always choosing the first server just overloads it.");

pl.add('mid', 'health-checks',
	"Why does a load balancer run health checks against its backends?",
	"To stop sending traffic to a backend that fails the checks and resume when it recovers",
	["To balance the load by measuring the CPU speed of each server",
	 "To encrypt the traffic between the balancer and each backend",
	 "To keep each user pinned to the same backend for the whole session"],
	"Without checks, a crashed or hung backend would still receive its share and users would see errors. Active checks probe an endpoint on a schedule, and passive checks watch real responses, and both mark servers out of rotation and back in. Speed measurements, encryption and stickiness are different features.");

pl.add('mid', 'sticky-sessions',
	"An app keeps login sessions in each server's memory, so the balancer uses sticky sessions. What problem remains?",
	"If a server restarts or is removed, all its sessions are lost and load can become uneven, so sessions are better kept in a shared store",
	["Sticky sessions send every user to every server, so logins are duplicated",
	 "Sticky sessions stop the balancer from checking server health",
	 "Sticky sessions work only for HTTP/1.0, so modern clients are not supported"],
	"Pinning a client to one backend keeps its memory-based session reachable, but ties users to that server's fate: a deploy, crash or scale-in logs them out, and heavy users can pile up on one machine. Moving sessions to a shared store such as Redis, or using signed tokens, lets any server handle any request. Stickiness does not affect health checks or protocol versions.");

pl.add('mid', 'tls-termination',
	"A load balancer terminates TLS and forwards plain HTTP to the backends. What must the application be careful about?",
	"It sees an HTTP request even though the user used HTTPS, so it must rely on X-Forwarded-Proto from the trusted proxy to build secure links and cookies",
	["The browser can no longer verify the certificate, so the page shows a warning",
	 "The backend sees encrypted bytes and must decrypt them with its own key",
	 "The balancer cannot read the request path, so routing by URL is impossible"],
	"The browser's TLS session ends at the balancer, which holds the certificate, so users see a valid HTTPS connection. The backend receives cleartext on a private network and cannot tell the original scheme, so redirects, secure cookies and absolute URLs need the forwarded protocol header. Because the balancer decrypts the traffic it can route by path too.");

pl.add('advanced', 'consistent-hashing',
	"A cache cluster picks a server with hash(key) mod N. Adding one server changes N and most keys move to different servers. How does consistent hashing improve this?",
	"Servers and keys are placed on a ring, so adding a server takes over only a slice of keys, roughly 1/N of them",
	["It stores every key on every server, so nothing has to move",
	 "It uses a larger hash function, so the results of the modulo stay stable",
	 "It asks the clients to resend each key when the cluster changes"],
	"With modulo hashing, going from N to N+1 changes almost every key's server, causing a storm of cache misses. On a ring each server owns the arc up to its position, and a new server only takes keys from its neighbour's arc, so about 1/N of keys move. Virtual nodes smooth the distribution. Replicating everything wastes memory, and hash size does not fix modulo.");

pl.add('advanced', 'keepalive-502',
	"After a release, the load balancer returns occasional 502 errors although the backend logs show no failures. The backend closes idle connections after 5 seconds, the balancer after 60. What is the likely fix?",
	"Make the backend's keep-alive idle timeout longer than the balancer's, so that the balancer never reuses a connection that the backend just closed",
	["Make the balancer's idle timeout longer than the backend's, so it waits for the backend",
	 "Disable health checks, because they use up the backend's connections",
	 "Switch the backend to UDP so that there are no idle connections"],
	"The balancer reuses idle connections to the backend. If the backend closes one first, a request sent over it at the same moment gets a reset, which the balancer reports as 502, and the backend never logs a request. The side that talks first, the balancer, must give up on idle connections earlier than the backend does, so the backend timeout must be the longer one. Health checks and UDP are unrelated.");

// ───────────────────────── net-realtime ─────────────────────────
const rt = t('net-realtime');

rt.add('basic', 'polling',
	"What is the difference between short polling and long polling?",
	"Short polling asks at fixed intervals and gets an answer straight away, while long polling holds the request open until there is something to report or a timeout",
	["Short polling uses UDP and long polling uses TCP",
	 "Short polling pushes data from the server, and long polling asks the server for it",
	 "Short polling needs a persistent connection and long polling closes after each byte"],
	"With short polling most requests return 'nothing new', wasting traffic and adding up to one interval of delay. With long polling the server parks the request and answers when an event occurs, so latency is low, and the client immediately asks again. Both use ordinary HTTP requests that the client starts.");

rt.add('basic', 'websocket-basics',
	"How does a WebSocket connection start, and what does it provide?",
	"It begins as an HTTP request with an Upgrade header, and after a 101 response both sides can send messages at any time over the same connection",
	["It begins on a separate UDP port, and only the server can send messages",
	 "It begins as a normal HTTP request, and after the response the client sends a new request for every message",
	 "It needs a browser plugin, and messages are limited to plain text"],
	"The client sends a GET with Upgrade: websocket, and a server that agrees replies 101 Switching Protocols. From then on the TCP connection carries framed messages in both directions, text or binary, with no per-message HTTP overhead. It is not UDP-based and needs no plugin.");

rt.add('basic', 'sse-basics',
	"Which description fits Server-Sent Events (SSE)?",
	"A long-lived HTTP response in which the server streams text events to the client, and the browser's EventSource reconnects automatically",
	["A two-way binary channel where the client and server both send frames",
	 "A UDP-based protocol for peer-to-peer video between two browsers",
	 "A technique where the client sends a new request every second to check for events"],
	"SSE uses a plain HTTP response with Content-Type: text/event-stream that stays open, and the server writes events as it goes. It is one-way (server to client), and EventSource reconnects on its own and can resume with the Last-Event-ID header. Bidirectional binary frames describe WebSocket, peer-to-peer video describes WebRTC, and repeated requests are polling.");

rt.add('mid', 'choosing',
	"Which choice fits best: a live notification feed that only pushes updates to the user, or a multiplayer game with fast messages in both directions?",
	"SSE for the notification feed, and WebSocket for the game",
	["WebSocket for the feed, because SSE cannot send more than one event",
	 "SSE for the game, because EventSource lets the client send messages too",
	 "Short polling for both, because it is the only approach that works through every proxy"],
	"SSE is simple, works over ordinary HTTP infrastructure and gives automatic reconnection, which suits one-way updates. A game needs the client to stream inputs as well, which the WebSocket's full-duplex channel provides. SSE streams can carry many events, EventSource cannot send messages, and polling is wasteful and slow for both.");

rt.add('mid', 'scaling-websockets',
	"A chat app runs on three servers behind a load balancer. A user connected to server A sends a message to a user connected to server B. What is needed?",
	"A shared message channel such as pub/sub between the servers, so that server A can pass the message to server B, which holds the recipient's connection",
	["Nothing, because WebSocket connections are shared between all servers automatically",
	 "Sticky sessions alone, because they put both users on the same server",
	 "Switching both users to short polling, so that they reconnect to the correct server"],
	"A WebSocket is a live connection held by exactly one process, so each server only knows its own clients. To deliver across servers they publish messages to a common backplane (Redis pub/sub, a message broker) and each server forwards them to its local sockets. Stickiness does not put two users on one server, and connections are not shared.");

rt.add('mid', 'heartbeats',
	"Why do WebSocket applications send periodic ping and pong messages?",
	"To detect connections that have silently died, and to keep idle connections from being closed by proxies and load balancers",
	["To make the messages arrive faster by warming up the route",
	 "To prove to the browser that the server's certificate is still valid",
	 "To split large messages into smaller frames"],
	"If a client loses power or a NAT drops its mapping, the server may see no close and keep the socket for a long time, and idle connections are cut by intermediaries after a timeout. A ping that must be answered within a deadline finds dead peers, and the traffic also resets idle timers. Frame splitting and certificate checks happen elsewhere.");

rt.add('mid', 'sse-limit',
	"Over HTTP/1.1, a page opens SSE streams in several tabs and other requests to the same site start to hang. What is the likely cause?",
	"Browsers limit connections per host to about six, and each open SSE stream occupies one for as long as it stays open",
	["SSE closes the connection after every event, which floods the server",
	 "SSE requires a separate port for every tab, and the ports run out",
	 "The server rejects SSE after the first tab for security reasons"],
	"A stream stays open indefinitely, so it holds one of the few per-host HTTP/1.1 connections. A handful of tabs can use them all, and further requests queue. Under HTTP/2 many streams share one connection, with a default limit of about 100 concurrent streams, which largely removes the problem.");

rt.add('advanced', 'reconnect-storm',
	"A realtime server restarts and thousands of clients reconnect at the same moment and overload it again. What reconnect strategy is recommended?",
	"Exponential backoff with random jitter, so that clients spread their retries and wait longer after each failure",
	["Retry immediately in a tight loop, so that the connection is restored as fast as possible",
	 "Retry at exactly the same fixed interval, so that the server can predict the load",
	 "Never reconnect, and ask the user to reload the page"],
	"If all clients retry at the same instant, the herd hits the recovering server together and can knock it over repeatedly. Doubling the delay after every failure reduces total load, and randomising it (jitter) breaks the synchronisation so arrivals are spread out. A fixed interval keeps clients in lockstep, and tight loops worsen the overload.");

rt.add('advanced', 'webrtc-turn',
	"In WebRTC, two peers try to connect directly but both are behind strict NATs. When is a TURN server needed, and what does it do?",
	"When a direct path cannot be established (for example with symmetric NAT), TURN relays the media between the peers",
	["Always, because TURN encrypts the media and the peers cannot",
	 "Only to look up the peers' public addresses, which is the job of every TURN server",
	 "Never, because UDP always passes through any NAT without help"],
	"WebRTC first gathers candidate addresses, using STUN to discover each peer's public address and trying to punch through NATs. If hole punching fails, for example with symmetric NATs that choose a different mapping per destination, a TURN server relays the traffic at extra cost and latency. Media is already encrypted with DTLS-SRTP, and discovering public addresses is STUN's task, not TURN's.");

// ───────────────────────── net-debugging ─────────────────────────
const nd = t('net-debugging');

nd.add('basic', 'refused-vs-timeout',
	"Connecting to a server's port gives 'connection refused' in one case and 'connection timed out' in another. What does each most likely mean?",
	"Refused means the host answered with a reset because nothing is listening there, while a timeout means that packets were dropped or never answered, for example by a firewall",
	["Refused means that the firewall dropped the packet, and a timeout means that nothing listens on the port",
	 "Refused means the DNS lookup failed, and a timeout means the certificate expired",
	 "Both mean exactly that the server is powered off"],
	"A host with no listener on that port replies to the SYN with a RST, so the client fails instantly with 'refused', which also proves the host is reachable. A firewall that silently drops the SYN, or a host or route that is down, produces no reply at all, so the client waits until its timeout. DNS and certificate problems give different errors.");

nd.add('basic', 'dns-check',
	"A site is unreachable by name, but works when you open it by IP address. Which tool confirms the likely cause quickly?",
	"dig or nslookup, to see whether the name resolves and to which address",
	["traceroute, to count the hops to the server",
	 "tcpdump, to check the order of the TCP flags",
	 "netstat, to list the sockets on the server"],
	"If the IP works, routing and the server are fine, so the name lookup is suspect: a wrong, stale or missing record, or a broken resolver. dig example.com (optionally with @8.8.8.8 to compare resolvers) shows what is returned. The other tools check different things, such as path, packets on the wire or local sockets.");

nd.add('basic', 'ping-limits',
	"A server does not answer ping, but its website loads fine. What does this tell you?",
	"ICMP echo is probably filtered, so a failed ping does not prove that the server is down",
	["The website is served from a cache, so the server itself no longer exists",
	 "The server has no IP address, since pings can only be answered by addresses",
	 "The network is broken, and the website is displaying an old copy"],
	"Ping uses ICMP, which firewalls commonly block, while HTTP over TCP port 443 passes. Because the page loads over a live connection, the server is reachable and answering on that port. Treat ping as one hint, and test the real service with curl or nc against its port.");

nd.add('mid', 'traceroute-mechanics',
	"How does traceroute discover the routers between you and a destination?",
	"It sends probes with TTL 1, 2, 3 and so on, and each router that drops one as expired replies with an ICMP Time Exceeded message that reveals its address",
	["It asks every router on the internet for its routing table and prints the entry for the destination",
	 "It sends one packet and reads the list of routers that each of them stamped into the header",
	 "It pings the destination repeatedly and calculates the hops from the delay"],
	"Each router decrements the IP TTL, and when it reaches 0 the router discards the packet and sends an ICMP Time Exceeded back, giving away its address. By raising the TTL by one per probe, traceroute reveals one hop after another, until the destination answers (with a port-unreachable or echo reply). Routers do not publish their tables or stamp packets, and delay alone cannot reveal addresses.");

nd.add('mid', 'curl-timings',
	"curl -w shows time_connect of 0.03 s but time_starttransfer of 4.2 s. What does this suggest?",
	"The network path and TCP connection are quick, and the server took a long time to produce the first byte of the response",
	["The DNS lookup was slow, because the time before the connection includes it",
	 "The TCP handshake was slow, because 4.2 s is counted from the first packet",
	 "The download of the body was slow, because the first byte is counted last"],
	"time_connect is when the TCP connection was established, so reaching the server took 30 ms. time_starttransfer is when the first response byte arrived, so about 4 s went to waiting on the server (application, database or upstream), the time-to-first-byte. DNS time is reported separately as time_namelookup, and body download comes after the first byte.",
	"curl -s -o /dev/null -w 'dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\\n' https://example.com/");

nd.add('mid', 'close-wait',
	"On an application server, ss -tan shows thousands of connections in CLOSE_WAIT that never go away. What does this indicate?",
	"The remote side closed the connection, but the local application has not closed its socket, which is typically a bug such as a leaked connection",
	["The local kernel is waiting for the remote side to finish the handshake",
	 "The local side closed first, and the kernel waits two minutes before releasing the port",
	 "The network is dropping the final packets, so the kernel cannot close them"],
	"CLOSE_WAIT means a FIN was received and acknowledged, and the OS is waiting for the local application to call close(). If they pile up, the program is not closing sockets (missing close in an error path, a forgotten response body, a leaked pool entry). That differs from TIME_WAIT, which belongs to the side that closed first and expires on its own.");

nd.add('advanced', 'traceroute-stars',
	"A traceroute shows * * * for hop 6, but hops 7 to 10 reply normally and the destination is reached. How should you interpret hop 6?",
	"Probably a router that does not send ICMP Time Exceeded or rate-limits it, while still forwarding traffic, so it is not evidence of a fault",
	["That router is down, and the traffic after it must be arriving through a different network",
	 "That hop is dropping all traffic, which is why the test is slower",
	 "The traceroute failed and its results after hop 6 must be ignored"],
	"Traceroute relies on routers choosing to answer expired packets, and many deprioritise, rate-limit or disable that ICMP reply. Since later hops respond and the destination is reached, packets are clearly passing through hop 6. A real fault shows up as all later hops and the destination failing, or as rising loss and latency from that hop onwards.");

nd.add('advanced', 'mtu-blackhole',
	"Small requests to a service work, but uploads and large responses hang forever, mostly over a VPN. Pings with a small size succeed. What is a likely cause and fix?",
	"A path MTU black hole, where ICMP fragmentation-needed messages are blocked, so large packets vanish; fix by allowing that ICMP or clamping the TCP MSS",
	["The server has run out of memory, so it can only handle small packets; add RAM",
	 "DNS is returning a stale record only for large requests; flush the cache",
	 "The congestion window is set too small; raise the TCP receive buffer"],
	"Tunnels reduce the usable MTU. Path MTU discovery relies on routers sending ICMP 'fragmentation needed' for packets with the Don't Fragment bit set, and if a firewall drops those messages the sender never learns to shrink its packets. The handshake and small messages fit, and full-size segments disappear. Clamping the MSS on the tunnel, or letting the needed ICMP through, fixes it. Memory, DNS and window sizes do not depend on packet size like this.");

nd.add('advanced', 'syn-ack-no-ack',
	"On a server, tcpdump shows a client's SYN arriving and the server sending SYN-ACK again and again, but the final ACK never arrives. Where should you look?",
	"The return path from server to client, such as asymmetric routing, a stateful firewall or NAT that drops the SYN-ACK, because the server is clearly working",
	["The application code, because the server has not accepted the request",
	 "The client's DNS configuration, because it never resolved the name",
	 "The server's disk, because it cannot write the connection to the log"],
	"The SYN reached the server and the kernel answered, so the port is open and the stack is healthy. Repeating SYN-ACKs mean no ACK came back, so either the SYN-ACK is lost on the way to the client (a different return route, a firewall expecting the flow on another path, a NAT mapping problem) or the client's ACK is dropped. Application code is not involved before the handshake finishes, and DNS must have worked since the SYN arrived.");

export const csQuestionBanks3 = [nl, ip, tr, uq, he, pl, rt, nd];
