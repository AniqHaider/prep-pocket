import type { LearnEngine } from './types';
import { regroup } from './regroup';
import { nextQuestionsA } from '../prep2/questions/next1';
import { nextQuestionsB } from '../prep2/questions/next2';

// The quiz re-uses the 200 questions in src/prep2/questions (topic 'next'), regrouped by tag so the Quiz chips match the Learn topics.
const quiz = regroup([...nextQuestionsA, ...nextQuestionsB], 'next', [
	{ id: 'app-router-and-layouts', label: 'Routes and layouts', tags: ['routing', 'layouts'] },
	{ id: 'server-vs-client-components', label: 'Server and client', tags: ['rsc'] },
	{ id: 'data-and-rendering', label: 'Data and rendering', tags: ['data', 'rendering', 'static-params'] },
	{ id: 'caching-and-use-cache', label: 'Caching', tags: ['caching', 'use-cache', 'cache-components'] },
	{ id: 'streaming-and-errors', label: 'Streaming and errors', tags: ['loading', 'errors'] },
	{ id: 'route-handlers', label: 'Route handlers', tags: ['route-handlers'] },
	{ id: 'server-actions', label: 'Server Actions', tags: ['actions'] },
	{ id: 'navigation-and-links', label: 'Navigation', tags: ['navigation'] },
	{ id: 'params-and-search-params', label: 'Params', tags: ['params'] },
	{ id: 'metadata-and-images', label: 'Metadata and images', tags: ['metadata', 'images', 'fonts', 'scripts'] },
	{ id: 'parallel-and-intercepting-routes', label: 'Parallel routes', tags: ['parallel-routes'] },
	{ id: 'proxy-and-auth', label: 'Proxy and auth', tags: ['proxy', 'auth', 'security'] },
	{ id: 'config-env-and-deploy', label: 'Config and deploy', tags: ['env', 'cli', 'config', 'typescript', 'migration', 'deploy', 'perf', 'testing', 'i18n'] }
]);

export const nextjs: LearnEngine = {
	id: 'nextjs',
	name: 'Next.js',
	tagline: 'The App Router, caching and Server Actions in Next.js 15 and 16, for React developers.',
	quizBlurb: 'Next.js App Router: rendering, caching, Server Actions, Proxy and the Next.js 16 changes',
	questions: quiz.questions,
	quizTopics: quiz.quizTopics,
	topics: [
		{
			id: 'app-router-and-layouts',
			title: 'Routes and layouts',
			level: 'basic',
			summary: 'Folders become URLs, and layouts wrap pages without remounting.',
			scenes: ['nx-folder-to-url', 'nx-nested-layouts'],
			notes: `The App Router turns **folders into routes**. A folder under \`app/\` becomes a URL only when it contains a \`page.tsx\`; everything else in that folder stays private to it.

- \`layout.tsx\` wraps the pages below it. The root layout is required and renders \`<html>\` and \`<body>\`.
- \`(marketing)\` in parentheses is a **route group**: it organises files without changing the URL.
- \`_components\` (underscore) opts a folder out of routing. \`[slug]\` is a dynamic segment, and \`[[...slug]]\` is an optional catch-all that also matches the bare path.

\`\`\`tsx
// app/dashboard/layout.tsx
export default function Layout({ children }: { children: React.ReactNode }) {
  return <section><Sidebar />{children}</section>;
}
\`\`\`

A shared layout **stays mounted** when you navigate between its pages: its state is kept and it does not re-render. That is also why layouts do not receive \`searchParams\`. Use \`template.tsx\` when you want a fresh instance on every navigation.

**Common trap:** two route groups that both hold \`about/page.tsx\` resolve to the same URL, and the build fails.`
		},
		{
			id: 'server-vs-client-components',
			title: 'Server and Client Components',
			level: 'basic',
			summary: 'Where server code ends, where client code starts, and what may cross.',
			scenes: ['nx-client-boundary', 'nx-server-client-props'],
			notes: `Every component in the App Router is a **Server Component** unless a file says otherwise. It runs on the server, can be \`async\`, can read your database directly, and sends no JavaScript for itself.

Add \`'use client'\` at the very top of a file to start a **client boundary**. You need it for state, effects, event handlers and browser APIs. Everything that file imports becomes client code too.

\`\`\`tsx
'use client';
import { useState } from 'react';
export function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
\`\`\`

Server Components can render Client Components and pass them props, but props must be **serialisable**: a plain callback is not. A client component cannot import a Server Component, yet it can receive one as \`children\`, already rendered on the server. Add \`import 'server-only'\` to a module so that importing it from client code becomes a build error.

**Common trap:** putting \`'use client'\` high in the tree turns a whole subtree into client code. Keep the boundary on the small interactive leaf.`
		},
		{
			id: 'data-and-rendering',
			title: 'Data fetching and rendering modes',
			level: 'basic',
			summary: 'Fetch in Server Components, avoid waterfalls, and know what makes a route dynamic.',
			scenes: ['nx-parallel-fetch', 'nx-static-vs-dynamic'],
			notes: `In the App Router you fetch data **where you need it**, in an \`async\` Server Component, with no \`useEffect\` and no loading state to manage.

\`\`\`tsx
export default async function Page() {
  const [user, posts] = await Promise.all([getUser(), getPosts()]);
  return <Feed user={user} posts={posts} />;
}
\`\`\`

Independent requests should start together; awaiting them one by one makes a **waterfall**. To share one result between components during a request, wrap a helper in React's \`cache\`.

A route renders either at **build time** (prerendered, served as static HTML) or at **request time**. Without Cache Components, reading \`cookies()\` or \`headers()\` makes a route dynamic. \`generateStaticParams\` lists the values of a dynamic route to prerender, and \`dynamicParams = false\` turns any other value into a 404. \`after()\` schedules work, like logging, to run after the response has been sent.

**Common trap:** since Next.js 15, \`fetch\` is not cached by default and neither are \`GET\` Route Handlers. Cache on purpose.`
		},
		{
			id: 'caching-and-use-cache',
			title: 'Caching and use cache',
			level: 'mid',
			summary: 'What Cache Components cache, how the key works, and how to invalidate.',
			scenes: ['nx-static-shell-streaming', 'nx-use-cache-hit-miss', 'nx-revalidate-tag'],
			notes: `Next.js 16 introduces **Cache Components** (\`cacheComponents: true\` in \`next.config.ts\`). You choose what is cached with the \`'use cache'\` directive, and everything else stays dynamic.

\`\`\`tsx
export async function getProducts() {
  'use cache';
  cacheLife('hours');
  cacheTag('products');
  return db.product.findMany();
}
\`\`\`

A route is built from three kinds of content: **static** (prerendered), **cached** (\`use cache\`, also in the static shell while its lifetime is long enough) and **request-time**, which streams in behind \`<Suspense>\`. The cache key is the build ID, the function, its serialisable arguments and any variables it captures. Without \`cacheLife\`, the \`default\` profile applies.

After a mutation, \`updateTag('products')\` (Server Actions only) expires the entries so the next read is fresh. \`revalidateTag('products', 'max')\` serves stale content while it refreshes in the background. An opt-in \`partialPrefetching\` setting makes links prefetch each route's static shell instead of the full page.

**Common trap:** reading \`cookies()\` inside a \`use cache\` function throws. Read it outside and pass the value in as an argument.`
		},
		{
			id: 'streaming-and-errors',
			title: 'Streaming, loading and errors',
			level: 'mid',
			summary: 'Send the ready parts first, and decide where errors stop.',
			scenes: ['nx-suspense-streaming', 'nx-error-boundaries'],
			notes: `**Streaming** lets the server send the ready parts of a page first. Wrap a slow component in \`<Suspense>\` and the shell arrives immediately with the fallback in its place; the real content follows and replaces it.

A \`loading.tsx\` file does this for you: it wraps the \`page.tsx\` below it in Suspense. It does not wrap the layout in the same folder, so slow data fetched in that layout still blocks navigation.

\`\`\`tsx
// app/dashboard/error.tsx
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <button onClick={reset}>Something went wrong. Try again</button>;
}
\`\`\`

\`error.tsx\` is an error boundary for its segment and must be a Client Component. In production the message is replaced by a generic one plus an \`error.digest\` you can match with server logs. \`not-found.tsx\` renders when you call \`notFound()\`, and \`global-error.tsx\` handles errors in the root layout, so it renders its own \`<html>\` and \`<body>\`.

**Common trap:** once streaming has started the status line is already sent, so \`notFound()\` after that point still answers \`200\`.`
		},
		{
			id: 'route-handlers',
			title: 'Route Handlers',
			level: 'basic',
			summary: 'Plain HTTP endpoints with route.ts, and their caching default.',
			scenes: ['nx-route-handler'],
			notes: `A \`route.ts\` file turns a folder into an **HTTP endpoint**. Export a function named after the verb you want to handle: \`GET\`, \`POST\`, \`PUT\`, \`PATCH\`, \`DELETE\`, \`HEAD\` or \`OPTIONS\`.

\`\`\`ts
// app/api/time/route.ts
export async function GET(request: Request) {
  return Response.json({ now: Date.now() });
}
\`\`\`

Use the Web \`Request\` and \`Response\` objects. \`NextRequest\` adds helpers such as \`request.nextUrl.searchParams\`. Dynamic segments arrive as a Promise: \`const { id } = await ctx.params\`.

Since Next.js 15 a \`GET\` handler is **not cached by default**: it runs on every request. Opt in with \`export const dynamic = 'force-static'\`, or export \`generateStaticParams\` to prerender known ids. (With \`cacheComponents\` on in Next.js 16 the \`dynamic\` option is removed: use \`use cache\` instead.) A \`route.ts\` cannot live in the same folder as a \`page.tsx\`.

Use route handlers for webhooks, public APIs and anything that is not a page. For mutations triggered by your own UI, a Server Action is usually simpler.

**Common trap:** assuming a handler that uses no dynamic function is still static, as it was in Next.js 14.`
		},
		{
			id: 'server-actions',
			title: 'Server Actions',
			level: 'mid',
			summary: 'Forms and mutations that run on the server, and why they must be secured.',
			scenes: ['nx-server-action-flow', 'nx-action-security'],
			notes: `A **Server Action** is an async function marked \`'use server'\` that runs on the server but can be called from a form or an event handler.

\`\`\`tsx
// app/actions.ts
'use server';
export async function addTodo(formData: FormData) {
  await requireUser();
  await db.todo.create({ data: { title: String(formData.get('title')) } });
  revalidatePath('/todos');
}
// <form action={addTodo}>...</form>
\`\`\`

Used as a form \`action\`, the form posts to the server even **before JavaScript loads**, then hydration upgrades it. With \`useActionState\` the action gets the previous state as its first argument; \`useFormStatus\` (inside the form) reports pending; \`useOptimistic\` shows the expected result at once and reverts if the action fails.

Treat every action as a **public HTTP endpoint**: authenticate and authorise inside it, validate the input, and return only what the UI needs. Next.js adds CSRF protection (it compares the \`Origin\` and \`Host\` headers) and a 1 MB body limit by default.

**Common trap:** \`redirect()\` throws, so calling it inside \`try { } catch { }\` lets the catch swallow it and nothing happens.`
		},
		{
			id: 'navigation-and-links',
			title: 'Navigation and links',
			level: 'basic',
			summary: 'Link, prefetching, the router hooks and the redirect functions.',
			scenes: ['nx-prefetch-viewport', 'nx-redirect-throws'],
			notes: `Use \`<Link>\` from \`next/link\` for navigation. It does a **client-side transition**: shared layouts stay and only what changed is swapped. In production a link **prefetches** its target when it enters the viewport; a plain \`<a>\` does neither.

\`\`\`tsx
import Link from 'next/link';
<Link href="/blog" scroll={false}>Blog</Link>
\`\`\`

For a static route the whole route is prefetched. For a dynamic route only the part down to the nearest \`loading.tsx\` is. Next.js 16 downloads a shared layout once and prefetches only the parts you do not already have.

In Client Components use \`useRouter\` (from \`next/navigation\`) for \`push\`, \`replace\` and \`refresh()\`, which re-fetches Server Components while keeping client state. \`usePathname\` returns only the path, without the query or hash. On the server use \`redirect()\` (307), \`permanentRedirect()\` (308) and \`notFound()\`.

**Common trap:** importing \`useRouter\` from \`next/router\`. In the App Router it comes from \`next/navigation\`.`
		},
		{
			id: 'params-and-search-params',
			title: 'Params and search params',
			level: 'basic',
			summary: 'params and searchParams are Promises in Next.js 15 and 16.',
			scenes: ['nx-async-params'],
			notes: `In Next.js 15 and 16 the \`params\` and \`searchParams\` props are **Promises**. In an async Server Component you await them.

\`\`\`tsx
export default async function Page({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params;
  return <h1>{slug}</h1>;
}
\`\`\`

\`next typegen\` generates global \`PageProps\`, \`LayoutProps\` and \`RouteContext\` helpers, so you do not write these types by hand. A Client Component page unwraps the promise with \`use(params)\`. The same async rule applies to \`cookies()\` and \`headers()\`. Next.js 16 removed the temporary synchronous access, so a Next.js 14 style \`params.slug\` no longer works.

\`searchParams\` gives a string, or an **array** when a key repeats: \`?tag=a&tag=b\` is \`['a', 'b']\`. Layouts do not receive \`searchParams\`, because they do not re-render on navigation and the value would go stale. Reading \`params\` or \`searchParams\` also makes a page dynamic unless you prerender known values with \`generateStaticParams\`.

**Common trap:** awaiting \`params\` at the top of a layout makes the whole layout wait for request data and keeps it out of the static shell.`
		},
		{
			id: 'metadata-and-images',
			title: 'Metadata, images and fonts',
			level: 'basic',
			summary: 'Titles and tags, optimised images and self-hosted fonts.',
			scenes: ['nx-metadata-merge', 'nx-image-pipeline'],
			notes: `Export a \`metadata\` object, or an async \`generateMetadata\`, from a **Server Component** layout or page to set the title and tags. \`metadata\` and \`generateMetadata\` do not work in a file marked \`'use client'\`.

\`\`\`tsx
export const metadata = {
  title: { template: '%s | Acme', default: 'Acme' },
};
\`\`\`

A layout's \`title.template\` applies to child pages and needs \`title.default\`. Merging is **shallow**: a page's \`openGraph\` replaces the layout's whole \`openGraph\` object, unless you \`await parent\` and spread it. Relative image URLs need \`metadataBase\`.

\`next/image\` optimises images: it serves resized WebP (AVIF if enabled) through \`/_next/image\`, and needs \`alt\` plus \`width\` and \`height\` (or \`fill\` inside a positioned parent). Allow external hosts in \`images.remotePatterns\`. \`next/font/google\` downloads fonts at build time and self-hosts them. \`next/script\` with \`beforeInteractive\` belongs in the root layout.

**Common trap:** in Next.js 16 a local image with a query string, like \`/photo.jpg?v=2\`, needs an \`images.localPatterns\` entry.`
		},
		{
			id: 'parallel-and-intercepting-routes',
			title: 'Parallel and intercepting routes',
			level: 'advanced',
			summary: 'Slots in a layout, default.tsx, and modals that keep their own URL.',
			scenes: ['nx-parallel-slots', 'nx-intercepting-modal'],
			notes: `**Parallel routes** render several pages in one layout at the same time. A folder starting with \`@\` is a **slot**: it is passed to the layout as a prop next to \`children\` and adds no URL segment.

\`\`\`tsx
export default function Layout({ children, team, analytics }: {
  children: React.ReactNode; team: React.ReactNode; analytics: React.ReactNode;
}) {
  return <>{children}{team}{analytics}</>;
}
\`\`\`

Each slot has its own loading and error states. On a soft navigation a slot with no matching page keeps its last content; after a reload that is impossible, so Next.js renders the slot's \`default.tsx\`. In Next.js 16 **every slot needs an explicit \`default.tsx\`** or the build fails.

**Intercepting routes** (\`(.)\`, \`(..)\`, \`(...)\`) show another route inside the current layout during a soft navigation, the classic modal over a feed. Reload or share the URL and the full page renders. Because slots keep their last page, add a catch-all slot page that returns \`null\` to close the modal.

**Common trap:** hiding a slot in the layout does not stop it running, so authorise inside each slot.`
		},
		{
			id: 'proxy-and-auth',
			title: 'Proxy and authentication',
			level: 'advanced',
			summary: 'proxy.ts runs first, and real authorisation lives close to the data.',
			scenes: ['nx-proxy-order', 'nx-auth-layers'],
			notes: `\`proxy.ts\` (called \`middleware.ts\` before Next.js 16) runs on the server **before a request is completed**, before routes render. It can redirect, rewrite, change headers, or respond directly.

\`\`\`ts
// proxy.ts
import { NextResponse, type NextRequest } from 'next/server';
export function proxy(request: NextRequest) {
  if (!request.cookies.has('session')) return NextResponse.redirect(new URL('/login', request.url));
}
export const config = { matcher: ['/dashboard/:path*'] };
\`\`\`

Without a \`matcher\` it runs on **every request**, including \`_next/static\` and \`public/\` files. In Next.js 16 it uses the Node.js runtime, and \`runtime\` cannot be set; keep \`middleware.ts\` only if you must stay on the Edge.

Use Proxy for **cheap, optimistic checks**. Real authorisation belongs close to the data: a data access layer with \`import 'server-only'\`, and inside every Server Action. A check only in a shared layout may not run on each navigation.

**Common trap:** Server Actions are POSTs to the page URL, so excluding a path from the matcher also skips Proxy for the actions on it.`
		},
		{
			id: 'config-env-and-deploy',
			title: 'Config, environment and deploy',
			level: 'mid',
			summary: 'next.config.ts, env files, standalone builds and the Next.js 16 upgrade.',
			scenes: ['nx-env-inlining'],
			notes: `\`next.config.ts\` holds the settings. In Next.js 16 **Turbopack** is the default bundler for \`next dev\` and \`next build\`, and its options live under a top-level \`turbopack\` key. \`next lint\` was removed: run ESLint or Biome yourself. Node.js 20.9+ and TypeScript 5.1+ are required.

Environment files (\`.env\`, \`.env.local\`, ...) live in the **project root**, even with a \`src/\` folder. Variables prefixed \`NEXT_PUBLIC_\` are **inlined into the JavaScript bundle at build time**; everything else stays on the server.

\`\`\`ts
// next.config.ts
import type { NextConfig } from 'next';
const nextConfig: NextConfig = { cacheComponents: true, output: 'standalone' };
export default nextConfig;
\`\`\`

\`output: 'standalone'\` builds a small server for Docker (\`node server.js\`). Static export (\`output: 'export'\`) cannot use Server Actions, Proxy or \`use cache\`. \`instrumentation.ts\` runs once at start-up, for tools like OpenTelemetry. The automated upgrade is \`npx @next/codemod@canary upgrade latest\`.

**Common trap:** promoting one Docker image from staging to production keeps the \`NEXT_PUBLIC_\` values from the build, not the production ones.`
		}
	]
};
