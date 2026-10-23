import type { Scene } from '../types';

// TypeScript explainers. Types are abstract, so scenes show them as shapes (doc cards) and checks (boxes) that change step by step.
export const typescriptScenes: Scene[] = [
	// ───────────── types-and-inference ─────────────
	{
		id: 'ts-compile-vs-runtime',
		topic: 'typescript',
		group: 'types-and-inference',
		title: 'Types exist only before the code runs',
		blurb: 'Where do TypeScript types go when the program runs?',
		nodes: [
			{ id: 'src', kind: 'doc', x: 16, y: 16, w: 150, title: 'app.ts', lines: ['const n: number = 5;', 'n.toFixed(2);', 'n.toUpperCase();'], visible: true },
			{ id: 'chk', kind: 'box', x: 16, y: 118, w: 150, h: 44, label: 'Type checker', sub: 'runs while you build' },
			{ id: 'err', kind: 'box', x: 196, y: 112, w: 148, h: 56, label: 'toUpperCase does not exist on type number', tone: 'neg' },
			{ id: 'erase', kind: 'box', x: 16, y: 190, w: 150, h: 44, label: 'Erase the types', sub: 'then emit JavaScript' },
			{ id: 'js', kind: 'doc', x: 196, y: 178, w: 148, title: 'app.js', lines: ['const n = 5;', 'n.toFixed(2);'], tone: 'accent' },
			{ id: 'e1', kind: 'edge', from: 'src', to: 'chk' },
			{ id: 'e2', kind: 'edge', from: 'chk', to: 'err', tone: 'neg' },
			{ id: 'e3', kind: 'edge', from: 'chk', to: 'erase' },
			{ id: 'e4', kind: 'edge', from: 'erase', to: 'js', tone: 'accent' },
			{ id: 'note', kind: 'text', x: 16, y: 270, w: 312, size: 'sm', text: 'Types are gone at runtime, so the running program cannot check them any more.' }
		],
		steps: [
			{ say: 'You write TypeScript: ordinary JavaScript with type annotations such as : number.', focus: ['src'] },
			{ say: 'Before anything runs, the type checker reads the file. It knows n is a number, so n.toFixed(2) is fine.', show: ['chk', 'e1'], set: { src: { hl: [1] } }, focus: ['chk'] },
			{ say: 'n.toUpperCase() does not exist on a number, so the checker reports an error. This happens as you type or build, not when the app runs.', show: ['err', 'e2'], set: { src: { hl: [2] } }, pulse: ['err'] },
			{ say: 'Once the code compiles, the compiler erases every type annotation. What is left is plain JavaScript.', show: ['erase', 'e3'], set: { src: { hl: [] } }, focus: ['erase'] },
			{ say: 'Node or the browser only ever sees the JavaScript. There are no types in it.', show: ['js', 'e4'], pulse: ['js'] },
			{ say: 'So types cannot stop a bad value that arrives at runtime, such as a fetch response. Data from outside still has to be checked.', show: ['note'] }
		]
	},
	{
		id: 'ts-structural-typing',
		topic: 'typescript',
		group: 'types-and-inference',
		title: 'Shapes matter, names do not',
		blurb: 'Why can an object with extra properties still be assigned to a type?',
		nodes: [
			{ id: 'tp', kind: 'doc', x: 16, y: 16, w: 150, title: 'type Point', lines: ['{ x: number;', '  y: number }'], visible: true },
			{ id: 'v', kind: 'doc', x: 196, y: 16, w: 148, title: 'const p3', lines: ['{ x: 1,', '  y: 2,', '  z: 3 }'] },
			{ id: 'chk', kind: 'box', x: 120, y: 116, w: 120, h: 36, label: 'Assignable?', shape: 'pill' },
			{ id: 'e1', kind: 'edge', from: 'tp', to: 'chk' },
			{ id: 'e2', kind: 'edge', from: 'v', to: 'chk' },
			{ id: 'r1', kind: 'box', x: 16, y: 176, w: 328, h: 40, label: 'const a: Point = p3  // OK: it has x and y', tone: 'accent' },
			{ id: 'r2', kind: 'box', x: 16, y: 228, w: 328, h: 56, label: 'const b: Point = { x: 1, y: 2, z: 3 }  // error: z is not in Point', tone: 'neg' }
		],
		steps: [
			{ say: 'TypeScript compares shapes, not names. Point asks for a number x and a number y.', focus: ['tp'] },
			{ say: 'Here is a value with x, y and an extra z. It was never declared as a Point.', show: ['v'], focus: ['v'] },
			{ say: 'Is it assignable to Point? The checker verifies that every required property is present with the right type.', show: ['chk', 'e1', 'e2'], focus: ['chk'] },
			{ say: 'x and y are there and are numbers. The extra z does not matter, so the assignment is allowed.', show: ['r1'], set: { chk: { label: 'Yes', tone: 'accent' } }, pulse: ['r1'] },
			{ say: 'This is structural typing: anything with the right shape fits, even if it never mentions Point.', focus: ['tp', 'v'] },
			{ say: 'The exception is a fresh object literal written directly in the assignment. There, an extra property is assumed to be a typo and is reported.', show: ['r2'], pulse: ['r2'] }
		]
	},

	// ───────────── unions-and-narrowing ─────────────
	{
		id: 'ts-union-narrowing',
		topic: 'typescript',
		group: 'unions-and-narrowing',
		title: 'Narrowing a union step by step',
		blurb: 'How does TypeScript know which member of a union you have?',
		nodes: [
			{
				id: 'code', kind: 'doc', x: 16, y: 16, w: 328, visible: true,
				lines: ['function show(id: string | number) {', '  if (typeof id === "string") {', '    id.toUpperCase();', '  } else {', '    id.toFixed(2);', '  }', '}']
			},
			{ id: 'tb', kind: 'box', x: 16, y: 164, w: 328, h: 44, label: 'id: string | number', sub: 'what the checker believes right here', visible: true },
			{ id: 'ps', kind: 'box', x: 16, y: 232, w: 100, h: 34, label: 'string', shape: 'pill', visible: true },
			{ id: 'pn', kind: 'box', x: 130, y: 232, w: 100, h: 34, label: 'number', shape: 'pill', visible: true }
		],
		steps: [
			{ say: 'id can be a string or a number, so the checker only lets you use what both types share.', set: { code: { hl: [0] } }, focus: ['tb'] },
			{ say: 'Calling id.toUpperCase() straight away would be an error: numbers have no toUpperCase. A check is needed first.', set: { code: { hl: [2] }, tb: { tone: 'warn', label: 'id.toUpperCase() is not allowed yet', sub: 'number has no toUpperCase' } } },
			{ say: 'Inside if (typeof id === "string") the checker eliminates number. id is a string here, so toUpperCase is allowed.', hide: ['pn'], set: { code: { hl: [1, 2] }, tb: { tone: 'accent', label: 'id: string', sub: 'number was eliminated by the typeof check' } } },
			{ say: 'In the else branch the string is eliminated too, so id is a number and toFixed is allowed.', show: ['pn'], hide: ['ps'], set: { code: { hl: [3, 4] }, tb: { label: 'id: number', sub: 'string was eliminated, only number is left' } } },
			{ say: 'After the if and else, the branches join again and id is back to string | number.', show: ['ps', 'pn'], set: { code: { hl: [6] }, tb: { tone: 'neutral', label: 'id: string | number', sub: 'the branches join, so both are possible again' } } },
			{ say: 'typeof, instanceof, in, equality and truthiness checks all narrow like this: the checker removes the members that cannot be true.', set: { code: { hl: [] } }, focus: ['tb'] }
		]
	},
	{
		id: 'ts-discriminated-union',
		topic: 'typescript',
		group: 'unions-and-narrowing',
		title: 'A tag that tells the shapes apart',
		blurb: 'How do you make a union easy to narrow and impossible to forget a case?',
		nodes: [
			{ id: 'd1', kind: 'doc', x: 16, y: 16, w: 152, title: 'circle', lines: ['{ kind: "circle",', '  radius: 2 }'], visible: true },
			{ id: 'd2', kind: 'doc', x: 192, y: 16, w: 152, title: 'square', lines: ['{ kind: "square",', '  side: 3 }'], visible: true },
			{
				id: 'code', kind: 'doc', x: 16, y: 100, w: 328,
				lines: ['function area(s: Shape) {', '  switch (s.kind) {', '    case "circle": return s.radius ** 2;', '    case "square": return s.side ** 2;', '    default: return assertNever(s);', '  }', '}']
			},
			{ id: 'res', kind: 'box', x: 16, y: 238, w: 328, h: 44, label: 'default: s is never, because every member was handled', tone: 'accent' }
		],
		steps: [
			{ say: 'A discriminated union gives every member a literal kind tag. The members share kind but differ in everything else.', focus: ['d1', 'd2'] },
			{ say: 'A switch on s.kind is the check. The tag tells the compiler which member it is looking at.', show: ['code'], set: { code: { hl: [0, 1] } } },
			{ say: 'In case "circle" the checker keeps only the circle member, so s.radius exists. Reading s.side here would be an error.', set: { code: { hl: [2] } }, focus: ['d1'] },
			{ say: 'In case "square" only the square member is left, so s.side is allowed.', set: { code: { hl: [3] } }, focus: ['d2'] },
			{ say: 'In default nothing is left, so s has type never. assertNever(s) compiles, which proves every case is covered.', show: ['res'], set: { code: { hl: [4] } }, pulse: ['res'] },
			{ say: 'Add a triangle member and forget its case, and assertNever(s) stops compiling. The compiler points at what you missed.', set: { res: { tone: 'warn', label: 'Add a triangle member and forget its case: assertNever(s) no longer compiles' } } }
		]
	},

	// ───────────── interfaces-vs-type-aliases ─────────────
	{
		id: 'ts-interface-vs-alias',
		topic: 'typescript',
		group: 'interfaces-vs-type-aliases',
		title: 'Interfaces merge, aliases do not',
		blurb: 'What can an interface or a type alias do that the other cannot?',
		nodes: [
			{ id: 'i1', kind: 'doc', x: 16, y: 20, w: 152, title: 'interface User', lines: ['{ name: string }'], visible: true },
			{ id: 't1', kind: 'doc', x: 192, y: 20, w: 152, title: 'type User', lines: ['{ name: string }'], visible: true },
			{ id: 'i2', kind: 'doc', x: 16, y: 90, w: 152, title: 'interface User (again)', lines: ['{ age: number }'] },
			{ id: 't2', kind: 'doc', x: 192, y: 90, w: 152, title: 'type User (again)', lines: ['{ age: number }'] },
			{ id: 'merged', kind: 'doc', x: 16, y: 168, w: 152, title: 'merged User', lines: ['{ name: string;', '  age: number }'], tone: 'accent' },
			{ id: 'err', kind: 'box', x: 192, y: 168, w: 152, h: 60, label: 'Error: Duplicate identifier User', tone: 'neg' },
			{ id: 'e1', kind: 'edge', from: 'i2', to: 'merged', tone: 'accent' },
			{ id: 'e2', kind: 'edge', from: 't2', to: 'err', tone: 'neg' },
			{ id: 'note', kind: 'text', x: 16, y: 262, w: 312, size: 'sm', text: 'Aliases can also name unions, tuples and primitives, for example type Id = string | number.' }
		],
		steps: [
			{ say: 'Both an interface and a type alias describe an object shape, and for plain objects they are interchangeable.', focus: ['i1', 't1'] },
			{ say: 'Declare an interface twice with the same name and TypeScript merges the two into one. This is called declaration merging.', show: ['i2', 'merged', 'e1'], pulse: ['merged'] },
			{ say: 'Libraries rely on this. You can add fields to an existing interface, such as Window, from your own file.', focus: ['merged'] },
			{ say: 'A type alias cannot be declared twice. The second declaration is an error.', show: ['t2', 'err', 'e2'], pulse: ['err'] },
			{ say: 'Aliases can name things interfaces cannot: unions, tuples and primitives.', show: ['note'] },
			{ say: 'A sensible default: interface for object shapes you expect to extend, type for everything else. Consistency matters more than the choice.', focus: ['i1', 't1'] }
		]
	},

	// ───────────── functions-and-overloads ─────────────
	{
		id: 'ts-function-overloads',
		topic: 'typescript',
		group: 'functions-and-overloads',
		title: 'Overloads: the first match wins',
		blurb: 'How can one function return a different type for different inputs?',
		nodes: [
			{
				id: 'sig', kind: 'doc', x: 16, y: 16, w: 328, title: 'overload signatures', visible: true,
				lines: ['function conv(x: string): number;', 'function conv(x: number): string;', 'function conv(x: string | number) { ... }']
			},
			{ id: 'r1', kind: 'box', x: 16, y: 112, w: 328, h: 40, label: 'conv("42")  matches overload 1  →  number', tone: 'accent' },
			{ id: 'r2', kind: 'box', x: 16, y: 160, w: 328, h: 40, label: 'conv(7)  skips overload 1, matches overload 2  →  string', tone: 'accent' },
			{ id: 'r3', kind: 'box', x: 16, y: 208, w: 328, h: 40, label: 'conv(true)  matches neither  →  error', tone: 'neg' },
			{ id: 'note', kind: 'text', x: 16, y: 278, w: 312, size: 'sm', text: 'Overloads are tried top to bottom, and the first match wins.' }
		],
		steps: [
			{ say: 'Overloads list several signatures for one function. The last line is the implementation, which callers cannot see.', focus: ['sig'] },
			{ say: 'conv("42") passes a string, so the first signature matches and the result type is number.', show: ['r1'], set: { sig: { hl: [0] } }, pulse: ['r1'] },
			{ say: 'conv(7) fails the first signature, so the checker moves down and the second one matches. The result type is string.', show: ['r2'], set: { sig: { hl: [1] } }, pulse: ['r2'] },
			{ say: 'conv(true) matches no signature. The implementation accepts string | number, but it is hidden from callers, so this is an error.', show: ['r3'], set: { sig: { hl: [2] } }, pulse: ['r3'] },
			{ say: 'Order matters: the first matching signature wins, so put the most specific overload first.', show: ['note'], set: { sig: { hl: [] } } }
		]
	},

	// ───────────── generics ─────────────
	{
		id: 'ts-generic-instantiation',
		topic: 'typescript',
		group: 'generics',
		title: 'One function, many types',
		blurb: 'What is the T in a generic function?',
		nodes: [
			{ id: 'tmpl', kind: 'box', x: 100, y: 16, w: 160, h: 50, label: 'identity<T>(x: T): T', sub: 'one definition, any type', tone: 'accent', visible: true },
			{ id: 's', kind: 'box', x: 16, y: 130, w: 150, h: 50, label: 'T = string', sub: 'identity("hi")' },
			{ id: 'n', kind: 'box', x: 194, y: 130, w: 150, h: 50, label: 'T = number', sub: 'identity(7)' },
			{ id: 'e1', kind: 'edge', from: 'tmpl', to: 's' },
			{ id: 'e2', kind: 'edge', from: 'tmpl', to: 'n' },
			{ id: 'bad', kind: 'box', x: 16, y: 208, w: 328, h: 40, label: 'identity<number>("hi")  error: "hi" is not a number', tone: 'neg' },
			{ id: 'any', kind: 'text', x: 16, y: 272, w: 312, size: 'sm', text: 'With any instead of T, the result would be any and the type would be lost.' }
		],
		steps: [
			{ say: 'A generic function is a template. T is a placeholder for a type that is filled in separately at every call.', focus: ['tmpl'] },
			{ say: 'Call identity("hi"). TypeScript infers T = string from the argument, so the result is a string.', show: ['s', 'e1'], pulse: ['s'] },
			{ say: 'Call identity(7) and T becomes number for that call. One definition, two different types.', show: ['n', 'e2'], pulse: ['n'] },
			{ say: 'You rarely write the type yourself, inference fills T in. What the link buys you is exactly what any would throw away.', show: ['any'] },
			{ say: 'If you do give T explicitly, the argument has to match it: T = number does not accept the string "hi".', show: ['bad'], pulse: ['bad'] }
		]
	},
	{
		id: 'ts-generic-constraint',
		topic: 'typescript',
		group: 'generics',
		title: 'Constraining a type parameter',
		blurb: 'How do you say "any type, as long as it has a length"?',
		nodes: [
			{ id: 'fn', kind: 'box', x: 16, y: 16, w: 328, h: 56, label: 'longest<T extends { length: number }>(x: T)', sub: 'T must have at least a length property', tone: 'accent', visible: true },
			{ id: 'b1', kind: 'box', x: 16, y: 100, w: 100, h: 44, label: '"abc"', sub: 'string' },
			{ id: 'b2', kind: 'box', x: 130, y: 100, w: 100, h: 44, label: '[1, 2]', sub: 'number[]' },
			{ id: 'b3', kind: 'box', x: 244, y: 100, w: 100, h: 44, label: '42', sub: 'number' },
			{ id: 'r1', kind: 'box', x: 16, y: 176, w: 100, h: 44, label: 'OK', sub: 'has length', tone: 'accent' },
			{ id: 'r2', kind: 'box', x: 130, y: 176, w: 100, h: 44, label: 'OK', sub: 'has length', tone: 'accent' },
			{ id: 'r3', kind: 'box', x: 244, y: 176, w: 100, h: 44, label: 'Error', sub: 'no length', tone: 'neg' },
			{ id: 'e1', kind: 'edge', from: 'b1', to: 'r1', tone: 'accent' },
			{ id: 'e2', kind: 'edge', from: 'b2', to: 'r2', tone: 'accent' },
			{ id: 'e3', kind: 'edge', from: 'b3', to: 'r3', tone: 'neg' },
			{ id: 'note', kind: 'text', x: 16, y: 252, w: 312, size: 'sm', text: 'extends sets a minimum shape: anything with at least that shape is accepted.' }
		],
		steps: [
			{ say: 'T extends { length: number } is a constraint. Any type is allowed, as long as it has a numeric length.', focus: ['fn'] },
			{ say: 'A string has a length, so T = string satisfies the constraint.', show: ['b1', 'e1', 'r1'], pulse: ['r1'] },
			{ say: 'An array has a length too, so T = number[] is fine.', show: ['b2', 'e2', 'r2'], pulse: ['r2'] },
			{ say: 'A number has no length property, so it is rejected at the call, before the function even runs.', show: ['b3', 'e3', 'r3'], pulse: ['r3'] },
			{ say: 'A constraint is a minimum. The argument may have more properties, and inside the function you can rely on x.length.', show: ['note'] }
		]
	},

	// ───────────── utility-types ─────────────
	{
		id: 'ts-utility-types',
		topic: 'typescript',
		group: 'utility-types',
		title: 'Utility types reshape a type',
		blurb: 'How do Partial, Pick, Omit and friends derive new types?',
		nodes: [
			{ id: 'user', kind: 'doc', x: 16, y: 16, w: 130, title: 'type User', lines: ['{ id: number;', '  name: string;', '  role: string }'], visible: true },
			{ id: 'res', kind: 'doc', x: 160, y: 16, w: 184, title: 'result', lines: ['{ id: number }'], tone: 'accent' },
			{ id: 'e1', kind: 'edge', from: 'user', to: 'res', tone: 'accent' },
			{ id: 'op', kind: 'box', x: 16, y: 124, w: 328, h: 44, label: 'Partial<User>', sub: 'every field becomes optional' },
			{ id: 'use', kind: 'text', x: 16, y: 200, w: 312, size: 'sm', text: 'Use it for update payloads, where every field is optional.' }
		],
		steps: [
			{ say: 'Utility types transform an existing type. Here is a User with three fields. Each step derives a new type from it.', focus: ['user'] },
			{
				say: 'Partial<User> makes every field optional. It is handy for update payloads where you send only what changed.',
				show: ['res', 'e1', 'op', 'use'],
				set: { res: { title: 'Partial<User>', lines: ['{ id?: number;', '  name?: string;', '  role?: string }'] }, op: { label: 'Partial<User>', sub: 'every field becomes optional' }, use: { text: 'Use it for update payloads, where every field is optional.' } }
			},
			{
				say: 'Pick<User, "id" | "name"> keeps only the listed keys.',
				set: { res: { title: 'Pick<User, "id" | "name">', lines: ['{ id: number;', '  name: string }'] }, op: { label: 'Pick<User, "id" | "name">', sub: 'keep only these keys' }, use: { text: 'Use it for a small preview of a bigger type.' } },
				pulse: ['res']
			},
			{
				say: 'Omit<User, "id"> is the opposite: it drops the listed keys and keeps the rest.',
				set: { res: { title: 'Omit<User, "id">', lines: ['{ name: string;', '  role: string }'] }, op: { label: 'Omit<User, "id">', sub: 'drop these keys' }, use: { text: 'Use it to remove fields, for example a generated id.' } },
				pulse: ['res']
			},
			{
				say: 'Readonly<User> marks the top-level fields readonly. It is shallow: an array inside a field can still be changed.',
				set: { res: { title: 'Readonly<User>', lines: ['{ readonly id: number;', '  readonly name: string;', '  readonly role: string }'] }, op: { label: 'Readonly<User>', sub: 'top-level fields cannot be reassigned' }, use: { text: 'Shallow: nested objects and arrays stay mutable.' } },
				pulse: ['res']
			},
			{
				say: 'Record<K, V> builds an object type from a list of keys and one value type. It does not start from User.',
				set: { res: { title: 'Record<"a" | "b", number>', lines: ['{ a: number;', '  b: number }'] }, op: { label: 'Record<"a" | "b", number>', sub: 'one value type for a list of keys' }, use: { text: 'Use it for lookup tables and dictionaries.' } },
				pulse: ['res']
			},
			{ say: 'All of these are written with mapped types, so you can write your own when the built-ins are not enough.', focus: ['res'] }
		]
	},

	// ───────────── keyof-and-indexed-access ─────────────
	{
		id: 'ts-keyof-indexed',
		topic: 'typescript',
		group: 'keyof-and-indexed-access',
		title: 'keyof and indexed access',
		blurb: 'How does a function accept only real keys and return the right value type?',
		nodes: [
			{ id: 'user', kind: 'doc', x: 16, y: 16, w: 150, title: 'type User', lines: ['{ id: number;', '  name: string;', '  active: boolean }'], visible: true },
			{ id: 'keyof', kind: 'box', x: 196, y: 16, w: 148, h: 50, label: 'keyof User', sub: '"id" | "name" | "active"', tone: 'accent' },
			{ id: 'idx', kind: 'box', x: 196, y: 82, w: 148, h: 50, label: 'User["name"]', sub: 'string', tone: 'accent' },
			{ id: 'e1', kind: 'edge', from: 'user', to: 'keyof' },
			{ id: 'e2', kind: 'edge', from: 'user', to: 'idx' },
			{ id: 'code', kind: 'doc', x: 16, y: 152, w: 328, lines: ['function get<T, K extends keyof T>(', '  obj: T, key: K): T[K] {', '  return obj[key];', '}'] },
			{ id: 'r1', kind: 'box', x: 16, y: 244, w: 158, h: 44, label: 'get(user, "name")', sub: 'returns string', tone: 'accent' },
			{ id: 'r2', kind: 'box', x: 186, y: 244, w: 158, h: 44, label: 'get(user, "age")', sub: 'error: no such key', tone: 'neg' }
		],
		steps: [
			{ say: 'Here is a User type. Its keys are id, name and active, and each key holds its own value type.', focus: ['user'] },
			{ say: 'keyof User is the union of its key names: "id" | "name" | "active".', show: ['keyof', 'e1'], pulse: ['keyof'] },
			{ say: 'User["name"] is an indexed access type: the type of the value stored under that key, here string.', show: ['idx', 'e2'], pulse: ['idx'] },
			{ say: 'Combine them. K must be one of the keys of T, and the result type is T[K], whatever that key holds.', show: ['code'], set: { code: { hl: [0, 1] } } },
			{ say: 'get(user, "name") returns a string, because K is "name" and User["name"] is string.', show: ['r1'], set: { code: { hl: [] } }, pulse: ['r1'] },
			{ say: 'get(user, "age") is an error, because "age" is not a key of User. A typo cannot slip through.', show: ['r2'], pulse: ['r2'] }
		]
	},

	// ───────────── mapped-types ─────────────
	{
		id: 'ts-mapped-type',
		topic: 'typescript',
		group: 'mapped-types',
		title: 'A mapped type loops over keys',
		blurb: 'How do you build a new object type from the keys of another?',
		nodes: [
			{ id: 'src', kind: 'doc', x: 16, y: 16, w: 140, title: 'T', lines: ['{ id: number;', '  name: string }'], visible: true },
			{ id: 'res', kind: 'doc', x: 172, y: 16, w: 172, title: 'Mapped<T>', lines: ['{ id: number }'], tone: 'accent' },
			{ id: 'e1', kind: 'edge', from: 'src', to: 'res', tone: 'accent' },
			{ id: 'expr', kind: 'text', x: 16, y: 122, w: 328, text: '{ [K in keyof T]: T[K] }', visible: true }
		],
		steps: [
			{ say: 'A mapped type loops over the keys of a type and builds a new object type. K takes each key in turn.', focus: ['expr'] },
			{ say: 'First K is "id". The new type gets a property id whose type is T["id"], which is number.', show: ['res', 'e1'], set: { src: { hl: [0] } }, pulse: ['res'] },
			{ say: 'Then K is "name". The result now has both properties, an exact copy of T.', set: { src: { hl: [1] }, res: { lines: ['{ id: number;', '  name: string }'] } } },
			{
				say: 'Add readonly in front of the key and every property of the result becomes readonly.',
				set: { src: { hl: [] }, expr: { text: '{ readonly [K in keyof T]: T[K] }' }, res: { lines: ['{ readonly id: number;', '  readonly name: string }'] } },
				pulse: ['res']
			},
			{
				say: 'Add ? after the key and every property becomes optional. A - in front of readonly or ? removes the flag instead.',
				set: { expr: { text: '{ [K in keyof T]?: T[K] }' }, res: { lines: ['{ id?: number;', '  name?: string }'] } },
				pulse: ['res']
			},
			{
				say: 'Change the value type and you change every property at once, here by allowing null.',
				set: { expr: { text: '{ [K in keyof T]: T[K] | null }' }, res: { lines: ['{ id: number | null;', '  name: string | null }'] } },
				pulse: ['res']
			},
			{
				say: 'An as clause renames the keys. With a template literal, id becomes getId and name becomes getName.',
				set: { expr: { text: '{ [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K] }' }, res: { lines: ['{ getId(): number;', '  getName(): string }'] } },
				pulse: ['res']
			}
		]
	},

	// ───────────── conditional-types-and-infer ─────────────
	{
		id: 'ts-conditional-infer',
		topic: 'typescript',
		group: 'conditional-types-and-infer',
		title: 'Conditional types and infer',
		blurb: 'How does a type make a choice and pull a type out of another?',
		nodes: [
			{ id: 'expr', kind: 'text', x: 16, y: 28, w: 328, text: 'type Elem<T> = T extends (infer U)[] ? U : T;', visible: true },
			{ id: 'in1', kind: 'box', x: 16, y: 60, w: 140, h: 40, label: 'Elem<string[]>' },
			{ id: 'out1', kind: 'box', x: 204, y: 60, w: 140, h: 40, label: 'string', sub: 'U = string', tone: 'accent' },
			{ id: 'in2', kind: 'box', x: 16, y: 124, w: 140, h: 40, label: 'Elem<number>' },
			{ id: 'out2', kind: 'box', x: 204, y: 124, w: 140, h: 40, label: 'number', sub: 'not an array: T itself', tone: 'accent' },
			{ id: 'in3', kind: 'box', x: 16, y: 196, w: 140, h: 50, label: 'Elem<string[] | number>' },
			{ id: 'out3', kind: 'box', x: 204, y: 196, w: 140, h: 50, label: 'string | number', sub: 'checked member by member', tone: 'accent' },
			{ id: 'e1', kind: 'edge', from: 'in1', to: 'out1', tone: 'accent' },
			{ id: 'e2', kind: 'edge', from: 'in2', to: 'out2', tone: 'accent' },
			{ id: 'e3', kind: 'edge', from: 'in3', to: 'out3', tone: 'accent' },
			{ id: 'note', kind: 'text', x: 16, y: 272, w: 312, size: 'sm', text: 'Elem<never> is never: a union with no members has nothing to check.' }
		],
		steps: [
			{ say: 'A conditional type is an if/else for types: T extends U ? X : Y. This one asks whether T is an array of something.', focus: ['expr'] },
			{ say: 'For string[] the answer is yes. infer U captures the element type, so the result is string.', show: ['in1', 'e1', 'out1'], pulse: ['out1'] },
			{ say: 'For number the answer is no, so the else branch returns T itself: number.', show: ['in2', 'e2', 'out2'], pulse: ['out2'] },
			{ say: 'Now pass a union: string[] | number.', show: ['in3'], focus: ['in3'] },
			{ say: 'Because T is a bare type parameter, the check runs on each member separately and the results are joined: string | number. This is called distribution.', show: ['e3', 'out3'], pulse: ['out3'] },
			{ say: 'Edge case: never is a union with no members, so there is nothing to check and the result is never. Wrapping T in a tuple turns distribution off.', show: ['note'] }
		]
	},

	// ───────────── unknown-any-never ─────────────
	{
		id: 'ts-unknown-any-never',
		topic: 'typescript',
		group: 'unknown-any-never',
		title: 'any, unknown and never',
		blurb: 'Which special type should you reach for, and when?',
		nodes: [
			{ id: 'a', kind: 'box', x: 16, y: 24, w: 100, h: 40, label: 'any', sub: 'checks off', tone: 'warn' },
			{ id: 'ra', kind: 'box', x: 16, y: 90, w: 100, h: 60, label: 'compiles, may crash at runtime', tone: 'warn' },
			{ id: 'ea', kind: 'edge', from: 'a', to: 'ra', tone: 'warn' },
			{ id: 'u', kind: 'box', x: 130, y: 24, w: 100, h: 40, label: 'unknown', sub: 'checks on', tone: 'accent' },
			{ id: 'ru', kind: 'box', x: 130, y: 90, w: 100, h: 60, label: 'must narrow first: typeof, instanceof', tone: 'accent' },
			{ id: 'eu', kind: 'edge', from: 'u', to: 'ru', tone: 'accent' },
			{ id: 'n', kind: 'box', x: 244, y: 24, w: 100, h: 40, label: 'never', sub: 'no value exists' },
			{ id: 'rn', kind: 'box', x: 244, y: 90, w: 100, h: 60, label: 'left after every case is handled' },
			{ id: 'en', kind: 'edge', from: 'n', to: 'rn' },
			{ id: 'code', kind: 'doc', x: 16, y: 168, w: 328, lines: ['function f(v: unknown) {', '  if (typeof v === "string") {', '    v.toUpperCase();   // ok', '  }', '}'] }
		],
		steps: [
			{ say: 'any switches type checking off. Every operation compiles, including ones that will crash at runtime.', show: ['a', 'ra', 'ea'], pulse: ['a'] },
			{ say: 'unknown accepts any value too, but keeps checking on: you must narrow it before you can use it.', show: ['u', 'ru', 'eu'], pulse: ['u'] },
			{ say: 'never is the empty type: no value has it. It is what remains after every member of a union has been handled.', show: ['n', 'rn', 'en'], pulse: ['n'] },
			{ say: 'With unknown, the check typeof v === "string" narrows v to string, so toUpperCase() is allowed inside the if.', show: ['code'], set: { code: { hl: [1, 2] } } },
			{ say: 'For data you do not control, such as parsed JSON, prefer unknown to any. It forces the check that any lets you skip.', set: { code: { hl: [] } }, focus: ['u'] }
		]
	},

	// ───────────── literals-satisfies-and-enums ─────────────
	{
		id: 'ts-satisfies-as-const',
		topic: 'typescript',
		group: 'literals-satisfies-and-enums',
		title: 'as const and satisfies',
		blurb: 'How do you check an object and still keep its exact values?',
		nodes: [
			{ id: 'code', kind: 'doc', x: 16, y: 16, w: 328, lines: ['const routes = {', '  home: "/",', '  blog: "/blog"', '};'], visible: true },
			{ id: 't', kind: 'box', x: 16, y: 110, w: 328, h: 50, label: '{ home: string; blog: string }', sub: 'widened: the exact literals are forgotten', tone: 'warn', visible: true },
			{ id: 'c', kind: 'box', x: 16, y: 176, w: 328, h: 44, label: 'Checked against Record<string, string>', sub: 'shape and value types are validated', tone: 'accent' },
			{ id: 'u', kind: 'box', x: 16, y: 236, w: 328, h: 44, label: '(typeof routes)[keyof typeof routes]', sub: 'is "/" | "/blog"', tone: 'accent' }
		],
		steps: [
			{ say: 'By default TypeScript widens: "/" and "/blog" become plain strings, because the properties could be reassigned later.', focus: ['t'] },
			{
				say: 'as const freezes the literals: the properties become readonly and keep their exact values, "/" and "/blog".',
				set: {
					code: { lines: ['const routes = {', '  home: "/",', '  blog: "/blog"', '} as const;'], hl: [3] },
					t: { tone: 'accent', label: '{ readonly home: "/"; readonly blog: "/blog" }', sub: 'exact literals, read-only' }
				},
				pulse: ['t']
			},
			{
				say: 'Adding satisfies checks the object against a contract without changing its type. The exact literals are still there.',
				show: ['c'],
				set: { code: { lines: ['const routes = {', '  home: "/",', '  blog: "/blog"', '} as const satisfies Record<string, string>;'], hl: [3] } },
				pulse: ['c']
			},
			{
				say: 'If a value breaks the contract, say home: 42, the error appears right here, at the declaration.',
				set: {
					code: { lines: ['const routes = {', '  home: 42,', '  blog: "/blog"', '} as const satisfies Record<string, string>;'], hl: [1] },
					c: { tone: 'neg', label: 'Error: number is not assignable to string', sub: 'the mistake is caught at the declaration' }
				},
				pulse: ['c']
			},
			{
				say: 'Back to a valid object, the exact literals give you a union you can use as a type: "/" | "/blog".',
				show: ['u'],
				set: {
					code: { lines: ['const routes = {', '  home: "/",', '  blog: "/blog"', '} as const satisfies Record<string, string>;'], hl: [] },
					c: { tone: 'accent', label: 'Checked against Record<string, string>', sub: 'shape and value types are validated' }
				},
				pulse: ['u']
			}
		]
	},

	// ───────────── tsconfig-and-strict ─────────────
	{
		id: 'ts-tsconfig-strict',
		topic: 'typescript',
		group: 'tsconfig-and-strict',
		title: 'What strict mode catches',
		blurb: 'What changes in the checker when you turn strict on?',
		nodes: [
			{ id: 'cfg', kind: 'doc', x: 16, y: 16, w: 328, title: 'tsconfig.json', lines: ['{ "compilerOptions": { "strict": false } }'], visible: true },
			{ id: 'code', kind: 'doc', x: 16, y: 84, w: 328, title: 'app.ts', lines: ['const users: User[] = loadUsers();', 'const user = users.find((u) => u.id === 1);', 'console.log(user.name);'], visible: true },
			{ id: 'res', kind: 'box', x: 16, y: 180, w: 328, h: 50, label: 'strict off: compiles, but crashes if no user has id 1', tone: 'warn' }
		],
		steps: [
			{ say: 'With strict off, the checker is lenient. Look at find: it returns the first match, or undefined if nothing matches.', set: { code: { hl: [1] } }, focus: ['cfg'] },
			{ say: 'With strict off this compiles, and user.name crashes at runtime when no user has id 1.', show: ['res'], set: { code: { hl: [2] } }, pulse: ['res'] },
			{
				say: 'Turn strict on and strictNullChecks makes find return User | undefined. Reading user.name is now an error.',
				set: { cfg: { lines: ['{ "compilerOptions": { "strict": true } }'] }, res: { tone: 'neg', label: 'Error: user is possibly undefined' } },
				pulse: ['res']
			},
			{
				say: 'Handle the missing case, here with optional chaining, and the code compiles.',
				set: { code: { lines: ['const users: User[] = loadUsers();', 'const user = users.find((u) => u.id === 1);', 'console.log(user?.name);'], hl: [2] }, res: { tone: 'accent', label: 'OK: the undefined case is handled' } },
				pulse: ['res']
			},
			{
				say: 'noUncheckedIndexedAccess is a separate flag, not part of strict. It makes arr[0] possibly undefined, because the index may be out of range.',
				set: {
					cfg: { lines: ['{ "compilerOptions": { "strict": true,', '  "noUncheckedIndexedAccess": true } }'] },
					code: { title: 'app.ts', lines: ['const arr = [1, 2, 3];', 'const a: number = arr[0];', '// arr[0] is number | undefined'], hl: [1] },
					res: { tone: 'neg', label: 'Error: number | undefined is not assignable to number' }
				},
				pulse: ['res']
			},
			{ say: 'Flags are checks you opt into. TypeScript 6.0 turns strict on by default; in older projects you set it yourself.', focus: ['cfg'] }
		]
	},

	// ───────────── modules-and-declaration-files ─────────────
	{
		id: 'ts-declaration-file',
		topic: 'typescript',
		group: 'modules-and-declaration-files',
		title: 'A declaration file describes JavaScript',
		blurb: 'How does TypeScript learn the types of a plain JavaScript library?',
		nodes: [
			{ id: 'lib', kind: 'box', x: 16, y: 20, w: 150, h: 50, label: 'lib.js', sub: 'plain JavaScript, no types', visible: true },
			{ id: 'dts', kind: 'doc', x: 176, y: 16, w: 168, title: 'lib.d.ts', lines: ['export function add(', '  a: number,', '  b: number): number;'], tone: 'accent' },
			{ id: 'e1', kind: 'edge', from: 'dts', to: 'lib', tone: 'accent', dashed: true },
			{ id: 'app', kind: 'doc', x: 16, y: 128, w: 328, title: 'app.ts', lines: ['import { add } from "lib";', 'add(1, "2");   // error', 'add(1, 2);     // ok'] },
			{ id: 'res', kind: 'box', x: 16, y: 220, w: 328, h: 40, label: 'TS7016: could not find a declaration file for module "lib"', tone: 'warn' },
			{ id: 'note', kind: 'text', x: 16, y: 280, w: 312, size: 'sm', text: 'At runtime Node loads lib.js. The .d.ts is only read by the checker.' }
		],
		steps: [
			{ say: 'lib.js is a plain JavaScript library. It works at runtime, but TypeScript cannot see any types in it.', focus: ['lib'] },
			{ say: 'Importing it from TypeScript under noImplicitAny is an error: there is no declaration file, so the module is implicitly any.', show: ['app', 'res'], set: { app: { hl: [0] } }, pulse: ['res'] },
			{ say: 'A .d.ts file describes the library\'s types without containing any code. It sits beside the JavaScript it describes.', show: ['dts', 'e1'], pulse: ['dts'] },
			{
				say: 'With the declaration in place, add(1, "2") is an error and add(1, 2) is fine. The checker now knows the signature.',
				set: { app: { hl: [1] }, res: { tone: 'neg', label: 'Error: "2" is not assignable to number' } },
				pulse: ['res']
			},
			{ say: 'The .d.ts is only as accurate as its author. It is read by the checker only, so nothing verifies that it matches the real library.', show: ['note'], set: { app: { hl: [] } } },
			{
				say: 'A .d.ts with a top-level import or export is a module; without them it is a global script. declare module "*.svg" belongs in a script.',
				set: { dts: { title: 'svg.d.ts (no imports or exports)', lines: ['declare module "*.svg" {', '  const src: string;', '  export default src;', '}'] } },
				pulse: ['dts']
			}
		]
	},

	// ───────────── react-and-next-typing ─────────────
	{
		id: 'ts-react-props',
		topic: 'typescript',
		group: 'react-and-next-typing',
		title: 'Typing props, params and hooks',
		blurb: 'How do React and Next.js code get checked by TypeScript?',
		nodes: [
			{ id: 'props', kind: 'doc', x: 16, y: 16, w: 160, title: 'type CardProps', lines: ['{ title: string;', '  onSave: () => void }'], visible: true },
			{ id: 'comp', kind: 'box', x: 200, y: 30, w: 144, h: 44, label: '<Card />', sub: 'function component' },
			{ id: 'e1', kind: 'edge', from: 'props', to: 'comp' },
			{ id: 'usage', kind: 'doc', x: 16, y: 110, w: 328, title: 'usage', lines: ['<Card title="Hi" onSave={save} />', '<Card title={5} onSave={save} />', '<Card title="Hi" />'] },
			{ id: 'res', kind: 'box', x: 16, y: 206, w: 328, h: 44, label: 'OK: both props are present and typed correctly', tone: 'accent' },
			{
				id: 'next', kind: 'doc', x: 16, y: 110, w: 328, title: 'app/blog/[slug]/page.tsx',
				lines: ['export default async function Page(', '  { params }: {', '    params: Promise<{ slug: string }>', '  }) {', '  const { slug } = await params;', '}']
			},
			{ id: 'res2', kind: 'box', x: 16, y: 248, w: 328, h: 40, label: 'Next.js 15 and later: params is a Promise, read it with await', tone: 'accent' }
		],
		steps: [
			{ say: 'Props are an ordinary type. This one says a Card needs a string title and an onSave function.', focus: ['props'] },
			{ say: 'The component takes those props, so TypeScript now checks every place the component is used.', show: ['comp', 'e1'], pulse: ['comp'] },
			{ say: 'This usage passes both props with the right types, so it compiles.', show: ['usage', 'res'], set: { usage: { hl: [0] } }, pulse: ['res'] },
			{ say: 'title={5} passes a number where a string is required, so the editor flags it.', set: { usage: { hl: [1] }, res: { tone: 'neg', label: 'Error: number is not assignable to string' } }, pulse: ['res'] },
			{ say: 'Leaving out onSave is an error too, because it is required.', set: { usage: { hl: [2] }, res: { tone: 'neg', label: 'Error: property onSave is missing' } }, pulse: ['res'] },
			{ say: 'In Next.js 15 and later, params arrives as a Promise. You read it with await, and the type says so.', hide: ['usage', 'res'], show: ['next', 'res2'], set: { next: { hl: [2, 4] } }, pulse: ['res2'] },
			{
				say: 'Hooks infer their types from the arguments. When the starting value is null or missing, spell the type out.',
				set: { next: { title: 'hooks', lines: ['const [n] = useState(0);', 'const [u] = useState<User | null>(null);', 'const [x] = useState<number>();'], hl: [] }, res2: { label: 'n is number, u is User | null, x is number | undefined' } },
				pulse: ['res2']
			}
		]
	},

	// ───────────── type-safe-validation ─────────────
	{
		id: 'ts-runtime-validation',
		topic: 'typescript',
		group: 'type-safe-validation',
		title: 'Checking data at the boundary',
		blurb: 'How do you trust data that arrives after the types are gone?',
		nodes: [
			{ id: 'b1', kind: 'box', x: 92, y: 14, w: 176, h: 44, label: 'Network JSON', sub: 'type: unknown', tone: 'warn', visible: true },
			{ id: 'b2', kind: 'box', x: 92, y: 90, w: 176, h: 44, label: 'schema.parse(data)', sub: 'checks at runtime' },
			{ id: 'err', kind: 'box', x: 278, y: 90, w: 74, h: 44, label: 'throws', sub: 'bad data', tone: 'neg' },
			{ id: 'b3', kind: 'box', x: 92, y: 170, w: 176, h: 44, label: 'User', sub: 'z.infer<typeof schema>', tone: 'accent' },
			{ id: 'e1', kind: 'edge', from: 'b1', to: 'b2' },
			{ id: 'e2', kind: 'edge', from: 'b2', to: 'b3', tone: 'accent' },
			{ id: 'e3', kind: 'edge', from: 'b2', to: 'err', tone: 'neg' },
			{ id: 'note', kind: 'text', x: 16, y: 244, w: 312, size: 'sm', text: 'The type is derived from the schema, so the check and the type cannot drift apart.' }
		],
		steps: [
			{ say: 'Types vanish at runtime. Data from a fetch, a form or JSON.parse is just unknown until something checks it.', focus: ['b1'] },
			{ say: 'A schema describes the expected shape once. parse checks the real data against it while the program runs.', show: ['b2', 'e1'], pulse: ['b2'] },
			{ say: 'Bad data fails right here, at the edge, with a clear error, instead of crashing later somewhere unrelated.', show: ['err', 'e3'], pulse: ['err'] },
			{ say: 'Good data comes out as a User. The TypeScript type is derived from the schema with z.infer, so the two cannot disagree.', show: ['b3', 'e2'], pulse: ['b3'] },
			{ say: 'z.infer is what parse returns, and z.input is what it accepts. They differ when a schema has a default or a transform.', show: ['note'], set: { b3: { sub: 'z.infer = what parse returns' } } }
		]
	}
];
