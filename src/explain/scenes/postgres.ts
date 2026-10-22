import type { Scene } from '../types';

export const postgresScenes: Scene[] = [
	// ───────────── tables-and-types ─────────────
	{
		id: 'pg-float-vs-numeric',
		topic: 'postgres',
		group: 'tables-and-types',
		title: 'Why float is wrong for money',
		blurb: 'Why does 0.1 + 0.2 not equal 0.3 in some column types?',
		nodes: [
			{ id: 'q1', kind: 'text', x: 16, y: 28, text: 'SELECT 0.1::float8 + 0.2::float8;', visible: true },
			{ id: 'r1', kind: 'box', x: 16, y: 40, w: 328, h: 44, label: '0.30000000000000004', sub: 'close to 0.3, but not exactly' },
			{ id: 'q2', kind: 'text', x: 16, y: 118, text: 'SELECT 0.1::numeric + 0.2::numeric;' },
			{ id: 'r2', kind: 'box', x: 16, y: 130, w: 328, h: 44, label: '0.3', sub: 'exact decimal arithmetic', tone: 'accent' },
			{ id: 'c', kind: 'box', x: 16, y: 206, w: 328, h: 62, label: 'For money use numeric(12,2) or integer cents', sub: 'keep float8 for measurements, not prices', tone: 'accent' }
		],
		steps: [
			{ say: 'Add 0.1 and 0.2 using float8, PostgreSQL\'s double precision type, and look at the result.', focus: ['q1'] },
			{ say: 'The answer is 0.30000000000000004. Binary floating point cannot store 0.1 exactly, so every value is a close approximation.', show: ['r1'], pulse: ['r1'] },
			{ say: 'A tiny error is harmless in physics, but for money it breaks equality checks such as total = 0.30 and the errors add up across many rows.', set: { r1: { tone: 'neg', sub: 'so total = 0.3 is false' } } },
			{ say: 'numeric stores decimal digits exactly, so the same sum behaves the way you expect on paper.', show: ['q2'], focus: ['q2'] },
			{ say: 'The result is exactly 0.3. numeric is slower than float8, but for prices correctness matters far more than speed.', show: ['r2'], pulse: ['r2'] },
			{ say: 'Store prices as numeric(12,2), or as a whole number of cents in an integer. Both stay exact.', show: ['c'], focus: ['c'] }
		]
	},

	// ───────────── select-and-filter ─────────────
	{
		id: 'pg-query-order',
		topic: 'postgres',
		group: 'select-and-filter',
		title: 'The order a query really runs in',
		blurb: 'Why can ORDER BY use an alias but WHERE cannot?',
		stage: { w: 360, h: 320 },
		nodes: [
			{
				id: 't', kind: 'table', x: 16, y: 20, title: 'orders', colW: 58, visible: true,
				cols: ['id', 'status', 'day'],
				rows: [['1', 'paid', 'Mon'], ['2', 'pending', 'Mon'], ['3', 'paid', 'Tue'], ['4', 'refunded', 'Tue'], ['5', 'paid', 'Wed']]
			},
			{ id: 's1', kind: 'box', x: 220, y: 20, w: 124, h: 34, label: '1  FROM', shape: 'pill' },
			{ id: 's2', kind: 'box', x: 220, y: 70, w: 124, h: 34, label: '2  WHERE', shape: 'pill' },
			{ id: 's3', kind: 'box', x: 220, y: 120, w: 124, h: 34, label: '3  SELECT', shape: 'pill' },
			{ id: 's4', kind: 'box', x: 220, y: 170, w: 124, h: 34, label: '4  ORDER BY', shape: 'pill' },
			{ id: 's5', kind: 'box', x: 220, y: 220, w: 124, h: 34, label: '5  LIMIT', shape: 'pill' },
			{ id: 'e1', kind: 'edge', from: 's1', to: 's2' },
			{ id: 'e2', kind: 'edge', from: 's2', to: 's3' },
			{ id: 'e3', kind: 'edge', from: 's3', to: 's4' },
			{ id: 'e4', kind: 'edge', from: 's4', to: 's5' },
			{ id: 'sql', kind: 'text', x: 16, y: 284, w: 280, size: 'sm', text: "SELECT id FROM orders WHERE status = 'paid' ORDER BY id DESC LIMIT 2;", visible: true }
		],
		steps: [
			{ say: 'SQL is written starting with SELECT, but it runs in a different order. First FROM picks the input: all five rows of orders.', show: ['s1'], set: { t: { hl: [0, 1, 2, 3, 4] } }, focus: ['s1'] },
			{ say: "WHERE keeps only the rows with status 'paid'. It runs before SELECT, so it cannot use an alias defined there.", show: ['s2', 'e1'], set: { t: { hl: [0, 2, 4] } }, focus: ['s2'] },
			{ say: 'SELECT now picks the columns and creates aliases. The rows that failed WHERE are already gone.', show: ['s3', 'e2'], set: { t: { hl: [], rows: [['1', 'paid', 'Mon'], ['3', 'paid', 'Tue'], ['5', 'paid', 'Wed']] } }, focus: ['s3'] },
			{ say: 'ORDER BY sorts what is left. Because SELECT has run, ORDER BY is allowed to use aliases.', show: ['s4', 'e3'], set: { t: { rows: [['5', 'paid', 'Wed'], ['3', 'paid', 'Tue'], ['1', 'paid', 'Mon']] } }, focus: ['s4'] },
			{ say: 'LIMIT cuts the sorted result to the first two rows. Without an ORDER BY, which two you get would be unspecified.', show: ['s5', 'e4'], set: { t: { hl: [0, 1] } }, focus: ['s5'] }
		]
	},

	// ───────────── joins ─────────────
	{
		id: 'pg-join-types',
		topic: 'postgres',
		group: 'joins',
		title: 'INNER join vs LEFT join',
		blurb: 'What happens to a customer who has no orders?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'c', kind: 'table', x: 16, y: 16, title: 'customers', colW: 52, visible: true, cols: ['id', 'name'], rows: [['1', 'Asha'], ['2', 'Ben'], ['3', 'Chen']] },
			{ id: 'o', kind: 'table', x: 216, y: 16, title: 'orders', colW: 64, visible: true, cols: ['id', 'customer'], rows: [['10', '1'], ['11', '1'], ['12', '3']] },
			{ id: 'sql', kind: 'text', x: 16, y: 158, w: 280, size: 'sm', text: 'FROM customers c JOIN orders o ON o.customer_id = c.id' },
			{ id: 'res', kind: 'table', x: 16, y: 182, title: 'INNER JOIN result', colW: 76, cols: ['name', 'order_id'], rows: [['Asha', '10'], ['Asha', '11'], ['Chen', '12']] }
		],
		steps: [
			{ say: 'Two tables. Asha has orders 10 and 11, Chen has order 12, and Ben has no orders at all.', focus: ['c', 'o'] },
			{ say: 'A join pairs rows when a condition is true: here an order belongs to a customer when o.customer_id = c.id.', show: ['sql'], focus: ['sql'] },
			{ say: 'An INNER JOIN keeps only matched pairs. Ben has no partner, so Ben vanishes from the result.', show: ['res'], set: { c: { hl: [0, 2] }, o: { hl: [0, 1, 2] } }, pulse: ['res'] },
			{ say: 'Switch to LEFT JOIN and every customer is kept. Ben appears once, with NULL where the order columns would be.', set: { sql: { text: 'FROM customers c LEFT JOIN orders o ON o.customer_id = c.id' }, c: { hl: [1] }, res: { title: 'LEFT JOIN result', rows: [['Asha', '10'], ['Asha', '11'], ['Ben', 'NULL'], ['Chen', '12']], hl: [2] } }, pulse: ['res'] },
			{ say: "Careful: adding WHERE o.status = 'paid' would drop Ben again, because NULL = 'paid' is not true. Put such filters in the ON clause instead.", set: { res: { hl: [2], tone: 'warn' } }, focus: ['res'] }
		]
	},
	{
		id: 'pg-join-fanout',
		topic: 'postgres',
		group: 'joins',
		title: 'One order becomes three rows',
		blurb: 'Why does counting after a join give the wrong number?',
		nodes: [
			{ id: 'o', kind: 'table', x: 16, y: 16, title: 'orders', colW: 62, visible: true, cols: ['order_id', 'status'], rows: [['10', 'paid']] },
			{ id: 'i', kind: 'table', x: 190, y: 16, title: 'order_items', colW: 50, visible: true, cols: ['order_id', 'product', 'qty'], rows: [['10', 'Tea', '2'], ['10', 'Mug', '1'], ['10', 'Cake', '3']] },
			{ id: 'res', kind: 'table', x: 16, y: 150, title: 'after the JOIN', colW: 60, cols: ['o.id', 'product', 'qty'], rows: [['10', 'Tea', '2'], ['10', 'Mug', '1'], ['10', 'Cake', '3']] },
			{ id: 'cnt', kind: 'text', x: 16, y: 276, w: 280, size: 'sm', text: 'COUNT(*) = 3 rows   |   COUNT(DISTINCT o.id) = 1 order' }
		],
		steps: [
			{ say: 'One order, and three items on it. The orders table has a single row for order 10.', focus: ['o', 'i'] },
			{ say: 'Join them on order_id. The one order row is matched with each of its three items.', show: ['res'], set: { o: { hl: [0] }, i: { hl: [0, 1, 2] } }, pulse: ['res'] },
			{ say: 'In the result the order id 10 now appears three times. One order has become three rows.', set: { res: { hl: [0, 1, 2], tone: 'warn' } }, focus: ['res'] },
			{ say: 'COUNT(*) now counts rows, so it says 3, but there is only one order. SUM() over any order-level column would be tripled as well.', show: ['cnt'], focus: ['cnt'] },
			{ say: 'Count COUNT(DISTINCT o.id) for orders, or total the items in a subquery first and join that, so each order stays one row.', set: { cnt: { tone: 'accent' }, res: { tone: 'neutral', hl: [] } }, focus: ['cnt'] }
		]
	},

	// ───────────── grouping-and-aggregates ─────────────
	{
		id: 'pg-group-by',
		topic: 'postgres',
		group: 'grouping-and-aggregates',
		title: 'GROUP BY puts rows in buckets',
		blurb: 'How do six rows turn into three totals?',
		nodes: [
			{
				id: 't', kind: 'table', x: 16, y: 16, title: 'orders', colW: 52, visible: true,
				cols: ['id', 'cust', 'cents'],
				rows: [['1', 'Asha', '1200'], ['2', 'Ben', '800'], ['3', 'Asha', '500'], ['4', 'Chen', '2000'], ['5', 'Ben', '300'], ['6', 'Asha', '700']]
			},
			{ id: 'ga', kind: 'box', x: 200, y: 16, w: 144, h: 50, label: 'Asha', sub: 'rows 1, 3, 6' },
			{ id: 'gb', kind: 'box', x: 200, y: 82, w: 144, h: 50, label: 'Ben', sub: 'rows 2, 5' },
			{ id: 'gc', kind: 'box', x: 200, y: 148, w: 144, h: 50, label: 'Chen', sub: 'row 4' },
			{ id: 'sql', kind: 'text', x: 16, y: 244, w: 280, size: 'sm', text: 'SELECT cust, SUM(cents) FROM orders GROUP BY cust;', visible: true },
			{ id: 'note', kind: 'text', x: 16, y: 280, w: 280, size: 'sm', text: 'Any other column in SELECT must be grouped or aggregated: a bucket holds many values of it.' }
		],
		steps: [
			{ say: 'Six order rows from three customers. We want one total per customer, not six separate amounts.', focus: ['t'] },
			{ say: 'GROUP BY cust sorts rows into buckets, one per distinct customer. Asha\'s bucket gets rows 1, 3 and 6.', show: ['ga'], set: { t: { hl: [0, 2, 5] } }, focus: ['ga'] },
			{ say: 'Ben\'s bucket gets rows 2 and 5.', show: ['gb'], set: { t: { hl: [1, 4] } }, focus: ['gb'] },
			{ say: 'Chen has a single row, so the bucket holds just row 4. Each row lands in exactly one bucket.', show: ['gc'], set: { t: { hl: [3] } }, focus: ['gc'] },
			{ say: 'An aggregate such as SUM runs once per bucket. Six rows collapse into three result rows, one per customer.', set: { t: { hl: [] }, ga: { label: 'Asha: 2400', sub: '1200 + 500 + 700', tone: 'accent' }, gb: { label: 'Ben: 1100', sub: '800 + 300', tone: 'accent' }, gc: { label: 'Chen: 2000', sub: '2000', tone: 'accent' } }, pulse: ['ga', 'gb', 'gc'] },
			{ say: 'This is why a bare column like status is an error here: Asha\'s bucket could hold several different statuses.', show: ['note'], focus: ['note'] }
		]
	},

	// ───────────── indexes ─────────────
	{
		id: 'pg-index-vs-scan',
		topic: 'postgres',
		group: 'indexes',
		title: 'Why an index makes lookups fast',
		blurb: 'How does Postgres find one row among millions?',
		nodes: [
			{ id: 'q', kind: 'text', x: 8, y: 16, text: 'SELECT * FROM users WHERE id = 6;', size: 'md', visible: true },
			{
				id: 't', kind: 'table', x: 8, y: 34, title: 'users', colW: 58, visible: true,
				cols: ['id', 'name', 'city'],
				rows: [['1', 'Asha', 'Pune'], ['2', 'Ben', 'Leeds'], ['3', 'Chen', 'Oslo'], ['4', 'Dara', 'Lima'], ['5', 'Esi', 'Accra'], ['6', 'Farid', 'Cairo'], ['7', 'Gita', 'Delhi'], ['8', 'Hugo', 'Paris']]
			},
			{ id: 'cnt', kind: 'text', x: 8, y: 270, text: '', size: 'sm', visible: true },
			{ id: 'root', kind: 'box', x: 232, y: 44, w: 96, h: 34, label: 'index: 1-8', shape: 'pill' },
			{ id: 'mid', kind: 'box', x: 232, y: 112, w: 96, h: 34, label: '5 to 8', shape: 'pill' },
			{ id: 'leaf', kind: 'box', x: 232, y: 180, w: 96, h: 34, label: 'id 6 → row 6', shape: 'pill', tone: 'accent' },
			{ id: 'e1', kind: 'edge', from: 'root', to: 'mid' },
			{ id: 'e2', kind: 'edge', from: 'mid', to: 'leaf' },
			{ id: 'e3', kind: 'edge', from: 'leaf', to: { x: 178, y: 150 }, tone: 'accent', dashed: true }
		],
		steps: [
			{ say: 'You ask for the user with id 6. Without help, Postgres has no idea where that row is.', focus: ['q'] },
			{ say: 'So it does a sequential scan: it reads row 1, checks the id, then row 2, and so on.', set: { t: { hl: [0] }, cnt: { text: 'Rows checked: 1' } } },
			{ say: 'It keeps going, one row at a time. With 8 rows that is quick. With 8 million it is not.', set: { t: { hl: [1, 2, 3, 4] }, cnt: { text: 'Rows checked: 5' } } },
			{ say: 'Row 6 matches after 6 checks. Cost grows with the size of the table.', set: { t: { hl: [5] }, cnt: { text: 'Rows checked: 6', tone: 'warn' } } },
			{ say: 'Now add an index on id. It is a small, sorted structure kept beside the table, like the index of a book.', set: { t: { hl: [], tone: 'neutral' }, cnt: { text: '' } }, show: ['root'], focus: ['root'] },
			{ say: 'Postgres starts at the top and picks a branch by comparing ids: 6 is in the upper half.', show: ['mid', 'e1'], focus: ['mid'] },
			{ say: 'Two or three hops reach the entry for id 6, which points straight at the row. No scanning.', show: ['leaf', 'e2', 'e3'], set: { t: { hl: [5] }, cnt: { text: 'Hops: ~3, even for millions of rows', tone: 'accent' } }, focus: ['leaf'] }
		]
	},
	{
		id: 'pg-leftmost-prefix',
		topic: 'postgres',
		group: 'indexes',
		title: 'Column order in a composite index',
		blurb: 'Which filters can an index on two columns actually use?',
		nodes: [
			{ id: 'ix', kind: 'doc', x: 16, y: 20, w: 150, title: 'composite index', visible: true, lines: ['cust | placed_at', '1  | Jan 03', '1  | Jan 09', '2  | Jan 02', '2  | Jan 05', '3  | Jan 01', '3  | Jan 07'] },
			{ id: 'q1', kind: 'box', x: 188, y: 20, w: 156, h: 44, label: 'WHERE cust = 2', sub: 'leading column only' },
			{ id: 'q2', kind: 'box', x: 188, y: 82, w: 156, h: 62, label: 'WHERE cust = 2 AND placed_at > Jan 03', sub: 'equality, then a range' },
			{ id: 'q3', kind: 'box', x: 188, y: 162, w: 156, h: 62, label: 'WHERE placed_at = Jan 05', sub: 'skips the first column' },
			{ id: 'rule', kind: 'text', x: 16, y: 262, w: 280, size: 'sm', text: 'Rule of thumb: equality columns first, the range column last, and always filter on the leading column.' }
		],
		steps: [
			{ say: 'An index on (cust, placed_at) is sorted by cust first, and by placed_at only inside each customer.', focus: ['ix'] },
			{ say: 'Filtering on cust = 2 jumps straight to one contiguous slice of the index, the two entries for customer 2.', show: ['q1'], set: { ix: { hl: [3, 4] }, q1: { tone: 'accent' } }, focus: ['q1'] },
			{ say: 'Adding a range on placed_at narrows the slice further, because dates are already sorted within customer 2.', show: ['q2'], set: { ix: { hl: [4] }, q2: { tone: 'accent' } }, focus: ['q2'] },
			{ say: 'Filtering on placed_at alone skips the first column. Matching entries could sit under any customer, so the index cannot jump to them.', show: ['q3'], set: { ix: { hl: [] }, q3: { tone: 'warn' } }, focus: ['q3'] },
			{ say: 'So the order of columns matters. Put equality columns first and the range column last.', show: ['rule'], focus: ['ix'] }
		]
	},

	// ───────────── explain-and-planner ─────────────
	{
		id: 'pg-explain-plan',
		topic: 'postgres',
		group: 'explain-and-planner',
		title: 'Reading an EXPLAIN plan',
		blurb: 'What is the planner telling you, and in which order?',
		nodes: [
			{ id: 'sql', kind: 'text', x: 16, y: 20, w: 280, size: 'sm', text: 'EXPLAIN ANALYZE SELECT c.name, o.id FROM customers c JOIN orders o ON o.customer_id = c.id;', visible: true },
			{ id: 'join', kind: 'box', x: 90, y: 64, w: 180, h: 50, label: 'Hash Join', sub: 'estimated rows 15', tone: 'accent' },
			{ id: 'ords', kind: 'box', x: 16, y: 154, w: 150, h: 50, label: 'Seq Scan on orders', sub: 'rows 15' },
			{ id: 'hash', kind: 'box', x: 200, y: 154, w: 144, h: 40, label: 'Hash', sub: 'in-memory table' },
			{ id: 'cust', kind: 'box', x: 200, y: 224, w: 144, h: 50, label: 'Seq Scan on customers', sub: 'rows 8' },
			{ id: 'e1', kind: 'edge', from: 'cust', to: 'hash' },
			{ id: 'e2', kind: 'edge', from: 'hash', to: 'join' },
			{ id: 'e3', kind: 'edge', from: 'ords', to: 'join' },
			{ id: 'e4', kind: 'edge', from: 'ords', to: 'hash', label: 'probe', tone: 'accent' }
		],
		steps: [
			{ say: 'EXPLAIN prints the plan Postgres chose as a tree. Read it from the innermost, most indented node outwards.', focus: ['sql'] },
			{ say: 'First it scans customers, reading every row. The table is tiny (8 rows), so a sequential scan is the cheapest way.', show: ['cust'], focus: ['cust'], pulse: ['cust'] },
			{ say: 'Those rows are loaded into an in-memory hash table keyed by customer id.', show: ['hash', 'e1'], focus: ['hash'] },
			{ say: 'Then it scans orders. For each order it probes the hash table to find the matching customer.', show: ['ords', 'e4'], focus: ['ords'], pulse: ['ords'] },
			{ say: 'The Hash Join node combines both streams into the final rows. Its cost is in planner units, not milliseconds.', show: ['join', 'e2', 'e3'], hide: ['e4'], focus: ['join'] },
			{ say: 'ANALYZE also runs the query and adds actual rows and time. If estimated and actual rows differ wildly, statistics are stale.', set: { join: { sub: 'estimated 15 | actual 15', tone: 'accent' }, ords: { sub: 'estimated 15 | actual 15' }, cust: { sub: 'estimated 8 | actual 8' } }, focus: ['join'] }
		]
	},

	// ───────────── transactions-acid ─────────────
	{
		id: 'pg-rollback-transfer',
		topic: 'postgres',
		group: 'transactions-acid',
		title: 'A transfer that fails halfway',
		blurb: 'What does a transaction protect you from?',
		nodes: [
			{ id: 'a', kind: 'doc', x: 16, y: 20, w: 150, title: 'Alice', visible: true, lines: ['balance: 100'] },
			{ id: 'b', kind: 'doc', x: 194, y: 20, w: 150, title: 'Bob', visible: true, lines: ['balance: 50'] },
			{ id: 'tx', kind: 'box', x: 16, y: 120, w: 328, h: 40, label: 'BEGIN', sub: 'transaction open', shape: 'pill', tone: 'accent' },
			{ id: 'u1', kind: 'box', x: 16, y: 178, w: 328, h: 40, label: 'UPDATE 1: Alice minus 30', shape: 'pill' },
			{ id: 'u2', kind: 'box', x: 16, y: 232, w: 328, h: 40, label: 'UPDATE 2: Bob plus 30 fails', shape: 'pill', tone: 'neg' }
		],
		steps: [
			{ say: 'Two accounts. We move 30 from Alice to Bob, which takes two UPDATE statements that must succeed or fail together.', focus: ['a', 'b'] },
			{ say: 'BEGIN opens a transaction. Everything that follows is a single unit of work until COMMIT or ROLLBACK.', show: ['tx'], pulse: ['tx'] },
			{ say: 'UPDATE 1 takes 30 from Alice. Inside the transaction she now has 70, but no other session can see that yet.', show: ['u1'], set: { a: { lines: ['balance: 70'], title: 'Alice (not committed)' } }, focus: ['a'] },
			{ say: 'UPDATE 2 fails: say a constraint is violated or the connection drops. Without a transaction, 30 would simply be lost.', show: ['u2'], pulse: ['u2'] },
			{ say: 'ROLLBACK undoes everything since BEGIN. Alice is back to 100 as if nothing happened. That is atomicity: all or nothing.', hide: ['u1', 'u2'], set: { tx: { label: 'ROLLBACK', sub: 'everything undone', tone: 'neg' }, a: { lines: ['balance: 100'], title: 'Alice' } }, focus: ['a', 'tx'] },
			{ say: 'Had both updates worked, COMMIT would have made them permanent together, and Bob would show 80.', set: { tx: { label: 'COMMIT instead', sub: 'both changes become permanent', tone: 'accent' }, a: { lines: ['balance: 70'] }, b: { lines: ['balance: 80'] } }, focus: ['b'] }
		]
	},

	// ───────────── isolation-and-mvcc ─────────────
	{
		id: 'pg-mvcc-versions',
		topic: 'postgres',
		group: 'isolation-and-mvcc',
		title: 'MVCC: updates make new row versions',
		blurb: 'How can readers and writers work on the same row at once?',
		nodes: [
			{ id: 'v1', kind: 'box', x: 16, y: 40, w: 150, h: 46, label: 'price = 10', sub: 'version 1', visible: true },
			{ id: 'v2', kind: 'box', x: 16, y: 120, w: 150, h: 46, label: 'price = 12', sub: 'version 2', tone: 'accent' },
			{ id: 'ra', kind: 'box', x: 208, y: 40, w: 136, h: 46, label: 'Old reader', sub: 'snapshot from before' },
			{ id: 'w', kind: 'box', x: 208, y: 120, w: 136, h: 46, label: 'Writer', sub: 'UPDATE price = 12' },
			{ id: 'rb', kind: 'box', x: 208, y: 200, w: 136, h: 46, label: 'New reader', sub: 'starts after commit' },
			{ id: 'e1', kind: 'edge', from: 'ra', to: 'v1' },
			{ id: 'e2', kind: 'edge', from: 'w', to: 'v2' },
			{ id: 'e3', kind: 'edge', from: 'rb', to: 'v2' },
			{ id: 'note', kind: 'text', x: 16, y: 264, w: 280, size: 'sm', text: 'A transaction left open for hours keeps old versions alive, and the table bloats.' }
		],
		steps: [
			{ say: 'A row exists as one physical version: price = 10. A reader starts a query and takes a snapshot of the data.', show: ['ra', 'e1'], focus: ['v1'] },
			{ say: 'Meanwhile a writer runs UPDATE price = 12 on the same row and commits. The reader keeps going.', show: ['w'], focus: ['w'] },
			{ say: 'Postgres does not overwrite the row. It writes a second version and marks the first one as superseded. Both exist on disk.', show: ['v2', 'e2'], set: { v1: { tone: 'warn', sub: 'version 1 (superseded)' } }, pulse: ['v2'] },
			{ say: 'A new reader sees version 2. The old reader, whose snapshot predates the update, still sees version 1. Nobody waits for anybody.', show: ['rb', 'e3'], focus: ['rb', 'ra'] },
			{ say: 'When the old reader finishes, no snapshot can see version 1 any more. It is now a dead tuple: garbage waiting for cleanup.', hide: ['ra', 'e1'], set: { v1: { tone: 'neg', sub: 'dead tuple' } }, focus: ['v1'] },
			{ say: 'VACUUM reclaims dead versions so the space can be reused. It cannot remove a version that some open transaction might still need.', hide: ['v1'], show: ['note'], focus: ['note'] }
		]
	},

	// ───────────── locks-and-deadlocks ─────────────
	{
		id: 'pg-lost-update',
		topic: 'postgres',
		group: 'locks-and-deadlocks',
		title: 'The lost update, and FOR UPDATE',
		blurb: 'Two withdrawals ran, so why was only one applied?',
		nodes: [
			{ id: 'a1', kind: 'box', x: 16, y: 20, w: 150, h: 44, label: 'A reads 100' },
			{ id: 'b1', kind: 'box', x: 194, y: 20, w: 150, h: 44, label: 'B reads 100' },
			{ id: 'a2', kind: 'box', x: 16, y: 84, w: 150, h: 44, label: 'A writes 90' },
			{ id: 'b2', kind: 'box', x: 194, y: 84, w: 150, h: 44, label: 'B writes 90' },
			{ id: 'db', kind: 'box', x: 90, y: 190, w: 180, h: 56, label: 'balance = 100', sub: 'two withdrawals of 10', shape: 'pill', visible: true },
			{ id: 'fix', kind: 'text', x: 16, y: 276, w: 280, size: 'sm', text: 'Or do the maths in SQL: UPDATE ... SET balance = balance - 10' }
		],
		steps: [
			{ say: 'A balance of 100. Sessions A and B each withdraw 10. The app reads the balance, subtracts in code, then writes the result back.', focus: ['db'] },
			{ say: 'Both read 100 at nearly the same moment. The default READ COMMITTED level does not stop this.', show: ['a1', 'b1'], focus: ['a1', 'b1'] },
			{ say: 'A writes 100 minus 10, which is 90, and commits.', show: ['a2'], set: { db: { label: 'balance = 90' } }, pulse: ['db'] },
			{ say: 'B also writes 90, calculated from its stale read of 100. A\'s withdrawal is lost: the balance should be 80.', show: ['b2'], set: { db: { label: 'balance = 90', sub: 'should be 80', tone: 'neg' }, b2: { tone: 'neg' } }, focus: ['db'] },
			{ say: 'Fix: lock the row first with SELECT ... FOR UPDATE. A gets the lock and reads 100; B asks for the lock and has to wait.', hide: ['b2'], set: { a1: { label: 'A locks the row, reads 100', tone: 'accent' }, b1: { label: 'B waits for the lock', tone: 'warn' }, a2: { label: 'A writes 90, commits' }, db: { label: 'balance = 90', sub: 'A committed', tone: 'neutral' } }, focus: ['a1', 'b1'] },
			{ say: 'When A commits, B gets the lock and reads the fresh value 90, then writes 80. Nothing is lost.', show: ['b2', 'fix'], set: { b1: { label: 'B gets the lock, reads 90', tone: 'accent' }, b2: { label: 'B writes 80', tone: 'accent' }, db: { label: 'balance = 80', sub: 'both withdrawals applied', tone: 'accent' } }, focus: ['db'] }
		]
	},
	{
		id: 'pg-deadlock',
		topic: 'postgres',
		group: 'locks-and-deadlocks',
		title: 'How a deadlock happens',
		blurb: 'Why can two transactions wait on each other forever?',
		nodes: [
			{ id: 'r1', kind: 'box', x: 130, y: 20, w: 100, h: 38, label: 'row 1' },
			{ id: 'r2', kind: 'box', x: 130, y: 226, w: 100, h: 38, label: 'row 2' },
			{ id: 'ta', kind: 'box', x: 16, y: 118, w: 112, h: 46, label: 'Transaction A' },
			{ id: 'tb', kind: 'box', x: 232, y: 118, w: 112, h: 46, label: 'Transaction B' },
			{ id: 'ha', kind: 'edge', from: 'ta', to: 'r1', label: 'locks', tone: 'accent' },
			{ id: 'hb', kind: 'edge', from: 'tb', to: 'r2', label: 'locks', tone: 'accent' },
			{ id: 'wa', kind: 'edge', from: 'ta', to: 'r2', label: 'wants', tone: 'warn' },
			{ id: 'wb', kind: 'edge', from: 'tb', to: 'r1', label: 'wants', tone: 'warn' },
			{ id: 'tip', kind: 'text', x: 180, y: 286, w: 300, size: 'sm', anchor: 'middle', text: 'Always lock rows in the same order.' }
		],
		steps: [
			{ say: 'Two transactions each update the same two rows, but in opposite order. A starts with row 1, and B starts with row 2.', show: ['ta', 'tb'] },
			{ say: 'A updates row 1 and holds a lock on it until it commits or rolls back.', show: ['r1', 'ha'], focus: ['r1'] },
			{ say: 'B updates row 2 and holds a lock on that one.', show: ['r2', 'hb'], focus: ['r2'] },
			{ say: 'Now A needs row 2, which B holds, so A waits. That is normal, and harmless on its own.', show: ['wa'], set: { ta: { tone: 'warn' } }, focus: ['ta'] },
			{ say: 'B needs row 1, which A holds. Each waits for the other and neither can ever continue: a deadlock.', show: ['wb'], set: { tb: { tone: 'warn' } }, focus: ['tb'] },
			{ say: 'After deadlock_timeout (1 second by default) Postgres notices the cycle and aborts one transaction with an error. The other carries on. Your code should retry.', hide: ['wb', 'hb'], set: { tb: { tone: 'neg', label: 'B aborted' }, ta: { tone: 'accent' } }, focus: ['tb'] },
			{ say: 'Prevention is simple: always lock rows in the same order in every transaction, so a cycle cannot form.', show: ['tip'], focus: ['tip'] }
		]
	},

	// ───────────── constraints-and-keys ─────────────
	{
		id: 'pg-fk-cascade',
		topic: 'postgres',
		group: 'constraints-and-keys',
		title: 'Foreign keys and ON DELETE',
		blurb: 'What stops an order from pointing at a customer that is not there?',
		nodes: [
			{ id: 'c', kind: 'table', x: 16, y: 20, title: 'customers', colW: 46, visible: true, cols: ['id', 'name'], rows: [['1', 'Asha'], ['2', 'Ben']] },
			{ id: 'o', kind: 'table', x: 196, y: 20, title: 'orders', colW: 74, visible: true, cols: ['id', 'customer_id'], rows: [['10', '1'], ['11', '1'], ['12', '2']] },
			{ id: 'try', kind: 'box', x: 16, y: 160, w: 328, h: 50, label: 'INSERT INTO orders ... customer_id = 99', shape: 'pill', tone: 'neg' },
			{ id: 'rule', kind: 'text', x: 16, y: 262, w: 280, size: 'sm', text: 'CASCADE for owned data, RESTRICT or NO ACTION to protect history, SET NULL to detach.' }
		],
		steps: [
			{ say: 'orders.customer_id references customers.id. That foreign key means every order must point at a customer that exists.', focus: ['c', 'o'] },
			{ say: 'Inserting an order for customer 99, who does not exist, is rejected with a foreign key violation. Bad data never gets in.', show: ['try'], focus: ['try'], pulse: ['try'] },
			{ say: 'Now try deleting customer 1. By default (NO ACTION) Postgres refuses, because orders 10 and 11 still point at them.', set: { try: { label: 'DELETE customer 1 is refused', tone: 'warn' }, o: { hl: [0, 1] }, c: { hl: [0] } }, focus: ['try'] },
			{ say: 'With ON DELETE CASCADE on the foreign key, the same delete succeeds and removes the customer\'s orders along with them.', set: { try: { label: 'DELETE customer 1 cascades to orders 10 and 11', tone: 'accent' }, o: { rows: [['12', '2']], hl: [] }, c: { rows: [['2', 'Ben']], hl: [] } }, pulse: ['o', 'c'] },
			{ say: 'Pick the action per relationship, depending on whether the child rows have any meaning without the parent.', show: ['rule'], focus: ['rule'] }
		]
	},

	// ───────────── jsonb-and-arrays ─────────────
	{
		id: 'pg-jsonb-lookup',
		topic: 'postgres',
		group: 'jsonb-and-arrays',
		title: 'Querying inside a jsonb column',
		blurb: 'How do you filter on a field buried in a JSON document?',
		nodes: [
			{ id: 'doc', kind: 'doc', x: 16, y: 20, w: 170, title: 'profiles.data (jsonb)', visible: true, lines: ['{', '  "name": "Asha",', '  "plan": "pro",', '  "tags": ["a", "b"]', '}'] },
			{ id: 'op1', kind: 'box', x: 206, y: 36, w: 138, h: 44, label: "data ->> 'plan'", sub: 'returns text: pro', tone: 'accent' },
			{ id: 'op2', kind: 'box', x: 206, y: 100, w: 138, h: 60, label: '@> contains', sub: '{"plan": "pro"}', tone: 'accent' },
			{ id: 'gin', kind: 'box', x: 16, y: 188, w: 328, h: 50, label: 'GIN index on data', sub: 'indexes every key and value', shape: 'pill', tone: 'accent' },
			{ id: 'tip', kind: 'text', x: 16, y: 264, w: 280, size: 'sm', text: 'Fields you filter and join on all the time deserve real columns: types, constraints and foreign keys.' }
		],
		steps: [
			{ say: 'A jsonb column keeps a whole document in one value per row. Here it is a user profile with a few keys.', focus: ['doc'] },
			{ say: "The ->> operator digs into the document by key and returns the value as text. data ->> 'plan' gives pro.", show: ['op1'], set: { doc: { hl: [2] } }, focus: ['op1'] },
			{ say: '@> asks whether the document contains a fragment. It is how you filter rows: WHERE data @> \'{"plan": "pro"}\'.', show: ['op2'], focus: ['op2'] },
			{ say: 'A GIN index on the column makes @> fast, so Postgres does not have to open every document to check.', show: ['gin'], set: { doc: { hl: [] } }, focus: ['gin'] },
			{ say: 'jsonb is flexible, but a value inside it has no declared type or foreign key. Hot, relational fields belong in real columns.', show: ['tip'], focus: ['tip'] }
		]
	},

	// ───────────── window-functions-and-ctes ─────────────
	{
		id: 'pg-window-vs-group',
		topic: 'postgres',
		group: 'window-functions-and-ctes',
		title: 'Window function vs GROUP BY',
		blurb: 'How do you add a running total without losing rows?',
		nodes: [
			{ id: 't', kind: 'table', x: 16, y: 16, title: 'sales', colW: 56, visible: true, cols: ['day', 'cents'], rows: [['Mon', '200'], ['Tue', '300'], ['Wed', '100']] },
			{ id: 'g', kind: 'table', x: 180, y: 16, title: 'GROUP BY: SUM', colW: 80, cols: ['total'], rows: [['600']] },
			{ id: 'w', kind: 'table', x: 16, y: 150, title: 'window: running total', colW: 64, cols: ['day', 'cents', 'running'], rows: [['Mon', '200', '200'], ['Tue', '300', '500'], ['Wed', '100', '600']] },
			{ id: 'sql', kind: 'text', x: 16, y: 290, w: 280, size: 'sm', text: 'SUM(cents) OVER (ORDER BY day) AS running' }
		],
		steps: [
			{ say: 'Three days of sales. We would like to see totals without losing the daily rows.', focus: ['t'] },
			{ say: 'GROUP BY with SUM collapses the three rows into one row holding the total. The individual days are gone.', show: ['g'], set: { t: { hl: [0, 1, 2] } }, pulse: ['g'] },
			{ say: 'A window function keeps every row and adds a calculated column next to it.', hide: ['g'], show: ['w'], set: { t: { hl: [] } }, focus: ['w'] },
			{ say: 'OVER (ORDER BY day) means: for each row, add up the rows from the first one up to this one.', show: ['sql'], focus: ['sql'] },
			{ say: 'On Tuesday the running total is 200 + 300 = 500.', set: { w: { hl: [1] } }, focus: ['w'] },
			{ say: 'On Wednesday it is 600, which matches the GROUP BY total. Add PARTITION BY customer to restart the sum for each customer.', set: { w: { hl: [2] } }, focus: ['w'] }
		]
	}
];
