import type { LearnEngine, DbTopic } from './types';
import { javascriptQuestions } from './javascript/questions';

const md = (...lines: string[]) => lines.join('\n');

// `try` snippets run in the in-app JavaScript playground: plain JavaScript as an async function body in a Worker
// (top-level await is fine; pending timers are waited for). They are deterministic and print with console.log.
const topics: DbTopic[] = [
	{
		id: 'values-and-types',
		title: 'Values and types',
		level: 'basic',
		summary: 'Know which values are copied and which are shared, and what typeof really tells you.',
		scenes: ['js-value-vs-reference', 'js-typeof-surprises'],
		notes: md(
			'JavaScript has seven **primitive** types (`string`, `number`, `bigint`, `boolean`, `undefined`, `symbol`, `null`) and one **object** type, which covers arrays, functions, dates and everything else.',
			'',
			'Primitives are immutable values and are **copied** on assignment. Objects live elsewhere in memory, and a variable holds a **reference** to one, so assigning an object copies the reference, not the object.',
			'',
			'```js',
			'let a = 1;',
			'let b = a;',
			'b = 2;               // a is still 1',
			'const x = { n: 1 };',
			'const y = x;',
			'y.n = 2;             // x.n is 2 too',
			'```',
			'',
			'- `typeof` returns the type name as a string. Two oddities: `typeof null` is `\'object\'` (a bug from the first version that can never be fixed) and `typeof function () {}` is `\'function\'`, even though functions are objects.',
			'- `undefined` means "no value was assigned"; `null` means "deliberately empty".',
			'- `NaN` has type `number`, and numbers are 64-bit floats, so `0.1 + 0.2` is not exactly `0.3`.',
			'',
			'**Common trap:** `const` is not immutability. `const list = []; list.push(1)` works, because the binding is constant, not the array it points to.'
		),
		try: [
			{ label: 'Copy by value vs by reference', code: `let a = 1;\nlet b = a;\nb = 2;\nconst x = { n: 1 };\nconst y = x;\ny.n = 2;\nconsole.log(a, b);\nconsole.log(x.n, y.n, x === y);` },
			{ label: 'typeof surprises', code: `console.log(typeof null, typeof [], typeof function () {}, typeof undefined, typeof 10n, typeof Symbol());` },
			{ label: 'Strings are immutable', code: `const s = 'abc';\nconst t = s.toUpperCase();\nconsole.log(s, t);\nconsole.log(0.1 + 0.2, 0.1 + 0.2 === 0.3);` }
		]
	},
	{
		id: 'equality-and-coercion',
		title: 'Equality and coercion',
		level: 'basic',
		summary: 'Predict what == does, and know why === is the safer default.',
		scenes: ['js-loose-equality'],
		notes: md(
			'`===` (strict equality) compares type and value with no conversion. `==` (loose equality) first **coerces** the operands to a common type using fixed rules, which is where the surprises come from.',
			'',
			'```js',
			"0 == ''            // true",
			'null == undefined  // true',
			'null == 0          // false',
			'[] == false        // true',
			'NaN == NaN         // false',
			'```',
			'',
			'- **Truthiness:** only `false`, `0`, `-0`, `0n`, `\'\'`, `null`, `undefined` and `NaN` are falsy. Everything else is truthy, including `[]`, `{}` and `\'0\'`.',
			"- `+` is overloaded: if either side is a string it concatenates (`'1' + 1` is `'11'`), but `-`, `*` and `/` always convert to numbers (`'3' - 1` is `2`).",
			'- `Object.is(a, b)` is like `===` except that `Object.is(NaN, NaN)` is `true` and `Object.is(0, -0)` is `false`. Array `includes` finds `NaN`; `indexOf` does not.',
			'',
			'Use `===` by default. The one common, defensible use of `==` is `x == null`, which tests for both `null` and `undefined`.',
			'',
			'**Common trap:** `if (value)` treats `0` and `\'\'` as missing. When zero or an empty string is a valid value, test explicitly (`value != null`) or use `??`.'
		),
		try: [
			{ label: 'Loose equality surprises', code: `console.log(0 == '', null == undefined, null == 0, NaN == NaN, [] == false);\nconsole.log('1' + 1, '3' - 1);` },
			{ label: 'Object.is and NaN', code: `console.log(Object.is(NaN, NaN), Object.is(0, -0), 0 === -0);\nconsole.log([NaN].includes(NaN), [NaN].indexOf(NaN));` },
			{ label: 'Which values are falsy?', code: `const show = v => (typeof v === 'string' ? JSON.stringify(v) : typeof v === 'bigint' ? v + 'n' : v && typeof v === 'object' ? JSON.stringify(v) : String(v));\nfor (const v of [0, '', null, undefined, NaN, 0n, [], {}, '0']) console.log(show(v).padEnd(10), Boolean(v));` }
		]
	},
	{
		id: 'scope-and-hoisting',
		title: 'Scope and hoisting',
		level: 'basic',
		summary: 'Explain why var is function-scoped, why let has a dead zone, and what hoisting really does.',
		scenes: ['js-hoisting-tdz'],
		notes: md(
			'Scope decides where a name is visible. `var` is **function-scoped**; `let` and `const` are **block-scoped** (visible inside the nearest `{ }`).',
			'',
			'**Hoisting** is not code moving. Before running a scope, the engine creates every declared name in it. What differs is the starting state:',
			'',
			'- `var` names start as `undefined`, so reading one early gives `undefined`.',
			'- `let` and `const` names exist but are **uninitialised** until their line runs. Touching them early throws a `ReferenceError`. That gap is the **temporal dead zone (TDZ)**.',
			'- A function declaration is hoisted with its body, so you can call it above its definition. A function *expression* assigned to a `var` is not: the variable is `undefined` until the assignment.',
			'',
			'```js',
			'console.log(a);  // undefined',
			'var a = 1;',
			'console.log(b);  // ReferenceError',
			'let b = 2;',
			'```',
			'',
			'A name that is not found in the current scope is looked up in the enclosing scopes, outward. That chain is the **scope chain**.',
			'',
			'**Common trap:** `typeof x` is safe for a name that was never declared, but it throws if `x` is a `let` variable inside its TDZ. Declare variables at the top of their block and default to `const`.'
		),
		try: [
			{ label: 'Function vs var hoisting', code: `console.log(typeof hoisted, hoisted());\nfunction hoisted() { return 'ok'; }\nconsole.log(v);\nvar v = 5;\nconsole.log(v);` },
			{ label: 'The temporal dead zone', code: `try {\n  console.log(x);\n} catch (e) {\n  console.log(e.name);\n}\nlet x = 1;\nconsole.log(x);` },
			{ label: 'var leaks, let does not', code: `{\n  var a = 1;\n  let b = 2;\n}\nconsole.log(typeof a, typeof b);` }
		]
	},
	{
		id: 'closures',
		title: 'Closures',
		level: 'mid',
		summary: 'See a closure as a function that keeps its birth scope alive.',
		scenes: ['js-closure-counter', 'js-loop-closure'],
		notes: md(
			'A **closure** is a function together with the variables it can see where it was created. Because the function keeps a reference to that scope, those variables stay alive after the outer function has returned.',
			'',
			'```js',
			'function makeCounter() {',
			'  let n = 0;',
			'  return () => ++n;',
			'}',
			'const a = makeCounter();',
			'a(); a();            // 1, 2',
			'const b = makeCounter();',
			'b();                 // 1  (its own n)',
			'```',
			'',
			'Each call to `makeCounter` creates a fresh scope, so every counter has private state that nothing else can reach. That is the basis of module patterns, memoisation, `once`, debounce and event handlers.',
			'',
			'Closures capture **variables, not values**: the function sees the variable\'s current value when it runs, not the value it had when it was created.',
			'',
			'That explains the classic loop bug. With `var` there is one `i` shared by every callback, so after the loop they all see its final value. With `let` each iteration gets its own `i`, so each callback sees its own.',
			'',
			'**Common trap:** a closure that holds a large object keeps all of it in memory for as long as the closure lives. In long-lived handlers, copy out only what you need.'
		),
		try: [
			{ label: 'A counter with private state', code: `function makeCounter() {\n  let n = 0;\n  return () => ++n;\n}\nconst c1 = makeCounter();\nconst c2 = makeCounter();\nconsole.log(c1(), c1(), c2());` },
			{ label: 'The classic loop: var vs let', code: `for (var i = 0; i < 3; i++) setTimeout(() => console.log('var', i));\nfor (let j = 0; j < 3; j++) setTimeout(() => console.log('let', j));` },
			{ label: 'once(): run a function a single time', code: `function once(fn) {\n  let done = false, result;\n  return (...args) => (done ? result : ((done = true), (result = fn(...args))));\n}\nconst init = once(() => { console.log('init!'); return 42; });\nconsole.log(init(), init());` }
		]
	},
	{
		id: 'this-binding',
		title: 'this and call sites',
		level: 'mid',
		summary: 'Predict this from how a function is called, not where it is written.',
		scenes: ['js-this-call-site', 'js-arrow-this'],
		notes: md(
			'For ordinary functions, `this` is set **at the call site**:',
			'',
			'1. `new f()` makes a new object and uses it as `this`.',
			'2. `f.call(obj)`, `f.apply(obj)` and `f.bind(obj)` set it explicitly.',
			'3. `obj.f()` uses `obj`.',
			'4. A plain `f()` uses `undefined` in strict mode (modules and classes are always strict) or the global object in sloppy mode.',
			'',
			'**Arrow functions** have no `this` of their own. They use the `this` of the scope where they were written, and `call`/`bind` cannot change it. That makes them ideal for callbacks inside methods.',
			'',
			'```js',
			'class Btn {',
			"  label = 'ok';",
			'  handler = () => this.label;',
			'  method() { return this?.label; }',
			'}',
			'const { handler, method } = new Btn();',
			"handler();   // 'ok'",
			'method();    // undefined',
			'```',
			'',
			'Extracting a method (`const f = obj.method`) or passing it as a callback (`setTimeout(obj.method)`) removes the `obj.` in front of the call, so `this` is lost.',
			'',
			'**Common trap:** an arrow function as an object method (`{ name: \'x\', hi: () => this.name }`) does not get the object as `this`; it captures the surrounding `this`.'
		),
		try: [
			{ label: 'Method vs extracted function', code: `const user = {\n  name: 'Asha',\n  hi() {\n    'use strict';\n    return this === undefined ? 'lost this' : this.name;\n  }\n};\nconst f = user.hi;\nconsole.log(user.hi(), f());` },
			{ label: 'Arrow field keeps this', code: `class Btn {\n  label = 'ok';\n  handler = () => this.label;\n  method() { return this?.label; }\n}\nconst { handler, method } = new Btn();\nconsole.log(handler(), method());` },
			{ label: 'call, apply and bind', code: `function greet(g) { return g + ', ' + this.name; }\nconsole.log(greet.call({ name: 'Ben' }, 'Hi'), greet.apply({ name: 'Chen' }, ['Yo']));\nconst bound = greet.bind({ name: 'Dara' });\nconsole.log(bound('Hey'));` }
		]
	},
	{
		id: 'prototypes-and-classes',
		title: 'Prototypes and classes',
		level: 'mid',
		summary: 'Follow the prototype chain, and see class as syntax over it.',
		scenes: ['js-prototype-chain', 'js-new-operator'],
		notes: md(
			'Every object has a hidden link to another object, its **prototype**. When you read `obj.x` and `obj` has no own `x`, the engine follows the link, then the next one, until it finds `x` or reaches `null`. That path is the **prototype chain**.',
			'',
			'```js',
			'const animal = {',
			"  speak() { return this.name + '!'; }",
			'};',
			'const dog = Object.create(animal);',
			"dog.name = 'Rex';",
			'dog.speak();   // found on animal',
			'```',
			'',
			'- Writes go to the object itself and never change the prototype (unless a setter is involved).',
			'- `new F()` creates an object whose prototype is `F.prototype`.',
			'- `class` is syntax over this: methods live on `Class.prototype`, shared by all instances, and `extends` links one prototype to the next. `typeof` a class is `\'function\'`.',
			'- `Object.hasOwn(obj, key)` checks own properties only; `key in obj` also walks the chain.',
			'',
			'Class fields (`x = 1`) are per-instance. `#private` fields are truly private to the class body.',
			'',
			'**Common trap:** a method written as an arrow-function class field is created again for every instance and sits on the instance, not the prototype, so it uses more memory and cannot be reached through `super`.'
		),
		try: [
			{ label: 'The prototype chain', code: `const animal = { speak() { return this.name + ' makes a sound'; } };\nconst dog = Object.create(animal);\ndog.name = 'Rex';\nconsole.log(dog.speak(), Object.getPrototypeOf(dog) === animal);\nconsole.log(Object.hasOwn(dog, 'speak'), 'speak' in dog);` },
			{ label: 'A class is a function with a prototype', code: `class A { m() {} }\nconsole.log(typeof A, A.prototype.m === new A().m);\nconsole.log(Object.getOwnPropertyNames(A.prototype));` },
			{ label: 'What new does', code: `function P(n) { this.n = n; }\nP.prototype.get = function () { return this.n; };\nconst p = new P(5);\nconsole.log(p.get(), p instanceof P, p.constructor === P);` }
		]
	},
	{
		id: 'array-methods',
		title: 'Array methods',
		level: 'basic',
		summary: 'Choose map, filter and reduce confidently, and know which methods mutate.',
		scenes: ['js-map-filter-reduce', 'js-sort-mutates'],
		notes: md(
			'`map`, `filter` and `reduce` take a function, which makes them **higher-order functions**. They describe what you want instead of how to loop.',
			'',
			'```js',
			'const nums = [1, 2, 3, 4, 5];',
			'nums.map(n => n * 2);',
			'// [2, 4, 6, 8, 10]  same length',
			'nums.filter(n => n % 2);',
			'// [1, 3, 5]  a subset',
			'nums.reduce((s, n) => s + n, 0);',
			'// 15  one value',
			'```',
			'',
			'Others you will use daily: `find`, `some`, `every`, `flatMap`, `includes`, `at(-1)`.',
			'',
			'**Mutating or not** matters for bugs in React state and shared data:',
			'',
			'- Change the original: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill`.',
			'- Return a copy: `map`, `filter`, `slice`, `concat`, and the newer `toSorted`, `toReversed`, `toSpliced`, `with` (ES2023).',
			'',
			'Give `reduce` an initial value; on an empty array without one it throws. `forEach` returns `undefined`.',
			'',
			'**Common trap:** `sort()` with no comparator compares items as strings, so `[10, 9, 1, 100].sort()` gives `[1, 10, 100, 9]`. Pass `(a, b) => a - b` for numbers, and remember `sort` changes the array in place.'
		),
		try: [
			{ label: 'map, filter, reduce', code: `const nums = [1, 2, 3, 4, 5];\nconsole.log(nums.map(n => n * 2));\nconsole.log(nums.filter(n => n % 2));\nconsole.log(nums.reduce((sum, n) => sum + n, 0));` },
			{ label: 'sort mutates, toSorted copies', code: `const a = [3, 1, 2];\nconst sorted = a.sort();\nconsole.log(a, sorted === a);\nconst b = [3, 1, 2];\nconst c = b.toSorted();\nconsole.log(b, c);` },
			{ label: 'The default sort is textual', code: `console.log([10, 9, 1, 100].sort());\nconsole.log([10, 9, 1, 100].sort((a, b) => a - b));` }
		]
	},
	{
		id: 'objects-and-copying',
		title: 'Objects, spread and copying',
		level: 'mid',
		summary: 'Copy objects on purpose: know what spread copies and when you need structuredClone.',
		scenes: ['js-shallow-vs-deep'],
		notes: md(
			'Spread (`{ ...a }`, `[...arr]`), `Object.assign` and `Array.from` make **shallow copies**: a new top-level object, but any nested object is still shared with the original.',
			'',
			'```js',
			"const a = { name: 'Asha', tags: ['x'] };",
			'const b = { ...a };',
			"b.name = 'Ben';      // a.name unchanged",
			"b.tags.push('y');    // a.tags changes too",
			'const c = structuredClone(a);',
			'// c is a deep copy',
			'```',
			'',
			'`structuredClone` makes a **deep copy**. It handles `Date`, `Map`, `Set`, typed arrays and even cyclic references. It throws a `DataCloneError` for functions, and it drops prototypes, so class instances come back as plain objects. The old `JSON.parse(JSON.stringify(x))` trick turns dates into strings and loses `undefined`, `Map` and `Set`.',
			'',
			'**Destructuring** unpacks values: `const { x, y = 10, ...rest } = obj` and `const [first, , third] = arr`. A default applies only for `undefined`, not `null`. Spread also merges, and later keys win: `{ ...defaults, ...overrides }`.',
			'',
			'`Object.freeze` is shallow too: it locks the top level only.',
			'',
			'**Common trap:** updating nested state with a shallow copy and then mutating the nested part. Copy every level you change, or clone.'
		),
		try: [
			{ label: 'Spread is shallow', code: `const a = { name: 'Asha', tags: ['x'] };\nconst b = { ...a };\nb.name = 'Ben';\nb.tags.push('y');\nconsole.log(a.name, a.tags, a.tags === b.tags);` },
			{ label: 'structuredClone is deep', code: `const a = { when: new Date(0), tags: ['x'] };\nconst c = structuredClone(a);\nc.tags.push('y');\nconsole.log(a.tags, c.tags, c.when instanceof Date);\ntry {\n  structuredClone({ f() {} });\n} catch (e) {\n  console.log(e.name);\n}` },
			{ label: 'Destructuring defaults', code: `const { x, y = 10, ...rest } = { x: 1, z: 3, w: 4 };\nconst [first, , third] = [1, 2, 3];\nconst { p = 5, q = 7 } = { p: undefined, q: null };\nconsole.log(x, y, rest, first, third, p, q);` }
		]
	},
	{
		id: 'event-loop',
		title: 'The event loop',
		level: 'mid',
		summary: 'Order synchronous code, microtasks and timers correctly.',
		scenes: ['js-event-loop'],
		notes: md(
			'JavaScript runs your code on **one thread**, using a **call stack**. Anything slow or waiting (timers, network, I/O) is handed to the environment, which later queues a callback.',
			'',
			'Two queues feed the stack:',
			'',
			'- The **task queue** (macrotasks): `setTimeout`, `setInterval`, DOM events, message events.',
			'- The **microtask queue**: promise reactions (`.then`, `await` continuations) and `queueMicrotask`.',
			'',
			'The loop: run one task to completion, then run **all** microtasks until that queue is empty (including new ones added meanwhile), let the browser render if it wants to, then take the next task.',
			'',
			'```js',
			"console.log('A');",
			"setTimeout(() => console.log('timeout'), 0);",
			"Promise.resolve().then(() => console.log('microtask'));",
			"console.log('B');",
			'// A, B, microtask, timeout',
			'```',
			'',
			'So synchronous code finishes first, then microtasks, then the next timer. `setTimeout(fn, 0)` means "as soon as possible, after the current work", not "now", and browsers may clamp deeply nested timers to about 4 ms.',
			'',
			'**Common trap:** a long synchronous loop blocks everything: timers fire late and the page cannot paint. An endless chain of microtasks is worse, because timers and rendering wait until that queue is empty.'
		),
		try: [
			{ label: 'Sync, microtask, timer', code: `console.log('A');\nsetTimeout(() => console.log('timeout'), 0);\nPromise.resolve().then(() => console.log('microtask'));\nqueueMicrotask(() => console.log('queueMicrotask'));\nconsole.log('B');` },
			{ label: 'Microtasks run between timers', code: `setTimeout(() => console.log('t1'), 0);\nsetTimeout(() => {\n  console.log('t2');\n  Promise.resolve().then(() => console.log('t2 microtask'));\n}, 0);\nsetTimeout(() => console.log('t3'), 0);` },
			{ label: 'A busy loop delays timers', code: `const start = Date.now();\nsetTimeout(() => console.log('timer fired late:', Date.now() - start >= 100), 0);\nwhile (Date.now() - start < 100) {}\nconsole.log('loop done');` }
		]
	},
	{
		id: 'promises',
		title: 'Promises',
		level: 'mid',
		summary: 'Read promise chains: states, what then returns, and how errors travel.',
		scenes: ['js-promise-chain', 'js-promise-combinators'],
		notes: md(
			'A **promise** is an object for a value that will exist later. It starts *pending* and settles once, as *fulfilled* (with a value) or *rejected* (with a reason).',
			'',
			'`.then(onFulfilled)` always returns a **new promise**. Whatever the handler returns becomes the next value; a returned promise is awaited; a thrown error rejects the next promise. A rejection skips every `.then` until the first `.catch`, and `.finally` runs either way.',
			'',
			'```js',
			'Promise.resolve(1)',
			'  .then(v => v + 1)',
			"  .then(() => { throw new Error('boom'); })",
			"  .then(() => console.log('skipped'))",
			"  .catch(e => console.log('caught', e.message))",
			"  .finally(() => console.log('done'));",
			'```',
			'',
			'The executor passed to `new Promise(...)` runs **synchronously**; only the callbacks are asynchronous, as microtasks.',
			'',
			'Combinators: `Promise.all` (all values, or rejects on the first failure), `Promise.allSettled` (waits for everything, never rejects), `Promise.race` (the first to settle, success or failure), `Promise.any` (the first to fulfil; rejects only if all reject).',
			'',
			'**Common trap:** forgetting to `return` a promise inside `.then`. The chain then does not wait for it, and an error inside it becomes an unhandled rejection.'
		),
		try: [
			{ label: 'Chain, error, catch, finally', code: `Promise.resolve(1)\n  .then(v => v + 1)\n  .then(() => { throw new Error('boom'); })\n  .then(() => console.log('skipped'))\n  .catch(e => console.log('caught', e.message))\n  .finally(() => console.log('finally'));` },
			{ label: 'all, allSettled, race', code: `const ok = (v, ms) => new Promise(r => setTimeout(() => r(v), ms));\nconst bad = ms => new Promise((_, j) => setTimeout(() => j(new Error('x')), ms));\nPromise.all([ok(1, 10), bad(5)]).catch(e => console.log('all rejected:', e.message));\nPromise.allSettled([ok(1, 10), bad(5)]).then(r => console.log(r.map(x => x.status)));\nPromise.race([ok('slow', 30), ok('fast', 5)]).then(v => console.log('race:', v));` },
			{ label: 'The executor runs now', code: `new Promise(res => {\n  console.log('executor runs now');\n  res('done');\n}).then(console.log);\nconsole.log('sync after');` }
		]
	},
	{
		id: 'async-await-and-errors',
		title: 'async/await and errors',
		level: 'mid',
		summary: 'Understand where an async function pauses and how to run work in parallel.',
		scenes: ['js-async-await-split', 'js-await-parallel'],
		notes: md(
			'An `async` function always returns a promise. `await x` pauses **that function only** (the caller keeps running) until `x` settles, then resumes it as a microtask. Code before the first `await` runs synchronously.',
			'',
			'```js',
			'async function f() {',
			"  console.log('1 in f');",
			'  await null;',
			"  console.log('3 after await');",
			'}',
			'f();',
			"console.log('2 after call');",
			'```',
			'',
			'A rejected promise makes `await` **throw**, so ordinary `try/catch/finally` works. Without it the async function\'s promise rejects, and if nobody handles that you get an unhandled rejection.',
			'',
			'`await` in a loop runs steps one after another. To run them together, start them first and then wait: `await Promise.all(items.map(fetchOne))`. Two awaits in a row take the *sum* of the times; `Promise.all` takes the *longest*.',
			'',
			'`forEach(async ...)` does not wait: it ignores the returned promises. Use `for...of` with `await` for sequential work, or `Promise.all(map(...))` for parallel work.',
			'',
			'**Common trap:** `return promise` inside `try` without `await` skips the `catch`, because the function has already returned. Write `return await promise` when the `catch` must see the error.'
		),
		try: [
			{ label: 'Where an async function pauses', code: `async function f() {\n  console.log('1 in f');\n  await null;\n  console.log('3 after await');\n}\nf();\nconsole.log('2 after call');` },
			{ label: 'try, catch and finally with await', code: `async function g() {\n  try {\n    await Promise.reject(new Error('nope'));\n  } catch (e) {\n    return 'handled ' + e.message;\n  } finally {\n    console.log('cleanup');\n  }\n}\ng().then(console.log);` },
			{ label: 'Sequential vs parallel', code: `const wait = ms => new Promise(r => setTimeout(r, ms));\nlet t = Date.now();\nawait wait(50);\nawait wait(50);\nconst sequential = Date.now() - t;\nt = Date.now();\nawait Promise.all([wait(50), wait(50)]);\nconst parallel = Date.now() - t;\nconsole.log('parallel is faster:', parallel < sequential);` }
		]
	},
	{
		id: 'modules',
		title: 'Modules',
		level: 'mid',
		summary: 'Compare ES modules and CommonJS, and see why imports are live.',
		scenes: ['js-esm-live-binding'],
		notes: md(
			'**ES modules** (`import` / `export`) are the standard. **CommonJS** (`require` / `module.exports`) is Node\'s older system.',
			'',
			'```js',
			'// counter.js',
			'export let count = 0;',
			'export function inc() { count++; }',
			'',
			"// main.js",
			"import { count, inc } from './counter.js';",
			'inc();',
			'console.log(count);   // 1: live view',
			'```',
			'',
			'- ESM imports are **live bindings** that read the exporting module\'s variable. CommonJS `require` returns the `module.exports` object as it stands at that moment, and a primitive such as `count` on it is a **copy** of the value, so later changes are not seen.',
			'- ESM is **static**: imports are analysed before running, which allows tree-shaking. `import()` is the dynamic form and returns a promise.',
			'- A module runs **once**; every importer shares the same instance. Modules are always strict, top-level `this` is `undefined`, and top-level `await` is allowed.',
			'- You cannot reassign an imported name (`count = 5` throws), but the exporter can change it.',
			'',
			'In Node, a `.js` file is ESM when the package has `"type": "module"` (or the file ends in `.mjs`); otherwise it is CommonJS.',
			'',
			'**Common trap:** destructuring a namespace, `const { count } = await import(url)`, copies the value at that moment and breaks the live link. Read `ns.count` instead.'
		),
		try: [
			{ label: 'Live bindings vs a destructured copy', code: `try {\n  // a fresh module on every run (the random comment makes the URL unique)\n  const src = '/* ' + Math.random() + ' */ export let count = 0; export function inc() { count++; }';\n  const mod = await import('data:text/javascript,' + encodeURIComponent(src));\n  const { count, inc } = mod;\n  inc();\n  console.log(count, mod.count);\n} catch (e) {\n  console.log('This engine blocks module imports from data: URLs:', e.name);\n}` },
			{ label: 'A module runs once', code: `try {\n  globalThis.evaluations = 0;\n  const url = 'data:text/javascript,' + encodeURIComponent('/* ' + Math.random() + ' */ globalThis.evaluations++; export const n = 1;');\n  const a = await import(url);\n  const b = await import(url);\n  console.log('evaluated', globalThis.evaluations, 'time(s); same module:', a === b);\n} catch (e) {\n  console.log('This engine blocks module imports from data: URLs:', e.name);\n}` }
		]
	},
	{
		id: 'iterators-and-generators',
		title: 'Iterators and generators',
		level: 'advanced',
		summary: 'Use the iteration protocol, and generators that pause and resume.',
		scenes: ['js-generator'],
		notes: md(
			'Anything you can use with `for...of`, spread (`[...x]`) or destructuring is an **iterable**: an object with a `[Symbol.iterator]()` method that returns an **iterator**, an object with `next()` returning `{ value, done }`. Arrays, strings, `Map`, `Set` and `arguments` are iterable; plain objects are not.',
			'',
			'A **generator function** (`function*`) writes an iterator as straight-line code. Calling it runs nothing; each `next()` runs up to the next `yield`, hands a value out, and pauses there with all its locals intact. `next(x)` also sends `x` in as the result of that `yield`.',
			'',
			'```js',
			'function* count() {',
			'  let i = 0;',
			'  while (true) yield i++;  // lazy',
			'}',
			'const it = count();',
			'it.next().value;   // 0',
			'it.next().value;   // 1',
			'```',
			'',
			'Because values are produced **on demand**, generators can describe endless or huge sequences, and `break` in a `for...of` calls the iterator\'s `return()` so it can clean up. `async function*` with `for await...of` does the same for async data such as streams and paginated APIs.',
			'',
			'**Common trap:** a generator object can be consumed only once. After `[...it]`, a second spread gives `[]`; call the generator function again to get a fresh one.'
		),
		try: [
			{ label: 'A generator pauses and resumes', code: `function* count() {\n  let i = 0;\n  while (true) {\n    const reset = yield i++;\n    if (reset) i = 0;\n  }\n}\nconst g = count();\nconsole.log(g.next().value, g.next().value, g.next().value, g.next(true).value, g.next().value);` },
			{ label: 'Make your own iterable', code: `const range = {\n  from: 1, to: 4,\n  [Symbol.iterator]() {\n    let n = this.from;\n    const to = this.to;\n    return { next: () => (n <= to ? { value: n++, done: false } : { value: undefined, done: true }) };\n  }\n};\nconsole.log([...range], Math.max(...range));` },
			{ label: 'Lazy sequences', code: `function* naturals() { let n = 1; while (true) yield n++; }\nfunction* take(it, k) { let i = 0; for (const v of it) { if (i++ >= k) return; yield v; } }\nconsole.log([...take(naturals(), 5)]);` }
		]
	},
	{
		id: 'modern-features',
		title: 'Modern features',
		level: 'basic',
		summary: 'Use current standard features safely: ?., ??, at, groupBy and the immutable array methods.',
		scenes: ['js-nullish-vs-or'],
		notes: md(
			'Features you can rely on in all current browsers and Node:',
			'',
			'- **Optional chaining** `a?.b?.[0]?.()` stops and returns `undefined` if anything before a `?.` is `null` or `undefined`.',
			'- **Nullish coalescing** `a ?? b` falls back only for `null` and `undefined`, while `a || b` also replaces `0`, `\'\'` and `false`.',
			'- `at(-1)` reads from the end; `Object.hasOwn`; `structuredClone`; `Promise.allSettled` and `Promise.any`.',
			'- The immutable array methods (ES2023): `toSorted`, `toReversed`, `toSpliced`, `with`, plus `findLast`.',
			'',
			'```js',
			'const settings = { retries: 0 };',
			'settings.retries || 3;  // 3: a bug?',
			'settings.retries ?? 3;  // 0',
			'```',
			'',
			'Newer, standardised, but check your targets first: `Object.groupBy` and `Map.groupBy` (ES2024), `Promise.withResolvers` (ES2024), and the `Set` methods `union`, `intersection` and `difference` (ES2025). Older browsers and runtimes may lack them, so feature-detect or use a polyfill.',
			'',
			'Logical assignment `??=`, `||=` and `&&=` is shorthand: `cache.x ??= compute()` computes only when `x` is `null` or `undefined`.',
			'',
			'**Common trap:** mixing `??` with `||` or `&&` without parentheses is a syntax error. Write `(a ?? b) || c`.'
		),
		try: [
			{ label: '|| vs ??', code: `console.log(0 || 'default', 0 ?? 'default', null ?? 'default', '' ?? 'x', '' || 'x');` },
			{ label: 'Optional chaining', code: `const user = { profile: null };\nconsole.log(user.profile?.name, user.address?.city.name, user.profile?.name ?? 'anonymous');` },
			{ label: 'groupBy, at, with', code: `const people = [{ n: 'A', age: 20 }, { n: 'B', age: 35 }, { n: 'C', age: 22 }];\nconst g = Object.groupBy(people, p => (p.age < 30 ? 'young' : 'older'));\nconsole.log(g.young.length, g.older.length, Object.getPrototypeOf(g));\nconst a = [1, 2, 3, 4];\nconsole.log(a.at(-1), a.findLast(n => n % 2), a.with(0, 99), a);` }
		]
	}
];

export const javascript: LearnEngine = {
	id: 'javascript',
	name: 'JavaScript',
	tagline: 'How the language really works: values, functions, the event loop and async.',
	topics,
	questions: javascriptQuestions,
	quizTopics: topics.map((t) => ({ id: t.id, label: t.title })),
	playground: 'js',
	quizBlurb: 'JavaScript, from values and closures to the event loop and async'
};
