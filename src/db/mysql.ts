import type { DbEngine, DbTopic } from './types';
import { mysqlQuestions } from './mysql/questions';

const topics: DbTopic[] = [
	{
		id: 'data-types-and-tables',
		title: 'Data types and tables',
		level: 'basic',
		summary: 'Pick the right column types, and know how AUTO_INCREMENT behaves.',
		scenes: ['my-auto-increment-gap'],
		notes: `A table is a set of typed columns. Choosing the type is your first design decision, and a few MySQL habits differ from other databases.

- **Whole numbers:** \`INT\`, \`BIGINT\`, and \`TINYINT\` (one byte, -128 to 127). \`BOOLEAN\` is just a synonym for \`TINYINT(1)\`.
- **Money:** use \`DECIMAL(10,2)\`, which is exact. \`FLOAT\` and \`DOUBLE\` are approximations.
- **Time:** \`DATETIME\` stores what you give it. \`TIMESTAMP\` is converted to and from the session time zone.
- **Ids:** add \`AUTO_INCREMENT\` to the primary key. MySQL has no sequences, unlike PostgreSQL.
- **Quoting names:** use backticks, as in \`order\`. Double quotes are string literals unless ANSI_QUOTES is on.

\`\`\`sql
CREATE TABLE orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  total DECIMAL(10,2) NOT NULL,
  created_at DATETIME NOT NULL
);
\`\`\`

**Common trap:** the number in \`TINYINT(1)\` or \`INT(11)\` is only a display hint, not a size limit. Also, a rolled-back insert still uses up an auto-increment value, so ids can have gaps.`
	},
	{
		id: 'select-and-filter',
		title: 'Selecting and filtering rows',
		level: 'basic',
		summary: 'Read rows safely: NULL logic, ranges, patterns and pagination.',
		scenes: ['my-null-three-valued'],
		notes: `\`SELECT ... FROM ... WHERE ... ORDER BY ... LIMIT\` covers most reads. The details are where bugs hide.

- **NULL** means unknown. \`col = NULL\` is never true; write \`col IS NULL\`. MySQL also has \`<=>\`, a null-safe equals.
- **BETWEEN** includes both ends: \`BETWEEN 5 AND 10\` means 5 up to and including 10.
- **LIKE** can use an index only when the pattern starts with fixed text: \`'asha%'\` yes, \`'%asha'\` no.
- **LIMIT without ORDER BY** returns rows in no promised order. Always sort before you paginate.
- **Large OFFSET** is slow: MySQL still walks over the skipped rows. Prefer keyset pagination.

\`\`\`sql
SELECT id, title FROM posts
WHERE id < 5000
ORDER BY id DESC
LIMIT 20;
\`\`\`

The query above pages by remembering the last id you saw, so page 500 costs the same as page 1.

**Common trap:** relying on the order rows happen to come back in. It works on your laptop and breaks when the plan changes.`
	},
	{
		id: 'joins',
		title: 'Joins',
		level: 'basic',
		summary: 'Combine tables with INNER and LEFT joins without losing or multiplying rows.',
		scenes: ['my-left-join', 'my-on-vs-where'],
		notes: `A join glues rows from two tables together using a condition.

- **INNER JOIN** keeps only rows that match on both sides.
- **LEFT JOIN** keeps every row from the left table and fills the right side with NULL when nothing matches.
- **No condition** means every row pairs with every row (a Cartesian product): 3 rows times 4 rows is 12.
- **FULL OUTER JOIN** does not exist in MySQL. Combine a LEFT and a RIGHT join with \`UNION\`.
- **Anti-join:** to find rows with no match, LEFT JOIN and then test \`IS NULL\` on the right side.

\`\`\`sql
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;
\`\`\`

That query lists customers who never ordered. For speed, index the column the join looks up (usually the foreign key). Since MySQL 8.0.18 an equality join without a usable index can use a hash join instead of repeated scans.

**Common trap:** filtering the optional side of a LEFT JOIN in \`WHERE\`. A condition such as \`o.status = 'paid'\` removes the NULL rows and turns the LEFT JOIN into an inner join. Put that condition in \`ON\`.`
	},
	{
		id: 'grouping-and-aggregates',
		title: 'Grouping and aggregates',
		level: 'basic',
		summary: 'Summarise rows with COUNT, SUM and GROUP BY, and know what HAVING is for.',
		scenes: ['my-where-vs-having'],
		notes: `Aggregate functions turn many rows into one value: \`COUNT\`, \`SUM\`, \`AVG\`, \`MIN\`, \`MAX\`. \`GROUP BY\` does it once per group.

- **WHERE** filters rows before grouping. **HAVING** filters groups after, so it can use aggregates.
- \`COUNT(*)\` counts rows. \`COUNT(col)\` counts only rows where \`col\` is not NULL.
- On an empty set, \`SUM\` returns NULL but \`COUNT\` returns 0. Use \`COALESCE(SUM(x), 0)\` for zero.
- \`WITH ROLLUP\` adds subtotal and grand-total rows.

\`\`\`sql
SELECT customer_id, COUNT(*) AS paid_orders
FROM orders
WHERE status = 'paid'
GROUP BY customer_id
HAVING COUNT(*) >= 3;
\`\`\`

MySQL 8 has \`ONLY_FULL_GROUP_BY\` on by default. Every selected column must be grouped, aggregated, or functionally dependent on the group. If you truly do not care which value comes back, wrap it in \`ANY_VALUE()\`.

**Common trap:** older tutorials show queries that select ungrouped columns. They used to run on MySQL by silently picking a random row, and now fail with error 1055. That error is protecting you from a hidden bug.`
	},
	{
		id: 'innodb-and-clustered-index',
		title: 'InnoDB and the clustered index',
		level: 'mid',
		summary: 'Understand that in InnoDB the primary key B-tree is the table itself.',
		scenes: ['my-clustered-index'],
		notes: `**InnoDB** is MySQL's default storage engine. It gives you transactions, row-level locking, foreign keys and crash recovery. MyISAM, the old engine, has none of those and locks the whole table on writes.

The most important InnoDB idea: **the primary key is a clustered index.** Rows are not stored in a separate pile. They live inside the primary key B-tree, in key order, in 16 KB pages.

- A lookup by primary key walks one tree and lands on the full row.
- Nearby ids sit on nearby pages, so range scans are fast.
- With no primary key, InnoDB uses the first unique non-null index, or invents a hidden 6-byte row id. Always declare your own.
- A **random key** such as UUIDv4 inserts into the middle of the tree, causing page splits. Ever-increasing keys append at the end.
- The **buffer pool** caches pages in memory. Sizing it is the biggest tuning knob.

\`\`\`sql
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL
) ENGINE=InnoDB;
\`\`\`

**Common trap:** a long or random primary key. It makes the table fragmented, and every secondary index copies the key too.`
	},
	{
		id: 'secondary-indexes',
		title: 'Secondary and composite indexes',
		level: 'mid',
		summary: 'Design indexes that the optimizer can really use, including covering indexes.',
		scenes: ['my-secondary-lookup', 'my-covering-index'],
		notes: `Any index besides the primary key is a **secondary index**. Its entries hold the indexed columns plus the primary key value. To read other columns MySQL then looks the row up in the clustered index, a second hop.

- A **covering index** contains every column the query needs, so the second hop disappears. EXPLAIN shows \`Using index\`.
- A **composite index** on \`(a, b)\` helps queries that filter on \`a\`, or on \`a\` and \`b\`. Put equality columns first and the range column last.
- **Functions on a column** block the index. \`YEAR(created_at) = 2024\` scans; \`created_at >= '2024-01-01' AND created_at < '2025-01-01'\` seeks.
- **Low-cardinality** columns, like a yes/no flag, rarely help on their own.
- Every extra index slows writes and uses memory. Drop indexes nobody uses; test with \`INVISIBLE\` first.

\`\`\`sql
CREATE INDEX idx_status_created ON orders (status, created_at);
ALTER TABLE orders ALTER INDEX idx_old INVISIBLE;
\`\`\`

**Common trap:** adding an index per column and hoping the optimizer combines them. One well-ordered composite index usually beats several single-column ones.`
	},
	{
		id: 'explain-and-optimizer',
		title: 'EXPLAIN and the optimizer',
		level: 'mid',
		summary: 'Read an execution plan and tell a scan from an index lookup.',
		scenes: ['my-explain-scan-vs-ref'],
		notes: `MySQL's optimizer chooses a plan by estimating cost from table statistics. \`EXPLAIN\` shows that plan without running the query.

Columns to read first:

- **type**: how rows are found. From best to worst roughly \`const\`, \`eq_ref\`, \`ref\`, \`range\`, \`index\`, \`ALL\`. \`ALL\` is a full table scan.
- **possible_keys** versus **key**: the indexes MySQL could use, and the one it picked.
- **rows**: an estimate of rows to examine.
- **Extra**: \`Using index\` means covering index. \`Using filesort\` means an extra sort step, not necessarily on disk.

\`\`\`sql
EXPLAIN SELECT * FROM orders WHERE customer_id = 7;
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 7;
\`\`\`

\`EXPLAIN ANALYZE\` (8.0.18 and later) really runs the query and shows measured times. \`ANALYZE TABLE\` refreshes the statistics the optimizer relies on. The slow query log (\`long_query_time\`) tells you which queries to explain.

**Common trap:** assuming the optimizer is wrong when it ignores an index. If a filter matches a large share of the table, scanning really is cheaper.`
	},
	{
		id: 'transactions-and-isolation',
		title: 'Transactions and isolation levels',
		level: 'mid',
		summary: 'Group statements safely and understand what each isolation level lets you see.',
		scenes: ['my-commit-rollback', 'my-repeatable-read'],
		notes: `A **transaction** makes several statements succeed or fail together. By default \`autocommit\` is on, so each statement is its own transaction. Use \`START TRANSACTION\` ... \`COMMIT\` or \`ROLLBACK\` to group them.

InnoDB gives you ACID. The **undo log** stores old values for rollback and old snapshots. The **redo log** makes committed changes survive a crash (with the default \`innodb_flush_log_at_trx_commit = 1\`).

**Isolation levels** decide what a transaction sees from others:

- **REPEATABLE READ** (the default): plain reads use one snapshot taken at the first read.
- **READ COMMITTED**: each statement sees the latest committed data. PostgreSQL's default.
- \`SELECT ... FOR UPDATE\` reads the latest data and locks the rows, the safe way to read, then write.

\`\`\`sql
START TRANSACTION;
SELECT stock FROM products WHERE id = 7 FOR UPDATE;
UPDATE products SET stock = stock - 1 WHERE id = 7;
COMMIT;
\`\`\`

**Common trap:** DDL such as \`ALTER TABLE\` or \`TRUNCATE\` commits the open transaction automatically and cannot be rolled back. MySQL has no transactional DDL.`
	},
	{
		id: 'locking-and-gap-locks',
		title: 'Locking, gap locks and deadlocks',
		level: 'advanced',
		summary: 'See which locks InnoDB takes and why transactions block or deadlock.',
		scenes: ['my-gap-lock', 'my-deadlock'],
		notes: `InnoDB locks **index records**, not abstract rows. That has surprising consequences.

- A write or locking read with **no usable index** scans the table and locks every record it passes, which can block almost everyone.
- Under REPEATABLE READ, InnoDB also takes **gap locks**: locks on the empty space between index entries. A **next-key lock** is a record lock plus the gap before it. They stop phantom rows, and they block inserts into that range.
- **READ COMMITTED** mostly turns gap locking off, so it blocks less but allows phantoms.
- **Deadlocks** are cycles of waiting. InnoDB detects them instantly and rolls one transaction back with error 1213. Retry the whole transaction, and touch rows in a consistent order.
- A plain wait times out after \`innodb_lock_wait_timeout\` (50 seconds), error 1205.
- \`FOR UPDATE SKIP LOCKED\` (8.0) lets workers take different rows from a queue table.

\`\`\`sql
SELECT id FROM jobs WHERE status = 'pending'
ORDER BY id LIMIT 1
FOR UPDATE SKIP LOCKED;
\`\`\`

**Common trap:** a forgotten open transaction. It holds metadata locks, so a later \`ALTER TABLE\` waits behind it and then everything else queues behind the ALTER.`
	},
	{
		id: 'replication-and-binlog',
		title: 'Replication and the binary log',
		level: 'advanced',
		summary: 'Follow a change from the primary to a replica and deal with lag.',
		scenes: ['my-replication-flow', 'my-replica-lag'],
		notes: `The **binary log** (binlog) records every committed change in order. It powers replication and point-in-time recovery (restore a backup, then replay the binlog up to a chosen moment).

In classic replication a replica runs two threads: a **receiver (I/O) thread** copies binlog events into a local **relay log**, and an **applier (SQL) thread** executes them.

- **Asynchronous by default:** the primary does not wait, so replicas lag and a crash can lose the latest commits.
- **Semi-synchronous** replication makes the primary wait until at least one replica has received the event. It narrows the window for losing commits but is not fully synchronous: it waits for receipt, not apply, and falls back to asynchronous if no replica answers within the timeout.
- \`binlog_format\` defaults to **ROW**, which logs the actual row changes and is safest.
- **GTIDs** give each transaction a global id, which makes failover and catch-up easier.
- Replicas scale **reads**, not writes.

\`\`\`sql
SHOW REPLICA STATUS\\G
-- check Seconds_Behind_Source
\`\`\`

**Common trap:** reading from a replica right after writing. The replica may not have the change yet, so the user sees stale data. Read your own writes from the primary, or wait for the replica to catch up.`
	},
	{
		id: 'charset-and-collation',
		title: 'Character sets and collations',
		level: 'mid',
		summary: 'Store any text correctly and know how comparison and sorting behave.',
		scenes: ['my-utf8-vs-utf8mb4'],
		notes: `A **character set** says how text is stored as bytes. A **collation** says how it is compared and sorted.

- **Use \`utf8mb4\`.** MySQL's \`utf8\` is a legacy alias (utf8mb3) limited to 3 bytes per character, so emoji and some rare characters fail. MySQL 8.0 defaults to utf8mb4.
- The default collation is \`utf8mb4_0900_ai_ci\`: **ai** is accent-insensitive and **ci** is case-insensitive. So \`'asha' = 'Asha'\` and \`'cafe' = 'café'\` are true.
- For exact comparison use a \`_bin\` or \`_cs\` collation.
- Comparing two columns with different collations can raise *Illegal mix of collations*. Fix it with an explicit \`COLLATE\`.
- \`VARCHAR(n)\` counts **characters**, not bytes. In utf8mb4 that can be up to \`4n\` bytes, which affects index size limits.

\`\`\`sql
CREATE TABLE tags (
  name VARCHAR(50) CHARACTER SET utf8mb4
       COLLATE utf8mb4_0900_ai_ci
);
\`\`\`

**Common trap:** a connection using a different character set than the column. Text then arrives garbled, so set the connection charset to utf8mb4 as well.`
	},
	{
		id: 'sql-mode-and-gotchas',
		title: 'SQL mode and common gotchas',
		level: 'mid',
		summary: 'Learn the defaults and quirks that surprise people coming from other databases.',
		scenes: ['my-string-to-number'],
		notes: `\`sql_mode\` controls how strict MySQL is. The 8.0 default includes **strict mode**, so out-of-range or invalid data raises an error instead of being silently clipped, and \`ONLY_FULL_GROUP_BY\`.

Quirks worth knowing:

- **Type conversion:** comparing a string with a number converts the string. \`'abc' = 0\` is true. Compare like with like.
- **Division:** \`5 / 2\` gives \`2.5000\`; \`5 DIV 2\` gives \`2\`.
- **TRUNCATE vs DELETE:** TRUNCATE is DDL. It resets AUTO_INCREMENT, commits implicitly, takes no WHERE and cannot be rolled back.
- **Upsert:** \`INSERT ... ON DUPLICATE KEY UPDATE\`. \`REPLACE INTO\` is delete then insert, which can fire cascades and change ids.
- **Query cache:** removed in 8.0. Cache in the application.
- **Table names** are case-sensitive on Linux by default (\`lower_case_table_names = 0\`) but not on macOS.

\`\`\`sql
INSERT INTO stock (sku, qty) VALUES ('A1', 5)
ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty);
\`\`\`

**Common trap:** testing on a laptop with a different \`sql_mode\` or table-name case rule than production, then being surprised by errors after deploy.`
	}
];

export const mysql: DbEngine = {
	id: 'mysql',
	name: 'MySQL',
	tagline: 'The other relational giant: InnoDB, replication and its quirks.',
	topics,
	questions: mysqlQuestions,
	quizTopics: topics.map((t) => ({ id: t.id, label: t.title.replace(/^Selecting and filtering rows$/, 'Select and filter').replace(/^Character sets and collations$/, 'Charsets').replace(/^Secondary and composite indexes$/, 'Indexes').replace(/^Transactions and isolation levels$/, 'Transactions').replace(/^Locking, gap locks and deadlocks$/, 'Locking').replace(/^Replication and the binary log$/, 'Replication').replace(/^SQL mode and common gotchas$/, 'Gotchas').replace(/^InnoDB and the clustered index$/, 'InnoDB').replace(/^Grouping and aggregates$/, 'Grouping').replace(/^Data types and tables$/, 'Data types').replace(/^EXPLAIN and the optimizer$/, 'EXPLAIN') })),
	quizBlurb: 'MySQL 8 and InnoDB: queries, indexes, transactions, locking and replication'
};
