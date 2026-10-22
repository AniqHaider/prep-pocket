import type { Scene } from '../types';

/** MySQL animated lessons (ids my-*). Group = the id of the topic in src/db/mysql.ts. */
export const mysqlScenes: Scene[] = [
	// ───────── data-types-and-tables ─────────
	{
		id: 'my-auto-increment-gap',
		topic: 'mysql',
		group: 'data-types-and-tables',
		title: 'Why AUTO_INCREMENT leaves gaps',
		blurb: 'You rolled back, so why did id 3 never come back?',
		stage: { w: 360, h: 270 },
		nodes: [
			{ id: 'q', kind: 'text', x: 8, y: 18, text: 'INSERT INTO users (name) VALUES (...);', visible: true },
			{ id: 't', kind: 'table', x: 8, y: 34, title: 'users', colW: 84, cols: ['id', 'name'], rows: [['1', 'Asha'], ['2', 'Ben']], visible: true },
			{ id: 'ctr', kind: 'box', x: 208, y: 50, w: 144, h: 44, label: 'next id: 3', sub: 'AUTO_INCREMENT counter', visible: true },
			{ id: 'txa', kind: 'box', x: 208, y: 114, w: 144, h: 44, label: 'Session A', sub: 'transaction open' },
			{ id: 'note', kind: 'text', x: 8, y: 238, text: 'Ids are unique, not contiguous. Never use MAX(id) as a row count.', w: 316, size: 'sm' }
		],
		steps: [
			{ say: 'A users table with two rows. InnoDB keeps a counter that decides the next id to hand out.', focus: ['ctr'] },
			{ say: 'Session A starts a transaction and inserts Chen. The row gets id 3 and the counter moves on to 4.', show: ['txa'], set: { t: { rows: [['1', 'Asha'], ['2', 'Ben'], ['3', 'Chen']], hl: [2] }, ctr: { label: 'next id: 4' } }, pulse: ['ctr'] },
			{ say: 'Another session inserts Dara at the same time and gets id 4. The counter is handed out without waiting for A, so inserts never queue.', set: { t: { rows: [['1', 'Asha'], ['2', 'Ben'], ['3', 'Chen'], ['4', 'Dara']], hl: [3] }, ctr: { label: 'next id: 5' } } },
			{ say: 'Session A rolls back. Its row disappears, but the counter does not move backwards.', set: { t: { rows: [['1', 'Asha'], ['2', 'Ben'], ['4', 'Dara']], hl: [] }, txa: { tone: 'neg', sub: 'rolled back' } }, focus: ['txa'] },
			{ say: 'The next insert gets id 5. Id 3 is a permanent gap, and that is perfectly normal.', set: { t: { rows: [['1', 'Asha'], ['2', 'Ben'], ['4', 'Dara'], ['5', 'Esi']], hl: [3] }, ctr: { label: 'next id: 6', tone: 'accent' } } },
			{ say: 'So treat ids as unique labels, never as a count or a gapless sequence.', show: ['note'], focus: ['note'] }
		]
	},

	// ───────── select-and-filter ─────────
	{
		id: 'my-null-three-valued',
		topic: 'mysql',
		group: 'select-and-filter',
		title: 'NULL is not equal to anything',
		blurb: 'Why does WHERE col = NULL return nothing?',
		nodes: [
			{ id: 'q', kind: 'text', x: 8, y: 18, text: 'SELECT * FROM users WHERE deleted_at = NULL;', w: 316, visible: true },
			{
				id: 't', kind: 'table', x: 8, y: 34, title: 'users', colW: 88, visible: true, cols: ['id', 'name', 'deleted_at'],
				rows: [['1', 'Asha', 'NULL'], ['2', 'Ben', '2024-05-02'], ['3', 'Chen', 'NULL'], ['4', 'Dara', '2024-06-11']]
			},
			{ id: 'calc', kind: 'text', x: 8, y: 196, text: 'NULL = NULL  gives  unknown, not true', w: 316, tone: 'warn' },
			{ id: 'res', kind: 'box', x: 8, y: 212, w: 150, h: 34, label: 'Result: 0 rows', shape: 'pill', tone: 'neg' },
			{ id: 'tip', kind: 'text', x: 8, y: 276, text: 'Bonus: NULL <=> NULL is true. <=> is the null-safe equals.', w: 316, size: 'sm' }
		],
		steps: [
			{ say: 'Which users are not deleted? Their deleted_at is NULL, which means there is no value.', focus: ['t'] },
			{ say: 'The = operator compares two known values. NULL means unknown, so NULL = NULL is not true. It is unknown.', show: ['calc'], focus: ['calc'] },
			{ say: 'WHERE keeps only rows where the test is true. Unknown does not count, so every row is dropped.', show: ['res'], pulse: ['res'] },
			{ say: 'Use IS NULL instead. It asks directly whether the value is missing.', hide: ['calc'], set: { q: { text: 'SELECT * FROM users WHERE deleted_at IS NULL;' }, res: { label: 'Result: 0 rows', tone: 'neg' } }, focus: ['q'] },
			{ say: 'Now rows 1 and 3 match, because their deleted_at really is missing.', set: { t: { hl: [0, 2] }, res: { label: 'Result: 2 rows', tone: 'accent' } }, pulse: ['res'] },
			{ say: 'MySQL also has <=>, a null-safe equals where NULL <=> NULL is true. Handy for comparing two nullable columns.', show: ['tip'], focus: ['tip'] }
		]
	},

	// ───────── joins ─────────
	{
		id: 'my-left-join',
		topic: 'mysql',
		group: 'joins',
		title: 'LEFT JOIN keeps everyone',
		blurb: 'How do you list all customers, even those with no orders?',
		stage: { w: 360, h: 312 },
		nodes: [
			{ id: 'q', kind: 'text', x: 8, y: 20, text: 'SELECT c.name, o.id, o.total FROM customers c LEFT JOIN orders o ON o.customer_id = c.id;', w: 316, visible: true },
			{ id: 'c', kind: 'table', x: 8, y: 52, title: 'customers', colW: 56, cols: ['id', 'name'], rows: [['1', 'Asha'], ['2', 'Ben'], ['3', 'Chen']], visible: true },
			{ id: 'o', kind: 'table', x: 140, y: 52, title: 'orders', colW: 56, cols: ['id', 'cust', 'total'], rows: [['10', '1', '25.00'], ['11', '1', '8.50'], ['12', '3', '40.00']], visible: true },
			{ id: 'r', kind: 'table', x: 8, y: 178, title: 'result', colW: 70, cols: ['name', 'order', 'total'], rows: [], hl: [] }
		],
		steps: [
			{ say: 'We want every customer, with their orders when they have any. Ben has never ordered.', focus: ['c'] },
			{ say: 'MySQL takes the first customer, Asha, and looks for orders whose customer id is 1.', show: ['r'], set: { c: { hl: [0] }, o: { hl: [0, 1] } } },
			{ say: 'Asha matches two orders, so she appears twice in the result, once per order.', set: { r: { rows: [['Asha', '10', '25.00'], ['Asha', '11', '8.50']] } } },
			{ say: 'Ben matches nothing. Because this is a LEFT JOIN, Ben is kept anyway, with NULL in the order columns.', set: { c: { hl: [1] }, o: { hl: [] }, r: { rows: [['Asha', '10', '25.00'], ['Asha', '11', '8.50'], ['Ben', 'NULL', 'NULL']], hl: [2] } } },
			{ say: 'Chen has one order, so one more row.', set: { c: { hl: [2] }, o: { hl: [2] }, r: { rows: [['Asha', '10', '25.00'], ['Asha', '11', '8.50'], ['Ben', 'NULL', 'NULL'], ['Chen', '12', '40.00']], hl: [3] } } },
			{ say: 'An INNER JOIN would have dropped Ben. LEFT JOIN is how you list everyone and spot who has no orders yet.', set: { c: { hl: [] }, o: { hl: [] }, r: { hl: [2] } }, focus: ['r'] }
		]
	},
	{
		id: 'my-on-vs-where',
		topic: 'mysql',
		group: 'joins',
		title: 'ON versus WHERE in a LEFT JOIN',
		blurb: 'Why did my LEFT JOIN lose the customers with no match?',
		nodes: [
			{ id: 'q', kind: 'text', x: 8, y: 16, text: "... LEFT JOIN orders o ON o.customer_id = c.id WHERE o.status = 'paid'", w: 316, visible: true },
			{
				id: 't', kind: 'table', x: 8, y: 70, title: 'rows after the join', colW: 80, cols: ['name', 'order', 'status'], visible: true,
				rows: [['Asha', '10', 'paid'], ['Asha', '11', 'open'], ['Ben', 'NULL', 'NULL'], ['Chen', '12', 'paid']]
			},
			{ id: 'why', kind: 'text', x: 8, y: 232, text: "NULL = 'paid' is unknown, so Ben's row is dropped.", w: 316, tone: 'neg' },
			{ id: 'ok', kind: 'text', x: 8, y: 276, text: 'ON decides which orders match. WHERE removes whole rows.', w: 316, size: 'sm' }
		],
		steps: [
			{ say: 'Goal: all customers, plus only their paid orders. First the join runs and keeps every customer, even Ben with NULLs.', focus: ['t'] },
			{ say: "Then WHERE o.status = 'paid' is applied to the joined rows, one by one.", set: { t: { hl: [0, 3] } } },
			{ say: "Ben's status is NULL, which is not equal to 'paid', so his row is thrown away. The LEFT JOIN has quietly become an inner join.", show: ['why'], set: { t: { rows: [['Asha', '10', 'paid'], ['Chen', '12', 'paid']], hl: [] } }, pulse: ['why'] },
			{ say: "The fix: move the condition into ON, so it decides which orders match instead of which rows survive.", hide: ['why'], set: { q: { text: "... LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid'" }, t: { rows: [['Asha', '10', 'paid'], ['Asha', '11', 'open'], ['Ben', 'NULL', 'NULL'], ['Chen', '12', 'paid']], hl: [] } }, focus: ['q'] },
			{ say: 'Now the open order simply does not match. Asha keeps only the paid one, and Ben stays with NULLs.', set: { t: { rows: [['Asha', '10', 'paid'], ['Ben', 'NULL', 'NULL'], ['Chen', '12', 'paid']], hl: [1] } } },
			{ say: 'Rule of thumb: for the optional side of a LEFT JOIN, filter in ON. Filter in WHERE only when you want rows removed.', show: ['ok'], focus: ['ok'] }
		]
	},

	// ───────── grouping-and-aggregates ─────────
	{
		id: 'my-where-vs-having',
		topic: 'mysql',
		group: 'grouping-and-aggregates',
		title: 'WHERE first, HAVING after grouping',
		blurb: 'Which filter runs before the groups exist?',
		nodes: [
			{ id: 'q', kind: 'text', x: 8, y: 20, text: "SELECT cust, COUNT(*) FROM orders WHERE status = 'paid' GROUP BY cust HAVING COUNT(*) >= 2;", w: 316, visible: true },
			{
				id: 'o', kind: 'table', x: 8, y: 54, title: 'orders', colW: 56, cols: ['cust', 'status'], visible: true,
				rows: [['A', 'paid'], ['A', 'paid'], ['A', 'open'], ['B', 'paid'], ['B', 'open'], ['C', 'paid'], ['C', 'paid']]
			},
			{ id: 'g', kind: 'table', x: 180, y: 54, title: 'groups', colW: 56, cols: ['cust', 'count'], rows: [['A', '2'], ['B', '1'], ['C', '2']] },
			{ id: 'tip', kind: 'text', x: 8, y: 276, text: 'Row conditions go in WHERE, group conditions in HAVING.', w: 316, size: 'sm' }
		],
		steps: [
			{ say: 'Seven orders. We want customers with at least two paid orders.', focus: ['o'] },
			{ say: 'WHERE runs first, row by row. Orders that are not paid are dropped before any grouping happens.', set: { o: { hl: [0, 1, 3, 5, 6] } } },
			{ say: 'GROUP BY gathers the surviving rows by customer: A has 2 paid orders, B has 1, C has 2.', show: ['g'], pulse: ['g'] },
			{ say: 'HAVING runs after grouping, so it can test the count. B has only 1, so that whole group is dropped.', set: { g: { hl: [0, 2] } }, focus: ['g'] },
			{ say: 'Only A and C remain. WHERE also shrinks the work early, which is why row filters belong there.', set: { g: { rows: [['A', '2'], ['C', '2']], hl: [] } }, show: ['tip'] }
		]
	},

	// ───────── innodb-and-clustered-index ─────────
	{
		id: 'my-clustered-index',
		topic: 'mysql',
		group: 'innodb-and-clustered-index',
		title: 'The primary key is the table',
		blurb: 'Where does InnoDB actually keep your rows?',
		nodes: [
			{ id: 'q', kind: 'text', x: 8, y: 18, text: 'SELECT * FROM users WHERE id = 5;', w: 316 },
			{ id: 'root', kind: 'box', x: 120, y: 36, w: 120, h: 34, label: 'keys: 4 | 7', shape: 'pill', visible: true },
			{ id: 'l1', kind: 'box', x: 8, y: 138, w: 104, h: 76, label: 'id 1  Asha\nid 2  Ben\nid 3  Chen' },
			{ id: 'l2', kind: 'box', x: 128, y: 138, w: 104, h: 76, label: 'id 4  Dara\nid 5  Esi\nid 6  Farid' },
			{ id: 'l3', kind: 'box', x: 248, y: 138, w: 104, h: 76, label: 'id 7  Gita\nid 8  Hugo\nid 9  Ines' },
			{ id: 'e1', kind: 'edge', from: 'root', to: 'l1' },
			{ id: 'e2', kind: 'edge', from: 'root', to: 'l2' },
			{ id: 'e3', kind: 'edge', from: 'root', to: 'l3' },
			{ id: 'tok', kind: 'token', x: 180, y: 86 },
			{ id: 'hint', kind: 'text', x: 8, y: 250, text: 'Leaf pages hold whole rows, sorted by primary key.', w: 316, size: 'sm' }
		],
		steps: [
			{ say: 'In InnoDB there is no separate pile of rows. The primary key is the table: a B-tree whose bottom level holds the rows.', focus: ['root'] },
			{ say: 'The rows sit in leaf pages, sorted by primary key. The upper levels only hold keys that point to the right page.', show: ['l1', 'l2', 'l3', 'e1', 'e2', 'e3', 'hint'], focus: ['l1', 'l2', 'l3'] },
			{ say: 'A lookup by primary key walks from the top to one leaf page and finds the whole row in one go. No second step.', show: ['q', 'tok'], move: { tok: { x: 180, y: 104 } }, focus: ['root'] },
			{ say: 'Id 5 is bigger than 4 and smaller than 7, so the middle page is the one.', move: { tok: { x: 180, y: 126 } }, set: { l2: { tone: 'accent' } }, pulse: ['l2'] },
			{ say: 'A range such as id between 4 and 9 reads neighbouring pages in order, because nearby ids are stored together.', set: { q: { text: 'SELECT * FROM users WHERE id BETWEEN 4 AND 9;' }, l3: { tone: 'accent' } }, hide: ['tok'], focus: ['l2', 'l3'] },
			{ say: 'That is why a short, ever-growing key like AUTO_INCREMENT is ideal: new rows append at the right edge instead of splitting pages in the middle.', set: { l1: { tone: 'neutral' }, l2: { tone: 'neutral' }, l3: { label: 'id 7  Gita\nid 8  Hugo\nid 9  Ines', tone: 'accent' } }, focus: ['l3'] }
		]
	},

	// ───────── secondary-indexes ─────────
	{
		id: 'my-secondary-lookup',
		topic: 'mysql',
		group: 'secondary-indexes',
		title: 'A secondary index needs two hops',
		blurb: 'Why does a normal index lookup read two B-trees?',
		nodes: [
			{ id: 'q', kind: 'text', x: 8, y: 18, text: "SELECT name, city FROM users WHERE email = 'ben@x.io';", w: 316, visible: true },
			{ id: 'idx', kind: 'doc', x: 8, y: 64, w: 150, title: 'index on email', lines: ['asha@x.io  id 1', 'ben@x.io  id 2', 'chen@x.io  id 3'] },
			{ id: 'cl', kind: 'doc', x: 202, y: 64, w: 150, title: 'clustered index', lines: ['1  Asha  Pune', '2  Ben  Leeds', '3  Chen  Oslo'] },
			{ id: 'hop', kind: 'edge', from: 'idx', to: 'cl', label: 'id 2', tone: 'accent' },
			{ id: 'tok', kind: 'token', x: 83, y: 168, label: 'ben@x.io' },
			{ id: 'cov', kind: 'text', x: 8, y: 236, text: 'If the query needed only email and id, step one would be enough. That is a covering index.', w: 316, size: 'sm' }
		],
		steps: [
			{ say: 'The query filters on email, so MySQL uses the secondary index on email.', show: ['idx', 'tok'], focus: ['idx'] },
			{ say: 'Index entries are sorted by email. MySQL finds ben@x.io and reads what is stored beside it: the primary key value 2, not the row.', set: { idx: { hl: [1] } }, pulse: ['idx'] },
			{ say: 'The query also wants name and city, which live only in the row. So MySQL takes the id to the clustered index.', show: ['cl', 'hop'], focus: ['cl'] },
			{ say: 'A second tree walk finds the row for id 2. That extra hop is the price of a secondary index.', set: { cl: { hl: [1] } }, move: { tok: { x: 277, y: 168 } }, pulse: ['cl'] },
			{ say: 'Selecting only columns that are inside the index avoids the second hop entirely.', show: ['cov'], focus: ['cov'] }
		]
	},
	{
		id: 'my-covering-index',
		topic: 'mysql',
		group: 'secondary-indexes',
		title: 'A covering index skips the table',
		blurb: 'When can MySQL answer from the index alone?',
		nodes: [
			{ id: 'q', kind: 'text', x: 8, y: 16, text: 'SELECT customer_id, created_at FROM orders WHERE customer_id = 7;', w: 316, visible: true },
			{ id: 'idx', kind: 'doc', x: 8, y: 66, w: 250, title: 'index (customer_id, created_at)', lines: ['5  2024-02-01  id 40', '7  2024-01-03  id 12', '7  2024-03-09  id 31', '9  2024-02-20  id 22'], visible: true },
			{ id: 'tbl', kind: 'box', x: 110, y: 208, w: 140, h: 52, label: 'orders table', sub: 'not read' },
			{ id: 'go', kind: 'edge', from: 'idx', to: 'tbl', label: 'fetch row', tone: 'warn' },
			{ id: 'extra', kind: 'text', x: 8, y: 282, text: 'EXPLAIN Extra: Using index', w: 316, tone: 'accent' }
		],
		steps: [
			{ say: 'The query asks only for customer_id and created_at of customer 7. An index covers exactly those two columns.', focus: ['idx'] },
			{ say: 'MySQL seeks into the index to customer 7 and finds two entries.', set: { idx: { hl: [1, 2] } } },
			{ say: 'Both columns the query needs are right there in the index entries. Nothing else is required.', pulse: ['idx'] },
			{ say: 'So the table rows are never touched. EXPLAIN shows Using index in the Extra column.', show: ['tbl', 'extra'], set: { tbl: { tone: 'neutral' } }, focus: ['extra'] },
			{ say: 'Now ask for total as well. The index does not hold it, so MySQL must visit the table row for every match again.', set: { q: { text: 'SELECT customer_id, created_at, total FROM orders WHERE customer_id = 7;' }, tbl: { tone: 'warn', sub: 'one visit per row' } }, show: ['go'], hide: ['extra'], pulse: ['tbl'] }
		]
	},

	// ───────── explain-and-optimizer ─────────
	{
		id: 'my-explain-scan-vs-ref',
		topic: 'mysql',
		group: 'explain-and-optimizer',
		title: 'Reading EXPLAIN: scan or lookup?',
		blurb: 'How do you tell a slow plan from a fast one?',
		nodes: [
			{ id: 'q', kind: 'text', x: 8, y: 18, text: 'EXPLAIN SELECT * FROM orders WHERE customer_id = 7;', w: 316, visible: true },
			{ id: 'ex', kind: 'table', x: 8, y: 36, title: 'EXPLAIN output', colW: 112, cols: ['type', 'key', 'rows'], rows: [['ALL', 'NULL', '98420']] },
			{ id: 'cmd', kind: 'text', x: 8, y: 160, text: 'CREATE INDEX idx_customer ON orders (customer_id);', w: 316, size: 'md' },
			{ id: 'tip', kind: 'text', x: 8, y: 220, text: 'possible_keys: what MySQL could use. key: what it chose. rows: an estimate, not a measurement.', w: 316, size: 'sm' },
			{ id: 'an', kind: 'text', x: 8, y: 270, text: 'EXPLAIN ANALYZE (8.0.18+) really runs the query and shows measured times.', w: 316, size: 'sm' }
		],
		steps: [
			{ say: 'EXPLAIN shows the plan MySQL would use, without running the query. Let us read it.', focus: ['q'] },
			{ say: 'type ALL means a full table scan. key is NULL, so no index is used. rows is the estimate: about 98 thousand rows to read.', show: ['ex'], set: { ex: { tone: 'warn' } }, pulse: ['ex'] },
			{ say: 'The filter is on customer_id, which has no index. Let us add one.', show: ['cmd'], focus: ['cmd'] },
			{ say: 'Now type is ref, an index lookup for one value. key names the chosen index, and the row estimate drops to about 12.', set: { ex: { rows: [['ref', 'idx_customer', '12']], tone: 'accent' } }, pulse: ['ex'] },
			{ say: 'Check three columns first: possible_keys versus key, the type, and rows. They show whether an index is really used.', show: ['tip'], focus: ['ex'] },
			{ say: 'For real timings and actual row counts, use EXPLAIN ANALYZE. It executes the statement, so use it with care.', show: ['an'], focus: ['an'] }
		]
	},

	// ───────── transactions-and-isolation ─────────
	{
		id: 'my-commit-rollback',
		topic: 'mysql',
		group: 'transactions-and-isolation',
		title: 'What commit and rollback really do',
		blurb: 'How does InnoDB undo a change, or keep it after a crash?',
		stage: { w: 360, h: 276 },
		nodes: [
			{ id: 'q', kind: 'text', x: 8, y: 18, text: 'UPDATE accounts SET balance = 90 WHERE id = 1;', w: 316, visible: true },
			{ id: 'row', kind: 'doc', x: 8, y: 56, w: 150, title: 'accounts (in memory)', lines: ['id 1   balance 100'], visible: true },
			{ id: 'undo', kind: 'box', x: 204, y: 56, w: 148, h: 52, label: 'Undo log', sub: 'old value: 100' },
			{ id: 'redo', kind: 'box', x: 204, y: 156, w: 148, h: 52, label: 'Redo log', sub: 'new value: 90' },
			{ id: 'e1', kind: 'edge', from: 'row', to: 'undo', label: 'save old' },
			{ id: 'e2', kind: 'edge', from: 'row', to: 'redo', label: 'log new' },
			{ id: 'end', kind: 'text', x: 8, y: 256, text: '', w: 316, size: 'md' }
		],
		steps: [
			{ say: 'Account 1 has a balance of 100, and a transaction subtracts 10. The row lives in a page in memory.', focus: ['row'] },
			{ say: 'Before changing anything, InnoDB saves the old value in the undo log. That is what makes rollbacks and old snapshots possible.', show: ['undo', 'e1'], pulse: ['undo'] },
			{ say: 'Then it changes the row to 90 in memory. Other sessions still read the old value from the undo log until commit.', set: { row: { lines: ['id 1   balance 90'], hl: [0] } } },
			{ say: 'The change is also appended to the redo log, a sequential file on disk, which is cheap to write.', show: ['redo', 'e2'], pulse: ['redo'] },
			{ say: 'COMMIT flushes the redo log to disk (the default setting). Once that finishes, the change survives a crash.', set: { redo: { tone: 'accent', sub: 'flushed at commit' }, end: { text: 'COMMIT: durable even if the server dies now.', tone: 'accent' } }, show: ['end'], focus: ['redo'] },
			{ say: 'Had we rolled back instead, InnoDB would apply the undo log and the balance would be 100 again.', set: { row: { lines: ['id 1   balance 100'], hl: [] }, undo: { tone: 'accent' }, redo: { tone: 'neutral', sub: 'rollback logged too' }, end: { text: 'ROLLBACK: the undo log restores the old value.', tone: 'warn' } }, focus: ['undo'] }
		]
	},
	{
		id: 'my-repeatable-read',
		topic: 'mysql',
		group: 'transactions-and-isolation',
		title: 'Repeatable read: a frozen view',
		blurb: 'Why does my second SELECT ignore a row someone just committed?',
		stage: { w: 360, h: 324 },
		nodes: [
			{ id: 'ha', kind: 'text', x: 8, y: 20, text: 'Session A', visible: true },
			{ id: 'hb', kind: 'text', x: 192, y: 20, text: 'Session B', visible: true },
			{ id: 'a1', kind: 'box', x: 8, y: 34, w: 160, h: 40, label: 'BEGIN', sub: 'snapshot at first read' },
			{ id: 'a2', kind: 'box', x: 8, y: 92, w: 160, h: 40, label: 'SELECT COUNT(*)', sub: 'returns 5' },
			{ id: 'b1', kind: 'box', x: 192, y: 126, w: 160, h: 40, label: 'INSERT; COMMIT', sub: 'table now has 6' },
			{ id: 'a3', kind: 'box', x: 8, y: 184, w: 160, h: 40, label: 'SELECT COUNT(*)', sub: 'still returns 5', tone: 'accent' },
			{ id: 'alt', kind: 'box', x: 8, y: 240, w: 160, h: 40, label: 'under READ COMMITTED', sub: 'would return 6', tone: 'warn' },
			{ id: 'a4', kind: 'box', x: 192, y: 240, w: 160, h: 40, label: 'COMMIT, then SELECT', sub: 'new snapshot: 6' }
		],
		steps: [
			{ say: 'Session A starts a transaction. In REPEATABLE READ, its snapshot of the data is fixed at its first read.', show: ['a1'], focus: ['a1'] },
			{ say: 'A counts the orders and gets 5.', show: ['a2'], pulse: ['a2'] },
			{ say: 'Meanwhile session B inserts an order and commits. The table now really holds 6 rows.', show: ['b1'], pulse: ['b1'] },
			{ say: 'A counts again and still gets 5. A plain SELECT keeps reading from its snapshot, so B\'s commit stays invisible.', show: ['a3'], pulse: ['a3'] },
			{ say: 'Under READ COMMITTED, each statement takes a fresh snapshot, so the second count would have returned 6.', show: ['alt'], focus: ['alt'] },
			{ say: 'After A commits, its next transaction takes a new snapshot and sees all 6 rows.', show: ['a4'], focus: ['a4'] }
		]
	},

	// ───────── locking-and-gap-locks ─────────
	{
		id: 'my-gap-lock',
		topic: 'mysql',
		group: 'locking-and-gap-locks',
		title: 'A gap lock blocks an insert',
		blurb: 'How can locking a range with no rows stop someone inserting?',
		nodes: [
			{ id: 'r10', kind: 'box', x: 14, y: 36, w: 64, h: 40, label: 'id 10', visible: true },
			{ id: 'g1', kind: 'box', x: 84, y: 36, w: 62, h: 40, label: 'gap', shape: 'pill', visible: true },
			{ id: 'r20', kind: 'box', x: 152, y: 36, w: 64, h: 40, label: 'id 20', visible: true },
			{ id: 'g2', kind: 'box', x: 222, y: 36, w: 62, h: 40, label: 'gap', shape: 'pill', visible: true },
			{ id: 'r30', kind: 'box', x: 290, y: 36, w: 64, h: 40, label: 'id 30', visible: true },
			{ id: 'a', kind: 'box', x: 8, y: 140, w: 164, h: 56, label: 'Session A', sub: 'FOR UPDATE, ids 11 to 19' },
			{ id: 'b', kind: 'box', x: 188, y: 140, w: 164, h: 56, label: 'Session B', sub: 'INSERT id 15' },
			{ id: 'blk', kind: 'edge', from: 'b', to: 'g1', label: 'blocked', tone: 'neg' },
			{ id: 'note', kind: 'text', x: 8, y: 240, text: 'Under READ COMMITTED gap locks are mostly off, so B would go through.', w: 316, size: 'sm' }
		],
		steps: [
			{ say: 'An index holds ids 10, 20 and 30. The empty spaces between them are called gaps.', focus: ['g1', 'g2'] },
			{ say: 'Session A runs SELECT ... WHERE id BETWEEN 11 AND 19 FOR UPDATE. No row matches that range.', show: ['a'], focus: ['a'] },
			{ say: 'Under REPEATABLE READ, InnoDB still locks the gap between 10 and 20, so no row can appear in that range.', set: { g1: { tone: 'warn', label: 'locked' } }, pulse: ['g1'] },
			{ say: 'Session B tries to INSERT id 15 and has to wait.', show: ['b', 'blk'], set: { b: { tone: 'neg' } }, focus: ['b'] },
			{ say: 'B continues only when A commits or rolls back, or when the 50 second lock wait timeout fires.', set: { b: { sub: 'waiting for A' } } },
			{ say: 'This protects A from phantom rows. The cost is blocked inserts, which is why many apps pick READ COMMITTED.', show: ['note'], focus: ['note'] }
		]
	},
	{
		id: 'my-deadlock',
		topic: 'mysql',
		group: 'locking-and-gap-locks',
		title: 'How a deadlock forms',
		blurb: 'Two transactions wait for each other forever: what does InnoDB do?',
		stage: { w: 360, h: 300 },
		nodes: [
			{ id: 'r1', kind: 'box', x: 140, y: 18, w: 80, h: 38, label: 'row 1', visible: true },
			{ id: 'r2', kind: 'box', x: 140, y: 238, w: 80, h: 38, label: 'row 2', visible: true },
			{ id: 'a', kind: 'box', x: 8, y: 118, w: 86, h: 46, label: 'A', sub: 'transaction', visible: true },
			{ id: 'b', kind: 'box', x: 266, y: 118, w: 86, h: 46, label: 'B', sub: 'transaction', visible: true },
			{ id: 'ar1', kind: 'edge', from: 'a', to: 'r1', label: 'holds', tone: 'accent' },
			{ id: 'br2', kind: 'edge', from: 'b', to: 'r2', label: 'holds', tone: 'accent' },
			{ id: 'ar2', kind: 'edge', from: 'a', to: 'r2', label: 'wants', tone: 'warn', dashed: true },
			{ id: 'br1', kind: 'edge', from: 'b', to: 'r1', label: 'wants', tone: 'warn', dashed: true }
		],
		steps: [
			{ say: 'Two transactions, A and B, will each need to update row 1 and row 2, but in opposite orders.', focus: ['a', 'b'] },
			{ say: 'A updates row 1 first and holds its lock until it finishes.', show: ['ar1'], pulse: ['r1'] },
			{ say: 'B updates row 2 first and holds that lock.', show: ['br2'], pulse: ['r2'] },
			{ say: 'A now wants row 2, which B holds, so A waits.', show: ['ar2'], set: { a: { tone: 'warn', sub: 'waiting' } } },
			{ say: 'B wants row 1, which A holds. Each waits for the other and neither can ever finish. That is a deadlock.', show: ['br1'], set: { b: { tone: 'warn', sub: 'waiting' } }, focus: ['a', 'b'] },
			{ say: 'InnoDB spots the cycle straight away and rolls one transaction back with error 1213. The other one carries on.', set: { b: { tone: 'neg', sub: 'rolled back' }, a: { tone: 'accent', sub: 'continues' } }, hide: ['br2', 'br1', 'ar2'] },
			{ say: 'Retry the failed transaction. To make deadlocks rare, update rows in the same order everywhere.', focus: ['b'] }
		]
	},

	// ───────── replication-and-binlog ─────────
	{
		id: 'my-replication-flow',
		topic: 'mysql',
		group: 'replication-and-binlog',
		title: 'How a change reaches the replica',
		blurb: 'What happens between a write on the primary and the replica?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'p', kind: 'db', x: 124, y: 10, w: 112, h: 44, label: 'Primary', visible: true },
			{ id: 'bl', kind: 'box', x: 120, y: 80, w: 120, h: 34, label: 'Binary log' },
			{ id: 'rl', kind: 'box', x: 120, y: 140, w: 120, h: 34, label: 'Relay log' },
			{ id: 'r', kind: 'db', x: 124, y: 200, w: 112, h: 44, label: 'Replica' },
			{ id: 'e1', kind: 'edge', from: 'p', to: 'bl', label: 'append' },
			{ id: 'e2', kind: 'edge', from: 'bl', to: 'rl', label: 'copy' },
			{ id: 'e3', kind: 'edge', from: 'rl', to: 'r', label: 'apply' },
			{ id: 'tok', kind: 'token', x: 36, y: 32, label: 'write' },
			{ id: 'note', kind: 'text', x: 8, y: 276, text: 'Asynchronous: the primary does not wait. The replica is always a little behind.', w: 316, size: 'sm' }
		],
		steps: [
			{ say: 'A client writes to the primary. The primary applies the change to its own tables.', show: ['tok'], focus: ['p'] },
			{ say: 'It also appends the change to the binary log, an ordered record of every committed change.', show: ['bl', 'e1'], move: { tok: { x: 36, y: 97 } }, pulse: ['bl'] },
			{ say: 'On the replica, the receiver thread (I/O thread) connects to the primary and copies new binlog events over the network.', show: ['rl', 'e2'], focus: ['e2'] },
			{ say: 'The events land in the replica\'s relay log, a local queue of changes waiting to be applied.', move: { tok: { x: 36, y: 157 } }, pulse: ['rl'] },
			{ say: 'The applier thread (SQL thread) runs them on the replica, so its tables follow the primary\'s.', show: ['r', 'e3'], move: { tok: { x: 36, y: 222 } }, set: { tok: { tone: 'accent' } }, pulse: ['r'] },
			{ say: 'Replication is asynchronous by default: the primary told the client OK without waiting for any of this. The replica trails slightly.', show: ['note'], focus: ['note'] }
		]
	},
	{
		id: 'my-replica-lag',
		topic: 'mysql',
		group: 'replication-and-binlog',
		title: 'Replica lag: reading your own write',
		blurb: 'Why does the page show the old value right after saving?',
		nodes: [
			{ id: 'app', kind: 'box', x: 120, y: 14, w: 120, h: 44, label: 'App', sub: 'profile page', visible: true },
			{ id: 'p', kind: 'db', x: 14, y: 150, w: 112, h: 44, label: 'Primary', visible: true },
			{ id: 'r', kind: 'db', x: 234, y: 150, w: 112, h: 44, label: 'Replica', visible: true },
			{ id: 'pv', kind: 'box', x: 14, y: 220, w: 112, h: 34, label: 'name: Asha', visible: true },
			{ id: 'rv', kind: 'box', x: 234, y: 220, w: 112, h: 34, label: 'name: Asha', visible: true },
			{ id: 'w', kind: 'edge', from: 'app', to: 'p', label: 'write', tone: 'accent' },
			{ id: 'rep', kind: 'edge', from: 'p', to: 'r', label: 'replicating', dashed: true },
			{ id: 'rd', kind: 'edge', from: 'app', to: 'r', label: 'read', tone: 'warn' },
			{ id: 'shows', kind: 'text', x: 8, y: 282, text: 'The page shows Asha, not Asha K.', w: 316, tone: 'warn' }
		],
		steps: [
			{ say: 'A user renames themselves to Asha K. Reads are normally spread over replicas; writes always go to the primary.', focus: ['app'] },
			{ say: 'The app writes the new name to the primary. It saves at once.', show: ['w'], set: { pv: { label: 'name: Asha K', tone: 'accent' } }, pulse: ['pv'] },
			{ say: 'The change is on its way to the replica, but it has not arrived yet. That gap is replica lag.', show: ['rep'], focus: ['rep'] },
			{ say: 'The page reloads and the app reads from the replica, which still holds the old name.', show: ['rd', 'shows'], set: { rv: { tone: 'warn' } }, pulse: ['rv'] },
			{ say: 'Fix one: for a moment after a write, read from the primary. Fix two: wait until the replica has caught up before reading.', hide: ['rd', 'shows'], set: { rv: { label: 'name: Asha K', tone: 'accent' } }, focus: ['rv'] },
			{ say: 'Replicas add read capacity, not write capacity: every write still happens on the primary and on every replica.', focus: ['p', 'r'] }
		]
	},

	// ───────── charset-and-collation ─────────
	{
		id: 'my-utf8-vs-utf8mb4',
		topic: 'mysql',
		group: 'charset-and-collation',
		title: 'utf8 versus utf8mb4',
		blurb: 'Why can an emoji break a column that says utf8?',
		nodes: [
			{ id: 'c1', kind: 'box', x: 8, y: 36, w: 76, h: 50, label: 'A', sub: '1 byte', visible: true },
			{ id: 'c2', kind: 'box', x: 96, y: 36, w: 76, h: 50, label: 'é', sub: '2 bytes', visible: true },
			{ id: 'c3', kind: 'box', x: 184, y: 36, w: 76, h: 50, label: '€', sub: '3 bytes', visible: true },
			{ id: 'c4', kind: 'box', x: 272, y: 36, w: 80, h: 50, label: 'emoji', sub: '4 bytes', visible: true },
			{ id: 'u3', kind: 'box', x: 8, y: 150, w: 164, h: 56, label: 'column: utf8', sub: 'max 3 bytes per character' },
			{ id: 'u4', kind: 'box', x: 188, y: 150, w: 164, h: 56, label: 'column: utf8mb4', sub: 'max 4 bytes per character' },
			{ id: 'tok', kind: 'token', x: 312, y: 112, label: 'insert' },
			{ id: 'err', kind: 'text', x: 8, y: 232, text: 'Incorrect string value (or text cut off in non-strict mode)', w: 316, tone: 'neg' },
			{ id: 'tip', kind: 'text', x: 8, y: 276, text: 'VARCHAR(255) counts characters: up to 1020 bytes in utf8mb4.', w: 316, size: 'sm' }
		],
		steps: [
			{ say: 'In UTF-8 a character takes 1 to 4 bytes: letters like A take 1, accented ones 2, symbols like the euro sign 3.', focus: ['c1', 'c2', 'c3'] },
			{ say: 'Emoji and some rarer characters need 4 bytes.', focus: ['c4'], set: { c4: { tone: 'warn' } } },
			{ say: 'MySQL\'s character set named utf8 is a legacy alias (utf8mb3) that stops at 3 bytes per character.', show: ['u3'], focus: ['u3'] },
			{ say: 'Insert an emoji and a strict server refuses it. A non-strict one may cut the text off at that character.', show: ['tok', 'err'], move: { tok: { x: 90, y: 138 } }, set: { u3: { tone: 'neg' }, c4: { tone: 'neg' } }, pulse: ['u3'] },
			{ say: 'utf8mb4 is real UTF-8 with up to 4 bytes. It has been the default since MySQL 8.0. Use it for every text column.', show: ['u4'], hide: ['err'], move: { tok: { x: 270, y: 138 } }, set: { u4: { tone: 'accent' }, u3: { tone: 'neutral' }, c4: { tone: 'accent' } }, pulse: ['u4'] },
			{ say: 'One side effect: VARCHAR(255) counts characters, so in utf8mb4 it can take up to 1020 bytes. Mind index key size limits.', show: ['tip'], focus: ['tip'] }
		]
	},

	// ───────── sql-mode-and-gotchas ─────────
	{
		id: 'my-string-to-number',
		topic: 'mysql',
		group: 'sql-mode-and-gotchas',
		title: 'The quiet string to number conversion',
		blurb: 'Why does WHERE code = 0 match text values?',
		nodes: [
			{ id: 'q', kind: 'text', x: 8, y: 20, text: "SELECT 'abc' = 0;", w: 316, size: 'lg', visible: true },
			{ id: 's', kind: 'box', x: 20, y: 46, w: 100, h: 36, label: "'abc'", sub: 'a string' },
			{ id: 'n', kind: 'box', x: 240, y: 46, w: 100, h: 36, label: '0', sub: 'a number' },
			{ id: 'conv', kind: 'box', x: 20, y: 108, w: 100, h: 36, label: '0', sub: 'converted', tone: 'warn' },
			{ id: 'res', kind: 'box', x: 240, y: 108, w: 100, h: 36, label: 'result: 1', sub: 'true', tone: 'warn' },
			{ id: 'cv', kind: 'edge', from: 's', to: 'conv', label: 'to number' },
			{ id: 'cmp', kind: 'edge', from: 'conv', to: 'res', label: '0 = 0', tone: 'warn' },
			{ id: 'nres', kind: 'edge', from: 'n', to: 'res', tone: 'warn' },
			{ id: 't', kind: 'table', x: 8, y: 164, title: 'products', colW: 80, cols: ['id', 'code'], rows: [['1', 'AB12'], ['2', '7X'], ['3', '0'], ['4', 'Q-5']] },
			{ id: 'tip', kind: 'text', x: 200, y: 230, text: 'Compare like with like.', w: 150, size: 'sm' }
		],
		steps: [
			{ say: "Does the string 'abc' equal the number 0? Most people would say no.", show: ['s', 'n'], focus: ['q'] },
			{ say: 'The two sides have different types. MySQL does not complain: it quietly converts one side to match the other.', focus: ['s', 'n'] },
			{ say: "The string is turned into a number. 'abc' does not start with a digit, so it becomes 0, with only a warning.", show: ['conv', 'cv'], pulse: ['conv'] },
			{ say: 'Now it compares 0 with 0, which is true, so the query returns 1.', show: ['res', 'cmp', 'nres'], pulse: ['res'] },
			{ say: 'In real queries, WHERE code = 0 also matches AB12 and Q-5, because text with no leading number becomes 0. The value 7X becomes 7, so it does not match.', show: ['t'], set: { t: { hl: [0, 2, 3] } }, focus: ['t'] },
			{ say: "Compare values of the same type: write WHERE code = '0', or cast explicitly, so no hidden conversion happens.", show: ['tip'], set: { t: { hl: [2] } }, focus: ['tip'] }
		]
	}
];
