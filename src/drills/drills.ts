// The 9 JS/TS drills (from stock-company-prep/exercises). Tests are async function BODIES run in a
// worker against the learner's module (`m`) with tiny helpers: eq, ok, rejects, sleep.
// Pure data — no bundler features — so Node scripts can import it for verification.

export interface Drill {
	id: string;
	file: string; // matches stubs/<file>.ts and ref/solutions/<file>.ts
	title: string;
	topic: string;
	prompt: string;
	tests: { name: string; body: string }[];
}

export const DRILLS: Drill[] = [
	{
		id: 'debounce',
		file: 'debounce',
		title: 'debounce & throttle',
		topic: 'Event loop · closures',
		prompt: 'Implement `debounce` (trailing: fires once, with the **last** args, after `ms` of quiet) and `throttle` (leading: fires immediately, then at most once per `ms`).\n\nFollow-ups interviewers ask: how do you cancel? what about `this`? how would you `flush()`?',
		tests: [
			{
				name: 'debounce fires once with the last args',
				body: `const calls = []; const d = m.debounce((x) => calls.push(x), 40);
d(1); d(2); d(3);
await sleep(15); ok(calls.length === 0, 'must not fire before the wait has elapsed');
await sleep(70); eq(calls, [3]);`
			},
			{
				name: 'throttle fires on the leading edge, then once per window',
				body: `const calls = []; const t = m.throttle((x) => calls.push(x), 50);
t('a'); t('b'); eq(calls, ['a']);
await sleep(70); t('c'); eq(calls, ['a', 'c']);`
			}
		]
	},
	{
		id: 'promisePool',
		file: 'promisePool',
		title: 'promise pool',
		topic: 'Async',
		prompt: 'Run `tasks` with **at most `limit` in flight**, keep the **result order**, and reject on the first error. Real use: fetching 500 quotes without opening 500 sockets.',
		tests: [
			{
				name: 'respects the limit and keeps order',
				body: `let active = 0, peak = 0;
const task = (v) => async () => { peak = Math.max(peak, ++active); await sleep(12 - v); active--; return v; };
const res = await m.promisePool([0,1,2,3,4,5].map(task), 2);
eq(res, [0,1,2,3,4,5]); eq(peak, 2);`
			},
			{
				name: 'rejects on the first error',
				body: `await rejects(m.promisePool([async () => 1, async () => { throw new Error('x'); }], 2), 'x');`
			}
		]
	},
	{
		id: 'promiseUtils',
		file: 'promiseUtils',
		title: 'Promise.all / allSettled',
		topic: 'Async',
		prompt: 'Re-implement `Promise.all` and `Promise.allSettled` **without using them**.\n\nGotchas: empty array, plain (non-promise) values, preserve order, reject fast.',
		tests: [
			{ name: 'all: order, plain values, empty', body: `eq(await m.all([1, Promise.resolve(2), new Promise((r) => setTimeout(() => r(3), 10))]), [1, 2, 3]); eq(await m.all([]), []);` },
			{ name: 'all: rejects', body: `await rejects(m.all([1, Promise.reject(new Error('no'))]), 'no');` },
			{ name: 'allSettled', body: `eq(await m.allSettled([1, Promise.reject('e')]), [{ status: 'fulfilled', value: 1 }, { status: 'rejected', reason: 'e' }]);` }
		]
	},
	{
		id: 'eventLoop',
		file: 'eventLoop',
		title: 'event loop order',
		topic: 'Event loop',
		prompt: 'Return the labels in the order they log. Predict first!\n\n`setTimeout(timeout, 0)` · `Promise.then(micro1)` · `queueMicrotask(micro2)` · `sync` · an async function that logs `async-start`, awaits, then logs `async-after-await`.',
		tests: [{ name: 'sync → microtasks (queue order) → macrotask', body: `eq(await m.eventLoopOrder(), ['sync', 'async-start', 'micro1', 'micro2', 'async-after-await', 'timeout']);` }]
	},
	{
		id: 'memoize',
		file: 'memoize',
		title: 'memoize with eviction',
		topic: 'Closures',
		prompt: 'Memoize with a custom key resolver and a `max` cache size that evicts the **oldest** entry.\n\nFollow-up: memory-leak risk? (hint: `WeakMap` for object keys)',
		tests: [
			{
				name: 'caches and evicts the oldest past max',
				body: `let n = 0; const m2 = m.memoize((x) => { n++; return x * 2; }, { max: 2 });
m2(1); m2(1); m2(2); m2(3); eq(n, 3);
m2(1); eq(n, 4);`
			}
		]
	},
	{
		id: 'inheritance',
		file: 'inheritance',
		title: 'prototype inheritance',
		topic: 'Prototypes',
		prompt: 'Implement `inherit(Child, Parent)` using **only prototypes** (no `class`/`extends`): chain `Child.prototype` to `Parent.prototype`, fix `constructor`, and keep `instanceof` working.\n\nThen explain how `class extends` desugars to this.',
		tests: [
			{
				name: 'prototype chain, constructor, instanceof',
				body: `function Animal(n) { this.n = n; }
Animal.prototype.speak = function () { return this.n + ' makes a sound'; };
function Dog(n) { Animal.call(this, n); }
m.inherit(Dog, Animal);
const d = new Dog('Rex');
ok(d instanceof Animal, 'instanceof Animal'); eq(d.speak(), 'Rex makes a sound');
ok(Dog.prototype.constructor === Dog, 'constructor points to Dog');
ok(!Object.keys(Dog.prototype).includes('constructor'), 'constructor should be non-enumerable');`
			}
		]
	},
	{
		id: 'lru',
		file: 'lru',
		title: 'LRU cache',
		topic: 'DSA',
		prompt: 'LRU cache with **O(1)** `get` / `put`. The classic frontend DSA question.\n\nHint: a `Map` remembers insertion order.',
		tests: [
			{
				name: 'evicts the least recently used',
				body: `const c = new m.LRUCache(2); c.put('a', 1); c.put('b', 2); c.get('a'); c.put('c', 3);
eq(c.get('b'), undefined); eq(c.get('a'), 1); eq(c.get('c'), 3);`
			}
		]
	},
	{
		id: 'emitter',
		file: 'emitter',
		title: 'Emitter without leaks',
		topic: 'Memory · errors',
		prompt: '`on` returns an unsubscribe fn, `once` works, removing the last listener deletes the event key (no leaks), and a throwing handler must **not** stop the others — report it via `onError` (constructor arg, default `console.error`).',
		tests: [
			{
				name: 'on/off/once, no leaks, error isolation',
				body: `const errs = []; const e = new m.Emitter((x) => errs.push(x));
let a = 0, b = 0; const off = e.on('tick', () => a++); e.once('tick', () => b++); e.on('tick', () => { throw new Error('boom'); });
e.emit('tick', 1); e.emit('tick', 2);
eq(a, 2); eq(b, 1); eq(errs.length, 2);
off(); eq(e.listenerCount('tick'), 1);`
			}
		]
	},
	{
		id: 'retry',
		file: 'retry',
		title: 'retry + backoff + abort',
		topic: 'Errors · async',
		prompt: 'Retry with **exponential backoff** (`baseMs * 2**attempt`) and `AbortSignal` support. Real use: flaky quote/order APIs on bad mobile networks.',
		tests: [
			{ name: 'retries with backoff then succeeds', body: `let n = 0; const r = await m.retry(async () => { if (++n < 3) throw new Error('flaky'); return 'ok'; }, { retries: 3, baseMs: 5 }); eq(r, 'ok'); eq(n, 3);` },
			{ name: 'gives up after retries', body: `await rejects(m.retry(async () => { throw new Error('dead'); }, { retries: 2, baseMs: 5 }), 'dead');` },
			{
				name: 'honours AbortSignal',
				body: `const ac = new AbortController();
const p = m.retry(async () => { throw new Error('x'); }, { retries: 5, baseMs: 80, signal: ac.signal });
setTimeout(() => ac.abort(new Error('aborted')), 20);
await rejects(p);`
			}
		]
	},
	{
		id: 'flatten',
		file: 'flatten',
		title: 'flatten nested arrays',
		topic: 'Interview · SDE 1',
		prompt: 'Implement `flatten(arr, depth = Infinity)`: flatten nested arrays up to `depth` levels. Do not mutate the input.\n\nFollow-ups interviewers ask: do it iteratively with an explicit stack (deep nesting blows the call stack); what does `Array.prototype.flat` do with holes?',
		tests: [
			{ name: 'flattens fully by default', body: `eq(m.flatten([1, [2, [3, [4, []]]], 5]), [1, 2, 3, 4, 5]);` },
			{ name: 'respects depth', body: `eq(m.flatten([1, [2, [3, [4]]]], 1), [1, 2, [3, [4]]]); eq(m.flatten([1, [2, [3, [4]]]], 2), [1, 2, 3, [4]]);` },
			{ name: 'depth 0 returns a copy, input is not mutated', body: `const a = [1, [2]]; const r = m.flatten(a, 0); eq(r, [1, [2]]); ok(r !== a, 'must be a new array'); eq(a, [1, [2]]);` },
			{ name: 'empty input', body: `eq(m.flatten([]), []); eq(m.flatten([[], [[]]]), []);` }
		]
	},
	{
		id: 'deepClone',
		file: 'deepClone',
		title: 'deepClone & deepEqual',
		topic: 'Interview · SDE 2',
		prompt: 'Implement `deepClone(value)` for primitives, arrays, plain objects, `Date`, `Map`, `Set`, and **circular references**. Also implement `deepEqual(a, b)` (key order does not matter, `NaN` equals `NaN`, array is not equal to object).\n\nFollow-ups: why is `JSON.parse(JSON.stringify(x))` not enough? when would you reach for `structuredClone`? how do you keep the cycle map from leaking (WeakMap)?',
		tests: [
			{ name: 'clone is independent', body: `const o = { a: [1, { b: 2 }], c: { d: 3 } }; const c = m.deepClone(o); eq(c, o); c.a[1].b = 99; c.c.d = 0; eq(o, { a: [1, { b: 2 }], c: { d: 3 } });` },
			{ name: 'clones Date, Map and Set', body: `const d = new Date(1000); const cd = m.deepClone(d); ok(cd instanceof Date && cd !== d && cd.getTime() === 1000, 'Date');
const mp = new Map([['k', { v: 1 }]]); const cm = m.deepClone(mp); ok(cm instanceof Map && cm !== mp && cm.get('k') !== mp.get('k') && cm.get('k').v === 1, 'Map');
const s = new Set([1, 2]); const cs = m.deepClone(s); ok(cs instanceof Set && cs !== s && cs.has(2), 'Set');` },
			{ name: 'handles circular references', body: `const a = { n: 1 }; a.self = a; const c = m.deepClone(a); ok(c !== a, 'new object'); ok(c.self === c, 'cycle preserved in the clone'); eq(c.n, 1);` },
			{ name: 'deepEqual: equal values', body: `ok(m.deepEqual({ a: 1, b: [1, 2] }, { b: [1, 2], a: 1 }), 'key order'); ok(m.deepEqual(NaN, NaN), 'NaN'); ok(m.deepEqual(new Date(5), new Date(5)), 'dates');` },
			{ name: 'deepEqual: different values', body: `ok(!m.deepEqual([1, 2], [1, '2']), 'type'); ok(!m.deepEqual(null, {}), 'null vs object'); ok(!m.deepEqual([], {}), 'array vs object'); ok(!m.deepEqual({ a: 1 }, { a: 1, b: undefined }), 'extra key');` }
		]
	},
	{
		id: 'groupBy',
		file: 'groupBy',
		title: 'groupBy & chunk',
		topic: 'Interview · SDE 1',
		prompt: 'Implement `groupBy(items, key)` where `key` is a function or a property name, returning `{ [group]: items[] }` in original order. Implement `chunk(arr, size)` that splits into groups of `size` (last one may be shorter) and throws `RangeError` when `size` is not a positive integer.\n\nFollow-ups: what breaks if a group key is `__proto__` or `constructor`? how would you write it with `reduce`?',
		tests: [
			{ name: 'groupBy with a function', body: `eq(m.groupBy([1.2, 1.5, 2.1], Math.floor), { '1': [1.2, 1.5], '2': [2.1] });` },
			{ name: 'groupBy with a property name, order kept', body: `const people = [{ n: 'a', t: 'x' }, { n: 'b', t: 'y' }, { n: 'c', t: 'x' }];
eq(m.groupBy(people, 't'), { x: [{ n: 'a', t: 'x' }, { n: 'c', t: 'x' }], y: [{ n: 'b', t: 'y' }] });` },
			{ name: 'groupBy survives a constructor key', body: `const r = m.groupBy([{ k: 'constructor', v: 1 }, { k: 'constructor', v: 2 }], 'k'); eq(r.constructor, [{ k: 'constructor', v: 1 }, { k: 'constructor', v: 2 }]);` },
			{ name: 'chunk basics', body: `eq(m.chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]); eq(m.chunk([], 3), []); eq(m.chunk([1, 2], 5), [[1, 2]]);` },
			{ name: 'chunk rejects a bad size', body: `for (const bad of [0, -1, 1.5]) { let threw = false; try { m.chunk([1], bad); } catch (e) { threw = e instanceof RangeError; } ok(threw, 'size ' + bad + ' must throw RangeError'); }` }
		]
	},
	{
		id: 'curryCompose',
		file: 'curryCompose',
		title: 'curry, compose, pipe',
		topic: 'Interview · SDE 1',
		prompt: 'Implement `curry(fn)` (use `fn.length`; the caller may pass args in any grouping: `f(1)(2)(3)`, `f(1, 2)(3)`, `f(1)(2, 3)`), `compose(...fns)` (right to left) and `pipe(...fns)` (left to right, the first function may take several args).\n\nFollow-ups: what breaks with default or rest parameters (`fn.length`)? how would you support placeholders? why is `compose()` with no functions the identity?',
		tests: [
			{ name: 'curry accepts any grouping', body: `const c = m.curry((a, b, c) => a + b + c); eq(c(1)(2)(3), 6); eq(c(1, 2)(3), 6); eq(c(1)(2, 3), 6); eq(c(1, 2, 3), 6);` },
			{ name: 'curry returns reusable partials', body: `const add = m.curry((a, b) => a + b); const inc = add(1); eq(inc(1), 2); eq(inc(10), 11);` },
			{ name: 'compose runs right to left', body: `eq(m.compose((x) => x + 1, (x) => x * 2)(5), 11);` },
			{ name: 'pipe runs left to right, first fn takes many args', body: `eq(m.pipe((a, b) => a + b, (x) => x * 10)(1, 2), 30); eq(m.pipe((x) => x + 1, (x) => x * 2)(5), 12);` },
			{ name: 'empty compose is the identity', body: `eq(m.compose()(7), 7);` }
		]
	},
	{
		id: 'ttlMemo',
		file: 'ttlMemo',
		title: 'memoize with TTL',
		topic: 'Interview · SDE 2',
		prompt: 'Implement `memoizeTTL(fn, ttlMs, now = Date.now)`. Results are cached per argument list for `ttlMs`; an entry is expired when `now() - storedAt >= ttlMs`. Expose `.clear()`. Falsy and `undefined` results are valid cache entries. For async functions, a **rejected** promise must not stay cached.\n\nFollow-ups: how would you bound memory (max size, LRU)? how do you avoid a thundering herd (caching the in-flight promise)?',
		tests: [
			{ name: 'hits within the ttl', body: `let t = 0, n = 0; const f = m.memoizeTTL((x) => { n++; return x * 2; }, 100, () => t); eq(f(2), 4); t = 99; eq(f(2), 4); eq(n, 1);` },
			{ name: 'expires at the ttl boundary', body: `let t = 0, n = 0; const f = m.memoizeTTL((x) => { n++; return x; }, 100, () => t); f(1); t = 100; f(1); eq(n, 2);` },
			{ name: 'separate entries per args, caches undefined', body: `let n = 0; const f = m.memoizeTTL((a, b) => { n++; return undefined; }, 100, () => 0); f(1, 2); f(1, 2); f(2, 1); eq(n, 2);` },
			{ name: 'clear() empties the cache', body: `let n = 0; const f = m.memoizeTTL(() => ++n, 100, () => 0); f(); f.clear(); f(); eq(n, 2);` },
			{ name: 'does not cache rejected promises', body: `let n = 0; const f = m.memoizeTTL(async () => { if (++n === 1) throw new Error('boom'); return 'ok'; }, 1000, () => 0);
await rejects(f(), 'boom'); await sleep(0); eq(await f(), 'ok'); eq(n, 2);` }
		]
	},
	{
		id: 'tokenBucket',
		file: 'tokenBucket',
		title: 'token-bucket rate limiter',
		topic: 'Interview · SDE 2',
		prompt: 'Implement `TokenBucket(capacity, refillPerSec, now = Date.now)` with `tryTake(n = 1)`. It starts full, refills **lazily** (compute from elapsed time on each call, no timers), never exceeds `capacity`, and a rejected request must not consume tokens.\n\nFollow-ups: how do you rate-limit per user (a Map of buckets, and how do you evict idle ones)? how would you make it work across servers (atomic Redis script)? token bucket vs fixed vs sliding window?',
		tests: [
			{ name: 'starts full and runs dry', body: `const b = new m.TokenBucket(3, 1, () => 0); eq([b.tryTake(), b.tryTake(), b.tryTake(), b.tryTake()], [true, true, true, false]);` },
			{ name: 'refills over time', body: `let t = 0; const b = new m.TokenBucket(5, 2, () => t); b.tryTake(5); ok(!b.tryTake(), 'empty'); t = 1000; ok(b.tryTake(2), '2 tokens after 1s'); ok(!b.tryTake(), 'then empty again');` },
			{ name: 'never exceeds capacity', body: `let t = 0; const b = new m.TokenBucket(2, 10, () => t); b.tryTake(2); t = 60000; ok(b.tryTake(2), 'full again'); ok(!b.tryTake(), 'but not more than capacity');` },
			{ name: 'fractional refill accumulates', body: `let t = 0; const b = new m.TokenBucket(1, 1, () => t); b.tryTake(); t = 500; ok(!b.tryTake(), 'half a token is not enough'); t = 1000; ok(b.tryTake(), 'a full token after 1s total');` },
			{ name: 'a rejected request consumes nothing', body: `const b = new m.TokenBucket(3, 0, () => 0); ok(!b.tryTake(4), 'asks for more than capacity'); ok(b.tryTake(3), 'all 3 tokens still there');` }
		]
	},
	{
		id: 'arrayProblems',
		file: 'arrayProblems',
		title: 'two-sum, parentheses, intervals, top-k',
		topic: 'Interview · SDE 1',
		prompt: 'Four evergreen problems:\n- `twoSum(nums, target)` returns indices `[i, j]` with `i < j`, or `null` (one pass, hash map).\n- `validParentheses(s)` for `()[]{}` (stack).\n- `mergeIntervals(intervals)` returns merged, sorted intervals; touching intervals (`[1,4]`,`[4,5]`) merge; do not mutate the input.\n- `topKFrequent(nums, k)` returns the k most frequent numbers, ties broken by the smaller number first.\n\nFollow-ups: complexity of each? top-k in O(n) with bucket sort, or O(n log k) with a heap?',
		tests: [
			{ name: 'twoSum', body: `eq(m.twoSum([2, 7, 11, 15], 9), [0, 1]); eq(m.twoSum([3, 2, 4], 6), [1, 2]); eq(m.twoSum([3, 3], 6), [0, 1]); eq(m.twoSum([1, 2], 10), null);` },
			{ name: 'validParentheses', body: `ok(m.validParentheses('()[]{}') && m.validParentheses('{[]}') && m.validParentheses(''), 'valid'); ok(!m.validParentheses('(]') && !m.validParentheses('([)]') && !m.validParentheses('(') && !m.validParentheses(')'), 'invalid');` },
			{ name: 'mergeIntervals', body: `eq(m.mergeIntervals([[1, 3], [2, 6], [8, 10], [15, 18]]), [[1, 6], [8, 10], [15, 18]]); eq(m.mergeIntervals([[1, 4], [4, 5]]), [[1, 5]]); eq(m.mergeIntervals([[5, 6], [1, 2], [2, 3]]), [[1, 3], [5, 6]]); eq(m.mergeIntervals([]), []);` },
			{ name: 'mergeIntervals does not mutate the input', body: `const input = [[5, 6], [1, 2], [2, 3]]; m.mergeIntervals(input); eq(input, [[5, 6], [1, 2], [2, 3]]);` },
			{ name: 'topKFrequent', body: `eq(m.topKFrequent([1, 1, 1, 2, 2, 3], 2), [1, 2]); eq(m.topKFrequent([4, 5, 5, 4, 9], 2), [4, 5]); eq(m.topKFrequent([7], 1), [7]);` }
		]
	},
	{
		id: 'binarySearch',
		file: 'binarySearch',
		title: 'binary search variants',
		topic: 'Interview · SDE 1',
		prompt: 'Implement three binary searches, all O(log n):\n- `lowerBound(a, x)`: first index with `a[i] >= x` (`a.length` if none).\n- `upperBound(a, x)`: first index with `a[i] > x`.\n- `searchRotated(a, target)`: index of `target` in a rotated sorted array of distinct values, else `-1`.\n\nFollow-ups: how do you count occurrences of `x` from these two? why `lo + (hi - lo) / 2` in other languages? what changes if the rotated array has duplicates?',
		tests: [
			{ name: 'lowerBound', body: `eq(m.lowerBound([1, 2, 2, 2, 3], 2), 1); eq(m.lowerBound([1, 2, 4], 3), 2); eq(m.lowerBound([1, 2], 0), 0); eq(m.lowerBound([1, 2], 9), 2); eq(m.lowerBound([], 5), 0);` },
			{ name: 'upperBound', body: `eq(m.upperBound([1, 2, 2, 2, 3], 2), 4); eq(m.upperBound([1, 2, 4], 3), 2); eq(m.upperBound([1, 2], 2), 2); eq(m.upperBound([], 5), 0);` },
			{ name: 'count occurrences via the two bounds', body: `const a = [1, 2, 2, 2, 3, 5]; eq(m.upperBound(a, 2) - m.lowerBound(a, 2), 3); eq(m.upperBound(a, 4) - m.lowerBound(a, 4), 0);` },
			{ name: 'searchRotated finds every element', body: `const a = [4, 5, 6, 7, 0, 1, 2]; a.forEach((v, i) => eq(m.searchRotated(a, v), i)); eq(m.searchRotated(a, 3), -1);` },
			{ name: 'searchRotated edge cases', body: `eq(m.searchRotated([1], 1), 0); eq(m.searchRotated([1], 2), -1); eq(m.searchRotated([1, 2, 3], 3), 2); eq(m.searchRotated([3, 1], 1), 1); eq(m.searchRotated([], 1), -1);` }
		]
	},
	{
		id: 'taskQueue',
		file: 'taskQueue',
		title: 'async task queue',
		topic: 'Interview · SDE 2',
		prompt: 'Build `TaskQueue(concurrency)`. `add(task)` takes an async function and returns a promise of **that task\'s** result. At most `concurrency` tasks run at once, they start in FIFO order, and a failing task rejects only its own promise. `onIdle()` resolves when nothing is running or waiting.\n\nUnlike a one-shot promise pool, tasks arrive over time. Follow-ups: how do you add priorities? pause/resume? a per-task timeout? backpressure when the queue gets too long?',
		tests: [
			{ name: 'respects the concurrency limit and returns results', body: `let active = 0, peak = 0; const q = new m.TaskQueue(2);
const job = (v) => () => (async () => { peak = Math.max(peak, ++active); await sleep(10); active--; return v; })();
const res = await Promise.all([1, 2, 3, 4, 5, 6].map((v) => q.add(job(v)))); eq(res, [1, 2, 3, 4, 5, 6]); eq(peak, 2);` },
			{ name: 'starts tasks in FIFO order', body: `const q = new m.TaskQueue(1); const started = [];
const mk = (n) => async () => { started.push(n); await sleep(3); };
await Promise.all([q.add(mk('a')), q.add(mk('b')), q.add(mk('c'))]); eq(started, ['a', 'b', 'c']);` },
			{ name: 'a failing task does not stop the queue', body: `const q = new m.TaskQueue(1);
const bad = q.add(async () => { throw new Error('nope'); }); const good = q.add(async () => 'fine');
await rejects(bad, 'nope'); eq(await good, 'fine');` },
			{ name: 'onIdle waits for all work, even tasks added later', body: `const q = new m.TaskQueue(2); let done = 0;
for (let i = 0; i < 4; i++) q.add(async () => { await sleep(10); done++; });
await q.onIdle(); eq(done, 4);
q.add(async () => { await sleep(5); done++; }); await q.onIdle(); eq(done, 5);` },
			{ name: 'onIdle resolves immediately when empty', body: `const q = new m.TaskQueue(3); await q.onIdle(); ok(true);` }
		]
	},
	{
		id: 'store',
		file: 'store',
		title: 'tiny pub-sub store',
		topic: 'Interview · SDE 2',
		prompt: 'Build `createStore(reducer, initialState)` returning `{ getState, dispatch, subscribe }` (a mini Redux). `dispatch(action)` runs the reducer then notifies subscribers; `subscribe(fn)` returns an unsubscribe function and does not call `fn` immediately. Notify using a **snapshot** of the listeners taken at dispatch time, so unsubscribing during a dispatch cannot skip anyone. If the reducer throws, state stays the same and nobody is notified.\n\nFollow-ups: why must reducers be pure? how does a selector avoid needless re-renders? what would middleware look like?',
		tests: [
			{ name: 'reduces actions into state', body: `const s = m.createStore((st, a) => (a.type === 'inc' ? st + a.by : st), 0); s.dispatch({ type: 'inc', by: 2 }); s.dispatch({ type: 'noop' }); s.dispatch({ type: 'inc', by: 3 }); eq(s.getState(), 5);` },
			{ name: 'notifies after dispatch, not on subscribe', body: `const s = m.createStore((st) => st + 1, 0); let calls = 0; s.subscribe(() => calls++); eq(calls, 0); s.dispatch({}); s.dispatch({}); eq(calls, 2);` },
			{ name: 'unsubscribe stops notifications', body: `const s = m.createStore((st) => st + 1, 0); let calls = 0; const off = s.subscribe(() => calls++); s.dispatch({}); off(); s.dispatch({}); eq(calls, 1);` },
			{ name: 'unsubscribing during dispatch does not skip listeners', body: `const s = m.createStore((st) => st + 1, 0); const log = []; let offB;
s.subscribe(() => { log.push('a'); offB(); }); offB = s.subscribe(() => log.push('b'));
s.dispatch({}); eq(log, ['a', 'b']); s.dispatch({}); eq(log, ['a', 'b', 'a']);` },
			{ name: 'a throwing reducer leaves state and listeners alone', body: `const s = m.createStore((st, a) => { if (a.bad) throw new Error('bad'); return st + 1; }, 0); let calls = 0; s.subscribe(() => calls++);
s.dispatch({}); let threw = false; try { s.dispatch({ bad: true }); } catch { threw = true; } ok(threw, 'error propagates'); eq(s.getState(), 1); eq(calls, 1);` }
		]
	},
	{
		id: 'trie',
		file: 'trie',
		title: 'trie for autocomplete',
		topic: 'Interview · SDE 2',
		prompt: 'Implement a `Trie` with `insert(word)`, `search(word)` (exact word), `startsWith(prefix)` and `suggest(prefix, limit = 5)` which returns up to `limit` stored words starting with `prefix`, in alphabetical order (the prefix itself counts if it is a stored word).\n\nFollow-ups: time/space complexity? how do you rank suggestions by popularity instead of alphabetically (store counts, top-k per node)? how do you support delete?',
		tests: [
			{ name: 'search vs startsWith', body: `const t = new m.Trie(); t.insert('apple'); ok(t.search('apple'), 'exact'); ok(!t.search('app'), 'a prefix is not a word'); ok(t.startsWith('app'), 'prefix'); ok(!t.startsWith('apx'), 'unknown prefix');` },
			{ name: 'suggest is alphabetical and includes the prefix word', body: `const t = new m.Trie(); ['apple', 'app', 'apply', 'apt', 'bat'].forEach((w) => t.insert(w)); eq(t.suggest('ap'), ['app', 'apple', 'apply', 'apt']); eq(t.suggest('app'), ['app', 'apple', 'apply']);` },
			{ name: 'suggest respects limit and unknown prefixes', body: `const t = new m.Trie(); ['a', 'ab', 'abc', 'abd'].forEach((w) => t.insert(w)); eq(t.suggest('a', 2), ['a', 'ab']); eq(t.suggest('z'), []);` },
			{ name: 'duplicate inserts do not duplicate suggestions', body: `const t = new m.Trie(); t.insert('go'); t.insert('go'); eq(t.suggest('g'), ['go']);` },
			{ name: 'empty prefix lists words', body: `const t = new m.Trie(); ['b', 'a', 'c'].forEach((w) => t.insert(w)); eq(t.suggest('', 2), ['a', 'b']);` }
		]
	},
	{
		id: 'middleware',
		file: 'middleware',
		title: 'middleware pipeline',
		topic: 'Interview · SDE 2',
		prompt: 'Build an Express/Koa-style `App` with `use(fn)` (chainable) and `run(ctx)`. Each middleware is `fn(ctx, next)`, sync or async. `await next()` runs everything downstream, then control returns (the "onion" model). A middleware that does not call `next()` stops the chain. An error thrown downstream must reach an upstream `try/catch`. Calling `next()` twice in one middleware must reject.\n\nFollow-ups: how would you add error-handling middleware like Express `(err, req, res, next)`? how does this compose with routing?',
		tests: [
			{ name: 'runs in onion order', body: `const log = []; const app = new m.App();
app.use(async (c, next) => { log.push('a1'); await next(); log.push('a2'); }).use(async (c, next) => { log.push('b1'); await next(); log.push('b2'); }).use(() => { log.push('end'); });
await app.run({}); eq(log, ['a1', 'b1', 'end', 'b2', 'a2']);` },
			{ name: 'shares ctx and supports sync middleware', body: `const app = new m.App(); app.use((c, next) => { c.n = 1; return next(); }).use(async (c) => { await sleep(3); c.n += 1; }); const ctx = {}; await app.run(ctx); eq(ctx.n, 2);` },
			{ name: 'not calling next stops the chain', body: `const log = []; const app = new m.App(); app.use(() => { log.push('gate'); }).use(() => { log.push('never'); }); await app.run({}); eq(log, ['gate']);` },
			{ name: 'downstream errors reach an upstream try/catch', body: `const log = []; const app = new m.App();
app.use(async (c, next) => { try { await next(); } catch (e) { log.push('caught ' + e.message); } }).use(async () => { await sleep(2); throw new Error('db down'); });
await app.run({}); eq(log, ['caught db down']);` },
			{ name: 'next() twice rejects; empty app resolves', body: `const app = new m.App(); app.use(async (c, next) => { await next(); await next(); }).use(() => {}); await rejects(app.run({}), 'multiple'); await new m.App().run({});` }
		]
	}
];
