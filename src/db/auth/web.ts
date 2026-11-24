import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');

export const topics: DbTopic[] = [
	// ───────────────────────── Where a token may live ─────────────────────────
	{
		id: 'au-token-storage',
		title: 'Where a token may live in a browser',
		level: 'mid',
		summary: 'Compare localStorage, memory, cookies and a backend for frontend, and see why a JWT in localStorage is a recurring mistake.',
		scenes: ['au-storage-choices', 'au-xss-steals', 'au-bff-pattern'],
		notes: md(
			"A login gives the browser something that proves who the user is. Where it is kept decides who can steal it.",
			"",
			"- **localStorage, sessionStorage, IndexedDB:** readable by any script on the page, so one XSS flaw exposes them. OWASP says not to keep session ids or tokens there, and NIST SP 800-63B-4 says session secrets should not go in local storage.",
			"- **JavaScript memory:** gone on reload, but injected code can still call the app's own functions or ask for a new token.",
			"- **HttpOnly cookie:** scripts cannot read it, so XSS cannot copy it. The browser sends it by itself, so the server must also stop CSRF.",
			"- **Backend for frontend (BFF):** the browser holds only a session cookie; the access and refresh tokens stay on a server that calls the API for it. RFC 10017, the IETF best practice for OAuth in browser apps, lists this first and strongly recommends it for business, sensitive and personal-data apps. A browser app holding the tokens itself is not recommended for those.",
			"",
			"**Why a JWT in localStorage keeps appearing.** A JWT is only a token format, and a single-page app can read `localStorage` easily, so tutorials do it. But any script can copy that token, and a long-lived one is hard to revoke.",
			"",
			"**What to do.** Default to a server session or a BFF behind a `__Host-`, `HttpOnly`, `Secure`, `SameSite` cookie. With server-rendered pages (such as Next.js server components) the server reads the cookie and the browser holds no token. A native app is not a browser: it uses the operating system's protected storage (RFC 8252).",
			"",
			"**Trade-off.** A BFF is one more component to run, and cookies need CSRF defences. That is small next to a stolen token.",
			"",
			"Sources: OWASP HTML5 Security and Session Management cheat sheets, NIST SP 800-63B-4, RFC 10017."
		),
		try: [
			{
				label: 'What an injected script can steal',
				code: md(
					"// A page with a token in localStorage and a session in an HttpOnly cookie.",
					"const browser = {",
					"  localStorage: { token: 'eyJhbGci-demo', theme: 'dark' },",
					"  cookies: [",
					"    { name: '__Host-sid', value: '9f3kX7', httpOnly: true },",
					"    { name: 'ui_lang', value: 'en', httpOnly: false }",
					"  ]",
					"};",
					"// document.cookie lists only the cookies that are not HttpOnly.",
					"const documentCookie = () => browser.cookies.filter((c) => !c.httpOnly).map((c) => c.name + '=' + c.value).join('; ');",
					"const injectedScript = () => ({ fromLocalStorage: { ...browser.localStorage }, fromDocumentCookie: documentCookie() });",
					"const loot = injectedScript();",
					"console.log(loot);",
					"console.log('token stolen:', 'token' in loot.fromLocalStorage);",
					"console.log('session cookie stolen:', loot.fromDocumentCookie.includes('__Host-sid'));"
				)
			},
			{
				label: 'Pick a storage pattern',
				code: md(
					"// A rule of thumb that follows RFC 10017 and the OWASP cheat sheets.",
					"const pattern = ({ ownBackend, personalData, serverRendered }) => {",
					"  if (serverRendered) return 'server session: the server reads an HttpOnly cookie';",
					"  if (ownBackend) return 'BFF: session cookie in the browser, tokens on the server';",
					"  if (personalData) return 'add a BFF first; a browser-only OAuth client is not recommended here';",
					"  return 'token-mediating backend, short-lived access token kept in memory';",
					"};",
					"const cases = [",
					"  { name: 'shop with its own API', ownBackend: true, personalData: true, serverRendered: false },",
					"  { name: 'Next.js server components', ownBackend: true, personalData: true, serverRendered: true },",
					"  { name: 'static SPA calling a third-party API', ownBackend: false, personalData: true, serverRendered: false },",
					"  { name: 'public demo with no personal data', ownBackend: false, personalData: false, serverRendered: false }",
					"];",
					"for (const c of cases) console.log(c.name.padEnd(38), '->', pattern(c));"
				)
			}
		]
	},

	// ───────────────────────── Cookies ─────────────────────────
	{
		id: 'au-cookies',
		title: 'Cookie attributes that protect a session',
		level: 'mid',
		summary: 'Know what HttpOnly, Secure, SameSite, Domain, Path, Max-Age and the __Host- prefix each defend against, and write a safe Set-Cookie header.',
		scenes: ['au-cookie-flags', 'au-samesite-matrix'],
		notes: md(
			"A cookie is a name, a value and attributes. The attributes are where the security is.",
			"",
			"- **HttpOnly:** scripts cannot read the cookie through `document.cookie`, so XSS cannot copy a session id.",
			"- **Secure:** sent over HTTPS only, never in clear text.",
			"- **SameSite:** `Strict` sends the cookie only on same-site requests. `Lax` also sends it on top-level navigations that use a safe method, such as following a link. `None` allows cross-site use and requires `Secure`. Some browsers treat a missing value as `Lax` and others do not, so always set it. It reduces CSRF but is not a full defence.",
			"- **Domain and Path:** with no `Domain` the cookie stays on the exact host; `Domain=example.com` shares it with every subdomain, so one weak subdomain can attack the session. `Path` only chooses which URLs get the cookie and is not a security measure (MDN).",
			"- **Max-Age and Expires:** with neither, it is a session cookie, removed when the browser closes. `Max-Age` wins if both are set; zero or negative expires it at once, which is how a server clears one.",
			"- **Prefixes:** `__Secure-` requires `Secure`. `__Host-` also forbids `Domain` and requires `Path=/`, so only the exact host can set or send it; OWASP recommends it for session ids. `__Host-Http-` also requires `HttpOnly`.",
			"",
			"**A good session cookie:** `Set-Cookie: __Host-sid=<random>; Path=/; Secure; HttpOnly; SameSite=Lax`, with an opaque random value and never personal data.",
			"",
			"**Third-party contexts.** A cookie sent from an embedded cross-site frame needs `SameSite=None; Secure`, and several browsers block third-party cookies by default, so check each one. The `Partitioned` attribute (CHIPS) stores such a cookie separately per top-level site. A login cookie for your own site should not depend on it.",
			"",
			"Sources: MDN Set-Cookie and Cookies guides, OWASP Session Management cheat sheet, NIST SP 800-63B-4, OWASP ASVS 5.0 V3.3."
		),
		try: [
			{
				label: 'Check a Set-Cookie header',
				code: md(
					"// Lists the protections a session cookie is missing.",
					"const check = (header) => {",
					"  const parts = header.replace(/^Set-Cookie:\\s*/i, '').split(';').map((s) => s.trim());",
					"  const name = parts[0].split('=')[0];",
					"  const attrs = parts.slice(1).map((a) => a.toLowerCase());",
					"  const has = (k) => attrs.some((a) => a === k || a.startsWith(k + '='));",
					"  const problems = [];",
					"  if (!has('secure')) problems.push('missing Secure');",
					"  if (!has('httponly')) problems.push('missing HttpOnly');",
					"  if (!has('samesite')) problems.push('no SameSite (browsers differ)');",
					"  if (has('domain')) problems.push('Domain shares it with every subdomain');",
					"  if (!name.startsWith('__Host-')) problems.push('no __Host- prefix');",
					"  else if (!has('secure') || has('domain') || !attrs.includes('path=/')) problems.push('__Host- rules broken: the browser will refuse it');",
					"  return problems.length ? problems : ['looks good'];",
					"};",
					"const headers = [",
					"  'Set-Cookie: sid=abc123',",
					"  'Set-Cookie: sid=abc123; Domain=shop.example.com; Secure; HttpOnly',",
					"  'Set-Cookie: __Host-sid=abc123; Path=/; Secure; HttpOnly; SameSite=Lax'",
					"];",
					"for (const h of headers) console.log(h, '\\n   ->', check(h).join('; '));"
				)
			}
		]
	},

	// ───────────────────────── CSRF, CORS, XSS ─────────────────────────
	{
		id: 'au-csrf-cors-xss',
		title: 'CSRF, CORS and XSS',
		level: 'mid',
		summary: 'Tell the three apart, know which defence stops which, and see why CORS is not authentication.',
		scenes: ['au-csrf-attack', 'au-cors-not-auth', 'au-xss-defences'],
		notes: md(
			"These three are different problems.",
			"",
			"**CSRF** (cross-site request forgery): another site makes the victim's browser send a request that carries their cookie, for example a hidden form that posts to `/account/email`. It works because the browser attaches cookies by itself. Defences, in layers:",
			"",
			"- Give the session cookie `SameSite=Lax` or `Strict`. It helps but has gaps: `Lax` still sends the cookie on top-level `GET` navigations, and `SameSite` is about the site, not the origin, so a taken-over sibling subdomain counts as same-site. Never change state on a `GET`.",
			"- Check where the request came from: reject unsafe methods when `Sec-Fetch-Site` is `cross-site`, and fall back to comparing the `Origin` header with your own origin.",
			"- Use an anti-CSRF token: a synchronizer token for stateful apps, a signed double-submit cookie for stateless ones. The naive double-submit is discouraged because an attacker who can write a cookie can beat it. For JSON APIs, require a custom request header, since a cross-site page cannot add one without CORS approval.",
			"",
			"**CORS** is a browser rule that relaxes the same-origin policy: a server lists the origins whose scripts may read its responses. It does not log anyone in. A credentialed `fetch` needs an exact `Access-Control-Allow-Origin`, not `*`. Some requests, such as a plain form post, are sent anyway and only the reading is blocked, so CORS alone is not a CSRF defence.",
			"",
			"**XSS** (cross-site scripting) is how tokens get stolen: attacker script runs in your page, and it can also defeat every CSRF defence. Stop it at the source: encode output for its context, use `textContent` rather than `innerHTML`, avoid `eval`, and add a nonce-based Content Security Policy and Trusted Types so injected scripts do not run. HttpOnly cookies limit the damage if one gets through.",
			"",
			"Sources: OWASP CSRF Prevention, XSS Prevention and Content Security Policy cheat sheets, MDN CORS and Trusted Types, RFC 10017."
		),
		try: [
			{
				label: 'A CSRF check from Fetch Metadata',
				code: md(
					"// Follows the OWASP policy: Sec-Fetch-Site first, Origin as the fallback.",
					"const OWN_ORIGIN = 'https://shop.example.com';",
					"const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);",
					"const decide = (req) => {",
					"  if (SAFE.has(req.method)) return 'allow (safe method; make sure no GET changes state)';",
					"  const site = req.headers['sec-fetch-site'];",
					"  if (site === 'same-origin' || site === 'none') return 'allow';",
					"  if (site === 'same-site') return 'extra check: sibling subdomains are not fully trusted';",
					"  if (site === 'cross-site') return 'reject';",
					"  const origin = req.headers['origin'];",
					"  if (origin) return origin === OWN_ORIGIN ? 'allow' : 'reject';",
					"  return 'reject (no origin information)';",
					"};",
					"const reqs = [",
					"  { method: 'POST', headers: { 'sec-fetch-site': 'same-origin' } },",
					"  { method: 'POST', headers: { 'sec-fetch-site': 'cross-site' } },",
					"  { method: 'POST', headers: { origin: 'https://evil.example' } },",
					"  { method: 'POST', headers: { origin: OWN_ORIGIN } },",
					"  { method: 'POST', headers: {} }",
					"];",
					"for (const r of reqs) console.log(JSON.stringify(r.headers).padEnd(42), '->', decide(r));"
				)
			}
		]
	},

	// ───────────────────────── Compliance ─────────────────────────
	{
		id: 'au-token-compliance',
		title: 'Compliance rules for tokens and logs',
		level: 'advanced',
		summary: 'Map session, token, cookie and log handling to GDPR, ePrivacy, PCI DSS, NIST and OWASP ASVS, and know what never to log.',
		scenes: ['au-compliance-map', 'au-consent-cookies', 'au-audit-log'],
		notes: md(
			"Engineering guidance, not legal advice: ask your privacy or compliance lead what applies to you.",
			"",
			"**GDPR.** A session id, a token or a log line that identifies a person is personal data. Article 5 asks for data minimisation, storage limitation and integrity and confidentiality; Article 25 for protection by default; Article 32 for security that suits the risk, including encryption and pseudonymisation; Article 33 for telling the supervisory authority of a breach within 72 hours, where feasible. Chapter V limits transfers outside the EU and EEA, so know where auth data and logs live.",
			"",
			"**ePrivacy and cookies.** Article 5(3) covers storing or reading information on a device. EDPB Guidelines 2/2023 (v2.0, October 2024) say it reaches beyond cookies and can include session identifiers and authentication tokens, so a token in `localStorage` does not escape it. The Article 29 Working Party's Opinion 04/2012 treats a session authentication cookie as strictly necessary (no consent) but not a persistent login cookie, where a remember-me checkbox can ask. Analytics cookies are not exempt.",
			"",
			"**PCI DSS.** Where card data is in scope, requirement 8.4.2 (v4.0.1) asks for multi-factor authentication for all access into the cardholder data environment (PCI SSC FAQ 1591).",
			"",
			"**NIST SP 800-63B-4.** No composition rules, no forced periodic password changes, a blocklist of breached passwords, and session cookies that are `Secure`, narrowly scoped and ideally `HttpOnly` and `__Host-`. At AAL2, at most 24 hours overall and 1 hour idle.",
			"",
			"**OWASP ASVS 5.0.** V3.3 cookies, V7 sessions, V9 tokens, V10 OAuth, V14.3 browser storage, V16 logging.",
			"",
			"**Logs.** Record who, what, when and the result. Never write passwords, access tokens, session ids, keys or card numbers; mask or hash them (OWASP Logging cheat sheet). SOC 2 and ISO 27001 audits look for documented access control, reviews and logging, with criteria set by each framework. Delete sessions, tokens and logs when their purpose ends."
		),
		try: [
			{
				label: 'Redact secrets before logging',
				code: md(
					"// Masks bearer tokens, JWTs, session ids, emails and card-like numbers in a log line.",
					"const redact = (line) =>",
					"  line",
					"    .replace(/Bearer\\s+[A-Za-z0-9._~+\\/-]+=*/g, 'Bearer [token]')",
					"    .replace(/eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]*/g, '[jwt]')",
					"    .replace(/(sid|session|token)=([^\\s;&]+)/gi, '$1=[masked]')",
					"    .replace(/[\\w.+-]+@[\\w-]+\\.[\\w.]+/g, (m) => m[0] + '***@' + m.split('@')[1])",
					"    .replace(/\\b\\d{13,19}\\b/g, (n) => '****' + n.slice(-4));",
					"const lines = [",
					"  'login ok asha@example.com sid=9f3kX7aa',",
					"  'GET /api/orders Authorization: Bearer abc.def-123',",
					"  'refresh with eyJhbGciOi.eyJzdWIiOiIx.sig_abc',",
					"  'payment card 4111111111111111 declined'",
					"];",
					"for (const l of lines) console.log(redact(l));"
				)
			},
			{
				label: 'Does this cookie need consent?',
				code: md(
					"// A rule of thumb based on the 2012 Article 29 Working Party opinion. Counsel decides.",
					"const consent = (cookie) => {",
					"  if (cookie.purpose === 'session') return cookie.persistent ? 'ask first (remember me)' : 'usually no consent';",
					"  if (cookie.purpose === 'login-limit') return 'usually no consent';",
					"  return 'consent needed (analytics, ads, other)';",
					"};",
					"const cookies = [",
					"  { name: '__Host-sid', purpose: 'session', persistent: false },",
					"  { name: 'remember', purpose: 'session', persistent: true },",
					"  { name: 'fail_count', purpose: 'login-limit', persistent: false },",
					"  { name: '_shop_analytics', purpose: 'analytics', persistent: true },",
					"  { name: 'ad_pixel', purpose: 'ads', persistent: true }",
					"];",
					"for (const c of cookies) console.log(c.name.padEnd(16), '->', consent(c));"
				)
			}
		]
	},

	// ───────────────────────── Lifecycle ─────────────────────────
	{
		id: 'au-token-lifecycle-web',
		title: 'A session from login to logout',
		level: 'advanced',
		summary: 'Follow a session end to end: login, requests, timeouts, refresh, step-up, logout, and what to do when a token is stolen.',
		scenes: ['au-login-to-api', 'au-refresh-rotation', 'au-logout-revoke'],
		notes: md(
			"**Login.** The server checks the credentials, then creates a new session id rather than keeping one from before login (OWASP ASVS 7.2.4). That defeats session fixation. It sends the id as a cookie, and responses that carry account data are marked `Cache-Control: no-store` (ASVS 14.3.2).",
			"",
			"**Each request.** The browser sends `Cookie: __Host-sid=...`. The server looks the id up, checks it has not expired and loads the user. Keep the id out of URLs, which end up in logs and history (ASVS 14.2.1).",
			"",
			"**Timeouts.** Two clocks: an idle timeout that resets on activity, and an absolute timeout that does not. OWASP gives 2 to 5 minutes idle for high-value apps and 15 to 30 for low-risk ones, and 4 to 8 hours absolute for a working day. NIST at AAL2 asks for at most 24 hours overall and 1 hour idle. The server enforces them. Expiring the cookie is housekeeping.",
			"",
			"**Refresh.** With short-lived access tokens, keep the refresh token on the server (a BFF) or in an HttpOnly cookie, rotate it on every use, and treat reuse of an old one as theft: revoke the whole family. RFC 9700 asks public clients to rotate or sender-constrain refresh tokens. Cap the total lifetime.",
			"",
			"**Step-up.** Changing the email, MFA settings or other recovery details needs a fresh authentication (ASVS 7.5.1), and so do highly sensitive operations (7.5.3).",
			"",
			"**Logout.** Delete the session on the server, then clear the cookie with `Max-Age=0`. Clearing only the cookie leaves the id valid for anyone who copied it (OWASP, ASVS 7.4.1). Offer to end all sessions, and end the others after a password or MFA change (7.4.3).",
			"",
			"**If a token is stolen.** Revoke that session or token family, force a new login, review the logs, tell the user, and where personal data was exposed follow the breach duties in the compliance topic."
		),
		try: [
			{
				label: 'Rotating refresh tokens with reuse detection',
				code: md(
					"// Each refresh token can be used once. Using an old one revokes the whole family.",
					"const family = { revoked: false, current: 'R1', used: new Set() };",
					"let n = 1;",
					"const refresh = (token) => {",
					"  if (family.revoked) return 'denied: family revoked, log in again';",
					"  if (family.used.has(token)) { family.revoked = true; return 'REPLAY of ' + token + ': whole family revoked'; }",
					"  if (token !== family.current) return 'denied: unknown token';",
					"  family.used.add(token);",
					"  family.current = 'R' + ++n;",
					"  return 'ok: new access token + ' + family.current;",
					"};",
					"console.log('client  ', refresh('R1'));",
					"console.log('client  ', refresh('R2'));",
					"console.log('thief   ', refresh('R2'), '(a copy of R2)');",
					"console.log('client  ', refresh('R3'));"
				)
			}
		]
	}
];

// ───────────────────────── Quiz ─────────────────────────
const t = (topic: string) => builder('AU', topic);

// ── token storage
const ts = t('au-token-storage');
ts.add('basic', 'xss-reads',
	"An attacker injects a script into a product page. Which stored item can that script copy straight away?",
	"An access token kept in localStorage",
	["A session id kept in an HttpOnly cookie", "A refresh token held only on the BFF server", "The hashed password in the user database"],
	"Any script on the page can read localStorage, so one XSS flaw exposes a token kept there. An HttpOnly cookie is hidden from scripts, and a token held on a BFF server or a password hash in the database never reaches the page.");
ts.add('mid', 'bff-role',
	"What does a backend for frontend (BFF) do so that the browser never holds an access token?",
	"It keeps the tokens in a server-side session tied to a cookie",
	["It copies the token into sessionStorage so reloads keep working", "It sends only the refresh token to the page as a JSON field", "It stores the token in a long-lived cookie that scripts can read"],
	"The BFF is the OAuth client. It keeps access and refresh tokens server-side, behind a session cookie, and adds the access token when it forwards API calls. Putting a token in sessionStorage, JSON or a readable cookie hands it back to page scripts.");
ts.add('mid', 'memory-limits',
	"Why is keeping a token only in JavaScript memory not a full answer to XSS?",
	"Injected code in the same page can still use the app's functions to act or get a new token",
	["Browser memory is always written to a file on disk when the tab is closed, where other programs can read it", "Browsers share memory between all open tabs", "Tokens in memory never expire on their own"],
	"Memory shortens how long a stolen token is useful, since a reload clears it, but an injected script runs as the page. It can call the code that holds the token or start a new flow. The other options describe things browsers do not do.");
ts.add('mid', 'jwt-storage',
	"A team stores a 24-hour JWT in localStorage so the API can stay stateless. What problem does that create?",
	"Any injected script can copy it and use it elsewhere until it expires",
	["The signature stops validating once the page is reloaded, because the key changes between page loads", "A JWT cannot be sent in an Authorization header", "The browser deletes localStorage after one hour"],
	"A JWT is just a token format. Stored in localStorage it is readable by any script, and a stateless 24-hour token is hard to revoke. The signature, header use and storage lifetime are unaffected by where it is kept.");
ts.add('advanced', 'rfc10017-order',
	"RFC 10017 ranks three architectures for OAuth in browser apps. Which order goes from most to least secure?",
	"BFF, then token-mediating backend, then browser-based OAuth client",
	["Browser-based OAuth client, then token-mediating backend, then BFF", "Token-mediating backend, then BFF, then browser-based OAuth client", "All three are equally secure as long as HTTPS is used on every connection they make"],
	"The RFC lists the patterns in decreasing order of security: a BFF exposes no tokens to the browser, a token-mediating backend still hands the access token to the page, and a browser-only client exposes everything. HTTPS does not change that.");

// ── cookies
const ck = t('au-cookies');
ck.add('basic', 'httponly',
	"What does the HttpOnly attribute stop?",
	"Page scripts reading the cookie through document.cookie",
	["The browser sending the cookie with requests to the server", "The cookie being used over plain HTTP connections", "Other sites making requests that include the cookie"],
	"HttpOnly hides the cookie from JavaScript, so an XSS script cannot copy a session id. The browser still sends it with requests. Keeping it off plain HTTP is Secure, and cross-site requests are handled by SameSite.");
ck.add('basic', 'remaining-risk',
	"A session cookie is set with Secure and SameSite=Lax but without HttpOnly. What is the clearest remaining risk?",
	"An injected script can read it with document.cookie",
	["It is sent over plain HTTP on public Wi-Fi", "Any subdomain can read it because Domain is required", "It disappears when the user opens a second tab"],
	"Secure keeps the cookie off plain HTTP, so the Wi-Fi option is wrong. Domain is optional and a second tab does not clear a cookie. Without HttpOnly, a script that runs in the page can still read and send the session id.");
ck.add('mid', 'host-prefix',
	"What does naming a cookie __Host-sid guarantee, if the browser accepts it?",
	"It is Secure, has no Domain and uses Path=/, so only the exact host sets it",
	["The browser encrypts the cookie value with a per-site key before it is written to the cookie store on disk", "HttpOnly is added to the cookie automatically by the browser", "The cookie is also sent on cross-site requests from other hosts"],
	"The __Host- prefix is enforced by the browser: it rejects the cookie unless it is Secure, has no Domain and Path=/. That stops subdomains from setting or overwriting it. It does not encrypt the value, add HttpOnly or change SameSite behaviour.");
ck.add('mid', 'samesite-lax',
	"Which request does SameSite=Lax still send the cookie with?",
	"A top-level navigation from another site, such as following a link",
	["A cross-site fetch() call that uses the POST method", "A hidden form POST that another site submits automatically on the user's behalf", "A request for an image embedded in another site's page"],
	"Lax sends the cookie on top-level navigations that use a safe method, like clicking a link. It withholds it from cross-site POSTs, form submissions and subresource requests such as images or fetches, which is why it helps against CSRF.");
ck.add('advanced', 'domain-risk',
	"Why is setting Domain=example.com on a session cookie risky?",
	"Every subdomain receives it, so a weak or taken-over subdomain can attack the session",
	["It makes the cookie readable by scripts again", "Browsers silently ignore the Secure attribute for any cookie that also carries a Domain attribute", "It forces the cookie to expire when the tab closes"],
	"With Domain the cookie is shared with all subdomains, so a vulnerable or abandoned one can read, set or fixate it. Domain has no effect on HttpOnly or Secure and does not change the lifetime. Leaving Domain off pins the cookie to the exact host.");

// ── CSRF, CORS, XSS
const cx = t('au-csrf-cors-xss');
cx.add('basic', 'csrf-what',
	"A hidden form on another site posts to your /account/email endpoint, and the browser adds the user's session cookie. What is this attack called?",
	"Cross-site request forgery",
	["Cross-site scripting through an injected script tag", "A CORS preflight failure", "Session fixation"],
	"CSRF tricks a logged-in browser into sending a request the user did not intend, using cookies the browser attaches by itself. XSS runs attacker script in your page, a preflight failure is a browser CORS error, and fixation plants a session id.");
cx.add('mid', 'cors-meaning',
	"A server sends Access-Control-Allow-Origin for one origin. What does that give it?",
	"A browser rule that lets scripts from that origin read its responses",
	["Proof that every request from that origin comes from a signed-in user", "Protection from forged form posts sent from other sites", "Encryption of the response while it travels"],
	"CORS tells the browser which origins may read a response. It does not identify the user, it does not block a plain form post from reaching the server, and it has nothing to do with encrypting the connection.");
cx.add('mid', 'sec-fetch',
	"A state-changing POST arrives with Sec-Fetch-Site: cross-site. What does the OWASP Fetch Metadata policy do by default?",
	"It rejects the request, because unsafe methods from other sites are untrusted",
	["It accepts the request whenever a valid session cookie is present", "It accepts the request whenever the Referer header is missing or has been stripped by a proxy", "It redirects the request to the login page and replays it afterwards"],
	"OWASP's policy rejects non-safe methods when Sec-Fetch-Site is cross-site. A valid cookie is exactly what a forged request carries, a missing Referer says nothing, and replaying after login would make the forgery succeed.");
cx.add('mid', 'samesite-gap',
	"Why is SameSite=Lax alone not enough against CSRF?",
	"It still sends on top-level GET navigations, and sibling subdomains count as same-site",
	["Lax cookies are not sent with any request in modern browsers", "Lax only works when the cookie has no Secure attribute", "Browsers ignore the Lax value completely on every site that is served over HTTPS connections"],
	"Lax permits the cookie on top-level navigations with safe methods, so any GET that changes state is exposed. SameSite is scoped to the site, so a taken-over sibling subdomain is still same-site. It is a useful layer, not a full defence.");
cx.add('advanced', 'xss-vs-csrf',
	"An attacker has found an XSS flaw on your site. What does that do to your CSRF defences?",
	"It can defeat them, because the script runs inside your own origin",
	["Nothing, since anti-CSRF tokens are unreadable to scripts", "They still hold, as long as the cookie is HttpOnly", "They are strengthened, because every forged request then becomes a harmless same-origin request"],
	"OWASP warns that XSS can defeat every CSRF mitigation: the injected script can read tokens from the page and send same-origin requests. HttpOnly protects the cookie value but does not stop the script from making requests.");

// ── compliance
const cp = t('au-token-compliance');
cp.add('basic', 'never-log',
	"Which item should an application never write to its logs in readable form?",
	"An access token",
	["The HTTP status code of a request", "The time of a login attempt", "The name of the endpoint that was called"],
	"Tokens, session ids, passwords, keys and card numbers should be removed, masked or hashed before logging, because a leaked log would hand them to an attacker. Status codes, timestamps and endpoint names are normal audit data.");
cp.add('mid', 'gdpr-72',
	"A token store is breached and users are at risk. What time limit does GDPR Article 33 set for notifying the authority, where feasible?",
	"72 hours after becoming aware of the breach",
	["24 hours after the first user complaint arrives", "30 days after the next annual audit", "Only once every affected user has been told"],
	"Article 33 asks the controller to notify the supervisory authority without undue delay and, where feasible, within 72 hours of becoming aware, unless the breach is unlikely to risk people's rights. It is not tied to audits or to telling users first.");
cp.add('mid', 'consent-session',
	"Under the Article 29 Working Party's cookie opinion, which cookie usually needs no consent?",
	"A first-party session cookie that keeps the user logged in",
	["A persistent login cookie that keeps the user signed in for 30 days across browser restarts", "An analytics cookie set by the shop itself", "An advertising cookie set when the user logs in"],
	"A session authentication cookie is strictly necessary for the service the user asked for. A persistent login cookie is not exempt, and analytics or advertising cookies are not strictly necessary, even if they are first-party or set at login.");
cp.add('advanced', 'localstorage-eprivacy',
	"Does keeping an auth token in localStorage instead of a cookie avoid ePrivacy Article 5(3)?",
	"No, the EDPB says the article covers more than cookies, including tokens",
	["Yes, because that article applies only to cookies", "Yes, as long as the token is a JWT", "No, but only for tokens that last longer than one day, since short tokens are never covered"],
	"EDPB Guidelines 2/2023 explain that Article 5(3) is technology neutral and can reach session identifiers and authentication tokens. Whether consent is needed then depends on the exemptions, not on the storage mechanism or token format.");
cp.add('advanced', 'nist-passwords',
	"Which password rule does NIST SP 800-63B-4 say verifiers shall NOT impose?",
	"Forced periodic password changes",
	["Checking new passwords against a blocklist", "A minimum length for passwords used alone", "A forced change when a password is known to be compromised"],
	"NIST says verifiers shall not require periodic changes or impose composition rules, but shall use a blocklist, require minimum lengths and force a change when there is evidence of compromise. Periodic rotation without a reason adds little.");

// ── lifecycle
const lc = t('au-token-lifecycle-web');
lc.add('basic', 'logout-server',
	"A site logs users out by only deleting the cookie in the browser. What risk remains?",
	"A copied session id still works until the server drops it",
	["The user can no longer log in again", "The cookie comes back on the next page load", "The password is left in the browser history, where anyone using the same computer can read it"],
	"Clearing the cookie only tidies the browser. If the session record survives on the server, anyone who copied the id can still use it. Ending the session means deleting it server-side; the cookie then has nothing to open.");
lc.add('mid', 'new-id',
	"Why should the server issue a new session id when the user logs in?",
	"So an id planted before login is useless afterwards",
	["So the id becomes shorter, which makes it quicker for the server to look up in the store", "Because ids may be used only once per day", "To let scripts read the cookie after login"],
	"If the id stayed the same, an attacker who set it earlier (session fixation) would share the user's logged-in session. A fresh random id after authentication removes that. Length, daily limits and script access are unrelated.");
lc.add('mid', 'two-timeouts',
	"What is the difference between an idle timeout and an absolute timeout?",
	"Idle resets with activity; absolute ends the session at a fixed time regardless",
	["Idle applies to cookies, absolute applies to tokens", "Absolute resets on every click or request the user makes, while idle never resets at all", "They are the same value, set in two places"],
	"An idle timeout ends a session after a period without activity, and activity resets it. An absolute timeout caps the total lifetime and is never reset. Both are enforced on the server, for cookies and tokens alike.");
lc.add('advanced', 'reuse-detect',
	"A rotated refresh token is presented a second time. What should the server do?",
	"Treat it as theft and revoke the whole token family",
	["Issue a fresh pair, since the client might have retried", "Ignore it and keep the newest token valid", "Accept it once more, then delete it"],
	"Rotation makes each refresh token single-use. A second presentation means two parties hold it. The server cannot tell which is the attacker, so RFC 9700 describes revoking the active token, which forces a fresh login for both.");
lc.add('advanced', 'step-up',
	"Which action should usually ask for fresh authentication even in a valid session?",
	"Changing the email address or MFA settings",
	["Viewing the product list", "Adding another item to the shopping cart before checkout", "Reading the help page"],
	"OWASP ASVS asks for re-authentication before changes that affect login or recovery, such as email, phone or MFA settings, because a hijacked session could otherwise lock the owner out. Browsing and cart actions are low risk.");

export const banks: { out: Question[] }[] = [ts, ck, cx, cp, lc];
