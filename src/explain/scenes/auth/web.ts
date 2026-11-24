import type { Scene, SceneNode, Tone } from '../../types';

/** Auth and tokens, web area: where a token may live in a browser, cookies, CSRF / CORS / XSS, compliance and the session lifecycle. Ids `au-*`; `group` = a topic id in src/db/auth/web.ts. A generic online store. */

// A vertical chain of boxes joined by arrows: box ids `<p>0..n`, edge ids `<p>e0..` (edge i joins box i and box i+1). The first box starts visible.
type Item = { l: string; s?: string; tone?: Tone };
const stack = (p: string, items: Item[], o: { x?: number; w?: number; y?: number; h?: number; gap?: number } = {}): SceneNode[] => {
	const { x = 16, w = 200, y = 14, h = 44, gap = 28 } = o;
	const out: SceneNode[] = [];
	items.forEach((it, i) => {
		out.push({ id: p + i, kind: 'box', x, y: y + i * (h + gap), w, h, label: it.l, sub: it.s, tone: it.tone, visible: i === 0 ? true : undefined });
		if (i) out.push({ id: p + 'e' + (i - 1), kind: 'edge', from: p + (i - 1), to: p + i });
	});
	return out;
};

export const auWeb: Scene[] = [
	// ───────────── au-token-storage ─────────────
	{
		id: 'au-storage-choices',
		topic: 'auth',
		group: 'au-token-storage',
		title: 'Where a token can live',
		blurb: 'Who can read a token in each place, and does the browser send it by itself?',
		stage: { w: 360, h: 240 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 24,
				y: 14,
				title: 'Browser storage for a login token',
				cols: ['Place', 'Script can read', 'Sent by itself'],
				rows: [
					['localStorage', 'Yes', 'No'],
					['sessionStorage', 'Yes', 'No'],
					['JS memory', 'Yes', 'No'],
					['HttpOnly cookie', 'No', 'Yes'],
					['BFF session', 'No', 'Yes']
				],
				colW: 104,
				visible: true
			},
			{ id: 'v', kind: 'box', x: 24, y: 176, w: 312, h: 52, label: 'Default: a server session or a BFF behind a __Host-, HttpOnly, Secure cookie', tone: 'accent' }
		],
		steps: [
			{ say: 'A web app has to keep something that proves who the user is. The places differ in who can read it and in whether the browser sends it by itself.', focus: ['t'] },
			{ say: 'localStorage and sessionStorage are open to every script on the page, so one injected script exposes them. OWASP and NIST both say not to keep session secrets there.', set: { t: { hl: [0, 1] } } },
			{ say: 'Memory vanishes on reload, which shortens a theft. Injected code in the same page can still use the app\'s own functions or ask for a new token.', set: { t: { hl: [2] } } },
			{ say: 'A script cannot read an HttpOnly cookie. The browser sends it by itself, so the server must also stop cross-site request forgery.', set: { t: { hl: [3] } } },
			{ say: 'With a backend for frontend (BFF) the browser holds only a session cookie. The access and refresh tokens stay on a server.', set: { t: { hl: [4] } } },
			{ say: 'So the default is a server session, or a BFF, behind a cookie that scripts cannot read.', show: ['v'], set: { t: { hl: [3, 4] } }, focus: ['v'] }
		]
	},
	{
		id: 'au-xss-steals',
		topic: 'auth',
		group: 'au-token-storage',
		title: 'What an injected script can reach',
		blurb: 'If an attacker script runs in your page, which secrets can it copy?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'ls', kind: 'doc', x: 16, y: 104, w: 152, title: 'localStorage', lines: ['token: eyJhbGci...', 'theme: dark'], visible: true },
			{ id: 'ck', kind: 'doc', x: 192, y: 104, w: 152, title: 'Cookies', lines: ['__Host-sid (HttpOnly)', 'ui_lang=en'], visible: true },
			{ id: 'sc', kind: 'box', x: 90, y: 14, w: 180, h: 44, label: 'Injected script', sub: 'XSS runs as the page', tone: 'neg' },
			{ id: 'e1', kind: 'edge', from: 'sc', to: 'ls', label: 'reads' },
			{ id: 'e2', kind: 'edge', from: 'sc', to: 'ck', label: 'blocked', dashed: true },
			{ id: 'still', kind: 'box', x: 16, y: 194, w: 328, h: 52, label: 'Still possible: it sends requests from the user\'s browser, and the cookie goes with them', tone: 'warn' },
			{ id: 'fix', kind: 'box', x: 16, y: 262, w: 328, h: 52, label: 'Fix the hole: encode output, nonce-based CSP, Trusted Types', tone: 'accent' }
		],
		steps: [
			{ say: 'A page keeps a token in localStorage and its session in an HttpOnly cookie.', focus: ['ls', 'ck'] },
			{ say: 'A cross-site scripting (XSS) flaw lets an attacker\'s script run inside the page, with the same access as the page\'s own code.', show: ['sc'], focus: ['sc'] },
			{ say: 'It reads localStorage directly and can send the token to the attacker\'s server.', show: ['e1'], set: { ls: { tone: 'neg' } } },
			{ say: 'The HttpOnly cookie does not appear in document.cookie, so the script cannot copy the session id.', show: ['e2'], set: { ck: { tone: 'accent' } } },
			{ say: 'But the script can still make requests from the victim\'s browser, and the cookie is attached. HttpOnly limits the damage; it does not remove the flaw.', show: ['still'], focus: ['still'] },
			{ say: 'The real fix is to stop the injection: encode output, use a nonce-based Content Security Policy and Trusted Types.', show: ['fix'], focus: ['fix'] }
		]
	},
	{
		id: 'au-bff-pattern',
		topic: 'auth',
		group: 'au-token-storage',
		title: 'The backend-for-frontend pattern',
		blurb: 'How can a browser app use OAuth tokens without ever holding one?',
		stage: { w: 360, h: 350 },
		nodes: [
			...stack('b', [{ l: 'Browser app', s: 'only a session cookie' }, { l: 'BFF', s: 'tokens in a session' }, { l: 'Resource API', s: 'gets the access token' }], { w: 150 }),
			{ id: 'as', kind: 'box', x: 206, y: 86, w: 138, h: 44, label: 'Authorization server', tone: 'neutral' },
			{ id: 'eas', kind: 'edge', from: 'b1', to: 'as', label: 'OAuth' },
			{ id: 'ck', kind: 'doc', x: 196, y: 8, w: 148, lines: ['__Host-sid=9f3k...', 'Secure; HttpOnly;', 'SameSite=Lax'] },
			{ id: 'warn', kind: 'box', x: 16, y: 232, w: 328, h: 48, label: 'The BFF must still stop CSRF, for example with a custom header every call carries', tone: 'warn' },
			{ id: 'rank', kind: 'box', x: 16, y: 292, w: 328, h: 48, label: 'RFC 10017 ranks this first for business and personal-data apps', tone: 'accent' }
		],
		steps: [
			{ say: 'The browser app calls the BFF on its own origin. It never sees an access token or a refresh token.', focus: ['b0'] },
			{ say: 'The BFF is the OAuth client. It logs the user in and keeps the tokens in a server-side session.', show: ['b1', 'be0'], focus: ['b1'] },
			{ say: 'It talks to the authorization server itself, as a confidential client, to get and refresh the tokens.', show: ['as', 'eas'] },
			{ say: 'For each API call the BFF finds the session from the cookie, adds the access token and forwards the request.', show: ['b2', 'be1'], focus: ['b2'] },
			{ say: 'The browser keeps only a session cookie: Secure, HttpOnly, SameSite, with a __Host- prefix.', show: ['ck'], focus: ['ck'] },
			{ say: 'Cookies bring CSRF duties, so the BFF must check origin, use a token, or require a custom header.', show: ['warn'], focus: ['warn'] },
			{ say: 'IETF RFC 10017 lists a BFF first and strongly recommends it for business, sensitive and personal-data applications.', show: ['rank'], focus: ['rank'] }
		]
	},

	// ───────────── au-cookies ─────────────
	{
		id: 'au-cookie-flags',
		topic: 'auth',
		group: 'au-cookies',
		title: 'A session cookie, attribute by attribute',
		blurb: 'What does each part of a safe Set-Cookie header protect?',
		stage: { w: 360, h: 240 },
		nodes: [
			{
				id: 'c',
				kind: 'doc',
				x: 16,
				y: 14,
				w: 328,
				title: 'Set-Cookie response header',
				lines: ['Set-Cookie: __Host-sid=9f3kX7...;', '  Path=/;', '  Secure;', '  HttpOnly;', '  SameSite=Lax;', '  Max-Age=1800'],
				visible: true
			},
			{ id: 'why', kind: 'box', x: 16, y: 150, w: 328, h: 56, label: 'An opaque random value plus attributes that tell the browser how to treat it.', tone: 'accent', visible: true }
		],
		steps: [
			{ say: 'A session cookie: a random value that means nothing by itself, and attributes that tell the browser how to treat it.', focus: ['c'] },
			{ say: 'The __Host- prefix makes the browser refuse the cookie unless it is Secure, has no Domain and uses Path=/.', set: { c: { hl: [0] }, why: { label: 'Prefix __Host-: no subdomain can set or overwrite this cookie, and it cannot be sent to another host.' } } },
			{ say: 'Path=/ is required by the prefix. Path only picks which URLs get the cookie; it is not a security boundary.', set: { c: { hl: [1] }, why: { label: 'Path=/: the cookie is host-wide. Path never stops a script on the same host from reading it.' } } },
			{ say: 'Secure keeps the cookie off plain HTTP, so it is never sent in clear text.', set: { c: { hl: [2] }, why: { label: 'Secure: sent over HTTPS only.' } } },
			{ say: 'HttpOnly hides the cookie from JavaScript, so an XSS script cannot copy the session id.', set: { c: { hl: [3] }, why: { label: 'HttpOnly: document.cookie does not list it, and scripts cannot read it.' } } },
			{ say: 'SameSite=Lax withholds the cookie from cross-site POSTs and subresource requests. It helps against CSRF but is not enough alone.', set: { c: { hl: [4] }, why: { label: 'SameSite=Lax: not sent on cross-site POSTs, images or fetches. A defence in depth for CSRF.' } } },
			{ say: 'Max-Age sets a lifetime in seconds. Without it the cookie lasts until the browser closes. The server enforces real timeouts as well.', set: { c: { hl: [5] }, why: { label: 'Max-Age: 1800 seconds. It beats Expires if both are set, and the server still checks expiry itself.' } } }
		]
	},
	{
		id: 'au-samesite-matrix',
		topic: 'auth',
		group: 'au-cookies',
		title: 'When SameSite sends the cookie',
		blurb: 'Which cross-site requests carry the cookie under Strict, Lax and None?',
		stage: { w: 360, h: 220 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 190,
				y: 14,
				title: 'Cookie sent?',
				cols: ['Strict', 'Lax', 'None'],
				rows: [
					['sent', 'sent', 'sent'],
					['blocked', 'sent', 'sent'],
					['blocked', 'blocked', 'sent'],
					['blocked', 'blocked', 'sent']
				],
				colW: 50,
				visible: true
			},
			{ id: 'l0', kind: 'text', x: 16, y: 69, text: 'Same-site request', size: 'sm', visible: true },
			{ id: 'l1', kind: 'text', x: 16, y: 91, text: 'Link from another site', size: 'sm', visible: true },
			{ id: 'l2', kind: 'text', x: 16, y: 113, text: 'Cross-site form POST', size: 'sm', visible: true },
			{ id: 'l3', kind: 'text', x: 16, y: 135, text: 'Cross-site fetch or image', size: 'sm', visible: true },
			{ id: 'w', kind: 'box', x: 16, y: 160, w: 328, h: 48, label: 'Lax still sends on GET navigations: never change state on a GET', tone: 'warn' }
		],
		steps: [
			{ say: 'SameSite tells the browser when to attach a cookie to requests that start on another site.', focus: ['t'] },
			{ say: 'A request from the same site always carries the cookie, whatever the value.', set: { t: { hl: [0] } } },
			{ say: 'Following a link from another site: Strict withholds the cookie, Lax sends it because it is a top-level navigation with a safe method.', set: { t: { hl: [1] } } },
			{ say: 'A form POST from another site is the classic CSRF. Strict and Lax withhold the cookie; None sends it.', set: { t: { hl: [2] } } },
			{ say: 'Fetches and images from another site are blocked the same way. SameSite=None must be paired with Secure and may be blocked by the browser anyway.', set: { t: { hl: [3] } } },
			{ say: 'Lax is a good default for a session cookie, but only if no GET request changes state.', show: ['w'], set: { t: { hl: [] } }, focus: ['w'] }
		]
	},

	// ───────────── au-csrf-cors-xss ─────────────
	{
		id: 'au-csrf-attack',
		topic: 'auth',
		group: 'au-csrf-cors-xss',
		title: 'A forged request, and how to stop it',
		blurb: 'How does another site make a logged-in browser change an account?',
		stage: { w: 360, h: 240 },
		nodes: [
			{ id: 'ev', kind: 'box', x: 16, y: 14, w: 170, h: 44, label: 'evil.example page', sub: 'hidden form', tone: 'neg' },
			{ id: 'br', kind: 'box', x: 16, y: 86, w: 170, h: 44, label: 'Browser', sub: 'logged in to the shop', visible: true },
			{ id: 'sv', kind: 'box', x: 16, y: 158, w: 170, h: 44, label: 'Shop server', sub: 'POST /account/email', visible: true },
			{ id: 'e1', kind: 'edge', from: 'ev', to: 'br', label: 'visit' },
			{ id: 'e2', kind: 'edge', from: 'br', to: 'sv', label: 'POST + cookie' },
			{ id: 'd1', kind: 'box', x: 200, y: 10, w: 144, h: 56, label: 'SameSite cookie', sub: 'not sent on cross-site POST', tone: 'accent' },
			{ id: 'd2', kind: 'box', x: 200, y: 84, w: 144, h: 56, label: 'Fetch Metadata', sub: 'reject Sec-Fetch-Site: cross-site', tone: 'accent' },
			{ id: 'd3', kind: 'box', x: 200, y: 158, w: 144, h: 56, label: 'CSRF token or header', sub: 'a forged form cannot add it', tone: 'accent' }
		],
		steps: [
			{ say: 'A user is logged in to the shop, so the browser holds the shop\'s session cookie.', focus: ['br'] },
			{ say: 'The user opens another site that contains a hidden form aimed at the shop\'s change-email URL.', show: ['ev', 'e1'], focus: ['ev'] },
			{ say: 'The page submits it. The browser sends the POST to the shop and attaches the shop\'s cookie by itself.', show: ['e2'], pulse: ['e2'] },
			{ say: 'With no defence the server sees a valid session and changes the email. The user never clicked anything on the shop.', set: { sv: { tone: 'neg' } }, focus: ['sv'] },
			{ say: 'Defence 1: a SameSite=Lax or Strict cookie is not attached to a cross-site POST.', show: ['d1'], set: { sv: { tone: 'neutral' } }, focus: ['d1'] },
			{ say: 'Defence 2: reject unsafe requests whose Sec-Fetch-Site is cross-site. If the header is missing, compare the Origin header with your own.', show: ['d2'], focus: ['d2'] },
			{ say: 'Defence 3: require an anti-CSRF token or a custom header. Use at least two layers, because each has gaps.', show: ['d3'], focus: ['d3'] }
		]
	},
	{
		id: 'au-cors-not-auth',
		topic: 'auth',
		group: 'au-csrf-cors-xss',
		title: 'What CORS does, and what it does not',
		blurb: 'Does CORS prove who the user is?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'pg', kind: 'box', x: 16, y: 14, w: 328, h: 44, label: 'Script on app.example.com', sub: 'calls fetch() with JSON', visible: true },
			{ id: 'ap', kind: 'box', x: 16, y: 134, w: 328, h: 44, label: 'API on api.example.com', sub: 'a different origin', visible: true },
			{ id: 'e1', kind: 'edge', from: 'pg', to: 'ap', label: 'preflight OPTIONS' },
			{ id: 'rs', kind: 'doc', x: 16, y: 194, w: 328, title: 'Preflight response', lines: ['Access-Control-Allow-Origin:', '  https://app.example.com'] },
			{ id: 'e2', kind: 'edge', from: 'ap', to: 'pg', label: 'readable reply' },
			{ id: 'nt', kind: 'box', x: 16, y: 268, w: 328, h: 52, label: 'CORS lets the browser share a response with a script from an allowed origin.', tone: 'accent' }
		],
		steps: [
			{ say: 'A script on one origin wants to read a response from another. The same-origin policy blocks that unless the server agrees.', focus: ['pg', 'ap'] },
			{ say: 'Because the call has a JSON body, the browser first sends a preflight OPTIONS request asking if it is allowed.', show: ['e1'] },
			{ say: 'The API answers with the origin it allows. For a request with cookies it must name the origin exactly, never *.', show: ['rs'], focus: ['rs'] },
			{ say: 'Only then does the browser send the real request, and it lets the script read the API\'s reply.', show: ['e2'] },
			{ say: 'This is a browser rule about who may read responses. It says nothing about who the user is, so it is not authentication.', set: { nt: { label: 'CORS lets the browser share a response with a script from an allowed origin. It is not a login.' } }, show: ['nt'], focus: ['nt'] },
			{ say: 'Simple requests, such as a plain form POST, are sent anyway and only the reading is blocked. CORS alone is not a CSRF defence.', set: { nt: { tone: 'warn', label: 'A plain form POST needs no preflight. Do not rely on CORS to stop forged requests.' } }, pulse: ['nt'] },
			{ say: 'A custom request header always forces a preflight, so requiring one is a cheap CSRF check for JSON APIs.', set: { nt: { tone: 'accent', label: 'Require a custom header on every call: a cross-site page cannot add it without approval.' } }, pulse: ['nt'] }
		]
	},
	{
		id: 'au-xss-defences',
		topic: 'auth',
		group: 'au-csrf-cors-xss',
		title: 'Layers against cross-site scripting',
		blurb: 'What stops an injected script, and what limits it if one gets through?',
		stage: { w: 360, h: 340 },
		nodes: stack(
			'a',
			[
				{ l: 'Encode output for its context', s: 'HTML, attribute, JavaScript and URL each differ' },
				{ l: 'Use safe APIs', s: 'textContent, not innerHTML; no eval' },
				{ l: 'Content Security Policy', s: 'a nonce-based script-src blocks injected scripts' },
				{ l: 'Trusted Types', s: 'DOM sinks accept only values from a named policy' },
				{ l: 'Limit the damage', s: 'HttpOnly cookies or a BFF: no token to steal', tone: 'accent' }
			],
			{ w: 328, h: 44, gap: 24 }
		),
		steps: [
			{ say: 'XSS is how tokens get stolen, so the first job is to stop attacker text from becoming code. Start by encoding output for where it lands.', focus: ['a0'] },
			{ say: 'Prefer APIs that treat data as text: textContent instead of innerHTML, and no eval.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'A Content Security Policy with per-response nonces lets only your own scripts run, even if some markup slips in.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'Trusted Types makes the browser refuse risky DOM assignments unless the value passed through a policy you wrote.', show: ['a3', 'ae2'], focus: ['a3'] },
			{ say: 'If one flaw still gets through, an HttpOnly cookie or a BFF means there is no token for the script to copy.', show: ['a4', 'ae3'], focus: ['a4'] },
			{ say: 'No single layer is enough. Together they make one mistake much harder to turn into a stolen session.', pulse: ['a0', 'a1', 'a2', 'a3', 'a4'] }
		]
	},

	// ───────────── au-token-compliance ─────────────
	{
		id: 'au-compliance-map',
		topic: 'auth',
		group: 'au-token-compliance',
		title: 'Which rule comes from where',
		blurb: 'Which document asks for what when you handle sessions and tokens?',
		stage: { w: 360, h: 240 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 24,
				y: 14,
				title: 'Engineering guidance, not legal advice',
				cols: ['Topic', 'Source'],
				rows: [
					['Breach notice', 'GDPR Art. 33'],
					['Minimise data', 'GDPR Art. 5, 25'],
					['Cookie consent', 'ePrivacy Art. 5(3)'],
					['MFA, card data', 'PCI DSS 8.4.2'],
					['Password rules', 'NIST SP 800-63B-4'],
					['Session checks', 'OWASP ASVS 5.0']
				],
				colW: 156,
				visible: true
			}
		],
		steps: [
			{ say: 'Several documents touch tokens and sessions, and each asks for something different. This is engineering guidance, not legal advice.', focus: ['t'] },
			{ say: 'GDPR Article 33: tell the supervisory authority within 72 hours of becoming aware of a breach, where feasible.', set: { t: { hl: [0] } } },
			{ say: 'GDPR Articles 5 and 25: collect and keep only what you need, and make that the default.', set: { t: { hl: [1] } } },
			{ say: 'ePrivacy Article 5(3): storing or reading data on a device needs consent unless an exemption applies. Tokens count.', set: { t: { hl: [2] } } },
			{ say: 'PCI DSS 4.0.1, requirement 8.4.2: multi-factor authentication for all access into the cardholder data environment.', set: { t: { hl: [3] } } },
			{ say: 'NIST SP 800-63B-4: no composition rules, no forced periodic changes, a blocklist, and tightly scoped session cookies.', set: { t: { hl: [4] } } },
			{ say: 'OWASP ASVS 5.0: V3.3 cookies, V7 sessions, V9 and V10 tokens, V14.3 browser storage, V16 logging.', set: { t: { hl: [5] } } }
		]
	},
	{
		id: 'au-consent-cookies',
		topic: 'auth',
		group: 'au-token-compliance',
		title: 'Does this cookie need consent?',
		blurb: 'Which cookies are exempt from consent and which are not?',
		stage: { w: 360, h: 260 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 24,
				y: 14,
				title: 'Rule of thumb for an online store',
				cols: ['Cookie', 'Purpose', 'Consent?'],
				rows: [
					['Session id', 'Login session', 'Usually no'],
					['Login limiter', 'Abuse guard', 'Usually no'],
					['Remember me', 'Stay logged in', 'Ask first'],
					['Shop analytics', 'Visit counts', 'Yes'],
					['Ad pixel', 'Ad tracking', 'Yes']
				],
				colW: 104,
				visible: true
			},
			{ id: 'w', kind: 'box', x: 24, y: 176, w: 312, h: 48, label: 'A rule of thumb only. Your regulator and your counsel decide.', tone: 'warn' }
		],
		steps: [
			{ say: 'Cookie rules ask what a cookie is for. One the user asked for (staying logged in) differs from one that serves you.', focus: ['t'] },
			{ say: 'A first-party session cookie that keeps the user logged in is strictly necessary for the service they asked for, so it normally needs no consent.', set: { t: { hl: [0] } } },
			{ say: 'A cookie that detects repeated failed logins protects the user\'s own login, and the 2012 Working Party opinion treats it as exempt too.', set: { t: { hl: [1] } } },
			{ say: 'A persistent login (remember me) is not exempt in that opinion. Ask with a checkbox that says it uses cookies.', set: { t: { hl: [2] } } },
			{ say: 'Analytics and advertising cookies are not exempt. They need consent first, and the login cookie must never be reused for them.', set: { t: { hl: [3, 4] } } },
			{ say: 'EDPB guidance says the same rules reach beyond cookies, so a token in localStorage does not escape them.', show: ['w'], set: { t: { hl: [] } }, focus: ['w'] }
		]
	},
	{
		id: 'au-audit-log',
		topic: 'auth',
		group: 'au-token-compliance',
		title: 'What to log, and what never to',
		blurb: 'How do you keep an audit trail without leaking secrets into it?',
		stage: { w: 360, h: 310 },
		nodes: [
			{ id: 'g', kind: 'doc', x: 16, y: 14, w: 328, title: 'A good audit event', lines: ['2026-11-24T10:02:11Z', 'event=login result=fail', 'user=u_8231 ip=203.0.113.7', 'method=password reason=bad_pw'], visible: true },
			{ id: 'n', kind: 'doc', x: 16, y: 126, w: 328, title: 'Never in readable form', lines: ['Authorization: Bearer eyJhbGci...', 'password=hunter2', 'sid=9f3kX7...', 'card=4111111111111111'] },
			{ id: 'm', kind: 'box', x: 16, y: 242, w: 328, h: 56, label: 'Log a hash of the session id (sid_hash=ab12...) if you must correlate events.', tone: 'accent' }
		],
		steps: [
			{ say: 'An audit event answers who, what, when, from where and with what result.', focus: ['g'] },
			{ say: 'What happened and how it ended: the event name, success or failure, and the method used.', set: { g: { hl: [1, 3] } } },
			{ say: 'Who and where: an internal user id and the source address, kept only as long as you need them.', set: { g: { hl: [2] } } },
			{ say: 'Never write passwords, access tokens, session ids, keys or card numbers in readable form. A log leak would hand them to an attacker.', show: ['n'], set: { g: { hl: [] } }, focus: ['n'] },
			{ say: 'Mask or hash such values. OWASP suggests a hashed session id when you need to follow one session across events.', show: ['m'], focus: ['m'] },
			{ say: 'OWASP ASVS 5.0 asks you to log every authentication attempt, success and failure, and to treat log data by its protection level.', set: { g: { hl: [1] } } }
		]
	},

	// ───────────── au-token-lifecycle-web ─────────────
	{
		id: 'au-login-to-api',
		topic: 'auth',
		group: 'au-token-lifecycle-web',
		title: 'A session over the wire',
		blurb: 'What do the requests and responses look like from login to a sensitive change?',
		stage: { w: 360, h: 240 },
		nodes: [
			{ id: 'rq', kind: 'doc', x: 16, y: 14, w: 328, title: 'Request', lines: ['POST /login', 'Content-Type: application/json', '', '{ "email": "asha@example.com", ... }'], visible: true },
			{ id: 'rs', kind: 'doc', x: 16, y: 130, w: 328, title: 'Response', lines: ['HTTP/1.1 200 OK', 'Set-Cookie: __Host-sid=9f3kX7...; Path=/;', '  Secure; HttpOnly; SameSite=Lax', 'Cache-Control: no-store'] }
		],
		steps: [
			{ say: 'The browser posts the login form. The password travels over HTTPS in the body, never in the URL.', focus: ['rq'] },
			{ say: 'The server checks the credentials, creates a NEW session id and sends it as a cookie. Responses with account data are marked no-store.', show: ['rs'], focus: ['rs'] },
			{ say: 'On each later request the browser attaches the cookie. The server looks the id up and loads the user.', set: { rq: { lines: ['GET /api/orders', 'Cookie: __Host-sid=9f3kX7...', 'Sec-Fetch-Site: same-origin'], hl: [1] }, rs: { lines: ['HTTP/1.1 200 OK', 'Content-Type: application/json', 'Cache-Control: no-store', '{ "orders": [ ... ] }'] } } },
			{ say: 'After the idle or absolute timeout the server rejects the id with 401 and clears the cookie. The user logs in again.', set: { rq: { hl: [] }, rs: { lines: ['HTTP/1.1 401 Unauthorized', 'Set-Cookie: __Host-sid=; Path=/; Secure;', '  HttpOnly; Max-Age=0'] } } },
			{ say: 'For a sensitive change the server asks for a fresh login first (step-up), even though the session is still valid.', set: { rq: { lines: ['POST /account/email', 'Cookie: __Host-sid=9f3kX7...', 'Origin: https://shop.example.com'] }, rs: { lines: ['HTTP/1.1 403 Forbidden', '{ "error": "reauthenticate" }'] } } }
		]
	},
	{
		id: 'au-refresh-rotation',
		topic: 'auth',
		group: 'au-token-lifecycle-web',
		title: 'Refresh rotation, step by step',
		blurb: 'How does rotation turn a stolen refresh token into a visible event?',
		stage: { w: 360, h: 320 },
		nodes: [
			{ id: 't', kind: 'table', x: 24, y: 14, title: 'Refresh token family', cols: ['Token', 'State'], rows: [['R1', 'active']], colW: 156, visible: true },
			{ id: 'th', kind: 'box', x: 24, y: 190, w: 312, h: 44, label: 'Attacker with a copy of R3', sub: 'copied before the client used it', tone: 'neg' },
			{ id: 'ac', kind: 'box', x: 24, y: 252, w: 312, h: 52, label: 'Rotation makes a silent theft visible, and the family has a maximum life.', tone: 'accent' }
		],
		steps: [
			{ say: 'Login gives a short-lived access token and a refresh token, R1. The access token lasts minutes, the refresh token hours.', focus: ['t'] },
			{ say: 'When the access token expires the client sends R1. The server returns a new access token and a NEW refresh token, R2. R1 is now invalid.', set: { t: { rows: [['R1', 'used, replaced by R2'], ['R2', 'active']], hl: [1] } } },
			{ say: 'This repeats one refresh token at a time. The family has a maximum lifetime, so it cannot be renewed forever.', set: { t: { rows: [['R1', 'used, replaced by R2'], ['R2', 'used, replaced by R3'], ['R3', 'active']], hl: [2] } } },
			{ say: 'An attacker copies R3, the active token, before the real client sends it again.', show: ['th'], set: { t: { hl: [2] } }, focus: ['th'] },
			{ say: 'The attacker uses R3 first and gets R4. When the real client later sends R3 again, the server sees an already used token.', set: { t: { rows: [['R1', 'used, replaced by R2'], ['R2', 'used, replaced by R3'], ['R3', 'used twice: replay'], ['R4', 'issued to the attacker']], hl: [2] } } },
			{ say: 'The server cannot tell which party is which, so it revokes the whole family. Both must log in again.', set: { t: { rows: [['R1', 'revoked'], ['R2', 'revoked'], ['R3', 'revoked'], ['R4', 'revoked']], hl: [0, 1, 2, 3] } } },
			{ say: 'RFC 9700 asks servers to rotate refresh tokens or bind them to a client, for public clients, so replay can be detected.', show: ['ac'], focus: ['ac'] }
		]
	},
	{
		id: 'au-logout-revoke',
		topic: 'auth',
		group: 'au-token-lifecycle-web',
		title: 'Logout must end the session on the server',
		blurb: 'Why is deleting the cookie not enough?',
		stage: { w: 360, h: 280 },
		nodes: [
			{ id: 'br', kind: 'box', x: 16, y: 14, w: 140, h: 44, label: 'Browser', sub: 'has the cookie', visible: true },
			{ id: 'st', kind: 'db', x: 200, y: 14, w: 140, h: 44, label: 'Session store', visible: true },
			{ id: 'cnt', kind: 'text', x: 340, y: 86, text: 'sessions: 1', size: 'sm', anchor: 'end', visible: true },
			{ id: 'e1', kind: 'edge', from: 'br', to: 'st', label: 'logout' },
			{ id: 'ck', kind: 'doc', x: 16, y: 76, w: 180, lines: ['Set-Cookie: __Host-sid=;', 'Path=/; Secure; HttpOnly;', 'Max-Age=0'] },
			{ id: 'at', kind: 'box', x: 200, y: 150, w: 140, h: 44, label: 'Copied session id', sub: 'taken earlier', tone: 'neg' },
			{ id: 'e2', kind: 'edge', from: 'at', to: 'st', label: '/api/orders' },
			{ id: 'ex', kind: 'box', x: 16, y: 218, w: 328, h: 48, label: 'Offer log out everywhere, and end other sessions after a password or MFA change.', tone: 'accent' }
		],
		steps: [
			{ say: 'While logged in, the browser holds a cookie and the server holds a matching session record.', focus: ['br', 'st'] },
			{ say: 'Logging out sends a request to the server.', show: ['e1'], pulse: ['e1'] },
			{ say: 'The server deletes the session record. This is the step that really ends the session.', set: { st: { tone: 'accent' }, cnt: { text: 'sessions: 0', tone: 'accent' } }, focus: ['st'] },
			{ say: 'It also tells the browser to drop the cookie, with an empty value and Max-Age=0. That is tidying up, not the security step.', show: ['ck'], focus: ['ck'] },
			{ say: 'Suppose someone copied the session id earlier, and now tries it against the API.', show: ['at', 'e2'], focus: ['at'] },
			{ say: 'The id is no longer in the store, so the request fails. If only the cookie had been cleared, the copy would still work.', set: { at: { sub: 'rejected: 401' } }, pulse: ['at'] },
			{ say: 'Also offer log out everywhere, and end other sessions after a password or MFA change.', show: ['ex'], focus: ['ex'] }
		]
	}
];
