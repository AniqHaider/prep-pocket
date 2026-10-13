import { builder } from '../types';

const { out, add } = builder('T', 'typescript');

// ───────────────────────── Basics ─────────────────────────

add('basic', 'Which is the correct way to annotate a string variable?',
	'let name: string;',
	['let name: String;',
	 'let name: str;',
	 'let name: text;'],
	'Use lowercase primitive types (string, number, boolean). Uppercase String/Number/Boolean are the wrapper object types — they accept values you almost never want and are flagged by linters. str and text are not TypeScript types.');

add('basic', 'What is the inferred type of `c` here?',
	'"hi" — the literal type, because const can never be reassigned.',
	['string',
	 'any',
	 'String'],
	'For let, TypeScript widens a literal to its base type (string) because the value may change. For const it keeps the most specific literal type. This is why `const dir = "up"` can be passed where "up" | "down" is expected, but `let dir = "up"` cannot.',
	`const c = "hi";
let l = "hi";`);

add('basic', 'Why is `unknown` safer than `any` for untrusted data (like a parsed JSON response)?',
	'unknown forces you to narrow (typeof, instanceof, validation) before using the value; any switches type checking off.',
	['unknown is faster at runtime than any.',
	 'unknown automatically validates the data when assigned.',
	 'There is no difference; both accept any value and any operation.'],
	'Both types accept every value, but only `unknown` makes you prove what it is before you touch it. With `any`, `v.toFixed()` compiles even if v is a string and crashes at runtime. Neither one validates at runtime — types are erased.',
	`let v: unknown = JSON.parse(text);
v.toFixed();        // ❌ error
if (typeof v === "number") v.toFixed(); // ✅`);

add('basic', 'What is a key practical difference between interface and type alias?',
	'Interfaces can be re-opened (declaration merging) and extended; type aliases can additionally name unions, tuples and primitives.',
	['Only interfaces can describe object shapes.',
	 'Type aliases are erased at runtime but interfaces are kept.',
	 'Interfaces can be used for unions; type aliases cannot.'],
	'Both describe object shapes and are erased at compile time. Aliases are more flexible (type ID = string | number), while two interface declarations with the same name merge — useful for augmenting library types. Unions are only possible with type.');

add('basic', 'What is the type of `user.name` here?',
	'string | undefined',
	['string',
	 'string | null',
	 'string | undefined | null'],
	'An optional property (?) may be absent, so reading it yields undefined. It does not include null — null must be added explicitly. You must handle undefined before using string methods.',
	`interface User { name?: string }
declare const user: User;
user.name;`);

add('basic', 'Inside the if block, what type does TypeScript give `x`?',
	'string — typeof narrowing refines the union.',
	['string | number',
	 'number',
	 'unknown'],
	'Control-flow analysis narrows union types after checks like typeof, instanceof, in, equality and truthiness. Inside the true branch x can only be a string; in the else branch it is number.',
	`function f(x: string | number) {
  if (typeof x === "string") {
    x; // ?
  }
}`);

add('mid', 'What makes this a discriminated union, and what does it buy you?',
	'A shared literal property (kind) lets TypeScript narrow to exactly one member in a switch/if, so only that member\'s fields are accessible.',
	['It uses an enum, which is required for unions to narrow.',
	 'It makes the shapes assignable to each other.',
	 'It adds runtime type checks automatically.'],
	'The literal `kind` property is the discriminant. In case "circle" TypeScript knows the value is the circle member, so `shape.radius` is valid and `shape.side` is an error. It is the idiomatic way to model variants/state machines, and it works at compile time only.',
	`type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number };

function area(s: Shape) {
  switch (s.kind) {
    case "circle": return Math.PI * s.radius ** 2;
    case "square": return s.side ** 2;
  }
}`);

add('basic', 'What does readonly do on a property?',
	'The compiler rejects assignments to it after initialisation — a compile-time check only; there is no runtime freezing.',
	['It freezes the object at runtime via Object.freeze.',
	 'It makes the property private.',
	 'It makes the property optional.'],
	'readonly is purely a type-system rule. JavaScript code (or a type assertion) can still mutate the value at runtime. Use Object.freeze if you need runtime immutability.');

add('basic', 'What is the difference between `string[]` and `readonly string[]`?',
	'readonly string[] has no mutating methods (push, pop, splice…), so you cannot modify it through that reference.',
	['They are identical; readonly only matters for objects.',
	 'readonly string[] cannot be iterated.',
	 'string[] is fixed length, readonly string[] is not.'],
	'ReadonlyArray removes the mutators from the type. A mutable string[] is assignable to readonly string[] (safe), but not the other way around (that would let you mutate something promised to be read-only).');

add('basic', 'What does the tuple type [string, number] express?',
	'An array with exactly two elements: a string at index 0 and a number at index 1.',
	['An array of any length whose elements are strings or numbers.',
	 'An object with properties 0 and 1 that are optional.',
	 'A Map from string to number.'],
	'Tuples encode fixed length and per-position types. (string | number)[] is the "any length, mixed" version. Tuples are what useState-style functions return and what Promise.all infers for its results.');

add('mid', 'Why do many teams prefer string-literal unions over enums?',
	'Unions have no runtime code (erased), work well with inference and JSON, and avoid enum quirks like numeric reverse mappings.',
	['Enums are not supported in TypeScript 5.',
	 'Unions are checked at runtime but enums are not.',
	 'Enums cannot be used as object keys.'],
	'type Status = "idle" | "loading" | "done" compiles to nothing and is easy to serialise. A regular enum emits an object at runtime (extra bytes, bundler/isolatedModules friction). Enums are still supported — it is a style/trade-off choice.');

add('mid', 'What does `as const` do to an array/object literal?',
	'It makes it deeply readonly and keeps literal types, so ["up","down"] becomes readonly ["up","down"].',
	['It converts the value to a constant at runtime.',
	 'It makes the variable non-nullable.',
	 'It widens literals to their base types.'],
	'as const is a compile-time assertion: no runtime change. It is how you derive unions from values: `typeof dirs[number]` becomes "up" | "down" instead of string.',
	`const dirs = ["up", "down"] as const;
type Dir = typeof dirs[number]; // "up" | "down"`);

add('basic', 'What is `keyof` for the type { a: 1; b: 2 }?',
	'"a" | "b"',
	['string',
	 '1 | 2',
	 '["a", "b"]'],
	'keyof produces the union of an object type\'s known property names. Values would be T[keyof T] (1 | 2). It underpins safe property access helpers like getProp<T, K extends keyof T>.');

add('basic', 'What does `typeof` do in a type position?',
	'It captures the static type of a value, e.g. type Config = typeof defaultConfig.',
	['It returns the runtime type string such as "object".',
	 'It converts a type into a value.',
	 'It checks the type at runtime and throws on mismatch.'],
	'In expressions typeof returns a runtime string, but in type annotations it is a type query that reads the compile-time type of a variable. That lets you avoid duplicating a shape you already have as a value.');

add('basic', 'What problem do generics solve in `function identity<T>(x: T): T`?',
	'They link input and output types: pass a number, get a number back, with no loss of type information.',
	['They make the function run faster.',
	 'They allow any type and turn off checking, like any.',
	 'They check types at runtime.'],
	'Using any would return any, losing information. A type parameter T is inferred per call, so identity("a") is string and identity(5) is number. Generics are erased at runtime.');

add('mid', 'What does the constraint in `<T extends { id: number }>` do?',
	'It allows only types that have at least an id: number, and lets the function body safely read t.id.',
	['It forces T to be exactly { id: number } and nothing else.',
	 'It makes id optional on T.',
	 'It adds an id property to T at runtime.'],
	'extends in a generic parameter means "is assignable to". Extra properties are fine (structural typing) — the constraint just guarantees the minimum shape you rely on.');

// ───────────────────────── Utility types ─────────────────────────

add('basic', 'What does Partial<User> produce?',
	'A type where every property of User is optional.',
	['A type with only the first property of User.',
	 'A type where every property is readonly.',
	 'A type where every property can be null.'],
	'Partial<T> maps each key to optional (?). It is common for update/patch payloads. Readonly<T> is the readonly counterpart and Required<T> removes optionality.');

add('basic', 'How do you create a type from User without the password field?',
	'Omit<User, "password">',
	['Pick<User, "password">',
	 'Exclude<User, "password">',
	 'Remove<User, "password">'],
	'Omit<T, K> drops the listed keys. Pick keeps only the listed keys (the opposite). Exclude works on union members, not object keys, and Remove is not a built-in utility.');

add('basic', 'What does Record<string, number> describe?',
	'An object whose keys are strings and all values are numbers.',
	['An array of strings and numbers.',
	 'A Map instance.',
	 'An object with exactly one string key.'],
	'Record<K, V> builds an object type with keys K and values V. It is equivalent to { [key: string]: number }. With a literal union for K you get required keys: Record<"a" | "b", number>.');

add('mid', 'How do you get the return type of an existing function without redeclaring it?',
	'type R = ReturnType<typeof fn>',
	['type R = typeof fn()',
	 'type R = Returns<fn>',
	 'type R = fn.returnType'],
	'ReturnType takes a function TYPE, so you pass typeof fn. Calling the function inside a type position is not allowed, and Returns / fn.returnType do not exist.');

add('mid', 'What does Parameters<typeof fn> give you?',
	'A tuple type of fn\'s parameter types, e.g. [id: number, opts?: Options].',
	['A union of the parameter names.',
	 'The type of the first parameter only.',
	 'An object type keyed by parameter name.'],
	'Parameters<T> returns a tuple, which keeps order, optionality and labels. Use Parameters<typeof fn>[0] for the first one. It is handy when wrapping functions (debounce, memoize) and keeping their signature.');

add('mid', 'What is the type of `r` when `fetchUser` is async and returns a User?',
	'Promise<User>',
	['User',
	 'User | Error',
	 'Awaited<User>'],
	'An async function always returns a Promise, even if you return a plain value. `await` gives you User, and Awaited<Promise<User>> would resolve to User. A thrown error is not reflected in the return type.',
	`async function fetchUser(): Promise<User> { /* ... */ }
const r = fetchUser();`);

add('mid', 'What does Awaited<Promise<Promise<string>>> evaluate to?',
	'string — it unwraps nested promises recursively.',
	['Promise<string>',
	 'Promise<Promise<string>>',
	 'unknown'],
	'Awaited<T> mirrors what `await` does at runtime, flattening thenables recursively. It is used in the typing of Promise.all and many async helpers.');

add('mid', 'What do Exclude<"a" | "b" | "c", "a"> and Extract<"a" | "b" | "c", "a" | "b"> produce?',
	'"b" | "c" and "a" | "b" respectively.',
	['"a" and "b" | "c" respectively.',
	 '"b" | "c" for both.',
	 'never for both.'],
	'Exclude removes union members assignable to the second argument; Extract keeps only those that are. They operate on unions, not object properties (that is Omit/Pick).');

add('basic', 'What is NonNullable<string | null | undefined>?',
	'string',
	['string | null',
	 'never',
	 'undefined'],
	'NonNullable<T> removes null and undefined from a type. It is commonly used after filtering: array.filter(Boolean) alone does not narrow, but a type guard returning x is NonNullable<T> does.');

// ───────────────────────── Special types & safety ─────────────────────────

add('mid', 'What is the point of assigning `s` to a variable of type `never` in the default branch?',
	'It makes the compiler error if a new union member is added but not handled — an exhaustiveness check.',
	['It silences compiler errors for that branch.',
	 'It converts the value to a string at runtime.',
	 'It stops the function from returning undefined.'],
	'After all cases are handled, `s` has type never. If someone adds a new Shape, s is no longer never in the default branch and the assignment fails to compile, pointing you at the unhandled case.',
	`function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return 1;
    case "square": return 2;
    default: {
      const _exhaustive: never = s;
      return _exhaustive;
    }
  }
}`);

add('basic', 'What return type does a function that always throws have, and why?',
	'never — the function never completes normally.',
	['void',
	 'undefined',
	 'null'],
	'void means "returns but you should ignore the value"; never means "does not return at all" (throws or loops forever). That lets the compiler know code after the call is unreachable and narrows control flow accordingly.');

add('basic', 'What does the non-null assertion operator (x!) do?',
	'It tells the compiler to treat x as non-null/undefined, without any runtime check — if it is actually null you get a runtime error.',
	['It throws an error if x is null.',
	 'It converts null to an empty value.',
	 'It makes the variable required in the type.'],
	'! only changes what TypeScript believes. Use it sparingly (e.g. document.getElementById("app")! when you control the HTML); prefer a real check or optional chaining when the value can genuinely be missing.');

add('mid', 'What guarantee does `const user = JSON.parse(text) as User` give?',
	'None at runtime — it is only a compile-time claim; the parsed data can have any shape.',
	['It validates that the JSON matches User.',
	 'It throws if a field is missing.',
	 'It strips extra properties.'],
	'Type assertions do not emit code. For external data use a runtime validator (Zod, Valibot, hand-written type guards) and derive the type from it. Otherwise your types will lie and crash later.');

add('basic', 'What is the result of `0 ?? 5` versus `0 || 5`?',
	'0 for ??, and 5 for || — ?? only falls back on null/undefined.',
	['Both give 5.',
	 'Both give 0.',
	 '5 for ??, and 0 for ||.'],
	'|| falls back for any falsy value (0, "", false, NaN, null, undefined), which is a common bug with counts and empty strings. ?? (nullish coalescing) falls back only for null and undefined, so legitimate 0 and "" survive.');

add('basic', 'What does `user?.address?.city` return when user is undefined?',
	'undefined, without throwing — optional chaining short-circuits the whole chain.',
	['A TypeError: cannot read properties of undefined.',
	 'null',
	 'An empty string.'],
	'?. stops evaluating at the first null/undefined and yields undefined. The resulting type includes undefined, so TypeScript makes you handle it (often with ?? "fallback").');

add('mid', 'What does `strictNullChecks` change?',
	'null and undefined stop being assignable to every type; you must include them explicitly in unions and handle them before use.',
	['It makes all properties optional.',
	 'It disables type inference.',
	 'It adds runtime null checks to the emitted JavaScript.'],
	'With it off, `let s: string = null` compiles — a major source of "cannot read properties of null" crashes. With it on (part of "strict"), the compiler forces string | null and checks. It never changes emitted JS.');

add('mid', 'Which safely reads `message` from an unknown caught error?',
	'catch (e) { if (e instanceof Error) console.log(e.message); }',
	['catch (e: Error) { console.log(e.message); }',
	 'catch (e) { console.log(e.message); } — always safe because e is Error',
	 'catch (e) { console.log(e!.message); }'],
	'Under strict mode caught values are `unknown` (useUnknownInCatchVariables) because anything can be thrown — strings, objects, undefined. You must narrow first. Annotating e as Error is not allowed and a non-null assertion does not narrow the type.');

// ───────────────────────── Functions & narrowing helpers ─────────────────────────

add('basic', 'Where must optional parameters appear in a function signature?',
	'After all required parameters: (a: number, b?: number).',
	['Before required parameters.',
	 'Anywhere; order does not matter.',
	 'Optional parameters are not supported; use undefined defaults only.'],
	'A required parameter cannot follow an optional one, because callers could not omit the optional without shifting positions. A default value (b = 1) also makes the parameter optional for callers.');

add('mid', 'What is true about function overloads in TypeScript?',
	'You write several call signatures followed by one implementation signature; callers see only the overload signatures, not the implementation one.',
	['Each overload has its own separate implementation body.',
	 'Callers can use the implementation signature directly.',
	 'Overloads are resolved at runtime based on argument types.'],
	'Overloads are a type-level feature. The single implementation must be general enough to handle all overloads and does its own runtime branching (typeof checks). Overload resolution happens in the compiler, top to bottom.',
	`function parse(x: string): number;
function parse(x: number): string;
function parse(x: string | number) {
  return typeof x === "string" ? Number(x) : String(x);
}`);

add('mid', 'What does the return type `x is string` do in a type guard?',
	'When the function returns true, TypeScript narrows the argument to string in the calling code.',
	['It returns the string value of x.',
	 'It throws if x is not a string.',
	 'It converts x to a string.'],
	'A user-defined type predicate links a boolean result to a type refinement. The compiler trusts it — if your check is wrong, you have introduced a hole, so keep guards simple and accurate.',
	`function isString(x: unknown): x is string {
  return typeof x === "string";
}`);

add('mid', 'What advantage does `satisfies` have over a type annotation?',
	'It validates the value against a type but keeps the more specific inferred type (e.g. literal keys/values).',
	['It converts the value to the checked type at runtime.',
	 'It makes the value readonly.',
	 'It widens the value to the annotated type.'],
	'With `const c: Record<string, number> = { a: 1 }`, c.b compiles (index signature) and the key a is forgotten. With `satisfies`, the object is checked but remains { a: number }, so c.b is an error and autocomplete still knows a.',
	`const c = { a: 1 } satisfies Record<string, number>;
c.a; // ok
c.b; // error`);

add('mid', 'What does an index signature { [key: string]: number } imply when you read obj.foo?',
	'The type is number (not number | undefined) unless noUncheckedIndexedAccess is enabled.',
	['It is always number | undefined.',
	 'It is a compile error because foo is not declared.',
	 'It is any.'],
	'Index signatures claim every string key exists. That is a lie for missing keys, which is why noUncheckedIndexedAccess (not part of strict) adds | undefined to indexed reads. Consider Map or Partial<Record<...>> when keys can be absent.');

// ───────────────────────── Classes ─────────────────────────

add('mid', 'How does TypeScript `private` differ from the JavaScript #private field?',
	'`private` is a compile-time check only (the property still exists at runtime); #field is truly private at runtime.',
	['They are identical in behaviour.',
	 '`private` is enforced at runtime; #field is only a type check.',
	 '#field can be accessed from subclasses; `private` cannot.'],
	'TypeScript `private` is erased, so obj["secret"] or plain JS can read it. #secret uses the language-level private field and throws/does not exist outside the class. `protected` allows subclass access; #fields do not.');

add('basic', 'What does `constructor(private name: string) {}` do?',
	'It declares the parameter and creates + assigns a private property this.name in one step (parameter property shorthand).',
	['It only declares a parameter; you still need to assign this.name.',
	 'It makes name a static property.',
	 'It makes the constructor private.'],
	'Adding an accessibility modifier (public/private/protected/readonly) to a constructor parameter makes TypeScript declare and assign the field for you. It saves boilerplate but is TypeScript-specific syntax that needs the compiler to transform it.');

add('basic', 'What happens if you try `new Shape()` when Shape is an abstract class?',
	'A compile error: abstract classes cannot be instantiated; you must extend them and implement abstract members.',
	['It works, and abstract methods return undefined.',
	 'It throws only at runtime.',
	 'It creates a read-only instance.'],
	'abstract classes define a partial implementation and required members (abstract methods) for subclasses. They exist for sharing code while forcing subclasses to provide specifics.');

// ───────────────────────── Advanced-ish (mid) ─────────────────────────

add('mid', 'What type does this mapped type produce for Flags<{ a: string; b: number }>?',
	'{ a: boolean; b: boolean }',
	['{ a: string; b: number }',
	 'boolean',
	 '("a" | "b")[]'],
	'A mapped type iterates over keys: [K in keyof T] visits "a" and "b", and each value type is replaced by boolean. Partial, Readonly, Record and Pick are all built with this pattern.',
	`type Flags<T> = { [K in keyof T]: boolean };`);

add('mid', 'What does IsString<"a" | 1> evaluate to?',
	'boolean (true | false) — conditional types distribute over each union member.',
	['true',
	 'false',
	 'never'],
	'When the checked type is a naked type parameter, TypeScript evaluates the conditional once per union member and unions the results: IsString<"a"> = true, IsString<1> = false, so the final type is true | false = boolean. Wrapping in a tuple ([T] extends [string]) disables distribution.',
	`type IsString<T> = T extends string ? true : false;
type R = IsString<"a" | 1>;`);

add('mid', 'What does `infer U` do in a conditional type?',
	'It captures part of the matched type into a new type variable U that you can use in the true branch.',
	['It infers the runtime type of a value.',
	 'It makes U optional.',
	 'It forces U to be a string.'],
	'infer works only inside the extends clause of a conditional type. Unwrap<Promise<number>> matches Promise<infer U> and binds U = number. Built-ins such as ReturnType and Awaited use it.',
	`type Unwrap<T> = T extends Promise<infer U> ? U : T;
type A = Unwrap<Promise<number>>; // number`);

add('mid', 'What is `on${Capitalize<"click" | "focus">}` as a type?',
	'"onClick" | "onFocus"',
	['"onclick" | "onfocus"',
	 'string',
	 '"on" | "Click" | "Focus"'],
	'Template literal types build string types from unions; they distribute, producing every combination. Capitalize is an intrinsic string-manipulation type. This is how libraries type event handler names like onClick.',
	'type Handler = `on${Capitalize<"click" | "focus">}`;');

add('basic', 'Why does assigning an object literal with an extra property to a typed variable error, while assigning a variable does not?',
	'Fresh object literals get excess property checking to catch typos; values from variables are only checked structurally.',
	['TypeScript only checks literals at runtime.',
	 'Variables are always typed as any.',
	 'It is a bug in the compiler.'],
	'Excess property checks apply to "fresh" literals directly assigned/passed — the extra key is most likely a typo. Once the object is stored in a variable it is no longer fresh, and structural typing (extra props allowed) applies.',
	`interface P { x: number }
const a: P = { x: 1, y: 2 };   // ❌ excess property
const tmp = { x: 1, y: 2 };
const b: P = tmp;              // ✅`);

add('basic', 'TypeScript uses structural typing. What does that mean?',
	'Types are compatible if their shapes match; the declared name or class does not matter.',
	['Types are compatible only if they come from the same declaration.',
	 'All objects are compared by reference.',
	 'Classes can only be assigned to their own interfaces.'],
	'If an object has the properties a type requires, it is assignable — duck typing checked at compile time. That is why you can pass a plain object where an interface (or class instance type) is expected, provided the shape fits.');

add('mid', 'What does `Promise.all([fetchNum(), fetchStr()])` infer when fetchNum(): Promise<number> and fetchStr(): Promise<string>?',
	'Promise<[number, string]> — a tuple preserving each position\'s type.',
	['Promise<(number | string)[]>',
	 'Promise<any[]>',
	 'Promise<number>'],
	'Promise.all\'s typings are tuple-aware, so destructuring `const [n, s] = await ...` gives n: number and s: string. The union-array form appears only if you pass a non-tuple array.');

add('mid', 'What does `import type { User } from "./types"` guarantee?',
	'The import is erased entirely at compile time and can only be used as a type.',
	['The module is still loaded at runtime for side effects.',
	 'The import becomes lazy-loaded.',
	 'User can be used as a value as well.'],
	'Type-only imports avoid accidental runtime imports (and circular dependency or bundling issues), and are required in some setups (isolatedModules / verbatimModuleSyntax) so that tools which transpile one file at a time know what to drop.');

add('mid', 'Given `type Box<T = string> = { value: T }`, what is `Box` with no type argument?',
	'{ value: string } — the default type parameter is used.',
	['A compile error: T must be provided.',
	 '{ value: unknown }',
	 '{ value: any }'],
	'Defaults make generic parameters optional, similar to default function arguments. They are useful for API clients and components where the common case needs no explicit type.');



export const typescriptQuestions = out;
