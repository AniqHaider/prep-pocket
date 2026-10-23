import { builder } from '../../quiz/types';

// Computer science quiz bank, part 1: bits, Big-O, arrays, lists/stacks/queues, hash tables, trees, heaps, graphs.
const t = (topic: string) => builder('CS', topic);

// ───────────────────────── bits-and-text ─────────────────────────
const bt = t('bits-and-text');

bt.add('basic', 'binary',
	"What is the decimal value of the binary number 1101?",
	"13",
	["11", "14", "9"],
	"Each bit position is worth twice the one to its right: 8, 4, 2, 1. In 1101 the 8, the 4 and the 1 are switched on, so 8 + 4 + 1 = 13. The wrong values each misread one bit: 11 is 1011, 14 is 1110 and 9 is 1001.");

bt.add('basic', 'bytes',
	"How many different values can one byte (8 bits) represent?",
	"256",
	["255, because that is the largest number a byte can hold", "128, because one of the eight bits is always reserved", "8, one for each bit position"],
	"Eight bits give 2 x 2 x 2 x 2 x 2 x 2 x 2 x 2 = 256 patterns. Read as an unsigned number they run from 0 to 255, which is why 255 is the maximum but not the count. Signed bytes use the same 256 patterns for -128 to 127, and no bit is set aside for a different purpose.");

bt.add('mid', 'overflow',
	"A signed 8-bit integer holds 127 and you add 1 with ordinary two's complement arithmetic. What happens?",
	"It wraps around to -128",
	["It becomes 128, because the byte grows by one bit to fit the result",
	 "It stays at 127, because values stop at the maximum",
	 "It always throws an exception, in every language"],
	"A byte has a fixed width, so 0111 1111 plus 1 becomes 1000 0000, and two's complement reads that pattern as -128. Languages differ in what they do about it: some wrap, some trap, and C leaves signed overflow undefined. Nothing, however, makes the byte widen itself or clamp at the maximum.");

bt.add('mid', 'utf-8',
	"Which statement about UTF-8 is true?",
	"Each character takes one to four bytes, and plain ASCII keeps its single-byte form",
	["Every character takes exactly two bytes, so that it can hold all of Unicode",
	 "It stores each character as its code point in four fixed bytes",
	 "It is the same encoding as UTF-16 with the byte order reversed"],
	"UTF-8 is variable length: ASCII characters stay one byte, letters such as é take two, symbols such as the euro sign take three and most emoji take four. Two fixed bytes describes the old UCS-2, four fixed bytes is UTF-32, and UTF-16 is a different scheme that uses two or four bytes, not a byte-swapped UTF-8.");

bt.add('advanced', 'utf-16',
	"In JavaScript, what do s.length and [...s].length give for this string?",
	"2 and 1",
	["1 and 1", "4 and 1", "2 and 2"],
	"JavaScript strings are sequences of 16-bit UTF-16 code units. U+1F600 lies above U+FFFF, so it is stored as a surrogate pair of two units, and length reports 2. Spreading a string iterates by code point, so it yields one item. The number 4 would be its size in UTF-8 bytes, which length never reports.",
	"const s = '\\u{1F600}';\nconsole.log(s.length, [...s].length);");

// ───────────────────────── big-o ─────────────────────────
const bo = t('big-o');

bo.add('basic', 'meaning',
	"What does Big-O notation describe?",
	"How the amount of work grows as the input gets larger",
	["The exact number of milliseconds a function takes on your machine",
	 "How much memory the computer has free for the program",
	 "How many lines of code a function contains"],
	"Big-O is about growth: when the input doubles, does the work stay flat, double, or quadruple? It deliberately ignores machine speed and constant factors, so it is not a stopwatch reading. It also says nothing about how much memory is installed or how long the source code is.");

bo.add('basic', 'loops',
	"A function loops over an array once and does a fixed amount of work for each item. What is its time complexity?",
	"O(n)",
	["O(1)", "O(log n)", "O(n²)"],
	"One pass with constant work per item means the total work is proportional to the number of items: O(n). O(1) would mean the cost does not depend on the array at all, O(log n) needs the problem to be halved each step, and O(n²) needs a second loop nested inside the first.");

bo.add('mid', 'simplifying',
	"Which is the standard simplified Big-O class of an algorithm that takes 3n² + 20n + 5 steps?",
	"O(n²)",
	["O(n)", "O(n³)", "O(n log n)"],
	"Big-O drops constant factors and lower-order terms, because for large n the fastest-growing term dominates. At n = 1000 the 3n² term is 3,000,000 while 20n is only 20,000. The cost therefore grows like n squared. It does not grow like n, which is too slow a rate, nor like n cubed, which is too fast.");

bo.add('mid', 'hidden-loops',
	"What is the time complexity of this code, where items has n elements?",
	"O(n²), because includes scans the array on every iteration of the loop",
	["O(n), because the code contains only one loop",
	 "O(log n), because includes can skip elements it has already seen",
	 "O(1), because includes just returns a boolean"],
	"Array.prototype.includes checks items one by one, so each call is O(n). Calling it once per element of the loop makes n times n steps. The single visible loop is misleading, since the second loop is hidden inside the library call. A Set would make each check O(1) on average.",
	"for (const a of items) {\n  if (items.includes(a)) count++;\n}");

bo.add('advanced', 'constants',
	"Which statement about Big-O is correct?",
	"An O(n) algorithm can beat an O(log n) one on small inputs, because Big-O ignores constant factors",
	["An O(log n) algorithm is faster than an O(n) algorithm for every possible input size",
	 "Big-O gives the exact number of operations a program performs for any input size",
	 "Two algorithms with the same Big-O class always take the same time"],
	"Big-O describes the shape of growth for large n, not the exact cost. A simple linear scan can beat a clever logarithmic method on ten items, since the logarithmic one may carry heavy setup. Equal classes can still differ by large constant factors, and neither class tells you the exact count of operations.");

// ───────────────────────── arrays-and-memory ─────────────────────────
const am = t('arrays-and-memory');

am.add('basic', 'indexing',
	"Why is reading arr[i] an O(1) operation?",
	"The address is the start plus i times the item size, so one calculation finds it",
	["The array keeps a sorted index of every position, and the computer binary-searches that index to find the slot",
	 "The computer searches the array with binary search",
	 "Every element is copied into the cache in advance"],
	"Items of an array sit side by side in one block of memory and all have the same size, so the address of item i is simply start + i x size. That is a single multiplication and addition however long the array is. No index structure, search or pre-loading is involved.");

am.add('basic', 'insertion',
	"Which operation on a plain array is typically the most expensive?",
	"Inserting an item at the very front, because every other item must shift over",
	["Reading the item at index 0, because the CPU has to scan the whole array to locate the first slot", "Overwriting the last item, because the array must first be copied to make the write safe", "Reading the length"],
	"Putting an item at the front means moving every existing item one slot to the right to make room, which costs O(n). Reading a position, overwriting a slot and reading the stored length are all single steps that do not disturb the other items.");

am.add('mid', 'resizing',
	"A dynamic array (like a JavaScript array or a Python list) has a capacity of 8 and already holds 8 items. What happens on the next push?",
	"It allocates a larger block, copies the items across and then adds the new one",
	["The new item goes to any free memory address and is linked to the last item",
	 "The oldest item is dropped to make room",
	 "The push fails until the program enlarges the array by hand"],
	"A dynamic array wraps a fixed block. When it is full, it asks for a bigger block (often about double), copies the old contents over, frees the old block and stores the new item. Linking scattered items describes a linked list, and dropping items or failing are not how these arrays behave.");

am.add('mid', 'cache-locality',
	"Why does scanning an array in order tend to run faster than following a linked list of the same size?",
	"The items are next to each other, so each cache line the CPU loads brings in several of them",
	["The CPU has a special instruction that reads a whole array in a single step, however long it is",
	 "Linked lists must be sorted before they can be read at all",
	 "Operating systems do not allow linked lists to use the CPU cache"],
	"CPUs fetch memory in cache lines of around 64 bytes. In an array, one fetch delivers many neighbouring items, so most reads hit the cache. Linked list nodes are scattered, so each hop is likely a fresh slow trip to memory. Nothing reads an array in one instruction, and lists are cached like any other memory.");

am.add('advanced', 'amortized',
	"A dynamic array push can occasionally cost O(n), yet push is described as amortized O(1). Why?",
	"Resizes are rare because capacity grows by a constant factor, so the copying averages out to a constant cost per push",
	["The copy during a resize is performed by the hardware in constant time, regardless of how many items there are",
	 "The array only ever grows by one slot, so it never has to copy",
	 "Big-O ignores any step that takes longer than a millisecond"],
	"With doubling, the sizes copied across resizes are 1, 2, 4, 8 and so on, which sum to about the final length. Spread over all the pushes that is roughly one extra copy per push, so the average stays constant even though one push can be expensive. A copy of n items is never constant time, and growing by a single slot would make every push copy everything.");

// ───────────────────────── linked-lists-stacks-queues ─────────────────────────
const ls = t('linked-lists-stacks-queues');

ls.add('basic', 'stack',
	"Which data structure gives back items in last in, first out order?",
	"A stack",
	["A queue", "A hash table", "A binary search tree"],
	"A stack adds and removes at one end only, so the most recently pushed item is the first to be popped, like plates in a pile. A queue does the opposite (first in, first out), a hash table has no order at all and a binary search tree gives items back in sorted order when walked in-order.");

ls.add('basic', 'queue',
	"In a queue, where are new items added and where are items removed?",
	"Added at the back, removed from the front",
	["Added at the front, removed from the back", "Added and removed at the top", "Added in the middle, removed from either end"],
	"A queue is first in, first out, like a line at a shop: newcomers join at the back and the person at the front is served next. Adding at the front and removing from the back would reverse that order, and using only the top describes a stack.");

ls.add('basic', 'linked-list-access',
	"You want the 500th item of a singly linked list and you only hold the head. What does it cost?",
	"About 500 pointer hops, which is O(n)",
	["One step, O(1), because the nodes are stored in order in memory",
	 "About 9 steps, O(log n), because the list can be halved each time",
	 "One step, O(1), because the list keeps an index table"],
	"Nodes are scattered in memory and only know their next neighbour, so the only way to reach item 500 is to follow 499 pointers from the head. There is no index table and no way to halve an unsorted chain of links. That is the main reason arrays win for random access.");

ls.add('mid', 'linked-list-insert',
	"You already hold a reference to node X in a singly linked list. What does inserting a new node right after X cost?",
	"O(1): create the node, point it at X's old next, then point X at it",
	["O(n), because every later node must shift one place",
	 "O(log n), because the list must first be searched to find the right position",
	 "O(n), because the whole list has to be copied"],
	"Nothing needs to move: the new node takes over X's next pointer and X points at the new node. That is two pointer updates, whatever the length. Shifting is what arrays must do, and searching is only needed if you do not already hold X.");

ls.add('advanced', 'lru-cache',
	"An LRU cache needs O(1) lookup and O(1) eviction of the least recently used entry. Which combination of structures achieves that?",
	"A hash map plus a doubly linked list ordered by recency",
	["A sorted array plus binary search",
	 "A stack plus a queue, so that the newest and oldest entries are both at hand",
	 "A min-heap keyed by the time of last use"],
	"The hash map finds an entry in O(1) and gives direct access to its list node. The doubly linked list lets you unlink that node and move it to the front in O(1), and the tail is always the least recently used. A sorted array needs O(n) inserts, and a heap needs O(log n) to reorder on every access.");

// ───────────────────────── hash-tables ─────────────────────────
const ht = t('hash-tables');

ht.add('basic', 'lookup',
	"What is the average-case time to look up a key in a good hash table?",
	"O(1)",
	["O(log n)", "O(n)", "O(n log n)"],
	"A lookup hashes the key, jumps straight to a bucket and checks a handful of entries, so the cost does not grow with the table size on average. O(log n) is typical of balanced trees, and O(n) is the degenerate worst case when everything collides.");

ht.add('basic', 'collision',
	"What is a hash collision?",
	"Two different keys that map to the same bucket",
	["The same key being stored twice in the table",
	 "A hash function returning a different value each time for the same key",
	 "The table running out of memory"],
	"A hash function squeezes many possible keys into a limited number of buckets, so different keys sometimes share one. Tables handle that with chaining or probing. A hash function that changed its answer for the same key would be broken, because the key could never be found again.");

ht.add('mid', 'load-factor',
	"A hash table has 8 buckets and holds 6 items. What is its load factor?",
	"0.75",
	["1.33", "6", "0.25"],
	"Load factor is items divided by buckets: 6 / 8 = 0.75. Dividing the other way round gives 1.33, which is not what the term means, 6 is just the item count, and 0.25 is the share of buckets still empty if every item sat alone.");

ht.add('mid', 'resizing',
	"Why does a hash table resize and rehash its keys when the load factor gets high?",
	"To keep chains short, so lookups stay close to O(1)",
	["To sort the keys so they can be iterated in order",
	 "To free the memory used by deleted keys",
	 "Because the hash function stops working above a load factor of 1"],
	"As buckets fill up, more keys collide and the chains or probe sequences grow, which slows every lookup. Doubling the bucket array and redistributing the keys spreads them out again. Resizing does not sort anything and is not mainly about freeing memory, and a hash function has no such limit.");

ht.add('advanced', 'worst-case',
	"When can a hash table lookup degrade to O(n)?",
	"When many keys land in the same bucket, for example with a poor hash function or deliberately chosen colliding keys",
	["Whenever the table holds more than a thousand items, because the buckets overflow past that size",
	 "When the keys are strings rather than numbers",
	 "Only when the table is completely empty"],
	"If most keys share a bucket, finding one means scanning a long chain, which is O(n). Attackers can craft colliding keys (hash flooding), which is why many languages use randomized hash seeds. Table size alone does not cause it and the type of key is irrelevant.");

ht.add('advanced', 'object-keys',
	"In JavaScript, why does the plain object below end up with one key, while a Map would keep both entries?",
	"Object keys become strings, so both turn into '[object Object]'; a Map compares keys by identity",
	["A plain object can hold only one property whose value is an object",
	 "A Map copies its keys by value, so two empty objects stay different",
	 "The second assignment is ignored because the first key already exists as a number"],
	"Property names on a plain object are always strings (or symbols), so both empty objects turn into the same string, '[object Object]', and the second assignment overwrites the first. A Map uses the key itself and compares objects by identity, so two different objects are two different keys.",
	"const k1 = {}, k2 = {};\nconst obj = {};\nobj[k1] = 1;\nobj[k2] = 2;\nconsole.log(Object.keys(obj).length);");

// ───────────────────────── trees-and-bst ─────────────────────────
const tb = t('trees-and-bst');

tb.add('basic', 'bst-rule',
	"In a binary search tree, where are values smaller than a node stored?",
	"In its left subtree",
	["In its right subtree", "In the root node", "Anywhere, because the tree is not ordered"],
	"The rule of a binary search tree is: everything in the left subtree is smaller than the node and everything in the right subtree is larger. That ordering is what lets a search choose one side at each node and ignore the other.");

tb.add('basic', 'traversal',
	"Which traversal of a binary search tree visits the values in sorted order?",
	"In-order: the left subtree, then the node, then the right subtree",
	["Pre-order: the node, then the left subtree, then the right subtree",
	 "Post-order: the left subtree, then the right subtree, then the node",
	 "Level-order: one row at a time from the root downward"],
	"In-order visits everything smaller than a node first (the left subtree), then the node, then everything larger, which produces ascending order. Pre-order and post-order visit the node before or after both subtrees, and level-order is a breadth-first walk by depth, so none of those is sorted.");

tb.add('mid', 'search-cost',
	"About how many comparisons does searching a balanced binary search tree of 1,000,000 nodes take?",
	"About 20",
	["About 1,000", "About 500,000", "Exactly 1"],
	"A balanced tree discards about half of the remaining nodes at each step, so the height is log2 of a million, close to 20. Roughly a thousand would be the square root, half a million is what an unsorted scan averages, and a single comparison would only find the root.");

tb.add('mid', 'degenerate',
	"You insert 1, 2, 3, 4, 5 in that order into an empty binary search tree that never rebalances. What shape does it take?",
	"A chain leaning to the right, so searches cost O(n)",
	["A perfectly balanced tree of height 3",
	 "A chain leaning to the left, so searches also cost O(n)",
	 "A complete tree packed into an array like a heap"],
	"Every new value is larger than everything already there, so it always goes to the right of the last node. The tree becomes a linked list tilted right, and a search may visit every node. Balanced trees only appear if the insertion order is mixed or a self-balancing scheme intervenes.");

tb.add('advanced', 'self-balancing',
	"What problem do AVL trees and red-black trees solve?",
	"They rotate nodes during inserts and deletes so the height stays O(log n)",
	["They store duplicate keys more compactly than a plain tree, saving a great deal of memory",
	 "They allow a tree to be searched without comparing keys",
	 "They randomize the traversal order to avoid attacks"],
	"A plain BST can become lopsided and slow, depending on insertion order. Self-balancing trees apply small local rotations after changes to keep the two sides of every node roughly equal in height, which guarantees O(log n) search, insert and delete in the worst case.");

tb.add('advanced', 'b-tree',
	"Why do databases use B-trees rather than binary search trees for on-disk indexes?",
	"Each node holds many keys and fits one disk page, so the tree is shallow and needs few page reads",
	["B-trees never need any rebalancing, so inserts and deletes cost nothing compared with a binary tree",
	 "Binary trees cannot store more than a million keys",
	 "B-trees keep keys unsorted, which makes writes faster"],
	"Reading a disk page is slow, so the goal is to touch as few pages as possible. A B-tree node packs hundreds of keys, so even billions of rows fit in a tree only three or four levels deep. A binary tree with one key per node would be far deeper. B-trees stay balanced and keep keys sorted.");

// ───────────────────────── heaps-and-priority-queues ─────────────────────────
const hp = t('heaps-and-priority-queues');

hp.add('basic', 'min-heap',
	"In a min-heap, where is the smallest value?",
	"At the root, the top of the tree",
	["At the last index of the array", "In the leftmost leaf", "Anywhere, because a heap is not ordered"],
	"The heap rule says every parent is no larger than its children, so following parents upward always leads to the smallest value, which therefore sits at the root (index 0 of the array). The last items are leaves and can be fairly large.");

hp.add('basic', 'priority-queue',
	"What does a priority queue always hand back first?",
	"The item with the highest priority, for example the smallest key in a min-heap",
	["The item that was added first, because a priority queue is simply a first in, first out line", "The item that was added last", "A randomly chosen item"],
	"A priority queue orders items by priority, not by arrival time. A heap makes the best item available at the top. First in, first out describes an ordinary queue, last in, first out describes a stack, and a priority queue is not random.");

hp.add('mid', 'index-math',
	"A heap is stored in an array that starts at index 0. Where is the parent of the item at index 5?",
	"Index 2",
	["Index 3", "Index 4", "Index 1"],
	"The parent of index i is floor((i - 1) / 2), so for 5 it is floor(4 / 2) = 2. Equivalently, the children of index 2 are 5 and 6. The other numbers come from forgetting to subtract one or from dividing the wrong way.");

hp.add('mid', 'insert-cost',
	"What is the worst-case cost of inserting one item into a binary heap of n items?",
	"O(log n), because the new item sifts up at most the height of the tree",
	["O(1), because it goes at the end and stays there",
	 "O(n), because the whole array is re-sorted",
	 "O(n log n), because the new item is compared with every other item in the heap"],
	"The new item is placed in the next free slot and swaps with its parent while it is smaller. That walk can climb at most the height of the tree, about log2 n levels. Nothing is re-sorted and not every item is compared. (On average inserting is cheaper, but the worst case is logarithmic.)");

hp.add('advanced', 'top-k',
	"Why is finding the 10 largest of a million numbers faster with a min-heap of size 10 than with a full sort?",
	"Each number is compared only with the heap's root, with an O(log 10) update when it qualifies: O(n log k) in total, not O(n log n)",
	["A heap of size 10 is always kept fully sorted by the structure itself, so after one pass there is no work left to do",
	 "Sorting a million numbers is impossible in memory",
	 "A heap automatically skips numbers it has seen before"],
	"Keep the 10 largest seen so far in a min-heap. For each new number, compare it with the smallest of those (the root); only if it is larger do you replace the root and sift down, which costs log 10. With k = 10 that is close to linear in n, while a full sort pays n log n.");

// ───────────────────────── graphs-bfs-dfs ─────────────────────────
const gr = t('graphs-bfs-dfs');

gr.add('basic', 'bfs-queue',
	"Which data structure drives a breadth-first search?",
	"A queue",
	["A stack", "A heap", "A sorted array"],
	"BFS processes nodes in the order they were discovered: take the oldest waiting node, then add its neighbours at the back. That is first in, first out, so a queue. A stack gives the depth-first order instead.");

gr.add('basic', 'dfs-stack',
	"Which data structure, or equivalent, drives a depth-first search?",
	"A stack, often the call stack through recursion",
	["A queue, because the first neighbour found is explored to the end before moving on", "A sorted array", "A min-heap"],
	"DFS follows one path as far as it can, then backs up to the most recent node with unexplored neighbours. Last in, first out is exactly a stack, and recursion uses the call stack for the same purpose. A queue would give breadth-first order.");

gr.add('mid', 'shortest-path',
	"You need the fewest hops between two users in an unweighted social network. Which search finds it?",
	"Breadth-first search",
	["Depth-first search", "Binary search", "Merge sort on the user ids"],
	"BFS spreads out in rings, so the first time it reaches a node, it has used the fewest possible edges. Depth-first search may wander down a long path first and has no such guarantee. Binary search and sorting do not explore connections at all.");

gr.add('mid', 'visited-set',
	"What happens if you run BFS or DFS on a graph with a cycle but never record which nodes were visited?",
	"It can loop forever, revisiting the same nodes",
	["It finishes normally but skips the nodes inside the cycle",
	 "It detects the cycle by itself and stops with an error",
	 "It only misbehaves on directed graphs"],
	"Without a visited set, the search keeps following the cycle: it reaches a node, goes around, and reaches it again. Neither algorithm notices unless you track visited nodes. This applies to undirected cycles too, where every edge can be walked back and forth.");

gr.add('advanced', 'complexity',
	"What is the time complexity of BFS on a graph with V nodes and E edges stored as an adjacency list?",
	"O(V + E)",
	["O(V × E)", "O(V²) in every case", "O(E log V)"],
	"Each node is queued once and each edge is examined once or twice while scanning adjacency lists, so the work is proportional to V + E. O(V²) is what an adjacency matrix costs, since you scan a whole row per node, and the other two overcount the work.");

export const csQuestionBanks1 = [bt, bo, am, ls, ht, tb, hp, gr];
