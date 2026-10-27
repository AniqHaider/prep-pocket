import type { DbTopic } from '../types';
import { netTopics } from './netTopics';

const md = (...lines: string[]) => lines.join('\n');

// `try` snippets are plain JavaScript run by the in-app JS playground: no imports, no DOM, deterministic output via console.log.
export const csTopics: DbTopic[] = [
	{
		id: 'bits-and-text',
		title: 'Bits, bytes and text',
		level: 'basic',
		summary: 'See how numbers, negative values and text are stored as bits and bytes.',
		scenes: ['cs-binary-counting', 'cs-utf8-bytes'],
		notes: md(
			'Computers store everything as **bits**, each 0 or 1. Eight bits make a **byte**. A bit position is worth twice the one to its right, so `1101` is 8 + 4 + 0 + 1 = 13. Hexadecimal is shorthand: one hex digit is exactly four bits, so `0xFF` is `1111 1111`.',
			'',
			'Fixed-size integers **overflow** when a result no longer fits: an unsigned byte goes from 255 back to 0. Negative numbers use **two\'s complement**: the top bit counts as a large negative weight, so a signed byte runs from -128 to 127 and 127 + 1 wraps to -128.',
			'',
			'Text is numbers too. **Unicode** gives each character a code point, and **UTF-8** stores it as one to four bytes: ASCII letters take one, `é` takes two, `€` three and most emoji four. So the length of a string and its size in bytes can differ.',
			'',
			'```js',
			"const s = 'café';",
			's.length;                               // 4 characters',
			'new TextEncoder().encode(s).length;     // 5 bytes',
			'```',
			'',
			'**Common trap:** JavaScript strings count UTF-16 code units, so an emoji has `.length` 2. Use `[...s].length` to count code points, or `Intl.Segmenter` when you need what a reader sees as one character.'
		),
		try: [
			{ label: 'Binary and hex', code: `console.log((13).toString(2), (255).toString(16), parseInt('1101', 2));\nconsole.log((-5 >>> 0).toString(2));` },
			{ label: 'Overflow in 8 bits', code: `const u8 = new Uint8Array([255]);\nu8[0] += 1;\nconsole.log('unsigned 255 + 1 =', u8[0]);\nconst i8 = new Int8Array([127]);\ni8[0] += 1;\nconsole.log('signed 127 + 1 =', i8[0]);` },
			{ label: 'Characters vs bytes', code: `const s = 'caf\\u00e9 \\u{1F600}';\nconsole.log('UTF-16 units:', s.length);\nconsole.log('code points:', [...s].length);\nconsole.log('UTF-8 bytes:', new TextEncoder().encode(s).length);` }
		]
	},
	{
		id: 'big-o',
		title: 'Big-O: how cost grows',
		level: 'basic',
		summary: 'Describe how the cost of code grows with its input, without a stopwatch.',
		scenes: ['cs-big-o-growth'],
		notes: md(
			'**Big-O** describes how the work grows as the input size n grows. It ignores constants and small terms, because for large n only the dominant term matters: 3n² + 20n + 5 is O(n²).',
			'',
			'The common classes, from best to worst:',
			'',
			'- **O(1)** constant: an array index, a hash lookup (on average).',
			'- **O(log n)**: binary search, where every step halves the problem.',
			'- **O(n)**: one pass over the data.',
			'- **O(n log n)**: good sorting.',
			'- **O(n²)**: a loop inside a loop over the same data.',
			'- **O(2ⁿ)**: trying every subset, such as naive Fibonacci.',
			'',
			'Big-O is about growth, not speed. An O(n) loop can beat an O(log n) one for small n, and constant factors, cache behaviour and I/O still matter. It usually describes the **worst case**; say "average" or "amortized" when you mean that.',
			'',
			'```js',
			'for (const a of items)       // O(n)',
			'  for (const b of items)     // times n = O(n^2)',
			'    compare(a, b);',
			'```',
			'',
			'**Common trap:** nested loops hide inside library calls. `items.includes(x)` inside a loop over `items` is O(n²), even though you wrote only one loop.'
		),
		try: [
			{ label: 'Count the steps', code: `for (const n of [10, 100, 1000]) {\n  let linear = 0, quadratic = 0;\n  for (let i = 0; i < n; i++) {\n    linear++;\n    for (let j = 0; j < n; j++) quadratic++;\n  }\n  console.log('n=' + n + ': linear ' + linear + ', quadratic ' + quadratic);\n}` },
			{ label: 'Halving to one', code: `let n = 1000000, steps = 0;\nwhile (n > 1) {\n  n = Math.floor(n / 2);\n  steps++;\n}\nconsole.log('halvings to reach 1 from a million:', steps);` }
		]
	},
	{
		id: 'arrays-and-memory',
		title: 'Arrays and memory',
		level: 'basic',
		summary: 'Understand why indexing is instant, inserting in the middle is slow, and push is cheap on average.',
		scenes: ['cs-array-insert-shift', 'cs-dynamic-array-growth'],
		notes: md(
			'An **array** stores equal-sized items in one contiguous block of memory. The address of item *i* is simply `start + i × size`, so reading `arr[i]` is **O(1)**: one calculation, however long the array is.',
			'',
			'The price is in the middle. Inserting or deleting at index *i* shifts every later item over by one, which is **O(n)**. Appending at the end is O(1) when there is spare room.',
			'',
			'Most languages hide a **dynamic array** behind this (JavaScript arrays, Python lists, Java `ArrayList`). When it fills up, it allocates a bigger block, copies everything across and carries on. One copy is O(n), but because the capacity grows by a constant factor each time, the average cost of an append stays O(1). This is called **amortized** O(1).',
			'',
			'Contiguous memory is also fast because CPUs load a whole cache line at once, so scanning in order is quick (see *Memory hierarchy*).',
			'',
			'```js',
			'const a = [1, 2, 3];',
			'a.push(4);          // cheap, usually',
			'a.splice(1, 0, 9);  // [1, 9, 2, 3, 4]: shifts 3 items',
			'```',
			'',
			'**Common trap:** JavaScript engines may store sparse or mixed arrays differently from this textbook picture. The costs above are the model; real engines add their own tricks.'
		),
		try: [
			{ label: 'Insert at front vs end', code: `const insertAt = (a, i, v) => {\n  let moves = 0;\n  for (let k = a.length; k > i; k--) { a[k] = a[k - 1]; moves++; }\n  a[i] = v;\n  return moves;\n};\nconst arr = [1, 2, 3, 4, 5];\nconsole.log('front insert moved', insertAt(arr, 0, 'x'), 'items');\nconsole.log('end insert moved', insertAt(arr, arr.length, 'y'), 'items');\nconsole.log(arr.join(','));` },
			{ label: 'Amortized growth', code: `let capacity = 1, length = 0, copies = 0;\nfor (let i = 0; i < 1000; i++) {\n  if (length === capacity) { copies += length; capacity *= 2; }\n  length++;\n}\nconsole.log('pushes:', length, 'capacity:', capacity);\nconsole.log('items copied in total:', copies);\nconsole.log('copies per push:', (copies / length).toFixed(2));` }
		]
	},
	{
		id: 'linked-lists-stacks-queues',
		title: 'Linked lists, stacks and queues',
		level: 'basic',
		summary: 'Know when pointers beat slots, and how stacks and queues control the order things come out.',
		scenes: ['cs-linked-list-insert', 'cs-stack-lifo', 'cs-queue-fifo'],
		notes: md(
			'A **linked list** stores each item in its own node, together with a pointer to the next one. Nodes can sit anywhere in memory. Inserting or removing after a node you already hold is **O(1)**: just rewire pointers. But there is no shortcut to item *k*: you walk from the head, so access is **O(n)**, and every hop is a likely cache miss.',
			'',
			'A **stack** is last in, first out (LIFO). `push` adds on top and `pop` removes the top, both O(1). The call stack, undo history and bracket matching all use stacks.',
			'',
			'A **queue** is first in, first out (FIFO). You enqueue at the back and dequeue from the front. Task queues, message brokers and breadth-first search use queues. Built naively on an array, dequeuing from the front shifts everything, so real queues use a linked list, a ring buffer or a moving head index.',
			'',
			'```js',
			'const stack = [];',
			"stack.push('a');",
			"stack.push('b');",
			"stack.pop();   // 'b'  (last in, first out)",
			'```',
			'',
			'**Common trap:** in practice arrays beat linked lists for most jobs, because contiguous memory is so cache-friendly. Reach for a linked list only when you really do many inserts and removals at positions you already hold.'
		),
		try: [
			{ label: 'Reverse a linked list', code: `const node = (v, next = null) => ({ v, next });\nconst toArray = (n) => { const out = []; for (; n; n = n.next) out.push(n.v); return out; };\nconst list = node(1, node(2, node(3)));\nconsole.log(toArray(list).join(' -> '));\nlet prev = null, cur = list;\nwhile (cur) { const next = cur.next; cur.next = prev; prev = cur; cur = next; }\nconsole.log(toArray(prev).join(' -> '));` },
			{ label: 'Balanced brackets with a stack', code: `const balanced = (s) => {\n  const stack = [], pairs = { ')': '(', ']': '[', '}': '{' };\n  for (const c of s) {\n    if ('([{'.includes(c)) stack.push(c);\n    else if (pairs[c] && stack.pop() !== pairs[c]) return false;\n  }\n  return stack.length === 0;\n};\nfor (const s of ['([]{})', '([)]', '((']) console.log(s, balanced(s));` },
			{ label: 'A queue with a head index', code: `const q = { items: [], head: 0 };\nconst enqueue = (v) => q.items.push(v);\nconst dequeue = () => q.items[q.head++];\nenqueue('a'); enqueue('b'); enqueue('c');\nconsole.log(dequeue(), dequeue());\nenqueue('d');\nconsole.log(dequeue(), dequeue());` }
		]
	},
	{
		id: 'hash-tables',
		title: 'Hash tables',
		level: 'basic',
		summary: 'See how a hash table finds a value in about one step, and what a collision is.',
		scenes: ['cs-hash-collision'],
		notes: md(
			'A **hash table** (JavaScript `Map`, Python `dict`, a plain object) maps keys to values. It keeps an array of **buckets** and a **hash function** that turns any key into a number. That number modulo the bucket count picks the bucket. Lookup is "hash, then jump": **O(1) on average**.',
			'',
			'Two different keys can land in the same bucket: a **collision**. One fix is **chaining**, where each bucket holds a small list. Another is **open addressing**, which probes for the next free slot. As the table fills, collisions get more common, so tables track the **load factor** (items divided by buckets) and **resize** and rehash when it passes a limit.',
			'',
			'A good hash function spreads keys evenly. In the worst case, when everything collides, a lookup degrades to O(n).',
			'',
			'```js',
			"const ages = new Map([['Asha', 31]]);",
			"ages.get('Asha');   // 31",
			"ages.has('Ben');    // false",
			'```',
			'',
			'**Common trap:** where a key\'s hash depends on its contents (Java\'s `HashMap` with a custom `hashCode`, for example), changing the key after inserting it makes the entry impossible to find. A JavaScript `Map` hashes objects by identity, so it does not have this problem.'
		),
		try: [
			{ label: 'Buckets and chaining', code: `const hash = (s, m) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % m;\nconst buckets = Array.from({ length: 5 }, () => []);\nfor (const k of ['Asha', 'Ben', 'Chen', 'Dara', 'Esi', 'Farid']) buckets[hash(k, 5)].push(k);\nbuckets.forEach((b, i) => console.log(i, b.join(', ') || '(empty)'));` },
			{ label: 'Map vs object keys', code: `const k1 = {}, k2 = {};\nconst obj = {};\nobj[k1] = 1;\nobj[k2] = 2;\nconsole.log('object keys:', Object.keys(obj).length, Object.keys(obj)[0]);\nconst map = new Map();\nmap.set(k1, 1);\nmap.set(k2, 2);\nconsole.log('map size:', map.size);` }
		]
	},
	{
		id: 'trees-and-bst',
		title: 'Trees and binary search trees',
		level: 'basic',
		summary: 'Use the binary-search-tree rule for fast search, and know when it collapses into a list.',
		scenes: ['cs-bst-search-insert', 'cs-bst-degenerate'],
		notes: md(
			'A **tree** is nodes with children and no cycles. The file system, the DOM and JSON are all trees. A **binary search tree** (BST) gives each node at most two children and keeps one rule: everything in the **left** subtree is smaller, everything in the **right** is larger.',
			'',
			'That rule makes search, insert and delete follow a single path from the root, discarding about half of the remaining tree at each step when the tree is **balanced**: **O(log n)**. An **in-order** walk (left, node, right) visits the values in sorted order.',
			'',
			'The catch is the shape. Insert 1, 2, 3, 4 in sorted order and every node goes right, so the tree is really a linked list and operations become **O(n)**. **Self-balancing** trees (AVL, red-black) rotate nodes during inserts to keep the height near log n. Databases use a wider relative, the **B-tree**, because each node maps to one disk page.',
			'',
			'```js',
			'// search follows one path',
			'function find(node, v) {',
			'  if (!node) return false;',
			'  if (v === node.v) return true;',
			'  return find(v < node.v ? node.left : node.right, v);',
			'}',
			'```',
			'',
			'**Common trap:** "O(log n)" assumes balance. An unbalanced BST fed sorted data is as slow as a list.'
		),
		try: [
			{ label: 'Search a BST', code: `const insert = (n, v) => !n ? { v, l: null, r: null } : v < n.v ? { ...n, l: insert(n.l, v) } : { ...n, r: insert(n.r, v) };\nlet root = null;\nfor (const v of [8, 3, 10, 1, 6, 14]) root = insert(root, v);\nconst find = (n, v, steps = 1) => !n ? { found: false, steps } : n.v === v ? { found: true, steps } : find(v < n.v ? n.l : n.r, v, steps + 1);\nconst show = (r) => (r.found ? 'found' : 'not found') + ' after ' + r.steps + ' comparisons';\nconsole.log('6:', show(find(root, 6)));\nconsole.log('7:', show(find(root, 7)));` },
			{ label: 'Sorted inserts make a list', code: `const insert = (n, v) => !n ? { v, l: null, r: null } : v < n.v ? { ...n, l: insert(n.l, v) } : { ...n, r: insert(n.r, v) };\nconst height = (n) => (n ? 1 + Math.max(height(n.l), height(n.r)) : 0);\nconst build = (vals) => vals.reduce(insert, null);\nconsole.log('sorted 1..7 height:', height(build([1, 2, 3, 4, 5, 6, 7])));\nconsole.log('balanced order height:', height(build([4, 2, 6, 1, 3, 5, 7])));` },
			{ label: 'In-order is sorted', code: `const insert = (n, v) => !n ? { v, l: null, r: null } : v < n.v ? { ...n, l: insert(n.l, v) } : { ...n, r: insert(n.r, v) };\nconst inorder = (n) => (n ? [...inorder(n.l), n.v, ...inorder(n.r)] : []);\nconst root = [8, 3, 10, 1, 6, 14, 4].reduce(insert, null);\nconsole.log(inorder(root).join(' '));` }
		]
	},
	{
		id: 'heaps-and-priority-queues',
		title: 'Heaps and priority queues',
		level: 'mid',
		summary: 'Always get the smallest (or largest) item fast, which is what schedulers and shortest-path searches need.',
		scenes: ['cs-heap-sift-up'],
		notes: md(
			'A **heap** is a tree where every parent is no larger than its children (a **min-heap**; flip it for a max-heap). The smallest item is always at the top, so peeking is **O(1)**. It is a **complete** tree, which lets it live in a plain array: the children of index *i* are at `2i + 1` and `2i + 2`, and the parent is at `floor((i - 1) / 2)`.',
			'',
			'**Insert** puts the new item at the end and **sifts up**, swapping with its parent while it is smaller. **Remove-min** takes the root, moves the last item to the top and **sifts down** by swapping with the smaller child. Both walk at most the height of the tree: **O(log n)**.',
			'',
			'A heap backs a **priority queue**: task schedulers, timers, Dijkstra\'s shortest-path algorithm and "top k" problems. Building a heap from n items takes O(n), and heapsort sorts in O(n log n).',
			'',
			'```js',
			'// parent and children of index i (0-based)',
			'const parent = (i) => Math.floor((i - 1) / 2);',
			'const kids = (i) => [2 * i + 1, 2 * i + 2];',
			'```',
			'',
			'**Common trap:** a heap is only partly ordered. The array is not sorted, and searching for an arbitrary value is still O(n).'
		),
		try: [
			{ label: 'A tiny min-heap', code: `class MinHeap {\n  a = [];\n  push(v) {\n    const a = this.a; a.push(v);\n    let i = a.length - 1;\n    while (i > 0) {\n      const p = Math.floor((i - 1) / 2);\n      if (a[p] <= a[i]) break;\n      [a[p], a[i]] = [a[i], a[p]]; i = p;\n    }\n  }\n  pop() {\n    const a = this.a, top = a[0], last = a.pop();\n    if (a.length) {\n      a[0] = last;\n      let i = 0;\n      for (;;) {\n        const l = 2 * i + 1, r = l + 1; let m = i;\n        if (l < a.length && a[l] < a[m]) m = l;\n        if (r < a.length && a[r] < a[m]) m = r;\n        if (m === i) break;\n        [a[m], a[i]] = [a[i], a[m]]; i = m;\n      }\n    }\n    return top;\n  }\n}\nconst h = new MinHeap();\n[5, 3, 8, 1, 9, 2].forEach((v) => h.push(v));\nconsole.log('array:', h.a.join(' '));\nconst out = [];\nwhile (h.a.length) out.push(h.pop());\nconsole.log('popped:', out.join(' '));` },
			{ label: 'Parent and child indexes', code: `for (let i = 1; i <= 6; i++) {\n  console.log('index', i, 'parent', Math.floor((i - 1) / 2), 'children', 2 * i + 1, 2 * i + 2);\n}` }
		]
	},
	{
		id: 'graphs-bfs-dfs',
		title: 'Graphs, BFS and DFS',
		level: 'mid',
		summary: 'Model connections as nodes and edges, and explore them ring by ring or deep first.',
		scenes: ['cs-bfs-wave', 'cs-dfs-dive'],
		notes: md(
			'A **graph** is nodes (vertices) joined by edges. Roads, social networks, package dependencies and web links are graphs. Edges can be **directed** or not, and may carry **weights**. You usually store one as an **adjacency list**: for each node, the list of its neighbours.',
			'',
			'**Breadth-first search (BFS)** visits nodes in rings around the start, using a **queue**. Because it reaches every node in the fewest edges first, it finds the **shortest path in an unweighted graph**.',
			'',
			'**Depth-first search (DFS)** follows one path as deep as it can before backing up, using a **stack** or recursion. It underlies cycle detection, topological sorting (build order) and maze solving.',
			'',
			'Both run in **O(V + E)**: each node and edge is handled once, as long as you remember which nodes you have **visited**.',
			'',
			'```js',
			"const graph = { A: ['B', 'C'], B: ['D'], C: [], D: [] };",
			'// BFS: queue = [A]; take A, add B and C; take B, add D ...',
			'```',
			'',
			'**Common trap:** forgetting the visited set. On a graph with a cycle, the search then loops forever.'
		),
		try: [
			{ label: 'BFS shortest path', code: `const graph = { A: ['B', 'C'], B: ['D', 'E'], C: ['F'], D: [], E: ['F'], F: [] };\nfunction shortest(from, to) {\n  const prev = { [from]: null }, queue = [from];\n  while (queue.length) {\n    const n = queue.shift();\n    if (n === to) break;\n    for (const m of graph[n]) if (!(m in prev)) { prev[m] = n; queue.push(m); }\n  }\n  const path = [];\n  for (let n = to; n; n = prev[n]) path.unshift(n);\n  return path;\n}\nconsole.log(shortest('A', 'F').join(' -> '));` },
			{ label: 'DFS visit order', code: `const graph = { A: ['B', 'C'], B: ['D', 'E'], C: ['F'], D: [], E: [], F: [] };\nconst seen = new Set(), order = [];\nfunction dfs(n) {\n  if (seen.has(n)) return;\n  seen.add(n); order.push(n);\n  graph[n].forEach(dfs);\n}\ndfs('A');\nconsole.log(order.join(' '));` }
		]
	},
	{
		id: 'sorting-and-searching',
		title: 'Sorting and binary search',
		level: 'mid',
		summary: 'Know what merge sort and quicksort cost, why binary search needs sorted data, and how JavaScript sorts.',
		scenes: ['cs-merge-sort', 'cs-quicksort', 'cs-binary-search'],
		notes: md(
			'**Merge sort** splits the list in half until the pieces have one item, then merges sorted pieces back together. It is **O(n log n)** in every case and **stable** (equal items keep their order), but needs O(n) extra space.',
			'',
			'**Quicksort** picks a pivot, moves smaller items left and larger ones right, then sorts each side. It averages **O(n log n)**, sorts in place and is usually fast in practice, but its worst case is **O(n²)** when pivots are poor, for example always taking the last item of an already sorted list. It is not stable. No comparison-based sort can beat O(n log n) in general.',
			'',
			'**Binary search** finds an item in a **sorted** array by checking the middle and discarding half each time: **O(log n)**, about 20 checks for a million items. On unsorted data it simply does not work.',
			'',
			'```js',
			'[10, 9, 1, 100].sort();                // [1, 10, 100, 9]  (compared as strings)',
			'[10, 9, 1, 100].sort((a, b) => a - b); // [1, 9, 10, 100]',
			'```',
			'',
			'**Common trap:** JavaScript\'s default `sort()` compares items as strings, so always pass a comparator for numbers. (Since ES2019, `Array.prototype.sort` is required to be stable.)'
		),
		try: [
			{ label: 'Merge sort', code: `let comparisons = 0;\nfunction mergeSort(a) {\n  if (a.length < 2) return a;\n  const mid = a.length >> 1, l = mergeSort(a.slice(0, mid)), r = mergeSort(a.slice(mid)), out = [];\n  let i = 0, j = 0;\n  while (i < l.length && j < r.length) { comparisons++; out.push(l[i] <= r[j] ? l[i++] : r[j++]); }\n  return out.concat(l.slice(i), r.slice(j));\n}\nconsole.log(mergeSort([5, 2, 8, 1, 9, 3, 7, 4]).join(' '));\nconsole.log('comparisons:', comparisons);` },
			{ label: 'Binary search', code: `const sorted = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91];\nlet lo = 0, hi = sorted.length - 1, checks = 0;\nwhile (lo <= hi) {\n  const mid = (lo + hi) >> 1;\n  checks++;\n  console.log('check index', mid, '=', sorted[mid]);\n  if (sorted[mid] === 16) { console.log('found after', checks, 'checks'); break; }\n  if (sorted[mid] < 16) lo = mid + 1; else hi = mid - 1;\n}` },
			{ label: 'The default sort is textual', code: `console.log(JSON.stringify([10, 9, 1, 100].sort()));\nconsole.log(JSON.stringify([10, 9, 1, 100].sort((a, b) => a - b)));` }
		]
	},
	{
		id: 'recursion-and-dp',
		title: 'Recursion and dynamic programming',
		level: 'mid',
		summary: 'Solve problems by calling yourself, and avoid repeating work with memoization.',
		scenes: ['cs-recursion-factorial', 'cs-fib-memo'],
		notes: md(
			'A **recursive** function solves a problem by calling itself on a smaller piece. It needs a **base case** that stops, and each call must move closer to it. Every call gets a **frame** on the **call stack**, so memory use grows with the depth. Run out and you get a **stack overflow**. Anything recursive can be rewritten with a loop and an explicit stack.',
			'',
			'Naive recursion can repeat work. `fib(n) = fib(n-1) + fib(n-2)` recomputes the same values again and again, which costs **O(2ⁿ)**. **Memoization** stores each answer the first time, so every value is computed once: **O(n)**. That trade of memory for time is the heart of **dynamic programming**: break a problem into overlapping subproblems, solve each once and reuse the results. It can run top-down (memoized recursion) or bottom-up (fill a table).',
			'',
			'```js',
			'const memo = new Map();',
			'function fib(n) {',
			'  if (n < 2) return n;',
			'  if (memo.has(n)) return memo.get(n);',
			'  const v = fib(n - 1) + fib(n - 2);',
			'  memo.set(n, v);',
			'  return v;',
			'}',
			'```',
			'',
			'**Common trap:** a missing or unreachable base case. Also, JavaScript engines do not guarantee tail-call optimization, so very deep recursion can overflow even when each call looks cheap.'
		),
		try: [
			{ label: 'Naive vs memoized Fibonacci', code: `let naiveCalls = 0;\nconst naive = (n) => { naiveCalls++; return n < 2 ? n : naive(n - 1) + naive(n - 2); };\nconsole.log('fib(20) =', naive(20), 'with', naiveCalls, 'calls');\nlet memoCalls = 0;\nconst memo = new Map();\nconst fast = (n) => { memoCalls++; if (n < 2) return n; if (memo.has(n)) return memo.get(n); const v = fast(n - 1) + fast(n - 2); memo.set(n, v); return v; };\nconsole.log('fib(20) =', fast(20), 'with', memoCalls, 'calls');` },
			{ label: 'Coin change (DP table)', code: `const coins = [1, 5, 10, 25], amount = 63;\nconst best = [0];\nfor (let a = 1; a <= amount; a++) {\n  best[a] = Math.min(...coins.filter((c) => c <= a).map((c) => best[a - c] + 1));\n}\nconsole.log('fewest coins for', amount, 'is', best[amount]);` },
			{ label: 'A stack overflow', code: `try {\n  (function loop() { loop(); })();\n} catch (e) {\n  console.log(e.name);\n}` }
		]
	},
	{
		id: 'stack-heap-and-gc',
		title: 'Stack, heap and garbage collection',
		level: 'mid',
		summary: 'Know where values live, what a reference is, and how garbage collection frees memory.',
		scenes: ['cs-stack-vs-heap', 'cs-mark-and-sweep'],
		notes: md(
			'A running program uses two main areas of memory. The **stack** holds the frames of active function calls: local variables and return addresses. It is fast, automatic and freed the moment the function returns. The **heap** is a large pool for data created at run time or that must outlive one call, such as objects, arrays and closures.',
			'',
			'Heap values are reached through **references** (addresses). Assign `b = a` for an object and you copy the reference, not the object, so both names see the same data. Primitives such as numbers are copied by value.',
			'',
			'Who frees heap memory? In C you do it by hand, and mistakes cause leaks and crashes. Languages such as JavaScript, Java and Go use a **garbage collector**: starting from **roots** (globals and the stack), it **marks** every object it can reach, then **sweeps** away the rest. Most objects die young, so modern collectors check new objects most often.',
			'',
			'```js',
			'const a = { n: 1 };',
			'const b = a;      // same object, two names',
			'b.n = 2;',
			'a.n;              // 2',
			'```',
			'',
			'**Common trap:** a leak in a garbage-collected language is a reference you forgot about: a cache that only grows, a listener never removed, a closure holding a big object.'
		),
		try: [
			{ label: 'References vs copies', code: `const a = { n: 1 };\nconst b = a;\nb.n = 2;\nconsole.log('a.n after b.n = 2:', a.n);\nconst c = { ...a };\nc.n = 3;\nconsole.log('a.n after a copy changed:', a.n);` },
			{ label: 'What a function can change', code: `function change(num, obj) {\n  num = 99;\n  obj.n = 99;\n  obj = { n: -1 };\n}\nlet x = 1;\nconst o = { n: 1 };\nchange(x, o);\nconsole.log('x:', x, ' o.n:', o.n);` }
		]
	},
	{
		id: 'processes-and-threads',
		title: 'Processes, threads and the event loop',
		level: 'mid',
		summary: 'Tell a process from a thread, and see how one CPU juggles many tasks.',
		scenes: ['cs-process-vs-thread', 'cs-context-switch'],
		notes: md(
			'A **process** is a running program with its own private memory, managed by the operating system. A **thread** is a path of execution inside a process: threads have their own stack and program counter but **share the process\'s heap**. Sharing is fast but dangerous: two threads changing the same data can cause a **race condition**, so they need locks or other coordination.',
			'',
			'A CPU core runs one thread at a time. The **scheduler** gives each runnable thread a short **time slice**, and a **context switch** saves one thread\'s state (registers, program counter) and restores another\'s. It is fast but not free. With several cores, threads truly run **in parallel**; **concurrency** just means several tasks are in progress.',
			'',
			'Processes are isolated: one crashing leaves the others alive, and they talk through pipes, sockets or shared files (IPC). Browsers use separate processes for this reason.',
			'',
			'JavaScript runs your code on **one thread** with an event loop; Web Workers add threads that communicate by messages.',
			'',
			'```js',
			"setTimeout(() => console.log('later'), 0);",
			"console.log('now');   // prints first",
			'```',
			'',
			'**Common trap:** async is not parallel. `await` lets other tasks run while you wait, but only one piece of JavaScript executes at a time.'
		),
		try: [
			{ label: 'Event loop order', code: `console.log('1 sync');\nsetTimeout(() => console.log('4 timer'), 0);\nPromise.resolve().then(() => console.log('3 microtask'));\nconsole.log('2 sync');\nawait new Promise((r) => setTimeout(r, 20));` },
			{ label: 'Interleaving without threads', code: `const task = async (name) => {\n  for (let i = 1; i <= 3; i++) { console.log(name + i); await null; }\n};\nawait Promise.all([task('A'), task('B')]);` },
			{ label: 'A race with no threads', code: `let n = 0;\nconst inc = async () => {\n  const v = n;\n  await null;\n  n = v + 1;\n};\nawait Promise.all([inc(), inc()]);\nconsole.log('two increments gave', n);` }
		]
	},
	{
		id: 'networking',
		title: 'Networking: DNS, TCP, TLS',
		level: 'mid',
		summary: 'Follow a request through DNS, TCP and TLS, and see where latency comes from.',
		scenes: ['cs-dns-lookup', 'cs-tcp-handshake', 'cs-tls-handshake'],
		notes: md(
			'Opening `https://example.com` takes several steps before one byte of the page arrives.',
			'',
			'1. **DNS** turns the name into an IP address. A resolver asks the root servers, then the `.com` servers, then the site\'s authoritative server, and caches the answer for its **TTL**.',
			'2. **TCP** sets up a reliable connection with a three-way handshake (SYN, SYN-ACK, ACK). It numbers bytes, resends lost data and delivers it in order. **UDP** skips all that: faster but unreliable, good for calls and games.',
			'3. **TLS** encrypts the connection: the client checks the server\'s certificate against trusted authorities, and both sides derive a shared key. TLS 1.3 needs one extra round trip.',
			'4. **HTTP** finally sends the request and the response.',
			'',
			'Each step costs at least one **round trip** (RTT), bounded by the speed of light and the route. That is why **latency** is hard to buy back, and why servers near users, connection reuse and caching matter so much.',
			'',
			'```js',
			"const u = new URL('https://example.com:8443/a?x=1');",
			"u.hostname;   // 'example.com'",
			"u.port;       // '8443'",
			'```',
			'',
			'**Common trap:** bandwidth is not latency. A fat connection does not make a 150 ms round trip any shorter.'
		),
		try: [
			{ label: 'Take a URL apart', code: `const u = new URL('https://user@example.com:8443/a/b?x=1&y=2#top');\nconsole.log('protocol:', u.protocol);\nconsole.log('host:', u.hostname, 'port:', u.port);\nconsole.log('path:', u.pathname);\nconsole.log('query:', u.search, 'hash:', u.hash);` },
			{ label: 'Round trips before the first byte', code: `const rtt = 80; // simplification: every step costs one 80 ms round trip (a cached DNS answer is usually much quicker)\nconst cold = { dns: 1, tcp: 1, tls13: 1, http: 1 };\nlet total = 0;\nfor (const [step, trips] of Object.entries(cold)) {\n  total += trips * rtt;\n  console.log(step, '->', total, 'ms');\n}\nconsole.log('a reused connection only pays the HTTP round trip:', rtt, 'ms');` }
		]
	},
	...netTopics,
	{
		id: 'memory-hierarchy-and-caching',
		title: 'Memory hierarchy and caching',
		level: 'mid',
		summary: 'See why memory has levels, why access patterns matter, and how caches pay off.',
		scenes: ['cs-latency-ladder'],
		notes: md(
			'Fast memory is small and expensive; big memory is slow and cheap, so computers stack layers: **CPU registers**, **L1/L2/L3 caches**, **RAM**, **SSD**, then disks and the network. Each step down is roughly 10 to 1000 times slower. An L1 hit takes about a nanosecond, RAM about 100 ns, an SSD read about 100 microseconds and a cross-continent round trip about 100 ms. These are rough, order-of-magnitude figures.',
			'',
			'Caches work because of **locality**: programs reuse recent data (**temporal**) and touch nearby data (**spatial**). The CPU fetches memory in **cache lines** (typically 64 bytes), so walking an array in order is far faster than jumping around.',
			'',
			'The same idea repeats everywhere: browser caches, CDNs, database buffer pools and Redis. A cache turns a slow trip into a fast one when the data is there, a **hit**. The average cost is `hitRate × fastTime + missRate × slowTime`, so a high hit rate matters enormously.',
			'',
			'```js',
			'const hit = 0.95, fast = 1, slow = 100;   // ns',
			'hit * fast + (1 - hit) * slow;            // about 5.95 ns',
			'```',
			'',
			'**Common trap:** caching adds a hard problem, **invalidation**. A cache that serves stale data is a bug.'
		),
		try: [
			{ label: 'Average access time', code: `const fast = 1, slow = 100; // nanoseconds\nfor (const hit of [0.5, 0.9, 0.95, 0.99]) {\n  console.log('hit rate', hit, '->', (hit * fast + (1 - hit) * slow).toFixed(2), 'ns on average');\n}` },
			{ label: 'Rows vs columns (a toy cache)', code: `// 1000 x 1000 numbers of 8 bytes, stored row by row. A cache line holds 8 of them.\nconst N = 1000, LINE = 8;\nconst misses = (index) => {\n  let m = 0, last = -1;\n  for (let k = 0; k < N * N; k++) {\n    const line = Math.floor(index(k) / LINE);\n    if (line !== last) { m++; last = line; }\n  }\n  return m;\n};\nconsole.log('walk by rows:   ', misses((k) => k), 'line loads');\nconsole.log('walk by columns:', misses((k) => (k % N) * N + Math.floor(k / N)), 'line loads');` }
		]
	},
	{
		id: 'compilers-and-runtimes',
		title: 'Compilers, interpreters and JIT',
		level: 'advanced',
		summary: 'Follow code from text to a running program: tokens, tree, bytecode and JIT.',
		scenes: ['cs-compile-pipeline'],
		notes: md(
			'Your source code is just text. To run, it passes through a pipeline.',
			'',
			'1. **Lexing** splits the text into **tokens**: keywords, names, numbers and symbols.',
			'2. **Parsing** arranges the tokens into an **abstract syntax tree** (AST) that captures structure and precedence, so `1 + 2 * 3` multiplies first.',
			'3. The tree is checked, transformed and turned into lower-level code.',
			'',
			'A **compiler** translates ahead of time into machine code (C, Rust, Go). An **interpreter** runs the program step by step. Most modern engines mix both: JavaScript engines such as V8 parse to **bytecode**, interpret it, and watch for **hot** code, which a **JIT** (just-in-time) compiler turns into optimized machine code while the program runs. If an assumption (for example "this variable is always a number") breaks, the engine deoptimizes.',
			'',
			'TypeScript sits at the front: its checker works on the AST, then the types are **erased** and plain JavaScript continues through the same pipeline. Bundlers, linters and formatters also work by parsing code into ASTs.',
			'',
			'```js',
			'// 1 + 2 * 3  parses to  +(1, *(2, 3))  ->  7',
			'```',
			'',
			'**Common trap:** "interpreted vs compiled" describes an implementation, not a language. JavaScript has both interpreters and JIT compilers.'
		),
		try: [
			{ label: 'A tiny tokenizer', code: `const tokens = '12 + 3 * (4 - 1)'.match(/\\d+|[-+*/()]/g);\nconsole.log(tokens.join(' | '));` },
			{ label: 'Parse and evaluate with precedence', code: `const tokens = '1 + 2 * 3'.match(/\\d+|[-+*/()]/g);\nlet pos = 0;\nconst peek = () => tokens[pos], next = () => tokens[pos++];\nfunction factor() { return { num: Number(next()) }; }\nfunction term() { let n = factor(); while (peek() === '*' || peek() === '/') n = { op: next(), l: n, r: factor() }; return n; }\nfunction expr() { let n = term(); while (peek() === '+' || peek() === '-') n = { op: next(), l: n, r: term() }; return n; }\nconst ev = (n) => n.num !== undefined ? n.num : n.op === '+' ? ev(n.l) + ev(n.r) : n.op === '-' ? ev(n.l) - ev(n.r) : n.op === '*' ? ev(n.l) * ev(n.r) : ev(n.l) / ev(n.r);\nconst ast = expr();\nconsole.log(JSON.stringify(ast));\nconsole.log('value:', ev(ast));` }
		]
	}
];
