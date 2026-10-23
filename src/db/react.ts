import type { LearnEngine, DbTopic } from './types';
import { regroup } from './regroup';
import { reactQuestionsA } from '../prep2/questions/react1';
import { reactQuestionsB } from '../prep2/questions/react2';

const md = (...lines: string[]) => lines.join('\n');

// Notes are plain markdown. React cannot run in the in-app playground, so there are no `try` snippets.
const topics: DbTopic[] = [
	{
		id: "components-and-props",
		title: "Components, JSX and props",
		level: "basic",
		summary: "Describe UI as functions, and move data down the tree as read-only props.",
		scenes: ["rc-props-down-events-up"],
		notes: md(
			"A React component is a function that returns JSX, a description of what the screen should show. React calls it; you never call it yourself. Component names start with a capital letter, so React knows `<Card />` is a component and `<div>` is a DOM element.",
			"",
			"Data comes in as **props**. They flow one way, from parent to child, and a child must treat them as read-only. To change something, the child calls a function the parent passed down.",
			"",
			"```jsx",
			"function Card({ title, children, onClose }) {",
			"  return (",
			"    <section>",
			"      <h2>{title}</h2>",
			"      {children}",
			"      <button onClick={onClose}>Close</button>",
			"    </section>",
			"  );",
			"}",
			"```",
			"",
			"`children` is whatever you nest between the tags, which makes composition easy. In React 19, `defaultProps` is gone for function components, so use default parameter values. You also no longer need to import React to write JSX.",
			"",
			"**Common trap:** `{count && <Badge />}` renders a literal `0` when `count` is 0, because `0` is a valid thing to render. Write `{count > 0 && <Badge />}` instead."
		)
	},
	{
		id: "state-and-rendering",
		title: "State and rendering",
		level: "basic",
		summary: "See why a render is a snapshot, and why state updates are queued and batched.",
		scenes: ["rc-render-commit", "rc-state-snapshot", "rc-batching"],
		notes: md(
			"Every update goes through three phases: **trigger** (state changed), **render** (React calls your components) and **commit** (React changes the DOM). Rendering is pure calculation and may be repeated or paused, so a component must not change anything outside itself while it renders.",
			"",
			"State is a **snapshot**: inside one render, `count` never changes, even in a handler or after a `setTimeout`. Calling `setCount(count + 1)` three times queues \"set to 1\" three times. When the new value depends on the old one, pass an updater: `setCount(c => c + 1)`.",
			"",
			"```jsx",
			"const [count, setCount] = useState(0);",
			"function add3() {",
			"  setCount(c => c + 1);",
			"  setCount(c => c + 1);",
			"  setCount(c => c + 1); // count is 3 on the next render",
			"}",
			"```",
			"",
			"Updates are **batched**: React waits until the handler finishes, then renders once. Since React 18 this also holds in timeouts and promises. React compares new and old state with `Object.is`, so create a new object or array instead of mutating one.",
			"",
			"**Common trap:** a component defined inside another component is a new function on every parent render, so React remounts it and throws away its state. Define components at the top level."
		)
	},
	{
		id: "keys-and-lists",
		title: "Keys and lists",
		level: "basic",
		summary: "Choose keys that follow the item, not its position.",
		scenes: ["rc-keys-identity"],
		notes: md(
			"When you render a list with `map`, each item needs a `key`. React uses it to match items between renders, so it can move, keep or remove the right one. A component's identity is its type, its position in the tree, and its key.",
			"",
			"Use a **stable, unique id** from your data. Keys only need to be unique among siblings, not across the whole page. Never generate them during render with `Math.random()`, because every render would look like all-new items.",
			"",
			"```jsx",
			"{todos.map(todo => (",
			"  <TodoRow key={todo.id} todo={todo} />",
			"))}",
			"```",
			"",
			"To give a key to a pair of elements, return a keyed Fragment: `<Fragment key={id}>...</Fragment>`. The key goes on the outermost element returned by `map`. A key is also a reset button: `<Profile key={userId} />` gives each user a fresh instance, so state resets without an effect.",
			"",
			"**Common trap:** array indexes as keys. When rows can be reordered or removed, identity follows position, so typed text and component state stay attached to the wrong item. Index keys are safe only for static lists that never change order."
		)
	},
	{
		id: "hooks-rules",
		title: "Hooks and their rules",
		level: "basic",
		summary: "Know why hooks must be called in the same order on every render.",
		scenes: ["rc-hook-order"],
		notes: md(
			"Hooks are functions like `useState` and `useEffect` that give a component memory and let it react to changes. React does not identify them by name. It remembers them by **the order of the calls** in each component, so the order must be identical on every render.",
			"",
			"That gives the two **Rules of Hooks**: call hooks only at the top level of a component or custom hook (not in `if`, loops, or after an early `return`), and only from React functions. A **custom hook** is a function whose name starts with `use` and that calls other hooks.",
			"",
			"```jsx",
			"function useOnline() {",
			"  const [online, setOnline] = useState(true);",
			"  useEffect(() => { /* subscribe, then return cleanup */ }, []);",
			"  return online;",
			"}",
			"```",
			"",
			"Custom hooks share **logic**, not state: each component that calls `useOnline()` gets its own separate state. Two more to know: `useId` makes a stable id that matches on server and client, for labels and `aria-*` attributes, and `useSyncExternalStore` subscribes to an external store without tearing.",
			"",
			"**Common trap:** `if (loggedIn) { useState(0) }` works for a render or two, then shifts every later hook by one slot and corrupts state. Put the condition inside the hook's logic, not around the call."
		)
	},
	{
		id: "effects",
		title: "Effects",
		level: "mid",
		summary: "Use effects to sync with the outside world, with dependencies and cleanup done right.",
		scenes: ["rc-effect-lifecycle", "rc-stale-interval", "rc-effect-race"],
		notes: md(
			"An **effect** runs code after React commits, to synchronise with something outside React: a connection, a timer, a subscription, the DOM. If nothing external is involved, you probably do not need an effect.",
			"",
			"The **dependency array** lists the reactive values the effect reads, and the effect re-runs when one changes. Return a **cleanup** function to undo the setup; React runs it before the next run and on unmount.",
			"",
			"```jsx",
			"useEffect(() => {",
			"  const conn = connect(roomId);",
			"  return () => conn.disconnect();",
			"}, [roomId]);",
			"```",
			"",
			"Compute derived values during render, and do work caused by a user action in the event handler: a \"Buy\" click sends its POST there. A fetch in an effect needs an `ignore` flag in cleanup, or a late response can overwrite a newer one. In React 19.2, `useEffectEvent` lets an effect read the latest props without making them a dependency.",
			"",
			"**Common trap:** a missing dependency. An interval or listener keeps using the value from the render it was created in. Using `setCount(c => c + 1)` removes the dependency, while an object created in the component body is a dependency that changes on every render."
		)
	},
	{
		id: "refs-and-the-dom",
		title: "Refs, portals and the DOM",
		level: "mid",
		summary: "Reach DOM nodes safely, hold values React does not track, and render elsewhere in the page.",
		scenes: ["rc-ref-vs-state", "rc-portal-events"],
		notes: md(
			"A **ref** is a box that survives re-renders: `{ current: ... }`. Changing `ref.current` does not cause a render, which makes it right for values React need not display: a timer id, the latest value of a prop for a long-lived callback, or a DOM node.",
			"",
			"Attach a ref to an element with `ref={inputRef}`. After the commit, `inputRef.current` is the DOM node, so an event handler can call `inputRef.current.focus()`. Do not read or write `ref.current` during rendering, except for lazy initialisation.",
			"",
			"```jsx",
			"function Field({ ref, ...props }) {",
			"  return <input ref={ref} {...props} />;",
			"}",
			"```",
			"",
			"In React 19 a function component receives `ref` as an ordinary prop, so `forwardRef` is not needed. A ref callback may also return a **cleanup function**.",
			"",
			"`createPortal` renders children into another DOM node, such as a modal root, while they stay in the same place in the React tree. Context and event bubbling follow the React tree, not the DOM.",
			"",
			"**Common trap:** using a ref for something the screen shows. Changing it does not re-render, so the UI goes stale. If it must appear on screen, it belongs in state."
		)
	},
	{
		id: "context-and-reducers",
		title: "Context and reducers",
		level: "mid",
		summary: "Share state deep in the tree, and organise complex updates in one place.",
		scenes: ["rc-context-skip", "rc-reducer-dispatch"],
		notes: md(
			"**Context** lets a component read a value from the closest provider above it, without passing props through every layer. In React 19 you render the context itself as the provider: `<ThemeContext value={theme}>`. Components that read it with `useContext` re-render when the value changes.",
			"",
			"A **reducer** keeps update logic in one pure function, `(state, action) => nextState`. Components send **actions** with `dispatch`; React calls the reducer and stores the result. It fits when several fields change together.",
			"",
			"```jsx",
			"function reducer(todos, action) {",
			"  if (action.type === 'added') return [...todos, action.todo];",
			"  return todos;",
			"}",
			"const [todos, dispatch] = useReducer(reducer, []);",
			"```",
			"",
			"Used together, context carries `state` and `dispatch` to the whole tree. A reducer must not mutate: copy arrays and objects.",
			"",
			"**Common trap:** `value={{ user, setUser }}` creates a new object every render, so every consumer re-renders even if `user` did not change. Memoize the value, or split a big context into parts that change at different speeds. Outside any provider, context gives its default value, or `undefined` if there is none."
		)
	},
	{
		id: "forms-and-actions",
		title: "Forms and Actions",
		level: "mid",
		summary: "Handle submits with React 19 Actions, pending state and optimistic updates.",
		scenes: ["rc-form-action", "rc-optimistic"],
		notes: md(
			"A **controlled** input takes its value from state through `value` and `onChange`. An **uncontrolled** one keeps its own value, which you read with a ref or `FormData` on submit; use `defaultValue` for the initial text.",
			"",
			"React 19 adds **Actions**: pass a function to a form's `action`, and React calls it with the `FormData`. `useActionState` wraps your action and returns `[state, formAction, isPending]`; the action receives the previous state first, then the form data. Inside a form, `useFormStatus` reads the pending state of the parent form.",
			"",
			"```jsx",
			"const [error, formAction, isPending] = useActionState(",
			"  async (prev, formData) => (await save(formData)) ?? null,",
			"  null",
			");",
			"// <form action={formAction}>...</form>",
			"```",
			"",
			"`useOptimistic` shows the expected result while the action runs, then reverts to the real state when it finishes or fails. After a successful action React resets uncontrolled fields. To keep typed values after an error, return them and use them as `defaultValue`.",
			"",
			"**Common trap:** switching an input from `value={undefined}` to a string makes it go from uncontrolled to controlled, and React warns. Start with `\"\"`."
		)
	},
	{
		id: "memoization-and-the-compiler",
		title: "Memoization and React Compiler",
		level: "advanced",
		summary: "Understand what memo, useMemo and the compiler really skip, and when it matters.",
		scenes: ["rc-memo-cascade", "rc-compiler"],
		notes: md(
			"By default, when a component re-renders, all its children re-render too. `React.memo(Child)` skips a child's render when its props are **shallowly equal** to last time. `useMemo` caches a calculation and `useCallback` caches a function, so they can keep a stable identity.",
			"",
			"These only help when props are actually stable. A new object, array or function created in the parent on every render defeats `memo`: `style={{ color: \"red\" }}` is a different object each time. A child that reads a context also re-renders when that context changes, memoized or not.",
			"",
			"```jsx",
			"const Row = memo(function Row({ item }) {",
			"  return <li>{item.name}</li>;",
			"});",
			"```",
			"",
			"**React Compiler** is a build-time tool that memoizes components and hook values automatically, at finer grain than `useMemo` (even after early returns). It skips code that breaks the Rules of React, and `'use no memo'` opts a function out. Existing `useMemo` calls can stay; skip adding new ones by default. Measure first: the Profiler can record why each component rendered.",
			"",
			"**Common trap:** wrapping everything in `memo` out of habit. If props change every time anyway, you pay for the comparison and gain nothing. For a list of 20,000 rows, virtualize it instead."
		)
	},
	{
		id: "suspense-and-transitions",
		title: "Suspense, transitions and Activity",
		level: "advanced",
		summary: "Show loading states without flicker, and keep urgent input responsive.",
		scenes: ["rc-suspense-fallback", "rc-transition"],
		notes: md(
			"**Suspense** shows a fallback while a child is not ready, then swaps in the content. The nearest boundary above the suspending component shows its fallback. Use it for lazy-loaded code (`React.lazy`), data read with `use`, and streaming.",
			"",
			"`use(promise)` reads a promise during render and suspends until it resolves. Unlike hooks, it may be called in conditions. A rejected promise goes to the nearest error boundary. The promise must come from a cache or from the server, not be created fresh in a client render.",
			"",
			"A **transition** marks an update as non-urgent. If the new screen suspends, React keeps the old one visible with `isPending` true instead of showing the fallback. `useDeferredValue(value)` gives a value that lags behind during urgent updates.",
			"",
			"```jsx",
			"const [isPending, startTransition] = useTransition();",
			"startTransition(() => setTab('comments'));",
			"```",
			"",
			"In React 19.2, `<Activity mode=\"hidden\">` hides UI but preserves its state, and cleans up its effects.",
			"",
			"**Common trap:** after an `await` inside an async transition, a later `setState` is no longer part of the transition unless you wrap it in another `startTransition`."
		)
	},
	{
		id: "server-components",
		title: "Server Components",
		level: "advanced",
		summary: "Know what runs on the server, what ships to the browser, and what may cross between them.",
		scenes: ["rc-server-client", "rc-promise-prop"],
		notes: md(
			"A **Server Component** renders only on the server. It can read a database or the filesystem directly, and its code is never sent to the browser. It cannot use state, effects or browser event handlers.",
			"",
			"A file that starts with `'use client'` marks a **client boundary**: that file and everything it imports are bundled for the browser, where components can use state and handlers. `'use server'` marks **Server Functions**, which client code can call but which run on the server.",
			"",
			"```jsx",
			"// Server Component: no hooks, no bundle cost",
			"async function Page() {",
			"  const posts = await db.posts.all();",
			"  return <PostList posts={posts} />;",
			"}",
			"```",
			"",
			"Props passed from server to client must be **serializable**: strings, numbers, Dates, plain objects, and promises of those. An inline function is not. To put a Server Component inside a Client one, pass it as `children`. Passing an un-awaited promise lets the client read it with `use()` inside Suspense, without blocking the server.",
			"",
			"**Common trap:** every exported function in a `'use server'` file is a public endpoint. Validate its input and check authorisation inside it, and keep secrets in server code, never in client components."
		)
	},
	{
		id: "hydration-and-ssr",
		title: "Hydration and server rendering",
		level: "advanced",
		summary: "Understand streaming, hydration, and what causes a mismatch.",
		scenes: ["rc-hydration-mismatch", "rc-streaming-ssr"],
		notes: md(
			"With server rendering, React turns your components into **HTML** on the server, so users see content before any JavaScript runs. In the browser, **hydration** then renders the same components again and attaches handlers to the existing HTML.",
			"",
			"That is why the first client render must produce exactly what the server produced. Rendering `Date.now()`, `Math.random()` or `window.innerWidth` directly causes a **hydration mismatch**. React 19 reports it as one error with a diff. Render a safe default first, then update after mount in an effect.",
			"",
			"**Streaming** SSR with Suspense sends the shell first, then streams slow parts in as they become ready. If a user clicks inside a boundary that has not hydrated yet, React hydrates it first and replays the click. If a component throws during streaming, that boundary falls back to client rendering.",
			"",
			"```jsx",
			"<Suspense fallback={<Skeleton />}>",
			"  <Comments /> {/* streams in when ready */}",
			"</Suspense>",
			"```",
			"",
			"In React 19.2, `prerender` and `resume` support partial pre-rendering: a static shell ahead of time, dynamic parts per request.",
			"",
			"**Common trap:** a browser extension that injects a tag. React 19 skips unexpected tags in `<head>` and `<body>` during hydration, so that one is no longer a mismatch."
		)
	},
	{
		id: "errors-and-testing",
		title: "Error boundaries and testing",
		level: "mid",
		summary: "Contain crashes to part of the page, and test the way users interact.",
		scenes: ["rc-error-boundary", "rc-test-findby"],
		notes: md(
			"An **error boundary** catches errors thrown while its children render, and shows a fallback instead of crashing the whole page. Today it must be a class component with `static getDerivedStateFromError` or `componentDidCatch`; libraries wrap this for you.",
			"",
			"Boundaries do **not** catch errors in event handlers or async code; use `try/catch` there. On `createRoot` you can pass `onCaughtError` (a boundary caught it), `onUncaughtError` (nothing did) and `onRecoverableError`.",
			"",
			"For tests, use React Testing Library and query the way users and assistive technology do: `getByRole('button', { name: /save/i })`. Use `findBy...` to wait for UI that appears later, `queryBy...` to assert something is absent, and `userEvent` to simulate the whole sequence of browser events. Import `act` from `react`.",
			"",
			"```jsx",
			"await user.click(screen.getByRole('button', { name: /load/i }));",
			"expect(await screen.findByRole('heading', { name: /results/i })).toBeInTheDocument();",
			"```",
			"",
			"**Common trap:** putting side effects or several assertions inside `waitFor`. Its callback runs repeatedly, so side effects repeat and failures become confusing."
		)
	}
];

// The quiz re-uses the 200 React questions from the Frontend quiz (src/prep2), regrouped by tag into chips that match the topics above.
const quiz = regroup([...reactQuestionsA, ...reactQuestionsB], 'react', [
	{id: "components-and-props", label: "Components and props", tags: ["jsx", "fragments", "a11y", "removed-apis", "conditional", "props", "children", "patterns"]},
	{id: "state-and-rendering", label: "State and rendering", tags: ["state", "rendering", "purity", "strict-mode", "concurrency", "events"]},
	{id: "keys-and-lists", label: "Keys and lists", tags: ["lists", "keys"]},
	{id: "hooks-rules", label: "Hooks", tags: ["hooks", "ids"]},
	{id: "effects", label: "Effects", tags: ["effects"]},
	{id: "refs-and-the-dom", label: "Refs and the DOM", tags: ["refs", "portals", "dom", "resource-hints", "custom-elements", "metadata", "stylesheets"]},
	{id: "context-and-reducers", label: "Context and reducers", tags: ["context", "reducer"]},
	{id: "forms-and-actions", label: "Forms and Actions", tags: ["forms", "actions", "optimistic"]},
	{id: "memoization-and-the-compiler", label: "Memoization and Compiler", tags: ["memo", "perf", "compiler", "devtools"]},
	{id: "suspense-and-transitions", label: "Suspense and transitions", tags: ["suspense", "use", "transitions", "activity"]},
	{id: "server-components", label: "Server Components", tags: ["rsc", "server-functions", "cache-signal"]},
	{id: "hydration-and-ssr", label: "Hydration and SSR", tags: ["hydration", "ssr", "static-apis"]},
	{id: "errors-and-testing", label: "Errors and testing", tags: ["errors", "testing"]}
]);

export const react: LearnEngine = {
	id: 'react',
	name: 'React',
	tagline: 'How React renders, updates and stays fast, through React 19.',
	topics,
	questions: quiz.questions,
	quizTopics: quiz.quizTopics,
	quizBlurb: 'React 19 hooks, rendering, state, effects, Actions and Server Components'
};
