import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');
// Exercise snippets are plain deterministic JavaScript (String.raw; no backticks or dollar-brace inside).

export const topics: DbTopic[] = [
	// ───────────────────────── Node.js ─────────────────────────
	{
		id: 'iv-nodejs',
		title: 'Node.js internals',
		level: 'basic',
		summary: 'Explain the event loop, streams, worker threads versus cluster, and how a Node service fails and shuts down safely.',
		scenes: [],
		notes: md(
			'**Q. Node is single-threaded, so how does it handle thousands of connections?** `SDE 1`',
			'Your JavaScript runs on one thread, but network and file I/O is handed to the operating system or to libuv, and a callback is queued when it finishes. While waiting, the thread serves other requests. It scales for I/O-heavy work and not for CPU-heavy work.',
			'',
			'**Q. Name the event loop phases in order.** `SDE 1`',
			'timers (setTimeout, setInterval), pending callbacks, idle/prepare, poll (I/O), check (setImmediate), close callbacks. Between callbacks Node drains `process.nextTick` first, then the promise microtask queue.',
			'',
			'**Q. What prints first: setTimeout 0, setImmediate, a resolved promise, process.nextTick?** `SDE 1`',
			'Synchronous code, then nextTick, then promise callbacks, then the macrotasks. From the main module, timeout versus immediate is not guaranteed. Inside an I/O callback, setImmediate always wins.',
			'',
			'**Q. Promise.all versus Promise.allSettled?** `SDE 1`',
			'`all` rejects as soon as one promise rejects (the others keep running, you just stop waiting). `allSettled` waits for all and reports each outcome. Use `allSettled` when partial success is acceptable, such as sending several notifications.',
			'',
			'**Q. What blocks the event loop?** `SDE 1`',
			'Any long synchronous work: big JSON.parse, sync fs or crypto calls, regex with catastrophic backtracking, tight loops over huge arrays. While it runs, no other request is served and health checks time out.',
			'',
			'**Q. What are the four stream types and why use streams?** `SDE 1`',
			'Readable, Writable, Duplex and Transform. Streams process data in chunks, so a 2 GB file uses a few KB of memory instead of loading fully, and the first bytes can be sent before the last are read. Prefer `pipeline` from `node:stream/promises` to wire them.',
			'',
			'**Q. How do you handle errors in async code?** `SDE 1`',
			'Use try/catch around `await`. A rejected promise with no handler fires `unhandledRejection`, which crashes modern Node by default. Never swallow errors: log with context, then rethrow or map to a response. In Express 4, async handler errors need to be forwarded to `next(err)`.',
			'',
			'**Q. CommonJS versus ES modules?** `SDE 1`',
			'CommonJS uses `require` and loads synchronously. ESM uses `import`, is static (so tools can tree-shake), and supports top-level await. A package opts into ESM with `"type": "module"` or the .mjs extension.',
			'',
			'**Q. What is backpressure and how does Node handle it?** `SDE 2`',
			'It is the signal that a consumer is slower than the producer. `writable.write()` returns false when the internal buffer passes `highWaterMark`; the producer should pause until the `drain` event. `pipe` and `pipeline` do this automatically. Ignoring it makes memory grow without bound.',
			'Follow-up: what happens if you do `readable.on("data", d => slowWrite(d))` with no pause? The whole backlog sits in memory.',
			'',
			'**Q. Cluster versus worker threads, and when do you use each?** `SDE 2`',
			'Cluster forks processes, each with its own V8 and memory, sharing one listening port: use it to use all cores for an I/O server (often replaced today by running several containers). Worker threads share the process, can transfer buffers or use SharedArrayBuffer, and suit CPU work such as image resizing or hashing. Neither helps if the bottleneck is the database.',
			'Follow-up: how do cluster workers share state? They do not; use Redis or the database.',
			'',
			'**Q. What is the libuv thread pool?** `SDE 2`',
			'A pool (default 4 threads, set with `UV_THREADPOOL_SIZE`) that runs blocking work for fs, dns.lookup, zlib and some crypto such as pbkdf2. Sockets do not use it. If many slow crypto or fs calls queue up, unrelated requests wait.',
			'',
			'**Q. How do you shut a server down gracefully?** `SDE 2`',
			'On SIGTERM: stop accepting new connections (`server.close`), let in-flight requests finish, close the database and queue clients, then `process.exit`. Add a hard timeout so a stuck request cannot block the deploy. Mark the readiness probe failing first so the load balancer stops routing.',
			'',
			'**Q. A service slowly uses more memory until it is killed. How do you investigate?** `SDE 2`',
			'Confirm it is growth, not load, with heap metrics. Take heap snapshots at two times (`--inspect`, Chrome DevTools) and compare retained objects. Usual causes: unbounded caches or Maps, listeners added per request and never removed, closures holding large objects, timers never cleared.',
			'',
			'**What interviewers look for:** a correct mental model of the loop, knowing what blocks it, and production habits such as backpressure, error handling and graceful shutdown.'
		),
		try: [
			{
				label: 'Exercise: predict the order',
				code: String.raw`// Exercise: write down the order you expect BEFORE running. Then run and compare.
// Rule of thumb: sync code, then nextTick, then promise callbacks, then timers.
console.log('1 start');
setTimeout(() => console.log('2 timeout 0'), 0);
Promise.resolve().then(() => console.log('3 promise'));
process.nextTick(() => console.log('4 nextTick'));
(async () => {
  console.log('5 async fn body runs synchronously until the first await');
  await null;
  console.log('6 after await (a microtask)');
})();
console.log('7 end');`
			},
			{
				label: 'Exercise: concurrency limiter',
				code: String.raw`// Exercise: run async jobs with at most 'limit' at a time (like a worker pool).
// TODO: the loop below runs one job per worker. Change LIMIT to 3 and confirm the peak never exceeds it.
const LIMIT = 1;
let running = 0, peak = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function job(id) {
  running++; peak = Math.max(peak, running);
  await sleep(5);
  running--;
  return id * 2;
}
async function pool(ids, limit) {
  const results = [];
  let next = 0;
  async function worker() {
    while (next < ids.length) {
      const i = next++;
      results[i] = await job(ids[i]);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}
(async () => {
  const out = await pool([1, 2, 3, 4, 5, 6], LIMIT);
  console.log('results', out, 'peak concurrency', peak);
})();`
			},
			{
				label: 'Exercise: backpressure model',
				code: String.raw`// Exercise: a toy writable with a high-water mark. write() returns false when the buffer is full.
// TODO: change PAUSE_ON_FALSE to true and compare the maximum buffered size.
const PAUSE_ON_FALSE = false;
const HWM = 3;
let buffered = 0, maxBuffered = 0, written = 0;
const sink = {
  write() { buffered++; maxBuffered = Math.max(maxBuffered, buffered); return buffered < HWM; },
  flush() { written += buffered; buffered = 0; },
};
const chunks = Array.from({ length: 10 }, (_, i) => i);
for (const c of chunks) {
  const ok = sink.write(c);
  if (!ok && PAUSE_ON_FALSE) sink.flush(); // the 'drain' event in real streams
}
sink.flush();
console.log('written', written, 'max buffered', maxBuffered);`
			}
		]
	},
	// ───────────────────────── Express / NestJS ─────────────────────────
	{
		id: 'iv-nestjs-express',
		title: 'Express and NestJS',
		level: 'basic',
		summary: 'Explain middleware, the NestJS request lifecycle, dependency injection, modules and validation.',
		scenes: [],
		notes: md(
			'**Q. What is middleware in Express?** `SDE 1`',
			'A function `(req, res, next)` that runs in order. It can read or change the request, end the response, or call `next()` to pass on. Order matters: body parsing and auth must be registered before the routes that need them.',
			'',
			'**Q. How do you handle errors in Express?** `SDE 1`',
			'An error middleware has four arguments `(err, req, res, next)` and is registered last. Synchronous throws reach it automatically; in Express 4 rejected promises must be passed with `next(err)` (Express 5 forwards them). Return a consistent error shape and never leak stack traces.',
			'',
			'**Q. Why NestJS over plain Express?** `SDE 1`',
			'It adds structure: modules, controllers, providers, dependency injection, decorators and built-in validation and testing helpers. That helps large teams keep code consistent. It runs on Express or Fastify underneath.',
			'',
			'**Q. What are modules, controllers and providers?** `SDE 1`',
			'A controller maps routes to handlers. A provider (usually a service) holds logic and is injectable. A module groups them, lists what it `imports`, and what it `exports` for others to use.',
			'',
			'**Q. How does dependency injection work in Nest?** `SDE 1`',
			'You declare a dependency in the constructor and the container supplies a singleton instance. This makes services easy to replace with a mock in tests. A provider must be listed in a module, and a module must export it before another module can inject it.',
			'',
			'**Q. Guard, pipe, interceptor, filter: what does each do?** `SDE 1`',
			'Guard: allow or deny (auth, roles). Pipe: validate or transform input. Interceptor: wrap the handler to log, time, cache or reshape the response. Exception filter: turn thrown errors into responses.',
			'',
			'**Q. Give the request lifecycle order.** `SDE 2`',
			'Middleware, guards, interceptors (before), pipes, handler, interceptors (after, reverse order), exception filters if something threw. Global runs before controller, then route level.',
			'Follow-up: where would you put request logging with timing? An interceptor, since it sees both before and after.',
			'',
			'**Q. How do you validate request bodies?** `SDE 1`',
			'Declare a DTO class with `class-validator` decorators and enable a global `ValidationPipe` with `whitelist: true` (strips unknown fields) and `transform: true`. Add `forbidNonWhitelisted` to reject extras. Validation of types at the edge, business rules in services.',
			'',
			'**Q. Explain provider scopes.** `SDE 2`',
			'DEFAULT is one shared instance. REQUEST creates a new instance per request, and every provider depending on it becomes request-scoped too, which costs performance. TRANSIENT gives each consumer its own instance. Prefer default scope and pass request data as arguments or via AsyncLocalStorage.',
			'',
			'**Q. How do you resolve a circular dependency?** `SDE 2`',
			'Best fix is to redesign: extract the shared logic to a third service. If unavoidable, use `forwardRef(() => X)` on both sides (and for modules). A circular import often shows as an undefined injected class.',
			'',
			'**Q. How do you unit test a Nest service?** `SDE 2`',
			'Use `Test.createTestingModule`, provide the service and replace its dependencies with mock providers via `useValue`. For HTTP-level tests, use supertest against the app. Keep database tests separate and few.',
			'',
			'**Q. How do you do auth in Nest?** `SDE 2`',
			'A strategy (for example Passport JWT) validates the token and a guard applies it. Mark public routes with a custom decorator and a global guard that reads it with `Reflector`. Role checks are a second guard.',
			'',
			'**What interviewers look for:** you know the lifecycle order, can say which tool fits which job, and keep controllers thin with logic in testable services.'
		),
		try: [
			{
				label: 'Exercise: middleware chain',
				code: String.raw`// Exercise: a tiny Express-style chain. Each middleware calls next() or stops the request.
// TODO: add an auth middleware that stops the chain with status 401 when req.user is missing, then try both requests.
function run(middlewares, req) {
  const res = { status: 200, log: [] };
  let i = 0;
  const next = (err) => {
    if (err) { res.status = 500; res.log.push('error: ' + err.message); return; }
    const mw = middlewares[i++];
    if (mw) mw(req, res, next);
  };
  next();
  return res;
}
const logger = (req, res, next) => { res.log.push('log ' + req.path); next(); };
const handler = (req, res, next) => { res.log.push('handler'); };
console.log(run([logger, handler], { path: '/orders' }));
console.log(run([logger, (req, res) => { res.status = 401; res.log.push('blocked'); }, handler], { path: '/orders' }));`
			},
			{
				label: 'Exercise: DI container',
				code: String.raw`// Exercise: a minimal dependency injection container with singleton providers.
// TODO: replace the real mailer with a fake one the way a unit test would, and check the service output.
class Container {
  constructor() { this.factories = new Map(); this.cache = new Map(); }
  provide(name, factory) { this.factories.set(name, factory); }
  get(name) {
    if (!this.cache.has(name)) this.cache.set(name, this.factories.get(name)(this));
    return this.cache.get(name);
  }
}
const c = new Container();
c.provide('mailer', () => ({ send: (to) => 'real mail sent to ' + to }));
c.provide('orders', (ct) => ({ place: (user) => ct.get('mailer').send(user) }));
console.log(c.get('orders').place('a@example.com'));
c.provide('mailer', () => ({ send: (to) => 'FAKE mail to ' + to }));
c.cache.clear();
console.log(c.get('orders').place('a@example.com'));
console.log('same instance each time:', c.get('orders') === c.get('orders'));`
			},
			{
				label: 'Exercise: validation pipe',
				code: String.raw`// Exercise: whitelist and validate a body like ValidationPipe does.
// TODO: add a rule that quantity must be a whole number between 1 and 10, then test a body with quantity 11.
const schema = { sku: (v) => typeof v === 'string' && v.length > 0, quantity: (v) => typeof v === 'number' };
function validate(body) {
  const errors = [], clean = {};
  for (const key of Object.keys(schema)) {
    if (!schema[key](body[key])) errors.push(key + ' is invalid');
    else clean[key] = body[key];
  }
  return { errors, clean };
}
console.log(validate({ sku: 'A1', quantity: 2, isAdmin: true }));
console.log(validate({ sku: '', quantity: 'x' }));`
			}
		]
	},
	// ───────────────────────── API design ─────────────────────────
	{
		id: 'iv-api-design',
		title: 'REST and API design',
		level: 'mid',
		summary: 'Design safe, predictable APIs: status codes, idempotency, pagination, versioning, rate limiting and error shapes.',
		scenes: [],
		notes: md(
			'**Q. Which HTTP methods are safe and which are idempotent?** `SDE 1`',
			'Safe (no state change): GET, HEAD, OPTIONS. Idempotent (same effect if repeated): GET, PUT, DELETE, HEAD. POST is neither, and PATCH is not guaranteed to be idempotent.',
			'',
			'**Q. Pick status codes: created, bad input, not logged in, not allowed, missing, conflict, too many requests.** `SDE 1`',
			'201 with a Location header, 400 (or 422 for failed validation), 401, 403, 404, 409, 429. Use 204 for success with no body. 5xx means the server failed, not the client.',
			'',
			'**Q. PUT versus PATCH?** `SDE 1`',
			'PUT replaces the whole resource, PATCH changes only the fields sent. A repeated PUT gives the same result, so it is idempotent.',
			'',
			'**Q. How do you name endpoints?** `SDE 1`',
			'Nouns and plurals, hierarchy for ownership: `GET /orders/42/items`. The verb is the HTTP method. For actions that are not CRUD, a sub-resource such as `POST /orders/42/cancel` is fine.',
			'',
			'**Q. Offset versus cursor pagination?** `SDE 1`',
			'Offset (`?page=3&limit=20`) is simple and allows jumping to a page, but gets slow on large offsets and skips or repeats rows when data changes. Cursor (`?after=<token>`) uses the last seen key, stays fast with an index and is stable, but cannot jump to page N. Return `nextCursor` in the body.',
			'Follow-up: how do you make a cursor stable when sorting by created time? Sort by (created_at, id) and use both in the cursor to break ties.',
			'',
			'**Q. What is a good error response?** `SDE 1`',
			'One consistent shape: a machine-readable `code`, a human `message`, optional field details, and a request id for support. RFC 9457 problem details is a standard form. Never include stack traces or SQL.',
			'',
			'**Q. How do you make a POST safe to retry?** `SDE 2`',
			'The client sends an `Idempotency-Key` header (a unique value per attempt at one operation). The server stores the key with the response in a unique-constrained row; a repeat returns the stored response instead of charging twice. Keys expire after a day or so, and the same key with a different body is rejected.',
			'Follow-up: what if two identical requests arrive at the same moment? The unique constraint lets one win and the other waits or gets 409.',
			'',
			'**Q. How do you version an API?** `SDE 2`',
			'Common options: a path prefix (`/v1`), a header, or media type. Path is the most visible and easiest to route and cache. Prefer additive, backward-compatible changes so a new version is rare, and announce deprecation with a date and a Sunset header.',
			'',
			'**Q. How would you implement rate limiting?** `SDE 2`',
			'Token bucket: a bucket refills at a steady rate and each request takes a token, allowing short bursts. Keep counters in Redis, keyed by user, API key or IP, updated atomically (a Lua script or INCR with expiry). Reply 429 with `Retry-After` and rate-limit headers. Fixed windows allow a double burst at the boundary; sliding windows smooth it.',
			'',
			'**Q. How do you use caching headers and conditional requests?** `SDE 2`',
			'Send `ETag` or `Last-Modified`; the client repeats with `If-None-Match` and gets 304 with no body when unchanged. `Cache-Control` sets lifetime and whether shared caches may store it. Use `private` for user-specific data.',
			'',
			'**Q. How do you prevent lost updates on a PUT?** `SDE 2`',
			'Optimistic concurrency: return a version or ETag, require `If-Match` on update, and answer 412 (or 409) if it changed. The client re-reads and retries.',
			'',
			'**Q. REST versus GraphQL versus gRPC?** `SDE 2`',
			'REST: simple, cacheable, universal. GraphQL: clients pick fields, fewer round trips, but needs query cost limits and is harder to cache. gRPC: typed, compact, fast for internal service calls, poor browser support. Choose by consumer, not fashion.',
			'',
			'**What interviewers look for:** correct semantics, thinking about retries, failures and growth, and being able to explain a tradeoff in one sentence.'
		),
		try: [
			{
				label: 'Exercise: idempotency key',
				code: String.raw`// Exercise: make charge() safe to retry using an idempotency key.
// TODO: also reject a repeated key whose amount differs (return an error object instead of the stored response).
const store = new Map();
let charges = 0;
function charge(key, amount) {
  if (store.has(key)) return { ...store.get(key), replay: true };
  charges++;
  const res = { id: 'ch_' + charges, amount };
  store.set(key, res);
  return res;
}
console.log(charge('k1', 500));
console.log(charge('k1', 500));
console.log(charge('k2', 700));
console.log('real charges made:', charges);`
			},
			{
				label: 'Exercise: cursor pagination',
				code: String.raw`// Exercise: keyset pagination over rows sorted by (createdAt, id).
// TODO: change PAGE to 3 and check that no row repeats or goes missing.
const PAGE = 2;
const rows = [
  { id: 1, createdAt: 10 }, { id: 2, createdAt: 10 }, { id: 3, createdAt: 11 },
  { id: 4, createdAt: 12 }, { id: 5, createdAt: 12 },
];
const after = (r, cur) => !cur || r.createdAt > cur.createdAt || (r.createdAt === cur.createdAt && r.id > cur.id);
function page(cursor) {
  const items = rows.filter((r) => after(r, cursor)).slice(0, PAGE);
  const last = items[items.length - 1];
  return { ids: items.map((r) => r.id), next: items.length === PAGE ? { createdAt: last.createdAt, id: last.id } : null };
}
let p = page(null);
while (true) {
  console.log(p.ids);
  if (!p.next) break;
  p = page(p.next);
}`
			},
			{
				label: 'Exercise: token bucket',
				code: String.raw`// Exercise: a token bucket with a fake clock so the output is deterministic.
// TODO: raise capacity to 5 and see how the burst of 6 requests changes.
function bucket(capacity, refillPerSec) {
  let tokens = capacity, last = 0;
  return (nowMs) => {
    tokens = Math.min(capacity, tokens + ((nowMs - last) / 1000) * refillPerSec);
    last = nowMs;
    if (tokens >= 1) { tokens -= 1; return 200; }
    return 429;
  };
}
const allow = bucket(3, 1);
const times = [0, 0, 0, 0, 0, 1000, 1000, 2500];
console.log(times.map((t) => t + 'ms:' + allow(t)).join('  '));`
			}
		]
	},
	// ───────────────────────── Auth and security ─────────────────────────
	{
		id: 'iv-auth-security',
		title: 'Authentication and security',
		level: 'mid',
		summary: 'Compare sessions and JWTs, explain OAuth2 and OIDC, and defend against the common web attacks.',
		scenes: [],
		notes: md(
			'**Q. Authentication versus authorization?** `SDE 1`',
			'Authentication proves who you are (401 when missing or invalid). Authorization decides what you may do (403 when denied).',
			'',
			'**Q. How do you store passwords?** `SDE 1`',
			'Never plain text or a fast hash like SHA-256. Use a slow, salted password hash: argon2id, bcrypt or scrypt. The salt is unique per user and stored with the hash. A cost factor makes brute force expensive.',
			'',
			'**Q. Session versus JWT?** `SDE 1`',
			'A session stores state on the server and the client holds an opaque id in a cookie: easy to revoke, needs a shared store when scaled. A JWT is a signed token carrying claims: no lookup, works across services, but cannot be revoked before it expires without extra state. Short expiry plus refresh solves most of it.',
			'',
			'**Q. What is inside a JWT and what must you check?** `SDE 1`',
			'Header, payload (claims such as `sub`, `exp`, `aud`, `iss`) and signature. It is signed, not encrypted: anyone can read it, so no secrets inside. Verify the signature with a pinned algorithm, plus `exp`, `iss` and `aud`.',
			'',
			'**Q. What are XSS and CSRF, and how do you prevent them?** `SDE 1`',
			'XSS: attacker script runs in your page. Escape output (frameworks do by default), avoid `innerHTML`, set a Content-Security-Policy, use HttpOnly cookies. CSRF: another site makes the browser send your cookie to you. Use SameSite cookies and anti-CSRF tokens on state-changing requests.',
			'',
			'**Q. What is SQL injection and the fix?** `SDE 1`',
			'Input becomes part of a query. Use parameterized queries or an ORM, never string concatenation. Validate input and use a database user with least privilege.',
			'',
			'**Q. Walk through the OAuth2 authorization code flow.** `SDE 2`',
			'The app redirects to the provider with `client_id`, `redirect_uri`, scope and `state`. The user signs in and consents. The provider redirects back with a one-time code. The backend exchanges the code (plus client secret, or a PKCE verifier) for an access token. Check `state` to stop CSRF. Public clients such as SPAs and mobile apps must use PKCE.',
			'Follow-up: why not the implicit flow? Tokens in the URL leak; it is discouraged.',
			'',
			'**Q. OAuth2 versus OIDC versus SSO?** `SDE 2`',
			'OAuth2 is delegated authorization (access tokens for APIs). OIDC adds an identity layer on top: an ID token (a JWT) saying who signed in. SSO is the outcome: one login across apps, built with OIDC or SAML through an identity provider.',
			'',
			'**Q. How do refresh tokens work and how do you keep them safe?** `SDE 2`',
			'A short-lived access token (minutes) is renewed with a long-lived refresh token. Rotate on every use and invalidate the old one; if an old one is reused, revoke the whole family because it was likely stolen. Store server-side hashed, and keep it in an HttpOnly cookie in browsers.',
			'',
			'**Q. Where should a browser app keep tokens?** `SDE 2`',
			'localStorage is readable by any injected script. An HttpOnly, Secure, SameSite cookie cannot be read by script but needs CSRF protection. Many teams choose the cookie. Neither fixes XSS itself, which still lets an attacker make requests.',
			'',
			'**Q. How do you manage secrets?** `SDE 2`',
			'Keep them out of code and images: use a secrets manager or environment injection, scope them by service, rotate regularly, and never log them. If one is committed, rotating it is mandatory; deleting the commit is not enough.',
			'',
			'**Q. What else belongs in a baseline API hardening list?** `SDE 2`',
			'HTTPS and HSTS, rate limiting and lockout on login, input validation, authorization checks on every object (to prevent IDOR), CORS limited to known origins, dependency updates, and audit logs.',
			'',
			'**What interviewers look for:** you can compare tradeoffs instead of naming one answer, and you think about revocation, theft and abuse.'
		),
		try: [
			{
				label: 'Exercise: decode and check a JWT',
				code: String.raw`// Exercise: a JWT payload is only base64url-encoded, not secret. Decode it and apply the checks.
// TODO: change the clock so the token is expired and watch the check fail.
const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const token = enc({ alg: 'HS256' }) + '.' + enc({ sub: 'u1', iss: 'auth.example', aud: 'api', exp: 2000 }) + '.sig';
const NOW = 1500;
function check(tok, now) {
  const [h, p] = tok.split('.');
  const header = JSON.parse(Buffer.from(h, 'base64url').toString());
  const claims = JSON.parse(Buffer.from(p, 'base64url').toString());
  if (header.alg !== 'HS256') return 'reject: unexpected algorithm';
  if (claims.exp <= now) return 'reject: expired';
  if (claims.iss !== 'auth.example' || claims.aud !== 'api') return 'reject: wrong issuer or audience';
  return 'ok for ' + claims.sub;
}
console.log(check(token, NOW));
console.log(check(token, 2500));`
			},
			{
				label: 'Exercise: refresh token rotation',
				code: String.raw`// Exercise: rotate refresh tokens and detect reuse of an old one.
// TODO: after reuse is detected, make sure even the newest token of that family is revoked (it already is: verify it).
let n = 0;
const live = new Map(); // token -> family
const used = new Set();
const revokedFamilies = new Set();
function issue(family) { const t = 'rt' + ++n; live.set(t, family); return t; }
function refresh(t) {
  if (used.has(t)) { revokedFamilies.add(live.get(t)); return 'REUSE detected: family revoked'; }
  const fam = live.get(t);
  if (!fam || revokedFamilies.has(fam)) return 'denied';
  used.add(t);
  return 'new token ' + issue(fam);
}
const first = issue('F1');
console.log(refresh(first));
console.log(refresh(first));
console.log(refresh('rt2'));`
			},
			{
				label: 'Exercise: escape output',
				code: String.raw`// Exercise: why output escaping stops XSS. Predict the output, then run.
// TODO: add the single quote character to the escape table.
const table = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => table[c]);
const comment = '<img src=x onerror="alert(1)">';
console.log('unsafe:', '<p>' + comment + '</p>');
console.log('safe:  ', '<p>' + escapeHtml(comment) + '</p>');`
			}
		]
	},
	// ───────────────────────── Python / FastAPI ─────────────────────────
	{
		id: 'iv-python-fastapi',
		title: 'Python and FastAPI',
		level: 'mid',
		summary: 'Explain async in FastAPI, dependency injection, Pydantic models, the GIL and how SQLAlchemy sessions fit a request.',
		scenes: [],
		notes: md(
			'**Q. Why is FastAPI popular?** `SDE 1`',
			'It builds on type hints: Pydantic validates input and output, and OpenAPI docs are generated automatically. It is built on Starlette and ASGI, so it supports async and WebSockets, and is fast for I/O-bound services.',
			'',
			'**Q. `def` versus `async def` for a route?** `SDE 1`',
			'`async def` runs on the event loop: use it when every call inside is awaited. Plain `def` runs in a thread pool, so blocking libraries do not freeze the loop. Calling a blocking function (requests, a sync DB driver, time.sleep) inside `async def` stalls all requests.',
			'',
			'**Q. What does Pydantic do?** `SDE 1`',
			'It parses and validates data against typed models, coercing where safe (the string "5" to int 5) and raising a 422 response with field-level errors otherwise. `response_model` filters the output so fields such as password hashes never leak.',
			'',
			'**Q. How do path, query and body parameters differ?** `SDE 1`',
			'A name in the URL path is a path parameter, a simple type not in the path is a query parameter, and a Pydantic model is the JSON body. FastAPI works this out from the signature.',
			'',
			'**Q. What is `Depends` and why use it?** `SDE 1`',
			'Dependency injection: a function whose result is passed to your route. Use it for a DB session, the current user, pagination params. Dependencies can depend on others, are cached per request, and can be replaced in tests with `app.dependency_overrides`.',
			'',
			'**Q. What is the GIL?** `SDE 2`',
			'In standard CPython a lock lets only one thread run Python bytecode at a time. Threads still help I/O-bound work because the lock is released while waiting. For CPU-bound work use multiple processes (several Uvicorn/Gunicorn workers, `multiprocessing`) or native code. Recent Python versions have an optional free-threaded build, but it is not the default.',
			'Follow-up: does async remove the GIL limit? No, it is still one thread; it only overlaps waiting.',
			'',
			'**Q. How do you manage a SQLAlchemy session per request?** `SDE 2`',
			'Create one session per request in a dependency using `yield`, commit or rollback in the service, and close it in `finally`. Never share one session between requests or tasks. With async, use `AsyncSession` and an async driver, and `await` each call.',
			'```py',
			'def get_db():',
			'    db = SessionLocal()',
			'    try:',
			'        yield db',
			'    finally:',
			'        db.close()',
			'```',
			'',
			'**Q. What is the N+1 query problem and the fix?** `SDE 2`',
			'Loading a list, then one more query per row for a relationship. Fix with eager loading (`selectinload` or `joinedload`) or a single join. Detect it by logging query counts in tests.',
			'',
			'**Q. When do you use BackgroundTasks versus a task queue?** `SDE 2`',
			'`BackgroundTasks` run after the response in the same process: fine for light work such as sending a notification. They are lost if the process dies and have no retries. Use Celery, RQ or a managed queue for long, important or retried jobs.',
			'',
			'**Q. How do you run startup and shutdown work?** `SDE 2`',
			'Use a `lifespan` async context manager: open connection pools before `yield`, close them after. This replaces the older startup/shutdown events.',
			'',
			'**Q. How do you test FastAPI?** `SDE 2`',
			'Use `TestClient` (or httpx `AsyncClient`) and override dependencies to inject a test database or a fake user. Pytest fixtures wrap each test in a rolled-back transaction.',
			'',
			'**Q. Mutable default argument bug?** `SDE 1`',
			'`def add(x, items=[])` shares one list across calls. Use `None` as default and create the list inside the function.',
			'',
			'**What interviewers look for:** you know what blocks the event loop, understand the session lifecycle, and can explain the GIL without myths.'
		),
		try: [
			{
				label: 'Exercise: dependency with cleanup',
				code: String.raw`// Exercise: model FastAPI's yield-dependency (open, use, always close) in JavaScript.
// TODO: make handler() throw and confirm the session is still closed.
const log = [];
function getDb() {
  const db = { id: 1, query: (q) => 'rows for ' + q };
  log.push('open');
  return { db, close: () => log.push('close') };
}
function handle(handler) {
  const { db, close } = getDb();
  try { return handler(db); } finally { close(); }
}
console.log(handle((db) => db.query('orders')));
console.log(log);`
			},
			{
				label: 'Exercise: blocking the loop',
				code: String.raw`// Exercise: one blocking call delays every other request (same idea as a sync call inside async def).
// TODO: set BLOCK to false and compare the finish times.
const BLOCK = true;
const order = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function busy(ms) { const end = Date.now() + ms; while (Date.now() < end) {} }
async function slowRoute() { if (BLOCK) busy(40); else await sleep(40); order.push('slow done'); }
async function fastRoute() { await sleep(1); order.push('fast done'); }
(async () => {
  await Promise.all([slowRoute(), fastRoute()]);
  console.log(order.join(' -> '));
  console.log(BLOCK ? 'fast waited for the blocking call' : 'fast finished first');
})();`
			},
			{
				label: 'Exercise: response model filter',
				code: String.raw`// Exercise: filter output through a declared schema so secret fields never leave the API.
// TODO: add 'email' to the allowed fields of PublicUser and run again.
const PublicUser = ['id', 'name'];
const dbRow = { id: 7, name: 'Asha', email: 'a@example.com', passwordHash: '$2b$12$abc' };
const respond = (row, fields) => Object.fromEntries(fields.map((f) => [f, row[f]]));
console.log(respond(dbRow, PublicUser));`
			}
		]
	}
];

// ───────────────────────── quiz ─────────────────────────
const t = (topic: string) => builder('IV', topic);

// ----- Node.js -----
const n = t('iv-nodejs');
n.add('basic', 'event-loop', "How does Node serve many connections with one JavaScript thread?",
	"I/O is handed to the operating system or libuv and a callback is queued when it finishes, so the thread is free in the meantime",
	["Node starts a new thread for every connection and joins them when done", "Node runs every request on a separate CPU core by default", "Node pauses new connections until the current request ends"],
	"Waiting for I/O does not need the JavaScript thread, so it can serve other requests while operations are in flight. Node does not spawn a thread per connection, does not use all cores by default (cluster or workers are opt-in), and does not queue connections behind one request, except when sync code blocks the loop.");
n.add('basic', 'microtasks', "Which output order is correct?",
	"1, 4, 3, 2",
	["1, 2, 3, 4", "1, 3, 4, 2", "1, 2, 4, 3"],
	"Synchronous code prints 1 first. process.nextTick runs before promise callbacks, so 4 comes before 3, and the timer callback is a later macrotask so 2 is last. The trap answers treat the timer as if it ran immediately or put promises before nextTick.",
	"console.log(1);\nsetTimeout(() => console.log(2), 0);\nPromise.resolve().then(() => console.log(3));\nprocess.nextTick(() => console.log(4));");
n.add('basic', 'blocking', "Which of these will block the event loop?",
	"JSON.parse on a very large string",
	["await fetch(url)", "fs.promises.readFile on a big file", "A resolved promise chain"],
	"JSON.parse is synchronous CPU work, so nothing else runs until it finishes. fetch and fs.promises.readFile hand the waiting to the system and return a promise, and promise callbacks are small units of work between which other things can run.");
n.add('basic', 'promises', "When is Promise.allSettled a better choice than Promise.all?",
	"When you want the outcome of every promise even if some fail, such as sending several notifications",
	["When you need the result as soon as the first promise finishes", "When the promises must run one after another", "When you want the others cancelled on failure"],
	"allSettled waits for every promise and reports fulfilled or rejected for each. Waiting for the first is Promise.race or any. Neither method serializes work, and neither cancels the remaining promises: all just stops waiting once one rejects.");
n.add('basic', 'streams', "Why pipe a large file through a stream instead of reading it with readFile?",
	"Memory use stays small because data moves in chunks, and the first bytes can be sent early",
	["Streams make the disk read faster", "readFile cannot read files over 1 MB", "Streams automatically compress the file"],
	"Chunked processing bounds memory to the chunk size and lets the consumer start before the producer finishes. The disk speed is unchanged, readFile can read large files (using lots of memory), and compression only happens if you add a gzip stage.");
n.add('basic', 'errors', "What happens by default in modern Node when a promise is rejected and nothing handles it?",
	"An unhandledRejection is raised and the process exits with an error",
	["The rejection is silently ignored", "The promise is retried once", "Node waits until a handler is attached later"],
	"Since Node 15 the default mode throws on unhandled rejections, so the process crashes, which prevents silently running in a bad state. It is not ignored and there is no retry. Handlers should be attached in the same turn of the loop.");
n.add('mid', 'esm', "What is a real difference between CommonJS and ES modules?",
	"ESM imports are static and support top-level await, while require is a runtime function call",
	["ESM files cannot import packages from npm", "CommonJS supports top-level await and ESM does not", "ESM always runs slower because it is interpreted"],
	"import statements are analyzed before running, which enables tree-shaking, and ESM supports top-level await. require() is a normal function evaluated at runtime. ESM can use npm packages, and the other two statements reverse or invent differences.");
n.add('advanced', 'backpressure', "writable.write() returns false. What should the producer do?",
	"Stop writing until the drain event fires",
	["Keep writing, since false means the chunk was lost", "Call write again immediately with the same chunk", "Close the stream and open a new one"],
	"False means the internal buffer passed highWaterMark: the chunk was accepted but the consumer is behind. Pausing until drain keeps memory bounded. Resending would duplicate data, closing loses data, and ignoring the signal lets the buffer grow without limit. pipeline handles this for you.");
n.add('advanced', 'workers', "A route resizes large images and slows every other route. What is the best fix?",
	"Move the resize into a worker thread (or a separate job service) so the main loop stays free",
	["Mark the route async, which makes the CPU work run in the background", "Add more await keywords inside the resize loop", "Increase UV_THREADPOOL_SIZE to 100"],
	"CPU-bound JavaScript occupies the one thread, so it must run elsewhere: a worker thread or another process. Marking a function async does not move work off the thread, extra awaits only add overhead, and the libuv pool serves fs, dns and some crypto, not your own JavaScript loops.");
n.add('advanced', 'cluster', "What is true of Node cluster workers?",
	"Each is a separate process with its own memory, so shared state must live in an external store",
	["They share the same variables, so a counter in one is visible in all", "They run inside one process as threads", "They allow one worker to use all CPU cores alone"],
	"cluster forks processes that share a listening port but not memory, so in-memory sessions or counters diverge between workers. Worker threads are the in-process option, and one event loop can only use one core for JavaScript.");
n.add('advanced', 'shutdown', "What is the correct order for graceful shutdown on SIGTERM?",
	"Fail readiness, stop accepting connections, finish in-flight requests, close database clients, then exit",
	["Close the database first, then stop the server", "Exit the process immediately so the deploy is fast", "Stop accepting connections but exit without waiting for requests"],
	"Failing readiness lets the load balancer stop sending traffic, server.close lets current requests finish, and only after that is it safe to close shared resources. Closing the database first breaks in-flight requests, and exiting early drops them, causing errors during every deploy.");
n.add('advanced', 'threadpool', "Which operation uses the libuv thread pool?",
	"crypto.pbkdf2 and fs file reads",
	["Accepting a TCP connection", "Running an arrow function", "Reading from an already open socket"],
	"Blocking system calls without a non-blocking OS interface, such as file operations, dns.lookup, zlib and pbkdf2, run in the pool (4 threads by default). Network sockets use the OS notification mechanism, and plain JavaScript runs on the main thread.");
n.add('advanced', 'memory', "A heap snapshot comparison shows a growing Map of request ids. What is the most likely fix?",
	"Bound it with eviction or expiry, or delete entries when the request finishes",
	["Increase the Node heap limit", "Call global.gc() on a timer", "Convert the Map to an array"],
	"A Map used as a cache or registry that is never cleaned is a leak by design: reachable objects are never collected. A bigger heap only delays the crash, forcing a GC cannot free reachable entries, and an array has the same problem.");

// ----- Express / NestJS -----
const x = t('iv-nestjs-express');
x.add('basic', 'middleware', "What does an Express middleware have to do to let the request continue to the next handler?",
	"Call next() (or end the response itself)",
	["Return true", "Return the request object", "Throw an error"],
	"Express passes control by calling next(). If a middleware neither calls next nor sends a response, the request hangs. The return value is ignored and throwing triggers the error path instead.");
x.add('basic', 'errors', "How does Express recognize an error-handling middleware?",
	"It declares four parameters: (err, req, res, next)",
	["It is registered with app.catch()", "Its name must start with error", "It must be the first middleware registered"],
	"Express looks at the function arity: four arguments marks it as an error handler. There is no app.catch, names do not matter, and it belongs after the routes so errors from them reach it.");
x.add('basic', 'roles', "In NestJS, which building block decides whether a request may reach a route (for example by checking a role)?",
	"A guard",
	["A pipe", "An interceptor", "A provider"],
	"Guards return true or false (or throw) and are meant for authorization. Pipes validate or transform arguments, interceptors wrap the handler for logging or response mapping, and a provider is a general injectable class.");
x.add('basic', 'validation', "What does ValidationPipe with whitelist: true do?",
	"Strips properties that have no validation decorator from the DTO",
	["Makes every property optional", "Only allows requests from a list of IPs", "Validates the response body instead of the request"],
	"Whitelisting removes unknown fields so clients cannot slip in extra data such as isAdmin. It does not relax required fields, has nothing to do with IPs, and applies to incoming data. forbidNonWhitelisted would reject instead of strip.");
x.add('basic', 'modules', "Service A in module X needs service B from module Y. What is required?",
	"Module Y exports B and module X imports Y",
	["Nothing, since all providers are global", "Only importing B directly in A's file", "Declaring B again in the controller"],
	"Nest providers are private to their module unless exported, and another module must import the owner. A TypeScript import alone does not register anything with the container, and redeclaring creates a second instance.");
x.add('mid', 'lifecycle', "Which order does Nest run these for one request?",
	"Middleware, guards, interceptors (before), pipes, handler",
	["Pipes, guards, middleware, interceptors, handler", "Guards, middleware, pipes, interceptors, handler", "Interceptors, middleware, pipes, guards, handler"],
	"Middleware runs first (it is the Express layer), then guards decide access, then interceptors wrap, then pipes process arguments right before the handler. Authorization before validation avoids doing work for requests that will be rejected.");
x.add('mid', 'interceptors', "Which feature is the natural place to measure how long each handler takes?",
	"An interceptor, because it runs code before and after the handler",
	["A guard, because it runs first", "A pipe, because it sees the arguments", "An exception filter, because it sees errors"],
	"Interceptors wrap the handler so they can record a start time and compute elapsed time when the response stream completes. A guard and a pipe run only before the handler, and a filter runs only when something throws.");
x.add('advanced', 'scopes', "What is a cost of REQUEST-scoped providers?",
	"Every provider that depends on one also becomes request-scoped, so instances are created per request",
	["They make the application single-threaded", "They cannot read the request object", "They are shared between all users"],
	"The scope bubbles up the dependency chain, adding allocation and slowing the app. They exist precisely to access request data, are per request rather than shared, and have nothing to do with threads. Prefer default scope and pass data explicitly.");
x.add('advanced', 'circular', "Two services inject each other and one is undefined at runtime. What is the best fix?",
	"Extract the shared logic into a third service, using forwardRef only if redesign is not possible",
	["Wrap both in try/catch", "Move both to the same file and import in a loop", "Make both REQUEST scoped"],
	"A cycle usually signals a missing abstraction, and a third service removes it. forwardRef delays resolution but keeps the coupling. try/catch hides the symptom, and scope changes do not break an import cycle.");
x.add('advanced', 'testing', "How do you unit test a Nest service that depends on a repository?",
	"Create a testing module and provide a mock for the repository with useValue",
	["Start the real database and seed it for every test", "Call the repository methods directly to avoid the service", "Disable dependency injection in tests"],
	"Mocking the dependency isolates the logic and keeps tests fast and deterministic. Real database tests are valuable but are integration tests, calling the repository skips what you wanted to test, and injection is the mechanism that makes substitution easy.");
x.add('advanced', 'public-routes', "How can you protect all routes by default but allow a few public ones?",
	"Register a global auth guard and use a custom decorator plus Reflector to skip it on marked routes",
	["Add the guard to each route by hand and hope nothing is missed", "Remove authentication from the controller class", "Check the URL string inside every service"],
	"Secure by default means a forgotten route is protected rather than open. Metadata set by a decorator and read with Reflector is the standard approach. Hand-applying guards is error-prone, and URL checks in services mix concerns.");
x.add('advanced', 'express5', "In Express 4, an async handler throws after an await. What happens without special handling?",
	"The error is not passed to error middleware and can cause an unhandled rejection or a hung request",
	["It is always caught and returned as a 500 response", "Express retries the handler", "The server restarts automatically"],
	"Express 4 does not look at the promise a handler returns, so a rejection bypasses the error middleware. Wrap with a helper that calls next(err), or use Express 5, which forwards rejected promises. There is no retry or auto restart.");

// ----- API design -----
const a = t('iv-api-design');
a.add('basic', 'methods', "Which set contains only idempotent methods?",
	"GET, PUT, DELETE",
	["GET, POST, DELETE", "POST, PATCH, PUT", "POST, GET, PATCH"],
	"Repeating GET, PUT or DELETE leaves the server in the same state as doing it once. POST normally creates a new resource each time and PATCH is not guaranteed to be idempotent, so every other set contains a non-idempotent method.");
a.add('basic', 'status', "Which status code fits a request with a valid token but without permission for the resource?",
	"403 Forbidden",
	["401 Unauthorized", "404 Not Found", "400 Bad Request"],
	"The server knows who you are, so authentication succeeded, and denies the action: 403. 401 is for missing or invalid credentials. 404 can be used to hide existence on purpose, and 400 is for malformed input.");
a.add('basic', 'status', "What should a successful POST that creates a resource return?",
	"201 Created with a Location header for the new resource",
	["200 OK with an empty body", "204 No Content", "302 Found"],
	"201 states that something new exists, and Location tells the client where. 200 is allowed in loose APIs but less precise, 204 means success with no content and tells nothing about creation, and 302 is a redirect.");
a.add('basic', 'put-patch', "What is the difference between PUT and PATCH?",
	"PUT replaces the whole resource, PATCH changes only the sent fields",
	["PUT creates and PATCH deletes", "PATCH is for lists and PUT is for single items", "They are identical and only the name differs"],
	"PUT sends the complete representation, so missing fields are reset. PATCH describes a partial change. The other options invent roles that the verbs do not have.");
a.add('mid', 'pagination', "Why is cursor pagination preferred for a fast-changing feed?",
	"It continues from the last seen key, so inserts do not cause skipped or repeated rows and it stays fast with an index",
	["It lets users jump to any page number", "It needs no sort order", "It returns the whole feed in one response"],
	"Offset pagination shifts when rows are inserted or deleted, and large offsets scan and discard rows. A key-based cursor uses an index to seek directly. Jumping to page N is what offset is good at, a stable order is required for cursors, and returning everything is the opposite of paging.");
a.add('mid', 'errors', "Which error response design is best for an API consumed by many clients?",
	"A consistent shape with a stable machine-readable code, a message and a request id",
	["Plain text messages that change with wording", "Always 200 with success false in the body", "Stack traces so clients can debug"],
	"Clients branch on a stable code, humans read the message, and the request id lets support find logs. Free text breaks parsing, 200 for errors confuses caches and monitoring, and stack traces leak internals.");
a.add('mid', 'caching', "What does a 304 Not Modified response to an If-None-Match request mean?",
	"The client copy matches the current ETag, so no body is sent",
	["The resource was deleted", "The client is not allowed to see it", "The server redirected to a new URL"],
	"The client sent the ETag it has, the server compared and found it still current, and saves the bandwidth. Deletion is 404 or 410, denial is 401 or 403, and redirects are other 3xx codes.");
a.add('advanced', 'idempotency', "A client times out on POST /payments and retries. How do you prevent a double charge?",
	"Require an Idempotency-Key and store its first result under a unique constraint, returning it on repeats",
	["Make the client wait a minute before retrying", "Change the endpoint to GET", "Reject every retry with 500"],
	"The server cannot tell a retry from a new payment without a client-provided key, and a unique constraint makes concurrent duplicates safe. Waiting does not remove ambiguity, GET must not change state, and rejecting retries just leaves the client unsure whether it paid.");
a.add('advanced', 'rate-limit', "Which response is correct when a client exceeds its rate limit?",
	"429 Too Many Requests with a Retry-After header",
	["500 Internal Server Error", "401 Unauthorized", "200 OK with an empty list"],
	"429 is the specific status, and Retry-After tells well-behaved clients when to come back. 500 would signal a server bug and trigger alerts, 401 suggests bad credentials, and 200 hides the problem.");
a.add('advanced', 'rate-limit', "Compared with a fixed window counter, what is the benefit of a token bucket?",
	"It allows controlled bursts and avoids a double burst at the window boundary",
	["It needs no storage", "It makes the limit exact to the millisecond for every client", "It blocks all bursts completely"],
	"Tokens refill steadily and the bucket capacity defines the allowed burst, so there is no cliff at the window edge where a client sends a full quota at the end of one window and again at the start of the next. It still needs state, and bursts are allowed by design.");
a.add('advanced', 'concurrency', "Two users edit the same record and the second save silently overwrites the first. What is a standard fix?",
	"Optimistic concurrency with a version or ETag checked through If-Match, returning 412 on mismatch",
	["Make the PUT slower", "Switch to POST", "Ignore it, the last write is always correct"],
	"The version check detects that the record changed since it was read, so the client can reload and merge. Changing verbs or speed does not detect conflicts, and last-write-wins loses data.");
a.add('advanced', 'versioning', "Which approach to API change causes the fewest breaking releases?",
	"Make changes additive (new optional fields and endpoints) and deprecate old behavior with a Sunset date",
	["Rename fields whenever the design improves", "Change response types in place and notify by email", "Ship a new major version for every change"],
	"Additive changes do not break existing clients, so a new version is needed rarely. Renaming or retyping breaks consumers immediately, and a new version per change creates a maintenance burden.");
a.add('advanced', 'protocols', "When is gRPC a better fit than REST?",
	"For internal service-to-service calls where typed contracts and low overhead matter",
	["For public APIs that browsers call directly", "When responses must be easy to cache in a CDN", "When humans test endpoints in the address bar"],
	"gRPC uses Protocol Buffers over HTTP/2, which gives compact payloads, generated clients and streaming between services. Browser support needs a proxy, HTTP caching is awkward, and the address bar can only do GET with readable output on REST.");

// ----- Auth and security -----
const s = t('iv-auth-security');
s.add('basic', 'authn-authz', "A request has an expired token. Which status is most accurate?",
	"401 Unauthorized, because the client is not authenticated",
	["403 Forbidden, because the token is wrong", "404 Not Found", "500 Internal Server Error"],
	"401 means the credentials are missing or invalid, which includes expiry, and the client should authenticate again. 403 means the identity is known but lacks permission. 404 and 500 describe other problems.");
s.add('basic', 'passwords', "How should passwords be stored?",
	"As a slow salted hash such as argon2id or bcrypt",
	["Encrypted with AES so they can be recovered", "As an unsalted SHA-256 hash", "In plain text inside a protected table"],
	"Slow, salted hashing makes brute-force and rainbow table attacks expensive, and you never need to recover a password. Encryption is reversible, so a leaked key exposes everyone. Plain SHA-256 is fast to guess and unsalted hashes reveal duplicates. Plain text is never acceptable.");
s.add('basic', 'jwt', "What is true about the payload of a signed JWT?",
	"Anyone can decode and read it, so it must not contain secrets",
	["It is encrypted with the signing key", "Only the server can read it", "It cannot be changed by anyone because it is encoded"],
	"A normal JWT is base64url encoded and signed, not encrypted. The signature detects tampering but does not hide the content. Encoding is not protection, and the other options confuse signing with encryption.");
s.add('basic', 'xss', "Which action best reduces XSS risk?",
	"Escape output by context and set a Content-Security-Policy",
	["Hide the login form with CSS", "Store everything in localStorage", "Use GET for all requests"],
	"XSS happens when untrusted input is run as script, so escaping where it is rendered and limiting script sources attacks the cause. Hiding elements, picking storage, or changing the method does nothing about injected scripts. localStorage is actually readable by any script.");
s.add('mid', 'csrf', "A site uses cookie-based sessions. Which pair protects against CSRF?",
	"SameSite cookies and an anti-CSRF token on state-changing requests",
	["HttpOnly cookies and a longer password", "HTTPS and a shorter session", "Base64 encoding the cookie value"],
	"CSRF abuses the browser sending cookies automatically, so SameSite limits cross-site sending and a token proves the request came from your page. HttpOnly blocks script reading and HTTPS protects the transport, but neither stops a forged request from the browser.");
s.add('mid', 'sessions-jwt', "Why is revoking a JWT before expiry hard?",
	"The server does not store it, so valid tokens are accepted until they expire unless you add a block list or version check",
	["JWTs cannot have an expiry", "JWTs are always encrypted", "The browser refuses to delete them"],
	"Stateless verification is the benefit and the cost: nothing to delete. Mitigate with short lifetimes, refresh rotation, a per-user token version or a small deny list. JWTs have exp, are typically only signed, and clients can discard them while a stolen copy still works.");
s.add('mid', 'jwt', "What must a server pin when verifying a JWT?",
	"The expected signing algorithm, along with checking exp, iss and aud",
	["The alg value the token header asks for", "Only that the token has three parts", "Whether the payload is valid JSON"],
	"Trusting the header lets attackers choose a weak or none algorithm, or confuse RSA public keys with HMAC secrets. Structure and JSON checks do not prove authenticity or intended audience.");
s.add('advanced', 'oauth', "In the OAuth2 authorization code flow, what is the purpose of the state parameter?",
	"To tie the response to the original request and stop CSRF on the callback",
	["To encrypt the access token", "To list the scopes requested", "To tell the provider the user's country"],
	"The client generates a random state, stores it, and checks it on return, so an attacker cannot make you complete their login. Encryption is not its job, scopes use the scope parameter, and location is irrelevant.");
s.add('advanced', 'pkce', "Why do single-page and mobile apps need PKCE?",
	"They cannot keep a client secret, so a per-request verifier proves the same client that started the flow finishes it",
	["It makes the access token never expire", "It removes the need for HTTPS", "It lets the app skip the user login"],
	"Public clients ship code the user can read, so a stolen authorization code could be redeemed by anyone. PKCE binds the code to a secret verifier created at the start. It changes neither token lifetime, transport security nor user consent.");
s.add('advanced', 'oidc', "What does OpenID Connect add on top of OAuth2?",
	"An ID token that says who the user is, for login",
	["Faster access tokens", "Encryption of API traffic", "A replacement for HTTPS"],
	"OAuth2 alone says what an app may access, not who signed in. OIDC standardizes identity with the ID token and a userinfo endpoint, which is what makes single sign-on possible.");
s.add('advanced', 'refresh', "A refresh token that was already used is presented again. What is the safest response?",
	"Treat it as theft, revoke the whole token family and require a new login",
	["Issue another token silently", "Ignore the request", "Extend the expiry of all tokens"],
	"With rotation each token is used once, so reuse means two parties hold it. Revoking the family limits the damage and forces re-authentication. Issuing again or extending helps the thief.");
s.add('advanced', 'idor', "A user changes /orders/101 to /orders/102 and sees another user's order. What is the flaw and fix?",
	"Missing object-level authorization; check that the order belongs to the caller on every request",
	["Weak hashing; use a longer salt", "Missing HTTPS; add a certificate", "A CSRF hole; add SameSite"],
	"This is an insecure direct object reference: authentication happened but ownership was never checked. Hashing, transport security and CSRF are different problems. Random ids help only as defense in depth.");
s.add('advanced', 'secrets', "A secret key was committed to a repository and removed in the next commit. What must you do?",
	"Rotate the key, because it is still in history and may have been copied",
	["Nothing, since the latest commit no longer has it", "Rename the file", "Make the repository private and keep the key"],
	"Git history keeps old contents, and bots scan public repositories quickly, so the key must be treated as compromised. Removing it from the tip, renaming, or hiding the repo does not undo exposure.");

// ----- Python / FastAPI -----
const p = t('iv-python-fastapi');
p.add('basic', 'async', "What happens if you call time.sleep(5) inside an async def route?",
	"The event loop is blocked, so other requests on that worker wait",
	["Only that request waits and the rest are unaffected", "FastAPI moves it to a thread automatically", "It raises an error at startup"],
	"async def runs on the event loop, and time.sleep does not yield to it, so everything on that loop stalls. FastAPI only uses a thread pool for plain def routes. Use await asyncio.sleep or an awaitable client instead.");
p.add('basic', 'def-vs-async', "When a route is declared with plain def, where does FastAPI run it?",
	"In a thread pool, so blocking calls do not freeze the event loop",
	["On the event loop thread", "In a new process", "It refuses plain def routes"],
	"Sync routes and dependencies are executed in worker threads. That is why blocking libraries are safe in def routes but not in async def ones. Processes come only from running several workers.");
p.add('basic', 'pydantic', "What does a Pydantic model give a FastAPI route?",
	"Request validation with clear 422 errors and a documented schema",
	["Faster database queries", "Automatic authentication", "Compiled machine code"],
	"The type hints become validation rules and OpenAPI schema, and failures return field-level errors. It does not speed up queries, handle auth, or compile your code.");
p.add('basic', 'response-model', "Why set response_model on a route?",
	"It filters output to the declared fields so secrets like a password hash are not returned",
	["It validates the request headers", "It makes the route async", "It caches the response"],
	"The returned object is passed through the model so extra fields are dropped. It does not touch headers, change sync or async behavior, or cache.");
p.add('basic', 'python', "What is the problem with def add(x, items=[])?",
	"The default list is created once and shared between calls",
	["It is a syntax error", "The list is copied on every call, wasting memory", "x can never be used"],
	"Default values are evaluated when the function is defined, so appends accumulate across calls. Use items=None and create a list in the body.");
p.add('mid', 'depends', "What is a common use of a yield dependency in FastAPI?",
	"Open a database session before the route and close it after, even when an error occurs",
	["Run the route twice", "Return several responses", "Make the route synchronous"],
	"Code before yield is setup, the yielded value is passed to the route, and code after (in finally) is cleanup. It does not repeat the route, stream multiple responses or change sync behavior.");
p.add('mid', 'testing', "How do you replace the real database dependency in a test?",
	"Set app.dependency_overrides for the dependency function",
	["Edit the production code to read a TEST variable", "Monkeypatch the HTTP server", "Delete the dependency from the route"],
	"Overrides substitute any dependency at test time without touching application code. Test flags in production code add risk, and the other options break the route.");
p.add('advanced', 'gil', "Which statement about the GIL is correct for standard CPython?",
	"Threads help with I/O-bound work but not with CPU-bound Python code, which needs multiple processes",
	["Threads speed up CPU-bound Python code on many cores", "The GIL makes async code run on several cores", "The GIL means Python cannot do I/O in parallel"],
	"The lock is released while waiting for I/O, so threads overlap waiting, but only one thread runs bytecode at a time. Async is one thread, and CPU work scales with processes or native extensions.");
p.add('advanced', 'sessions', "Why must a SQLAlchemy session not be shared between concurrent requests?",
	"It holds a transaction and object state that is not safe for concurrent use",
	["Sessions are immutable", "The database allows only one session", "Sessions expire after one query"],
	"A session tracks identity and pending changes and is not thread-safe, so concurrent use corrupts state or mixes transactions. Use one per request. The database supports many connections through a pool.");
p.add('advanced', 'n-plus-one', "Listing 100 orders then lazily loading each customer causes how many queries?",
	"101: one for the list and one per order",
	["2", "1", "100 but none for the list"],
	"This is the N+1 problem. Eager loading with selectinload or a join brings it down to 1 or 2 queries. The shortcut counts are the goal after the fix, not the lazy behavior.");
p.add('advanced', 'background', "Why is BackgroundTasks a poor fit for sending a critical invoice email that must not be lost?",
	"It runs in the same process after the response, so a crash loses the task and there are no retries",
	["It cannot send email", "It blocks the response until finished", "It runs on another machine"],
	"BackgroundTasks has no durability or retry. A queue with persistence (Celery, RQ or a managed service) survives restarts. It runs after the response is sent and in the same process, so the other options are wrong.");
p.add('advanced', 'lifespan', "Where should a FastAPI app create and close a shared connection pool?",
	"In a lifespan context manager: open before yield, close after",
	["Inside every route function", "At import time with no cleanup", "In a response model"],
	"Lifespan runs once per app start and stop, so the pool is created once and closed cleanly. Creating per request wastes connections, and no cleanup leaks them.");
p.add('advanced', 'async-db', "With an AsyncSession, what happens if you forget to await a query call?",
	"You get a coroutine object instead of results, and the query does not run",
	["It runs but in a thread", "It returns an empty list", "The session closes automatically"],
	"Async calls return awaitables, and without await nothing executes, usually followed by a warning about a coroutine never awaited and a confusing error later. It does not return empty rows or close the session.");

export const banks: { out: Question[] }[] = [n, x, a, s, p];
