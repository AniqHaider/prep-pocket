import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');

// OAuth 2.0 and OpenID Connect, taught on one running example: a delivery planner inside a store's app that wants to read a customer's calendar.
// Sources read while writing: RFC 6749 (OAuth 2.0), RFC 7636 (PKCE), RFC 8252 (native apps), RFC 8628 (device grant), RFC 8693 (token exchange),
// RFC 9700 (security best current practice, January 2025), RFC 7662, RFC 7009, RFC 8707, RFC 9126, RFC 9207, RFC 9449 (DPoP), RFC 8705 (mutual TLS),
// OpenID Connect Core 1.0 and Discovery 1.0, the OAuth 2.1 Internet-Draft (draft-ietf-oauth-v2-1-17), and Google's OpenID Connect page.
// `try` snippets are deterministic JavaScript for the playground: no imports, no network, no Web Crypto.

export const topics: DbTopic[] = [
	// ───────────────────────── OAuth basics ─────────────────────────
	{
		id: 'au-oauth-basics',
		title: 'OAuth 2.0: delegated access',
		level: 'basic',
		summary: 'Know what OAuth 2.0 is for, its four roles, public and confidential clients, scopes, and why a token is not a login.',
		scenes: ['au-oauth-roles', 'au-oauth-clients-scopes'],
		notes: md(
			'**OAuth 2.0** lets one app act for a user at another service **without ever seeing the user\'s password**. Picture a delivery planner inside the store\'s app that wants to read a customer\'s calendar to offer free slots. The old way was to ask for the calendar password. The OAuth way is to send the user to the calendar\'s own sign-in page and get back a limited, revocable **access token**.',
			'',
			'**Four roles** (RFC 6749):',
			'',
			'- **Resource owner**: the user who owns the data.',
			'- **Client**: the app that wants access.',
			'- **Authorization server**: signs the user in, asks for consent and issues tokens.',
			'- **Resource server**: the API that holds the data and accepts access tokens.',
			'',
			'The authorization server and the resource server can be the same system or separate ones; the roles describe jobs, not machines.',
			'',
			'**Client types.** A *confidential* client can keep a secret, such as code running on your own server. A *public* client cannot: a single-page app or a mobile app ships its code to the user\'s device, so anything inside it can be extracted. That difference decides how a client proves itself, and it is why public clients use PKCE (next topic).',
			'',
			'**Scopes** name what the token may do, for example `calendar.read`. The user sees them on the consent screen, and the API must enforce them on every request.',
			'',
			'```js',
			'const token = { scope: "calendar.read", expires_in: 3600 };',
			'console.log(token.scope.split(" ").includes("calendar.write"));',
			'```',
			'',
			'**Common trap:** OAuth is about *authorization* (what an app may do), not *authentication* (who the user is). Treating an access token as proof of identity is a classic mistake. **OpenID Connect**, covered later in this section, adds a proper ID token for that.'
		),
		try: [
			{
				label: 'A scope check on the API side',
				code: String.raw`// A resource server checks the token's expiry and scope on every request.
const tokens = {
  t1: { user: 'asha', scope: 'calendar.read', expiresAt: 1000 },
  t2: { user: 'asha', scope: 'calendar.read calendar.write', expiresAt: 1000 }
};
function check(tokenId, action, now) {
  const t = tokens[tokenId];
  if (!t) return 'deny: unknown token';
  if (now >= t.expiresAt) return 'deny: token expired';
  const need = action === 'read' ? 'calendar.read' : 'calendar.write';
  return t.scope.split(' ').includes(need) ? 'allow' : 'deny: missing scope ' + need;
}
console.log('read  with t1:', check('t1', 'read', 500));
console.log('write with t1:', check('t1', 'write', 500));
console.log('write with t2:', check('t2', 'write', 500));
console.log('read, but late:', check('t1', 'read', 1500));`
			}
		]
	},

	// ───────────────────────── Code flow + PKCE ─────────────────────────
	{
		id: 'au-oauth-code-pkce',
		title: 'Authorization code with PKCE',
		level: 'mid',
		summary: 'Follow the authorization code flow step by step and see why PKCE, state and an exact redirect_uri keep a stolen code useless.',
		scenes: ['au-code-flow', 'au-authorize-request', 'au-pkce-protects', 'au-redirect-state'],
		notes: md(
			'The **authorization code flow with PKCE** is the standard way for a browser app, a mobile app or a server app to get a token for a user (RFC 6749 and RFC 7636). The current security guidance, RFC 9700, says public clients **must** use PKCE and confidential clients are advised to.',
			'',
			'**Steps**',
			'',
			'1. The app makes a random **code_verifier** (43 to 128 characters) and keeps it. It will send only its hash, the **code_challenge** = `BASE64URL(SHA256(verifier))` with method `S256`, plus a random **state**.',
			'2. The browser goes to the authorization server\'s `/authorize` with `client_id`, `redirect_uri`, `scope`, `state`, `code_challenge` and `code_challenge_method=S256`.',
			'3. The user signs in and approves the scopes.',
			'4. The server redirects to the registered `redirect_uri` with `?code=...&state=...`.',
			'5. The app checks that `state` equals the saved value, then calls the token endpoint with the `code` and the original **code_verifier**.',
			'6. The server hashes the verifier, compares it with the stored challenge and returns the tokens.',
			'',
			'**Why it holds up.** The code travels through the browser, where it can leak. Without the verifier, a stolen code is useless (the server answers `invalid_grant`). The code is single-use, short-lived (RFC 6749 recommends at most 10 minutes) and bound to the client and the `redirect_uri`. A second use must be denied, and the server should revoke the tokens already issued from it.',
			'',
			'**Exact redirect match.** The server compares `redirect_uri` with the registered value as an exact string, so a look-alike URL cannot receive a code.',
			'',
			'**Native apps** use the system browser, never an embedded web view (RFC 8252).',
			'',
			'**Common trap:** the `plain` challenge method sends the verifier itself in the request. Use `S256`.'
		),
		try: [
			{
				label: 'Build a PKCE challenge, check a callback',
				code: String.raw`// 1) The S256 challenge = BASE64URL(SHA256(code_verifier)). A small SHA-256 is written out so this runs anywhere.
function sha256(bytes) {
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  const m = Array.from(bytes);
  m.push(0x80);
  while (m.length % 64 !== 56) m.push(0);
  const bits = bytes.length * 8;
  for (let i = 7; i >= 0; i--) m.push(i >= 4 ? 0 : (bits >>> (i * 8)) & 255);
  for (let o = 0; o < m.length; o += 64) {
    const w = new Array(64);
    for (let i = 0; i < 16; i++) w[i] = (m[o+4*i] << 24) | (m[o+4*i+1] << 16) | (m[o+4*i+2] << 8) | m[o+4*i+3];
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i-15], 7) ^ rotr(w[i-15], 18) ^ (w[i-15] >>> 3);
      const s1 = rotr(w[i-2], 17) ^ rotr(w[i-2], 19) ^ (w[i-2] >>> 10);
      w[i] = (w[i-16] + s0 + w[i-7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (rotr(e,6) ^ rotr(e,11) ^ rotr(e,25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((rotr(a,2) ^ rotr(a,13) ^ rotr(a,22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h[0]=(h[0]+a)|0; h[1]=(h[1]+b)|0; h[2]=(h[2]+c)|0; h[3]=(h[3]+d)|0; h[4]=(h[4]+e)|0; h[5]=(h[5]+f)|0; h[6]=(h[6]+g)|0; h[7]=(h[7]+hh)|0;
  }
  const out = [];
  for (const x of h) out.push((x >>> 24) & 255, (x >>> 16) & 255, (x >>> 8) & 255, x & 255);
  return out;
}
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function base64url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i+1] || 0) << 8) | (bytes[i+2] || 0);
    s += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63] + (i + 1 < bytes.length ? ALPHABET[(n >> 6) & 63] : '') + (i + 2 < bytes.length ? ALPHABET[n & 63] : '');
  }
  return s;
}
const ascii = (str) => Array.from(str, (ch) => ch.charCodeAt(0));

const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'; // the example from RFC 7636, appendix B
const challenge = base64url(sha256(ascii(verifier)));
console.log('code_challenge:', challenge);
console.log('same as the RFC:', challenge === 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');

// 2) The app saves state and verifier, then checks every callback against them.
const saved = { state: 'k3j9x2', verifier };
function onCallback(query) {
  const p = {};
  for (const pair of query.replace('?', '').split('&')) { const [k, v] = pair.split('='); p[k] = v; }
  if (p.error) return 'stop: server said ' + p.error;
  if (p.state !== saved.state) return 'stop: state does not match, this login was not started here';
  return 'ok: POST /token with code=' + p.code + ' and the saved code_verifier';
}
console.log(onCallback('?code=SplxlOBe&state=k3j9x2'));
console.log(onCallback('?code=SplxlOBe&state=zz0000'));
console.log(onCallback('?error=access_denied&state=k3j9x2'));`
			}
		]
	},

	// ───────────────────────── Other grants ─────────────────────────
	{
		id: 'au-oauth-other-grants',
		title: 'Other grants and the retired ones',
		level: 'mid',
		summary: 'Choose between client credentials, device authorization and refresh tokens, and know why implicit and password grants were dropped.',
		scenes: ['au-grant-choice', 'au-device-flow'],
		notes: md(
			'The code flow with PKCE is not the only grant. Pick by who the client is:',
			'',
			'- **Web server app, single-page app, mobile app:** authorization code with PKCE.',
			'- **Backend job or service with no user:** client credentials.',
			'- **TV, game console or CLI with no easy browser or keyboard:** device authorization.',
			'- **Renewing an expired access token:** refresh token.',
			'',
			'**Client credentials** (RFC 6749, section 4.4): the client authenticates with its own credentials and gets a token for resources it controls. There is no user, and no refresh token is needed (the client can ask again). Keep the secret on a server.',
			'',
			'**Device authorization** (RFC 8628): the device shows a short `user_code` and a `verification_uri`. The user opens that on a phone, signs in and types the code. Meanwhile the device polls the token endpoint (at least every 5 seconds unless told otherwise) and may receive `authorization_pending`, `slow_down` (wait 5 seconds longer), `expired_token` or `access_denied`.',
			'',
			'**Refresh token** grant: trades a refresh token for a new access token, so access tokens can stay short-lived. For public clients, RFC 9700 requires refresh tokens to be sender-constrained or rotated.',
			'',
			'**Token exchange** (RFC 8693) swaps one token for another, for example to call a downstream API with a different audience.',
			'',
			'**Retired.** The *implicit* grant puts the access token in the redirect URL, where history and Referer headers can leak it; RFC 9700 says clients should not use it. The *password* grant hands the user\'s password to the client and cannot work with MFA; RFC 9700 says it must not be used. **OAuth 2.1** consolidates this (PKCE, exact redirect matching, no implicit, no password grant) but is still an Internet-Draft, version 17 in late 2026.',
			'',
			'**Common trap:** using client credentials from a browser or mobile app. A secret shipped to a device is not a secret.'
		),
		try: [
			{
				label: 'Pick a grant for each app',
				code: String.raw`// A small decision helper: which grant fits which client?
function pickGrant(app) {
  if (!app.hasUser) return 'client credentials (keep the secret on a server)';
  if (!app.hasBrowser) return 'device authorization (user approves on a phone)';
  if (app.type === 'password-form') return 'none: never collect the password in the client, redirect to the sign-in page';
  return 'authorization code + PKCE';
}
const apps = [
  { name: 'nightly stock sync', hasUser: false, hasBrowser: false },
  { name: 'smart TV app', hasUser: true, hasBrowser: false },
  { name: 'single-page store', hasUser: true, hasBrowser: true },
  { name: 'mobile app', hasUser: true, hasBrowser: true },
  { name: 'old form asking for a password', hasUser: true, hasBrowser: true, type: 'password-form' }
];
for (const a of apps) console.log(a.name.padEnd(32), '->', pickGrant(a));`
			}
		]
	},

	// ───────────────────────── OpenID Connect ─────────────────────────
	{
		id: 'au-oidc',
		title: 'OpenID Connect: who signed in',
		level: 'mid',
		summary: 'See how OpenID Connect adds an ID token to OAuth, how a client validates it, and how to link accounts safely.',
		scenes: ['au-oidc-tokens', 'au-oidc-signin', 'au-idtoken-check'],
		notes: md(
			'**OpenID Connect (OIDC)** is a thin identity layer on top of OAuth 2.0. It answers *who signed in*, which plain OAuth does not. Add the scope **`openid`** to an authorization code request (OIDC requires it) and the token response also contains an **ID token**.',
			'',
			'**Three things, three readers**',
			'',
			'- **ID token:** a signed JWT *for your app*. Claims include `iss` (issuer), `sub` (the user\'s id at that issuer), `aud` (your `client_id`), `exp`, `iat` and the `nonce` you sent.',
			'- **Access token:** *for an API*. Your app should not treat it as an identity.',
			'- **UserInfo endpoint:** an API that returns more claims (email, name) when called with the access token.',
			'',
			'The scopes `profile`, `email`, `address` and `phone` request groups of claims.',
			'',
			'**Discovery.** The issuer publishes `/.well-known/openid-configuration` with its endpoints, supported algorithms and the **JWKS** URL holding its public keys. A client reads it instead of hard-coding URLs.',
			'',
			'**Sign in with Google** is this flow, and Google\'s documentation lists the steps: create an anti-forgery `state`, send the request with `scope=openid email`, confirm `state` on return, exchange the code for tokens, read the user from the ID token, then authenticate the user in your own app with your own session.',
			'',
			'**Validating an ID token:** verify the signature with the issuer\'s keys; `iss` must match the issuer exactly; `aud` must contain your `client_id`; `exp` must be in the future; the `nonce` must equal the one you sent.',
			'',
			'**Account linking.** Identify a user by **`iss` + `sub`**, never by email: an issuer may reuse or change an email address. Treat an email as proven only when `email_verified` is true.',
			'',
			'**Common trap:** sending the ID token to an API as a credential. It is meant for your app; the API should get an access token.'
		),
		try: [
			{
				label: 'Validate decoded ID-token claims',
				code: String.raw`// The checks a client makes after it has verified the signature (decoded claims only; no real crypto here).
const expected = { iss: 'https://id.example', aud: 'shopplanner', nonce: 'n-0S6_WzA2Mj', now: 1760000000 };
function validate(c) {
  if (c.iss !== expected.iss) return 'stop: wrong issuer';
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  if (!aud.includes(expected.aud)) return 'stop: token was not issued for this app';
  if (aud.length > 1 && aud.some((a) => a !== expected.aud)) return 'stop: extra audiences we do not trust';
  if (c.exp <= expected.now) return 'stop: expired';
  if (c.nonce !== expected.nonce) return 'stop: nonce mismatch (replayed or injected token)';
  return 'ok: user is ' + c.iss + ' / ' + c.sub;
}
const good = { iss: 'https://id.example', sub: '248289761001', aud: 'shopplanner', exp: 1760003600, nonce: 'n-0S6_WzA2Mj', email: 'asha@example.com', email_verified: true };
console.log(validate(good));
console.log(validate({ ...good, iss: 'https://id.evil.test' }));
console.log(validate({ ...good, aud: 'other-app' }));
console.log(validate({ ...good, exp: 1759999000 }));
console.log(validate({ ...good, nonce: 'guess' }));

// Linking accounts: key by (iss, sub), and only trust an email that is verified.
const accounts = new Map([['https://id.example|248289761001', 'local-user-7']]);
function findOrCreate(c, localEmails) {
  const key = c.iss + '|' + c.sub;
  if (accounts.has(key)) return 'existing: ' + accounts.get(key);
  if (localEmails[c.email] && !c.email_verified) return 'do not link: email is not verified, ask the user to prove it';
  return 'create a new local user for ' + key;
}
console.log(findOrCreate(good, {}));
console.log(findOrCreate({ ...good, sub: '999', email: 'ben@shop.test', email_verified: false }, { 'ben@shop.test': 'local-user-3' }));`
			}
		]
	},

	// ───────────────────────── OAuth security ─────────────────────────
	{
		id: 'au-oauth-security',
		title: 'OAuth attacks and defences',
		level: 'advanced',
		summary: 'Map each known OAuth attack to its defence: redirect matching, PKCE and state, the iss parameter, sender-constrained tokens, audiences and introspection.',
		scenes: ['au-attack-redirect-leak', 'au-attack-defence-table', 'au-token-hardening'],
		notes: md(
			'**RFC 9700** (January 2025, a Best Current Practice) collects what the field learned since OAuth 2.0 appeared. The main attacks and their defences:',
			'',
			'- **Redirect tampering and open redirects:** an attacker edits `redirect_uri`, or abuses an open redirector on a registered site, to receive the code. *Defence:* exact string comparison of `redirect_uri` (only the port may vary for native loopback URLs) and no endpoint that forwards to a URL from a query parameter.',
			'- **Callback CSRF and code injection:** an attacker makes your app accept a code from the attacker\'s own session. *Defence:* PKCE, or `state`, or `nonce` in OIDC, tied to the user\'s browser session.',
			'- **Mix-up:** a client that talks to several authorization servers is tricked into sending a code to the wrong one. *Defence:* the `iss` parameter in the authorization response (RFC 9207), checked against the server the request went to.',
			'- **Token leakage:** codes and tokens reach URLs, history and Referer headers. *Defence:* keep tokens out of URLs (the code flow does), short lifetimes, and `Referrer-Policy: no-referrer`.',
			'- **Token replay:** *Defence:* **sender-constrain** the token so a stolen copy is useless without a key: **DPoP** (RFC 9449, a signed proof in a `DPoP` header) or **mutual TLS** (RFC 8705, a token bound to a certificate).',
			'- **Wrong audience:** a token for API A replayed at API B. *Defence:* audience-restrict tokens; every resource server refuses tokens not meant for it. The `resource` parameter (RFC 8707) names the target.',
			'- **Request tampering:** **pushed authorization requests** (RFC 9126): the client POSTs the parameters to the server and puts only a `request_uri` in the browser URL.',
			'- **Lifecycle:** token **introspection** (RFC 7662: ask the server whether a token is `active`) and **revocation** (RFC 7009).',
			'',
			'**Common trap:** "we use HTTPS" does not cover leakage through the browser itself, with its history, referrers and extensions.'
		),
		try: [
			{
				label: 'Exact match versus prefix match',
				code: String.raw`// Why redirect_uri must be compared as an exact string.
const registered = ['https://app.example/cb'];
const loose = (uri) => registered.some((r) => uri.startsWith('https://app.example/'));
const exact = (uri) => registered.includes(uri);
const attempts = [
  'https://app.example/cb',
  'https://app.example/cb/',
  'https://app.example/go?to=https://evil.test',
  'https://app.example.evil.test/cb',
  'https://evil.test/cb'
];
for (const u of attempts) console.log(u.padEnd(46), 'loose:', String(loose(u)).padEnd(6), 'exact:', exact(u));

// A resource server must also refuse tokens meant for another API.
function accept(token, me) { return token.aud.includes(me) && token.exp > 1000; }
const t = { aud: ['calendar-api'], exp: 2000 };
console.log('calendar-api accepts:', accept(t, 'calendar-api'));
console.log('orders-api accepts  :', accept(t, 'orders-api'));`
			}
		]
	}
];

// ───────────────────────── Quiz banks ─────────────────────────
const t = (topic: string) => builder('AU', topic);

// au-oauth-basics
const ob = t('au-oauth-basics');
ob.add('basic', 'roles',
	'In OAuth 2.0, which role issues the access token after the user approves?',
	'The authorization server',
	['The resource server that hosts the protected API', 'The client application that asked for access', 'The resource owner, meaning the user'],
	'The authorization server signs the user in, gets consent and issues tokens. The resource server only accepts tokens, the client only receives and uses them, and the resource owner is the person who grants access.');
ob.add('basic', 'why',
	'What problem was OAuth 2.0 designed to solve?',
	'Letting an app act for a user without being given the user\'s password',
	['Proving to a website who a user is without involving any other server or token', 'Encrypting the traffic between a browser and a server so nobody can read it', 'Storing user passwords safely in a database so the app can check them later'],
	'OAuth delegates limited, revocable access through tokens, so the user signs in at the service that holds the data and never shares a password with the app. Identity proof is OpenID Connect, and transport encryption is TLS.');
ob.add('mid', 'client-type',
	'A single-page app runs entirely in the user\'s browser. How does OAuth classify it, and why?',
	'Public client: code shipped to a browser cannot keep a secret',
	['Confidential client: it can store a secret in the browser\'s local storage', 'Confidential client: HTTPS keeps its secret safe between requests', 'Resource server: it serves the pages that the user\'s browser loads'],
	'RFC 6749 calls clients that cannot keep credentials confidential public, with browser apps and installed native apps as examples. Anything shipped to the device can be read there, so such clients rely on PKCE rather than a secret.');
ob.add('mid', 'authn-vs-authz',
	'A store lets people "sign in with" another service by trusting any valid access token from it as proof of who the user is. What is wrong with that?',
	'An access token says what an app may do, not who is present; identity comes from an ID token',
	['Nothing is wrong: a valid access token from the provider always identifies the user who owns it', 'Access tokens expire too quickly to be used as a login, so the user would be signed out at once', 'The token must be longer and signed with a stronger algorithm before it can be trusted for sign-in'],
	'OAuth is an authorization framework. A token can be issued to a different app for the same user, so accepting it as a login lets one app impersonate users at another. OpenID Connect adds an ID token made for the client, with audience and nonce checks.');
ob.add('advanced', 'scope-enforcement',
	'A token with the scope calendar.read arrives at the API with a request to delete an event. What should the resource server do?',
	'Refuse it: the scope does not cover deleting, and the API enforces scopes on every request',
	['Allow it, because the token\'s signature is valid and the token has not expired', 'Allow it, because the user consented to the app once already and the server signed the token', 'Ignore the scope and rely on the client app to decide which of its own requests are allowed'],
	'A scope is the limit of what the token may do, and only the resource server can enforce it. A valid signature proves the token is genuine, not that it is allowed to perform this action, and the client cannot be trusted to police itself.');

// au-oauth-code-pkce
const cp = t('au-oauth-code-pkce');
cp.add('mid', 'pkce-purpose',
	'What does PKCE protect against in the authorization code flow?',
	'A stolen authorization code being redeemed by someone who never had the verifier',
	['A user typing the wrong password at the sign-in page of the authorization server', 'An access token expiring before the app has had a chance to use it for a request', 'The consent screen being skipped by an app that wants broader permissions than it asked'],
	'The code passes through the browser and can leak. With PKCE the token endpoint also demands the original code_verifier, which never left the app, so an attacker holding only the code gets invalid_grant.');
cp.add('mid', 'which-request',
	'Which PKCE value goes in the authorization request, and which in the token request?',
	'code_challenge in the first, code_verifier in the second',
	['code_verifier in the first, code_challenge in the second', 'Both values are sent in both requests, so the server can compare them twice', 'Neither of them: PKCE replaces both values with the client secret of the app'],
	'The app sends only the hash (code_challenge) through the browser, then proves it made it by sending the original code_verifier directly to the token endpoint, where the server hashes it and compares. The reverse order would expose the verifier.');
cp.add('mid', 'state',
	'Why does the app send a random state value and compare it when the callback arrives?',
	'To reject a callback it did not start, which defends against CSRF on the redirect',
	['To encrypt the authorization code while it travels through the user\'s browser', 'To tell the server which scopes the user approved on the consent screen earlier', 'To let the authorization server use the code more than once if the first request fails'],
	'The state is saved in the user\'s session and must come back unchanged. A callback carrying a different value was not started by this browser, so the app stops instead of accepting an attacker\'s code. Scopes and code use are unrelated.');
cp.add('advanced', 'exact-redirect',
	'An authorization server has registered https://app.example/cb. A request arrives with redirect_uri=https://app.example/cb/extra. What does the current guidance require?',
	'Reject it: redirect URIs must match registered values as exact strings',
	['Accept it, because the requested URI starts with the registered value and the host is identical', 'Accept it, since only the host matters and the path is the app\'s own business', 'Accept it if the same user has signed in to this app earlier from the same browser'],
	'RFC 9700 requires exact string matching, with one exception for the port of loopback URLs in native apps. Prefix or host-only matching lets an attacker steer a code to another path on a registered site, for example an open redirector.');
cp.add('mid', 'code-reuse',
	'The token endpoint receives an authorization code that was already redeemed. What should the server do?',
	'Deny the request and, where it can, revoke the tokens issued from that code',
	['Issue new tokens as asked, because the code is still inside its 10 minute lifetime', 'Return the same tokens again, so a client that lost the first response can carry on', 'Accept it whenever the client secret is correct, since that proves who is asking'],
	'RFC 6749 says a code must be used once. A second use suggests it was stolen, so the server must refuse and should revoke what the first use produced. The short lifetime is an extra limit, not a reason to allow reuse.');

// au-oauth-other-grants
const og = t('au-oauth-other-grants');
og.add('mid', 'client-credentials',
	'A nightly job on your server needs to call a partner API. No user is involved. Which grant fits?',
	'Client credentials',
	['Authorization code with PKCE', 'Device authorization', 'Resource owner password credentials'],
	'Client credentials is for a client acting on its own behalf, with its own credentials kept on a server. The other grants involve a user approving access, which a nightly job does not have. The password grant is retired.');
og.add('mid', 'device-grant',
	'In the device authorization grant, how does a user approve a smart TV that has no keyboard?',
	'They open a URL on a phone and enter the short code the TV displays',
	['They type their password using the TV remote, one letter at a time on a grid', 'The TV approves itself after the 5 second polling interval has passed once', 'They email the TV a signed token that the app then pastes into its settings'],
	'The TV shows a user_code and a verification_uri, and the user signs in and enters the code on a second device with a real browser. The TV meanwhile polls the token endpoint. The 5 seconds is the default polling interval, not an approval.');
og.add('advanced', 'implicit',
	'Why does current guidance say clients should not use the implicit grant?',
	'Tokens in the redirect URL can leak, and cannot be bound to the client',
	['It requires a client secret that a browser app has no safe place to store', 'It issues access tokens that never expire, so a leak stays dangerous forever', 'It cannot request any scopes, so every token it returns has full access'],
	'RFC 9700 explains that tokens in the authorization response are exposed to leakage and replay, and no standard way exists to bind them to a client. The code flow returns tokens from a direct token request instead.');
og.add('mid', 'password-grant',
	'What is the main reason the resource owner password credentials grant must not be used?',
	'The client sees the user\'s password, and the grant cannot support multi-factor sign-in',
	['It only works with confidential clients, which rules out every browser app and mobile app', 'It cannot return refresh tokens, so users would have to sign in again every hour', 'It puts the user\'s password in the URL query string, where logs record it'],
	'RFC 9700 says the grant exposes the credentials to the client and trains users to type them outside the authorization server, and it is not designed for two-factor or multi-step authentication. The password is sent in a request body, not a query.');
og.add('mid', 'oauth21-status',
	'At the time this section was written, what was the status of OAuth 2.1?',
	'An Internet-Draft of the IETF OAuth working group, not yet an RFC',
	['A published RFC that replaced OAuth 2.0 after the working group finished in 2021', 'Withdrawn by the working group, because RFC 9700 already covered the same ground', 'A proprietary specification owned and versioned by a single vendor'],
	'The OAuth 2.1 draft (version 17, October 2026) consolidates OAuth 2.0 with current practice: PKCE, exact redirect matching, no implicit grant and no password grant. It was still a working-group draft, so check its status before relying on it.');

// au-oidc
const oi = t('au-oidc');
oi.add('basic', 'id-token-reader',
	'In OpenID Connect, who is the ID token meant for?',
	'The client app, so it learns who signed in',
	['The API, as the credential to call it', 'The browser, to keep as a session cookie', 'The authorization server, to log the session'],
	'The ID token carries claims about the sign-in, and its aud is the client_id of the app. APIs should receive an access token instead, and the app creates its own session after validating the ID token.');
oi.add('basic', 'openid-scope',
	'Which scope turns an OAuth 2.0 authorization request into an OpenID Connect request?',
	'openid',
	['profile', 'identity', 'id_token'],
	'OIDC requires the openid scope in the request. The profile and email scopes only ask for groups of claims once openid is present, and identity and id_token are not scopes.');
oi.add('mid', 'validate-id-token',
	'Which checks must a client make on the ID token it receives?',
	'Signature, an exact iss match, aud containing its client_id, exp in the future, and the nonce',
	['Only that it has three dot-separated parts, decodes as JSON, and names a signing algorithm it knows', 'That the email claim matches an existing account in the app\'s own user database', 'That the access token returned beside it is longer than the ID token itself'],
	'OIDC Core lists the checks: signature with the issuer\'s keys, issuer equal to the expected value, the client_id among the audiences, a current time before exp, and the nonce sent in the request. Shape or email alone prove nothing.');
oi.add('advanced', 'stable-id',
	'Which pair should an app use as the stable identifier of a user from an OpenID provider?',
	'iss and sub together',
	['email', 'preferred_username', 'name and email together'],
	'OIDC Core says only the combination of iss and sub is guaranteed unique and never reassigned. Email, username and name can change and can be reused by the issuer for a different person at another time.');
oi.add('advanced', 'email-verified',
	'A provider returns email_verified: false for an address that matches an existing local account. What should the app do?',
	'Not link them automatically: anyone could have claimed that address at the provider',
	['Link them, since the two email addresses are identical and the user clearly owns both', 'Link them only when the sign-in completed quickly and from a known device', 'Delete the local account and create a fresh one linked to the provider\'s identity'],
	'An unverified email is just a string the user typed. Linking on it lets an attacker register that address at a provider and take over the victim\'s local account. Ask the user to prove ownership first.');

// au-oauth-security
const os = t('au-oauth-security');
os.add('advanced', 'redirect-uri',
	'Why do authorization servers compare redirect URIs as exact strings instead of using a prefix match?',
	'A loose match lets an attacker steer the code to a registered site\'s open redirector',
	['Exact strings are much faster to compare, which matters on a busy authorization server', 'Prefix matching breaks PKCE, because the verifier is tied to the full redirect URL', 'The specification forbids registering paths, so only a bare host name can be stored'],
	'RFC 9700 asks for exact matching to prevent leakage of codes and tokens, and also forbids open redirectors. A prefix rule can accept a crafted path that forwards the browser, with the code, to the attacker.');
os.add('advanced', 'mix-up',
	'A client works with two authorization servers. Which defence stops a mix-up attack?',
	'Checking the iss parameter in the authorization response (RFC 9207)',
	['Using a much longer state value, so that the response cannot be guessed', 'Registering the same redirect URI at both servers, so the client can tell responses apart', 'Making access tokens short-lived, so a misdirected code expires before it is used'],
	'In a mix-up attack the client is tricked into sending a code to the wrong server. The iss response parameter tells the client which server answered, so it can compare it with where it sent the request. State and token lifetime do not tie the response to a server.');
os.add('advanced', 'sender-constrained',
	'What does it mean for an access token to be sender-constrained, as with DPoP?',
	'It is bound to a key, so each request needs a proof that only the key holder can make',
	['It expires after a single request, so a stolen copy can be used only once', 'It is encrypted with the API\'s public key, so that only the API itself can read the contents', 'It is accepted only from the IP address of the device that first obtained it'],
	'With DPoP (RFC 9449) the client signs a proof for every request with its private key, and the token is tied to that key. A stolen token without the key is rejected. Mutual TLS (RFC 8705) does the same with a certificate.');
os.add('mid', 'audience',
	'An orders API receives a valid token that was issued for a calendar API. What must it do?',
	'Refuse it, because the token was not meant for this resource server',
	['Accept it, since the signature checks out and the token has not expired yet', 'Accept it if the scope in the token looks harmless for the orders it exposes', 'Forward it to the calendar API and accept it if that API says the token is fine'],
	'RFC 9700 says tokens should be audience-restricted and every resource server must refuse a token not meant for it. Otherwise a token leaked from one API could be replayed at another. The resource parameter (RFC 8707) lets the client name the target.');
os.add('advanced', 'par',
	'What does a pushed authorization request (PAR, RFC 9126) change?',
	'The client posts the parameters to the server directly; the browser URL carries only a request_uri',
	['It skips the authorization code step, so the server returns an access token in the first response', 'It removes the need for a registered redirect URI, since the response is no longer a redirect', 'It lets the browser hold the client secret safely, because the request is now signed'],
	'The parameters travel over a direct back-channel request, so the browser cannot read or alter them, and the browser URL carries just the reference the server returned. Codes, redirect URIs and client secrets are unaffected.');

export const banks: { out: Question[] }[] = [ob, cp, og, oi, os];
