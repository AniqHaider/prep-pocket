import type { Scene } from '../types';

/** Next.js (App Router, Next.js 15 and 16, as framed by the question bank in src/prep2/questions/next1.ts and next2.ts). */
export const nextjsScenes: Scene[] = [
	// ───────────── app-router-and-layouts ─────────────
	{
		id: 'nx-folder-to-url',
		topic: 'nextjs',
		group: 'app-router-and-layouts',
		title: 'Folders become URLs',
		blurb: 'Which folders in app/ turn into pages, and which do not?',
		nodes: [
			{
				id: 'tree', kind: 'doc', x: 10, y: 20, w: 196, title: 'the app/ folder', visible: true,
				lines: ['app/', '  layout.tsx', '  page.tsx', '  (marketing)/', '    about/', '      page.tsx', '  blog/[slug]/', '    page.tsx', '  _components/', '    Card.tsx']
			},
			{ id: 'u1', kind: 'text', x: 222, y: 70, text: '/', tone: 'accent', size: 'md' },
			{ id: 'u2', kind: 'text', x: 222, y: 118, text: '/about', tone: 'accent', size: 'md' },
			{ id: 'u3', kind: 'text', x: 222, y: 150, text: '/blog/:slug', tone: 'accent', size: 'md' },
			{ id: 'u4', kind: 'text', x: 222, y: 182, text: 'not routed', tone: 'warn', size: 'md' },
			{ id: 'note', kind: 'text', x: 10, y: 262, w: 340, text: 'A folder is a URL only if it holds a page.tsx.', size: 'sm' }
		],
		steps: [
			{ say: 'In the App Router, routes are folders. A folder inside app/ becomes a URL only when it contains a page.tsx file.', focus: ['tree'] },
			{ say: 'app/page.tsx is the root page, so it serves the URL /.', set: { tree: { hl: [2] } }, show: ['u1'] },
			{ say: 'A folder name in parentheses is a route group. It organises files but adds nothing to the URL, so about/page.tsx is served at /about.', set: { tree: { hl: [3, 4, 5] } }, show: ['u2'] },
			{ say: 'A name in square brackets is a dynamic segment: one page file serves /blog/hello, /blog/next and every other value.', set: { tree: { hl: [6, 7] } }, show: ['u3'] },
			{ say: 'A folder that starts with an underscore opts out of routing, so _components is never a URL. Neither is a folder with no page.tsx.', set: { tree: { hl: [8, 9] } }, show: ['u4'] },
			{ say: 'layout.tsx wraps the pages below it. The root layout is required and must render the html and body tags.', set: { tree: { hl: [1] } }, show: ['note'] }
		]
	},
	{
		id: 'nx-nested-layouts',
		topic: 'nextjs',
		group: 'app-router-and-layouts',
		title: 'Layouts stay mounted',
		blurb: 'What happens to a shared layout when you move between its pages?',
		nodes: [
			{ id: 'url', kind: 'text', x: 70, y: 22, text: 'URL: /dashboard/overview', visible: true },
			{ id: 'root', kind: 'box', x: 60, y: 40, w: 240, h: 44, label: 'app/layout.tsx', sub: 'html, body', visible: true },
			{ id: 'dash', kind: 'box', x: 60, y: 108, w: 240, h: 54, label: 'dashboard/layout.tsx', sub: 'sidebar, counter = 3', visible: true },
			{ id: 'p1', kind: 'box', x: 60, y: 186, w: 240, h: 44, label: 'overview/page.tsx', visible: true },
			{ id: 'p2', kind: 'box', x: 60, y: 186, w: 240, h: 44, label: 'settings/page.tsx', tone: 'accent' },
			{ id: 'e1', kind: 'edge', from: 'root', to: 'dash', visible: true },
			{ id: 'e2', kind: 'edge', from: 'dash', to: 'p1', visible: true },
			{ id: 'tmpl', kind: 'text', x: 60, y: 262, w: 250, text: 'template.tsx: a fresh copy each time', tone: 'warn', size: 'sm' }
		],
		steps: [
			{ say: 'A route is a stack of layouts with a page at the bottom. The dashboard layout holds a sidebar with a counter at 3.', focus: ['dash'] },
			{ say: 'The user clicks a sidebar link to the settings page. The URL changes.', set: { url: { text: 'URL: /dashboard/settings' } } },
			{ say: 'Only the page is swapped. Both layouts stay mounted: they do not re-render and the counter is still 3.', hide: ['p1'], show: ['p2'], focus: ['dash', 'root'] },
			{ say: 'Because layouts do not re-render on navigation, they never receive searchParams. The value would go stale.', focus: ['dash'] },
			{ say: 'Need fresh state on every navigation? template.tsx is like a layout, but it gets a new instance each time, so state resets.', show: ['tmpl'], focus: ['tmpl'] }
		]
	},

	// ───────────── server-vs-client-components ─────────────
	{
		id: 'nx-client-boundary',
		topic: 'nextjs',
		group: 'server-vs-client-components',
		title: 'The client boundary',
		blurb: 'Where does server code stop and client code start?',
		nodes: [
			{ id: 'page', kind: 'box', x: 130, y: 10, w: 100, h: 44, label: 'Page', sub: 'server', visible: true },
			{ id: 'head', kind: 'box', x: 14, y: 100, w: 96, h: 44, label: 'Header', sub: 'server' },
			{ id: 'foot', kind: 'box', x: 250, y: 100, w: 96, h: 44, label: 'Footer', sub: 'server' },
			{ id: 'cnt', kind: 'box', x: 132, y: 100, w: 96, h: 44, label: 'Counter', sub: "'use client'", tone: 'accent' },
			{ id: 'btn', kind: 'box', x: 132, y: 190, w: 96, h: 44, label: 'Button', sub: 'client too', tone: 'accent' },
			{ id: 'e1', kind: 'edge', from: 'page', to: 'head' },
			{ id: 'e2', kind: 'edge', from: 'page', to: 'foot' },
			{ id: 'e3', kind: 'edge', from: 'page', to: 'cnt' },
			{ id: 'e4', kind: 'edge', from: 'cnt', to: 'btn' },
			{ id: 'note', kind: 'text', x: 20, y: 268, w: 320, text: 'Only the interactive leaf ships JavaScript.', size: 'sm' }
		],
		steps: [
			{ say: 'In the App Router every component is a Server Component by default. It runs on the server and ships no JavaScript of its own.', show: ['head', 'foot', 'e1', 'e2'], focus: ['page'] },
			{ say: "Counter needs useState, so its file starts with 'use client'. That line begins a client boundary.", show: ['cnt', 'e3'], focus: ['cnt'] },
			{ say: 'Everything Counter imports becomes client code too. Button needs no directive of its own.', show: ['btn', 'e4'], focus: ['btn'] },
			{ say: 'A client file cannot import a Server Component, because the import would turn it into client code. It can still receive one as children.', focus: ['cnt'] },
			{ say: 'Keep the boundary low. Header and Footer stay on the server; only the interactive part pays the JavaScript cost.', show: ['note'], focus: ['head', 'foot'] }
		]
	},
	{
		id: 'nx-server-client-props',
		topic: 'nextjs',
		group: 'server-vs-client-components',
		title: 'What can cross the boundary',
		blurb: 'Which props can a Server Component pass to a Client Component?',
		nodes: [
			{ id: 'srv', kind: 'box', x: 90, y: 14, w: 180, h: 46, label: 'Server: page.tsx', sub: 'renders <Modal>', visible: true },
			{ id: 'cli', kind: 'box', x: 90, y: 200, w: 180, h: 54, label: "Client: Modal", sub: "'use client'", tone: 'accent', visible: true },
			{ id: 'e1', kind: 'edge', from: 'srv', to: 'cli', label: 'RSC payload', visible: true },
			{ id: 't1', kind: 'token', x: 40, y: 80, label: 'title: string' },
			{ id: 't2', kind: 'token', x: 40, y: 80, label: 'onClose: function', tone: 'neg' },
			{ id: 'cart', kind: 'box', x: 270, y: 80, w: 80, h: 40, label: 'Cart', sub: 'server' },
			{ id: 'ecart', kind: 'edge', from: 'cart', to: 'cli', label: 'children', tone: 'accent' },
			{ id: 'fix', kind: 'text', x: 20, y: 280, w: 330, text: 'Define it in the client file, or pass a Server Action.', size: 'sm' }
		],
		steps: [
			{ say: 'A Server Component renders a client Modal. Whatever it passes must be sent over the network inside the RSC payload.', focus: ['srv', 'cli'] },
			{ say: 'A plain string is serialisable, so it crosses the boundary without trouble.', show: ['t1'], move: { t1: { x: 40, y: 175 } } },
			{ say: 'An inline callback is not. Functions cannot be serialised, so passing onClose from a Server Component fails.', hide: ['t1'], show: ['t2'], move: { t2: { x: 40, y: 130 } }, pulse: ['t2'] },
			{ say: 'Fix it by defining the handler inside the client component, or pass a Server Action, which is a reference the client can call.', hide: ['t2'], show: ['fix'], focus: ['cli'] },
			{ say: 'children is different. The Cart renders on the server, and the Modal receives its finished output as children.', show: ['cart', 'ecart'], pulse: ['cart'], focus: ['cli'] }
		]
	},

	// ───────────── data-and-rendering ─────────────
	{
		id: 'nx-parallel-fetch',
		topic: 'nextjs',
		group: 'data-and-rendering',
		title: 'Waterfall or parallel',
		blurb: 'Why do two independent fetches run one after the other?',
		nodes: [
			{ id: 'axis', kind: 'text', x: 10, y: 24, text: 'time goes right', size: 'sm', visible: true },
			{ id: 'a', kind: 'box', x: 20, y: 44, w: 130, h: 36, label: 'getUser()', sub: '1 s', tone: 'accent', visible: true },
			{ id: 'b', kind: 'box', x: 160, y: 96, w: 130, h: 36, label: 'getPosts()', sub: '1 s', tone: 'warn', visible: true },
			{ id: 'tot', kind: 'text', x: 20, y: 168, w: 320, text: 'Total: 2 s (one after the other)', tone: 'warn', visible: true },
			{ id: 'code', kind: 'doc', x: 10, y: 190, w: 340, lines: ['const u = getUser();', 'const p = getPosts();', 'const [user, posts] = await Promise.all([u, p]);'] },
			{ id: 'cache', kind: 'text', x: 10, y: 268, w: 340, text: 'Same helper in two components? Wrap it in React cache.', size: 'sm' }
		],
		steps: [
			{ say: 'A Server Component needs two independent pieces of data: the user and their posts. Each request takes about a second.', focus: ['a', 'b'] },
			{ say: 'Awaiting them one after the other is a waterfall. getPosts only starts when getUser is done, so the page waits 2 seconds.', focus: ['b'], pulse: ['b'] },
			{ say: 'They do not depend on each other, so start both requests at once.', move: { b: { x: 20, y: 96 } }, set: { tot: { text: 'Total: 1 s (at the same time)', tone: 'accent' } } },
			{ say: 'Then await them together with Promise.all. The page takes as long as the slowest request, not the sum.', show: ['code'], hide: ['axis'], focus: ['code'] },
			{ say: 'If two components need the same data, wrap the helper in React cache. Same arguments in one request means one call.', hide: ['code'], show: ['cache'], focus: ['cache'] }
		]
	},
	{
		id: 'nx-static-vs-dynamic',
		topic: 'nextjs',
		group: 'data-and-rendering',
		title: 'Build time or request time',
		blurb: 'When does Next.js render a page, and what makes it dynamic?',
		nodes: [
			{ id: 'b1', kind: 'box', x: 20, y: 24, w: 130, h: 40, label: 'next build', sub: 'renders once', visible: true },
			{ id: 'b2', kind: 'db', x: 24, y: 112, w: 122, h: 46, label: 'stored HTML' },
			{ id: 'v1', kind: 'box', x: 20, y: 216, w: 130, h: 40, label: 'Every visitor', sub: 'same file' },
			{ id: 'eb1', kind: 'edge', from: 'b1', to: 'b2' },
			{ id: 'eb2', kind: 'edge', from: 'b2', to: 'v1', label: 'served', tone: 'accent' },
			{ id: 'r1', kind: 'box', x: 220, y: 24, w: 130, h: 40, label: 'cookies()', sub: 'request data', tone: 'warn' },
			{ id: 'r2', kind: 'box', x: 220, y: 112, w: 130, h: 46, label: 'Render per visit', sub: 'dynamic route', tone: 'warn' },
			{ id: 'er', kind: 'edge', from: 'r1', to: 'r2', tone: 'warn' },
			{ id: 'gsp', kind: 'text', x: 200, y: 216, w: 150, text: 'generateStaticParams: slug hello, next', size: 'sm' },
			{ id: 'dp', kind: 'text', x: 200, y: 262, w: 150, text: 'dynamicParams = false: others give 404', size: 'sm' }
		],
		steps: [
			{ say: 'Next.js can render a page at two moments: at build time, or when a request arrives.', show: ['b1'], focus: ['b1'] },
			{ say: 'At build time it renders once and stores the HTML. Every visitor gets that same stored file, which is fast and can sit on a CDN.', show: ['b2', 'eb1', 'v1', 'eb2'], focus: ['b2'] },
			{ say: 'Reading request data, like cookies() or headers(), makes a route dynamic. It must render for each visitor (without Cache Components).', show: ['r1', 'r2', 'er'], focus: ['r2'] },
			{ say: 'For a dynamic route like /blog/[slug], generateStaticParams lists the values to prerender at build time.', show: ['gsp'], focus: ['gsp'] },
			{ say: 'With dynamicParams set to false, any value that was not listed answers 404 instead of being rendered on demand.', show: ['dp'], focus: ['dp'] },
			{ say: 'Next.js 16 with Cache Components blends these: static and cached parts form a shell, and request-time parts stream in behind Suspense.', hide: ['r1', 'er', 'gsp', 'dp'], focus: ['b2', 'r2'] }
		]
	},

	// ───────────── caching-and-use-cache ─────────────
	{
		id: 'nx-static-shell-streaming',
		topic: 'nextjs',
		group: 'caching-and-use-cache',
		title: 'The static shell',
		blurb: 'How can one route be partly static and partly dynamic?',
		nodes: [
			{ id: 'hdr', kind: 'box', x: 40, y: 24, w: 280, h: 54, label: '<header> and nav', sub: 'plain static content', visible: true },
			{ id: 'posts', kind: 'box', x: 40, y: 96, w: 280, h: 54, label: '<BlogPosts />', sub: "'use cache' with cacheLife('hours')", visible: true },
			{ id: 'pref', kind: 'box', x: 40, y: 168, w: 280, h: 54, label: '<UserPreferences />', sub: 'reads cookies() at request time', visible: true },
			{ id: 'note', kind: 'text', x: 40, y: 262, w: 280, text: 'Shell: sent at once. Fallback: replaced when ready.', size: 'sm' }
		],
		steps: [
			{ say: 'With cacheComponents turned on (Next.js 16), the content of a route falls into three kinds.', focus: ['hdr', 'posts', 'pref'] },
			{ say: 'Static content, like the header, is prerendered at build time and becomes part of the static shell.', set: { hdr: { tone: 'accent', sub: 'in the shell' } }, focus: ['hdr'] },
			{ say: "Cached content, a component marked 'use cache', also lands in the shell, as long as its lifetime is not too short.", set: { posts: { tone: 'accent', sub: 'in the shell, cached' } }, focus: ['posts'] },
			{ say: 'Request-time content cannot be prerendered. It sits behind a Suspense fallback, so the shell can still go out.', set: { pref: { tone: 'warn', label: 'Loading preferences...', sub: 'Suspense fallback' } }, focus: ['pref'] },
			{ say: 'The browser gets the shell at once. Then the request-time part streams in and replaces its fallback.', set: { pref: { tone: 'accent', label: 'theme: dark', sub: 'streamed in' } }, pulse: ['pref'], show: ['note'] },
			{ say: 'An uncached read with no Suspense boundary and no cache is reported as a blocking route while prerendering. Wrap it or cache it.', set: { pref: { tone: 'neg', label: '<UserPreferences />', sub: 'no Suspense: blocking route' } }, focus: ['pref'] }
		]
	},
	{
		id: 'nx-use-cache-hit-miss',
		topic: 'nextjs',
		group: 'caching-and-use-cache',
		title: 'A use cache hit and miss',
		blurb: 'What does a function marked use cache actually do on each call?',
		nodes: [
			{ id: 'req', kind: 'box', x: 8, y: 110, w: 84, h: 40, label: 'Caller', visible: true },
			{ id: 'fn', kind: 'box', x: 132, y: 100, w: 100, h: 56, label: 'getProducts()', sub: "'use cache'", visible: true },
			{ id: 'cache', kind: 'db', x: 272, y: 106, w: 80, h: 44, label: 'cache' },
			{ id: 'api', kind: 'box', x: 132, y: 212, w: 100, h: 40, label: 'Database', sub: 'slow' },
			{ id: 'e1', kind: 'edge', from: 'req', to: 'fn', label: 'call', visible: true },
			{ id: 'e2', kind: 'edge', from: 'fn', to: 'api', label: 'query' },
			{ id: 'e3', kind: 'edge', from: 'fn', to: 'cache', label: 'store', tone: 'accent' },
			{ id: 'e4', kind: 'edge', from: 'cache', to: 'fn', label: 'hit', tone: 'accent' },
			{ id: 'key', kind: 'text', x: 10, y: 20, w: 340, text: 'key = build ID + function + arguments + captured variables', size: 'sm' }
		],
		steps: [
			{ say: "A function marked 'use cache' remembers its result. The first call finds no entry in the cache, so the function runs.", focus: ['fn'] },
			{ say: 'The function does its slow work: here, a database query.', show: ['api', 'e2'], focus: ['api'] },
			{ say: 'The result is stored with a lifetime. Without a cacheLife call the default profile applies: it revalidates on the server after 15 minutes and never expires by time.', show: ['cache', 'e3'], pulse: ['cache'] },
			{ say: 'The next call with the same inputs is a hit. The stored value comes back and the database is not touched.', hide: ['e2', 'api', 'e3'], show: ['e4'], focus: ['cache'] },
			{ say: 'The cache key includes the arguments and any variables the function captures, so getProducts for shoes and for hats are separate entries.', show: ['key'], focus: ['key'] },
			{ say: 'The key also holds the build ID. After a new deployment, entries from the previous build are not reused.', focus: ['key'] }
		]
	},
	{
		id: 'nx-revalidate-tag',
		topic: 'nextjs',
		group: 'caching-and-use-cache',
		title: 'Invalidating by tag',
		blurb: 'How do you refresh cached content after an edit?',
		nodes: [
			{ id: 'act', kind: 'box', x: 100, y: 12, w: 160, h: 46, label: 'Server Action', sub: 'saves an edited post', visible: true },
			{ id: 'c1', kind: 'box', x: 8, y: 130, w: 102, h: 50, label: 'posts list', sub: "cacheTag('posts')", tone: 'accent', visible: true },
			{ id: 'c2', kind: 'box', x: 129, y: 130, w: 102, h: 50, label: 'post page', sub: "cacheTag('posts')", tone: 'accent', visible: true },
			{ id: 'c3', kind: 'box', x: 250, y: 130, w: 102, h: 50, label: 'sidebar', sub: "cacheTag('posts')", tone: 'accent', visible: true },
			{ id: 'e1', kind: 'edge', from: 'act', to: 'c1' },
			{ id: 'e2', kind: 'edge', from: 'act', to: 'c2' },
			{ id: 'e3', kind: 'edge', from: 'act', to: 'c3' },
			{ id: 'who', kind: 'text', x: 10, y: 226, w: 340, text: 'updateTag: Server Actions only. revalidateTag: also Route Handlers, such as a CMS webhook.', size: 'sm' }
		],
		steps: [
			{ say: "Cached entries can carry tags. Here the list, a post page and the sidebar all use cacheTag('posts').", focus: ['c1', 'c2', 'c3'] },
			{ say: 'A Server Action saves an edited post. Every cached copy of the old post is now out of date.', show: ['e1', 'e2', 'e3'], focus: ['act'] },
			{ say: "updateTag('posts') expires the tagged entries at once. The next read waits for fresh data, so the author sees their own edit.", set: { c1: { tone: 'neg', sub: 'expired' }, c2: { tone: 'neg', sub: 'expired' }, c3: { tone: 'neg', sub: 'expired' } } },
			{ say: "revalidateTag('posts', 'max') works stale-while-revalidate. Visitors still get the old copy while a fresh one builds in the background.", set: { c1: { tone: 'warn', sub: 'stale, refreshing' }, c2: { tone: 'warn', sub: 'stale, refreshing' }, c3: { tone: 'warn', sub: 'stale, refreshing' } } },
			{ say: 'updateTag only works in Server Actions. revalidateTag also works in Route Handlers, so a webhook can invalidate content.', show: ['who'], focus: ['who'] },
			{ say: 'Neither can be called while a component is rendering. Invalidate from an action or a handler, after a change.', set: { c1: { tone: 'accent', sub: 'fresh' }, c2: { tone: 'accent', sub: 'fresh' }, c3: { tone: 'accent', sub: 'fresh' } } }
		]
	},

	// ───────────── streaming-and-errors ─────────────
	{
		id: 'nx-suspense-streaming',
		topic: 'nextjs',
		group: 'streaming-and-errors',
		title: 'Streaming with Suspense',
		blurb: 'How can a page show up before its slow data is ready?',
		nodes: [
			{ id: 'srv', kind: 'box', x: 8, y: 100, w: 84, h: 50, label: 'Server', visible: true },
			{ id: 'hdr', kind: 'box', x: 150, y: 52, w: 200, h: 44, label: 'Header', sub: 'ready' },
			{ id: 'feed', kind: 'box', x: 150, y: 140, w: 200, h: 64, label: 'Loading feed...', sub: 'Suspense fallback', tone: 'warn' },
			{ id: 'e1', kind: 'edge', from: 'srv', to: 'hdr', label: 'chunk 1' },
			{ id: 'e2', kind: 'edge', from: 'srv', to: 'feed', label: 'chunk 2' },
			{ id: 'status', kind: 'text', x: 10, y: 238, w: 340, text: 'Status 200 is sent with the first chunk.', size: 'sm' }
		],
		steps: [
			{ say: 'Without streaming, the server must finish the whole page, slow data included, before it sends a single byte.', focus: ['srv'] },
			{ say: 'With a Suspense boundary the server sends what is ready first: the page with a fallback where the slow part will go.', show: ['hdr', 'feed', 'e1'], focus: ['hdr', 'feed'] },
			{ say: 'The browser can already show the header and the fallback. The status line was sent with this first chunk, so it is 200.', show: ['status'], focus: ['status'] },
			{ say: 'When the slow data arrives, the server streams that chunk and React swaps it in for the fallback.', show: ['e2'], set: { feed: { tone: 'accent', label: 'The feed', sub: 'streamed in' } }, pulse: ['feed'] },
			{ say: 'loading.tsx does the same for a segment: it wraps the page in Suspense. It does not wrap the layout in the same folder.', hide: ['status'], focus: ['feed'] },
			{ say: 'Because the status was already sent, calling notFound() after streaming has started still answers 200, with a noindex tag.', set: { status: { text: 'notFound() after streaming: still 200.' } }, show: ['status'], focus: ['status'] }
		]
	},
	{
		id: 'nx-error-boundaries',
		topic: 'nextjs',
		group: 'streaming-and-errors',
		title: 'Which error.tsx catches it',
		blurb: 'Where does a thrown error stop in the segment tree?',
		nodes: [
			{ id: 'rl', kind: 'box', x: 40, y: 8, w: 200, h: 38, label: 'app/layout.tsx', visible: true },
			{ id: 're', kind: 'box', x: 40, y: 62, w: 200, h: 38, label: 'app/error.tsx', sub: 'client component', tone: 'accent', visible: true },
			{ id: 'dl', kind: 'box', x: 40, y: 116, w: 200, h: 38, label: 'dashboard/layout.tsx', visible: true },
			{ id: 'de', kind: 'box', x: 40, y: 170, w: 200, h: 38, label: 'dashboard/error.tsx', sub: 'client component', tone: 'accent', visible: true },
			{ id: 'dp', kind: 'box', x: 40, y: 224, w: 200, h: 38, label: 'dashboard/page.tsx', visible: true },
			{ id: 'err', kind: 'token', x: 280, y: 243, label: 'throw', tone: 'neg' },
			{ id: 'ge', kind: 'text', x: 20, y: 284, w: 330, text: 'Root layout errors: global-error.tsx, with its own html and body.', size: 'sm' }
		],
		steps: [
			{ say: 'Each segment is wrapped from the outside in: layout, then error, then the page. A thrown error travels up to the nearest error boundary.', focus: ['de', 'dp'] },
			{ say: 'An error in dashboard/page.tsx is caught by dashboard/error.tsx, which sits just outside the page.', show: ['err'], move: { err: { x: 280, y: 189 } }, pulse: ['de'] },
			{ say: 'error.tsx must be a Client Component, because error boundaries are a client feature. It receives the error and a reset function.', focus: ['de', 're'] },
			{ say: 'An error in dashboard/layout.tsx is not caught by dashboard/error.tsx, which sits inside that layout. It goes up to app/error.tsx.', move: { err: { x: 280, y: 135 } } },
			{ say: 'The error reaches app/error.tsx, the nearest boundary above the layout that threw.', move: { err: { x: 280, y: 81 } }, pulse: ['re'] },
			{ say: 'In production the message is replaced by a generic one plus a digest to match server logs. global-error.tsx covers the root layout.', show: ['ge'], focus: ['ge'] }
		]
	},

	// ───────────── route-handlers ─────────────
	{
		id: 'nx-route-handler',
		topic: 'nextjs',
		group: 'route-handlers',
		title: 'A route handler',
		blurb: 'How do you build a plain HTTP endpoint in the App Router?',
		nodes: [
			{ id: 'br', kind: 'box', x: 120, y: 8, w: 120, h: 40, label: 'Browser', visible: true },
			{
				id: 'code', kind: 'doc', x: 40, y: 96, w: 280, title: 'app/api/time/route.ts', visible: true,
				lines: ['export async function GET() {', '  return Response.json({', '    now: Date.now(),', '  });', '}']
			},
			{ id: 'req', kind: 'edge', from: 'br', to: 'code', label: 'GET /api/time' },
			{ id: 'res', kind: 'edge', from: 'code', to: 'br', label: '200 JSON', tone: 'accent' },
			{ id: 'verbs', kind: 'text', x: 20, y: 236, w: 330, text: 'GET POST PUT PATCH DELETE HEAD OPTIONS', size: 'sm' },
			{ id: 'cache', kind: 'text', x: 20, y: 262, w: 330, text: "Not cached by default. Opt in: dynamic = 'force-static' (removed with Cache Components).", size: 'sm', tone: 'warn' }
		],
		steps: [
			{ say: 'A route.ts file in a folder makes an HTTP endpoint. app/api/time/route.ts answers requests to /api/time.', focus: ['code'] },
			{ say: 'A GET request arrives, and Next.js calls the exported function named GET.', show: ['req'], set: { code: { hl: [0] } } },
			{ say: 'The handler returns a standard Web Response. Response.json builds the body and the content type.', show: ['res'], set: { code: { hl: [1, 2, 3] } }, pulse: ['code'] },
			{ say: 'Export one function per HTTP verb you support: GET, POST, PUT, PATCH, DELETE, HEAD or OPTIONS.', show: ['verbs'], set: { code: { hl: [] } }, focus: ['verbs'] },
			{ say: 'Since Next.js 15, a GET handler is not cached by default: it runs on every request. Opt in with force-static (not available once Cache Components is on).', show: ['cache'], focus: ['cache'] },
			{ say: 'A route.ts cannot share a folder with a page.tsx, because both would answer the same URL.', hide: ['verbs', 'cache'], focus: ['code'] }
		]
	},

	// ───────────── server-actions ─────────────
	{
		id: 'nx-server-action-flow',
		topic: 'nextjs',
		group: 'server-actions',
		title: 'A Server Action, end to end',
		blurb: 'What happens between pressing submit and seeing the new data?',
		nodes: [
			{ id: 'form', kind: 'box', x: 110, y: 8, w: 140, h: 44, label: 'Browser form', sub: 'action={addTodo}', visible: true },
			{ id: 'act', kind: 'box', x: 100, y: 100, w: 160, h: 54, label: "addTodo()", sub: "'use server'", tone: 'accent' },
			{ id: 'db', kind: 'db', x: 128, y: 200, w: 104, h: 46, label: 'Database' },
			{ id: 'e1', kind: 'edge', from: 'form', to: 'act', label: 'POST + FormData' },
			{ id: 'e2', kind: 'edge', from: 'act', to: 'db', label: 'save' },
			{ id: 'e3', kind: 'edge', from: 'act', to: 'form', label: 'new UI', tone: 'accent' },
			{ id: 'rev', kind: 'text', x: 220, y: 188, w: 130, text: 'revalidatePath("/todos")', size: 'sm' },
			{ id: 'try', kind: 'text', x: 10, y: 270, w: 340, text: 'redirect() throws: call it outside try/catch.', size: 'sm', tone: 'warn' }
		],
		steps: [
			{ say: "A form's action can be a function marked 'use server'. The form posts to the server even before JavaScript has loaded.", focus: ['form'] },
			{ say: 'Submitting sends a POST request with the form data. Next.js wires this up; you never write the fetch yourself.', show: ['act', 'e1'], pulse: ['act'] },
			{ say: 'The action runs on the server: validate the input, then save. Treat it as a public endpoint and check who is calling.', show: ['db', 'e2'], focus: ['act', 'db'] },
			{ say: 'After saving, call revalidatePath or a tag function so the cached pages that show this data are refreshed.', show: ['rev'], focus: ['rev'] },
			{ say: 'The response carries the updated UI, so the page changes without a full reload.', show: ['e3'], pulse: ['form'] },
			{ say: 'If the action ends with redirect(), keep it outside any try/catch. redirect throws, and a catch block would swallow it.', show: ['try'], focus: ['try'] }
		]
	},
	{
		id: 'nx-action-security',
		topic: 'nextjs',
		group: 'server-actions',
		title: 'The action is a public endpoint',
		blurb: 'Is checking permission on the page enough to protect an action?',
		nodes: [
			{ id: 'page', kind: 'box', x: 10, y: 20, w: 140, h: 50, label: 'Admin page', sub: 'redirects non-admins', visible: true },
			{ id: 'act', kind: 'box', x: 200, y: 112, w: 150, h: 58, label: 'deleteItem()', sub: 'Server Action', visible: true },
			{ id: 'atk', kind: 'box', x: 10, y: 214, w: 130, h: 44, label: 'Attacker', tone: 'neg' },
			{ id: 'e1', kind: 'edge', from: 'page', to: 'act', label: 'form' },
			{ id: 'e2', kind: 'edge', from: 'atk', to: 'act', label: 'raw POST', tone: 'neg' },
			{ id: 'chk', kind: 'text', x: 200, y: 200, w: 150, text: 'check auth inside the action', tone: 'accent', size: 'sm' },
			{ id: 'safe', kind: 'text', x: 10, y: 280, w: 340, text: 'CSRF: Origin vs Host. Body limit: 1 MB by default.', size: 'sm' }
		],
		steps: [
			{ say: 'A page checks that the user is an admin, then renders a delete form that uses an inline Server Action.', focus: ['page', 'act'] },
			{ say: 'That check only protects the page. The action itself is a public POST endpoint.', show: ['e1'], focus: ['act'] },
			{ say: 'Anyone can send a crafted POST straight to the action and skip your page completely.', show: ['atk', 'e2'], pulse: ['act'] },
			{ say: 'So check authentication and authorisation inside the action, every time. A data access layer is a good home for it.', show: ['chk'], set: { act: { tone: 'accent' } }, focus: ['chk'] },
			{ say: 'Return only what the UI needs. The return value is serialised and sent to the client, so internal fields can leak.', focus: ['act'] },
			{ say: 'Next.js also compares the Origin header with Host as CSRF protection, and limits the request body to 1 MB by default.', show: ['safe'], focus: ['safe'] }
		]
	},

	// ───────────── navigation-and-links ─────────────
	{
		id: 'nx-prefetch-viewport',
		topic: 'nextjs',
		group: 'navigation-and-links',
		title: 'Prefetching a link',
		blurb: 'Why does clicking a Link feel instant?',
		nodes: [
			{ id: 'cur', kind: 'box', x: 10, y: 16, w: 130, h: 40, label: 'Current page', visible: true },
			{ id: 'lnk', kind: 'box', x: 10, y: 106, w: 130, h: 46, label: 'Link to /blog', sub: 'in the viewport', visible: true },
			{ id: 'srv', kind: 'box', x: 230, y: 106, w: 120, h: 46, label: 'Server', visible: true },
			{ id: 'rc', kind: 'db', x: 14, y: 206, w: 122, h: 44, label: 'router cache' },
			{ id: 'e1', kind: 'edge', from: 'lnk', to: 'srv', label: 'prefetch' },
			{ id: 'e2', kind: 'edge', from: 'srv', to: 'rc', label: 'payload', tone: 'accent' },
			{ id: 'note', kind: 'text', x: 180, y: 262, w: 170, text: 'a plain <a> tag: full page load, no prefetch', size: 'sm', tone: 'warn' }
		],
		steps: [
			{ say: 'A Link to a static route prefetches that route in the background when it enters the viewport, in a production build.', show: ['e1'], pulse: ['lnk'] },
			{ say: 'The server answers with the route payload, and it waits in the browser router cache.', show: ['rc', 'e2'], focus: ['rc'] },
			{ say: 'On click the page appears at once: it is already there. Shared layouts stay and only the new page is swapped in.', hide: ['e1'], set: { cur: { label: '/blog', tone: 'accent' } }, pulse: ['cur'] },
			{ say: 'For a dynamic route, only the shared layout and the nearest loading.tsx fallback are prefetched. The rest renders after the click.', set: { lnk: { sub: 'dynamic route' }, rc: { label: 'layout + loading' } }, focus: ['rc'] },
			{ say: 'A plain anchor tag does a full page load and does not prefetch. prefetch={false} switches it off for a long list of links.', show: ['note'], focus: ['note'] },
			{ say: 'Next.js 16 downloads a shared layout only once for many links and prefetches just the parts you do not have yet.', hide: ['note'], set: { rc: { label: 'layout: once' } }, focus: ['rc'] }
		]
	},
	{
		id: 'nx-redirect-throws',
		topic: 'nextjs',
		group: 'navigation-and-links',
		title: 'redirect() throws',
		blurb: 'Why does a redirect inside try/catch never happen?',
		nodes: [
			{
				id: 'bad', kind: 'doc', x: 20, y: 30, w: 320, title: 'broken', visible: true,
				lines: ['try {', '  await save();', "  redirect('/done');", '} catch (e) {', "  return { error: 'Failed' };", '}']
			},
			{
				id: 'good', kind: 'doc', x: 20, y: 30, w: 320, title: 'fixed',
				lines: ['try {', '  await save();', '} catch (e) {', "  return { error: 'Failed' };", '}', "redirect('/done');"]
			},
			{ id: 'codes', kind: 'text', x: 20, y: 190, w: 320, text: 'redirect: 307. permanentRedirect: 308. Server Action form post without JavaScript: 303.', size: 'sm' },
			{ id: 'btn', kind: 'text', x: 20, y: 250, w: 320, text: 'In a click handler in a Client Component: router.push().', size: 'sm' }
		],
		steps: [
			{ say: 'This action saves, then redirects. It looks right, but the redirect never happens.', focus: ['bad'] },
			{ say: 'redirect() does not return. It works by throwing a special error that Next.js catches in order to navigate.', set: { bad: { hl: [2] } } },
			{ say: 'The catch block catches that error first and returns the failure object. The navigation is swallowed.', set: { bad: { hl: [3, 4] } } },
			{ say: 'Call redirect after the try/catch, or rethrow framework errors in catch with unstable_rethrow.', hide: ['bad'], show: ['good'], set: { good: { hl: [5] } } },
			{ say: 'redirect uses status 307 and permanentRedirect uses 308. A Server Action form post without JavaScript gets a 303; with JavaScript the action navigates client-side.', show: ['codes'], focus: ['codes'] },
			{ say: 'Inside an event handler in a Client Component, redirect is not the tool. Use router.push from next/navigation.', show: ['btn'], focus: ['btn'] }
		]
	},

	// ───────────── params-and-search-params ─────────────
	{
		id: 'nx-async-params',
		topic: 'nextjs',
		group: 'params-and-search-params',
		title: 'params is a Promise',
		blurb: 'How do you read a dynamic segment in Next.js 15 and 16?',
		nodes: [
			{ id: 'url', kind: 'box', x: 100, y: 8, w: 160, h: 38, label: '/blog/hello', shape: 'pill', visible: true },
			{ id: 'page', kind: 'box', x: 70, y: 66, w: 220, h: 40, label: 'app/blog/[slug]/page.tsx', visible: true },
			{ id: 'prom', kind: 'box', x: 110, y: 128, w: 140, h: 40, label: 'params', sub: 'a Promise', tone: 'warn' },
			{ id: 'res', kind: 'box', x: 110, y: 196, w: 140, h: 38, label: '{ slug: "hello" }', tone: 'accent' },
			{ id: 'e1', kind: 'edge', from: 'url', to: 'page' },
			{ id: 'e2', kind: 'edge', from: 'page', to: 'prom' },
			{ id: 'e3', kind: 'edge', from: 'prom', to: 'res', label: 'await', tone: 'accent' },
			{ id: 'd1', kind: 'doc', x: 20, y: 244, w: 320, lines: ['const { slug } = await params;', 'const slug2 = params.slug; // fails in 16'] },
			{ id: 'd2', kind: 'doc', x: 20, y: 244, w: 320, lines: ["'use client';", 'const { slug } = use(params);'] }
		],
		steps: [
			{ say: 'A request for /blog/hello matches app/blog/[slug]/page.tsx. The value hello is a route parameter.', show: ['e1'], focus: ['url', 'page'] },
			{ say: 'In Next.js 15 and 16, the params prop is a Promise, not a plain object.', show: ['prom', 'e2'], focus: ['prom'] },
			{ say: 'In an async Server Component you await it and destructure the values you need.', show: ['res', 'e3', 'd1'], set: { d1: { hl: [0] } } },
			{ say: 'Next.js 16 removed the temporary synchronous access, so a Next.js 14 style params.slug now fails.', set: { d1: { hl: [1] } }, focus: ['d1'] },
			{ say: 'A Client Component page cannot be async. It unwraps the promise with React use(params) instead.', hide: ['d1'], show: ['d2'] },
			{ say: 'searchParams is a Promise too. A repeated key becomes an array: ?tag=a&tag=b gives tag as [a, b].', set: { res: { label: 'tag: ["a", "b"]' } }, hide: ['d2'], focus: ['res'] }
		]
	},

	// ───────────── metadata-and-images ─────────────
	{
		id: 'nx-image-pipeline',
		topic: 'nextjs',
		group: 'metadata-and-images',
		title: 'How next/image optimises',
		blurb: 'What happens to an image between your source file and the screen?',
		nodes: [
			{ id: 'br', kind: 'box', x: 120, y: 8, w: 120, h: 40, label: 'Browser', sub: 'srcset 640w, 828w', visible: true },
			{ id: 'opt', kind: 'box', x: 100, y: 96, w: 160, h: 50, label: '/_next/image', sub: 'resize + convert' },
			{ id: 'org', kind: 'box', x: 8, y: 212, w: 110, h: 44, label: 'Original', sub: 'photo.jpg' },
			{ id: 'cache', kind: 'db', x: 248, y: 204, w: 104, h: 46, label: 'cache' },
			{ id: 'e1', kind: 'edge', from: 'br', to: 'opt', label: 'w=640&q=75' },
			{ id: 'e2', kind: 'edge', from: 'opt', to: 'br', label: 'WebP', tone: 'accent' },
			{ id: 'e3', kind: 'edge', from: 'opt', to: 'org', label: 'fetch' },
			{ id: 'e4', kind: 'edge', from: 'opt', to: 'cache', label: 'store' },
			{ id: 'cfg', kind: 'text', x: 10, y: 280, w: 340, text: 'remotePatterns for hosts. qualities defaults to [75].', size: 'sm' }
		],
		steps: [
			{ say: 'You write the Image tag with alt, width and height. The size props reserve space so the page does not jump; CSS sets the shown size.', focus: ['br'] },
			{ say: 'Next.js renders an img with a srcset: several widths, each pointing at /_next/image with a width and a quality.', show: ['opt', 'e1'], focus: ['e1'] },
			{ say: 'The browser picks the width that suits its screen and asks for it. Its Accept header lists the formats it understands.', pulse: ['br'] },
			{ say: 'The optimiser fetches the original, resizes it, and converts to the best allowed format: WebP by default, AVIF if you enable it.', show: ['org', 'e3', 'e2'], focus: ['opt'] },
			{ say: 'The result is cached, so later requests for that size skip the work. In Next.js 16 the default minimumCacheTTL is 4 hours.', show: ['cache', 'e4'], focus: ['cache'] },
			{ say: 'Remote images need images.remotePatterns, and Next.js 16 needs the images.qualities list, which defaults to [75].', show: ['cfg'], focus: ['cfg'] }
		]
	},
	{
		id: 'nx-metadata-merge',
		topic: 'nextjs',
		group: 'metadata-and-images',
		title: 'How metadata merges',
		blurb: 'What is the title of a page when the layout also sets one?',
		nodes: [
			{
				id: 'lay', kind: 'doc', x: 10, y: 16, w: 340, title: 'app/layout.tsx', visible: true,
				lines: ['export const metadata = {', "  title: { template: '%s | Acme',", "           default: 'Acme' },", '};']
			},
			{
				id: 'pg', kind: 'doc', x: 10, y: 116, w: 340, title: 'app/about/page.tsx',
				lines: ['export const metadata = {', "  title: 'About',", '};']
			},
			{ id: 'out', kind: 'box', x: 70, y: 214, w: 220, h: 44, label: 'About | Acme', sub: 'the document title', tone: 'accent' },
			{ id: 'e1', kind: 'edge', from: 'pg', to: 'out' },
			{ id: 'sh', kind: 'text', x: 10, y: 284, w: 340, text: 'Server Components only. Relative image URLs need metadataBase.', size: 'sm' }
		],
		steps: [
			{ say: "The root layout sets a title template. The percent s is a placeholder, and default is the title for pages that set none.", focus: ['lay'] },
			{ say: 'The about page sets its own title: just the word About.', show: ['pg'], focus: ['pg'] },
			{ say: 'Next.js puts the page title into the layout template, so the document title is About | Acme.', show: ['out', 'e1'], pulse: ['out'] },
			{ say: 'A template needs title.default beside it. That is the title for any page that does not set one.', set: { lay: { hl: [2] } }, hide: ['pg', 'e1', 'out'] },
			{ say: "Merging is shallow. If a page sets openGraph with only a title, the layout's whole openGraph object is replaced.", set: { lay: { hl: [], lines: ['export const metadata = {', "  openGraph: { title: 'Acme',", "    images: ['/og.png'] },", '};'] }, pg: { lines: ['export const metadata = {', "  openGraph: { title: 'About' },", '};'] } }, show: ['pg'], focus: ['lay'] },
			{ say: 'To extend instead of replace, await parent inside generateMetadata and spread the parent openGraph into the new one.', set: { pg: { lines: ['export async function generateMetadata(', '  props, parent) {', '  const og = (await parent).openGraph;', '  return { openGraph: { ...og } };', '}'] } }, focus: ['pg'] },
			{ say: 'Metadata exports only work in Server Components, never in a file marked use client.', show: ['sh'], focus: ['sh'] }
		]
	},

	// ───────────── parallel-and-intercepting-routes ─────────────
	{
		id: 'nx-parallel-slots',
		topic: 'nextjs',
		group: 'parallel-and-intercepting-routes',
		title: 'Slots in a layout',
		blurb: 'How can one layout show several independent pages at once?',
		nodes: [
			{ id: 'lay', kind: 'box', x: 80, y: 8, w: 200, h: 40, label: 'dashboard/layout.tsx', sub: 'children, team, analytics', visible: true },
			{ id: 'c', kind: 'box', x: 8, y: 110, w: 104, h: 54, label: 'children', sub: 'page.tsx' },
			{ id: 't', kind: 'box', x: 128, y: 110, w: 104, h: 54, label: '@team', sub: 'slot' },
			{ id: 'a', kind: 'box', x: 248, y: 110, w: 104, h: 54, label: '@analytics', sub: 'slot' },
			{ id: 'e1', kind: 'edge', from: 'lay', to: 'c' },
			{ id: 'e2', kind: 'edge', from: 'lay', to: 't' },
			{ id: 'e3', kind: 'edge', from: 'lay', to: 'a' },
			{ id: 'def', kind: 'box', x: 248, y: 214, w: 104, h: 56, label: 'default.tsx', sub: 'required in 16', tone: 'warn' },
			{ id: 'ed', kind: 'edge', from: 'a', to: 'def', tone: 'warn' },
			{ id: 'sec', kind: 'text', x: 8, y: 214, w: 220, text: 'Hidden slots still run: authorise inside each.', size: 'sm' }
		],
		steps: [
			{ say: 'A folder that starts with @ is a slot. It adds no URL segment: app/@team/page.tsx still serves the root URL.', show: ['c', 't', 'a'], focus: ['t', 'a'] },
			{ say: 'The layout receives each slot as a prop next to children and decides where to place it.', show: ['e1', 'e2', 'e3'], focus: ['lay'] },
			{ say: 'Each slot loads and fails on its own, with its own loading.tsx and error.tsx files.', pulse: ['t', 'a'] },
			{ say: 'On a soft navigation to /settings, a slot with no matching page keeps showing its last content.', set: { a: { tone: 'warn', sub: 'keeps last page' } } },
			{ say: 'After a full reload that is impossible, so Next.js renders the slot default.tsx instead.', show: ['def', 'ed'], focus: ['def'] },
			{ say: 'In Next.js 16 every slot needs an explicit default.tsx. Without one the build fails.', set: { def: { tone: 'neg', sub: 'missing: build fails' } } },
			{ say: 'If the layout hides a slot, it still renders on the server. Authorise inside each slot, not only in the layout.', set: { def: { tone: 'warn', sub: 'required in 16' } }, show: ['sec'], focus: ['sec'] }
		]
	},
	{
		id: 'nx-intercepting-modal',
		topic: 'nextjs',
		group: 'parallel-and-intercepting-routes',
		title: 'A modal over the feed',
		blurb: 'How does a photo open in a modal but still have its own URL?',
		nodes: [
			{ id: 'url', kind: 'text', x: 20, y: 22, text: 'URL: /feed', visible: true },
			{ id: 'feed', kind: 'box', x: 20, y: 40, w: 140, h: 110, label: 'Feed', sub: 'photo 42, photo 43', visible: true },
			{ id: 'modal', kind: 'box', x: 190, y: 70, w: 150, h: 70, label: 'Modal', sub: 'photo 42', tone: 'accent' },
			{ id: 'full', kind: 'box', x: 60, y: 180, w: 240, h: 60, label: '/photo/42 as a full page', sub: 'no feed behind it', tone: 'accent' },
			{ id: 'catch', kind: 'text', x: 20, y: 270, w: 330, text: 'Slots keep the last page: add a catch-all that returns null.', size: 'sm' }
		],
		steps: [
			{ say: 'A feed lists photos. Each one links to /photo/42, which also exists as its own full page.', focus: ['feed'] },
			{ say: 'An intercepting route changes what a soft navigation shows: the photo opens in a modal while the feed stays on screen.', show: ['modal'], set: { url: { text: 'URL: /photo/42' } }, pulse: ['modal'] },
			{ say: 'The feed is still mounted behind the modal, so going back closes it instantly and the feed is where you left it.', focus: ['feed'] },
			{ say: 'Reload the page, or open the shared link, and there is no soft navigation to intercept. The full photo page renders.', hide: ['feed', 'modal'], show: ['full'], focus: ['full'] },
			{ say: 'Slots keep their last page when you navigate away. A catch-all page in the modal slot that returns null closes the modal.', hide: ['full'], show: ['feed', 'catch'], set: { url: { text: 'URL: /settings' } }, focus: ['catch'] }
		]
	},

	// ───────────── proxy-and-auth ─────────────
	{
		id: 'nx-proxy-order',
		topic: 'nextjs',
		group: 'proxy-and-auth',
		title: 'Proxy runs first',
		blurb: 'Where does proxy.ts sit between the request and your pages?',
		nodes: [
			{ id: 'req', kind: 'box', x: 110, y: 8, w: 140, h: 38, label: 'Request', visible: true },
			{ id: 'px', kind: 'box', x: 100, y: 78, w: 160, h: 48, label: 'proxy.ts', sub: 'before routes render', tone: 'accent' },
			{ id: 'r1', kind: 'box', x: 8, y: 168, w: 104, h: 40, label: 'redirect' },
			{ id: 'r2', kind: 'box', x: 128, y: 168, w: 104, h: 40, label: 'rewrite' },
			{ id: 'r3', kind: 'box', x: 248, y: 168, w: 104, h: 40, label: 'next()', sub: 'routes render' },
			{ id: 'e0', kind: 'edge', from: 'req', to: 'px' },
			{ id: 'e1', kind: 'edge', from: 'px', to: 'r1' },
			{ id: 'e2', kind: 'edge', from: 'px', to: 'r2' },
			{ id: 'e3', kind: 'edge', from: 'px', to: 'r3' },
			{ id: 'note', kind: 'text', x: 10, y: 236, w: 340, text: 'No matcher: it runs on every request, even _next/static and public/ files.', size: 'sm', tone: 'warn' },
			{ id: 'act', kind: 'text', x: 10, y: 276, w: 340, text: 'Server Actions are POSTs to the page URL: no match, no Proxy.', size: 'sm' }
		],
		steps: [
			{ say: 'proxy.ts, called middleware.ts before Next.js 16, runs on the server before a request is completed and before any route renders.', show: ['px', 'e0'], focus: ['px'] },
			{ say: 'It can redirect the request, rewrite it to another route, change headers, or answer directly.', show: ['r1', 'r2', 'r3', 'e1', 'e2', 'e3'], focus: ['r1', 'r2'] },
			{ say: 'Without a matcher it runs on every request, including _next/static, _next/image and files from public.', show: ['note'], focus: ['note'] },
			{ say: 'Use config.matcher to limit it to the paths that need it, for example /dashboard and everything below.', set: { note: { text: "config.matcher: ['/dashboard/:path*']", tone: 'accent' } }, focus: ['note'] },
			{ say: 'In Next.js 16 Proxy uses the Node.js runtime. The runtime option is not available and setting it throws.', set: { px: { sub: 'Node.js runtime' } }, focus: ['px'] },
			{ say: 'A Server Action is a POST to its page URL. Exclude that path from the matcher and Proxy skips the action too.', show: ['act'], focus: ['act'] }
		]
	},
	{
		id: 'nx-auth-layers',
		topic: 'nextjs',
		group: 'proxy-and-auth',
		title: 'Layers of authorisation',
		blurb: 'Where should the real permission check live?',
		nodes: [
			{ id: 'px', kind: 'box', x: 60, y: 10, w: 240, h: 46, label: 'proxy.ts', sub: 'is there a session cookie?', visible: true },
			{ id: 'lay', kind: 'box', x: 60, y: 76, w: 240, h: 46, label: 'Layout or page', sub: 'may not re-run on navigation' },
			{ id: 'dal', kind: 'box', x: 60, y: 142, w: 240, h: 46, label: 'Data access layer', sub: "import 'server-only'" },
			{ id: 'act', kind: 'box', x: 60, y: 208, w: 240, h: 46, label: 'Server Action', sub: 'a public endpoint' },
			{ id: 'e1', kind: 'edge', from: 'px', to: 'lay' },
			{ id: 'e2', kind: 'edge', from: 'lay', to: 'dal' },
			{ id: 'e3', kind: 'edge', from: 'dal', to: 'act' },
			{ id: 'rule', kind: 'text', x: 10, y: 280, w: 340, text: 'Check close to the data, and again wherever data changes.', size: 'sm' }
		],
		steps: [
			{ say: 'Authorisation has several layers. Relying on a single one leaves gaps.', focus: ['px'] },
			{ say: 'Proxy is good for a cheap, optimistic check: is there a session cookie? If not, redirect to the login page.', set: { px: { tone: 'accent', sub: 'cheap, optimistic check' } }, focus: ['px'] },
			{ say: 'A layout does not re-render when you move between its children, so a check placed only there can be skipped.', show: ['lay', 'e1'], set: { lay: { tone: 'warn' } }, focus: ['lay'] },
			{ say: 'A data access layer is one server-only place that verifies the session and returns only safe fields. Client code cannot import it.', show: ['dal', 'e2'], set: { dal: { tone: 'accent', sub: 'verify session, shape data' } }, focus: ['dal'] },
			{ say: 'Server Actions need their own check. They are public endpoints, whatever page renders the form.', show: ['act', 'e3'], set: { act: { tone: 'accent', sub: 'check again' } }, focus: ['act'] },
			{ say: 'The rule: check close to the data, and check again wherever data changes.', show: ['rule'], focus: ['rule'] }
		]
	},

	// ───────────── config-env-and-deploy ─────────────
	{
		id: 'nx-env-inlining',
		topic: 'nextjs',
		group: 'config-env-and-deploy',
		title: 'NEXT_PUBLIC_ is frozen at build',
		blurb: 'Why does the production site still call the staging API?',
		nodes: [
			{ id: 'bld', kind: 'box', x: 90, y: 10, w: 180, h: 48, label: 'next build', sub: 'NEXT_PUBLIC_API=staging', visible: true },
			{ id: 'bun', kind: 'doc', x: 30, y: 80, w: 300, title: 'bundle.js', lines: ['fetch("https://api.staging.dev")'] },
			{ id: 'img', kind: 'db', x: 120, y: 160, w: 120, h: 46, label: 'Docker image' },
			{ id: 'prod', kind: 'box', x: 90, y: 224, w: 180, h: 42, label: 'Production', sub: 'calls staging', tone: 'neg' },
			{ id: 'e1', kind: 'edge', from: 'bld', to: 'bun', label: 'inlined' },
			{ id: 'e2', kind: 'edge', from: 'bun', to: 'img' },
			{ id: 'e3', kind: 'edge', from: 'img', to: 'prod' },
			{ id: 'srv', kind: 'text', x: 10, y: 292, w: 340, text: 'No prefix: server only, never sent to the browser.', size: 'sm' }
		],
		steps: [
			{ say: 'A variable that starts with NEXT_PUBLIC_ is copied into the JavaScript bundle during next build, so the browser can read it.', show: ['bun', 'e1'], focus: ['bun'] },
			{ say: 'Here the build ran with the staging API address, so that exact text is now inside the bundle.', set: { bun: { hl: [0] } } },
			{ say: 'The same Docker image is promoted to production. The value was frozen at build, so production still calls staging.', show: ['img', 'e2', 'prod', 'e3'], focus: ['prod'], pulse: ['prod'] },
			{ say: 'Fix it by building per environment, or by serving the value from a server endpoint at request time.', set: { prod: { tone: 'accent', sub: 'built for production' } } },
			{ say: 'Variables without the prefix stay on the server. Call await connection() first if one must be read at request time, not frozen.', show: ['srv'], focus: ['srv'] },
			{ say: 'The .env files live in the project root next to package.json, even when your code is inside a src folder.', set: { srv: { text: '.env files: project root, next to package.json.' } }, focus: ['srv'] }
		]
	}
];
