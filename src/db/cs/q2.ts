import { builder } from '../../quiz/types';

// Computer science quiz bank, part 2: sorting, recursion, memory, processes, networking, caching, compilers.
const t = (topic: string) => builder('CS', topic);

// ───────────────────────── sorting-and-searching ─────────────────────────
const ss = t('sorting-and-searching');

ss.add('basic', 'binary-search',
	"What must be true of an array before binary search can be used on it?",
	"It must be sorted",
	["It must contain only unique values", "It must have an odd number of items", "It must be stored as a linked list"],
	"Binary search looks at the middle item and decides which half could hold the target. That reasoning only works if the items are in order. Duplicates and an odd length do not matter, and a linked list would make jumping to the middle slow.");

ss.add('basic', 'js-sort',
	"What does [10, 9, 1, 100].sort() return in JavaScript, with no comparator?",
	"[1, 10, 100, 9], because the items are compared as strings",
	["[1, 9, 10, 100], because sort compares numbers numerically by default",
	 "[100, 10, 9, 1], because sort orders from largest to smallest",
	 "[10, 9, 1, 100], because sort does nothing without a comparator"],
	"By default JavaScript converts items to strings and compares them in dictionary order, so '1' < '10' < '100' < '9'. Numeric order needs sort((a, b) => a - b). The default order is ascending, and sort does reorder the array even without a comparator.");

ss.add('mid', 'merge-sort',
	"Which statement about merge sort is true?",
	"It is O(n log n) in the best, average and worst cases and is stable, but needs O(n) extra space",
	["It sorts in place and needs only O(1) extra space, which is why it is chosen when memory is tight",
	 "Its worst case is O(n²) on input that is already sorted",
	 "It is unstable, so equal items may swap order"],
	"Merge sort always splits in half (log n levels) and merges each level in O(n), whatever the input order. Merging with a temporary array keeps equal items in their original order, so it is stable, at the price of linear extra space. Quicksort is the one with the O(n²) worst case.");

ss.add('mid', 'binary-search-cost',
	"At most how many checks does binary search need to find an item among about one million sorted items?",
	"About 20",
	["About 1,000", "About 500,000", "About 100"],
	"Each check halves the remaining range, and a million halves down to one in log2(1,000,000), which is just under 20 steps. A thousand would be the square root, and half a million is the average cost of scanning an unsorted list. Even a hundred checks would be far more than the search needs.");

ss.add('advanced', 'quicksort-worst',
	"When does quicksort degrade to O(n²)?",
	"When the pivot is repeatedly the smallest or largest item, like the last item of already sorted data",
	["When the list contains many duplicate values, which always forces the worst case in every implementation",
	 "When the list has more than a million items",
	 "When the pivot is chosen at random"],
	"If each partition peels off just one item, there are n levels of work instead of log n, and the cost adds up to O(n²). Choosing the last element of sorted data does exactly that. Random or median-of-three pivots make it very unlikely, and size or duplicates alone do not trigger it (though naive handling of many equal items can be slow).");

ss.add('advanced', 'sorting-bound',
	"Why can no comparison-based sorting algorithm beat O(n log n) in the worst case?",
	"There are n! orderings and each comparison answers only yes or no, so about log2(n!), roughly n log n, comparisons are needed",
	["Computers can only compare two numbers per clock cycle, so n items need n log n cycles",
	 "Every sort has to read each item twice",
	 "Memory access always costs O(log n)"],
	"A comparison sort has to distinguish between all n! orderings. Each yes/no answer at best halves the possibilities, so it needs at least log2(n!) answers, which grows like n log n. Sorts that avoid comparing items, such as counting or radix sort, can do better for restricted inputs.");

// ───────────────────────── recursion-and-dp ─────────────────────────
const rd = t('recursion-and-dp');

rd.add('basic', 'base-case',
	"What stops a recursive function from calling itself forever?",
	"A base case that returns without making another recursive call",
	["The garbage collector ends it after a time limit",
	 "The compiler always rewrites every recursive function as a loop before it runs",
	 "The language limits every recursive call to ten levels"],
	"Each recursive call must work on a smaller problem until it reaches a case simple enough to answer directly: the base case. Without one, the calls never end until the stack overflows. There is no automatic time limit, no universal loop rewrite, and the depth limit is far greater than ten.");

rd.add('mid', 'stack-overflow',
	"What is a stack overflow in the context of recursion?",
	"The call stack runs out of space because calls are nested too deeply",
	["A stack data structure receives more items than the heap has room to hold at once",
	 "A function returns the wrong value because its base case is wrong",
	 "Two threads write to the same stack at the same time"],
	"Every active call keeps a frame on the call stack, and the stack has a limited size. Recursing too deep, or without a working base case, uses it all up and the program fails (JavaScript throws a RangeError). A wrong base case produces wrong answers or infinite recursion, which only leads to overflow indirectly.");

rd.add('mid', 'fib-cost',
	"Why is naive recursive fib(n) so slow, roughly O(2ⁿ)?",
	"It solves the same subproblems again and again, and the number of calls grows exponentially with each step up in n",
	["Each call allocates a large temporary array on the heap, and that allocation costs more as n grows",
	 "Recursion is always exponentially slower than a loop",
	 "The base case is checked n times in every call"],
	"fib(n) calls fib(n-1) and fib(n-2), which both recompute many of the same smaller values, so the tree of calls branches into two at every level. fib(40) makes over 300 million calls. Recursion itself is not the problem: a memoized version is linear.");

rd.add('mid', 'memoization',
	"What does memoization do?",
	"It stores the result of each call, keyed by its arguments, so repeated calls return the saved answer",
	["It rewrites recursive code into an equivalent loop at compile time so that no call stack is needed",
	 "It runs the same function on several threads at once",
	 "It deletes old results to save memory"],
	"A memoized function checks a table first: if it has already computed the answer for these arguments, it returns it instantly; otherwise it computes and stores it. That turns repeated work into a lookup. It trades memory for time and does not by itself add threads or forget results.");

rd.add('advanced', 'dp-fit',
	"A problem breaks into subproblems that overlap, and the best answer is built from the best answers to those subproblems. Which approach fits?",
	"Dynamic programming: solve each subproblem once and reuse the result",
	["Plain divide and conquer, which solves each overlapping piece again every time it appears",
	 "A hash table of the input with no recursion at all",
	 "Breadth-first search, which is designed for overlapping subproblems"],
	"Overlapping subproblems plus optimal substructure are the two signs of dynamic programming: cache each subproblem's answer, by memoizing or by filling a table. Divide and conquer such as merge sort assumes independent pieces, and re-solving overlaps is exactly the waste DP avoids. BFS is a graph traversal and does not address this.");

rd.add('advanced', 'dp-cost',
	"Finding the fewest coins for an amount n using k coin types with a table, where best[a] is built from best[a - coin], costs how much time?",
	"O(n × k): each of the n table entries tries k coins",
	["O(n), since each amount is settled in a single step", "O(2^n), since every combination of coins is tried", "O(k), since only the coin types are looped over"],
	"The table has n + 1 entries, and filling each one tries every coin type once, so the total is n times k steps. O(n) forgets the inner loop over coins, O(k) forgets the amount, and O(2^n) is what trying every combination without a table would cost.");

// ───────────────────────── stack-heap-and-gc ─────────────────────────
const sg = t('stack-heap-and-gc');

sg.add('basic', 'locals',
	"In most languages, where are the local variables of a running function stored?",
	"In that call's frame on the call stack",
	["On the heap, where they stay until a garbage collector runs",
	 "In a database file",
	 "Only in the CPU's cache"],
	"Each function call gets a frame on the call stack holding its locals and return address, and the frame disappears when the function returns. Heap memory is for data that outlives a call, and the CPU cache is only a speed-up layer that holds copies of memory, never the only home of a variable.");

sg.add('mid', 'references',
	"After this code runs, what does a.n show?",
	"2, because a and b are references to the same object",
	["1, because b is an independent copy of a",
	 "undefined, because b took the property away from a",
	 "It throws, because objects cannot be assigned to other variables"],
	"Assigning an object copies the reference (its address), not the object. a and b therefore name one object on the heap, and changing it through b is visible through a. To get an independent copy you need to clone it, for example with { ...a }.",
	"const a = { n: 1 };\nconst b = a;\nb.n = 2;\nconsole.log(a.n);");

sg.add('mid', 'mark-and-sweep',
	"How does a mark-and-sweep garbage collector decide that an object is garbage?",
	"It cannot be reached by following references from the roots",
	["Its reference count dropped to zero",
	 "It has not been used by the program for a fixed number of seconds",
	 "It is larger than the memory that remains free"],
	"The collector starts at the roots (globals, the stack) and marks everything reachable by following references; whatever stays unmarked cannot be used by the program any more and is swept away. That is why a cycle of objects pointing at each other is still collected when nothing reachable points to it. Reference counting is a different scheme.");

sg.add('mid', 'leaks',
	"In a garbage-collected language, what is the usual cause of a memory leak?",
	"A forgotten reference, such as a cache that only grows or an event listener that is never removed",
	["Forgetting to call free() on each object once the program has finished using it",
	 "Using local variables instead of global ones",
	 "The garbage collector running too often"],
	"The collector frees only unreachable objects, so anything still referenced stays alive even if the program will never use it again. A growing cache, a listener holding a closure or a global array of old results are typical culprits. Manual free() belongs to languages like C, and running often does not leak.");

sg.add('advanced', 'generational-gc',
	"Why do generational garbage collectors scan young objects more often than old ones?",
	"Most objects die young, so scanning the small young area frees a lot of memory cheaply",
	["Young objects are larger than old ones, so they fill up memory first and have to be cleared sooner",
	 "Old objects can never be collected",
	 "The stack only has room for young objects"],
	"Programs create many short-lived objects such as temporaries and request data. Checking only the small young generation frequently reclaims most garbage at low cost, and long-lived survivors are promoted to an old generation that is scanned less often. Old objects can be collected, just less frequently.");

// ───────────────────────── processes-and-threads ─────────────────────────
const pt = t('processes-and-threads');

pt.add('basic', 'shared-memory',
	"What do the threads of one process share?",
	"The process's heap and other memory",
	["Their stacks", "Their program counters", "Nothing: every thread is fully isolated"],
	"Threads live inside one process and share its address space, so they can read and write the same objects on the heap. Each thread still has its own stack and its own program counter, which is how it keeps track of where it is. Full isolation is what separate processes provide.");

pt.add('basic', 'isolation',
	"What is the main advantage of using separate processes instead of threads?",
	"Isolation: one process crashing or corrupting its memory does not take down the others",
	["Processes share memory directly, so communicating between them costs nothing at all",
	 "Processes start faster than threads",
	 "Processes always use fewer system resources"],
	"The operating system gives each process private memory, so a bug in one cannot overwrite another's data and a crash leaves the rest running. The cost is that processes must communicate through pipes, sockets or files, and starting one is heavier than starting a thread.");

pt.add('mid', 'context-switch',
	"What is a context switch?",
	"The operating system saving one thread's state and restoring another's so the CPU can run it",
	["Moving a program from the disk into RAM so that the CPU can start executing it",
	 "Changing which user is logged in",
	 "Copying a process's heap to another computer"],
	"A context switch stores the registers and program counter of the running thread, loads those of the next one and carries on. It is how one core appears to run many tasks, and it costs time and cache warmth, so excessive switching hurts performance. The other options describe unrelated activities.");

pt.add('mid', 'event-loop',
	"In what order does this JavaScript print its letters?",
	"a d c b",
	["a b c d", "a d b c", "a c d b"],
	"Synchronous code runs first, giving a then d. When the call stack is empty, the event loop runs all queued microtasks (promise callbacks), printing c, and only afterwards takes the next timer callback, printing b, even though its delay is 0.",
	"console.log('a');\nsetTimeout(() => console.log('b'), 0);\nPromise.resolve().then(() => console.log('c'));\nconsole.log('d');");

pt.add('mid', 'async-race',
	"Two async functions each read a shared counter, await, then write the value they read plus 1. The counter starts at 0. What is its final value?",
	"1, because both read 0 before either wrote, so one update is lost",
	["2, because JavaScript is single threaded and updates cannot be lost",
	 "0, because awaiting cancels the writes",
	 "Random on every run, because JavaScript uses many threads"],
	"JavaScript runs one piece of code at a time, but each await lets the other function run. Both functions read 0, then both write 1. Being single threaded does not prevent interleaving at await points, so the read-modify-write sequence is still a race. There is no randomness here and awaiting cancels nothing.",
	"let n = 0;\nconst inc = async () => {\n  const v = n;\n  await null;\n  n = v + 1;\n};\nawait Promise.all([inc(), inc()]);\nconsole.log(n);");

pt.add('advanced', 'concurrency-vs-parallelism',
	"What is the difference between concurrency and parallelism?",
	"Concurrency is tasks making progress in overlapping time, even on one core; parallelism is tasks running at the same instant on separate cores",
	["They are two names for the same thing: any concurrent program is automatically parallel and vice versa",
	 "Concurrency needs several computers while parallelism needs only one",
	 "Parallelism means tasks never share data, concurrency means they always do"],
	"A single core can be concurrent by switching between tasks quickly, interleaving their progress. Parallelism needs hardware that really executes more than one task simultaneously, such as several cores. They are related but not equal, and neither is defined by data sharing or by the number of machines.");

// ───────────────────────── networking ─────────────────────────
const nw = t('networking');

nw.add('basic', 'dns',
	"What job does DNS do when you open a website by typing its name?",
	"Translates a domain name such as example.com into an IP address",
	["Encrypts the traffic between the browser and the server so that nobody on the network can read it",
	 "Chooses the route a packet takes across the internet",
	 "Stores the files that make up a website"],
	"Computers connect using IP addresses, and DNS is the lookup service that maps human-friendly names to them, asking a chain of servers and caching answers. Encryption is TLS, routing is done by routers, and website files live on the web server.");

nw.add('mid', 'tcp-udp',
	"Which statement correctly contrasts TCP and UDP?",
	"TCP sets up a connection and guarantees ordered, resent delivery; UDP sends independent datagrams with no such guarantees",
	["UDP encrypts all of its data by default, while TCP sends everything in clear text",
	 "TCP is faster because it skips acknowledgements",
	 "UDP guarantees delivery but not order"],
	"TCP numbers bytes, acknowledges them and resends lost ones, so the receiver gets everything in order, at the cost of a handshake and some delay. UDP just sends packets, which suits live video, games and DNS where speed beats completeness. Neither encrypts by itself, and UDP guarantees neither delivery nor order.");

nw.add('mid', 'handshake',
	"Which messages make up the TCP three-way handshake?",
	"SYN, then SYN-ACK, then ACK",
	["Hello, then certificate, then key exchange",
	 "GET, then 200 OK, then close",
	 "Query, then answer, then cache"],
	"The client sends SYN, the server answers SYN-ACK and the client confirms with ACK. Both sides then know the other is reachable and have agreed on starting sequence numbers. The other sequences describe a TLS handshake, an HTTP exchange and a DNS lookup.");

nw.add('advanced', 'tls',
	"What is the main purpose of the TLS handshake?",
	"To authenticate the server with a certificate and agree on keys that encrypt the rest of the connection",
	["To find the server's IP address by asking a chain of name servers, starting from the root",
	 "To compress the page before it is sent",
	 "To make sure no packets are lost in transit"],
	"During the handshake the server proves its identity with a certificate signed by an authority the client trusts, and both sides derive shared secret keys. Everything after that is encrypted and tamper-evident. Finding the address is DNS, compression is a separate feature and lost packets are TCP's concern.");

nw.add('advanced', 'cold-start-latency',
	"A browser opens a brand new HTTPS connection: a TCP handshake, a TLS 1.3 handshake, then an HTTP request. With 100 ms round trips and no server processing time, roughly when does the first byte of the response arrive?",
	"After about 300 ms: one round trip each for TCP, TLS and the request",
	["After about 100 ms, because the handshakes run in parallel with the request",
	 "After about 200 ms, because TLS 1.3 needs no extra round trip",
	 "After about 600 ms, because every step needs two round trips"],
	"The steps depend on each other, so they cannot overlap: TCP takes one round trip, TLS 1.3 takes one more, and the request and the start of the reply take a third. That is 3 x 100 ms. TLS 1.3 reduced the handshake to one round trip but did not remove it, and no step needs two here.");

// ───────────────────────── memory-hierarchy-and-caching ─────────────────────────
const mh = t('memory-hierarchy-and-caching');

mh.add('basic', 'ram-vs-cache',
	"Roughly how much slower is reading from main memory (RAM) than from the CPU's L1 cache?",
	"About 100 times slower",
	["About the same speed", "About 2 times slower", "About a million times slower"],
	"An L1 hit takes around a nanosecond, while a trip to RAM takes on the order of 100 nanoseconds. A million times slower is closer to the gap between cache and a distant network round trip or a spinning disk, and the speeds are certainly not the same.");

mh.add('basic', 'locality',
	"What is locality of reference?",
	"Programs tend to reuse recently used data and to touch data near what they just used",
	["Keeping all of a program's data on one physical chip so that no slow trips to other chips are needed",
	 "A rule that data must be stored in sorted order",
	 "Running programs on the computer nearest to the user"],
	"Temporal locality means recent data is likely needed again, and spatial locality means data next to it is likely needed soon. Caches exploit both by keeping recent data and loading whole cache lines. It is a property of how programs behave, not a rule about chips, sorting or geography.");

mh.add('mid', 'hit-rate',
	"A cache has a 95% hit rate, a hit costs 1 ns and a miss costs 100 ns. What is the average access time?",
	"About 5.95 ns",
	["About 50 ns", "About 95 ns", "About 1 ns"],
	"The average is hitRate x hitCost + missRate x missCost = 0.95 x 1 + 0.05 x 100 = 0.95 + 5 = 5.95 ns. The rare misses dominate the cost, which is why raising the hit rate matters so much. 50 ns would be a 50% hit rate, and the other values ignore one of the two terms.");

mh.add('mid', 'row-vs-column',
	"A big 2D array is stored row by row. Why is summing it row by row faster than column by column?",
	"Along a row every value in each loaded cache line gets used; down a column nearly every access loads a new line",
	["Rows take up less memory than columns, so more of the array fits in the cache at once",
	 "Column order forces the CPU to sort the data first",
	 "Row order lets the entire array stay in L1"],
	"Neighbouring items in a row are neighbours in memory, so one 64-byte line serves several reads. Moving down a column jumps a whole row's worth of bytes each time, so almost every read misses the cache. The array is the same size either way, nothing is sorted, and a large array does not fit in L1.");

mh.add('advanced', 'invalidation',
	"What is cache invalidation, and why is it hard?",
	"Deciding when a cached copy is no longer valid; hard because the source can change without the cache knowing",
	["Removing the oldest entry when the cache is full, which is trivial in every cache",
	 "Encrypting cached data so only one user can read it",
	 "Moving data from RAM to disk when memory is low"],
	"A cache holds a copy, and the original can change behind its back. Choose a time to live, invalidate on writes, or version your keys, and each trades freshness against complexity and load. Evicting entries to make room is a separate matter (eviction policy), and encryption and swapping are unrelated.");

// ───────────────────────── compilers-and-runtimes ─────────────────────────
const cr = t('compilers-and-runtimes');

cr.add('basic', 'lexing',
	"What is the first stage of turning source code into something a machine can run?",
	"Lexing: splitting the text into tokens such as keywords, names and numbers",
	["Optimization: rewriting the program so that it runs faster once it has been understood",
	 "Linking: combining several object files",
	 "Garbage collection: freeing unused memory"],
	"Source code starts as plain characters. A lexer groups them into tokens, which the parser then arranges into a tree. Optimization and linking come later in the pipeline, and garbage collection is something a running program does, not part of translating it.");

cr.add('basic', 'ast',
	"What is an abstract syntax tree (AST)?",
	"A tree showing the structure of the code, such as which operator applies to which operands",
	["A list of every variable the program holds in memory while it is running, with their current values",
	 "The machine code a compiler produces",
	 "A diagram of how functions are called at run time"],
	"After parsing, code is represented as a tree: for 1 + 2 * 3 the multiplication node sits below the addition node, capturing precedence. Tools like compilers, linters, formatters and bundlers all work on ASTs. It describes the shape of the source, not memory contents, machine code or run-time calls.");

cr.add('mid', 'jit',
	"What does a JIT (just-in-time) compiler do?",
	"Compiles frequently run code to optimized machine code while the program is running",
	["Compiles the whole program to machine code once, before it ships, so nothing is compiled while it runs",
	 "Translates the source into another language at install time only",
	 "Interprets each line without ever generating machine code"],
	"Engines such as V8 start by interpreting bytecode, watch which functions run often, and compile those hot paths into fast machine code on the fly using what they learned about the actual values. Compiling everything ahead of time is what C, Rust or Go compilers do, and pure interpretation never produces machine code.");

cr.add('mid', 'type-erasure',
	"What is true of TypeScript type annotations at run time?",
	"They are erased during compilation, so the running JavaScript has no type information",
	["The JavaScript engine checks the annotations on every call while the code runs and reports mismatches",
	 "They become run-time checks that throw on a mismatch by default",
	 "They make the generated JavaScript run faster"],
	"The TypeScript compiler checks types and then strips them out, producing ordinary JavaScript. The engine never sees the annotations, so they cost nothing at run time, but they also cannot protect you from bad data arriving from outside. For that you need run-time validation.");

cr.add('advanced', 'deoptimization',
	"A JavaScript engine optimizes a function on the assumption that a variable is always a number, and then the function receives a string. What happens?",
	"The optimized code is discarded (deoptimized) and execution falls back to slower, general code",
	["The engine silently converts the string to a number, so the optimized code stays valid and keeps running",
	 "The program crashes with a type error raised by the optimizer",
	 "The engine recompiles the whole program ahead of time"],
	"Optimized machine code is built on guesses from earlier runs, protected by cheap guard checks. When a guard fails, the engine throws away the specialized code, falls back to the generic path and may optimize again later with new assumptions. The semantics of the program stay the same, only the speed changes.");

export const csQuestionBanks2 = [ss, rd, sg, pt, nw, mh, cr];
