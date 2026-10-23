import type { Scene, SceneNode } from '../../types';

/** A thin vertical lifeline for a message diagram (a client or a server). */
const lifeline = (id: string, cx: number, y: number, h: number): SceneNode => ({ id, kind: 'box', x: cx - 2, y, w: 4, h, label: '', visible: true });

/** Computer science lessons, part 3: recursion, memory, processes, networking, caching and compilers. */
export const csPart3: Scene[] = [
	// ───────── recursion-and-dp ─────────
	{
		id: 'cs-recursion-factorial',
		topic: 'cs',
		group: 'recursion-and-dp',
		title: 'Recursion and the call stack',
		blurb: 'What really happens when a function calls itself?',
		stage: { w: 360, h: 282 },
		nodes: [
			{ id: 'code', kind: 'doc', x: 8, y: 12, w: 220, lines: ['function factorial(n) {', '  if (n <= 1) return 1;', '  return n * factorial(n - 1);', '}'], visible: true },
			{ id: 'cs', kind: 'text', x: 8, y: 118, text: 'call stack', size: 'sm', visible: true },
			{ id: 'f3', kind: 'box', x: 60, y: 222, w: 240, h: 40, label: 'factorial(3)', sub: 'n = 3, waiting for factorial(2)' },
			{ id: 'f2', kind: 'box', x: 60, y: 176, w: 240, h: 40, label: 'factorial(2)', sub: 'n = 2, waiting for factorial(1)' },
			{ id: 'f1', kind: 'box', x: 60, y: 130, w: 240, h: 40, label: 'factorial(1)', sub: 'n = 1: base case' },
			{ id: 'nt', kind: 'text', x: 240, y: 40, text: 'No base case: frames pile up until the stack overflows.', w: 112, size: 'sm', tone: 'neg' }
		],
		steps: [
			{ say: 'A recursive function calls itself on a smaller problem. It needs a base case that stops the calls, or it would never end.', focus: ['code'] },
			{ say: 'Call factorial(3). The runtime pushes a frame onto the call stack to hold this call, with n = 3.', show: ['f3'], pulse: ['f3'] },
			{ say: 'n is not 1 yet, so it calls factorial(2). A new frame goes on top, and the first one waits for the answer.', show: ['f2'], pulse: ['f2'] },
			{ say: 'factorial(1) hits the base case. It returns 1 straight away, with no further call.', show: ['f1'], set: { f1: { tone: 'accent', sub: 'n = 1: base case, returns 1' } }, pulse: ['f1'] },
			{ say: 'Now the frames unwind from the top. factorial(2) gets 1, computes 2 * 1 = 2 and returns it.', hide: ['f1'], set: { f2: { tone: 'accent', sub: 'gets 1, returns 2 * 1 = 2' } }, pulse: ['f2'] },
			{ say: 'factorial(3) gets 2, computes 3 * 2 = 6 and returns it. The stack is empty again.', hide: ['f2'], set: { f3: { tone: 'accent', sub: 'gets 2, returns 3 * 2 = 6' } }, pulse: ['f3'] },
			{ say: 'Without a base case the frames would keep stacking until the stack runs out of space: a stack overflow. Recursion costs memory proportional to its depth.', show: ['nt'], focus: ['nt'] }
		]
	},
	{
		id: 'cs-fib-memo',
		topic: 'cs',
		group: 'recursion-and-dp',
		title: 'Fibonacci: repeated work and memoization',
		blurb: 'Why is naive fib so slow, and how does a memo fix it?',
		stage: { w: 360, h: 290 },
		nodes: [
			{ id: 'f4', kind: 'box', x: 152, y: 14, w: 56, h: 30, label: 'fib(4)', visible: true },
			{ id: 'f3', kind: 'box', x: 80, y: 70, w: 56, h: 30, label: 'fib(3)', visible: true },
			{ id: 'f2a', kind: 'box', x: 224, y: 70, w: 56, h: 30, label: 'fib(2)', visible: true },
			{ id: 'f2b', kind: 'box', x: 40, y: 126, w: 56, h: 30, label: 'fib(2)', visible: true },
			{ id: 'f1a', kind: 'box', x: 120, y: 126, w: 56, h: 30, label: 'fib(1)', visible: true },
			{ id: 'f1b', kind: 'box', x: 184, y: 126, w: 56, h: 30, label: 'fib(1)', visible: true },
			{ id: 'f0a', kind: 'box', x: 264, y: 126, w: 56, h: 30, label: 'fib(0)', visible: true },
			{ id: 'f1c', kind: 'box', x: 12, y: 182, w: 56, h: 30, label: 'fib(1)', visible: true },
			{ id: 'f0b', kind: 'box', x: 72, y: 182, w: 56, h: 30, label: 'fib(0)', visible: true },
			{ id: 'e43', kind: 'edge', from: 'f4', to: 'f3', visible: true }, { id: 'e42', kind: 'edge', from: 'f4', to: 'f2a', visible: true },
			{ id: 'e32', kind: 'edge', from: 'f3', to: 'f2b', visible: true }, { id: 'e31', kind: 'edge', from: 'f3', to: 'f1a', visible: true },
			{ id: 'e2a1', kind: 'edge', from: 'f2a', to: 'f1b', visible: true }, { id: 'e2a0', kind: 'edge', from: 'f2a', to: 'f0a', visible: true },
			{ id: 'e2b1', kind: 'edge', from: 'f2b', to: 'f1c', visible: true }, { id: 'e2b0', kind: 'edge', from: 'f2b', to: 'f0b', visible: true },
			{ id: 'memo', kind: 'table', x: 250, y: 176, title: 'memo', colW: 50, cols: ['n', 'fib(n)'], rows: [] },
			{ id: 'nt', kind: 'text', x: 8, y: 244, text: 'fib(40) naively makes over 300 million calls.', w: 230, size: 'sm', tone: 'warn' }
		],
		steps: [
			{ say: 'fib(n) = fib(n-1) + fib(n-2). Written naively, fib(4) makes this tree of calls, and every box is a separate call.', focus: ['f4'] },
			{ say: 'Look at the repeats: fib(2) is computed twice and fib(1) three times. Everything beneath a repeated call is repeated too.', set: { f2a: { tone: 'warn' }, f2b: { tone: 'warn' }, f1a: { tone: 'warn' }, f1b: { tone: 'warn' }, f1c: { tone: 'warn' } } },
			{ say: 'The number of calls grows exponentially, by about 1.6 times with every step up in n (O(2ⁿ) is the usual simple bound): fib(40) needs over 300 million calls.', show: ['nt'], focus: ['nt'] },
			{ say: 'Memoization fixes it. Keep a table of answers already worked out, and look there before computing anything.', show: ['memo'], set: { f2a: { tone: 'neutral' }, f2b: { tone: 'neutral' }, f1a: { tone: 'neutral' }, f1b: { tone: 'neutral' }, f1c: { tone: 'neutral' } }, focus: ['memo'] },
			{ say: 'The left side is computed first. fib(2) and fib(3) are worked out once and written into the memo.', set: { memo: { rows: [['2', '1'], ['3', '2']], hl: [0, 1] }, f2b: { tone: 'accent' }, f3: { tone: 'accent' } } },
			{ say: 'Now the right branch asks for fib(2) again. The memo already has it, so the answer returns instantly and everything beneath that call is skipped.', hide: ['f1b', 'f0a', 'e2a1', 'e2a0'], set: { f2a: { tone: 'accent', label: 'cached' }, memo: { hl: [0] } }, pulse: ['f2a'] },
			{ say: 'Each value is now computed once, so the work is O(n) instead of O(2ⁿ). Trading memory for time like this is the core of dynamic programming.', set: { memo: { hl: [] } }, focus: ['memo'] }
		]
	},

	// ───────── stack-heap-and-gc ─────────
	{
		id: 'cs-stack-vs-heap',
		topic: 'cs',
		group: 'stack-heap-and-gc',
		title: 'Stack, heap and references',
		blurb: 'Where do values live, and what does b = a really copy?',
		stage: { w: 360, h: 244 },
		nodes: [
			{ id: 'hs', kind: 'text', x: 8, y: 20, text: 'Stack: fast, automatic', size: 'sm', visible: true },
			{ id: 'hh', kind: 'text', x: 200, y: 20, text: 'Heap: flexible, shared', size: 'sm', visible: true },
			{ id: 'vn', kind: 'box', x: 14, y: 40, w: 140, h: 36, label: 'n = 5' },
			{ id: 'vu', kind: 'box', x: 14, y: 88, w: 140, h: 36, label: 'user = ref' },
			{ id: 'vc', kind: 'box', x: 14, y: 136, w: 140, h: 36, label: 'copy = ref' },
			{ id: 'obj', kind: 'doc', x: 196, y: 70, w: 150, title: 'object', lines: ['{', '  name: "Asha"', '}'] },
			{ id: 'eu', kind: 'edge', from: 'vu', to: 'obj' }, { id: 'ec', kind: 'edge', from: 'vc', to: 'obj' },
			{ id: 'nt', kind: 'text', x: 8, y: 218, text: '', w: 340, size: 'sm' }
		],
		steps: [
			{ say: 'A program uses two main areas of memory. The stack holds the frames of running function calls. The heap is a big pool for data that is created at run time.', focus: ['hs', 'hh'] },
			{ say: 'Small fixed-size values such as the number 5 live right in the function\'s stack frame.', show: ['vn'], pulse: ['vn'] },
			{ say: 'An object lives on the heap. The variable on the stack holds only a reference: the address of the object.', show: ['vu', 'obj', 'eu'], pulse: ['obj'] },
			{ say: 'Copy the variable and you copy the reference, not the object. Both names now point at the same object.', show: ['vc', 'ec'], pulse: ['vc'] },
			{ say: 'So a change made through one name shows through the other. This is a classic source of surprising bugs.', set: { obj: { lines: ['{', '  name: "Ben"', '}'], tone: 'warn' } }, focus: ['obj'] },
			{ say: 'When the function returns, its stack frame disappears at once. The object stays on the heap until nothing points at it, and then the garbage collector frees it.', hide: ['vn', 'vu', 'vc', 'eu', 'ec'], set: { obj: { tone: 'neg', title: 'object, now unreachable' } } }
		]
	},
	{
		id: 'cs-mark-and-sweep',
		topic: 'cs',
		group: 'stack-heap-and-gc',
		title: 'Garbage collection: mark and sweep',
		blurb: 'How does a garbage collector decide what to free?',
		stage: { w: 360, h: 220 },
		nodes: [
			{ id: 'root', kind: 'box', x: 12, y: 30, w: 70, h: 40, label: 'roots', tone: 'accent', visible: true },
			{ id: 'oa', kind: 'box', x: 120, y: 30, w: 60, h: 40, label: 'A', visible: true },
			{ id: 'ob', kind: 'box', x: 220, y: 30, w: 60, h: 40, label: 'B', visible: true },
			{ id: 'oc', kind: 'box', x: 120, y: 140, w: 60, h: 40, label: 'C', visible: true },
			{ id: 'od', kind: 'box', x: 220, y: 140, w: 60, h: 40, label: 'D', visible: true },
			{ id: 'er', kind: 'edge', from: 'root', to: 'oa', visible: true }, { id: 'eb', kind: 'edge', from: 'oa', to: 'ob', visible: true },
			{ id: 'ecd', kind: 'edge', from: 'oc', to: 'od', visible: true }, { id: 'edc', kind: 'edge', from: 'od', to: 'oc', visible: true },
			{ id: 'nt', kind: 'text', x: 8, y: 208, text: 'Most objects die young: new ones are scanned most.', w: 340, size: 'sm' }
		],
		steps: [
			{ say: 'These are objects on the heap, with arrows for references. Which ones does the program still need?', focus: ['oa', 'ob', 'oc', 'od'] },
			{ say: 'The collector starts from the roots: global variables and whatever is on the stack. Those are always considered in use.', focus: ['root'] },
			{ say: 'Mark: follow every reference from the roots and mark each object reached. A and B are reachable.', set: { oa: { tone: 'accent' }, ob: { tone: 'accent' } }, pulse: ['oa', 'ob'] },
			{ say: 'C and D point at each other, but nothing reachable points at them. They stay unmarked, so a cycle does not keep garbage alive.', set: { oc: { tone: 'neg', sub: 'unmarked' }, od: { tone: 'neg', sub: 'unmarked' } } },
			{ say: 'Sweep: free every unmarked object. C and D are gone, and their memory can be reused.', hide: ['oc', 'od', 'ecd', 'edc'] },
			{ say: 'Marked objects stay. Real collectors run this work in small slices, mostly on young objects, so a program rarely notices.', show: ['nt'], focus: ['nt'] }
		]
	},

	// ───────── processes-and-threads ─────────
	{
		id: 'cs-process-vs-thread',
		topic: 'cs',
		group: 'processes-and-threads',
		title: 'Processes and threads',
		blurb: 'What do threads share, and what does a process isolate?',
		stage: { w: 360, h: 260 },
		nodes: [
			{ id: 'pa', kind: 'box', x: 8, y: 12, w: 160, h: 28, label: 'Process A' },
			{ id: 'ha', kind: 'box', x: 8, y: 54, w: 160, h: 40, label: 'heap', sub: 'shared by its threads' },
			{ id: 'ta1', kind: 'box', x: 8, y: 124, w: 76, h: 48, label: 'thread 1', sub: 'own stack' },
			{ id: 'ta2', kind: 'box', x: 92, y: 124, w: 76, h: 48, label: 'thread 2', sub: 'own stack' },
			{ id: 'pb', kind: 'box', x: 192, y: 12, w: 160, h: 28, label: 'Process B' },
			{ id: 'hb', kind: 'box', x: 192, y: 54, w: 160, h: 40, label: 'heap', sub: 'private to B' },
			{ id: 'tb1', kind: 'box', x: 192, y: 124, w: 160, h: 48, label: 'thread 1', sub: 'own stack' },
			{ id: 'e1', kind: 'edge', from: 'ta1', to: 'ha', tone: 'accent' }, { id: 'e2', kind: 'edge', from: 'ta2', to: 'ha', tone: 'accent' },
			{ id: 'e3', kind: 'edge', from: 'tb1', to: 'hb' },
			{ id: 'ipc', kind: 'edge', from: 'ha', to: 'hb', label: 'IPC', dashed: true },
			{ id: 'nt', kind: 'text', x: 8, y: 204, text: '', w: 340, size: 'sm' }
		],
		steps: [
			{ say: 'A process is a running program with its own private memory. The operating system keeps processes apart, so A cannot read B\'s heap.', show: ['pa', 'ha', 'pb', 'hb'], focus: ['ha', 'hb'] },
			{ say: 'Inside a process, threads are separate lines of execution. Each thread has its own stack and its own place in the code.', show: ['ta1', 'ta2', 'tb1'], pulse: ['ta1', 'ta2'] },
			{ say: 'All the threads of one process share its heap. Sharing is fast, because no copying is needed.', show: ['e1', 'e2', 'e3'], set: { nt: { text: 'Threads share the heap, so data is shared for free.' } }, focus: ['ha'] },
			{ say: 'But two threads changing the same data at the same moment is a race condition. Shared memory needs locks or other care.', show: ['nt'], set: { ha: { tone: 'warn' }, nt: { text: 'Shared data + simultaneous writes = race condition.', tone: 'warn' } }, pulse: ['ha'] },
			{ say: 'Processes cannot touch each other\'s memory. They talk through pipes, sockets or files, called inter-process communication (IPC). Safer, but slower than sharing.', show: ['ipc'], set: { ha: { tone: 'neutral' }, nt: { text: 'Separate processes communicate with messages.', tone: 'neutral' } } },
			{ say: 'Isolation also contains crashes. A fatal bug in one thread brings down its whole process, but other processes keep running. Browsers separate tabs for this reason.', set: { pa: { tone: 'neg' }, ha: { tone: 'neg' }, ta1: { tone: 'neg' }, ta2: { tone: 'neg' }, nt: { text: 'Process A crashed. Process B is unaffected.', tone: 'neg' } }, focus: ['pb', 'hb', 'tb1'] }
		]
	},
	{
		id: 'cs-context-switch',
		topic: 'cs',
		group: 'processes-and-threads',
		title: 'Context switching on one core',
		blurb: 'How can one CPU core run hundreds of threads?',
		stage: { w: 360, h: 212 },
		nodes: [
			{ id: 'hd', kind: 'text', x: 8, y: 24, text: 'One CPU core. Time runs left to right.', size: 'sm', visible: true },
			{ id: 's0', kind: 'box', x: 8, y: 70, w: 52, h: 40, label: 'A' }, { id: 's1', kind: 'box', x: 66, y: 70, w: 52, h: 40, label: 'B' },
			{ id: 's2', kind: 'box', x: 124, y: 70, w: 52, h: 40, label: 'C' }, { id: 's3', kind: 'box', x: 182, y: 70, w: 52, h: 40, label: 'A' },
			{ id: 's4', kind: 'box', x: 240, y: 70, w: 52, h: 40, label: 'B' }, { id: 's5', kind: 'box', x: 298, y: 70, w: 52, h: 40, label: 'C' },
			{ id: 'sw', kind: 'box', x: 20, y: 134, w: 250, h: 40, label: 'context switch', sub: 'save A, load B', tone: 'warn' },
			{ id: 'nt', kind: 'text', x: 8, y: 198, text: '', w: 340, size: 'sm' }
		],
		steps: [
			{ say: 'A CPU core runs one thread at a time, yet a computer seems to run hundreds. The operating system scheduler switches between them very quickly.', focus: ['hd'] },
			{ say: 'Thread A runs for a short time slice, typically a few milliseconds.', show: ['s0'], set: { s0: { tone: 'accent' } }, pulse: ['s0'] },
			{ say: 'A timer interrupts it. The OS saves A\'s state (its registers and where it was in the code) and loads B\'s. This is a context switch.', show: ['sw', 's1'], set: { s0: { tone: 'neutral' }, s1: { tone: 'accent' } }, focus: ['sw'] },
			{ say: 'B runs, then C, then A resumes exactly where it stopped, because its state was saved.', show: ['s2', 's3'], set: { s1: { tone: 'neutral' }, s3: { tone: 'accent' }, sw: { sub: 'save C, load A' } }, pulse: ['s3'] },
			{ say: 'Switching is not free: saving state takes time, and the next thread finds a cooler CPU cache. Too many threads can mean more switching than working.', show: ['s4', 's5', 'nt'], set: { s3: { tone: 'neutral' }, nt: { text: 'Each switch is overhead, so more threads is not always faster.', tone: 'warn' } }, focus: ['sw'] },
			{ say: 'With several cores, threads really do run in parallel, one per core. Concurrency means tasks making progress together; parallelism means running at the same instant.', set: { nt: { text: 'Concurrency: interleaved. Parallelism: simultaneous, on separate cores.', tone: 'accent' } }, focus: ['nt'] }
		]
	},

	// ───────── networking ─────────
	{
		id: 'cs-dns-lookup',
		topic: 'cs',
		group: 'networking',
		title: 'A DNS lookup',
		blurb: 'How does example.com become an IP address?',
		stage: { w: 360, h: 262 },
		nodes: [
			{ id: 'br', kind: 'box', x: 70, y: 20, w: 110, h: 40, label: 'Browser', sub: 'wants example.com', visible: true },
			{ id: 'rs', kind: 'box', x: 70, y: 150, w: 100, h: 40, label: 'Resolver', sub: 'cache + lookups' },
			{ id: 'rt', kind: 'box', x: 250, y: 10, w: 100, h: 40, label: 'Root server' },
			{ id: 'tl', kind: 'box', x: 250, y: 100, w: 100, h: 40, label: '.com server' },
			{ id: 'au', kind: 'box', x: 250, y: 190, w: 100, h: 40, label: 'Authoritative', sub: 'for example.com' },
			{ id: 'e1', kind: 'edge', from: 'br', to: 'rs', label: 'example.com?' },
			{ id: 'er', kind: 'edge', from: 'rs', to: 'rt' },
			{ id: 'et', kind: 'edge', from: 'rs', to: 'tl' },
			{ id: 'ea', kind: 'edge', from: 'rs', to: 'au' },
			{ id: 'tr', kind: 'text', x: 300, y: 64, text: 'points to the .com servers', w: 104, anchor: 'middle', size: 'sm' },
			{ id: 'tt', kind: 'text', x: 300, y: 154, text: 'points to the example.com server', w: 104, anchor: 'middle', size: 'sm' },
			{ id: 'ta', kind: 'text', x: 300, y: 244, text: 'answer: 203.0.113.7', w: 104, anchor: 'middle', size: 'sm', tone: 'accent' },
			{ id: 'back', kind: 'edge', from: 'rs', to: 'br', label: '203.0.113.7', tone: 'accent' }
		],
		steps: [
			{ say: 'Typing example.com needs an IP address first. The browser asks a DNS resolver, usually run by your network provider or a public service.', show: ['rs', 'e1'], focus: ['rs'] },
			{ say: 'The resolver checks its cache. If it already knows the answer, it replies at once. Otherwise it starts asking, beginning at the top.', focus: ['rs'] },
			{ say: 'It asks a root server, which does not know the address but knows who runs .com, and points the resolver there.', show: ['rt', 'er', 'tr'], pulse: ['rt'] },
			{ say: 'It asks the .com server. That does not know the address either, but it knows which server is responsible for example.com.', show: ['tl', 'et', 'tt'], pulse: ['tl'] },
			{ say: 'It asks the authoritative server for example.com, which holds the real record and answers with the IP address.', show: ['au', 'ea', 'ta'], pulse: ['au'] },
			{ say: 'The resolver caches the answer for its TTL (time to live) and returns it to the browser. Next time it is instant.', show: ['back'], set: { rs: { sub: 'answer cached', tone: 'accent' } }, pulse: ['br'] }
		]
	},
	{
		id: 'cs-tcp-handshake',
		topic: 'cs',
		group: 'networking',
		title: 'The TCP handshake',
		blurb: 'What happens before the first byte of data is sent?',
		stage: { w: 360, h: 290 },
		nodes: [
			{ id: 'cl', kind: 'box', x: 20, y: 8, w: 100, h: 34, label: 'Client', visible: true },
			{ id: 'sv', kind: 'box', x: 240, y: 8, w: 100, h: 34, label: 'Server', visible: true },
			lifeline('lc', 70, 46, 236), lifeline('ls', 290, 46, 236),
			{ id: 'm1', kind: 'edge', from: { x: 72, y: 74 }, to: { x: 288, y: 92 }, label: 'SYN' },
			{ id: 'm2', kind: 'edge', from: { x: 288, y: 116 }, to: { x: 72, y: 134 }, label: 'SYN-ACK', tone: 'accent' },
			{ id: 'm3', kind: 'edge', from: { x: 72, y: 158 }, to: { x: 288, y: 176 }, label: 'ACK' },
			{ id: 'm4', kind: 'edge', from: { x: 72, y: 204 }, to: { x: 288, y: 222 }, label: 'HTTP request', tone: 'warn' },
			{ id: 'm5', kind: 'edge', from: { x: 288, y: 244 }, to: { x: 72, y: 262 }, label: 'HTTP response', tone: 'accent' }
		],
		steps: [
			{ say: 'Before any data flows, TCP sets up a connection with a three-step handshake. Both sides confirm that the other is there and ready.', focus: ['cl', 'sv'] },
			{ say: 'SYN: the client says "I want to talk" and sends a starting sequence number.', show: ['m1'], pulse: ['cl'] },
			{ say: 'SYN-ACK: the server agrees, acknowledges the client\'s number and sends its own.', show: ['m2'], pulse: ['sv'] },
			{ say: 'ACK: the client confirms. The connection is open, and the setup cost one round trip before any data.', show: ['m3'], pulse: ['cl'] },
			{ say: 'Only now does the HTTP request go out. (For HTTPS, a TLS handshake happens right after the TCP one.)', show: ['m4'], pulse: ['sv'] },
			{ say: 'TCP numbers every byte and resends what is lost, so data arrives complete and in order. UDP skips the handshake and guarantees, which suits live video and games.', show: ['m5'], pulse: ['cl'] }
		]
	},
	{
		id: 'cs-tls-handshake',
		topic: 'cs',
		group: 'networking',
		title: 'The TLS handshake',
		blurb: 'How do two strangers agree on a secret over a public network?',
		stage: { w: 360, h: 290 },
		nodes: [
			{ id: 'cl', kind: 'box', x: 20, y: 8, w: 100, h: 34, label: 'Browser', visible: true },
			{ id: 'sv', kind: 'box', x: 240, y: 8, w: 100, h: 34, label: 'Server', visible: true },
			lifeline('lc', 70, 46, 236), lifeline('ls', 290, 46, 236),
			{ id: 'm1', kind: 'edge', from: { x: 72, y: 72 }, to: { x: 288, y: 88 }, label: 'ClientHello' },
			{ id: 'm2', kind: 'edge', from: { x: 288, y: 112 }, to: { x: 72, y: 128 }, label: 'ServerHello + certificate', tone: 'accent' },
			{ id: 'ck', kind: 'text', x: 84, y: 152, text: 'Browser checks the certificate', w: 190, size: 'sm', tone: 'accent' },
			{ id: 'm3', kind: 'edge', from: { x: 72, y: 178 }, to: { x: 288, y: 194 }, label: 'Finished' },
			{ id: 'm4', kind: 'edge', from: { x: 288, y: 214 }, to: { x: 72, y: 230 }, label: 'Finished', tone: 'accent' },
			{ id: 'm5', kind: 'edge', from: { x: 72, y: 262 }, to: { x: 288, y: 262 }, label: 'encrypted data', tone: 'accent' }
		],
		steps: [
			{ say: 'TLS makes HTTPS private. After TCP connects, the browser and server run a handshake to agree how to encrypt and to prove the server is genuine.', focus: ['cl', 'sv'] },
			{ say: 'ClientHello: the browser lists the TLS versions and ciphers it supports and sends its half of a key exchange.', show: ['m1'], pulse: ['cl'] },
			{ say: 'ServerHello: the server picks the options, sends its half of the key exchange and its certificate.', show: ['m2'], pulse: ['sv'] },
			{ say: 'The browser checks the certificate: is it signed by an authority it trusts, for exactly this domain, and not expired? If not, it shows a warning.', show: ['ck'], pulse: ['ck'] },
			{ say: 'Both sides now combine the two key halves into the same secret key without ever sending it. Each sends Finished to prove it worked.', show: ['m3', 'm4'], hide: ['ck'] },
			{ say: 'From here everything is encrypted with fast symmetric keys. TLS 1.3 needs only one round trip for all of this.', show: ['m5'], focus: ['m5'] }
		]
	},

	// ───────── memory-hierarchy-and-caching ─────────
	{
		id: 'cs-latency-ladder',
		topic: 'cs',
		group: 'memory-hierarchy-and-caching',
		title: 'The latency ladder',
		blurb: 'How much slower is each place data can live?',
		stage: { w: 360, h: 262 },
		nodes: [
			{ id: 'hd', kind: 'text', x: 8, y: 18, text: 'Log scale: a longer bar means orders of magnitude slower', size: 'sm', visible: true },
			{ id: 'l0', kind: 'text', x: 8, y: 53, text: 'L1 cache' }, { id: 'c0', kind: 'text', x: 8, y: 69, text: '1 ns', size: 'sm' }, { id: 'r0', kind: 'box', x: 80, y: 42, w: 16, h: 22, label: '', tone: 'accent' },
			{ id: 'l1', kind: 'text', x: 8, y: 103, text: 'RAM' }, { id: 'c1', kind: 'text', x: 8, y: 119, text: '100 ns', size: 'sm' }, { id: 'r1', kind: 'box', x: 80, y: 92, w: 74, h: 22, label: '' },
			{ id: 'l2', kind: 'text', x: 8, y: 153 , text: 'SSD' }, { id: 'c2', kind: 'text', x: 8, y: 169, text: '100 µs', size: 'sm' }, { id: 'r2', kind: 'box', x: 80, y: 142, w: 161, h: 22, label: '', tone: 'warn' },
			{ id: 'l3', kind: 'text', x: 8, y: 203, text: 'Network' }, { id: 'c3', kind: 'text', x: 8, y: 219, text: '100 ms', size: 'sm' }, { id: 'r3', kind: 'box', x: 80, y: 192, w: 248, h: 22, label: '', tone: 'neg' },
			{ id: 'sc', kind: 'text', x: 8, y: 240, text: 'Scaled so an L1 hit is 1 second: RAM 1.7 minutes, SSD 1.2 days, a cross-ocean request 3 years.', w: 344, size: 'sm' }
		],
		steps: [
			{ say: 'Fast memory is small and expensive, big memory is slow and cheap, so computers stack layers. The fastest is the CPU cache: about a nanosecond for an L1 hit.', show: ['l0', 'c0', 'r0'], focus: ['r0'] },
			{ say: 'Main memory (RAM) is about 100 times slower: roughly 100 nanoseconds.', show: ['l1', 'c1', 'r1'], focus: ['r1'] },
			{ say: 'An SSD read takes around 100 microseconds, another thousand times slower than RAM.', show: ['l2', 'c2', 'r2'], focus: ['r2'] },
			{ say: 'A network round trip across an ocean takes around 100 milliseconds, a thousand times slower again. These are rough, order-of-magnitude figures.', show: ['l3', 'c3', 'r3'], focus: ['r3'] },
			{ say: 'Scale it to human time: if an L1 hit took 1 second, RAM would take about 1.7 minutes, an SSD read about 1.2 days and the ocean trip about 3 years.', show: ['sc'], set: { c0: { text: '1 second' }, c1: { text: '1.7 minutes' }, c2: { text: '1.2 days' }, c3: { text: '3 years' } }, focus: ['sc'] },
			{ say: 'That is why caches exist at every level: browsers, CDNs, databases and Redis all keep a copy close, so most requests avoid the slow trip.', focus: ['r0', 'r3'] }
		]
	},

	// ───────── compilers-and-runtimes ─────────
	{
		id: 'cs-compile-pipeline',
		topic: 'cs',
		group: 'compilers-and-runtimes',
		title: 'From source code to running code',
		blurb: 'What happens between typing code and the CPU running it?',
		stage: { w: 360, h: 312 },
		nodes: [
			{ id: 'src', kind: 'box', x: 70, y: 14, w: 220, h: 38, label: 'Source code', sub: 'let x = 1 + 2 * 3;', visible: true },
			{ id: 'tok', kind: 'box', x: 70, y: 82, w: 220, h: 38, label: 'Tokens', sub: 'let | x | = | 1 | + | 2 | * | 3' },
			{ id: 'ast', kind: 'box', x: 70, y: 150, w: 220, h: 38, label: 'Syntax tree (AST)', sub: 'x = +(1, *(2, 3))' },
			{ id: 'byc', kind: 'box', x: 70, y: 218, w: 220, h: 38, label: 'Bytecode', sub: 'LOAD 1, LOAD 2, LOAD 3, MUL, ADD' },
			{ id: 'mac', kind: 'box', x: 70, y: 286, w: 220, h: 24, label: 'Machine code', tone: 'accent' },
			{ id: 'e1', kind: 'edge', from: 'src', to: 'tok', label: 'lex' }, { id: 'e2', kind: 'edge', from: 'tok', to: 'ast', label: 'parse' },
			{ id: 'e3', kind: 'edge', from: 'ast', to: 'byc', label: 'compile' }, { id: 'e4', kind: 'edge', from: 'byc', to: 'mac', label: 'JIT' }
		],
		steps: [
			{ say: 'Code you write is just text. Before it can run, a compiler or interpreter turns it into something the CPU understands.', focus: ['src'] },
			{ say: 'Lexing splits the text into tokens: keywords, names, numbers and symbols.', show: ['tok', 'e1'], pulse: ['tok'] },
			{ say: 'Parsing arranges the tokens into a tree that captures structure. Here 2 * 3 is grouped first, because multiplication binds tighter than addition.', show: ['ast', 'e2'], pulse: ['ast'] },
			{ say: 'The tree is lowered to bytecode, a compact instruction list for a virtual machine. JavaScript engines and Python do this.', show: ['byc', 'e3'], pulse: ['byc'] },
			{ say: 'Hot code, run many times, is compiled to real machine code while the program runs: JIT compilation. C, Rust and Go compile everything ahead of time instead.', show: ['mac', 'e4'], set: { mac: { label: 'Machine code (hot paths only)' } }, pulse: ['mac'] },
			{ say: 'TypeScript sits at the front of this pipeline: its checker works on the tree, then types are erased and plain JavaScript continues through the same stages.', focus: ['ast'] }
		]
	}
];
