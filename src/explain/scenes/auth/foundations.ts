import type { Scene, SceneNode, Tone } from '../../types';

/** Auth foundations: who is calling and what they may do, passwords, sessions, JWT, access and refresh tokens. Ids `au-*`; `group` = a topic id in src/db/auth/foundations.ts. A generic online store. */

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

export const auFoundations: Scene[] = [
	// ───────────── au-authn-authz ─────────────
	{
		id: 'au-authn-vs-authz',
		topic: 'auth',
		group: 'au-authn-authz',
		title: 'Who you are, and what you may do',
		blurb: 'Which question does authentication answer, and which does authorization?',
		stage: { w: 360, h: 380 },
		nodes: [
			...stack('b', [
				{ l: 'A request arrives', s: 'Cookie sid=… (a credential)' },
				{ l: 'Authentication', s: 'Who is this? Asha.' },
				{ l: 'Authorization', s: 'May Asha read order 1042?' },
				{ l: 'The resource', s: 'Order 1042 (owner: Asha)' }
			]),
			{ id: 't401', kind: 'text', x: 226, y: 112, text: 'no match: 401', size: 'sm' },
			{ id: 't403', kind: 'text', x: 226, y: 184, text: 'not allowed: 403', size: 'sm' },
			{ id: 'idor', kind: 'doc', x: 16, y: 292, w: 328, title: 'Same cookie, another order', lines: ['GET /orders/1043   (Ben’s order)', 'Cookie: sid=…   (still Asha)', 'must answer 403, not 200'] }
		],
		steps: [
			{ say: 'A request arrives carrying a credential, such as a session cookie. The server has not decided anything yet.', focus: ['b0'] },
			{ say: 'Authentication answers who is calling. The cookie belongs to Asha. If it matches nobody, the answer is 401.', show: ['b1', 'be0', 't401'], focus: ['b1'] },
			{ say: 'Authorization answers what Asha may do. Reading order 1042 is allowed because she owns it. If not, the answer is 403.', show: ['b2', 'be1', 't403'], focus: ['b2'] },
			{ say: 'Only then does the resource answer. Both checks run on the server, on every request.', show: ['b3', 'be2'], pulse: ['b3'] },
			{ say: 'Now Asha edits the id to 1043. She is still Asha, so authentication passes. With no ownership check, Ben’s order comes back.', show: ['idor'], set: { b2: { tone: 'neg', sub: 'May Asha read order 1043?' }, b3: { tone: 'neg', sub: 'Order 1043 (owner: Ben)' } } },
			{ say: 'The fix is one server-side check: compare the order’s owner with the authenticated user, and answer 403 or 404 when they differ.', set: { b2: { tone: 'accent', sub: 'Owner is Ben: deny, 403' }, b3: { tone: 'neutral', sub: 'Never reached' } }, focus: ['b2'] }
		]
	},
	{
		id: 'au-login-defences',
		topic: 'auth',
		group: 'au-authn-authz',
		title: 'What a login form must defend against',
		blurb: 'Which attacks does a login form face, and what answers each?',
		stage: { w: 360, h: 256 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 164,
				cols: ['Attack', 'Main defence'],
				rows: [
					['Password guessing', 'Rate limit per account'],
					['Credential stuffing', 'Breach check + MFA'],
					['User enumeration', 'Same message and timing'],
					['Stolen session cookie', 'Secure, HttpOnly cookie'],
					['Phishing', 'Passkeys (WebAuthn)'],
					['Weak recovery flow', 'Single-use expiring link']
				],
				visible: true
			},
			{ id: 'resp', kind: 'doc', x: 16, y: 184, w: 328, title: 'Same reply for every failed login', lines: ['401 Unauthorized', '{"error":"Invalid email or password"}'] }
		],
		steps: [
			{ say: 'A login form is the front door, so it faces several different attacks. Each one has its own main defence.', focus: ['t'] },
			{ say: 'Guessing: limit failed attempts per account, not only per IP address, so an attacker with many addresses gains nothing.', set: { t: { hl: [0] } } },
			{ say: 'Credential stuffing replays passwords leaked elsewhere. Screening new passwords against breached lists, plus a second factor, blunts it.', set: { t: { hl: [1] } } },
			{ say: 'Enumeration: answer the same way, in about the same time, whether the email is unknown or the password is wrong.', show: ['resp'], set: { t: { hl: [2] } } },
			{ say: 'A stolen session cookie skips the login entirely. Mark it Secure and HttpOnly, and make sessions expire.', set: { t: { hl: [3] } } },
			{ say: 'Phishing tricks a person into typing a password on a fake page. A passkey is tied to the real site, so it cannot be used on a fake one.', set: { t: { hl: [4] } } },
			{ say: 'Password reset is a second door. Use single-use links that expire, reply the same for every email, and tell the owner.', set: { t: { hl: [5] } } }
		]
	},

	// ───────────── au-passwords ─────────────
	{
		id: 'au-password-hashing',
		topic: 'auth',
		group: 'au-passwords',
		title: 'From password to stored hash',
		blurb: 'What happens to a password before the database keeps it?',
		stage: { w: 360, h: 352 },
		nodes: [
			...stack(
				'b',
				[
					{ l: 'Password', s: 'typed once, at sign-up' },
					{ l: 'Add a random salt', s: 'unique for every user' },
					{ l: 'Slow, memory-hard hash', s: 'Argon2id' },
					{ l: 'Store the result', s: 'algorithm + cost + salt + hash' }
				],
				{ gap: 24 }
			),
			{ id: 'pep', kind: 'box', x: 232, y: 146, w: 112, h: 52, label: 'Pepper', sub: 'secret, kept outside the DB' },
			{ id: 'pe', kind: 'edge', from: 'pep', to: 'b2', dashed: true },
			{ id: 'stored', kind: 'doc', x: 16, y: 280, w: 328, title: 'What the database keeps', lines: ['$argon2id$v=19$m=19456,t=2,p=1$<salt>', '$<hash>'] }
		],
		steps: [
			{ say: 'A new user picks a password. The server must never keep it in a form that can be read back.', focus: ['b0'] },
			{ say: 'A fresh random salt is made for this user. Two people with the same password now get different results, and precomputed tables are useless.', show: ['b1', 'be0'], focus: ['b1'] },
			{ say: 'The hash is deliberately slow and memory-hungry, so every guess costs an attacker real time and memory.', show: ['b2', 'be1'], focus: ['b2'] },
			{ say: 'The database keeps the algorithm, its settings, the salt and the hash in one string, so the cost can be raised later.', show: ['b3', 'be2', 'stored'], focus: ['stored'] },
			{ say: 'OWASP’s starting point at the time of writing: Argon2id with 19 MiB of memory, 2 passes and 1 lane. Benchmark on your server, then raise it over time.', set: { b2: { sub: '19 MiB, 2 passes, 1 lane' } }, focus: ['b2'] },
			{ say: 'A pepper is a secret shared by all passwords and kept outside the database, for example in a secrets manager, so a stolen database alone is not enough.', show: ['pep', 'pe'], focus: ['pep'] },
			{ say: 'To check a login, read the salt and settings from the stored string, hash the attempt the same way, and compare in constant time.', focus: ['stored'] }
		]
	},
	{
		id: 'au-hash-cost-table',
		topic: 'auth',
		group: 'au-passwords',
		title: 'How storage choices fail',
		blurb: 'What can an attacker do with a stolen user table?',
		stage: { w: 360, h: 180 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 164,
				cols: ['Stored as', 'If the database leaks'],
				rows: [
					['Plain text', 'Every password is known'],
					['Fast hash, no salt', 'Looked up in tables'],
					['Fast hash + salt', 'Guessed very quickly'],
					['Argon2id + salt', 'Each guess is costly'],
					['Add a pepper', 'Needs a second secret']
				],
				visible: true
			}
		],
		steps: [
			{ say: 'Suppose an attacker copies the user table. What they can do with it depends on how the passwords were stored.', focus: ['t'] },
			{ say: 'Plain text: there is nothing to crack. Every password works here and, because people reuse passwords, on other sites too.', set: { t: { hl: [0] } } },
			{ say: 'A fast hash with no salt: equal passwords give equal hashes, so one precomputed table or lookup covers every user at once.', set: { t: { hl: [1] } } },
			{ say: 'A salt makes every user’s hash unique, but a fast hash still lets an attacker test enormous numbers of guesses.', set: { t: { hl: [2] } } },
			{ say: 'A slow, memory-hard hash makes each guess expensive. Weak passwords may still fall, but strong ones hold.', set: { t: { hl: [3] } } },
			{ say: 'A pepper adds a secret the attacker must also steal from somewhere else, which is defence in depth.', set: { t: { hl: [4] } } }
		]
	},
	{
		id: 'au-nist-password-rules',
		topic: 'auth',
		group: 'au-passwords',
		title: 'Password rules that help',
		blurb: 'What do NIST’s current guidelines ask of a password form?',
		stage: { w: 360, h: 176 },
		nodes: [
			{
				id: 'd',
				kind: 'doc',
				x: 16,
				y: 14,
				w: 328,
				title: 'NIST SP 800-63-4, passwords',
				lines: ['min 15 chars alone, 8 with another factor', 'accept at least 64 chars, any Unicode', 'no mixing rules (capital, digit, symbol)', 'no forced change on a schedule', 'block common and breached passwords', 'allow paste and password managers', 'limit failed guesses (upper bound 100)'],
				visible: true
			}
		],
		steps: [
			{ say: 'NIST’s current digital identity guidelines replace old habits with a short list. They care about length and screening, not tricks.', focus: ['d'] },
			{ say: 'Length: a password used on its own must be at least 15 characters. One that only backs up another factor may be as short as 8.', set: { d: { hl: [0] } } },
			{ say: 'Let people use long passphrases: accept at least 64 characters, spaces and Unicode, and never truncate.', set: { d: { hl: [1] } } },
			{ say: 'Do not force mixtures of character types. Length and screening against bad passwords are the controls NIST asks for.', set: { d: { hl: [2] } } },
			{ say: 'Do not make people change passwords on a timer. Force a change when there is evidence the password has been compromised.', set: { d: { hl: [3] } } },
			{ say: 'Compare a new password with a blocklist of common, expected and breached values. The whole password is compared, not pieces of it.', set: { d: { hl: [4] } } },
			{ say: 'Allow paste and password managers. They help people pick and use strong, unique passwords.', set: { d: { hl: [5] } } },
			{ say: 'Limit consecutive failed guesses on an account. NIST gives 100 as an upper bound; you may choose a lower number.', set: { d: { hl: [6] } } }
		]
	},

	// ───────────── au-sessions-vs-tokens ─────────────
	{
		id: 'au-session-lifecycle',
		topic: 'auth',
		group: 'au-sessions-vs-tokens',
		title: 'A server-side session, start to end',
		blurb: 'What do the browser and the server each hold, from login to logout?',
		stage: { w: 360, h: 246 },
		nodes: [
			{ id: 'br', kind: 'box', x: 16, y: 14, w: 100, h: 44, label: 'Browser', visible: true },
			{ id: 'sv', kind: 'box', x: 130, y: 14, w: 100, h: 44, label: 'Server', visible: true },
			{ id: 'st', kind: 'box', x: 244, y: 14, w: 100, h: 44, label: 'Session store', visible: true },
			{ id: 'e0', kind: 'edge', from: 'br', to: 'sv' },
			{ id: 'e1', kind: 'edge', from: 'sv', to: 'st' },
			{ id: 'msg', kind: 'doc', x: 16, y: 80, w: 328, title: 'Browser to server', lines: ['POST /login', 'email=asha@example.com', 'password=********'] },
			{ id: 'to', kind: 'doc', x: 16, y: 172, w: 328, title: 'Timeouts, checked on the server', lines: ['idle: 2-5 min (high value), 15-30 min (low)', 'absolute: 4-8 h for a working day'] }
		],
		steps: [
			{ say: 'In a server-side session the browser holds only an opaque random id. Everything else stays on the server.', focus: ['br', 'st'] },
			{ say: 'Login: the browser sends the credentials once, over HTTPS. The server checks them.', show: ['e0', 'msg'], focus: ['msg'] },
			{ say: 'Then the server saves a session record under a random id. OWASP asks for 64 bits of entropy at least, and 128 bits if you generate your own.', show: ['e1'], set: { msg: { title: 'Server to session store', lines: ['sid: 9f2c…e1  (random, 128 bits)', 'user: asha', 'created: 09:00   last seen: 09:00'] } } },
			{ say: 'The id goes back in a cookie. A fresh id is issued at login, so an id planted earlier by an attacker is never reused.', set: { msg: { title: 'Server to browser', lines: ['Set-Cookie: sid=9f2c…e1; Secure;', '            HttpOnly; SameSite=Lax; Path=/', '(a new id was issued at login)'] } } },
			{ say: 'Every later request carries the cookie. The server looks the id up, finds Asha, and applies its limits.', set: { msg: { title: 'Every later request', lines: ['GET /orders', 'Cookie: sid=9f2c…e1', 'lookup: sid found, user asha'] } } },
			{ say: 'An idle timeout ends unused sessions and an absolute timeout caps even busy ones. Both are enforced on the server.', show: ['to'], focus: ['to'] },
			{ say: 'Logout must delete the record on the server. Clearing only the cookie leaves a copied id working until it expires.', set: { msg: { title: 'Logout', lines: ['POST /logout', 'store: delete sid 9f2c…e1', 'Set-Cookie: sid=; Max-Age=0'] } }, focus: ['msg'] }
		]
	},
	{
		id: 'au-session-vs-token',
		topic: 'auth',
		group: 'au-sessions-vs-tokens',
		title: 'Session id or signed token?',
		blurb: 'What does each design cost, and what does it buy?',
		stage: { w: 360, h: 170 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 108,
				cols: ['', 'Session id', 'Signed token'],
				rows: [
					['State lives', 'server store', 'in the token'],
					['Revoke now', 'delete record', 'needs a denylist'],
					['Scale', 'shared store', 'no lookup needed'],
					['Size', 'tiny cookie', 'larger (claims)'],
					['Stale data', 'none', 'until it expires']
				],
				visible: true
			}
		],
		steps: [
			{ say: 'Both designs prove who is calling. They differ in where the truth lives, so they differ in what they cost.', focus: ['t'] },
			{ say: 'A session id is a key into server state. A signed token carries its own claims, so the server can check it without looking anything up.', set: { t: { hl: [0] } } },
			{ say: 'Support must end a session now? Delete the record. A signed token stays valid until it expires unless you keep a denylist.', set: { t: { hl: [1] } } },
			{ say: 'Tokens need no shared store, which suits many small services. Sessions need one every server can reach.', set: { t: { hl: [2] } } },
			{ say: 'A session id is a few bytes. A token grows with its claims and travels with every request.', set: { t: { hl: [3] } } },
			{ say: 'If a user’s role changes, a session sees it at once. A token still shows the old role until it expires.', set: { t: { hl: [4] } } },
			{ say: 'Neither is free: sessions need a store, tokens need a plan for revocation. Many systems use short-lived tokens plus a server-side refresh record.', set: { t: { hl: [] } }, focus: ['t'] }
		]
	},

	// ───────────── au-jwt ─────────────
	{
		id: 'au-jwt-anatomy',
		topic: 'auth',
		group: 'au-jwt',
		title: 'Inside a JWT',
		blurb: 'What are the three parts of a JWT, and what do they not do?',
		stage: { w: 360, h: 350 },
		nodes: [
			{
				id: 'raw',
				kind: 'doc',
				x: 16,
				y: 14,
				w: 328,
				title: 'On the wire (shortened), joined by dots',
				lines: ['eyJhbGciOiJFUzI1NiIsInR5cC…  (header)', 'eyJpc3MiOiJodHRwczovL2F1dG…  (payload)', 'MEUCIQDx…  (signature)'],
				visible: true
			},
			{ id: 'hdr', kind: 'doc', x: 16, y: 100, w: 328, title: 'Header, decoded', lines: ['{"alg":"ES256","typ":"JWT","kid":"k1"}'] },
			{ id: 'pay', kind: 'doc', x: 16, y: 152, w: 328, title: 'Payload, decoded', lines: ['{"iss":"https://auth.example.com",', '  "sub":"asha","aud":"shop-api",', '  "exp":1795000000,"jti":"7a1c"}'] },
			{ id: 'sig', kind: 'doc', x: 16, y: 236, w: 328, title: 'Signature', lines: ['ES256(header.payload, private key)'] },
			{ id: 'jwe', kind: 'box', x: 16, y: 292, w: 328, h: 44, label: 'Must the contents stay hidden?', sub: 'Use an encrypted JWT (JWE), or send an opaque id' }
		],
		steps: [
			{ say: 'A JWT is three base64url strings joined by dots: header, payload and signature. This one is shortened to fit.', focus: ['raw'] },
			{ say: 'The header says how the token was signed: the algorithm, and a key id used to look up the key.', show: ['hdr'], set: { raw: { hl: [0] } } },
			{ say: 'The payload is a set of claims: who issued it, who it is about, who it is for, and when it expires.', show: ['pay'], set: { raw: { hl: [1] } } },
			{ say: 'The signature covers the first two parts. It shows they were not changed by anyone without the key.', show: ['sig'], set: { raw: { hl: [2] } } },
			{ say: 'Signed is not secret. Anyone can base64url-decode the payload, so never put data in it that the holder should not see.', set: { pay: { tone: 'warn' }, raw: { hl: [] } }, focus: ['pay'] },
			{ say: 'When contents must stay hidden, use an encrypted JWT (JWE), or keep the data on the server and send only an opaque id.', show: ['jwe'], set: { jwe: { tone: 'accent' } }, focus: ['jwe'] }
		]
	},
	{
		id: 'au-jwt-checks',
		topic: 'auth',
		group: 'au-jwt',
		title: 'Checking a JWT, in order',
		blurb: 'What must a verifier do before it trusts a token’s claims?',
		stage: { w: 360, h: 330 },
		nodes: [
			...stack('d', [
				{ l: 'Allow-list algorithms', s: 'ES256 only, set in your config' },
				{ l: 'Find the key', s: 'by kid, in a key set you trust' },
				{ l: 'Verify the signature', s: 'that key, that algorithm' },
				{ l: 'Check the claims', s: 'iss, aud, exp, nbf' },
				{ l: 'Accept', s: 'claims are now trusted', tone: 'accent' }
			], { w: 230, gap: 20 })
		],
		steps: [
			{ say: 'Verification starts before the signature: decide which algorithms you accept. The token’s own header must not choose for you.', focus: ['d0'] },
			{ say: 'Look the key up by kid in a key set you trust. Never fetch a key from a URL named inside the token, such as jku.', show: ['d1', 'de0'], focus: ['d1'] },
			{ say: 'Verify the signature with that key and that one algorithm. Each key should be used with exactly one algorithm.', show: ['d2', 'de1'], focus: ['d2'] },
			{ say: 'Then check the claims: the issuer is the one you expect, you are in the audience, and now is inside nbf and exp.', show: ['d3', 'de2'], focus: ['d3'] },
			{ say: 'Only now trust the claims. Everything before this point is untrusted input from the network.', show: ['d4', 'de3'], pulse: ['d4'] },
			{ say: 'Also check the token’s type. An ID token must not be accepted where an access token is expected.', set: { d3: { label: 'Check claims and type', sub: 'iss, aud, exp, nbf, typ' } }, focus: ['d3'] }
		]
	},
	{
		id: 'au-jwt-attacks',
		topic: 'auth',
		group: 'au-jwt',
		title: 'Classic JWT mistakes',
		blurb: 'Which JWT mistakes does RFC 8725 warn about, and what fixes each?',
		stage: { w: 360, h: 210 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 164,
				cols: ['JWT mistake', 'Defence'],
				rows: [
					['alg set to none', 'Allow-list algorithms'],
					['RS256 swapped to HS256', 'One algorithm per key'],
					['Weak HMAC secret', 'Random, high-entropy key'],
					['No aud or iss check', 'Validate aud and iss'],
					['Trusting kid or jku', 'Fixed set of trusted keys'],
					['Secrets in the payload', 'Keep them out, or use JWE'],
					['Very long lifetime', 'Short exp, then refresh']
				],
				visible: true
			}
		],
		steps: [
			{ say: 'Most JWT breaches are not broken cryptography. They are verifiers that trust too much of the token. RFC 8725 collects the lessons.', focus: ['t'] },
			{ say: 'Some libraries accepted a token whose header said alg none and skipped the signature. The verifier, not the token, picks the algorithms.', set: { t: { hl: [0] } } },
			{ say: 'A token switched from RS256 to HS256 made some libraries use the public RSA key as the HMAC secret. Bind each key to one algorithm.', set: { t: { hl: [1] } } },
			{ say: 'An HS256 secret that is a guessable password can be brute-forced offline from any token. Use a random key.', set: { t: { hl: [2] } } },
			{ say: 'A token meant for another service must be refused. Check that the issuer is trusted and that you are in the audience.', set: { t: { hl: [3] } } },
			{ say: 'Headers such as kid and jku are attacker input. Sanitize kid, and never fetch a key from a URL the token names.', set: { t: { hl: [4] } } },
			{ say: 'Signed is not encrypted. Keep passwords and private data out of the payload, or use JWE if it must be hidden.', set: { t: { hl: [5] } } },
			{ say: 'A stolen token works until it expires. Keep access tokens short and renew them with a refresh token.', set: { t: { hl: [6] } } }
		]
	},

	// ───────────── au-access-refresh ─────────────
	{
		id: 'au-access-refresh-flow',
		topic: 'auth',
		group: 'au-access-refresh',
		title: 'Access token and refresh token',
		blurb: 'How do a short-lived access token and a longer-lived refresh token work together?',
		stage: { w: 360, h: 256 },
		nodes: [
			{ id: 'cl', kind: 'box', x: 130, y: 14, w: 100, h: 44, label: 'Client', sub: 'browser app', visible: true },
			{ id: 'api', kind: 'box', x: 16, y: 100, w: 100, h: 44, label: 'API', visible: true },
			{ id: 'as', kind: 'box', x: 244, y: 100, w: 100, h: 44, label: 'Auth server', visible: true },
			{ id: 'e0', kind: 'edge', from: 'cl', to: 'api' },
			{ id: 'e1', kind: 'edge', from: 'cl', to: 'as' },
			{ id: 'msg', kind: 'doc', x: 16, y: 164, w: 328, title: 'Sign in', lines: ['POST /token  (credentials or code)', '<- access_token   expires in 15 min', '<- refresh_token  expires in 30 days'] }
		],
		steps: [
			{ say: 'Two tokens split the job. A short-lived access token is sent to the API. A longer-lived refresh token is used only to get new ones.', focus: ['cl'] },
			{ say: 'Sign-in returns both. The lifetimes here are examples: minutes for the access token, days or weeks for the refresh token.', show: ['e1', 'msg'], focus: ['as'] },
			{ say: 'The client calls the API with the access token. The API checks it and never sees the refresh token.', show: ['e0'], set: { msg: { title: 'Call the API', lines: ['GET /orders', 'Authorization: Bearer <access token>', '<- 200 OK'] } }, focus: ['api'] },
			{ say: 'Later the access token expires. The API answers 401. A stolen access token is only worth something for a few minutes.', set: { msg: { title: 'The access token has expired', lines: ['GET /orders', 'Authorization: Bearer <old access token>', '<- 401 token expired'], tone: 'warn' } } },
			{ say: 'The client sends the refresh token to the auth server only, and gets a new access token and, with rotation, a new refresh token.', set: { msg: { title: 'Refresh, sent to the auth server only', lines: ['POST /token  grant_type=refresh_token', '<- new access_token', '<- new refresh_token (rotated)'], tone: 'accent' } }, focus: ['as'] },
			{ say: 'Retry with the new access token. The user never saw a login screen.', set: { msg: { title: 'Retry the call', lines: ['GET /orders', 'Authorization: Bearer <new access token>', '<- 200 OK'], tone: 'neutral' } }, focus: ['api'] },
			{ say: 'The refresh token is the valuable one: it can mint new access tokens. Guard it more carefully and rotate it on every use.', set: { msg: { title: 'Rules of thumb', lines: ['refresh token goes only to the auth server', 'store it with more care than the access token', 'rotate it on every use'] } }, focus: ['msg'] }
		]
	},
	{
		id: 'au-refresh-reuse-detection',
		topic: 'auth',
		group: 'au-access-refresh',
		title: 'Rotation and reuse detection',
		blurb: 'How does the server notice a stolen refresh token?',
		stage: { w: 360, h: 264 },
		nodes: [
			{ id: 'r1', kind: 'box', x: 16, y: 14, w: 96, h: 48, label: 'R1', sub: 'active', tone: 'accent', visible: true },
			{ id: 'r2', kind: 'box', x: 132, y: 14, w: 96, h: 48, label: 'R2' },
			{ id: 'r3', kind: 'box', x: 248, y: 14, w: 96, h: 48, label: 'R3' },
			{ id: 'e0', kind: 'edge', from: 'r1', to: 'r2' },
			{ id: 'e1', kind: 'edge', from: 'r2', to: 'r3' },
			{ id: 'th', kind: 'box', x: 16, y: 110, w: 96, h: 44, label: 'Thief', sub: 'copied R1', tone: 'neg' },
			{ id: 'et', kind: 'edge', from: 'th', to: 'r1', label: 'replays', tone: 'neg' },
			{ id: 'log', kind: 'doc', x: 16, y: 172, w: 328, title: 'Server record (one token family)', lines: ['family F1: new sign-in', 'R1  active', ' '], visible: true }
		],
		steps: [
			{ say: 'With rotation every refresh gives a new refresh token and retires the old one. The server remembers the chain, called a family.', focus: ['r1', 'log'] },
			{ say: 'Asha’s app trades R1 for a fresh pair. R1 is now used and R2 is the active token.', show: ['r2', 'e0'], set: { r1: { tone: 'neutral', sub: 'used' }, r2: { tone: 'accent', sub: 'active' }, log: { lines: ['R1 traded for R2', 'R1  used', 'R2  active'] } } },
			{ say: 'The next refresh trades R2 for R3. Each token works exactly once.', show: ['r3', 'e1'], set: { r2: { tone: 'neutral', sub: 'used' }, r3: { tone: 'accent', sub: 'active' }, log: { lines: ['R2 traded for R3', 'R2  used', 'R3  active'] } } },
			{ say: 'A thief who copied R1 earlier now presents it. R1 was already used, which a normal client would never do.', show: ['th', 'et'], set: { log: { lines: ['R1 arrives again', 'R1 was already used', 'a copy exists somewhere'] } } },
			{ say: 'The server cannot tell who is the thief, so it revokes the whole family, including R3. Both parties must sign in again.', set: { r1: { tone: 'neg', sub: 'reused' }, r2: { tone: 'neg', sub: 'revoked' }, r3: { tone: 'neg', sub: 'revoked' }, log: { lines: ['reuse detected', 'revoke the family: R1 R2 R3', 'everyone signs in again'] } } },
			{ say: 'The cost is that the real user is signed out too. That is the price of stopping a copy that cannot be told apart.', set: { log: { tone: 'warn' } }, focus: ['log'] }
		]
	},
	{
		id: 'au-token-lifetimes',
		topic: 'auth',
		group: 'au-access-refresh',
		title: 'Lifetimes, revocation and theft',
		blurb: 'How long should tokens live, and how can access end early?',
		stage: { w: 360, h: 314 },
		nodes: [
			{ id: 'clk', kind: 'doc', x: 16, y: 14, w: 328, title: 'Refresh token clocks (example values)', lines: ['absolute: sign in again after 30 days', 'sliding: each use extends it, up to the cap', 'access token: 15 minutes, never extended'], visible: true },
			{ id: 'rev', kind: 'doc', x: 16, y: 102, w: 328, title: 'Ending access early needs state', lines: ['denylist   store revoked ids until exp', 'version    user.version inside the claims', 'sessions   refresh records you can delete', 'short exp  accept a delay of minutes'] },
			{ id: 'thf', kind: 'doc', x: 16, y: 206, w: 328, title: 'After a suspected theft', lines: ['1 revoke the family or all sessions', '2 reset the password if the account was taken', '3 rotate the signing key if it leaked', '4 tell the user and write an audit entry'] }
		],
		steps: [
			{ say: 'A refresh token runs on two clocks. The absolute one is fixed at sign-in. The sliding one is renewed on use, but never past the cap.', focus: ['clk'] },
			{ say: 'A signed access token cannot be unsigned. Ending access before it expires needs some state on the server.', show: ['rev'], focus: ['rev'] },
			{ say: 'A denylist keeps the ids of revoked tokens until they would have expired anyway, and every request checks it.', set: { rev: { hl: [0] } } },
			{ say: 'A per-user version number inside the claims lets one change invalidate every older token, at the cost of a lookup.', set: { rev: { hl: [1] } } },
			{ say: 'Deleting the refresh record stops renewal. The current access token still works until it expires, so keep that short.', set: { rev: { hl: [2] } } },
			{ say: 'Or accept the delay: with an expiry of minutes the exposure is small, and no list is needed.', set: { rev: { hl: [3] } } },
			{ say: 'If theft is suspected: revoke, reset the password if the account was taken, rotate a leaked key, and tell the user.', show: ['thf'], set: { rev: { hl: [] } }, focus: ['thf'] }
		]
	}
];
