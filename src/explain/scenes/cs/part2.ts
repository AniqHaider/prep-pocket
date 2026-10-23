import type { Scene, SceneNode, Tone } from '../../types';

const cells = (prefix: string, x: number, y: number, vals: string[], w = 40, h = 32, gap = 4, visible = true, tone?: Tone): SceneNode[] =>
	vals.map((v, i) => ({ id: `${prefix}${i}`, kind: 'box', x: x + i * (w + gap), y, w, h, label: v, visible, tone }));

/** A circular tree / graph node. */
const dot = (id: string, x: number, y: number, label: string, visible = false, tone?: Tone): SceneNode => ({ id, kind: 'box', x, y, w: 40, h: 40, label, shape: 'circle', visible, tone });

/** The small directed graph used by both search scenes: A to B and C, B to D and E, C to F. */
const graph = (): SceneNode[] => [
	dot('A', 160, 16, 'A', true), dot('B', 80, 84, 'B', true), dot('C', 240, 84, 'C', true),
	dot('D', 40, 152, 'D', true), dot('E', 120, 152, 'E', true), dot('F', 240, 152, 'F', true),
	{ id: 'eab', kind: 'edge', from: 'A', to: 'B', visible: true }, { id: 'eac', kind: 'edge', from: 'A', to: 'C', visible: true },
	{ id: 'ebd', kind: 'edge', from: 'B', to: 'D', visible: true }, { id: 'ebe', kind: 'edge', from: 'B', to: 'E', visible: true },
	{ id: 'ecf', kind: 'edge', from: 'C', to: 'F', visible: true }
];

/** Computer science lessons, part 2: hash tables, trees, heaps, graphs, sorting and searching. */
export const csPart2: Scene[] = [
	// ───────── hash-tables ─────────
	{
		id: 'cs-hash-collision',
		topic: 'cs',
		group: 'hash-tables',
		title: 'A hash table and a collision',
		blurb: 'How does a key find its bucket, and what if two share one?',
		stage: { w: 360, h: 262 },
		nodes: [
			{ id: 't', kind: 'table', x: 8, y: 34, title: 'buckets', colW: 90, cols: ['bucket', 'entries'], rows: [['0', ''], ['1', ''], ['2', ''], ['3', ''], ['4', '']], visible: true },
			{ id: 'calc', kind: 'text', x: 204, y: 76, text: '', w: 148 },
			{ id: 'note', kind: 'text', x: 8, y: 232, text: 'Load factor = items / buckets = 3 / 5 = 0.6.\nMany tables resize at about 0.75.', w: 340, size: 'sm' }
		],
		steps: [
			{ say: 'A hash table maps keys to values. It keeps an array of buckets and uses a hash function to choose the bucket for each key.', focus: ['t'] },
			{ say: "To store 'Asha', hash the key to a number (here 17, a made-up value) and take it modulo the 5 buckets: 17 mod 5 = 2. Asha goes in bucket 2.", show: ['calc'], set: { calc: { text: 'hash("Asha") = 17\n17 mod 5 = 2' }, t: { rows: [['0', ''], ['1', ''], ['2', 'Asha'], ['3', ''], ['4', '']], hl: [2] } } },
			{ say: "'Ben' hashes to 24, and 24 mod 5 = 4. Looking either key up repeats the same two steps, hash then jump, so it takes O(1) on average.", set: { calc: { text: 'hash("Ben") = 24\n24 mod 5 = 4' }, t: { rows: [['0', ''], ['1', ''], ['2', 'Asha'], ['3', ''], ['4', 'Ben']], hl: [4] } } },
			{ say: "'Chen' hashes to 32, and 32 mod 5 = 2: the same bucket as Asha. Two different keys in one bucket is a collision.", set: { calc: { text: 'hash("Chen") = 32\n32 mod 5 = 2', tone: 'warn' }, t: { hl: [2] } }, pulse: ['t'] },
			{ say: 'One common fix is chaining: each bucket holds a small list. Bucket 2 now holds Asha and Chen, and a lookup hashes, then scans that short list.', set: { calc: { tone: 'neutral' }, t: { rows: [['0', ''], ['1', ''], ['2', 'Asha, Chen'], ['3', ''], ['4', 'Ben']], hl: [2] } } },
			{ say: 'If buckets fill up, the lists grow long and lookups slide toward O(n). So tables watch their load factor and resize when it gets high.', show: ['note'], set: { t: { hl: [] } }, focus: ['note'] }
		]
	},

	// ───────── trees-and-bst ─────────
	{
		id: 'cs-bst-search-insert',
		topic: 'cs',
		group: 'trees-and-bst',
		title: 'Searching and inserting in a BST',
		blurb: 'How does a binary search tree find a value in a few steps?',
		stage: { w: 360, h: 270 },
		nodes: [
			{ id: 'q', kind: 'text', x: 8, y: 24, text: '' },
			dot('n8', 160, 24, '8', true), dot('n3', 90, 84, '3'), dot('n10', 230, 84, '10'), dot('n1', 50, 144, '1'), dot('n6', 130, 144, '6'), dot('n7', 170, 204, '7'),
			{ id: 'e83', kind: 'edge', from: 'n8', to: 'n3' }, { id: 'e810', kind: 'edge', from: 'n8', to: 'n10' },
			{ id: 'e31', kind: 'edge', from: 'n3', to: 'n1' }, { id: 'e36', kind: 'edge', from: 'n3', to: 'n6' },
			{ id: 'e67', kind: 'edge', from: 'n6', to: 'n7', tone: 'accent' }
		],
		steps: [
			{ say: 'A binary search tree keeps one rule at every node: smaller values go to the left, larger values to the right. Start with 8 at the root.', focus: ['n8'] },
			{ say: 'Insert 3: it is smaller than 8, so it goes left. Insert 10: it is larger, so it goes right.', show: ['n3', 'e83', 'n10', 'e810'], pulse: ['n3', 'n10'] },
			{ say: 'Insert 1 and 6. Both are smaller than 8, so they go under 3. Then 1 is smaller than 3 (left) and 6 is larger (right).', show: ['n1', 'e31', 'n6', 'e36'] },
			{ say: 'Now search for 6. Compare with the root, 8: 6 is smaller, so the whole right side can be ignored.', show: ['q'], set: { q: { text: 'search(6)' } }, focus: ['n8'] },
			{ say: 'At 3, 6 is larger, so go right. That also rules out 1.', focus: ['n3'] },
			{ say: 'Found 6 after 3 comparisons, in a tree of 5 nodes. Each step discards about half of what remains.', set: { n6: { tone: 'accent' } }, pulse: ['n6'] },
			{ say: 'Inserting 7 follows the same path: 8, 3, 6, and then it is larger than 6, so it becomes the right child of 6. Balanced trees keep this at O(log n).', set: { q: { text: 'insert(7)' } }, show: ['n7', 'e67'], pulse: ['n7'] }
		]
	},
	{
		id: 'cs-bst-degenerate',
		topic: 'cs',
		group: 'trees-and-bst',
		title: 'When a BST becomes a list',
		blurb: 'What happens if you insert sorted data?',
		stage: { w: 360, h: 270 },
		nodes: [
			dot('d1', 24, 16, '1', true), dot('d2', 64, 66, '2'), dot('d3', 104, 116, '3'), dot('d4', 144, 166, '4'), dot('d5', 184, 216, '5'),
			{ id: 'e12', kind: 'edge', from: 'd1', to: 'd2' }, { id: 'e23', kind: 'edge', from: 'd2', to: 'd3' }, { id: 'e34', kind: 'edge', from: 'd3', to: 'd4' }, { id: 'e45', kind: 'edge', from: 'd4', to: 'd5' },
			{ id: 'info', kind: 'text', x: 236, y: 110, text: '', w: 116 }
		],
		steps: [
			{ say: 'Insert the values 1, 2, 3, 4, 5 into an empty binary search tree, in that order. The first value becomes the root.', focus: ['d1'] },
			{ say: '2 is larger than 1, so it goes to the right of 1.', show: ['d2', 'e12'], pulse: ['d2'] },
			{ say: '3 is larger than 1 and larger than 2, so it goes to the right again.', show: ['d3', 'e23'], pulse: ['d3'] },
			{ say: 'The same happens for 4 and 5: every new value is the largest so far, so it always goes right.', show: ['d4', 'e34', 'd5', 'e45'], pulse: ['d5'] },
			{ say: 'The tree has become a chain, a linked list in disguise. Every node has only one child.', set: { d1: { tone: 'warn' }, d2: { tone: 'warn' }, d3: { tone: 'warn' }, d4: { tone: 'warn' }, d5: { tone: 'warn' } } },
			{ say: 'Searching for 5 now compares with every node: 5 comparisons for 5 values. That is O(n), not O(log n).', show: ['info'], set: { info: { text: 'search(5)\n5 comparisons', tone: 'neg' } }, focus: ['d5'] },
			{ say: 'Self-balancing trees (AVL, red-black) rotate nodes after inserts to keep the height near log n, even when the input arrives sorted.', set: { info: { text: 'balanced: about\nlog2(5), so 3', tone: 'accent' } } }
		]
	},

	// ───────── heaps-and-priority-queues ─────────
	{
		id: 'cs-heap-sift-up',
		topic: 'cs',
		group: 'heaps-and-priority-queues',
		title: 'Inserting into a min-heap',
		blurb: 'How does a new item bubble up to its place?',
		stage: { w: 360, h: 262 },
		nodes: [
			dot('h0', 160, 14, '2', true), dot('h1', 90, 68, '4', true), dot('h2', 230, 68, '3', true), dot('h3', 50, 122, '9', true), dot('h4', 130, 122, '6', true), dot('h5', 210, 122, '1'),
			{ id: 'e01', kind: 'edge', from: 'h0', to: 'h1', visible: true }, { id: 'e02', kind: 'edge', from: 'h0', to: 'h2', visible: true },
			{ id: 'e13', kind: 'edge', from: 'h1', to: 'h3', visible: true }, { id: 'e14', kind: 'edge', from: 'h1', to: 'h4', visible: true },
			{ id: 'e25', kind: 'edge', from: 'h2', to: 'h5' },
			...[0, 1, 2, 3, 4, 5].map<SceneNode>((i) => ({ id: `ix${i}`, kind: 'text', x: 16 + i * 48 + 22, y: 202, text: String(i), anchor: 'middle', size: 'sm', visible: true })),
			...cells('a', 16, 208, ['2', '4', '3', '9', '6', ''], 44, 32, 4, true)
		],
		steps: [
			{ say: 'A min-heap is a tree where every parent is smaller than its children, so the smallest sits at the top. It lives in an array (below): the parent of index i is at (i - 1) / 2, rounded down.', focus: ['h0'] },
			{ say: 'Insert 1. Put it in the next free slot at the end of the array, index 5. That makes it the right child of index 2, which holds 3.', show: ['h5', 'e25'], set: { a5: { label: '1', tone: 'accent' } }, focus: ['h5'] },
			{ say: '1 is smaller than its parent 3, which breaks the heap rule. Swap them.', set: { h5: { label: '3', tone: 'warn' }, h2: { label: '1', tone: 'accent' }, a5: { label: '3', tone: 'warn' }, a2: { label: '1', tone: 'accent' } }, pulse: ['h2'] },
			{ say: 'Compare again: 1 is smaller than its new parent, the root 2. Swap again.', set: { h2: { label: '2', tone: 'warn' }, h0: { label: '1', tone: 'accent' }, a2: { label: '2', tone: 'warn' }, a0: { label: '1', tone: 'accent' } }, pulse: ['h0'] },
			{ say: '1 is at the root and every parent is again no larger than its children. This bubbling up is called sift-up.', set: { h5: { tone: 'neutral' }, h2: { tone: 'neutral' }, a5: { tone: 'neutral' }, a2: { tone: 'neutral' } }, focus: ['h0'] },
			{ say: 'Sift-up climbs at most the height of the tree, so insert is O(log n). Peeking at the minimum is O(1), and removing it (sifting the last item down) is O(log n). That is a priority queue.', focus: ['h0', 'a0'] }
		]
	},

	// ───────── graphs-bfs-dfs ─────────
	{
		id: 'cs-bfs-wave',
		topic: 'cs',
		group: 'graphs-bfs-dfs',
		title: 'Breadth-first search: ring by ring',
		blurb: 'How does BFS spread out, and why does it find short paths?',
		stage: { w: 360, h: 256 },
		nodes: [
			...graph(),
			{ id: 'q', kind: 'text', x: 8, y: 224, text: 'queue: empty', w: 340, visible: true },
			{ id: 'ord', kind: 'text', x: 8, y: 244, text: 'visited order: none yet', w: 340, size: 'sm', visible: true }
		],
		steps: [
			{ say: 'A graph is nodes joined by edges: maps, social networks, dependencies. Breadth-first search (BFS) explores in rings, nearest nodes first, using a queue.', focus: ['A'] },
			{ say: 'Start at A. Mark it as visited and put it in the queue.', set: { A: { tone: 'accent' }, q: { text: 'queue: A' }, ord: { text: 'visited order: A' } }, pulse: ['A'] },
			{ say: "Take A out of the queue and look at its neighbours, B and C. Mark both and add them to the back.", set: { B: { tone: 'accent' }, C: { tone: 'accent' }, q: { text: 'queue: B, C' }, ord: { text: 'visited order: A, B, C' } }, pulse: ['B', 'C'] },
			{ say: 'Take B from the front: its neighbours D and E join the back of the queue.', set: { D: { tone: 'accent' }, E: { tone: 'accent' }, q: { text: 'queue: C, D, E' }, ord: { text: 'visited order: A, B, C, D, E' } }, pulse: ['D', 'E'] },
			{ say: 'Take C: F joins the queue. Nodes are handled in the order they were found, so the search grows evenly outward.', set: { F: { tone: 'accent' }, q: { text: 'queue: D, E, F' }, ord: { text: 'visited order: A, B, C, D, E, F' } }, pulse: ['F'] },
			{ say: 'BFS reaches every node using the fewest edges first, so it finds the shortest path in an unweighted graph. It costs O(V + E): each node and edge once.', focus: ['A', 'B', 'C'] }
		]
	},
	{
		id: 'cs-dfs-dive',
		topic: 'cs',
		group: 'graphs-bfs-dfs',
		title: 'Depth-first search: dive, then back up',
		blurb: 'How does DFS explore, and what does the stack do?',
		stage: { w: 360, h: 256 },
		nodes: [
			...graph(),
			{ id: 'q', kind: 'text', x: 8, y: 224, text: 'stack: empty', w: 340, visible: true },
			{ id: 'ord', kind: 'text', x: 8, y: 244, text: 'visited order: none yet', w: 340, size: 'sm', visible: true }
		],
		steps: [
			{ say: 'Depth-first search (DFS) goes as deep as it can along one path before backing up. It uses a stack, or recursion, which is the call stack.', focus: ['A'] },
			{ say: 'Start at A: visit it and put it on the stack.', set: { A: { tone: 'accent' }, q: { text: 'stack: A' }, ord: { text: 'visited order: A' } }, pulse: ['A'] },
			{ say: 'Go to A\'s first neighbour, B, then straight on to B\'s first neighbour, D. D has nowhere further to go.', set: { B: { tone: 'accent' }, D: { tone: 'accent' }, q: { text: 'stack: A, B, D' }, ord: { text: 'visited order: A, B, D' } }, pulse: ['D'] },
			{ say: 'Dead end, so back up to B (pop D) and try its next neighbour, E.', set: { E: { tone: 'accent' }, q: { text: 'stack: A, B, E' }, ord: { text: 'visited order: A, B, D, E' } }, pulse: ['E'] },
			{ say: 'E is a dead end too. Back up past B to A, which still has a neighbour left: C, and then C\'s neighbour F.', set: { C: { tone: 'accent' }, F: { tone: 'accent' }, q: { text: 'stack: A, C, F' }, ord: { text: 'visited order: A, B, D, E, C, F' } }, pulse: ['C', 'F'] },
			{ say: 'DFS also costs O(V + E). It powers cycle detection, build-order sorting and maze solving. Its path is not necessarily the shortest one.', focus: ['A'] }
		]
	},

	// ───────── sorting-and-searching ─────────
	{
		id: 'cs-merge-sort',
		topic: 'cs',
		group: 'sorting-and-searching',
		title: 'Merge sort: split, then merge',
		blurb: 'How does divide and conquer sort a list?',
		stage: { w: 360, h: 290 },
		nodes: [
			{ id: 'hd', kind: 'text', x: 8, y: 20, text: 'Sort [4, 2, 3, 1]', size: 'sm', visible: true },
			{ id: 'r0', kind: 'text', x: 180, y: 52, text: '[4, 2, 3, 1]', anchor: 'middle', size: 'lg', visible: true },
			{ id: 'r1a', kind: 'text', x: 100, y: 102, text: '[4, 2]', anchor: 'middle', size: 'lg' }, { id: 'r1b', kind: 'text', x: 260, y: 102, text: '[3, 1]', anchor: 'middle', size: 'lg' },
			{ id: 'r2a', kind: 'text', x: 55, y: 152, text: '[4]', anchor: 'middle', size: 'lg' }, { id: 'r2b', kind: 'text', x: 145, y: 152, text: '[2]', anchor: 'middle', size: 'lg' },
			{ id: 'r2c', kind: 'text', x: 215, y: 152, text: '[3]', anchor: 'middle', size: 'lg' }, { id: 'r2d', kind: 'text', x: 305, y: 152, text: '[1]', anchor: 'middle', size: 'lg' },
			{ id: 'm1a', kind: 'text', x: 100, y: 202, text: '[2, 4]', anchor: 'middle', size: 'lg', tone: 'accent' }, { id: 'm1b', kind: 'text', x: 260, y: 202, text: '[1, 3]', anchor: 'middle', size: 'lg', tone: 'accent' },
			{ id: 'm2', kind: 'text', x: 180, y: 252, text: '[1, 2, 3, 4]', anchor: 'middle', size: 'lg', tone: 'accent' },
			{ id: 'nt', kind: 'text', x: 8, y: 280, text: '', w: 340, size: 'sm' }
		],
		steps: [
			{ say: 'Merge sort is divide and conquer: split the list in half again and again until every piece has one item, then merge the pieces back together in order.', focus: ['r0'] },
			{ say: 'First split: [4, 2, 3, 1] becomes [4, 2] and [3, 1].', show: ['r1a', 'r1b'] },
			{ say: 'Split again, down to single items. A list of one item is already sorted.', show: ['r2a', 'r2b', 'r2c', 'r2d'] },
			{ say: 'Now merge neighbours. To merge [4] and [2], repeatedly take the smaller front item: first 2, then 4. That gives [2, 4].', show: ['m1a'], pulse: ['m1a'] },
			{ say: 'In the same way [3] and [1] merge into [1, 3].', show: ['m1b'], pulse: ['m1b'] },
			{ say: 'Merge [2, 4] with [1, 3]: compare the fronts 2 and 1 and take 1; then 2 and 3, take 2; then 4 and 3, take 3; then 4. The result is [1, 2, 3, 4].', show: ['m2'], pulse: ['m2'] },
			{ say: 'Halving gives log n levels and each level merges n items, so merge sort is O(n log n) in every case. It is stable but needs O(n) extra space.', show: ['nt'], set: { nt: { text: 'log n levels x n work per level = O(n log n)' } }, focus: ['m2'] }
		]
	},
	{
		id: 'cs-quicksort',
		topic: 'cs',
		group: 'sorting-and-searching',
		title: 'Quicksort: partition around a pivot',
		blurb: 'How does one pivot split a list, and when does it go wrong?',
		stage: { w: 360, h: 230 },
		nodes: [
			{ id: 'hd', kind: 'text', x: 8, y: 24, text: 'Sort [6, 3, 9, 2, 5]', size: 'sm', visible: true },
			...cells('q', 36, 90, ['6', '3', '9', '2', '5'], 48, 36, 8),
			{ id: 'pv', kind: 'text', x: 284, y: 150, text: 'pivot', anchor: 'middle', size: 'sm' },
			{ id: 'lt', kind: 'text', x: 88, y: 150, text: 'smaller than 5', anchor: 'middle', size: 'sm' },
			{ id: 'gt', kind: 'text', x: 256, y: 150, text: 'larger than 5', anchor: 'middle', size: 'sm' },
			{ id: 'nt', kind: 'text', x: 8, y: 204, text: '', w: 340, size: 'sm' }
		],
		steps: [
			{ say: 'Quicksort is also divide and conquer, but it does the hard work while splitting instead of while merging.', focus: ['q0', 'q1', 'q2', 'q3', 'q4'] },
			{ say: 'Pick a pivot. Here we take the last item, 5.', show: ['pv'], set: { q4: { tone: 'accent' } }, pulse: ['q4'] },
			{ say: 'Partition: move everything smaller than 5 to its left and everything larger to its right. The pivot lands between the two groups.', set: { q0: { label: '3' }, q1: { label: '2' }, q2: { label: '5', tone: 'accent' }, q3: { label: '9' }, q4: { label: '6', tone: 'neutral' } }, move: { pv: { x: 172, y: 150 } }, show: ['lt', 'gt'] },
			{ say: 'The pivot is now in its final position. Sort the left part [3, 2] and the right part [9, 6] the same way.', focus: ['q0', 'q1', 'q3', 'q4'] },
			{ say: 'Each part is split by its own pivot until the pieces hold one item. The whole list is now sorted, in place, with no big temporary array.', hide: ['pv', 'lt', 'gt'], set: { q0: { label: '2', tone: 'accent' }, q1: { label: '3', tone: 'accent' }, q2: { label: '5', tone: 'accent' }, q3: { label: '6', tone: 'accent' }, q4: { label: '9', tone: 'accent' } }, pulse: ['q2'] },
			{ say: 'On average the parts are balanced and the cost is O(n log n).', show: ['nt'], set: { nt: { text: 'Balanced splits: about log n levels, n work each.' } } },
			{ say: 'The worst case is O(n²): if every pivot is the smallest or largest item, such as the last item of already sorted data, the parts barely shrink. Real libraries pick pivots more carefully.', set: { nt: { text: 'Worst case: each split peels off one item, so n levels.', tone: 'warn' } } }
		]
	},
	{
		id: 'cs-binary-search',
		topic: 'cs',
		group: 'sorting-and-searching',
		title: 'Binary search: halve the range',
		blurb: 'How do you find an item in 4 checks out of 11?',
		stage: { w: 360, h: 200 },
		nodes: [
			{ id: 'tg', kind: 'text', x: 8, y: 24, text: 'Looking for 16 in a sorted list', visible: true },
			...cells('c', 8, 70, ['2', '5', '8', '12', '16', '23', '38', '45', '56', '72', '91'], 28, 32, 3),
			...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map<SceneNode>((i) => ({ id: `x${i}`, kind: 'text', x: 8 + i * 31 + 14, y: 116, text: String(i), anchor: 'middle', size: 'sm', visible: true })),
			{ id: 'mid', kind: 'token', x: 177, y: 146, label: 'mid' },
			{ id: 'rg', kind: 'text', x: 8, y: 184, text: 'range: indexes 0 to 10', size: 'sm' }
		],
		steps: [
			{ say: 'Binary search finds an item in a sorted list by halving the part that could still hold it. We look for 16. At first the whole list is possible.', show: ['rg'], set: { c0: { tone: 'accent' }, c1: { tone: 'accent' }, c2: { tone: 'accent' }, c3: { tone: 'accent' }, c4: { tone: 'accent' }, c5: { tone: 'accent' }, c6: { tone: 'accent' }, c7: { tone: 'accent' }, c8: { tone: 'accent' }, c9: { tone: 'accent' }, c10: { tone: 'accent' } } },
			{ say: 'Check the middle, index 5: it holds 23. 16 is smaller, so 23 and everything after it are ruled out.', show: ['mid'], set: { c5: { tone: 'neutral' }, c6: { tone: 'neutral' }, c7: { tone: 'neutral' }, c8: { tone: 'neutral' }, c9: { tone: 'neutral' }, c10: { tone: 'neutral' }, rg: { text: 'range: indexes 0 to 4' } }, focus: ['c5'] },
			{ say: 'The middle of indexes 0 to 4 is index 2: 8. 16 is bigger, so 8 and everything before it are out.', move: { mid: { x: 84, y: 146 } }, set: { c0: { tone: 'neutral' }, c1: { tone: 'neutral' }, c2: { tone: 'neutral' }, rg: { text: 'range: indexes 3 to 4' } }, focus: ['c2'] },
			{ say: 'The middle of indexes 3 to 4 is index 3: 12. 16 is bigger again, so only index 4 is left.', move: { mid: { x: 115, y: 146 } }, set: { c3: { tone: 'neutral' }, rg: { text: 'range: index 4' } }, focus: ['c3'] },
			{ say: 'Check index 4: it holds 16. Found, after 4 checks.', move: { mid: { x: 146, y: 146 } }, set: { c4: { tone: 'accent' }, rg: { text: 'found 16 at index 4' } }, pulse: ['c4'] },
			{ say: 'Each check halves the range, so a million items need only about 20 checks: O(log n). It only works because the list is sorted.', focus: ['rg'] }
		]
	}
];
