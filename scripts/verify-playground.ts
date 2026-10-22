// Proves the playground's PostgreSQL and MongoDB sample shops agree, and that the mongosh evaluator behaves.
// Run: bun scripts/verify-playground.ts
import { PGlite } from '@electric-sql/pglite';
import { SHOP_SQL } from '../src/db/playground/shop.sql';
import { shopCollections } from '../src/db/playground/shop.mongo';
import { runMongo, MongoInputError } from '../src/db/playground/mongoEval';
import { PARSERS, seedStatements } from '../src/dojo/engine/sql-core';

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

console.log(fails ? `\nFAIL: ${fails}` : '\nOK: all playground checks pass');
process.exit(fails ? 1 : 0);
