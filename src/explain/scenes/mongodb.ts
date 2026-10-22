import type { Scene } from '../types';

/** MongoDB animated lessons. Group = the id of the topic in src/db/mongodb.ts. */
export const mongodbScenes: Scene[] = [
	// ───────────── documents-and-collections ─────────────
	{
		id: 'mg-row-vs-document',
		topic: 'mongodb',
		group: 'documents-and-collections',
		title: 'Rows in tables vs one document',
		blurb: 'How does MongoDB store the same user that a relational database spreads over tables?',
		nodes: [
			{ id: 'h1', kind: 'text', x: 10, y: 20, text: 'Relational: one user, three tables', visible: true },
			{ id: 't1', kind: 'table', x: 10, y: 40, title: 'users', colW: 56, cols: ['id', 'name'], rows: [['1', 'Asha']] },
			{ id: 't2', kind: 'table', x: 150, y: 40, title: 'addresses', colW: 62, cols: ['user_id', 'city'], rows: [['1', 'Pune']] },
			{ id: 't3', kind: 'table', x: 10, y: 140, title: 'tags', colW: 62, cols: ['user_id', 'tag'], rows: [['1', 'sql'], ['1', 'js']] },
			{ id: 'e1', kind: 'edge', from: 't1', to: 't2' },
			{ id: 'e2', kind: 'edge', from: 't1', to: 't3' },
			{ id: 'h2', kind: 'text', x: 10, y: 20, text: 'MongoDB: one user, one document' },
			{ id: 'd', kind: 'doc', x: 40, y: 50, w: 280, title: 'users collection', lines: ['{', '  _id: 1,', '  name: "Asha",', '  address: { city: "Pune" },', '  tags: ["sql", "js"]', '}'] },
			{ id: 'd2', kind: 'doc', x: 40, y: 200, w: 280, lines: ['{ _id: 2, name: "Ben" }'] }
		],
		steps: [
			{ say: 'In a relational database one user is spread over several tables. First the users table, with just the name.', show: ['t1'] },
			{ say: 'The address lives in its own table, linked back to the user by user_id.', show: ['t2', 'e1'] },
			{ say: 'Tags need a third table, because a classic table cell holds one value, not a list.', show: ['t3', 'e2'] },
			{ say: 'To build the profile page you JOIN the three tables back together.', focus: ['t1', 't2', 't3'], pulse: ['t1'] },
			{ say: 'MongoDB keeps the whole user in one document. Nested objects and arrays live inside it.', hide: ['t1', 't2', 't3', 'e1', 'e2', 'h1'], show: ['h2', 'd'] },
			{ say: 'One read returns everything the page needs, with no join.', set: { d: { hl: [3, 4] } }, focus: ['d'] },
			{ say: 'Other documents in the same collection may have different fields. MongoDB does not force one shape.', show: ['d2'], pulse: ['d2'] }
		]
	},
	{
		id: 'mg-insert-creates-id',
		topic: 'mongodb',
		group: 'documents-and-collections',
		title: 'Where _id comes from',
		blurb: 'What happens when you insert a document that has no _id?',
		nodes: [
			{ id: 'code', kind: 'text', x: 10, y: 20, text: 'db.users.insertOne({ name: "Asha" })', visible: true },
			{ id: 'd1', kind: 'doc', x: 20, y: 50, w: 200, title: 'what you send', lines: ['{', '  name: "Asha"', '}'], visible: true },
			{ id: 'e1', kind: 'edge', from: 'd1', to: 'd2', label: 'driver adds _id' },
			{ id: 'd2', kind: 'doc', x: 20, y: 150, w: 310, title: 'what is stored', lines: ['{', '  _id: ObjectId("65f1c0de9a4b3c2d1e0f7a8b"),', '  name: "Asha"', '}'] },
			{ id: 'p1', kind: 'box', x: 10, y: 252, w: 100, h: 40, label: 'timestamp', sub: '4 bytes' },
			{ id: 'p2', kind: 'box', x: 130, y: 252, w: 100, h: 40, label: 'random', sub: '5 bytes' },
			{ id: 'p3', kind: 'box', x: 250, y: 252, w: 100, h: 40, label: 'counter', sub: '3 bytes' }
		],
		steps: [
			{ say: 'You insert a document that has no _id field.', focus: ['d1'] },
			{ say: 'Before sending it, the driver adds an _id for you. By default it is an ObjectId.', show: ['e1', 'd2'], pulse: ['d2'] },
			{ say: 'An ObjectId is 12 bytes, usually shown as 24 hexadecimal characters.', set: { d2: { hl: [1] } }, focus: ['d2'] },
			{ say: 'The first 4 bytes are a timestamp, so ids sort roughly by creation time.', show: ['p1'], focus: ['p1'] },
			{ say: 'Five random bytes and a 3-byte counter keep ids unique, even when many servers create them.', show: ['p2', 'p3'], focus: ['p2', 'p3'] },
			{ say: 'Every collection also keeps a unique index on _id automatically, so lookups by _id are always fast.', focus: ['d2'] }
		]
	},

	// ───────────── insert-and-find ─────────────
	{
		id: 'mg-find-filter-projection',
		topic: 'mongodb',
		group: 'insert-and-find',
		title: 'find: filter, then projection',
		blurb: 'What do the two arguments of find() actually do?',
		nodes: [
			{ id: 'q', kind: 'text', x: 10, y: 18, w: 340, text: 'db.products.find({ category: "office" }, { name: 1 })', visible: true },
			{ id: 'a', kind: 'doc', x: 10, y: 64, w: 170, lines: ['{ _id: 1, name: "Pen",', '  category: "office" }'] },
			{ id: 'b', kind: 'doc', x: 10, y: 118, w: 170, lines: ['{ _id: 2, name: "Novel",', '  category: "book" }'] },
			{ id: 'c', kind: 'doc', x: 10, y: 172, w: 170, lines: ['{ _id: 3, name: "Tape",', '  category: "office" }'] },
			{ id: 'r1', kind: 'doc', x: 210, y: 64, w: 140, lines: ['{ _id: 1,', '  name: "Pen" }'], tone: 'accent' },
			{ id: 'r2', kind: 'doc', x: 210, y: 118, w: 140, lines: ['{ _id: 3,', '  name: "Tape" }'], tone: 'accent' },
			{ id: 'e1', kind: 'edge', from: 'a', to: 'r1', tone: 'accent' },
			{ id: 'e2', kind: 'edge', from: 'c', to: 'r2', tone: 'accent' }
		],
		steps: [
			{ say: 'A products collection with three documents. Each product is one document.', show: ['a', 'b', 'c'] },
			{ say: 'find() takes a filter first. MongoDB tests every document against it: category must equal office.', focus: ['q'], pulse: ['q'] },
			{ say: 'Pen and Tape match. Novel does not, so it will not be returned.', set: { a: { tone: 'accent' }, c: { tone: 'accent' } }, focus: ['a', 'c'] },
			{ say: 'The second argument is a projection. { name: 1 } means: send back only name (plus _id).', focus: ['q'] },
			{ say: 'The matches come back trimmed, delivered through a cursor that you loop over.', show: ['r1', 'r2', 'e1', 'e2'] },
			{ say: 'Add _id: 0 to the projection when you also want the _id left out.', set: { r1: { lines: ['{ name: "Pen" }'] }, r2: { lines: ['{ name: "Tape" }'] } }, pulse: ['r1', 'r2'] }
		]
	},

	// ───────────── query-operators ─────────────
	{
		id: 'mg-query-combining',
		topic: 'mongodb',
		group: 'query-operators',
		title: 'AND, OR and $in',
		blurb: 'How do you combine several conditions in one filter?',
		nodes: [
			{ id: 'q', kind: 'text', x: 10, y: 18, w: 340, text: '', visible: true },
			{ id: 'o1', kind: 'box', x: 10, y: 66, w: 160, h: 46, label: 'order 1: paid', sub: 'qty 3', visible: true },
			{ id: 'o2', kind: 'box', x: 190, y: 66, w: 160, h: 46, label: 'order 2: paid', sub: 'qty 1', visible: true },
			{ id: 'o3', kind: 'box', x: 10, y: 128, w: 160, h: 46, label: 'order 3: shipped', sub: 'qty 5', visible: true },
			{ id: 'o4', kind: 'box', x: 190, y: 128, w: 160, h: 46, label: 'order 4: pending', sub: 'qty 1', visible: true },
			{ id: 'res', kind: 'text', x: 10, y: 214, w: 340, text: '', visible: true }
		],
		steps: [
			{ say: 'Four orders, each with a status and a quantity. An empty filter matches all of them.', set: { q: { text: 'db.orders.find({})' }, res: { text: '4 of 4 match' }, o1: { tone: 'accent' }, o2: { tone: 'accent' }, o3: { tone: 'accent' }, o4: { tone: 'accent' } } },
			{ say: 'Listing two fields means AND: the order must be paid and have qty above 2. Only order 1 does.', set: { q: { text: 'find({ status: "paid", qty: { $gt: 2 } })' }, res: { text: '1 of 4 match: both conditions hold' }, o2: { tone: 'neutral' }, o3: { tone: 'neutral' }, o4: { tone: 'neutral' } }, focus: ['o1'] },
			{ say: '$or widens the match: any one condition is enough. Orders 1, 2 and 3 qualify.', set: { q: { text: 'find({ $or: [{ status: "paid" }, { qty: { $gt: 2 } }] })' }, res: { text: '3 of 4 match: at least one condition holds' }, o2: { tone: 'accent' }, o3: { tone: 'accent' } }, focus: ['o1', 'o2', 'o3'] },
			{ say: '$in is a short way to write an $or of equality checks on one field.', set: { q: { text: 'find({ status: { $in: ["paid", "shipped"] } })' }, res: { text: '3 of 4 match: paid or shipped' } }, focus: ['o1', 'o2', 'o3'] },
			{ say: 'Commas mean AND, $or and $in widen, $gt and $lte compare. Build any filter from these blocks.', focus: ['q'] }
		]
	},

	// ───────────── update-operators ─────────────
	{
		id: 'mg-update-set-vs-replace',
		topic: 'mongodb',
		group: 'update-operators',
		title: '$set vs replacing a document',
		blurb: 'Why does one update keep your fields and another wipe them?',
		nodes: [
			{ id: 'op', kind: 'text', x: 10, y: 18, w: 340, text: '', visible: true },
			{ id: 'd1', kind: 'doc', x: 10, y: 80, w: 160, title: 'before', lines: ['{ _id: 7,', '  name: "Asha",', '  city: "Pune",', '  plan: "pro" }'] },
			{ id: 'd2', kind: 'doc', x: 190, y: 80, w: 160, title: 'after $set', lines: ['{ _id: 7,', '  name: "Asha",', '  city: "Leeds",', '  plan: "pro" }'] },
			{ id: 'd3', kind: 'doc', x: 190, y: 190, w: 160, title: 'after replaceOne', lines: ['{ _id: 7,', '  city: "Leeds" }'], tone: 'neg' },
			{ id: 'e1', kind: 'edge', from: 'd1', to: 'd2', tone: 'accent' },
			{ id: 'e2', kind: 'edge', from: 'd1', to: 'd3', tone: 'neg' }
		],
		steps: [
			{ say: 'A user document with four fields.', show: ['d1'] },
			{ say: 'updateOne with $set changes only the fields you name.', set: { op: { text: 'updateOne({ _id: 7 }, { $set: { city: "Leeds" } })' } }, focus: ['op'] },
			{ say: 'city changes. name and plan are untouched.', show: ['d2', 'e1'], set: { d2: { hl: [2] } }, pulse: ['d2'] },
			{ say: 'replaceOne works differently: it swaps the whole document for the one you pass.', set: { op: { text: 'replaceOne({ _id: 7 }, { city: "Leeds" })' } }, focus: ['op'] },
			{ say: 'name and plan are gone. Only the _id is kept. This is rarely what you meant.', show: ['d3', 'e2'], pulse: ['d3'] },
			{ say: 'Reach for update operators like $set, $inc and $push. Replace only when you really mean to.', focus: ['d2'] }
		]
	},

	// ───────────── indexes ─────────────
	{
		id: 'mg-collscan-vs-ixscan',
		topic: 'mongodb',
		group: 'indexes',
		title: 'Collection scan vs index',
		blurb: 'How does an index let MongoDB skip most documents?',
		stage: { w: 360, h: 340 },
		nodes: [
			{ id: 'q', kind: 'text', x: 10, y: 18, text: 'db.users.find({ age: 52 })', visible: true },
			{ id: 'd1', kind: 'box', x: 10, y: 60, w: 100, h: 36, label: 'doc 1: age 31', visible: true },
			{ id: 'd2', kind: 'box', x: 130, y: 60, w: 100, h: 36, label: 'doc 2: age 18', visible: true },
			{ id: 'd3', kind: 'box', x: 250, y: 60, w: 100, h: 36, label: 'doc 3: age 67', visible: true },
			{ id: 'd4', kind: 'box', x: 10, y: 110, w: 100, h: 36, label: 'doc 4: age 44', visible: true },
			{ id: 'd5', kind: 'box', x: 130, y: 110, w: 100, h: 36, label: 'doc 5: age 25', visible: true },
			{ id: 'd6', kind: 'box', x: 250, y: 110, w: 100, h: 36, label: 'doc 6: age 52', visible: true },
			{ id: 'cnt', kind: 'text', x: 10, y: 176, w: 340, text: '', visible: true },
			{ id: 'ix', kind: 'doc', x: 10, y: 200, w: 200, title: 'index on age (sorted)', lines: ['18 -> doc 2', '25 -> doc 5', '31 -> doc 1', '44 -> doc 4', '52 -> doc 6', '67 -> doc 3'] },
			{ id: 'e1', kind: 'edge', from: 'ix', to: 'd6', tone: 'accent', dashed: true }
		],
		steps: [
			{ say: 'The query asks for users aged 52. There is no index on age, and the collection has six documents.', focus: ['q'] },
			{ say: 'MongoDB does a collection scan: it opens each document and tests the age. Two checked so far.', set: { d1: { tone: 'warn' }, d2: { tone: 'warn' }, cnt: { text: 'Examined: 2 of 6' } } },
			{ say: 'It keeps going, because any document could match. Five checked.', set: { d3: { tone: 'warn' }, d4: { tone: 'warn' }, d5: { tone: 'warn' }, cnt: { text: 'Examined: 5 of 6' } } },
			{ say: 'The sixth document matches. It read 6 documents to return 1, and the cost grows with the collection.', set: { d6: { tone: 'accent' }, cnt: { text: 'Examined: 6 documents to return 1', tone: 'warn' } }, pulse: ['d6'] },
			{ say: 'Now create an index on age. It keeps the ages sorted, each pointing at its document.', set: { d1: { tone: 'neutral' }, d2: { tone: 'neutral' }, d3: { tone: 'neutral' }, d4: { tone: 'neutral' }, d5: { tone: 'neutral' }, d6: { tone: 'neutral' }, cnt: { text: '', tone: 'neutral' } }, show: ['ix'], focus: ['ix'] },
			{ say: 'The query finds 52 in the sorted index and jumps straight to doc 6. One key, one document.', show: ['e1'], set: { d6: { tone: 'accent' }, cnt: { text: 'Examined: 1 key, 1 document', tone: 'accent' } }, focus: ['d6'] }
		]
	},
	{
		id: 'mg-multikey-array-index',
		topic: 'mongodb',
		group: 'indexes',
		title: 'Indexing an array field',
		blurb: 'What happens when you index a field that holds an array?',
		nodes: [
			{ id: 'q', kind: 'text', x: 10, y: 18, text: 'db.posts.find({ tags: "js" })', visible: true },
			{ id: 'p1', kind: 'doc', x: 10, y: 50, w: 160, lines: ['{ _id: 1,', '  tags: ["sql", "js"] }'], visible: true },
			{ id: 'p2', kind: 'doc', x: 10, y: 110, w: 160, lines: ['{ _id: 2,', '  tags: ["js", "css"] }'], visible: true },
			{ id: 'p3', kind: 'doc', x: 10, y: 170, w: 160, lines: ['{ _id: 3,', '  tags: ["sql"] }'], visible: true },
			{ id: 'ix', kind: 'doc', x: 200, y: 50, w: 150, title: 'index on tags', lines: ['css -> doc 2', 'js -> doc 1', 'js -> doc 2', 'sql -> doc 1', 'sql -> doc 3'] },
			{ id: 'e1', kind: 'edge', from: 'ix', to: 'p1', tone: 'accent' },
			{ id: 'e2', kind: 'edge', from: 'ix', to: 'p2', tone: 'accent' },
			{ id: 'note', kind: 'text', x: 10, y: 250, w: 340, text: 'Compound indexes allow at most one array field per document.', size: 'sm' }
		],
		steps: [
			{ say: 'Three posts. Each has a tags field that holds an array.', focus: ['p1', 'p2', 'p3'] },
			{ say: 'Index the tags field and MongoDB creates a multikey index: one entry for every element of every array.', show: ['ix'], focus: ['ix'] },
			{ say: 'The query for tag js looks it up in the sorted index and finds two entries.', set: { ix: { hl: [1, 2] } } },
			{ say: 'Those entries point straight at posts 1 and 2. No scan of the other posts is needed.', show: ['e1', 'e2'], set: { p1: { tone: 'accent' }, p2: { tone: 'accent' } } },
			{ say: 'One limit to remember: a compound index cannot include two array fields of the same document (parallel arrays).', show: ['note'], focus: ['note'] }
		]
	},

	// ───────────── explain-and-performance ─────────────
	{
		id: 'mg-explain-stages',
		topic: 'mongodb',
		group: 'explain-and-performance',
		title: 'Reading explain output',
		blurb: 'How do you tell whether a query is slow because of a missing index?',
		nodes: [
			{ id: 'cmd', kind: 'text', x: 10, y: 18, w: 340, text: 'db.orders.find({ customerId: 42 }).explain("executionStats")', visible: true },
			{ id: 'b', kind: 'doc', x: 10, y: 56, w: 168, title: 'before: no index', lines: ['stage: COLLSCAN', 'totalKeysExamined: 0', 'totalDocsExamined: 10000', 'nReturned: 12', 'executionTimeMillis: 48'] },
			{ id: 'a', kind: 'doc', x: 184, y: 56, w: 168, title: 'after: with index', lines: ['stage: IXSCAN', 'totalKeysExamined: 12', 'totalDocsExamined: 12', 'nReturned: 12', 'executionTimeMillis: 1'] },
			{ id: 'rb', kind: 'text', x: 10, y: 188, w: 160, text: 'examined / returned = about 833', tone: 'warn', size: 'sm' },
			{ id: 'idx', kind: 'text', x: 10, y: 238, w: 340, text: 'db.orders.createIndex({ customerId: 1 })' },
			{ id: 'ra', kind: 'text', x: 190, y: 188, w: 160, text: 'examined / returned = 1', tone: 'accent', size: 'sm' }
		],
		steps: [
			{ say: 'explain with executionStats runs the query and reports what the engine really did.', focus: ['cmd'] },
			{ say: 'With no index the plan is COLLSCAN: the server looked at every document in the collection.', show: ['b'] },
			{ say: 'It examined 10000 documents to return only 12. That gap is the warning sign.', set: { b: { hl: [2, 3] } } },
			{ say: 'About 833 documents read for every one returned. Slow today, much slower as the data grows.', show: ['rb'] },
			{ say: 'Add an index on the field the query filters on.', show: ['idx'], focus: ['idx'] },
			{ say: 'Same query, new plan: IXSCAN. It reads 12 index keys and 12 documents.', show: ['a'] },
			{ say: 'Examined now equals returned. The index did the narrowing, and the time dropped.', show: ['ra'], set: { a: { hl: [1, 2, 3] } } }
		]
	},

	// ───────────── aggregation-pipeline ─────────────
	{
		id: 'mg-aggregation-pipeline-flow',
		topic: 'mongodb',
		group: 'aggregation-pipeline',
		title: 'Documents flowing through stages',
		blurb: 'What does an aggregation pipeline do to your documents, step by step?',
		nodes: [
			{ id: 'src', kind: 'db', x: 120, y: 10, w: 120, h: 44, label: 'orders: 15 docs' },
			{ id: 'm', kind: 'box', x: 110, y: 92, w: 140, h: 44, label: '$match', sub: '{ status: "paid" }' },
			{ id: 'g', kind: 'box', x: 110, y: 160, w: 140, h: 44, label: '$group', sub: 'sum qty per customer' },
			{ id: 's', kind: 'box', x: 110, y: 228, w: 140, h: 44, label: '$sort', sub: 'biggest total first' },
			{ id: 'e1', kind: 'edge', from: 'src', to: 'm' },
			{ id: 'e2', kind: 'edge', from: 'm', to: 'g' },
			{ id: 'e3', kind: 'edge', from: 'g', to: 's' },
			{ id: 'c1', kind: 'text', x: 270, y: 118, w: 84, text: 'out: 9 docs', size: 'sm' },
			{ id: 'c2', kind: 'text', x: 270, y: 186, w: 84, text: 'out: 5 docs', size: 'sm' },
			{ id: 'c3', kind: 'text', x: 270, y: 254, w: 84, text: 'out: 5 docs', size: 'sm' },
			{ id: 'tok', kind: 'token', x: 94, y: 32, label: 'docs' }
		],
		steps: [
			{ say: 'A pipeline is a list of stages. Documents enter at the top and flow through one stage at a time.', show: ['src', 'tok'], focus: ['src'] },
			{ say: '$match keeps only the paid orders: 15 documents go in, 9 come out.', show: ['m', 'e1', 'c1'], move: { tok: { x: 94, y: 114 } }, focus: ['m'] },
			{ say: '$group collapses them into one document per customer, adding up the quantities: 9 in, 5 out.', show: ['g', 'e2', 'c2'], move: { tok: { x: 94, y: 182 } }, focus: ['g'] },
			{ say: '$sort puts the 5 results in order, biggest total first.', show: ['s', 'e3', 'c3'], move: { tok: { x: 94, y: 250 } }, focus: ['s'] },
			{ say: 'Each stage only sees what the stage before it sent on, so the order of the stages changes the result.', focus: ['m', 'g', 's'] },
			{ say: 'These counts are just an example. The playground has real sample data to run a pipeline like this on.', focus: ['src'] }
		]
	},
	{
		id: 'mg-group-accumulators',
		topic: 'mongodb',
		group: 'aggregation-pipeline',
		title: '$push vs $addToSet in $group',
		blurb: 'How do you collect values into an array when grouping?',
		nodes: [
			{ id: 'op', kind: 'text', x: 10, y: 18, w: 340, text: '', visible: true },
			{ id: 'tbl', kind: 'table', x: 10, y: 56, title: 'orders', colW: 56, cols: ['cust', 'item'], rows: [['A', 'pen'], ['A', 'pen'], ['A', 'ink'], ['B', 'pen']] },
			{ id: 'o1', kind: 'doc', x: 150, y: 56, w: 200, title: '$push result for A', lines: ['{ _id: "A",', '  items: ["pen",', '    "pen", "ink"] }'] },
			{ id: 'o2', kind: 'doc', x: 150, y: 148, w: 200, title: '$addToSet result for A', lines: ['{ _id: "A",', '  items: ["pen",', '    "ink"] }'] },
			{ id: 'note', kind: 'text', x: 10, y: 250, w: 340, text: 'The order of elements from $addToSet is not guaranteed.', size: 'sm' }
		],
		steps: [
			{ say: 'Orders as rows of customer and item. We want one list of items per customer.', show: ['tbl'] },
			{ say: '$group makes one output document for each distinct _id value. Here that is the customer.', set: { op: { text: '{ $group: { _id: "$cust", items: { $push: "$item" } } }' }, tbl: { hl: [0, 1, 2] } }, focus: ['op'] },
			{ say: '$push appends every value it sees, so pen appears twice for customer A.', show: ['o1'], set: { o1: { hl: [1, 2] } } },
			{ say: 'Swap in $addToSet: a value is added only if it is not already in the array.', set: { op: { text: '{ $group: { _id: "$cust", items: { $addToSet: "$item" } } }' } }, focus: ['op'] },
			{ say: 'Now each item appears once: pen and ink. Handy for "which products did this customer buy".', show: ['o2'], set: { o2: { hl: [1, 2], tone: 'accent' } } },
			{ say: '$addToSet makes no promise about the order of the elements, so do not rely on it.', show: ['note'], focus: ['o2'] }
		]
	},

	// ───────────── schema-design ─────────────
	{
		id: 'mg-embed-vs-reference',
		topic: 'mongodb',
		group: 'schema-design',
		title: 'Embed or reference?',
		blurb: 'Where should the data related to a document live?',
		nodes: [
			{ id: 'em', kind: 'doc', x: 50, y: 50, w: 260, title: 'orders (embedded items)', lines: ['{ _id: 1,', '  customerId: 7,', '  items: [', '    { sku: "pen", qty: 2 },', '    { sku: "ink", qty: 1 }', '  ] }'] },
			{ id: 'o', kind: 'doc', x: 10, y: 70, w: 160, title: 'orders', lines: ['{ _id: 1,', '  customerId: 7,', '  productIds: [3, 9] }'] },
			{ id: 'p1', kind: 'doc', x: 200, y: 50, w: 150, title: 'products', lines: ['{ _id: 3,', '  name: "Pen",', '  priceCents: 150 }'] },
			{ id: 'p2', kind: 'doc', x: 200, y: 148, w: 150, lines: ['{ _id: 9,', '  name: "Ink",', '  priceCents: 900 }'] },
			{ id: 'e1', kind: 'edge', from: 'o', to: 'p1', tone: 'accent', dashed: true },
			{ id: 'e2', kind: 'edge', from: 'o', to: 'p2', tone: 'accent', dashed: true },
			{ id: 'rule', kind: 'text', x: 10, y: 262, w: 340, text: 'Embed what you read together. Reference what is shared or grows without limit.', size: 'sm' }
		],
		steps: [
			{ say: 'The design question: where do the line items of an order live?', show: ['em'], focus: ['em'] },
			{ say: 'Embed them: one read returns the order with its items, and one write to the document is atomic.', set: { em: { hl: [2, 3, 4, 5] } } },
			{ say: 'Embedding fits data that is read with its parent and stays small. A document may not exceed 16 MB.', focus: ['em'] },
			{ say: 'Or reference: the order stores only product ids, and the products live in their own collection.', hide: ['em'], show: ['o', 'p1', 'p2', 'e1', 'e2'] },
			{ say: 'A product price is stored once and shared by every order. MongoDB does not enforce these links, your code follows them.', focus: ['p1', 'p2'] },
			{ say: 'Rule of thumb: embed what you read together, reference what is shared or can grow without limit.', show: ['rule'], focus: ['rule'] }
		]
	},

	// ───────────── transactions ─────────────
	{
		id: 'mg-transaction-commit-abort',
		topic: 'mongodb',
		group: 'transactions',
		title: 'Commit or abort a transaction',
		blurb: 'How do two documents change together, or not at all?',
		nodes: [
			{ id: 'tx', kind: 'box', x: 80, y: 18, w: 200, h: 40, label: 'transaction open', shape: 'pill', tone: 'warn' },
			{ id: 'A', kind: 'doc', x: 20, y: 90, w: 140, lines: ['{ _id: "A",', '  balance: 100 }'] },
			{ id: 'B', kind: 'doc', x: 200, y: 90, w: 140, lines: ['{ _id: "B",', '  balance: 50 }'] },
			{ id: 'c', kind: 'token', x: 90, y: 180, label: '30' },
			{ id: 'note', kind: 'text', x: 10, y: 230, w: 340, text: 'Single-document writes are already atomic, so embedding often avoids transactions.', size: 'sm' }
		],
		steps: [
			{ say: 'Move 30 from account A to account B. Two documents must change together, or not at all.', show: ['A', 'B'] },
			{ say: 'Start a transaction. Changes made inside it stay invisible to every other client.', show: ['tx'], pulse: ['tx'] },
			{ say: 'Debit A: its balance becomes 70, but only inside the transaction.', show: ['c'], set: { A: { lines: ['{ _id: "A",', '  balance: 70 }'], tone: 'warn' } }, focus: ['A'] },
			{ say: 'Credit B: its balance becomes 80, also still pending.', move: { c: { x: 270, y: 180 } }, set: { B: { lines: ['{ _id: "B",', '  balance: 80 }'], tone: 'warn' } }, focus: ['B'] },
			{ say: 'commitTransaction makes both changes visible at the same moment.', set: { tx: { tone: 'accent', label: 'committed' }, A: { tone: 'accent' }, B: { tone: 'accent' } } },
			{ say: 'The other path: if any step fails before the commit, abortTransaction discards both changes. Balances stay 100 and 50.', move: { c: { x: 90, y: 180 } }, set: { tx: { tone: 'neg', label: 'aborted' }, A: { lines: ['{ _id: "A",', '  balance: 100 }'], tone: 'neutral' }, B: { lines: ['{ _id: "B",', '  balance: 50 }'], tone: 'neutral' } } },
			{ say: 'Transactions need a replica set or a sharded cluster, and they should stay short.', show: ['note'], focus: ['note'] }
		]
	},

	// ───────────── replica-sets ─────────────
	{
		id: 'mg-replica-oplog',
		topic: 'mongodb',
		group: 'replica-sets',
		title: 'How a replica set copies writes',
		blurb: 'How do the secondaries end up with the same data as the primary?',
		nodes: [
			{ id: 'app', kind: 'box', x: 130, y: 8, w: 100, h: 40, label: 'Your app' },
			{ id: 'p', kind: 'box', x: 120, y: 90, w: 120, h: 50, label: 'Primary', sub: 'accepts writes' },
			{ id: 'oplog', kind: 'doc', x: 256, y: 90, w: 98, title: 'oplog', lines: ['insert users', '{ _id: 9 }'] },
			{ id: 's1', kind: 'box', x: 20, y: 214, w: 140, h: 50, label: 'Secondary 1', sub: 'copies the oplog' },
			{ id: 's2', kind: 'box', x: 200, y: 214, w: 140, h: 50, label: 'Secondary 2', sub: 'copies the oplog' },
			{ id: 'e1', kind: 'edge', from: 'app', to: 'p', label: 'insert' },
			{ id: 'e2', kind: 'edge', from: 'p', to: 's1', tone: 'accent' },
			{ id: 'e3', kind: 'edge', from: 'p', to: 's2', tone: 'accent' }
		],
		steps: [
			{ say: 'A replica set is a group of mongod servers that hold the same data. One of them is the primary.', show: ['p', 's1', 's2'], focus: ['p'] },
			{ say: 'Your app sends its writes to the primary, and only the primary.', show: ['app', 'e1'] },
			{ say: 'The primary applies the write and records it in its oplog, an ordered log of every change.', show: ['oplog'], pulse: ['p', 'oplog'] },
			{ say: 'Each secondary reads that log and replays the same changes in the same order.', show: ['e2', 'e3'], pulse: ['s1', 's2'] },
			{ say: 'Now all three hold the same data. Secondaries trail the primary by a little, so reads from them can be slightly stale.', set: { s1: { sub: 'in sync', tone: 'accent' }, s2: { sub: 'in sync', tone: 'accent' } } },
			{ say: 'Write concern majority tells your app "done" only once most members have the write. It is the default since 5.0 (w: 1 if arbiters leave too few data members).', focus: ['p', 's1', 's2'] }
		]
	},
	{
		id: 'mg-election-failover',
		topic: 'mongodb',
		group: 'replica-sets',
		title: 'What happens when the primary dies',
		blurb: 'How does a replica set pick a new primary?',
		nodes: [
			{ id: 'p', kind: 'box', x: 120, y: 10, w: 120, h: 50, label: 'Primary', sub: 'accepting writes', visible: true },
			{ id: 's1', kind: 'box', x: 10, y: 190, w: 140, h: 50, label: 'Secondary 1', sub: 'replicating', visible: true },
			{ id: 's2', kind: 'box', x: 210, y: 190, w: 140, h: 50, label: 'Secondary 2', sub: 'replicating', visible: true },
			{ id: 'h1', kind: 'edge', from: 'p', to: 's1', dashed: true },
			{ id: 'h2', kind: 'edge', from: 'p', to: 's2', dashed: true },
			{ id: 'h3', kind: 'edge', from: 's1', to: 's2', dashed: true },
			{ id: 'vote', kind: 'text', x: 180, y: 278, w: 240, text: '', anchor: 'middle', size: 'md' }
		],
		steps: [
			{ say: 'Three members, one primary. Every 2 seconds they send each other a heartbeat to check that everyone is alive.', show: ['h1', 'h2', 'h3'] },
			{ say: 'The primary crashes. The secondaries stop hearing from it.', set: { p: { tone: 'neg', sub: 'down' } }, pulse: ['p'] },
			{ say: 'After about 10 seconds of silence (electionTimeoutMillis), a secondary calls an election.', show: ['vote'], set: { vote: { text: 'Secondary 1 asks for votes' } }, focus: ['s1'] },
			{ say: 'A candidate wins with votes from a majority of voting members. Here that is 2 of 3: its own and Secondary 2.', set: { vote: { text: 'Secondary 1 gets 2 of 3 votes', tone: 'accent' } }, focus: ['s1', 's2'] },
			{ say: 'Secondary 1 is the new primary and takes writes. Drivers find it by themselves and retry a failed write once.', set: { s1: { tone: 'accent', label: 'Primary', sub: 'accepting writes' }, vote: { text: '' } }, pulse: ['s1'] },
			{ say: 'When the old primary returns it rejoins as a secondary and catches up from the new primary\'s oplog.', set: { p: { tone: 'neutral', label: 'Secondary', sub: 'catching up' } } },
			{ say: 'If two of the three members were down there would be no majority, so no primary and no writes. That is why sets use an odd number of voting members.', focus: ['s1', 's2', 'p'] }
		]
	},

	// ───────────── sharding ─────────────
	{
		id: 'mg-sharding-routing',
		topic: 'mongodb',
		group: 'sharding',
		title: 'How a sharded query is routed',
		blurb: 'Which shard answers a query, and how does mongos know?',
		nodes: [
			{ id: 'app', kind: 'box', x: 130, y: 6, w: 100, h: 36, label: 'Your app' },
			{ id: 'mongos', kind: 'box', x: 120, y: 72, w: 120, h: 44, label: 'mongos', sub: 'the router' },
			{ id: 'cfg', kind: 'box', x: 270, y: 76, w: 84, h: 40, label: 'Config', sub: 'key ranges' },
			{ id: 's1', kind: 'db', x: 10, y: 190, w: 100, h: 54, label: 'Shard 1', sub: 'ids 1 to 100' },
			{ id: 's2', kind: 'db', x: 130, y: 190, w: 100, h: 54, label: 'Shard 2', sub: 'ids 101 to 200' },
			{ id: 's3', kind: 'db', x: 250, y: 190, w: 100, h: 54, label: 'Shard 3', sub: 'ids 201 to 300' },
			{ id: 'e1', kind: 'edge', from: 'app', to: 'mongos' },
			{ id: 'e2', kind: 'edge', from: 'mongos', to: 'cfg', dashed: true },
			{ id: 'e3', kind: 'edge', from: 'mongos', to: 's1' },
			{ id: 'e4', kind: 'edge', from: 'mongos', to: 's2', tone: 'accent' },
			{ id: 'e5', kind: 'edge', from: 'mongos', to: 's3' }
		],
		steps: [
			{ say: 'Sharding splits one big collection over several servers, called shards. The shard key decides which shard owns a document.', show: ['s1', 's2', 's3'] },
			{ say: 'Your app talks to mongos, a router. It never needs to know which shard holds what.', show: ['app', 'mongos', 'e1'], focus: ['mongos'] },
			{ say: 'mongos asks the config servers, which hold the map from key ranges to shards.', show: ['cfg', 'e2'], focus: ['cfg'] },
			{ say: 'A query that includes the shard key, say customerId 150, is sent to exactly one shard.', show: ['e4'], focus: ['s2'], pulse: ['s2'] },
			{ say: 'A query without the shard key must go to every shard (scatter-gather), and mongos merges the answers.', show: ['e3', 'e5'], set: { e3: { tone: 'warn' }, e4: { tone: 'warn' }, e5: { tone: 'warn' } }, focus: ['s1', 's2', 's3'] },
			{ say: 'So pick a shard key your queries filter on, with many different values.', focus: ['mongos'] }
		]
	},
	{
		id: 'mg-hot-shard-monotonic',
		topic: 'mongodb',
		group: 'sharding',
		title: 'The hot shard problem',
		blurb: 'Why can a growing shard key overload one server?',
		nodes: [
			{ id: 'key', kind: 'text', x: 10, y: 20, w: 340, text: 'shard key: _id (an ObjectId, grows over time)', visible: true },
			{ id: 's1', kind: 'box', x: 10, y: 150, w: 100, h: 60, label: 'Shard 1', sub: 'oldest keys' },
			{ id: 's2', kind: 'box', x: 130, y: 150, w: 100, h: 60, label: 'Shard 2', sub: 'middle keys' },
			{ id: 's3', kind: 'box', x: 250, y: 150, w: 100, h: 60, label: 'Shard 3', sub: 'newest keys' },
			{ id: 't1', kind: 'token', x: 300, y: 70, label: 'new doc' },
			{ id: 't2', kind: 'token', x: 180, y: 70, label: 'new doc' },
			{ id: 't3', kind: 'token', x: 60, y: 70, label: 'new doc' }
		],
		steps: [
			{ say: 'The collection is sharded on _id. Each shard owns a range of keys: shard 1 the oldest, shard 3 the newest.', show: ['s1', 's2', 's3'], focus: ['key'] },
			{ say: 'A new document gets an ObjectId with a newer timestamp, so it sorts after the older ones.', show: ['t1'] },
			{ say: 'So it belongs in the highest range. It is routed to shard 3.', move: { t1: { x: 300, y: 136 } }, focus: ['s3'] },
			{ say: 'Every new insert does the same: one shard takes all the writes while the others sit idle.', set: { s3: { tone: 'warn', sub: 'all new writes' }, s1: { sub: 'idle' }, s2: { sub: 'idle' } } },
			{ say: 'A hashed shard key fixes this: MongoDB hashes the _id first, so consecutive ids scatter across shards.', set: { key: { text: 'shard key: { _id: "hashed" }' }, s1: { sub: 'hash range 1' }, s2: { sub: 'hash range 2' }, s3: { sub: 'hash range 3', tone: 'neutral' } } },
			{ say: 'Now new documents spread out evenly, and no single shard is the hot one.', show: ['t2', 't3'], move: { t2: { x: 180, y: 136 }, t3: { x: 60, y: 136 } }, set: { s1: { tone: 'accent' }, s2: { tone: 'accent' }, s3: { tone: 'accent' } } },
			{ say: 'The trade-off: a range query on the key, like ids 1 to 1000, now has to ask every shard.', focus: ['s1', 's2', 's3'] }
		]
	},

	// ───────────── validation-and-ttl ─────────────
	{
		id: 'mg-schema-validation',
		topic: 'mongodb',
		group: 'validation-and-ttl',
		title: 'Schema validation on writes',
		blurb: 'How do you stop bad documents from being stored?',
		nodes: [
			{ id: 'rule', kind: 'doc', x: 10, y: 16, w: 232, title: 'validator on users', lines: ['$jsonSchema: {', '  required: ["email"],', '  properties: {', '    email: { bsonType: "string" }', '  }', '}'] },
			{ id: 'ok', kind: 'doc', x: 10, y: 176, w: 160, title: 'insert 1', lines: ['{ email: "a@x.io",', '  name: "Asha" }'] },
			{ id: 'bad', kind: 'doc', x: 190, y: 176, w: 160, title: 'insert 2', lines: ['{ name: "Ben" }'] },
			{ id: 'r1', kind: 'text', x: 10, y: 262, w: 160, text: 'accepted and stored', tone: 'accent', size: 'sm' },
			{ id: 'r2', kind: 'text', x: 190, y: 262, w: 160, text: 'rejected: Document failed validation', tone: 'neg', size: 'sm' },
			{ id: 'e1', kind: 'edge', from: 'rule', to: 'ok' },
			{ id: 'e2', kind: 'edge', from: 'rule', to: 'bad' }
		],
		steps: [
			{ say: 'A validator is a set of rules a collection checks on every insert and update.', show: ['rule'], focus: ['rule'] },
			{ say: 'First, insert a document that follows the rules: it has an email string.', show: ['ok', 'e1'] },
			{ say: 'It passes the check and is stored.', show: ['r1'], set: { ok: { tone: 'accent' } } },
			{ say: 'Now insert a document with no email.', show: ['bad', 'e2'] },
			{ say: 'It breaks the rule "required: email", so the write fails with a validation error.', show: ['r2'], set: { bad: { tone: 'neg' } }, pulse: ['bad'] },
			{ say: 'Validation is optional and set per collection. Existing documents are checked only when they are inserted or updated again.', focus: ['rule'] }
		]
	},
	{
		id: 'mg-ttl-index',
		topic: 'mongodb',
		group: 'validation-and-ttl',
		title: 'A TTL index expires documents',
		blurb: 'How can MongoDB delete old documents by itself?',
		nodes: [
			{ id: 'd1', kind: 'doc', x: 10, y: 70, w: 170, lines: ['{ _id: "s1",', '  createdAt: 09:00 }'] },
			{ id: 'd2', kind: 'doc', x: 10, y: 130, w: 170, lines: ['{ _id: "s2",', '  createdAt: 09:40 }'] },
			{ id: 'd3', kind: 'doc', x: 10, y: 190, w: 170, lines: ['{ _id: "s3",', '  createdAt: 09:45 }'] },
			{ id: 'clock', kind: 'text', x: 200, y: 88, w: 150, text: 'now: 09:50', size: 'lg' },
			{ id: 'idx', kind: 'text', x: 200, y: 124, w: 150, text: 'createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 })', size: 'sm' },
			{ id: 'q', kind: 'text', x: 10, y: 24, w: 340, text: 'A collection of login sessions, each stamped with a date.', size: 'sm' }
		],
		steps: [
			{ say: 'Three login sessions, each with a createdAt date. It is 09:50.', show: ['d1', 'd2', 'd3', 'clock', 'q'] },
			{ say: 'A TTL index tells MongoDB to delete a document once its date is older than expireAfterSeconds. Here: one hour.', show: ['idx'], focus: ['idx'] },
			{ say: 'Time passes. At 10:05 session s1 is 65 minutes old, past the limit.', set: { clock: { text: 'now: 10:05' }, d1: { tone: 'warn' } }, focus: ['d1'] },
			{ say: 'A background task checks about once a minute, so the deletion is not instant.', set: { d1: { tone: 'neg' } }, pulse: ['d1'] },
			{ say: 'Session s1 is removed. s2 and s3 are younger than an hour, so they stay.', hide: ['d1'] },
			{ say: 'TTL works on date fields (or arrays of dates), and the TTL index itself must be on a single field.', focus: ['idx'] }
		]
	}
];
