import type { Scene, SceneNode, Tone } from '../../types';

/** Row of equal boxes: array slots, queue positions. Ids are prefix0, prefix1, ... */
const cells = (prefix: string, x: number, y: number, vals: string[], w = 40, h = 32, gap = 4, visible = true, tone?: Tone): SceneNode[] =>
	vals.map((v, i) => ({ id: `${prefix}${i}`, kind: 'box', x: x + i * (w + gap), y, w, h, label: v, visible, tone }));

/** Computer science lessons, part 1: bits and text, Big-O, arrays, linked lists, stacks and queues. */
export const csPart1: Scene[] = [
	// ───────── bits-and-text ─────────
	{
		id: 'cs-binary-counting',
		topic: 'cs',
		group: 'bits-and-text',
		title: 'Counting in binary, and overflow',
		blurb: 'How do four bits count, and what happens past the top?',
		stage: { w: 360, h: 230 },
		nodes: [
			{ id: 'hd', kind: 'text', x: 8, y: 22, text: 'A 4-bit unsigned number', visible: true },
			{ id: 'w3', kind: 'text', x: 50, y: 58, text: '8', anchor: 'middle', size: 'sm', visible: true },
			{ id: 'w2', kind: 'text', x: 114, y: 58, text: '4', anchor: 'middle', size: 'sm', visible: true },
			{ id: 'w1', kind: 'text', x: 178, y: 58, text: '2', anchor: 'middle', size: 'sm', visible: true },
			{ id: 'w0', kind: 'text', x: 242, y: 58, text: '1', anchor: 'middle', size: 'sm', visible: true },
			// b3 is the leftmost cell (weight 8) and b0 the rightmost (weight 1), matching the w3..w0 labels above and the usual way of writing binary.
			...[3, 2, 1, 0].map<SceneNode>((k) => ({ id: `b${k}`, kind: 'box', x: 24 + (3 - k) * 64, y: 66, w: 52, h: 44, label: '0', visible: true })),
			{ id: 'dec', kind: 'box', x: 24, y: 128, w: 244, h: 40, label: 'decimal 0', visible: true },
			{ id: 'note', kind: 'text', x: 8, y: 204, text: 'An unsigned 32-bit integer wraps after 4,294,967,295.', w: 340, size: 'sm' }
		],
		steps: [
			{ say: 'Computers store everything as bits, each 0 or 1. Every position is worth twice the one to its right: 8, 4, 2 and 1.', focus: ['b0', 'b1', 'b2', 'b3'] },
			{ say: 'Start at 0000. Counting up, the rightmost bit flips first: 0001 is 1.', set: { b3: { label: '0' }, b2: { label: '0' }, b1: { label: '0' }, b0: { label: '1', tone: 'accent' }, dec: { label: 'decimal 1' } }, pulse: ['b0'] },
			{ say: 'At 2 the right bit carries over, exactly like carrying a 1 in decimal, only with two digits instead of ten: 0010.', set: { b1: { label: '1', tone: 'accent' }, b0: { label: '0', tone: 'neutral' }, dec: { label: 'decimal 2' } }, pulse: ['b1'] },
			{ say: '0101 has the 4 and the 1 switched on, so 4 + 1 = 5. Any number is just the sum of the weights that are on.', set: { b2: { label: '1', tone: 'accent' }, b1: { label: '0', tone: 'neutral' }, b0: { label: '1', tone: 'accent' }, dec: { label: 'decimal 5' } }, pulse: ['b2'] },
			{ say: 'All four bits on is 1111: 8 + 4 + 2 + 1 = 15, the largest number that fits in 4 bits.', set: { b3: { label: '1', tone: 'accent' }, b2: { label: '1', tone: 'accent' }, b1: { label: '1', tone: 'accent' }, b0: { label: '1', tone: 'accent' }, dec: { label: 'decimal 15', tone: 'accent' } }, pulse: ['dec'] },
			{ say: 'Add one more and there is nowhere to carry to. The value wraps back to 0000. This is overflow, a classic bug in fixed-size integers.', set: { b3: { label: '0', tone: 'neg' }, b2: { label: '0', tone: 'neg' }, b1: { label: '0', tone: 'neg' }, b0: { label: '0', tone: 'neg' }, dec: { label: 'decimal 0 (wrapped)', tone: 'neg' } }, show: ['note'], focus: ['dec'] }
		]
	},
	{
		id: 'cs-utf8-bytes',
		topic: 'cs',
		group: 'bits-and-text',
		title: 'Text as bytes: UTF-8',
		blurb: 'Why can a string have 4 characters but 5 bytes?',
		stage: { w: 360, h: 280 },
		nodes: [
			{ id: 't', kind: 'table', x: 8, y: 10, title: 'UTF-8 encoding', colW: 112, cols: ['character', 'code point', 'UTF-8 bytes'], rows: [], visible: true },
			{
				id: 'd', kind: 'doc', x: 8, y: 190, w: 344, title: 'JavaScript', visible: false,
				lines: ["const s = 'café';", 's.length                            // 4', 'new TextEncoder().encode(s).length  // 5']
			}
		],
		steps: [
			{ say: 'Text is stored as numbers. Unicode gives every character a number called a code point, such as U+0041 for the letter A.', set: { t: { rows: [['A', 'U+0041', '41']], hl: [0] } } },
			{ say: 'UTF-8 turns a code point into bytes. Plain English letters take one byte, identical to old ASCII.', focus: ['t'] },
			{ say: 'An accented letter such as é (U+00E9) does not fit in one byte, so UTF-8 uses two: C3 A9.', set: { t: { rows: [['A', 'U+0041', '41'], ['é', 'U+00E9', 'C3 A9']], hl: [1] } } },
			{ say: 'The euro sign needs three bytes: E2 82 AC.', set: { t: { rows: [['A', 'U+0041', '41'], ['é', 'U+00E9', 'C3 A9'], ['€', 'U+20AC', 'E2 82 AC']], hl: [2] } } },
			{ say: 'An emoji such as the smiling face (U+1F600) takes four bytes: F0 9F 98 80. UTF-8 uses between one and four bytes per character.', set: { t: { rows: [['A', 'U+0041', '41'], ['é', 'U+00E9', 'C3 A9'], ['€', 'U+20AC', 'E2 82 AC'], ['smiling face', 'U+1F600', 'F0 9F 98 80']], hl: [3] } } },
			{ say: 'So the number of characters and the number of bytes can differ. The word café has 4 characters but 5 bytes.', show: ['d'], set: { t: { hl: [] } }, focus: ['d'] }
		]
	},

	// ───────── big-o ─────────
	{
		id: 'cs-big-o-growth',
		topic: 'cs',
		group: 'big-o',
		title: 'How the work grows with n',
		blurb: 'What do O(1), O(log n), O(n) and O(n²) look like?',
		stage: { w: 360, h: 262 },
		nodes: [
			{ id: 'n', kind: 'text', x: 8, y: 20, text: 'n = 4 items. Bar length = steps.', visible: true },
			{ id: 'l0', kind: 'text', x: 8, y: 49, text: 'O(1)' }, { id: 'c0', kind: 'text', x: 8, y: 65, text: '1 step', size: 'sm' }, { id: 'r0', kind: 'box', x: 80, y: 38, w: 4, h: 22, label: '', tone: 'accent' },
			{ id: 'l1', kind: 'text', x: 8, y: 93, text: 'O(log n)' }, { id: 'c1', kind: 'text', x: 8, y: 109, text: '2 steps', size: 'sm' }, { id: 'r1', kind: 'box', x: 80, y: 82, w: 8, h: 22, label: '', tone: 'accent' },
			{ id: 'l2', kind: 'text', x: 8, y: 137, text: 'O(n)' }, { id: 'c2', kind: 'text', x: 8, y: 153, text: '4 steps', size: 'sm' }, { id: 'r2', kind: 'box', x: 80, y: 126, w: 16, h: 22, label: '', tone: 'neutral' },
			{ id: 'l3', kind: 'text', x: 8, y: 181, text: 'O(n log n)' }, { id: 'c3', kind: 'text', x: 8, y: 197, text: '8 steps', size: 'sm' }, { id: 'r3', kind: 'box', x: 80, y: 170, w: 32, h: 22, label: '', tone: 'warn' },
			{ id: 'l4', kind: 'text', x: 8, y: 225, text: 'O(n²)' }, { id: 'c4', kind: 'text', x: 8, y: 241, text: '16 steps', size: 'sm' }, { id: 'r4', kind: 'box', x: 80, y: 214, w: 64, h: 22, label: '', tone: 'neg' }
		],
		steps: [
			{ say: 'Big-O describes how the work grows as the input grows. Here n is the number of items (4) and each bar counts the steps. O(1) is constant: one step, whatever n is.', show: ['l0', 'c0', 'r0'], focus: ['r0'] },
			{ say: 'O(log n) grows very slowly: doubling n adds just one step. This is why binary search is so fast.', show: ['l1', 'c1', 'r1'], focus: ['r1'] },
			{ say: 'O(n) grows in step with n: 4 items, 4 steps. A single loop over the data.', show: ['l2', 'c2', 'r2'], focus: ['r2'] },
			{ say: 'O(n log n) is the cost of good sorting: 8 steps for 4 items.', show: ['l3', 'c3', 'r3'], focus: ['r3'] },
			{ say: 'O(n²) means a loop inside a loop: 4 items cost 16 steps.', show: ['l4', 'c4', 'r4'], focus: ['r4'] },
			{
				say: 'Now double n to 8. Constant stays at 1, log n gains one step, linear doubles, n log n triples to 24, and n squared quadruples to 64.',
				set: {
					n: { text: 'n = 8 items. Bar length = steps.' },
					r1: { w: 12 }, r2: { w: 32 }, r3: { w: 96 }, r4: { w: 256 },
					c1: { text: '3 steps' }, c2: { text: '8 steps' }, c3: { text: '24 steps' }, c4: { text: '64 steps' }
				},
				pulse: ['r4']
			},
			{ say: 'That is why O(n²) code feels fine in testing and crawls in production: the gap between the curves explodes as n grows.', focus: ['r2', 'r4'] }
		]
	},

	// ───────── arrays-and-memory ─────────
	{
		id: 'cs-array-insert-shift',
		topic: 'cs',
		group: 'arrays-and-memory',
		title: 'Appending vs inserting in an array',
		blurb: 'Why is push cheap and inserting at the front expensive?',
		stage: { w: 360, h: 200 },
		nodes: [
			{ id: 'op', kind: 'text', x: 8, y: 24, text: 'arr[3]  =  start + 3 x slot size', visible: true },
			...[0, 1, 2, 3, 4, 5, 6].map<SceneNode>((i) => ({ id: `i${i}`, kind: 'text', x: 8 + i * 44 + 20, y: 62, text: String(i), anchor: 'middle', size: 'sm', visible: true })),
			...cells('c', 8, 70, ['A', 'B', 'C', 'D', 'E', '', '']),
			{ id: 'cnt', kind: 'text', x: 8, y: 138, text: '', w: 340, size: 'sm', visible: true }
		],
		steps: [
			{ say: 'An array is a row of equal-sized slots in memory. That is why arr[3] is instant: the address is the start plus 3 times the slot size.', focus: ['c3'] },
			{ say: 'Appending is cheap: write into the next free slot. No other item has to move.', set: { op: { text: 'arr.push("F")' }, c5: { label: 'F', tone: 'accent' }, cnt: { text: 'Items moved: 0' } }, pulse: ['c5'] },
			{ say: 'Now insert X at index 1. That slot is taken, so everything from index 1 onward must shift one place to the right.', set: { op: { text: 'arr.splice(1, 0, "X")' } }, focus: ['c1', 'c2', 'c3', 'c4', 'c5'] },
			{ say: 'The shift starts from the end so that nothing is overwritten: F moves into the spare slot first.', set: { c6: { label: 'F', tone: 'warn' }, c5: { label: '', tone: 'neutral' }, cnt: { text: 'Items moved: 1' } }, pulse: ['c6'] },
			{ say: 'Then E, D, C and B each move one slot to the right.', set: { c5: { label: 'E', tone: 'warn' }, c4: { label: 'D', tone: 'warn' }, c3: { label: 'C', tone: 'warn' }, c2: { label: 'B', tone: 'warn' }, c1: { label: '', tone: 'neutral' }, cnt: { text: 'Items moved: 5' } } },
			{ say: 'The gap at index 1 is free at last, so X goes in.', set: { c1: { label: 'X', tone: 'accent' }, c2: { tone: 'neutral' }, c3: { tone: 'neutral' }, c4: { tone: 'neutral' }, c5: { tone: 'neutral' }, c6: { tone: 'neutral' } }, pulse: ['c1'] },
			{ say: 'Five items moved to insert one. Inserting near the front costs O(n), and so does deleting there. Appending at the end is O(1) on average.', focus: ['cnt'] }
		]
	},
	{
		id: 'cs-dynamic-array-growth',
		topic: 'cs',
		group: 'arrays-and-memory',
		title: 'How a dynamic array grows',
		blurb: 'What happens when a push finds the array full?',
		stage: { w: 360, h: 240 },
		nodes: [
			{ id: 'st', kind: 'text', x: 8, y: 22, text: 'length 4, capacity 4', visible: true },
			{ id: 'ol', kind: 'text', x: 8, y: 52, text: 'old block', size: 'sm', visible: true },
			...cells('o', 8, 60, ['1', '2', '3', '4'], 40, 32, 4, true, 'accent'),
			{ id: 'nl', kind: 'text', x: 8, y: 138, text: 'new block, twice the size', size: 'sm' },
			...cells('n', 8, 146, ['', '', '', '', '', '', '', ''], 36, 32, 4, false),
			{ id: 'note', kind: 'text', x: 8, y: 218, text: 'Growth is rare, so the average push stays O(1).', w: 340, size: 'sm' }
		],
		steps: [
			{ say: 'A dynamic array (a JavaScript array, a Python list) sits on a fixed block with a capacity. This one holds 4 items and is full.', focus: ['o0', 'o1', 'o2', 'o3'] },
			{ say: 'push(5): there is no spare slot, so the array has to grow before it can store the new item.', set: { st: { text: 'push(5): length 4, capacity 4, no room', tone: 'warn' } } },
			{ say: 'It allocates a new, bigger block. A common choice is to double the capacity.', show: ['nl', 'n0', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7'], set: { st: { text: 'allocate capacity 8' } } },
			{ say: 'Then it copies every old item across. This one copy touches all n items, so it costs O(n).', set: { n0: { label: '1', tone: 'accent' }, n1: { label: '2', tone: 'accent' }, n2: { label: '3', tone: 'accent' }, n3: { label: '4', tone: 'accent' }, st: { text: 'copy 4 items', tone: 'neutral' } } },
			{ say: 'The old block is freed and 5 goes into the next slot. Three slots are still free for the next pushes.', hide: ['o0', 'o1', 'o2', 'o3', 'ol'], set: { n4: { label: '5', tone: 'accent' }, st: { text: 'length 5, capacity 8' } }, pulse: ['n4'] },
			{ say: 'Growing is expensive but rare, because each growth buys many free pushes. Averaged over many pushes, each costs O(1). This is amortized O(1).', show: ['note'], focus: ['note'] }
		]
	},

	// ───────── linked-lists-stacks-queues ─────────
	{
		id: 'cs-linked-list-insert',
		topic: 'cs',
		group: 'linked-lists-stacks-queues',
		title: 'A linked list and pointer rewiring',
		blurb: 'Why is reaching item k slow but inserting after a node fast?',
		stage: { w: 360, h: 230 },
		nodes: [
			{ id: 'hd', kind: 'text', x: 44, y: 56, text: 'head', anchor: 'middle', size: 'sm', visible: true },
			{ id: 'a', kind: 'box', x: 12, y: 66, w: 64, h: 44, label: 'A', sub: 'next', visible: true },
			{ id: 'b', kind: 'box', x: 112, y: 66, w: 64, h: 44, label: 'B', sub: 'next', visible: true },
			{ id: 'c', kind: 'box', x: 212, y: 66, w: 64, h: 44, label: 'C', sub: 'next', visible: true },
			{ id: 'nl', kind: 'text', x: 312, y: 94, text: 'null', anchor: 'middle', size: 'sm', visible: true },
			{ id: 'ab', kind: 'edge', from: 'a', to: 'b', visible: true },
			{ id: 'bc', kind: 'edge', from: 'b', to: 'c', visible: true },
			{ id: 'tok', kind: 'token', x: 44, y: 142, label: 'at A' },
			{ id: 'x', kind: 'box', x: 112, y: 168, w: 64, h: 44, label: 'X', sub: 'new node', tone: 'accent' },
			{ id: 'xb', kind: 'edge', from: 'x', to: 'b', tone: 'accent' },
			{ id: 'ax', kind: 'edge', from: 'a', to: 'x', tone: 'accent' }
		],
		steps: [
			{ say: 'A linked list stores each item in its own node, and every node points to the next one. Nodes can sit anywhere in memory.', focus: ['a', 'b', 'c'] },
			{ say: 'To read the third item you must start at the head. There is no arr[2] shortcut, because nothing says where node 3 lives.', show: ['tok'], focus: ['tok'] },
			{ say: 'Follow the pointer from A to B...', move: { tok: { x: 144, y: 142 } }, set: { tok: { label: 'at B' } } },
			{ say: '...and again from B to C. Reaching item k takes k hops, so access is O(n).', move: { tok: { x: 244, y: 142 } }, set: { tok: { label: 'at C' } } },
			{ say: 'Inserting is a different story. First create the new node X and make it point at B, the node it will come before.', hide: ['tok'], show: ['x', 'xb'], focus: ['x'] },
			{ say: 'Then make A point at X instead of B. The old A to B link is gone.', hide: ['ab'], show: ['ax'], pulse: ['x'] },
			{ say: 'Two pointer updates and no shifting: inserting after a node you already hold is O(1). The list is now A, X, B, C.', focus: ['a', 'x', 'b', 'c'] }
		]
	},
	{
		id: 'cs-stack-lifo',
		topic: 'cs',
		group: 'linked-lists-stacks-queues',
		title: 'A stack: last in, first out',
		blurb: 'Why does the newest item come out first?',
		stage: { w: 360, h: 250 },
		nodes: [
			{ id: 'fl', kind: 'box', x: 110, y: 210, w: 140, h: 24, label: 'bottom', visible: true },
			{ id: 's1', kind: 'box', x: 120, y: 172, w: 120, h: 34, label: 'A' },
			{ id: 's2', kind: 'box', x: 120, y: 132, w: 120, h: 34, label: 'B' },
			{ id: 's3', kind: 'box', x: 120, y: 92, w: 120, h: 34, label: 'C' },
			{ id: 'tp', kind: 'text', x: 256, y: 194, text: 'top', size: 'sm' },
			{ id: 'out', kind: 'box', x: 8, y: 92, w: 96, h: 34, label: 'returned C', tone: 'accent' },
			{ id: 'nt', kind: 'text', x: 8, y: 20, text: 'push adds on top. pop removes from the top.', w: 340, visible: true }
		],
		steps: [
			{ say: 'A stack is last in, first out (LIFO), like a pile of plates: you only ever touch the top one.', focus: ['nt'] },
			{ say: "push('A') puts A on top of the empty stack.", show: ['s1', 'tp'], pulse: ['s1'] },
			{ say: "push('B') and push('C'): each new item lands on top of the previous one.", show: ['s2', 's3'], move: { tp: { x: 256, y: 114 } }, pulse: ['s3'] },
			{ say: 'pop() removes the top item and hands it back: C. The last one in is the first one out.', hide: ['s3'], show: ['out'], move: { tp: { x: 256, y: 154 } }, set: { out: { label: 'returned C' } } },
			{ say: 'pop() again returns B. A has to wait until everything above it is gone.', hide: ['s2'], move: { tp: { x: 256, y: 194 } }, set: { out: { label: 'returned B' } }, pulse: ['out'] },
			{ say: 'Stacks are everywhere: the call stack of function calls, undo history and the back button. push and pop are both O(1).', focus: ['s1'] }
		]
	},
	{
		id: 'cs-queue-fifo',
		topic: 'cs',
		group: 'linked-lists-stacks-queues',
		title: 'A queue: first in, first out',
		blurb: 'Who gets served first in a queue?',
		stage: { w: 360, h: 220 },
		nodes: [
			{ id: 'out', kind: 'box', x: 24, y: 24, w: 150, h: 34, label: 'dequeue gives A', tone: 'accent' },
			{ id: 'fr', kind: 'text', x: 54, y: 90, text: 'front', anchor: 'middle', size: 'sm', visible: true },
			{ id: 'qa', kind: 'box', x: 24, y: 100, w: 60, h: 44, label: 'A' },
			{ id: 'qb', kind: 'box', x: 92, y: 100, w: 60, h: 44, label: 'B' },
			{ id: 'qc', kind: 'box', x: 160, y: 100, w: 60, h: 44, label: 'C' },
			{ id: 'bk', kind: 'text', x: 54, y: 172, text: 'back', anchor: 'middle', size: 'sm' },
			{ id: 'nt', kind: 'text', x: 8, y: 204, text: 'A plain array would shift every item on dequeue; real queues avoid that.', w: 340, size: 'sm' }
		],
		steps: [
			{ say: 'A queue is first in, first out (FIFO), like a line at a shop. New items join at the back, and the item at the front is served next.', focus: ['fr'] },
			{ say: 'enqueue(A): A joins the empty queue, so it is both the front and the back.', show: ['qa', 'bk'], pulse: ['qa'] },
			{ say: 'enqueue(B) and enqueue(C): each newcomer goes behind the last one. The back marker moves with them.', show: ['qb', 'qc'], move: { bk: { x: 190, y: 172 } }, pulse: ['qc'] },
			{ say: 'dequeue() serves the front item, A, which leaves. B and C each move up one place.', show: ['out'], hide: ['qa'], move: { qb: { x: 24, y: 100 }, qc: { x: 92, y: 100 }, bk: { x: 122, y: 172 } }, set: { out: { label: 'dequeue gives A' } } },
			{ say: 'dequeue() again gives B. The order out is exactly the order in. Nobody can jump the line.', hide: ['qb'], move: { qc: { x: 24, y: 100 }, bk: { x: 54, y: 172 } }, set: { out: { label: 'dequeue gives B' } }, pulse: ['out'] },
			{ say: 'Task queues, message brokers and breadth-first search all use queues. Building one on a plain array means shifting items, so real ones use a linked list or a ring buffer.', show: ['nt'], focus: ['nt'] }
		]
	}
];
