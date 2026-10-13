import type { Theory } from '../types';

export const svelteTheory: Theory = {
	id: 'svelte',
	title: 'Svelte & SvelteKit',
	tagline: 'How to introduce Svelte in an interview, then go as deep as they want.',
	sections: [
		{
			id: 'pitch',
			heading: 'Your opening (30 seconds)',
			say: "Svelte is a compiler-based UI framework. Instead of shipping a big runtime that diffs a virtual DOM, it compiles each component at build time into small, targeted code that updates exactly the DOM nodes that depend on changed state. In Svelte 5 that reactivity is explicit through runes — $state, $derived and $effect — which are built on signals. SvelteKit sits on top and gives routing, server rendering, data loading and form handling. I come from React and Next.js, so I think in component boundaries, state ownership and rendering cost — Svelte moves a lot of that cost from runtime to compile time.",
			points: [
				'Say "compiler", "no virtual DOM", "runes", "signals", "SvelteKit" — those are the keywords they are listening for.',
				'Be honest about your background (React/Next) in one sentence, then pivot to what you built in Svelte.',
				'Offer to go deeper: "happy to walk through reactivity, SvelteKit rendering modes, or a PWA I built."'
			],
			tip: 'If you only remember one thing: Svelte does the work at build time, so the browser does less.'
		},
		{
			id: 'compiler',
			heading: 'What "Svelte is a compiler" actually means',
			say: "A .svelte file is not interpreted at runtime. The compiler reads the template and script, figures out which values are reactive and which DOM nodes depend on them, and emits plain JavaScript that creates the DOM once and then patches only what changed. That's why there's no virtual DOM diffing step and why bundles tend to be small — you only ship the runtime helpers you actually use.",
			points: [
				'Component script runs **once** per instance (unlike React where the function re-runs on each render).',
				'Updates are fine-grained: a text node bound to `count` is updated directly when `count` changes.',
				'Scoped CSS is also compile-time: selectors get a hash class, unused CSS is flagged/removed.',
				'Trade-off: reactivity needs compiler syntax (runes, `.svelte.ts` files) — you cannot use `$state` in a plain `.ts` file.'
			]
		},
		{
			id: 'anatomy',
			heading: 'Component anatomy',
			say: "A component is just a file with up to three parts: a script block, markup, and a style block, all optional. Styles are scoped by default, so I don't fight global CSS; when I really need global I use :global. Markup supports expressions in braces and control-flow blocks like if, each and await.",
			points: [
				'`<script lang="ts">` for logic, markup directly in the file, `<style>` scoped to the component.',
				'Multiple root nodes are allowed; no wrapper element or `export default`.',
				'`:global(...)` to escape scoping; child components are **not** styled by parent CSS unless via `:global` or CSS variables/props.',
				'In Svelte 5 you instantiate with `mount(App, { target })`, not `new App()`.'
			],
			code: {
				title: 'Counter.svelte',
				text: `<script lang="ts">
  let count = $state(0);
  const double = $derived(count * 2);
</script>

<button onclick={() => count++}>
  {count} × 2 = {double}
</button>

<style>
  button { padding: 8px 12px; } /* scoped */
</style>`
			}
		},
		{
			id: 'runes',
			heading: 'Reactivity with runes',
			say: "In Svelte 5, reactivity is opt-in and explicit. $state creates reactive state; objects and arrays become deep reactive proxies, so push and property assignment just work. $derived is a cached computed value that updates when its dependencies change. $effect is for side effects — it runs after the DOM updates and re-runs when the reactive values it read change. Compared to Svelte 4, which inferred reactivity from top-level let and dollar-colon statements, runes make it obvious what is reactive and they work in modules, not only in components.",
			points: [
				'`$state(x)` — deep reactive proxy for plain objects/arrays; `$state.raw` skips the proxy (reassign only) — good for big immutable data.',
				'`$state.snapshot(obj)` — plain copy for `structuredClone`, `postMessage`, JSON, logging.',
				'`$derived(expr)` and `$derived.by(() => {...})` — synchronous, cached, lazily recomputed.',
				'Gotcha: destructuring `let { count } = counter` takes a one-time snapshot — reactivity lives in property access.',
				'Gotcha: you cannot export a **reassigned** `$state` from a module — export an object and mutate it, or export getters.'
			],
			code: {
				title: 'Deep reactivity',
				text: `let todos = $state([{ text: 'learn runes', done: false }]);

todos.push({ text: 'ship', done: false }); // updates the UI
todos[0].done = true;                       // updates the UI

const remaining = $derived(todos.filter((t) => !t.done).length);`
			},
			tip: 'Mental model: $state = a signal you read/write like a normal variable; $derived = computed; $effect = subscriber.'
		},
		{
			id: 'effects',
			heading: '$effect — when to use it and when not to',
			say: "$effect is an escape hatch for syncing with things outside Svelte — timers, subscriptions, canvas, analytics, DOM APIs. It tracks whatever reactive values it reads synchronously, and I can return a cleanup function that runs before the next run and on destroy. What I avoid is using it to compute state — that's $derived — or to react to a click, which belongs in an event handler. Misusing effects causes extra update cycles and hard-to-follow data flow.",
			points: [
				'Runs after DOM updates, in the browser only (not during SSR).',
				'No dependency array — dependencies are whatever was read synchronously during the run.',
				'Return a function for teardown (clear intervals, remove listeners, abort fetches).',
				'Do not pass an `async` function: you lose the cleanup return and reads after the first `await` are not tracked.',
				'`$effect.pre` runs before the DOM update (e.g. capture scroll position).',
				'Rule of thumb: derive → `$derived`; respond to user action → handler; sync with the outside world → `$effect`.'
			],
			code: {
				title: 'Effect with cleanup',
				text: `$effect(() => {
  const id = setInterval(refresh, intervalMs); // intervalMs is tracked
  return () => clearInterval(id);              // teardown
});`
			}
		},
		{
			id: 'props',
			heading: 'Props, events and composition',
			say: "Data flows down through props and events flow up through callback props. In Svelte 5 I destructure $props, give defaults inline, and type it with an interface. If a child needs to write back, it opts in with $bindable. For composition, content between a component's tags arrives as a children snippet, and I can pass named snippets for things like row or header templates — that replaces slots.",
			points: [
				'`let { title, count = 0 }: Props = $props();`',
				'Callback props instead of `createEventDispatcher` (deprecated): `onsave?.(data)`.',
				'`$bindable()` opts a prop into two-way `bind:`; otherwise binding is an error — keeps data flow explicit.',
				'`{@render children?.()}`; type it as `Snippet` from `svelte`.',
				'Forward remaining attributes: `let { class: klass, ...rest } = $props()` then `<button {...rest}>`.'
			],
			code: {
				title: 'Snippet as a prop',
				text: `<!-- List.svelte -->
<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  let { items, row }: { items: T[]; row: Snippet<[T]> } = $props();
</script>
<ul>{#each items as item}<li>{@render row(item)}</li>{/each}</ul>

<!-- usage -->
<List {items}>{#snippet row(u)}<b>{u.name}</b>{/snippet}</List>`
			}
		},
		{
			id: 'template',
			heading: 'Template blocks and bindings',
			say: "Control flow is done with blocks: if, each, await and key. For lists I always add a key so Svelte can match DOM nodes to items when they reorder, which preserves local state. Await blocks give me pending, resolved and error states without extra variables. For forms there are bind: directives, and for reusable DOM behaviour I write actions with the use: directive.",
			points: [
				'`{#if}{:else if}{:else}{/if}`, `{#each items as item (item.id)}`, `{#await p}{:then v}{:catch e}{/await}`, `{#key value}` to recreate.',
				'`bind:value`, `bind:checked`, `bind:group`, `bind:this` (set after mount — use in `onMount`/effects).',
				'Events are props: `onclick`, `oninput`, `onsubmit` — call `e.preventDefault()` yourself (the old `|preventDefault` modifier is gone).',
				'Actions: `use:clickOutside={fn}` — function(node, param) with optional `update`/`destroy`.',
				'`{@html}` skips escaping → XSS risk, only for trusted/sanitised content.'
			]
		},
		{
			id: 'shared',
			heading: 'Sharing state: modules, context, stores',
			say: "For shared client state I put runes in a .svelte.ts module — export an object or class with $state fields and functions that mutate it. For state that should be scoped to a subtree — like a form or a theme per widget — I use context with setContext and getContext, passing reactive objects. Stores still work, and the dollar prefix auto-subscribes, but for new code I'd usually reach for runes.",
			points: [
				'`counter.svelte.ts`: `export const counter = $state({ value: 0 })`.',
				'Context must be set/read during component initialisation; it is not reactive by itself.',
				'Stores (`writable`, `derived`, `readable`) still supported; `$store` auto-subscribes/unsubscribes.',
				'SSR caveat: module-level state is shared across requests on the server — keep per-user state in context/locals, not module singletons.'
			]
		},
		{
			id: 'kit',
			heading: 'SvelteKit essentials',
			say: "SvelteKit is the application framework: filesystem routing where folders are path segments and plus-page files are pages. Data comes from load functions — a +page.ts load is universal and runs on both server and client, while +page.server.ts is server-only, so that's where secrets and database access live. The page receives the result as a data prop. Layouts wrap child routes, +server.ts files are API endpoints, and form actions let plain HTML forms post to the server and be progressively enhanced with use:enhance.",
			points: [
				'Routing: `src/routes/blog/[slug]/+page.svelte`, `+layout.svelte` (`{@render children()}`), `+error.svelte`.',
				'`load` → `let { data } = $props()`. Universal (`+page.ts`) vs server-only (`+page.server.ts`).',
				'`+server.ts` exports `GET/POST/...` returning a `Response` (`json()` helper).',
				'Form actions: `export const actions` in `+page.server.ts`; `use:enhance` for fetch-based submit that still works without JS.',
				'`hooks.server.ts` → `handle` for auth/session/headers on every request; `event.locals` to pass data to loads.',
				'`redirect(303, url)` and `error(404, msg)` from `@sveltejs/kit` (no `throw` needed in Kit 2+).',
				'Env: only `PUBLIC_*` is exposed to the browser (`$env/static/public`).'
			],
			tip: 'Version detail worth knowing: SvelteKit 3 (what `sv create` installed for me) replaced `$service-worker` with `$app/manifest` + `$app/env`, and `$lib` with `#lib` package imports — always check the version in front of you.'
		},
		{
			id: 'rendering',
			heading: 'Rendering modes: SSR, CSR, prerender',
			say: "SvelteKit renders on the server by default and then hydrates in the browser. Per route I can switch that with page options: prerender to generate static HTML at build time, ssr false to behave like an SPA — which I used for an IndexedDB and Web Worker based PWA — or csr false to ship no JavaScript for content pages. I choose based on whether content is per-user, how SEO-sensitive it is, and how browser-bound the code is. It's the same trade-offs I made with Next.js static generation and revalidation, just configured differently.",
			points: [
				'`export const prerender = true` → static HTML at build (same for everyone: marketing/docs).',
				'`export const ssr = false` → SPA behaviour; no server HTML (browser-only APIs, logged-in dashboards).',
				'`export const csr = false` → no client JS (pure content, fastest).',
				'Adapters decide where it runs: `adapter-static`, `adapter-node`, Vercel/Cloudflare etc.',
				'Connect to experience: Next ISR (`revalidate: 30`) ≈ prerender + cache/revalidation strategy; the concept transfers.'
			]
		},
		{
			id: 'migration',
			heading: 'Svelte 4 → Svelte 5 cheat-sheet',
			say: "The big shift is from implicit to explicit reactivity. Top-level let becomes $state, dollar-colon statements become $derived or $effect, export let becomes $props, slots become snippets, on: directives become regular onclick attributes, and the event dispatcher becomes callback props. Old syntax still works in legacy mode, but you can't mix both styles in one component.",
			points: [
				'`let x = 0` (implicitly reactive) → `let x = $state(0)`',
				'`$: y = x * 2` → `let y = $derived(x * 2)`; `$: console.log(x)` → `$effect(...)`',
				'`export let a` → `let { a } = $props()`',
				'`<slot />` / named slots → `{@render children?.()}` / snippet props',
				'`on:click` → `onclick`; `createEventDispatcher` → callback props',
				'`new App({ target })` → `mount(App, { target })`',
				'Stores still work; `.svelte.ts` runes are the modern shared-state option.'
			]
		},
		{
			id: 'compare',
			heading: 'Svelte vs React vs Solid',
			say: "React re-runs component functions and diffs a virtual tree, so I manage memoisation by hand. Svelte compiles away the framework and updates the DOM directly, and its component code runs once. Solid is the closest cousin: it also uses fine-grained signals and runs components once, but you write JSX and read signals as functions, so you have to be careful not to destructure props. Svelte 5's runes are conceptually signals too, but with ordinary variable syntax and compiler support.",
			points: [
				'React: re-render + VDOM diff, hooks rules, `useMemo/useCallback/memo` for perf.',
				'Svelte: compile-time, runs once, fine-grained updates, less boilerplate, smaller runtime.',
				'Solid: JSX + explicit signals `count()`; components run once; destructuring props breaks reactivity.',
				'Ecosystem: React is largest; Svelte smaller but cohesive; always say the trade-off, not "X is better".',
				'Your angle: the mental model of one-way data flow and component boundaries transfers; what changes is how updates are scheduled.'
			]
		},
		{
			id: 'perf',
			heading: 'Performance, testing and tooling',
			say: "For performance I start by measuring with Lighthouse and the performance panel, then use the framework's strengths: fine-grained updates, keyed each blocks, route-level code splitting from SvelteKit, $state.raw for large immutable data, and moving heavy computation to a Web Worker. For quality I type-check with svelte-check, unit test with Vitest and the testing library, and lint and format with ESLint and Prettier, with Husky running them on commit.",
			points: [
				'Measure first (Core Web Vitals: LCP, INP, CLS); then fix: split code, lazy `import()` heavy libs, optimise images, avoid layout thrash.',
				'Keyed `{#each}` for stable DOM and state; virtualise very long lists.',
				'Avoid unnecessary `$effect` chains; prefer `$derived`.',
				'`$state.raw` for large datasets that are replaced wholesale.',
				'Tooling: `svelte-check` (types + a11y warnings), Vitest + `@testing-library/svelte`, Playwright for E2E, ESLint + Prettier (`prettier-plugin-svelte`), Husky + lint-staged.'
			]
		},
		{
			id: 'story',
			heading: 'Connect it to YOUR experience (be honest)',
			say: "My production depth is React and Next.js — I've built and owned storefronts end to end, with a shared widget architecture, typed component props, and performance tuning around ISR. For Svelte specifically, I built a gamified learning app in Svelte 5 with Vite, and for this role I built an offline-first SvelteKit PWA with a Workbox service worker, IndexedDB and a Comlink web worker. So I've applied the runes model and SvelteKit's SPA mode on real code, and I'm confident carrying my component-architecture and debugging experience over.",
			points: [
				'Own the gap in one sentence; follow with evidence: the apps you built.',
				'Mention a debugging story that shows depth in the platform (stale service-worker caches in dev — three stacked layers).',
				'Show learning velocity: "I picked up runes by building X; here is what surprised me."',
				'Surprises you can honestly mention: runes force explicit reactivity; destructuring loses reactivity; SvelteKit 3 renamed `$lib`/`$service-worker` APIs.'
			]
		},
		{
			id: 'followups',
			heading: 'Likely follow-up questions — short answers',
			points: [
				'**Why is there no virtual DOM?** The compiler knows at build time which DOM nodes depend on which state, so it emits direct updates.',
				'**When does a component re-run?** Its script runs once; only effects/derived/template expressions re-evaluate when their dependencies change.',
				'**$derived vs $effect?** Derived computes a value (pure, cached); effect performs side effects after DOM updates.',
				'**How do two sibling components share state?** A `.svelte.ts` module with a `$state` object, or context from a common parent.',
				'**What is hydration?** The browser attaches the client component to server-rendered HTML instead of re-creating it.',
				'**How do you avoid leaking memory?** Return cleanups from effects/onMount, abort fetches, remove listeners, terminate workers.',
				'**load vs onMount for data?** `load` runs before render (SSR-friendly, no loading flash for first paint); `onMount` is browser-only after render.',
				'**How would you test a component?** Vitest + testing-library; assert on DOM, not internals; Playwright for flows.'
			]
		},
		{
			id: 'pitfalls',
			heading: 'Pitfalls to name (shows real experience)',
			points: [
				'Destructuring a `$state` object loses reactivity.',
				'`$effect` for derived values → extra renders and bugs.',
				'Async `$effect` callbacks; dependencies after `await` untracked.',
				'Un-keyed `{#each}` with local state → state sticks to the wrong row.',
				'Browser APIs at the top level of `<script>` crash during SSR — use `onMount`/effects or `browser` checks.',
				'Module-level `$state` on the server is shared between users.',
				'Mixing legacy (`$:`, `export let`) and runes syntax in one component.'
			]
		}
	]
};
