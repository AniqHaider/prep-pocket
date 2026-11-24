import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');

// Auth and tokens, access area: MFA and passkeys, API keys and service auth, authorization models, auth in practice.
// Facts checked against RFC 4226, RFC 6238, RFC 6749, RFC 8705, the W3C WebAuthn Level 3 spec, NIST SP 800-63B-4, the Standard Webhooks
// specification and the OWASP Cheat Sheet Series and API Security Top 10 (2023). This is engineering guidance, not legal advice.

export const topics: DbTopic[] = [
	// ───────────────────────── au-mfa-passkeys ─────────────────────────
	{
		id: "au-mfa-passkeys",
		title: "MFA, TOTP and passkeys",
		level: "mid",
		summary: "Know how an authenticator-app code is made and checked, why SMS and typed codes can be phished, and why a passkey cannot.",
		scenes: ["au-totp-flow", "au-mfa-factors", "au-passkey-login"],
		notes: md(
			"**Multi-factor authentication (MFA)** asks for two kinds of proof: something you know, something you have or something you are. A second factor stops most takeovers that rely on a stolen password.",
			"",
			"**TOTP** (RFC 6238) is the code in an authenticator app. The server and the app share a secret once. Each computes the step number `floor(unix time / 30)`, takes an HMAC of it and truncates it (RFC 4226): the last byte's low 4 bits pick an offset, 4 bytes from there (top bit cleared) give 31 bits, and that number modulo 1,000,000 is the code. Use a secret of at least 128 bits; 160 is recommended.",
			"",
			"**Verifying.** Accept the current step and at most one earlier. Remember the last accepted step and refuse it and anything older, so a seen code cannot be reused. Limit attempts. The server needs the seed to compute codes, so store it encrypted and never send it back.",
			"",
			"**Weak and strong.** NIST SP 800-63B-4 restricts SMS codes (SIM swapping, interception, number porting) and does not allow email as an out-of-band authenticator. A code a person types, by SMS, email or app, can be relayed by a fake site, so none of them is phishing-resistant. Push approvals can be spammed until someone taps yes; number matching and rate limits help.",
			"",
			"**Passkeys (WebAuthn)** sign a challenge with a private key that never leaves the authenticator. The credential is scoped to one site domain, and the server checks the origin and the challenge, so a look-alike site gets nothing to relay. Authenticators can be built in (platform) or external (roaming, such as a security key). If a passkey is the second factor, require user verification and check its flag on the server.",
			"",
			"**Around the factors:** give single-use recovery codes stored hashed, treat changing a factor as high-risk and notify the owner, and ask again (step-up) before sensitive actions."
		),
		try: [
			{
				label: "TOTP maths and a replay-safe check",
				code: md(
					"// RFC 4226 section 5.4 example: the 20-byte HMAC-SHA-1 result is given as input, so no crypto is needed here.",
					"const hmac = [0x1f, 0x86, 0x98, 0x69, 0x0e, 0x02, 0xca, 0x16, 0x61, 0x85, 0x50, 0xef, 0x7f, 0x19, 0xda, 0x8e, 0x94, 0x5b, 0x55, 0x5a];",
					"function truncate(h, digits = 6) {",
					"  const offset = h[19] & 0xf; // low 4 bits of the last byte",
					"  const bin = ((h[offset] & 0x7f) << 24) | (h[offset + 1] << 16) | (h[offset + 2] << 8) | h[offset + 3]; // 31 bits",
					"  return { offset, bin, code: String(bin % 10 ** digits).padStart(digits, '0') };",
					"}",
					"console.log(truncate(hmac)); // RFC 4226 says 872921",
					"",
					"// RFC 6238: the step is the Unix time divided by the step size (30 s), rounded down.",
					"const step = (unix, x = 30) => Math.floor(unix / x);",
					"console.log('steps at 59 s, 60 s and 1111111109 s:', step(59), step(60), step(1111111109));",
					"",
					"// Verifier: accept the current step or one earlier, never a step at or before the last one accepted.",
					"function verify(code, unix, codeFor, lastStep) {",
					"  const now = step(unix);",
					"  for (const s of [now, now - 1]) {",
					"    if (s <= lastStep) continue;",
					"    if (codeFor(s) === code) return { ok: true, step: s };",
					"  }",
					"  return { ok: false };",
					"}",
					"const codeFor = (s) => String((s * 7919) % 1000000).padStart(6, '0'); // stand-in for HMAC + truncation",
					"const t = 1700000000;",
					"const now = step(t);",
					"const first = verify(codeFor(now), t, codeFor, -1);",
					"console.log('first use:', first);",
					"console.log('same code again:', verify(codeFor(now), t + 5, codeFor, first.step));",
					"console.log('code one step old:', verify(codeFor(now - 1), t, codeFor, -1));",
					"console.log('code two steps old:', verify(codeFor(now - 2), t, codeFor, -1));"
				)
			}
		]
	},

	// ───────────────────────── au-api-keys-service-auth ─────────────────────────
	{
		id: "au-api-keys-service-auth",
		title: "API keys and service auth",
		level: "mid",
		summary: "Issue, store, send and rotate API keys safely, choose a machine-to-machine option, and sign webhooks so replays and forgeries fail.",
		scenes: ["au-apikey-lifecycle", "au-key-transport", "au-webhook-signature"],
		notes: md(
			"An **API key** identifies a client of your API, such as a partner or a backend job. It is a long-lived secret, so treat it like a password with extra care.",
			"",
			"**Issue.** Generate it with a secure random generator and give it a recognisable prefix (such as `shop_live_`) so leaks are easy to find. Show it once, then store only a hash plus the prefix, scopes, expiry and owner. Because the key is long and random, a fast hash such as SHA-256 is enough; slow password hashing exists for guessable human passwords.",
			"",
			"**Send and keep.** Send the key in a header over HTTPS, never in a URL, where logs, history and Referer headers can disclose it. Compare in constant time. Keep keys out of git and browser bundles: use environment variables or a secrets manager. Rotate with an overlap and an expiry date, and revoke at once on a leak. OWASP adds that API keys alone should not protect high-value resources.",
			"",
			"**Machine-to-machine options.** The OAuth client credentials grant (RFC 6749) is for confidential clients that can keep a secret, with no user present. Cloud service accounts issue short-lived credentials. Mutual TLS (RFC 8705) authenticates the client by certificate and can bind tokens to it.",
			"",
			"**Webhooks.** Sign the message id, timestamp and raw body with HMAC-SHA256, as the Standard Webhooks specification does. The receiver recomputes the signature, compares in constant time, rejects timestamps outside a tolerance to stop replay, and uses the id as an idempotency key. During rotation the sender signs with two secrets, so the receiver can accept either."
		),
		try: [
			{
				label: "An API key store that keeps only hashes",
				code: md(
					"// A toy stand-in for SHA-256 (FNV-1a) so this runs without crypto. Use a real SHA-256 in production.",
					"const hash = (s) => { let h = 0x811c9dc5; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };",
					"// Constant-time comparison: look at every character, then decide.",
					"function safeEqual(a, b) {",
					"  let diff = a.length ^ b.length;",
					"  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);",
					"  return diff === 0;",
					"}",
					"const db = new Map(); // prefix -> { hash, scopes, expires }: the full key is never stored",
					"const prefixOf = (key) => key.slice(0, 14);",
					"function issue(key, scopes, expires) { db.set(prefixOf(key), { hash: hash(key), scopes, expires }); return key; }",
					"function check(key, scope, now) {",
					"  const rec = db.get(prefixOf(key));",
					"  if (!rec) return 'unknown key';",
					"  if (!safeEqual(hash(key), rec.hash)) return 'wrong key';",
					"  if (now > rec.expires) return 'expired';",
					"  return rec.scopes.includes(scope) ? 'allowed' : 'scope missing';",
					"}",
					"const key = issue('shop_live_7f3k9x2m4q8w', ['orders:read'], 2000);",
					"console.log('stored:', [...db.values()]);",
					"console.log('read orders:', check(key, 'orders:read', 1000));",
					"console.log('refund orders:', check(key, 'orders:refund', 1000));",
					"console.log('after expiry:', check(key, 'orders:read', 3000));",
					"console.log('guessed key:', check('shop_live_7f3k0000000000', 'orders:read', 1000));"
				)
			},
			{
				label: "A webhook check with replay protection",
				code: md(
					"// Toy signing function, a stand-in for HMAC-SHA256 so this runs without crypto.",
					"const sign = (secret, text) => { let h = 0x811c9dc5; for (const c of secret + '|' + text) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };",
					"function safeEqual(a, b) { let d = a.length ^ b.length; for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0); return d === 0; }",
					"const secret = 'whsec_demo';",
					"const seen = new Set(); // message ids already processed",
					"function receive(req, now, toleranceSec = 300) {",
					"  const text = [req.id, req.ts, req.body].join('.'); // id . timestamp . raw body",
					"  if (!safeEqual(sign(secret, text), req.sig)) return 'bad signature';",
					"  if (Math.abs(now - req.ts) > toleranceSec) return 'too old: possible replay';",
					"  if (seen.has(req.id)) return 'already processed';",
					"  seen.add(req.id);",
					"  return 'accepted';",
					"}",
					"const body = '{\"order\":1002,\"status\":\"paid\"}';",
					"const msg = { id: 'msg_1', ts: 1700000000, body, sig: sign(secret, ['msg_1', 1700000000, body].join('.')) };",
					"console.log('first delivery:', receive(msg, 1700000010));",
					"console.log('retry of the same message:', receive(msg, 1700000020));",
					"console.log('same body, changed:', receive({ ...msg, id: 'msg_2', body: body.replace('paid', 'refunded') }, 1700000030));",
					"console.log('old message resent later:', receive({ ...msg, id: 'msg_3', sig: sign(secret, ['msg_3', 1700000000, body].join('.')) }, 1700009999));"
				)
			}
		]
	},

	// ───────────────────────── au-authorization-models ─────────────────────────
	{
		id: "au-authorization-models",
		title: "Authorization models and BOLA",
		level: "mid",
		summary: "Decide who may do what with roles, attributes and relationships, and stop a valid login from opening another customer's order.",
		scenes: ["au-authz-decision", "au-bola-orders", "au-authz-models"],
		notes: md(
			"**Authentication** asks who you are; **authorization** asks what you may do. Most serious access flaws are authorization flaws: OWASP's web Top 10 lists Broken Access Control as A01, and Broken Object Level Authorization is API1:2023 in its API Top 10.",
			"",
			"**Enforce on the server, every time.** Validate permissions on every request, whatever sent it, and deny by default: if no rule allows an action, refuse it. Hiding a button is not a rule; each admin function needs its own check (API5, Broken Function Level Authorization).",
			"",
			"**Object level.** A valid login must not unlock another user's order. An IDOR has three ingredients: an object, a reference to it, and a missing object-level check. Hard-to-guess ids such as GUIDs are defence in depth, not a replacement. Test with two accounts, where user A tries user B's objects for every action.",
			"",
			"**Models.** RBAC gives permissions to roles: simple, but roles multiply and a role knows nothing about one order. ABAC decides from attributes of the user, the object and the situation. ReBAC decides from relationships, such as being the buyer or a member of the owning team. OWASP prefers ABAC and ReBAC for fine-grained and multi-tenant needs.",
			"",
			"**Scopes and roles.** A scope limits what a token, and so an app, may do. A role says what the user may do. The effective right is what both allow.",
			"",
			"**Tenants and privilege.** Take the tenant id and user id from the authenticated identity, never from a field the client sends, or callers can reach another tenant or make themselves admin. Log denials."
		),
		try: [
			{
				label: "Roles, ownership and tenants on orders",
				code: md(
					"const orders = {",
					"  1001: { owner: 'asha', tenant: 'shopA' },",
					"  1002: { owner: 'ben', tenant: 'shopA' },",
					"  2001: { owner: 'cara', tenant: 'shopB' }",
					"};",
					"const roles = { customer: [], support: ['order:read'], admin: ['order:read', 'order:refund'] };",
					"",
					"// Deny by default: only an explicit rule returns true.",
					"function can(user, action, order) {",
					"  if (!order) return false;                                   // unknown object",
					"  if (user.tenant !== order.tenant) return false;             // tenant isolation comes first",
					"  if (order.owner === user.id && action === 'order:read') return true; // relationship: the buyer",
					"  return (roles[user.role] || []).includes(action);           // role: support, admin",
					"}",
					"",
					"const asha = { id: 'asha', role: 'customer', tenant: 'shopA' };",
					"const agent = { id: 'sam', role: 'support', tenant: 'shopA' };",
					"const boss = { id: 'raj', role: 'admin', tenant: 'shopA' };",
					"console.log('asha reads her order 1001:', can(asha, 'order:read', orders[1001]));",
					"console.log('asha reads ben\\'s order 1002:', can(asha, 'order:read', orders[1002]));",
					"console.log('support reads order 1002:', can(agent, 'order:read', orders[1002]));",
					"console.log('support reads another tenant\\'s 2001:', can(agent, 'order:read', orders[2001]));",
					"console.log('support refunds 1001:', can(agent, 'order:refund', orders[1001]));",
					"console.log('admin refunds 1001:', can(boss, 'order:refund', orders[1001]));",
					"console.log('anyone reads a missing order:', can(boss, 'order:read', orders[9999]));"
				)
			}
		]
	},

	// ───────────────────────── au-auth-in-practice ─────────────────────────
	{
		id: "au-auth-in-practice",
		title: "Auth for an online store",
		level: "advanced",
		summary: "Put the pieces together for a store: customers, recovery, services, staff and logs, and know which shortcut costs what.",
		scenes: ["au-store-architecture", "au-auth-checklist", "au-risk-table"],
		notes: md(
			"This topic puts the pieces together for an online store. The aim is a small, boring set of controls applied everywhere.",
			"",
			"**Customers.** Passwords are hashed with a slow, salted algorithm and checked against breached lists. Unknown users and wrong passwords get the same message, so accounts cannot be enumerated. Failed logins are counted per account and slow or lock further tries. MFA is offered to everyone and required for staff. After login the backend sets a session cookie that page scripts cannot read; signing in through an identity provider means the shop never handles the password.",
			"",
			"**Recovery.** Reset links are random, single-use and short-lived, and the account does not change until a valid token is presented. After recovery, end existing sessions and reset links and notify the owner by email. Treat changing an MFA factor as high-risk.",
			"",
			"**Services and staff.** Backend jobs use service accounts with the narrowest permissions and short-lived or rotated credentials. Staff use MFA, step-up for sensitive actions and a separate admin path.",
			"",
			"**Evidence.** Log logins, failures, lockouts, key use and admin actions, never passwords, tokens or keys. Alert on patterns. When a key or token leaks: revoke it, issue a new one, search the logs for use of the old one and tell affected users where required.",
			"",
			"**Shortcuts have a cost.** Tokens in localStorage can be read by an injected script; keys in URLs leak into logs; trusting client-sent roles allows self-made admins; keys that never rotate live forever after a leak."
		),
		try: [
			{
				label: "Lockout per account, not per address",
				code: md(
					"// Failed-login counter kept per ACCOUNT, so many source addresses cannot reset it.",
					"// Lockout grows exponentially: 1 s, 2 s, 4 s ... capped at 15 minutes.",
					"const records = new Map(); // account -> { count, lockedUntil }",
					"function attempt(account, passwordOk, nowSec) {",
					"  const rec = records.get(account) || { count: 0, lockedUntil: 0 };",
					"  if (nowSec < rec.lockedUntil) return { processed: false, retryInSeconds: rec.lockedUntil - nowSec };",
					"  if (passwordOk) { records.delete(account); return { processed: true, loggedIn: true }; }",
					"  rec.count += 1;",
					"  const lock = Math.min(2 ** (rec.count - 1), 900);",
					"  rec.lockedUntil = nowSec + lock;",
					"  records.set(account, rec);",
					"  return { processed: true, loggedIn: false, lockedForSeconds: lock };",
					"}",
					"let now = 0;",
					"for (const ip of ['1.1.1.1', '2.2.2.2', '3.3.3.3', '4.4.4.4']) {",
					"  console.log('wrong guess from', ip, attempt('asha', false, now));",
					"  now += 1;",
					"}",
					"now += 30;",
					"console.log('later, right password:', attempt('asha', true, now));"
				)
			}
		]
	}
];

// ───────────────────────── questions ─────────────────────────
const t = (topic: string) => builder("AU", topic);

// ── au-mfa-passkeys
const mf = t("au-mfa-passkeys");

mf.add(
	"basic",
	"totp-step",
	"In TOTP with the default settings, how often does the code change?",
	"Every 30 seconds, when the time step number advances",
	[
		"Every time the user opens the app, using a fresh random value",
		"Every 24 hours, when the server rotates the shared secret",
		"After each successful login, using a counter kept by the server"
	],
	"RFC 6238 derives the code from the Unix time divided by a step size, 30 seconds by default, so it changes when the step number does. The shared secret stays the same, and a server-kept counter describes HOTP (RFC 4226), not TOTP."
);
mf.add(
	"mid",
	"replay",
	"A code for step 4821 was accepted. The same code arrives again 5 seconds later. What should the server do?",
	"Refuse it, since that step was already used and earlier steps are rejected",
	[
		"Accept it again, because the code is still valid for the rest of its 30-second window",
		"Accept it only if it comes from the same IP address as the first successful attempt",
		"Accept it a second time, then lock the account until the user contacts support"
	],
	"A TOTP code is valid for its whole time step, so a code seen by an attacker can be replayed inside it. The verifier should store the last accepted step per token and refuse that step and any earlier one, updating it atomically. IP addresses can be shared or spoofed and are not a replay control."
);
mf.add(
	"mid",
	"sms",
	"Why is an SMS code a weaker second factor than a passkey?",
	"The code can be redirected by SIM swapping and typed into a look-alike site",
	[
		"SMS codes always have only four digits, so they are guessed within a few attempts",
		"Phones cannot receive text messages while connected to Wi-Fi, so codes often arrive late",
		"SMS codes can only be used on their own and cannot be combined with a password"
	],
	"NIST restricts SMS codes because of SS7 interception, SIM swapping and number porting. Any code a person types, SMS included, can be relayed by a fake site, while a passkey is bound to the real domain. SMS codes are usually six digits and are routinely combined with a password."
);
mf.add(
	"mid",
	"passkey-phishing",
	"What makes a passkey resistant to phishing?",
	"The credential is bound to the site's domain, so a look-alike site cannot get a valid signature",
	[
		"The private key is stored on the shop's server, so the browser never needs to handle any secret",
		"The passkey is replaced after every login, so a stolen value has already expired when replayed",
		"The browser asks the user to confirm the site's name twice before the signature is created"
	],
	"In WebAuthn a credential is scoped to a relying party ID, a domain, and the server verifies the origin and challenge in the signed response. A fake site on another origin gets no credential to use. The private key stays in the authenticator, and passkeys are not replaced on each login."
);
mf.add(
	"advanced",
	"step-up",
	"A logged-in customer asks to change the payout bank account. What is the best practice?",
	"Ask for re-authentication or a second factor first, as this is a sensitive action",
	[
		"Skip extra checks, because the session cookie already proves who the customer is at this moment",
		"Save the change at once and only then send an email telling the customer what was changed",
		"Allow the change, then lock the session for ten minutes so the old value can be restored later"
	],
	"A session can be stolen or left open on a shared device, so sensitive actions such as changing payout details should ask again (step-up authentication). OWASP also suggests notifying the owner out of band. An email afterwards or a short lock does not stop the first change."
);

// ── au-api-keys-service-auth
const ak = t("au-api-keys-service-auth");

ak.add(
	"basic",
	"store-hash",
	"How should a server store the API keys it issues?",
	"A hash of each key with its prefix, scopes and expiry; the full key is shown once",
	[
		"Encrypted with a key in the same database, so support staff can read a key back if asked",
		"In plain text, so lost keys can be looked up and sent again to the customer by email",
		"In the user profile table beside the password hash, so both are protected together"
	],
	"Like a password, a key should not be recoverable from the database. Store a hash, plus the prefix, scopes and expiry needed to check it, and show the full key only once. If it is lost the owner gets a new one. Storing it in the clear or reversibly turns a database leak into working keys."
);
ak.add(
	"mid",
	"where",
	"Where should a client send an API key?",
	"In a request header, such as Authorization, over HTTPS only",
	[
		"In the query string, so it is easy to test the endpoint from a browser address bar",
		"In a JavaScript file loaded by the shop's public pages, so every visitor's browser can send it",
		"In a cookie that the API sets on the first request, before any other credentials are checked"
	],
	"Keys in URLs can be disclosed through logs, browser history, bookmarks and the Referer header, which OWASP notes for session IDs. A key in public page code is readable by every visitor. Headers over HTTPS keep the key out of the URL and protected in transit."
);
ak.add(
	"mid",
	"constant-time",
	"Why compare keys or signatures with a constant-time function?",
	"An early-exit comparison can leak, through timing, how many leading characters matched",
	[
		"Constant-time functions use less memory, so the server can verify far more requests per second",
		"Constant-time comparison encrypts both values first, so a database leak reveals nothing useful",
		"It makes every comparison return true when the lengths match, so valid keys are never rejected"
	],
	"A normal string comparison stops at the first different character, and an attacker who can measure response times may learn the secret one character at a time. The Standard Webhooks specification calls for constant-time comparison of symmetric signatures. It does not encrypt anything or change the result."
);
ak.add(
	"mid",
	"webhook-replay",
	"A payment webhook has a valid HMAC signature. What else must the receiver check?",
	"That the timestamp is recent and the message id is new, which stops a replay",
	[
		"That the sender's IP address is listed in the receiver's public DNS records",
		"That the body is smaller than one kilobyte, since signed messages must be short",
		"Nothing: a valid signature already proves the message is new and not delivered twice"
	],
	"A signature proves who sent a message, not when. A recorded message replays with its valid signature, so the receiver checks that the timestamp is within a tolerance and uses the message id as an idempotency key so retries are not processed twice. Signed messages can be any length."
);
ak.add(
	"advanced",
	"client-credentials",
	"A backend job must call another service with no user present. Which OAuth grant fits?",
	"Client credentials, used by confidential clients that can keep a secret",
	[
		"Implicit, because it returns a token straight from the authorization endpoint without a second step",
		"Authorization code with PKCE, because the job must send a user to a browser to approve each call",
		"Resource owner password credentials, with the shared admin login stored in the job's config"
	],
	"RFC 6749 section 4.4 defines the client credentials grant for a client acting on its own behalf, and says it must be used only by confidential clients. The implicit and password grants are discouraged, and the authorization code flow needs a user to approve, which a background job does not have."
);

// ── au-authorization-models
const az = t("au-authorization-models");

az.add(
	"basic",
	"bola",
	"User A changes the order id in a URL from 1001 to 1002 and sees user B's order. What is missing?",
	"An object-level authorization check that the order belongs to the caller",
	[
		"A longer session lifetime, so the login stays valid while the id is being changed",
		"HTTPS, because the id was readable in the browser address bar and in any extension",
		"A stronger password hash, so a stolen cookie could not be used against another account"
	],
	"This is an insecure direct object reference, called Broken Object Level Authorization (API1:2023) by OWASP: the server found the object by id without checking that this caller may access it. Session length, HTTPS and password hashing do not decide object ownership."
);
az.add(
	"mid",
	"deny-default",
	"What does deny by default mean for an authorization check?",
	"If no rule explicitly allows the action, the request is refused",
	[
		"Every new user is blocked until an administrator sends a welcome email",
		"Requests from unknown IP addresses are dropped before they reach the login page",
		"Failed logins are rejected without any message reaching the user at all"
	],
	"OWASP's Authorization Cheat Sheet says the application must always decide, and that the default should be deny, so a missing or forgotten rule fails safe and every permission can be justified. It is about the authorization decision, not about IP filtering or login messages."
);
az.add(
	"mid",
	"rbac-limit",
	"Which requirement is hardest to express with roles alone?",
	"Letting a customer see only the orders they placed themselves",
	[
		"Letting support agents read every order in the store's database",
		"Letting administrators open the settings page of the dashboard",
		"Letting visitors read the public product list without logging in"
	],
	"Roles describe what a kind of user may do in general, so support or admin access fits them well. Seeing only your own orders depends on a relationship between this user and this order, which is what ReBAC or an ownership check expresses. Role explosion is the usual workaround."
);
az.add(
	"mid",
	"scopes-roles",
	"A token has the scope orders:read, and the user's role allows deleting orders. Can the app delete orders with it?",
	"No: the token's scope limits the app to what the user and the scope both allow",
	[
		"Yes, because the user's role is the only thing the server needs to look at",
		"Yes, because scopes are hints for the interface and are not enforced by servers",
		"No, because roles are ignored whenever a token carries any scope at all"
	],
	"A scope limits what an app may do on a user's behalf, and the user's own rights limit what the user may do. The effective permission is what both allow, so a read-only scope cannot delete anything. Servers must enforce scopes; roles are not ignored, they are one of the two limits."
);
az.add(
	"advanced",
	"tenant",
	"On a multi-tenant store platform, where should the tenant id for a query come from?",
	"From the authenticated identity on the server, never from a field the client sends",
	[
		"From a hidden form field, so the page can switch tenants without a new login",
		"From the Host header the client sent, trusted because browsers set it automatically",
		"From a query parameter, because it is easier to test than reading the session"
	],
	"A tenant id the client controls lets any caller read or change another tenant's data. Derive it, like the user id, from the session or token the server verified, and check it on every query. Hidden fields, query parameters and request headers can all be edited by the caller."
);

// ── au-auth-in-practice
const ip = t("au-auth-in-practice");

ip.add(
	"basic",
	"login-errors",
	"A login form says no such user for unknown emails, and wrong password for known ones. What is the risk?",
	"Attackers can test which emails have accounts, which is account enumeration",
	[
		"Session cookies are issued before the password is checked, so they could be stolen",
		"The server is forced to keep two copies of the password, one for each message",
		"Rate limits no longer apply, because each message resets the failed-login counter"
	],
	"OWASP's Authentication Cheat Sheet says login, password reset and registration should answer generically, whether or not the account exists, so the response does not become a discrepancy that reveals valid users. Processing time can also differ, so check that too."
);
ip.add(
	"mid",
	"lockout-key",
	"Where should the failed-login counter be kept so one attacker using many IP addresses is still slowed?",
	"On the account, not only on the source address",
	[
		"On each source IP address only, so every address gets its own counter",
		"In the browser, in a cookie the login page sets after each wrong password",
		"Nowhere: slowing logins is the job of the identity provider alone"
	],
	"A counter tied to the account follows an attack that rotates through many addresses, which OWASP recommends. Counters on addresses alone are bypassed by changing address, and a cookie is under the attacker's control. Lockout needs care so it cannot be used to deny service to real users."
);
ip.add(
	"mid",
	"recovery",
	"Which property must a password-reset link have?",
	"Random, single-use and expiring after a short time",
	[
		"It should contain the user's email address and a timestamp it can be rebuilt from",
		"It should stay valid until the customer logs in again so repeated clicks keep working",
		"It should be easy to remember so customers can type it in from another device"
	],
	"OWASP's Forgot Password Cheat Sheet requires reset tokens that are generated with a cryptographically secure random generator, single use and expiring. A predictable or long-lived link can be guessed, reused or found later in an inbox, and the account must not change until a valid token is presented."
);
ip.add(
	"advanced",
	"after-reset",
	"After a successful account recovery, what else should the server do?",
	"End existing sessions and outstanding reset links, then notify the owner",
	[
		"Keep every existing session open, so the customer is not logged out on any other device",
		"Reuse the same reset link for the next reset, which saves generating a new random token",
		"Email the new password to the customer so it can be compared with the old one later"
	],
	"A reset alone may not restore control of a compromised account: an attacker may still hold a session or have changed recovery details. OWASP advises invalidating sessions and pending reset links, and emailing the user that the password changed, but never the password itself."
);
ip.add(
	"advanced",
	"key-leak",
	"An API key was found in a public repository. What is the right response?",
	"Revoke it and issue a new one, then check the logs for use of the old key",
	[
		"Delete the file in a new commit, since the key is no longer in the latest version",
		"Delete the commit from the history and keep using the same key",
		"Wait to see whether anyone uses it before rotating, to avoid breaking clients"
	],
	"Once a secret has been public it must be treated as compromised: copies and history persist, so deleting it is not enough. Revoke it, issue a replacement, and review the logs for use of the old key. Rotating with a short overlap limits the impact on clients."
);

export const banks: { out: Question[] }[] = [mf, ak, az, ip];
