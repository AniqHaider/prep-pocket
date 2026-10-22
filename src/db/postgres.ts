import type { DbEngine, DbTopic } from './types';
import { postgresQuestions } from './postgres/questions';

const md = (...lines: string[]) => lines.join('\n');

// `try` snippets run against the shared sample database: customers, products, orders, order_items.
const topics: DbTopic[] = [
	{
		id: 'tables-and-types',
		title: 'Tables and column types',
		level: 'basic',
		summary: 'Pick types that store your data exactly, and know why ids can have gaps.',
		scenes: ['pg-float-vs-numeric'],
		notes: md(
			'A table is a set of rows, and every column has a **type**. Postgres checks the type on every insert, so a good type is your first line of defence against bad data.',
			'',
			'The choices that matter most:',
			'',
			'- **Money:** `numeric(12,2)`, or whole cents in an `integer`. Never `float8` or `real`, which are binary approximations.',
			'- **Moments in time:** `timestamptz`. It stores a single instant (internally UTC) and shows it in the session time zone.',
			'- **Text:** `text` is fine. `varchar(255)` is stored identically and only adds a length check.',
			'- **Ids:** use an identity column. Prefer `bigint` so you never run out of numbers.',
			'',
			'```sql',
			'CREATE TABLE products (',
			'  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,',
			'  name        text NOT NULL,',
			'  price_cents integer NOT NULL',
			');',
			'```',
			'',
			'**Common trap:** sequence numbers are never handed back. A rolled-back insert still uses up an id, so gaps such as 1, 2, 4 are normal. Never depend on ids being contiguous.'
		),
		try: [
			{ label: 'Column types', code: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' ORDER BY ordinal_position;` },
			{ label: 'Float vs numeric', code: `SELECT 0.1::float8 + 0.2::float8 AS float_sum, 0.1::numeric + 0.2::numeric AS numeric_sum;` },
			{ label: 'Cents to money', code: `SELECT name, price_cents, (price_cents / 100.0)::numeric(10,2) AS price FROM products ORDER BY price_cents DESC;` }
		]
	},
	{
		id: 'select-and-filter',
		title: 'SELECT, WHERE and NULL',
		level: 'basic',
		summary: 'Filter rows correctly, and understand why NULL breaks the rules you expect.',
		scenes: ['pg-query-order'],
		notes: md(
			'`SELECT` reads rows, `WHERE` filters them, `ORDER BY` sorts, `LIMIT` cuts. A query runs in a different order from how it is written: **FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT**. That is why `WHERE` cannot see an alias created in `SELECT`, but `ORDER BY` can.',
			'',
			'```sql',
			"SELECT id, status FROM orders",
			"WHERE status = 'paid'",
			'ORDER BY placed_at DESC',
			'LIMIT 5;',
			'```',
			'',
			'**NULL** means "unknown", not "empty". Any comparison with NULL is unknown, and `WHERE` keeps only rows where the condition is true. So `city = NULL` matches nothing; write `city IS NULL`. Also, `x NOT IN (subquery)` returns no rows at all if the subquery contains a NULL, so prefer `NOT EXISTS`.',
			'',
			'**Common trap:** `LIMIT` without `ORDER BY` gives you any rows, in an order that can change between runs. If the rows matter, sort them, with a unique tie-breaker like `id`.'
		),
		try: [
			{ label: 'NULL is not equal to NULL', code: `SELECT NULL = NULL AS equals, NULL IS NULL AS is_null;` },
			{ label: 'Latest paid orders', code: `SELECT id, status, placed_at FROM orders WHERE status IN ('paid', 'shipped') ORDER BY placed_at DESC LIMIT 5;` },
			{ label: 'IS NULL vs = NULL on real data', code: `SELECT count(*) AS rows_total,\n       count(*) FILTER (WHERE o.id IS NULL) AS customers_without_orders,\n       count(*) FILTER (WHERE o.id = NULL) AS equals_null_matches\nFROM customers c LEFT JOIN orders o ON o.customer_id = c.id;` }
		]
	},
	{
		id: 'joins',
		title: 'Joins',
		level: 'basic',
		summary: 'Combine tables without losing rows or accidentally multiplying them.',
		scenes: ['pg-join-types', 'pg-join-fanout'],
		notes: md(
			'A join pairs rows from two tables whenever a condition is true. The type decides what happens to rows that find no partner:',
			'',
			'- **INNER JOIN:** only matched pairs survive.',
			'- **LEFT JOIN:** every row of the left table survives; missing partners show up as NULL.',
			'- **CROSS JOIN:** every row paired with every row (8 x 10 = 80).',
			'',
			'```sql',
			'SELECT c.name, o.id',
			'FROM customers c',
			'LEFT JOIN orders o ON o.customer_id = c.id;',
			'```',
			'',
			'To find rows **without** a match, use `NOT EXISTS`, or a `LEFT JOIN` followed by `WHERE o.id IS NULL`.',
			'',
			'**Common traps:** a filter on the right table in `WHERE` (`WHERE o.status = \'paid\'`) turns a LEFT JOIN back into an inner join, so put it in the `ON` clause. And a one-to-many join repeats the parent row for every child, which silently inflates `COUNT(*)` and `SUM()`.'
		),
		try: [
			{ label: 'Orders per customer', code: `SELECT c.name, o.id AS order_id, o.status FROM customers c JOIN orders o ON o.customer_id = c.id ORDER BY c.name, o.id;` },
			{ label: 'Keep customers with 0 orders', code: `SELECT c.name, count(o.id) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.name ORDER BY orders DESC, c.name;` },
			{ label: 'Customers without orders', code: `SELECT c.name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);` }
		]
	},
	{
		id: 'grouping-and-aggregates',
		title: 'GROUP BY and aggregates',
		level: 'basic',
		summary: 'Turn many rows into totals, and know exactly how NULL and empty groups behave.',
		scenes: ['pg-group-by'],
		notes: md(
			'`GROUP BY` sorts rows into buckets, one per distinct value, and an **aggregate** (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) is calculated once per bucket. Every other column in `SELECT` must be grouped or aggregated, because a bucket holds many values of it.',
			'',
			'```sql',
			'SELECT status, count(*) AS orders',
			'FROM orders',
			'GROUP BY status',
			'HAVING count(*) > 1;',
			'```',
			'',
			'- **WHERE** filters rows before grouping. **HAVING** filters groups after the aggregate is known.',
			'- Aggregates **skip NULLs**: `AVG` of 10, NULL, 20 is 15. `COUNT(*)` counts rows, `COUNT(col)` counts non-NULL values.',
			'- `FILTER` computes several conditional counts in one pass: `count(*) FILTER (WHERE status = \'paid\')`.',
			'',
			'**Common trap:** `SUM` over zero rows is **NULL**, not 0, while `COUNT` over zero rows is 0. Wrap it as `COALESCE(SUM(x), 0)` when a chart or API expects a number.'
		),
		try: [
			{ label: 'Orders per status', code: `SELECT status, count(*) AS orders FROM orders GROUP BY status ORDER BY orders DESC;` },
			{ label: 'Groups with HAVING', code: `SELECT category, count(*) AS products, avg(price_cents)::int AS avg_cents FROM products GROUP BY category HAVING count(*) > 1;` },
			{ label: 'COUNT(*) vs COUNT(col)', code: `SELECT count(*) AS all_rows, count(o.id) AS with_order FROM customers c LEFT JOIN orders o ON o.customer_id = c.id;` }
		]
	},
	{
		id: 'indexes',
		title: 'Indexes',
		level: 'mid',
		summary: 'Know what an index is, which queries can use it, and what it costs.',
		scenes: ['pg-index-vs-scan', 'pg-leftmost-prefix'],
		notes: md(
			'An index is a sorted structure kept beside the table, so Postgres can jump to matching rows instead of reading every one. The default is a **B-tree**: it handles `=`, ranges and `ORDER BY`, and it can serve `LIKE \'abc%\'` prefix matches, but only under the C collation or with a `text_pattern_ops` index.',
			'',
			'```sql',
			'CREATE INDEX orders_customer_idx',
			'  ON orders (customer_id, placed_at);',
			'```',
			'',
			'- A `PRIMARY KEY` or `UNIQUE` constraint builds an index for you. A **foreign key does not**: index the child column yourself.',
			'- In a composite index, put equality columns first and the range column last. An index helps most when the filter constrains its leading column(s). Postgres can sometimes still scan the whole index, and newer versions can sometimes skip, but a tight slice is what you want.',
			'- A function on the column (`lower(email)`) needs an **expression index** on that same function.',
			'- A **partial index** (`WHERE status = \'pending\'`) is small, and `INCLUDE` adds payload columns for index-only scans.',
			'',
			'**Common trap:** more indexes are not free. Every insert, update and delete must maintain each one, and for low-selectivity filters (a boolean that is true for 95% of rows) the planner correctly ignores the index and scans the table.'
		),
		try: [
			{ label: 'Existing indexes', code: `SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('orders', 'order_items', 'customers') ORDER BY tablename, indexname;` },
			{ label: 'Lookup by primary key', code: `EXPLAIN SELECT * FROM orders WHERE id = 5;` },
			{ label: 'Filter on a non-indexed column', code: `EXPLAIN SELECT * FROM orders WHERE status = 'paid';` }
		]
	},
	{
		id: 'explain-and-planner',
		title: 'EXPLAIN and the planner',
		level: 'mid',
		summary: 'Read a query plan, and tell when the planner is working from bad numbers.',
		scenes: ['pg-explain-plan'],
		notes: md(
			'`EXPLAIN` shows the plan the planner chose, as a tree. Read it from the **innermost, most indented node outwards**. `EXPLAIN ANALYZE` also **runs** the query and adds actual rows and timings, so wrap an `UPDATE` or `DELETE` in `BEGIN ... ROLLBACK` when you analyse it.',
			'',
			'```sql',
			'EXPLAIN (ANALYZE, BUFFERS)',
			'SELECT * FROM orders WHERE status = \'paid\';',
			'```',
			'',
			'What to look at:',
			'',
			'- **Cost** is in arbitrary planner units, not milliseconds. Only comparisons between plans matter.',
			'- **Estimated vs actual rows.** A big gap usually means stale statistics: run `ANALYZE`.',
			'- **Seq Scan** is not always bad: for a tiny table, or a query returning most rows, it is the cheapest plan.',
			'- **loops=N:** time and rows shown on a node are *per loop*, so multiply by N.',
			'- **BUFFERS:** `shared hit` pages came from Postgres\' cache, `read` pages came from outside it.',
			'',
			'**Common trap:** judging a plan on a tiny dev database. The planner chooses by size and statistics, so test on realistic data.'
		),
		try: [
			{ label: 'Plan for a join', code: `EXPLAIN SELECT c.name, o.id FROM customers c JOIN orders o ON o.customer_id = c.id;` },
			{ label: 'Plan with real timings', code: `EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'paid';` },
			{ label: 'Plan with buffer counts', code: `EXPLAIN (ANALYZE, BUFFERS) SELECT count(*) FROM order_items;` }
		]
	},
	{
		id: 'transactions-acid',
		title: 'Transactions and ACID',
		level: 'mid',
		summary: 'Group statements so they succeed together or not at all.',
		scenes: ['pg-rollback-transfer'],
		notes: md(
			'A transaction groups statements into one unit of work. **ACID** names what you get:',
			'',
			'- **Atomicity:** all of it happens, or none of it does.',
			'- **Consistency:** constraints hold before and after.',
			'- **Isolation:** concurrent transactions do not see each other\'s half-finished work.',
			'- **Durability:** once COMMIT returns, the change survives a crash (the commit record is flushed to the write-ahead log).',
			'',
			'```sql',
			'BEGIN;',
			'UPDATE accounts SET bal = bal - 30 WHERE id = 1;',
			'UPDATE accounts SET bal = bal + 30 WHERE id = 2;',
			'COMMIT;',
			'```',
			'',
			'Without `BEGIN`, each statement is its own transaction and commits immediately (autocommit). A `SAVEPOINT` lets you roll back part of a transaction. Unlike many databases, **DDL is transactional** in Postgres, so you can wrap a migration in `BEGIN ... ROLLBACK`.',
			'',
			'**Common trap:** after an error inside a transaction, every later statement fails with "current transaction is aborted" until you `ROLLBACK`. Handle the error, do not just keep sending queries.'
		),
		try: [
			{ label: 'Rollback demo (temp table)', code: `BEGIN; CREATE TEMP TABLE acct (id int, bal int); INSERT INTO acct VALUES (1, 100), (2, 50); UPDATE acct SET bal = bal - 30 WHERE id = 1; SELECT * FROM acct ORDER BY id; ROLLBACK;` },
			{ label: 'Current isolation level', code: `SHOW transaction_isolation;` }
		]
	},
	{
		id: 'isolation-and-mvcc',
		title: 'Isolation levels and MVCC',
		level: 'advanced',
		summary: 'See how Postgres lets readers and writers work together using row versions.',
		scenes: ['pg-mvcc-versions'],
		notes: md(
			'Postgres uses **MVCC** (multi-version concurrency control). An `UPDATE` never edits a row in place: it writes a **new version** and leaves the old one for transactions whose snapshot still needs it. That is why a plain `SELECT` never blocks an `UPDATE`, and the other way round. An updated row is a new version at a new physical position (`ctid`), stamped with the `xmin` of the transaction that wrote it. In the demo below, the table is created and then updated in two separate transactions: the updated row gets a new `xmin` and a new `ctid`, while the other rows keep theirs.',
			'',
			'Dead versions are cleaned up by `VACUUM`. A transaction left open for hours holds back that cleanup, and the table bloats.',
			'',
			'```sql',
			'BEGIN ISOLATION LEVEL REPEATABLE READ;',
			'SELECT count(*) FROM orders;  -- same snapshot until COMMIT',
			'COMMIT;',
			'```',
			'',
			'- **READ COMMITTED** (default): every statement gets a fresh snapshot. `READ UNCOMMITTED` behaves the same, with no dirty reads.',
			'- **REPEATABLE READ:** one snapshot for the whole transaction, which also rules out phantom reads. Updating a row someone else changed fails with a serialization error, so **retry**.',
			'- **SERIALIZABLE:** adds detection of anomalies like write skew, again by failing and asking you to retry.',
			'',
			'**Common trap:** assuming the default level protects a read-then-write sequence. It does not; use `FOR UPDATE` or do the arithmetic inside the `UPDATE`.'
		),
		try: [
			{ label: 'See row versions (xmin / ctid)', code: `BEGIN;\nCREATE TEMP TABLE t AS SELECT id, name FROM customers ORDER BY id LIMIT 3;\nCOMMIT;\nSELECT xmin, ctid, * FROM t ORDER BY id;\nBEGIN;\nUPDATE t SET name = name || '!' WHERE id = (SELECT min(id) FROM t);\nCOMMIT;\nSELECT xmin, ctid, * FROM t ORDER BY id;` },
			{ label: 'Default isolation', code: `SELECT current_setting('default_transaction_isolation') AS level;` }
		]
	},
	{
		id: 'locks-and-deadlocks',
		title: 'Locks and deadlocks',
		level: 'advanced',
		summary: 'Avoid lost updates and deadlocks, and build a safe job queue.',
		scenes: ['pg-lost-update', 'pg-deadlock'],
		notes: md(
			'Reads do not lock, but writes do. Two sessions writing the same row queue up: the second waits for the first to commit or roll back.',
			'',
			'The classic bug is a **lost update**: read a balance, compute in application code, write it back. Two sessions can both read 100 and both write 90. Fix it by doing the arithmetic in SQL, or by locking the row before you read it:',
			'',
			'```sql',
			'SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;',
			'UPDATE accounts SET balance = balance - 10 WHERE id = 1;',
			'```',
			'',
			'A **deadlock** is a cycle of waiting. Postgres detects it after `deadlock_timeout` (1 second by default), aborts one transaction with an error, and lets the other finish. Lock rows in a **consistent order** to prevent cycles, and retry the victim.',
			'',
			'`FOR UPDATE SKIP LOCKED` is the building block for job queues: each worker claims a different pending row instead of waiting on a locked one.',
			'',
			'**Common trap:** a migration that needs an exclusive table lock queues behind a long query, and then every new query queues behind the migration. Set `lock_timeout` for DDL.'
		),
		try: [
			{ label: 'Claim one row (queue style)', code: `SELECT * FROM orders WHERE status = 'pending' ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED;` },
			{ label: 'Locks held right now', code: `SELECT locktype, mode, granted FROM pg_locks LIMIT 5;` }
		]
	},
	{
		id: 'constraints-and-keys',
		title: 'Constraints and keys',
		level: 'mid',
		summary: 'Let the database reject bad data so your code does not have to.',
		scenes: ['pg-fk-cascade'],
		notes: md(
			'Constraints are rules the database enforces on every write, for every application.',
			'',
			'- **PRIMARY KEY:** unique and not null, with an index built for you. It can span columns: `PRIMARY KEY (order_id, product_id)` allows each product once per order.',
			'- **UNIQUE:** no duplicate values, but any number of NULLs (use `NULLS NOT DISTINCT` on 15+ to change that).',
			'- **NOT NULL** and **CHECK** (`CHECK (price_cents >= 0)`).',
			'- **FOREIGN KEY:** a child row must point at an existing parent. `ON DELETE` decides what happens to children: `NO ACTION` blocks, `CASCADE` deletes them, `SET NULL` detaches them.',
			'',
			'```sql',
			'ALTER TABLE orders',
			'  ADD FOREIGN KEY (customer_id) REFERENCES customers (id)',
			'  ON DELETE RESTRICT;',
			'```',
			'',
			'`DEFERRABLE INITIALLY DEFERRED` postpones the check to `COMMIT`, so rows can be inserted in any order within a transaction.',
			'',
			'**Common trap:** a `CHECK` passes when its expression is **NULL**, so `CHECK (price_cents >= 0)` still allows a missing price. Add `NOT NULL` as well.'
		),
		try: [
			{ label: 'Constraints on orders', code: `SELECT conname, contype FROM pg_constraint WHERE conrelid = 'orders'::regclass;` },
			{ label: 'Violate a foreign key', code: `INSERT INTO orders (customer_id, status, placed_at) VALUES (9999, 'pending', current_date);` },
			{ label: 'All constraints', code: `SELECT table_name, constraint_type FROM information_schema.table_constraints WHERE table_schema = 'public' ORDER BY 1, 2;` }
		]
	},
	{
		id: 'jsonb-and-arrays',
		title: 'JSONB and arrays',
		level: 'mid',
		summary: 'Store flexible documents, query inside them, and know when to use a column instead.',
		scenes: ['pg-jsonb-lookup'],
		notes: md(
			'`jsonb` stores a JSON document in a binary form you can query and index. Prefer it over `json`, which keeps the raw text and re-parses it on every read.',
			'',
			'```sql',
			"SELECT data ->> 'plan' AS plan",
			'FROM profiles',
			'WHERE data @> \'{"plan": "pro"}\';',
			'```',
			'',
			'- `->` returns jsonb, `->>` returns text.',
			'- `@>` means "contains". A **GIN index** makes it fast. `jsonb_path_ops` is smaller and quicker for `@>` but does not support key-existence operators like `?`.',
			'- Postgres **arrays** are 1-based: `tags[1]` is the first element. Test membership with `\'x\' = ANY(tags)`.',
			'',
			'Use jsonb for genuinely flexible, rarely joined data such as settings or third-party payloads.',
			'',
			'**Common trap:** a field you filter and join on constantly belongs in a **real column**. Inside jsonb it has no declared type, cannot be NOT NULL or a foreign key, and the planner has only coarse statistics for it.'
		),
		try: [
			{ label: 'Extract as text', code: `SELECT '{"name":"Asha","tags":["a","b"],"plan":"pro"}'::jsonb ->> 'plan' AS plan;` },
			{ label: 'Containment', code: `SELECT '{"plan":"pro","tags":["a","b"]}'::jsonb @> '{"plan":"pro"}' AS contains;` },
			{ label: 'Arrays are 1-based', code: `SELECT (ARRAY['a','b','c'])[1] AS first, 'b' = ANY(ARRAY['a','b','c']) AS has_b;` },
			{ label: 'Build JSON from rows', code: `SELECT jsonb_build_object('customer', c.name, 'city', c.city) AS doc FROM customers c ORDER BY c.id LIMIT 3;` }
		]
	},
	{
		id: 'window-functions-and-ctes',
		title: 'Window functions and CTEs',
		level: 'advanced',
		summary: 'Rank, compare and total across rows without collapsing them, and structure long queries.',
		scenes: ['pg-window-vs-group'],
		notes: md(
			'A **window function** calculates across a set of related rows but keeps every row, unlike `GROUP BY`, which collapses them.',
			'',
			'```sql',
			'SELECT id, customer_id, placed_at,',
			'  row_number() OVER (PARTITION BY customer_id ORDER BY placed_at) AS nth_order',
			'FROM orders;',
			'```',
			'',
			'- `PARTITION BY` splits rows into groups, `ORDER BY` orders them inside each.',
			'- `ROW_NUMBER` counts 1, 2, 3. `RANK` gives ties the same rank and then skips (1, 1, 3). `DENSE_RANK` does not skip (1, 1, 2).',
			'- `LAG` and `LEAD` read the previous or next row, so day-over-day change needs no self join.',
			'- With `ORDER BY` and no frame, `SUM(x) OVER (...)` is a running total up to the current row.',
			'',
			'A **CTE** (`WITH name AS (...)`) names a sub-query for readability. Since Postgres 12 a simple CTE used once is inlined; add `MATERIALIZED` to force it to be computed first. `WITH RECURSIVE` walks trees: an anchor query, then a step repeated until it returns no new rows.',
			'',
			'**Common trap:** you cannot filter on a window function in `WHERE`, because it runs after it. Wrap the query in a CTE or subquery and filter outside.'
		),
		try: [
			{ label: 'nth order per customer', code: `SELECT id, customer_id, placed_at, row_number() OVER (PARTITION BY customer_id ORDER BY placed_at) AS nth_order FROM orders ORDER BY customer_id, placed_at;` },
			{ label: 'Running total of orders', code: `SELECT placed_at, count(*) AS orders, sum(count(*)) OVER (ORDER BY placed_at) AS running_orders FROM orders GROUP BY placed_at ORDER BY placed_at;` },
			{ label: 'A CTE', code: `WITH paid AS (SELECT * FROM orders WHERE status = 'paid') SELECT customer_id, count(*) AS paid_orders FROM paid GROUP BY customer_id ORDER BY 2 DESC;` }
		]
	}
];

export const postgres: DbEngine = {
	id: 'postgres',
	name: 'PostgreSQL',
	tagline: 'The relational database behind most backends: tables, indexes, transactions.',
	topics,
	questions: postgresQuestions,
	quizTopics: topics.map((t) => ({ id: t.id, label: t.title })),
	playground: 'sql',
	quizBlurb: 'PostgreSQL, from tables and joins to indexes and transactions'
};
