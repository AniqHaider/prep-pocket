import type { DbEngine } from './types';
import { mongodbQuestions } from './mongodb/questions';

export const mongodb: DbEngine = {
	id: 'mongodb',
	name: 'MongoDB',
	tagline: 'Documents instead of rows: flexible data, rich queries and aggregation.',
	playground: 'mongo',
	quizBlurb: 'MongoDB documents, queries, indexes, aggregation, replication and sharding (MongoDB 7 and 8)',
	questions: mongodbQuestions,
	quizTopics: [
		{ id: 'documents-and-collections', label: 'Documents' },
		{ id: 'insert-and-find', label: 'Insert and find' },
		{ id: 'query-operators', label: 'Query operators' },
		{ id: 'update-operators', label: 'Updates' },
		{ id: 'indexes', label: 'Indexes' },
		{ id: 'explain-and-performance', label: 'Explain' },
		{ id: 'aggregation-pipeline', label: 'Aggregation' },
		{ id: 'schema-design', label: 'Schema design' },
		{ id: 'transactions', label: 'Transactions' },
		{ id: 'replica-sets', label: 'Replica sets' },
		{ id: 'sharding', label: 'Sharding' },
		{ id: 'validation-and-ttl', label: 'Validation and TTL' }
	],
	topics: [
		{
			id: 'documents-and-collections',
			title: 'Documents and collections',
			level: 'basic',
			summary: 'See how MongoDB stores a whole record as one document, and what _id is.',
			scenes: ['mg-row-vs-document', 'mg-insert-creates-id'],
			notes: `MongoDB stores data as **documents**: field and value pairs, saved in a binary format called BSON and shown to you like a JSON object. Documents live in **collections**, which are roughly the tables of MongoDB, and collections live in a database.

The big difference from a relational table is shape. A document can hold nested objects and arrays, so a user with an address and a list of tags is one document, not three rows in three tables. Documents in one collection do not have to share the same fields.

Every document has an \`_id\` that is unique in its collection. If you do not set one, the driver adds an ObjectId: 12 bytes made of a timestamp, a random value and a counter. A collection is created the first time you insert into it.

\`\`\`js
db.users.insertOne({
  name: "Asha",
  address: { city: "Pune" },
  tags: ["sql", "js"]
})
\`\`\`

**Common trap:** a single document can be at most 16 MB, so do not put something that grows forever, like every comment ever posted, inside one document.`,
			try: [
				{ label: 'Look at one order', code: 'db.orders.findOne()' },
				{ label: 'Count the products', code: 'db.products.countDocuments()' }
			]
		},
		{
			id: 'insert-and-find',
			title: 'Insert and find',
			level: 'basic',
			summary: 'Write documents and read them back with filters, projections, sorting and limits.',
			scenes: ['mg-find-filter-projection'],
			notes: `You add data with \`insertOne\` or \`insertMany\`, and read it with \`find\`. The first argument of \`find\` is the **filter**, the second is the **projection**, which picks the fields to return.

\`find\` gives you a **cursor**, a handle that streams results in batches. In the shell and drivers you loop over it or turn it into an array. \`findOne\` returns a single document, or \`null\` when nothing matches.

You shape the result with chained methods. MongoDB always applies sort first, then skip, then limit, whatever order you write them in.

\`\`\`js
db.products
  .find({ category: "office" }, { name: 1, priceCents: 1 })
  .sort({ priceCents: -1 })
  .limit(5)
\`\`\`

\`_id\` comes back unless you ask for \`_id: 0\`. A projection can include fields or exclude them, but you should not mix the two in one projection (the \`_id\` exception aside).

**Common trap:** \`skip\` does not jump ahead. The server still walks past every skipped document, so deep paging with a big \`skip\` gets slower and slower. Page by a range on an indexed field instead, such as \`_id\` greater than the last id you saw.`,
			try: [
				{ label: 'Only names and prices', code: 'db.products.find({}, { name: 1, priceCents: 1, _id: 0 })' },
				{ label: 'Three newest orders', code: 'db.orders.find().sort({ placedAt: -1 }).limit(3)' }
			]
		},
		{
			id: 'query-operators',
			title: 'Query operators',
			level: 'basic',
			summary: 'Combine conditions with AND, OR, $in and comparison operators, and match inside arrays.',
			scenes: ['mg-query-combining'],
			notes: `A filter is a document that describes what you want. Several fields in one filter mean **AND**. Operators start with a dollar sign and give you the rest: \`$gt\`, \`$gte\`, \`$lt\`, \`$lte\`, \`$ne\`, \`$in\`, \`$nin\`, \`$exists\`, \`$or\`, \`$and\` and more.

\`$in\` checks whether a field equals any value in a list. It is a short form of an \`$or\` of equality checks on that one field.

Arrays have their own rules. Matching a plain value against an array field succeeds when any element equals it. Putting an array on the right means "exactly this array".

\`\`\`js
// paid or shipped, with more than one unit
db.orders.find({
  status: { $in: ["paid", "shipped"] },
  "items.qty": { $gt: 1 }
})
\`\`\`

Dot notation reaches into nested objects and arrays of objects, like \`"items.qty"\`.

**Common trap:** a JavaScript object cannot hold the same key twice, so \`{ status: "paid", status: "shipped" }\` silently keeps only the last one. Use \`$in\` or \`$or\` for either-or.`,
			try: [
				{ label: 'Paid or shipped', code: "db.orders.find({ status: { $in: ['paid', 'shipped'] } })" },
				{ label: 'Products above 10 dollars', code: 'db.products.find({ priceCents: { $gt: 1000 } })' },
				{ label: 'Orders with exactly two items', code: 'db.orders.find({ items: { $size: 2 } })' }
			]
		},
		{
			id: 'update-operators',
			title: 'Update operators',
			level: 'basic',
			summary: 'Change documents in place with $set, $inc, $push and friends, and know when to upsert.',
			scenes: ['mg-update-set-vs-replace'],
			notes: `\`updateOne\` and \`updateMany\` take a filter and an **update document** built from operators. \`$set\` sets fields, \`$unset\` removes them, \`$inc\` adds to a number, \`$push\` appends to an array, \`$addToSet\` appends only if the value is new, and \`$pull\` removes matching values.

Operators change only what you name, so the rest of the document is untouched. \`replaceOne\` is different: it swaps the entire document, keeping just the \`_id\`.

If the filter matches nothing, nothing happens, unless you pass \`upsert: true\`. Then MongoDB inserts a new document built from the filter and the update.

\`\`\`js
db.users.updateOne(
  { _id: 7 },
  { $set: { city: "Leeds" }, $inc: { logins: 1 } },
  { upsert: true }
)
\`\`\`

Each update of a single document is atomic, even when it touches several fields. Two clients running \`$inc\` on the same document both count.

**Common trap:** passing a plain document, like \`{ city: "Leeds" }\`, to \`updateOne\` is an error, and passing one to \`replaceOne\` wipes every other field. Check that you used an operator when you meant to change one field. The playground is read-only, so these examples run on a real server.`,
			try: [{ label: 'Which statuses exist', code: "db.orders.distinct('status')" }]
		},
		{
			id: 'indexes',
			title: 'Indexes',
			level: 'mid',
			summary: 'Understand how an index avoids a collection scan, and how to order compound indexes.',
			scenes: ['mg-collscan-vs-ixscan', 'mg-multikey-array-index'],
			notes: `Without an index MongoDB must read every document to answer a query, a **collection scan**. An index is a sorted structure on one or more fields that points to the documents, so a query can jump to the matches. Every collection already has a unique index on \`_id\`.

Indexes make reads faster and writes a little slower, because every insert and update has to keep them in step. Index the fields your queries filter and sort on, not everything.

A **compound index** covers several fields in a set order. It supports queries on a leading prefix of those fields. To choose the order, use **ESR**: Equality fields first, then the Sort field, then Range fields.

\`\`\`js
db.orders.createIndex({ status: 1, placedAt: -1, total: 1 })
// serves: status = ..., sorted by placedAt, total > ...
\`\`\`

Indexing a field that holds an array creates a **multikey** index, with one entry per element. A compound index may include at most one array field.

**Common trap:** an index on \`{ a: 1, b: 1 }\` does not help a query that filters on \`b\` alone. The entries are sorted by \`a\` first, so \`b\` values are scattered through the index.`,
			try: [{ label: 'A query an index on status would help', code: "db.orders.find({ status: 'paid' })" }]
		},
		{
			id: 'explain-and-performance',
			title: 'Explain and performance',
			level: 'mid',
			summary: 'Read explain output to see COLLSCAN or IXSCAN and how much work a query really did.',
			scenes: ['mg-explain-stages'],
			notes: `To see how a query ran, add \`explain("executionStats")\` to it. It runs the query and reports the **winning plan** and real numbers.

The first thing to read is the stage. **COLLSCAN** means a full collection scan, **IXSCAN** means an index was used, **FETCH** means documents were read after an index lookup, and **SORT** means the server sorted results in memory because no index gave the order.

Then compare \`totalDocsExamined\` with \`nReturned\`. When the server examines thousands of documents to return a handful, an index is missing or does not fit the query. Ideally the two numbers are close.

\`\`\`js
db.orders.find({ customerId: 42 }).explain("executionStats")
// look at: winningPlan.stage, totalKeysExamined,
//          totalDocsExamined, nReturned, executionTimeMillis
\`\`\`

A **covered query** is answered from the index alone, with no document reads. It needs every filtered and returned field to be in the index, and \`_id\` left out of the result unless it is part of it.

**Common trap:** a fast query on a small test collection can hide a missing index. Check the plan, not the stopwatch, because a COLLSCAN that takes 2 ms today takes seconds on production data.`
		},
		{
			id: 'aggregation-pipeline',
			title: 'Aggregation pipeline',
			level: 'mid',
			summary: 'Chain stages like $match, $group and $sort to filter, summarise and reshape data.',
			scenes: ['mg-aggregation-pipeline-flow', 'mg-group-accumulators'],
			notes: `An **aggregation pipeline** is an array of stages. Documents flow through the stages in order, and each stage changes the stream before passing it on.

The stages you use most: \`$match\` filters, \`$group\` collapses documents into one per key and computes totals, \`$sort\` orders, \`$project\` and \`$addFields\` reshape, \`$unwind\` turns each element of an array into its own document, \`$lookup\` joins another collection (a left outer join), and \`$limit\` and \`$skip\` trim.

Inside \`$group\`, accumulators build the output: \`$sum\`, \`$avg\`, \`$min\`, \`$max\`, \`$push\` (keeps every value) and \`$addToSet\` (keeps unique values).

\`\`\`js
db.orders.aggregate([
  { $match: { status: "paid" } },
  { $unwind: "$items" },
  { $group: { _id: "$items.productId", units: { $sum: "$items.qty" } } },
  { $sort: { units: -1 } }
])
\`\`\`

Put \`$match\` early. A \`$match\` at the start can use an index and means later stages handle less data. A \`$sort\` followed by \`$limit\` is combined into a cheap top-N sort.

**Common trap:** stage order matters. A \`$group\` that comes before a \`$match\` can no longer see the fields it dropped, so the same stages in another order may give a different result.`,
			try: [
				{ label: 'Orders per status', code: "db.orders.aggregate([{ $group: { _id: '$status', orders: { $sum: 1 } } }, { $sort: { orders: -1 } }])" },
				{ label: 'Units sold per product', code: "db.orders.aggregate([{ $unwind: '$items' }, { $group: { _id: '$items.productId', units: { $sum: '$items.qty' } } }, { $sort: { units: -1 } }])" },
				{ label: 'Average price per category', code: "db.products.aggregate([{ $group: { _id: '$category', avgPriceCents: { $avg: '$priceCents' } } }])" }
			]
		},
		{
			id: 'schema-design',
			title: 'Schema design: embed or reference',
			level: 'mid',
			summary: 'Decide what to embed in a document and what to keep in its own collection.',
			scenes: ['mg-embed-vs-reference'],
			notes: `With no joins required, MongoDB design starts from a different question: **how will the data be read?** The guideline is that data accessed together should be stored together.

**Embed** when the related data is read with its parent, is small and bounded, and belongs to only one parent. An order and its line items are a classic case: one read returns both, and one write to the document is atomic.

**Reference** (store the other document's \`_id\`) when the data is shared by many documents, changes on its own, or can grow without limit. A product's current price belongs in a products collection, not in every order.

\`\`\`js
// embedded: the order keeps what was bought, at the price paid
{ _id: 1, customerId: 7,
  items: [{ sku: "pen", qty: 2, priceCents: 150 }] }
\`\`\`

References are just ids. MongoDB does not enforce them like foreign keys, so your code, or \`$lookup\`, follows them. Duplicating a value across documents makes reads faster, but you must update every copy when it changes.

**Common trap:** an array that grows for as long as the app runs, like all comments on a popular post, will eventually reach the 16 MB document limit. Give such items their own collection and index the parent id.`,
			try: [
				{ label: 'An order with embedded items', code: 'db.orders.findOne()' },
				{ label: 'Join items to products', code: "db.orders.aggregate([{ $unwind: '$items' }, { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' } }, { $limit: 3 }])" }
			]
		},
		{
			id: 'transactions',
			title: 'Transactions',
			level: 'advanced',
			summary: 'Change several documents all-or-nothing, and know when you do not need to.',
			scenes: ['mg-transaction-commit-abort'],
			notes: `A write to **one document** is always atomic, even when it changes many fields or nested arrays. Another client never sees it half done. This is a strong reason to embed related data.

When one operation must change **several documents** all-or-nothing, such as moving money between two accounts, use a **multi-document transaction**. You start a session, start a transaction, make your writes, then \`commitTransaction\`. If anything fails, \`abortTransaction\` discards every change.

\`\`\`js
const session = client.startSession()
await session.withTransaction(async () => {
  await accounts.updateOne({ _id: "A" }, { $inc: { balance: -30 } }, { session })
  await accounts.updateOne({ _id: "B" }, { $inc: { balance: 30 } }, { session })
})
\`\`\`

\`withTransaction\` retries the callback on transient errors such as a write conflict. Transactions need a **replica set or a sharded cluster**, not a standalone server. The write concern chosen for the transaction applies at commit, and by default a transaction is aborted after 60 seconds.

**Common trap:** using transactions for everything. They cost locks, memory and latency. Keep them short, and first ask whether embedding the data in one document would make the multi-document write unnecessary.`
		},
		{
			id: 'replica-sets',
			title: 'Replica sets',
			level: 'advanced',
			summary: 'Understand primaries, secondaries, the oplog, elections and write concern.',
			scenes: ['mg-replica-oplog', 'mg-election-failover'],
			notes: `A **replica set** is a group of \`mongod\` servers that hold the same data. One member is the **primary** and takes all writes. The others are **secondaries** that copy the primary's **oplog**, an ordered log of its write operations, and replay it.

If the primary stops responding, the secondaries notice through heartbeats and hold an **election**. A candidate needs votes from a **majority** of voting members. Drivers discover the new primary on their own, and retryable writes resend a failed write once.

Because a majority is what counts, a set with 3 voting members survives 1 failure, and a set with 4 also survives only 1. That is why odd numbers are recommended.

\`\`\`js
// wait until a majority of members have the write
db.orders.insertOne(
  { status: "paid" },
  { writeConcern: { w: "majority" } }
)
\`\`\`

The default **write concern** is \`majority\` since MongoDB 5.0. The default **read preference** is the primary. Reading from a secondary can return slightly stale data, because it applies the oplog a little after the primary does.

**Common trap:** replication is not a backup. A bad delete is replicated to every member within moments, so you still need backups.`
		},
		{
			id: 'sharding',
			title: 'Sharding',
			level: 'advanced',
			summary: 'Spread a collection over several servers and choose a shard key that scales.',
			scenes: ['mg-sharding-routing', 'mg-hot-shard-monotonic'],
			notes: `When one server cannot hold or serve all your data, **sharding** splits a collection across several **shards**, each usually its own replica set. A **shard key**, a field or fields you choose, decides which shard stores each document.

Applications talk to **mongos**, a router. It reads the cluster metadata kept on the **config servers** and sends each query to the shard or shards that hold the data. A query that includes the shard key goes to one shard. A query without it is sent to every shard (scatter-gather), and mongos merges the answers.

\`\`\`js
sh.shardCollection("shop.orders", { customerId: "hashed" })
\`\`\`

A good shard key has **high cardinality**, so data can split into many chunks, a **low frequency** for any single value, and does not only increase. A key such as a timestamp or an ObjectId sends every new insert to the last chunk, creating a **hot shard**. A **hashed** shard key spreads inserts evenly but makes range queries on the key hit every shard.

**Common trap:** the shard key is hard to change later, so choose it from your query patterns before the data is large. A low-cardinality key, like a country code, can leave you with chunks that cannot be split.`
		},
		{
			id: 'validation-and-ttl',
			title: 'Validation and TTL indexes',
			level: 'mid',
			summary: 'Enforce rules on writes with $jsonSchema and expire old documents automatically.',
			scenes: ['mg-schema-validation', 'mg-ttl-index'],
			notes: `MongoDB is flexible by default, but you can add rules. A **validator** on a collection, usually written as a \`$jsonSchema\`, is checked on every insert and update. With the default action, a document that breaks the rules makes the write fail with a validation error.

\`\`\`js
db.createCollection("users", {
  validator: { $jsonSchema: {
    required: ["email"],
    properties: { email: { bsonType: "string" } }
  } }
})
\`\`\`

Adding a validator does not delete or rewrite existing documents. They are checked when they are next updated, depending on the validation level.

A **TTL index** expires documents by age. It is an index on a date field with \`expireAfterSeconds\`. A background task removes documents whose date is older than that, about once a minute, so deletion is not instant.

\`\`\`js
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 })
\`\`\`

**Common trap:** a TTL index only works on a BSON date (or an array of dates), and the index must be on a single field. A date stored as a string like "2025-03-14" is never expired, and nothing warns you.`
		}
	]
};
