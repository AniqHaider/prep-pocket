import type { BoxNode, DbNode, DocNode, EdgeNode, Scene, TableNode, TextNode, TokenNode, Tone } from '../../types';

/** Backend lab chapters 1-6 (ids ch1..ch6). Authoring guide: docs/explainers.md. */

// ---- tiny constructors, so the scene data below stays readable ----
type Opt<T> = Partial<Omit<T, 'id' | 'kind' | 'x' | 'y'>>;
const box = (id: string, x: number, y: number, w: number, h: number, label: string, o: Opt<BoxNode> = {}): BoxNode => ({ id, kind: 'box', x, y, w, h, label, ...o });
const db = (id: string, x: number, y: number, w: number, h: number, label: string, o: Opt<DbNode> = {}): DbNode => ({ id, kind: 'db', x, y, w, h, label, ...o });
const table = (id: string, x: number, y: number, cols: string[], rows: string[][], o: Opt<TableNode> = {}): TableNode => ({ id, kind: 'table', x, y, cols, rows, ...o });
// SVG text collapses leading spaces, so indentation is written as non-breaking spaces to stay visible
const indent = (lines: string[]) => lines.map((l) => l.replace(/^ +/, (m) => '\u00a0'.repeat(m.length)));
const doc = (id: string, x: number, y: number, w: number, lines: string[], o: Opt<DocNode> = {}): DocNode => ({ id, kind: 'doc', x, y, w, lines: indent(lines), ...o });
const text = (id: string, x: number, y: number, t: string, o: Opt<TextNode> = {}): TextNode => ({ id, kind: 'text', x, y, text: t, ...o });
const token = (id: string, x: number, y: number, label?: string, o: Opt<TokenNode> = {}): TokenNode => ({ id, kind: 'token', x, y, label, ...o });
const edge = (id: string, from: string, to: string, label?: string, o: { tone?: Tone; dashed?: boolean } = {}): EdgeNode => ({ id, kind: 'edge', from, to, label, ...o });

const ch1: Scene[] = [
	{
		id: 'be-values-types',
		topic: 'backend',
		group: 'ch1',
		title: 'Python is strict about types',
		blurb: 'Why does "3" + 4 work in JavaScript but crash in Python?',
		nodes: [
			box('jq', 16, 14, 150, 44, '"3" + 4', { sub: 'JavaScript' }),
			box('jr', 214, 14, 130, 44, '"34"', { sub: 'silently joins text', tone: 'warn' }),
			edge('e1', 'jq', 'jr'),
			box('pq', 16, 98, 150, 44, '"3" + 4', { sub: 'Python' }),
			box('pr', 214, 98, 130, 44, 'TypeError', { sub: 'refuses to guess', tone: 'neg' }),
			edge('e2', 'pq', 'pr'),
			box('fq', 16, 182, 150, 44, 'int("3") + 4', { sub: 'convert on purpose' }),
			box('fr', 214, 182, 130, 44, '7', { sub: 'a whole number', tone: 'accent' }),
			edge('e3', 'fq', 'fr', undefined, { tone: 'accent' }),
			text('note', 180, 268, 'Strict types catch bugs before they reach an order.', { w: 330, anchor: 'middle', size: 'sm' })
		],
		steps: [
			{ say: 'In JavaScript you can add a string and a number. Here the code asks for "3" + 4.', show: ['jq'], focus: ['jq'] },
			{ say: 'JavaScript quietly turns the 4 into text and glues them together: "34". No error, and probably a bug.', show: ['jr', 'e1'], focus: ['jr'] },
			{ say: 'Python looks at exactly the same line.', show: ['pq'], focus: ['pq'] },
			{ say: "Python refuses: you cannot add a str and an int. The error stops a bad value early, before it can corrupt a customer's order.", show: ['pr', 'e2'], pulse: ['pr'] },
			{ say: 'To add them you convert on purpose. int("3") turns the text into the number 3.', show: ['fq'], focus: ['fq'] },
			{ say: 'Now it is 3 + 4, which is 7. Python makes you say what you mean, and that keeps a backend predictable.', show: ['fr', 'e3'], pulse: ['fr'] },
			{ say: 'The core types: int, float, str, bool and None, much like JavaScript number, string, boolean and null.', show: ['note'] }
		]
	},
	{
		id: 'be-list-dict-json',
		topic: 'backend',
		group: 'ch1',
		title: 'Lists and dicts are JSON in Python',
		blurb: 'What does the JSON from the frontend look like inside your code?',
		nodes: [
			doc('d1', 30, 10, 300, ['[', '  {"name": "Mug", "qty": 2},', '  {"name": "Pen", "qty": 3}', ']'], { title: 'Request body (JSON text)', visible: true }),
			doc('d2', 30, 148, 300, ['orders = [', '  {"name": "Mug", "qty": 2},', '  {"name": "Pen", "qty": 3},', ']'], { title: 'Inside your Python code' }),
			edge('e', 'd1', 'd2', 'parsed'),
			box('expr', 30, 254, 200, 34, 'orders[0]["name"]'),
			box('res', 246, 254, 84, 34, '"Mug"', { tone: 'accent' }),
			edge('er', 'expr', 'res')
		],
		steps: [
			{ say: 'Data arrives from the frontend as JSON text: an array of objects.', focus: ['d1'] },
			{ say: 'Python parses it into a list of dicts. A list is ordered like a JS array; a dict maps keys to values like a JS object.', show: ['e', 'd2'], pulse: ['d2'] },
			{ say: 'Index a list by position, starting at 0. Then read the dict by key: orders[0]["name"] is "Mug".', show: ['expr', 'res', 'er'], set: { d2: { hl: [1] } } },
			{ say: 'Same idea for the second order: orders[1]["qty"] is 3.', set: { d2: { hl: [2] }, expr: { label: 'orders[1]["qty"]' }, res: { label: '3' } } },
			{ say: 'This key does not exist, so Python raises a KeyError and your handler crashes.', set: { d2: { hl: [1] }, expr: { label: 'orders[0]["price"]' }, res: { label: 'KeyError', tone: 'neg' } } },
			{ say: '.get(key, fallback) hands back the fallback instead of crashing. Use it for keys a client might leave out.', set: { expr: { label: 'orders[0].get("price", 0)' }, res: { label: '0', tone: 'accent' } } }
		]
	},
	{
		id: 'be-return-vs-print',
		topic: 'backend',
		group: 'ch1',
		title: 'return is not print',
		blurb: 'Why must a backend function return its answer instead of printing it?',
		nodes: [
			box('caller', 20, 14, 190, 50, 'response = total_price(3, 50)', { visible: true }),
			box('fn', 20, 124, 150, 56, 'total_price(qty, unit)', { sub: 'return qty * unit' }),
			box('screen', 250, 124, 90, 56, 'Screen', { sub: 'only a human sees it' }),
			box('res', 20, 232, 190, 46, 'response = ?'),
			edge('call', 'caller', 'fn', 'qty=3, unit=50'),
			edge('pr', 'fn', 'screen', 'print(150)', { tone: 'warn' }),
			edge('ret', 'fn', 'res', 'return 150', { tone: 'accent' })
		],
		steps: [
			{ say: 'A function takes input and gives output. Here the caller passes qty=3 and unit=50.', focus: ['caller'] },
			{ say: 'The function body runs: 3 * 50 is 150. Now there are two ways to finish.', show: ['fn', 'call'], pulse: ['fn'] },
			{ say: 'Option 1: print(150) writes 150 on a screen for a human. Nothing comes back, so the caller gets None.', show: ['screen', 'pr', 'res'], set: { res: { label: 'response = None', tone: 'warn' } }, focus: ['screen'] },
			{ say: 'Option 2: return 150 hands the value back to the caller, so the rest of the program can use it.', hide: ['screen', 'pr'], show: ['ret'], set: { res: { label: 'response = 150', tone: 'accent' } }, pulse: ['res'] },
			{ say: 'Forgetting return is a classic bug: the function quietly returns None. A backend returns data so it can go into the response.', focus: ['res'] }
		]
	},
	{
		id: 'be-try-except',
		topic: 'backend',
		group: 'ch1',
		title: 'try / except stops a crash',
		blurb: 'How do you keep one bad value from taking down the whole request?',
		nodes: [
			box('inp', 110, 14, 140, 40, 'divisor = 5', { visible: true }),
			box('try', 80, 96, 200, 50, 'try:', { sub: 'value = 10 / divisor' }),
			box('ok', 20, 196, 130, 44, 'value = 2.0', { sub: 'it worked', tone: 'accent' }),
			box('exc', 210, 196, 130, 44, 'except ZeroDivisionError'),
			box('none', 210, 262, 130, 34, 'value = None', { tone: 'accent' }),
			edge('e1', 'inp', 'try'),
			edge('e2', 'try', 'ok', undefined, { tone: 'accent' }),
			edge('e3', 'try', 'exc', undefined, { tone: 'neg' }),
			edge('e4', 'exc', 'none')
		],
		steps: [
			{ say: 'Say divisor arrives as 5. We want 10 divided by it, inside a try block.', show: ['try', 'e1'], focus: ['inp'] },
			{ say: '10 / 5 works, so value is 2.0 and the except block is skipped.', show: ['ok', 'e2'], pulse: ['ok'] },
			{ say: 'Now divisor is 0, and nobody can divide by zero.', hide: ['ok', 'e2'], set: { inp: { label: 'divisor = 0' } }, focus: ['inp'] },
			{ say: 'Python raises a ZeroDivisionError. With no safety net, the whole request would crash with a 500.', set: { try: { tone: 'neg', sub: 'ZeroDivisionError raised' } }, pulse: ['try'] },
			{ say: 'try/except is the safety net. Python jumps from the failing line to the except block that matches the error.', show: ['exc', 'e3'], focus: ['exc'] },
			{ say: 'The except block sets value = None. The program carries on and can reply with a clean error instead of crashing.', show: ['none', 'e4'], set: { try: { tone: 'warn' } }, pulse: ['none'] }
		]
	},
	{
		id: 'be-comprehension',
		topic: 'backend',
		group: 'ch1',
		title: 'A comprehension is filter + map',
		blurb: 'How does one line build a new list from another?',
		nodes: [
			text('code', 180, 20, 'squares = [x * x for x in nums if x % 2 == 0]', { w: 340, anchor: 'middle', size: 'sm' }),
			token('t1', 70, 64, '1'),
			token('t2', 130, 64, '2'),
			token('t3', 190, 64, '3'),
			token('t4', 250, 64, '4'),
			box('f', 70, 118, 220, 44, 'if x % 2 == 0', { sub: 'keep only even numbers' }),
			text('res', 180, 262, 'squares = [4, 16]', { w: 300, anchor: 'middle', size: 'lg', tone: 'accent' })
		],
		steps: [
			{ say: 'Start with nums = [1, 2, 3, 4]. We want the squares of the even numbers.', show: ['code', 't1', 't2', 't3', 't4'] },
			{ say: 'A comprehension fuses a filter and a map: for each x, keep it only if x % 2 == 0, then compute x * x.', show: ['f'], focus: ['f'] },
			{ say: '1 % 2 is 1, not 0, so the test fails and 1 is dropped.', set: { t1: { tone: 'neg' } }, move: { t1: { x: 90, y: 142 } }, hide: ['t1'] },
			{ say: '2 passes the test and is squared: 4.', set: { t2: { label: '4', tone: 'accent' } }, move: { t2: { x: 140, y: 214 } } },
			{ say: '3 is odd, so it is dropped as well.', set: { t3: { tone: 'neg' } }, move: { t3: { x: 200, y: 142 } }, hide: ['t3'] },
			{ say: '4 passes the test and is squared: 16.', set: { t4: { label: '16', tone: 'accent' } }, move: { t4: { x: 220, y: 214 } } },
			{ say: 'The result is a brand-new list built in one line. Think .filter(...).map(...) in JavaScript.', show: ['res'], pulse: ['res'] }
		]
	}
];

const ch2: Scene[] = [
	{
		id: 'be-type-hints',
		topic: 'backend',
		group: 'ch2',
		title: 'Type hints: a contract, not a lock',
		blurb: 'Does Python enforce the types you write?',
		nodes: [
			doc('code', 20, 14, 320, ['def double(n: int) -> int:', '    return n * 2', '', 'double("ab")'], { visible: true }),
			box('py', 20, 118, 150, 42, 'Python itself', { sub: 'ignores the hints' }),
			box('pyr', 210, 118, 130, 42, 'runs: "abab"', { tone: 'warn' }),
			box('ty', 20, 176, 150, 42, 'mypy / pyright', { sub: 'a type checker' }),
			box('tyr', 210, 176, 130, 42, 'error: str not int', { tone: 'neg' }),
			box('fa', 20, 234, 150, 42, 'FastAPI', { sub: 'reads the hints' }),
			box('far', 210, 234, 130, 42, '422 before your code', { tone: 'accent' }),
			edge('e1', 'py', 'pyr'),
			edge('e2', 'ty', 'tyr'),
			edge('e3', 'fa', 'far', undefined, { tone: 'accent' })
		],
		steps: [
			{ say: 'n: int says "n should be a whole number" and -> int says the function returns one. That is a type hint.', set: { code: { hl: [0] } } },
			{ say: 'Now call it with text. Python itself ignores hints at runtime, so it happily runs and gives "abab".', set: { code: { hl: [3] } }, show: ['py', 'pyr', 'e1'], pulse: ['pyr'] },
			{ say: 'A separate type checker such as mypy or pyright reads the hints and flags the mistake before you ship, like tsc does for TypeScript.', show: ['ty', 'tyr', 'e2'], pulse: ['tyr'] },
			{ say: 'FastAPI reads the hints on your route functions and validates incoming JSON for you. Wrong type means a 422 and your code never runs.', show: ['fa', 'far', 'e3'], pulse: ['far'] },
			{ say: 'So hints are documentation plus a contract that tools enforce. They make what each function expects visible to teammates and frameworks.', set: { code: { hl: [0, 3] } } }
		]
	},
	{
		id: 'be-event-loop',
		topic: 'backend',
		group: 'ch2',
		title: 'One thread, many waiting requests',
		blurb: 'How does async let one worker handle many requests at once?',
		nodes: [
			box('loop', 60, 118, 130, 56, 'Event loop', { sub: 'one thread, one worker', visible: true }),
			db('db', 250, 112, 90, 56, 'Database', { sub: 'slow to answer' }),
			edge('q', 'loop', 'db', 'await'),
			edge('r', 'db', 'loop', 'rows', { tone: 'accent' }),
			token('ta', 30, 60, 'A'),
			token('tb', 30, 250, 'B'),
			text('note', 180, 292, 'await = pause here, let others run', { w: 300, anchor: 'middle', size: 'sm' })
		],
		steps: [
			{ say: 'Request A arrives. A single event loop, one thread, will run its handler.', show: ['ta'], focus: ['loop'] },
			{ say: "The loop starts running A's handler: check the input, then it needs data from the database.", move: { ta: { x: 125, y: 96 } }, pulse: ['loop'] },
			{ say: 'The handler reaches await db.query(). It pauses A and the database does the slow work. The loop does not stand still.', show: ['db', 'q'], move: { ta: { x: 285, y: 232 } }, set: { ta: { tone: 'warn' } } },
			{ say: 'While A waits, the loop is free. Request B arrives and runs straight away.', show: ['tb'], move: { tb: { x: 125, y: 198 } }, pulse: ['loop'] },
			{ say: 'B also reaches an await and parks beside A. Two requests wait at once on one thread.', move: { tb: { x: 325, y: 232 } }, set: { tb: { tone: 'warn' } } },
			{ say: "A's data comes back and the loop picks A up exactly where it paused.", show: ['r'], move: { ta: { x: 125, y: 96 } }, set: { ta: { tone: 'accent' } }, pulse: ['loop'] },
			{ say: 'One thread, many requests in flight. Async helps because backends mostly wait. It does not speed up heavy CPU work.', show: ['note'] }
		]
	},
	{
		id: 'be-await-gather',
		topic: 'backend',
		group: 'ch2',
		title: 'await one by one vs gather',
		blurb: 'How do you run independent calls at the same time?',
		nodes: [
			text('seqt', 20, 20, 'Two awaits in a row', { size: 'md' }),
			box('s1', 20, 28, 130, 34, 'fetch_users 130 ms'),
			box('s2', 154, 28, 130, 34, 'fetch_orders 130 ms'),
			text('tot1', 20, 88, 'Total: 260 ms', { size: 'lg', tone: 'warn' }),
			text('gt', 20, 128, 'asyncio.gather(...)', { size: 'md' }),
			box('c1', 20, 138, 130, 34, 'fetch_users 130 ms'),
			box('c2', 20, 178, 130, 34, 'fetch_orders 130 ms'),
			text('tot2', 20, 238, 'Total: 130 ms', { size: 'lg', tone: 'accent' }),
			text('code', 180, 280, 'await asyncio.gather(fetch_users(), fetch_orders())', { w: 340, anchor: 'middle', size: 'sm' })
		],
		steps: [
			{ say: 'A page needs users and orders, each a database call of about 130 ms. First, await fetch_users().', show: ['seqt', 's1'], focus: ['s1'] },
			{ say: 'The second await only starts when the first one finishes.', show: ['s2'], focus: ['s2'] },
			{ say: 'That is 260 ms in total, even though the two calls do not depend on each other.', show: ['tot1'], pulse: ['tot1'] },
			{ say: 'asyncio.gather starts both at once, like Promise.all. Their waiting overlaps.', show: ['gt', 'c1', 'c2'], pulse: ['c1', 'c2'] },
			{ say: '130 ms in total: only as long as the slowest call.', show: ['tot2'], pulse: ['tot2'] },
			{ say: 'You get the results back as a list once all have finished. Use gather when the calls are independent.', show: ['code'] }
		]
	},
	{
		id: 'be-decorator',
		topic: 'backend',
		group: 'ch2',
		title: 'A decorator wraps a function',
		blurb: 'What does @login_required actually do to get_orders()?',
		nodes: [
			box('caller', 135, 14, 120, 40, 'Request', { visible: true }),
			box('wrap', 120, 104, 150, 50, 'wrapper', { sub: 'checks the login token' }),
			box('fn', 120, 214, 150, 50, 'get_orders()', { sub: 'your function' }),
			box('deny', 278, 104, 74, 50, '401', { sub: 'no login', tone: 'neg' }),
			text('dec', 14, 244, '@login_required', { w: 100, tone: 'warn' }),
			edge('e0', 'caller', 'fn', 'call'),
			edge('e1', 'caller', 'wrap'),
			edge('e2', 'wrap', 'fn', 'if allowed', { tone: 'accent' }),
			edge('e3', 'wrap', 'deny', undefined, { tone: 'neg' }),
			text('note', 180, 292, '@app.get("/orders") is a decorator too', { w: 330, anchor: 'middle', size: 'sm' })
		],
		steps: [
			{ say: 'A route function like get_orders() is called directly. Anyone who reaches the URL gets orders.', show: ['fn', 'e0'], focus: ['fn'] },
			{ say: 'Add @login_required on the line above it. A decorator is a function that wraps another one: @x above def f means f = x(f).', show: ['dec'], pulse: ['dec'] },
			{ say: 'Now calls go to the wrapper first. It can run extra code before and after, without editing get_orders().', hide: ['e0'], show: ['wrap', 'e1'], focus: ['wrap'] },
			{ say: 'A request arrives with no valid token. The wrapper answers 401 itself, and get_orders() never runs.', show: ['deny', 'e3'], set: { wrap: { tone: 'warn' } }, pulse: ['deny'] },
			{ say: 'With a valid token the wrapper passes the call on, and get_orders() runs as normal.', hide: ['deny', 'e3'], show: ['e2'], set: { wrap: { tone: 'accent' } }, pulse: ['fn'] },
			{ say: 'Backends use decorators for cross-cutting rules. @app.get("/orders") registers a route; @login_required guards one.', show: ['note'] }
		]
	},
	{
		id: 'be-generator',
		topic: 'backend',
		group: 'ch2',
		title: 'Generators stream one value at a time',
		blurb: 'How do you process a million rows without running out of memory?',
		stage: { w: 360, h: 330 },
		nodes: [
			box('mem1', 20, 20, 320, 40, 'list(rows): all 1,000,000 rows in memory', { tone: 'warn' }),
			box('mem2', 20, 82, 34, 40, '1', { tone: 'accent' }),
			text('t2', 64, 106, 'generator: one row at a time', { size: 'sm' }),
			doc('code', 20, 146, 320, ['def rows(cursor):', '    for row in cursor:', '        yield row'], { title: undefined }),
			db('db', 24, 252, 80, 44, 'Database'),
			box('gen', 132, 252, 100, 44, 'rows()', { sub: 'pauses at yield' }),
			box('hd', 262, 252, 76, 44, 'handler'),
			edge('e1', 'db', 'gen'),
			edge('e2', 'gen', 'hd'),
			token('tk', 182, 238, 'row 1')
		],
		steps: [
			{ say: 'Loading a million database rows into a list holds every row in memory at once. The server can run out of memory.', show: ['mem1'], pulse: ['mem1'] },
			{ say: 'A generator hands out one row at a time, so memory stays tiny however many rows there are.', show: ['mem2', 't2'], pulse: ['mem2'] },
			{ say: 'A function with yield is a generator. yield hands one value out and pauses the function right there.', show: ['code'], set: { code: { hl: [2] } } },
			{ say: 'The handler asks for the next row. The generator runs until its yield and produces row 1.', show: ['db', 'gen', 'hd', 'e1', 'e2', 'tk'], focus: ['gen'] },
			{ say: 'The handler processes row 1, then asks again. The generator wakes up exactly where it paused.', move: { tk: { x: 300, y: 238 } }, pulse: ['hd'] },
			{ say: 'Row 2 is produced, one at a time, never the whole table.', set: { tk: { label: 'row 2' } }, move: { tk: { x: 182, y: 238 } }, focus: ['gen'] },
			{ say: 'Streaming a million rows costs about the memory of one. Wrap it in list(...) only when you really need them all.', move: { tk: { x: 300, y: 238 } }, pulse: ['hd'] }
		]
	},
	{
		id: 'be-context-manager',
		topic: 'backend',
		group: 'ch2',
		title: 'with: cleanup that always runs',
		blurb: 'How do you guarantee a file or connection is released, even on errors?',
		nodes: [
			doc('code', 20, 14, 320, ['with open("data.txt") as f:', '    data = f.read()', '    risky()   # may raise', 'print("done")'], { visible: true }),
			box('enter', 110, 112, 140, 44, 'enter', { sub: 'open the file' }),
			box('blk', 110, 178, 140, 44, 'your block', { sub: 'runs the lines' }),
			box('err', 262, 178, 88, 44, 'raises', { sub: 'risky() fails', tone: 'neg' }),
			box('exit', 110, 244, 140, 44, 'exit', { sub: 'close the file, always' }),
			edge('e1', 'enter', 'blk'),
			edge('e2', 'blk', 'exit'),
			edge('e3', 'blk', 'err', undefined, { tone: 'neg' })
		],
		steps: [
			{ say: 'A with block wraps code that needs setup and cleanup, like opening and closing a file.', set: { code: { hl: [0] } } },
			{ say: 'Entering the block runs the setup. Here the file is opened.', show: ['enter'], set: { code: { hl: [0] } }, focus: ['enter'] },
			{ say: 'Your lines run inside the block.', show: ['blk', 'e1'], set: { code: { hl: [1, 2] } }, focus: ['blk'] },
			{ say: 'Suppose risky() raises an error halfway through.', show: ['err', 'e3'], set: { blk: { tone: 'neg' } }, pulse: ['err'] },
			{ say: 'Python still runs the exit step, so the file is closed. It is like try/finally, but tidier.', show: ['exit', 'e2'], set: { exit: { tone: 'accent' } }, pulse: ['exit'] },
			{ say: 'The same pattern releases database connections and locks, so one failed request cannot leak them.', set: { code: { hl: [3] } }, focus: ['exit'] }
		]
	}
];

const ch3: Scene[] = [
	{
		id: 'be-select-where',
		topic: 'backend',
		group: 'ch3',
		title: 'SELECT, WHERE, ORDER BY, LIMIT',
		blurb: 'How does a query turn a table into an answer?',
		nodes: [
			text('q', 14, 22, "SELECT title FROM movies WHERE rating > 8.0;", { w: 332, visible: true }),
			table('t', 14, 52, ['id', 'title', 'rating'], [['1', 'Dune', '8.5'], ['2', 'Inside Out', '8.1'], ['3', 'Tenet', '7.4'], ['4', 'Up', '8.3'], ['5', 'Cars', '7.1']], { title: 'movies', colW: 70 }),
			table('res', 238, 52, ['title'], [['Dune'], ['Inside Out'], ['Up']], { title: 'result', colW: 104, tone: 'accent' }),
			text('cl', 14, 236, '', { w: 332, size: 'sm', visible: true })
		],
		steps: [
			{ say: 'SQL reads almost like English. This asks for the titles of movies rated above 8.0.', focus: ['q'] },
			{ say: 'FROM movies: start with the whole movies table.', show: ['t'], set: { cl: { text: 'FROM movies: start with the whole table.' } }, focus: ['t'] },
			{ say: 'WHERE is a filter. Only rows where rating > 8.0 survive: Dune, Inside Out and Up.', set: { t: { hl: [0, 1, 3] }, cl: { text: 'WHERE rating > 8.0 keeps the rows that match.' } } },
			{ say: 'SELECT title picks one column from those rows. The answer is itself a small table called a result set.', show: ['res'], set: { cl: { text: 'SELECT title: keep only that column.' } }, pulse: ['res'] },
			{ say: 'ORDER BY rating DESC sorts high to low and LIMIT 2 keeps the top two: Dune, then Up.', set: { q: { text: 'SELECT title FROM movies WHERE rating > 8.0 ORDER BY rating DESC LIMIT 2;' }, res: { rows: [['Dune'], ['Up']] }, t: { hl: [0, 3] }, cl: { text: 'ORDER BY ... DESC LIMIT 2: sort, then keep the top two.' } } }
		]
	},
	{
		id: 'be-join',
		topic: 'backend',
		group: 'ch3',
		title: 'How a JOIN matches rows',
		blurb: 'How do you stitch two tables back together?',
		stage: { w: 360, h: 330 },
		nodes: [
			table('u', 16, 22, ['id', 'name'], [['1', 'Asha'], ['2', 'Ben'], ['3', 'Chen']], { title: 'users', colW: 60 }),
			table('b', 172, 22, ['id', 'user_id', 'seat'], [['1', '1', 'A1'], ['2', '1', 'A2'], ['3', '2', 'B1']], { title: 'bookings', colW: 56 }),
			text('q', 16, 152, 'SELECT b.id, u.name, b.seat FROM bookings b JOIN users u ON b.user_id = u.id;', { w: 328 }),
			table('res', 75, 184, ['id', 'name', 'seat'], [['1', 'Asha', 'A1'], ['2', 'Asha', 'A2'], ['3', 'Ben', 'B1']], { title: 'result', colW: 70 })
		],
		steps: [
			{ say: 'Data is split across tables. A booking stores user_id, which points at a row in users.', show: ['u', 'b'] },
			{ say: 'A JOIN lines up rows from two tables using a rule: ON b.user_id = u.id.', show: ['q'], focus: ['q'] },
			{ say: 'Asha has id 1, and bookings 1 and 2 both have user_id 1. Both rows match Asha.', set: { u: { hl: [0] }, b: { hl: [0, 1] } } },
			{ say: 'Ben has id 2, and booking 3 has user_id 2. One match.', set: { u: { hl: [1] }, b: { hl: [2] } } },
			{ say: "The result puts each booking beside its user's name: three rows.", show: ['res'], set: { u: { hl: [] }, b: { hl: [] } }, pulse: ['res'] },
			{ say: 'Chen (id 3) has no booking. An INNER JOIN keeps only matching rows, so Chen is not in the result.', set: { u: { hl: [2] } } },
			{ say: 'A LEFT JOIN keeps every row from the left table. Chen now appears, with NULL (no value) where a booking would be.', set: { q: { text: 'SELECT u.name, b.seat FROM users u LEFT JOIN bookings b ON b.user_id = u.id;' }, res: { cols: ['name', 'seat'], rows: [['Asha', 'A1'], ['Asha', 'A2'], ['Ben', 'B1'], ['Chen', 'NULL']], hl: [3] } } }
		]
	},
	{
		id: 'be-group-by',
		topic: 'backend',
		group: 'ch3',
		title: 'GROUP BY collapses rows',
		blurb: 'How do you count bookings per user, and filter on the count?',
		nodes: [
			table('t', 16, 30, ['id', 'user_id'], [['1', '1'], ['2', '1'], ['3', '2'], ['4', '1'], ['5', '3'], ['6', '2']], { title: 'bookings', colW: 56, visible: true }),
			table('res', 190, 30, ['user_id', 'bookings'], [['1', '3']], { title: 'result', colW: 76 }),
			text('q', 16, 238, 'SELECT user_id, COUNT(*) AS bookings FROM bookings GROUP BY user_id;', { w: 330 })
		],
		steps: [
			{ say: 'A table of bookings. We want to know how many bookings each user made.', show: ['q'] },
			{ say: "GROUP BY user_id sorts rows into one group per user. User 1's three bookings fall into one group.", set: { t: { hl: [0, 1, 3] } } },
			{ say: 'COUNT(*) counts the rows in each group, so user 1 collapses into a single result row: 3 bookings.', show: ['res'], set: { res: { hl: [0] } }, pulse: ['res'] },
			{ say: "User 2's two rows collapse the same way.", set: { t: { hl: [2, 5] }, res: { rows: [['1', '3'], ['2', '2']], hl: [1] } } },
			{ say: 'User 3 has a single booking. The result has one row per group.', set: { t: { hl: [4] }, res: { rows: [['1', '3'], ['2', '2'], ['3', '1']], hl: [2] } } },
			{ say: 'HAVING filters groups after they form: only users with more than one booking. WHERE filters rows before grouping.', set: { t: { hl: [] }, q: { text: 'SELECT user_id, COUNT(*) AS bookings FROM bookings GROUP BY user_id HAVING COUNT(*) > 1;' }, res: { rows: [['1', '3'], ['2', '2']], hl: [] } } }
		]
	},
	{
		id: 'be-update-where',
		topic: 'backend',
		group: 'ch3',
		title: 'UPDATE without WHERE hits every row',
		blurb: 'Why do backend engineers fear a missing WHERE?',
		nodes: [
			text('q', 20, 22, "UPDATE seats SET status = 'booked' WHERE id = 3;", { w: 322, visible: true }),
			table('t', 20, 52, ['id', 'label', 'status'], [['1', 'A1', 'free'], ['2', 'A2', 'free'], ['3', 'A3', 'free'], ['4', 'A4', 'free']], { title: 'seats', colW: 80 }),
			box('msg', 20, 210, 320, 44, '1 row updated', { tone: 'accent' })
		],
		steps: [
			{ say: 'Four seats, all free. We want to book seat 3.', show: ['t'] },
			{ say: 'WHERE id = 3 picks exactly one row, so only that row changes to booked.', show: ['msg'], set: { t: { rows: [['1', 'A1', 'free'], ['2', 'A2', 'free'], ['3', 'A3', 'booked'], ['4', 'A4', 'free']], hl: [2] } }, pulse: ['msg'] },
			{ say: 'Now the same command with the WHERE clause forgotten. The seats are reset to free first.', hide: ['msg'], set: { q: { text: "UPDATE seats SET status = 'booked';" }, t: { rows: [['1', 'A1', 'free'], ['2', 'A2', 'free'], ['3', 'A3', 'free'], ['4', 'A4', 'free']], hl: [] } } },
			{ say: 'Every row matches, so every seat is now booked. Nobody can book a seat any more.', show: ['msg'], set: { t: { rows: [['1', 'A1', 'booked'], ['2', 'A2', 'booked'], ['3', 'A3', 'booked'], ['4', 'A4', 'booked']], hl: [0, 1, 2, 3], tone: 'neg' }, msg: { label: '4 rows updated', tone: 'neg' } }, pulse: ['msg'] },
			{ say: 'UPDATE and DELETE without a WHERE touch every row. Write the WHERE first, then the rest of the statement.', set: { msg: { label: 'Always write the WHERE', tone: 'warn' } } },
			{ say: 'In Postgres, RETURNING shows exactly which rows changed, so you can check your work.', set: { q: { text: "UPDATE seats SET status = 'booked' WHERE id = 3 RETURNING id, status;" }, t: { tone: 'neutral', hl: [] }, msg: { label: 'RETURNING id, status', tone: 'accent' } } }
		]
	},
	{
		id: 'be-primary-foreign-key',
		topic: 'backend',
		group: 'ch3',
		title: 'Primary and foreign keys',
		blurb: 'How do tables point at each other without copying data?',
		nodes: [
			table('u', 55, 24, ['id', 'name'], [['1', 'Asha'], ['2', 'Ben'], ['3', 'Chen']], { title: 'users', colW: 70 }),
			box('pk', 215, 60, 125, 52, 'primary key', { sub: 'a unique name tag for each row', tone: 'accent' }),
			table('b', 20, 182, ['id', 'user_id', 'seat'], [['1', '1', 'A1'], ['2', '2', 'B1']], { title: 'bookings', colW: 70 }),
			edge('fk', 'u', 'b', 'user_id points to id', { tone: 'accent' }),
			box('nr', 240, 205, 100, 52, 'user_id = 99', { sub: 'new booking' })
		],
		steps: [
			{ say: 'Every row needs a permanent name tag: the primary key, here id. No two users share one.', show: ['u'], set: { u: { hl: [0] } } },
			{ say: 'The database enforces it. Adding a second user with id 1 would be rejected.', show: ['pk'], focus: ['pk'] },
			{ say: "A booking records which user made it. Instead of copying Asha's details, it stores her id.", show: ['b'], set: { u: { hl: [] } } },
			{ say: 'user_id is a foreign key: it holds the primary key of a row in another table. Booking 1 points at user 1, Asha.', show: ['fk'], set: { u: { hl: [0] }, b: { hl: [0] } } },
			{ say: 'Now try to add a booking for user_id = 99.', show: ['nr'], set: { u: { hl: [] }, b: { hl: [] } }, focus: ['nr'] },
			{ say: 'The database refuses. No user 99 exists, so the reference would dangle. This guarantee is referential integrity.', set: { nr: { tone: 'neg', label: 'rejected', sub: 'no user 99 exists' } }, pulse: ['nr'] },
			{ say: 'A booking for user 3 is accepted because Chen exists. Each fact lives once, and links can never dangle.', set: { nr: { tone: 'accent', label: 'user_id = 3', sub: 'Chen exists' }, b: { rows: [['1', '1', 'A1'], ['2', '2', 'B1'], ['3', '3', 'C1']], hl: [2] }, u: { hl: [2] } } }
		]
	}
];

const ch4: Scene[] = [
	{
		id: 'be-normalize',
		topic: 'backend',
		group: 'ch4',
		title: 'One fact in one place',
		blurb: 'Why split data into tables instead of one big sheet?',
		nodes: [
			table('sheet', 15, 24, ['name', 'email', 'movie'], [['Asha', 'asha@old.com', 'Dune'], ['Asha', 'asha@old.com', 'Tenet'], ['Ben', 'ben@x.com', 'Dune']], { title: 'one big sheet', colW: 110 }),
			table('u', 80, 28, ['id', 'email'], [['1', 'asha@old.com'], ['2', 'ben@x.com']], { title: 'users', colW: 100 }),
			table('b', 112, 168, ['user', 'movie'], [['1', 'Dune'], ['1', 'Tenet'], ['2', 'Dune']], { title: 'bookings', colW: 68 }),
			edge('fk', 'b', 'u', 'user points to id')
		],
		steps: [
			{ say: "A spreadsheet-style table repeats the user's name and email on every row.", show: ['sheet'] },
			{ say: 'Asha changes her email. You update one row...', set: { sheet: { rows: [['Asha', 'asha@new.com', 'Dune'], ['Asha', 'asha@old.com', 'Tenet'], ['Ben', 'ben@x.com', 'Dune']], hl: [0], tone: 'warn' } } },
			{ say: '...and miss the other. Now the data disagrees with itself: which email is Asha\'s?', set: { sheet: { hl: [0, 1], tone: 'neg' } } },
			{ say: 'Normalize it: each fact lives once. Emails live in users; a booking just stores the id of its user.', hide: ['sheet'], show: ['u', 'b', 'fk'] },
			{ say: "Now change Asha's email in one row.", set: { u: { rows: [['1', 'asha@new.com'], ['2', 'ben@x.com']], hl: [0], tone: 'accent' } } },
			{ say: 'Every booking that points at her sees the new value. There is nothing to forget.', set: { b: { hl: [0, 1] } }, pulse: ['b'] },
			{ say: 'The cost: reading a booking with its email now needs a JOIN. Denormalizing means copying data to avoid joins, so do it only for a measured problem.', set: { u: { hl: [] }, b: { hl: [] } } }
		]
	},
	{
		id: 'be-index-cost',
		topic: 'backend',
		group: 'ch4',
		title: 'Indexes: faster reads, costlier writes',
		blurb: 'What does an index buy you, and what does it cost?',
		nodes: [
			text('q', 20, 22, "WHERE email = 'asha@x.com'", { w: 320, visible: true }),
			box('cnt', 20, 44, 320, 40, 'No index: check every row, one by one', { tone: 'warn', visible: true }),
			db('tbl', 24, 150, 90, 50, 'users'),
			box('ix1', 150, 134, 190, 36, 'index on email'),
			box('ix2', 150, 188, 190, 36, 'index on city'),
			edge('w1', 'tbl', 'ix1'),
			edge('w2', 'tbl', 'ix2'),
			token('nr', 69, 104, 'INSERT'),
			text('note', 180, 276, 'Index columns you filter, join or sort on.', { w: 330, anchor: 'middle', size: 'sm' })
		],
		steps: [
			{ say: 'Without an index, finding one email means checking rows one by one: a million checks for a million users.', focus: ['cnt'] },
			{ say: 'An index is a separate sorted structure beside the table. With one on email, the database jumps to the row in a handful of hops.', set: { cnt: { label: 'Index on email: about 4 hops', tone: 'accent' } }, pulse: ['cnt'] },
			{ say: 'But it is not free. An index is extra data the database must keep in sync with the table.', hide: ['q', 'cnt'], show: ['tbl', 'ix1', 'ix2', 'w1', 'w2'] },
			{ say: 'Now insert a new user into the table.', show: ['nr'], focus: ['tbl'] },
			{ say: 'The row is written to the table...', move: { nr: { x: 69, y: 134 } }, pulse: ['tbl'] },
			{ say: '...and to every index too: three writes instead of one.', set: { ix1: { tone: 'warn' }, ix2: { tone: 'warn' } }, pulse: ['ix1', 'ix2'] },
			{ say: 'Reads get faster, writes get slower, and indexes use disk space. Index the columns you often filter, join or sort on.', show: ['note'] }
		]
	},
	{
		id: 'be-transaction',
		topic: 'backend',
		group: 'ch4',
		title: 'A transaction is all or nothing',
		blurb: 'What happens if the server crashes between two related writes?',
		nodes: [
			doc('code', 20, 14, 320, ['BEGIN;', "UPDATE seats SET status='booked' WHERE id=3;", 'INSERT INTO bookings VALUES (1, 3);', 'COMMIT;'], { visible: true }),
			table('seats', 20, 118, ['id', 'status'], [['2', 'free'], ['3', 'free']], { title: 'seats', colW: 70, visible: true }),
			table('bk', 190, 118, ['user', 'seat'], [], { title: 'bookings', colW: 70, visible: true }),
			box('msg', 60, 232, 240, 50, 'Server crashes', { tone: 'neg' })
		],
		steps: [
			{ say: 'Booking a seat takes two steps: mark the seat taken, then record the booking. A transaction makes them one unit.', focus: ['code'] },
			{ say: 'BEGIN opens the transaction. Nothing is final yet.', set: { code: { hl: [0] } } },
			{ say: 'The seat is marked booked, but only inside this transaction. Other users still see it as free.', set: { code: { hl: [1] }, seats: { rows: [['2', 'free'], ['3', 'booked']], hl: [1], tone: 'warn' } } },
			{ say: 'Now imagine the server crashes before the booking is recorded.', show: ['msg'], pulse: ['msg'] },
			{ say: 'The database rolls everything back. It is as if the UPDATE never happened, so no ghost reservation. That is atomicity.', set: { code: { hl: [] }, seats: { rows: [['2', 'free'], ['3', 'free']], hl: [], tone: 'neutral' }, msg: { label: 'ROLLBACK: seat 3 is free again', tone: 'accent' } } },
			{ say: 'Try again with no crash. The seat is marked and the INSERT adds the booking.', hide: ['msg'], set: { code: { hl: [2] }, seats: { rows: [['2', 'free'], ['3', 'booked']], hl: [1], tone: 'warn' }, bk: { rows: [['1', '3']], hl: [0] } } },
			{ say: 'COMMIT makes both changes permanent together. Durability means they survive a crash from this moment on.', show: ['msg'], set: { code: { hl: [3] }, seats: { tone: 'accent' }, msg: { label: 'COMMIT: both changes saved', tone: 'accent' } }, pulse: ['msg'] }
		]
	},
	{
		id: 'be-explain-analyze',
		topic: 'backend',
		group: 'ch4',
		title: 'Reading a query plan',
		blurb: 'How do you find out why a query is slow?',
		nodes: [
			text('q', 20, 18, "EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'asha@x.com';", { w: 322, visible: true }),
			doc('p1', 20, 52, 320, ['Seq Scan on users', "  Filter: (email = 'asha@x.com')", '  Rows Removed by Filter: 999999', 'Execution Time: 412.5 ms'], { title: 'Plan (example numbers)' }),
			text('idx', 20, 166, 'CREATE INDEX users_email_idx ON users (email);', { w: 322, tone: 'accent' }),
			doc('p2', 20, 180, 320, ['Index Scan using users_email_idx on users', "  Index Cond: (email = 'asha@x.com')", 'Execution Time: 0.05 ms'], { title: 'Plan after the index' })
		],
		steps: [
			{ say: 'EXPLAIN ANALYZE runs the query and shows how Postgres did it, with real timings. These plans are examples.', show: ['p1'] },
			{ say: 'Seq Scan means it read the whole table and threw away 999,999 rows to find one. That is the warning sign.', set: { p1: { hl: [0, 2], tone: 'warn' } } },
			{ say: 'It took 412.5 ms here. Fine on a test table, painful under real traffic.', set: { p1: { hl: [3] } } },
			{ say: 'The fix: create an index on the column you filter by.', show: ['idx'], pulse: ['idx'] },
			{ say: 'Run EXPLAIN ANALYZE again. The plan now says Index Scan, using the new index.', show: ['p2'], set: { p2: { hl: [0] } } },
			{ say: 'Under a tenth of a millisecond, and no longer dependent on table size. Always re-check the plan after adding an index.', set: { p2: { hl: [2], tone: 'accent' } } }
		]
	}
];

const ch5: Scene[] = [
	{
		id: 'be-request-journey',
		topic: 'backend',
		group: 'ch5',
		title: 'A request, end to end',
		blurb: 'What actually happens between a tap in the app and the data on screen?',
		nodes: [
			box('app', 120, 14, 120, 50, 'Phone app', { sub: 'fetch(...)', visible: true }),
			box('api', 120, 120, 120, 50, 'FastAPI', { sub: 'your Python code' }),
			db('db', 128, 218, 104, 54, 'Postgres'),
			edge('req', 'app', 'api', 'GET /orders/7'),
			edge('res', 'api', 'app', '200 + JSON', { tone: 'accent' }),
			edge('q', 'api', 'db', 'SELECT ...'),
			edge('row', 'db', 'api', 'the row', { tone: 'accent' }),
			token('tok', 40, 40, 'request'),
			text('note', 296, 150, 'Every API call is this loop.', { w: 120, anchor: 'middle', size: 'sm' })
		],
		steps: [
			{ say: "Your React app calls fetch('/orders/7'). That is an HTTP request: a method (GET), a path, and some headers.", show: ['tok'], focus: ['app'] },
			{ say: 'The request crosses the network to the backend, a program that is always listening for requests.', show: ['api', 'req'], move: { tok: { x: 40, y: 145 } }, focus: ['api'] },
			{ say: 'Your handler function runs. It checks the input, then asks the database for order 7.', show: ['q'], focus: ['api'], pulse: ['api'] },
			{ say: 'The database finds the row and hands it back.', show: ['db', 'row'], move: { tok: { x: 40, y: 245 } }, focus: ['db'] },
			{ say: 'The handler turns the row into JSON and sends a response with status 200, meaning success.', show: ['res'], move: { tok: { x: 40, y: 40 } }, set: { tok: { tone: 'accent', label: 'response' } }, pulse: ['app'] },
			{ say: 'Back in the app, the data appears. Every chapter in this lab is one part of this loop.', show: ['note'], focus: ['app'] }
		]
	},
	{
		id: 'be-path-vs-query',
		topic: 'backend',
		group: 'ch5',
		title: 'Path params vs query params',
		blurb: 'When does a value belong in the path, and when after the ?',
		nodes: [
			text('url', 20, 24, 'GET /users/42?full=true', { size: 'lg', visible: true }),
			box('s1', 20, 46, 110, 40, '/users'),
			box('a1', 160, 46, 180, 40, 'the users collection'),
			box('s2', 20, 100, 110, 40, '/42'),
			box('a2', 160, 100, 180, 40, 'path param: WHICH user', { tone: 'accent' }),
			box('s3', 20, 154, 110, 40, '?full=true'),
			box('a3', 160, 154, 180, 40, 'query param: HOW to show it', { tone: 'warn' }),
			doc('code', 15, 214, 330, ["@app.get('/users/{user_id}')", 'def get_user(user_id: int, full: bool = False):']),
			edge('e1', 's1', 'a1'),
			edge('e2', 's2', 'a2', undefined, { tone: 'accent' }),
			edge('e3', 's3', 'a3', undefined, { tone: 'warn' })
		],
		steps: [
			{ say: 'There are two ways to pass a value in a URL, and they mean different things.', focus: ['url'] },
			{ say: '/users is the collection the request is about.', show: ['s1', 'a1', 'e1'], focus: ['s1'] },
			{ say: '42 is a path parameter. It is part of the address: change it and you point at a different user.', show: ['s2', 'a2', 'e2'], focus: ['s2'] },
			{ say: '?full=true is a query parameter. It does not change which user; it changes how you view them. Query params are optional and have defaults.', show: ['s3', 'a3', 'e3'], focus: ['s3'] },
			{ say: 'In FastAPI the braces in the path make user_id a path parameter. FastAPI also converts it to an int for you.', show: ['code'], set: { code: { hl: [0] } } },
			{ say: 'Any other function argument, like full, becomes a query parameter with its default. Value removed and the URL points elsewhere? Path. Otherwise query.', set: { code: { hl: [1] } } }
		]
	},
	{
		id: 'be-pagination',
		topic: 'backend',
		group: 'ch5',
		title: 'Pagination: slicing a big list',
		blurb: 'How does a list endpoint return page 2 of 3?',
		nodes: [
			text('q', 16, 22, 'GET /items?page=2&size=3', { w: 330, visible: true }),
			table('items', 16, 38, ['id', 'item'], [['1', 'Mug'], ['2', 'Pen'], ['3', 'Book'], ['4', 'Lamp'], ['5', 'Desk'], ['6', 'Bag'], ['7', 'Cup'], ['8', 'Hat']], { colW: 60, visible: true }),
			doc('resp', 150, 38, 190, ['{', '"page": 2,', '"size": 3,', '"total": 8,', '"pages": 3,', '"items": [4, 5, 6]', '}'], { title: 'response' }),
			text('f1', 150, 218, 'offset = (page - 1) * size', { w: 190, size: 'sm' }),
			text('f2', 150, 238, 'pages = ceil(total / size)', { w: 190, size: 'sm' })
		],
		steps: [
			{ say: 'A list endpoint never returns thousands of rows at once. The client asks for one page: page 2, three items per page.', focus: ['q'] },
			{ say: 'Page 1 would be the first three rows.', set: { items: { hl: [0, 1, 2] } } },
			{ say: 'Page 2 skips (2 - 1) x 3 = 3 rows and takes the next three: ids 4, 5 and 6. Pages start at 1.', show: ['f1'], set: { items: { hl: [3, 4, 5] } } },
			{ say: 'The response carries the slice plus metadata, so the frontend can draw "Page 2 of 3".', show: ['resp'], pulse: ['resp'] },
			{ say: 'pages is total divided by size, rounded up: 8 / 3 is 2.67, so 3 pages. Rounding up gives the leftover rows a page.', show: ['f2'], set: { resp: { hl: [4] } } },
			{ say: 'Page 3 holds the last two rows. The last page can be short.', set: { q: { text: 'GET /items?page=3&size=3' }, items: { hl: [6, 7] }, resp: { lines: indent(['{', '"page": 3,', '"size": 3,', '"total": 8,', '"pages": 3,', '"items": [7, 8]', '}']), hl: [5] } } }
		]
	},
	{
		id: 'be-validation-422',
		topic: 'backend',
		group: 'ch5',
		title: 'Validation before your code runs',
		blurb: 'What does Pydantic do with a request body that has a field missing?',
		nodes: [
			doc('req', 20, 14, 180, ['{', '  "name": "Asha"', '}'], { title: 'POST /users body', visible: true }),
			box('gate', 15, 134, 140, 50, 'NewUser model', { sub: 'name: str, email: str' }),
			box('hd', 15, 226, 140, 50, 'your function', { sub: 'create_user(body)' }),
			doc('err', 170, 118, 180, ['{"detail": [{', '"loc": ["body", "email"],', '"msg": "Field required"', '}]}'], { title: '422 response' }),
			edge('e1', 'req', 'gate', 'JSON'),
			edge('e2', 'gate', 'hd', 'valid', { tone: 'accent' }),
			edge('e3', 'gate', 'err', undefined, { tone: 'neg' })
		],
		steps: [
			{ say: 'The client posts JSON. Notice something is missing: there is a name but no email.', focus: ['req'] },
			{ say: 'FastAPI checks the body against a Pydantic model before calling your function. The model says: name and email, both text.', show: ['gate', 'e1'], focus: ['gate'] },
			{ say: 'The model looks for each required field. name is there.', set: { req: { hl: [1] } } },
			{ say: 'email is missing, so validation fails and your function never runs.', set: { gate: { tone: 'neg' }, req: { hl: [] } }, show: ['err', 'e3'], pulse: ['gate'] },
			{ say: 'The client gets 422 Unprocessable Entity, with a message saying which field is wrong and where.', focus: ['err'], set: { err: { hl: [1, 2] } } },
			{ say: 'Send a complete body and the model accepts it. Only then does your function run, with clean, typed data.', hide: ['err', 'e3'], show: ['hd', 'e2'], set: { gate: { tone: 'accent' }, req: { lines: indent(['{', '  "name": "Asha",', '  "email": "a@x.com"', '}']) } }, pulse: ['hd'] },
			{ say: 'You wrote no checking code: the type hints on the model are the rules. Like a TypeScript interface that is enforced at runtime.', focus: ['gate'] }
		]
	},
	{
		id: 'be-response-shape',
		topic: 'backend',
		group: 'ch5',
		title: 'Never return the raw database row',
		blurb: 'How do you keep secrets out of an API response?',
		stage: { w: 360, h: 340 },
		nodes: [
			doc('row', 15, 22, 210, ['{', '"id": 7,', '"name": "Asha",', '"email": "asha@x.com",', '"password_hash": "$2b$12...",', '"is_admin": false', '}'], { title: 'database row', visible: true }),
			doc('pub', 15, 226, 210, ['{', '"id": 7,', '"name": "Asha",', '"email": "asha@x.com"', '}'], { title: 'API response', tone: 'accent' }),
			edge('e', 'row', 'pub', 'copy allowed keys', { tone: 'accent' })
		],
		steps: [
			{ say: 'Your database row holds more than the client should see: a password hash and an internal admin flag.', focus: ['row'] },
			{ say: 'Returning the row as it is would leak password_hash and is_admin to anyone who calls the endpoint.', set: { row: { hl: [4, 5], tone: 'neg' } }, pulse: ['row'] },
			{ say: 'Instead, build the public object yourself and copy over only the fields you choose: a whitelist.', show: ['e', 'pub'], set: { row: { hl: [], tone: 'neutral' } } },
			{ say: 'id, name and email are on the whitelist, so they are copied across.', set: { row: { hl: [1, 2, 3] }, pub: { hl: [1, 2, 3] } } },
			{ say: 'A blacklist (delete the bad keys) breaks the day someone adds a new secret column. A whitelist is safe by default.', set: { row: { hl: [] }, pub: { hl: [] } } },
			{ say: 'In FastAPI you declare the whitelist as a response model, and the framework drops every other field for you.', focus: ['pub'] }
		]
	}
];

const ch6: Scene[] = [
	{
		id: 'be-layers',
		topic: 'backend',
		group: 'ch6',
		title: 'Router, schema, service, database',
		blurb: 'Why split an API into layers, and what does each one do?',
		stage: { w: 360, h: 310 },
		nodes: [
			box('router', 60, 14, 130, 40, 'Router', { sub: 'URL + method' }),
			box('schema', 60, 76, 130, 40, 'Schema', { sub: 'checks the input' }),
			box('service', 60, 138, 130, 40, 'Service', { sub: 'business rules' }),
			db('db', 70, 212, 110, 50, 'Database'),
			box('handler', 236, 138, 110, 40, 'Error handler', { tone: 'warn' }),
			edge('e1', 'router', 'schema'),
			edge('e2', 'schema', 'service'),
			edge('e3', 'service', 'db'),
			edge('e4', 'service', 'handler', undefined, { tone: 'neg' }),
			token('tk', 28, 34, 'req')
		],
		steps: [
			{ say: 'A request enters at the router. Its only job is to map a URL and method to a function: thin, with almost no business logic.', show: ['router', 'tk'], focus: ['router'] },
			{ say: 'The schema, a Pydantic model, checks the shape of the input before anything else happens.', show: ['schema', 'e1'], move: { tk: { x: 28, y: 96 } }, focus: ['schema'] },
			{ say: 'The service holds the business rules, like book a seat only if it is free. It knows nothing about HTTP, so you can test it without a web server.', show: ['service', 'e2'], move: { tk: { x: 28, y: 158 } }, focus: ['service'] },
			{ say: 'The service talks to the database through models and gets plain results back.', show: ['db', 'e3'], move: { tk: { x: 28, y: 237 } }, focus: ['db'] },
			{ say: 'The answer travels back up the same layers, and the router wraps it in an HTTP response.', move: { tk: { x: 28, y: 34 } }, set: { tk: { tone: 'accent', label: 'resp' } } },
			{ say: 'If a rule is broken, the service raises an error instead of returning a half-answer.', show: ['handler', 'e4'], set: { service: { tone: 'neg' } }, pulse: ['service'] },
			{ say: 'One central error handler turns every raised error into the right status code. Each layer has one job, so a bug tells you which file to open.', set: { service: { tone: 'neutral' } }, focus: ['handler'] }
		]
	},
	{
		id: 'be-error-status',
		topic: 'backend',
		group: 'ch6',
		title: 'Which error status code?',
		blurb: 'How do you choose between 400, 401, 403, 404, 422 and 500?',
		nodes: [
			box('q1', 14, 14, 190, 36, 'Could we even parse it?'),
			box('c1', 226, 14, 112, 36, '400', { sub: 'bad request', tone: 'warn' }),
			box('q2', 14, 58, 190, 36, 'Do we know who you are?'),
			box('c2', 226, 58, 112, 36, '401', { sub: 'unauthenticated', tone: 'warn' }),
			box('q3', 14, 102, 190, 36, 'Are you allowed to do this?'),
			box('c3', 226, 102, 112, 36, '403', { sub: 'forbidden', tone: 'warn' }),
			box('q4', 14, 146, 190, 36, 'Does it exist?'),
			box('c4', 226, 146, 112, 36, '404', { sub: 'not found', tone: 'warn' }),
			box('q5', 14, 190, 190, 36, 'Do the values pass the rules?'),
			box('c5', 226, 190, 112, 36, '422', { sub: 'validation failed', tone: 'warn' }),
			box('q6', 14, 234, 190, 36, 'Did our own code break?'),
			box('c6', 226, 234, 112, 36, '500', { sub: 'server error', tone: 'neg' }),
			edge('e1', 'q1', 'c1', undefined, { tone: 'warn' }),
			edge('e2', 'q2', 'c2', undefined, { tone: 'warn' }),
			edge('e3', 'q3', 'c3', undefined, { tone: 'warn' }),
			edge('e4', 'q4', 'c4', undefined, { tone: 'warn' }),
			edge('e5', 'q5', 'c5', undefined, { tone: 'warn' }),
			edge('e6', 'q6', 'c6', undefined, { tone: 'neg' }),
			text('note', 180, 292, '4xx: the caller is wrong. 5xx: the server is.', { w: 330, anchor: 'middle', size: 'sm' })
		],
		steps: [
			{ say: 'When a request fails, ask these questions in order. First: could we even parse it? Broken JSON or a nonsense request is 400 Bad Request.', show: ['q1', 'c1', 'e1'], focus: ['q1'] },
			{ say: 'Do we know who you are? If not, 401. It says Unauthorized but really means unauthenticated: log in or send a token.', show: ['q2', 'c2', 'e2'], focus: ['q2'] },
			{ say: 'We know you, but are you allowed? If not, 403 Forbidden. Logging in again will not help.', show: ['q3', 'c3', 'e3'], focus: ['q3'] },
			{ say: 'Does the thing exist? If not, 404 Not Found. It is sometimes used on purpose to hide that a resource exists.', show: ['q4', 'c4', 'e4'], focus: ['q4'] },
			{ say: 'The JSON parsed fine, but a value broke a rule, like an email with no @ or a negative age: 422. FastAPI uses it for failed validation.', show: ['q5', 'c5', 'e5'], focus: ['q5'] },
			{ say: 'None of the above, but our own code threw an exception: 500 Internal Server Error. The client cannot fix it; it is a signal for logs and alerts.', show: ['q6', 'c6', 'e6'], focus: ['q6'] },
			{ say: 'Quick rule: 4xx means the caller got something wrong, 5xx means the server did.', show: ['note'] }
		]
	},
	{
		id: 'be-error-envelope',
		topic: 'backend',
		group: 'ch6',
		title: 'One envelope for every response',
		blurb: 'How do errors reach the frontend in one predictable shape?',
		nodes: [
			doc('ok', 170, 10, 170, ['{', '"ok": true,', '"data": {...}', '}'], { title: 'HTTP 200' }),
			box('svc', 14, 24, 130, 52, 'Service', { sub: 'raises PermissionError' }),
			box('handler', 14, 130, 130, 52, 'Error handler', { sub: 'maps error to status' }),
			doc('errd', 170, 116, 170, ['{', '"ok": false,', '"error": "Not allowed"', '}'], { title: 'HTTP 403' }),
			box('fe', 14, 226, 332, 56, 'Frontend: one handler', { sub: 'if (body.ok) show(body.data) else showError(body.error)' }),
			edge('e1', 'svc', 'handler', undefined, { tone: 'neg' }),
			edge('e2', 'handler', 'errd', undefined, { tone: 'neg' })
		],
		steps: [
			{ say: 'Every response, success or failure, has the same shape: ok, plus either data or an error.', show: ['ok'] },
			{ say: 'Inside, a service hits a problem and raises a typed error instead of returning some ad-hoc dictionary.', show: ['svc'], set: { svc: { tone: 'neg' } }, pulse: ['svc'] },
			{ say: 'A single central handler catches it and decides what it means.', show: ['handler', 'e1'], focus: ['handler'] },
			{ say: 'It maps PermissionError to status 403 and wraps the message in the standard envelope.', show: ['errd', 'e2'], pulse: ['errd'] },
			{ say: 'The frontend receives either kind of response through the same door.', show: ['fe'], focus: ['fe'] },
			{ say: 'It writes one response handler: check ok, then branch. No guessing the shape per endpoint.', set: { fe: { tone: 'accent' } } },
			{ say: 'It is the same reason a design system beats custom buttons everywhere: predictability scales.', focus: ['ok', 'errd'] }
		]
	},
	{
		id: 'be-never-trust-client',
		topic: 'backend',
		group: 'ch6',
		title: 'Never trust the client',
		blurb: 'Why validate again on the backend when the form already does?',
		nodes: [
			box('ui', 14, 14, 150, 44, 'Your form', { sub: 'checks the email' }),
			box('curl', 196, 14, 150, 44, 'curl or a script', { sub: 'skips your form' }),
			box('gate', 70, 122, 210, 50, 'API boundary', { sub: 'validates every request' }),
			box('rej', 296, 122, 52, 50, '422', { tone: 'neg' }),
			box('hd', 90, 226, 170, 46, 'Your handler', { sub: 'only sees clean data' }),
			edge('e1', 'ui', 'gate'),
			edge('e2', 'curl', 'gate'),
			edge('e3', 'gate', 'hd', undefined, { tone: 'accent' }),
			edge('e4', 'gate', 'rej', undefined, { tone: 'neg' }),
			text('note', 180, 292, 'UX on the frontend, security on the backend.', { w: 330, anchor: 'middle', size: 'sm' })
		],
		steps: [
			{ say: 'Your frontend validates forms: required fields, email format. That gives users fast feedback.', show: ['ui'], focus: ['ui'] },
			{ say: 'But anyone can skip your UI with curl, Postman, a script, or an old app version that predates your latest rule.', show: ['curl'], focus: ['curl'] },
			{ say: 'So every request, from every client, arrives at the API boundary.', show: ['gate', 'e1', 'e2'], pulse: ['gate'] },
			{ say: 'A request whose email is "nope" fails the backend check and gets a 422. Nothing past the boundary ever sees it.', show: ['rej', 'e4'], set: { gate: { tone: 'warn' } }, pulse: ['rej'] },
			{ say: 'Valid requests pass through, and your handler can trust what it receives.', show: ['hd', 'e3'], set: { gate: { tone: 'accent' } }, pulse: ['hd'] },
			{ say: 'Frontend validation is a UX feature. Backend validation is the security and correctness boundary.', show: ['note'] }
		]
	},
	{
		id: 'be-migrations',
		topic: 'backend',
		group: 'ch6',
		title: 'Migrations: git for your database',
		blurb: 'How do you change a live schema safely, the same way everywhere?',
		nodes: [
			box('m1', 14, 24, 160, 40, '001_create_users'),
			box('m2', 14, 76, 160, 40, '002_add_phone'),
			box('m3', 14, 128, 160, 40, '003_add_email_index'),
			box('lap', 206, 24, 140, 50, 'Laptop', { sub: 'schema: empty' }),
			box('stg', 206, 94, 140, 50, 'Staging', { sub: 'schema: empty' }),
			box('prod', 206, 164, 140, 50, 'Production', { sub: 'schema: at 002' }),
			text('cmd', 180, 262, 'alembic upgrade head', { w: 330, anchor: 'middle' }),
			text('note', 180, 288, 'Never edit production tables by hand.', { w: 330, anchor: 'middle', size: 'sm' })
		],
		steps: [
			{ say: 'A migration is a small, ordered script that changes the schema: create users, add a phone column, add an index. They live in git.', show: ['m1', 'm2', 'm3'] },
			{ say: 'Every environment starts from its own state: your laptop is empty, and production is one step behind.', show: ['lap', 'stg', 'prod'] },
			{ say: 'Run the migrations in order and your database reaches version 3. Alembic is the usual tool with SQLAlchemy.', show: ['cmd'], set: { lap: { sub: 'schema: at 003', tone: 'accent' } }, pulse: ['lap'] },
			{ say: 'Staging runs the same scripts in the same order and gets exactly the same schema.', set: { stg: { sub: 'schema: at 003', tone: 'accent' } }, pulse: ['stg'] },
			{ say: 'Production applies only the missing migration, 003, to real customer data, in a controlled step with a way back (the down script).', set: { prod: { sub: 'schema: at 003', tone: 'accent' } }, pulse: ['prod'] },
			{ say: 'Hand-edit one environment and it drifts: no history, no review, no way to replay it anywhere else.', set: { stg: { sub: 'hand-edited: drifted', tone: 'neg' } }, show: ['note'], pulse: ['stg'] }
		]
	}
];

export const backendPart1: Scene[] = [...ch1, ...ch2, ...ch3, ...ch4, ...ch5, ...ch6];
