// Proves the playground's PostgreSQL and MongoDB sample shops agree, and that the mongosh evaluator behaves.
// Run: bun scripts/verify-playground.ts
import { PGlite } from '@electric-sql/pglite';
import { SHOP_SQL } from '../src/db/playground/shop.sql';
import { shopCollections } from '../src/db/playground/shop.mongo';
import { runMongo, MongoInputError } from '../src/db/playground/mongoEval';
import { PARSERS, seedStatements } from '../src/dojo/engine/sql-core';
import { runScript, inspect, format, NETWORK_OFF } from '../src/db/playground/jsRun';

const db = new PGlite();
await db.waitReady;
for (const s of seedStatements(SHOP_SQL)) await db.exec(s);
const mongo = shopCollections();

let fails = 0;
const ok = (name: string, cond: boolean, detail = '') => { console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : '  ' + detail}`); if (!cond) fails++; };
const sql = async (q: string) => (await db.exec(q, { parsers: PARSERS }))[0].rows as Record<string, any>[];
const docs = (q: string) => { const r = runMongo(q, mongo); if (r.kind !== 'docs') throw new Error('expected docs'); return r.docs as Record<string, any>[]; };
const val = (q: string) => { const r = runMongo(q, mongo); if (r.kind !== 'value') throw new Error('expected value'); return r.value; };
const norm = (rows: unknown[]) => JSON.stringify(rows);

// --- data shape promised to the content workers
ok('8 customers, 10 products, 15 orders', (await sql('select (select count(*) from customers) c, (select count(*) from products) p, (select count(*) from orders) o'))[0].o === 15 && val('db.customers.estimatedDocumentCount()') === 8 && val('db.products.estimatedDocumentCount()') === 10);
const itemCount = (await sql('select count(*) n from order_items'))[0].n;
ok(`order_items count matches embedded items (${itemCount})`, itemCount === mongo.orders.reduce((n, o: any) => n + o.items.length, 0));
ok('every order has 1-4 items', (await sql('select min(c) lo, max(c) hi from (select count(*) c from order_items group by order_id) t'))[0].lo >= 1 && (await sql('select max(c) hi from (select count(*) c from order_items group by order_id) t'))[0].hi <= 4);

// --- 1. orders per status
const a1 = await sql('select status, count(*)::int n from orders group by status order by status');
const m1 = docs("db.orders.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }, { $sort: { _id: 1 } }])").map((d) => ({ status: d._id, n: d.n }));
ok('orders per status', norm(a1) === norm(m1), `${norm(a1)} vs ${norm(m1)}`);

// --- 2. revenue per customer (all statuses)
const a2 = await sql('select o.customer_id id, sum(i.qty * p.price_cents)::int revenue from orders o join order_items i on i.order_id = o.id join products p on p.id = i.product_id group by o.customer_id order by id');
const m2 = docs(`db.orders.aggregate([
  { $unwind: '$items' },
  { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'p' } },
  { $unwind: '$p' },
  { $group: { _id: '$customerId', revenue: { $sum: { $multiply: ['$items.qty', '$p.priceCents'] } } } },
  { $sort: { _id: 1 } }
])`).map((d) => ({ id: d._id, revenue: d.revenue }));
ok('revenue per customer', norm(a2) === norm(m2), `${norm(a2)} vs ${norm(m2)}`);

// --- 3. top product by units sold
const a3 = (await sql('select p.name, sum(i.qty)::int units from order_items i join products p on p.id = i.product_id group by p.name order by units desc, p.name limit 1'))[0];
const m3 = docs(`db.orders.aggregate([{ $unwind: '$items' }, { $group: { _id: '$items.productId', units: { $sum: '$items.qty' } } }, { $sort: { units: -1, _id: 1 } }, { $limit: 1 }, { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'p' } }, { $unwind: '$p' }])`)[0];
ok('top product by units', a3.name === m3.p.name && a3.units === m3.units, `${a3.name}/${a3.units} vs ${m3.p.name}/${m3.units}`);

// --- 4. customers with no orders, products never ordered
const a4 = (await sql('select c.name from customers c left join orders o on o.customer_id = c.id where o.id is null order by c.name')).map((r) => r.name);
const m4 = docs("db.customers.aggregate([{ $lookup: { from: 'orders', localField: '_id', foreignField: 'customerId', as: 'o' } }, { $match: { o: { $size: 0 } } }, { $sort: { name: 1 } }])").map((d) => d.name);
ok('customers with no orders', norm(a4) === norm(m4) && a4.length === 1, `${a4} vs ${m4}`);
const a4b = (await sql('select p.name from products p left join order_items i on i.product_id = p.id where i.order_id is null')).map((r) => r.name);
const m4b = docs("db.products.aggregate([{ $lookup: { from: 'orders', localField: '_id', foreignField: 'items.productId', as: 'o' } }, { $match: { o: { $size: 0 } } }])").map((d) => d.name);
ok('products never ordered', norm(a4b) === norm(m4b) && a4b.length === 1, `${a4b} vs ${m4b}`);

// --- 5. distinct cities, counts by filter
ok('distinct cities', norm((await sql('select distinct city from customers order by city')).map((r) => r.city)) === norm(val('db.customers.distinct("city")') as unknown[]));
ok('paid orders count', (await sql("select count(*)::int n from orders where status = 'paid'"))[0].n === val("db.orders.countDocuments({ status: 'paid' })"));

// --- evaluator: how people really type it
ok("single quotes, unquoted keys, sort/limit chain", docs("db.orders.find({ status: 'paid' }, { placedAt: 1 }).sort({ placedAt: -1 }).limit(2)").length === 2);
ok('findOne returns one doc', (val('db.customers.findOne({ name: "Asha" })') as any)?._id === 1);
ok('operators and arrays', docs("db.products.find({ tags: { $in: ['gift'] }, priceCents: { $lt: 2000 } })").length >= 2);
ok('regex filter', docs('db.customers.find({ name: /^[AB]/ })').length === 2);
ok('trailing semicolon + newlines', docs('db.orders.find({}\n)\n  .limit(1);').length === 1);
ok('count()', val("db.orders.find({ status: 'pending' }).count()") === 2);
ok('show collections', JSON.stringify(val('show collections')) === '["customers","products","orders"]');
for (const bad of ['db.orders.insertOne({ a: 1 })', 'db.orders.deleteMany({})', 'db.nope.find({})', 'db.orders.find({ status: })', 'select 1', 'db.orders.explode()']) {
	let msg = '';
	try { runMongo(bad, mongo); } catch (e) { msg = e instanceof MongoInputError ? e.message : 'WRONG ERROR TYPE: ' + e; }
	ok(`rejects: ${bad}`, msg.length > 10 && !msg.startsWith('WRONG'), msg);
}
ok('writes mention read-only', (() => { try { runMongo('db.orders.drop()', mongo); return false; } catch (e: any) { return /read-only/.test(e.message); } })());
ok('input is not mutated by queries', JSON.stringify(mongo) === JSON.stringify(shopCollections()));

// ───────────── JavaScript / TypeScript playground runner (src/db/playground/jsRun.ts) ─────────────
const js = async (code: string, o: { ts?: boolean; timeoutMs?: number } = {}) => runScript(code, { timeoutMs: 1500, ...o });
const out = (r: Awaited<ReturnType<typeof js>>) => r.lines.map((l) => l.text);

// console formatting of values
{
	const f = (...a: unknown[]) => format(a);
	ok('format: strings, numbers, -0, bigint, undefined, null, symbol', f('a', 1, -0, 10n, undefined, null, Symbol('s')) === 'a 1 -0 10n undefined null Symbol(s)');
	ok('format: arrays and objects', f([1, 'two', [3]], { a: 1, 'b-c': { d: null } }) === "[ 1, 'two', [ 3 ] ] { a: 1, 'b-c': { d: null } }", f([1, 'two', [3]], { a: 1, 'b-c': { d: null } }));
	ok('format: Map, Set, Date, RegExp, Error', f(new Map([['a', 1]]), new Set([1, 2]), new Date(0), /x/g, new TypeError('bad')) === "Map(1) { 'a' => 1 } Set(2) { 1, 2 } 1970-01-01T00:00:00.000Z /x/g TypeError: bad");
	ok('format: functions and classes', f(function foo() {}, () => {}, class A {}, async function g() {}) === '[Function: foo] [Function (anonymous)] [class A] [AsyncFunction: g]', f(function foo() {}, () => {}, class A {}, async function g() {}));
	ok('format: class instance and null prototype', f(new (class P { x = 1 })(), Object.assign(Object.create(null), { a: 1 })) === 'P { x: 1 } [Object: null prototype] { a: 1 }');
	ok('format: depth limit', f({ a: { b: { c: { d: 1 } } } }) === '{ a: { b: { c: [Object] } } }', f({ a: { b: { c: { d: 1 } } } }));
	ok('format: quotes inside strings', inspect(["it's", 'say "hi"'], 0, [], false) === `[ "it's", 'say "hi"' ]`, inspect(["it's", 'say "hi"'], 0, [], false));
	ok('format: printf directives', f('%s is %d years, %o', 'Asha', 31, [1]) === 'Asha is 31 years, [ 1 ]' && f('100%', 5) === '100% 5' && f('%i|%f|%j|%%', '4.9', '1.5', { a: 1 }) === '4|1.5|{"a":1}|%');
	ok('format: sparse and long arrays', f([1, , 3]) === '[ 1, <1 empty item>, 3 ]' && f(Array.from({ length: 150 }, (_, i) => i)).endsWith('... 50 more items\n]'));
	ok('format: wraps past 72 columns', f({ alpha: 'aaaaaaaaaaaaaaaaaaaa', beta: 'bbbbbbbbbbbbbbbbbbbb', gamma: 'cccccccccccccccccccc', delta: 1 }).includes('\n  alpha:'));
	const circ: any = { name: 'loop' };
	circ.self = circ;
	ok('format: circular reference', f(circ) === "<ref *1> { name: 'loop', self: [Circular *1] }", f(circ));
	const r = await js('const a = { n: 1 }; a.me = a; console.log(a); console.log([a]); console.table([{ x: 1, y: "a" }, { x: 2 }]);');
	ok('circular + table through the runner', out(r)[0].includes('[Circular *1]') && out(r)[2].includes('(index)') && out(r)[2].includes('┌') && !r.error, JSON.stringify(out(r)));
}

// event-loop ordering is the browser engine's own: sync, then microtasks, then timers
{
	const r = await js("console.log('a'); setTimeout(() => console.log('t'), 0); Promise.resolve().then(() => console.log('p')); console.log('b');");
	ok('ordering: sync, microtask, timer', out(r).join(',') === 'a,b,p,t', out(r).join(','));
	const r2 = await js("setTimeout(() => console.log('late'), 40); setTimeout(() => console.log('early'), 10); queueMicrotask(() => console.log('micro')); await null; console.log('after await');");
	ok('ordering: top-level await, timers by delay', out(r2).join(',') === 'micro,after await,early,late', out(r2).join(','));
	const r3 = await js("const wait = (ms) => new Promise((r) => setTimeout(r, ms));\nconsole.log('start'); await wait(60); console.log('done');\nconst v = await Promise.all([wait(10).then(() => 1), wait(5).then(() => 2)]); console.log(v);");
	ok('top-level await with timers', out(r3).join('|') === 'start|done|[ 1, 2 ]' && !r3.error, out(r3).join('|'));
	const r4 = await js("let n = 0; const id = setInterval(() => { console.log('tick', ++n); if (n === 3) clearInterval(id); }, 5);");
	ok('setInterval that clears itself finishes cleanly', out(r4).join('|') === 'tick 1|tick 2|tick 3' && r4.notes.length === 0, JSON.stringify(r4));
}

// TypeScript is stripped, not checked
{
	const r = await js("enum Dir { Up, Down = 5 }\nconst a: number = 2;\nfunction f<T>(x: T): T { return x }\ninterface I { a: number }\nconsole.log(f<string>('ok'), a as number, Dir.Down, Dir[5]);", { ts: true });
	ok('TS: types and interfaces stripped, enum emitted', out(r).join('|') === 'ok 2 5 Down' && !r.error, JSON.stringify(r));
	const bad = await js('const a: number = ;', { ts: true });
	ok('TS: syntax error reports a line', !!bad.error && /line 1/.test(out(bad)[0]) && out(bad)[0].startsWith('Syntax error'), JSON.stringify(bad));
	const typeBug = await js("const n: number = 'not a number';\nconsole.log(typeof n);", { ts: true });
	ok('TS: type errors are NOT checked (it runs)', out(typeBug).join('|') === 'string', JSON.stringify(typeBug));
}

// errors, stopping, limits
{
	const r = await js("console.log('before');\n\nnull.boom;\nconsole.log('never');");
	ok('error line: message and the learner line number', r.lines.some((l) => l.level === 'error' && /Uncaught TypeError/.test(l.text) && /line 3\)/.test(l.text)) && r.error?.line === 3 && !out(r).includes('never'), JSON.stringify(r));
	const rej = await js("Promise.reject(new Error('nobody awaits me'));\nconsole.log('sync still runs');");
	ok('unhandled rejection is reported', out(rej)[0] === 'sync still runs' && rej.lines.some((l) => /Uncaught \(in promise\) Error: nobody awaits me/.test(l.text)) && !!rej.error, JSON.stringify(rej));
	const tm = await js("setTimeout(() => console.log('x'), 0); throw new RangeError('first');");
	ok('an error does not stop timers already queued', out(tm).some((t) => t.includes('RangeError: first')) && out(tm).includes('x'), JSON.stringify(tm));
	const cap = await runScript("setInterval(() => {}, 20); setTimeout(() => console.log('t'), 5);", { timeoutMs: 300 });
	ok('timers cap: a never-ending interval is cancelled with a note', cap.notes.some((n) => n.startsWith('Stopped after 5 s: timers were still pending')) && out(cap).join('') === 't' && cap.ms < 1000, JSON.stringify(cap));
	const never = await runScript('await new Promise(() => {}); console.log("no");', { timeoutMs: 200 });
	ok('a promise that never settles is cut off', never.notes.some((n) => n.startsWith('Stopped after 5 s')) && !out(never).includes('no'), JSON.stringify(never));
	const many = await runScript('for (let i = 0; i < 500; i++) console.log(i);', { maxLines: 200 });
	ok('output is capped at 200 lines with a note', many.lines.length === 200 && many.notes.includes('Output truncated at 200 lines'), `${many.lines.length} ${many.notes}`);
	const imp = await js("import fs from 'fs';\nconsole.log(1);");
	ok('import is refused with a friendly message', !!imp.error && /import and export are not available/.test(out(imp)[0]) && imp.lines.length === 1);
	const req = await js("const fs = require('fs');");
	ok('require is refused with a friendly message', /require is not available/.test(out(req).join('')) && !!req.error, JSON.stringify(req));
}

// the network is off, however it is reached
{
	for (const [name, code] of [['fetch', "await fetch('https://example.com');"], ['XMLHttpRequest', 'new XMLHttpRequest();'], ['WebSocket', "new WebSocket('wss://example.com');"], ['globalThis.fetch', "await globalThis.fetch('/x');"], ['self.fetch', "await self.fetch('/x');"]] as const) {
		const r = await js(code);
		ok(`network off: ${name}`, !!r.error && r.error.message === NETWORK_OFF && out(r).join('').includes(NETWORK_OFF), JSON.stringify(r));
	}
}

{
	const r = await js("const msg = await self.fetch('/a').then(() => 'ok', (e) => e.message);\nconsole.log(msg);\nfetch('/b').catch((e) => console.log('caught:', e.message));");
	ok('network off: fetch(...).catch() works like the real one', out(r).join('|') === `${NETWORK_OFF}|caught: ${NETWORK_OFF}` && !r.error, JSON.stringify(r));
}

// console API
{
	const r = await js("console.group('Group'); console.log('inside'); console.groupEnd(); console.log('outside'); console.warn('careful'); console.error('broken'); console.assert(1 === 2, 'math'); console.count(); console.count(); console.count('x');");
	ok('console: group indents, levels kept, assert, count', JSON.stringify(out(r)) === JSON.stringify(['Group', '  inside', 'outside', 'careful', 'broken', 'Assertion failed: math', 'default: 1', 'default: 2', 'x: 1']) && r.lines[3].level === 'warn' && r.lines[4].level === 'error', JSON.stringify(r.lines));
	const streamed: string[] = [];
	await runScript("console.log('one'); console.log('two');", { onLine: (l) => streamed.push(l.text) });
	ok('onLine streams every line as it is produced', streamed.join(',') === 'one,two');
}

console.log(fails ? `\nFAIL: ${fails}` : '\nOK: all playground checks pass');
process.exit(fails ? 1 : 0);
