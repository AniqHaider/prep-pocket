import type { Scene, BoxNode, DbNode, TableNode, DocNode, TextNode, TokenNode, EdgeNode } from '../../types';

// Small builders so each scene reads as a list of things on a stage. See docs/explainers.md.
type O<T> = Partial<Omit<T, 'kind' | 'id'>>;
const box = (id: string, x: number, y: number, w: number, h: number, label: string, o: O<BoxNode> = {}): BoxNode => ({ id, kind: 'box', x, y, w, h, label, ...o });
const db = (id: string, x: number, y: number, w: number, h: number, label: string, o: O<DbNode> = {}): DbNode => ({ id, kind: 'db', x, y, w, h, label, ...o });
const table = (id: string, x: number, y: number, cols: string[], rows: string[][], o: O<TableNode> = {}): TableNode => ({ id, kind: 'table', x, y, cols, rows, ...o });
// SVG text collapses runs of spaces, so indentation and column gaps become non-breaking spaces (same width, nothing collapses).
const keep = (l: string) => l.replace(/^ +| {2,}/g, (m) => '\u00a0'.repeat(m.length));
const doc = (id: string, x: number, y: number, w: number, lines: string[], o: O<DocNode> = {}): DocNode => ({ id, kind: 'doc', x, y, w, lines: lines.map(keep), ...o });
const text = (id: string, x: number, y: number, t: string, o: O<TextNode> = {}): TextNode => ({ id, kind: 'text', x, y, text: t, ...o });
const tok = (id: string, x: number, y: number, o: O<TokenNode> = {}): TokenNode => ({ id, kind: 'token', x, y, ...o });
const edge = (id: string, from: EdgeNode['from'], to: EdgeNode['to'], o: O<EdgeNode> = {}): EdgeNode => ({ id, kind: 'edge', from, to, ...o });

/** Backend lab chapters 7-12 (ids ch7..ch12). */
export const backendPart2: Scene[] = [
	// ───────────────────────── ch7 · Authentication ─────────────────────────
	{
		id: 'be-password-hashing',
		topic: 'backend',
		group: 'ch7',
		title: 'Why passwords are hashed and salted',
		blurb: 'What should the database store instead of the password?',
		nodes: [
			doc('form', 80, 10, 200, ['{ "email": "asha@x.io",', '  "password": "hunter2" }']),
			table('plain', 40, 170, ['email', 'password'], [['asha@x.io', 'hunter2'], ['ben@x.io', 'hunter2']], { colW: 140, title: 'users (plain text: bad)', tone: 'neg' }),
			table('hashed', 40, 170, ['email', 'salt + hash'], [['asha@x.io', 'Kq3x · 9f2c1e…'], ['ben@x.io', 'Vb7m · 04ad77…']], { colW: 140, title: 'users (salted hashes)' }),
			box('hash', 110, 92, 140, 40, 'slow one-way hash', { sub: 'bcrypt / argon2' }),
			box('salt', 268, 92, 84, 52, 'salt', { sub: 'random per user' }),
			edge('e1', 'form', 'hash', { label: 'password' }),
			edge('e2', 'salt', 'hash'),
			edge('e3', 'hash', 'hashed', { label: 'store', tone: 'accent' }),
			text('note', 180, 278, 'Login: hash what was typed with the stored salt, then compare.', { w: 320, anchor: 'middle', size: 'sm' })
		],
		steps: [
			{ say: 'Asha signs up with the password hunter2. The question is what the server should save.', show: ['form'], focus: ['form'] },
			{ say: 'Saving it as typed means anyone who reads the table (a backup, a leak, a bug) can read every password. And Ben chose the same one.', show: ['plain'], focus: ['plain'] },
			{ say: "A hash function scrambles the password into a fixed-looking value. It only goes one way: you can't get the password back from it.", hide: ['plain'], show: ['hash', 'e1'], focus: ['hash'] },
			{ say: 'Two users with the same password would still get the same hash, and attackers keep tables of common hashes. So a random salt, different per user, is mixed in first.', show: ['salt', 'e2'], pulse: ['salt'] },
			{ say: 'Good password hashes are slow on purpose, around 100 ms. That is invisible for one login but makes guessing billions of passwords impractical.', set: { hash: { sub: 'bcrypt: ~100 ms', tone: 'accent' } }, focus: ['hash'] },
			{ say: 'The database keeps only the salt and the hash. If it leaks, attackers still have to guess each password slowly, one user at a time.', show: ['hashed', 'e3'], focus: ['hashed'] },
			{ say: "At login, hash the typed password with that user's stored salt and compare the two hashes. The real password is never stored.", show: ['note'], focus: ['hashed'] }
		]
	},
	{
		id: 'be-sessions-vs-jwt',
		topic: 'backend',
		group: 'ch7',
		title: 'Session or token: where does login live?',
		blurb: 'How does the server remember who you are on the next request?',
		nodes: [
			box('br', 10, 40, 100, 50, 'Browser'),
			box('sv', 250, 40, 100, 50, 'Server'),
			db('st', 258, 150, 84, 50, 'sessions'),
			edge('e1', 'br', 'sv', { label: 'POST /login' }),
			edge('e2', 'sv', 'br', { label: 'cookie sid_91', tone: 'accent' }),
			edge('e3', 'sv', 'st', { label: 'save user 7' }),
			edge('e4', 'br', 'sv', { label: 'GET /orders + cookie' }),
			edge('e5', 'sv', 'br', { label: 'signed token', tone: 'accent' }),
			edge('e6', 'br', 'sv', { label: 'GET /orders + token' }),
			doc('tk', 70, 215, 220, ['{ "sub": 7, "exp": "15 min" }', 'signature: 8f3a1c…']),
			text('warn', 180, 282, "A token can't be taken back before it expires, so keep it short.", { w: 330, anchor: 'middle', size: 'sm', tone: 'warn' })
		],
		steps: [
			{ say: 'You log in: the browser sends your email and password to the server.', show: ['br', 'sv', 'e1'], focus: ['br'] },
			{ say: 'Session style: the server saves a record of who you are under a random id, and hands that id back in a cookie.', show: ['st', 'e3', 'e2'], focus: ['st'] },
			{ say: 'Every later request carries the cookie. The server looks the id up in its store to find you. It has to remember every logged-in user.', hide: ['e1', 'e2'], show: ['e4'], focus: ['st'] },
			{ say: 'Token style: instead the server signs a small token that says who you are and when it expires, and stores nothing.', hide: ['e3', 'e4', 'st'], show: ['e5', 'tk'], focus: ['tk'] },
			{ say: 'Each request carries the token. The server only checks the signature with its secret key: no lookup, so any server can do it.', hide: ['e5'], show: ['e6'], focus: ['sv'] },
			{ say: 'Trade-off: a signed token can’t be revoked before it expires, so keep it short (about 15 minutes) and pair it with a refresh token.', show: ['warn'], focus: ['tk'] }
		]
	},
	{
		id: 'be-jwt-signature',
		topic: 'backend',
		group: 'ch7',
		title: 'How a signed token proves itself',
		blurb: 'How can a server trust a token it never stored?',
		nodes: [
			doc('pl', 115, 10, 150, ['{ "sub": 7,', '  "role": "user" }']),
			box('key', 20, 100, 100, 50, 'secret key', { sub: 'server only' }),
			box('sign', 140, 100, 100, 50, 'sign', { sub: 'HMAC-SHA256' }),
			box('sig', 260, 100, 90, 50, 'signature', { sub: '8f3a1c…' }),
			edge('e1', 'pl', 'sign', { label: 'payload' }),
			edge('e2', 'key', 'sign'),
			edge('e3', 'sign', 'sig'),
			doc('tk', 30, 176, 300, ['payload . signature', 'eyJzdWIiOjd9 . 8f3a1c9d']),
			box('ver', 80, 240, 200, 44, 'server recomputes', { sub: 'new signature: b71e04…' })
		],
		steps: [
			{ say: 'A token starts as a small JSON payload: who you are and what you may do.', show: ['pl'], focus: ['pl'] },
			{ say: 'The server owns a secret key that never leaves it.', show: ['key'], pulse: ['key'] },
			{ say: 'It mixes the payload with the key using a keyed hash (HMAC) to produce a signature.', show: ['sign', 'e1', 'e2'], focus: ['sign'] },
			{ say: 'The token is the payload plus its signature. Anyone can read the payload, but nobody can make a matching signature without the key.', show: ['sig', 'e3', 'tk'], focus: ['tk'] },
			{ say: 'Now an attacker edits their copy of the payload and changes the role from user to admin.', set: { pl: { lines: ['{ "sub": 7,', '  "role": "admin" }'], tone: 'neg' } }, focus: ['pl'] },
			{ say: 'The server recomputes the signature from the payload it received. It no longer matches, so the request is rejected with 401.', show: ['ver'], set: { sig: { tone: 'neg' }, ver: { tone: 'neg' } }, focus: ['ver'] },
			{ say: "The payload is only encoded, not encrypted, so never put secrets in a token. The signature proves it wasn't changed, not that it's hidden.", focus: ['tk'] }
		]
	},
	{
		id: 'be-authn-vs-authz',
		topic: 'backend',
		group: 'ch7',
		title: '401 or 403: who you are vs what you may do',
		blurb: 'What is the difference between authentication and authorization?',
		nodes: [
			box('req', 110, 6, 140, 36, 'DELETE /users/9', { sub: 'Bearer eyJ…' }),
			box('g1', 110, 74, 140, 52, '1. Who are you?', { sub: 'authentication' }),
			box('g2', 110, 164, 140, 52, '2. May you do this?', { sub: 'authorization' }),
			box('ok', 110, 252, 140, 36, '200 OK: user deleted', { tone: 'accent' }),
			box('r401', 268, 74, 84, 44, '401', { sub: 'unknown user', tone: 'neg' }),
			box('r403', 268, 164, 84, 44, '403', { sub: 'not allowed', tone: 'neg' }),
			edge('e1', 'req', 'g1'),
			edge('e2', 'g1', 'g2', { label: 'token OK' }),
			edge('e3', 'g2', 'ok', { label: 'allowed', tone: 'accent' }),
			edge('e4', 'g1', 'r401', { tone: 'neg' }),
			edge('e5', 'g2', 'r403', { tone: 'neg' })
		],
		steps: [
			{ say: 'A request arrives to delete user 9, carrying a token. Before the server says yes, it asks two separate questions.', show: ['req'], focus: ['req'] },
			{ say: 'First, authentication: is the token valid, and whose is it? Here it is Ben, who has the role viewer.', show: ['g1', 'e1'], set: { g1: { sub: 'valid token: Ben (viewer)' } }, focus: ['g1'] },
			{ say: "If the token were missing or forged, we'd stop here with 401: we don't know who you are.", show: ['r401', 'e4'], focus: ['r401'] },
			{ say: "Second, authorization: is a viewer allowed to delete users? The server checks Ben's role against the rule.", show: ['g2', 'e2'], set: { g2: { sub: 'viewer: delete user?' } }, focus: ['g2'] },
			{ say: 'No. The answer is 403: we know exactly who you are, but you may not do this.', show: ['r403', 'e5'], focus: ['r403'] },
			{ say: 'An admin sending the same request passes both checks and the delete runs. 401 is about identity, 403 is about permission.', hide: ['r401', 'e4', 'r403', 'e5'], show: ['ok', 'e3'], set: { g2: { sub: 'role: admin', tone: 'accent' } }, focus: ['ok'] }
		]
	},

	// ───────────────────────── ch8 · Concurrency ─────────────────────────
	{
		id: 'be-race-last-seat',
		topic: 'backend',
		group: 'ch8',
		title: 'Two people book the last seat',
		blurb: 'What goes wrong when two requests touch the same row at once?',
		nodes: [
			box('asha', 14, 16, 100, 40, 'Asha'),
			box('ben', 246, 16, 100, 40, 'Ben'),
			table('seat', 100, 110, ['seat', 'owner'], [['12A', 'nobody']], { colW: 80, title: 'seats' }),
			edge('e1', 'asha', 'seat', { label: 'sees: free' }),
			edge('e2', 'ben', 'seat', { label: 'sees: free' }),
			edge('e3', 'asha', 'seat', { label: 'UPDATE: Asha' }),
			edge('e4', 'ben', 'seat', { label: 'UPDATE: Ben', tone: 'neg' }),
			text('note', 180, 236, '', { w: 330, anchor: 'middle' })
		],
		steps: [
			{ say: 'Seat 12A is the last free seat. Asha and Ben both tap Book at the same moment.', show: ['asha', 'ben', 'seat'], focus: ['seat'] },
			{ say: "Each request first reads the seat to check it's free. Both reads happen before either write, so both see 'free'.", show: ['e1', 'e2'], focus: ['seat'] },
			{ say: "Both servers conclude 'free, so I can book it' and carry on.", pulse: ['asha', 'ben'] },
			{ say: "Asha's write lands first: the owner becomes Asha.", hide: ['e1', 'e2'], show: ['e3'], set: { seat: { rows: [['12A', 'Asha']], hl: [0] } }, focus: ['asha'] },
			{ say: "Ben's write lands a moment later and silently overwrites it: the owner is now Ben.", show: ['e4'], set: { seat: { rows: [['12A', 'Ben']], tone: 'neg' } }, focus: ['ben'] },
			{ say: 'Both got a confirmation, but there is one seat. The outcome depended on timing: that is a race condition.', show: ['note'], set: { note: { text: 'Two confirmations sent for one seat', tone: 'neg' } }, pulse: ['seat'] },
			{ say: 'The bug is checking and writing as two separate steps. The fix is to make them one atomic step, shown next.', set: { note: { text: 'Fix: check and write in one statement', tone: 'accent' } }, focus: ['note'] }
		]
	},
	{
		id: 'be-atomic-guarded-update',
		topic: 'backend',
		group: 'ch8',
		title: 'The atomic guarded update',
		blurb: 'How do you check and write in one step?',
		nodes: [
			doc('sql', 20, 8, 320, ['UPDATE seats SET owner = :user', "WHERE seat = '12A' AND owner IS NULL;"]),
			table('seat', 100, 76, ['seat', 'owner'], [['12A', 'nobody']], { colW: 80, title: 'seats' }),
			box('asha', 14, 204, 100, 40, 'Asha'),
			box('ben', 246, 204, 100, 40, 'Ben'),
			box('ra', 14, 256, 112, 36, '1 row updated', { tone: 'accent' }),
			box('rb', 234, 256, 112, 36, '0 rows updated', { tone: 'neg' }),
			edge('e1', 'asha', 'seat', { label: 'UPDATE' }),
			edge('e2', 'ben', 'seat', { label: 'UPDATE' })
		],
		steps: [
			{ say: 'One statement does the check and the write together: only set the owner if nobody owns the seat yet.', show: ['sql', 'seat'], focus: ['sql'] },
			{ say: "Asha's and Ben's requests arrive at the same moment, and both run this statement.", show: ['asha', 'ben', 'e1', 'e2'] },
			{ say: "The database handles writes to one row one at a time. Asha's goes first: the owner is empty, so it matches and the owner becomes Asha.", set: { seat: { rows: [['12A', 'Asha']], hl: [0] } }, focus: ['asha'], pulse: ['seat'] },
			{ say: "Ben's runs next. The owner is no longer empty, so the WHERE clause matches nothing and nothing changes.", set: { e2: { tone: 'warn' } }, focus: ['ben'] },
			{ say: 'The database reports how many rows each statement changed: 1 for Asha.', show: ['ra'], focus: ['ra'] },
			{ say: '0 for Ben. Your code checks that count and tells Ben the seat is taken.', show: ['rb'], focus: ['rb'] },
			{ say: "No race is possible, because the check and the write can't be pulled apart. INSERT plus a unique constraint gives the same guarantee.", pulse: ['sql'] }
		]
	},
	{
		id: 'be-pessimistic-vs-optimistic',
		topic: 'backend',
		group: 'ch8',
		title: 'Lock first, or check the version?',
		blurb: 'What are pessimistic and optimistic locking?',
		nodes: [
			box('asha', 14, 16, 100, 40, 'Asha'),
			box('ben', 246, 16, 100, 40, 'Ben'),
			table('seat', 96, 122, ['seat', 'owner', 'ver'], [['12A', 'nobody', '1']], { colW: 56, title: 'seats' }),
			box('lock', 120, 198, 120, 34, 'row lock: Asha', { tone: 'warn' }),
			edge('e1', 'asha', 'seat', { label: 'FOR UPDATE' }),
			edge('e2', 'ben', 'seat', { label: 'FOR UPDATE', tone: 'warn' }),
			edge('e3', 'asha', 'seat', { label: 'WHERE ver = 1' }),
			edge('e4', 'ben', 'seat', { label: 'WHERE ver = 1' }),
			text('note', 180, 270, '', { w: 330, anchor: 'middle' })
		],
		steps: [
			{ say: 'Two ways to stop a race. First, pessimistic: lock the row before reading it, so nobody else can touch it meanwhile.', show: ['asha', 'ben', 'seat', 'note'], set: { note: { text: 'Pessimistic: take the lock first' } }, focus: ['seat'] },
			{ say: 'Asha runs SELECT ... FOR UPDATE. She gets the lock on seat 12A.', show: ['e1', 'lock'], focus: ['lock'] },
			{ say: 'Ben runs the same query and is made to wait until Asha is finished.', show: ['e2'], set: { ben: { tone: 'warn' } }, focus: ['ben'] },
			{ say: "Asha updates the seat and commits, which releases the lock. Ben's query now continues and sees that the owner is Asha.", hide: ['lock', 'e1', 'e2'], set: { seat: { rows: [['12A', 'Asha', '1']], hl: [0] }, ben: { tone: 'neutral' } }, pulse: ['seat'] },
			{ say: 'Second, optimistic: take no lock. Just remember the version number you read. (The seat is reset for this round.)', set: { seat: { rows: [['12A', 'nobody', '1']], hl: [] }, note: { text: 'Optimistic: no lock, a version number' } }, focus: ['seat'] },
			{ say: 'Both read version 1, then each sends UPDATE ... SET ver = 2 WHERE ver = 1, so the write only lands if nobody changed the row.', show: ['e3', 'e4'], focus: ['e3', 'e4'] },
			{ say: "The first one wins and the version becomes 2. The second finds the version is no longer 1, so it matches 0 rows and must retry.", set: { seat: { rows: [['12A', 'Asha', '2']], hl: [0] }, ben: { sub: 'matched 0 rows', tone: 'neg' }, e4: { tone: 'neg' } }, focus: ['ben'] },
			{ say: 'Rule of thumb: lock when clashes are common, check versions when they are rare. Locks make people wait, versions make losers retry.', set: { note: { text: 'Locks make people wait, versions make losers retry', tone: 'accent' } }, pulse: ['note'] }
		]
	},
	{
		id: 'be-idempotency-key',
		topic: 'backend',
		group: 'ch8',
		title: 'Tapping Pay twice charges once',
		blurb: 'How do you make a retry safe?',
		nodes: [
			box('phone', 110, 10, 140, 40, 'Phone app', { sub: 'Idempotency-Key: k-91' }),
			box('api', 110, 106, 140, 40, 'Payments API'),
			table('keys', 110, 196, ['key', 'result'], [], { colW: 70, title: 'keys' }),
			edge('e1', 'phone', 'api', { label: 'POST /pay (k-91)' }),
			edge('e2', 'phone', 'api', { label: 'retry (k-91)', tone: 'warn' }),
			edge('e3', 'api', 'phone', { label: 'paid (saved result)', tone: 'accent' }),
			edge('e4', 'api', 'keys', { label: 'check k-91' })
		],
		steps: [
			{ say: 'The user taps Pay. The app sends the request with a unique Idempotency-Key it made up, k-91.', show: ['phone', 'api', 'e1'], focus: ['phone'] },
			{ say: "Before charging, the server looks for k-91 in its keys table. It isn't there, so this is a new payment.", show: ['keys', 'e4'], focus: ['keys'] },
			{ say: 'It charges the card once and saves k-91 together with the result.', set: { keys: { rows: [['k-91', 'paid 499']], hl: [0] } }, pulse: ['api'] },
			{ say: 'The response gets lost on a bad connection. The app thinks it failed, and the user taps Pay again, sending the same key.', hide: ['e1'], show: ['e2'], focus: ['e2'] },
			{ say: 'The server finds k-91 already saved, so it does not charge again. It just returns the saved result.', hide: ['e2'], show: ['e3'], focus: ['keys'] },
			{ say: "One charge, however many retries. Any request you can't safely repeat should accept an idempotency key.", pulse: ['phone'] }
		]
	},
	{
		id: 'be-seat-hold-expiry',
		topic: 'backend',
		group: 'ch8',
		title: 'Holding a seat while someone pays',
		blurb: 'How do you reserve something for ten minutes without a timer?',
		stage: { w: 360, h: 215 },
		nodes: [
			text('clock', 20, 30, 'Time: 10:00', { size: 'lg' }),
			table('seat', 40, 50, ['seat', 'status', 'until'], [['12A', 'free', '-']], { colW: 94, title: 'seats' }),
			box('ben', 110, 150, 140, 44, 'Ben', { sub: 'wants seat 12A' })
		],
		steps: [
			{ say: 'Checkout takes minutes. Marking the seat booked too early blocks others if the buyer walks away. Leaving it free lets two people pay for it.', show: ['clock', 'seat'], focus: ['seat'] },
			{ say: 'So the seat gets a hold. When Asha starts checkout at 10:00, it becomes held for 10 minutes.', set: { seat: { rows: [['12A', 'held by Asha', '10:10']], hl: [0] } }, pulse: ['seat'] },
			{ say: "Ben looks at 10:03 and sees the seat is held, so he can't take it.", show: ['ben'], set: { clock: { text: 'Time: 10:03' }, ben: { sub: 'sees: held until 10:10' } }, focus: ['ben'] },
			{ say: 'If Asha pays at 10:04, the status becomes booked for good.', set: { clock: { text: 'Time: 10:04' }, seat: { rows: [['12A', 'booked: Asha', '-']], hl: [0] } }, focus: ['seat'] },
			{ say: 'Now the other case: she walks away instead. Nothing needs to run at 10:10, because the hold simply runs out.', set: { clock: { text: 'Time: 10:11' }, seat: { rows: [['12A', 'held by Asha', '10:10']], hl: [], tone: 'warn' }, ben: { sub: 'tries again' } }, focus: ['clock'] },
			{ say: "Queries treat 'free, or held with until in the past' as available, so Ben's booking at 10:11 succeeds and starts a new hold.", set: { seat: { rows: [['12A', 'held by Ben', '10:21']], hl: [0], tone: 'neutral' }, ben: { sub: 'got it' } }, focus: ['seat'] }
		]
	},

	// ───────────────────────── ch9 · Caching & rate limiting ─────────────────────────
	{
		id: 'be-cache-aside',
		topic: 'backend',
		group: 'ch9',
		title: 'Cache-aside: check the cache first',
		blurb: 'How does a cache make repeat requests cheap?',
		nodes: [
			box('api', 110, 14, 140, 44, 'API', { sub: 'GET /products/42' }),
			box('cache', 35, 150, 120, 56, 'Redis', { sub: 'in memory' }),
			box('db', 205, 150, 120, 56, 'Postgres', { sub: 'on disk' }),
			text('cnt', 180, 280, 'Database queries: 0', { size: 'sm', w: 300, anchor: 'middle' }),
			edge('e1', 'api', 'cache', { label: 'GET product:42' }),
			edge('e2', 'cache', 'api', { label: 'miss', tone: 'warn' }),
			edge('e3', 'api', 'db', { label: 'SELECT ...' }),
			edge('e4', 'db', 'api', { label: 'row' }),
			edge('e5', 'api', 'cache', { label: 'SET ... EX 60', tone: 'accent' })
		],
		steps: [
			{ say: 'A request comes in for product 42. Reading it from the database every time is slow and puts load on the database.', show: ['api', 'cnt'], focus: ['api'] },
			{ say: 'Cache-aside: the code checks the cache first, using a key like product:42. Redis answers from memory in about a millisecond.', show: ['cache', 'e1'], focus: ['cache'] },
			{ say: "This time the key isn't there yet: a cache miss.", show: ['e2'], focus: ['e2'] },
			{ say: 'On a miss, ask the database (slower, maybe 50 ms) and get the row.', hide: ['e1', 'e2'], show: ['db', 'e3', 'e4'], set: { cnt: { text: 'Database queries: 1' } }, focus: ['db'] },
			{ say: 'Save the answer in the cache with an expiry (TTL) of 60 seconds, then return it to the user.', hide: ['e3', 'e4'], show: ['e5'], set: { cache: { sub: 'product:42 (60 s)', tone: 'accent' } }, pulse: ['cache'] },
			{ say: "The next request finds the key: a cache hit. The database isn't touched at all.", hide: ['e5'], show: ['e1', 'e2'], set: { e2: { label: 'hit', tone: 'accent' }, cnt: { text: 'Database queries: still 1' } }, focus: ['cache'] }
		]
	},
	{
		id: 'be-cache-staleness',
		topic: 'backend',
		group: 'ch9',
		title: 'Stale data and invalidation',
		blurb: 'What happens when the data changes but the cache does not?',
		nodes: [
			box('cache', 20, 40, 120, 56, 'Redis', { sub: 'price:42 = 499' }),
			box('db', 200, 40, 120, 56, 'Postgres', { sub: 'price = 499' }),
			box('shopper', 20, 190, 120, 44, 'Shopper'),
			box('admin', 200, 190, 120, 44, 'Admin'),
			edge('e1', 'admin', 'db', { label: 'price = 399' }),
			edge('e2', 'shopper', 'cache', { label: 'GET price:42' }),
			edge('e3', 'admin', 'cache', { label: 'DEL price:42', tone: 'accent' }),
			text('note', 180, 266, '', { w: 330, anchor: 'middle' })
		],
		steps: [
			{ say: 'The shop shows a price. The database says 499, and Redis holds a copy of 499 that expires in 60 seconds.', show: ['cache', 'db'], focus: ['cache', 'db'] },
			{ say: 'An admin lowers the price to 399. The database changes right away.', show: ['admin', 'e1'], set: { db: { sub: 'price = 399', tone: 'accent' } }, focus: ['db'] },
			{ say: 'A shopper loads the page. The cache still holds 499 and answers first, so the shopper sees the old price.', show: ['shopper', 'e2'], set: { cache: { tone: 'warn' } }, focus: ['cache'] },
			{ say: 'That is stale data: the cache and the database disagree until the 60 seconds run out. A TTL alone leaves a gap.', show: ['note'], set: { note: { text: 'Stale: shopper sees 499, real price is 399', tone: 'warn' } }, focus: ['note'] },
			{ say: 'Fix one: whenever the code changes the price, it also deletes the cache key. That is invalidation.', hide: ['e2'], show: ['e3'], set: { cache: { sub: 'empty', tone: 'neutral' }, note: { text: 'Cache key deleted on write', tone: 'neutral' } }, focus: ['e3'] },
			{ say: 'The next read is a miss, so it loads 399 from the database and refills the cache. Everyone now sees 399.', hide: ['e3'], show: ['e2'], set: { cache: { sub: 'price:42 = 399', tone: 'accent' }, note: { text: 'Fresh: 399 everywhere', tone: 'accent' } }, pulse: ['cache'] },
			{ say: 'Keep both safety nets: invalidate on every write you know about, and keep a short TTL for the ones you miss.', focus: ['cache', 'db'] }
		]
	},
	{
		id: 'be-cache-stampede',
		topic: 'backend',
		group: 'ch9',
		title: 'A hot key expires: the stampede',
		blurb: 'Why can one expired cache key take a database down?',
		nodes: [
			box('users', 110, 10, 140, 40, 'Users', { sub: '5,000 requests/s' }),
			box('cache', 110, 100, 140, 44, 'Cache', { sub: 'hot page: 60 s TTL' }),
			box('db', 110, 200, 140, 50, 'Database', { sub: 'normal load' }),
			box('lock', 270, 92, 80, 52, 'lock', { sub: 'one winner', tone: 'accent' }),
			edge('e1', 'users', 'cache', { label: 'GET page' }),
			edge('e2', 'cache', 'db', { label: 'MISS: query', tone: 'warn' })
		],
		steps: [
			{ say: 'A popular page is cached with a 60-second TTL. Thousands of requests a second are answered from the cache, and the database stays calm.', show: ['users', 'cache', 'db', 'e1'], focus: ['cache'] },
			{ say: 'At second 60 the key expires. The cache is now empty for this page.', set: { cache: { sub: 'EXPIRED', tone: 'warn' } }, focus: ['cache'] },
			{ say: 'In that same instant 5,000 requests arrive. Every one asks the cache, and every one gets a miss.', set: { users: { tone: 'warn' } }, pulse: ['users'] },
			{ say: 'Each request runs the slow query itself, because nobody has saved the result yet. The database gets 5,000 copies of the same query.', show: ['e2'], set: { db: { sub: '5,000 queries', tone: 'neg' } }, focus: ['db'] },
			{ say: 'Fix: a lock, also called single flight. The first request that misses takes the lock and recomputes. The others wait for it.', show: ['lock'], set: { db: { sub: '1 query', tone: 'accent' }, e2: { label: '1 query', tone: 'accent' }, users: { tone: 'neutral' } }, focus: ['lock'] },
			{ say: 'It saves the fresh value and releases the lock. The other 4,999 requests then read the value from the cache.', hide: ['lock'], set: { cache: { sub: 'refilled: 60 s', tone: 'accent' }, db: { sub: 'normal load', tone: 'neutral' } }, pulse: ['cache'] },
			{ say: "You can also refresh a hot key shortly before it expires, or add a little random time to each TTL so keys don't all expire together.", focus: ['cache'] }
		]
	},
	{
		id: 'be-lru-eviction',
		topic: 'backend',
		group: 'ch9',
		title: 'LRU: what a full cache throws out',
		blurb: 'When the cache is full, which entry should go?',
		nodes: [
			box('req', 110, 8, 140, 36, 'Request', { sub: 'key: A' }),
			table('cache', 50, 76, ['key', 'last used'], [['B', '1 min ago'], ['C', '2 min ago'], ['A', '5 min ago']], { colW: 130, title: 'cache (capacity 3)' }),
			box('dbx', 110, 226, 140, 44, 'Database'),
			edge('e1', 'req', 'cache'),
			edge('e2', 'cache', 'dbx', { label: 'miss', tone: 'warn' })
		],
		steps: [
			{ say: 'This cache can hold only 3 entries, listed here by when each was last used. B was used most recently, A the longest ago.', show: ['cache'], focus: ['cache'] },
			{ say: 'A request for key A finds it: a hit. A moves to the top as the most recently used entry.', show: ['req', 'e1'], set: { cache: { rows: [['A', 'just now'], ['B', '1 min ago'], ['C', '2 min ago']], hl: [0] } }, pulse: ['cache'] },
			{ say: 'Now a request for key D. It is not in the cache, so it is loaded from the database.', hide: ['e1'], show: ['dbx', 'e2'], set: { req: { sub: 'key: D' }, cache: { hl: [] } }, focus: ['dbx'] },
			{ say: 'The cache is full, so something must go. LRU (least recently used) removes the entry untouched for the longest: C.', set: { cache: { hl: [2], tone: 'warn' } }, focus: ['cache'] },
			{ say: 'D takes the top spot and C is gone. A and B, used recently, stay.', hide: ['e2'], set: { cache: { rows: [['D', 'just now'], ['A', '1 min ago'], ['B', '2 min ago']], hl: [0], tone: 'neutral' } }, pulse: ['cache'] },
			{ say: "LRU bets that what you used recently you'll use again, so hot keys stay and cold ones make room.", focus: ['cache'] }
		]
	},
	{
		id: 'be-token-bucket',
		topic: 'backend',
		group: 'ch9',
		title: 'Rate limiting with a token bucket',
		blurb: 'How do you allow bursts but cap the average rate?',
		nodes: [
			box('req', 110, 8, 140, 40, 'Requests'),
			box('bucket', 80, 84, 200, 100, 'Bucket', { sub: 'holds 5, refills 1 per second' }),
			tok('t1', 116, 166, { r: 8, tone: 'accent' }),
			tok('t2', 148, 166, { r: 8, tone: 'accent' }),
			tok('t3', 180, 166, { r: 8, tone: 'accent' }),
			tok('t4', 212, 166, { r: 8, tone: 'accent' }),
			tok('t5', 244, 166, { r: 8, tone: 'accent' }),
			box('res', 110, 226, 140, 44, 'allowed', { tone: 'accent' }),
			edge('e1', 'req', 'bucket', { label: 'takes 1 token' }),
			edge('e2', 'bucket', 'res')
		],
		steps: [
			{ say: 'A token bucket holds up to 5 tokens. Every request must take one, and one new token drips in each second.', show: ['bucket', 't1', 't2', 't3', 't4', 't5'], focus: ['bucket'] },
			{ say: 'A burst of 3 requests arrives together. They take 3 tokens and all get through.', show: ['req', 'e1', 'res', 'e2'], hide: ['t3', 't4', 't5'], pulse: ['res'] },
			{ say: 'Two more arrive right away and take the last two tokens. Bursts are fine, up to the size of the bucket.', hide: ['t1', 't2'], focus: ['bucket'] },
			{ say: 'The sixth request finds the bucket empty. It is rejected with 429 Too Many Requests.', set: { res: { label: '429 slow down', tone: 'neg' } }, pulse: ['res'] },
			{ say: 'A second later one token has dripped back in, so the next request is allowed again.', show: ['t1'], set: { res: { label: 'allowed', tone: 'accent' } }, focus: ['bucket'] },
			{ say: 'The result is a bounded average of 1 request per second with short bursts of up to 5. Redis can keep this counter for every user.', focus: ['bucket'] }
		]
	},

	// ───────────────────────── ch10 · Background jobs & resilience ─────────────────────────
	{
		id: 'be-queue-worker',
		topic: 'backend',
		group: 'ch10',
		title: 'Queues and background workers',
		blurb: 'Why not do slow work inside the request?',
		nodes: [
			box('app', 110, 6, 140, 36, 'App'),
			box('api', 110, 84, 140, 36, 'API'),
			box('mail', 110, 250, 140, 36, 'Email service'),
			box('queue', 20, 180, 110, 40, 'Queue', { sub: 'job: send_welcome' }),
			box('worker', 230, 180, 110, 40, 'Worker'),
			text('wait', 268, 100, 'user waits ~3 s', { size: 'sm', w: 90, tone: 'warn' }),
			edge('e1', 'app', 'api', { label: 'POST /signup' }),
			edge('e2', 'api', 'app', { label: '201 Created', tone: 'accent' }),
			edge('esync', 'api', 'mail', { label: 'send email (3 s)', tone: 'warn' }),
			edge('eq', 'api', 'queue', { label: 'enqueue job' }),
			edge('ew', 'queue', 'worker', { label: 'take job' }),
			edge('em', 'worker', 'mail', { label: 'send' })
		],
		steps: [
			{ say: 'A signup must also send a welcome email. The email service takes about 3 seconds to answer.', show: ['app', 'api', 'mail', 'e1'], focus: ['app'] },
			{ say: 'Doing it inside the request means the API waits 3 seconds while the user stares at a spinner. If the email service is down, signup fails too.', show: ['esync', 'wait'], focus: ['esync'] },
			{ say: 'Better: the API puts a small job on a queue, which takes milliseconds, and moves on.', hide: ['esync', 'wait'], show: ['queue', 'eq'], focus: ['queue'] },
			{ say: 'It replies immediately with 201 Created. The user carries on without waiting for the email.', show: ['e2'], focus: ['app'] },
			{ say: 'A worker, a separate process, takes the job from the queue.', show: ['worker', 'ew'], focus: ['worker'] },
			{ say: 'The worker calls the email service. If that fails, the job stays queued and is retried later. The user never noticed.', show: ['em'], pulse: ['mail'] }
		]
	},
	{
		id: 'be-retry-backoff-jitter',
		topic: 'backend',
		group: 'ch10',
		title: 'Retries: back off and add jitter',
		blurb: 'How should a client retry a failing call?',
		nodes: [
			box('client', 20, 16, 100, 44, 'Client'),
			box('api', 240, 16, 100, 44, 'Payment API', { tone: 'warn' }),
			edge('e1', 'client', 'api', { label: 'POST /charge' }),
			edge('e2', 'api', 'client', { label: '503', tone: 'neg' }),
			doc('log', 40, 100, 280, ['try 1: 503 error'], { title: 'client log' }),
			text('note', 180, 268, '', { w: 330, anchor: 'middle' })
		],
		steps: [
			{ say: 'The client calls a payment API that is overloaded. It answers 503, which means try again later.', show: ['client', 'api', 'e1', 'e2', 'log'], focus: ['api'] },
			{ say: 'Retrying instantly feels natural. But a thousand clients doing it at once keep the struggling service down.', show: ['note'], set: { note: { text: 'Instant retries pile on more load', tone: 'warn' } }, focus: ['note'] },
			{ say: 'Exponential backoff: wait before each retry and double the wait. First 1 second, then try again.', set: { log: { lines: ['try 1: 503 error', 'wait 1 s', 'try 2: 503 error'] }, note: { text: 'Wait, then retry', tone: 'neutral' } }, focus: ['log'] },
			{ say: 'Still failing, so wait 2 seconds, then 4. Each pause gives the service more room to recover.', set: { log: { lines: ['try 1: 503 error', 'wait 1 s', 'try 2: 503 error', 'wait 2 s', 'try 3: 503 error', 'wait 4 s'] } }, focus: ['log'] },
			{ say: 'The 4th try gets 200 OK. Cap both the delay (say 30 s) and the number of attempts, so a client never retries forever.', set: { log: { lines: ['try 1: 503 error', 'wait 1 s', 'try 2: 503 error', 'wait 2 s', 'try 3: 503 error', 'wait 4 s', 'try 4: 200 OK'] }, api: { tone: 'accent' }, e2: { label: '200', tone: 'accent' } }, pulse: ['api'] },
			{ say: 'But if 1,000 clients failed together, they all retry at 1 s, 2 s, 4 s: synchronized waves that hit the service at the same instant.', set: { log: { title: 'no jitter: all 1,000 clients', lines: ['wait 1 s  -> 1,000 retries', 'wait 2 s  -> 1,000 retries', 'wait 4 s  -> 1,000 retries'] }, api: { tone: 'warn' }, e2: { label: '503', tone: 'neg' }, note: { text: 'Synchronized waves', tone: 'warn' } }, focus: ['log'] },
			{ say: 'Jitter adds a random extra to each wait, so retries spread out instead of arriving as one wave.', set: { log: { title: 'with jitter', lines: ['client A: wait 1.2 s', 'client B: wait 1.4 s', 'client C: wait 1.1 s', 'client D: wait 1.5 s'], tone: 'accent' }, api: { tone: 'neutral' }, note: { text: 'Spread-out retries', tone: 'accent' } }, pulse: ['log'] }
		]
	},
	{
		id: 'be-circuit-breaker',
		topic: 'backend',
		group: 'ch10',
		title: 'Circuit breaker: stop calling a dead API',
		blurb: 'What should you do when a dependency is down for minutes?',
		nodes: [
			box('api', 10, 110, 90, 50, 'Your API'),
			box('br', 125, 100, 110, 70, 'CLOSED', { sub: 'calls pass through', tone: 'accent' }),
			box('dep', 260, 110, 90, 50, 'Payment API'),
			edge('e1', 'api', 'br'),
			edge('e2', 'br', 'dep', { tone: 'accent' }),
			text('cnt', 180, 208, 'failures in a row: 0 of 3', { w: 300, anchor: 'middle' }),
			text('note', 180, 258, '', { w: 330, anchor: 'middle' })
		],
		steps: [
			{ say: 'A circuit breaker sits in front of a risky call, like the one to a payment API. While it is closed, calls pass straight through.', show: ['api', 'br', 'dep', 'e1', 'e2', 'cnt'], focus: ['br'] },
			{ say: 'The payment API starts failing. The breaker counts failures in a row: 1, 2, 3.', set: { dep: { tone: 'neg' }, cnt: { text: 'failures in a row: 3 of 3', tone: 'warn' } }, focus: ['dep'] },
			{ say: 'At 3 failures the breaker opens. Calls now fail instantly instead of waiting 30 seconds for a timeout, so your workers stay free.', set: { br: { label: 'OPEN', sub: 'calls fail fast', tone: 'neg' }, e2: { tone: 'neg', dashed: true } }, pulse: ['br'] },
			{ say: 'While it is open you return a friendly fallback and stop hammering a service that is already down.', show: ['note'], set: { note: { text: 'Users see a fallback message, not a spinner', tone: 'neutral' } }, focus: ['note'] },
			{ say: 'After a cooldown (say 30 seconds) the breaker goes half-open and lets one trial call through.', set: { br: { label: 'HALF-OPEN', sub: 'one trial call', tone: 'warn' }, dep: { tone: 'warn' }, e2: { tone: 'warn', dashed: false }, note: { text: 'Cooldown over: testing the service' } }, focus: ['br'] },
			{ say: 'If the trial succeeds the breaker closes and traffic flows again. If it fails, it opens for another cooldown.', set: { br: { label: 'CLOSED', sub: 'calls pass through', tone: 'accent' }, dep: { tone: 'neutral' }, e2: { tone: 'accent' }, cnt: { text: 'failures in a row: 0 of 3', tone: 'neutral' }, note: { text: 'Recovered', tone: 'accent' } }, pulse: ['br'] },
			{ say: "Pair the breaker with a timeout on every external call, so one slow dependency can't tie up all your workers.", focus: ['api'] }
		]
	},
	{
		id: 'be-dead-letter-queue',
		topic: 'backend',
		group: 'ch10',
		title: 'Dead-letter queue: the job that fails',
		blurb: 'What happens to a job that keeps failing?',
		nodes: [
			table('q', 80, 14, ['job', 'state'], [['#41', 'waiting'], ['#42', 'waiting']], { colW: 100, title: 'queue' }),
			box('worker', 110, 132, 140, 40, 'Worker'),
			box('done', 280, 132, 70, 40, 'done', { tone: 'accent' }),
			box('dlq', 80, 232, 200, 48, 'Dead-letter queue', { sub: '#41: bad address', tone: 'warn' }),
			text('att', 10, 156, 'attempt 1 of 3', { size: 'sm', w: 90, tone: 'warn' }),
			edge('e1', 'q', 'worker', { label: 'take job' }),
			edge('e2', 'worker', 'done'),
			edge('e3', 'worker', 'dlq', { label: 'gave up', tone: 'warn' })
		],
		steps: [
			{ say: "The queue holds two jobs. #41 sends a welcome email to an address that doesn't exist, so it will always fail. #42 is fine.", show: ['q', 'worker', 'e1'], focus: ['q'] },
			{ say: 'The worker takes #41 and tries. It fails, so the job goes back on the queue to be retried later.', show: ['att'], set: { q: { rows: [['#41', 'retry 1 of 3'], ['#42', 'waiting']], hl: [0] } }, focus: ['worker'] },
			{ say: 'It fails again, and again. Every retry wastes a worker turn while #42 waits behind it.', set: { q: { rows: [['#41', 'retry 3 of 3'], ['#42', 'waiting']], hl: [0], tone: 'warn' }, att: { text: 'attempt 3 of 3' } }, focus: ['q'] },
			{ say: 'Retrying forever would block the queue for good. After the maximum attempts, the job is moved to a dead-letter queue (DLQ).', hide: ['att'], show: ['dlq', 'e3'], set: { q: { rows: [['#42', 'waiting']], hl: [], tone: 'neutral' } }, focus: ['dlq'] },
			{ say: 'The worker moves on and processes #42 normally. One bad job no longer holds up the rest.', show: ['done', 'e2'], set: { q: { rows: [] } }, pulse: ['done'] },
			{ say: 'The DLQ is for humans: an alert fires, someone fixes the bug or the data, then replays the job. Without a DLQ, bad jobs vanish or loop silently.', focus: ['dlq'], pulse: ['dlq'] }
		]
	},
	{
		id: 'be-idempotent-consumer',
		topic: 'backend',
		group: 'ch10',
		title: 'Delivered twice, handled once',
		blurb: 'What if a queue gives you the same job twice?',
		nodes: [
			box('queue', 110, 10, 140, 40, 'Queue', { sub: 'job #7: email Asha' }),
			box('worker', 110, 100, 140, 44, 'Worker'),
			box('mail', 275, 104, 75, 36, 'Email'),
			table('done', 90, 196, ['job id', 'status'], [], { colW: 90, title: 'processed' }),
			text('note', 180, 272, 'Asha gets the email twice', { w: 330, anchor: 'middle', tone: 'neg' }),
			edge('e1', 'queue', 'worker', { label: 'deliver #7' }),
			edge('e2', 'worker', 'mail'),
			edge('e3', 'worker', 'done', { label: 'record #7' })
		],
		steps: [
			{ say: "Most queues promise at-least-once delivery: a job arrives one or more times, never zero. 'More than once' is the catch.", show: ['queue', 'worker', 'e1'], focus: ['queue'] },
			{ say: 'The worker takes job #7 and sends Asha her email.', show: ['mail', 'e2'], focus: ['worker'] },
			{ say: "Then it crashes before telling the queue the job is done (the acknowledgement, or ack).", set: { worker: { sub: 'crashed before ack', tone: 'neg' } }, focus: ['worker'] },
			{ say: 'With no ack, the queue assumes failure and delivers job #7 again. Unprotected, Asha gets two emails.', show: ['note'], pulse: ['queue'] },
			{ say: 'The fix is an idempotent consumer: the worker records each finished job id in a processed table, in the same transaction as the work.', hide: ['note'], show: ['done', 'e3'], set: { worker: { sub: '', tone: 'neutral' }, done: { rows: [['#7', 'done']] } }, focus: ['done'] },
			{ say: 'When #7 arrives again, the worker finds it in the table, skips the work and acknowledges the job.', set: { done: { hl: [0] } }, pulse: ['done'] },
			{ say: 'Retries are now harmless. The queue may deliver twice, but your system acts only once.', focus: ['worker'] }
		]
	},

	// ───────────────────────── ch11 · Testing, Docker & observability ─────────────────────────
	{
		id: 'be-test-pyramid',
		topic: 'backend',
		group: 'ch11',
		title: 'Unit, integration, end to end',
		blurb: 'How many of each kind of test do you want?',
		nodes: [
			box('e2e', 120, 64, 120, 56, 'End to end', { sub: 'few · minutes · real browser' }),
			box('integ', 80, 130, 200, 56, 'Integration tests', { sub: 'some · seconds · real DB or HTTP' }),
			box('unit', 30, 196, 300, 56, 'Unit tests', { sub: 'many · milliseconds · one function, no I/O' }),
			text('note', 180, 284, '', { w: 330, anchor: 'middle', size: 'sm' })
		],
		steps: [
			{ say: 'Tests give you the confidence to change code without breaking it. Three kinds trade realism against speed.', show: ['note'], set: { note: { text: 'Pick the cheapest test that would catch the bug' } } },
			{ say: 'Unit tests check one function in isolation, with no network or database. You can run thousands in a second.', show: ['unit'], focus: ['unit'] },
			{ say: 'Integration tests run several pieces together, like your API with a real Postgres. They catch wrong SQL and broken wiring between layers.', show: ['integ'], focus: ['integ'] },
			{ say: 'End-to-end tests drive the whole app through a real browser. Most realistic, but slow and prone to flaky failures.', show: ['e2e'], focus: ['e2e'] },
			{ say: 'The pyramid: many cheap tests at the base, few slow ones at the top. A bug caught by a unit test costs seconds to find, one caught only end to end costs minutes.', set: { note: { text: 'Wide base, narrow top', tone: 'accent' } }, pulse: ['unit'] }
		]
	},
	{
		id: 'be-arrange-act-assert',
		topic: 'backend',
		group: 'ch11',
		title: 'Anatomy of a test: arrange, act, assert',
		blurb: 'What does a good pytest test look like?',
		nodes: [
			doc('code', 20, 16, 320, [
				'def test_discount_code_takes_10_percent_off():',
				'    cart = Cart()',
				'    cart.add("pen", price=100)',
				'    total = cart.total(code="SAVE10")',
				'    assert total == 90'
			]),
			text('lbl', 180, 140, 'Arrange', { size: 'lg', anchor: 'middle' }),
			box('res', 80, 170, 200, 44, 'PASSED', { tone: 'accent' })
		],
		steps: [
			{ say: 'A test is a function whose name says what should be true. pytest runs every function whose name starts with test_.', show: ['code'], focus: ['code'] },
			{ say: 'Arrange: set up the inputs. Here, a cart holding one pen that costs 100.', show: ['lbl'], set: { code: { hl: [1, 2] }, lbl: { text: 'Arrange' } } },
			{ say: 'Act: do the one thing you are testing. Here, ask the cart for its total with a discount code.', set: { code: { hl: [3] }, lbl: { text: 'Act' } } },
			{ say: 'Assert: state what must be true. If the expression is false, the test fails and pytest shows both values.', set: { code: { hl: [4] }, lbl: { text: 'Assert' } } },
			{ say: 'Run pytest. The total is 90, so the assertion holds and the test passes.', hide: ['lbl'], show: ['res'], set: { code: { hl: [] } }, pulse: ['res'] },
			{ say: 'If a change breaks the discount and the total comes out 89, the test fails and shows exactly what differed, before a customer finds out.', set: { res: { label: 'FAILED: 89 != 90', tone: 'neg' } }, pulse: ['res'] }
		]
	},
	{
		id: 'be-pytest-fixture',
		topic: 'backend',
		group: 'ch11',
		title: 'Fixtures: setup you write once',
		blurb: 'How do tests share setup without copying it?',
		nodes: [
			doc('fx', 20, 10, 320, ['@pytest.fixture', 'def cart():', '    c = Cart()', '    c.add("pen", price=100)', '    return c']),
			doc('tests', 20, 150, 320, ['def test_total(cart):', '    assert cart.total() == 100', 'def test_clear_empties_cart(cart):', '    cart.clear(); assert cart.total() == 0']),
			tok('tok', 332, 56),
			edge('e1', 'tests', 'fx', { label: 'asks for cart' }),
			text('note', 180, 262, 'Each test gets its own fresh cart', { w: 330, anchor: 'middle', tone: 'accent' })
		],
		steps: [
			{ say: 'Many tests need the same setup, like a cart with one pen in it. Writing it out in every test is noisy and easy to get wrong.', show: ['fx'], focus: ['fx'] },
			{ say: 'A fixture is a function marked @pytest.fixture that builds that setup in one place and returns it.', set: { fx: { hl: [0, 1] } }, focus: ['fx'] },
			{ say: 'A test asks for it just by naming it as a parameter. No import and no call.', show: ['tests', 'e1'], set: { tests: { hl: [0, 2] } }, focus: ['tests'] },
			{ say: 'Before each test, pytest runs the fixture and passes in whatever it returned.', show: ['tok'], move: { tok: { x: 332, y: 176 } }, pulse: ['tests'] },
			{ say: "Each test gets a fresh cart, so test_clear_empties_cart can't affect test_total. Tests stay independent of each other.", show: ['note'], focus: ['tests'] }
		]
	},
	{
		id: 'be-docker-image-container',
		topic: 'backend',
		group: 'ch11',
		title: 'Docker: image, layers, container',
		blurb: 'What do Dockerfile, image and container each mean?',
		nodes: [
			doc('df', 60, 8, 240, ['FROM python:3.12-slim', 'COPY requirements.txt .', 'RUN pip install -r requirements.txt', 'COPY . .', 'CMD ["uvicorn", "app:app"]']),
			box('l1', 60, 116, 240, 26, 'FROM python:3.12-slim: OS + Python'),
			box('l2', 60, 144, 240, 26, 'RUN pip install: your libraries'),
			box('l3', 60, 172, 240, 26, 'COPY . . : your code'),
			box('l4', 60, 200, 240, 26, 'CMD: start command (metadata)'),
			box('c1', 60, 246, 110, 40, 'Container 1', { tone: 'accent' }),
			box('c2', 190, 246, 110, 40, 'Container 2', { tone: 'accent' })
		],
		steps: [
			{ say: "A Dockerfile is a recipe for your app's environment: the base system, your libraries, your code, and how to start it.", show: ['df'], focus: ['df'] },
			{ say: 'docker build runs it top to bottom. Each line adds a layer: first the base image with Python 3.12, then your libraries.', show: ['l1', 'l2'], focus: ['l1', 'l2'] },
			{ say: 'Then your code and the start command. The whole stack of layers is the image: a read-only snapshot.', show: ['l3', 'l4'], focus: ['l3', 'l4'] },
			{ say: 'Layers are cached. If only your code changed, Docker rebuilds just the code layer. That is why dependencies come before COPY . .', focus: ['l2', 'l3'], pulse: ['l3'] },
			{ say: 'docker run starts a container from the image: a running, isolated copy. You can start many containers from one image.', show: ['c1', 'c2'], pulse: ['c1', 'c2'] },
			{ say: "The same image runs the same on your laptop, CI and the server, which ends 'works on my machine'. docker compose can start your API, Postgres and Redis together.", focus: ['c1', 'c2'] }
		]
	},
	{
		id: 'be-observability',
		topic: 'backend',
		group: 'ch11',
		title: 'Logs, metrics, traces and health checks',
		blurb: 'How do you find out what a production app is doing?',
		nodes: [
			box('api', 110, 8, 140, 40, 'Your API', { sub: 'running in production' }),
			doc('logs', 30, 84, 300, ['10:02:11 INFO  GET /orders 200 45ms', '10:02:12 ERROR db timeout order=7', '10:02:12 WARN  retry 1 of 3', '10:02:15 INFO  GET /orders 200 2.1s'], { title: 'logs', hl: [1] }),
			table('metrics', 80, 84, ['metric', 'now'], [['requests per s', '120'], ['p95 latency', '1.8 s'], ['error rate', '4 %']], { colW: 100, title: 'metrics', hl: [1, 2] }),
			doc('trace', 30, 84, 300, ['GET /orders             1.8 s', '  api code              0.1 s', '  database query        1.6 s', '  render response       0.1 s'], { title: 'one request, traced', hl: [2] }),
			doc('health', 40, 84, 280, ['GET /healthz  ->  503', '{ "api": "ok",', '  "database": "ok",', '  "redis": "down" }'], { title: 'health check', hl: [3] }),
			text('note', 180, 252, '', { w: 330, anchor: 'middle' })
		],
		steps: [
			{ say: "Something is slow in production and you can't attach a debugger. Observability means your app emits signals you can read afterwards.", show: ['api', 'note'], set: { note: { text: 'Three signals: logs, metrics, traces' } }, focus: ['api'] },
			{ say: "Logs are timestamped events: what happened, in order. Good for 'what went wrong for order 7?'", show: ['logs'], set: { note: { text: 'Logs: what happened' } }, focus: ['logs'] },
			{ say: "Metrics are numbers over time: requests per second, latency, error rate. Good for 'is something wrong right now?' and for alerts.", hide: ['logs'], show: ['metrics'], set: { note: { text: 'Metrics: how much, how often' } }, focus: ['metrics'] },
			{ say: "Traces follow one request through the system and time each step. Good for 'where did the time go?' Here it went into the database query.", hide: ['metrics'], show: ['trace'], set: { note: { text: 'Traces: where the time went' } }, focus: ['trace'] },
			{ say: 'A health check endpoint like /healthz reports whether the app and its dependencies are alive. Load balancers poll it and stop sending traffic to a sick instance.', hide: ['trace'], show: ['health'], set: { note: { text: 'Health: alive, and which part is not', tone: 'warn' } }, focus: ['health'] }
		]
	},

	// ───────────────────────── ch12 · System design ─────────────────────────
	{
		id: 'be-answer-framework',
		topic: 'backend',
		group: 'ch12',
		title: 'Problem, risks, solution, edge cases',
		blurb: 'How do you structure a system design answer?',
		nodes: [
			box('p', 30, 8, 300, 48, 'Problem', { sub: 'Customers get charged twice when the network drops' }),
			box('r', 30, 84, 300, 48, 'Risks', { sub: 'Retries, double taps, a crash right after charging' }),
			box('s', 30, 160, 300, 48, 'Solution', { sub: 'Idempotency key plus a unique constraint' }),
			box('ec', 30, 236, 300, 48, 'Edge cases', { sub: 'Same key, new amount: reject. Keys expire in 24 h' }),
			edge('e1', 'p', 'r'),
			edge('e2', 'r', 's'),
			edge('e3', 's', 'ec')
		],
		steps: [
			{ say: "System design questions invite rambling. A four-part shape keeps you clear. Take 'users get charged twice' as the example. First, the problem.", show: ['p'], focus: ['p'] },
			{ say: 'Risks: what could go wrong, and when? Retries, double taps, a server crash right after the card was charged.', show: ['r', 'e1'], focus: ['r'] },
			{ say: 'Solution: the simplest design that handles those risks. An idempotency key, plus a unique constraint in the database, replaying the saved result.', show: ['s', 'e2'], focus: ['s'] },
			{ say: 'Edge cases: the awkward inputs. The same key with a different amount is rejected, and keys expire after 24 hours.', show: ['ec', 'e3'], focus: ['ec'] },
			{ say: 'Say it in that order, thinking aloud, in about a minute. Interviewers reward a clear structure and named trade-offs more than a perfect answer.', pulse: ['p', 'r', 's', 'ec'] }
		]
	},
	{
		id: 'be-scaling-out',
		topic: 'backend',
		group: 'ch12',
		title: 'Scale up or scale out?',
		blurb: 'What do you do when one server is not enough?',
		nodes: [
			box('users', 110, 6, 140, 32, 'Users'),
			box('lb', 110, 64, 140, 32, 'Load balancer'),
			box('s1', 20, 130, 90, 44, 'Server 1'),
			box('s2', 135, 130, 90, 44, 'Server 2'),
			box('s3', 250, 130, 90, 44, 'Server 3'),
			box('dbx', 110, 232, 140, 50, 'Database'),
			edge('eu1', 'users', 's1', { label: 'all traffic' }),
			edge('eu', 'users', 'lb'),
			edge('l1', 'lb', 's1'),
			edge('l2', 'lb', 's2'),
			edge('l3', 'lb', 's3'),
			edge('d1', 's1', 'dbx'),
			edge('d2', 's2', 'dbx'),
			edge('d3', 's3', 'dbx')
		],
		steps: [
			{ say: 'One server handles about 100 requests per second. Traffic grows to 400 and everything slows down.', show: ['users', 's1', 'eu1'], set: { s1: { sub: 'overloaded', tone: 'warn' } }, focus: ['s1'] },
			{ say: 'Scale up (vertical): move to a bigger machine. Simple, but there is a ceiling, it costs more per unit, and one machine is still a single point of failure.', set: { s1: { sub: '16 CPUs', tone: 'neutral' } }, focus: ['s1'] },
			{ say: 'Scale out (horizontal): run several identical servers behind a load balancer that spreads requests across them.', hide: ['eu1'], show: ['lb', 's2', 's3', 'eu', 'l1', 'l2', 'l3'], set: { s1: { sub: '' } }, focus: ['lb'] },
			{ say: "For this to work, servers must be stateless: keep sessions in Redis or in tokens, not in one server's memory, or a user's next request may land on a server that doesn't know them.", pulse: ['s1', 's2', 's3'] },
			{ say: 'Now every server talks to one database. Adding servers just moves the bottleneck there.', show: ['dbx', 'd1', 'd2', 'd3'], set: { dbx: { tone: 'warn' } }, focus: ['dbx'] },
			{ say: 'That is where replicas and caching come in. Web servers are easy to multiply; the database is the hard part.', pulse: ['dbx'] }
		]
	},
	{
		id: 'be-replicas-sharding',
		topic: 'backend',
		group: 'ch12',
		title: 'Read replicas, then shards',
		blurb: 'How do you scale a database that is the bottleneck?',
		nodes: [
			box('pr', 110, 10, 140, 44, 'Primary', { sub: 'reads and writes' }),
			box('r1', 20, 120, 100, 44, 'Replica 1'),
			box('r2', 240, 120, 100, 44, 'Replica 2'),
			box('app', 110, 230, 140, 40, 'App'),
			box('router', 110, 150, 140, 44, 'Router', { sub: 'shard by user id' }),
			box('sha', 20, 50, 130, 50, 'Shard A', { sub: 'users 1 to 1M' }),
			box('shb', 210, 50, 130, 50, 'Shard B', { sub: 'users 1M to 2M' }),
			edge('ew', 'app', 'pr', { label: 'queries' }),
			edge('rd1', 'app', 'r1', { label: 'reads' }),
			edge('rd2', 'app', 'r2', { label: 'reads' }),
			edge('rep1', 'pr', 'r1', { label: 'copies', tone: 'accent' }),
			edge('rep2', 'pr', 'r2', { tone: 'accent' }),
			edge('er', 'app', 'router'),
			edge('ea', 'router', 'sha'),
			edge('eb', 'router', 'shb'),
			text('note', 180, 292, '', { w: 330, anchor: 'middle', size: 'sm' })
		],
		steps: [
			{ say: 'A read-heavy app, say 95% reads, sends every query to one database, and it is overloaded.', show: ['app', 'pr', 'ew'], set: { pr: { tone: 'warn' } }, focus: ['pr'] },
			{ say: 'Add read replicas: copies of the primary that stay up to date by replaying its changes.', show: ['r1', 'r2', 'rep1', 'rep2'], set: { pr: { tone: 'neutral' } }, focus: ['r1', 'r2'] },
			{ say: 'Writes still go to the primary. Reads are spread over the replicas, which frees the primary for writes.', show: ['rd1', 'rd2'], set: { ew: { label: 'writes' } }, focus: ['rd1', 'rd2'] },
			{ say: 'Catch: a replica can lag the primary by a moment, so right after you save something it may not show up there yet. For that read, ask the primary.', show: ['note'], set: { note: { text: 'Replicas can lag: read your own writes from the primary', tone: 'warn' } }, focus: ['note'] },
			{ say: 'Still too much data or too many writes for one primary? Sharding splits the data across several databases by a key, such as user id.', hide: ['pr', 'r1', 'r2', 'ew', 'rd1', 'rd2', 'rep1', 'rep2', 'note'], show: ['router', 'sha', 'shb', 'er', 'ea', 'eb'], focus: ['router'] },
			{ say: 'A router sends each request to the shard that owns that user, so each shard stores and serves only part of the data.', pulse: ['sha', 'shb'] },
			{ say: 'Sharding is powerful but costly: joins and transactions across shards are hard. Try indexes, caching and replicas first.', focus: ['router'] }
		]
	},
	{
		id: 'be-queue-shock-absorber',
		topic: 'backend',
		group: 'ch12',
		title: 'A queue absorbs traffic spikes',
		blurb: 'How do you survive a sudden burst of work?',
		nodes: [
			box('api', 110, 10, 140, 40, 'API', { sub: 'accepts fast' }),
			box('q', 110, 92, 140, 50, 'Queue', { sub: 'waiting: 0' }),
			box('w1', 20, 196, 90, 44, 'Worker 1'),
			box('w2', 135, 196, 90, 44, 'Worker 2'),
			box('w3', 250, 196, 90, 44, 'Worker 3'),
			edge('e1', 'api', 'q', { label: 'enqueue' }),
			edge('d1', 'q', 'w1'),
			edge('d2', 'q', 'w2'),
			edge('d3', 'q', 'w3')
		],
		steps: [
			{ say: 'An image-resizing service normally gets 10 jobs a second, and one worker keeps up.', show: ['api', 'q', 'w1', 'e1', 'd1'], focus: ['api'] },
			{ say: 'A marketing email sends 2,000 users to it at once. If the API did the work itself, it would be swamped and time out.', set: { api: { sub: '2,000 requests/s', tone: 'warn' } }, focus: ['api'] },
			{ say: 'With a queue, the API only writes a small job and replies right away. The spike lands in the queue, not on the workers.', set: { q: { sub: 'waiting: 1,990', tone: 'warn' } }, pulse: ['q'] },
			{ say: 'The workers pull jobs at their own steady pace, so they never see the spike.', focus: ['w1', 'd1'] },
			{ say: 'Watch the queue depth. If it keeps growing, add workers: they all pull from the same queue.', show: ['w2', 'w3', 'd2', 'd3'], set: { q: { sub: 'waiting: 900' } }, focus: ['w2', 'w3'] },
			{ say: 'The queue drains and the depth returns to zero. A queue turns a sudden spike into steady work, as long as a short delay is acceptable.', set: { q: { sub: 'waiting: 0', tone: 'accent' }, api: { sub: 'accepts fast', tone: 'neutral' } }, pulse: ['q'] }
		]
	},
	{
		id: 'be-peak-bottleneck',
		topic: 'backend',
		group: 'ch12',
		title: 'The API is slow only at peak',
		blurb: 'How do you find what is actually slow?',
		nodes: [
			box('api', 110, 10, 140, 44, 'API servers', { sub: 'CPU 35%' }),
			db('dbx', 110, 108, 140, 56, 'Database', { sub: 'connections: 100 of 100' }),
			box('cache', 270, 18, 80, 44, 'Cache'),
			edge('e1', 'api', 'dbx', { label: 'queries' }),
			edge('e2', 'api', 'cache', { tone: 'accent' }),
			text('note', 180, 236, '', { w: 330, anchor: 'middle' })
		],
		steps: [
			{ say: 'The API is fast all day but slow at peak. Before changing anything, find the bottleneck by looking at each part in turn.', show: ['api', 'dbx', 'e1'], focus: ['api', 'dbx'] },
			{ say: "API servers: CPU is at 35%, plenty of room. So adding web servers won't help.", set: { api: { tone: 'accent' } }, focus: ['api'] },
			{ say: 'Database: 100 of 100 connections are in use, and requests queue up waiting for one. This is the bottleneck.', show: ['note'], set: { dbx: { tone: 'neg' }, note: { text: 'Waiting requests: 240', tone: 'neg' } }, focus: ['dbx'] },
			{ say: 'Cheapest fix first: cache hot reads, so fewer requests reach the database at all.', show: ['cache', 'e2'], set: { dbx: { sub: 'connections: 55 of 100', tone: 'warn' }, note: { text: 'Waiting requests: 30', tone: 'warn' } }, focus: ['cache'] },
			{ say: 'Then find the slow queries and add the right index, so each connection is freed sooner.', set: { dbx: { sub: 'connections: 30 of 100', tone: 'accent' }, note: { text: 'Waiting requests: 0', tone: 'accent' } }, focus: ['dbx'] },
			{ say: 'If reads still dominate, add read replicas. Only then consider a bigger database.', focus: ['dbx'] },
			{ say: 'Say it in an interview: measure, find the bottleneck, apply the cheapest fix, then measure again.', pulse: ['api', 'dbx'] }
		]
	}
];
