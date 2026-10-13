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
	}
];
