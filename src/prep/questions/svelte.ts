import { builder } from '../types';

const { out, add } = builder('S', 'svelte');

// ───────────────────────── Component structure ─────────────────────────

add('basic', 'Which top-level sections can a .svelte component file contain?',
	'A <script> block, markup, and a <style> block — all three are optional.',
	['A required <template> wrapper, plus optional <script> and <style> (like Vue).',
	 'Exactly one root element, because Svelte components must have a single root.',
	 'Only a <script> block that default-exports a render function.'],
	'A .svelte file is just HTML with optional <script> and <style> sections. There is no mandatory <template> wrapper (that is Vue), no single-root rule (Svelte allows multiple top-level nodes), and nothing has to be exported — the compiler turns the file itself into the component.');

add('basic', 'By default, how are the rules in a component\'s <style> block applied?',
	'They are scoped to that component: the compiler adds a unique class so they only match its own elements.',
	['They are global, so every element in the app with a matching selector is styled.',
	 'They are scoped to the component and all of its descendants, including child components.',
	 'They only apply during development and are stripped from the production build.'],
	'Svelte hashes selectors (e.g. p.svelte-1x2y3z) so styles cannot leak out. They do NOT reach into child components either — the child\'s elements carry the child\'s hash, not yours. That is why you need :global(...) when you deliberately want to escape scoping.');

add('basic', 'You need one rule inside a component\'s <style> to hit an element it does not own (for example body). What do you write?',
	':global(body) { margin: 0; }',
	['body!important { margin: 0; }',
	 '<style global> body { margin: 0; } </style> — and it affects only that rule.',
	 '@scope(body) { margin: 0; }'],
	':global(...) wraps a selector (or part of one) so the compiler does not scope it. !important only changes specificity, not scoping. A <style global> attribute does not exist in Svelte 5, and @scope is plain CSS that is unrelated to Svelte\'s scoping.');

add('basic', 'How does Svelte differ most fundamentally from React at runtime?',
	'Svelte is a compiler: it turns components into code that updates exactly the DOM nodes affected by a change, with no virtual DOM diff.',
	['Svelte keeps a virtual DOM like React but diffs it faster.',
	 'Svelte re-runs the whole component function on every state change and patches the result.',
	 'Svelte ships a large runtime that interprets templates in the browser.'],
	'The Svelte compiler analyses your template at build time and emits targeted update instructions (e.g. "when count changes, set this text node"). That is why there is no virtual DOM, no whole-component re-render, and a small runtime. React re-runs components and diffs a virtual tree.');

// ───────────────────────── Runes: state / derived ─────────────────────────

add('basic', 'In Svelte 5 runes mode, which declaration creates reactive local state?',
	'let count = $state(0);',
	['let count = 0;',
	 'const count = ref(0);',
	 '$: count = 0;'],
	'$state is the rune that marks a variable as reactive. A plain let is an ordinary variable — changing it will not update the DOM in runes mode. ref() is Vue, and $: is the legacy Svelte 4 reactive-statement syntax.');

add('basic', 'Which is the preferred Svelte 5 way to attach a click handler?',
	'<button onclick={handleClick}>',
	['<button on:click={handleClick}>',
	 '<button @click={handleClick}>',
	 '<button (click)="handleClick()">'],
	'In Svelte 5 event handlers are just attributes/props named like the DOM event (onclick, oninput, …). on:click still works but is the deprecated Svelte 4 directive, and you cannot mix on: and onclick on the same element. @click is Vue and (click) is Angular.');

add('basic', 'You have `let count = $state(0)`. Which keeps `doubled` always in sync with `count`?',
	'let doubled = $derived(count * 2);',
	['let doubled = count * 2;',
	 'let doubled = $state(count * 2);',
	 '$effect(() => { doubled = count * 2; }); with a plain let doubled'],
	'$derived re-computes whenever its dependencies change and is cached. A plain `count * 2` runs once at creation. $state(count * 2) also takes only the initial value. Writing derived values from an $effect is an anti-pattern: it runs a frame late, adds extra updates, and the plain variable would not even be reactive.');

add('mid', 'When do you reach for $derived.by instead of $derived?',
	'When the derived value needs multiple statements (loops, branches, local variables) rather than a single expression.',
	['When the derived value must be recomputed asynchronously.',
	 'When you want the derived value to be writable from the outside.',
	 'When you want the computation to run on every render, not only when dependencies change.'],
	'$derived(expr) takes one expression; $derived.by(() => { ... return value; }) takes a function so you can write real logic. Both are synchronous, cached, and re-run only when the reactive values read inside change. Neither is for async work, and derived values are not writable in the normal sense.');

add('basic', 'What happens in the UI after the button is clicked once?',
	'The array and the length both update: [1, 2, 3] and 3 — push on a $state array is reactive.',
	['Nothing changes in the UI, because push mutates without reassigning.',
	 'Only the length updates; array contents are not deeply reactive.',
	 'A compile error: $state arrays are immutable.'],
	'$state wraps arrays and plain objects in a deep reactive Proxy, so mutations like push, splice and nested property assignment trigger updates. You do not need the Svelte 4 `list = list` reassignment trick. The proxy is also why you can still call normal array methods.',
	`<script>
  let list = $state([1, 2]);
</script>
<button onclick={() => list.push(3)}>add</button>
<p>{JSON.stringify(list)} / {list.length}</p>`);

add('mid', 'When is $state.raw the right tool?',
	'For large or frozen data you only ever replace wholesale — it skips the deep proxy, so you must reassign instead of mutating.',
	['When you want mutations like arr.push() to be reactive, but faster.',
	 'When the value should be shared across all component instances.',
	 'When you want the state to be stored in localStorage automatically.'],
	'$state.raw is not proxied, so nested mutations are NOT tracked — only reassignment is. That is a performance win for big immutable payloads (API results, chart datasets). It has no sharing or persistence behaviour.');

add('mid', 'Given `let counter = $state({ count: 0 })`, what does `let { count } = counter;` give you?',
	'A plain number snapshot (0). It will not update when counter.count changes later.',
	['A live reactive binding that always mirrors counter.count.',
	 'A derived value, equivalent to $derived(counter.count).',
	 'A TypeScript error, because you cannot destructure $state.'],
	'Destructuring reads the property once at that moment, producing a normal variable. Reactivity lives in property access on the proxy (counter.count). Use `counter.count` directly or wrap it: `let count = $derived(counter.count)`.');

add('mid', 'What is $state.snapshot(obj) for?',
	'It returns a plain, non-proxy copy of the current state — handy for structuredClone, JSON APIs, or logging.',
	['It freezes the state so it can no longer change.',
	 'It subscribes you to future changes of obj.',
	 'It creates a derived copy that stays in sync with obj.'],
	'Deep $state values are Proxies, which some APIs (structuredClone, postMessage, certain libraries) cannot handle. $state.snapshot gives a static plain copy at that instant. It neither freezes nor tracks anything.');

// ───────────────────────── Runes: effects ─────────────────────────

add('basic', 'When does an $effect run?',
	'After the DOM has been updated — once initially in the browser, then again whenever reactive values it read change.',
	['Before the DOM is updated, on every state change in the whole component.',
	 'Exactly once, when the component mounts.',
	 'On every render regardless of what changed, like a React effect with no dependency array.'],
	'Svelte tracks which reactive values an effect reads (automatically — no dependency array) and re-runs only when those change, after DOM updates are flushed. Effects do not run during SSR.');

add('mid', 'How do you clean up (e.g. clear a timer) in an $effect?',
	'Return a function from the effect; it runs before the next re-run and when the component is destroyed.',
	['Call onDestroy() inside the effect body.',
	 'Assign the cleanup function to $effect.cleanup.',
	 'You cannot — effects have no teardown, so use onMount instead.'],
	'The function returned by an $effect is its teardown. It runs before the effect re-executes and on unmount, preventing duplicated intervals/listeners. onMount also supports a returned cleanup, but it only runs once, so it is not a substitute for a re-running effect.',
	`$effect(() => {
  const id = setInterval(tick, interval);
  return () => clearInterval(id);
});`);

add('mid', 'Why should you avoid writing `$effect(async () => { ... })`?',
	'An async function returns a Promise, so Svelte cannot see a cleanup function, and values read after the first await are not tracked.',
	['Svelte throws a syntax error for async arrow functions.',
	 'Async effects run twice on every change.',
	 'Async effects always block rendering until they resolve.'],
	'Effect dependency tracking only covers what is read synchronously before the first await, and the return value must be a cleanup function (not a Promise). Do the async work inside a normal function called from the effect, or fetch in a load function / event handler.');

add('mid', 'Which situation is $effect actually meant for?',
	'Side effects that sync with the outside world: DOM APIs, timers, subscriptions, analytics, canvas drawing.',
	['Computing a value from other state (e.g. fullName from first + last).',
	 'Initialising $state variables from props.',
	 'Handling button clicks.'],
	'If you are computing a value, use $derived. Click handling belongs in event handlers. $effect is the escape hatch for synchronising with things Svelte does not own. Using it to derive state causes extra update cycles and subtle bugs.');

// ───────────────────────── Props & component communication ─────────────────────────
add('basic', 'How do you declare props, with a default for count, in Svelte 5?',
	'let { title, count = 0 } = $props();',
	['export let title; export let count = 0;',
	 'let { title, count } = defineProps({ count: 0 });',
	 'let title = $prop(); let count = $prop(0);'],
	'$props() returns the props object and you destructure it; defaults use normal destructuring defaults. `export let` is the legacy (Svelte 4) form, defineProps is Vue, and $prop does not exist.');

add('basic', 'What is the correct way to type props in a Svelte 5 TypeScript component?',
	'Declare an interface/type and annotate the destructuring: let { title, count = 0 }: Props = $props();',
	['Write export let title: string; on each prop.',
	 'Use Vue\'s form: defineProps<Props>().',
	 'Add a PropTypes object next to the component, as in React.'],
	'Annotate the destructured $props() result with your type. `export let` is the old syntax, there is no PropTypes runtime checking in Svelte, and defineProps is a Vue macro that does not exist here.',
	`<script lang="ts">
  interface Props { title: string; count?: number }
  let { title, count = 0 }: Props = $props();
</script>`);

add('mid', 'A child wants the parent to be able to write to a prop with bind:. What must the child do?',
	'Declare the prop with $bindable(): let { value = $bindable() } = $props();',
	['Nothing — every prop is two-way bindable by default.',
	 'Export it with export const value.',
	 'Use $state.raw for the prop.'],
	'Props flow one way by default. $bindable marks a prop as opt-in two-way so the parent can use <Child bind:value={x}>. Without it, binding is a compile-time error, which keeps data flow explicit.');

add('basic', 'In Svelte 5, what is the recommended way for a child component to notify its parent that something happened?',
	'Accept a callback prop (e.g. onsave) and call it.',
	['Use createEventDispatcher() and dispatch a custom event.',
	 'Emit with $emit("save") like in Vue.',
	 'Write to window and have the parent poll it.'],
	'Svelte 5 makes events ordinary props: the parent passes onsave={handler}, the child calls onsave?.(data). createEventDispatcher still exists but is deprecated, and $emit is a Vue API.');

add('basic', 'What does {@render children?.()} do in a layout or wrapper component?',
	'It renders the content the parent passed between the component\'s opening and closing tags.',
	['It calls a function named children defined in the parent\'s script.',
	 'It renders the child components imported in this file.',
	 'It re-renders the entire component.'],
	'Content placed inside <Wrapper>…</Wrapper> is passed implicitly as a `children` snippet prop. {@render} invokes that snippet; the ?. keeps it safe when the parent supplied no content. (This replaced <slot /> from Svelte 4.)');

add('mid', 'What is a {#snippet}?',
	'A reusable chunk of markup with parameters that you render with {@render name(args)}.',
	['A CSS-in-JS helper for generating styles.',
	 'A function that returns a string of HTML.',
	 'A store that holds JSX-like values.'],
	'Snippets are declared in the template: {#snippet row(item)}…{/snippet}, then {@render row(x)}. They can be passed as props (replacing named slots) and are typed with the Snippet type from "svelte".',
	`{#snippet row(item)}
  <li>{item.name}</li>
{/snippet}

{#each items as item}
  {@render row(item)}
{/each}`);

add('mid', 'How do you type a `children` prop in TypeScript?',
	'import type { Snippet } from "svelte"; let { children }: { children: Snippet } = $props();',
	['let { children }: { children: string } = $props();',
	 'let { children }: { children: JSX.Element } = $props();',
	 'let { children }: { children: () => HTMLElement } = $props();'],
	'Content passed to a component is a snippet, and Svelte exports a Snippet<[...params]> type for it. It is not a string, not JSX (Svelte has none), and it is not a function that returns a DOM element — it is rendered with {@render}.');

add('mid', 'What does this component do with extra attributes passed by the parent?',
	'It forwards everything except `class` (captured as klass) onto the <button> via spread.',
	['It ignores them; only declared props are accepted.',
	 'It throws a compile error for unknown attributes.',
	 'It applies them to the component\'s first child component.'],
	'The rest element (...rest) of $props() collects all remaining props, and {...rest} spreads them onto the element. `class` is a reserved word, so it is renamed during destructuring (class: klass).',
	`<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  let { class: klass = '', children, ...rest }: HTMLButtonAttributes = $props();
</script>
<button class={klass} {...rest}>{@render children?.()}</button>`);

// ───────────────────────── Template syntax ─────────────────────────

add('basic', 'Which is the correct conditional block syntax?',
	'{#if a}…{:else if b}…{:else}…{/if}',
	['{#if a}…{#elseif b}…{#else}…{/if}',
	 '{if a}…{else if b}…{else}…{/if}',
	 '<If condition={a}>…</If>'],
	'Block openers start with #, continuations with :, and closers with /. So the middle branches are {:else if} and {:else}, never {#elseif}/{#else}.');

add('basic', 'Why write `{#each todos as todo (todo.id)}` with the (todo.id) part?',
	'It is a key: Svelte matches DOM nodes to items by id, so reordering/removing items moves or removes the right nodes and preserves their state.',
	['It makes the list sort by id.',
	 'It is required, otherwise {#each} throws.',
	 'It tells Svelte to render the list only once.'],
	'Without a key, items are matched by index, so deleting item 0 re-labels every following row and local state (input text, focus, animations) can attach to the wrong row. A stable unique key fixes that. It is optional, and has nothing to do with sorting.');

add('basic', 'Which branch of this block renders while the promise is still pending?',
	'The first one: the content between {#await promise} and {:then}.',
	['The {:then value} branch, with value undefined.',
	 'The {:catch} branch.',
	 'Nothing is rendered until the promise settles.'],
	'{#await p}pending{:then v}resolved{:catch e}rejected{/await}. The first section is the pending state, then Svelte swaps to :then or :catch. That makes loading UIs trivial without extra state variables.',
	`{#await fetchUser()}
  <p>Loading…</p>
{:then user}
  <p>{user.name}</p>
{:catch err}
  <p>Failed: {err.message}</p>
{/await}`);

add('basic', 'Which binding keeps a text input and a variable in sync?',
	'<input bind:value={name} />',
	['<input value:bind={name} />',
	 '<input v-model={name} />',
	 '<input $value={name} />'],
	'bind:value is Svelte\'s two-way binding directive: typing updates `name`, and assigning `name` updates the input. For checkboxes use bind:checked. v-model is Vue.');

add('mid', 'You write `<div bind:this={el}></div>`. When is `el` safe to use?',
	'After the component has mounted — e.g. inside onMount or an $effect, or an event handler — because it is undefined before.',
	['Immediately at the top level of <script>.',
	 'Only during server-side rendering.',
	 'Never; refs require a callback function.'],
	'bind:this assigns the element once it exists in the DOM. During script initialisation (and on the server) it has not been created yet, so reading el.focus() there throws. Use it in onMount, $effect or event handlers.');

add('basic', 'What is the danger of {@html userComment}?',
	'It injects raw HTML, so unsanitised user content can run scripts (XSS).',
	['It escapes the HTML so tags show as text.',
	 'It only works for static strings.',
	 'It forces the component to re-render on each keystroke.'],
	'Normal {value} interpolation escapes content. {@html} deliberately skips escaping so only use it with trusted or sanitised HTML (for instance, run user content through DOMPurify first).');

add('basic', 'In Svelte 5, how do you prevent a form\'s default submit behaviour?',
	'Call event.preventDefault() inside the handler: onsubmit={(e) => { e.preventDefault(); … }}',
	['Use the modifier: onsubmit|preventDefault={…}',
	 'Return false from the handler.',
	 'Add a preventDefault attribute to the <form>.'],
	'Event modifiers like on:submit|preventDefault were removed with the on: directive in Svelte 5, and returning false has no effect on modern DOM handlers. You call preventDefault() yourself (or wrap handlers in a small helper). SvelteKit\'s use:enhance handles this for form actions.');

add('basic', 'Which is the idiomatic way to toggle a CSS class conditionally?',
	'class:active={isActive} (or class={{ active: isActive }} in recent Svelte 5 versions)',
	['class="active" if={isActive}',
	 '{#class active}…{/class}',
	 ':class="{ active: isActive }"'],
	'The class: directive adds/removes one class based on a boolean. Svelte 5.16+ also accepts objects/arrays in the class attribute (clsx-style). The :class binding is Vue; the other options are not valid Svelte.');

// ───────────────────────── Modules, context, lifecycle, stores ─────────────────────────
add('basic', 'What are the valid places to use runes like $state and $derived?',
	'Inside .svelte files and in modules whose filename contains .svelte (e.g. store.svelte.ts).',
	['In any .ts file; the bundler handles them.',
	 'Only inside <script> in .svelte files.',
	 'Only inside onMount callbacks.'],
	'Runes are compiler syntax, so the file must go through the Svelte compiler. Naming a module *.svelte.js / *.svelte.ts opts it in, which is how you create shared reactive state outside components. A plain .ts file would leave $state as an undefined identifier.');

add('mid', 'You want to share a counter between components from a module. Which export works?',
	'export const counter = $state({ value: 0 }); — then mutate counter.value from anywhere.',
	['export let count = $state(0); then count++ in other files',
	 'export const count = $state(0); then count = count + 1',
	 'export default $state(0);'],
	'Svelte cannot export a reassigned $state primitive because importers would hold a stale value (imports are live bindings of the variable, not of reactivity). Export an object and mutate its properties, or export getter/setter functions.',
	`// counter.svelte.ts
export const counter = $state({ value: 0 });
export function increment() { counter.value++; }`);

add('basic', 'When does onMount run, and what can it return?',
	'In the browser after the component is first mounted (never on the server); it may return a cleanup function.',
	['During server-side rendering, before the HTML is sent.',
	 'Every time any state changes.',
	 'Before the script block executes.'],
	'onMount is the right place for browser-only setup (measure DOM, start timers, open sockets). The returned function runs when the component is destroyed. Code at the top level of <script> runs during SSR too, so browser APIs there crash on the server.');

add('mid', 'Which statement about setContext / getContext is correct?',
	'They must be called during component initialisation; descendants can read the value without prop drilling.',
	['They can be called from any event handler at any time.',
	 'They are global, so any component in the app can read a context set anywhere.',
	 'They make the context value reactive automatically, even if it is a primitive.'],
	'Context is scoped to a component subtree (parent → descendants) and is looked up using the component tree, so both calls need to happen while a component is initialising. It is not reactive by itself — pass a $state object or getter functions if the value changes.');

add('mid', 'In a component, what does the `$` prefix on a store name (`$count`) do?',
	'It auto-subscribes to the store, gives you its current value, and unsubscribes when the component is destroyed.',
	['It converts the store to a $state rune permanently.',
	 'It marks the store as private to the component.',
	 'It reads the value once without subscribing.'],
	'The $store syntax is sugar for subscribe/unsubscribe, and assigning to $count calls store.set. It still works in Svelte 5 runes mode, but for new shared state a .svelte.ts module with $state is usually simpler.');

add('basic', 'In runes mode, what happens if you use a legacy reactive statement like `$: doubled = count * 2`?',
	'It is a compile error; use $derived (for values) or $effect (for side effects) instead.',
	['It works exactly as in Svelte 4.',
	 'It works but runs only once.',
	 'It becomes a $derived automatically.'],
	'Runes mode and legacy mode cannot be mixed in a component. $: statements belong to legacy mode (where they are implicitly reactive); in runes mode Svelte requires you to be explicit about derived values vs effects.');

// ───────────────────────── SvelteKit ─────────────────────────

add('basic', 'Which file serves the page for the URL /blog/hello?',
	'src/routes/blog/[slug]/+page.svelte',
	['src/routes/blog/hello.svelte',
	 'src/pages/blog/[slug].svelte',
	 'src/routes/blog/slug/index.svelte'],
	'SvelteKit uses filesystem routing: folders are path segments, [slug] is a dynamic parameter, and the +page.svelte file inside is the page component. pages/ + file-per-route is Next.js / Nuxt style.');

add('basic', 'What is the difference between +page.ts and +page.server.ts load functions?',
	'+page.ts is universal (runs on the server during SSR and in the browser on navigation); +page.server.ts runs only on the server.',
	['+page.ts only runs on the server; +page.server.ts only runs in the browser.',
	 'They are identical; the file name is a convention.',
	 '+page.server.ts runs at build time only.'],
	'Server-only load functions can use private env vars, databases, and secrets, and their return value must be serialisable. Universal loads run in both places so they must only use things available in both (public APIs, fetch).');

add('basic', 'How does a +page.svelte component receive data returned by its load function?',
	'Through the data prop: let { data } = $props();',
	['By importing the load function and calling it.',
	 'Through a global $page.data store only.',
	 'By awaiting load() inside the component script.'],
	'SvelteKit runs load, then passes its result to the page as the `data` prop (merged with parent layout data). That keeps data fetching out of the component and makes SSR/hydration consistent.');

add('basic', 'What does a +layout.svelte need to do so child pages appear inside it?',
	'Render {@render children()} where the page should go.',
	['Include a <slot name="page" />.',
	 'Import every child page explicitly.',
	 'Nothing — pages are appended after the layout automatically.'],
	'Layouts receive the nested page (or nested layout) as the `children` snippet prop. Layouts persist across navigations between their child routes, which is great for navbars, sidebars and state you do not want to reset.');

add('basic', 'What does exporting `GET` from src/routes/api/items/+server.ts create?',
	'An HTTP endpoint that handles GET /api/items and returns a Response (e.g. json(...)).',
	['A client-side function callable only from components.',
	 'A page that renders at /api/items.',
	 'A middleware that runs before every route.'],
	'+server.ts files export handlers named after HTTP verbs (GET, POST, PUT, DELETE, …) that take a RequestEvent and return a Response. They are API routes; pages are +page.svelte; middleware is hooks.server.ts.');

add('mid', 'What does `use:enhance` do on a <form method="POST"> that targets a form action?',
	'It submits via fetch without a full page reload, then updates form/data and invalidates as needed — the form still works without JavaScript.',
	['It validates the form fields in the browser using HTML5 rules.',
	 'It makes the form submit to a different endpoint.',
	 'It encrypts the request body.'],
	'Form actions work with plain HTML forms (progressive enhancement). Adding use:enhance upgrades the experience to an AJAX-style submit that keeps scroll/focus and updates data in place, while keeping the no-JS fallback.');

add('mid', 'What does `export const ssr = false;` in a +layout.ts / +page.ts do?',
	'Disables server rendering for those routes: the server sends a shell and the page renders only in the browser (SPA mode).',
	['It disables the whole SvelteKit router.',
	 'It makes the page static at build time.',
	 'It runs load functions only on the server.'],
	'Use it for pages that rely on browser-only things (IndexedDB, window, WebGL) or that sit behind login with no SEO need. Prerendering is a different option (prerender = true). Trade-off: no HTML in the first response, so slower first paint and no SEO content.');

add('mid', 'What does `export const prerender = true;` do?',
	'Generates the page\'s HTML once at build time and serves it as a static file.',
	['Renders the page on each request on the server.',
	 'Pre-fetches the page when the user hovers a link.',
	 'Caches the page in localStorage.'],
	'Prerendering suits content that is the same for everyone (marketing pages, docs). It cannot be used for pages that depend on per-request data like cookies. Hover preloading is a different feature (data-sveltekit-preload-data).');

add('mid', 'What is src/hooks.server.ts\' `handle` function typically used for?',
	'Running logic for every server request — reading cookies, authenticating, attaching user info to event.locals, modifying responses.',
	['Defining client-side navigation hooks.',
	 'Handling button clicks on the server.',
	 'Configuring Tailwind.'],
	'handle wraps request resolution: you can authenticate, set event.locals.user, add headers, or short-circuit. It is the SvelteKit equivalent of server middleware.');

add('mid', 'How do you redirect from inside a load function in SvelteKit 2?',
	'Call redirect(302, "/login") imported from @sveltejs/kit — it throws internally, so you do not write `throw`.',
	['window.location.href = "/login"',
	 'Return { redirect: "/login" } from load.',
	 'Call goto("/login") from $app/navigation on the server.'],
	'redirect() (and error()) from @sveltejs/kit interrupt load/actions/hooks themselves; in SvelteKit 2 you no longer prefix them with throw. window does not exist on the server, goto is client-only, and returning an object is just data.');

add('mid', 'Which environment variables are safe to use in browser code in SvelteKit?',
	'Only those prefixed with PUBLIC_, imported from $env/static/public or $env/dynamic/public.',
	['Any variable in .env, since it is bundled for the client.',
	 'Variables imported from $env/static/private, if used in a .svelte file.',
	 'Only variables whose name is all uppercase.'],
	'SvelteKit keeps non-public variables on the server and will error at build time if client code imports them. The PUBLIC_ prefix is the explicit opt-in that says "this may be shipped to the browser", preventing accidental secret leaks.');

add('mid', 'How do you type a $state that starts as null and later holds a User?',
	'let user = $state<User | null>(null);',
	['let user: $state<User | null> = null;',
	 'let user = $state(null) as User;',
	 'let user = $state(User);'],
	'$state is generic, so you supply the full type with a type argument. Without it, TypeScript infers `null` only and later assignments error. The `as User` cast would lie to the compiler (it really is null at first), and passing a type as the argument is not valid.');



export const svelteQuestions = out;
