import type { DbTopic } from '../types';
import type { Question } from '../../quiz/types';
import { builder } from '../../quiz/types';

// Interview prep, frontend area: JavaScript, TypeScript, React, Next.js and the web platform.
// Notes are written with a section sign standing in for the backtick so code fences can live inside template strings.
// `try` snippets are plain JavaScript (no imports, no DOM, no network) and avoid backticks and the dollar-brace sequence.
const md = (s: string) => s.replace(/§/g, '`').trim();

export const topics: DbTopic[] = [
	// ───────────────────────── JavaScript core ─────────────────────────
	{
		id: 'iv-js-core',
		title: 'JavaScript core and async',
		level: 'basic',
		summary: 'Answer the JavaScript questions that open almost every frontend interview: scope, closures, this, prototypes, the event loop and promises.',
		scenes: [],
		notes: md(`
**Q. What is the difference between var, let and const? What is the temporal dead zone?** §SDE 1§
§var§ is function-scoped and hoisted with the value undefined. §let§ and §const§ are block-scoped and hoisted but unusable until their line runs: that gap is the temporal dead zone, and touching the name there throws a ReferenceError. §const§ stops re-assignment, not mutation of the object it points to.

**Q. What is a closure? Give a real use.** §SDE 1§
A function keeps access to the variables of the scope where it was created, even after that scope has returned. Uses: private state, factories, memoization, debounce, event handlers that remember data.

**Q. Why does this print 3, 3, 3 and how do you fix it?** §SDE 1§
§§§js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);
§§§
One shared function-scoped §i§ is already 3 when the callbacks run. Use §let§ (a fresh binding per iteration) or wrap the body in a function that takes §i§.

**Q. How is this decided?** §SDE 1§
By how a function is called: §new§ binds the new object, §call/apply/bind§ bind the given object, a method call binds the object before the dot, a plain call gives undefined in strict mode. Arrow functions have no own §this§ and use the one from where they were written.

**Q. == versus ===, and what are the falsy values?** §SDE 1§
§===§ compares without type conversion; §==§ converts first (§0 == "0"§ is true). Falsy: §false, 0, -0, 0n, "", null, undefined, NaN§. Empty arrays and objects are truthy. §typeof null§ is "object", a historical bug.

**Q. Are objects passed by value or reference? How do you copy one?** §SDE 1§
Everything is passed by value, but for objects the value is a reference, so a function can mutate the caller's object. Spread and §Object.assign§ copy one level only. §structuredClone§ makes a deep copy (no functions); JSON round trips lose dates, undefined and Map.

**Q. Explain the event loop: microtasks versus macrotasks.** §SDE 1§
One thread runs the call stack. When it is empty the engine drains the whole microtask queue (promise callbacks, §queueMicrotask§), then takes one macrotask (§setTimeout§, events, I/O), then drains microtasks again. So a resolved promise callback always runs before a §setTimeout(fn, 0)§.

**Q. Promise.all, allSettled, race, any?** §SDE 1§
§all§ rejects on the first failure. §allSettled§ always resolves with each outcome. §race§ settles with the first to settle. §any§ resolves with the first success and rejects with an AggregateError only if all fail.

**Q. Debounce versus throttle?** §SDE 1§
Debounce waits until calls stop for N ms (search box). Throttle lets at most one call through per N ms (scroll, resize). Both need a timer kept in a closure.

**Q. How does prototypal inheritance work, and what is a class?** §SDE 2§
Property lookup walks the prototype chain via the hidden link, ending at null. A §class§ is syntax over constructor functions and §prototype§: methods live once on the prototype, fields on each instance. §Object.create(p)§ makes an object whose prototype is §p§.
Follow-up: what does §new§ do step by step? Why are arrow-function methods per instance?

**Q. await in a loop versus Promise.all?** §SDE 2§
§await§ inside a §for§ runs the calls one after another. For independent calls start them all and await together: §await Promise.all(ids.map(load))§. Use a concurrency limit when the list is large or the server rate-limits.
Follow-up: where does an error thrown inside §map§ end up? How do you cancel with AbortController?

**Q. What causes memory leaks in a web app?** §SDE 2§
Listeners and timers never removed, closures holding big objects, detached DOM nodes still referenced, growing caches. Use §WeakMap§/§WeakRef§ for caches keyed by objects, remove listeners on cleanup, and find leaks with a heap snapshot comparison.
Follow-up: how would you debug a page whose memory grows after every route change?

**Q. Implement bind or a promise pool from scratch.** §SDE 2§
Interviewers want the idea: §bind§ returns a function that calls the original with a fixed §this§ and leading args; a pool keeps N workers that each pull the next task until the list is empty.
Follow-up: what happens to the pool when one task rejects?

**What interviewers look for:** you predict output order out loud, name microtask versus macrotask correctly, explain closures with a real example, and write small utilities (debounce, once, pool) without a library.
`),
		try: [
			{
				label: 'Predict the order',
				code: String.raw`// Exercise: predict the order of these seven lines BEFORE you run it.
// Then run it and explain each surprise: sync code, microtasks, then the timer.
console.log('A start');
setTimeout(() => console.log('B timeout 0'), 0);
Promise.resolve().then(() => console.log('C promise then'));
queueMicrotask(() => console.log('D queueMicrotask'));
(async () => {
  console.log('E inside async, before await');
  await null;
  console.log('F after await');
})();
console.log('G end');`
			},
			{
				label: 'Fix the loop closure',
				code: String.raw`// Exercise: this prints 3 3 3 using var. Make it print 0 1 2 WITHOUT changing var to let.
// TODO: wrap the callback so each timer remembers its own number (an IIFE or a helper that returns a function).
const out = [];
for (var i = 0; i < 3; i++) {
  // TODO: capture i here
  setTimeout(() => out.push(i), 0);
}
setTimeout(() => console.log(out.join(' ')), 10);`
			},
			{
				label: 'Write debounce',
				code: String.raw`// Exercise: implement debounce(fn, ms): only the LAST call in a burst runs, ms after it.
// Expected output: "search: java" printed once.
function debounce(fn, ms) {
  // TODO: keep a timer id in a closure, clear it on each call, set a new one
  return function (...args) {
    fn.apply(this, args); // naive version: runs every time. Replace it.
  };
}
const search = debounce((q) => console.log('search: ' + q), 50);
search('j'); search('ja'); search('jav'); search('java');`
			},
			{
				label: 'Promise pool with a limit',
				code: String.raw`// Exercise: run tasks with at most "limit" in flight at once, keep results in order.
// Expected: results [10,20,30,40,50] and maxActive 2.
const sleep = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));
let active = 0, maxActive = 0;
const tasks = [1, 2, 3, 4, 5].map((n) => async () => {
  active++; maxActive = Math.max(maxActive, active);
  const v = await sleep(10 * (6 - n), n * 10);
  active--; return v;
});
async function pool(tasks, limit) {
  const results = [];
  // TODO: start "limit" workers; each worker takes the next index until none are left
  for (let i = 0; i < tasks.length; i++) results[i] = await tasks[i](); // sequential for now
  return results;
}
pool(tasks, 2).then((r) => console.log('results', JSON.stringify(r), 'maxActive', maxActive));`
			}
		]
	},

	// ───────────────────────── TypeScript ─────────────────────────
	{
		id: 'iv-typescript',
		title: 'TypeScript in interviews',
		level: 'mid',
		summary: 'Explain generics, narrowing, utility types and type versus interface the way interviewers expect for SDE 1 and SDE 2.',
		scenes: [],
		notes: md(`
**Q. any versus unknown versus never?** §SDE 1§
§any§ switches checking off. §unknown§ accepts anything but must be narrowed before use, so it is the safe choice for external data. §never§ is the type of values that cannot exist: a function that always throws, or the leftover case in an exhaustive switch.

**Q. type versus interface?** §SDE 1§
Both describe object shapes. Interfaces can be extended and merged by re-declaring the same name. Types can also name unions, tuples, mapped and conditional types. Pick one convention per codebase; use §interface§ for public object contracts and §type§ for unions and computed types.

**Q. What is structural typing?** §SDE 1§
Compatibility depends on shape, not name. An object with the needed properties fits, even if it was never declared to implement the type. Fresh object literals still get excess property checks.

**Q. Write a generic function and a constraint.** §SDE 1§
§§§ts
function pluck<T, K extends keyof T>(o: T, k: K): T[K] { return o[k]; }
§§§
§K extends keyof T§ limits the key to real properties and the return type follows the key.

**Q. How does narrowing work?** §SDE 1§
The compiler refines a type inside a branch: §typeof§, §instanceof§, §in§, equality, truthiness, and discriminated unions (a shared literal tag such as §kind§). A custom guard returns §x is Foo§.

**Q. Name the common utility types.** §SDE 1§
§Partial§, §Required§, §Readonly§, §Pick§, §Omit§, §Record§, §ReturnType§, §Parameters§, §NonNullable§, §Awaited§. Know that §Omit§ takes keys loosely while §Exclude§ works on union members.

**Q. What is a discriminated union and how do you check it is exhaustive?** §SDE 1§
A union whose members share a literal field. In the default branch assign the value to a §never§ variable: if a new member is added and not handled, the build fails.

**Q. Explain mapped and conditional types.** §SDE 2§
Mapped: §type Flags<T> = { [K in keyof T]: boolean }§ transforms every key. Conditional: §T extends U ? X : Y§ picks a type by shape, and §infer§ captures part of it, as in §ReturnType§. A conditional on a bare type parameter distributes over a union.
Follow-up: why does §Omit§ not distribute over a union and how do you fix it?

**Q. What does satisfies do?** §SDE 2§
It checks a value against a type without widening it. §const routes = {...} satisfies Record<string, string>§ keeps the exact literal keys but still errors on bad values.

**Q. Types vanish at runtime. How do you trust API data?** §SDE 2§
Parse at the boundary with a runtime validator (zod, valibot) and derive the type from the schema. A cast like §as User§ is only a promise.
Follow-up: where would you put validation in a Next.js app?

**Q. Enums versus string unions, and as const?** §SDE 2§
String unions cost nothing at runtime and are easy to serialize. Enums emit code. §as const§ freezes a literal to its narrowest readonly type; combine with §typeof arr[number]§ to build a union from an array.

**Q. How do you migrate a large JavaScript codebase?** §SDE 2§
Turn on §allowJs§ and §checkJs§ gradually, convert leaf modules first, enable strict flags one at a time, ban new §any§ with lint, and track the count.

**What interviewers look for:** you reach for unknown and narrowing instead of any, you can write a small generic without help, and you know types are erased so data from outside must be validated.
`),
		try: [
			{
				label: 'Exhaustive switch (never)',
				code: String.raw`// Exercise: in TypeScript the default branch assigns to "never" so a new shape fails to compile.
// Here we model the same idea at runtime. Add a 'triangle' case (base * height / 2) and run again.
function area(s) {
  switch (s.kind) {
    case 'circle': return Math.round(Math.PI * s.r * s.r);
    case 'rect': return s.w * s.h;
    // TODO: case 'triangle'
    default: throw new Error('unhandled shape: ' + s.kind);
  }
}
const shapes = [{ kind: 'circle', r: 2 }, { kind: 'rect', w: 3, h: 4 }, { kind: 'triangle', base: 6, height: 5 }];
for (const s of shapes) {
  try { console.log(s.kind, area(s)); } catch (e) { console.log('error:', e.message); }
}`
			},
			{
				label: 'Type guard for unknown data',
				code: String.raw`// Exercise: TypeScript signature would be  function isUser(x: unknown): x is User
// TODO: finish isUser so it checks id is a number, name is a non-empty string, and tags is an array of strings.
function isUser(x) {
  if (typeof x !== 'object' || x === null) return false;
  // TODO: add the three checks
  return true;
}
const inputs = [{ id: 1, name: 'Ada', tags: ['a'] }, { id: '2', name: 'Bo', tags: [] }, { id: 3, name: '', tags: [] }, null, { id: 4, name: 'Cy', tags: [1] }];
console.log(inputs.map(isUser).join(' ')); // expected: true false false false false`
			},
			{
				label: 'Generic pick and groupBy',
				code: String.raw`// Exercise: signatures to keep in mind
//   pick<T, K extends keyof T>(o: T, keys: K[]): Pick<T, K>
//   groupBy<T, K extends PropertyKey>(xs: T[], f: (x: T) => K): Record<K, T[]>
// TODO: implement groupBy (the pick below is done as an example)
function pick(o, keys) { const r = {}; for (const k of keys) r[k] = o[k]; return r; }
function groupBy(xs, f) {
  const r = {};
  // TODO: push each item into r[f(item)]
  return r;
}
console.log(JSON.stringify(pick({ id: 1, name: 'Ada', admin: true }, ['id', 'name'])));
console.log(JSON.stringify(groupBy([1, 2, 3, 4, 5], (n) => (n % 2 ? 'odd' : 'even')))); // {"odd":[1,3,5],"even":[2,4]}`
			}
		]
	},

	// ───────────────────────── React ─────────────────────────
	{
		id: 'iv-react',
		title: 'React interview questions',
		level: 'mid',
		summary: 'Hooks, rendering and reconciliation, state management, performance, React 19 and testing, with the follow-ups interviewers ask.',
		scenes: [],
		notes: md(`
**Q. What happens when state changes? Explain rendering and reconciliation.** §SDE 1§
React re-runs the component function, compares the new element tree with the previous one, and updates only the DOM that differs. Same type at the same position keeps its state; a different type or a different §key§ destroys it. Updates in one event are batched.

**Q. Why do list items need stable keys?** §SDE 1§
Keys identify items between renders. With index keys, inserting or reordering shifts identity, so inputs keep the wrong text and animations jump. Use a stable id from the data.

**Q. useEffect: when does it run and what is cleanup?** §SDE 1§
After paint, then again when a dependency changes. The returned function runs before the next effect and on unmount: remove listeners, clear timers, abort fetches. In dev, Strict Mode runs mount, cleanup, mount again to expose missing cleanup.

**Q. Controlled versus uncontrolled inputs?** §SDE 1§
Controlled: React state owns the value. Uncontrolled: the DOM owns it and you read it via a ref or FormData. Controlled suits live validation; uncontrolled is cheaper for big forms.

**Q. What does useRef do and how is it different from state?** §SDE 1§
A mutable box that survives renders; changing §ref.current§ does not re-render. Use for DOM nodes, timer ids, previous values.

**Q. Why does this setInterval show a stale count?** §SDE 1§
The callback closes over the value from the render it was created in. Use the functional update §setCount(c => c + 1)§ or list the value as a dependency.

**Q. useMemo, useCallback and React.memo: when?** §SDE 2§
They skip work only when inputs are unchanged. Measure first. §memo§ helps a component that re-renders often with the same props, and only if the object and function props are also stable. The React Compiler can add this memoization for you.
Follow-up: why can a memoized child still re-render?

**Q. How do you manage state in a large app?** §SDE 2§
Keep state as local as possible, lift only when siblings need it. Server data belongs in a cache library (TanStack Query, SWR), URL state in the URL, global client state in a small store (Zustand, Redux Toolkit). Context is for rarely changing values: every consumer re-renders when the value changes.
Follow-up: how do you avoid prop drilling without putting everything in context?

**Q. A page is slow when typing in a search box. What do you do?** §SDE 2§
Profile first. Then: debounce the request, §useDeferredValue§ or §useTransition§ for the heavy list, virtualize long lists, split the component so typing re-renders less, memoize the expensive child.

**Q. What is new in React 19?** §SDE 2§
Actions (async functions in transitions), §useActionState§, §useOptimistic§, §use§ to read a promise or context during render, §ref§ as a plain prop, form §action§, document metadata tags, stable Server Components and Server Actions.
Follow-up: how would you build an optimistic like button?

**Q. Error boundaries and Suspense?** §SDE 2§
An error boundary (a class, or a library wrapper) catches render errors in its subtree and shows a fallback; it does not catch event handler or async errors. Suspense shows a fallback while a child waits for code or data.

**Q. How do you test a React component?** §SDE 2§
React Testing Library: render, query by role or label as a user would, drive with user-event, assert on what is visible. Mock the network (MSW), not your own hooks. Avoid testing state or implementation details.
Follow-up: what makes a test flaky and how do you remove it?

**What interviewers look for:** you explain rendering in plain words, avoid reflexive memoization, choose the right home for each kind of state, and test behavior instead of internals.
`),
		try: [
			{
				label: 'Stale closure',
				code: String.raw`// Exercise: this models a React effect that captured count = 0. Predict the final log, then run.
// TODO: fix it with a functional update so the result is 3 (use setCount(c => c + 1) style).
let count = 0;
const setCount = (v) => { count = typeof v === 'function' ? v(count) : v; };
function renderAndStartTicker() {
  const captured = count; // what a closure sees in one render
  return () => setCount(captured + 1); // stale: always uses the captured value
}
const tick = renderAndStartTicker();
tick(); tick(); tick();
console.log('count', count);`
			},
			{
				label: 'Build useState',
				code: String.raw`// Exercise: React keeps hook state in an array indexed by call order. That is why hooks cannot be in if-blocks.
// TODO: finish useState so each call gets its own slot and setters trigger render again.
const slots = []; let idx = 0;
function useState(initial) {
  const i = idx++;
  if (!(i in slots)) slots[i] = initial;
  const set = (v) => { /* TODO: store v in slots[i] and call render() */ };
  return [slots[i], set];
}
function render() {
  idx = 0;
  const [a, setA] = useState(1);
  const [b, setB] = useState(10);
  console.log('render a=' + a + ' b=' + b);
  return { setA, setB };
}
const api = render();
api.setA(2);
api.setB(20); // expected renders: (1,10) then (2,10) then (2,20)`
			},
			{
				label: 'Reducer and memo',
				code: String.raw`// Exercise: reducers are pure functions: (state, action) => new state, never mutate.
// TODO: implement the 'remove' case without mutating, then run. Also see how memoize skips repeat work.
function reducer(state, action) {
  switch (action.type) {
    case 'add': return [...state, action.item];
    case 'remove': return state; // TODO: return a new array without action.id
    default: return state;
  }
}
let s = [];
s = reducer(s, { type: 'add', item: { id: 1, t: 'a' } });
s = reducer(s, { type: 'add', item: { id: 2, t: 'b' } });
s = reducer(s, { type: 'remove', id: 1 });
console.log(JSON.stringify(s)); // expected [{"id":2,"t":"b"}]
let calls = 0;
function memoize(fn) { const c = new Map(); return (x) => { if (!c.has(x)) c.set(x, fn(x)); return c.get(x); }; }
const slow = memoize((n) => { calls++; return n * n; });
slow(4); slow(4); slow(5);
console.log('expensive calls:', calls);`
			}
		]
	},

	// ───────────────────────── Next.js ─────────────────────────
	{
		id: 'iv-nextjs',
		title: 'Next.js interview questions',
		level: 'mid',
		summary: 'App Router, server versus client components, caching and revalidation, data fetching, SEO and middleware, as asked for SDE 1 and SDE 2.',
		scenes: [],
		notes: md(`
**Q. Pages Router versus App Router?** §SDE 1§
The App Router (§app/§ folder) uses nested layouts, Server Components by default, streaming, and file conventions: §page§, §layout§, §loading§, §error§, §not-found§, §route§. The Pages Router uses §getServerSideProps§ and §getStaticProps§.

**Q. Server Components versus Client Components?** §SDE 1§
Server Components render on the server, can read a database or secrets, and ship no JavaScript for themselves. Add §"use client"§ for state, effects, event handlers and browser APIs. The directive marks a boundary: everything it imports becomes client code.

**Q. SSR, SSG, ISR, CSR: what is each and how do you choose?** §SDE 1§
SSR renders per request (personalized or fresh data). SSG renders at build time (docs, marketing). ISR serves a static page and re-generates it after a time or on demand. CSR fetches in the browser (dashboards behind login). Shared, cacheable pages should be static or ISR.

**Q. How do you fetch data in the App Router?** §SDE 1§
Make the component §async§ and await the call directly on the server. Run independent requests in parallel with §Promise.all§ to avoid a waterfall. Client-side data uses a library such as SWR or TanStack Query.

**Q. How do dynamic routes and params work?** §SDE 1§
A folder §[handle]§ matches one segment, §[...slug]§ many. In recent versions §params§ is a Promise you await. §generateStaticParams§ lists the paths to pre-render.

**Q. How do you do SEO?** §SDE 1§
Export §metadata§ or §generateMetadata§ for title, description, canonical and Open Graph; add §app/sitemap.ts§ and §app/robots.ts§; render content on the server; use §next/image§ with sizes and §next/font§.

**Q. What is middleware used for?** §SDE 1§
Code that runs before a request reaches a route: redirects, rewrites, auth checks on cookies, locale detection, headers. Keep it light and fast; limit it with a §matcher§. Newer versions rename the file to §proxy§.

**Q. A page shows stale data. How do you debug?** §SDE 2§
Ask which cache. Layers: request memoization (one render), the Data Cache for §fetch§ results, the Full Route Cache for static output, and the client Router Cache. In Next 15 §fetch§ is no longer cached by default, GET route handlers are not cached by default and page segments are not reused in the client cache. Use §revalidate§ seconds, §revalidateTag§ or §revalidatePath§, or §dynamic = "force-dynamic"§.
Follow-up: why does the page differ between §next dev§ and production?

**Q. What are Server Actions and how do you secure them?** §SDE 2§
Functions marked §"use server"§ that a form or client call can invoke. They are public HTTP endpoints: validate input, check the session and authorization inside every action, never trust the client.

**Q. How does streaming work?** §SDE 2§
§loading.tsx§ or a §Suspense§ boundary sends the shell first and streams slow parts as they resolve, improving time to first byte and perceived speed.

**Q. How do you avoid a hydration mismatch?** §SDE 2§
Server and first client render must match. Do not read §window§, the current time or random values during render; move them into an effect or mark a client-only piece with dynamic import.

**Q. How do you cache a database call that is not fetch?** §SDE 2§
Wrap it with React §cache§ to deduplicate within a render, and with §unstable_cache§ or, in newer versions, the §"use cache"§ directive (Cache Components) for a shared cache with tags and lifetimes.

**What interviewers look for:** you place the client boundary low, name which cache holds stale data, treat Server Actions as public endpoints, and tie rendering mode to the product need.
`),
		try: [
			{
				label: 'Time-based revalidation',
				code: String.raw`// Exercise: model "fetch with revalidate" using a fake clock. Entries are fresh for "ttl" seconds.
// TODO: implement getCached so it returns the cached value while fresh and calls load() again once stale.
let now = 0; let loads = 0;
const load = () => { loads++; return 'data v' + loads; };
const cache = new Map();
function getCached(key, ttl) {
  const hit = cache.get(key);
  // TODO: if hit exists and now - hit.at < ttl return hit.value
  const value = load();
  cache.set(key, { value, at: now });
  return value;
}
console.log(getCached('home', 30)); now = 10;
console.log(getCached('home', 30)); now = 40;
console.log(getCached('home', 30)); // expected: v1, v1, v2`
			},
			{
				label: 'Tag invalidation',
				code: String.raw`// Exercise: revalidateTag drops every entry that carries a tag. Predict, then finish the TODO.
const store = new Map(); // key -> { value, tags }
function setEntry(key, value, tags) { store.set(key, { value, tags }); }
function revalidateTag(tag) {
  // TODO: delete every entry whose tags include tag
}
setEntry('/p/1', 'shoe', ['products', 'p1']);
setEntry('/p/2', 'bag', ['products', 'p2']);
setEntry('/about', 'text', ['static']);
revalidateTag('p1');
console.log([...store.keys()].join(',')); // expected after p1: /p/2,/about
revalidateTag('products');
console.log([...store.keys()].join(',')); // expected after products: /about`
			},
			{
				label: 'Middleware matcher',
				code: String.raw`// Exercise: middleware runs only for paths that match. Implement a tiny matcher with * (one segment) and ** (rest).
// TODO: finish toRegex so every case prints the expected value.
function toRegex(pattern) {
  // hint: escape nothing special here; replace ** with .* first, then * with [^/]*
  return new RegExp('^' + pattern + '$'); // naive, fix it
}
const rules = [
  ['/admin/**', '/admin/users/4', true],
  ['/admin/**', '/administrator', false],
  ['/blog/*', '/blog/hello', true],
  ['/blog/*', '/blog/a/b', false],
];
for (const [p, path, want] of rules) console.log(p, path, toRegex(p).test(path) === want ? 'ok' : 'WRONG');`
			}
		]
	},

	// ───────────────────────── Web platform ─────────────────────────
	{
		id: 'iv-web-platform',
		title: 'Web performance and browser',
		level: 'mid',
		summary: 'Core Web Vitals, the rendering path, accessibility, CSS layout, XSS, CORS, CSP, storage and styling questions.',
		scenes: [],
		notes: md(`
**Q. Name the Core Web Vitals and their good thresholds.** §SDE 1§
LCP (loading) 2.5 s or less, INP (responsiveness) 200 ms or less, CLS (visual stability) 0.1 or less, measured at the 75th percentile of real users. INP replaced FID in 2024.

**Q. Describe the critical rendering path.** §SDE 1§
Parse HTML into the DOM, parse CSS into the CSSOM, combine them into a render tree, then layout, paint and composite. CSS blocks rendering; synchronous scripts block parsing, so use §defer§ or §async§.

**Q. How do you improve LCP?** §SDE 1§
Make the server fast, let the browser discover the hero image early (preload, not lazy-loaded, correct size and format), cut render-blocking CSS and scripts, and serve through a CDN.

**Q. What causes layout shift and how do you stop it?** §SDE 1§
Images without width and height, late fonts, ads and banners inserted above content. Reserve space (aspect-ratio, fixed slots), use §font-display§ with matching fallbacks, insert new content below the viewport.

**Q. Flexbox versus Grid? How do you center a div?** §SDE 1§
Flex lays out in one dimension, Grid in two. Center: §display: grid; place-items: center§ or flex with §justify-content§ and §align-items§. Know the box model and §box-sizing: border-box§.

**Q. How is CSS specificity calculated?** §SDE 1§
Inline style beats ids, then classes, attributes and pseudo-classes, then elements. Ties go to the later rule; §!important§ overrides and should be avoided.

**Q. What is XSS and how do you prevent it?** §SDE 1§
Attacker script runs in your page. Prevent by escaping output (frameworks do for text), never inserting untrusted HTML (§dangerouslySetInnerHTML§, §innerHTML§) unless sanitized, and adding a Content Security Policy.

**Q. What is CORS?** §SDE 1§
A browser rule that blocks a page from reading a cross-origin response unless the server sends §Access-Control-Allow-Origin§. Non-simple requests trigger an OPTIONS preflight. With credentials the origin must be explicit, not §*§. It is not server security: curl ignores it.

**Q. localStorage, sessionStorage, cookies, IndexedDB?** §SDE 1§
localStorage persists, is synchronous, strings only, readable by any script on the origin. sessionStorage lasts per tab. Cookies are sent with requests; §HttpOnly§, §Secure§ and §SameSite§ protect them. IndexedDB is async and holds large structured data. Never keep tokens where scripts can read them if you can avoid it.

**Q. How do you make a page accessible?** §SDE 2§
Semantic HTML first, labels on inputs, keyboard focus order and visible focus, alt text, color contrast of at least 4.5:1 for normal text, ARIA only when native elements cannot do it, and test with a screen reader and axe.
Follow-up: how do you build an accessible modal or dropdown?

**Q. INP is poor. What do you do?** §SDE 2§
Find long tasks in the Performance panel: split work with scheduling (§setTimeout§, §requestIdleCallback§, §scheduler.yield§), move heavy code to a Web Worker, reduce re-renders, avoid layout thrashing (reading then writing layout in a loop).

**Q. Explain CSP, CSRF and SameSite.** §SDE 2§
CSP limits where scripts and styles may load from (use nonces rather than unsafe-inline). CSRF tricks a logged-in browser into a request; SameSite cookies and anti-CSRF tokens stop it. CORS does not prevent CSRF.

**Q. Tailwind or SCSS: what trade-offs?** §SDE 2§
Tailwind: utility classes, small CSS after build, consistent tokens, but long class lists and class names built by string concatenation are not detected. SCSS: nesting, variables and mixins with named, scoped rules. Either needs a design-token discipline.

**What interviewers look for:** you start from a metric, find the cause, then fix and measure; you treat security and accessibility as defaults, not extras.
`),
		try: [
			{
				label: 'Escape HTML',
				code: String.raw`// Exercise: write escapeHtml so user text cannot become markup (the core of XSS defense).
// TODO: replace & < > " ' with entities. Do & first.
function escapeHtml(s) {
  return s; // TODO
}
const evil = '<img src=x onerror="steal()">';
console.log(escapeHtml(evil));
// expected: &lt;img src=x onerror=&quot;steal()&quot;&gt;`
			},
			{
				label: 'CORS preflight rules',
				code: String.raw`// Exercise: decide which requests need a preflight, and whether the response headers allow it.
// Simple request: GET/HEAD/POST with only safe headers and content types form/text. TODO: finish needsPreflight.
function needsPreflight(req) {
  const simpleMethods = ['GET', 'HEAD', 'POST'];
  const simpleTypes = ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'];
  // TODO: true if the method is not simple, or content-type is set and not simple, or a custom header exists
  return false;
}
function allowed(req, resp) {
  const o = resp['access-control-allow-origin'];
  if (req.credentials && o === '*') return false;
  return o === '*' || o === req.origin;
}
console.log(needsPreflight({ method: 'GET' }));
console.log(needsPreflight({ method: 'POST', contentType: 'application/json' })); // expected true
console.log(needsPreflight({ method: 'PUT' })); // expected true
console.log(needsPreflight({ method: 'GET', headers: { 'x-token': '1' } })); // expected true
console.log(allowed({ origin: 'https://a.com', credentials: true }, { 'access-control-allow-origin': '*' })); // false`
			},
			{
				label: 'Vitals scorecard',
				code: String.raw`// Exercise: classify metrics as good / needs improvement / poor. Thresholds (good, poor):
// LCP 2500, 4000 ms   INP 200, 500 ms   CLS 0.1, 0.25
// TODO: finish rate() using the pair of limits.
const limits = { LCP: [2500, 4000], INP: [200, 500], CLS: [0.1, 0.25] };
function rate(metric, value) {
  const [good, poor] = limits[metric];
  // TODO: return 'good' if value <= good, 'poor' if value > poor, else 'needs improvement'
  return '?';
}
const page = { LCP: 3100, INP: 180, CLS: 0.31 };
for (const m of Object.keys(page)) console.log(m, page[m], rate(m, page[m]));
// expected: LCP needs improvement, INP good, CLS poor`
			},
			{
				label: 'CSS specificity score',
				code: String.raw`// Exercise: predict which selector wins, then finish the scoring. Score = [ids, classes/attrs/pseudo, elements].
// TODO: count each kind with the regexes (simple selectors only, no :not or nesting).
function specificity(sel) {
  const ids = (sel.match(/#[\w-]+/g) || []).length;
  const classes = 0; // TODO count .class, [attr] and :pseudo-class
  const els = 0;     // TODO count element names (words not preceded by . # : [)
  return [ids, classes, els];
}
for (const s of ['p', '.card p', '#nav .item', 'a:hover', 'ul li.active']) console.log(s, JSON.stringify(specificity(s)));
// expected: [0,0,1] [0,1,1] [1,1,0] [0,1,1] [0,1,2]`
			}
		]
	}
];

// ───────────────────────── quiz ─────────────────────────
const t = (topic: string) => builder('IV', topic);

// ----- JavaScript core -----
const js = t('iv-js-core');

js.add('basic', 'scope',
	"What happens when you read a let variable before the line that declares it?",
	"A ReferenceError, because the variable is in its temporal dead zone",
	["It returns undefined, exactly as a var variable does when read before its line, since both are hoisted", "It returns null until the declaration runs", "It silently creates a global variable with that name"],
	"let and const are hoisted but cannot be used until execution reaches the declaration, so early access throws a ReferenceError. Only var gives undefined in this situation. Nothing creates a global in strict code, and null is never produced by hoisting.");

js.add('basic', 'closures',
	"for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0); What does it print?",
	"3, 3, 3, because every callback shares one function-scoped i that is already 3",
	["0, 1, 2, because each timer captures the value at the time it was set and setTimeout copies its arguments", "Nothing, because setTimeout with 0 never runs", "2, 2, 2, because the last iteration value wins"],
	"var creates a single binding for the whole function. The callbacks run after the loop has finished, when i is 3. Declaring the counter with let gives each iteration its own binding and prints 0, 1, 2. Zero-delay timers still run, just later, and the final value of i is 3, not 2.");

js.add('basic', 'this',
	"Inside an object method, you pass obj.greet as a callback and it is later called as a plain function in strict mode. What is this?",
	"undefined, because the call no longer has an object before the dot",
	["obj, because methods stay attached to the object they were defined on", "The global window object in every case", "The callback function itself"],
	"this depends on how a function is called, not where it was defined. Detached from obj it gets no receiver, so it is undefined in strict mode (the global object only in sloppy mode). bind(obj) or an arrow wrapper keeps the receiver.");

js.add('basic', 'event-loop',
	"Which logs first: setTimeout(() => log('timer'), 0) or Promise.resolve().then(() => log('promise'))?",
	"promise, because microtasks are drained before the next macrotask runs",
	["timer, because a zero delay means it runs immediately and skips the queue entirely", "They run in the order written, which is timer first", "It is random and differs between runs"],
	"After the current script, the engine runs every queued microtask (promise callbacks) before taking the next macrotask such as a timer. The order is fixed by the specification, not random, and a 0 ms delay only queues a macrotask; it does not run synchronously.");

js.add('basic', 'promises',
	"You need every result even if some requests fail. Which should you use?",
	"Promise.allSettled, which resolves with the status of each promise",
	["Promise.all, which waits for every promise and quietly ignores any that fail along the way", "Promise.race, which returns the first one to settle", "Promise.any, which collects every rejection"],
	"allSettled never rejects and reports fulfilled or rejected for each input. Promise.all rejects as soon as one fails and loses the rest. race returns only the first settled result, and any resolves with the first success and rejects only if all fail.");

js.add('basic', 'equality',
	"What does 0 == '0' evaluate to, and what is typeof null?",
	"true, and 'object'",
	["false, and 'null'", "true, and 'null'", "false, and 'object'"],
	"Loose equality converts the string to a number so 0 == '0' is true; strict equality would be false. typeof null returning 'object' is a long-standing language quirk kept for compatibility, so check null with === null.");

js.add('basic', 'copying',
	"Which copies a nested object so that changing the copy's inner object leaves the original alone?",
	"structuredClone(obj)",
	["{ ...obj }", "Object.assign({}, obj)", "const copy = obj"],
	"Spread and Object.assign copy only the top level, so inner objects are still shared. Plain assignment copies the reference. structuredClone walks the whole structure and makes an independent copy, though it cannot clone functions.");

js.add('basic', 'debounce',
	"A search box sends a request on every keystroke. Which technique fixes it so only the last pause triggers a request?",
	"Debounce the handler so it fires after typing has stopped for a short delay",
	["Throttle the handler so it fires at most once per 10 seconds regardless of typing", "Wrap the request in Promise.all so duplicates are merged", "Call the handler inside requestAnimationFrame so it runs once per frame"],
	"Debounce resets its timer on each call, so it runs once the user pauses. Throttling lets calls through at a fixed rate, which is better for scroll. Promise.all does not merge requests, and frame-based calls would still fire many times per second.");

js.add('advanced', 'prototypes',
	"Where does a method defined inside a class body (not an arrow function field) live?",
	"On the class prototype, shared by every instance",
	["Copied onto each instance when it is created, so that instances never share the function", "On the global object", "On the constructor's arguments"],
	"Class methods are placed once on ClassName.prototype and found by walking the prototype chain, so a thousand instances share one function. Arrow-function class fields are different: they are created per instance, which costs memory but fixes this binding.");

js.add('advanced', 'async-await',
	"const a = await getA(); const b = await getB(); where the calls are independent. What is wrong and what is the fix?",
	"They run one after the other; start both first and await Promise.all([getA(), getB()])",
	["Nothing, await already runs both in parallel", "The second await never runs; wrap it in a loop", "They run in parallel, but any errors are lost silently, so you must add a catch to each call"],
	"await pauses the function until that promise settles, so the second call is not even started until the first finishes. Starting both and awaiting Promise.all overlaps the waiting time. Errors are not lost in the sequential version, and no loop is needed.");

js.add('advanced', 'memory',
	"Which pattern most likely causes a memory leak in a single page app?",
	"Adding a window event listener in a component and never removing it on unmount",
	["Declaring a counter with const instead of let, which stops the garbage collector from freeing it", "Calling Array.map on a large list once", "Reading a value from localStorage"],
	"An un-removed listener keeps its callback, and everything that callback closes over, alive after the component is gone, and it grows with every mount. Declaring const, mapping once and reading storage create values that normal garbage collection can free.");

js.add('advanced', 'event-loop',
	"Inside an async function, code after an await runs as what kind of task?",
	"A microtask, queued when the awaited promise settles",
	["A macrotask, queued behind other timers exactly as a setTimeout callback would be", "Synchronously, before the function returns", "On a separate thread started by await"],
	"await splits the function: the rest is scheduled as a promise continuation, which is a microtask. So it runs before any pending timer. It never runs synchronously with the caller, and JavaScript here does not start a new thread.");

// ----- TypeScript -----
const ts = t('iv-typescript');

ts.add('basic', 'unknown',
	"You receive JSON from an API and do not yet know its shape. Which type is the safest to give it?",
	"unknown, then narrow or validate before using it",
	["any, because it still type-checks the later code, so mistakes are still caught", "never, because the shape is not known", "object, because JSON is always an object"],
	"unknown accepts any value but forbids use until you check it, so mistakes are caught. any disables checking and spreads silently. never means no value can exist, and JSON can also be an array, string or number, so object is wrong.");

ts.add('basic', 'type-vs-interface',
	"Which can an interface do that a type alias cannot?",
	"Be re-declared with the same name so the declarations merge",
	["Describe a union of two different object shapes using the pipe operator", "Extend another type", "Describe an object with optional fields"],
	"Declaration merging is unique to interfaces and is how libraries add fields to global or framework types. Unions need a type alias, while extending and optional fields work for both, so those do not separate them.");

ts.add('basic', 'structural',
	"A function takes a Point with x and y. You pass an object variable that has x, y and z. Does it compile?",
	"Yes, because types are structural and extra properties on a non-literal value are allowed",
	["No, because the variable's type has a different name and the extra property z is not part of Point", "No, because z was not declared in Point", "Yes, but only if you add as Point"],
	"TypeScript checks shape, not names, so an object with at least x and y fits. The excess property check applies only to fresh object literals written directly in the call, not to an existing variable. No cast is needed.");

ts.add('basic', 'generics',
	"What does K extends keyof T do in function pluck<T, K extends keyof T>(o: T, k: K)?",
	"Restricts k to the real property names of o and ties the return type to that property",
	["Makes K inherit all the methods of T at runtime", "Allows k to be any string and checks at runtime that the property exists on the object before reading it", "Copies the keys of T into a new object type"],
	"The constraint limits the key to a union of T's property names, so pluck(user, 'nmae') is a compile error and the result type is T[K]. It is a compile-time rule only; nothing is checked or inherited at runtime.");

ts.add('basic', 'narrowing',
	"Which does NOT narrow a union type inside an if branch?",
	"A comment saying the value is a string",
	["typeof value === 'string'", "'name' in value, which narrows to the union members that have a name property", "value instanceof Date"],
	"Narrowing comes from checks the compiler understands: typeof, in, instanceof, equality and discriminant fields. A comment is invisible to it. A cast or a user-defined guard function can tell it what you know.");

ts.add('basic', 'utility-types',
	"You need a type with all fields of User optional for a patch request. Which utility fits?",
	"Partial<User>",
	["Required<User>", "Readonly<User>", "Pick<User, never>"],
	"Partial makes every property optional. Required does the opposite, Readonly only blocks assignment, and Pick with never keeps no properties at all. For a patch you can also combine Partial with Omit to leave out the id.");

ts.add('basic', 'exhaustive',
	"Why assign the value to a variable of type never in the default branch of a switch over a union?",
	"The build fails if a new union member is added and no case handles it",
	["It makes the switch statement run faster because the compiler can emit a jump table for it", "It stops the union from being extended", "It converts the unhandled value to undefined"],
	"After all cases are handled the value's type has shrunk to never, so the assignment compiles. A new member leaves a non-never type there and the compiler errors, pointing at every switch to update. It has no runtime effect.");

ts.add('advanced', 'conditional',
	"type ElementOf<T> = T extends (infer U)[] ? U : never. What is ElementOf<string[]>?",
	"string",
	["string[]", "never", "unknown"],
	"The conditional checks whether T is an array and infer captures the element type into U. For string[] it matches with U as string. never would be the result only for non-array inputs.");

ts.add('advanced', 'satisfies',
	"What is the main benefit of satisfies over a type annotation on a config object?",
	"It validates the object against a type while keeping its precise literal types",
	["It changes the object at runtime so that every value is converted to match the declared type", "It makes every property optional", "It works only on classes"],
	"An annotation widens the value to the declared type and loses the exact keys. satisfies only checks, so you can still autocomplete the literal keys. Nothing is emitted at runtime and it works on any expression.");

ts.add('advanced', 'runtime',
	"Why is const user = data as User not a safe way to handle API responses?",
	"Types are erased at runtime; the cast checks nothing, so bad data passes through",
	["The compiler inserts a runtime conversion that turns the object into a User, though it is slow", "as is only allowed on primitives", "It makes the data read-only"],
	"A cast is a promise to the compiler. If the server returns another shape the program fails later with a confusing error. Validate at the boundary with a schema library and infer the type from the schema.");

ts.add('advanced', 'distributive',
	"Given type ToArray<T> = T extends any ? T[] : never, what is ToArray<string | number>?",
	"string[] | number[], because the conditional distributes over each union member",
	["(string | number)[], because the union is treated as one single type and wrapped only once", "never, because the union does not extend any", "string[] & number[]"],
	"When the checked type is a bare type parameter, a conditional is applied to each union member separately and the results are united. Wrapping it as [T] extends [any] would stop the distribution and give the combined array type.");

// ----- React -----
const rc = t('iv-react');

rc.add('basic', 'keys',
	"Why is using the array index as a key a problem for a list that can be reordered?",
	"Identity follows the position, so state like input text stays with the wrong item",
	["React refuses to render lists that use index keys and throws an error at runtime in production", "It makes the list render twice as many times", "Index keys are converted to random ids"],
	"React matches old and new items by key. With indexes, moving an item makes React reuse the component at that position for different data, so local state sticks to the wrong row. It still renders; the damage is subtle and often only seen with inputs.");

rc.add('basic', 'effects',
	"What is the return value of a function passed to useEffect used for?",
	"Cleanup, run before the next effect and when the component unmounts",
	["It becomes the initial state of the component the next time it is mounted again", "It is rendered as part of the output", "It decides whether the effect runs again"],
	"The returned function undoes what the effect set up: removing listeners, clearing timers or aborting a request. It runs before the effect re-runs and on unmount. Re-running is controlled by the dependency array, not by the return value.");

rc.add('basic', 'state',
	"setCount(count + 1) called three times in one handler leaves count at 1 higher, not 3. How do you fix it?",
	"Use the functional form setCount(c => c + 1)",
	["Call setCount four times instead, since extra calls queue up extra increments", "Wrap the calls in useMemo", "Change count to a ref and mutate it"],
	"Each call reads the same captured count from that render, so all three set the same value. The updater function receives the latest pending state each time. Extra calls do not help, memoization does not apply, and a ref would stop the UI updating.");

rc.add('basic', 'forms',
	"What makes an input a controlled component?",
	"Its value is set from React state and updated through onChange",
	["It is wrapped inside a form element that has an onSubmit handler attached to it", "It uses a ref to read its value", "It has the required attribute"],
	"A controlled input always shows what state says, so React is the single source of truth. Reading the value through a ref or FormData is the uncontrolled style. Forms and the required attribute exist in both styles.");

rc.add('basic', 'refs',
	"What happens when you change ref.current?",
	"The value updates but the component does not re-render",
	["The component re-renders immediately", "React throws a runtime error because refs are read-only after the first render", "The change is reverted on the next render"],
	"A ref is a plain mutable box that React does not track, which is why it suits timer ids and DOM nodes. If something visible must change, store it in state instead.");

rc.add('basic', 'stale-closure',
	"setInterval(() => setCount(count + 1), 1000) inside an effect with an empty dependency array. What does the count do?",
	"It goes to 1 and stays there, because the callback keeps the first render's count",
	["It increases by one every second, because the interval always reads the latest count", "It resets to 0 every second", "It throws a warning and stops the interval"],
	"The effect ran once, so its closure holds count from that first render, which is 0. Each tick sets 1. Fix it with the updater form setCount(c => c + 1), or by adding count to the dependencies and clearing the interval each time.");

rc.add('advanced', 'memo',
	"A child wrapped in React.memo still re-renders whenever the parent does. What is the likely cause?",
	"The parent passes a new object or function prop on every render",
	["memo only works on class components", "memo is disabled whenever the parent component uses hooks such as useState", "The child uses the key prop"],
	"memo does a shallow comparison of props. An inline object or arrow function is a new reference each render, so the comparison fails. Stabilize them with useMemo or useCallback, or move them out of the render. memo works on function components and does not care about the parent's hooks.");

rc.add('advanced', 'context',
	"What is the main performance risk of putting frequently changing data in one React context?",
	"Every consumer of that context re-renders whenever the value changes",
	["Context values are deep copied on every read, which is slow for large objects", "Context cannot hold objects", "Providers must be remounted after each update"],
	"Consumers cannot subscribe to part of a context value, so any change re-renders all of them. Split contexts by update rate, keep fast-changing state in a store with selectors, or colocate state lower in the tree.");

rc.add('advanced', 'state-management',
	"Where should data fetched from a REST API usually live in a modern React app?",
	"In a server-state cache such as TanStack Query or SWR, not copied into global client state",
	["In a Redux slice, copied in by hand with loading flags, error flags and manual refetch logic", "In a context provider at the root", "In localStorage on every response"],
	"Server data needs caching, deduplication, refetching and invalidation, which query libraries provide. Hand-copying into a global store means writing all that yourself. Context and localStorage give no freshness handling.");

rc.add('advanced', 'react-19',
	"Which React 19 hook lets you show an expected result immediately while an async action is still running?",
	"useOptimistic",
	["useDeferredValue", "useId", "useSyncExternalStore"],
	"useOptimistic holds a temporary value during an Action and reverts to the real state when it settles or fails. useDeferredValue delays a value for responsiveness, useId makes stable ids, and useSyncExternalStore subscribes to outside stores.");

rc.add('advanced', 'suspense',
	"Which errors does an error boundary NOT catch?",
	"Errors thrown inside event handlers and asynchronous callbacks",
	["Errors thrown while rendering a child component somewhere inside the boundary", "Errors thrown in a child's lifecycle", "Errors in a lazily loaded child"],
	"Boundaries catch errors during rendering and lifecycles in their subtree. Event handlers and async code run outside that, so wrap them in try and catch and set error state. A lazy child that fails to load is reported to the boundary.");

rc.add('advanced', 'testing',
	"In React Testing Library, which query best reflects how a user finds a button?",
	"getByRole('button', { name: 'Save' })",
	["container.querySelector('.btn-primary')", "getByTestId('btn-1') for every element", "wrapper.state('saved')"],
	"Role and accessible name test what the user and assistive tech see and also catch missing labels. Class selectors and state access are tied to implementation details and break on refactors. Test ids are a last resort.");

// ----- Next.js -----
const nx = t('iv-nextjs');

nx.add('basic', 'rsc',
	"Which needs a Client Component in the App Router?",
	"A component that uses useState and an onClick handler",
	["A component that awaits a database query and renders the rows it gets back", "A component that reads an environment secret", "A component that renders a list from props"],
	"State, effects, event handlers and browser APIs only exist on the client, so the file needs 'use client'. Server Components can query data and read secrets, and rendering props to a list needs neither.");

nx.add('basic', 'boundary',
	"What does adding 'use client' at the top of a file do?",
	"Marks a client boundary, so the file and the modules it imports are bundled for the browser",
	["Disables server rendering for the whole app", "Makes only that one component client-side and leaves everything it imports as a Server Component", "Turns the file into an API route"],
	"The directive starts the client part of the module graph: imports below it are client code too. Keep the boundary at small interactive leaves so most of the tree stays on the server. Client components are still pre-rendered on the server for the first load.");

nx.add('basic', 'rendering-modes',
	"A marketing page changes a few times a day and needs to be fast worldwide. Which approach fits best?",
	"Static generation with revalidation (ISR), triggered on a timer or on demand",
	["Server-side render on every request with no cache, so the content is always fresh worldwide", "Client-side fetch after the page loads", "Force dynamic rendering for every route"],
	"A pre-built page from a CDN is the fastest, and revalidation refreshes it when content changes. Rendering each request spends server time for no benefit, and client-only fetching shows an empty shell first and hurts SEO.");

nx.add('basic', 'data-fetching',
	"Two independent awaits are written one after the other in a Server Component. What is the issue?",
	"A request waterfall; start both and use Promise.all to overlap them",
	["Nothing, because Next.js detects independent awaits and runs them in parallel automatically", "The second await is skipped", "It is an error to await in Server Components"],
	"Await pauses the component, so the second request starts late and total time is the sum. Starting both together makes it the slower of the two. Server Components can be async and both awaits do run.");

nx.add('basic', 'seo',
	"Where do you set the title and Open Graph tags for a product page whose data comes from an API?",
	"Export generateMetadata in the page and fetch the product inside it",
	["Add a title tag inside the client component and let the browser update it after load", "Set document.title in a useEffect", "Put them in robots.ts"],
	"generateMetadata runs on the server and its output is in the initial HTML, which is what crawlers and link previews read. A client effect runs too late. robots.ts controls crawl rules, not page metadata. Fetches that are identical are shared with the page.");

nx.add('basic', 'middleware',
	"Which job suits middleware best?",
	"Redirecting users without a session cookie before the route renders",
	["Running a slow database report that joins several tables on every request", "Rendering a large React tree", "Storing uploaded files"],
	"Middleware runs before the request reaches the route, so cheap checks on cookies, headers and paths fit well. Heavy work or rendering would slow every matching request. Narrow it with a matcher so it does not run on static assets.");

nx.add('advanced', 'caching',
	"Since Next.js 15, what is the default for a fetch call with no cache option?",
	"It is not cached; you opt in with cache: 'force-cache' or revalidate",
	["It is cached forever on the server until the next deployment replaces the build output", "It is cached for 60 seconds", "It is cached only in the browser"],
	"Earlier versions cached fetch results by default, which surprised people; the newer defaults are uncached and explicit. Opt in with force-cache, next.revalidate seconds or tags. Check which version a project is on, because older code assumed the opposite.");

nx.add('advanced', 'revalidation',
	"A product is edited in an admin panel. How do you refresh only the cached pages that show it?",
	"Tag the fetches, then call revalidateTag for that tag from a Server Action or route handler",
	["Delete the .next folder on the server", "Set dynamic to force-dynamic on the whole site so that nothing is ever cached again anywhere", "Wait for the browser cache to expire"],
	"Tags map data to the cached outputs that used it, so one call refreshes exactly those. Deleting build output and forcing dynamic rendering are heavy, and browser expiry does not control the server cache.");

nx.add('advanced', 'server-actions',
	"What must a Server Action do before changing data?",
	"Validate the input and check that the current user is allowed, as with any public endpoint",
	["Nothing, because only your own forms can call it", "Only check the user in the browser before calling it, since the action is hidden from other users", "Convert the call to a GET request"],
	"Actions are reachable as HTTP endpoints, so anyone can post to them without your UI. Never rely on a hidden button or client check. Validate shape and authorization inside the action every time.");

nx.add('advanced', 'streaming',
	"What does a Suspense boundary around a slow Server Component enable?",
	"The rest of the page is sent first and the slow part streams in when ready",
	["The slow component is skipped on the server and rendered only after the user clicks", "The page is generated at build time only", "The component re-renders on the client every second"],
	"Streaming sends HTML in chunks: the shell and fallback first, then replacements as data resolves. This improves how soon users see content without blocking on the slowest query.");

nx.add('advanced', 'hydration',
	"A component renders new Date().toLocaleTimeString() directly in its output and gives a hydration warning. Why?",
	"The server and the client render at different times, so the text differs between them",
	["Dates cannot be rendered in React", "Hydration only works for fully static pages, so any dynamic value causes a warning every time", "toLocaleTimeString is disabled on the server"],
	"Hydration expects the first client render to match the server HTML. A time or random value changes between the two. Render a stable placeholder and set the value in an effect, or limit the piece to the client.");

nx.add('advanced', 'dedupe',
	"Two components in one render call the same function that queries your database directly. How do you avoid running the query twice?",
	"Wrap the function with React's cache so calls in one render share the result",
	["Use setTimeout to delay the second call until the first has finished and filled the cache", "Add 'use client' to both components", "Move the query into middleware"],
	"fetch is deduplicated automatically within a render, but direct database calls are not. React cache memoizes per request. Making components client-side or using middleware does not share results.");

// ----- Web platform -----
const wp = t('iv-web-platform');

wp.add('basic', 'vitals',
	"Which Core Web Vital measures how quickly the page responds to user interactions?",
	"INP, interaction to next paint",
	["LCP, largest contentful paint, which times the main content", "CLS, cumulative layout shift", "TTFB, time to first byte"],
	"INP replaced First Input Delay in 2024 and looks at the delay of interactions across the visit. LCP is about loading the main content, CLS about unexpected movement, and TTFB is a server timing, not a Core Web Vital.");

wp.add('basic', 'lcp',
	"The LCP element is a hero image with loading='lazy'. What is the right change?",
	"Remove lazy loading from it and preload or prioritize it",
	["Add lazy loading to every other image on the page so the browser has less to download", "Convert the image to a CSS background with no preload", "Wait for a scroll event before loading it"],
	"Lazy loading delays fetching until the browser decides the image is near the viewport, which delays the largest element on screen. Above-the-fold images should be fetched early. A CSS background hides the image from the preload scanner.");

wp.add('basic', 'cls',
	"Which most directly prevents layout shift from images?",
	"Setting width and height (or aspect-ratio) so space is reserved before the image loads",
	["Compressing the image more", "Using a larger image", "Loading the image with JavaScript after the page loads, so the browser never needs to measure it up front"],
	"Without dimensions the browser does not know the size until the file arrives, then pushes content down. Reserving the box up front keeps the layout still. File size affects LCP, not shifts, and late JavaScript injection makes shifts more likely.");

wp.add('basic', 'rendering-path',
	"How does a script tag without async or defer affect page load?",
	"It blocks HTML parsing while it downloads and runs",
	["It runs only after the page is fully displayed", "It is downloaded by a separate process that never blocks", "It only blocks CSS, not HTML"],
	"A classic script must run before the parser continues because it may change the document. defer runs after parsing in order, and async runs as soon as it arrives. Place it at the end or use defer.");

wp.add('basic', 'css',
	"Which selector wins: #nav a or .menu .link, for the same element?",
	"#nav a, because an id outweighs any number of classes",
	[".menu .link, because two classes beat one id", "They tie, because both have the same number of selectors, and the first in the file wins", "Whichever was loaded last, regardless of specificity"],
	"Specificity compares ids first, then classes, then elements. One id (1,0,1) beats two classes (0,2,0). Source order only breaks ties between equal specificity.");

wp.add('basic', 'xss',
	"Which line is the most dangerous when the value comes from a user comment?",
	"element.innerHTML = comment",
	["element.textContent = comment", "element.setAttribute('title', comment)", "console.log(comment)"],
	"innerHTML parses the string as HTML, so a comment containing a script-running tag executes in your page. textContent inserts plain text. Attribute and console use are safe in this form. If rich text is needed, sanitize it with a vetted library.");

wp.add('basic', 'cors',
	"A browser blocks a fetch to another origin with a CORS error. Where is the fix?",
	"On the server, by returning the right Access-Control-Allow-Origin header",
	["In the fetch call, by adding mode: 'no-cors' so that the browser lets you read the response body", "In the browser settings of every user", "In the HTML, by adding a meta tag"],
	"CORS is the browser asking the server for permission, so the server must send the headers. no-cors gives an opaque response you cannot read. Users should not change settings, and no meta tag grants cross-origin access.");

wp.add('basic', 'storage',
	"Which statement about localStorage is true?",
	"It is synchronous, stores strings, and any script on the same origin can read it",
	["It is sent to the server automatically with every request to the same origin, as a header", "It is unlimited in size", "It is safe from XSS because it is per origin"],
	"localStorage is a simple string key store; large writes block the main thread, and an XSS script can read it. Cookies, not localStorage, are sent with requests. Browsers cap it at a few megabytes.");

wp.add('advanced', 'a11y',
	"Which gives a custom clickable div the correct accessibility semantics most reliably?",
	"Use a native button element instead",
	["Add an onClick handler and a pointer cursor so it looks clickable to everyone", "Add a hover style", "Set the title attribute"],
	"A native button comes with keyboard activation, focus, and the right role for free. A div with a click handler is invisible to keyboard and screen reader users, and title or hover styles add no behavior. ARIA is the fallback when native elements cannot be used.");

wp.add('advanced', 'inp',
	"A click handler runs 400 ms of synchronous work and INP is poor. What is the best first step?",
	"Break the work into smaller chunks or move it off the main thread, such as to a Web Worker",
	["Add more CSS animations to hide the delay while the long task keeps running on the main thread", "Compress the images", "Increase the server cache time"],
	"INP measures the time until the next paint after an interaction, and a long task blocks painting. Splitting or offloading the work lets the browser paint sooner. Images and server caching do not affect main-thread work.");

wp.add('advanced', 'csrf-csp',
	"Which protects best against a malicious site making your logged-in user's browser send a state-changing request to your API?",
	"SameSite cookies together with anti-CSRF tokens",
	["CORS headers alone, set to allow only your own domain on the API", "A Content Security Policy", "Minifying the JavaScript"],
	"CSRF abuses cookies that the browser attaches automatically, so SameSite and tokens address it directly. CORS limits reading responses and does not block the request being sent, and CSP restricts content loading, which helps against XSS.");

wp.add('advanced', 'tailwind',
	"In Tailwind, why does className={'text-' + color + '-500'} often fail in a production build?",
	"The build scans source files for full class names, and a built-up string never appears in them",
	["Tailwind forbids color classes inside components, so they must live in a separate global stylesheet", "Classes are only generated for the first 100 uses", "Browsers do not support dynamic class names"],
	"Tailwind generates CSS only for class strings it can find as whole tokens in the source. Use complete names in a lookup object or safelist them. The browser has no limits on dynamic classes; the class is just missing from the stylesheet.");

export const banks: { out: Question[] }[] = [js, ts, rc, nx, wp];
