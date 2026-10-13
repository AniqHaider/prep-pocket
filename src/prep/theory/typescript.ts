import type { Theory } from '../types';

export const typescriptTheory: Theory = {
	id: 'typescript',
	title: 'TypeScript',
	tagline: 'Introduce TypeScript confidently, explain the mental model, and show where it pays off.',
	sections: [
		{
			id: 'pitch',
			heading: 'Your opening (30 seconds)',
			say: "TypeScript is JavaScript with a static type system that is checked at build time and then erased — what runs in the browser is plain JavaScript. It gives me safer refactors, editor autocomplete, and it documents the shape of data moving between components, APIs and state. I use it strictly: strict mode on, no implicit any, and I model state with unions and discriminated unions so invalid states are hard to represent. The key thing I keep in mind is that types don't exist at runtime, so anything coming from outside — JSON, user input, URLs — needs real validation, not just a type assertion.",
			points: [
				'Keywords: static, structural, erased at compile time, strict mode, narrowing, generics, discriminated unions.',
				'End with the runtime-boundary point — it shows maturity.',
				'Give one concrete payoff: catching a null/undefined bug or a breaking refactor at compile time.'
			],
			tip: 'If you only remember one thing: types are a compile-time contract, not runtime validation.'
		},
		{
			id: 'model',
			heading: 'The mental model',
			say: "Three ideas explain most of TypeScript. First, it's structural: a value is compatible with a type if it has the required shape, regardless of names or classes. Second, it's erased: types produce no runtime code, so they can't protect me from bad data at runtime. Third, it does control-flow analysis: after a check like typeof or an equality test, the compiler narrows a union to the specific member inside that branch.",
			points: [
				'**Structural typing** (duck typing at compile time) vs nominal typing (Java/C#).',
				'**Erasure**: `interface`, `type`, generics, annotations vanish; only things like `enum`, `namespace` and constructor parameter properties emit code.',
				'**Control-flow narrowing**: `typeof`, `instanceof`, `in`, `===`, truthiness, user-defined guards.',
				'**Inference first**: annotate boundaries (function params, exported APIs); let inference handle locals.'
			]
		},
		{
			id: 'basics',
			heading: 'Everyday types and inference',
			say: "I annotate public boundaries — function parameters and exported types — and let inference handle the rest. A const keeps its literal type, while a let widens to string or number. For structures I use interfaces or type aliases, arrays and tuples, optional properties with a question mark, and readonly where something shouldn't change.",
			points: [
				'Primitives are lowercase: `string`, `number`, `boolean`, `bigint`, `symbol`; avoid wrapper types `String`/`Number`.',
				'`const c = "hi"` → `"hi"`; `let l = "hi"` → `string` (widening).',
				'Optional `name?: string` → `string | undefined`.',
				'`readonly` is compile-time only; `Object.freeze` for runtime.',
				'Tuples `[string, number]` for fixed-length, positional data.',
				'`as const` keeps literals and makes data readonly — great for deriving unions from values.'
			],
			code: {
				title: 'Deriving a type from a value',
				text: `const roles = ['admin', 'editor', 'viewer'] as const;
type Role = typeof roles[number]; // 'admin' | 'editor' | 'viewer'`
			}
		},
		{
			id: 'unions',
			heading: 'Unions, narrowing and discriminated unions',
			say: "Unions let me say a value is one of several things, and narrowing lets me safely work with each. My favourite pattern is a discriminated union for UI state: loading, success with data, error with message. Because each member has a literal kind or status field, the compiler narrows inside a switch, and with a never check in the default branch it tells me when I forget to handle a new case.",
			points: [
				'Narrow with `typeof`, `instanceof`, `in`, equality, and custom guards `x is Foo`.',
				'Discriminated union = shared literal property (`status`, `kind`, `type`).',
				'Exhaustiveness: assign to `never` in `default` so new members cause a compile error.',
				'Model state so impossible states are unrepresentable (no `{ loading: true, data, error }` bag of optionals).'
			],
			code: {
				title: 'Async state as a discriminated union',
				text: `type Remote<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

function view(r: Remote<User>) {
  switch (r.status) {
    case 'success': return r.data.name;      // data exists here
    case 'error':   return r.message;
    case 'loading': return 'Loading…';
    case 'idle':    return '';
    default: { const _x: never = r; return _x; }
  }
}`
			}
		},
		{
			id: 'special',
			heading: 'any, unknown, never, void',
			say: "any turns the checker off, so I avoid it. unknown is the safe top type — it accepts anything but forces me to narrow before using it, which is what I use for data from outside. never is the empty type: a function that always throws returns never, and it's also how I implement exhaustive checks. void just means the return value should be ignored.",
			points: [
				'`any` — opt-out; spreads silently. Ban with `noImplicitAny` and lint rules.',
				'`unknown` — safe top type; must narrow (typeof/instanceof/validation).',
				'`never` — no possible value; unreachable code, exhaustiveness checks, impossible intersections.',
				'`void` — "ignore the return"; `undefined` — an actual value.',
				'`catch (e)` is `unknown` under strict → narrow with `e instanceof Error`.'
			]
		},
		{
			id: 'objects',
			heading: 'Interfaces vs type aliases, and object modelling',
			say: "For object shapes either works. I use interfaces for public object contracts that others may extend or augment, because interfaces can merge, and type aliases when I need unions, tuples, mapped or conditional types. Consistency in a codebase matters more than the choice itself.",
			points: [
				'Both are erased; both can extend (`interface A extends B`, `type A = B & {...}`).',
				'Only `interface` supports declaration merging (augmenting library/global types, e.g. SvelteKit `App.Locals`).',
				'Only `type` can name unions, tuples, primitives, mapped/conditional types.',
				'Excess property checks apply to fresh object literals only.',
				'Index signatures `{ [k: string]: T }` claim every key exists; prefer `Record`, `Map`, or `noUncheckedIndexedAccess`.'
			]
		},
		{
			id: 'generics',
			heading: 'Generics',
			say: "Generics let me write reusable code that preserves type relationships — instead of returning any, a function returns whatever type was passed in. I add constraints with extends when the function needs a certain shape, like an id field, and defaults for the common case. In practice I use generics for API helpers, typed collections, and components that render lists of any item type.",
			points: [
				'`function first<T>(xs: T[]): T | undefined`',
				'Constraints: `<T extends { id: string }>`; relate params: `<T, K extends keyof T>(obj: T, key: K): T[K]`',
				'Defaults: `type Box<T = string>`',
				'Inference usually fills type args; specify them explicitly only when inference can\'t.',
				'Generic components in Svelte: `<script lang="ts" generics="T extends { id: string }">`.'
			],
			code: {
				title: 'Relating two parameters',
				text: `function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((i) => i[key]);
}
const names = pluck([{ id: 1, name: 'a' }], 'name'); // string[]`
			}
		},
		{
			id: 'utility',
			heading: 'Utility types you should be able to name',
			say: "I lean on the built-in utility types rather than rewriting shapes. Partial for update payloads, Pick and Omit to derive views of a type, Record for lookups, ReturnType and Parameters to follow a function's signature, and Awaited to unwrap promises. They keep one source of truth, so when the base type changes everything derived updates with it.",
			points: [
				'`Partial<T>`, `Required<T>`, `Readonly<T>` — change optionality/mutability.',
				'`Pick<T,K>`, `Omit<T,K>` — select/remove keys.',
				'`Record<K,V>` — object with keys K and values V.',
				'`Exclude<U,X>`, `Extract<U,X>`, `NonNullable<T>` — operate on unions.',
				'`ReturnType<typeof fn>`, `Parameters<typeof fn>`, `Awaited<Promise<T>>` — derive from functions/promises.'
			]
		},
		{
			id: 'advanced',
			heading: 'Mapped, conditional, template literal types (the "mid" level)',
			say: "Under the hood the utility types are built from mapped and conditional types. A mapped type iterates over keys, a conditional type picks a result with extends, and infer lets me capture part of a type — that's how ReturnType and Awaited work. Template literal types build string types, like turning click into onClick. I use these sparingly — mostly in library-style code — because readability matters.",
			points: [
				'Mapped: `{ [K in keyof T]: boolean }` (+/- `readonly` and `?` modifiers).',
				'Conditional: `T extends string ? A : B` — **distributes over unions** when T is a naked type parameter.',
				'`infer`: `T extends Promise<infer U> ? U : T`.',
				'Template literal types build string types, e.g. on + Capitalize<E> turns click into onClick for event handler names.',
				'Rule: complex type gymnastics need a comment and a test (`expectTypeOf`).'
			],
			code: {
				title: 'Distribution and infer',
				text: `type IsString<T> = T extends string ? true : false;
type A = IsString<'a' | 1>; // boolean (true | false)

type Unwrap<T> = T extends Promise<infer U> ? U : T;
type B = Unwrap<Promise<number>>; // number`
			}
		},
		{
			id: 'strict',
			heading: 'Strictness and tsconfig',
			say: "I always turn on strict mode — it includes strictNullChecks, which stops null and undefined sneaking into every type, and noImplicitAny. I also like noUncheckedIndexedAccess so array and index lookups include undefined, and verbatimModuleSyntax or isolatedModules with type-only imports so bundlers can transpile each file independently.",
			points: [
				'`strict: true` = `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `useUnknownInCatchVariables`, …',
				'`noUncheckedIndexedAccess` — index reads become `T | undefined` (not part of `strict`).',
				'`isolatedModules` / `verbatimModuleSyntax` — required by esbuild/Vite/SWC; use `import type`.',
				'`moduleResolution: "bundler"` for Vite/SvelteKit projects.',
				'Types do not change emitted JS (except enums etc.); transpilation vs type-checking are separate steps — Vite transpiles, `tsc`/`svelte-check` check.'
			]
		},
		{
			id: 'runtime',
			heading: 'The runtime boundary (say this — it separates juniors from seniors)',
			say: "A type assertion like as User on JSON.parse output is just me telling the compiler to trust me — there's no runtime effect. For data crossing a boundary — API responses, form input, URL params, localStorage — I validate with a schema library such as Zod or Valibot and infer the TypeScript type from the schema, so the runtime check and the static type can never drift apart.",
			points: [
				'`as` and `!` change what the compiler believes, not what exists at runtime.',
				'Validate at boundaries: API responses, form data, env vars, storage, postMessage.',
				'Derive types from schemas: `type User = z.infer<typeof UserSchema>`.',
				'Or write small type guards: `function isUser(x: unknown): x is User`.',
				'Parse, don\'t just cast: convert unknown → trusted once, at the edge.'
			],
			code: {
				title: 'Guard at the edge',
				text: `function isQuote(x: unknown): x is Quote {
  return typeof x === 'object' && x !== null
    && typeof (x as Quote).symbol === 'string'
    && typeof (x as Quote).ltp === 'number';
}
const raw: unknown = await res.json();
if (!isQuote(raw)) throw new Error('bad payload');`
			}
		},
		{
			id: 'with-svelte',
			heading: 'TypeScript with Svelte & SvelteKit',
			say: "In Svelte I add lang ts to the script block. I type props by annotating the destructured $props, give $state a generic when the initial value isn't enough — like null that later holds a User — and use the Snippet type for children. In SvelteKit the generated types from ./$types give me typed load functions, params and page data, and I run svelte-check in CI to type-check both TypeScript and templates.",
			points: [
				'Props: `let { title, count = 0 }: Props = $props();`',
				'State: `let user = $state<User | null>(null);` — supply the generic when the initial value is too narrow.',
				'Children/snippets: `import type { Snippet } from "svelte"`.',
				'Element attributes: `import type { HTMLButtonAttributes } from "svelte/elements"`.',
				'SvelteKit: `import type { PageLoad } from "./$types"`; `data` prop is typed from load; `App.Locals`/`App.PageData` augment via interface merging.',
				'`svelte-check` type-checks `.svelte` files; Vite only transpiles (no type errors at dev time).',
				'Note: svelte-check did not support TypeScript 7 in my setup — pinned `typescript@~6`.'
			],
			code: {
				title: 'Typed load + page',
				text: `// +page.ts
import type { PageLoad } from './$types';
export const load: PageLoad = async ({ fetch, params }) => {
  const res = await fetch('/api/items/' + params.id);
  return { item: (await res.json()) as Item }; // validate in real code
};

// +page.svelte
let { data } = $props(); // data.item is Item`
			}
		},
		{
			id: 'story',
			heading: 'Connect it to YOUR experience',
			say: "In my storefront work, TypeScript was how I kept a large widget architecture coherent: each widget has typed props — a generic WidgetProps with data and settings types — a variant registry, and typed templates, so wiring a section into a theme is checked by the compiler. I've used type-only imports to keep bundles clean, and I hit real runtime-boundary issues, like editor schemas whose field shapes the types couldn't enforce, which reinforced validating at the edges.",
			points: [
				'Use a concrete example: typed widget props (`WidgetProps<TData, TSettings>`) and variant registries.',
				'Mention a pre-commit gate: `tsc` via Husky; fix root causes rather than `--no-verify`.',
				'Mention a boundary bug: shape assumptions about external data (API/editor schema) that types alone did not catch.',
				'Be ready to describe a type you modelled with a discriminated union (e.g. loading/error/success UI state).'
			]
		},
		{
			id: 'followups',
			heading: 'Likely follow-up questions — short answers',
			points: [
				'**interface vs type?** Both describe objects; interfaces merge and extend, types do unions/tuples/mapped/conditional. Be consistent.',
				'**any vs unknown?** `any` disables checks; `unknown` forces narrowing — use it for external data.',
				'**What is structural typing?** Compatibility by shape, not by declared name.',
				'**What does `as const` do?** Keeps literal types and makes the value deeply readonly; zero runtime effect.',
				'**What is a type guard?** A runtime check the compiler understands, e.g. `typeof`, `in`, or `x is T`.',
				'**What is `satisfies`?** Validates an expression against a type while keeping its narrower inferred type.',
				'**Why `import type`?** Guarantees erasure; required by isolated-module transpilers.',
				'**`Partial<T>` vs optional fields?** `Partial` makes every property optional for patch payloads; optional fields are a deliberate part of the model.',
				'**How do you type an API response?** Define the type, validate at runtime (Zod/guard), derive the type from the schema.',
				'**Enum or union?** Prefer string-literal unions — no runtime code, easier JSON; enums only when you need reverse mapping/interop.'
			]
		},
		{
			id: 'pitfalls',
			heading: 'Pitfalls to name',
			points: [
				'Overusing `as` and `!` — silences the compiler, moves bugs to runtime.',
				'Using `||` where `??` was intended (0, "", false get replaced).',
				'Index signatures hiding missing keys (`obj[k]` typed as `T`, actually `undefined`).',
				'`Object.keys()` returns `string[]`, not `(keyof T)[]` — structural typing allows extra keys.',
				'Optional chaining result includes `undefined` — handle it.',
				'Mutating readonly arrays via casts; `readonly` is not runtime immutability.',
				'Overly clever types: if a teammate cannot read it, simplify.'
			]
		}
	]
};
