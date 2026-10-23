import type { LearnEngine, DbTopic } from './types';
import { regroup } from './regroup';
import { typescriptQuestions } from '../prep2/questions/typescript';

const md = (...lines: string[]) => lines.join('\n');

// `try` snippets run in the in-app playground, which strips types (no type checking), so they show what happens at RUNTIME.
const topics: DbTopic[] = [
	{
		id: 'types-and-inference',
		title: 'Types, inference and erasure',
		level: 'basic',
		summary: 'See what TypeScript checks, what it infers for you, and why none of it exists at runtime.',
		scenes: ['ts-compile-vs-runtime', 'ts-structural-typing'],
		notes: md(
			'TypeScript adds a type system on top of JavaScript. The checker reads your code, works out the type of every value, and reports mismatches before anything runs. Then it **erases** the types, so the JavaScript that ships contains none of them.',
			'',
			'- **Inference:** `const n = 5` is already a `number`. Annotate where inference cannot help: function parameters and the edges of your public API.',
			'- **Structural typing:** a value fits a type if it has the right shape. Names do not matter.',
			'- **Control flow:** the type of a variable can change as the code moves through branches.',
			'- **Assertions are promises, not checks:** `x as T` tells the compiler to trust you. Nothing is converted at runtime.',
			'',
			'```ts',
			'let id = 5;                               // inferred: number',
			'id = "five";                              // error',
			'const p: { x: number } = { x: 1, y: 2 }; // error: y is extra on a fresh literal',
			'```',
			'',
			'**Common trap:** `as` cannot make wrong data right. `JSON.parse(text) as User` compiles whether or not the data really is a `User`, so validate data that comes from outside.'
		),
		try: [
			{ label: 'Types are erased: only runtime values remain', code: `const n: number = 5;\nconst label: string = String(n);\nconsole.log(typeof n, typeof label);` },
			{ label: 'An "as" cast does not convert the data', code: `type User = { age: number };\nconst user = JSON.parse('{"age":"41"}') as User;\nconsole.log(typeof user.age, user.age + 1);` }
		]
	},
	{
		id: 'unions-and-narrowing',
		title: 'Unions and narrowing',
		level: 'basic',
		summary: 'Use values that can be one of several types by checking which one they are.',
		scenes: ['ts-union-narrowing', 'ts-discriminated-union'],
		notes: md(
			'A union such as `string | number` says a value is one of several types. Until you **narrow** it, you can only use what **all** members share.',
			'',
			'Checks the compiler understands:',
			'',
			'- `typeof v === "string"`, `Array.isArray(v)`, `v instanceof Date`',
			'- `"kind" in v`, `v === null`, and truthiness',
			'- equality on a literal tag, as in `s.kind === "circle"`',
			'',
			'Give every member of a union a literal `kind` field and you get a **discriminated union**: after the check the compiler keeps exactly one member. Add a `never` check in a `default` branch and a forgotten member becomes a compile error.',
			'',
			'```ts',
			'type Shape = { kind: "circle"; r: number } | { kind: "square"; side: number };',
			'function area(s: Shape) {',
			'  if (s.kind === "circle") return Math.PI * s.r ** 2;',
			'  return s.side ** 2;   // s is the square here',
			'}',
			'```',
			'',
			'**Common trap:** `typeof null` is `"object"`, so `typeof v === "object"` narrows to `object | null`. Rule out `null` as well before you read properties.'
		),
		try: [
			{ label: 'typeof narrows at runtime too', code: `function show(id: string | number) {\n  return typeof id === "string" ? id.toUpperCase() : id.toFixed(2);\n}\nconsole.log(show("ab"), show(3));` },
			{ label: 'The typeof null quirk, and Array.isArray', code: `console.log(typeof null, typeof [], Array.isArray([]));` },
			{ label: 'A discriminated union with a switch', code: `type Shape = { kind: "circle"; r: number } | { kind: "square"; side: number };\nfunction area(s: Shape): number {\n  switch (s.kind) {\n    case "circle": return Math.round(Math.PI * s.r ** 2);\n    case "square": return s.side ** 2;\n  }\n}\nconsole.log(area({ kind: "circle", r: 2 }), area({ kind: "square", side: 3 }));` }
		]
	},
	{
		id: 'interfaces-vs-type-aliases',
		title: 'Interfaces vs type aliases',
		level: 'basic',
		summary: 'Know the few real differences, so the choice stops being a debate.',
		scenes: ['ts-interface-vs-alias'],
		notes: md(
			'Both describe object shapes, and for plain objects they are interchangeable. The differences are small but real.',
			'',
			'- **Interfaces merge.** Declaring `interface User` twice combines the members. Libraries rely on this so you can add fields to types such as `Window`. A type alias cannot be declared twice.',
			'- **Type aliases can name anything:** unions, tuples, primitives, mapped and conditional types. Interfaces only describe object shapes.',
			'- **Extending:** `interface B extends A` reports an error if a field conflicts. `A & B` does not: a conflicting field quietly becomes `never`.',
			'- A class can `implements` an interface or an object-shaped alias, but not a union alias.',
			'',
			'```ts',
			'interface User { name: string }',
			'interface User { age: number }   // merged: { name; age }',
			'type Id = string | number;       // only a type alias can do this',
			'```',
			'',
			'A sensible default: use `interface` for object shapes you expect to extend, `type` for everything else, and stay consistent inside a codebase.',
			'',
			'**Common trap:** intersections hide conflicts. `{ x: string } & { x: number }` is accepted as a type, but its `x` is `never`, so you can never build a value of it. Prefer `extends` when you want conflicts caught at the declaration.'
		)
	},
	{
		id: 'functions-and-overloads',
		title: 'Functions and overloads',
		level: 'mid',
		summary: 'Type callbacks correctly and describe functions whose result depends on their input.',
		scenes: ['ts-function-overloads'],
		notes: md(
			'Parameters need annotations; return types are usually inferred. A function **type** describes what a callback must look like: `(x: number) => string`.',
			'',
			'- **`void` callbacks:** a function type returning `void` accepts functions that return anything, and the value is ignored. A function declaration annotated `: void` cannot return a value.',
			'- **Optional and default parameters:** `(a: string, b?: number)`. A default value makes a parameter optional.',
			'- **Overloads** list several signatures above one implementation. The checker tries them top to bottom and takes the **first** match. Callers never see the implementation signature.',
			'',
			'```ts',
			'function conv(x: string): number;',
			'function conv(x: number): string;',
			'function conv(x: string | number) {',
			'  return typeof x === "string" ? Number(x) : String(x);',
			'}',
			'```',
			'',
			'**Common trap:** put the most specific overload first. A catch-all such as `(x: unknown)` listed before `(x: string)` matches every call, so the more precise return type is never used.'
		),
		try: [
			{ label: 'One implementation behind two signatures', code: `function conv(x: string): number;\nfunction conv(x: number): string;\nfunction conv(x: string | number) {\n  return typeof x === "string" ? Number(x) : String(x);\n}\nconsole.log(conv("42") + 1, conv(7) + 1);` }
		]
	},
	{
		id: 'generics',
		title: 'Generics',
		level: 'mid',
		summary: 'Write one function or type that works for many types without losing the connection between them.',
		scenes: ['ts-generic-instantiation', 'ts-generic-constraint'],
		notes: md(
			'A **generic** has a type parameter: a placeholder filled in at each use. It keeps the link between input and output types that `any` would throw away.',
			'',
			'```ts',
			'function first<T>(items: T[]): T | undefined {',
			'  return items[0];',
			'}',
			'first([1, 2]);   // T is number',
			'first(["a"]);    // T is string',
			'```',
			'',
			'- **Inference:** you rarely write `<string>`. TypeScript infers `T` from the arguments.',
			'- **Constraints:** `T extends { length: number }` accepts any type with at least that shape, and lets you use `.length` inside.',
			'- **Several arguments, one `T`:** with `same<T>(a: T, b: T)`, the call `same(1, "a")` fails, because `T` is inferred from the first argument. Use separate type parameters, or `same<string | number>(1, "a")`.',
			'- **Helpers:** a `const` type parameter keeps literal and tuple types of inline arguments (TS 5.0), and `NoInfer<T>` stops one position from widening `T` (TS 5.4).',
			'',
			'**Common trap:** a type parameter used only once adds nothing over `unknown`. A generic earns its place by linking two or more positions.'
		),
		try: [
			{ label: 'A generic function at runtime', code: `function first<T>(items: T[]): T | undefined {\n  return items[0];\n}\nconsole.log(first([10, 20]), first(["a", "b"]), first([]));` }
		]
	},
	{
		id: 'utility-types',
		title: 'Utility types',
		level: 'mid',
		summary: 'Derive new types from existing ones with built-in helpers instead of copying fields.',
		scenes: ['ts-utility-types'],
		notes: md(
			'Utility types are built-in generics that transform an existing type, so you never copy a field list by hand.',
			'',
			'- `Partial<T>` and `Required<T>`: every field optional, or every field required.',
			'- `Pick<T, K>` and `Omit<T, K>`: keep, or drop, the listed keys.',
			'- `Readonly<T>`: top-level fields become `readonly`.',
			'- `Record<K, V>`: an object with keys `K` and values `V`.',
			'- `ReturnType<typeof fn>`, `Parameters<typeof fn>` and `Awaited<T>`: types taken from functions and promises.',
			'',
			'```ts',
			'type User = { id: number; name: string; email: string };',
			'type Draft = Partial<User>;                // all optional',
			'type Preview = Pick<User, "id" | "name">;  // { id; name }',
			'type Loaded = Awaited<ReturnType<typeof getUser>>;',
			'```',
			'',
			'**Common trap:** `Readonly<T>` is shallow. `r.tags = []` is an error, but `r.tags.push("x")` still compiles because the array inside is mutable. Use `readonly string[]` for the inner level.'
		),
		try: [
			{ label: 'Readonly is shallow: the array inside can still change', code: `const o = Object.freeze({ tags: ["a"] });\no.tags.push("b");\nconsole.log(o.tags, Object.isFrozen(o), Object.isFrozen(o.tags));` },
			{ label: 'Pick and Omit written by hand', code: `const user = { id: 1, name: "Asha", email: "a@x.io" };\nconst { email, ...withoutEmail } = user;\nconst preview = { id: user.id, name: user.name };\nconsole.log(withoutEmail, preview);` }
		]
	},
	{
		id: 'keyof-and-indexed-access',
		title: 'keyof and indexed access',
		level: 'mid',
		summary: 'Refer to the keys and value types of an object type, and build functions that only accept real keys.',
		scenes: ['ts-keyof-indexed'],
		notes: md(
			'`keyof T` is the union of a type\'s key names. An **indexed access** type `T[K]` is the type of the value at key `K`. Together they let a function accept only real keys and return the right value type.',
			'',
			'```ts',
			'type User = { id: number; name: string; active: boolean };',
			'type Key = keyof User;        // "id" | "name" | "active"',
			'type N = User["name"];        // string',
			'type V = User[keyof User];    // number | string | boolean',
			'',
			'function get<T, K extends keyof T>(obj: T, key: K): T[K] {',
			'  return obj[key];',
			'}',
			'```',
			'',
			'`Array[number]` is the element type of an array, so `string[][number]` is `string`. For an `as const` object, `(typeof Colors)[keyof typeof Colors]` gives the union of its values.',
			'',
			'**Common trap:** `Object.keys(user)` returns `string[]`, not `(keyof User)[]`, because objects can carry extra properties at runtime. If you know the shape is exact, cast the result.'
		),
		try: [
			{ label: 'Object.keys gives plain strings', code: `const user = { id: 1, name: "Asha" };\nconst keys = Object.keys(user) as (keyof typeof user)[];\nconsole.log(keys, typeof keys[0]);` },
			{ label: 'A typed get helper', code: `function get<T, K extends keyof T>(obj: T, key: K): T[K] {\n  return obj[key];\n}\nconst user = { id: 1, name: "Asha" };\nconsole.log(get(user, "name"), get(user, "id"));` }
		]
	},
	{
		id: 'mapped-types',
		title: 'Mapped types',
		level: 'advanced',
		summary: 'Loop over the keys of a type to build a new one, add or remove modifiers, and rename keys.',
		scenes: ['ts-mapped-type'],
		notes: md(
			'A **mapped type** loops over keys and builds a new object type: `{ [K in keyof T]: ... }`. Built-ins such as `Partial` and `Readonly` are written this way.',
			'',
			'```ts',
			'type Optional<T> = { [K in keyof T]?: T[K] };',
			'type Mutable<T> = { -readonly [K in keyof T]-?: T[K] };',
			'type Getters<T> = {',
			'  [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K];',
			'};',
			'```',
			'',
			'- A `?` or `readonly` modifier adds the flag; a `-` in front removes it.',
			'- `as` **remaps keys**. With a template literal you can rename them, and mapping a key to `never` drops it.',
			'- Looping over a union of names, not `keyof T`, builds a type from any list of keys.',
			'',
			'**Common trap:** a recursive `DeepReadonly` that maps over everything also maps over function types and turns them into plain objects. Check for functions first and return them unchanged.'
		),
		try: [
			{ label: 'The same idea at runtime: loop over the keys', code: `const user = { id: 1, name: "Asha" };\nconst getters = Object.fromEntries(\n  Object.entries(user).map(([k, v]) => ["get" + k[0].toUpperCase() + k.slice(1), () => v])\n);\nconsole.log(Object.keys(getters), getters.getName());` }
		]
	},
	{
		id: 'conditional-types-and-infer',
		title: 'Conditional types and infer',
		level: 'advanced',
		summary: 'Choose a type with an if/else at the type level, and pull types out of other types.',
		scenes: ['ts-conditional-infer'],
		notes: md(
			'A **conditional type** picks one of two types depending on a check: `T extends U ? X : Y`. With `infer` it can also pull a type out of the one it matches.',
			'',
			'```ts',
			'type Elem<T> = T extends (infer U)[] ? U : T;',
			'type A = Elem<string[]>;   // string',
			'type B = Elem<number>;     // number',
			'',
			'type Unwrap<T> = T extends Promise<infer R> ? R : T;',
			'```',
			'',
			'- **Distribution:** when `T` is a bare type parameter, a union is checked one member at a time and the results are joined. `Elem<string[] | number>` is `string | number`.',
			'- **Turn it off** by wrapping both sides in a tuple: `[T] extends [U] ? X : Y`.',
			'- `ReturnType`, `Parameters` and `Awaited` are built with `infer`.',
			'',
			'**Common trap:** `T extends never ? true : false` gives `never` for `T = never`, because `never` is a union with no members and there is nothing to distribute over. Write `[T] extends [never] ? true : false` to get `true`.'
		)
	},
	{
		id: 'unknown-any-never',
		title: 'unknown, any and never',
		level: 'mid',
		summary: 'Pick the right special type: any switches checks off, unknown keeps them, never is the empty type.',
		scenes: ['ts-unknown-any-never'],
		notes: md(
			'Three special types, three jobs.',
			'',
			'- **`any`** turns type checking off for a value. Anything goes in and anything comes out, and mistakes surface at runtime.',
			'- **`unknown`** is the type-safe top type: any value can be assigned to it, but you must narrow it before you can use it.',
			'- **`never`** is the empty type: no value has it. It is the return type of a function that never returns, such as `(): never => { throw ... }` (an unannotated function declaration that always throws is inferred as `void`), and what is left after every case of a union has been handled.',
			'',
			'```ts',
			'function parse(v: unknown) {',
			'  if (typeof v === "string") return v.toUpperCase();',
			'  throw new Error("expected a string");',
			'}',
			'function assertNever(x: never): never {',
			'  throw new Error("unhandled: " + x);',
			'}',
			'```',
			'',
			'Call `assertNever(shape)` in the `default` of a `switch` over a union, and adding a member without handling it becomes a compile error.',
			'',
			'**Common trap:** `{}` is not "an empty object". It accepts everything except `null` and `undefined` (even `1`), `object` excludes primitives, and `unknown` accepts everything.'
		),
		try: [
			{ label: 'unknown forces a check before use', code: `function parse(v: unknown) {\n  if (typeof v === "string") return v.toUpperCase();\n  throw new Error("expected a string");\n}\nconsole.log(parse("ok"));\ntry { parse(42); } catch (e) { console.log((e as Error).message); }` },
			{ label: 'assertNever in a switch', code: `type Light = "red" | "green";\nfunction assertNever(x: never): never {\n  throw new Error("unhandled: " + x);\n}\nfunction go(l: Light) {\n  switch (l) {\n    case "red": return "stop";\n    case "green": return "go";\n    default: return assertNever(l);\n  }\n}\nconsole.log(go("red"), go("green"));` }
		]
	},
	{
		id: 'literals-satisfies-and-enums',
		title: 'Literals, as const, satisfies and enums',
		level: 'mid',
		summary: 'Keep exact values in your types, check shapes without losing them, and choose between enums and unions.',
		scenes: ['ts-satisfies-as-const'],
		notes: md(
			'TypeScript widens literals when a value might change. `const mode = "dark"` keeps the type `"dark"`, but `{ mode: "dark" }` has `mode: string`, because the property could be reassigned.',
			'',
			'- **`as const`** freezes the literal types and makes everything `readonly`.',
			'- **`satisfies`** checks a value against a type **without changing** its inferred type, so exact keys and literals survive.',
			'- **Enums vs unions:** an `enum` is real runtime code, and a string enum does not accept the plain string `"active"`. A union of string literals is erased and often simpler. `erasableSyntaxOnly` rejects enums.',
			'',
			'```ts',
			'const routes = { home: "/", blog: "/blog" } as const satisfies Record<string, string>;',
			'type Route = (typeof routes)[keyof typeof routes];   // "/" | "/blog"',
			'```',
			'',
			'`as const satisfies T` gives you both: exact literals and a check against the contract.',
			'',
			'**Common trap:** an annotation such as `const conf: Record<string, X> = {...}` replaces the inferred type, so every key looks valid. With `satisfies`, `keyof typeof conf` stays exact and a typo in a lookup is an error.'
		),
		try: [
			{ label: 'An enum is real runtime code', code: `enum Status { Active = "active", Off = "off" }\nconsole.log(Status, Status.Active);` },
			{ label: 'An as const object and the values it holds', code: `const Colors = { red: "#f00", green: "#0f0" } as const;\nconsole.log(Object.keys(Colors), Object.values(Colors));` }
		]
	},
	{
		id: 'tsconfig-and-strict',
		title: 'tsconfig and strict mode',
		level: 'mid',
		summary: 'Know which compiler flags matter and what each one catches.',
		scenes: ['ts-tsconfig-strict'],
		notes: md(
			'`tsconfig.json` controls what the checker enforces and how modules are resolved. The big switch is **`strict`**, a bundle of checks (`strictNullChecks`, `noImplicitAny`, `strictFunctionTypes` and more). It is on by default from TypeScript 6.0; older projects set it explicitly.',
			'',
			'- **`noUncheckedIndexedAccess`** makes `arr[0]` and `record[key]` include `undefined`. It is not part of `strict`.',
			'- **`exactOptionalPropertyTypes`** separates "missing" from "explicitly `undefined`".',
			'- **`verbatimModuleSyntax`** keeps imports as written, so types need `import type`.',
			'- **`moduleResolution`:** `"bundler"` allows extensionless relative imports; `"nodenext"` follows Node\'s ESM rules and wants `./a.js`.',
			'- **`types`:** from TypeScript 6.0 it defaults to empty, so list globals you need, such as `"node"`.',
			'',
			'```json',
			'{ "compilerOptions": { "strict": true, "noUncheckedIndexedAccess": true } }',
			'```',
			'',
			'**Common trap:** `paths` aliases such as `@/*` only teach the type checker where files live. `tsc` does not rewrite the imports, so the bundler must resolve them too. Next.js does this for you.'
		),
		try: [
			{ label: 'Why noUncheckedIndexedAccess exists', code: `const arr = [1, 2, 3];\nconsole.log(arr[5], arr[5] === undefined);\nconst [first] = [] as number[];\nconsole.log(first);` }
		]
	},
	{
		id: 'modules-and-declaration-files',
		title: 'Modules and declaration files',
		level: 'mid',
		summary: 'Describe JavaScript to the checker, and avoid the module-versus-script pitfalls.',
		scenes: ['ts-declaration-file'],
		notes: md(
			'A **declaration file** (`.d.ts`) describes JavaScript to the checker without containing code. That is how plain JS libraries get types, and how you describe things the compiler cannot see, such as `.svg` imports.',
			'',
			'```ts',
			'// svg.d.ts  (no imports or exports)',
			'declare module "*.svg" {',
			'  const src: string;',
			'  export default src;',
			'}',
			'```',
			'',
			'- A file with a top-level `import` or `export` is a **module**; one without is a **script**. In a module, `declare module "x"` augments an existing module, which is why `"*.svg"` fails there.',
			'- `declare global { ... }` inside a module adds globals, for example to type `process.env`.',
			'- `isolatedModules` and `verbatimModuleSyntax` exist because tools like SWC and esbuild compile one file at a time. Re-export types with `export type { User } from "./types"`.',
			'- A `.d.ts` is only as accurate as its author. Types are erased, so nothing checks that it matches the real library.',
			'',
			'**Common trap:** with `verbatimModuleSyntax`, `import { User } from "./types"` for an interface is an error. Write `import type { User }` or `import { type User }`.'
		)
	},
	{
		id: 'react-and-next-typing',
		title: 'Typing React and Next.js',
		level: 'mid',
		summary: 'Type props, hooks, events and the Next.js App Router the way current typings expect.',
		scenes: ['ts-react-props'],
		notes: md(
			'Component props are an ordinary type. In current `@types/react` (React 19), `JSX` lives at `React.JSX`, and `React.FC` no longer adds `children`, so most code uses plain functions and declares children itself.',
			'',
			'```tsx',
			'type CardProps = { title: string; children?: React.ReactNode };',
			'function Card({ title, children }: CardProps) {',
			'  return <section><h2>{title}</h2>{children}</section>;',
			'}',
			'```',
			'',
			'- **Hooks infer from arguments:** `useState(0)` is a `number`. `useState<User | null>(null)` needs the type spelled out, and `useState<number>()` is `number | undefined`.',
			'- **Events** have their own types, such as `React.MouseEvent<HTMLButtonElement>` for `onClick`.',
			'- **Next.js 15 and later** passes `params` and `searchParams` as **Promises**: `params: Promise<{ slug: string }>`, read with `await`. `typedRoutes: true` checks `href` against your real routes.',
			'- `export const metadata: Metadata` gets checking and autocomplete from `next`.',
			'',
			'**Common trap:** `<Card>hello</Card>` fails if `children` is typed `React.ReactElement`, because a string is not an element. Use `React.ReactNode` for anything renderable.'
		)
	},
	{
		id: 'type-safe-validation',
		title: 'Runtime validation and types',
		level: 'mid',
		summary: 'Check data that arrives at runtime, and derive the type from the check so they cannot drift apart.',
		scenes: ['ts-runtime-validation'],
		notes: md(
			'Types are erased, so they cannot protect you from data that arrives at runtime: a fetch response, form input, a `JSON.parse` result. A **schema library** such as zod describes the shape once, checks real data against it, and derives the TypeScript type from it so the two cannot drift apart.',
			'',
			'```ts',
			'const User = z.object({ id: z.number(), name: z.string() });',
			'type User = z.infer<typeof User>;',
			'',
			'const user = User.parse(await res.json());   // throws on bad data',
			'```',
			'',
			'- Treat outside data as `unknown` until it has passed the check.',
			'- `z.infer` (the same as `z.output`) is what `parse` **returns**; `z.input` is what it **accepts**. They differ when a schema has a `default` or a `transform`.',
			'- Use the input type for form default values and the output type for the parsed result.',
			'',
			'**Common trap:** `as User` skips every check. It compiles for any data and fails later, far from where the bad value entered.'
		),
		try: [
			{ label: 'A hand-written check at the boundary', code: `function parseUser(data: unknown): { id: number; name: string } {\n  const d = data as Record<string, unknown>;\n  if (typeof d?.id !== "number" || typeof d?.name !== "string") throw new Error("not a user");\n  return { id: d.id, name: d.name };\n}\nconsole.log(parseUser(JSON.parse('{"id":1,"name":"Asha"}')));\ntry { parseUser(JSON.parse('{"id":"1"}')); } catch (e) { console.log((e as Error).message); }` }
		]
	}
];

// The quiz re-uses the existing 100-question TypeScript bank (src/prep2/questions/typescript.ts), regrouped by tag so each
// quiz chip lines up with a topic above. Question ids are unchanged, so saved "missed" progress carries over.
const { questions, quizTopics } = regroup(typescriptQuestions, 'typescript', [
	{ id: 'types-and-inference', label: 'Types and inference', tags: ['types', 'objects', 'collections', 'inference', 'assertions', 'interfaces', 'literal-types', 'as-const', 'satisfies', 'enums', 'branded-types'] },
	{ id: 'unions-and-narrowing', label: 'Unions and narrowing', tags: ['unions', 'narrowing'] },
	{ id: 'generics', label: 'Functions and generics', tags: ['functions', 'overloads', 'generics', 'variance'] },
	{ id: 'utility-types', label: 'Utility types and keys', tags: ['utility-types', 'keyof', 'indexed-access', 'tuples'] },
	{ id: 'mapped-types', label: 'Mapped and conditional', tags: ['mapped-types', 'conditional-types', 'template-literal-types'] },
	{ id: 'tsconfig-and-strict', label: 'Config and modules', tags: ['config', 'declaration-merging', 'declaration-files', 'resource-management'] },
	{ id: 'react-and-next-typing', label: 'React and Next typing', tags: ['react-types', 'next-types', 'zod'] }
]);

export const typescript: LearnEngine = {
	id: 'typescript',
	name: 'TypeScript',
	tagline: 'Types that catch bugs before you run the code, from inference to generics and strict mode.',
	topics,
	questions,
	quizTopics,
	playground: 'js',
	quizBlurb: 'TypeScript types, narrowing, generics, configuration and typing React and Next.js'
};
