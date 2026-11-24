import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');

// Facts below were checked against: NIST SP 800-63-4 (63B), OWASP Password Storage / Session Management / Authentication / Forgot Password /
// Authorization cheat sheets, OWASP Top 10:2025, OWASP API Security Top 10 2023, RFC 7519, RFC 7515, RFC 8725 and RFC 9700.
// Numbers (work factors, lengths, timeouts) are the guidance at the time of writing; the notes say so. Engineering guidance, not legal advice.

export const topics: DbTopic[] = [
	// ───────────────────────── Authentication and authorization ─────────────────────────
	{
		id: 'au-authn-authz',
		title: 'Authentication and authorization',
		level: 'basic',
		summary: 'Tell apart who is calling from what they may do, and know why most real bugs sit in the gap between the two.',
		scenes: ['au-authn-vs-authz', 'au-login-defences'],
		notes: md(
			'**Authentication** answers "who is calling?". The caller proves an identity claim with something they know (a password), have (a phone or a security key) or are (a fingerprint). **Authorization** answers "what may this caller do?" and is decided separately, once the identity is known. A third idea, **accounting** (audit logging), records who did what.',
			'',
			'Most serious bugs live in the gap between the first two. A shopper who is correctly logged in changes `/orders/1042` to `/orders/1043` and reads someone else\'s order. Authentication passed; authorization was never checked. OWASP ranks this family first: **Broken Access Control** is A01 in the OWASP Top 10:2025, **Authentication Failures** is A07, and **Broken Object Level Authorization** is API1 in the OWASP API Security Top 10 (2023).',
			'',
			'**What a login form must defend against:** password guessing, credential stuffing (passwords leaked from other sites), user enumeration (messages that reveal which emails exist), stolen session cookies, phishing, and a weak password-reset flow. Each has its own defence, covered in the next topics.',
			'',
			'**Rules that prevent most authorization bugs**',
			'',
			'- **Deny by default:** an endpoint with no rule is refused, not allowed.',
			'- **Check on every request, on the server.** Hiding a button is a courtesy, not a control.',
			'- **Check the object, not only the role.** "Is this order Asha\'s?" is a different question from "is Asha a customer?".',
			'- **Least privilege:** give each user, token and service only what its job needs.',
			'',
			'**Sources:** OWASP Top 10:2025, OWASP API Security Top 10 2023, OWASP Authorization Cheat Sheet.'
		),
		try: [
			{
				label: 'Ownership check (deny by default)',
				code: md(
					'// Authentication says who is calling; authorization decides what that caller may do.',
					"const orders = { 1042: { owner: 'asha' }, 1043: { owner: 'ben' } };",
					"const users = { asha: { role: 'customer' }, ben: { role: 'customer' }, root: { role: 'support' } };",
					'function canRead(userId, orderId) {',
					'  const order = orders[orderId], user = users[userId];',
					'  if (!order || !user) return false; // deny by default',
					"  return order.owner === userId || user.role === 'support';",
					'}',
					"for (const [u, o] of [['asha', 1042], ['asha', 1043], ['root', 1043], ['nobody', 1042]]) {",
					"  console.log(u + ' reads order ' + o + ' -> ' + (canRead(u, o) ? 'allow' : 'deny'));",
					'}'
				)
			}
		]
	},

	// ───────────────────────── Passwords ─────────────────────────
	{
		id: 'au-passwords',
		title: 'Storing and checking passwords',
		level: 'basic',
		summary: 'Store a slow, salted hash, follow current password rules, and keep login and recovery from leaking anything.',
		scenes: ['au-password-hashing', 'au-hash-cost-table', 'au-nist-password-rules'],
		notes: md(
			'Never store a password. Store a **slow, salted hash** of it, so a stolen database does not hand over every account.',
			'',
			'- **Not plain text, and not a fast hash.** A fast hash such as plain SHA-256 lets an attacker test enormous numbers of guesses.',
			'- **Salt:** a random value, unique per password, stored with the hash. It defeats precomputed tables and hides which users share a password.',
			'- **Adaptive hash with a work factor.** OWASP prefers Argon2id (at least 19 MiB of memory, 2 iterations, 1 degree of parallelism), then scrypt, then bcrypt only for legacy systems (work factor 10 or more, 72-byte input limit); PBKDF2 needs 600,000 or more iterations of HMAC-SHA-256 and is for when FIPS-140 compliance is required. These are the figures at the time of writing; benchmark on your own server.',
			'- **Pepper:** a secret shared by all hashes and kept outside the database, as defence in depth. Changing it later forces password resets.',
			'- **Upgrade on login:** raise the cost over time by re-hashing each password the next time its owner signs in.',
			'',
			'**What NIST SP 800-63-4 asks of password rules:** at least 15 characters when the password is the only factor (8 if it only backs up another factor), accept at least 64 characters, impose no composition rules, no forced periodic changes, screen against common and breached passwords, and allow paste and password managers.',
			'',
			'**Login behaviour:** rate-limit failed attempts per account, answer with the same message and similar timing for an unknown email and a wrong password, and compare secrets in constant time. **Account recovery is the weak spot:** use single-use expiring links, reply the same for every email, and end other sessions after a reset.',
			'',
			'**Sources:** OWASP Password Storage, Authentication and Forgot Password cheat sheets; NIST SP 800-63B-4.'
		),
		try: [
			{
				label: 'Password policy check (NIST style)',
				code: md(
					'// Length counts Unicode code points. The blocklist is a tiny sample; real ones are far larger.',
					"const blocklist = new Set(['password', 'passwordpassword', 'qwertyuiopasdfg', 'letmein']);",
					'function check(pw, backsUpAnotherFactor) {',
					'  const min = backsUpAnotherFactor ? 8 : 15, len = [...pw].length, problems = [];',
					"  if (len < min) problems.push('too short: ' + len + ' of ' + min);",
					"  if (blocklist.has(pw.toLowerCase())) problems.push('on the blocklist');",
					"  return problems.length ? problems.join(', ') : 'ok';",
					'}',
					"console.log(check('Tr0ub4dor&3', false));",
					"console.log(check('Tr0ub4dor&3', true));",
					"console.log(check('passwordpassword', false));",
					"console.log(check('correct horse battery staple', false));"
				)
			},
			{
				label: 'Naive compare versus constant-time compare',
				code: md(
					'// A naive compare stops at the first wrong character, so its running time leaks how much of a guess was right.',
					'function naive(a, b) {',
					'  let steps = 0;',
					'  if (a.length !== b.length) return { ok: false, steps };',
					'  for (let i = 0; i < a.length; i++) { steps++; if (a[i] !== b[i]) return { ok: false, steps }; }',
					'  return { ok: true, steps };',
					'}',
					'function constantTime(a, b) {',
					'  let diff = a.length ^ b.length;',
					'  const n = Math.max(a.length, b.length);',
					'  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);',
					'  return { ok: diff === 0, steps: n };',
					'}',
					"const secret = 'secret12';",
					"for (const guess of ['xxxxxxxx', 'secxxxxx', 'secret1x', 'secret12']) {",
					"  console.log(guess, 'naive steps', naive(guess, secret).steps, '| constant steps', constantTime(guess, secret).steps);",
					'}'
				)
			}
		]
	},

	// ───────────────────────── Sessions vs tokens ─────────────────────────
	{
		id: 'au-sessions-vs-tokens',
		title: 'Sessions and tokens',
		level: 'mid',
		summary: 'Compare server-side sessions with self-contained tokens, and run a session safely from login to logout.',
		scenes: ['au-session-lifecycle', 'au-session-vs-token'],
		notes: md(
			'A **session** keeps state on the server and gives the browser an opaque id in a cookie. A **self-contained token** puts the claims inside a signed token. Both prove "this is Asha"; they differ in where the truth lives.',
			'',
			'- **Session id:** easy to revoke (delete the record), tiny, never stale. Needs a store every server can reach.',
			'- **Signed token:** no lookup, suits many small services. Hard to revoke before it expires, and its claims can go stale.',
			'',
			'**Session rules (OWASP Session Management Cheat Sheet)**',
			'',
			'- Make the id random and meaningless: at least 64 bits of entropy from a CSPRNG, and 128 bits if you generate your own.',
			'- **Issue a new id at login** and after any privilege change. This stops **session fixation**, where an attacker plants a known id before the victim logs in.',
			'- Set **idle and absolute timeouts** and enforce them on the server. OWASP\'s examples: 2-5 minutes idle for high-value apps, 15-30 minutes for low-risk ones, and 4-8 hours absolute for a working day.',
			'- **Logout must destroy the server record**, not only clear the cookie. Browser-close events cannot be relied on to end a session.',
			'- Keep the cookie `Secure` and `HttpOnly`, and accept ids only from the cookie, not from a URL.',
			'',
			'NIST SP 800-63-4 also requires periodic reauthentication. At assurance level AAL2 the overall timeout should be no more than 24 hours and the inactivity timeout no more than 1 hour.',
			'',
			'**Choosing:** for one website with one backend, a server-side session is usually the simplest safe choice. Reach for tokens when many services must verify callers on their own.',
			'',
			'**Sources:** OWASP Session Management Cheat Sheet, NIST SP 800-63B-4.'
		),
		try: [
			{
				label: 'Session timeouts and a fresh id at login',
				code: md(
					'const MIN = 60 * 1000, idle = 15 * MIN, absolute = 8 * 60 * MIN;',
					'const t0 = Date.UTC(2026, 10, 24, 9, 0, 0); // fixed clock so the output never changes',
					'function status(s, now) {',
					"  if (now - s.created >= absolute) return 'expired (absolute)';",
					"  if (now - s.lastSeen >= idle) return 'expired (idle)';",
					"  return 'active';",
					'}',
					"const s = { created: t0, lastSeen: t0 };",
					"console.log('10 min in:', status(s, t0 + 10 * MIN));",
					"console.log('20 min in, no activity:', status(s, t0 + 20 * MIN));",
					"console.log('7 h in, last seen a minute ago:', status({ created: t0, lastSeen: t0 + 419 * MIN }, t0 + 420 * MIN));",
					"console.log('8 h in, last seen a minute ago:', status({ created: t0, lastSeen: t0 + 479 * MIN }, t0 + 480 * MIN));",
					'',
					'// Fixation: the id an attacker planted before login must not survive login.',
					"const planted = 'attacker-known-id';",
					'const store = new Map([[planted, { user: null }]]);',
					'function login(oldId, user) { store.delete(oldId); const fresh = \'id-\' + (store.size + 1) + \'-\' + user; store.set(fresh, { user }); return fresh; }',
					"const after = login(planted, 'asha');",
					"console.log('planted id still valid:', store.has(planted), '| new id:', after);"
				)
			}
		]
	},

	// ───────────────────────── JWT ─────────────────────────
	{
		id: 'au-jwt',
		title: 'JSON Web Tokens',
		level: 'mid',
		summary: 'Read a JWT, know what its signature does and does not protect, and verify one the safe way.',
		scenes: ['au-jwt-anatomy', 'au-jwt-checks', 'au-jwt-attacks'],
		notes: md(
			'A **JSON Web Token (JWT, RFC 7519)** is a compact string of three base64url parts: `header.payload.signature`. A signed JWT is a **JWS**: the signature shows the first two parts were not changed. It does **not** hide them, since anyone can decode the payload. If contents must stay secret, use an encrypted JWT (**JWE**) or keep the data on the server.',
			'',
			'**Registered claims:** `iss` (issuer), `sub` (subject), `aud` (audience), `exp` (the token must not be accepted on or after this time), `nbf` (not before), `iat` (issued at) and `jti` (unique id). RFC 7519 allows a small clock-skew leeway, usually no more than a few minutes.',
			'',
			'**Algorithms.** HS256 is symmetric: one shared secret signs and verifies, so every verifier could also forge tokens. RS256, ES256 and EdDSA are asymmetric: only the issuer holds the private key. Publish public keys in a **JWKS** with a `kid`, so keys can rotate without breaking verifiers.',
			'',
			'**Classic mistakes (RFC 8725):** trusting the `alg` header, so a token claiming `none` skips the signature, or RS256 is swapped for HS256 and the public key becomes the HMAC secret; a weak HMAC secret; not validating `iss`, `aud`, `exp` and `nbf`; following `jku` or trusting `kid` blindly; secrets in the payload; very long lifetimes.',
			'',
			'**The fix:** the verifier decides the allowed algorithms, looks up keys it trusts, verifies the signature, then validates the claims and the token type, so an ID token is not accepted as an access token.',
			'',
			'**Sources:** RFC 7519, RFC 7515, RFC 8725.'
		),
		try: [
			{
				label: 'Decode and validate JWT claims',
				code: md(
					'// Decode and validate claims with a fixed clock. A real verifier checks the signature first, with a library.',
					"const b64u = (o) => btoa(JSON.stringify(o)).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');",
					"const decode = (part) => JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));",
					'const now = 1795000000;',
					"const make = (header, claims) => [b64u(header), b64u(claims), 'c2lnbmF0dXJl'].join('.');",
					'function validate(token, rules) {',
					"  const [h, p] = token.split('.'), header = decode(h), c = decode(p), problems = [];",
					"  if (!rules.algs.includes(header.alg)) problems.push('algorithm not allowed: ' + header.alg);",
					"  if (c.iss !== rules.iss) problems.push('wrong issuer');",
					"  if (![].concat(c.aud).includes(rules.aud)) problems.push('not for this audience');",
					"  if (c.nbf !== undefined && rules.now < c.nbf - rules.leeway) problems.push('not valid yet');",
					"  if (c.exp !== undefined && rules.now >= c.exp + rules.leeway) problems.push('expired');",
					"  return problems.length ? problems.join('; ') : 'ok';",
					'}',
					"const rules = { algs: ['ES256'], iss: 'https://auth.example.com', aud: 'shop-api', now, leeway: 30 };",
					"const good = { iss: 'https://auth.example.com', sub: 'asha', aud: 'shop-api', nbf: now - 5, exp: now + 900 };",
					"console.log('good token:      ', validate(make({ alg: 'ES256' }, good), rules));",
					"console.log('alg none:        ', validate(make({ alg: 'none' }, good), rules));",
					"console.log('other audience:  ', validate(make({ alg: 'ES256' }, { ...good, aud: 'billing-api' }), rules));",
					"console.log('expired an hour: ', validate(make({ alg: 'ES256' }, { ...good, exp: now - 3600 }), rules));"
				)
			}
		]
	},

	// ───────────────────────── Access and refresh tokens ─────────────────────────
	{
		id: 'au-access-refresh',
		title: 'Access and refresh tokens',
		level: 'mid',
		summary: 'Use short-lived access tokens with rotating refresh tokens, and know how to end access early.',
		scenes: ['au-access-refresh-flow', 'au-refresh-reuse-detection', 'au-token-lifetimes'],
		notes: md(
			'Short-lived **access tokens** limit what a stolen token is worth. A longer-lived **refresh token** gets new access tokens without a new login. The refresh token is the valuable one, since it can mint access tokens, so it goes only to the authorization server and gets more protection.',
			'',
			'**Rotation with reuse detection.** RFC 9700 (the OAuth 2.0 security best current practice) tells authorization servers to detect refresh token replay for public clients, either with **sender-constrained** tokens (bound to a client key, for example with DPoP or mutual TLS) or with **rotation**. With rotation, every refresh returns a new refresh token and retires the old one, while the server remembers the family. If a retired token is used, the server cannot tell the thief from the user, so it revokes the active token and the family, and the real client must sign in again.',
			'',
			'**Lifetimes.** Use an absolute lifetime fixed at sign-in plus an inactivity window; RFC 9700 says refresh tokens should expire after a client has been inactive for some time. Access tokens are typically minutes. The numbers are policy, not standards.',
			'',
			'**Revocation options.** A signed access token cannot be recalled, so ending access early needs state: a denylist of ids, a per-user version number in the claims, deleting refresh records, or simply short expiry. Logout everywhere should delete all of a user\'s refresh records.',
			'',
			'**After a suspected theft:** revoke the family or all sessions, reset the password if the account was taken (a reset alone may not end an attacker\'s active session), rotate a leaked signing key, tell the user and write an audit entry.',
			'',
			'**Sources:** RFC 9700 section 4.14, OWASP Forgot Password Cheat Sheet.'
		),
		try: [
			{
				label: 'Rotation with reuse detection',
				code: md(
					'// Refresh rotation: a used token presented again revokes its whole family.',
					'let n = 0;',
					'const tokens = new Map(), families = new Map();',
					"function issue(family) { const t = 'R' + (++n); tokens.set(t, { family, used: false }); return t; }",
					"function signIn() { const family = 'F' + (families.size + 1); families.set(family, { revoked: false }); return issue(family); }",
					'function refresh(t) {',
					'  const rec = tokens.get(t);',
					"  if (!rec) return 'unknown token';",
					'  const fam = families.get(rec.family);',
					"  if (fam.revoked) return 'family ' + rec.family + ' is revoked: sign in again';",
					"  if (rec.used) { fam.revoked = true; return 'REUSE of ' + t + ': family ' + rec.family + ' revoked'; }",
					'  rec.used = true;',
					"  return 'ok, new token ' + issue(rec.family);",
					'}',
					'const r1 = signIn();',
					"console.log('R1 refresh:', refresh(r1));",
					"console.log('R2 refresh:', refresh('R2'));",
					"console.log('thief replays R1:', refresh(r1));",
					"console.log('real client uses R3:', refresh('R3'));"
				)
			}
		]
	}
];

// ───────────────────────── Questions ─────────────────────────
const t1 = builder('AU', 'au-authn-authz');
t1.add('basic', 'bola',
	'A shopper is logged in and changes /orders/1042 to /orders/1043 in the address bar. The server returns another customer\'s order. Which control is missing?',
	'An authorization check that the order belongs to the caller',
	['Stronger hashing for the shopper\'s stored password, so a leak is harder to exploit', 'A longer lifetime for the session cookie, so the shopper stays signed in', 'A second factor at login, such as a code from an authenticator app'],
	'The login worked, so authentication is not the problem. The server never asked whether this order belongs to this user, which is broken object level authorization (API1 in the OWASP API Security Top 10). Password strength, cookie lifetime and a second factor do nothing for it.');
t1.add('basic', 'terms',
	'Which statement separates authentication from authorization?',
	'Authentication checks who the caller is; authorization decides what that caller may do',
	['Authentication encrypts the traffic; authorization hashes the password', 'Authentication happens after authorization, once access is granted', 'They are two names for checking a password'],
	'Authentication establishes identity, and authorization uses that identity to decide on access, so authorization comes second. Encryption and hashing are separate protections, and a password check is only one way to authenticate.');
t1.add('basic', 'factors',
	'Which pair counts as two different factors?',
	'A password and a code from an authenticator app',
	['A password and a security question about a childhood pet', 'Two different passwords chosen by the same user', 'A PIN and a password'],
	'Factors are different kinds of proof: something you know, have or are. A password is knowledge and an authenticator code proves you have the device. A security question, a second password and a PIN are all knowledge, so they stay one factor, and NIST also says not to use security questions at all.');
t1.add('mid', 'deny-default',
	'A new admin endpoint ships and no rule mentions it. What should the framework do by default?',
	'Refuse access until a rule explicitly allows it',
	['Allow access because the user is already logged in', 'Allow access when the path does not look sensitive', 'Ask the client which role it has and trust the answer'],
	'Deny by default is a core rule of the OWASP Authorization Cheat Sheet: a missing rule must not become an open door. Being logged in proves identity, not permission, guessing from the path is unreliable, and the client must never supply its own role.');
t1.add('mid', 'server-side',
	'The shop hides the Delete button from customers in its interface. Why is that not enough?',
	'Requests can be sent without the interface, so the server must check every request',
	['Hiding the button changes the user\'s role on the server, which breaks later checks', 'Browsers cache hidden buttons and show them again after the next page load', 'The check only matters for administrators, never for ordinary customers'],
	'An attacker can call the endpoint directly with any HTTP client, so the interface proves nothing. OWASP says permissions must be validated on every request, on the server, whatever its source. Hiding a button changes no role, and the check matters for every user.');

const p1 = builder('AU', 'au-passwords');
p1.add('basic', 'fast-hash',
	'Why is a fast hash such as plain SHA-256 a poor way to store passwords?',
	'An attacker with the database can test guesses extremely quickly',
	['It produces hashes that cannot be compared with the hash of a later login attempt', 'It needs a different secret key for every user, which is hard to manage', 'It makes the stored value reversible by anyone who knows the algorithm'],
	'Fast hashes were designed for speed, which is exactly what a password cracker wants. Password hashes such as Argon2id are slow and memory-hungry on purpose. A fast hash is still one-way and comparable, and it needs no per-user key.');
p1.add('basic', 'salt-pepper',
	'Which statement about salt and pepper is correct?',
	'A salt is unique per password and stored with the hash; a pepper is shared and kept outside the database',
	['A salt is a secret shared by all hashes; a pepper is unique per user', 'Both are stored next to each hash so verification can find them', 'A pepper replaces the need for a slow hash'],
	'The salt is public and unique, so precomputed tables fail. The pepper is a shared secret held elsewhere, such as in a secrets manager, so a stolen database alone is not enough. Neither replaces a slow, adaptive hash, and a pepper stored next to the hashes adds nothing.');
p1.add('mid', 'nist-rules',
	'A signup form demands a capital letter, a digit and a symbol, and forces a change every 90 days. What does NIST SP 800-63-4 say?',
	'Do not impose composition rules or periodic changes; require length and screen against bad passwords',
	['Keep the composition rules but drop the 90-day change, because only periodic expiry is now discouraged by NIST', 'Keep both rules, because they are still required for strong passwords', 'Require the change every 90 days but drop the symbol rule, because only that is discouraged'],
	'NIST says verifiers shall not impose other composition rules and shall not require periodic changes, except when a password is known or suspected to be compromised. It asks instead for sufficient length (15 characters alone, 8 with another factor) and a blocklist of common and breached passwords.');
p1.add('mid', 'generic-error',
	'Login says "No account with that email" for unknown emails and "Wrong password" otherwise. What is the problem?',
	'It lets an attacker learn which emails have accounts',
	['It reveals the length of the password to anyone who tries it twice', 'It makes the session id predictable', 'It switches off rate limiting for known emails'],
	'Different messages, or different response times, create a discrepancy an attacker can use to enumerate valid accounts. OWASP asks for the same generic message and similar timing for every failure. The message has no bearing on password length, session ids or rate limits.');
p1.add('advanced', 'upgrade-cost',
	'Hardware gets faster and the team wants a higher hash cost. How can existing hashes be upgraded?',
	'Re-hash each password with the new cost the next time its owner signs in',
	['Run a batch job that re-hashes every stored hash with the new cost parameters', 'Decrypt the stored hashes and encrypt them again', 'Ask every user to change their password each month'],
	'Hashes cannot be reversed, so only the plain password, available briefly at login, can be re-hashed. Because the cost parameters are stored in each hash string, old and new hashes can coexist. Re-hashing a hash in a batch does not raise the cost of guessing the original password.');

const s1 = builder('AU', 'au-sessions-vs-tokens');
s1.add('basic', 'opaque-id',
	'What does the browser store in a classic server-side session design?',
	'Only a random session id; the data stays on the server',
	['The user\'s name, role and permissions, signed so they cannot be changed', 'The password hash, for faster logins', 'A copy of the whole session record'],
	'The session id is an opaque key into a store held by the server, which is why deleting the record ends the session at once. Putting claims in the browser is the signed-token design, and a password hash should never be sent to the client.');
s1.add('mid', 'revocation',
	'Support must end one user\'s access immediately. Which design makes that simplest?',
	'Server-side sessions: delete the record and the id stops working',
	['Long-lived signed tokens with no server state and no list of revoked tokens', 'Signed tokens with a 24-hour expiry and no list of revoked tokens', 'Cookies set to expire when the browser closes'],
	'A server-side record is the single source of truth, so deleting it is instant. A self-contained token stays valid until it expires unless a denylist or version check is added, and a cookie that expires when the browser closes cannot be recalled either.');
s1.add('mid', 'fixation',
	'An attacker sets a known session id in a victim\'s browser before login. What stops the attack?',
	'Issuing a new session id when the user logs in',
	['Making the session id longer so that it is harder to guess', 'Setting a shorter idle timeout', 'Putting the session id in a URL parameter'],
	'In session fixation the attacker already knows the id, so length does not help. Regenerating the id at login, and after any privilege change, makes the planted id worthless. Ids in URLs leak through logs and the Referer header, and a shorter timeout only narrows the window.');
s1.add('mid', 'logout',
	'A user clicks Logout and the app only deletes the cookie in the browser. What is wrong?',
	'A copied session id still works until the server record expires',
	['Browsers refuse to delete cookies that a server has set in a response', 'The server will issue a new id for the same user', 'Nothing: the cookie is the session'],
	'The cookie is only a pointer. If the server record survives, anyone who copied the id earlier can still use it. OWASP says logout must invalidate the session on the server, and that browser-close events cannot be trusted to do it.');
s1.add('advanced', 'two-timeouts',
	'Why have both an idle timeout and an absolute timeout?',
	'Idle limits abandoned sessions; absolute caps how long a hijacked, kept-alive session can last',
	['Idle ends a session on logout; absolute ends it on login', 'They are the same limit shown in two units', 'Absolute applies only to mobile browsers and idle only to desktop ones'],
	'An idle timeout closes sessions nobody is using, but an attacker who has hijacked a session can keep it alive with requests. The absolute timeout ends it regardless of activity. OWASP gives examples of 2-5 or 15-30 minutes idle and 4-8 hours absolute, and both must be enforced on the server.');

const j1 = builder('AU', 'au-jwt');
j1.add('basic', 'not-encrypted',
	'Which is true of a signed JWT (a JWS)?',
	'Anyone holding it can read the payload; the signature only shows it was not changed',
	['The payload is encrypted with the signing key, so only the party that holds that key can read it', 'Only the issuer can decode the payload', 'The payload is hidden until the signature is valid'],
	'A JWS is base64url text, not ciphertext. The signature gives integrity, not secrecy, so never put data in the payload that the holder should not see. If contents must stay hidden, use a JWE or keep the data on the server.');
j1.add('mid', 'alg-allow-list',
	'A verifier reads the alg header from the token and uses that algorithm. What can go wrong?',
	'An attacker can choose an unexpected algorithm, such as none, or swap RS256 for HS256',
	['The signature becomes longer than the payload, which breaks some HTTP header size limits', 'Tokens can no longer travel in headers', 'Nothing, because the header is signed and so protected'],
	'The attacker writes the whole token, header included, so a signed header protects nothing before verification. RFC 8725 describes both attacks and says the verifier must specify the allowed algorithms and use each key with exactly one of them.');
j1.add('mid', 'audience',
	'A token issued for the Orders API is sent to the Billing API, which checks only the signature and expiry. What is missing?',
	'Validating aud and iss, so tokens meant for other services are rejected',
	['A longer expiry on the token, so that it stays valid while it travels between services', 'Encrypting the payload', 'A larger signing key'],
	'The signature proves the issuer made the token, not that it was meant for this service. RFC 8725 says to validate the audience and the issuer. Expiry length, payload encryption and key size do not stop a token being replayed at the wrong service.');
j1.add('mid', 'time-claims',
	'Under RFC 7519, how should exp and nbf be treated?',
	'Refuse the token on or after exp or before nbf, allowing at most a small clock-skew leeway',
	['Accept it until exp plus a day, to be safe', 'Ignore nbf unless the token is encrypted', 'Treat them as hints the client may refresh itself'],
	'RFC 7519 says the current time must be before exp and not earlier than nbf, and that implementers may allow a small leeway, usually no more than a few minutes, for clock skew. They are rules for the verifier, not hints for the client.');
j1.add('advanced', 'key-rotation',
	'How does a verifier keep working while the issuer rotates its signing key?',
	'Look up the public key by kid in a trusted key set (JWKS) that lists old and new keys',
	['Follow the jku URL inside each token to download whichever key the token says it needs', 'Hard-code the first key and make users sign in again', 'Accept any key that verifies the signature'],
	'A JWKS holds several public keys, and the kid in the token header selects one, so old tokens keep working until they expire. Fetching keys from a URL named by the token is an SSRF risk (RFC 8725), and accepting any key that verifies would accept an attacker\'s own key.');

const r1 = builder('AU', 'au-access-refresh');
r1.add('basic', 'short-lived',
	'Why are access tokens kept short-lived?',
	'A stolen one stops working soon, limiting the damage',
	['Short tokens are cheaper to sign, so servers can issue more of them', 'Browsers delete long tokens', 'It lets the API skip checking signatures'],
	'Short lifetimes bound the time a stolen access token is useful, which matters because signed tokens cannot easily be recalled. Signing cost and browser behaviour are unrelated, and the API still has to verify every token.');
r1.add('mid', 'refresh-role',
	'What is the job of a refresh token?',
	'To get a new access token without asking the user to sign in again',
	['To sign API requests', 'To store the user\'s password hash on the client so logins are faster', 'To replace the session cookie for good'],
	'A refresh token is exchanged at the authorization server for a new access token, so users stay signed in while access tokens stay short. It is not used to sign requests, and storing a password hash on the client would be a serious flaw.');
r1.add('mid', 'rotation',
	'How does refresh token rotation help?',
	'Each refresh retires the old token, so a replayed copy reveals a theft',
	['It makes refresh tokens last forever, so users never have to sign in again', 'It encrypts refresh tokens at rest', 'It removes the need for HTTPS'],
	'With rotation a legitimate client always holds the newest token, so seeing a retired one means a copy exists somewhere. RFC 9700 describes this as one way to detect replay for public clients. It adds no encryption and does not replace TLS.');
r1.add('advanced', 'reuse',
	'An already-used refresh token is presented again. What should the server do?',
	'Treat it as possible theft and revoke the whole token family',
	['Issue a new pair, since the client may simply have retried after a timeout', 'Ignore the request and keep the current token', 'Delete only the reused token'],
	'RFC 9700 notes that the server cannot tell which party sent the retired token, so it revokes the active token too. That stops an attacker at the cost of making the real client sign in again. Issuing a new pair would reward the thief.');
r1.add('advanced', 'logout-everywhere',
	'What does "log out everywhere" do to signed access tokens that are still valid?',
	'Nothing, unless the API checks a denylist or version; they live until they expire',
	['They are revoked at once, because the signature is checked', 'They are re-signed with a new key', 'They turn into refresh tokens'],
	'Deleting refresh records stops renewal, but a self-contained access token is accepted until exp unless the API also checks state, such as a denylist or a per-user version. That is why access tokens should be short-lived.');

export const banks: { out: Question[] }[] = [t1, p1, s1, j1, r1];
