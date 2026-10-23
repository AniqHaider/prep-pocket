import type { Scene } from '../types';

/** JavaScript animated lessons (ids js-*). Group = the id of the topic in src/db/javascript.ts. */
export const javascriptScenes: Scene[] = [
	// ───────── values-and-types ─────────
	{
		id: 'js-value-vs-reference',
		topic: 'javascript',
		group: 'values-and-types',
		title: 'Copied values vs shared objects',
		blurb: 'Why does changing one variable sometimes change another?',
		nodes: [
			{ id: 'c1', kind: 'doc', x: 8, y: 14, w: 200, lines: ['let a = 1;', 'let b = a;', 'b = 2;'], visible: true },
			{ id: 'a', kind: 'box', x: 232, y: 20, w: 112, h: 34, label: 'a = 1', shape: 'pill' },
			{ id: 'b', kind: 'box', x: 232, y: 66, w: 112, h: 34, label: 'b = 1', shape: 'pill' },
			{ id: 'c2', kind: 'doc', x: 8, y: 14, w: 210, lines: ['const x = { n: 1 };', 'const y = x;', 'y.n = 2;'] },
			{ id: 'x', kind: 'box', x: 40, y: 140, w: 70, h: 34, label: 'x', shape: 'pill' },
			{ id: 'y', kind: 'box', x: 40, y: 200, w: 70, h: 34, label: 'y', shape: 'pill' },
			{ id: 'obj', kind: 'box', x: 230, y: 160, w: 112, h: 44, label: '{ n: 1 }', sub: 'one object' },
			{ id: 'ex', kind: 'edge', from: 'x', to: 'obj' },
			{ id: 'ey', kind: 'edge', from: 'y', to: 'obj' },
			{ id: 'note', kind: 'text', x: 8, y: 276, text: 'x.n is 2, and x === y is true.', w: 340, size: 'sm' }
		],
		steps: [
			{ say: 'Numbers, strings and other primitives hold the value itself. The variable a holds 1.', show: ['a'], set: { c1: { hl: [0] } }, focus: ['a'] },
			{ say: 'let b = a copies the value. Now b has its own separate 1.', show: ['b'], set: { c1: { hl: [1] } } },
			{ say: 'Changing b to 2 does not touch a. Primitives are copied, so each variable is independent.', set: { c1: { hl: [2] }, b: { label: 'b = 2', tone: 'accent' } }, pulse: ['b'] },
			{ say: 'Objects work differently. The variable x holds a reference: an arrow to an object stored elsewhere.', hide: ['c1', 'a', 'b'], show: ['c2', 'x', 'obj', 'ex'], set: { c2: { hl: [0] } }, focus: ['obj'] },
			{ say: 'const y = x copies the reference, not the object. Now two names point at the same object.', show: ['y', 'ey'], set: { c2: { hl: [1] } } },
			{ say: 'y.n = 2 changes that one shared object.', set: { c2: { hl: [2] }, obj: { label: '{ n: 2 }', tone: 'warn' } }, pulse: ['obj'] },
			{ say: 'So x.n is 2 as well. If you need an independent object, copy it on purpose.', show: ['note'], focus: ['x', 'y'] }
		]
	},
	{
		id: 'js-typeof-surprises',
		topic: 'javascript',
		group: 'values-and-types',
		title: 'What typeof really reports',
		blurb: 'Why is typeof null "object"?',
		nodes: [
			{
				id: 't', kind: 'table', x: 60, y: 14, colW: 120, visible: true, cols: ['value', 'typeof'],
				rows: [['42', 'number'], ["'hi'", 'string'], ['true', 'boolean'], ['undefined', 'undefined'], ['null', 'object'], ['[1, 2]', 'object'], ['() => 1', 'function'], ['10n', 'bigint']]
			},
			{ id: 'n', kind: 'text', x: 8, y: 252, text: '', w: 340 }
		],
		steps: [
			{ say: 'typeof gives the type of a value as a string. For these first four rows it does what you would expect.', set: { t: { hl: [0, 1, 2, 3] } } },
			{ say: 'null is a primitive, yet typeof null says object. This bug dates from the first version of JavaScript and can never be fixed.', show: ['n'], set: { t: { hl: [4], tone: 'warn' }, n: { text: 'To test for null, compare directly: value === null.' } } },
			{ say: 'Arrays are objects, so typeof [] is also object. Use Array.isArray(value) to tell an array apart.', set: { t: { hl: [5] }, n: { text: 'Array.isArray([1, 2]) is true.' } } },
			{ say: 'Functions are objects too, but typeof reports function, which is a handy way to check that something is callable.', set: { t: { hl: [6], tone: 'neutral' }, n: { text: "typeof fn === 'function'" } } },
			{ say: 'bigint is its own type, for whole numbers beyond 2^53. Every primitive has its own typeof result, apart from null.', set: { t: { hl: [7] }, n: { text: 'Primitives: string, number, bigint, boolean, undefined, symbol, null.' } } }
		]
	},

	// ───────── equality-and-coercion ─────────
	{
		id: 'js-loose-equality',
		topic: 'javascript',
		group: 'equality-and-coercion',
		title: 'Why [] == false is true',
		blurb: 'How does loose equality decide that an empty array equals false?',
		stage: { w: 360, h: 312 },
		nodes: [
			{ id: 'q', kind: 'text', x: 180, y: 28, text: 'Is [] == false ?', size: 'lg', anchor: 'middle', visible: true },
			{ id: 'b1', kind: 'box', x: 40, y: 46, w: 280, h: 38, label: 'false becomes 0', sub: 'booleans convert to numbers' },
			{ id: 'b2', kind: 'box', x: 40, y: 110, w: 280, h: 38, label: '[] becomes ""', sub: 'an array converts via toString()' },
			{ id: 'b3', kind: 'box', x: 40, y: 174, w: 280, h: 38, label: '"" becomes 0', sub: 'an empty string converts to 0' },
			{ id: 'b4', kind: 'box', x: 40, y: 238, w: 280, h: 38, label: '0 == 0 is true', sub: 'same type now: a plain comparison', tone: 'accent' },
			{ id: 'e1', kind: 'edge', from: 'b1', to: 'b2' },
			{ id: 'e2', kind: 'edge', from: 'b2', to: 'b3' },
			{ id: 'e3', kind: 'edge', from: 'b3', to: 'b4' },
			{ id: 'note', kind: 'text', x: 180, y: 302, text: 'With ===, [] === false is false: no conversion.', w: 340, size: 'sm', anchor: 'middle' }
		],
		steps: [
			{ say: 'Is [] == false true? Loose equality converts the operands until their types match. Watch each conversion.', focus: ['q'] },
			{ say: 'First the boolean: false becomes the number 0.', show: ['b1'], pulse: ['b1'] },
			{ say: 'Now one side is a number, so the array must become a primitive too. Arrays turn into strings through toString(), and an empty array gives the empty string.', show: ['b2', 'e1'], pulse: ['b2'] },
			{ say: 'The empty string is compared with a number, so it becomes a number as well: 0.', show: ['b3', 'e2'], pulse: ['b3'] },
			{ say: 'Both sides are now 0, so the answer is true. Surprising, and the reason to prefer ===.', show: ['b4', 'e3'], pulse: ['b4'] },
			{ say: 'With strict equality, [] === false is false straight away, because the types differ.', show: ['note'], focus: ['note'] }
		]
	},

	// ───────── scope-and-hoisting ─────────
	{
		id: 'js-hoisting-tdz',
		topic: 'javascript',
		group: 'scope-and-hoisting',
		title: 'Hoisting and the dead zone',
		blurb: 'Why can you read a var early, but not a let?',
		stage: { w: 360, h: 290 },
		nodes: [
			{ id: 'c', kind: 'doc', x: 8, y: 10, w: 196, lines: ['console.log(a);', 'var a = 1;', 'console.log(b);', 'let b = 2;'], visible: true },
			{ id: 'ma', kind: 'box', x: 222, y: 14, w: 130, h: 44, label: 'a', sub: 'undefined (hoisted)' },
			{ id: 'mb', kind: 'box', x: 222, y: 70, w: 130, h: 44, label: 'b', sub: 'uninitialised: TDZ' },
			{ id: 'o1', kind: 'box', x: 8, y: 140, w: 170, h: 36, label: 'logs undefined', shape: 'pill' },
			{ id: 'o2', kind: 'box', x: 8, y: 188, w: 170, h: 36, label: 'ReferenceError', shape: 'pill', tone: 'neg' },
			{ id: 'note', kind: 'text', x: 8, y: 262, text: 'Prefer const, declared before use.', w: 340, size: 'sm' }
		],
		steps: [
			{ say: 'Before any line runs, the engine creates every declared name in the scope. This is hoisting: nothing moves, the names just exist early.', show: ['ma', 'mb'], focus: ['ma', 'mb'] },
			{ say: 'var a starts out as undefined, so the first line logs undefined instead of failing.', set: { c: { hl: [0] } }, show: ['o1'], pulse: ['o1'] },
			{ say: 'Then the line var a = 1 assigns the value.', set: { c: { hl: [1] }, ma: { sub: '1', tone: 'accent' } } },
			{ say: 'let b exists too, but it is uninitialised. Until its own line runs, b is in the temporal dead zone.', set: { c: { hl: [2] }, mb: { tone: 'warn' } }, focus: ['mb'] },
			{ say: 'Reading b there throws a ReferenceError. That loud failure is the point of let: mistakes show up early.', show: ['o2'], pulse: ['o2'] },
			{ say: 'Only after let b = 2 runs is b usable. Prefer const, and declare names before you use them.', set: { c: { hl: [3] }, mb: { sub: '2', tone: 'accent' } }, show: ['note'] }
		]
	},

	// ───────── closures ─────────
	{
		id: 'js-closure-counter',
		topic: 'javascript',
		group: 'closures',
		title: 'A closure keeps its scope alive',
		blurb: 'How can a function remember a variable after its parent has returned?',
		stage: { w: 360, h: 268 },
		nodes: [
			{ id: 'c', kind: 'doc', x: 8, y: 8, w: 210, lines: ['function makeCounter() {', '  let n = 0;', '  return () => ++n;', '}', 'const a = makeCounter();', 'const b = makeCounter();'], visible: true },
			{ id: 's1', kind: 'box', x: 8, y: 136, w: 150, h: 44, label: 'scope of call 1', sub: 'n = 0' },
			{ id: 's2', kind: 'box', x: 8, y: 206, w: 150, h: 44, label: 'scope of call 2', sub: 'n = 0' },
			{ id: 'fa', kind: 'box', x: 214, y: 136, w: 130, h: 44, label: 'a', sub: 'returned function' },
			{ id: 'fb', kind: 'box', x: 214, y: 206, w: 130, h: 44, label: 'b', sub: 'returned function' },
			{ id: 'ea', kind: 'edge', from: 'fa', to: 's1', label: 'sees' },
			{ id: 'eb', kind: 'edge', from: 'fb', to: 's2', label: 'sees' }
		],
		steps: [
			{ say: 'makeCounter declares a variable n and returns a small function that uses it.', set: { c: { hl: [1, 2] } } },
			{ say: 'Calling it creates a new scope holding its own n, and returns the inner function as a.', set: { c: { hl: [4] } }, show: ['s1', 'fa', 'ea'] },
			{ say: 'Normally n would vanish when makeCounter returns. But a still refers to it, so the scope stays alive. That is a closure.', focus: ['ea'], pulse: ['s1'] },
			{ say: 'Calling a() twice runs ++n inside that kept scope: n becomes 1, then 2.', set: { s1: { sub: 'n = 2', tone: 'accent' } }, pulse: ['s1'] },
			{ say: 'A second call to makeCounter creates a completely separate scope. b has its own n.', set: { c: { hl: [5] } }, show: ['s2', 'fb', 'eb'] },
			{ say: 'Each closure has private state that nothing else can touch. Calling b() gives 1, not 3.', set: { s2: { sub: 'n = 1', tone: 'accent' } }, pulse: ['s2'] }
		]
	},
	{
		id: 'js-loop-closure',
		topic: 'javascript',
		group: 'closures',
		title: 'The var-in-a-loop bug',
		blurb: 'Why do all the callbacks print 3?',
		stage: { w: 360, h: 262 },
		nodes: [
			{ id: 'c', kind: 'doc', x: 8, y: 8, w: 232, lines: ['for (var i = 0; i < 3; i++) {', '  setTimeout(() => log(i));', '}'], visible: true },
			{ id: 'cb1', kind: 'box', x: 226, y: 84, w: 110, h: 30, label: 'callback 1' },
			{ id: 'cb2', kind: 'box', x: 226, y: 124, w: 110, h: 30, label: 'callback 2' },
			{ id: 'cb3', kind: 'box', x: 226, y: 164, w: 110, h: 30, label: 'callback 3' },
			{ id: 'iv', kind: 'box', x: 8, y: 96, w: 118, h: 56, label: 'one shared i', sub: 'value: 0' },
			{ id: 'e1', kind: 'edge', from: 'cb1', to: 'iv' },
			{ id: 'e2', kind: 'edge', from: 'cb2', to: 'iv' },
			{ id: 'e3', kind: 'edge', from: 'cb3', to: 'iv' },
			{ id: 'l0', kind: 'box', x: 8, y: 84, w: 118, h: 30, label: 'i = 0' },
			{ id: 'l1', kind: 'box', x: 8, y: 124, w: 118, h: 30, label: 'i = 1' },
			{ id: 'l2', kind: 'box', x: 8, y: 164, w: 118, h: 30, label: 'i = 2' },
			{ id: 'f1', kind: 'edge', from: 'cb1', to: 'l0' },
			{ id: 'f2', kind: 'edge', from: 'cb2', to: 'l1' },
			{ id: 'f3', kind: 'edge', from: 'cb3', to: 'l2' },
			{ id: 'out', kind: 'box', x: 8, y: 216, w: 328, h: 34, label: 'logs 3, 3, 3', shape: 'pill', tone: 'neg' }
		],
		steps: [
			{ say: 'Three callbacks are scheduled with setTimeout. They run later, after the loop has finished.', show: ['cb1', 'cb2', 'cb3'] },
			{ say: 'With var there is only one i for the whole loop. All three callbacks point at that same variable.', show: ['iv', 'e1', 'e2', 'e3'], focus: ['iv'] },
			{ say: 'The loop runs to the end before any timer fires, so i ends up as 3.', set: { iv: { sub: 'value: 3', tone: 'warn' } }, pulse: ['iv'] },
			{ say: 'Each callback now reads the variable and finds 3. Closures capture variables, not the values they once had.', show: ['out'], pulse: ['out'] },
			{ say: 'Switch to let. Every iteration now gets its own fresh i.', set: { c: { lines: ['for (let i = 0; i < 3; i++) {', '  setTimeout(() => log(i));', '}'], hl: [0] } }, hide: ['iv', 'e1', 'e2', 'e3', 'out'], show: ['l0', 'l1', 'l2', 'f1', 'f2', 'f3'] },
			{ say: 'Each callback keeps its own i, so they log 0, 1 and 2. That is why let fixes the loop.', set: { out: { label: 'logs 0, 1, 2', tone: 'accent' } }, show: ['out'], pulse: ['out'] }
		]
	},

	// ───────── this-binding ─────────
	{
		id: 'js-this-call-site',
		topic: 'javascript',
		group: 'this-binding',
		title: 'this is set by the call',
		blurb: 'Why does the same function see a different this each time?',
		stage: { w: 360, h: 270 },
		nodes: [
			{ id: 'c', kind: 'doc', x: 8, y: 8, w: 330, lines: ["const obj = { name: 'Asha', greet() {} };", 'const f = obj.greet;'], visible: true },
			{
				id: 't', kind: 'table', x: 20, y: 70, colW: 160, visible: true, cols: ['call', 'this is'],
				rows: [['obj.greet()', 'obj'], ['f()', 'undefined'], ['f.call(other)', 'other'], ['new Greeter()', 'a new object'], ['() => ...', 'from outer scope']]
			},
			{ id: 'n', kind: 'text', x: 20, y: 236, text: '', w: 320 }
		],
		steps: [
			{ say: 'The value of this is decided when a function is called, by the way you call it. Here is one function, called in five ways.', show: ['n'], set: { n: { text: 'Same function, five call shapes.' } } },
			{ say: 'obj.greet(): there is an object in front of the call, so this is obj.', set: { t: { hl: [0] }, n: { text: 'The object before the dot becomes this.' } } },
			{ say: 'const f = obj.greet; f(): the obj. in front is gone. This is undefined in strict code (modules, classes), or the global object in sloppy code.', set: { t: { hl: [1], tone: 'warn' }, n: { text: 'Pulling a method out of its object loses this.' } } },
			{ say: 'call and apply set this explicitly. bind returns a new function with this fixed for good.', set: { t: { hl: [2], tone: 'neutral' }, n: { text: 'f.call(x), f.apply(x), f.bind(x)' } } },
			{ say: 'new Greeter() creates a fresh object and uses it as this.', set: { t: { hl: [3] }, n: { text: 'new links the object to Greeter.prototype.' } } },
			{ say: 'Arrow functions have no this of their own. They use the this of where they were written, and call or bind cannot change it.', set: { t: { hl: [4] }, n: { text: 'Look at where the arrow is written, not how it is called.' } } }
		]
	},
	{
		id: 'js-arrow-this',
		topic: 'javascript',
		group: 'this-binding',
		title: 'Arrow functions and this',
		blurb: 'Why does this.tick() fail inside a setTimeout callback?',
		stage: { w: 360, h: 290 },
		nodes: [
			{ id: 'c', kind: 'doc', x: 8, y: 8, w: 250, lines: ['start() {', '  setTimeout(function () {', '    this.tick();', '  }, 100);', '}'], visible: true },
			{ id: 'inst', kind: 'box', x: 8, y: 128, w: 120, h: 44, label: 'Timer object', sub: 'has tick()' },
			{ id: 'cb', kind: 'box', x: 204, y: 128, w: 140, h: 44, label: 'callback', sub: 'runs later, plain call' },
			{ id: 'x', kind: 'edge', from: 'cb', to: 'inst', label: 'this?', dashed: true, tone: 'neg' },
			{ id: 'res', kind: 'box', x: 8, y: 204, w: 336, h: 36, label: 'TypeError: this.tick is not a function', shape: 'pill', tone: 'neg' },
			{ id: 'n', kind: 'text', x: 8, y: 274, text: 'Arrow functions for callbacks, methods for things that need their own this.', w: 340, size: 'sm' }
		],
		steps: [
			{ say: 'Inside a method, this is the Timer object. We hand a callback to setTimeout.', show: ['inst'], set: { c: { hl: [0] } }, focus: ['inst'] },
			{ say: 'Later, the timer calls the callback as a plain function. There is no object in front of the call.', show: ['cb'], set: { c: { hl: [1] } } },
			{ say: 'So this is not the Timer. The timer supplies its own this (the global object in browsers, a Timeout object in Node), so this.tick is not a function and the call throws a TypeError.', show: ['x', 'res'], set: { c: { hl: [2] } }, pulse: ['res'] },
			{ say: 'The fix is an arrow function. It has no this of its own, so it uses the this of start(), which is the Timer.', set: { c: { lines: ['start() {', '  setTimeout(() => {', '    this.tick();', '  }, 100);', '}'], hl: [1] }, x: { dashed: false, tone: 'accent', label: 'this' }, res: { label: 'tick() runs', tone: 'accent' } }, pulse: ['inst'] },
			{ say: 'Rule of thumb: arrows for callbacks inside methods, ordinary methods for things that need their own this.', show: ['n'], focus: ['n'] }
		]
	},

	// ───────── prototypes-and-classes ─────────
	{
		id: 'js-prototype-chain',
		topic: 'javascript',
		group: 'prototypes-and-classes',
		title: 'Following the prototype chain',
		blurb: 'Where does JavaScript look when a property is missing?',
		stage: { w: 360, h: 296 },
		nodes: [
			{ id: 'dog', kind: 'box', x: 150, y: 16, w: 150, h: 44, label: 'dog', sub: 'name: "Rex"' },
			{ id: 'animal', kind: 'box', x: 150, y: 96, w: 150, h: 44, label: 'animal', sub: 'speak()' },
			{ id: 'op', kind: 'box', x: 150, y: 176, w: 170, h: 44, label: 'Object.prototype', sub: 'toString(), hasOwnProperty()' },
			{ id: 'nul', kind: 'box', x: 150, y: 252, w: 110, h: 30, label: 'null', shape: 'pill' },
			{ id: 'p1', kind: 'edge', from: 'dog', to: 'animal', label: '[[Prototype]]' },
			{ id: 'p2', kind: 'edge', from: 'animal', to: 'op', label: '[[Prototype]]' },
			{ id: 'p3', kind: 'edge', from: 'op', to: 'nul', label: '[[Prototype]]' },
			{ id: 'q', kind: 'text', x: 8, y: 44, text: 'dog.speak()', w: 130 },
			{ id: 'tok', kind: 'token', x: 124, y: 38, label: 'looking' },
			{ id: 'n', kind: 'text', x: 8, y: 150, text: 'Writes go on dog itself, never on animal.', w: 130, size: 'sm' }
		],
		steps: [
			{ say: 'dog is an object with its own property name. Its hidden prototype link points at animal.', show: ['dog', 'animal', 'p1'] },
			{ say: 'animal has the method speak. animal links to Object.prototype, which links to null: the end of the chain.', show: ['op', 'p2', 'nul', 'p3'] },
			{ say: 'To evaluate dog.speak(), the engine first looks at dog itself. There is no own speak there.', show: ['q', 'tok'], focus: ['dog'] },
			{ say: 'So it follows the prototype link to animal and finds speak. The search stops, and this is still dog.', move: { tok: { x: 124, y: 118 } }, set: { animal: { tone: 'accent' } }, focus: ['animal'] },
			{ say: 'dog.toString() is found one level further up, on Object.prototype. Every plain object shares it.', set: { q: { text: 'dog.toString()' }, animal: { tone: 'neutral' }, op: { tone: 'accent' } }, move: { tok: { x: 124, y: 198 } }, focus: ['op'] },
			{ say: 'dog.fly() is found nowhere. The chain ends at null, so the result is undefined (calling it throws).', set: { q: { text: 'dog.fly()' }, op: { tone: 'neutral' }, nul: { tone: 'warn' } }, move: { tok: { x: 124, y: 267 } }, focus: ['nul'] },
			{ say: 'Writes work differently: dog.name = ... always sets an own property on dog and never changes animal.', show: ['n'], hide: ['tok', 'q'], focus: ['dog'] }
		]
	},
	{
		id: 'js-new-operator',
		topic: 'javascript',
		group: 'prototypes-and-classes',
		title: 'What new does, step by step',
		blurb: 'What happens between new User(...) and the finished object?',
		nodes: [
			{ id: 'c', kind: 'doc', x: 8, y: 8, w: 200, lines: ['function User(name) {', '  this.name = name;', '}', 'const u = new User("Asha");'], visible: true },
			{ id: 'o', kind: 'box', x: 224, y: 20, w: 128, h: 44, label: '{ }', sub: 'new empty object' },
			{ id: 'proto', kind: 'box', x: 8, y: 150, w: 150, h: 44, label: 'User.prototype', sub: 'shared methods' },
			{ id: 'ep', kind: 'edge', from: 'o', to: 'proto', label: '[[Prototype]]' },
			{ id: 'u', kind: 'box', x: 224, y: 150, w: 128, h: 40, label: 'u', shape: 'pill' },
			{ id: 'eu', kind: 'edge', from: 'u', to: 'o', label: 'refers to' }
		],
		steps: [
			{ say: 'new User("Asha") looks like a function call, but it does four things in order.', focus: ['c'] },
			{ say: 'First, it creates a brand new empty object.', show: ['o'], set: { c: { hl: [3] } } },
			{ say: 'Second, it links that object to User.prototype, so it can use the shared methods.', show: ['proto', 'ep'] },
			{ say: 'Third, it runs User with this set to the new object, so this.name = name fills it in.', set: { c: { hl: [1] }, o: { label: '{ name: "Asha" }', sub: 'filled in by User', tone: 'accent' } }, pulse: ['o'] },
			{ say: 'Finally, it returns that object and u refers to it. If User returned a different object, that one would win.', show: ['u', 'eu'], set: { c: { hl: [3] } } }
		]
	},

	// ───────── array-methods ─────────
	{
		id: 'js-map-filter-reduce',
		topic: 'javascript',
		group: 'array-methods',
		title: 'map, filter and reduce',
		blurb: 'What do the three workhorse array methods each produce?',
		nodes: [
			{ id: 'lbl', kind: 'text', x: 8, y: 24, text: 'nums = [1, 2, 3, 4, 5]', size: 'sm', visible: true },
			{ id: 'i1', kind: 'box', x: 14, y: 36, w: 56, h: 34, label: '1', visible: true },
			{ id: 'i2', kind: 'box', x: 80, y: 36, w: 56, h: 34, label: '2', visible: true },
			{ id: 'i3', kind: 'box', x: 146, y: 36, w: 56, h: 34, label: '3', visible: true },
			{ id: 'i4', kind: 'box', x: 212, y: 36, w: 56, h: 34, label: '4', visible: true },
			{ id: 'i5', kind: 'box', x: 278, y: 36, w: 56, h: 34, label: '5', visible: true },
			{ id: 'tm', kind: 'text', x: 8, y: 108, text: 'nums.map(n => n * 2): same length, new values', w: 340, size: 'sm' },
			{ id: 'm1', kind: 'box', x: 14, y: 116, w: 56, h: 34, label: '2' },
			{ id: 'm2', kind: 'box', x: 80, y: 116, w: 56, h: 34, label: '4' },
			{ id: 'm3', kind: 'box', x: 146, y: 116, w: 56, h: 34, label: '6' },
			{ id: 'm4', kind: 'box', x: 212, y: 116, w: 56, h: 34, label: '8' },
			{ id: 'm5', kind: 'box', x: 278, y: 116, w: 56, h: 34, label: '10' },
			{ id: 'tf', kind: 'text', x: 8, y: 180, text: 'nums.filter(n => n % 2): keep the odd ones', w: 340, size: 'sm' },
			{ id: 'f1', kind: 'box', x: 14, y: 188, w: 56, h: 34, label: '1' },
			{ id: 'f2', kind: 'box', x: 80, y: 188, w: 56, h: 34, label: '3' },
			{ id: 'f3', kind: 'box', x: 146, y: 188, w: 56, h: 34, label: '5' },
			{ id: 'tr', kind: 'text', x: 8, y: 246, text: 'nums.reduce((acc, n) => acc + n, 0): fold into one value', w: 340, size: 'sm' },
			{ id: 'r', kind: 'box', x: 14, y: 252, w: 150, h: 34, label: 'acc = 0', shape: 'pill' }
		],
		steps: [
			{ say: 'Three methods that take a function and describe what you want, instead of how to loop. Start with an array of five numbers.', focus: ['i1', 'i2', 'i3', 'i4', 'i5'] },
			{ say: 'map runs the function on every item and collects the results: same length, new values.', show: ['tm', 'm1', 'm2', 'm3', 'm4', 'm5'], pulse: ['m1', 'm2', 'm3', 'm4', 'm5'] },
			{ say: 'nums itself is untouched. map always returns a new array.', focus: ['i1', 'i2', 'i3', 'i4', 'i5'] },
			{ say: 'filter keeps the items for which the function returns something truthy. Here, the odd numbers.', show: ['tf', 'f1', 'f2', 'f3'], pulse: ['f1', 'f2', 'f3'] },
			{ say: 'The result can be shorter, or even empty. filter never changes the original either.', focus: ['f1', 'f2', 'f3'] },
			{ say: 'reduce folds the whole array into a single value, carrying an accumulator. It starts at 0.', show: ['tr', 'r'], focus: ['r'] },
			{ say: 'The accumulator becomes 0 + 1 + 2 + 3 + 4 + 5 = 15. Always pass the starting value, or an empty array will throw.', set: { r: { label: 'acc = 15', tone: 'accent' } }, pulse: ['r'] }
		]
	},
	{
		id: 'js-sort-mutates',
		topic: 'javascript',
		group: 'array-methods',
		title: 'sort: text order and mutation',
		blurb: 'Why is [10, 9, 1, 100].sort() not sorted, and why did a change?',
		nodes: [
			{ id: 'ta', kind: 'text', x: 8, y: 26, text: 'a = [10, 9, 1, 100]', size: 'sm', visible: true },
			{ id: 'a1', kind: 'box', x: 14, y: 38, w: 70, h: 34, label: '10', visible: true },
			{ id: 'a2', kind: 'box', x: 92, y: 38, w: 70, h: 34, label: '9', visible: true },
			{ id: 'a3', kind: 'box', x: 170, y: 38, w: 70, h: 34, label: '1', visible: true },
			{ id: 'a4', kind: 'box', x: 248, y: 38, w: 70, h: 34, label: '100', visible: true },
			{ id: 'tb', kind: 'text', x: 8, y: 118, text: 'a.sort()', w: 340, size: 'sm' },
			{ id: 'b1', kind: 'box', x: 14, y: 128, w: 70, h: 34, label: '1' },
			{ id: 'b2', kind: 'box', x: 92, y: 128, w: 70, h: 34, label: '10' },
			{ id: 'b3', kind: 'box', x: 170, y: 128, w: 70, h: 34, label: '100' },
			{ id: 'b4', kind: 'box', x: 248, y: 128, w: 70, h: 34, label: '9' },
			{ id: 'n', kind: 'text', x: 8, y: 214, text: '', w: 340 }
		],
		steps: [
			{ say: 'An array of numbers, and we call sort() with no comparator function.', focus: ['a1', 'a2', 'a3', 'a4'] },
			{ say: 'sort() turns every item into a string and compares them as text. As text, "1" comes before "10", before "100", before "9".', show: ['tb', 'b1', 'b2', 'b3', 'b4'], set: { b1: { tone: 'warn' }, b2: { tone: 'warn' }, b3: { tone: 'warn' }, b4: { tone: 'warn' } } },
			{ say: 'So the result is [1, 10, 100, 9]. It looks sorted, but not as numbers.', show: ['n'], set: { n: { text: 'Text order is the default, even for numbers.' } }, focus: ['b4'] },
			{ say: 'Pass a comparator, (a, b) => a - b, and the numbers compare by value: 1, 9, 10, 100.', set: { tb: { text: 'a.sort((a, b) => a - b)' }, b2: { label: '9', tone: 'accent' }, b3: { label: '10', tone: 'accent' }, b4: { label: '100', tone: 'accent' }, b1: { tone: 'accent' }, n: { text: 'Now they compare as numbers.' } }, pulse: ['b2', 'b3', 'b4'] },
			{ say: 'Notice that sort also rearranged the original array in place, and returned that same array. a is now sorted too.', set: { a1: { label: '1', tone: 'warn' }, a2: { label: '9', tone: 'warn' }, a3: { label: '10', tone: 'warn' }, a4: { label: '100', tone: 'warn' }, ta: { text: 'a, after sort(): changed in place' }, n: { text: 'a === sorted is true: sort mutates.' } }, pulse: ['a1', 'a2', 'a3', 'a4'] },
			{ say: 'To keep the original, use toSorted() (ES2023). It returns a new sorted array and leaves a alone. toReversed, toSpliced and with work the same way.', set: { n: { text: 'toSorted(): a copy, the original is untouched.' } }, focus: ['n'] }
		]
	},

	// ───────── objects-and-copying ─────────
	{
		id: 'js-shallow-vs-deep',
		topic: 'javascript',
		group: 'objects-and-copying',
		title: 'Shallow copy vs deep copy',
		blurb: 'Why did copying an object still change the original?',
		stage: { w: 360, h: 270 },
		nodes: [
			{ id: 'A', kind: 'box', x: 8, y: 24, w: 128, h: 50, label: 'a', sub: 'name: "Asha"' },
			{ id: 'T', kind: 'box', x: 216, y: 110, w: 128, h: 50, label: 'tags array', sub: '["x"]' },
			{ id: 'eA', kind: 'edge', from: 'A', to: 'T', label: 'tags' },
			{ id: 'B', kind: 'box', x: 8, y: 196, w: 128, h: 50, label: 'b = { ...a }', sub: 'name: "Asha"' },
			{ id: 'eB', kind: 'edge', from: 'B', to: 'T', label: 'tags' },
			{ id: 'C', kind: 'box', x: 8, y: 196, w: 170, h: 50, label: 'c = structuredClone(a)', sub: 'name: "Asha"' },
			{ id: 'T2', kind: 'box', x: 216, y: 196, w: 128, h: 50, label: 'copy of tags', sub: '["x", "y"]' },
			{ id: 'eC', kind: 'edge', from: 'C', to: 'T2', label: 'tags' }
		],
		steps: [
			{ say: 'Object a has a name and a nested tags array. The array lives separately, and a just points at it.', show: ['A', 'T', 'eA'] },
			{ say: 'Spread, { ...a }, creates a new object b and copies each property. For tags, it copies the reference, not the array.', show: ['B', 'eB'], pulse: ['B'] },
			{ say: 'b.name = "Ben" changes only b, because strings are copied. But b.tags.push("y") changes the one shared array.', set: { B: { sub: 'name: "Ben"' }, T: { sub: '["x", "y"]', tone: 'warn' } }, pulse: ['T'] },
			{ say: 'a.tags now contains "y" too. This is a shallow copy: only the top level is new.', focus: ['eA', 'eB', 'T'] },
			{ say: 'structuredClone(a) copies the nested array as well. c has its own tags, so changing them can no longer affect a.', hide: ['B', 'eB'], set: { T: { tone: 'neutral' } }, show: ['C', 'T2', 'eC'], pulse: ['T2'] },
			{ say: 'It handles Date, Map, Set and cycles, but throws for functions. Copy every level you intend to change.', focus: ['C', 'T2'] }
		]
	},

	// ───────── event-loop ─────────
	{
		id: 'js-event-loop',
		topic: 'javascript',
		group: 'event-loop',
		title: 'The event loop in motion',
		blurb: 'In what order do sync code, promises and timers run?',
		stage: { w: 360, h: 304 },
		nodes: [
			{ id: 'c', kind: 'doc', x: 8, y: 8, w: 200, lines: ["log('A');", 'setTimeout(logT, 0);', 'Promise.resolve().then(logP);', "log('B');"], visible: true },
			{ id: 'stack', kind: 'box', x: 214, y: 8, w: 138, h: 34, label: 'Call stack', visible: true },
			{ id: 'apis', kind: 'box', x: 214, y: 84, w: 138, h: 34, label: 'Timer (browser)', visible: true },
			{ id: 'micro', kind: 'box', x: 8, y: 176, w: 168, h: 34, label: 'Microtask queue', visible: true },
			{ id: 'task', kind: 'box', x: 184, y: 176, w: 168, h: 34, label: 'Task queue', visible: true },
			{ id: 'out', kind: 'box', x: 8, y: 256, w: 344, h: 40, label: 'Output', sub: '(nothing yet)', visible: true },
			{ id: 'tokT', kind: 'token', x: 330, y: 136, label: 'logT', tone: 'warn' },
			{ id: 'tokP', kind: 'token', x: 92, y: 232, label: 'logP', tone: 'accent' },
			{ id: 'n', kind: 'text', x: 8, y: 246, text: 'Sync code, then microtasks, then timers.', w: 340, size: 'sm' }
		],
		steps: [
			{ say: "The script starts. The call stack runs the first line: log('A') prints A.", set: { c: { hl: [0] }, out: { sub: 'A' } }, focus: ['stack'] },
			{ say: 'setTimeout hands logT to the timer, a feature of the browser outside JavaScript. The stack moves straight on.', set: { c: { hl: [1] } }, show: ['tokT'], focus: ['apis'] },
			{ say: 'Promise.resolve().then(logP) puts logP straight onto the microtask queue, because the promise is already resolved.', set: { c: { hl: [2] } }, show: ['tokP'], focus: ['micro'] },
			{ say: "log('B') runs: the output is A, B. Synchronous code always finishes first, and then the stack is empty.", set: { c: { hl: [3] }, out: { sub: 'A  B' } }, focus: ['stack'] },
			{ say: 'With the stack empty, the event loop runs every microtask before anything else. logP moves to the stack and prints P.', move: { tokP: { x: 283, y: 60 } }, set: { out: { sub: 'A  B  P' } }, focus: ['micro', 'stack'] },
			{ say: 'Meanwhile the 0 ms timer has finished and moved logT into the task queue.', hide: ['tokP'], move: { tokT: { x: 268, y: 232 } }, focus: ['task'] },
			{ say: 'Microtasks are done, so the loop takes the next task: logT runs and prints T.', move: { tokT: { x: 283, y: 60 } }, set: { out: { sub: 'A  B  P  T', tone: 'accent' } }, focus: ['stack'] },
			{ say: 'Order: synchronous code, then microtasks, then timers. That is why setTimeout(fn, 0) runs after a resolved promise.', hide: ['tokT'], show: ['n'] }
		]
	},

	// ───────── promises ─────────
	{
		id: 'js-promise-chain',
		topic: 'javascript',
		group: 'promises',
		title: 'A promise chain and its errors',
		blurb: 'Where does a thrown error go in a .then chain?',
		stage: { w: 360, h: 312 },
		nodes: [
			{ id: 'b1', kind: 'box', x: 70, y: 12, w: 220, h: 38, label: 'Promise.resolve(1)', sub: 'fulfilled with 1' },
			{ id: 'b2', kind: 'box', x: 70, y: 72, w: 220, h: 38, label: '.then(v => v + 1)', sub: 'fulfilled with 2' },
			{ id: 'b3', kind: 'box', x: 70, y: 132, w: 220, h: 38, label: '.then(() => { throw })', sub: 'rejected: boom' },
			{ id: 'b4', kind: 'box', x: 70, y: 192, w: 220, h: 38, label: '.then(logSkipped)', sub: 'skipped' },
			{ id: 'b5', kind: 'box', x: 70, y: 252, w: 220, h: 38, label: '.catch(e => ...)', sub: 'handles the error' },
			{ id: 'e1', kind: 'edge', from: 'b1', to: 'b2' },
			{ id: 'e2', kind: 'edge', from: 'b2', to: 'b3' },
			{ id: 'e3', kind: 'edge', from: 'b3', to: 'b4' },
			{ id: 'e4', kind: 'edge', from: 'b4', to: 'b5' },
			{ id: 'n', kind: 'text', x: 8, y: 308, text: 'Return the promise inside .then, so the chain waits.', w: 340, size: 'sm' }
		],
		steps: [
			{ say: 'A promise chain: every .then returns a new promise. We start with a promise already fulfilled with 1.', show: ['b1'], set: { b1: { tone: 'accent' } } },
			{ say: '.then(v => v + 1): the value the handler returns, 2, becomes the value of the next promise.', show: ['b2', 'e1'], set: { b2: { tone: 'accent' } }, pulse: ['b2'] },
			{ say: 'The next handler throws. A thrown error turns the promise returned by .then into a rejected one.', show: ['b3', 'e2'], set: { b3: { tone: 'neg' } }, pulse: ['b3'] },
			{ say: 'A rejection skips every .then that follows, so this handler never runs.', show: ['b4', 'e3'], pulse: ['b4'] },
			{ say: '.catch receives the error and handles it. If it returns normally, the chain is fulfilled again.', show: ['b5', 'e4'], set: { b5: { tone: 'accent', sub: 'prints: caught boom' } }, pulse: ['b5'] },
			{ say: '.finally would run either way. And always return a promise from inside .then, so the chain waits for it.', show: ['n'], focus: ['n'] }
		]
	},
	{
		id: 'js-promise-combinators',
		topic: 'javascript',
		group: 'promises',
		title: 'all, allSettled, race and any',
		blurb: 'Which combinator fits which question?',
		stage: { w: 360, h: 270 },
		nodes: [
			{ id: 'pa', kind: 'box', x: 8, y: 16, w: 108, h: 38, label: 'A', sub: 'ok at 30 ms' },
			{ id: 'pb', kind: 'box', x: 126, y: 16, w: 108, h: 38, label: 'B', sub: 'fails at 10 ms' },
			{ id: 'pc', kind: 'box', x: 244, y: 16, w: 108, h: 38, label: 'C', sub: 'ok at 20 ms' },
			{
				id: 't', kind: 'table', x: 8, y: 84, title: 'results', colW: 172, cols: ['method', 'result'],
				rows: [['Promise.all', 'rejects: B failed'], ['Promise.allSettled', '3 results, never rejects'], ['Promise.race', 'rejects: B settled first'], ['Promise.any', 'fulfils with C (20 ms)']]
			},
			{ id: 'n', kind: 'text', x: 8, y: 246, text: '', w: 340 }
		],
		steps: [
			{ say: 'Three promises start together: A succeeds at 30 ms, B fails at 10 ms, C succeeds at 20 ms.', show: ['pa', 'pb', 'pc'], set: { pb: { tone: 'neg' } } },
			{ say: 'Promise.all wants every promise to succeed. B fails at 10 ms, so it rejects right away with the error from B.', show: ['t', 'n'], set: { t: { hl: [0] }, n: { text: 'all: all-or-nothing.' } } },
			{ say: 'allSettled waits for all of them and never rejects. You get one status per promise, at 30 ms.', set: { t: { hl: [1] }, n: { text: 'allSettled: report everything.' } } },
			{ say: 'race settles with whichever finishes first, even if that is a failure. B comes first at 10 ms, so it rejects.', set: { t: { hl: [2] }, n: { text: 'race: the first to settle, good or bad (timeouts).' } } },
			{ say: 'any waits for the first success and ignores failures. C is the first success, at 20 ms.', set: { t: { hl: [3] }, n: { text: 'any: the fastest success.' } } },
			{ say: 'Pick by the question you are asking: all for all-or-nothing, allSettled for a full report, race for timeouts, any for the fastest success.', set: { t: { hl: [] } }, focus: ['n'] }
		]
	},

	// ───────── async-await-and-errors ─────────
	{
		id: 'js-async-await-split',
		topic: 'javascript',
		group: 'async-await-and-errors',
		title: 'Where an async function pauses',
		blurb: 'What really happens at an await?',
		stage: { w: 360, h: 290 },
		nodes: [
			{ id: 'c', kind: 'doc', x: 8, y: 8, w: 186, lines: ['async function f() {', "  log('1');", '  await null;', "  log('3');", '}', 'f();', "log('2');"], visible: true },
			{ id: 'stk', kind: 'box', x: 214, y: 8, w: 138, h: 34, label: 'Call stack', visible: true },
			{ id: 'micro', kind: 'box', x: 214, y: 84, w: 138, h: 34, label: 'Microtask queue', visible: true },
			{ id: 'tok', kind: 'token', x: 283, y: 140, label: 'rest of f()', tone: 'accent' },
			{ id: 'out', kind: 'box', x: 8, y: 170, w: 344, h: 40, label: 'Output', sub: '(nothing yet)', visible: true },
			{ id: 'n', kind: 'text', x: 8, y: 252, text: 'await pauses one function, never the whole program.', w: 340, size: 'sm' }
		],
		steps: [
			{ say: 'Calling f() runs it synchronously until the first await. So 1 prints right away.', set: { c: { hl: [5, 1] }, out: { sub: '1' } }, focus: ['stk'] },
			{ say: 'await null does not block anything. f pauses here, and the rest of f is scheduled to run later.', set: { c: { hl: [2] } }, show: ['tok'], focus: ['micro'] },
			{ say: 'f() hands back a pending promise, and the caller carries on with its next line: 2 prints.', set: { c: { hl: [6] }, out: { sub: '1  2' } }, focus: ['stk'] },
			{ say: 'The caller is finished and the stack is empty, so the microtask runs. f resumes after the await: 3 prints.', set: { c: { hl: [3] }, out: { sub: '1  2  3', tone: 'accent' } }, move: { tok: { x: 283, y: 60 } }, focus: ['stk'] },
			{ say: 'await is a pause point for that one function. Everything after it behaves like a .then callback.', hide: ['tok'], show: ['n'], focus: ['c'] }
		]
	},
	{
		id: 'js-await-parallel',
		topic: 'javascript',
		group: 'async-await-and-errors',
		title: 'Sequential awaits vs Promise.all',
		blurb: 'Why can two awaits in a row take twice as long?',
		stage: { w: 360, h: 280 },
		nodes: [
			{ id: 'z0', kind: 'text', x: 14, y: 34, text: '0 ms', size: 'sm', visible: true },
			{ id: 'z1', kind: 'text', x: 134, y: 34, text: '100', size: 'sm', visible: true },
			{ id: 'z2', kind: 'text', x: 254, y: 34, text: '200 ms', size: 'sm', visible: true },
			{ id: 'l1', kind: 'text', x: 8, y: 62, text: 'await a(); await b();', w: 340, size: 'sm' },
			{ id: 'a1', kind: 'box', x: 14, y: 70, w: 120, h: 28, label: 'a: 100 ms', shape: 'pill' },
			{ id: 'b1', kind: 'box', x: 134, y: 70, w: 120, h: 28, label: 'b: 100 ms', shape: 'pill' },
			{ id: 't1', kind: 'text', x: 262, y: 90, text: 'total 200 ms', w: 90, tone: 'warn' },
			{ id: 'l2', kind: 'text', x: 8, y: 142, text: 'await Promise.all([a(), b()])', w: 340, size: 'sm' },
			{ id: 'a2', kind: 'box', x: 14, y: 150, w: 120, h: 28, label: 'a: 100 ms', shape: 'pill' },
			{ id: 'b2', kind: 'box', x: 14, y: 186, w: 120, h: 28, label: 'b: 100 ms', shape: 'pill' },
			{ id: 't2', kind: 'text', x: 150, y: 176, text: 'total 100 ms', w: 100, tone: 'accent' },
			{ id: 'n', kind: 'text', x: 8, y: 252, text: '', w: 340 }
		],
		steps: [
			{ say: 'Two independent operations, each taking 100 ms. How you await them changes the total time.', focus: ['z0', 'z1', 'z2'] },
			{ say: 'Awaiting one after the other: b does not even start until a has finished.', show: ['l1', 'a1'], pulse: ['a1'] },
			{ say: 'The times add up. The function is paused, not blocked, but the work still happens in sequence: 200 ms.', show: ['b1', 't1'], pulse: ['b1'] },
			{ say: 'Start both first, then wait. The two timers now run side by side.', show: ['l2', 'a2', 'b2'], pulse: ['a2', 'b2'] },
			{ say: 'Promise.all resolves when the slower one finishes: about 100 ms. Same result, half the time.', show: ['t2'], pulse: ['t2'] },
			{ say: 'forEach(async ...) is the opposite trap: it starts everything but never waits. Use for...of with await, or Promise.all(items.map(...)).', show: ['n'], set: { n: { text: 'forEach ignores the promises its callbacks return.' } }, focus: ['n'] }
		]
	},

	// ───────── modules ─────────
	{
		id: 'js-esm-live-binding',
		topic: 'javascript',
		group: 'modules',
		title: 'Live bindings vs copies',
		blurb: 'What changes when the exporting module changes a variable?',
		stage: { w: 360, h: 270 },
		nodes: [
			{ id: 'mod', kind: 'box', x: 8, y: 118, w: 124, h: 52, label: 'counter.js', sub: 'count = 0' },
			{ id: 'esm', kind: 'box', x: 228, y: 36, w: 124, h: 52, label: 'import { count }', sub: 'live binding' },
			{ id: 'cjs', kind: 'box', x: 228, y: 200, w: 124, h: 52, label: 'require()', sub: 'copy of 0' },
			{ id: 'eE', kind: 'edge', from: 'esm', to: 'mod', label: 'reads' },
			{ id: 'eC', kind: 'edge', from: 'cjs', to: 'mod', label: 'copied once', dashed: true },
			{ id: 'n', kind: 'text', x: 8, y: 222, text: 'Namespace destructuring copies too: read ns.count to stay live.', w: 210, size: 'sm' }
		],
		steps: [
			{ say: 'counter.js exports a variable count, starting at 0, and a function inc that adds one.', show: ['mod'] },
			{ say: 'With ES modules, import { count } does not copy anything. It binds to the exporting module\'s own variable, like a window onto it.', show: ['esm', 'eE'], focus: ['eE'] },
			{ say: 'With CommonJS, require() returns module.exports as it was at that moment. A primitive such as count is copied.', show: ['cjs', 'eC'], focus: ['eC'] },
			{ say: 'Now inc() runs inside counter.js, and count becomes 1.', set: { mod: { sub: 'count = 1', tone: 'accent' } }, pulse: ['mod'] },
			{ say: 'The ES import sees 1, because it reads the live variable. The CommonJS copy is still 0.', set: { esm: { sub: 'count is 1', tone: 'accent' }, cjs: { sub: 'still 0', tone: 'warn' } }, pulse: ['esm', 'cjs'] },
			{ say: 'Destructuring a namespace, const { count } = await import(url), also copies the value. Read ns.count to stay live. You cannot assign to an import either.', show: ['n'], focus: ['n'] }
		]
	},

	// ───────── iterators-and-generators ─────────
	{
		id: 'js-generator',
		topic: 'javascript',
		group: 'iterators-and-generators',
		title: 'A generator pauses and resumes',
		blurb: 'How can a function stop in the middle and carry on later?',
		stage: { w: 360, h: 230 },
		nodes: [
			{ id: 'c', kind: 'doc', x: 8, y: 8, w: 176, lines: ['function* nums() {', '  yield 1;', '  yield 2;', '  return 3;', '}', 'const it = nums();'], visible: true },
			{ id: 'gen', kind: 'box', x: 206, y: 16, w: 146, h: 50, label: 'generator object', sub: 'paused at the start' },
			{ id: 'res', kind: 'box', x: 206, y: 96, w: 146, h: 58, label: '{ value: 1, done: false }', sub: 'last next() result' },
			{ id: 'n', kind: 'text', x: 8, y: 196, text: 'Nothing is computed until next() asks for it.', w: 340, size: 'sm' }
		],
		steps: [
			{ say: 'Calling nums() does not run the body. It only creates a generator object, paused at the very start.', set: { c: { hl: [5] } }, show: ['gen'] },
			{ say: 'it.next() runs until the first yield, hands out 1 and pauses right there. The result is { value: 1, done: false }.', set: { c: { hl: [1] }, gen: { sub: 'paused at yield 1', tone: 'accent' } }, show: ['res'], pulse: ['res'] },
			{ say: 'The next it.next() resumes right after that yield and runs to the following one: 2.', set: { c: { hl: [2] }, gen: { sub: 'paused at yield 2' }, res: { label: '{ value: 2, done: false }' } }, pulse: ['res'] },
			{ say: 'The next call reaches return 3. The generator finishes and reports { value: 3, done: true }.', set: { c: { hl: [3] }, gen: { sub: 'finished', tone: 'neutral' }, res: { label: '{ value: 3, done: true }', tone: 'accent' } }, pulse: ['res'] },
			{ say: 'After that, every next() gives { value: undefined, done: true }. A finished generator cannot be restarted.', set: { res: { label: '{ value: undefined, done: true }', tone: 'neutral' } } },
			{ say: 'Generators are lazy: values are produced only when asked for, which makes endless sequences possible.', show: ['n'], focus: ['n'] }
		]
	},

	// ───────── modern-features ─────────
	{
		id: 'js-nullish-vs-or',
		topic: 'javascript',
		group: 'modern-features',
		title: '|| vs ?? and optional chaining',
		blurb: 'When does a default value replace a real 0?',
		stage: { w: 360, h: 260 },
		nodes: [
			{
				id: 't', kind: 'table', x: 8, y: 14, colW: 170, visible: true, cols: ['expression', 'result'],
				rows: [["0 || 'default'", "'default'"], ["0 ?? 'default'", '0'], ["'' || 'x'", "'x'"], ["'' ?? 'x'", "''"], ['null ?? 1', '1'], ['user?.address?.city', 'undefined']]
			},
			{ id: 'n', kind: 'text', x: 8, y: 214, text: '', w: 340 }
		],
		steps: [
			{ say: '|| replaces any falsy value: 0, an empty string, false, NaN, null and undefined. Handy, but risky for numbers.', show: ['n'], set: { t: { hl: [0, 2] }, n: { text: 'A deliberate 0 or "" is thrown away by ||.' } } },
			{ say: '?? replaces only null and undefined, so a real 0 or an empty string survives.', set: { t: { hl: [1, 3, 4] }, n: { text: '?? only fills in when the value is missing.' } } },
			{ say: 'A typical bug: retries = settings.retries || 3 turns a deliberate 0 into 3. Use ?? there.', set: { t: { hl: [0, 1] }, n: { text: 'settings.retries ?? 3 keeps a 0.' } } },
			{ say: 'Optional chaining, ?., stops at the first null or undefined and returns undefined instead of throwing.', set: { t: { hl: [5] }, n: { text: 'user?.address?.city never throws on a missing part.' } } },
			{ say: 'Combine them: user?.address?.city ?? "unknown" reads a deep value safely and supplies a default only when it is missing.', set: { t: { hl: [] }, n: { text: 'user?.address?.city ?? "unknown"' } }, focus: ['n'] }
		]
	}
];
