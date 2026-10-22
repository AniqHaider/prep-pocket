import { builder, type Level } from '../../quiz/types';

// One bank, topic passed per question. Ids are positional (MG01..), so keep the order stable.
const b = builder('MG', 'documents-and-collections');
const { out } = b;
const add = (topic: string, level: Level, tag: string, q: string, correct: string, wrong: [string, string, string], why: string, code?: string) => {
	b.add(level, tag, q, correct, wrong, why, code);
	out[out.length - 1].topic = topic;
};

// ───────────── documents-and-collections ─────────────
add('documents-and-collections', 'basic', 'documents',
	'In MongoDB, what is a document?',
	'A set of field and value pairs stored as BSON, shown to you like a JSON object',
	['A row that must match the column types of its table before it can be saved by the server',
	 'A compiled query plan that the server keeps in a cache so repeated reads run faster',
	 'A file on disk that holds one whole collection and is opened by its path'],
	'A document is the unit of data in MongoDB: field and value pairs stored in the binary BSON format, which drivers expose as objects. There is no row-and-column table to match, a query plan is a different thing, and collections are not individual files you open by path.');

add('documents-and-collections', 'basic', 'collections',
	'Which statement about a MongoDB collection is true?',
	'It holds documents, and they do not all need the same fields',
	['It needs its fields declared up front, much like the columns of a table, before any insert works',
	 'It can only hold documents of one identical shape, and the server rejects anything else by default',
	 'It is only a naming convention, so the server stores every document of a database together with no grouping'],
	'A collection groups related documents, and by default it does not force them to share a shape, so two documents can have different fields. You can opt in to rules with schema validation. Collections are real groupings with their own indexes, so they are not just a naming trick.');

add('documents-and-collections', 'basic', '_id',
	'What is the `_id` field for?',
	'It uniquely identifies a document within its collection and is always indexed',
	['It stores the creation date of the document and is rewritten each time the document is updated',
	 'It is optional metadata that the server leaves out unless you ask for it in a projection',
	 'It names the collection that the document belongs to, so that moved documents can be found'],
	'Every document has an _id that is unique inside its collection, and MongoDB keeps a unique index on it automatically. It is not a modification date and is never rewritten by updates, it is part of every document rather than optional metadata, and it does not name the collection.');

add('documents-and-collections', 'basic', 'collections',
	'When does MongoDB create a collection that does not exist yet?',
	'On the first insert into it, with no separate creation step',
	['Only after you run createCollection with a schema, otherwise the first insert fails with an error',
	 'At server startup, from a list of collection names kept in the configuration file',
	 'Whenever a find runs against that name, so the collection exists even if it is empty'],
	'Collections are created lazily: the first write to a missing collection creates it. You may call createCollection to set options, but it is not required. A configuration file does not list collections, and a read such as find on a missing name just returns nothing without creating it.');

add('documents-and-collections', 'mid', 'limits',
	'What is the maximum size of a single BSON document?',
	'16 MB, so arrays that grow without limit inside one document are a design risk',
	['16 GB, which is the size limit of one collection file on disk',
	 '64 KB, the size of a typical network packet that carries the write to the server',
	 'There is no limit, only the free disk space on the server matters in practice'],
	'A BSON document can be at most 16 MB. That is why a document should not hold something that keeps growing, like every comment ever posted. The limit is per document, not per collection, it is far larger than a packet because drivers split messages, and it cannot be switched off.');

add('documents-and-collections', 'mid', 'ObjectId',
	'Twenty app servers insert orders at the same time without setting _id and without talking to each other. Why do the default ids almost never collide, and what can you rely on about their order?',
	'Each id mixes a creation time, a per-process random value and a counter, so no coordination is needed; ids sort roughly, not exactly, by creation time',
	['The server keeps one global counter and hands every insert the next number, so ids are exactly in insert order',
	 'The driver asks the primary for a lock before each insert, which serialises the ids across all app servers',
	 'Ids are random, so they never collide, but they carry no information about when the document was created'],
	'A default ObjectId is 12 bytes: a 4-byte timestamp in seconds, 5 random bytes chosen per process, and a 3-byte counter. Every process can build ids on its own, which is why no central counter or lock is needed. Because the timestamp comes first, ids sort roughly by creation time, but two ids made in the same second by different processes are not ordered by when they were really created. They are not purely random either: the time part is what makes that rough ordering possible.');

// ───────────── insert-and-find ─────────────
add('insert-and-find', 'basic', 'find',
	'What does this call return?',
	'A cursor over all products whose category equals book',
	['Only the first matching product, as a single document',
	 'The number of matching products, as a plain integer',
	 'A promise that always resolves to an array holding every product in the collection'],
	'find returns a cursor, a handle you iterate (or turn into an array) to read the matching documents. findOne is the call that returns a single document, countDocuments returns a number, and the filter means only products with category book are included, not the whole collection.',
	`db.products.find({ category: "book" })`);

add('insert-and-find', 'basic', 'findOne',
	'How do you get one document, or null, instead of a cursor?',
	'Call findOne with a filter: it returns the first match or null',
	['Call find with no arguments, because it stops after it reads the first document it meets',
	 'Call findOne and wrap it in try and catch, because it throws an error when nothing matches',
	 'Call find with a projection of one field, because a projection makes the server return a single document'],
	'findOne returns the first matching document, or null if there is none, and it does not throw for a miss. find always gives a cursor over everything that matches. A projection only chooses which fields come back for each document, not how many documents there are.');

add('insert-and-find', 'basic', 'projection',
	'What does the second argument do in this call?',
	'It is a projection: it picks which fields come back, and _id comes too by default',
	['It is a second filter that is combined with the first one using OR, so more documents match',
	 'It is a sort order that puts documents that have a name field ahead of all the others',
	 'It is an update that sets name to 1 on every document matched by the first argument'],
	'The second argument of find is a projection. { name: 1 } includes the name field, and _id is included unless you write _id: 0. It does not widen the match, it does not sort, and find never modifies data, so it cannot be an update.',
	`db.orders.find({ status: "paid" }, { name: 1 })`);

add('insert-and-find', 'basic', '_id',
	'What happens when you insert a document that has no _id?',
	'The driver adds a new ObjectId as the _id before sending it',
	['The insert fails because the application must always choose the _id itself',
	 'The server stores it without an _id and leaves it out of every index',
	 'The server copies the value of the first field of the document into _id'],
	'If a document has no _id, the driver generates an ObjectId and adds it before the write is sent (and the server would add one if a driver did not). _id is never left empty, it is never taken from another field, and you are free to supply your own value if you prefer.');

add('insert-and-find', 'mid', 'sort',
	'Which call returns the five most expensive products, highest price first?',
	'db.products.find().sort({ priceCents: -1 }).limit(5)',
	['db.products.find().sort({ priceCents: 1 }).limit(5), because 1 is the largest number',
	 'db.products.find({ priceCents: -1 }).limit(5), because the filter picks the biggest values',
	 'db.products.find().skip(5).sort({ priceCents: -1 }), because skip keeps the first five'],
	'sort with -1 is descending, so the highest prices come first, and limit(5) keeps five. Sort 1 is ascending and returns the cheapest. A filter of { priceCents: -1 } looks for a price equal to minus one. skip(5) throws the first five away. MongoDB always sorts, then skips, then limits, however you chain them.');

add('insert-and-find', 'mid', 'paging',
	'Why does paging with skip(100000) get slow on a big collection?',
	'The server still walks past all 100000 skipped documents before it returns any',
	['skip forces the server to rewrite the whole collection into a temporary one first',
	 'skip switches off every index for the query until the cursor has been closed',
	 'skip is capped at 1000, so larger values silently fall back to a full collection scan'],
	'skip does not jump: the server has to step over each skipped document, so deep pages cost more and more. A better pattern is range paging, such as _id greater than the last id you saw, which can use the index. skip does not rewrite data, does not disable indexes and has no 1000 cap.');

// ───────────── query-operators ─────────────
add('query-operators', 'basic', 'filters',
	'What does this filter mean?',
	'Both conditions must hold: status is paid and qty is 3',
	['Either condition is enough, in the same way as an OR between the two',
	 'Only the last field counts, because a repeated filter keeps just the final key',
	 'It matches documents where status or qty is missing, as a way to find incomplete data'],
	'Listing several fields in one filter object means AND: a document must satisfy all of them. OR needs the $or operator. The two keys are different fields, so nothing is overwritten, and a missing field would not match an equality test on a value.',
	`db.orders.find({ status: "paid", qty: 3 })`);

add('query-operators', 'basic', '$in',
	'Which filter finds orders whose status is paid or shipped?',
	'{ status: { $in: ["paid", "shipped"] } }',
	['{ status: ["paid", "shipped"] }, which treats the array as a list of allowed values',
	 '{ status: "paid", status: "shipped" }, which tests both values in turn',
	 '{ $and: [{ status: "paid" }, { status: "shipped" }] }, which accepts either one'],
	'$in matches when the field equals any value in the list. A plain array as the value looks for a field that equals that exact array. A repeated key in a JavaScript object keeps only the last one. $and needs both conditions at once, and a single status cannot be paid and shipped together.');

add('query-operators', 'basic', 'comparison',
	'What does { qty: { $gt: 2, $lte: 5 } } match?',
	'Documents whose qty is greater than 2 and at most 5',
	['qty greater than 2 or at most 5, which in practice means almost every document',
	 'Only documents where qty is exactly 2 or exactly 5',
	 'qty strictly between 2 and 5, so the value 5 itself is left out'],
	'Two operators on one field are combined with AND. $gt excludes 2 and $lte includes 5, so 3, 4 and 5 match. It is not an OR, it is not limited to the two edge values, and $lte means less than or equal, which keeps 5 in the result.');

add('query-operators', 'basic', '$exists',
	'Which filter matches documents that have a phone field?',
	'{ phone: { $exists: true } }',
	['{ phone: true }, which tests for the field being present',
	 '{ phone: { $type: "string" } }, which tests for any value at all',
	 '{ exists: "phone" }, which is the shorthand form for checking a field name'],
	'$exists: true matches documents where the field is present, whatever its value. { phone: true } only finds documents whose phone equals the boolean true. $type narrows to one kind of value, such as strings, so it would skip a numeric phone. exists is not a top-level operator, and operators start with a dollar sign.');

add('query-operators', 'mid', 'arrays',
	'A product has tags ["sql", "js"]. Which filter matches it?',
	'{ tags: "js" }',
	['{ tags: { $size: "js" } }, because $size checks whether an element is present',
	 '{ tags: ["js"] }, because a one-element array matches any array that contains it',
	 '{ "tags.0": "js" }, because the dot form searches every position of the array'],
	'Matching a plain value against an array field succeeds if any element equals it, so { tags: "js" } matches. $size compares the length of the array with a number. An array on the right is compared as an exact array, so ["js"] would not match ["sql","js"]. "tags.0" looks only at the first element, which is "sql".');

add('query-operators', 'mid', '$in',
	'How does $in relate to $or when you test one field?',
	'$in is shorthand for an $or of equality checks on that single field',
	['$in works only on numbers, while $or works on every type of value',
	 '$or can use an index on the field, but $in always has to scan the collection',
	 '$in requires every listed value to be present in the array field, like a subset test'],
	'{ f: { $in: [a, b] } } behaves like { $or: [{ f: a }, { f: b }] }, and both can use an index on f. $in works on any type. The "must contain all of them" behaviour belongs to $all, not $in.');

add('query-operators', 'advanced', '$or',
	'What does `{ $or: [ { a: 1 }, { b: 2 } ] }` need to avoid a full collection scan?',
	'An index on a and another on b, so each branch can use its own index',
	['One compound index on { a: 1, b: 1 }, which covers both branches at once',
	 'No index at all, because $or is evaluated in memory after one pass over the data',
	 'A text index on both fields, since $or only accepts indexes of that kind'],
	'Each clause of an $or can use an index, but every clause needs one: if any branch has none, the server falls back to scanning. A compound index on a then b only helps the a branch, because the b branch is not a prefix. $or is not evaluated after a free scan, and text indexes are a separate feature.');

// ───────────── update-operators ─────────────
add('update-operators', 'basic', '$set',
	'What does this call do?',
	'Changes city to Leeds and leaves the other fields as they are',
	['Replaces the whole document with { city: "Leeds" } and removes every other field',
	 'Adds a second city field and keeps the old value next to the new one',
	 'Does nothing unless the document already has a city field that can be updated'],
	'$set changes only the fields you list. If city is missing it is added, so the update never depends on the field existing. Replacing the whole document is what replaceOne does, and a document cannot hold two fields with the same name.',
	`db.users.updateOne({ _id: 7 }, { $set: { city: "Leeds" } })`);

add('update-operators', 'basic', '$inc',
	'Which operator adds 1 to a counter field in one atomic step?',
	'$inc with the value 1',
	['$add with the value 1, which is the arithmetic operator for update calls',
	 '$sum with the value 1, which accumulates the field in place on the server',
	 '$set with the expression "views + 1", which the server evaluates when it writes'],
	'$inc increments (or decrements, with a negative number) a numeric field atomically on the server. $add and $sum exist in aggregation, not as update operators. $set stores the literal value you give it, so the string "views + 1" would be saved as text, not calculated.');

add('update-operators', 'basic', 'updateOne',
	'What happens if the filter of updateOne matches no document?',
	'Nothing changes and matchedCount is 0, unless you pass upsert: true',
	['MongoDB inserts a new document built from the update, which is the default behaviour',
	 'The call throws an error saying that no document was found for the filter',
	 'The first document in the collection is updated instead, so the call always changes something'],
	'With no match, updateOne reports matchedCount 0 and modifiedCount 0 and changes nothing. It does not insert unless upsert is true, it does not throw a not-found error, and it never falls back to an unrelated document.');

add('update-operators', 'basic', 'upsert',
	'What does upsert: true do?',
	'Updates the matching document, or inserts a new one if nothing matches',
	['Inserts a new copy of the document every time and keeps the old one next to it',
	 'Updates every matching document instead of only the first one it finds',
	 'Deletes the match and inserts it again, which gives the document a new _id'],
	'Upsert means update or insert: if the filter matches, that document is updated, and if not, a new document is created from the filter and update. It does not create duplicates when a match exists, it does not turn updateOne into updateMany, and it does not change an existing _id.');

add('update-operators', 'mid', '$push',
	'You run $push with the value "sql" on the same tags array twice. What does tags contain?',
	'"sql" twice, because $push never checks for duplicates',
	['"sql" once, because arrays in MongoDB behave like sets that ignore repeats',
	 '"sql" once, because $push compares the new value with the existing values first',
	 'The second call fails with a duplicate key error and the array stays as it was'],
	'$push simply appends, so running it twice adds the value twice. Arrays are ordered lists and may contain repeats. A duplicate key error concerns unique indexes, not array contents. To avoid duplicates use $addToSet.');

add('update-operators', 'mid', '$addToSet',
	'Which update adds "js" to tags only if it is not already there?',
	'{ $addToSet: { tags: "js" } }',
	['{ $push: { tags: "js" } }, which checks for existing values before adding',
	 '{ $set: { tags: "js" } }, which merges the string into the existing array',
	 '{ $pull: { tags: "js" } }, which adds the value when it is missing and removes it otherwise'],
	'$addToSet appends a value only if the array does not contain it already. $push always appends. $set would replace the whole array with the string "js". $pull only removes matching values and never adds anything.');

add('update-operators', 'advanced', 'atomicity',
	'Two clients run `updateOne({ _id: 1 }, { $inc: { stock: -1 } })` at the same moment. What is stock afterwards?',
	'Lower by 2, because each update to one document is atomic and they apply one after the other',
	['Lower by 1, because one update overwrites the result of the other',
	 'Unpredictable, so you must wrap the two updates in a transaction to get a correct count',
	 'Lower by 2 only if both clients use the majority write concern'],
	'Writes to a single document are atomic, so two $inc operations are applied in some order and both count. There is no lost update here, no transaction is needed for one document, and write concern controls acknowledgement, not whether concurrent updates combine correctly.');

// ───────────── indexes ─────────────
add('indexes', 'basic', 'purpose',
	'What problem does an index solve?',
	'It lets MongoDB find matching documents without reading every document in the collection',
	['It compresses documents on disk so that they can be read from storage faster',
	 'It makes writes faster, because less data has to be stored for each document',
	 'It copies the collection to a second server so that reads survive a failure'],
	'An index is an ordered structure that points to documents, so a query can jump to the matches instead of scanning everything. Indexes do not compress documents, they make writes a bit slower because each write must update them, and copying data to another server is replication.');

add('indexes', 'basic', 'write cost',
	'What does an index on { age: 1 } do to inserts?',
	'Each insert also has to update the index, so writes cost a little more',
	['Nothing at all, because indexes are only used when data is read',
	 'Inserts get faster, because the data is already sorted by age when it arrives',
	 'Inserts are blocked until the index has finished rebuilding overnight'],
	'Every index must be kept in step with the data, so inserts, updates and deletes that touch an indexed field do extra work. That is the price paid for faster reads. Indexes are not read-only helpers, they do not speed up inserts, and normal writes are not blocked by a nightly rebuild.');

add('indexes', 'basic', '_id',
	'Which index does every collection have automatically?',
	'A unique index on _id',
	['A text index on every string field, so searches work from the start',
	 'A compound index on all fields, in the order the documents were inserted',
	 'No index at all until you create the first one yourself'],
	'MongoDB creates a unique index on _id for every collection, which is how it guarantees one document per _id and makes lookups by _id fast. No text or all-field index is created for you, and any other index you need must be created explicitly.');

add('indexes', 'mid', 'prefix',
	'You have an index { a: 1, b: 1, c: 1 }. Which filter can use it through the prefix rule?',
	'A filter on a alone, or on a and b together',
	['A filter on b alone, because the index contains b',
	 'A filter on c alone, because it is the last and most specific key',
	 'A filter on b and c without a, because the keys are adjacent in the index'],
	'A compound index supports queries on a leading prefix of its keys: a, then a and b, then all three. The entries are sorted by a first, so b or c on their own are scattered through the index and cannot narrow the search the same way. Skipping the first key breaks the prefix.');

add('indexes', 'mid', 'ESR',
	'What does the ESR rule say about the order of fields in a compound index?',
	'Equality fields first, then the sort field, then range fields',
	['Range fields first, then equality, and the sort field last',
	 'The sort field first, then range fields, and equality fields last',
	 'Alphabetical order of the field names, so the planner can always find them'],
	'ESR stands for Equality, Sort, Range. Putting equality keys first narrows to one slice, the sort key next keeps that slice already in order, and range keys last avoid breaking the sort order. The field names themselves do not decide the order.');

add('indexes', 'mid', 'ESR',
	'For this query, which index follows the ESR rule best?',
	'{ status: 1, placedAt: -1, total: 1 }',
	['{ total: 1, status: 1, placedAt: -1 }, which starts with the most selective range',
	 '{ placedAt: -1, total: 1, status: 1 }, which starts with the sort field',
	 '{ status: 1, total: 1, placedAt: -1 }, which puts the range before the sort'],
	'status is an equality, placedAt is the sort and total is a range, so ESR gives status, placedAt, total. In the last alternative the range sits before the sort key, so the index cannot hand the results back already ordered and the server must sort in memory. The other two start with a non-equality field and lose the narrow equality slice.',
	`db.orders.find({ status: "paid", total: { $gt: 100 } }).sort({ placedAt: -1 })`);

add('indexes', 'mid', 'multikey',
	'What is a multikey index?',
	'An index on an array field, with one index entry per element of the array',
	['An index that spans several collections at once, so cross-collection queries are fast',
	 'An index on several fields of a document, which is another name for a compound index',
	 'An index that is rebuilt automatically from several replicas of the data'],
	'When an indexed field holds an array, MongoDB adds one entry for each element, which is called a multikey index. It lets { tags: "js" } use the index. An index never spans collections, a compound index is a different idea (several fields), and replication does not rebuild indexes this way.');

add('indexes', 'advanced', 'parallel arrays',
	'Why can a compound index not cover two array fields of the same document?',
	'It would need an entry for every pairing of elements, so such documents are rejected',
	['Arrays are not allowed inside any index, so even one array field in a compound index already fails',
	 'Compound indexes are limited to a single field of any kind',
	 'Only the first array field is indexed and the second is silently ignored when the index is built'],
	'MongoDB refuses to index "parallel arrays" in one compound index, because the number of entries would multiply: every element of one array paired with every element of the other. Indexing one array field in a compound index is fine, compound indexes hold many fields, and nothing is silently ignored: the write fails with an error.');

// ───────────── explain-and-performance ─────────────
add('explain-and-performance', 'basic', 'explain',
	'Which call shows how MongoDB ran a query?',
	'Calling explain("executionStats") on the query',
	['Calling db.collection.stats(), which prints the plan for the last query',
	 'Calling db.serverStatus(), which lists the plan of every running query',
	 'Calling hint() on the cursor, which prints the plan before running it'],
	'explain, usually with "executionStats", runs the query and reports the stages used and how many keys and documents were examined. stats() describes a collection and serverStatus() describes the server, so neither shows a query plan. hint() forces an index, it does not print a plan.');

add('explain-and-performance', 'mid', 'COLLSCAN',
	'In explain output, what does the stage COLLSCAN tell you?',
	'The query read the collection document by document, with no index to narrow it',
	['The query used the unique index on _id to reach the documents it needed',
	 'The query was answered from a cache, so the collection was not touched at all',
	 'The query ran on a collection that is currently being scanned for corruption'],
	'COLLSCAN means a full collection scan: every document was read and tested. IXSCAN is the stage that shows an index in use. COLLSCAN has nothing to do with caches or corruption checks. It is fine on tiny collections and a red flag on large ones.');

add('explain-and-performance', 'mid', 'examined vs returned',
	'totalDocsExamined is 50000 and nReturned is 20. What does that most likely mean?',
	'No index fits the filter, so the server reads far more documents than it returns',
	['The query is healthy: reading many documents is the normal price of accurate results',
	 'The server is out of memory and stopped returning documents early',
	 'The driver batch size is too small, so the server examined extra documents to fill it'],
	'A large gap between documents examined and documents returned means the server did a lot of work to find a few results, usually because no index supports the filter. Ideally the two numbers are close. Batch size changes network round trips, not how many documents the engine inspects.');

add('explain-and-performance', 'mid', 'covered query',
	'What is a covered query?',
	'A query that the index alone can answer, so no documents are read',
	['A query whose result is stored in a cache that covers later runs of the same query',
	 'A query wrapped in a transaction that covers all collections it touches',
	 'A query that projects every field of every matching document'],
	'A query is covered when the filter and the returned fields are all in one index, so MongoDB answers from the index without fetching documents (and it needs to leave out _id, or have it in the index). It is not about caching, it has nothing to do with transactions, and projecting all fields would defeat it.');

add('explain-and-performance', 'advanced', 'sort',
	'A query filters on status and sorts on placedAt, but the only index is on status. What does explain likely show for the sort?',
	'An in-memory SORT stage after the index scan, which must hold the results in memory or spill to disk',
	['Nothing extra at all: a sort costs nothing once the filter has used an index, because index hits come back sorted',
	 'A COLLSCAN stage on placedAt, because a sort always scans the whole collection',
	 'No sort stage, because the status index also keeps documents ordered by placedAt'],
	'The index on status returns matches in status order, not placedAt order, so the server has to sort them itself in a SORT stage. A compound index such as { status: 1, placedAt: -1 } would give the order for free. Sorting is not free, it does not by itself force a collection scan, and the index says nothing about placedAt.');

add('explain-and-performance', 'advanced', 'hint',
	'What does hint() do on a query?',
	'It forces the planner to use the index you name instead of picking its own',
	['It prints the index the planner would have chosen, without running the query',
	 'It creates the index you name if it does not exist yet, then runs the query',
	 'It limits the result to documents that the named index has cached recently'],
	'hint overrides the query planner and makes the query use a specific index. It is useful for testing or when the planner picks badly. It does not just print a suggestion, it does not create missing indexes (the query errors if the index does not exist), and indexes do not have a result cache.');

// ───────────── aggregation-pipeline ─────────────
add('aggregation-pipeline', 'basic', 'pipeline',
	'What is an aggregation pipeline?',
	'A list of stages, where each stage transforms the documents it receives and passes them on',
	['A single query operator that returns the sum of one field across a collection',
	 'A background job that copies data into another collection every night',
	 'A way to run several find queries in parallel and merge their cursors afterwards'],
	'An aggregation pipeline is an ordered array of stages such as $match, $group and $sort. Documents flow through the stages one after another. It is far more general than a sum, it runs when you call it rather than as a scheduled copy job, and the stages run in sequence, not as parallel finds.');

add('aggregation-pipeline', 'basic', '$match',
	'What does the $match stage do?',
	'It keeps only the documents that satisfy a filter, like the first argument of find',
	['It joins two collections on a field they share, adding the matches to each document',
	 'It groups documents by a key and counts how many fall in each group',
	 'It renames fields in every document that passes through'],
	'$match filters the stream of documents using the same query syntax as find. Joining is $lookup, grouping and counting is $group, and renaming or reshaping fields is done by stages such as $project or $addFields.');

add('aggregation-pipeline', 'mid', '$group',
	'What does this stage produce?',
	'One document per distinct customerId, each with the sum of its qty',
	['One document per order, each carrying a running total of qty up to that order',
	 'A single document with the sum of qty across all orders, whatever the customer',
	 'The original orders unchanged, only sorted by customerId'],
	'$group builds one output document for every distinct value of _id, here the customerId, and the accumulator $sum adds up qty inside each group. It does not keep the individual orders, it would give a single total only if _id were null, and it does not sort.',
	`{ $group: { _id: "$customerId", total: { $sum: "$qty" } } }`);

add('aggregation-pipeline', 'mid', '$match',
	'Why should $match usually be one of the first stages in a pipeline?',
	'It can use an index and shrinks the data before the later stages touch it',
	['A pipeline only runs if its first stage is a $match',
	 '$match is the only stage that is allowed to read documents from disk, all the others work in memory',
	 'Later stages cannot see any fields until a $match has run'],
	'Filtering early means less data flows into costly stages, and a $match at the start can use an index. Pipelines can start with any stage, every stage reads its input from the previous one, and fields are visible without a $match. (The optimizer may reorder some stages, but writing it first is the clear choice.)');

add('aggregation-pipeline', 'mid', '$addToSet',
	'Inside $group, how do $push and $addToSet differ?',
	'$push appends every value, $addToSet adds a value only if it is not already in the array',
	['$push sorts the resulting array, while $addToSet keeps the order of insertion',
	 '$push works on numbers only, while $addToSet works on strings only',
	 '$push keeps only the first value of each group, while $addToSet keeps all of them'],
	'Both build arrays inside a group. $push keeps duplicates, so the same value can appear several times, while $addToSet removes repeats (and gives no promise about order). Neither sorts, neither is limited by type, and $push keeps all values, not just the first.');

add('aggregation-pipeline', 'advanced', '$lookup',
	'What does the $lookup stage do?',
	'A left outer join: it adds an array of matches from another collection to each document',
	['An inner join that drops every input document that has no match',
	 'It looks a value up in an index and returns the position of that index entry to the caller',
	 'It copies documents from the other collection into this one permanently'],
	'$lookup joins in a pipeline. Each input document gets a new array field holding the matches from the other collection, and documents with no match stay, with an empty array. That makes it a left outer join, not an inner join. It reads, it does not write, and it has nothing to do with index positions.');

add('aggregation-pipeline', 'advanced', '$facet',
	'What does the $facet stage do?',
	'It runs several sub-pipelines over the same input and returns each result as its own array',
	['It splits the collection into equal parts and runs the pipeline on each part in parallel',
	 'It builds a search index over the fields of the incoming documents',
	 'It repeats the previous stage again and again until no document changes any more, like a loop'],
	'$facet lets one input feed several independent sub-pipelines, such as a list of results plus a count and a price histogram, and returns each outcome under its own key. It does not split work by partition, build indexes or loop.');

add('aggregation-pipeline', 'advanced', '$sort',
	'What changes when a $sort stage is directly followed by a $limit stage?',
	'The server keeps only the top N documents while sorting, so it needs memory for N, not for all',
	['Nothing, because the two stages always run completely separately',
	 'The limit is applied first, so the sort only sees N arbitrary documents',
	 'The sort is skipped and the first N documents in storage order are returned, with no ordering at all'],
	'MongoDB coalesces $sort followed by $limit into a top-N sort that only has to remember N documents, which saves memory and time. The limit does not run before the sort (that would give the wrong documents), and the sort is not dropped.');

// ───────────── schema-design ─────────────
add('schema-design', 'basic', 'embedding',
	'When is embedding a sub-document inside its parent a good choice?',
	'When it is read together with the parent and each parent has only a few of them',
	['When the data is shared by thousands of different parent documents',
	 'When the list of children keeps growing for as long as the application runs',
	 'When you never need to read the parent document on its own'],
	'Embedding keeps related data in one document, so one read returns it all and one write updates it atomically. It fits small, bounded data used with its parent. Shared data would be duplicated everywhere, unbounded lists risk the 16 MB limit, and the last reason has no bearing on the choice.');

add('schema-design', 'basic', 'references',
	'What is a reference in MongoDB schema design?',
	'Storing another document\'s _id so you can fetch it with a second query or $lookup',
	['A foreign key constraint that the server enforces on every insert and delete',
	 'A pointer that the server follows automatically whenever you read the parent document',
	 'A full copy of the other document stored inside the parent document'],
	'A reference is just a stored id, which your code (or $lookup) follows. MongoDB does not enforce foreign keys and does not follow references for you when you read a document. Storing a full copy is embedding or duplicating, not referencing.');

add('schema-design', 'mid', 'snapshot',
	'An order has line items, and product prices change often. Which design fits best?',
	'Embed the items in the order with the price paid, and keep current prices in products',
	['Embed only the product _id and read the current price each time the order is shown',
	 'Store one separate document per price change inside the order document',
	 'Keep orders and their items in different databases to avoid any duplication'],
	'An order is a record of what happened, so it should keep the price at purchase time, even if the product price changes later. Showing today\'s price would rewrite history, and per-change documents or separate databases add complexity without solving that.');

add('schema-design', 'mid', 'growth',
	'A blog post may collect millions of comments. Which design avoids a runaway array?',
	'Store each comment as its own document with the post _id, and query by that field',
	['Embed every comment in an array on the post, because a single read is simplest',
	 'Embed the comments and raise the BSON document size limit with a server option',
	 'Embed the comments and let the server trim the array automatically to a safe size'],
	'An array that grows without limit will eventually hit the 16 MB document limit and make every update to the post heavier. Separate comment documents with a postId (and an index on it) scale fine. The BSON limit cannot be raised, and the server never trims arrays on its own.');

add('schema-design', 'mid', 'denormalizing',
	'What is a cost of copying the same value into many documents?',
	'When the source value changes you must update every copy yourself',
	['The server rejects duplicates once two documents hold the same value',
	 'Reads become slower because duplicates are checked on every query',
	 'Indexes stop working on any field that appears in more than one document'],
	'Duplicating data speeds up reads but you own the consistency: a change has to be written to every copy, ideally in one update or transaction. MongoDB does not reject equal values (unless a unique index says so), does not check duplicates at read time, and indexes work fine on repeated values.');

add('schema-design', 'mid', 'principle',
	'Why does MongoDB modelling advice say "data that is accessed together should be stored together"?',
	'One read can return everything a screen needs, with no join or extra round trip',
	['Because MongoDB cannot join collections at all, so separate documents never work',
	 'Because writes to separate documents are always slower than writes to one document',
	 'Because the server can keep only one index per collection'],
	'Storing what you read together lets a single query serve a whole screen. MongoDB can join with $lookup, so it is a performance guideline, not a hard limit. Separate documents are not always slower to write, and a collection may have many indexes.');

add('schema-design', 'advanced', 'bucket pattern',
	'What is the bucket pattern used for?',
	'Grouping many small time-ordered records, like readings, into one document per time window',
	['Splitting every reading into several tiny documents, one per field, so that each field can be indexed on its own',
	 'Moving rarely used documents to a slower storage tier to save cost',
	 'Spreading writes evenly over shards by hashing the shard key'],
	'In the bucket pattern, for example, one document holds an hour of sensor readings as an array instead of one document per reading. That means far fewer documents and index entries to manage. It does not split records into smaller pieces, move them to other storage tiers, or hash a shard key.');

// ───────────── transactions ─────────────
add('transactions', 'basic', 'atomicity',
	'Is a write to a single MongoDB document atomic?',
	'Yes: an update to one document, even with nested fields, fully applies or not at all',
	['No: every update needs a transaction, otherwise it can apply halfway',
	 'Only when you use the majority write concern, because acknowledgement decides whether a write is atomic',
	 'Only for inserts, because updates are applied field by field'],
	'Operations on a single document are always atomic, including changes to nested objects and arrays, so another client never sees a half-applied update. This is why embedding related data often removes the need for a transaction. Write concern affects acknowledgement, not atomicity.');

add('transactions', 'mid', 'deployment',
	'Which deployments support multi-document transactions?',
	'Replica sets and sharded clusters, but not a standalone mongod',
	['Standalone servers only, since replica members would cause conflicts',
	 'Only sharded clusters, because they have a coordinator',
	 'Every deployment, with no configuration at all'],
	'Multi-document transactions need a replica set (since 4.0) or a sharded cluster (since 4.2). A standalone server does not support them, so a single-node development setup is usually run as a one-member replica set. They are not limited to sharded clusters.');

add('transactions', 'mid', 'abort',
	'What does abortTransaction do?',
	'Discards every change the transaction made, so none of them becomes visible',
	['Commits the changes made so far and then ends the session, so the work done up to that point is kept',
	 'Rolls back only the last operation inside the transaction',
	 'Pauses the transaction until the client reconnects'],
	'abortTransaction rolls back the entire transaction: nothing it wrote becomes visible to anyone. It does not commit partial work, and it does not undo just one step. There is no pause: a transaction is either committed or aborted.');

add('transactions', 'advanced', 'lifetime',
	'Why should transactions be kept short?',
	'Open transactions hold resources and are aborted after 60 seconds by default, so long ones slow others down',
	['Because the server allows only one transaction at a time across the whole deployment, so long ones block everyone',
	 'Because every commit flushes the oplog, which the server rate limits to one commit per minute for each client',
	 'Because a transaction may contain at most ten operations in total'],
	'A running transaction pins resources and, by default, is aborted once it exceeds transactionLifetimeLimitSeconds (60 seconds). Many transactions can run at once, commits are not limited to one per minute, and there is no ten-operation cap. Short transactions mean fewer conflicts and less pressure on memory.');

add('transactions', 'advanced', 'conflicts',
	'Two transactions update the same document at nearly the same time. What happens?',
	'One gets a write conflict and is aborted, and the application can retry the whole transaction',
	['Both succeed, and the value from whichever transaction commits last silently wins, with no error for the first',
	 'The second one waits for ever for a lock that the first never releases',
	 'The server merges the two updates field by field and commits both'],
	'MongoDB uses optimistic concurrency here: when two transactions touch the same document, one hits a write conflict and fails with a transient error, and the app should retry it (drivers\' transaction helpers do this). There is no silent lost update, no endless lock wait and no field-level merge.');

add('transactions', 'advanced', 'write concern',
	'For a transaction on a replica set, what does the write concern used at commit decide?',
	'How many members must have the committed data before the commit is acknowledged',
	['Which documents are locked while the transaction runs',
	 'How long the transaction may run before the server aborts it',
	 'Whether the transaction may span more than one collection'],
	'The write concern of a transaction is applied when it commits: with majority, the commit is acknowledged after most members have the data, so it survives a failover. It does not choose locks, it is not the time limit (that is a separate setting), and transactions may span many collections.');

// ───────────── replica-sets ─────────────
add('replica-sets', 'basic', 'basics',
	'What is a replica set?',
	'A group of mongod servers that keep copies of the same data, with one primary',
	['A set of shards, each of which holds a different part of the data',
	 'A list of indexes that is copied to every collection of a database',
	 'Several databases on one server that share a single data file'],
	'A replica set gives you redundancy and automatic failover: several members hold the same data and one of them, the primary, takes writes. Splitting data across servers is sharding, and index lists or shared data files are not replica sets.');

add('replica-sets', 'mid', 'primary',
	'Which member of a replica set accepts writes?',
	'Only the primary',
	['Any secondary, which forwards the write to the primary on the client\'s behalf',
	 'Whichever member the client connects to first',
	 'All members at once, using a consensus round for each write'],
	'In a replica set only the primary applies writes. Secondaries copy from it. Drivers connect to the set and find the primary themselves, so you do not pick a member, and writes are not decided by a vote each time: consensus is only used to elect a primary.');

add('replica-sets', 'mid', 'oplog',
	'How do secondaries stay in sync with the primary?',
	'They copy and replay the primary\'s oplog, an ordered log of its write operations',
	['The primary sends each secondary a full copy of its data files every minute',
	 'Each client must write to every member itself, which keeps them equal',
	 'They re-run the original queries from the server log in their own time'],
	'Every write on the primary is recorded in the oplog. Secondaries tail that log and apply the same operations in the same order, so they converge on the same data. Full file copies and client-side fan-out writes would be both slow and fragile, and the oplog records operations, not the original query text.');

add('replica-sets', 'advanced', 'majority',
	'A replica set has 3 voting members and one secondary fails. What happens?',
	'The remaining 2 of 3 are a majority, so the primary stays and writes continue',
	['No primary can exist until every member is back up',
	 'It needs 4 members to tolerate any failure, so the set stops accepting writes until a fourth one joins',
	 'The set keeps running, but only in read-only mode until the member returns'],
	'A primary needs the support of a majority of voting members. Two out of three is a majority, so one failure is tolerated and writes continue. Waiting for all members would make failover pointless, a fourth member is not required, and the set does not drop to read-only when a majority remains.');

add('replica-sets', 'advanced', 'write concern',
	'With write concern majority, when does the driver get an acknowledgement?',
	'After the write is on a majority of voting members, so it survives a primary failover',
	['As soon as the primary has applied it in memory',
	 'After every member, including all secondaries, has stored it',
	 'After the write has reached the disk of the primary and nowhere else, which is the fastest safe choice'],
	'w: "majority" waits until most members have the write, which means a new primary elected after a failure still has it. The primary alone is not enough, and waiting for every member would make one slow node block all writes.');

add('replica-sets', 'advanced', 'read preference',
	'Why can a read from a secondary return stale data?',
	'Secondaries apply the oplog slightly behind the primary, so a recent write may not be there yet',
	['Secondaries store only a hash of each document, not the document itself',
	 'Secondaries are rebuilt from scratch every few minutes, which loses the newest data',
	 'Reads on a secondary ignore indexes, so they see old versions of the data'],
	'Replication is asynchronous in the sense that a secondary applies the primary\'s oplog entries a little later. A read there may miss a write that has just been acknowledged on the primary. That is why the default read preference is primary. Secondaries hold full documents and use their own indexes.');

add('replica-sets', 'advanced', 'voting',
	'Why do replica sets recommend an odd number of voting members?',
	'Four voters still tolerate only one failure, the same as three, so an odd count costs less',
	['Because the oplog needs an odd number of entries to stay consistent when members copy it in parallel',
	 'Because elections run in rounds of three votes, so a set must be a multiple of three',
	 'Because MongoDB refuses to start a set with an even number of members'],
	'A majority of 4 is 3, so 4 members survive only one failure, exactly like 3 members. The extra server adds cost but no more fault tolerance. Elections and oplog entries have nothing to do with parity, and an even number is allowed even if it is not useful.');

// ───────────── sharding ─────────────
add('sharding', 'basic', 'basics',
	'In MongoDB, what is sharding?',
	'Splitting a collection across several servers so that each holds part of the data',
	['Keeping several copies of every document on different servers so the data survives a failure',
	 'Compressing old documents into a separate archive collection',
	 'Encrypting fields so that they are stored on different servers'],
	'Sharding spreads a collection across shards so no single server has to hold or serve everything, which lets a deployment scale out. Keeping copies of the same data is replication, and archiving or encryption are different features.');

add('sharding', 'mid', 'mongos',
	'What is the role of mongos in a sharded cluster?',
	'A router that sends each query to the shard or shards that hold the data',
	['A storage node that holds a replica of every shard and answers queries when a shard is down',
	 'A backup tool that exports shard data to files',
	 'The process that builds the indexes on all shards'],
	'Applications connect to mongos, which consults the cluster metadata and routes operations to the right shards, then merges the results. It does not store data, it is not a backup tool and it does not build indexes.');

add('sharding', 'mid', 'shard key',
	'What does the shard key decide?',
	'Which shard stores a document, based on the value of the chosen field or fields',
	['Which secondary a read is sent to, when the read preference allows reads from secondaries',
	 'Which index the query planner uses for sorting',
	 'How many replicas each document will have'],
	'The shard key is the field (or fields) whose value determines where a document lives in the cluster. Read routing to secondaries is read preference, index choice belongs to the planner, and replica counts come from the replica set configuration.');

add('sharding', 'advanced', 'monotonic keys',
	'Why is a monotonically increasing shard key, such as a timestamp or an ObjectId, a problem?',
	'All new inserts land in the chunk with the highest range, so one shard takes all the writes',
	['The key can no longer be indexed, so every query that filters on that field gets slower and slower',
	 'Documents with larger keys are duplicated to every shard',
	 'MongoDB refuses to insert once the key passes a threshold'],
	'A key that always grows sends every new document to the same end of the key range, creating a hot shard while others idle. The key can still be indexed, documents are not duplicated to every shard, and there is no threshold. A hashed key spreads such inserts out.');

add('sharding', 'advanced', 'hashed keys',
	'What does a hashed shard key give up?',
	'Efficient range queries on the key, because neighbouring values are scattered across shards',
	['An even distribution, because hashes cluster around small values and leave most shards empty for long',
	 'The balancer, because chunks of a hashed key cannot be moved between shards once they are created',
	 'Targeted queries that use equality on the key'],
	'Hashing scatters neighbouring key values, which is exactly what spreads writes, but a range query such as ids 1 to 1000 then has to ask every shard. Equality queries on the key still go to one shard, chunks of a hashed key are balanced like any other, and a good hash gives an even spread rather than clustering.');

add('sharding', 'advanced', 'scatter-gather',
	'A query on a sharded collection does not include the shard key. What does mongos do?',
	'It sends the query to all shards and merges the results (scatter-gather)',
	['It rejects the query with an error, because queries on a sharded collection must include the shard key',
	 'It picks one shard at random and returns only its results',
	 'It reads a full copy of the data kept on the config servers'],
	'Without the shard key mongos cannot tell which shard holds the matches, so it asks all of them and combines the answers. That works but costs more as the cluster grows. It does not refuse the query, does not guess one shard, and config servers hold metadata, not your data.');

add('sharding', 'advanced', 'shard key choice',
	'Which property gives a shard key the best spread of writes?',
	'High cardinality, values that do not only increase, and no single value that dominates',
	['Low cardinality such as a country code, so each shard gets a neat bucket',
	 'A boolean field, so that the data splits evenly into two groups',
	 'A field that is the same for most documents, so chunks are easy to split'],
	'A good key has many distinct values (high cardinality), does not change in only one direction, and is not dominated by a few frequent values. Low-cardinality keys cannot be split into many chunks, a boolean offers only two buckets, and a field that is mostly the same creates one huge unsplittable chunk.');

// ───────────── validation-and-ttl ─────────────
add('validation-and-ttl', 'basic', 'TTL',
	'What does a TTL index do?',
	'Deletes documents automatically once their date field is older than a set number of seconds',
	['Limits how many documents a collection may hold at any time',
	 'Caches the result of queries for the given number of seconds',
	 'Rejects any write to a document after a certain time has passed'],
	'A TTL (time to live) index removes documents after their date value has aged past expireAfterSeconds, which suits sessions and temporary data. It is not a size cap (that is a capped collection), not a query cache, and it deletes documents rather than blocking writes.');

add('validation-and-ttl', 'mid', 'TTL',
	'Which field type can a TTL index work on?',
	'A date, or an array that holds dates',
	['Any string that looks like a date, such as "2025-03-14"',
	 'Only numeric Unix timestamps stored as integers',
	 'Only the _id field, because an ObjectId carries a timestamp'],
	'The indexed field must be a BSON date (or an array containing dates). Strings and integers are ignored by the TTL monitor, and an ObjectId is not a date value, so a TTL index on _id does not expire documents.');

add('validation-and-ttl', 'mid', 'TTL',
	'Why might an expired document still be visible for a minute or so?',
	'A background task removes expired documents about once a minute, so deletion is not instant',
	['TTL indexes only run when the server restarts, so expired documents wait for the next restart',
	 'The document is kept until a secondary confirms the delete',
	 'TTL deletes only happen during the nightly backup window'],
	'A background thread checks for expired documents roughly every 60 seconds, so there is a delay between expiry and removal, and queries may still return the document in between. TTL does not depend on a restart, on secondaries confirming, or on backups.');

add('validation-and-ttl', 'mid', 'validation',
	'What does a $jsonSchema validator on a collection do?',
	'Rejects inserts and updates that break the schema rules, with the default error action',
	['Rewrites invalid documents automatically so they match the schema',
	 'Checks only the documents returned by find, not the ones being written',
	 'Creates an index for every field named in the schema'],
	'A validator is checked on writes. With the default validationAction, a document that violates the rules makes the insert or update fail with a validation error. It does not repair documents, it does not run on reads, and it does not create indexes.');

add('validation-and-ttl', 'mid', 'validation',
	'You add a validator to a collection that already has documents. What happens to those documents?',
	'They are not deleted or checked up front; a rule applies when a document is inserted or updated',
	['The server deletes every existing document that fails the rules',
	 'The collection becomes read-only until each existing document has been fixed by hand to match the rules',
	 'The validator is ignored until you restart the server'],
	'Adding a validator does not scan or remove existing data. The rules are applied to later inserts and updates (the validationLevel setting controls how strictly updates to old documents are checked). The server does not delete failing documents, lock the collection, or wait for a restart.');

export const mongodbQuestions = out;
