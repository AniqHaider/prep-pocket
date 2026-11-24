import type { Scene, SceneNode, Tone } from '../../types';

/** OAuth 2.0 and OpenID Connect. Ids `au-*`; `group` = a topic id in src/db/auth/oauth.ts. A delivery planner in a store's app that wants to read a customer's calendar is the running example. */

// A vertical chain of boxes joined by arrows: box ids `<p>0..n`, edge ids `<p>e0..` (edge i joins box i and box i+1). The first box starts visible.
type Item = { l: string; s?: string; tone?: Tone };
const stack = (p: string, items: Item[], o: { x?: number; w?: number; y?: number; h?: number; gap?: number; labels?: string[] } = {}): SceneNode[] => {
	const { x = 16, w = 328, y = 14, h = 40, gap = 22, labels = [] } = o;
	const out: SceneNode[] = [];
	items.forEach((it, i) => {
		out.push({ id: p + i, kind: 'box', x, y: y + i * (h + gap), w, h, label: it.l, sub: it.s, tone: it.tone, visible: i === 0 ? true : undefined });
		if (i) out.push({ id: p + 'e' + (i - 1), kind: 'edge', from: p + (i - 1), to: p + i, label: labels[i - 1] });
	});
	return out;
};

const row = (uri: string, result: string) => uri.padEnd(36) + result;

export const auOauth: Scene[] = [
	// ───────────── au-oauth-basics ─────────────
	{
		id: 'au-oauth-roles',
		topic: 'auth',
		group: 'au-oauth-basics',
		title: 'The four OAuth roles',
		blurb: 'Who does what when an app asks for access to a user\'s data?',
		stage: { w: 360, h: 376 },
		nodes: [
			...stack(
				'a',
				[
					{ l: 'User', s: 'resource owner: owns the calendar' },
					{ l: 'Calendar sign-in server', s: 'authorization server: issues tokens' },
					{ l: 'Delivery planner app', s: 'client: wants to read the calendar' },
					{ l: 'Calendar API', s: 'resource server: accepts access tokens' }
				],
				{ y: 12, h: 42, gap: 24, labels: ['signs in, approves scopes', 'access token', 'token in each request'] }
			),
			{ id: 'tok', kind: 'doc', x: 16, y: 272, w: 328, title: 'Access token response (shape)', lines: ['{ "access_token": "2YotnF...",', '  "token_type": "Bearer",', '  "expires_in": 3600,', '  "scope": "calendar.read" }'] }
		],
		steps: [
			{ say: 'A delivery planner in the store\'s app wants to read a customer\'s calendar. The old way was to ask for their calendar password. OAuth avoids that.', focus: ['a0'] },
			{ say: 'The user signs in at the calendar\'s own sign-in server, the authorization server, and approves what the app may do. The app never sees the password.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'The authorization server gives the app, the client, an access token: a limited, revocable pass.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'The client sends the token with each request to the calendar API, the resource server, which returns only what the token allows.', show: ['a3', 'ae2'], focus: ['a3'] },
			{ say: 'The token response names a scope, here calendar.read, and an expiry. It is not the password, and the user can revoke it.', show: ['tok'], pulse: ['tok'] },
			{ say: 'Roles are jobs, not machines. One company can run both the authorization server and the API, or they can be separate services.', set: { a1: { tone: 'accent' }, a3: { tone: 'accent' } }, focus: ['a1', 'a3'] }
		]
	},
	{
		id: 'au-oauth-clients-scopes',
		topic: 'auth',
		group: 'au-oauth-basics',
		title: 'Clients, scopes and tokens',
		blurb: 'Which apps can keep a secret, what do scopes limit, and what does a token not prove?',
		stage: { w: 360, h: 292 },
		nodes: [
			{ id: 't', kind: 'table', x: 16, y: 14, colW: 108, cols: ['Client', 'Example', 'Keeps a secret?'], rows: [['Confidential', 'Web server app', 'Yes'], ['Public', 'Single-page app', 'No'], ['Public', 'Mobile app', 'No']], hl: [], visible: true },
			{ id: 'consent', kind: 'doc', x: 16, y: 124, w: 328, title: 'Consent screen (what the user sees)', lines: ['Delivery planner wants to:', '  - read your calendar   (calendar.read)', '  - see your name        (profile)'] },
			{ id: 'warn', kind: 'box', x: 16, y: 218, w: 328, h: 56, label: 'OAuth answers "what may this app do?"', sub: 'not "who is this person?" That is OpenID Connect.', tone: 'warn' }
		],
		steps: [
			{ say: 'Every OAuth client is one of two types, decided by whether it can keep a secret from the people who use it.', focus: ['t'] },
			{ say: 'A confidential client runs where users cannot read its code, such as your own server, so it can hold a client secret.', set: { t: { hl: [0] } } },
			{ say: 'A public client is shipped to the user\'s browser or phone. Anything inside can be extracted, so it cannot hold a secret and uses PKCE instead.', set: { t: { hl: [1, 2] } } },
			{ say: 'Scopes are the permissions on the consent screen. The token will be limited to what the user approved.', show: ['consent'], set: { t: { hl: [] } }, focus: ['consent'] },
			{ say: 'A token tells the API what the app may do. It does not say who is sitting at the keyboard, which is why OpenID Connect exists.', show: ['warn'], focus: ['warn'] },
			{ say: 'So a token is a narrow, short-lived permission. The next topic shows how an app gets one safely.', pulse: ['warn'] }
		]
	},

	// ───────────── au-oauth-code-pkce ─────────────
	{
		id: 'au-code-flow',
		topic: 'auth',
		group: 'au-oauth-code-pkce',
		title: 'Authorization code flow with PKCE',
		blurb: 'What are the six steps from a click to a token, and where does the verifier go?',
		stage: { w: 360, h: 380 },
		nodes: stack('a', [
			{ l: 'App makes verifier and state', s: 'keeps both; only a hash will travel' },
			{ l: 'Browser goes to /authorize', s: 'client_id, redirect_uri, scope, state, challenge' },
			{ l: 'User signs in and approves', s: 'at the authorization server' },
			{ l: 'Redirect back with a code', s: '/cb?code=...&state=... then check state' },
			{ l: 'App calls the token endpoint', s: 'sends the code and the code_verifier' },
			{ l: 'Tokens come back', s: 'server checks SHA-256(verifier) = challenge', tone: 'accent' }
		]),
		steps: [
			{ say: 'The app makes a random code_verifier and a state value and keeps them. Only a hash of the verifier, the code_challenge, will travel.', focus: ['a0'] },
			{ say: 'The app sends the browser to the authorization server with its client_id, an exact redirect_uri, the scopes, the state and the challenge with method S256.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'The user signs in at the authorization server and approves the scopes. The app never sees the password.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'The server redirects to the registered redirect_uri with a one-time code and the same state. The app compares state with the saved value.', show: ['a3', 'ae2'], focus: ['a3'] },
			{ say: 'The app calls the token endpoint directly, sending the code and the original code_verifier, not the hash.', show: ['a4', 'ae3'], focus: ['a4'] },
			{ say: 'The server hashes the verifier, compares it with the stored challenge and, if they match, returns the tokens.', show: ['a5', 'ae4'], pulse: ['a5'] }
		]
	},
	{
		id: 'au-authorize-request',
		topic: 'auth',
		group: 'au-oauth-code-pkce',
		title: 'The authorization request',
		blurb: 'What does each parameter of the /authorize redirect do?',
		stage: { w: 360, h: 280 },
		nodes: [
			{
				id: 'req',
				kind: 'doc',
				x: 16,
				y: 14,
				w: 328,
				title: 'The browser is sent to (one parameter per line)',
				lines: ['GET /authorize?', '  response_type=code', '  &client_id=shopplanner', '  &redirect_uri=https://app.example/cb', '  &scope=calendar.read', '  &state=k3j9x2', '  &code_challenge=E9Melhoa2OwvFrEM...', '  &code_challenge_method=S256'],
				hl: [],
				visible: true
			},
			{ id: 'm', kind: 'box', x: 16, y: 190, w: 328, h: 74, label: 'authorize endpoint', sub: 'a plain redirect the browser follows', tone: 'accent', visible: true }
		],
		steps: [
			{ say: 'The authorization request is only a redirect: the browser is sent to the server\'s authorize endpoint with these query parameters.', set: { req: { hl: [0] } } },
			{ say: 'response_type=code asks for an authorization code rather than a token. The token comes later, from a direct request.', set: { req: { hl: [1] }, m: { label: 'response_type=code', sub: 'ask for a code, not a token' } } },
			{ say: 'client_id says which app is asking. The app registered it with the authorization server beforehand.', set: { req: { hl: [2] }, m: { label: 'client_id', sub: 'which registered app is asking' } } },
			{ say: 'redirect_uri is where the code will be sent. It must equal a registered URI exactly.', set: { req: { hl: [3] }, m: { label: 'redirect_uri', sub: 'must match a registered URI exactly' } } },
			{ say: 'scope lists the permissions requested. The consent screen shows exactly these.', set: { req: { hl: [4] }, m: { label: 'scope', sub: 'the permissions the app asks for' } } },
			{ say: 'state is a random value the app saved. It returns unchanged, so the app can reject a response it did not start.', set: { req: { hl: [5] }, m: { label: 'state', sub: 'comes back unchanged: the CSRF check' } } },
			{ say: 'The code_challenge is the hash of the saved verifier, and S256 names the hash method. The server stores it for the token step.', set: { req: { hl: [6, 7] }, m: { label: 'code_challenge and method S256', sub: 'checked later against the code_verifier' } } }
		]
	},
	{
		id: 'au-pkce-protects',
		topic: 'auth',
		group: 'au-oauth-code-pkce',
		title: 'Why a stolen code is useless',
		blurb: 'What can an attacker do with an authorization code but no verifier?',
		stage: { w: 360, h: 270 },
		nodes: [
			{ id: 'app', kind: 'box', x: 16, y: 14, w: 150, h: 44, label: 'Your app', sub: 'holds the code_verifier', visible: true },
			{ id: 'atk', kind: 'box', x: 194, y: 14, w: 150, h: 44, label: 'Attacker', sub: 'watches the redirect', tone: 'warn' },
			{ id: 'redir', kind: 'doc', x: 16, y: 74, w: 328, title: 'The redirect that reaches the browser', lines: ['/cb?code=SplxlOBe&state=k3j9x2'] },
			{ id: 'atkreq', kind: 'doc', x: 16, y: 134, w: 328, title: 'Attacker\'s token request', lines: ['POST /token', 'code=SplxlOBe        (no code_verifier)'] },
			{ id: 'deny', kind: 'box', x: 16, y: 210, w: 328, h: 44, label: 'Rejected: invalid_grant', sub: 'no verifier matches the stored challenge', tone: 'neg' },
			{ id: 'real', kind: 'doc', x: 16, y: 134, w: 328, title: 'Your app\'s token request', lines: ['POST /token', 'code=SplxlOBe&code_verifier=dBjftJeZ...'] },
			{ id: 'ok', kind: 'box', x: 16, y: 210, w: 328, h: 44, label: 'Tokens issued', sub: 'the verifier hashes to the stored challenge', tone: 'accent' }
		],
		steps: [
			{ say: 'The app keeps the code_verifier private. Only its hash, the challenge, went to the authorization server.', focus: ['app'] },
			{ say: 'After sign-in the code comes back through the browser, where history, a malicious app on the phone or a shared device could read it.', show: ['redir'], focus: ['redir'] },
			{ say: 'An attacker who reads that redirect now holds the authorization code.', show: ['atk'], focus: ['atk'] },
			{ say: 'The attacker tries to redeem the code at the token endpoint. It has no code_verifier to send.', show: ['atkreq'], focus: ['atkreq'] },
			{ say: 'The server finds no verifier that matches the stored challenge and answers invalid_grant. The stolen code is useless.', show: ['deny'], pulse: ['deny'] },
			{ say: 'Your app sends the same code with the verifier it kept, and the server issues the tokens.', hide: ['atkreq', 'deny'], show: ['real', 'ok'], pulse: ['ok'] },
			{ say: 'The verifier never traveled through the browser, so only the app that started the flow can finish it.', focus: ['app', 'ok'] }
		]
	},
	{
		id: 'au-redirect-state',
		topic: 'auth',
		group: 'au-oauth-code-pkce',
		title: 'Exact redirect_uri and state',
		blurb: 'Which redirect URIs does the server accept, and how does the app check the callback?',
		stage: { w: 360, h: 232 },
		nodes: [
			{
				id: 'ru',
				kind: 'doc',
				x: 16,
				y: 14,
				w: 328,
				title: 'Registered: https://app.example/cb',
				lines: [row('https://app.example/cb', 'allowed'), row('https://app.example/cb/', 'denied'), row('https://app.example/cb?x=1', 'denied'), row('https://app.example.evil.test/cb', 'denied'), row('https://evil.test/cb', 'denied')],
				hl: [],
				visible: true
			},
			{ id: 'st', kind: 'doc', x: 16, y: 140, w: 328, title: 'The app\'s own check on the callback', lines: ['saved state     : k3j9x2', 'callback state  : k3j9x2   -> continue', 'callback state  : zz0000   -> stop'], hl: [] }
		],
		steps: [
			{ say: 'The authorization server only sends a code to a redirect URI the app registered, and it compares the request with the registered string exactly.', focus: ['ru'] },
			{ say: 'An identical string is allowed.', set: { ru: { hl: [0] } } },
			{ say: 'A trailing slash or a query string makes a different string, so it is denied. A loose "starts with" rule is how codes leak.', set: { ru: { hl: [1, 2] } } },
			{ say: 'A look-alike host or another site is denied. Only the registered URI receives the code.', set: { ru: { hl: [3, 4] } } },
			{ say: 'state is the app\'s own check. When the callback arrives, its state must equal the value saved when the flow began.', show: ['st'], set: { ru: { hl: [] } }, focus: ['st'] },
			{ say: 'A matching state means this browser started the login, so the app goes on to the token request.', set: { st: { hl: [0, 1] } } },
			{ say: 'A different state means the callback may be forged, so the app stops and shows an error instead of using the code.', set: { st: { hl: [0, 2] } } }
		]
	},

	// ───────────── au-oauth-other-grants ─────────────
	{
		id: 'au-grant-choice',
		topic: 'auth',
		group: 'au-oauth-other-grants',
		title: 'Which grant for which app',
		blurb: 'Which OAuth grant suits a web app, a job, a TV, and which ones are retired?',
		stage: { w: 360, h: 312 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 164,
				cols: ['Client', 'Grant'],
				rows: [['Web app with a server', 'Code + PKCE'], ['Single-page app', 'Code + PKCE'], ['Mobile app', 'Code + PKCE'], ['Backend job, no user', 'Client credentials'], ['TV or command line tool', 'Device authorization']],
				hl: [],
				visible: true
			},
			{ id: 'imp', kind: 'box', x: 16, y: 168, w: 158, h: 62, label: 'Implicit', sub: 'token in the redirect URL; avoid', tone: 'neg' },
			{ id: 'pw', kind: 'box', x: 186, y: 168, w: 158, h: 62, label: 'Password grant', sub: 'client sees the password; never', tone: 'neg' },
			{ id: 'draft', kind: 'box', x: 16, y: 246, w: 328, h: 52, label: 'OAuth 2.1 (draft)', sub: 'bakes these rules in; not yet an RFC', tone: 'accent' }
		],
		steps: [
			{ say: 'Pick the grant by what kind of client is asking and whether a user is involved.', focus: ['t'] },
			{ say: 'Apps with a user and a browser use the authorization code grant with PKCE: server apps, single-page apps and mobile apps.', set: { t: { hl: [0, 1, 2] } } },
			{ say: 'A backend job with no user uses client credentials, with its secret kept on a server.', set: { t: { hl: [3] } } },
			{ say: 'A TV or command line tool without a good browser uses the device authorization grant.', set: { t: { hl: [4] } } },
			{ say: 'The implicit grant returned tokens in the redirect URL. RFC 9700 says clients should not use it.', show: ['imp'], set: { t: { hl: [] } }, focus: ['imp'] },
			{ say: 'The password grant gives the client the user\'s password and cannot do MFA. RFC 9700 says it must not be used.', show: ['pw'], focus: ['pw'] },
			{ say: 'OAuth 2.1 is an Internet-Draft that folds these rules in: PKCE, exact redirects, no implicit and no password grant.', show: ['draft'], pulse: ['draft'] }
		]
	},
	{
		id: 'au-device-flow',
		topic: 'auth',
		group: 'au-oauth-other-grants',
		title: 'Device authorization flow',
		blurb: 'How does a TV with no keyboard get a token for a user?',
		stage: { w: 360, h: 396 },
		nodes: [
			...stack(
				'a',
				[
					{ l: 'TV asks for a device code', s: 'POST to the device authorization endpoint' },
					{ l: 'TV shows a short user code', s: 'and a web address such as example.com/device' },
					{ l: 'User opens the address on a phone', s: 'signs in, types the code, approves' },
					{ l: 'TV polls the token endpoint', s: 'about every 5 seconds, unless told otherwise' },
					{ l: 'TV receives the tokens', s: 'once the user has approved', tone: 'accent' }
				],
				{ y: 12, h: 38, gap: 18 }
			),
			{ id: 'poll', kind: 'doc', x: 16, y: 292, w: 328, title: 'What polling can return', lines: ['authorization_pending   keep waiting', 'slow_down               wait 5 s longer', 'expired_token           start again', 'access_denied           the user said no'], hl: [] }
		],
		steps: [
			{ say: 'A TV or command line tool has no good browser or keyboard, so it first asks the authorization server for a device code.', focus: ['a0'] },
			{ say: 'It displays a short user code and a web address. The long device code stays inside the device.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'The user opens that address on a phone, signs in there and types the user code to approve the TV.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'Meanwhile the TV polls the token endpoint with its device code, at least every 5 seconds by default.', show: ['a3', 'ae2'], focus: ['a3'] },
			{ say: 'Until the user finishes, the answer is authorization_pending. If it says slow_down, the TV waits 5 seconds longer between polls.', show: ['poll'], set: { poll: { hl: [0, 1] } } },
			{ say: 'expired_token means the codes ran out, so start again. access_denied means the user refused.', set: { poll: { hl: [2, 3] } } },
			{ say: 'After approval the next poll returns the tokens. The password was typed only on the phone.', show: ['a4', 'ae3'], set: { poll: { hl: [] } }, pulse: ['a4'] }
		]
	},

	// ───────────── au-oidc ─────────────
	{
		id: 'au-oidc-tokens',
		topic: 'auth',
		group: 'au-oidc',
		title: 'ID token, access token, UserInfo',
		blurb: 'What does OpenID Connect add, and who reads each token?',
		stage: { w: 360, h: 354 },
		nodes: [
			{ id: 'a', kind: 'box', x: 16, y: 14, w: 328, h: 44, label: 'ID token', sub: 'for your app: who signed in', tone: 'accent', visible: true },
			{ id: 'b', kind: 'box', x: 16, y: 76, w: 328, h: 44, label: 'Access token', sub: 'for an API: what the app may do' },
			{ id: 'c', kind: 'box', x: 16, y: 138, w: 328, h: 44, label: 'UserInfo endpoint', sub: 'optional: more claims, called with the access token' },
			{
				id: 'idt',
				kind: 'doc',
				x: 16,
				y: 202,
				w: 328,
				title: 'ID token payload (decoded)',
				lines: ['{ "iss": "https://id.example",', '  "sub": "248289761001",', '  "aud": "shopplanner",', '  "exp": 1760003600,', '  "nonce": "n-0S6_WzA2Mj",', '  "email": "asha@example.com",', '  "email_verified": true }'],
				hl: []
			}
		],
		steps: [
			{ say: 'OpenID Connect adds identity to OAuth. A sign-in with the openid scope returns up to three things, each with a different reader.', focus: ['a'] },
			{ say: 'The access token is for the API. Your app does not read it as an identity.', show: ['b'], focus: ['b'] },
			{ say: 'The UserInfo endpoint returns extra claims, such as email or name, when it is called with the access token.', show: ['c'], focus: ['c'] },
			{ say: 'The ID token is a signed JWT with claims about the sign-in. Here is its payload, decoded.', show: ['idt'], focus: ['a'] },
			{ say: 'iss names who issued the token and sub is the user\'s id at that issuer. Together they identify the user.', set: { idt: { hl: [0, 1] } } },
			{ say: 'aud must be your own client_id, exp is the expiry, and nonce is the value your app sent, tying the token to this login.', set: { idt: { hl: [2, 3, 4] } } },
			{ say: 'email and email_verified are ordinary claims. They can change, so they are not the user\'s identity.', set: { idt: { hl: [5, 6] } } }
		]
	},
	{
		id: 'au-oidc-signin',
		topic: 'auth',
		group: 'au-oidc',
		title: 'Sign in with an identity provider',
		blurb: 'What happens, step by step, when a user clicks "Sign in with Google"?',
		stage: { w: 360, h: 346 },
		nodes: stack(
			'a',
			[
				{ l: 'App makes state and nonce', s: 'user clicks "Sign in with ..."' },
				{ l: 'Redirect to the provider', s: 'scope=openid email, state, nonce, challenge' },
				{ l: 'User signs in at the provider', s: 'the provider authenticates and asks for consent' },
				{ l: 'Redirect back with a code', s: 'app confirms the state matches' },
				{ l: 'Code swapped for tokens', s: 'token endpoint returns an ID token and access token' },
				{ l: 'Validate the ID token', s: 'then start your own session for the user', tone: 'accent' }
			],
			{ y: 12, h: 38, gap: 18 }
		),
		steps: [
			{ say: 'Sign in with a provider such as Google is OpenID Connect. The app creates a random state and a nonce and remembers them.', focus: ['a0'] },
			{ say: 'It sends the browser to the provider with scope=openid email, the state, the nonce and a PKCE challenge.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'The provider signs the user in and asks for consent. The app never handles the password.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'The provider redirects back with a code and the state. The app stops if the state differs from the saved one.', show: ['a3', 'ae2'], focus: ['a3'] },
			{ say: 'The app sends the code to the token endpoint and receives an ID token and an access token.', show: ['a4', 'ae3'], focus: ['a4'] },
			{ say: 'The app validates the ID token: signature, issuer, audience, expiry and nonce. Then it reads iss and sub.', show: ['a5', 'ae4'], focus: ['a5'] },
			{ say: 'The app\'s own session, usually a cookie, keeps the user signed in from here. The provider\'s tokens are not that session.', set: { a5: { sub: 'iss + sub identify the user; the app sets its own session' } }, pulse: ['a5'] }
		]
	},
	{
		id: 'au-idtoken-check',
		topic: 'auth',
		group: 'au-oidc',
		title: 'Validating an ID token',
		blurb: 'Which checks does a client make, and what must it never use as an identity?',
		stage: { w: 360, h: 328 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 164,
				cols: ['Check', 'Rule'],
				rows: [['Signature', 'issuer\'s JWKS keys'], ['iss', 'exact match'], ['aud', 'contains your client_id'], ['exp', 'still in the future'], ['nonce', 'equals the one you sent'], ['Identity', 'iss + sub, not email']],
				hl: [],
				visible: true
			},
			{ id: 'bad', kind: 'box', x: 16, y: 186, w: 328, h: 56, label: 'Do not identify users by email', sub: 'it can change, and an issuer may reuse it', tone: 'warn' },
			{ id: 'unv', kind: 'box', x: 16, y: 258, w: 328, h: 56, label: 'email_verified is false?', sub: 'do not link to an existing account by email', tone: 'neg' }
		],
		steps: [
			{ say: 'After the token endpoint returns an ID token, the client must validate it before trusting a single claim.', focus: ['t'] },
			{ say: 'Verify the signature with the public keys the issuer publishes at its JWKS URL, which discovery points to.', set: { t: { hl: [0] } } },
			{ say: 'The iss claim must equal the expected issuer exactly, and aud must list your own client_id.', set: { t: { hl: [1, 2] } } },
			{ say: 'exp must still be in the future, and the nonce must equal the one this app sent for this login.', set: { t: { hl: [3, 4] } } },
			{ say: 'Only then is the user identified: by the pair iss plus sub, which an issuer never reassigns.', set: { t: { hl: [5] } } },
			{ say: 'Email looks convenient, but it can change and an issuer may reuse it, so it is not a safe key for an account.', show: ['bad'], set: { t: { hl: [] } }, focus: ['bad'] },
			{ say: 'If email_verified is false, linking to an existing account by email lets an attacker take it over. Ask the user to prove it first.', show: ['unv'], focus: ['unv'] }
		]
	},

	// ───────────── au-oauth-security ─────────────
	{
		id: 'au-attack-redirect-leak',
		topic: 'auth',
		group: 'au-oauth-security',
		title: 'How a loose redirect leaks a code',
		blurb: 'How does an open redirector plus loose matching hand the code to an attacker?',
		stage: { w: 360, h: 318 },
		nodes: stack('a', [
			{ l: 'Attacker crafts a login link', s: 'redirect_uri=app.example/go?to=evil.test', tone: 'warn' },
			{ l: 'Server checks redirect_uri', s: 'loose rule: starts with app.example, so it passes', tone: 'warn' },
			{ l: 'Code is sent to app.example/go', s: 'an open redirector forwards to ?to=', tone: 'warn' },
			{ l: 'Browser lands on evil.test/?code=...', s: 'the attacker now holds the code', tone: 'neg' },
			{ l: 'Exact matching stops step 2', s: 'the link is not a registered string, no redirect', tone: 'accent' }
		]),
		steps: [
			{ say: 'An app registers https://app.example/cb, but its authorization server compares redirect URIs loosely. The attacker builds a login link with another URL on the same site.', focus: ['a0'] },
			{ say: 'The user signs in normally. The server accepts the redirect_uri because it starts with the registered site.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'The code is sent to /go on the app\'s site. That page is an open redirector: it forwards the browser to whatever address is in ?to=.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'The browser ends up at the attacker\'s site with the code in the URL, and the attacker can try to redeem it.', show: ['a3', 'ae2'], focus: ['a3'] },
			{ say: 'Exact string matching rejects the crafted link, since it is not the registered redirect URI. RFC 9700 also forbids open redirectors.', show: ['a4', 'ae3'], focus: ['a4'] },
			{ say: 'Add PKCE as a second layer: even a leaked code cannot be redeemed without the verifier.', set: { a4: { sub: 'plus PKCE, so a leaked code is useless' } }, pulse: ['a4'] }
		]
	},
	{
		id: 'au-attack-defence-table',
		topic: 'auth',
		group: 'au-oauth-security',
		title: 'Attack and defence at a glance',
		blurb: 'Which defence from RFC 9700 answers which OAuth attack?',
		stage: { w: 360, h: 278 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 164,
				cols: ['Attack', 'Defence'],
				rows: [
					['Redirect tampering', 'Exact redirect_uri match'],
					['Callback CSRF', 'state, or PKCE'],
					['Code injection', 'PKCE, nonce in OIDC'],
					['Mix-up', 'iss parameter (RFC 9207)'],
					['Token in the URL', 'Use the code flow'],
					['Stolen access token', 'Sender-constrain (DPoP)'],
					['Token for another API', 'Audience restriction']
				],
				hl: [],
				visible: true
			},
			{ id: 'bcp', kind: 'box', x: 16, y: 208, w: 328, h: 54, label: 'RFC 9700', sub: 'January 2025: Best Current Practice for OAuth 2.0 security', tone: 'accent' }
		],
		steps: [
			{ say: 'Most OAuth attacks have a named defence in RFC 9700. Read each row as: this goes wrong, this prevents it.', focus: ['t'] },
			{ say: 'Redirect tampering sends a code to the attacker. The server must compare redirect URIs as exact strings.', set: { t: { hl: [0] } } },
			{ say: 'A forged callback or an injected code is stopped by PKCE, or by state, or by the nonce in OpenID Connect.', set: { t: { hl: [1, 2] } } },
			{ say: 'Mix-up tricks a client that uses several servers. The iss parameter in the response (RFC 9207) tells it who answered.', set: { t: { hl: [3] } } },
			{ say: 'Tokens in URLs leak through history and Referer headers. The code flow keeps them out, and a no-referrer policy helps.', set: { t: { hl: [4] } } },
			{ say: 'A stolen token is only as good as the thief\'s copy. DPoP or mutual TLS bind the token to a key the thief lacks.', set: { t: { hl: [5] } } },
			{ say: 'A token meant for one API must be refused by another. Audience restriction and the resource parameter (RFC 8707) do this.', set: { t: { hl: [6] } } },
			{ say: 'Together these form the current best practice, RFC 9700, which updates and extends the original security advice.', show: ['bcp'], set: { t: { hl: [] } }, pulse: ['bcp'] }
		]
	},
	{
		id: 'au-token-hardening',
		topic: 'auth',
		group: 'au-oauth-security',
		title: 'A stolen token, made useless',
		blurb: 'How do sender-constraining, audiences and introspection limit a leaked token?',
		stage: { w: 360, h: 232 },
		nodes: [
			{ id: 'b0', kind: 'box', x: 16, y: 14, w: 328, h: 44, label: 'Plain bearer token', sub: 'whoever holds it can use it', visible: true },
			{ id: 'atk', kind: 'box', x: 16, y: 80, w: 328, h: 44, label: 'Attacker replays a stolen token', sub: 'copied from a log, a leak or malware', tone: 'warn' },
			{ id: 'acc', kind: 'box', x: 16, y: 146, w: 328, h: 44, label: 'API accepts it', sub: 'nothing proves who is sending', tone: 'neg' },
			{ id: 'e1', kind: 'edge', from: 'b0', to: 'atk', label: 'stolen' },
			{ id: 'e2', kind: 'edge', from: 'atk', to: 'acc', label: 'replayed' },
			{ id: 'dp', kind: 'doc', x: 16, y: 80, w: 328, title: 'With DPoP, every request carries a proof', lines: ['Authorization: DPoP <access token>', 'DPoP: <JWT signed with the client key>', '  claims: htm, htu, iat, jti, ath (token hash)'] },
			{ id: 'rej', kind: 'box', x: 16, y: 172, w: 328, h: 44, label: 'Attacker has the token, not the key', sub: 'the API rejects the request', tone: 'accent' },
			{ id: 'aud', kind: 'doc', x: 16, y: 80, w: 328, title: 'Audience restriction', lines: ['token.aud    = "calendar-api"', 'this API is  = "orders-api"', '-> refuse: the token is not for this API'] },
			{ id: 'ins', kind: 'doc', x: 16, y: 80, w: 328, title: 'Introspection and revocation', lines: ['POST /introspect   token=2YotnF...', '{ "active": false }', 'POST /revoke       token=2YotnF...', '-> after revoking, refuse the token'], hl: [] }
		],
		steps: [
			{ say: 'A plain bearer token works for anyone who holds it. That is both its convenience and its weakness.', focus: ['b0'] },
			{ say: 'If it leaks from a log, a browser extension or malware, the thief can copy it.', show: ['atk', 'e1'], focus: ['atk'] },
			{ say: 'The API has no way to tell the thief from the real client, so it accepts the request.', show: ['acc', 'e2'], focus: ['acc'] },
			{ say: 'DPoP binds the token to a key pair. Each request carries a fresh proof signed with the client\'s private key (RFC 9449).', hide: ['atk', 'acc', 'e1', 'e2'], show: ['dp'], focus: ['dp'] },
			{ say: 'A thief who copied the token but not the private key cannot make the proof, so the request is rejected.', show: ['rej'], pulse: ['rej'] },
			{ say: 'Audience restriction: every API checks that the token was meant for it and refuses tokens issued for another API.', hide: ['dp', 'rej'], show: ['aud'], focus: ['aud'] },
			{ say: 'Introspection lets an API ask the authorization server whether a token is still active, and revocation ends a token early.', hide: ['aud'], show: ['ins'], focus: ['ins'] },
			{ say: 'RFC 7662 defines introspection and RFC 7009 revocation. With short lifetimes they limit how long a stolen token is useful.', set: { ins: { hl: [1, 3] } } }
		]
	}
];
