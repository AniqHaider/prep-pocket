import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

// PostgreSQL quiz bank (16/17 behaviour). One builder per topic; ids are re-assigned positionally at the bottom.
const t = (topic: string) => builder('PG', topic);

// ───────────────────────── tables-and-types ─────────────────────────
const ty = t('tables-and-types');

ty.add('basic', 'types',
	"Which column type is the right choice for storing prices that must add up exactly, such as 19.99 and 0.01?",
	"numeric(12,2), or an integer count of cents",
	["double precision, because it stores decimals exactly for up to 15 significant digits",
	 "real, because four bytes are plenty for amounts that never exceed a few thousand",
	 "text, cast to a number every time you add two amounts together"],
	"numeric stores decimal digits exactly, and an integer of cents is exact too. double precision and real are binary floating point: values such as 0.1 have no exact binary form, so sums drift (0.1 + 0.2 is not exactly 0.3). text would be exact but cannot be summed or constrained without casting every time.");

ty.add('basic', 'timestamps',
	"What does a timestamptz column actually store?",
	"A single instant in time (internally UTC), shown in the session's time zone",
	["The local time you inserted together with the name of its original time zone",
	 "A local wall-clock time with no zone, exactly like plain timestamp",
	 "A count of milliseconds since 1970, rendered as text on every read"],
	"timestamptz converts the input to UTC on the way in and converts to the session TimeZone on the way out. It does not remember which zone you typed, which is why it works well for \"when did this happen\" data. Plain timestamp is the wall-clock type with no zone, and nothing is stored as text epoch milliseconds.");

ty.add('mid', 'sequences',
	"Why can an id column filled by a sequence (serial or identity) end up with gaps such as 1, 2, 4, 5?",
	"Sequence values are never handed back, so a rolled-back or failed insert still consumes a number",
	["Postgres deliberately skips numbers to keep ids hard to guess from outside",
	 "VACUUM renumbers rows after deletes and leaves holes where dead rows used to be",
	 "Identity columns reserve a block of ten numbers per session and discard whatever that session did not use"],
	"nextval is non-transactional: once a number is issued it is gone, even if the surrounding transaction rolls back or the insert hits a constraint error. Gaps are normal, so never rely on ids being contiguous. VACUUM never renumbers anything, and there is no hidden block reservation or guessability feature.");

ty.add('basic', 'text',
	"In PostgreSQL, how does text compare with varchar(255) for storage and speed?",
	"Practically identical: both are stored the same way, and varchar(n) just adds a length check",
	["text is noticeably slower because it has no declared maximum length for the storage engine to optimise for",
	 "varchar(255) is stored padded to 255 bytes, so it wastes space compared with text",
	 "text columns cannot be indexed, while varchar columns can use a B-tree"],
	"Postgres uses the same variable-length storage (varlena) for text and varchar, so there is no speed or space benefit to picking a smaller varchar. The length limit is only a constraint. Padding applies to char(n), not varchar, and text indexes perfectly well.");

ty.add('mid', 'alter-table',
	"Since PostgreSQL 11, what happens when you ADD COLUMN with a constant DEFAULT to a table with 100 million rows?",
	"It is a quick metadata-only change: existing rows are not rewritten",
	["Every row is rewritten, so the command holds its lock for as long as the table is big",
	 "It is refused unless the table is empty, because existing rows would have no value",
	 "Only rows already cached in shared buffers are updated, the rest are filled in lazily by VACUUM"],
	"From version 11 a non-volatile default is stored once in the catalog and applied when old rows are read, so the ALTER finishes almost instantly. Older versions did rewrite the whole table. There is no empty-table restriction, and VACUUM is not responsible for backfilling defaults. A volatile default such as random() still forces a rewrite.");

ty.add('advanced', 'sequences',
	"An integer (int4) identity column has just issued 2147483647. What happens on the next insert?",
	"The insert fails with an error because the sequence reached its maximum; ids do not wrap",
	["The sequence wraps around to a large negative number and inserts keep succeeding",
	 "Postgres silently converts the column to bigint in the background and carries on from 2147483648",
	 "The sequence restarts at 1 and only fails when it collides with an existing id"],
	"Sequences created without CYCLE stop at their maximum and raise \"reached maximum value\", and an int4 column cannot hold anything larger anyway. Nothing converts the type automatically, and nothing wraps. The fix is a migration to bigint, so new tables should use bigint identity from the start.");

// ───────────────────────── select-and-filter ─────────────────────────
const sf = t('select-and-filter');

sf.add('basic', 'null',
	"What does this query return?",
	"No rows, because comparing anything to NULL with = gives unknown, not true",
	["Every row where city is empty or unset, since = NULL is shorthand for IS NULL",
	 "A syntax error, because NULL may only be tested with IS NULL",
	 "All rows, because NULL = NULL is treated as true when both sides are missing"],
	"In SQL a comparison with NULL yields NULL (unknown), and WHERE keeps only rows where the condition is true. So `= NULL` never matches, even for rows whose city is NULL. It is valid syntax, which is why the bug is easy to miss. Use IS NULL, or IS NOT DISTINCT FROM when you need NULL-safe equality.",
	`SELECT * FROM customers WHERE city = NULL;`);

sf.add('basic', 'limit',
	"A query uses LIMIT 3 without an ORDER BY. Which three rows do you get?",
	"Any three rows: without ORDER BY the order is unspecified and can change between runs",
	["The three rows with the lowest primary key, because tables are stored in key order, so the result is always the same",
	 "The three most recently inserted rows, since Postgres appends new rows at the end",
	 "The first three rows on disk, which is a stable order you can depend on"],
	"A heap table has no guaranteed order. Updates, VACUUM, parallel scans and synchronised scans can all change which rows come first. Results often look ordered in small tests, which hides the bug. If the rows matter, add ORDER BY, with a unique tie-breaker such as id.");

sf.add('basic', 'like',
	"On a plain text column, does WHERE name LIKE 'a%' match the value 'Asha'?",
	"No: LIKE is case-sensitive, and ILIKE is the case-insensitive version",
	["Yes, because Postgres compares text case-insensitively by default",
	 "Yes, but only if the column was created with the citext extension enabled",
	 "No, because the percent sign only works at the start of a pattern"],
	"With the default collations LIKE respects case, so 'a%' does not match 'Asha' while ILIKE 'a%' does. The percent sign works anywhere in the pattern. citext is an optional extension (a citext column would match, but this question is about a plain text column), and the default behaviour is not case-insensitive. Note that a leading wildcard (like '%sha') cannot use a normal B-tree index.");

sf.add('mid', 'null',
	"A subquery returns customer_ids and contains at least one NULL. What does id NOT IN (subquery) return?",
	"No rows at all, because NOT IN against a list that contains NULL is never true",
	["All customers who are not in the list, ignoring the NULL value",
	 "All customers, since NULL is treated as just another value that no customer id can ever match",
	 "An error telling you the subquery contains NULL"],
	"x NOT IN (1, NULL) expands to x <> 1 AND x <> NULL. The second part is unknown, so the whole condition is never true and the query silently returns nothing. This is the classic reason to prefer NOT EXISTS, which handles NULLs the way people expect.",
	`SELECT name FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders);`);

sf.add('mid', 'evaluation-order',
	"Why does this query fail with \"column total does not exist\"?",
	"WHERE runs before SELECT, so the alias total has not been created yet",
	["Aliases only work with the AS keyword spelled in capital letters",
	 "Postgres forbids arithmetic inside an alias, so total must be computed in a view",
	 "The alias exists, but WHERE can only reference columns of indexed tables"],
	"Logically a query is evaluated as FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT. Aliases are created in SELECT, so WHERE cannot see them, while ORDER BY can. Repeat the expression, or wrap the query in a subquery or CTE and filter outside.",
	`SELECT price_cents * 2 AS total
FROM products
WHERE total > 1000;`);

sf.add('mid', 'distinct-on',
	"What does this query return?",
	"One row per customer: their most recent order",
	["Every order, sorted by customer and then by newest first",
	 "One row per customer: their oldest order, because DISTINCT keeps the first insert",
	 "Only the single newest order in the whole table"],
	"DISTINCT ON keeps the first row of each customer_id group according to the ORDER BY, and the ORDER BY here puts the newest placed_at first inside each group. The leading ORDER BY column must match the DISTINCT ON expression. The query returns one row per customer, not one per table.",
	`SELECT DISTINCT ON (customer_id) customer_id, id, placed_at
FROM orders
ORDER BY customer_id, placed_at DESC;`);

sf.add('advanced', 'pagination',
	"Why does OFFSET 200000 LIMIT 20 get slower the deeper the page, and what avoids it?",
	"Skipped rows are still produced and thrown away; keyset pagination (WHERE (placed_at, id) < last seen) avoids that",
	["OFFSET forces a full table lock; a bigger work_mem setting makes deep pages as fast as the first",
	 "Postgres re-sorts the whole table on every page request; adding DISTINCT to the query caches that sort between later pages",
	 "Deep pages are slow only without a primary key; adding one makes OFFSET constant-time"],
	"The server must generate the first 200,000 rows in order and discard them before returning 20, so cost grows with the offset. Keyset pagination remembers the last row's sort key and filters with a row comparison, so an index on those columns jumps straight to the next page. There is no table lock, and a primary key does not make OFFSET free.");

// ───────────────────────── joins ─────────────────────────
const jn = t('joins');

jn.add('basic', 'left-join',
	"customers LEFT JOIN orders is run. What does a customer with no orders produce?",
	"One row, with NULL in every orders column",
	["No row, because there is nothing to match against",
	 "One row for each order in the table, since no condition matched",
	 "An error, because a LEFT JOIN needs at least one match per row"],
	"A LEFT JOIN keeps every row from the left table. When the ON condition finds no partner, the right-side columns are filled with NULL. An INNER JOIN would drop the customer. Unmatched rows never multiply into every order; that behaviour belongs to a CROSS JOIN.");

jn.add('mid', 'left-join',
	"What does this query do to customers who have no orders?",
	"They disappear, because o.status is NULL for them and NULL = 'paid' is not true",
	["They stay with NULL in the order columns, exactly like a LEFT JOIN that has no WHERE clause at all",
	 "They are kept only if their city column is also NULL",
	 "They cause an error, since WHERE cannot reference the right-hand table"],
	"WHERE runs after the join. The unmatched rows have NULL in every o column, the filter on o.status throws them out, and the LEFT JOIN behaves like an INNER JOIN. To keep the customers, move the condition into the ON clause: ON o.customer_id = c.id AND o.status = 'paid'.",
	`SELECT c.name, o.id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'paid';`);

jn.add('basic', 'cross-join',
	"customers has 8 rows and products has 10. How many rows does customers CROSS JOIN products return?",
	"80, because every customer is paired with every product",
	["18, the rows of both tables stacked together",
	 "10, one row per product with the matching customers aggregated",
	 "8, because the smaller table decides the size of the result"],
	"A cross join is the Cartesian product: 8 x 10 = 80 pairs. Stacking rows is what UNION does. A join without a restricting condition is a frequent accident, and the sudden jump in row counts is the giveaway.");

jn.add('mid', 'fan-out',
	"orders is joined to order_items (several items per order) and then grouped by customer with COUNT(*). What does the count measure?",
	"Item rows, not orders, because each order row repeats once per item",
	["Orders per customer, since the join does not change how many orders exist",
	 "Customers, because GROUP BY collapses everything to one row each",
	 "Distinct products, because order_items links orders to products"],
	"A one-to-many join repeats the parent row for every child, so counting rows after the join counts children. Use COUNT(DISTINCT o.id) for orders, or aggregate the items in a subquery first. The same trap silently inflates SUM() of order-level columns.",
	`SELECT o.customer_id, COUNT(*)
FROM orders o
JOIN order_items i ON i.order_id = o.id
GROUP BY o.customer_id;`);

jn.add('mid', 'anti-join',
	"Which query reliably lists customers who have never placed an order?",
	"SELECT name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)",
	["SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL",
	 "SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id GROUP BY c.name HAVING COUNT(*) = 0",
	 "SELECT name FROM customers WHERE id <> ALL (SELECT NULL::int)"],
	"NOT EXISTS (or a LEFT JOIN filtered with o.id IS NULL) is the anti-join pattern. The inner-join variants can never return a customer without orders, because unmatched rows are discarded before WHERE or HAVING sees them. The ALL-with-NULL version is never true. The plain NOT IN form is risky when the subquery column can be NULL.");

jn.add('advanced', 'join-algorithms',
	"When does the planner typically choose a hash join?",
	"For an equality join on large, unsorted inputs: it hashes the smaller side and probes it with the other",
	["Only when the join uses < or > comparisons, which hashing handles well",
	 "Only when both inputs are already sorted on the join key, so that nothing has to be built before joining them",
	 "Whenever one side has fewer than 100 rows, because small tables always get hashed"],
	"Hash joins need an equality condition and shine when neither input is sorted and both are sizeable. Merge joins want sorted inputs, and nested loops win when the outer side is small and the inner side has a good index. The planner compares estimated costs rather than applying a row-count rule.");

jn.add('advanced', 'lateral',
	"What does LATERAL allow in a FROM clause?",
	"A subquery that references columns of earlier FROM items and runs once per outer row",
	["A join that runs asynchronously on a second connection while the first query keeps going meanwhile",
	 "A subquery whose result is cached and shared by every row of the outer query",
	 "A join type that returns unmatched rows from both sides"],
	"LATERAL turns a subquery into something like a for-each loop: for every row of the preceding tables it can use that row's values. Typical uses are top-N per group (the three newest orders for each customer) and set-returning functions. It has nothing to do with async execution, caching or full outer joins.");

// ───────────────────────── grouping-and-aggregates ─────────────────────────
const ga = t('grouping-and-aggregates');

ga.add('basic', 'count',
	"What is the difference between COUNT(*) and COUNT(city)?",
	"COUNT(*) counts rows; COUNT(city) counts only rows where city is not NULL",
	["They are identical: both count every row in the group, whether or not any column is NULL",
	 "COUNT(*) skips NULLs in any column, while COUNT(city) counts them",
	 "COUNT(city) counts distinct cities, while COUNT(*) counts all of them"],
	"Aggregates other than COUNT(*) ignore NULL inputs, so COUNT(city) is the number of rows with a known city. COUNT(*) never looks at column values. COUNT(DISTINCT city) is the one that removes duplicates.",
	`SELECT COUNT(*) AS all_rows, COUNT(city) AS with_city
FROM customers;`);

ga.add('basic', 'having',
	"What is the difference between WHERE and HAVING?",
	"WHERE filters rows before grouping; HAVING filters whole groups after aggregates are computed",
	["WHERE is for text columns and HAVING is for numeric columns",
	 "WHERE runs after GROUP BY and HAVING runs before it, which is why HAVING is the faster one to use",
	 "They are interchangeable; HAVING is just the older spelling"],
	"WHERE decides which rows enter the groups, so it cannot use aggregates like COUNT(*). HAVING sees one row per group and can. Filtering with WHERE where possible is cheaper because fewer rows reach the aggregation.");

ga.add('basic', 'group-by',
	"What happens when this query runs?",
	"Error: status must appear in the GROUP BY clause or be used in an aggregate function",
	["It returns an arbitrary status for each customer, the way some other databases quietly do",
	 "It returns the most frequent status per customer",
	 "It groups by both columns automatically and counts per pair"],
	"Each group has many different statuses, so a bare status column is ambiguous and Postgres rejects it. You must group by it, aggregate it (MAX, string_agg, array_agg) or remove it. Postgres never guesses a value, and it never widens the GROUP BY for you.",
	`SELECT customer_id, status, COUNT(*)
FROM orders
GROUP BY customer_id;`);

ga.add('basic', 'null-handling',
	"AVG(x) runs over the values 10, NULL and 20. What does it return?",
	"15, because the NULL is ignored and only two values are averaged",
	["10, because the NULL is treated as zero and the average is (10 + 0 + 20) / 3",
	 "NULL, because any NULL input makes the whole aggregate NULL",
	 "30, the sum of the non-NULL values"],
	"Aggregates skip NULLs, so AVG divides 30 by 2. If you want NULL counted as zero, write AVG(COALESCE(x, 0)). The result is only NULL when there are no non-NULL inputs at all.");

ga.add('basic', 'null-handling',
	"SUM(price_cents) runs over a group with no rows (for example a WHERE that matches nothing). What does it return?",
	"NULL, while COUNT(*) over the same empty input returns 0",
	["0, because SUM of nothing is zero in every SQL aggregate function",
	 "An error saying the aggregate has no input",
	 "NULL for SUM and also NULL for COUNT(*)"],
	"SUM, AVG, MIN and MAX return NULL over an empty set, but COUNT returns 0. Wrap it as COALESCE(SUM(...), 0) when an API or chart expects a number. Note that with GROUP BY an empty input produces no groups at all, so no row appears.");

ga.add('mid', 'filter',
	"What does COUNT(*) FILTER (WHERE status = 'paid') compute?",
	"The number of rows in each group whose status is paid, alongside other aggregates in the same pass",
	["The number of groups whose status is paid",
	 "The total count of the group, but only when every single row in that group has the status paid, otherwise NULL",
	 "A syntax shortcut that removes non-paid rows from the whole query"],
	"FILTER narrows the rows fed to one aggregate while the others still see the full group. That lets you compute counts for several statuses in a single scan: COUNT(*), COUNT(*) FILTER (...) and so on. It does not change the grouping or the query's WHERE.");

ga.add('advanced', 'rollup',
	"What does GROUP BY ROLLUP (customer_id, status) produce?",
	"Counts per (customer_id, status), then per customer_id, then one grand total",
	["Counts for every possible combination of the two columns, including status alone",
	 "Counts per customer_id only, with status collapsed into an array",
	 "The same rows as plain GROUP BY, with the result sorted"],
	"ROLLUP adds hierarchical subtotals: the full grouping, then drops the last column, then the next, finishing with a total row where the dropped columns show NULL. CUBE would also add the status-only combinations. Use GROUPING() to tell real NULLs from subtotal NULLs.");

// ───────────────────────── indexes ─────────────────────────
const ix = t('indexes');

ix.add('basic', 'btree',
	"What kind of index does CREATE INDEX build when you do not name a method?",
	"A B-tree, which supports equality, ranges and ordering",
	["A hash index, because equality lookups are the most common query",
	 "A GIN index, which is the general-purpose default in recent versions",
	 "A clustered index that physically reorders the table"],
	"B-tree is the default and the workhorse: it handles =, <, >, BETWEEN, ORDER BY and prefix matches. Hash, GIN, GiST and BRIN must be requested with USING. Postgres has no clustered index: CLUSTER reorders the table once, and later writes do not keep that order.");

ix.add('mid', 'foreign-keys',
	"Why do people add an index on orders.customer_id even though it has a foreign key?",
	"Postgres does not index the referencing column of a foreign key, so joins and parent deletes would scan the table",
	["Foreign keys create the index automatically, so it is only needed for older versions",
	 "The foreign key index is created automatically but stays invalid until the next VACUUM ANALYZE run completes on that table",
	 "An index is required for the constraint to be enforced at all"],
	"A PRIMARY KEY or UNIQUE constraint builds an index automatically, but a FOREIGN KEY only adds the check. Without your own index, looking up a customer's orders or checking children when deleting a customer needs a sequential scan of orders. The constraint is enforced either way.");

ix.add('mid', 'composite',
	"There is an index on (customer_id, placed_at). Which filter can use it most effectively?",
	"WHERE customer_id = 7 AND placed_at > '2025-01-01'",
	["WHERE placed_at = '2025-01-01' on its own, which is just as fast as filtering by customer",
	 "WHERE placed_at > '2025-01-01' AND customer_id > 0, since both columns are present",
	 "None of them, because composite indexes only work for ORDER BY"],
	"A B-tree index is sorted by the first column, then by the second inside each first-column value. An equality on the leading column plus a range on the next reads one tight slice. A filter on the second column alone cannot jump anywhere, so it is far less efficient. Put equality columns first and the range column last.");

ix.add('mid', 'expression',
	"An index exists on users(email), but WHERE lower(email) = 'a@b.com' still scans the table. What fixes it?",
	"An expression index: CREATE INDEX ON users (lower(email))",
	["Rewrite the query with ILIKE so the existing index is used",
	 "Run VACUUM FULL, which rebuilds the index with lowercase keys",
	 "Add more RAM, since the planner skips indexes for text columns"],
	"An index on email stores raw values, so a query on lower(email) cannot use it. Indexing the expression stores the lowercase form that the query asks for. ILIKE patterns do not use a plain B-tree either, and VACUUM FULL does not change what an index stores.");

ix.add('mid', 'partial',
	"What is a partial index such as CREATE INDEX ON orders (placed_at) WHERE status = 'pending' good for?",
	"A small index covering only matching rows, useful when queries always filter on that condition",
	["It indexes only part of each value, such as the first few characters",
	 "It lets the index be built faster by skipping every row that is already in sorted order on the disk pages",
	 "It is automatically used by every query on the table"],
	"A partial index stores entries only for rows that satisfy its WHERE, so it is small and cheap to maintain. The planner uses it only when the query's condition implies the index condition. It is not a prefix index, and queries that do not include status = 'pending' cannot use it.");

ix.add('mid', 'covering',
	"What does INCLUDE do in CREATE INDEX ON orders (customer_id) INCLUDE (status)?",
	"Stores status in the index entries without sorting by it, so some queries can be answered from the index alone",
	["Adds status as a second sort key, so ORDER BY status is free",
	 "Makes the index unique across customer_id and status together",
	 "Copies status into a separate cache table that Postgres refreshes in the background after every committed update"],
	"INCLUDE columns are payload: they ride along in the leaf entries but are not part of the search key. A query that needs only customer_id and status can use an index-only scan, provided the visibility map shows the pages as all-visible. For sorting by both columns you would put both in the key.");

ix.add('advanced', 'selectivity',
	"A boolean column is true for 95% of rows and has an index. Why does SELECT * WHERE flag = true usually ignore it?",
	"Fetching almost the whole table through an index is slower than one sequential scan, so the planner picks the scan",
	["Boolean columns cannot be indexed with a B-tree",
	 "Indexes are only used for text and numeric comparisons, never for true and false",
	 "The planner always prefers a sequential scan until the table grows past roughly a million rows, then switches to the index"],
	"Index scans jump around the table for each match, which is costly when most rows match. With low selectivity, reading everything in order is cheaper. The same index can still help for flag = false, and a partial index on the rare value is a common fix. Booleans index perfectly well.");

ix.add('advanced', 'concurrently',
	"What does CREATE INDEX CONCURRENTLY trade away to avoid blocking writes?",
	"It takes longer (two table scans), cannot run inside a transaction block, and can leave an invalid index if it fails",
	["It builds a hash index instead, which is faster but cannot be used for ranges",
	 "It skips rows inserted while the build is running, so you must reindex those rows manually afterwards to catch up, which is slow",
	 "It holds an exclusive lock for a shorter time but still blocks all reads"],
	"A normal CREATE INDEX blocks inserts, updates and deletes for the duration. The concurrent form does extra passes so writers keep working, at the cost of time and some rules: no BEGIN block, and a failure leaves an INVALID index to drop. It still builds a B-tree by default, and nothing inserted meanwhile is lost.");

// ───────────────────────── explain-and-planner ─────────────────────────
const ep = t('explain-and-planner');

ep.add('basic', 'explain',
	"What is the difference between EXPLAIN and EXPLAIN ANALYZE?",
	"EXPLAIN shows the plan only; EXPLAIN ANALYZE actually runs the query and adds real timings and row counts",
	["EXPLAIN runs the query and shows its output; EXPLAIN ANALYZE only plans it and merely adds extra statistics on top",
	 "EXPLAIN ANALYZE refreshes table statistics permanently and then explains the plan",
	 "They are identical; ANALYZE is an optional keyword that changes nothing"],
	"Plain EXPLAIN uses the planner's estimates without executing. ANALYZE executes the statement, so an UPDATE or DELETE really changes data: wrap those in BEGIN ... ROLLBACK. It does not refresh table statistics (the separate ANALYZE command does that).");

ep.add('mid', 'costs',
	"In the plan line cost=0.00..35.50 rows=2550 width=4, what unit is the cost measured in?",
	"Arbitrary planner units, based mainly on page reads and CPU work; it is not milliseconds",
	["Milliseconds of wall-clock time that this server is expected to spend running that node of the plan",
	 "Bytes read from disk",
	 "Microseconds of CPU time per row"],
	"Costs are relative numbers that let the planner compare plans: sequential page fetches cost 1.0, random ones 4.0, and CPU work is a small fraction. Only comparisons between plans matter. Real time appears separately in EXPLAIN ANALYZE as actual time in milliseconds.");

ep.add('mid', 'statistics',
	"In EXPLAIN ANALYZE a node shows rows=10 estimated but actual rows=500000. What is the most likely cause?",
	"The planner's statistics are stale or too coarse for that column; running ANALYZE is the first thing to try",
	["The query is using too many indexes at once, so the planner loses track of how many rows each one returns from the table",
	 "Postgres rounds row estimates down to the nearest power of ten",
	 "The index is corrupted and must be rebuilt with REINDEX"],
	"Plans are only as good as the estimates. A big gap usually means outdated statistics (after a bulk load, say), or correlated columns the planner treats as independent. ANALYZE refreshes statistics; extended statistics or a higher statistics target help for stubborn cases. Estimates are not rounded, and corruption would raise errors rather than bad estimates.");

ep.add('mid', 'seq-scan',
	"Why might the planner choose a Seq Scan even though an index exists on the filtered column?",
	"The query returns a large share of the table, or the table is tiny, so a sequential read is cheaper",
	["The index must be invalid, because the planner never skips a valid index that matches the filtered column",
	 "Sequential scans are always chosen for text columns",
	 "The planner picks randomly between plans of similar cost on each run"],
	"Index scans pay random I/O per match, so they only win when few rows match. For small tables or low selectivity the sequential scan is faster, and that is a correct decision rather than a bug. Plans are chosen by cost, not randomly.");

ep.add('advanced', 'buffers',
	"In EXPLAIN (ANALYZE, BUFFERS), what is the difference between shared hit and shared read?",
	"Hit means the page was found in Postgres' shared buffers; read means it had to be fetched from outside them (OS cache or disk)",
	["Hit counts the rows that matched the filter conditions; read counts the rows that were scanned but then thrown away again by a later node",
	 "Hit is a page that was changed by the query; read is a page that was only inspected",
	 "Hit is a page served from the index; read is a page from the table"],
	"BUFFERS reports page-level I/O. Many reads relative to hits means the working set is not cached in shared buffers, although a read may still be served by the operating system's file cache rather than the physical disk. It is about pages, not rows or index versus table.");

ep.add('advanced', 'analyze-output',
	"A nested loop's inner node shows actual time=0.020..0.025 rows=1 loops=50000. What is the real time spent in that node?",
	"About 1 to 1.25 seconds: the displayed time and rows are per loop and must be multiplied by loops",
	["About 0.025 milliseconds, the number shown",
	 "Zero, because the node is repeated 50000 times and Postgres caches the result of the very first execution",
	 "About 0.025 seconds in total, because the time covers all loops"],
	"EXPLAIN ANALYZE reports averages per execution of a node. With loops=50000 the total is roughly 0.020 to 0.025 ms times 50,000, which is 1 to 1.25 seconds. This is how a tiny-looking inner index probe becomes the dominant cost. The result is not cached between loops.");

// ───────────────────────── transactions-acid ─────────────────────────
const tx = t('transactions-acid');

tx.add('basic', 'atomicity',
	"A transfer runs UPDATE accounts SET bal = bal - 30 WHERE id = 1, then fails on the second UPDATE. Both statements were inside one BEGIN. What is the final state?",
	"Neither change persists once the transaction is rolled back",
	["The first update stays, because it already succeeded",
	 "Both changes persist, because Postgres only checks constraints at COMMIT",
	 "The first update stays until the next VACUUM undoes it"],
	"Atomicity means all statements of a transaction take effect together or not at all. After the error you roll back and the balance of account 1 is untouched. Without a surrounding transaction each statement would commit on its own, and the money would be lost.");

tx.add('basic', 'autocommit',
	"You run a single UPDATE in psql without writing BEGIN. How is it executed?",
	"As its own transaction that commits automatically when the statement succeeds",
	["Outside any transaction at all, so it can never be rolled back or seen by other sessions",
	 "Inside an implicit transaction that stays open until you type COMMIT",
	 "It waits in a buffer and is applied at the next checkpoint"],
	"Every statement runs in a transaction. Without BEGIN, Postgres wraps it in one and commits immediately (autocommit). Nothing waits for a manual commit, and checkpoints are about flushing data files, not about when changes become visible.");

tx.add('basic', 'errors',
	"Inside a transaction a statement raises an error. What happens to the next statement you send?",
	"It is rejected with \"current transaction is aborted\" until you ROLLBACK (or roll back to a savepoint)",
	["It runs normally, since only the failing statement was undone",
	 "It runs normally, but its changes are silently discarded at COMMIT without any warning being shown to you",
	 "The connection is closed by the server immediately"],
	"After an error the transaction is in an aborted state: Postgres ignores every command until the block ends with ROLLBACK, or until you ROLLBACK TO a savepoint taken earlier. COMMIT on an aborted transaction actually performs a rollback. The connection stays open.");

tx.add('mid', 'savepoints',
	"What is a SAVEPOINT for?",
	"Letting you roll back part of a transaction while keeping earlier work",
	["Committing part of a transaction so other sessions can see it",
	 "Speeding up long transactions by writing checkpoints to disk",
	 "Locking all of the rows touched so far against concurrent changes from other sessions"],
	"SAVEPOINT marks a point inside a transaction, and ROLLBACK TO undoes everything after it while the transaction continues. Nothing is visible to others until the outer COMMIT. It is not a durability checkpoint and adds no locks. ORMs use it to survive a failed insert and carry on.");

tx.add('mid', 'durability',
	"With default settings, what has happened by the time COMMIT returns?",
	"The commit record has been flushed to the write-ahead log on disk",
	["The changed table pages have been written to their data files",
	 "The changes have been copied to every replica",
	 "Only the shared buffers were updated; the disk write happens later"],
	"Durability comes from the WAL: the commit record is fsynced before COMMIT returns, and data files are written lazily at checkpoints and recovered from the log after a crash. Replicas are only waited for with synchronous replication. Setting synchronous_commit = off trades that guarantee for speed.");

tx.add('advanced', 'ddl',
	"In PostgreSQL, what happens to this migration if it runs inside a transaction that is rolled back?",
	"The table disappears again, because DDL statements are transactional",
	["The table stays, because CREATE and ALTER always commit implicitly the way they do elsewhere",
	 "The table stays, but the new column is removed",
	 "Postgres refuses to run DDL inside a transaction"],
	"Most DDL in PostgreSQL is fully transactional, so you can wrap a migration in BEGIN ... ROLLBACK and test it safely, or apply several schema changes atomically. Some commands are exceptions, such as CREATE INDEX CONCURRENTLY, which cannot run in a transaction block.",
	`BEGIN;
CREATE TABLE audit_log (id bigint, note text);
ALTER TABLE audit_log ADD COLUMN created_at timestamptz;
ROLLBACK;`);

// ───────────────────────── isolation-and-mvcc ─────────────────────────
const im = t('isolation-and-mvcc');

im.add('basic', 'isolation-levels',
	"What is PostgreSQL's default transaction isolation level?",
	"READ COMMITTED",
	["REPEATABLE READ",
	 "SERIALIZABLE",
	 "READ UNCOMMITTED"],
	"The default is READ COMMITTED: each statement sees all data committed before that statement began. REPEATABLE READ and SERIALIZABLE must be requested per transaction or via default_transaction_isolation. READ UNCOMMITTED is accepted but behaves exactly like READ COMMITTED.");

im.add('mid', 'read-committed',
	"In READ COMMITTED, the same SELECT runs twice in one transaction and returns different rows. Why?",
	"Each statement takes a fresh snapshot, so rows committed by others in between become visible",
	["Postgres re-reads the table at random to balance load",
	 "The first SELECT was cached and the second one bypassed the cache",
	 "Another session changed the rows while the first query was still running, and that is shown immediately"],
	"READ COMMITTED snapshots per statement, not per transaction, so non-repeatable reads and phantoms can occur between two statements. A single statement is still consistent: it never sees a half-finished change. If you need the same view for several queries, use REPEATABLE READ.");

im.add('mid', 'repeatable-read',
	"How does PostgreSQL's REPEATABLE READ differ from the minimum the SQL standard requires?",
	"It uses one snapshot for the whole transaction, so phantom reads cannot happen either",
	["It allows phantom reads, exactly as the standard permits",
	 "It re-checks every row that was read at COMMIT time and aborts the transaction if anything has changed",
	 "It takes shared locks on every row read, which blocks writers"],
	"Postgres implements REPEATABLE READ as snapshot isolation: every statement sees the database as of the first statement, which also rules out phantoms, stricter than the standard demands. It does not lock rows it reads, and it does not re-validate at commit. Write skew remains possible, which is what SERIALIZABLE adds protection for.");

im.add('mid', 'read-uncommitted',
	"What happens if you ask PostgreSQL for READ UNCOMMITTED?",
	"It behaves like READ COMMITTED: dirty reads are never possible",
	["You may see uncommitted rows from other sessions that are still in the middle of their work",
	 "The statement is rejected as an invalid isolation level",
	 "It behaves like SERIALIZABLE, the strictest level"],
	"Postgres accepts the name for compatibility but its MVCC design has no way to expose uncommitted data, so you get READ COMMITTED semantics. It never gives you dirty reads, and it does not escalate to the strictest level.");

im.add('advanced', 'serialization-failure',
	"In REPEATABLE READ you try to UPDATE a row that another transaction changed and committed after your snapshot. What happens?",
	"Your statement fails with a serialization error (could not serialize access due to concurrent update) and you must retry the transaction",
	["The update waits for the other transaction to finish and then overwrites its change of the row using the values from your own older snapshot",
	 "The update silently skips the row and reports 0 rows updated",
	 "The update succeeds using your older snapshot of the row"],
	"Under snapshot isolation a transaction may not modify a row that changed after its snapshot, since it would be acting on stale data. Postgres raises error 40001, and application code needs a retry loop. READ COMMITTED behaves differently: it re-reads the newest version of the row and continues.");

im.add('mid', 'mvcc',
	"What does an UPDATE do to a row under MVCC in PostgreSQL?",
	"It writes a new version of the row and leaves the old version as a dead tuple until VACUUM reclaims it",
	["It overwrites the row in place and keeps the old value in a separate undo log that rollbacks and readers use",
	 "It locks the row and edits the existing version, which readers wait for",
	 "It deletes the row and re-inserts it at the end of the file immediately"],
	"PostgreSQL never edits a row in place: each UPDATE creates a new tuple version, and the old one stays visible to snapshots that need it. Once no snapshot can see it, VACUUM can reuse the space. There is no separate undo log, and readers do not wait for writers.");

im.add('advanced', 'mvcc',
	"Does a plain SELECT block a concurrent UPDATE of the same rows in PostgreSQL?",
	"No: readers and writers do not block each other because readers use a snapshot of older row versions",
	["Yes, the SELECT holds a shared row lock on every row it reads until the transaction finally ends or commits",
	 "Yes, but only in READ COMMITTED mode",
	 "No, but only if the SELECT uses a covering index"],
	"A plain SELECT takes no row locks. It reads whichever row versions its snapshot allows, while writers create new versions. Blocking appears only between writers on the same row, or when you ask for locks with SELECT ... FOR UPDATE or FOR SHARE.");

im.add('advanced', 'vacuum',
	"A transaction has been idle in transaction for hours. Why can this make a busy table bloat?",
	"Its old snapshot may still need old row versions, so VACUUM cannot remove dead tuples newer than it",
	["It holds an exclusive lock that stops all writes to the table, which forces extra duplicate row versions",
	 "Idle transactions double the size of every table they touched",
	 "It disables autovacuum for the whole database until it ends"],
	"VACUUM may only remove row versions that no running transaction could still see. A long-open transaction pins that horizon, so updates and deletes keep piling up dead tuples. It does not lock the table and does not disable autovacuum. Setting idle_in_transaction_session_timeout is the usual guard.");

// ───────────────────────── locks-and-deadlocks ─────────────────────────
const lk = t('locks-and-deadlocks');

lk.add('basic', 'for-update',
	"What does SELECT ... FOR UPDATE do?",
	"Locks the selected rows until the transaction ends, so other writers to them must wait",
	["Updates the selected rows with the values that appear in the SELECT list, as a shortcut for UPDATE",
	 "Locks the whole table against reads for the duration of the statement",
	 "Marks the rows as dirty so VACUUM visits them first"],
	"FOR UPDATE takes row-level locks on the rows returned. Another transaction trying to UPDATE, DELETE or FOR UPDATE those rows waits until you commit or roll back, while plain SELECTs still read freely. It is the standard way to read, decide, then write safely.");

lk.add('mid', 'lost-update',
	"Two sessions read a balance of 100 in READ COMMITTED, each computes 100 - 10 in application code and writes 90. What is the best fix?",
	"Do the arithmetic in SQL (SET balance = balance - 10) or lock the row with FOR UPDATE before reading",
	["Raise the isolation level to READ UNCOMMITTED, which lets each session see the other's pending change straight away",
	 "Run the two writes faster by adding an index on balance",
	 "Wrap each session's read and write in its own savepoint"],
	"The bug is read-modify-write with stale data. UPDATE ... SET balance = balance - 10 makes the database apply each change to the current value, and FOR UPDATE makes the second session wait and then see 90. Savepoints do not lock anything, indexes do not affect correctness, and READ UNCOMMITTED is just READ COMMITTED here.");

lk.add('mid', 'deadlock',
	"Transaction A locks row 1 then wants row 2, while B locks row 2 then wants row 1. What does PostgreSQL do?",
	"It detects the cycle after deadlock_timeout and aborts one transaction with an error so the other can finish",
	["Both transactions wait forever, and only an administrator killing one of the sessions can ever free them again",
	 "It silently reorders the two transactions so no cycle forms",
	 "It aborts both transactions and rolls back everything they did"],
	"Waiting on each other is a deadlock. Postgres checks for cycles after deadlock_timeout (1 second by default) and cancels one victim with error 40P01. The survivor continues, and the victim's application should retry. Postgres never reorders transactions on its own.");

lk.add('mid', 'deadlock',
	"What is the most reliable way to prevent deadlocks in application code?",
	"Always take locks in the same order, for example rows sorted by id",
	["Use shorter variable names so that transactions are smaller and finish before others begin",
	 "Set deadlock_timeout to 0 so cycles are caught instantly",
	 "Run every transaction at SERIALIZABLE"],
	"Deadlocks need a cycle, and a consistent lock order makes cycles impossible. Updating several rows in ascending id order is the usual rule. A lower deadlock_timeout only detects them sooner, and SERIALIZABLE adds its own failures instead of removing lock cycles.");

lk.add('advanced', 'skip-locked',
	"What does FOR UPDATE SKIP LOCKED let a job queue do?",
	"Each worker claims a different pending row without waiting for rows that other workers already locked",
	["It lets workers read rows that other transactions are changing without taking any locks of their own at all",
	 "It skips rows older than the current transaction's snapshot",
	 "It makes the lock expire automatically after one second"],
	"SKIP LOCKED silently omits rows that another transaction has locked, so concurrent workers each get distinct jobs instead of queueing behind one another. Combine it with ORDER BY and LIMIT. The locks it takes last until the transaction ends, and there is no automatic expiry.",
	`SELECT id FROM jobs
WHERE status = 'pending'
ORDER BY id
LIMIT 1
FOR UPDATE SKIP LOCKED;`);

lk.add('advanced', 'ddl-locks',
	"An ALTER TABLE is waiting behind one long-running query on that table. What happens to new queries on the table?",
	"They queue behind the waiting ALTER, so the table appears frozen until the old query finishes",
	["They run normally, because ALTER TABLE only takes its lock at the moment it actually starts executing",
	 "They fail immediately with a lock error",
	 "They read a snapshot of the table from before the ALTER"],
	"Many ALTER TABLE forms need an ACCESS EXCLUSIVE lock, which conflicts with everything. Lock requests are granted in order, so new queries line up behind the waiting ALTER even though it has not changed anything yet. Set lock_timeout for migrations so they give up instead of stalling production.");

// ───────────────────────── constraints-and-keys ─────────────────────────
const ck = t('constraints-and-keys');

ck.add('basic', 'primary-key',
	"What does declaring a PRIMARY KEY on a column give you?",
	"A uniqueness guarantee, a NOT NULL guarantee and an automatically created unique B-tree index",
	["Only a uniqueness guarantee; NULLs are still allowed and no index is created unless you ask for one",
	 "An automatic ordering of the table by that column",
	 "A foreign key to every other table that has a column of the same name"],
	"A primary key is UNIQUE plus NOT NULL, and Postgres builds a unique B-tree index to enforce it. Rows are not physically sorted by it, and relationships between tables must be declared separately with FOREIGN KEY.");

ck.add('mid', 'unique',
	"A column has a UNIQUE constraint. Can two rows both have NULL in it?",
	"Yes by default: NULLs are treated as distinct (use NULLS NOT DISTINCT on 15+ to change that)",
	["No, because two NULLs in the same column would count as duplicates of each other and be rejected",
	 "No, a UNIQUE column is implicitly NOT NULL",
	 "Yes, but only the first NULL is indexed"],
	"UNIQUE rejects equal non-NULL values, and since NULL is not equal to NULL, any number of NULLs can coexist. PostgreSQL 15 added UNIQUE NULLS NOT DISTINCT for the opposite behaviour. NOT NULL is implied only by PRIMARY KEY, and every NULL is stored in the index as usual.");

ck.add('basic', 'foreign-keys',
	"You insert an order whose customer_id does not exist in customers, and the column has a foreign key. What happens?",
	"The insert fails with a foreign key violation",
	["The insert succeeds and customer_id is set to NULL",
	 "The insert succeeds and Postgres creates the missing customer row",
	 "The insert succeeds, and the check only happens at the next VACUUM"],
	"A foreign key makes the database reject any child row that points at a missing parent. Postgres does not null out values or create parents on its own, and enforcement happens at statement end (or at COMMIT if the constraint is deferred), never at VACUUM time.");

ck.add('mid', 'check',
	"A column has CHECK (price_cents >= 0). Can you insert a row where price_cents is NULL?",
	"Yes: a CHECK only rejects rows where the condition is false, and NULL makes it unknown",
	["No, because NULL is not greater than or equal to zero, so the condition fails and the row is rejected",
	 "No, a CHECK constraint implies NOT NULL",
	 "Yes, but the row is hidden from queries until fixed"],
	"CHECK passes when its expression is true or NULL. To forbid missing values as well, add NOT NULL or write the check so it cannot be unknown. A CHECK has no effect on visibility of rows.");

ck.add('basic', 'composite-key',
	"order_items has PRIMARY KEY (order_id, product_id). What does that guarantee?",
	"A product can appear at most once per order, while the same product can appear in many orders",
	["Each order can contain only one product in total, no matter how many quantities of it are ordered",
	 "Each product can be used in only one order",
	 "Nothing about uniqueness; it only creates an index"],
	"A composite key is unique as a pair: no two rows can share both the same order and the same product, but either value alone can repeat. That is exactly what a line-items table wants. Quantities of one product are kept in the qty column.");

ck.add('basic', 'on-delete',
	"A foreign key is declared with ON DELETE CASCADE. What happens when a parent row is deleted?",
	"All child rows that reference it are deleted automatically",
	["The delete is blocked while children exist",
	 "The children's foreign key columns are set to NULL",
	 "The children remain, and the parent is only marked as hidden"],
	"CASCADE propagates the delete to the children. The default (NO ACTION) blocks the delete, and SET NULL would detach children instead. Cascades are convenient for owned data such as order lines, and dangerous when they remove business history you wanted to keep.");

ck.add('advanced', 'deferrable',
	"What does DEFERRABLE INITIALLY DEFERRED change for a foreign key?",
	"The constraint is checked at COMMIT instead of after each statement, so rows can be inserted in any order",
	["The constraint is never checked at all, which makes bulk loads much faster but risks orphaned rows in the table",
	 "The constraint is checked only when the table is next vacuumed",
	 "The constraint is checked per row before each statement runs"],
	"Deferred constraints are verified at the end of the transaction, which lets you insert children before parents or swap circular references. The data still has to be valid at COMMIT, otherwise the whole transaction fails. Nothing is skipped, and VACUUM is unrelated.");

// ───────────────────────── jsonb-and-arrays ─────────────────────────
const js = t('jsonb-and-arrays');

js.add('basic', 'jsonb',
	"What is the main practical difference between json and jsonb?",
	"jsonb is stored in a decomposed binary form that supports indexing and fast queries; json keeps the exact input text",
	["json is faster to query because it keeps the original text and therefore never needs to be parsed again after it has been stored",
	 "jsonb can only store objects, while json can store any value",
	 "They are the same type; jsonb is just a newer alias"],
	"jsonb parses the document on the way in, discards whitespace and duplicate keys, and stores a binary form you can index with GIN. json preserves the raw text, so every query has to re-parse it. Both can hold any JSON value, and they are distinct types.");

js.add('basic', 'operators',
	"What is the difference between data -> 'plan' and data ->> 'plan'?",
	"-> returns the value as jsonb; ->> returns it as text",
	["-> returns text and ->> returns jsonb",
	 "-> searches nested keys and ->> only searches top-level keys",
	 "Both return jsonb; ->> just trims quotes in the output"],
	"The single arrow keeps the result as JSON, so strings come back quoted and you can chain another -> to go deeper. The double arrow extracts as plain text, which is what you want for comparisons, casts and display. Both read keys at the level you point them at.");

js.add('mid', 'containment',
	"What does WHERE data @> '{\"plan\": \"pro\"}' test?",
	"Whether the jsonb document contains that key and value; a GIN index can accelerate it",
	["Whether the document equals exactly that object, with the same keys and nothing else besides them",
	 "Whether the text of the column starts with that string",
	 "Whether the key plan exists, whatever its value"],
	"@> is containment: the left document must include everything in the right one, so extra keys are fine. It is the operator GIN indexes on jsonb are designed for. Exact equality uses =, and key existence uses the ? operator.");

js.add('basic', 'arrays',
	"In PostgreSQL, which index addresses the first element of an array column tags?",
	"tags[1], because arrays start at 1",
	["tags[0], because arrays start at 0 like most languages",
	 "tags[first], a reserved subscript for the first element",
	 "tags[-1], which counts from the front"],
	"Postgres arrays are 1-based by default, a common surprise for JavaScript developers. To test membership use 'x' = ANY(tags) or tags @> ARRAY['x'], which can use a GIN index. Negative subscripts do not count from the end.");

js.add('advanced', 'modelling',
	"What do you give up by storing a field you filter and join on constantly inside a jsonb column instead of a real column?",
	"Column types, constraints, foreign keys and the planner's per-column statistics",
	["The ability to read the value in SQL at all, because only real columns can be selected or filtered",
	 "Transactions, because jsonb updates are not atomic",
	 "Nothing, since jsonb is always faster than a column"],
	"jsonb is flexible, but a value inside it has no declared type, cannot be NOT NULL or reference another table, and the planner has only coarse statistics for it. Hot, relational fields belong in columns. The value is readable with -> and ->>, and updates are transactional like any other.");

js.add('advanced', 'gin',
	"Which is true of a GIN index created with jsonb_path_ops compared with the default jsonb_ops?",
	"It is smaller and faster for containment (@>) queries but does not support key-existence operators like ?",
	["It is larger and slower to build, but in exchange it supports every single jsonb operator including existence checks",
	 "It indexes only top-level keys and ignores nested values",
	 "It makes the column read-only"],
	"jsonb_path_ops hashes whole paths with their values, giving a compact index that serves @> and jsonpath matches well. The default operator class also supports existence checks (?, ?|, ?&) at the cost of more space. Both index nested content, and neither affects writes beyond normal index maintenance.");

// ───────────────────────── window-functions-and-ctes ─────────────────────────
const wf = t('window-functions-and-ctes');

wf.add('basic', 'window',
	"How does a window function such as SUM(x) OVER (PARTITION BY customer_id) differ from SUM(x) with GROUP BY customer_id?",
	"The window version keeps every input row and adds the per-customer total beside each one",
	["The window version returns fewer rows because it deduplicates customers before calculating the total",
	 "They return the same rows; OVER is just another spelling of GROUP BY",
	 "The window version works only on the first row of each customer"],
	"GROUP BY collapses each group to one row. A window function calculates over the group but leaves the rows intact, which is what you need for running totals, rankings and comparing a row with its group. It sees every row, not only the first.");

wf.add('mid', 'ranking',
	"Scores are 90, 90 and 80. What does RANK() OVER (ORDER BY score DESC) return for the three rows?",
	"1, 1 and 3",
	["1, 2 and 3, because ties are broken by the physical order of the rows",
	 "1, 1 and 2",
	 "1, 2 and 2"],
	"RANK gives tied rows the same rank and then skips numbers, so the next rank is 3. DENSE_RANK would give 1, 1, 2 with no gap, and ROW_NUMBER always counts 1, 2, 3 and breaks ties arbitrarily. Choose according to whether you want gaps.");

wf.add('mid', 'frames',
	"SUM(cents) OVER (ORDER BY day) has no frame clause. Which rows does it add up for each row?",
	"From the first row of the partition through the current row (and any rows with the same day)",
	["Only the current row, because without a frame clause each row forms its own tiny one-row frame to sum",
	 "Every row in the partition, regardless of order",
	 "The previous row and the next row"],
	"With an ORDER BY and no explicit frame, the default is RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, which gives a running total. Rows tied on the sort key are peers and are included together. Without ORDER BY the frame would cover the whole partition.");

wf.add('mid', 'lag-lead',
	"What does LAG(total, 1) OVER (ORDER BY day) return?",
	"The total from the previous row in the window's order, or NULL for the first row",
	["The total from the next row in the window's order, or NULL when there is no row after the current one",
	 "The smallest total seen so far",
	 "The total of the first row for every row"],
	"LAG looks backwards a given number of rows in the window ordering, and LEAD looks forwards. It is how you compute day-over-day change without a self join. The first row has nothing before it, so you get NULL unless you pass a default as the third argument.");

wf.add('advanced', 'ctes',
	"Since PostgreSQL 12, how is a simple non-recursive CTE that is referenced once and has no side effects treated by default?",
	"It is inlined into the main query, so the planner can optimise across it; MATERIALIZED forces the old behaviour",
	["It is always computed first and stored as a temporary table that every later reference reads from instead of recomputing",
	 "It is cached across sessions until the data changes",
	 "It is ignored unless the query uses the keyword MATERIALIZED"],
	"Before version 12 every CTE was an optimisation fence that was run once and stored. Now a side-effect-free CTE used once is folded into the parent query, while WITH x AS MATERIALIZED (...) restores the fence, which can help when the CTE is expensive and reused. CTE results are never shared across sessions.");

wf.add('advanced', 'recursive',
	"How does a recursive CTE (WITH RECURSIVE) work?",
	"It runs an anchor query once, then repeatedly runs the recursive part on the newest rows until that part returns nothing",
	["It runs the same query twice and keeps only the rows that appear in both of the two result sets, like INTERSECT would, repeated until stable",
	 "It repeats the whole query a fixed 100 times by default",
	 "It runs the recursive part once per row of the base table in parallel"],
	"The anchor member seeds the working set, then the recursive member (joined to the CTE itself, typically with UNION ALL) is executed against the previous round's rows until no new rows appear. That makes it ideal for trees such as categories or org charts. Always make sure the recursion terminates, for example by tracking depth or visited ids.");

// ───────────────────────── assemble ─────────────────────────
const banks = [ty, sf, jn, ga, ix, ep, tx, im, lk, ck, js, wf];
export const postgresQuestions: Question[] = banks
	.flatMap((b) => b.out)
	.map((q, i) => ({ ...q, id: 'PG' + String(i + 1).padStart(2, '0') }));
