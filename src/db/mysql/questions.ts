import { builder, type Level } from '../../quiz/types';

// MySQL 8.0 / 8.4 LTS behaviour. One builder for the whole bank (ids MY01..), the topic is passed per question.
const { out, add: raw } = builder('MY', 'data-types-and-tables');
const add = (topic: string, level: Level, tag: string, q: string, correct: string, wrong: [string, string, string], why: string, code?: string) => {
	raw(level, tag, q, correct, wrong, why, code);
	out[out.length - 1].topic = topic;
};

// ───────────────────── data-types-and-tables ─────────────────────
const T1 = 'data-types-and-tables';

add(T1, 'basic', 'auto-increment',
	'You are creating a table in MySQL and want the database to assign 1, 2, 3 and so on to a new id column. What do you add to the column definition?',
	'AUTO_INCREMENT, usually on the integer primary key',
	['A SEQUENCE object that the column reads with NEXTVAL, the way PostgreSQL sequences work',
	 'IDENTITY(1,1) after the type, which is how SQL Server numbers its rows',
	 'DEFAULT NOW() on an integer column, so each new row gets a larger number than the last'],
	'AUTO_INCREMENT is the MySQL attribute that hands out the next integer on insert. MySQL has no CREATE SEQUENCE, and IDENTITY(1,1) is SQL Server syntax. DEFAULT NOW() produces a timestamp, not a counter, and is not valid on a plain integer column.',
	`CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);`);

add(T1, 'basic', 'quoting',
	'A table has a column called `order`, which is a reserved word. How do you reference it safely in a default MySQL setup?',
	'Wrap the name in backticks, like `order`',
	['Wrap the name in double quotes, like "order", because double quotes always mean identifiers in SQL',
	 'Wrap the name in square brackets, like [order], which MySQL accepts as an alternative to backticks',
	 'Wrap the name in single quotes, like \'order\', which MySQL treats as a quoted identifier'],
	'Backticks are the MySQL identifier quote. Double quotes only quote identifiers when the ANSI_QUOTES SQL mode is on; by default they are string literals. Square brackets are SQL Server syntax, and single quotes always make a string, so the query would compare against the text "order".',
	'SELECT `order` FROM `orders`;');

add(T1, 'basic', 'decimal',
	'Which column type should store prices such as 19.99 when the totals must add up to the cent?',
	'DECIMAL(10,2), which stores exact decimal values',
	['FLOAT, because it keeps up to 7 significant digits which is plenty for prices',
	 'DOUBLE, because its larger range means rounding errors can never appear in money columns',
	 'VARCHAR(10), because text is the only type that can hold a decimal point exactly'],
	'DECIMAL is an exact fixed-point type, so 0.10 + 0.20 is exactly 0.30. FLOAT and DOUBLE are binary approximations: many decimal fractions cannot be represented, so sums drift by tiny amounts. VARCHAR stores text and cannot be summed without casting, which loses the type safety.');

add(T1, 'basic', 'tinyint',
	'A column is declared TINYINT(1) in MySQL 8. Which of these values can it store?',
	'100, because it is still a one-byte integer with range -128 to 127',
	['Only 0 and 1, because the (1) limits the column to one digit and to boolean values',
	 'Only the digits 0 to 9, because the (1) is a maximum digit count enforced on insert',
	 'Nothing above 1, because strict mode raises an error for any value outside true and false'],
	'The number in parentheses was only a display-width hint and has no effect on storage or range; TINYINT always spans -128 to 127 (0 to 255 unsigned). The (1) only became popular as a convention for booleans. Nothing in the engine enforces 0 or 1 unless you add a CHECK constraint.');

add(T1, 'basic', 'boolean',
	'What is BOOLEAN in MySQL?',
	'A synonym for TINYINT(1), where TRUE and FALSE are just 1 and 0',
	['A dedicated one-bit type that rejects every value except TRUE and FALSE',
	 'A synonym for BIT(1), stored as a single bit that you must read with the b prefix',
	 'A string type that stores the words true and false and compares them case-insensitively'],
	'MySQL has no separate boolean storage type: BOOL and BOOLEAN are aliases for TINYINT(1), and TRUE and FALSE are the constants 1 and 0. That is why you can store 5 in a "boolean" column. BIT(1) is a different type and nothing stores the words as text.');

add(T1, 'mid', 'datetime',
	'What is the key behavioural difference between TIMESTAMP and DATETIME in MySQL?',
	'TIMESTAMP is converted to and from the session time zone, while DATETIME keeps the literal you stored',
	['DATETIME is converted to UTC on write and back on read, while TIMESTAMP stores the literal as typed',
	 'Both store a time zone offset next to the value, but TIMESTAMP also records the client name',
	 'They behave identically; the only difference is that TIMESTAMP cannot hold fractional seconds or dates after 2000'],
	'TIMESTAMP is stored as UTC and shown in the connection time zone, so changing the session zone changes what you read. DATETIME stores the wall-clock value as given and never converts it. Neither stores an offset, and both support fractional seconds up to six digits. TIMESTAMP also has a narrower range ending in 2038.');

add(T1, 'mid', 'auto-increment',
	'An InnoDB transaction inserts a row that gets id 8, then rolls back. The next successful insert gets which id?',
	'9 or higher, because the counter is not rolled back, so id 8 is simply skipped',
	['8 again, because a rollback undoes the counter along with the inserted row',
	 '8 again, but only if the table was empty before the transaction started',
	 'An error, because InnoDB refuses to reuse or skip a number once it has been allocated'],
	'InnoDB hands out auto-increment values outside the transaction so concurrent inserts do not block each other, which means a rollback leaves a gap. Gaps are normal; never rely on ids being contiguous or use them as a row count. The counter is not rewound conditionally, and skipping a number is not an error.');

// ───────────────────── select-and-filter ─────────────────────
const T2 = 'select-and-filter';

add(T2, 'basic', 'limit',
	'You run SELECT * FROM posts LIMIT 5 with no ORDER BY. What does MySQL promise about which 5 rows come back?',
	'Nothing: without ORDER BY the row order is not guaranteed, so the five rows can change',
	['The five rows with the lowest primary key values, because InnoDB always reads in key order',
	 'The five oldest rows by insertion time, because MySQL tracks insert order for every table',
	 'Five random rows, because LIMIT without ORDER BY shuffles the table first'],
	'SQL result order is undefined unless you specify ORDER BY. InnoDB often returns rows in primary key order, so it can look reliable, but a different plan or index can change it at any time. MySQL does not track insertion order and does not deliberately shuffle either.',
	'SELECT * FROM posts ORDER BY id LIMIT 5;');

add(T2, 'basic', 'null',
	'What does SELECT * FROM users WHERE deleted_at = NULL return?',
	'No rows at all, because comparing anything to NULL with = gives unknown, never true',
	['All rows where deleted_at is empty, because = NULL is shorthand for IS NULL in MySQL',
	 'An error, because MySQL forbids the NULL keyword on the right side of =',
	 'Every row in the table, because a comparison with NULL is treated as always true'],
	'NULL means "unknown", so deleted_at = NULL evaluates to NULL and WHERE keeps only rows where the condition is true. Use IS NULL to find missing values. It is not a syntax error, it does not match everything, and = NULL is not an alias for IS NULL.',
	'SELECT * FROM users WHERE deleted_at IS NULL;');

add(T2, 'basic', 'between',
	'Which rows does WHERE price BETWEEN 5 AND 10 return?',
	'Rows with a price from 5 up to and including 10',
	['Rows with a price above 5 and below 10, excluding both end values',
	 'Rows with a price from 5 up to but not including 10, like a half-open range',
	 'Rows with a price of exactly 5 or exactly 10 and nothing in between'],
	'BETWEEN is inclusive at both ends, equivalent to price >= 5 AND price <= 10. That matters for dates: BETWEEN with a date and a midnight timestamp can silently drop part of the last day, so a half-open range with < is safer there.');

add(T2, 'mid', 'null-safe',
	'What does the MySQL operator <=> do?',
	'A NULL-safe equality test: NULL <=> NULL is true and 1 <=> NULL is false instead of NULL',
	['A three-way comparison that returns -1, 0 or 1 so you can use it as a sort callback',
	 'A not-equal test that treats NULL as different from every value, including another NULL',
	 'A pattern match that works like LIKE but is case-sensitive for text columns'],
	'Plain = returns NULL when either side is NULL. <=> always returns 0 or 1, treating two NULLs as equal, which is handy when comparing nullable columns. It is not a sort comparator, not a not-equal operator (that is <> or !=) and not a pattern match.',
	'SELECT NULL <=> NULL, 1 <=> NULL, NULL = NULL;');

add(T2, 'mid', 'like',
	'There is a normal B-tree index on users.email. Which query can use the index to seek straight to the matching rows?',
	'WHERE email LIKE \'asha%\', because a fixed prefix maps to a range in the sorted index',
	['WHERE email LIKE \'%@gmail.com\', because the index stores every character position',
	 'WHERE email LIKE \'%asha%\', because MySQL builds a hidden substring index for LIKE',
	 'None of them, because LIKE can never use an index in MySQL'],
	'A B-tree is sorted from the first character, so a literal prefix becomes a range scan. A leading wildcard means the match could start anywhere, so MySQL must read every entry or row. There is no hidden substring index; for infix search use a FULLTEXT index or a dedicated search tool.');

add(T2, 'mid', 'pagination',
	'A page endpoint runs SELECT id, title FROM posts ORDER BY id LIMIT 20 OFFSET 100000. Why does it get slower as the offset grows?',
	'MySQL still steps over the first 100000 rows before returning 20, so work grows with the offset',
	['MySQL re-sorts the whole table for every page, because OFFSET disables the index on id and forces a filesort',
	 'The offset is applied after the rows are sent, so the client downloads all 100020 rows',
	 'InnoDB locks the skipped rows, and releasing 100000 locks is the slow part'],
	'OFFSET does not jump to a position; the engine reads and discards the skipped rows, even if an index gives the order. Keyset pagination fixes it by filtering with WHERE id > last_seen_id ORDER BY id LIMIT 20. The index is still used, rows are not sent to the client, and plain reads take no locks.');

// ───────────────────── joins ─────────────────────
const T3 = 'joins';

add(T3, 'basic', 'left-join',
	'Some users have never placed an order. You want every user in the result, with order data where it exists. Which join do you use?',
	'users LEFT JOIN orders, which keeps every user and fills order columns with NULL when nothing matches',
	['users INNER JOIN orders, because inner joins keep the rows of the first table',
	 'users CROSS JOIN orders, because it pairs each user with the orders that belong to them, one row for each pair',
	 'orders LEFT JOIN users, because the first table written is the one that is dropped'],
	'LEFT JOIN returns all rows from the left table and matches from the right, using NULLs where there is no match. INNER JOIN drops users without orders. CROSS JOIN pairs every user with every order and has no matching condition. Swapping the order to orders LEFT JOIN users keeps every order, not every user.');

add(T3, 'basic', 'cross-join',
	'Table a has 3 rows and table b has 4 rows. What does SELECT * FROM a JOIN b return in MySQL, where JOIN without ON is allowed?',
	'12 rows, because with no condition every row of a pairs with every row of b',
	['3 rows, because MySQL matches rows of a and b by their position',
	 '4 rows, because the join keeps the larger table and ignores the smaller one',
	 '0 rows, because a join with no ON condition matches nothing'],
	'Without a join condition the result is the Cartesian product: 3 x 4 = 12 combinations. In MySQL a bare JOIN behaves like CROSS JOIN, which makes forgetting the ON clause an easy and expensive mistake. Rows are never matched by position.');

add(T3, 'mid', 'anti-join',
	'Which query finds customers who have no orders at all?',
	'SELECT c.id FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL',
	['SELECT c.id FROM customers c INNER JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL',
	 'SELECT c.id FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id = 0',
	 'SELECT c.id FROM customers c CROSS JOIN orders o WHERE o.customer_id <> c.id'],
	'After a LEFT JOIN, customers with no matching order have NULL in every order column, so filtering on IS NULL keeps exactly them. An INNER JOIN has already discarded those customers, so nothing can be NULL. Comparing to 0 tests a value that was never produced, and the CROSS JOIN with <> returns almost every customer.');

add(T3, 'mid', 'on-vs-where',
	'You want all customers, plus only their paid orders. What goes wrong with this query?',
	'The WHERE test on o.status drops the NULL rows, so unmatched customers vanish; the condition belongs in ON',
	['Nothing; WHERE and ON are interchangeable for a LEFT JOIN and give the same rows, because the optimizer rewrites one into the other',
	 'It fails with a syntax error, because LEFT JOIN conditions must all be inside ON',
	 'It returns duplicate customers, because WHERE is evaluated before the join happens'],
	'WHERE runs after the join. For unmatched customers o.status is NULL, so o.status = \'paid\' is not true and the row is thrown away, turning the LEFT JOIN into an inner join in effect. Putting the filter in the ON clause restricts which orders match while still keeping every customer.',
	`SELECT c.id, o.id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'paid';`);

add(T3, 'mid', 'full-outer',
	'You need a FULL OUTER JOIN in MySQL. What is the situation?',
	'MySQL has no FULL OUTER JOIN; you combine a LEFT JOIN and a RIGHT JOIN with UNION',
	['It works as in other databases: write FULL OUTER JOIN and add the ON condition',
	 'It is available only when you set the sql_mode to ANSI, which enables the keyword',
	 'It is available only for InnoDB tables, because MyISAM cannot return unmatched rows from both sides'],
	'MySQL supports INNER, LEFT, RIGHT and CROSS joins but not FULL OUTER JOIN, and no sql_mode adds it. The usual emulation is the UNION of a LEFT JOIN and a RIGHT JOIN, with UNION removing the duplicated matched rows. The storage engine has nothing to do with it.');

add(T3, 'advanced', 'hash-join',
	'Two large tables are joined on a column that has no usable index. Since MySQL 8.0.18, what can the optimizer do for an equality join like this?',
	'Use a hash join: build an in-memory hash table from one input and probe it with the other',
	['Nothing: it must run a nested loop that rescans the inner table for every outer row',
	 'Create a temporary index on the join column and keep it after the query finishes',
	 'Sort both tables on disk and merge them, which is the only join method MySQL implements'],
	'Hash join was added in 8.0.18 for equi-joins without a usable index and avoids repeated scans of the inner table. A nested loop is still the choice when an index exists on the inner side. MySQL does not build permanent indexes for you and does not implement merge join.');

// ───────────────────── grouping-and-aggregates ─────────────────────
const T4 = 'grouping-and-aggregates';

add(T4, 'basic', 'having',
	'What is the difference between WHERE and HAVING?',
	'WHERE filters individual rows before grouping, while HAVING filters groups after aggregation',
	['WHERE filters groups after aggregation, while HAVING filters individual rows before grouping',
	 'They are identical, except that HAVING is allowed only in SELECT statements with ORDER BY',
	 'WHERE can use indexes and aggregates freely, while HAVING can only compare plain columns'],
	'The logical order is FROM, WHERE, GROUP BY, HAVING, SELECT. WHERE cannot see aggregates such as COUNT(*) because groups do not exist yet; HAVING can. Using WHERE for row-level conditions is also cheaper, since fewer rows reach the grouping step.',
	`SELECT customer_id, COUNT(*) AS n
FROM orders
WHERE status = 'paid'
GROUP BY customer_id
HAVING COUNT(*) >= 3;`);

add(T4, 'basic', 'count',
	'A table has 10 rows and the nickname column is NULL in 4 of them. What do COUNT(*) and COUNT(nickname) return?',
	'10 and 6, because COUNT(column) skips NULLs while COUNT(*) counts rows',
	['10 and 10, because every COUNT variant counts the rows regardless of NULLs',
	 '6 and 6, because COUNT(*) also ignores any row containing a NULL anywhere',
	 '10 and 4, because COUNT(column) counts only the rows where the column is NULL'],
	'COUNT(*) counts rows. COUNT(expr) counts the rows where expr is not NULL, here 10 - 4 = 6. That is why COUNT(nickname) is a quick way to count how many users filled a field in. It never counts the NULLs themselves.');

add(T4, 'mid', 'only-full-group-by',
	'In MySQL 8 with default settings, what happens when you run this query?',
	'It fails with an error, because name is neither grouped nor aggregated (ONLY_FULL_GROUP_BY)',
	['It succeeds and shows the name of the first order that MySQL happens to read in each group',
	 'It succeeds and returns the alphabetically smallest name in each group',
	 'It succeeds but shows a warning, and the name column is filled with NULL'],
	'ONLY_FULL_GROUP_BY has been in the default sql_mode since MySQL 5.7, so selecting a column that is not in GROUP BY and not determined by it is rejected. Older MySQL silently picked an arbitrary row, which hid bugs. Add the column to GROUP BY, aggregate it, or use ANY_VALUE() when any value is acceptable.',
	`SELECT customer_id, name, COUNT(*)
FROM orders
GROUP BY customer_id;`);

add(T4, 'mid', 'any-value',
	'What does ANY_VALUE(name) do inside a grouped query?',
	'It returns an arbitrary value of name from the group and skips the ONLY_FULL_GROUP_BY check for it',
	['It returns the most common value of name in the group, breaking ties by choosing the smallest value alphabetically',
	 'It returns NULL whenever the group contains more than one distinct name, to flag the ambiguity',
	 'It turns off ONLY_FULL_GROUP_BY for the whole session until the connection closes'],
	'ANY_VALUE is a MySQL function for columns you know are the same within the group, or do not care about. It picks no particular row and does not compute a mode. It only affects that expression, not the session sql_mode.');

add(T4, 'mid', 'aggregates-null',
	'SELECT SUM(total), COUNT(*) FROM orders WHERE 1 = 0 returns what?',
	'NULL for the sum and 0 for the count',
	['0 for the sum and 0 for the count, because empty sums are zero in SQL',
	 'NULL for both, because an aggregate over no rows is always undefined',
	 'An empty result with no rows at all, because the filter matched nothing'],
	'An aggregate query without GROUP BY always returns exactly one row. SUM of zero rows is NULL (so wrap it in COALESCE(SUM(total), 0) if you want zero), while COUNT of zero rows is 0. It does not return an empty result set.');

add(T4, 'advanced', 'rollup',
	'What does adding WITH ROLLUP to a GROUP BY clause do in MySQL?',
	'It adds extra subtotal and grand-total rows, with NULL in the grouping columns that are rolled up',
	['It sorts the groups by their aggregate value, highest first',
	 'It stores the grouped result in a temporary table so later queries can reuse it',
	 'It repeats each group row once per underlying row, so you can see the detail'],
	'WITH ROLLUP appends super-aggregate rows: for GROUP BY region, city you get a subtotal per region and a final total row, shown with NULL in the rolled-up columns (GROUPING() tells those NULLs from real ones). It does not sort, cache or expand the rows.',
	`SELECT region, city, SUM(total)
FROM orders
GROUP BY region, city WITH ROLLUP;`);

// ───────────────────── innodb-and-clustered-index ─────────────────────
const T5 = 'innodb-and-clustered-index';

add(T5, 'basic', 'engine',
	'Which storage engine does a new MySQL 8 table use if you do not name one?',
	'InnoDB',
	['MyISAM, which is still the default because it is the fastest for reads',
	 'MEMORY, which keeps every table in RAM until the server restarts',
	 'Aria, which MySQL inherited as its crash-safe default'],
	'InnoDB has been the default engine since MySQL 5.5 and is the one you want: transactions, row-level locking, foreign keys and crash recovery. MyISAM is older and not transactional, MEMORY is for temporary data, and Aria belongs to MariaDB, not MySQL.');

add(T5, 'basic', 'innodb-vs-myisam',
	'Which two properties make InnoDB a better default than MyISAM for application data?',
	'InnoDB supports transactions and row-level locking, while MyISAM has neither and locks whole tables',
	['InnoDB stores data in plain text files that you can edit by hand, while MyISAM uses an opaque binary format',
	 'InnoDB is read-only by default, which keeps data safe, while MyISAM allows writes',
	 'InnoDB has no indexes to maintain, so inserts are faster, while MyISAM needs one per column'],
	'MyISAM has table-level locks, no transactions and no crash recovery, so one slow write can block every reader and a crash can corrupt a table. InnoDB gives ACID transactions and locks individual rows. Neither engine stores editable text files, and InnoDB fully supports indexes.');

add(T5, 'mid', 'clustered-index',
	'In InnoDB, what does it mean that the primary key is a clustered index?',
	'Rows live inside the primary key B-tree itself, in key order, so the leaf pages hold the full row',
	['The primary key is copied into a separate file and rows are stored in insertion order',
	 'Rows with similar primary keys are spread across servers so that they can be read in parallel by several nodes',
	 'The primary key index stores only row pointers, and the rows sit in an unordered heap'],
	'InnoDB has no separate heap: the data is the primary key B-tree. Looking up by primary key is one tree walk to the row, and a range of ids reads neighbouring pages. A heap of unordered rows with pointers is how PostgreSQL stores tables, not InnoDB. Clustering has nothing to do with multiple servers.');

add(T5, 'mid', 'hidden-row-id',
	'An InnoDB table is created with no PRIMARY KEY and no unique index. What does InnoDB do?',
	'It creates a hidden 6-byte row ID column and clusters the table on it',
	['It refuses to create the table, because InnoDB tables must have a primary key',
	 'It stores the rows in an unordered heap and uses the physical position as the identifier',
	 'It uses the first column of the table as the primary key, whatever its type'],
	'InnoDB always needs a clustered index. If there is no primary key it picks the first UNIQUE index whose columns are all NOT NULL, and otherwise generates a hidden 6-byte row ID. That hidden id cannot be used in queries, so you should declare a real primary key. The table is created fine, and the first column is not chosen blindly.');

add(T5, 'advanced', 'uuid-pk',
	'A team switches from AUTO_INCREMENT ids to random UUIDv4 values as the InnoDB primary key. What is a likely effect on write-heavy workloads?',
	'More page splits and fragmentation, because new rows land at random places in the clustered index',
	['Fewer page splits, because inserting into random pages keeps every page of the clustered index only partly full and ready for new rows',
	 'No effect, because InnoDB always stores rows in insertion order regardless of the key',
	 'Smaller secondary indexes, because UUIDs compress well inside the index pages'],
	'Rows are stored in primary key order, so ascending ids append to the last page while random UUIDs insert into the middle of already full pages, causing splits and a larger, more fragmented table. A 16-byte key also makes every secondary index bigger. Time-ordered ids such as UUIDv7 or a binary-stored ordered UUID avoid most of the cost.');

add(T5, 'advanced', 'pk-size',
	'Why does a very wide primary key, such as a long VARCHAR, make an InnoDB table heavier overall?',
	'Every secondary index entry stores the primary key value, so a wide key is copied into all of them',
	['The primary key is stored once per row in the redo log, so wide keys grow the log without limit',
	 'InnoDB rebuilds the whole table whenever a primary key longer than 255 bytes is inserted',
	 'Secondary indexes store a pointer to the physical disk address, which grows with the key width'],
	'A secondary index leaf holds the indexed columns plus the primary key, and that primary key is how InnoDB finds the full row. So a 100-byte key adds 100 bytes to every entry of every secondary index. Keep the primary key short, ideally an integer. InnoDB indexes do not use physical disk addresses.');

add(T5, 'mid', 'buffer-pool',
	'What is the InnoDB buffer pool?',
	'A memory cache of table and index pages, usually the most important setting to size on a database server',
	['A queue of SQL statements waiting to be executed by the single InnoDB worker thread',
	 'A reserved region of disk that absorbs writes when the main tablespace is full, before they are merged back later',
	 'A pool of client connections that InnoDB reuses to avoid TCP handshakes'],
	'The buffer pool (innodb_buffer_pool_size) holds recently used data and index pages in RAM so reads avoid disk. A common starting point on a dedicated server is a large share of memory, up to roughly 80 percent (the figure the manual gives). It is not a statement queue, a disk reserve or a connection pool.');

// ───────────────────── secondary-indexes ─────────────────────
const T6 = 'secondary-indexes';

add(T6, 'mid', 'secondary-lookup',
	'You query an InnoDB table by a secondary index and select columns that are not in the index. How does MySQL fetch them?',
	'The index entry gives the primary key, then MySQL walks the clustered index to read the full row',
	['The index entry contains the whole row, so one lookup is always enough',
	 'The index entry stores a physical file offset, and MySQL jumps straight to the row there',
	 'MySQL scans the whole table once and discards the index, because partial rows cannot be joined back together'],
	'A secondary index leaf stores the indexed columns plus the primary key, so reading other columns takes a second tree walk on the clustered index. That extra hop is why selecting only indexed columns, a covering query, can be much faster.');

add(T6, 'mid', 'covering-index',
	'What makes an index a covering index for a query?',
	'The index holds every column the query reads, so MySQL never visits the table rows (Using index)',
	['The index has been built on every column of the table in the same order, so it can serve any query you write',
	 'The index is unique, so MySQL can stop at the first match and ignore the table',
	 'The index covers the table in memory, meaning it is fully loaded into the buffer pool'],
	'"Covering" is a property of an index relative to one query. If the filter columns and the selected columns are all in the index, the answer comes from the index alone and the second lookup disappears. It does not require uniqueness or an all-column index, and being cached in memory is a different thing.',
	`-- index on (customer_id, created_at)
SELECT customer_id, created_at
FROM orders WHERE customer_id = 7;`);

add(T6, 'mid', 'sargable',
	'There is a plain index on orders.created_at. Which query cannot use it to seek to the matching rows?',
	'WHERE YEAR(created_at) = 2024, because the function is applied to the indexed column',
	['WHERE created_at >= \'2024-01-01\' AND created_at < \'2025-01-01\'',
	 'WHERE created_at = \'2024-03-01 10:00:00\'',
	 'WHERE created_at > \'2024-06-01\''],
	'An index is sorted by the raw column value. Wrapping the column in a function means MySQL would have to compute YEAR() for every row, so it scans instead. Rewriting as a range on the bare column lets the index seek. The other three compare the column directly and are all index-friendly.');

add(T6, 'mid', 'column-order',
	'Queries filter WHERE status = \'open\' AND created_at > ? . Which composite index fits best?',
	'(status, created_at), with the equality column first and the range column last',
	['(created_at, status), with the range column first because dates are more selective',
	 'Two single-column indexes, because MySQL always merges them as fast as one composite index',
	 '(created_at), because an index on a single column is always enough for a range'],
	'In a composite index MySQL can use equality on leading columns and then one range; columns after a range column are not used for seeking. Putting status first narrows to one slice, and created_at then orders it. Index merge exists but is rarely as good as a single matching composite index.');

add(T6, 'basic', 'index-cost',
	'Why not simply add an index on every column of a busy table?',
	'Every insert, update and delete must also maintain each index, so writes slow down and storage grows',
	['Indexes are automatically removed after a week, so extra ones are wasted effort',
	 'MySQL allows at most one index per table, so extra ones are ignored',
	 'More indexes make reads slower, because the optimizer has to read every one of them for each query it runs'],
	'Each index is a separate B-tree that has to be updated on every write and takes space in memory and on disk. The optimizer picks the cheapest useful index; unused ones do not slow reads but still cost on writes. There is no automatic expiry and no limit of one index per table.');

add(T6, 'basic', 'cardinality',
	'An index on a column that only has two distinct values, such as is_active, is usually of little help. Why?',
	'It does not narrow the search much: each value matches about half the table, so a scan is cheaper',
	['MySQL cannot index columns with only two values',
	 'Indexes on small integer columns are always stored as hashes that cannot be searched with range conditions',
	 'The index would be larger than the table and could not fit into memory'],
	'Index lookups pay off when they exclude most rows. With low cardinality, an index returns a large fraction of the table, and bouncing between the index and the rows costs more than reading the table sequentially, so the optimizer often ignores it. It can still help in a composite index or when one value is very rare.');

add(T6, 'advanced', 'invisible-index',
	'What does ALTER TABLE orders ALTER INDEX idx_status INVISIBLE do in MySQL 8?',
	'The optimizer stops using it but it is still maintained, so you can test a drop and undo it instantly',
	['It deletes the index data to free disk space but keeps the index name for later',
	 'It hides the index from SHOW INDEX output while queries continue to use it behind the scenes without any change',
	 'It makes the index usable only inside transactions that have the same user'],
	'Invisible indexes (8.0) are a safe way to check whether an index is needed: if nothing gets slower you can drop it, and if something does you make it visible again without rebuilding. Because it is still maintained, flipping back is immediate. It does not free space or hide anything from queries by name.');

// ───────────────────── explain-and-optimizer ─────────────────────
const T7 = 'explain-and-optimizer';

add(T7, 'basic', 'explain',
	'What does plain EXPLAIN do to the query you give it?',
	'It shows the execution plan MySQL would use, without running the query',
	['It runs the query and reports how many milliseconds each step took',
	 'It runs the query and rolls it back, so the data is unchanged',
	 'It rewrites the query into the fastest equivalent and saves it'],
	'EXPLAIN only asks the optimizer for its plan and estimated rows. Real timings come from EXPLAIN ANALYZE, which does execute the statement. EXPLAIN never rewrites or stores your query, and nothing is executed, so there is nothing to roll back.',
	'EXPLAIN SELECT * FROM orders WHERE customer_id = 7;');

add(T7, 'basic', 'explain-type',
	'In an EXPLAIN result, what does type = ALL mean for a table?',
	'A full table scan: MySQL reads every row',
	['All indexes of the table are used together for the lookup',
	 'The query returns all columns, which is a sign of SELECT *',
	 'All matching rows are found with one primary key lookup'],
	'The type column describes the access method, from best to worst roughly const, eq_ref, ref, range, index and ALL. ALL means no index was used and every row is scanned, which is fine for tiny tables but a red flag on big ones. A primary key lookup shows const or eq_ref.');

add(T7, 'basic', 'explain-key',
	'In EXPLAIN output, what is the difference between possible_keys and key?',
	'possible_keys lists the indexes MySQL could use, while key is the index it actually chose',
	['possible_keys lists the columns in the SELECT, while key is the primary key of the table',
	 'possible_keys is the index chosen, while key lists the indexes that were rejected',
	 'They always show the same value, and one is kept for backwards compatibility'],
	'The optimizer considers candidate indexes (possible_keys) and then picks one by estimated cost (key). If key is NULL no index was used even though candidates may exist, often because the optimizer judged a scan cheaper or the predicate is not index-friendly.');

add(T7, 'advanced', 'optimizer',
	'The query filters on an indexed column, yet EXPLAIN shows a full table scan. Which explanation is plausible?',
	'The cost-based optimizer estimated that the filter matches much of the table, so scanning is cheaper',
	['MySQL ignores indexes whenever the table has more than one index',
	 'Indexes only apply to the primary key, so a secondary index can never be chosen by the optimizer in any plan',
	 'The optimizer picks the plan at random and may choose a scan on any given run'],
	'MySQL picks plans by estimated cost using table statistics. When a predicate returns a big fraction of the rows (a rule of thumb is a sizeable share of the table, often quoted somewhere around a fifth to a third; there is no documented threshold, because it depends on the statistics and the cost model), random row fetches via a secondary index cost more than reading sequentially. Stale statistics can also mislead it, which is what ANALYZE TABLE refreshes. The choice is deterministic for given statistics, not random.');

add(T7, 'advanced', 'filesort',
	'EXPLAIN shows Using filesort in the Extra column. What does it indicate?',
	'MySQL sorts rows in a separate step because no index gives the order; it does not necessarily use disk',
	['The result is being written to a temporary file on disk that you must clean up yourself after the query ends',
	 'The query is using a full-text index and sorting by relevance',
	 'An index is corrupted and MySQL is falling back to sorting by file position'],
	'The name is historical: filesort means an explicit sort pass, done in memory when it fits (sort buffer) and spilling to temporary files only if needed. An index that matches the ORDER BY (and the WHERE) lets MySQL read rows already in order and removes the step. It has nothing to do with corruption or full-text search.');

add(T7, 'mid', 'explain-analyze',
	'What is different about EXPLAIN ANALYZE (MySQL 8.0.18 and later)?',
	'It executes the query and reports real row counts and timing for each step next to the estimates',
	['It only shows estimates, but with more decimal places than plain EXPLAIN and a colour-coded cost for each step',
	 'It analyzes the table and rebuilds its indexes before showing the plan',
	 'It runs the query on a replica so the primary server is not affected'],
	'EXPLAIN ANALYZE runs the statement and annotates the plan tree with measured time and rows, so you can spot where estimates and reality diverge. Because it runs for real, take care with slow or side-effecting statements. Rebuilding statistics is ANALYZE TABLE, and nothing is redirected to a replica.');

// ───────────────────── transactions-and-isolation ─────────────────────
const T8 = 'transactions-and-isolation';

add(T8, 'basic', 'autocommit',
	'With MySQL defaults, you run an UPDATE without START TRANSACTION. What happens to it?',
	'It runs in its own transaction and is committed immediately, because autocommit is on',
	['It waits in a pending state until you type COMMIT',
	 'It is applied only to your session and becomes visible to others after a minute',
	 'It is rejected, because InnoDB only accepts data changes inside an explicit transaction'],
	'autocommit is on by default, so each statement is its own transaction that commits at once. Use START TRANSACTION (or BEGIN) to group several statements, then COMMIT or ROLLBACK. There is no delayed visibility, and single statements are accepted outside explicit transactions.');

add(T8, 'basic', 'default-isolation',
	'Which transaction isolation level does InnoDB use by default?',
	'REPEATABLE READ',
	['READ COMMITTED, as in most other relational databases',
	 'SERIALIZABLE, because InnoDB prioritises safety over speed',
	 'READ UNCOMMITTED, because dirty reads are fastest'],
	'InnoDB defaults to REPEATABLE READ, which differs from PostgreSQL and Oracle where READ COMMITTED is the default. You can change it per session or globally with transaction_isolation. SERIALIZABLE exists but is not the default, and READ UNCOMMITTED allows dirty reads and is rarely appropriate.');

add(T8, 'mid', 'snapshot',
	'In REPEATABLE READ, transaction A runs SELECT COUNT(*) FROM orders twice. Between the two reads, transaction B inserts a row and commits. What does A\'s second plain SELECT return?',
	'The same count as the first, because A keeps reading from the snapshot taken at its first read',
	['The new count, because committed rows are always visible to everyone immediately',
	 'An error, because the table changed under an open transaction',
	 'The new count minus one, because InnoDB hides the most recent commit from open transactions'],
	'Under REPEATABLE READ a consistent read uses a snapshot established at the first read, so A does not see B\'s later commits, which also prevents phantom rows for plain SELECTs. Under READ COMMITTED each statement gets a fresh snapshot and A would see the new row. Nothing errors and nothing is partially hidden.');

add(T8, 'basic', 'read-committed',
	'How does READ COMMITTED differ from REPEATABLE READ in InnoDB?',
	'Each statement sees the latest committed data, so two identical SELECTs in a transaction can differ',
	['READ COMMITTED lets a transaction read the uncommitted changes that other transactions have not saved yet',
	 'READ COMMITTED takes a table lock at the start of every transaction',
	 'They behave the same for reads and differ only in how deadlocks are reported'],
	'READ COMMITTED builds a new snapshot per statement, so committed changes by others appear between statements (non-repeatable reads). It never exposes uncommitted data; that is READ UNCOMMITTED. It does not lock tables either. REPEATABLE READ keeps one snapshot for the whole transaction.');

add(T8, 'mid', 'implicit-commit',
	'Inside an open transaction you run ALTER TABLE users ADD COLUMN nickname VARCHAR(50), then ROLLBACK. What happens?',
	'ALTER TABLE caused an implicit commit, so the earlier changes are saved and ROLLBACK has nothing to undo',
	['Everything is rolled back, including the new column, because InnoDB DDL statements are fully transactional',
	 'Only the new column is rolled back; the earlier row changes stay committed',
	 'The ALTER TABLE is queued until COMMIT, and the ROLLBACK cancels it'],
	'In MySQL, DDL statements such as ALTER, CREATE, DROP and TRUNCATE implicitly commit the open transaction first and cannot themselves be rolled back (they are atomic, but not transactional). That is a difference from PostgreSQL, which has transactional DDL. Run DDL outside business transactions.');

add(T8, 'advanced', 'deadlock',
	'Two transactions wait for rows the other holds, and InnoDB reports error 1213 Deadlock found to one of them. What should the application do?',
	'Treat it as retryable: InnoDB already rolled that transaction back, so rerun the whole transaction',
	['Rerun only the failed statement, because the rest of the transaction is still open',
	 'Raise innodb_lock_wait_timeout until the deadlock resolves itself',
	 'Give up permanently, because a deadlock means the data is corrupt'],
	'InnoDB detects the cycle immediately and rolls back one victim, so the whole transaction is gone and must be retried, ideally with a short random delay. Raising the lock wait timeout does not help since the wait is a cycle, not slowness. Deadlocks are normal under concurrency; reduce them by locking rows in a consistent order.');

add(T8, 'advanced', 'durability',
	'What does innodb_flush_log_at_trx_commit = 1, the default, guarantee?',
	'The redo log is flushed to disk at each commit, so a committed transaction survives a crash or power loss',
	['Every commit also copies the changed data pages to the table files before returning',
	 'Commits are batched and flushed once per second, so a crash or power failure may lose a second of recent data',
	 'The undo log is flushed at each commit so that rollbacks stay fast'],
	'With 1, InnoDB makes the redo log durable before reporting success, giving full ACID durability; data pages can be written later and recovered from the log. The other settings trade durability for speed: with 2, InnoDB writes the log at every commit but flushes it to disk only about once per second, so a mysqld crash loses nothing but an operating-system crash or power failure can lose about a second of commits; with 0, it both writes and flushes about once per second, so even a mysqld crash can lose about a second. Undo logs support rollback and consistent reads, not durability.');

add(T8, 'mid', 'for-update',
	'What does SELECT ... FOR UPDATE do inside a transaction?',
	'It reads the latest committed rows and locks them, so others cannot change them until you finish',
	['It reads from the transaction snapshot and leaves the rows unlocked so that other sessions can continue freely',
	 'It writes the selected rows into a temporary table that you can update later',
	 'It locks the entire table until the connection is closed'],
	'A locking read ignores the snapshot, reads the current committed version and places exclusive locks on the rows it touches (index records, with next-key locks under REPEATABLE READ). It is the standard way to read-then-write safely, for example when decrementing stock. Locks end at commit or rollback, not at disconnect.',
	`START TRANSACTION;
SELECT stock FROM products WHERE id = 7 FOR UPDATE;
UPDATE products SET stock = stock - 1 WHERE id = 7;
COMMIT;`);

// ───────────────────── locking-and-gap-locks ─────────────────────
const T9 = 'locking-and-gap-locks';

add(T9, 'advanced', 'unindexed-lock',
	'Under REPEATABLE READ, an UPDATE\'s WHERE clause matches no index. What is the likely locking effect?',
	'It scans the whole table and locks every row it examines, which can block other writers like a table lock',
	['It locks only the rows that match the condition, because InnoDB row locks are always exact and never wider than the match',
	 'It takes no locks at all, because updates without an index run on the snapshot',
	 'It fails with an error, because UPDATE requires an index on the WHERE column'],
	'InnoDB locks index records, not just matching rows. With no usable index it has to scan the clustered index and lock each record (and gaps) it passes, so other transactions queue up. Adding an index on the WHERE column makes the locks precise. UPDATE works without an index and never runs lock-free.');

add(T9, 'advanced', 'gap-lock',
	'What is a gap lock in InnoDB?',
	'A lock on the space between index records, which blocks inserts into that range',
	['A lock on a deleted row that stays until the purge thread cleans it up',
	 'A lock that blocks only reads of the first row after a gap in AUTO_INCREMENT values',
	 'A lock held by the replica while it waits for missing binlog events'],
	'Gap locks cover ranges between index entries (or before the first or after the last) so a range query run twice cannot gain phantom rows. A next-key lock is a record lock plus the gap before it. They are why concurrent inserts into a range being scanned with FOR UPDATE can block. Replication and auto-increment have separate mechanisms.');

add(T9, 'advanced', 'rc-gap',
	'How does switching a transaction to READ COMMITTED change gap locking?',
	'Gap locking is mostly disabled for scans, so concurrent inserts block less, but phantom rows become possible',
	['It adds gap locks to every query, because committed reads need much stricter protection than repeatable reads do',
	 'It converts record locks into table locks, which are simpler to reason about',
	 'It makes no difference, because gap locks are independent of the isolation level'],
	'In READ COMMITTED InnoDB locks only the index records it uses and releases locks on non-matching rows, so gaps are not locked (except for foreign key and duplicate-key checks). That reduces blocking and deadlocks but lets phantoms appear between statements. Many high-concurrency apps choose it for that reason.');

add(T9, 'advanced', 'skip-locked',
	'Several workers pull jobs from a table, and each must take a different pending row without waiting for the others. Which MySQL 8 feature fits?',
	'SELECT ... FOR UPDATE SKIP LOCKED, which skips rows that another transaction has locked',
	['SELECT ... LOCK IN SHARE MODE, which lets everyone read the same row at once',
	 'SELECT ... FOR UPDATE with a higher innodb_lock_wait_timeout so every worker waits its turn',
	 'SELECT ... WITH NOLOCK, which reads rows while ignoring all locks'],
	'SKIP LOCKED (MySQL 8.0.1+) returns only rows not currently locked, making a table behave like a work queue, and NOWAIT fails instead of waiting. A shared lock mode would give two workers the same job to process, and waiting serialises the workers. WITH NOLOCK is SQL Server syntax, not MySQL.',
	`SELECT id FROM jobs
WHERE status = 'pending'
ORDER BY id LIMIT 1
FOR UPDATE SKIP LOCKED;`);

add(T9, 'advanced', 'lock-timeout',
	'A transaction waits for a row lock held by another session for longer than the default limit. What happens?',
	'After 50 seconds (innodb_lock_wait_timeout) the statement fails with error 1205, and the transaction stays open',
	['The waiting transaction is silently rolled back after one second and the client is never told, so retries happen invisibly',
	 'It waits forever, because InnoDB has no lock timeout',
	 'It steals the lock from the holder after 50 seconds'],
	'A lock wait times out after innodb_lock_wait_timeout (50 seconds by default) and the statement fails with 1205 Lock wait timeout exceeded. By default only that statement is rolled back, so the application must decide to roll back or retry. Unlike a deadlock, no cycle is involved and locks are never stolen.');

add(T9, 'advanced', 'metadata-lock',
	'A long-running open transaction has read from orders. Why can a later ALTER TABLE orders hang, and then block new queries on that table behind it?',
	'ALTER needs an exclusive metadata lock, so it waits for the open transaction while new queries queue behind it',
	['ALTER TABLE needs every row of the table locked, and the open transaction currently holds one of those rows as part of its snapshot',
	 'The binary log is single-threaded, so an ALTER cannot start while any transaction is open',
	 'InnoDB converts all open reads into write locks when a DDL statement arrives'],
	'Every statement takes a metadata lock on the tables it uses and holds it until the transaction ends. DDL needs an exclusive one, so it waits for the old transaction, and requests arriving after it queue behind it. The fix is to avoid idle open transactions and to run migrations with a lock timeout.');

// ───────────────────── replication-and-binlog ─────────────────────
const T10 = 'replication-and-binlog';

add(T10, 'basic', 'binlog',
	'What is the MySQL binary log (binlog) used for?',
	'It records changes to data, which replicas replay and which you can replay for point-in-time recovery',
	['It stores every SELECT query for auditing purposes and is required for the optimizer to work correctly at all',
	 'It stores the transaction snapshot that consistent reads use',
	 'It is a text log of connection errors that you read with the mysql client'],
	'The binlog is an ordered record of committed changes (not of reads). Replicas fetch it from the source and apply it, and after restoring a backup you can replay it up to a chosen moment. Consistent reads come from undo logs, and connection problems go to the error log.');

add(T10, 'basic', 'async-replication',
	'In default MySQL replication, when does the source report a commit as successful to the client?',
	'Without waiting for the replicas, because replication is asynchronous by default',
	['After every replica has applied the transaction, because replication is synchronous',
	 'After the next scheduled sync window, which defaults to once a minute',
	 'After a majority of replicas vote, because MySQL uses consensus by default'],
	'Standard replication is asynchronous: the source commits and returns, and replicas catch up afterwards, so a replica can be behind and a failed source can lose the last transactions. Semi-synchronous replication and Group Replication add acknowledgement or consensus, but they are opt-in.');

add(T10, 'mid', 'replica-lag',
	'A user updates their profile and the next page, served from a replica, shows the old value. What is happening and what is a common fix?',
	'Replica lag: the replica had not applied the change yet, so read from the primary after a write',
	['The primary lost the write, so the application must retry the UPDATE',
	 'The replica cache was not invalidated after the write, so restarting the replica server fixes it for good',
	 'Replicas always show data one hour old, so reads should be avoided during the day'],
	'Asynchronous replicas apply changes slightly after the primary, so a read right after a write can be stale. Typical remedies are reading from the primary for a short time after a write, or waiting for the replica to reach the write position (GTID). Replicas have no hour-long delay by default, and the primary did commit the write.');

add(T10, 'advanced', 'replication-threads',
	'Which two replica-side threads move a change from the source to the replica\'s tables?',
	'A receiver (I/O) thread copies binlog events into the relay log, and an applier (SQL) thread runs them',
	['A reader thread copies table files and a writer thread merges them into the replica',
	 'A heartbeat thread sends changes and a vote thread confirms each of them with all of the other replicas',
	 'The binlog dump thread on the replica pushes events back to the source for approval'],
	'The replica\'s I/O thread connects to the source, downloads binlog events and appends them to a local relay log; the SQL thread (applier) reads the relay log and executes the changes, possibly in parallel. The binlog dump thread lives on the source. Replication does not copy table files and has no voting in classic setups.');

add(T10, 'advanced', 'binlog-format',
	'What is the default binlog_format in MySQL 5.7.7 and later, including 8.x?',
	'ROW, which logs the actual changed rows rather than the statements',
	['STATEMENT, which logs the original SQL text and is more compact',
	 'MIXED, which switches between row and statement formats automatically',
	 'JSON, which logs each event as a document for easy parsing'],
	'Row-based logging is the default because it is deterministic: non-deterministic statements (functions like UUID() or SYSDATE(), UPDATE or DELETE with LIMIT but no ORDER BY) replicate correctly. Its cost is larger logs for statements that touch many rows. STATEMENT was the old default, MIXED is an option, and there is no JSON format.');

add(T10, 'advanced', 'semi-sync',
	'What does semi-synchronous replication add compared with asynchronous replication?',
	'The source waits for at least one replica to acknowledge that it received the transaction, but falls back to asynchronous replication if none answers within the timeout',
	['The source waits until every replica has applied the transaction and its data is queryable on all of them',
	 'The replicas wait for the source to confirm each of their reads',
	 'Commits are written to two tables on the source instead of one'],
	'With semi-sync, the source waits until one replica confirms it received the event (it is written to the replica\'s relay log), so the transaction exists on a second machine and a source crash is much less likely to lose it. The wait has a timeout (rpl_semi_sync_source_timeout, 10 seconds by default); if no replica acknowledges in time, the source falls back to asynchronous replication, so the guarantee is bounded, not absolute. It does not wait for the replica to apply the event, so the replica can still lag, and it does not wait for all replicas.');

add(T10, 'mid', 'read-scaling',
	'Adding more read replicas to a MySQL setup improves which kind of load?',
	'Read throughput, because reads can be spread across replicas, while every write still goes to the source',
	['Write throughput, because each replica accepts its own writes and syncs them back to the source afterwards',
	 'Both reads and writes equally, because the data is split between replicas',
	 'Neither, because replicas exist only as backups and cannot serve queries'],
	'In classic source-replica replication every replica applies all of the writes, so writes do not scale, but reads can be served by any of them. To scale writes you need sharding or a multi-writer design. Replicas can serve queries, and the data is copied rather than split.');

// ───────────────────── charset-and-collation ─────────────────────
const T11 = 'charset-and-collation';

add(T11, 'basic', 'utf8',
	'In MySQL, a column uses the character set called utf8. What happens when you insert a 4-byte character such as an emoji?',
	'It fails (or is cut off, depending on sql_mode), because utf8 allows only 3 bytes per character',
	['It is stored correctly, because utf8 is complete UTF-8 and supports every Unicode character, emoji included',
	 'It is stored as two characters, because MySQL splits it into two 3-byte halves',
	 'It is converted to a question mark on read, but the original bytes are kept in the file'],
	'MySQL\'s utf8 is an alias for utf8mb3, a legacy subset that only covers characters up to 3 bytes (the Basic Multilingual Plane). Emoji and many rarer characters need 4 bytes. Strict mode raises Incorrect string value; non-strict mode may cut the string at that character. utf8mb4 is the real UTF-8.');

add(T11, 'mid', 'default-collation',
	'What is the default character set and collation for new databases in MySQL 8.0?',
	'utf8mb4 with the utf8mb4_0900_ai_ci collation',
	['latin1 with latin1_swedish_ci, as in MySQL 5.7 and before',
	 'utf8mb3 with utf8mb3_general_ci',
	 'ascii with ascii_bin so that comparisons are fast'],
	'MySQL 8.0 changed the default from latin1 to utf8mb4 and the collation to utf8mb4_0900_ai_ci, which is accent-insensitive and case-insensitive. latin1 was the default in 5.7 and earlier, utf8mb3 is the legacy 3-byte set, and ascii would reject most non-English text.');

add(T11, 'basic', 'collation-ci',
	'With the default collation, what does SELECT * FROM users WHERE name = \'asha\' return for a row stored as Asha?',
	'The row matches, because collations ending in _ci compare text case-insensitively',
	['No row, because MySQL string comparison is always case-sensitive',
	 'An error, because the literal and the stored value have different cases',
	 'The row matches only if you wrap both sides in LOWER()'],
	'The _ci suffix means case-insensitive and _cs would mean case-sensitive, so \'asha\' = \'Asha\' is true by default, which can surprise people coming from other databases. For a case-sensitive comparison use a _bin or _cs collation, or the BINARY keyword. LOWER() is not needed for the match.');

add(T11, 'mid', 'accent-insensitive',
	'What does the ai in the collation utf8mb4_0900_ai_ci mean?',
	'Accent-insensitive: letters such as e and é compare as equal',
	['Auto-increment: the collation also numbers the rows that it sorts',
	 'ASCII-only: the collation rejects any character outside the ASCII range',
	 'Alphabetical index: the collation can only be used on indexed columns'],
	'The parts of the name are the Unicode version (0900 means UCA 9.0.0), then ai for accent-insensitive, then ci for case-insensitive. So a search for cafe also finds café. If accents must differ, use an _as_ collation such as utf8mb4_0900_as_cs. It has nothing to do with auto-increment, ASCII or indexes.');

add(T11, 'mid', 'collation-mix',
	'A join fails with Illegal mix of collations. What is the most likely cause?',
	'The two compared columns use different collations and MySQL cannot choose between them',
	['The tables are stored in different storage engines, so their strings cannot be compared',
	 'One of the columns is NULL, and NULL has no collation',
	 'The join column is not indexed, so MySQL refuses to compare strings'],
	'Each string column carries a collation, and comparing two with different, equally ranked collations is ambiguous. Fix it by converting one column to match, or by adding an explicit COLLATE to the expression. Storage engine, NULLs and missing indexes do not cause this error.');

add(T11, 'basic', 'varchar-length',
	'What does the 255 in VARCHAR(255) limit?',
	'The maximum number of characters, not bytes (so a utf8mb4 column can use up to 1020 bytes)',
	['The maximum number of bytes, so a utf8mb4 column holds at most 63 four-byte characters',
	 'The minimum length, because shorter values are padded with spaces',
	 'The number of rows that can share the same value in the column'],
	'In MySQL VARCHAR(n) counts characters in the column\'s character set. With utf8mb4 each character may take 1 to 4 bytes, so n characters can need up to 4n bytes, which matters for index key limits. VARCHAR is not padded (CHAR is) and n has nothing to do with duplicate rows.');

// ───────────────────── sql-mode-and-gotchas ─────────────────────
const T12 = 'sql-mode-and-gotchas';

add(T12, 'basic', 'query-cache',
	'A tuning guide tells you to enable the MySQL query cache. What is true in MySQL 8?',
	'The query cache was removed in 8.0, so the setting no longer exists; cache in the application',
	['It is on by default in 8.0 and caches every SELECT result until the table changes, so no tuning is needed',
	 'It still exists but only for MyISAM tables',
	 'It was replaced by the buffer pool, which now stores query results as text'],
	'The query cache was deprecated in 5.7 and removed in 8.0 because invalidating it on every write limited scalability. Caching of results now belongs in the application, Redis or similar. The buffer pool caches pages, not query results.');

add(T12, 'mid', 'truncate',
	'How does TRUNCATE TABLE differ from DELETE FROM table with no WHERE?',
	'TRUNCATE is DDL: it recreates the table, resets AUTO_INCREMENT, commits implicitly and cannot be rolled back',
	['TRUNCATE is slower because it logs every deleted row separately, but it can be rolled back like any other statement',
	 'TRUNCATE only removes the oldest half of the rows, so the table keeps its recent data',
	 'There is no difference; TRUNCATE is an alias for DELETE'],
	'TRUNCATE empties the table quickly by recreating it, which is why it resets the AUTO_INCREMENT counter, fires no row triggers and commits implicitly. DELETE removes rows one by one, supports WHERE and can be rolled back, but leaves the counter alone. Use TRUNCATE only when you are sure.');

add(T12, 'mid', 'strict-mode',
	'In MySQL 8 with default sql_mode, you insert 300 into a TINYINT column. What happens?',
	'The statement fails with an out-of-range error, because strict mode is on by default',
	['The value is silently clipped to 127 and a warning is added',
	 'The value wraps around and is stored as 44',
	 'The value is stored as NULL, because the column cannot hold 300'],
	'Since 5.7 the default sql_mode includes STRICT_TRANS_TABLES, so invalid or out-of-range data raises an error instead of being clipped. Older or non-strict setups silently clipped to the maximum (127) with a warning, which hid bugs. Wrapping and NULL conversion do not happen.');

add(T12, 'mid', 'case-sensitive-tables',
	'A query works on a developer\'s Mac but fails on the Linux server with Table \'app.Users\' doesn\'t exist, although the table is named users. Why?',
	'Table names map to files, so on Linux (default lower_case_table_names=0) they are case-sensitive, unlike macOS',
	['MySQL on Linux does not support tables whose names contain upper-case letters at all, so the name must be quoted',
	 'The Linux server uses MyISAM, which stores table names in upper case',
	 'Capitalised table names are cached for an hour and the cache was stale'],
	'Whether table and database names are case-sensitive depends on the operating system and lower_case_table_names. On Linux the default is case-sensitive, so Users and users are different names. Column and index names are always case-insensitive. Use lower-case names consistently to avoid the problem.');

add(T12, 'mid', 'upsert',
	'You want to insert a row, or update it if a row with the same unique key exists. Which MySQL statement does this in one step?',
	'INSERT ... ON DUPLICATE KEY UPDATE',
	['INSERT ... ON CONFLICT DO UPDATE',
	 'UPDATE ... OR INSERT',
	 'MERGE INTO ... WHEN MATCHED'],
	'ON DUPLICATE KEY UPDATE runs the update when the insert would violate a PRIMARY KEY or UNIQUE index. ON CONFLICT is PostgreSQL syntax and MERGE is standard SQL that MySQL does not implement. There is no UPDATE OR INSERT statement in MySQL.',
	`INSERT INTO stock (sku, qty) VALUES ('A1', 5)
ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty);`);

add(T12, 'advanced', 'replace-into',
	'What does REPLACE INTO do when the new row collides with an existing row on the primary key?',
	'It deletes the old row and inserts the new one, firing delete behaviour and possibly changing auto-increment ids',
	['It updates only the changed columns in place and keeps the original row, so no delete triggers or foreign key cascades run',
	 'It leaves the old row as it is and silently ignores the new one',
	 'It rejects the statement and returns a duplicate key error'],
	'REPLACE is delete plus insert, not an update. Triggers and ON DELETE CASCADE actions run for the deleted row, columns you did not mention reset to their defaults, and a new auto-increment id may be allocated. INSERT ... ON DUPLICATE KEY UPDATE updates in place, and INSERT IGNORE skips the new row.');

add(T12, 'mid', 'implicit-cast',
	'What does SELECT \'abc\' = 0 return in MySQL?',
	'1 (true), because the string is converted to a number and a non-numeric string becomes 0',
	['0 (false), because a string and a number can never be equal',
	 'An error, because MySQL does not compare text with numbers',
	 'NULL, because the comparison involves a value of a different type'],
	'When MySQL compares a string with a number it converts the string to a number, and \'abc\' becomes 0 (with a warning), so the comparison is true. This is a classic source of surprising matches, for example WHERE code = 0 matching every non-numeric code. Compare values of the same type, or cast explicitly.');

add(T12, 'basic', 'division',
	'What does SELECT 5 / 2 return in MySQL, and what does 5 DIV 2 return?',
	'2.5000 for 5 / 2 (a decimal result) and 2 for 5 DIV 2',
	['2 for both, because integer operands always give integer results',
	 '2 for 5 / 2 and 2.5 for 5 DIV 2',
	 'An error for 5 / 2, because MySQL requires you to use DIV for integers'],
	'The / operator always returns a DECIMAL or floating result in MySQL, with a few extra decimal places, so 5 / 2 is 2.5000. DIV is integer division and truncates to 2. This differs from languages and databases where / on two integers truncates, so check divisions in migrated code.');

export const mysqlQuestions = out;
