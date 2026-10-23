import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

// JavaScript quiz bank (current ECMAScript semantics). One builder per topic; ids are re-assigned positionally at the bottom.
// Every question that has `code` was run in Node (V8) and Bun (JavaScriptCore) and the marked answer is the real output.
const t = (topic: string) => builder('JS', topic);

// ───────────────────────── values-and-types ─────────────────────────
const vt = t('values-and-types');

vt.add('basic', 'references',
	'What does this code log?',
	'2 true',
	['1 true', '2 false', '1 false'],
	'a and b hold the same reference, so there is only one object. Setting b.n changes that object, and a.n sees the change; a === b compares the references and they are identical. Getting 1 would need a real copy such as { ...a }, and false would need two separate objects.',
	'const a = { n: 1 };\nconst b = a;\nb.n = 2;\nconsole.log(a.n, a === b);');

vt.add('basic', 'typeof',
	'What does typeof null evaluate to?',
	"'object', a long-standing quirk that cannot be fixed without breaking sites",
	["'null', because null is its own type", "'undefined', because null means there is no value", "'primitive', which is what typeof reports for every value that is not an object, null included"],
	"typeof null is 'object'. It is a historical bug that was kept for compatibility. null is a primitive, and typeof never returns 'null' or 'primitive'. Test for null directly with value === null.");

vt.add('basic', 'const',
	'What does declaring a variable with const guarantee?',
	'The variable cannot be re-assigned, but an object it points to can still be changed',
	['The value is frozen, so pushing to a const array throws',
	 'The variable is not hoisted at all, so it can be read before its line without any error being thrown',
	 'The value must be a primitive such as a number or a string'],
	'const makes the binding constant, not the value. const list = []; list.push(1) works because the array itself is mutable. const variables are hoisted into the temporal dead zone like let, so reading one early throws. Objects and arrays are allowed; use Object.freeze if you want to block changes (shallowly).');

vt.add('mid', 'floats',
	'Why does 0.1 + 0.2 === 0.3 evaluate to false?',
	'Numbers are binary 64-bit floats, and neither 0.1 nor 0.2 has an exact binary form',
	['The + operator rounds decimal results toward zero',
	 'Decimals are stored as strings and compared by length',
	 'The literal 0.3 is stored as a BigInt while the sum is a Number, so the two types differ and === fails'],
	'Like most languages, JavaScript uses IEEE 754 doubles. 0.1 and 0.2 cannot be written exactly in binary, so their sum is 0.30000000000000004. Compare with a tolerance (Math.abs(a - b) < Number.EPSILON), or work in whole cents.');

vt.add('mid', 'undefined-null',
	'Which description of undefined and null is accurate?',
	'undefined means nothing was assigned; null is a value you set on purpose to mean empty',
	['They are interchangeable, because undefined === null is true',
	 'null is the value you get when you read a variable that was never declared in the scope',
	 'undefined is an object and null is a primitive'],
	'A declared variable with no value, a missing property and a function with no return all give undefined. null is something you assign deliberately. undefined === null is false (only undefined == null is true), reading an undeclared name throws a ReferenceError, and both are primitives.');

vt.add('advanced', 'bigint',
	'What does 1n + 1 do?',
	'It throws a TypeError, since BigInt and Number cannot be mixed without a conversion',
	['It evaluates to 2n, because the Number 1 is silently converted to a BigInt first and then added', 'It evaluates to 2', 'It evaluates to NaN'],
	'JavaScript refuses to mix BigInt and Number implicitly, because a silent choice would lose precision or range. You must convert one side, for example 1n + BigInt(1) or Number(1n) + 1. Comparisons such as 1n < 2 are allowed; only arithmetic mixes throw.');

// ───────────────────────── equality-and-coercion ─────────────────────────
const eq = t('equality-and-coercion');

eq.add('basic', 'strict',
	'What is the main difference between == and ===?',
	'== converts the operands to a common type first; === compares without any conversion',
	['=== also compares the contents of objects field by field, while == compares only their references',
	 '== is faster and === is the older operator kept for compatibility',
	 '=== throws a TypeError when the types differ, while == never does'],
	'=== (strict equality) returns false immediately if the types differ. == (loose equality) applies coercion rules first, which is why 0 == "" is true. Neither compares object contents: two different objects are never equal under either operator, and neither throws on a type mismatch.');

eq.add('basic', 'truthy',
	'Which one of these values is truthy?',
	"'0', a non-empty string",
	['0', "'' (the empty string)", 'NaN, the value of a failed numeric conversion'],
	"Only a short list of values is falsy: false, 0, -0, 0n, '', null, undefined and NaN. Any non-empty string counts as truthy, including '0' and 'false'. Arrays and objects (even empty ones) are truthy too.");

eq.add('basic', 'plus',
	'What does this code print?',
	'51',
	['6', 'NaN', '531'],
	"Evaluation goes left to right. '5' + 3 contains a string, so + concatenates and gives '53'. Then '53' - 2 uses -, which always converts to numbers, so the result is 51. The answer 6 would need numbers all the way through, and NaN would need a value that cannot be converted.",
	"console.log('5' + 3 - 2);");

eq.add('basic', 'coercion',
	'What does this code print?',
	"['12', 12, 2, true]",
	["[3, 12, 2, false]", "['12', '12', 2, true]", "['12', 12, '1true', false]"],
	"1 + '2' concatenates to the string '12'. '3' * '4' multiplies numbers, so 12 (a number). true + 1 converts true to 1, giving 2. [] == 0 is true: the empty array becomes the empty string, which becomes 0. Only + prefers concatenation when a string is involved.",
	"console.log([1 + '2', '3' * '4', true + 1, [] == 0]);");

eq.add('mid', 'nan',
	'What does this code print?',
	'false true true -1',
	['true true true 0', 'false true false -1', 'false false true -1'],
	'NaN is not equal to itself under === (and ==), but Object.is treats NaN as the same value as NaN. Array includes uses the SameValueZero algorithm, so it finds NaN, while indexOf uses strict equality and returns -1.',
	'console.log(NaN === NaN, Object.is(NaN, NaN), [NaN].includes(NaN), [NaN].indexOf(NaN));');

eq.add('advanced', 'relational',
	'What does this code print?',
	'true false false true',
	['true false true true', 'false false false false', 'true true false true'],
	'null == undefined is true by a special rule, and === is false because the types differ. null == 0 is false: loose equality never converts null to a number. But the relational operators (>=, <=, >, <) do convert null to 0, so null >= 0 is true, even though null == 0 is false.',
	'console.log(null == undefined, null === undefined, null == 0, null >= 0);');

// ───────────────────────── scope-and-hoisting ─────────────────────────
const sc = t('scope-and-hoisting');

sc.add('basic', 'hoisting',
	'What does this code print?',
	'function undefined',
	['function function', 'undefined undefined', 'It throws a ReferenceError before logging anything'],
	'The declaration f is hoisted with its body, so typeof f is function. g is a var holding a function expression: the name g is hoisted but is undefined until the assignment line runs, so typeof g is undefined. Nothing throws, because typeof never throws for a hoisted var.',
	'console.log(typeof f, typeof g);\nfunction f() {}\nvar g = function () {};');

sc.add('basic', 'block-scope',
	'What does this code print?',
	'undefined number',
	['number number', 'number undefined', 'undefined undefined'],
	'let is block-scoped, so a does not exist outside the braces and typeof a is undefined (no error for an undeclared name). var ignores blocks and is scoped to the function or script, so b is still visible there and holds 2.',
	'{\n  let a = 1;\n  var b = 2;\n}\nconsole.log(typeof a, typeof b);');

sc.add('basic', 'tdz',
	'What happens when code reads a let variable before the line that declares it?',
	'A ReferenceError is thrown, because the variable is in its temporal dead zone',
	['It reads undefined, just like var does', 'It reads null until the declaration runs', 'It silently creates a new global variable with that name and assigns undefined to it'],
	'let and const names are hoisted but stay uninitialised until their declaration runs. Any access in that gap, the temporal dead zone, throws a ReferenceError. Only var starts as undefined, and strict mode and modules never create implicit globals.');

sc.add('basic', 'function-hoisting',
	'Why can you call a function declaration above its definition, but not a function stored in a const?',
	'A declaration is hoisted with its body, but a const is hoisted uninitialised until its line runs',
	['const functions are compiled lazily, so they do not exist yet',
	 'Bundlers copy every function declaration to the top of the file, and they skip function expressions',
	 'Only the first function in a file is hoisted'],
	'Function declarations are initialised with their body when the scope is created, so they are callable from the first line. const f = () => {} is a variable declaration: it sits in the temporal dead zone until the assignment, so calling it earlier throws a ReferenceError. This is language behaviour, not a bundler step.');

sc.add('mid', 'shadowing',
	'What does this code print?',
	'undefined',
	["'outer'", "'inner'", 'It throws a ReferenceError'],
	"The var x inside show() is hoisted to the top of that function, so it shadows the outer x for the whole function body. At the console.log line it exists but has not been assigned yet, so it is undefined. The outer value is never reached.",
	"var x = 'outer';\nfunction show() {\n  console.log(x);\n  var x = 'inner';\n}\nshow();");

sc.add('advanced', 'typeof-tdz',
	'What does typeof x do when x is a let variable that is still in its temporal dead zone?',
	'It throws a ReferenceError, unlike typeof on a name that was never declared',
	["It returns 'undefined', because typeof is defined never to throw for any identifier at all", "It returns 'object', because the binding exists but is empty", "It returns 'uninitialized'"],
	"typeof is only safe for names that were never declared. A let or const binding in its TDZ does exist, and touching it in any way, including through typeof, throws. That is one of the reasons to declare variables before using them.");

// ───────────────────────── closures ─────────────────────────
const cl = t('closures');

cl.add('basic', 'definition',
	'What exactly is a closure in JavaScript?',
	'A function together with access to the variables of the scope where it was created',
	['A function that is cut off from the outside world and cannot read any variable declared outside itself',
	 'A function declared inside a loop',
	 'Any function that returns another function'],
	'A closure is not a special syntax: every function that refers to variables from an enclosing scope forms one. It remembers that scope even after the outer function has finished. Returning a function is a common way to use closures, but not a requirement, and being in a loop is irrelevant.');

cl.add('basic', 'loop-var',
	'What does this code print?',
	'[3, 3, 3]',
	['[0, 1, 2]', '[undefined, undefined, undefined]', '[2, 2, 2]'],
	'var has one binding for the whole loop, shared by all three arrow functions. They run after the loop has finished, when i is 3 (the value that failed the i < 3 test), so each returns 3. Closures capture variables, not the values they had when they were created.',
	'const fns = [];\nfor (var i = 0; i < 3; i++) fns.push(() => i);\nconsole.log(fns.map(f => f()));');

cl.add('mid', 'let-loop',
	'Why does changing var to let in a for loop header fix the classic callback-in-a-loop bug?',
	'let creates a fresh binding for each iteration, so every callback captures its own i',
	['let makes the callbacks run synchronously inside the loop',
	 'let copies the loop variable into a global array',
	 'let freezes the loop variable permanently, so i can never change again once the loop has started'],
	'With let, the loop creates a new i for every iteration and copies the value forward before the increment. Each closure therefore sees a different variable. Nothing becomes synchronous, no global is involved, and i can still change inside its own iteration.');

cl.add('mid', 'private-state',
	'What does this code print?',
	'2 0',
	['2 2', '0 0', '2 undefined'],
	'Each call to outer creates its own scope with its own count. c.inc() twice raises c\'s count to 2, so c.get() is 2. The expression outer().get() creates a brand new scope whose count starts at 0. The closures share state with their own scope only.',
	'function outer() {\n  let count = 0;\n  return { inc: () => ++count, get: () => count };\n}\nconst c = outer();\nc.inc();\nc.inc();\nconsole.log(c.get(), outer().get());');

cl.add('mid', 'capture-variable',
	'What does this code print?',
	'2',
	['1', 'undefined', 'It throws a ReferenceError'],
	'The arrow function captured the variable x, not the value 1. When show() runs, it reads x as it is at that moment, and x was changed to 2 before the call. This is why closures see updates made after they were created.',
	'let x = 1;\nconst show = () => x;\nx = 2;\nconsole.log(show());');

cl.add('advanced', 'let-iteration',
	'What does this code print?',
	'1 then 3 (two lines)',
	['0 then 1 then 2 (three lines)', '0 then 2 (two lines)', '3 then 3 (two lines)'],
	'Each iteration has its own i. The callback captures that iteration\'s i, and then i++ inside the body changes it (0 becomes 1, so that callback logs 1 later). At the end of the iteration the value is copied to the next iteration\'s i and incremented: 1 becomes 2, which passes the test, so the body runs again, callback captures i, i++ makes it 3, and that callback logs 3. The next copy is 4, which ends the loop.',
	'for (let i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n  i++;\n}');

// ───────────────────────── this-binding ─────────────────────────
const th = t('this-binding');

th.add('basic', 'call-site',
	'What decides the value of this inside an ordinary (non-arrow) function?',
	'How the function is called',
	['Where the function is defined in the file', 'The name of the function', 'The module that exports the function'],
	'this is determined at the call: obj.f() uses obj, new f() uses a new object, f.call(x) uses x, and a plain f() uses undefined in strict code or the global object in sloppy code. Where the function is written only matters for arrow functions, which take this from their surrounding scope.');

th.add('mid', 'lost-this',
	'What does this code print?',
	'a undefined',
	['a a', 'undefined undefined', 'It throws a TypeError on the second call'],
	'o.f() has o in front of the call, so this is o and it returns "a". g is the same function pulled out of the object. Calling g() has no object in front, so this is undefined (strict mode) or the global object (sloppy mode), and neither has a property n, so it returns undefined. Optional chaining (this?.n) is what keeps the strict-mode call from throwing.',
	"const o = { n: 'a', f() { return this?.n; } };\nconst g = o.f;\nconsole.log(o.f(), g());");

th.add('mid', 'bind',
	'What does this code print?',
	'A',
	['B', 'undefined', 'It throws a TypeError'],
	'bind returns a new function whose this is permanently fixed to the object it was given. A later call() or apply() cannot override a bound this, so the call with { name: "B" } is ignored and the function still sees { name: "A" }.',
	"function who() { return this.name; }\nconst bound = who.bind({ name: 'A' });\nconsole.log(bound.call({ name: 'B' }));");

th.add('mid', 'arrow',
	'What is this inside an arrow function?',
	'The this of the scope where the arrow was written; call, apply and bind cannot change it',
	['Always the global object', 'The object the arrow function is called on, exactly like a method defined with function, so obj.arrow() sees obj', 'Always undefined'],
	'Arrow functions do not have their own this. They look it up in the enclosing scope, exactly like an ordinary variable. That is why they work well as callbacks inside methods, and also why using one as an object method does not give you the object.');

th.add('advanced', 'new',
	'What does the new operator do with this when you write new Foo()?',
	'It creates a new object linked to Foo.prototype and runs Foo with this set to that object',
	['It runs Foo with this set to the global object, then copies the properties it created onto a new object', 'It returns Foo.prototype itself', 'It runs Foo with this set to undefined and returns whatever Foo returns'],
	'new creates an empty object whose prototype is Foo.prototype, calls Foo with this set to it, and returns that object (unless Foo returns a different object). Properties assigned with this.x inside Foo therefore end up on the new instance, and methods on Foo.prototype are shared by all instances.');

th.add('advanced', 'strict-this',
	'In strict mode (for example inside a class method), what is this in a plain function call f() with nothing in front of it?',
	'undefined',
	['The global object', 'The function f itself', 'The object that was created most recently'],
	'Strict mode removes the fallback to the global object, so a call with no receiver gets undefined. Class bodies and ES modules are always strict. In sloppy mode the same call would receive the global object, which is a classic source of accidental globals.');

// ───────────────────────── prototypes-and-classes ─────────────────────────
const pr = t('prototypes-and-classes');

pr.add('basic', 'chain',
	'When you read obj.x and obj has no own property called x, what does JavaScript do?',
	'It follows the prototype links, checking each object in turn, until it finds x or reaches null',
	['It returns undefined immediately', 'It throws a ReferenceError', 'It searches every other object in the running program, in creation order, for a property called x'],
	'Property lookup walks the prototype chain: own properties first, then each prototype in turn. If the chain ends at null without finding the name, the result is undefined (and calling it throws a TypeError). It never scans unrelated objects, and a missing property is not a ReferenceError.');

pr.add('mid', 'has-own',
	'What does this code print?',
	'hi x false true',
	['hi x true true', 'hi undefined false true', 'hi x false false'],
	'obj gets greet through its prototype base, so obj.greet() works, with this being obj. Object.hasOwn checks own properties only, and greet is not one (false), while the in operator also walks the prototype chain (true).',
	"const base = { greet() { return 'hi ' + this.n; } };\nconst obj = Object.create(base);\nobj.n = 'x';\nconsole.log(obj.greet(), Object.hasOwn(obj, 'greet'), 'greet' in obj);");

pr.add('mid', 'class-fields',
	'What does this code print?',
	'true false function',
	['true true function', 'It throws, because hasOwnProperty is not available on class instances', 'true false object'],
	'this.v = 1 in the constructor creates an own property on each instance, so hasOwnProperty("v") is true. The method m is defined once on A.prototype, so it is inherited, not own (false). A class is still a function underneath, so typeof A is "function".',
	"class A {\n  constructor() { this.v = 1; }\n  m() {}\n}\nconst a = new A();\nconsole.log(a.hasOwnProperty('v'), a.hasOwnProperty('m'), typeof A);");

pr.add('mid', 'class-methods',
	'Where do methods written in a class body live?',
	'On Class.prototype, shared by every instance',
	['Copied onto each instance when it is created', 'On Object.prototype so all objects can use them', 'Only on the constructor function, as static members'],
	'Methods are defined once on the prototype object, and instances find them through the prototype chain. That makes them cheap and lets subclasses override them. Only methods marked static live on the class itself, and class fields (including arrow-function fields) are the ones created per instance.');

pr.add('mid', 'prototype-write',
	'A prototype has a data property x. What happens when you assign obj.x = 5 on an object that inherits from it?',
	'It creates an own property x on obj and leaves the prototype unchanged',
	['It changes x on the prototype itself, so every object inheriting from it now sees 5', 'It throws a TypeError because the property is inherited', 'It does nothing until you delete the prototype property first'],
	'Assignment never writes through to the prototype for a plain data property: it adds or updates an own property on the object (shadowing the inherited one). The exceptions are an inherited setter, which runs, and a read-only inherited property, which blocks the write (silently in sloppy mode, with a TypeError in strict mode).');

pr.add('advanced', 'private-fields',
	'What does the # in a class member such as #count mean?',
	'A private field that code outside the class body cannot access, enforced by the language',
	['It is only a naming convention that tools may warn about', 'It makes the field accessible to subclasses but not to outside code', 'It makes the field non-enumerable, so loops skip it, but it is still readable as obj["#count"]'],
	'#names are real private fields: reading them from outside the class body is a syntax error, and even subclasses cannot see them. They do not appear as ordinary properties, so obj["#count"] is just an unrelated string key. A leading underscore (_count) is the convention-only approach.');

// ───────────────────────── array-methods ─────────────────────────
const ar = t('array-methods');

ar.add('basic', 'map',
	'Which array method returns a new array of the same length, with every item transformed by a function?',
	'map',
	['filter', 'reduce', 'forEach'],
	'map calls your function on every item and collects the return values into a new array of the same length. filter returns a (possibly shorter) subset, reduce folds the array into one value, and forEach returns undefined: it is only for side effects.');

ar.add('basic', 'default-sort',
	'What does this code print?',
	'[1, 10, 9]',
	['[1, 9, 10]', '[10, 9, 1]', 'It throws a TypeError, because sort needs a comparator function for numbers'],
	'sort() with no comparator converts the items to strings and orders them by UTF-16 code units. As text, "1" < "10" < "9", so the result is [1, 10, 9]. Pass (a, b) => a - b to sort numbers by value.',
	'console.log([10, 9, 1].sort());');

ar.add('mid', 'parseint-map',
	'What does this code print?',
	"['1', '2', '3'] and [1, NaN, NaN]",
	["['1', '2', '3'] and [1, 2, 3], because parseInt ignores the index", '[1, 2, 3] and [1, 2, 3]', "['1', '2', '3'] and [1, NaN, 3]"],
	'map passes three arguments: item, index and array. String ignores the extras and gives the strings. parseInt takes the index as its radix (second argument), so it runs parseInt("1", 0) = 1 (radix 0 means 10), parseInt("2", 1) = NaN (no radix 1) and parseInt("3", 2) = NaN (3 is not a binary digit).',
	"console.log([1, 2, 3].map(String), ['1', '2', '3'].map(parseInt));");

ar.add('mid', 'mutating',
	'Which of these array methods changes the original array in place?',
	'reverse()',
	['map()', 'slice()', 'toSorted()'],
	'reverse() reorders the array itself and returns it. map() and slice() return new arrays, and toSorted() (ES2023) is the copying version of sort(). Others that mutate: push, pop, shift, unshift, splice, sort and fill.');

ar.add('advanced', 'reduce-empty',
	'What happens when reduce is called on an empty array without an initial value?',
	'It throws a TypeError',
	['It returns undefined', 'It returns 0', 'It returns the empty array'],
	'With no initial value, reduce uses the first item as the accumulator, and an empty array has none, so it throws a TypeError ("Reduce of empty array with no initial value"). Always pass an initial value (reduce(fn, 0)) unless you know the array is non-empty.');

// ───────────────────────── objects-and-copying ─────────────────────────
const ob = t('objects-and-copying');

ob.add('basic', 'shallow',
	'What does this code print?',
	'2',
	['1', 'undefined', 'It throws a TypeError'],
	'The spread copy b is a new top-level object, but b.n holds the same reference as a.n, so both names reach one nested object. Changing b.n.v changes it for a as well. Spread, Object.assign and slice make shallow copies; only the first level is new.',
	'const a = { n: { v: 1 } };\nconst b = { ...a };\nb.n.v = 2;\nconsole.log(a.n.v);');

ob.add('basic', 'default-values',
	'What does this code print?',
	'1 5 null',
	['1 5 7', '1 undefined null', '1 5 undefined'],
	'A destructuring default applies only when the value is undefined. y is undefined, so it becomes 5. z is null, which is a real value, so the default 7 is ignored and z stays null.',
	'const { x, y = 5, z = 7 } = { x: 1, y: undefined, z: null };\nconsole.log(x, y, z);');

ob.add('mid', 'structured-clone',
	'Which statement about structuredClone is true?',
	'It deep-copies nested data, including Date, Map and Set, but throws for functions',
	['It copies functions and class methods too', 'It makes a shallow copy, like object spread', 'It keeps the prototype chain, so a cloned class instance is still an instance of its class and keeps its methods'],
	'structuredClone copies the whole graph, including dates, maps, sets, typed arrays and cyclic references. It cannot clone functions (it throws), and it drops prototypes, so a class instance comes back as a plain object with its data only.');

ob.add('mid', 'json-clone',
	'What does JSON.parse(JSON.stringify(value)) lose as a way to deep-copy?',
	'Dates become strings, and undefined, functions, Map and Set do not survive',
	['Nothing at all: it is the most complete way to copy any JavaScript value, and it handles every type', 'Nested arrays are flattened into a single level', 'Numbers are converted to strings'],
	'JSON has no Date, Map, Set, undefined or function types. Dates turn into ISO strings, undefined values and functions are dropped (or become null inside arrays), and Map and Set become empty objects. Arrays keep their structure and numbers stay numbers. Prefer structuredClone.');

ob.add('advanced', 'freeze',
	'Given const o = Object.freeze({ a: { b: 1 } }), what happens on o.a.b = 2?',
	'It works, because freeze is shallow and the nested object is still writable',
	['It throws a TypeError in every mode, because the whole object graph is frozen', 'It is ignored, because freeze locks every nested level', 'It creates a new frozen copy of o'],
	'Object.freeze locks only the properties of the object you pass in: you cannot add, remove or reassign o.a. The object o.a points to is a separate object and is not frozen, so o.a.b = 2 succeeds. For deep immutability, freeze recursively or use immutable data libraries.');

// ───────────────────────── event-loop ─────────────────────────
const ev = t('event-loop');

ev.add('basic', 'order',
	'In what order are the numbers logged?',
	'1, 4, 3, 2',
	['1, 2, 3, 4', '1, 4, 2, 3', '4, 3, 2, 1'],
	'Synchronous code runs first: 1 and 4. Then the microtask queue runs: the promise callback logs 3. The setTimeout callback is a task, so it waits until the microtasks are done and logs 2 last, even with a delay of 0.',
	'console.log(1);\nsetTimeout(() => console.log(2), 0);\nPromise.resolve().then(() => console.log(3));\nconsole.log(4);');

ev.add('basic', 'single-thread',
	'Why does a long synchronous while loop freeze a web page?',
	'JavaScript runs on one thread, so timers, clicks and rendering cannot run until the loop ends',
	['The browser pauses every other tab until the loop finishes', 'Loops are always run in the microtask queue, which blocks the task queue', 'JavaScript copies the page state on every iteration'],
	'Your code and the event handlers share one thread and run to completion. While a loop is running, the event loop cannot pick up any other task, so the page cannot respond or repaint. The fix is to split the work into chunks, or move it to a Web Worker.');

ev.add('mid', 'microtask-queue',
	'Which queue does a promise .then callback go to, and when does it run?',
	'The microtask queue, right after the current script or task, before the next timer',
	['The task queue, in the same order as setTimeout callbacks', 'A separate thread, so it runs in parallel with your code', 'The rendering queue, once per animation frame'],
	'Promise reactions (and await continuations) are microtasks. After each task finishes, the engine drains the whole microtask queue before it takes the next task or renders. That is why a resolved promise callback runs before a setTimeout(fn, 0) callback. Nothing runs in parallel on the main thread.');

ev.add('mid', 'queue-order',
	'In what order does this print?',
	'E, B, D, C, A',
	['E, A, B, D, C', 'A, E, B, C, D', 'E, B, C, D, A'],
	'E is synchronous. Then microtasks run in the order they were queued: B (the first .then) and D (queueMicrotask). B returns, which queues C at the back, after D, so the order is B, D, C. The setTimeout task A runs only after the microtask queue is empty.',
	"setTimeout(() => console.log('A'), 0);\nPromise.resolve()\n  .then(() => console.log('B'))\n  .then(() => console.log('C'));\nqueueMicrotask(() => console.log('D'));\nconsole.log('E');");

ev.add('mid', 'await-order',
	'What does this code print?',
	'0, 1, 3, 2',
	['0, 1, 2, 3', '1, 0, 3, 2', '0, 3, 1, 2'],
	'0 logs first. Calling f() runs it synchronously up to the first await, so 1 logs. await pauses f and schedules the rest as a microtask, so control returns to the caller and 3 logs. Once the stack is empty the microtask runs and 2 logs.',
	'async function f() {\n  console.log(1);\n  await null;\n  console.log(2);\n}\nconsole.log(0);\nf();\nconsole.log(3);');

ev.add('advanced', 'starvation',
	'What happens if a microtask keeps scheduling another microtask forever?',
	'The microtask queue never empties, so timers, events and rendering are starved and the page freezes',
	['The engine switches to the task queue after 1000 microtasks', 'Only the microtask chain slows down; timers still fire on time', 'The engine throws a RangeError and clears the queue'],
	'The loop drains the microtask queue completely before moving on, including microtasks added while draining. An endless chain therefore blocks everything else, just like an infinite synchronous loop. There is no built-in limit that interrupts it.');

ev.add('advanced', 'mixed-order',
	'In what order does this log?',
	'sync, micro, after await, macro',
	['sync, macro, micro, after await', 'sync, after await, micro, macro', 'micro, sync, after await, macro'],
	'sync runs immediately. The promise callback was queued first, then the async function reached await, which queued its continuation second, so micro runs before after await. The setTimeout callback is a task and runs after all microtasks.',
	"Promise.resolve().then(() => console.log('micro'));\nsetTimeout(() => console.log('macro'), 0);\n(async () => {\n  await 0;\n  console.log('after await');\n})();\nconsole.log('sync');");

// ───────────────────────── promises ─────────────────────────
const pm = t('promises');

pm.add('basic', 'executor',
	'What does this code print?',
	'a, b, 1 (on separate lines)',
	['a, 1, b', 'a, b, then nothing, because the promise is rejected last', 'a, b, 1, then an unhandled rejection error'],
	'The executor passed to new Promise runs synchronously, so a and b print first. A promise can settle only once: res(1) fulfils it, and the later rej(...) is ignored (no error either). The .then callback runs as a microtask, after the synchronous code, and logs 1.',
	"new Promise((res, rej) => {\n  console.log('a');\n  res(1);\n  rej(new Error('late'));\n  console.log('b');\n}).then(v => console.log(v));");

pm.add('mid', 'chain',
	'What does this code print?',
	'1, 2, c, 10 (on separate lines)',
	['1, 2, c, undefined', '1, 2, then an unhandled rejection', '1, c, 10'],
	'The first handler logs 1 and returns 2. The second logs 2 and throws, rejecting the next promise. The .catch handler logs c and returns 10, which fulfils the chain again, so the final .then receives 10. A catch that returns normally turns a rejection back into a fulfilled value.',
	"Promise.resolve(1)\n  .then(v => { console.log(v); return v + 1; })\n  .then(v => { console.log(v); throw new Error('x'); })\n  .catch(e => { console.log('c'); return 10; })\n  .then(v => console.log(v));");

pm.add('mid', 'any',
	'Which combinator fulfils with the first promise that fulfils, ignoring earlier rejections?',
	'Promise.any',
	['Promise.race', 'Promise.all', 'Promise.allSettled'],
	'Promise.any waits for the first fulfilment and only rejects (with an AggregateError) if every promise rejects. Promise.race settles with the first settled promise, success or failure. Promise.all rejects on the first failure, and Promise.allSettled never rejects but waits for all of them.');

pm.add('mid', 'all-settled',
	'What does this code print?',
	"['fulfilled', 'rejected']",
	["['fulfilled', 'fulfilled']", 'It throws, because one of the promises rejected', '[1, 2]'],
	'Promise.allSettled never rejects. It resolves with one result object per input, with a status of "fulfilled" (and a value) or "rejected" (and a reason). Mapping to the statuses gives the two strings. The raw values 1 and 2 are inside the result objects.',
	"Promise.allSettled([Promise.resolve(1), Promise.reject(2)])\n  .then(r => console.log(r.map(x => x.status)));");

pm.add('advanced', 'forgot-return',
	'In p.then(() => { doWork(); }), doWork returns a promise. What does the next .then in the chain receive?',
	'undefined immediately, without waiting for doWork\'s promise',
	['The resolved value of doWork\'s promise', 'The doWork promise object itself, still pending', 'Nothing: the chain stops until doWork settles'],
	'The handler has a block body and no return, so it returns undefined and the chain moves on right away. doWork keeps running unattended, and if it rejects, nobody handles it. Write return doWork() (or use the shorter arrow form) so the chain waits and carries the value or the error.');

pm.add('advanced', 'unhandled-rejection',
	'What happens to a rejected promise that nothing handles?',
	'It is reported as an unhandled rejection (an event in browsers, a crash by default in modern Node)',
	['It is silently ignored, because rejections only matter inside try/catch blocks and are dropped otherwise', 'It is retried automatically up to three times', 'It is converted into a fulfilled promise holding undefined'],
	'Browsers dispatch an unhandledrejection event on the global object and log the error to the console. Node (v15 and later) treats it like an uncaught exception and terminates the process unless you set a handler. Always end chains with .catch, or await inside try/catch.');

// ───────────────────────── async-await-and-errors ─────────────────────────
const aw = t('async-await-and-errors');

aw.add('basic', 'returns-promise',
	'What does an async function always return?',
	'A promise',
	['The value after its last await', 'The function itself', 'undefined, unless it uses await'],
	'Whatever an async function returns is wrapped in a promise, and a thrown error becomes a rejected promise. Even async () => 5 returns a promise that resolves to 5. Callers must await it or use .then to reach the value.');

aw.add('basic', 'try-catch-finally',
	'What does this code print?',
	'caught, finally, done (on separate lines)',
	['finally, caught, done', 'ok, finally, done', 'caught, done, finally'],
	'await on a rejected promise throws at that line, so ok is skipped and the catch block logs caught. finally runs next, before the function returns "done". Only then does the .then(console.log) callback receive "done".',
	"async function g() {\n  try {\n    await Promise.reject(new Error('x'));\n    console.log('ok');\n  } catch {\n    console.log('caught');\n  } finally {\n    console.log('finally');\n  }\n  return 'done';\n}\ng().then(console.log);");

aw.add('mid', 'foreach-async',
	'What does this code print?',
	'after forEach, item 1, item 2 (on separate lines)',
	['item 1, item 2, after forEach', 'item 1, after forEach, item 2', 'after forEach, then nothing'],
	'forEach ignores the promises returned by its async callbacks, so it does not wait for them. It finishes immediately, and main logs after forEach. The two timers then fire and the callbacks resume. Use for...of with await, or await Promise.all(items.map(...)).',
	"const wait = ms => new Promise(r => setTimeout(r, ms));\nasync function main() {\n  [1, 2].forEach(async n => {\n    await wait(10);\n    console.log('item', n);\n  });\n  console.log('after forEach');\n}\nmain();");

aw.add('mid', 'parallel',
	'Two independent operations each take 100 ms. Roughly how long do await a(); await b(); and await Promise.all([a(), b()]) take?',
	'About 200 ms for the two awaits in a row, and about 100 ms for Promise.all',
	['About 100 ms for both, because await never blocks', 'About 100 ms for the two awaits in a row, and about 200 ms for Promise.all', 'About 200 ms for both'],
	'Awaiting in sequence starts b only after a has finished, so the times add up. Promise.all([a(), b()]) starts both calls immediately and finishes when the slower one does. await pauses the function but not the rest of the program.');

aw.add('advanced', 'return-await',
	'Inside an async function\'s try block, why can return await promise behave differently from return promise?',
	'With await the rejection is thrown inside the try, so the catch can handle it; a bare return skips the catch',
	['There is no difference at all, because both forms always wait for the promise to settle before leaving the try block', 'return await is a syntax error inside try blocks', 'Without await the promise is resolved twice'],
	'return promise leaves the function with the promise still pending, so by the time it rejects the function is no longer inside try. return await promise keeps the function suspended inside the try, and the rejection is thrown there. Use return await when a catch or finally depends on the outcome.');

aw.add('advanced', 'top-level-await',
	'Where can you use await outside an async function?',
	'At the top level of an ES module',
	['At the top level of any script file', 'Only inside a function whose name starts with async', 'Anywhere, because the engine adds async automatically'],
	'Top-level await is allowed in ES modules, where the module itself waits (and modules importing it wait too). In classic scripts and CommonJS files, await outside an async function is a syntax error.');

// ───────────────────────── modules ─────────────────────────
const md = t('modules');

md.add('basic', 'esm-vs-cjs',
	'Which pairing of syntax and module system is correct?',
	'import and export are ES modules; require and module.exports are CommonJS',
	['import and export are CommonJS; require and module.exports are ES modules', 'Both pairs belong to ES modules', 'import is for Node only; require is for browsers only'],
	'ES modules are the language standard and work in browsers and Node. CommonJS (require, module.exports) is Node\'s older system. Node can run either; which one a .js file uses depends on the package type setting or on the .mjs / .cjs extension.');

md.add('mid', 'live-bindings',
	'In an ES module, what is a name you import with import { count } from "./a.js"?',
	'A live, read-only view of the exporting module\'s variable',
	['A copy of the value made at import time', 'A deep clone of the exported object', 'A writable reference that you can reassign'],
	'Imports are live bindings: if the exporting module changes count, importers see the new value. You cannot assign to an imported name (it throws a TypeError). CommonJS is the one that exports plain values: a primitive such as count is copied into module.exports when it is assigned, so later changes are not seen.');

md.add('mid', 'module-once',
	'Two files import the same module. How often does that module\'s top-level code run?',
	'Once; the module is evaluated a single time and its instance is shared',
	['Twice, once per importing file', 'Every time an exported function is called', 'Only when the first importer has finished'],
	'A module is evaluated once and cached by its resolved URL or path. Every importer gets bindings to the same instance, so top-level state (a counter, a cache, a connection) is shared across the program.');

md.add('advanced', 'dynamic-import',
	'What does import("./x.js") return?',
	'A promise that resolves to the module namespace object',
	['The exports of x.js immediately, synchronously', 'A copy of the exports as a plain object', 'A function that loads the module when called'],
	'Dynamic import() works anywhere, even in non-module code, and returns a promise for the namespace object (live bindings included). It is how you code-split and lazy-load. Static import declarations, by contrast, are resolved before the code runs.');

md.add('advanced', 'module-strict',
	'Which statement about code in an ES module is true?',
	'It always runs in strict mode, and top-level this is undefined',
	['It runs in sloppy mode unless you write "use strict"', 'Top-level this is the global object', 'Top-level variables become properties of the global object'],
	'Modules are implicitly strict, so there is no "use strict" to add. Top-level this is undefined, and top-level declarations are module-scoped, not global properties. Those are the differences that sometimes break code that worked as a classic script.');

// ───────────────────────── iterators-and-generators ─────────────────────────
const it = t('iterators-and-generators');

it.add('basic', 'iterable',
	'Which of these can you loop over with for...of by default?',
	'A Set',
	['A plain object such as { a: 1 }', 'A Number', 'A WeakMap'],
	'Arrays, strings, Map, Set, typed arrays and generators are iterable: they have a [Symbol.iterator]() method. Plain objects do not, so for...of throws a TypeError on them (use Object.entries). Numbers are not objects, and WeakMap deliberately cannot be iterated.');

it.add('mid', 'generator-send',
	'What does this code print?',
	'1, got 10, 20 (on separate lines)',
	['1, got undefined, 20', '1, 20, got 10', 'got 10, 1, 20'],
	'The first next() runs to the first yield and hands out 1. next(10) resumes the generator and makes the paused yield expression evaluate to 10, so x is 10 and got 10 is logged, then it yields x * 2 = 20. The value passed to the first next() would be ignored.',
	'function* g() {\n  const x = yield 1;\n  console.log(\'got\', x);\n  yield x * 2;\n}\nconst it = g();\nconsole.log(it.next().value);\nconsole.log(it.next(10).value);');

it.add('mid', 'consume-once',
	'What does this code print?',
	'[1, 2] []',
	['[1, 2] [1, 2]', '[] []', '[1, 2] undefined'],
	'A generator object is its own iterator and can be consumed only once. The first spread exhausts it, and the second finds it already finished, so it yields nothing. Call the generator function again to get a fresh sequence.',
	'function* g() { yield 1; yield 2; }\nconst it = g();\nconsole.log([...it], [...it]);');

it.add('advanced', 'iterator-state',
	'What does this code print?',
	'[2, 3]',
	['[1, 2, 3]', '[3]', '[]'],
	'An array iterator keeps its position. it.next() consumes the first item (1), and the spread then collects the remaining items, 2 and 3. The array itself is untouched, but this particular iterator has moved on.',
	'const it = [1, 2, 3][Symbol.iterator]();\nit.next();\nconsole.log([...it]);');

it.add('advanced', 'lazy',
	'Why is function* naturals() { let n = 1; while (true) yield n++; } safe to call even though the loop never ends?',
	'The body only runs until the next yield each time next() is called, so values are produced on demand',
	['The engine stops any generator after 1000 values', 'The loop is optimised away because the result is never used', 'while (true) is treated as a single iteration inside generators'],
	'A generator is paused at each yield, and nothing advances it until next() is called. The infinite loop therefore describes a lazy, endless sequence, and consumers decide how much to take (for example with a take helper or by breaking out of for...of). Consuming all of it with spread would never finish.');

// ───────────────────────── modern-features ─────────────────────────
const mf = t('modern-features');

mf.add('basic', 'nullish',
	'What does this code print?',
	"0 1 1 x false",
	["1 1 1 x false", "0 0 1 'x' false", "0 1 1 x true"],
	'?? falls back only for null and undefined, so 0 ?? 1 keeps 0 and false ?? "y" keeps false. || falls back for any falsy value, so 0 || 1 gives 1 and "" || "x" gives x. null ?? 1 gives 1.',
	"console.log(0 ?? 1, 0 || 1, null ?? 1, '' || 'x', false ?? 'y');");

mf.add('basic', 'optional-chaining',
	'What does this code print?',
	'undefined undefined',
	['null undefined', 'It throws a TypeError on the second expression', 'undefined null'],
	'o.a?.b is null, and null?.c short-circuits to undefined instead of throwing. o.x is undefined, and x?.y.z stops at the ?. and skips the whole rest of the chain (including the .z), giving undefined. Without ?. both would throw a TypeError.',
	'const o = { a: { b: null } };\nconsole.log(o.a?.b?.c, o.x?.y.z);');

mf.add('mid', 'at',
	'What does [1, 2, 3].at(-1) return?',
	'3',
	['1', 'undefined', '2'],
	'at() accepts negative indexes that count from the end, so at(-1) is the last item. The bracket form [1, 2, 3][-1] would give undefined, because -1 is just an unknown property name there.');

mf.add('mid', 'group-by',
	'What does Object.groupBy(items, fn) return?',
	'An object whose keys are the group names and whose values are arrays of items; it has a null prototype',
	['A Map from group name to count', 'An array of arrays, one per group', 'A new array sorted by the result of fn'],
	'Object.groupBy (ES2024) calls fn on every item and collects the items into arrays under the returned key. The result is a plain-looking object created with a null prototype, so keys such as "toString" cannot clash. Map.groupBy returns a Map instead. Check runtime support before relying on it.');

mf.add('advanced', 'mixing-nullish',
	'Why is a ?? b || c a syntax error?',
	'The language forbids mixing ?? with || or && without parentheses, to avoid ambiguous precedence',
	['?? can only be used inside optional chains', '|| has a higher precedence, so the expression has no valid grouping', '?? can appear only once per file'],
	'The specification deliberately rejects the unparenthesised mix, because readers would disagree on how it groups. Write (a ?? b) || c or a ?? (b || c) to say what you mean. ?? can be used anywhere and as often as you like.');

// ───────────────────────── assemble ─────────────────────────
const banks = [vt, eq, sc, cl, th, pr, ar, ob, ev, pm, aw, md, it, mf];
export const javascriptQuestions: Question[] = banks
	.flatMap((b) => b.out)
	.map((q, i) => ({ ...q, id: 'JS' + String(i + 1).padStart(2, '0') }));
