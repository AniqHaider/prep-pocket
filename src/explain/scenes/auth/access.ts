import type { Scene, SceneNode, Tone } from '../../types';

/** Auth and tokens, access area: MFA and passkeys, API keys and service auth, authorization models, auth in practice. Ids `au-*`; `group` = a topic id in src/db/auth/access.ts. */

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
/** A short note beside a box, hidden until a step shows it. */
const note = (id: string, x: number, y: number, text: string, w = 118): SceneNode => ({ id, kind: 'text', x, y, text, size: 'sm', w });

export const auAccess: Scene[] = [
	// ───────────── au-mfa-passkeys ─────────────
	{
		id: 'au-totp-flow',
		topic: 'auth',
		group: 'au-mfa-passkeys',
		title: 'How a 6-digit code is made',
		blurb: 'Where does the code in an authenticator app come from?',
		stage: { w: 360, h: 372 },
		nodes: [
			...stack(
				't',
				[
					{ l: 'Shared secret', s: 'set once, when you enrol' },
					{ l: 'Time step', s: 'floor(unix time / 30)' },
					{ l: 'HMAC of the step', s: 'keyed with the secret' },
					{ l: 'Truncate', s: 'low nibble = offset, 31 bits' },
					{ l: '6-digit code', s: 'number mod 1,000,000' },
					{ l: 'Server compares', s: 'same maths, same clock' }
				],
				{ x: 16, w: 200, y: 12, h: 40, gap: 22 }
			),
			note('n0', 232, 36, 'kept by both sides'),
			note('n1', 232, 98, 'both sides share the clock'),
			note('n2', 232, 160, '20 bytes with SHA-1'),
			note('n3', 232, 222, '4 bytes, top bit cleared'),
			note('n4', 232, 284, 'changes every 30 s'),
			note('n5', 232, 346, 'current step or one before')
		],
		steps: [
			{ say: 'At enrolment the server and your authenticator app share a secret, usually through a QR code. Both keep it; it is never sent again.', show: ['n0'], focus: ['t0'] },
			{ say: 'Both sides turn the clock into a step number: Unix time divided by 30 seconds, rounded down. At 59 seconds it is step 1, at 60 seconds step 2.', show: ['t1', 'te0', 'n1'], focus: ['t1'] },
			{ say: 'They compute an HMAC of the step number, keyed with the secret. HMAC-SHA-1 is the default and gives 20 bytes; SHA-256 and SHA-512 are allowed.', show: ['t2', 'te1', 'n2'], focus: ['t2'] },
			{ say: 'Truncation turns 20 bytes into a number: the low 4 bits of the last byte pick an offset, and 4 bytes from there, with the top bit cleared, give 31 bits.', show: ['t3', 'te2', 'n3'], focus: ['t3'] },
			{ say: 'That number modulo 1,000,000 is the six digits you type. Nothing in it is the secret itself, and it changes with every step.', show: ['t4', 'te3', 'n4'], focus: ['t4'] },
			{ say: 'The server repeats the maths and compares. RFC 6238 recommends allowing the current step and at most one earlier step, to cover network delay.', show: ['t5', 'te4', 'n5'], focus: ['t5'] },
			{ say: 'It also stores the last step it accepted. A code from that step or earlier is refused, so a code seen over a shoulder cannot be used twice.', set: { t5: { sub: 'and rejects a step used before', tone: 'accent' } }, pulse: ['t5'] }
		]
	},
	{
		id: 'au-mfa-factors',
		topic: 'auth',
		group: 'au-mfa-passkeys',
		title: 'Second factors compared',
		blurb: 'Which second factors can a fake site steal?',
		stage: { w: 360, h: 220 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 108,
				title: 'Second factors compared',
				cols: ['Second factor', 'Weak spot', 'Phishing-proof?'],
				rows: [
					['SMS code', 'SIM swap, SS7', 'No'],
					['Email code', 'Inbox takeover', 'No'],
					['Authenticator app', 'Relayed in time', 'No'],
					['Hardware key', 'Lost key', 'Yes'],
					['Passkey', 'Recovery path', 'Yes']
				],
				visible: true
			},
			note('nn', 16, 196, 'NIST SP 800-63B-4: manual-entry codes are never phishing-resistant.', 328)
		],
		steps: [
			{ say: 'Codes a person types in, by SMS, email or an app, can be handed to a fake site and relayed to the real one in time.', focus: ['t'] },
			{ say: 'SMS codes cross the phone network. NIST restricts that channel because of SS7 interception, SIM swapping and number porting.', set: { t: { hl: [0] } } },
			{ say: 'NIST does not allow email as an out-of-band authenticator: an inbox is often protected by a password alone, and mail can be intercepted.', set: { t: { hl: [1] } } },
			{ say: 'An authenticator app is better: nothing crosses the phone network. But a person can still type a fresh code into a fake site, which relays it at once.', set: { t: { hl: [2] } } },
			{ say: 'Hardware keys and passkeys sign a challenge for the real site only, so a look-alike site gets nothing to relay.', set: { t: { hl: [3, 4] } } },
			{ say: 'NIST does not count manual-entry codes as phishing-resistant, and wants a phishing-resistant option offered at assurance level 2.', show: ['nn'], set: { t: { hl: [] } } }
		]
	},
	{
		id: 'au-passkey-login',
		topic: 'auth',
		group: 'au-mfa-passkeys',
		title: 'A passkey sign-in',
		blurb: 'What happens when you sign in with a passkey, and why can a fake site not copy it?',
		stage: { w: 360, h: 330 },
		nodes: [
			...stack(
				'p',
				[
					{ l: 'Shop server', s: 'sends a random challenge' },
					{ l: 'Browser', s: 'adds the site origin' },
					{ l: 'Authenticator', s: 'PIN or biometric first' },
					{ l: 'Signed response', s: 'private key signs it' },
					{ l: 'Shop server checks', s: 'public key, origin, challenge', tone: 'accent' }
				],
				{ x: 16, w: 200, y: 12, h: 40, gap: 22 }
			),
			{ id: 'fk', kind: 'box', x: 232, y: 136, w: 116, h: 46, label: 'Look-alike site', sub: 'another origin', tone: 'neg' },
			note('fn', 232, 204, 'no credential for this domain'),
			note('rn', 232, 270, 'plan account recovery')
		],
		steps: [
			{ say: 'Sign-in starts with the shop sending a fresh random challenge. There is no password to type, and none to steal.', focus: ['p0'] },
			{ say: 'The browser adds the origin of the page that asked, such as shop.example.com, and passes both to the authenticator.', show: ['p1', 'pe0'], focus: ['p1'] },
			{ say: 'The authenticator finds the credential made for that domain and checks it is you, with a PIN or biometric: user verification.', show: ['p2', 'pe1'], focus: ['p2'] },
			{ say: 'It signs the challenge and origin with the private key. The key never leaves the authenticator; only the signature travels.', show: ['p3', 'pe2'], focus: ['p3'] },
			{ say: 'The server checks the signature with the stored public key, and that the challenge, origin and user-verification flag are what it expects.', show: ['p4', 'pe3'], focus: ['p4'] },
			{ say: 'A look-alike site has a different origin. The authenticator holds no credential for that domain, so there is nothing to sign or relay.', show: ['fk', 'fn'], focus: ['fk'] },
			{ say: 'Credentials can live on one device or sync between a user\'s devices. Either way, build account recovery, so a lost device cannot lock a customer out.', show: ['rn'] }
		]
	},

	// ───────────── au-api-keys-service-auth ─────────────
	{
		id: 'au-apikey-lifecycle',
		topic: 'auth',
		group: 'au-api-keys-service-auth',
		title: 'Issuing and rotating an API key',
		blurb: 'How does a key go from creation to rotation without ever being stored in the clear?',
		stage: { w: 360, h: 366 },
		nodes: [
			...stack(
				'k',
				[
					{ l: 'Create a key', s: 'shop_live_ + random bytes' },
					{ l: 'Show it once', s: 'the owner copies it' },
					{ l: 'Store a hash', s: 'plus prefix, scopes, expiry' },
					{ l: 'Client sends it', s: 'header, over HTTPS' },
					{ l: 'Server checks', s: 'hash, compare, scope, expiry' },
					{ l: 'Rotate', s: 'new key, overlap, revoke old', tone: 'accent' }
				],
				{ x: 16, w: 200, y: 12, h: 40, gap: 20 }
			),
			note('n0', 232, 34, 'a prefix helps scanners find leaks'),
			note('n1', 232, 94, 'it cannot be shown again'),
			note('n2', 232, 154, 'a leaked database holds no usable keys'),
			note('n3', 232, 214, 'never in the URL'),
			note('n4', 232, 274, 'constant-time compare'),
			note('n5', 232, 334, 'both work during the switch')
		],
		steps: [
			{ say: 'Generate the key with a secure random generator and give it a recognisable prefix, so a leaked key is easy to spot and to trace.', show: ['n0'], focus: ['k0'] },
			{ say: 'Show the full key once. Afterwards nobody, including your own staff, can read it back.', show: ['k1', 'ke0', 'n1'], focus: ['k1'] },
			{ say: 'Store only a hash of the key, with its prefix, scopes, expiry and owner. A database leak then yields no working keys.', show: ['k2', 'ke1', 'n2'], focus: ['k2'] },
			{ say: 'The client sends the key in a request header over HTTPS, never in a URL.', show: ['k3', 'ke2', 'n3'], focus: ['k3'] },
			{ say: 'The server hashes what arrived, looks it up, compares in constant time, then checks scope and expiry before running anything.', show: ['k4', 'ke3', 'n4'], focus: ['k4'] },
			{ say: 'To rotate, issue a new key, let both work for a short overlap, then revoke the old one. Expiry dates make rotation routine.', show: ['k5', 'ke4', 'n5'], focus: ['k5'] },
			{ say: 'Scopes keep each key narrow: a key that can only read orders is a small loss if it leaks. Revoke at once if a key is found anywhere public.', pulse: ['k2', 'k5'] }
		]
	},
	{
		id: 'au-key-transport',
		topic: 'auth',
		group: 'au-api-keys-service-auth',
		title: 'Where a key may travel',
		blurb: 'Which places are safe for an API key, and which leak it?',
		stage: { w: 360, h: 240 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 108,
				title: 'Where a key goes',
				cols: ['Place', 'Verdict', 'Why'],
				rows: [
					['Auth header', 'Use', 'Stays out of URLs'],
					['Custom header', 'Use', 'Same, over HTTPS'],
					['URL query', 'Avoid', 'Lands in logs'],
					['Browser bundle', 'Never', 'Visible to all'],
					['Git repository', 'Never', 'Stays in history'],
					['Vault or env var', 'Use', 'Outside the code']
				],
				visible: true
			},
			note('nn', 16, 212, 'Serve APIs over HTTPS only, so keys cannot be read in transit.', 328)
		],
		steps: [
			{ say: 'Where a key travels decides who can see it. Six places, compared.', focus: ['t'] },
			{ say: 'Send keys in a request header such as Authorization, over HTTPS only. Headers are not part of the URL.', set: { t: { hl: [0, 1] } } },
			{ say: 'A key in a URL can be disclosed through logs, browser history, bookmarks and the Referer header. OWASP says this of session IDs; keys behave the same.', set: { t: { hl: [2] } } },
			{ say: 'Anything shipped in a browser or app bundle can be read by every user. A key there is public, so browser code should call your server instead.', set: { t: { hl: [3] } } },
			{ say: 'A key committed to git stays in the history even after the file is deleted. Treat it as leaked: revoke it and issue a new one.', set: { t: { hl: [4] } } },
			{ say: 'Load keys from environment variables or a secrets manager, limit who can read them, and rotate them on a schedule or when someone leaves.', set: { t: { hl: [5] } } },
			{ say: 'Transport matters too: serve APIs over HTTPS only, so a key cannot be read on the way.', show: ['nn'], set: { t: { hl: [] } } }
		]
	},
	{
		id: 'au-webhook-signature',
		topic: 'auth',
		group: 'au-api-keys-service-auth',
		title: 'Signing and checking a webhook',
		blurb: 'How can a receiver know a webhook really came from the sender?',
		stage: { w: 360, h: 396 },
		nodes: [
			...stack(
				'w',
				[
					{ l: 'Sender builds the text', s: 'id . timestamp . body' },
					{ l: 'Sender signs it', s: 'HMAC-SHA256, shared secret' },
					{ l: 'POST with headers', s: 'id, timestamp, signature' },
					{ l: 'Receiver recomputes', s: 'same secret, same text' },
					{ l: 'Receiver checks', s: 'signature, age, repeat id', tone: 'accent' }
				],
				{ x: 16, w: 200, y: 12, h: 38, gap: 20 }
			),
			{
				id: 'hd',
				kind: 'doc',
				x: 16,
				y: 296,
				w: 328,
				title: 'Headers on the request (illustration)',
				lines: ['webhook-id: msg_8f3a21', 'webhook-timestamp: 1700000000', 'webhook-signature: v1,Zm9vYmFy...']
			},
			note('n3', 232, 160, 'from the raw body received'),
			note('n4', 232, 218, 'constant-time compare')
		],
		steps: [
			{ say: 'A webhook is a request one system sends to another, such as a payment provider telling your shop an order was paid. Anyone can post to a public URL, so the receiver must verify it.', focus: ['w0'] },
			{ say: 'The sender builds the text to sign from three parts, joined with dots: a message id, a timestamp and the exact body.', focus: ['w0'], pulse: ['w0'] },
			{ say: 'It signs that text with HMAC-SHA256 and a secret shared with the receiver, and sends the signature in a header together with the id and timestamp.', show: ['w1', 'we0', 'w2', 'we1', 'hd'], focus: ['w1'] },
			{ say: 'The receiver rebuilds the same text from the raw body it received and signs it with its own copy of the secret.', show: ['w3', 'we2', 'n3'], focus: ['w3'] },
			{ say: 'It compares the two signatures in constant time, so response timing reveals nothing about how much matched.', show: ['w4', 'we3', 'n4'], focus: ['w4'] },
			{ say: 'It also rejects a timestamp outside a small tolerance, which stops replay, and remembers the id, so a retry is not processed twice.', pulse: ['w4', 'hd'] },
			{ say: 'To rotate the secret, the sender signs with the new and the old secret for a while, and the receiver accepts either.', set: { hd: { lines: ['webhook-id: msg_8f3a21', 'webhook-timestamp: 1700000000', 'webhook-signature: v1,Zm9v... v1,YmFy...'] } }, focus: ['hd'] }
		]
	},

	// ───────────── au-authorization-models ─────────────
	{
		id: 'au-authz-decision',
		topic: 'auth',
		group: 'au-authorization-models',
		title: 'Every request, one decision',
		blurb: 'What must the server decide before it runs a request?',
		stage: { w: 360, h: 368 },
		nodes: [
			...stack(
				'd',
				[
					{ l: 'Request arrives', s: 'GET /orders/1002' },
					{ l: 'Who is calling?', s: 'the authentication result' },
					{ l: 'Load the object', s: 'order 1002, owner, tenant' },
					{ l: 'Policy check', s: 'role, attributes, relation' },
					{ l: 'Allow or deny', s: 'deny unless a rule allows' },
					{ l: 'Handler runs', s: 'only after an allow', tone: 'accent' }
				],
				{ x: 16, w: 200, y: 12, h: 40, gap: 20 }
			),
			{ id: 'dn', kind: 'box', x: 244, y: 252, w: 100, h: 40, label: 'Deny', sub: 'logged', tone: 'neg' },
			{ id: 'de', kind: 'edge', from: 'd4', to: 'dn' },
			note('n0', 232, 34, 'any client can send anything'),
			note('n1', 232, 94, 'from session or token'),
			note('n2', 232, 154, 'a lookup on the server'),
			note('n3', 232, 214, 'for this action, this object')
		],
		steps: [
			{ say: 'A request claims to come from someone. Permission is a separate question: may this caller do this action to this object?', show: ['n0'], focus: ['d0'] },
			{ say: 'Authentication comes first. The server identifies the caller from the session or token, not from a user id in the request body.', show: ['d1', 'de0', 'n1'], focus: ['d1'] },
			{ say: 'Then it loads the object being asked for, here order 1002, with its owner and tenant.', show: ['d2', 'de1', 'n2'], focus: ['d2'] },
			{ say: 'A policy check compares the caller with the object: role, attributes or relationship. It runs on the server for every request, not only in the interface.', show: ['d3', 'de2', 'n3'], focus: ['d3'] },
			{ say: 'The default answer is deny. Access is granted only when a rule says so, so a forgotten rule fails safe.', show: ['d4', 'de3', 'dn', 'de'], focus: ['d4'] },
			{ say: 'Only after an allow does the handler run. A deny stops the request here, and is logged.', show: ['d5', 'de4'], focus: ['d5'] },
			{ say: 'Admin screens follow the same path. Hiding a button is not a rule: each admin function needs its own server-side check.', pulse: ['d3', 'd4'] }
		]
	},
	{
		id: 'au-bola-orders',
		topic: 'auth',
		group: 'au-authorization-models',
		title: 'A valid login is not a free pass',
		blurb: 'What goes wrong when the server checks the login but not the object?',
		stage: { w: 360, h: 290 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 76,
				cols: ['Order', 'Owner', 'Total'],
				rows: [
					['1001', 'Asha', '42.00'],
					['1002', 'Ben', '18.50'],
					['1003', 'Asha', '7.25']
				],
				visible: true
			},
			{ id: 'rq', kind: 'doc', x: 16, y: 122, w: 328, lines: ['GET /orders/1002', 'caller: Asha (valid login)'] },
			{ id: 'bd', kind: 'doc', x: 16, y: 182, w: 328, lines: ['200 OK', '{ "order": 1002, "owner": "Ben" }'], tone: 'neg' },
			{ id: 'gd', kind: 'doc', x: 16, y: 182, w: 328, lines: ['403 Forbidden', '{ "error": "not your order" }'], tone: 'accent' },
			note('c1', 16, 256, 'Check on the server: does this order belong to the caller?', 328),
			note('c2', 16, 256, 'UUIDs make guessing harder. They are not a check.', 328),
			note('c3', 16, 256, 'Test it: user A tries user B\'s objects, every action.', 328)
		],
		steps: [
			{ say: 'Asha and Ben each have orders. In the API an order is addressed by its id: /orders/1001, /orders/1002.', focus: ['t'] },
			{ say: 'Asha is logged in and asks for order 1002. That order is Ben\'s, but her login is valid.', show: ['rq'], set: { t: { hl: [1] } } },
			{ say: 'If the server only checks that someone is logged in, it returns Ben\'s order. This is broken object level authorization, API1 in the OWASP API Security Top 10.', show: ['bd'], focus: ['bd'] },
			{ say: 'The fix is an object-level check on every request: does this order belong to the caller, or does the caller\'s role allow it?', hide: ['bd'], show: ['c1'] },
			{ say: 'The check fails, so the server denies the request and logs it. Ben\'s data stays private.', show: ['gd'], focus: ['gd'] },
			{ say: 'Hard-to-guess ids such as UUIDs help a little, but they are not a check: a leaked link would still open the order.', hide: ['c1'], show: ['c2'] },
			{ say: 'Test with two accounts. Let user A try user B\'s objects for read, update, delete and export.', hide: ['c2'], show: ['c3'], set: { t: { hl: [] } } }
		]
	},
	{
		id: 'au-authz-models',
		topic: 'auth',
		group: 'au-authorization-models',
		title: 'Roles, attributes, relationships',
		blurb: 'How do systems decide who may do what?',
		stage: { w: 360, h: 200 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 108,
				title: 'Ways to decide',
				cols: ['Model', 'Asks', 'Order example'],
				rows: [
					['RBAC', 'Which role?', 'support can read'],
					['ABAC', 'Which attributes?', 'region matches'],
					['ReBAC', 'Which relation?', 'is the buyer'],
					['Scopes', 'App may do what?', 'orders:read only']
				],
				visible: true
			},
			note('nn', 16, 168, 'Whatever the model: deny by default.', 328)
		],
		steps: [
			{ say: 'Systems combine several ways to decide. Each answers a different question.', focus: ['t'] },
			{ say: 'RBAC gives permissions to roles and roles to users. It is simple, but roles multiply, and a role knows nothing about one particular order.', set: { t: { hl: [0] } } },
			{ say: 'ABAC decides from attributes of the user, the object and the situation, such as region, order status or time of day. It is more fine-grained.', set: { t: { hl: [1] } } },
			{ say: 'ReBAC decides from relationships: the buyer of an order, or a member of the team that owns a store. It fits ownership checks well.', set: { t: { hl: [2] } } },
			{ say: 'Scopes limit what a token, and so an app, may do for a user. The effective permission is what the user may do and the scope allows.', set: { t: { hl: [3] } } },
			{ say: 'OWASP prefers ABAC and ReBAC to roles alone for fine-grained and multi-tenant needs. Whatever the model, the default is deny.', show: ['nn'], set: { t: { hl: [] } } }
		]
	},

	// ───────────── au-auth-in-practice ─────────────
	{
		id: 'au-store-architecture',
		topic: 'auth',
		group: 'au-auth-in-practice',
		title: 'Who talks to whom in the store',
		blurb: 'Which identity does each part of an online store use?',
		stage: { w: 360, h: 410 },
		nodes: [
			{ id: 'br', kind: 'box', x: 16, y: 14, w: 140, h: 40, label: 'Customer browser', sub: 'shop pages' },
			{ id: 'idp', kind: 'box', x: 204, y: 14, w: 140, h: 40, label: 'Identity provider', sub: 'OAuth / OIDC' },
			{ id: 'bk', kind: 'box', x: 110, y: 120, w: 140, h: 46, label: 'Store backend', sub: 'decides everything', tone: 'accent' },
			{ id: 'or', kind: 'box', x: 16, y: 230, w: 140, h: 46, label: 'Orders service', sub: 'service account' },
			{ id: 'ad', kind: 'box', x: 204, y: 230, w: 140, h: 44, label: 'Admin staff', sub: 'password + MFA' },
			{ id: 'au', kind: 'box', x: 110, y: 330, w: 140, h: 40, label: 'Audit log', sub: 'no secrets inside' },
			{ id: 'e1', kind: 'edge', from: 'br', to: 'bk' },
			{ id: 'e2', kind: 'edge', from: 'br', to: 'idp', label: 'sign in' },
			{ id: 'e3', kind: 'edge', from: 'idp', to: 'bk' },
			{ id: 'e4', kind: 'edge', from: 'bk', to: 'or' },
			{ id: 'e5', kind: 'edge', from: 'ad', to: 'bk' },
			{ id: 'e6', kind: 'edge', from: 'bk', to: 'au' },
			note('lim', 16, 396, 'At the login door: rate limits, lockout, alerts.', 328)
		],
		steps: [
			{ say: 'The store backend is the one place that decides. Browsers, staff and other services all go through it.', show: ['bk'], focus: ['bk'] },
			{ say: 'Customers use the shop in a browser. After login the backend answers with a session cookie that page scripts cannot read.', show: ['br', 'e1'], focus: ['br'] },
			{ say: 'Sign-in through an identity provider (OAuth and OpenID Connect) means the shop never handles the customer\'s password.', show: ['idp', 'e2', 'e3'], focus: ['idp'] },
			{ say: 'Calls to other services use a service account with narrow permissions and a rotated key or short-lived token, never a customer\'s login.', show: ['or', 'e4'], focus: ['or'] },
			{ say: 'Staff sign in with a password and a second factor, and sensitive actions ask again (step-up), so a stolen session alone is not enough.', show: ['ad', 'e5'], focus: ['ad'] },
			{ say: 'Every login, failure, key use and admin action is written to an audit log, without passwords or tokens inside it.', show: ['au', 'e6'], focus: ['au'] },
			{ say: 'At the login door sit rate limits, lockout per account and alerts on unusual patterns, so guessing and credential stuffing are slowed and noticed.', show: ['lim'], pulse: ['br'] }
		]
	},
	{
		id: 'au-auth-checklist',
		topic: 'auth',
		group: 'au-auth-in-practice',
		title: 'A checklist for the store',
		blurb: 'Which ten controls cover most of what goes wrong in authentication?',
		stage: { w: 360, h: 224 },
		nodes: [
			{
				id: 'cl',
				kind: 'doc',
				x: 16,
				y: 14,
				w: 328,
				title: 'Checklist for the store',
				lines: [
					'Passwords: slow hash, breached-list check',
					'MFA offered to all, required for staff',
					'Rate limit and lockout per account',
					'Same message for unknown user or bad password',
					'Recovery: single-use expiring link',
					'After reset: end old sessions, notify user',
					'Service accounts: least privilege, rotation',
					'Secrets in a vault, never in git or bundles',
					'Object-level checks on every request',
					'Audit log and alerts, no secrets in logs'
				],
				visible: true
			}
		],
		steps: [
			{ say: 'A short list covers most of what goes wrong. Walk through it for the store.', focus: ['cl'] },
			{ say: 'Passwords: hash them with a slow, salted algorithm and check new ones against breached lists. Give the same message for an unknown user and a wrong password.', set: { cl: { hl: [0, 3] } } },
			{ say: 'Offer a second factor to everyone and require it for staff. Count failed logins per account, not only per address, and slow or lock after too many.', set: { cl: { hl: [1, 2] } } },
			{ say: 'Recovery links must be random, single-use and short-lived. After a reset, end old sessions and tell the owner by email.', set: { cl: { hl: [4, 5] } } },
			{ say: 'Service accounts get least privilege and rotated credentials. Secrets live in a vault or the environment, never in git or browser code.', set: { cl: { hl: [6, 7] } } },
			{ say: 'Check access to the object on every request, on the server, with deny by default.', set: { cl: { hl: [8] } } },
			{ say: 'Log security events and alert on patterns, but keep passwords, tokens and keys out of the logs.', set: { cl: { hl: [9] } } }
		]
	},
	{
		id: 'au-risk-table',
		topic: 'auth',
		group: 'au-auth-in-practice',
		title: 'If you do X, the risk is Y',
		blurb: 'Which small shortcuts in authentication carry a known cost?',
		stage: { w: 360, h: 226 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 164,
				title: 'If you do X, the risk is Y',
				cols: ['If you...', 'The risk is...'],
				rows: [
					['Tokens in localStorage', 'Script injection steals'],
					['Skip MFA for admins', 'One phished password'],
					['Keys in a URL', 'Keys land in logs'],
					['Trust client-sent roles', 'Self-made admin'],
					['Different login errors', 'Account enumeration'],
					['Never rotate keys', 'A leak lasts forever'],
					['No audit log', 'Breach found late']
				],
				visible: true
			}
		],
		steps: [
			{ say: 'Most authentication failures are a small shortcut with a known cost. Here are seven, side by side.', focus: ['t'] },
			{ say: 'Tokens in localStorage can be read by any script that runs on the page, so one injected script can copy them.', set: { t: { hl: [0] } } },
			{ say: 'Staff accounts without a second factor mean one phished or reused password opens the admin.', set: { t: { hl: [1] } } },
			{ say: 'Keys in a URL are copied into server logs, proxies and browser history.', set: { t: { hl: [2] } } },
			{ say: 'Trusting a role or user id sent by the client lets any caller make themselves an admin or another user.', set: { t: { hl: [3] } } },
			{ say: 'Different messages for an unknown user and a wrong password let attackers list which accounts exist.', set: { t: { hl: [4] } } },
			{ say: 'Keys that never rotate stay useful forever after a leak, and without an audit log you learn about a breach late.', set: { t: { hl: [5, 6] } } }
		]
	}
];
