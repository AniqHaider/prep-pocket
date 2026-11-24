import type { Scene } from '../../types';
import { shot, credit } from '../consoleKit';

/** APIs in practice, part 2: the practices Cardify Lite's API follows and what each bought it. Ids `ap-*`; `group` = a topic id in src/db/apis/practices.ts.
 *  Every call and header shown here was captured by starting Cardify Lite locally; the admin key is always shown as <ADMIN_API_KEY>. */

export const apPractices: Scene[] = [
	// ───────────── ap-fail-closed-config ─────────────
	{
		id: 'ap-boot-check',
		topic: 'apis',
		group: 'ap-fail-closed-config',
		title: 'Refusing to start without a key',
		blurb: 'What does the backend do at boot when the admin key is missing?',
		stage: { w: 360, h: 340 },
		nodes: [
			{ id: 'b0', kind: 'box', x: 16, y: 14, w: 200, h: 44, label: 'main.ts starts', sub: 'a deploy, a restart', visible: true },
			{ id: 'b1', kind: 'box', x: 16, y: 82, w: 200, h: 44, label: 'config.ts reads the env', sub: 'parsed with a zod schema' },
			{ id: 'b2', kind: 'box', x: 16, y: 150, w: 200, h: 44, label: 'Is ADMIN_API_KEY 8+ chars?', sub: 'no default value' },
			{ id: 'b3', kind: 'box', x: 16, y: 218, w: 150, h: 44, label: 'Yes: server listens', sub: '127.0.0.1:4100' },
			{ id: 'b4', kind: 'box', x: 186, y: 218, w: 150, h: 44, label: 'No: process exits', sub: 'nothing listens' },
			{ id: 'e0', kind: 'edge', from: 'b0', to: 'b1' },
			{ id: 'e1', kind: 'edge', from: 'b1', to: 'b2' },
			{ id: 'e2', kind: 'edge', from: 'b2', to: 'b3' },
			{ id: 'e3', kind: 'edge', from: 'b2', to: 'b4' },
			{ id: 'g', kind: 'text', x: 16, y: 296, w: 328, text: 'buildApp checks again: it throws if the key is empty, so the admin routes can never be built open.', size: 'sm' }
		],
		steps: [
			{ say: 'A deploy or a restart starts the backend. The first thing main.ts does is load the configuration.', focus: ['b0'] },
			{ say: 'config.ts parses the environment with a zod schema. PORT and HOST have defaults. ADMIN_API_KEY has none.', show: ['b1', 'e0'], focus: ['b1'] },
			{ say: 'The schema asks one question about the key: is it a string of at least 8 characters? Its message says what to do if not.', show: ['b2', 'e1'], focus: ['b2'] },
			{ say: 'A long enough key: the config is typed, buildApp runs, and the server listens on its port.', show: ['b3', 'e2'], set: { b3: { tone: 'accent' } } },
			{ say: 'An empty or short key: the process exits at once. There is no moment where the admin API is up but unprotected.', show: ['b4', 'e3'], set: { b4: { tone: 'neg' } }, pulse: ['b4'] },
			{ say: 'A second guard sits where the key is used: buildApp throws if it is empty, even if some other code skipped the loader.', show: ['g'], focus: ['g'] }
		]
	},
	{
		id: 'ap-boot-refusal',
		topic: 'apis',
		group: 'ap-fail-closed-config',
		title: 'What the refusal looked like',
		blurb: 'What did the server print when started with no key and with a short key?',
		stage: { w: 360, h: 300 },
		nodes: [
			{ id: 'd', kind: 'doc', x: 16, y: 14, w: 328, title: 'ADMIN_API_KEY= (empty); output condensed', lines: ['ZodError: [', '  { "code": "too_small", "minimum": 8,', '    "message": "ADMIN_API_KEY must be set', '      (min 8 chars) — refusing to start', '      with an open admin API",', '    "path": [ "ADMIN_API_KEY" ] }', ']'] },
			{ id: 't', kind: 'table', x: 16, y: 176, colW: 108, cols: ['Key given', 'Outcome', 'Port'], rows: [['(empty)', 'exits at once', 'not opened'], ['short (5 chars)', 'exits at once', 'not opened'], ['8+ chars', 'runs', 'listening']] },
			{ id: 'n', kind: 'text', x: 16, y: 284, w: 328, text: 'Limits: a raw stack trace, and 8 characters is a low floor.', size: 'sm' }
		],
		steps: [
			{ say: 'Started with an empty key, the server printed a ZodError. Its message names the variable and the rule.', show: ['d'], focus: ['d'] },
			{ say: 'Started with ADMIN_API_KEY empty, the process exited at once and nothing listened on the port.', show: ['t'], set: { t: { hl: [0] } } },
			{ say: 'A 5-character key got the same refusal and the same message.', set: { t: { hl: [1] } } },
			{ say: 'Only a key of 8 characters or more lets the server start; the README dev default passes, so change it before real use.', set: { t: { hl: [2] } } },
			{ say: 'Honest limits: the failure is a raw stack trace, not a one-line message, and an 8-character floor still lets weak keys in.', show: ['n'], focus: ['n'] }
		]
	},

	// ───────────── ap-key-auth ─────────────
	{
		id: 'ap-key-compare',
		topic: 'apis',
		group: 'ap-key-auth',
		title: 'Comparing keys without leaking',
		blurb: 'How does the backend check the admin key?',
		stage: { w: 360, h: 340 },
		nodes: [
			{ id: 'b0', kind: 'box', x: 16, y: 14, w: 200, h: 44, label: 'Header x-admin-key', sub: 'the only place a key is read', visible: true },
			{ id: 'b1', kind: 'box', x: 16, y: 82, w: 200, h: 44, label: 'Same length as the key?', sub: 'checked first' },
			{ id: 'b2', kind: 'box', x: 236, y: 82, w: 108, h: 44, label: 'No: false', sub: 'so 401' },
			{ id: 'b3', kind: 'box', x: 16, y: 150, w: 200, h: 44, label: 'timingSafeEqual(a, b)', sub: 'compares every byte' },
			{ id: 'b4', kind: 'box', x: 16, y: 218, w: 150, h: 44, label: 'Equal: handler runs', sub: 'settings returned' },
			{ id: 'b5', kind: 'box', x: 186, y: 218, w: 150, h: 44, label: 'Not equal: 401', sub: 'same body as any 401' },
			{ id: 'e0', kind: 'edge', from: 'b0', to: 'b1' },
			{ id: 'e1', kind: 'edge', from: 'b1', to: 'b2' },
			{ id: 'e2', kind: 'edge', from: 'b1', to: 'b3' },
			{ id: 'e3', kind: 'edge', from: 'b3', to: 'b4' },
			{ id: 'e4', kind: 'edge', from: 'b3', to: 'b5' },
			{ id: 'g', kind: 'text', x: 16, y: 296, w: 328, text: 'timingSafeEqual throws if the lengths differ, so the length check has to come first.', size: 'sm' }
		],
		steps: [
			{ say: 'The admin routes read the key from one header, x-admin-key. A query string or a cookie is never looked at.', focus: ['b0'] },
			{ say: 'keyMatches turns both keys into bytes and first checks that the lengths are equal.', show: ['b1', 'e0'], focus: ['b1'] },
			{ say: 'A different length returns false straight away. That leaks only the length, never how close a guess was.', show: ['b2', 'e1'], set: { b2: { tone: 'neg' } } },
			{ say: 'Same length: timingSafeEqual compares all the bytes in constant time, so a wrong guess takes the same time wherever it differs.', show: ['b3', 'e2'], focus: ['b3'] },
			{ say: 'A match lets the route handler run and return the settings.', show: ['b4', 'e3'], set: { b4: { tone: 'accent' } } },
			{ say: 'A mismatch is answered with the same 401 as every other failure.', show: ['b5', 'e4'], set: { b5: { tone: 'neg' } } },
			{ say: 'The order matters: Node\'s timingSafeEqual throws on buffers of different length, so a wrong-length key would raise an error instead of getting a clean 401.', show: ['g'], focus: ['g'] }
		]
	},
	{
		id: 'ap-key-401s',
		topic: 'apis',
		group: 'ap-key-auth',
		title: 'One 401 for every wrong key',
		blurb: 'What does a caller learn from a wrong key?',
		stage: { w: 360, h: 270 },
		nodes: [
			{ id: 't', kind: 'table', x: 16, y: 14, colW: 108, cols: ['Call', 'Key sent', 'Status'], rows: [['10', 'none', '401'], ['11', 'nope-nope', '401'], ['12', 'x (1 char)', '401'], ['13', '<ADMIN_API_KEY>', '200']] },
			{ id: 'd', kind: 'doc', x: 16, y: 150, w: 328, title: 'Body of all three 401s', lines: ['{"error":"invalid or missing x-admin-key"}'] },
			{ id: 'n', kind: 'text', x: 16, y: 236, w: 328, text: 'Same status, same body: a guess teaches the caller nothing.', size: 'sm' }
		],
		steps: [
			{ say: 'Four admin calls with GET on the settings of the demo merchant, each with a different key.', show: ['t'], focus: ['t'] },
			{ say: 'Call 10 sent no key at all: the answer is 401.', set: { t: { hl: [0] } } },
			{ say: 'A wrong key of the right length: 401.', set: { t: { hl: [1] } } },
			{ say: 'A key of the wrong length: also 401, and not a crash, because the length is checked before the comparison.', set: { t: { hl: [2] } } },
			{ say: 'The three bodies are identical. The message even covers "missing" and "wrong" in one sentence.', show: ['d'], set: { t: { hl: [0, 1, 2] } } },
			{ say: 'Only the right key, call 13, gets a 200. Everything else looks the same from outside, so a caller cannot tell a near miss.', show: ['n'], set: { t: { hl: [3] } } }
		]
	},
	{
		id: 'ap-key-url-log',
		topic: 'apis',
		group: 'ap-key-auth',
		title: 'Header versus URL, and the limits',
		blurb: 'Why must the key stay out of the URL, and what is still missing?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'a', kind: 'doc', x: 16, y: 14, w: 328, title: 'Request log line, key sent in a header', lines: ['"method":"GET",', '"url":"/cardify/admin/demostore/settings",', '"remoteAddress":"127.0.0.1"'] },
			{ id: 'b', kind: 'doc', x: 16, y: 106, w: 328, title: 'Request log line, key sent in the URL (call 33)', lines: ['"method":"GET",', '"url":"/cardify/admin/demostore/settings', '  ?x-admin-key=<ADMIN_API_KEY>",'] },
			{ id: 't', kind: 'table', x: 16, y: 206, colW: 156, cols: ['Limit seen', 'Evidence'], rows: [['One shared key', 'no per-user keys'], ['No rate limit', '60 wrong, 60 x 401'], ['No rotation', 'key set by env only'], ['Stored in the browser', 'localStorage, plain']] }
		],
		steps: [
			{ say: 'The key travels in a header. The server\'s request log records the method, URL and address, not the headers.', show: ['a'], focus: ['a'] },
			{ say: 'A probe sent the key as ?x-admin-key=... instead. The server answered 401: only the header is accepted.', show: ['b'], focus: ['b'] },
			{ say: 'But the log line holds the whole URL, key included. Anything in a URL ends up in logs, history and proxies.', set: { b: { hl: [1, 2] } } },
			{ say: 'Limits seen in the same runs. First, one shared key for every admin: no names, so no record of who changed what.', show: ['t'], set: { t: { hl: [0] } } },
			{ say: 'Sixty wrong keys in a row all got 401. Nothing slowed or blocked them, so key strength is the only defence.', set: { t: { hl: [1] } } },
			{ say: 'The key comes only from the environment: there is no route to rotate it, and a rotation means a restart.', set: { t: { hl: [2] } } },
			{ say: 'The admin page keeps the key in localStorage in plain text, so any script on that page could read it.', set: { t: { hl: [3] } } }
		]
	},

	// ───────────── ap-cors-by-path ─────────────
	{
		id: 'ap-cors-paths',
		topic: 'apis',
		group: 'ap-cors-by-path',
		title: 'Two CORS rules, chosen by path',
		blurb: 'Which origins may read which routes?',
		stage: { w: 360, h: 356 },
		nodes: [
			{ id: 't', kind: 'table', x: 16, y: 14, colW: 156, cols: ['Path starts with', 'Answers'], rows: [['/cardify/sdk/', 'any origin (*)'], ['/cardify/admin/', 'listed origins only']] },
			{ id: 'p', kind: 'doc', x: 16, y: 104, w: 328, title: 'Public config response (call 04)', lines: ['access-control-allow-origin: *', 'cross-origin-resource-policy: cross-origin', 'cache-control: no-store'] },
			{ id: 'q', kind: 'doc', x: 16, y: 200, w: 328, title: 'Admin preflight, listed origin (call 21)', lines: ['allow-origin: http://localhost:5173', 'vary: Origin', 'allow-methods: GET,PUT,OPTIONS', 'allow-headers: content-type,x-admin-key'] },
			{ id: 'n', kind: 'text', x: 16, y: 318, w: 328, text: 'Vary: Origin stops a cache reusing one origin\'s answer for another. (access-control- prefix dropped.)', size: 'sm' }
		],
		steps: [
			{ say: 'One hook in app.ts picks the CORS rule by the start of the URL path, not one rule for the whole server.', show: ['t'], focus: ['t'] },
			{ say: 'The SDK and the public config belong to every storefront, so any origin may read them.', set: { t: { hl: [0] } } },
			{ say: 'Call 04, from the origin https://some-store.example: allow-origin is *, plus a resource policy that lets other sites embed the file.', show: ['p'], focus: ['p'] },
			{ say: 'The admin routes are different. Only an origin on the allow-list gets CORS headers at all.', set: { t: { hl: [1] } } },
			{ say: 'Call 21, the preflight from the admin page: its own origin is echoed back, with the methods and headers it needs.', show: ['q'], focus: ['q'] },
			{ say: 'The origin is echoed, not *, so the response varies by caller. Vary: Origin tells caches to keep the answers apart.', show: ['n'], focus: ['n'] }
		]
	},
	{
		id: 'ap-cors-preflight',
		topic: 'apis',
		group: 'ap-cors-by-path',
		title: 'Preflight: allowed or not',
		blurb: 'What does a preflight look like for a listed and an unlisted origin?',
		stage: { w: 360, h: 340 },
		nodes: [
			{ id: 'b0', kind: 'box', x: 16, y: 14, w: 200, h: 40, label: 'Page sends OPTIONS', sub: 'Origin, method, headers', visible: true },
			{ id: 'b1', kind: 'box', x: 16, y: 78, w: 200, h: 40, label: 'Backend answers 204', sub: 'for every OPTIONS' },
			{ id: 'b2', kind: 'box', x: 16, y: 142, w: 200, h: 40, label: 'CORS headers present?', sub: 'only for a listed origin' },
			{ id: 'b3', kind: 'box', x: 16, y: 206, w: 150, h: 40, label: 'Yes: PUT is sent', sub: 'localhost:5173' },
			{ id: 'b4', kind: 'box', x: 186, y: 206, w: 150, h: 40, label: 'No: PUT is dropped', sub: 'evil.example' },
			{ id: 't', kind: 'table', x: 16, y: 262, colW: 108, cols: ['Origin', 'CORS headers', 'Real request'], rows: [['localhost:5173', 'yes', 'is sent'], ['evil.example', 'none', 'is blocked']] },
			{ id: 'e0', kind: 'edge', from: 'b0', to: 'b1' },
			{ id: 'e1', kind: 'edge', from: 'b1', to: 'b2' },
			{ id: 'e2', kind: 'edge', from: 'b2', to: 'b3' },
			{ id: 'e3', kind: 'edge', from: 'b2', to: 'b4' }
		],
		steps: [
			{ say: 'Before a PUT with a custom header, the browser asks permission first: an OPTIONS request with the Origin, method and headers it wants.', focus: ['b0'] },
			{ say: 'The backend answers every OPTIONS with 204 No Content. The answer itself is empty.', show: ['b1', 'e0'], focus: ['b1'] },
			{ say: 'What matters is whether the CORS headers are on that 204. The hook adds them only when the origin is on the allow-list.', show: ['b2', 'e1'], focus: ['b2'] },
			{ say: 'localhost:5173 is listed: the headers are present, so the browser goes ahead and sends the PUT.', show: ['b3', 'e2'], set: { b3: { tone: 'accent' } } },
			{ say: 'https://evil.example is not listed: still a 204, but with no CORS headers, so the browser drops the real request.', show: ['b4', 'e3'], set: { b4: { tone: 'neg' } } },
			{ say: 'Real results from calls 21 and 22, side by side.', show: ['t'], set: { t: { hl: [1] } } }
		]
	},
	{
		id: 'ap-cors-not-auth',
		topic: 'apis',
		group: 'ap-cors-by-path',
		title: 'CORS is not authentication',
		blurb: 'What does CORS stop, and what does it not?',
		stage: { w: 360, h: 340 },
		nodes: [
			{ id: 'a', kind: 'doc', x: 16, y: 14, w: 328, title: 'Call 23: the right key from another origin', lines: ['GET /cardify/admin/demostore/settings', 'Origin: https://evil.example', 'x-admin-key: <ADMIN_API_KEY>'] },
			{ id: 'r', kind: 'doc', x: 16, y: 106, w: 328, title: 'The reply', lines: ['200 OK', 'content-type: application/json', '(no access-control-allow-origin header)', '{"enabled":true,"design":"overlay",...}'] },
			{ id: 'b1', kind: 'box', x: 16, y: 220, w: 152, h: 52, label: 'Browser page elsewhere', sub: 'cannot read the reply' },
			{ id: 'b2', kind: 'box', x: 190, y: 220, w: 150, h: 52, label: 'curl or a script', sub: 'ignores CORS, reads it' },
			{ id: 'n', kind: 'text', x: 16, y: 304, w: 328, text: 'A script already running on the admin\'s own origin is trusted by the browser, so CORS cannot tell it from the admin.', size: 'sm' }
		],
		steps: [
			{ say: 'A real probe: the correct key, but the request claims to come from https://evil.example.', show: ['a'], focus: ['a'] },
			{ say: 'The server still answers 200 with the full settings. The key was right, and the server does not judge the origin when the key matches.', show: ['r'], focus: ['r'] },
			{ say: 'What differs is that no access-control-allow-origin header came back. A browser page on that origin may not read the reply.', show: ['b1'], set: { b1: { tone: 'accent' } } },
			{ say: 'A non-browser client, such as curl, never enforces CORS. The key is the only gate there.', show: ['b2'], set: { b2: { tone: 'warn' } } },
			{ say: 'And a script injected into the allowed admin page is, to the browser, the admin. CORS protects reading across origins, not who holds the key.', show: ['n'], focus: ['n'] }
		]
	},

	// ───────────── ap-validation ─────────────
	{
		id: 'ap-validate-edge',
		topic: 'apis',
		group: 'ap-validation',
		title: 'Checks before any work',
		blurb: 'What is checked on a settings save before it reaches the database?',
		stage: { w: 360, h: 340 },
		nodes: [
			{ id: 'b0', kind: 'box', x: 16, y: 14, w: 200, h: 44, label: 'PUT .../settings', sub: 'with the key header', visible: true },
			{ id: 'b1', kind: 'box', x: 16, y: 82, w: 200, h: 44, label: 'Merchant id matches?', sub: '^[a-z0-9]{6,32}$' },
			{ id: 'b2', kind: 'box', x: 16, y: 150, w: 200, h: 44, label: 'Body passes SettingsSchema?', sub: 'enums, hex colours, ranges' },
			{ id: 'b3', kind: 'box', x: 16, y: 218, w: 200, h: 44, label: 'Repo saves the row', sub: 'parameterised query' },
			{ id: 'r1', kind: 'box', x: 236, y: 82, w: 108, h: 44, label: 'No: 400', sub: 'invalid id' },
			{ id: 'r2', kind: 'box', x: 236, y: 150, w: 108, h: 44, label: 'No: 400', sub: 'plus issues' },
			{ id: 'e0', kind: 'edge', from: 'b0', to: 'b1' },
			{ id: 'e1', kind: 'edge', from: 'b1', to: 'b2' },
			{ id: 'e2', kind: 'edge', from: 'b2', to: 'b3' },
			{ id: 'e3', kind: 'edge', from: 'b1', to: 'r1' },
			{ id: 'e4', kind: 'edge', from: 'b2', to: 'r2' },
			{ id: 'g', kind: 'text', x: 16, y: 294, w: 328, text: 'One shared zod schema (shared/src/schema.ts): the admin form and the server apply the same rules.', size: 'sm' }
		],
		steps: [
			{ say: 'A save arrives with the right key. Authentication is done, but nothing about the request is trusted yet.', focus: ['b0'] },
			{ say: 'First the merchant id in the URL is checked against a strict pattern: 6 to 32 lowercase letters or digits.', show: ['b1', 'e0'], focus: ['b1'] },
			{ say: 'A bad id, such as BAD!, DemoStore or abc, gets a 400 before anything else runs.', show: ['r1', 'e3'], set: { r1: { tone: 'neg' } } },
			{ say: 'Then the body goes through SettingsSchema: allowed designs, 6-digit hex colours, a radius from 0 to 24, true or false toggles.', show: ['b2', 'e1'], focus: ['b2'] },
			{ say: 'A body that breaks any rule gets a 400 with the list of every problem found.', show: ['r2', 'e4'], set: { r2: { tone: 'neg' } } },
			{ say: 'Only a valid id and a valid body reach the repo, which writes the row with a parameterised query, not a string built from input.', show: ['b3', 'e2'], set: { b3: { tone: 'accent' } } },
			{ say: 'The admin form uses the very same schema, so the page and the API cannot drift apart on what is valid.', show: ['g'], focus: ['g'] }
		]
	},
	{
		id: 'ap-validate-issues',
		topic: 'apis',
		group: 'ap-validation',
		title: 'A 400 that says what is wrong',
		blurb: 'What does the server say when a save has several bad values?',
		stage: { w: 360, h: 240 },
		nodes: [
			{ id: 'd', kind: 'doc', x: 16, y: 14, w: 328, title: 'Call 14: four bad fields (issues, shortened)', lines: ['enabled', '  Expected boolean, received string', 'design', '  Invalid enum value ... received "neon"', 'options.accentColor', '  must be a 6-digit hex colour like #ed186f', 'options.radius', '  Number must be less than or equal to 24'] },
			{ id: 'n', kind: 'text', x: 16, y: 220, w: 328, text: 'Every wrong field comes back in one answer, with the rule that was broken.', size: 'sm' }
		],
		steps: [
			{ say: 'A PUT sent enabled as "yes", design as "neon", accentColor as "red" and radius 99. The answer was 400 with {"error":"invalid settings","issues":[...]}.', show: ['d'], focus: ['d'] },
			{ say: 'First issue: enabled must be true or false, and a string arrived.', set: { d: { hl: [0, 1] } } },
			{ say: 'Second: design is not one of the five allowed designs. The real message lists them all.', set: { d: { hl: [2, 3] } } },
			{ say: 'Third: the colour is not 6-digit hex. The schema\'s own message gives an example, #ed186f.', set: { d: { hl: [4, 5] } } },
			{ say: 'Fourth: a radius of 99 is over the maximum of 24. Each issue also carries a path, such as options.radius.', set: { d: { hl: [6, 7] } } },
			{ say: 'The caller learns every wrong field in one round trip, which is why the admin can show a useful error.', show: ['n'], focus: ['n'] }
		]
	},
	{
		id: 'ap-validate-limits',
		topic: 'apis',
		group: 'ap-validation',
		title: 'What the framework answers itself',
		blurb: 'Which answers come from Fastify, and how do they look?',
		stage: { w: 360, h: 300 },
		nodes: [
			{ id: 't', kind: 'table', x: 16, y: 14, colW: 156, cols: ['Case', 'Status'], rows: [['No content-type', '415'], ['Malformed JSON', '400, connection closed'], ['Body over 1 MiB', '413, connection closed'], ['Unknown route', '404'], ['Valid, unseen id', '200 with defaults']] },
			{ id: 'd', kind: 'doc', x: 16, y: 170, w: 328, title: 'A framework error body (call 19)', lines: ['{"statusCode":415,', ' "code":"FST_ERR_CTP_INVALID_MEDIA_TYPE",', ' "error":"Unsupported Media Type",', ' "message":"Unsupported Media Type"}'] },
			{ id: 'n', kind: 'text', x: 16, y: 280, w: 328, text: 'Two error shapes: {"error": "..."} from the app, this one from Fastify.', size: 'sm' }
		],
		steps: [
			{ say: 'Some checks are Fastify defaults, not Cardify Lite code. A PUT with no content-type header gets 415.', show: ['t'], set: { t: { hl: [0] } } },
			{ say: 'Malformed JSON gets 400, and the connection is closed. The body is never parsed into settings.', set: { t: { hl: [1] } } },
			{ say: 'A body over the 1 MiB default limit gets 413 after a 100 Continue, so an oversized upload is cut off at the limit.', set: { t: { hl: [2] } } },
			{ say: 'A valid but never-seen merchant id is not a 404: it gets the default settings, so ids cannot be probed to see who exists.', set: { t: { hl: [4] } } },
			{ say: 'These framework errors have their own JSON shape, different from the app\'s {"error": "..."}.', show: ['d'], focus: ['d'] },
			{ say: 'A client has to read both shapes. One shared shape would be simpler, and it is a small gap worth closing.', show: ['n'], focus: ['n'] }
		]
	},

	// ───────────── ap-caching-versioning ─────────────
	{
		id: 'ap-cache-headers',
		topic: 'apis',
		group: 'ap-caching-versioning',
		title: 'Cache headers by resource',
		blurb: 'Which resources may a browser reuse, and which must it ask for again?',
		stage: { w: 360, h: 290 },
		nodes: [
			{ id: 't', kind: 'table', x: 16, y: 14, colW: 156, cols: ['Resource', 'Headers'], rows: [['Public config', 'no-store'], ['SDK bundles', 'public, max-age=0'], ['SDK bundles', 'etag, last-modified'], ['Admin settings', 'none sent']] },
			{ id: 'd', kind: 'doc', x: 16, y: 152, w: 328, title: 'Bundle, call 24: intent against arrival', lines: ['source says: cache-control: no-cache', 'arrives:     cache-control: public, max-age=0', 'etag: W/"36d-1a16322b462"'] },
			{ id: 'n', kind: 'text', x: 16, y: 262, w: 328, text: 'Check the headers that arrive, not only the code.', size: 'sm' }
		],
		steps: [
			{ say: 'The public config is the one thing that must never be stale, so it is no-store: the browser never keeps it.', show: ['t'], set: { t: { hl: [0] } } },
			{ say: 'The SDK files are served by a static plugin with max-age=0: the browser may keep them but must ask before reusing.', set: { t: { hl: [1] } } },
			{ say: 'To make that asking cheap, the files carry an ETag and a last-modified date.', set: { t: { hl: [2] } } },
			{ say: 'Admin settings responses carry no cache-control at all; they are only fetched with the key, by the admin page.', set: { t: { hl: [3] } } },
			{ say: 'A real finding: the source sets no-cache for the bundles, but the header that arrives is public, max-age=0. The plugin\'s default won.', show: ['d'], focus: ['d'] },
			{ say: 'The effect is much the same, but only a look at the real response showed the difference.', show: ['n'], focus: ['n'] }
		]
	},
	{
		id: 'ap-etag-304',
		topic: 'apis',
		group: 'ap-caching-versioning',
		title: 'Asking again costs almost nothing',
		blurb: 'What does a revalidation of the loader look like?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'b0', kind: 'box', x: 16, y: 14, w: 200, h: 44, label: 'Browser holds a copy', sub: 'etag W/"36d-1a16322b462"', visible: true },
			{ id: 'b1', kind: 'box', x: 16, y: 82, w: 200, h: 44, label: 'GET with If-None-Match', sub: 'max-age=0, so it asks' },
			{ id: 'b2', kind: 'box', x: 16, y: 150, w: 200, h: 44, label: 'Backend compares the ETag', sub: 'same file or not' },
			{ id: 'b3', kind: 'box', x: 16, y: 218, w: 150, h: 44, label: '304: headers only', sub: 'reuse the copy' },
			{ id: 'b4', kind: 'box', x: 186, y: 218, w: 150, h: 44, label: '200: the new file', sub: 'after a rebuild' },
			{ id: 'g', kind: 'text', x: 16, y: 292, w: 328, text: 'Call 29: 304 Not Modified, with the same etag and no body.', size: 'sm' },
			{ id: 'e0', kind: 'edge', from: 'b0', to: 'b1' },
			{ id: 'e1', kind: 'edge', from: 'b1', to: 'b2' },
			{ id: 'e2', kind: 'edge', from: 'b2', to: 'b3' },
			{ id: 'e3', kind: 'edge', from: 'b2', to: 'b4' }
		],
		steps: [
			{ say: 'The browser already has cardify-loader.js (877 bytes) and remembers its ETag.', focus: ['b0'] },
			{ say: 'Because max-age is 0, the next use asks the server first, sending the remembered ETag in If-None-Match.', show: ['b1', 'e0'], focus: ['b1'] },
			{ say: 'The backend compares that ETag with the file on disk.', show: ['b2', 'e1'], focus: ['b2'] },
			{ say: 'Unchanged: a 304 with headers only. The browser reuses its copy and no file bytes travel.', show: ['b3', 'e2'], set: { b3: { tone: 'accent' } } },
			{ say: 'Changed, for example after pnpm build:sdk: a 200 with the new file and a new ETag.', show: ['b4', 'e3'], set: { b4: { tone: 'warn' } } },
			{ say: 'The real call 29 confirms the 304. Fresh code is always one cheap question away.', show: ['g'], focus: ['g'] }
		]
	},
	{
		id: 'ap-version-fingerprint',
		topic: 'apis',
		group: 'ap-caching-versioning',
		title: 'Does the loader need to act?',
		blurb: 'When does the loader ask, and when does it change the page?',
		stage: { w: 360, h: 290 },
		nodes: [
			{ id: 'd', kind: 'doc', x: 16, y: 14, w: 328, title: 'The loader asks for the config when', lines: ['the page loads', 'the window gets focus', 'the tab becomes visible', 'never on a timer'] },
			{ id: 't', kind: 'table', x: 16, y: 128, colW: 108, cols: ['version', 'enabled', 'Loader does'], rows: [['0', 'false', 'nothing'], ['1795534284949', 'true', 'load widget'], ['1795534284949', 'true', 'nothing (seen)'], ['1795534290000', 'false', 'stop widget']] },
			{ id: 'n', kind: 'text', x: 16, y: 262, w: 328, text: 'Fingerprint = version:enabled. Only a changed fingerprint does any work. (Example values.)', size: 'sm' }
		],
		steps: [
			{ say: 'loader.ts has no timer. It asks for the config on page load, when the window gets focus, and when the tab becomes visible.', show: ['d'], focus: ['d'] },
			{ say: 'So a tab left open in the background never calls the backend, and a merchant coming back from the admin gets the change at once.', show: ['t'], set: { t: { hl: [0] } } },
			{ say: 'Never saved: version 0 and off, so there is nothing to do and the native cards stay.', set: { t: { hl: [0] } } },
			{ say: 'A save sets the version to the time of the save. Seeing enabled true, the loader fetches the widget and applies the design.', set: { t: { hl: [1] } } },
			{ say: 'The next focus brings the same version and enabled: the fingerprint is unchanged, so nothing happens.', set: { t: { hl: [2] } } },
			{ say: 'Switched off later: a new version with enabled false stops the widget and the native cards come back.', set: { t: { hl: [3] } } },
			{ say: 'The loader writes the fingerprint down only after success, so a failed load is retried on the next focus.', show: ['n'], focus: ['n'] }
		]
	},
	{
		id: 'ap-focus-refresh',
		topic: 'apis',
		group: 'ap-caching-versioning',
		title: 'The storefront changes on focus',
		blurb: 'What does the storefront tab do when the merchant switches Cardify on?',
		stage: { w: 360, h: 270 },
		nodes: [
			shot('p1', 'lessons/apis/demo-before.webp', 1100, 481, { w: 336, y: 10, alt: 'The demo storefront with its own cards' }),
			shot('p2', 'lessons/apis/demo-after.webp', 1100, 481, { w: 336, y: 10, alt: 'The demo storefront after Cardify is switched on', visible: false }),
			credit('c', 175, 'Screenshot: Cardify Lite, run locally'),
			{ id: 'd', kind: 'doc', x: 16, y: 190, w: 328, lines: ['admin tab  PUT  .../settings           200', 'this tab   GET  /sdk/config/demostore  200', 'this tab   GET  /sdk/cardify-widget.js 200'] }
		],
		steps: [
			{ say: 'The demo storefront with Cardify off. These are the store\'s own cards, and the loader has asked for the config once.', focus: ['p1'] },
			{ say: 'Meanwhile, in the admin tab, the merchant switched Cardify on and picked Editorial. The admin saved it with a PUT.', show: ['d'], set: { d: { hl: [0] } } },
			{ say: 'Back on this tab, the focus event makes the loader ask for the config again. The page itself has not changed yet.', set: { d: { hl: [1] } } },
			{ say: 'Now enabled is true, so it loads the widget bundle. The cards are restyled with no page reload.', hide: ['p1'], show: ['p2'], set: { d: { hl: [2] } }, focus: ['p2'] },
			{ say: 'The native cards are only hidden, never removed, and no timer was needed: one fetch on focus did it all.', focus: ['p2', 'd'] }
		]
	}
];
