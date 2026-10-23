import type { BoxNode, DocNode, EdgeNode, Scene, TextNode, TokenNode, TableNode, Tone } from '../types';

/** React animated lessons (ids rc-*). Group = the id of the topic in src/db/react.ts. React 19 / 19.2 behaviour. */

type Opt<T> = Partial<Omit<T, 'id' | 'kind' | 'x' | 'y'>>;
const box = (id: string, x: number, y: number, w: number, h: number, label: string, o: Opt<BoxNode> = {}): BoxNode => ({ id, kind: 'box', x, y, w, h, label, ...o });
const doc = (id: string, x: number, y: number, w: number, lines: string[], o: Opt<DocNode> = {}): DocNode => ({ id, kind: 'doc', x, y, w, lines, ...o });
const txt = (id: string, x: number, y: number, text: string, o: Opt<TextNode> = {}): TextNode => ({ id, kind: 'text', x, y, text, ...o });
const edge = (id: string, from: EdgeNode['from'], to: EdgeNode['to'], o: Opt<EdgeNode> = {}): EdgeNode => ({ id, kind: 'edge', from, to, ...o });
const tok = (id: string, x: number, y: number, o: Opt<TokenNode> = {}): TokenNode => ({ id, kind: 'token', x, y, ...o });
const table = (id: string, x: number, y: number, cols: string[], rows: string[][], o: Opt<TableNode> = {}): TableNode => ({ id, kind: 'table', x, y, cols, rows, ...o });
const tone = (t: Tone) => ({ tone: t });

export const reactScenes: Scene[] = [
	// ───────── components-and-props ─────────
	{
		id: 'rc-props-down-events-up',
		topic: 'react',
		group: 'components-and-props',
		title: 'Props down, events up',
		blurb: 'How do two components share data when props are read-only?',
		stage: { w: 360, h: 230 },
		nodes: [
			box('p', 120, 14, 120, 46, 'Parent', { sub: 'count = 2', visible: true }),
			box('c', 120, 140, 120, 46, 'Child', { sub: 'shows count' }),
			edge('down', 'p', 'c', { label: 'count={count}' }),
			edge('up', 'c', 'p', { label: 'onAdd()', tone: 'accent' }),
			txt('note', 180, 224, 'Data goes down. Events go up.', { anchor: 'middle', size: 'sm' })
		],
		steps: [
			{ say: 'A Parent component owns a piece of data: here, count is 2. In React, data flows one way, from parent to child.', focus: ['p'] },
			{ say: 'The parent passes it down as a prop: count={count}. The child can use it to draw itself.', show: ['c', 'down'], focus: ['c'] },
			{ say: 'Props are read-only. The child must not change count; it only reads it. The parent still owns the value.', set: { c: { sub: 'reads count = 2' } }, pulse: ['c'] },
			{ say: 'To ask for a change, the child calls a function the parent passed down as another prop, here onAdd.', show: ['up'], focus: ['up'] },
			{ say: 'The parent runs setCount(3). Because the parent owns the state, the parent is the one that updates it.', set: { p: { sub: 'setCount(3)', tone: 'warn' } }, pulse: ['p'] },
			{ say: 'React re-renders the parent with count = 3, and passes the new value down. That is how components talk: data down, events up.', set: { p: { sub: 'count = 3', tone: 'neutral' }, c: { sub: 'reads count = 3' } }, show: ['note'], pulse: ['c'] }
		]
	},

	// ───────── state-and-rendering ─────────
	{
		id: 'rc-render-commit',
		topic: 'react',
		group: 'state-and-rendering',
		title: 'Trigger, render, commit',
		blurb: 'What really happens between a click and the screen changing?',
		stage: { w: 360, h: 290 },
		nodes: [
			box('trigger', 14, 14, 150, 44, 'Trigger', { sub: 'setCount(1) was called', visible: true }),
			box('render', 14, 100, 150, 44, 'Render', { sub: 'calls your components' }),
			box('commit', 14, 186, 150, 44, 'Commit', { sub: 'React updates the DOM' }),
			edge('e1', 'trigger', 'render', { label: 'schedule' }),
			edge('e2', 'render', 'commit', { label: 'new tree' }),
			doc('dom', 214, 100, 136, ['<p>', '  Count: 0', '</p>'], { title: 'DOM' }),
			txt('note', 14, 268, 'Render does not touch the DOM. Commit does.', { size: 'sm' })
		],
		steps: [
			{ say: 'Step one is the trigger: a click calls setCount. React does not change the screen yet. It queues the update.', show: ['dom'], focus: ['trigger'] },
			{ say: 'Step two is render: React calls your component functions again to work out what the screen should look like now.', show: ['render', 'e1'], focus: ['render'], pulse: ['render'] },
			{ say: 'Rendering touches nothing on screen. It only produces a description of the UI. That is why render must be pure.', focus: ['render'] },
			{ say: 'Step three is commit: React compares the new description with the last one and changes only what differs.', show: ['commit', 'e2'], focus: ['commit'] },
			{ say: 'Only the text changed, so React updates just that text node in the DOM. Then the browser paints.', set: { dom: { lines: ['<p>', '  Count: 1', '</p>'], hl: [1] } }, pulse: ['dom'] },
			{ say: 'Rendering is not the same as updating the DOM. A component can render and still commit no change if its output is the same.', show: ['note'], focus: ['note'] }
		]
	},
	{
		id: 'rc-state-snapshot',
		topic: 'react',
		group: 'state-and-rendering',
		title: 'State is a snapshot',
		blurb: 'Why does calling setCount three times only add one?',
		stage: { w: 360, h: 270 },
		nodes: [
			doc('code', 8, 14, 196, ['onClick={() => {', '  setCount(count + 1)', '  setCount(count + 1)', '  setCount(count + 1)', '}}'], { title: 'handler', visible: true }),
			box('snap', 222, 30, 128, 56, 'This render', { sub: 'count = 0 (a snapshot)', visible: true }),
			box('next', 222, 130, 128, 56, 'Next render', { sub: 'count = ?' }),
			txt('note', 8, 262, 'Use an updater when new depends on old.', { size: 'sm' })
		],
		steps: [
			{ say: 'In this render, count is 0. Inside the handler it is not a live variable. It is the value 0 from this render.', focus: ['snap'] },
			{ say: 'setCount(count + 1) means setCount(0 + 1). It queues the update "set to 1".', set: { code: { hl: [1] } } },
			{ say: 'The second call reads the same count, still 0. It queues "set to 1" again, not "add one more".', set: { code: { hl: [2] } } },
			{ say: 'The third call does the same. Three updates are queued, and all of them say 1.', set: { code: { hl: [3] } } },
			{ say: 'After the handler, React renders once with count = 1, not 3. Each render sees its own fixed snapshot of state.', show: ['next'], set: { next: { sub: 'count = 1', tone: 'warn' }, code: { hl: [] } }, pulse: ['next'] },
			{ say: 'Pass an updater function instead: each call gets the result of the previous one, so you get 1, 2, 3.', set: { code: { lines: ['onClick={() => {', '  setCount(c => c + 1)', '  setCount(c => c + 1)', '  setCount(c => c + 1)', '}}'], hl: [1, 2, 3] }, next: { sub: 'count = 3', tone: 'accent' } }, show: ['note'], pulse: ['next'] }
		]
	},
	{
		id: 'rc-batching',
		topic: 'react',
		group: 'state-and-rendering',
		title: 'Batching: many updates, one render',
		blurb: 'Does every setState call cause a re-render?',
		stage: { w: 360, h: 270 },
		nodes: [
			box('handler', 100, 12, 160, 48, 'Click handler', { sub: 'setA(1); setB(2)', visible: true }),
			box('queue', 100, 96, 160, 48, 'Update queue', { sub: 'empty' }),
			box('render', 100, 180, 160, 48, 'Render', { sub: 'renders so far: 0' }),
			edge('e1', 'handler', 'queue', { label: 'queued' }),
			edge('e2', 'queue', 'render', { label: 'when the handler ends', tone: 'accent' }),
			txt('note', 180, 258, 'Also true in setTimeout, promises and fetch callbacks.', { size: 'sm', anchor: 'middle' })
		],
		steps: [
			{ say: 'A click handler calls two setters one after the other: setA(1) and setB(2).', focus: ['handler'] },
			{ say: 'React does not re-render after each call. It puts the update in a queue and keeps going.', show: ['queue', 'e1'], set: { queue: { sub: 'A = 1' } }, pulse: ['queue'] },
			{ say: 'The second setter joins the same queue. Nothing has been rendered yet.', set: { queue: { sub: 'A = 1, B = 2' } }, pulse: ['queue'] },
			{ say: 'When the handler finishes, React renders once, with both new values together.', show: ['render', 'e2'], set: { render: { sub: 'renders so far: 1', tone: 'accent' } }, pulse: ['render'] },
			{ say: 'This is called batching. Since React 18 it also applies inside setTimeout, promises and fetch callbacks, not only event handlers.', show: ['note'], focus: ['note'] }
		]
	},

	// ───────── keys-and-lists ─────────
	{
		id: 'rc-keys-identity',
		topic: 'react',
		group: 'keys-and-lists',
		title: 'Keys decide whose state is whose',
		blurb: 'Why can deleting one row show another row’s typed text?',
		stage: { w: 360, h: 220 },
		nodes: [
			txt('lt', 14, 18, 'key = index', { visible: true }),
			txt('rt', 196, 18, 'key = id', { visible: true }),
			box('l0', 14, 30, 150, 44, 'Asha', { sub: 'key 0 · typed "hi"', visible: true }),
			box('l1', 14, 84, 150, 44, 'Ben', { sub: 'key 1 · typed ""', visible: true }),
			box('l2', 14, 138, 150, 44, 'Chen', { sub: 'key 2 · typed ""', visible: true }),
			box('r0', 196, 30, 150, 44, 'Asha', { sub: 'key a1 · typed "hi"', visible: true }),
			box('r1', 196, 84, 150, 44, 'Ben', { sub: 'key b2 · typed ""', visible: true }),
			box('r2', 196, 138, 150, 44, 'Chen', { sub: 'key c3 · typed ""', visible: true })
		],
		steps: [
			{ say: 'Two lists show the same three people, each row with its own text input. The user has typed "hi" into Asha’s row.', focus: ['l0', 'r0'] },
			{ say: 'React tells rows apart between renders by their key. On the left the key is the array index. On the right it is each person’s id.', focus: ['lt', 'rt'] },
			{ say: 'Now Asha is deleted from the data. The list has two people left.', hide: ['l2', 'r0'], set: { l0: { label: 'Ben', sub: 'key 0 · typed "hi"' }, l1: { label: 'Chen', sub: 'key 1 · typed ""' } }, move: { r1: { x: 196, y: 30 }, r2: { x: 196, y: 84 } } },
			{ say: 'Left: the first row is still key 0, so React keeps that row’s input state. Ben now shows the "hi" typed for Asha. A bug.', set: { l0: { tone: 'neg' } }, focus: ['l0'], pulse: ['l0'] },
			{ say: 'Right: key a1 is gone, so Asha’s row and its state are removed. Ben’s row keeps its own state, which is empty.', set: { r1: { tone: 'accent' } }, focus: ['r1'], pulse: ['r1'] },
			{ say: 'Use a stable id as the key whenever items can be reordered, inserted or removed. Index keys are fine only for static lists.', focus: ['r1', 'r2'] }
		]
	},

	// ───────── hooks-rules ─────────
	{
		id: 'rc-hook-order',
		topic: 'react',
		group: 'hooks-rules',
		title: 'Hooks are found by call order',
		blurb: 'Why can’t a hook sit inside an if statement?',
		stage: { w: 360, h: 290 },
		nodes: [
			table('t1', 8, 14, ['slot', 'call'], [['1', 'useState(name)'], ['2', 'useState(age)'], ['3', 'useEffect(...)']], { title: 'Render 1', colW: 96, visible: true }),
			table('t2', 8, 150, ['slot', 'call'], [['1', 'useState(age)'], ['2', 'useEffect(...)'], ['3', '(nothing)']], { title: 'Render 2: first hook skipped', colW: 96 }),
			box('bad', 214, 188, 136, 56, 'Mixed up', { sub: 'age reads name’s slot', tone: 'neg' }),
			txt('note', 8, 280, 'Top level only. Never in if, loops or after a return.', { size: 'sm' })
		],
		steps: [
			{ say: 'React does not know your hooks by name. It remembers them by the order they are called: first call, second call, third call.', focus: ['t1'] },
			{ say: 'On render 1, slot 1 holds name, slot 2 holds age, slot 3 is the effect. Each slot keeps its own saved value.', set: { t1: { hl: [0, 1, 2] } } },
			{ say: 'Imagine the first hook sits inside an if, and this time the condition is false. That call is skipped.', show: ['t2'], set: { t1: { hl: [] } }, focus: ['t2'] },
			{ say: 'Every call after it moves up one slot. useState(age) now lands in slot 1, which holds the saved name.', set: { t2: { hl: [0] } }, pulse: ['t2'] },
			{ say: 'age reads the value that belonged to name. State is mixed up, so React warns or throws.', show: ['bad'], pulse: ['bad'] },
			{ say: 'That is the Rules of Hooks: call them at the top level, in the same order every render. Never in conditions, loops or after an early return.', show: ['note'], focus: ['note'] }
		]
	}	,
	// ───────── effects ─────────
	{
		id: 'rc-effect-lifecycle',
		topic: 'react',
		group: 'effects',
		title: 'An effect sets up and cleans up',
		blurb: 'When does an effect run, and when does its cleanup run?',
		stage: { w: 360, h: 220 },
		nodes: [
			box('ev', 10, 14, 150, 44, 'Mount', { sub: 'roomId = A', visible: true }),
			box('conn', 10, 110, 150, 44, 'Connection', { sub: 'none', visible: true }),
			doc('log', 180, 14, 170, [], { title: 'what React runs', visible: true }),
			txt('note', 10, 206, 'Setup and cleanup always come as a pair.', { size: 'sm' })
		],
		steps: [
			{ say: 'The component mounts with roomId = A. React renders, commits to the DOM, and only then runs the effect.', set: { log: { lines: ['effect: connect(A)'], hl: [0] }, conn: { sub: 'room A', tone: 'accent' } }, pulse: ['conn'] },
			{ say: 'The effect set something up: a connection. It also returned a cleanup function that undoes exactly that.', focus: ['conn', 'log'] },
			{ say: 'Now a re-render happens with roomId = B. The dependency changed, so the effect has to run again.', set: { ev: { label: 'Update', sub: 'roomId = B' } }, pulse: ['ev'] },
			{ say: 'First, React runs the previous effect’s cleanup, with the old values: disconnect from A.', set: { log: { lines: ['effect: connect(A)', 'cleanup: disconnect(A)'], hl: [1] }, conn: { sub: 'none', tone: 'neutral' } }, pulse: ['log'] },
			{ say: 'Then it runs the effect again with the new values: connect to B.', set: { log: { lines: ['effect: connect(A)', 'cleanup: disconnect(A)', 'effect: connect(B)'], hl: [2] }, conn: { sub: 'room B', tone: 'accent' } }, pulse: ['conn'] },
			{ say: 'When the component unmounts, cleanup runs one last time, so nothing is left connected.', set: { ev: { label: 'Unmount', sub: 'gone from screen' }, log: { lines: ['effect: connect(A)', 'cleanup: disconnect(A)', 'effect: connect(B)', 'cleanup: disconnect(B)'], hl: [3] }, conn: { sub: 'none', tone: 'neutral' } }, pulse: ['log'] },
			{ say: 'In development, Strict Mode runs setup, cleanup, setup once on mount, to expose a missing cleanup. If the pair is right, you will not notice.', show: ['note'], focus: ['note'] }
		]
	},
	{
		id: 'rc-stale-interval',
		topic: 'react',
		group: 'effects',
		title: 'The stale value in an interval',
		blurb: 'Why does this counter get stuck at 1?',
		stage: { w: 360, h: 260 },
		nodes: [
			doc('code', 8, 14, 244, ['useEffect(() => {', '  const id = setInterval(() => {', '    setCount(count + 1)', '  }, 1000)', '  return () => clearInterval(id)', '}, [])'], { visible: true }),
			box('r1', 8, 150, 108, 52, 'Render #1', { sub: 'count = 0' }),
			box('iv', 126, 150, 108, 52, 'Interval', { sub: 'remembers 0' }),
			box('scr', 244, 150, 108, 52, 'Screen', { sub: 'count: 0' }),
			txt('note', 8, 244, 'Fix: setCount(c => c + 1) needs no outside value.', { size: 'sm' })
		],
		steps: [
			{ say: 'The dependency array is empty, so this effect runs once, after the first render, where count is 0.', show: ['r1'], set: { code: { hl: [5] } }, focus: ['r1'] },
			{ say: 'The function given to setInterval closes over count from that first render. It will always see 0.', show: ['iv'], set: { code: { hl: [2] } }, focus: ['iv'] },
			{ say: 'After one second it calls setCount(0 + 1). The screen shows 1.', show: ['scr'], set: { scr: { sub: 'count: 1', tone: 'accent' } }, pulse: ['scr'] },
			{ say: 'The component re-renders with count = 1, but no dependency changed, so the effect does not re-run. The interval keeps its old closure.', set: { r1: { label: 'Render #2', sub: 'count = 1' } }, pulse: ['r1'] },
			{ say: 'Next tick it calls setCount(0 + 1) again. The count is stuck at 1. The linter rule exhaustive-deps warns about exactly this.', set: { scr: { sub: 'count: 1 (stuck)', tone: 'warn' } }, focus: ['scr'] },
			{ say: 'Fix it with the updater form, which needs no outside value, or list count in the dependencies and let the effect restart.', set: { code: { lines: ['useEffect(() => {', '  const id = setInterval(() => {', '    setCount(c => c + 1)', '  }, 1000)', '  return () => clearInterval(id)', '}, [])'], hl: [2] }, scr: { sub: 'count: 2, 3, 4...', tone: 'accent' } }, show: ['note'], pulse: ['scr'] }
		]
	},
	{
		id: 'rc-effect-race',
		topic: 'react',
		group: 'effects',
		title: 'A late response overwrites a new one',
		blurb: 'What goes wrong when you fetch inside an effect as the user types?',
		stage: { w: 360, h: 280 },
		nodes: [
			box('in', 110, 10, 140, 40, 'Search box', { sub: 'query = a', visible: true }),
			box('r1', 14, 104, 150, 44, 'Request 1', { sub: 'for "a" (slow)' }),
			box('r2', 196, 104, 150, 44, 'Request 2', { sub: 'for "ab" (fast)' }),
			box('scr', 110, 200, 140, 44, 'Screen', { sub: 'no results yet' }),
			edge('e1', 'in', 'r1'),
			edge('e2', 'in', 'r2'),
			edge('e3', 'r1', 'scr'),
			edge('e4', 'r2', 'scr', { tone: 'accent' }),
			txt('note', 14, 270, 'Cleanup sets ignore = true for the old run.', { size: 'sm' })
		],
		steps: [
			{ say: 'The user types a. An effect fetches results for a. The server is slow, so the answer will take a while.', show: ['r1', 'e1'], focus: ['r1'] },
			{ say: 'They type b. The effect runs again and sends a second request for ab. Request 1 is still in flight.', set: { in: { sub: 'query = ab' } }, show: ['r2', 'e2'], focus: ['r2'] },
			{ say: 'Request 2 is quick and returns first. The screen shows the results for ab, which is correct.', show: ['scr', 'e4'], set: { scr: { sub: 'results for "ab"', tone: 'accent' } }, pulse: ['scr'] },
			{ say: 'Then request 1 finally returns and calls setResults. The screen now shows results for a, while the box says ab. A race.', show: ['e3'], set: { scr: { sub: 'results for "a" (wrong)', tone: 'neg' }, r1: { tone: 'neg' } }, pulse: ['scr'] },
			{ say: 'Fix it in the cleanup: each effect run has an ignore flag, and cleanup sets it to true when a newer run starts.', set: { r1: { tone: 'neutral' }, scr: { sub: 'results for "ab"', tone: 'accent' } }, hide: ['e3'] },
			{ say: 'Now request 1 sees ignore = true when it returns and drops its answer. Only the latest run can update the screen.', set: { r1: { sub: 'ignored', tone: 'warn' } }, show: ['note'], focus: ['scr'] }
		]
	},

	// ───────── refs-and-the-dom ─────────
	{
		id: 'rc-ref-vs-state',
		topic: 'react',
		group: 'refs-and-the-dom',
		title: 'A ref changes without a render',
		blurb: 'What is the difference between useRef and useState?',
		stage: { w: 360, h: 300 },
		nodes: [
			box('st', 14, 14, 150, 52, 'useState', { sub: 'count = 0', visible: true }),
			box('rf', 196, 14, 150, 52, 'useRef', { sub: 'current = 0', visible: true }),
			box('scr', 100, 112, 160, 52, 'Screen', { sub: 'renders: 1', visible: true }),
			box('inp', 14, 210, 150, 52, 'inputRef.current', { sub: 'the <input> node' }),
			box('dom', 196, 210, 150, 52, 'DOM', { sub: '<input> in the page' }),
			edge('e1', 'inp', 'dom'),
			txt('note', 14, 292, 'A ref is a box React does not watch.', { size: 'sm' })
		],
		steps: [
			{ say: 'Both useState and useRef keep a value between renders. They differ in what happens when it changes.', focus: ['st', 'rf'] },
			{ say: 'Calling setCount(1) changes state and tells React to render again.', set: { st: { sub: 'count = 1', tone: 'accent' }, scr: { sub: 'renders: 2' } }, pulse: ['scr'] },
			{ say: 'Assigning ref.current = 1 just stores the value. React is not told, so nothing re-renders.', set: { rf: { sub: 'current = 1', tone: 'warn' } }, focus: ['rf'] },
			{ say: 'That is why you should not read a ref during rendering to draw the UI: the screen can be out of date. Refs are for values React does not need to show.', set: { scr: { sub: 'renders: 2 (ref unseen)' } }, focus: ['scr'] },
			{ say: 'Refs also hold DOM nodes. Write ref={inputRef} on an element, and after the commit inputRef.current is that node.', show: ['inp', 'dom', 'e1'], pulse: ['inp'] },
			{ say: 'Now an event handler can call inputRef.current.focus(). In React 19 a function component receives ref as an ordinary prop.', focus: ['inp'] , show: ['note']}
		]
	},
	{
		id: 'rc-portal-events',
		topic: 'react',
		group: 'refs-and-the-dom',
		title: 'Portals: new DOM place, same React parent',
		blurb: 'Where does a click go when the button lives in a portal?',
		stage: { w: 360, h: 270 },
		nodes: [
			txt('lt', 14, 17, 'React tree', { visible: true }),
			txt('rt', 214, 17, 'DOM', { visible: true }),
			box('app', 14, 24, 136, 42, 'App', { sub: 'onClick handler', visible: true }),
			box('dlg', 14, 100, 136, 42, 'Dialog', { sub: 'createPortal(...)', visible: true }),
			box('btn', 14, 176, 136, 42, 'Button', { visible: true }),
			edge('t1', 'app', 'dlg', { visible: true }),
			edge('t2', 'dlg', 'btn', { visible: true }),
			box('root', 214, 24, 136, 42, '#root', { sub: 'App renders here' }),
			box('mroot', 214, 100, 136, 42, '#modal-root', { sub: 'portal target' }),
			box('dbtn', 214, 176, 136, 42, '<button>', { sub: 'inside #modal-root' }),
			edge('d1', 'mroot', 'dbtn'),
			edge('port', 'dlg', 'mroot', { dashed: true, tone: 'accent' }),
			tok('click', 150, 197, { label: 'click', tone: 'warn' })
		],
		steps: [
			{ say: 'In the React tree, App renders a Dialog, and the Dialog renders a Button through createPortal.', focus: ['dlg'] },
			{ say: 'In the DOM, the portal puts that button under #modal-root, a different place from #root where App lives.', show: ['root', 'mroot', 'dbtn', 'd1', 'port'], focus: ['mroot'] },
			{ say: 'A portal changes where DOM nodes go. It does not change where the component sits in the React tree.', focus: ['port'] },
			{ say: 'The user clicks the button inside the dialog. Where does that click event go?', show: ['click'], pulse: ['btn'] },
			{ say: 'The event bubbles through the React tree: Button, then Dialog, then App. App’s onClick runs, even though the DOM parents differ.', move: { click: { x: 150, y: 45 } }, set: { app: { tone: 'accent' } }, pulse: ['app'] },
			{ say: 'So a modal can live at the top of the page for layout and still act like a child of the component that opened it, context included.', focus: ['app', 'dlg'] }
		]
	},

	// ───────── context-and-reducers ─────────
	{
		id: 'rc-context-skip',
		topic: 'react',
		group: 'context-and-reducers',
		title: 'Context skips the middle layers',
		blurb: 'How does a deep component read a value without prop drilling?',
		stage: { w: 360, h: 290 },
		nodes: [
			box('prov', 14, 14, 132, 44, 'Provider', { sub: 'theme = dark', visible: true }),
			box('lay', 14, 80, 132, 40, 'Layout', { visible: true }),
			box('side', 14, 142, 132, 40, 'Sidebar', { visible: true }),
			box('btn', 14, 204, 132, 44, 'Button', { sub: 'useContext(Theme)', visible: true }),
			edge('p1', 'prov', 'lay', { visible: true }),
			edge('p2', 'lay', 'side', { visible: true }),
			edge('p3', 'side', 'btn', { visible: true }),
			edge('pipe', { x: 160, y: 36 }, { x: 160, y: 226 }, { label: 'context value', tone: 'accent' }),
			txt('note', 190, 250, 'Split or memoize a context that changes often.', { w: 160, size: 'sm' })
		],
		steps: [
			{ say: 'Passing a value through many layers as props is tedious: Layout and Sidebar would have to accept it just to forward it. That is prop drilling.', focus: ['lay', 'side'] },
			{ say: 'Context skips the layers. A Provider holds the value, and any component below it can read the closest one.', show: ['pipe'], focus: ['pipe'] },
			{ say: 'The Button calls useContext and gets dark directly. Layout and Sidebar know nothing about it.', set: { btn: { sub: 'theme = dark', tone: 'accent' } }, pulse: ['btn'] },
			{ say: 'Now the Provider’s value changes to light. React re-renders the components that read that context.', set: { prov: { sub: 'theme = light', tone: 'warn' }, btn: { sub: 'theme = light' } }, pulse: ['prov', 'btn'] },
			{ say: 'Layout and Sidebar do not read the context, so the context change alone does not make them re-render. Only the readers do.', focus: ['btn'] },
			{ say: 'Trap: value={{ user, setUser }} is a new object on every render, so every reader re-renders each time. Memoize it, or split contexts that change at different rates.', show: ['note'], focus: ['note'] }
		]
	},
	{
		id: 'rc-reducer-dispatch',
		topic: 'react',
		group: 'context-and-reducers',
		title: 'A reducer turns an action into new state',
		blurb: 'What does dispatch actually do?',
		stage: { w: 360, h: 330 },
		nodes: [
			box('comp', 110, 10, 140, 40, 'Component', { sub: 'dispatch(action)', visible: true }),
			doc('act', 95, 80, 170, ['{ type: "added",', '  text: "Milk" }'], { title: 'action' }),
			box('red', 110, 170, 140, 44, 'reducer', { sub: '(state, action) => next' }),
			doc('st', 95, 252, 170, ['["Eggs"]'], { title: 'state' }),
			edge('e1', 'comp', 'act'),
			edge('e2', 'act', 'red'),
			edge('e3', 'red', 'st', { tone: 'accent' })
		],
		steps: [
			{ say: 'Instead of many setState calls, the component sends a small description of what happened: an action.', show: ['act', 'e1', 'st'], focus: ['act'] },
			{ say: 'dispatch hands the action to React, which calls your reducer with the current state and the action.', show: ['red', 'e2'], focus: ['red'], pulse: ['red'] },
			{ say: 'The reducer is a pure function: (state, action) => next state. The same inputs always give the same output, with no side effects.', focus: ['red'] },
			{ say: 'It returns a new state. It must not push into the old array. Copy it instead: [...todos, newItem].', show: ['e3'], set: { st: { lines: ['["Eggs", "Milk"]'], hl: [0] } }, pulse: ['st'] },
			{ say: 'React compares the result with the old state using Object.is. A new array triggers a render. The same array means nothing happens.', focus: ['st'] },
			{ say: 'Reducers fit when several fields change together or the update logic deserves its own tests, away from the UI.', focus: ['red', 'st'] }
		]
	},
	// ───────── forms-and-actions ─────────
	{
		id: 'rc-form-action',
		topic: 'react',
		group: 'forms-and-actions',
		title: 'A form Action, step by step',
		blurb: 'What happens when you pass a function to a form’s action?',
		stage: { w: 360, h: 270 },
		nodes: [
			box('form', 10, 14, 146, 56, 'form action={fn}', { sub: 'name = Ana', visible: true }),
			box('act', 214, 14, 136, 56, 'Your action', { sub: '(prev, formData)' }),
			box('state', 214, 150, 136, 56, 'state', { sub: 'null', visible: true }),
			box('pend', 10, 150, 146, 56, 'isPending', { sub: 'false', visible: true }),
			edge('e1', 'form', 'act', { label: 'submit' }),
			edge('e2', 'act', 'state', { label: 'return', tone: 'accent' }),
			txt('note', 10, 250, 'useActionState gives you state, the wrapped action and isPending.', { w: 340, size: 'sm' })
		],
		steps: [
			{ say: 'In React 19 you can give a form a function as its action. React calls it with the form’s FormData when the form is submitted.', focus: ['form'] },
			{ say: 'The submit calls your action inside a transition, so the page stays responsive while it runs.', show: ['act', 'e1'], pulse: ['act'] },
			{ say: 'While the action runs, isPending is true. Use it to disable the button or show Saving...', set: { pend: { sub: 'true', tone: 'warn' }, form: { sub: 'name = Ana (saving)' } }, focus: ['pend'] },
			{ say: 'The action receives the previous state and the form data, and returns the next state: for example an error message, or null on success.', show: ['e2'], set: { state: { sub: '"Name is taken"', tone: 'neg' } }, pulse: ['state'] },
			{ say: 'React stores the returned value as the new state and sets isPending back to false.', set: { pend: { sub: 'false', tone: 'neutral' }, form: { sub: 'name = Ana' } }, pulse: ['pend'] },
			{ say: 'After a successful action React resets uncontrolled fields. To keep what the user typed after an error, return the values and use them as defaultValue.', show: ['note'], focus: ['form', 'note'] }
		]
	},
	{
		id: 'rc-optimistic',
		topic: 'react',
		group: 'forms-and-actions',
		title: 'Optimistic updates and rollback',
		blurb: 'How can the screen update before the server answers?',
		stage: { w: 360, h: 260 },
		nodes: [
			doc('shown', 10, 14, 160, ['Buy milk', 'Walk dog'], { title: 'On screen', visible: true }),
			doc('real', 190, 14, 160, ['Buy milk', 'Walk dog'], { title: 'Real state', visible: true }),
			box('srv', 100, 130, 160, 52, 'Server action', { sub: 'waiting', visible: true }),
			txt('note', 10, 232, 'The optimistic value is a temporary overlay.', { size: 'sm' })
		],
		steps: [
			{ say: 'A user adds "Call mum". The server needs a second to answer. The real state still has two items.', set: { srv: { sub: 'saving...', tone: 'warn' } }, focus: ['srv'] },
			{ say: 'useOptimistic lets the screen show the new item immediately, while the action is still running.', set: { shown: { lines: ['Buy milk', 'Walk dog', 'Call mum (sending)'], hl: [2] } }, pulse: ['shown'] },
			{ say: 'The real state, which comes from the server, has not changed yet. The extra line is only a temporary overlay.', focus: ['real'] },
			{ say: 'The server confirms. The real state now contains the item, and React switches back to it. The screen looks the same.', set: { real: { lines: ['Buy milk', 'Walk dog', 'Call mum'], hl: [2] }, shown: { lines: ['Buy milk', 'Walk dog', 'Call mum'], hl: [] }, srv: { sub: 'done', tone: 'accent' } }, pulse: ['real'] },
			{ say: 'Now a second try that fails. Another item is shown at once as sending.', set: { shown: { lines: ['Buy milk', 'Walk dog', 'Call mum', 'Pay rent (sending)'], hl: [3] }, srv: { sub: 'saving...', tone: 'warn' } }, pulse: ['shown'] },
			{ say: 'The action fails. The real state is unchanged, so React reverts to it automatically and the item disappears. Show an error message too.', set: { shown: { lines: ['Buy milk', 'Walk dog', 'Call mum'], hl: [] }, srv: { sub: 'failed', tone: 'neg' } }, show: ['note'], pulse: ['srv'] }
		]
	},

	// ───────── memoization-and-the-compiler ─────────
	{
		id: 'rc-memo-cascade',
		topic: 'react',
		group: 'memoization-and-the-compiler',
		title: 'Re-render cascade and memo',
		blurb: 'When a parent re-renders, which children re-render?',
		stage: { w: 360, h: 270 },
		nodes: [
			box('par', 110, 10, 140, 44, 'Parent', { sub: 'count state', visible: true }),
			box('a', 10, 120, 100, 56, 'Child A', { sub: 'plain', visible: true }),
			box('b', 130, 120, 100, 56, 'Child B', { sub: 'memo', visible: true }),
			box('c', 250, 120, 100, 56, 'Child C', { sub: 'memo + inline {}', visible: true }),
			edge('e1', 'par', 'a', { visible: true }),
			edge('e2', 'par', 'b', { visible: true }),
			edge('e3', 'par', 'c', { visible: true }),
			txt('note', 10, 232, 'Fix: hoist the object, useMemo it, or use React Compiler.', { w: 340, size: 'sm' })
		],
		steps: [
			{ say: 'A parent holds some state and renders three children. A is plain, B is wrapped in memo, C is wrapped in memo too.', focus: ['par'] },
			{ say: 'The user clicks, and the parent’s state changes. The parent renders again.', set: { par: { sub: 'count: 1', tone: 'warn' } }, pulse: ['par'] },
			{ say: 'By default, when a component re-renders, all of its children re-render, even if their props did not change.', set: { a: { tone: 'warn', sub: 'plain: re-rendered' } }, pulse: ['a'] },
			{ say: 'memo makes a child skip the render when its props are shallowly equal to last time. B gets no new props, so React skips it.', set: { b: { tone: 'accent', sub: 'memo: skipped' } }, pulse: ['b'] },
			{ say: 'C is memoized too, but the parent passes style={{ color: "red" }}. That object is new on every render, so the shallow check fails.', set: { c: { tone: 'warn', sub: 'new {} each time: re-rendered' } }, pulse: ['c'] },
			{ say: 'To fix C, move the object outside the component or useMemo it. Or let React Compiler do this memoization for you.', show: ['note'], focus: ['note'] }
		]
	},
	{
		id: 'rc-compiler',
		topic: 'react',
		group: 'memoization-and-the-compiler',
		title: 'What React Compiler does',
		blurb: 'How can components skip work without useMemo?',
		stage: { w: 360, h: 330 },
		nodes: [
			doc('src', 70, 14, 220, ['function List({ items }) {', '  const sorted = sort(items)', '  return <Rows rows={sorted} />', '}'], { title: 'you write', visible: true }),
			box('comp', 110, 124, 140, 44, 'React Compiler', { sub: 'runs at build time' }),
			doc('out', 70, 214, 220, ['sorted: cached by items', '<Rows>: cached by sorted'], { title: 'what runs (conceptually)' }),
			edge('e1', 'src', 'comp'),
			edge('e2', 'comp', 'out', { tone: 'accent' })
		],
		steps: [
			{ say: 'You write a plain component: no useMemo, no useCallback, no memo wrapper.', focus: ['src'] },
			{ say: 'React Compiler is a build-time tool. It reads your code as you build, not while the app runs.', show: ['comp', 'e1'], pulse: ['comp'] },
			{ say: 'It works out which values depend on which inputs, and caches each one so it is only recomputed when its inputs change.', show: ['e2', 'out'], pulse: ['out'] },
			{ say: 'The result is the skipping that memo and useMemo give you, applied automatically, and at finer grain, even after early returns.', set: { out: { hl: [0, 1] } }, focus: ['out'] },
			{ say: 'If a component breaks the Rules of React, for example by mutating props, the compiler skips that one and leaves it as is. Add a "use no memo" directive to opt a component out.', set: { comp: { tone: 'warn', sub: 'skips unsafe components' } }, pulse: ['comp'] },
			{ say: 'Existing useMemo and useCallback calls can stay, since they can still matter as effect dependencies. Just stop adding new ones by default.', set: { comp: { tone: 'neutral', sub: 'runs at build time' }, out: { hl: [] } }, focus: ['src'] }
		]
	},

	// ───────── suspense-and-transitions ─────────
	{
		id: 'rc-suspense-fallback',
		topic: 'react',
		group: 'suspense-and-transitions',
		title: 'Suspense shows a fallback while waiting',
		blurb: 'What does React show while a component’s data is loading?',
		stage: { w: 360, h: 300 },
		nodes: [
			box('page', 110, 10, 140, 40, 'Page', { visible: true }),
			box('sus', 80, 82, 200, 44, 'Suspense', { sub: 'fallback={Spinner}', visible: true }),
			box('alb', 80, 164, 200, 44, 'Albums', { sub: 'needs data', visible: true }),
			box('fb', 80, 230, 200, 44, 'Spinner', { sub: 'the fallback' }),
			edge('e1', 'page', 'sus', { visible: true }),
			edge('e2', 'sus', 'alb', { visible: true })
		],
		steps: [
			{ say: 'A Suspense boundary wraps a component that may not be ready yet. Here Albums needs data to render.', focus: ['sus'] },
			{ say: 'On first render Albums asks for data that has not arrived. It suspends: it tells React "I am not ready".', set: { alb: { tone: 'warn', sub: 'waiting for data' } }, pulse: ['alb'] },
			{ say: 'React shows the nearest boundary’s fallback instead, while the rest of the page stays interactive.', show: ['fb'], set: { sus: { tone: 'warn' } }, pulse: ['fb'] },
			{ say: 'When the data arrives, React tries to render Albums again.', set: { alb: { tone: 'accent', sub: 'data arrived' } }, pulse: ['alb'] },
			{ say: 'It succeeds, so React swaps the fallback out and shows the real content.', hide: ['fb'], set: { sus: { tone: 'accent' }, alb: { sub: 'rendered' } }, pulse: ['alb'] },
			{ say: 'With nested boundaries, the one closest above the suspending component shows its fallback, so the outer content stays put.', focus: ['sus', 'alb'] }
		]
	},
	{
		id: 'rc-transition',
		topic: 'react',
		group: 'suspense-and-transitions',
		title: 'Transitions keep the old screen',
		blurb: 'How do you avoid a spinner flash when switching tabs?',
		stage: { w: 360, h: 280 },
		nodes: [
			box('tabs', 110, 10, 140, 40, 'Tab bar', { sub: 'Posts | Comments', visible: true }),
			box('scr', 14, 100, 150, 56, 'On screen', { sub: 'Posts', visible: true }),
			box('bg', 196, 100, 150, 56, 'Rendering', { sub: 'Comments (loading)' }),
			box('pend', 110, 196, 140, 44, 'isPending', { sub: 'false', visible: true }),
			txt('note', 14, 268, 'Urgent updates, like typing, can interrupt it.', { w: 340, size: 'sm' })
		],
		steps: [
			{ say: 'The screen shows Posts. The user clicks the Comments tab, and Comments needs data that is not ready.', set: { tabs: { sub: 'clicked Comments' } }, show: ['bg'], pulse: ['tabs'] },
			{ say: 'As a normal update, the screen would jump to a spinner and hide the Posts they were reading.', set: { scr: { label: 'Spinner', sub: 'Posts hidden', tone: 'neg' } }, pulse: ['scr'] },
			{ say: 'Now wrap the tab change in startTransition. That tells React the update is not urgent.', set: { scr: { label: 'On screen', sub: 'Posts', tone: 'neutral' } }, focus: ['tabs'] },
			{ say: 'React keeps showing Posts, renders Comments in the background, and sets isPending to true, so you can dim the tab.', set: { pend: { sub: 'true', tone: 'warn' }, bg: { tone: 'warn' } }, focus: ['pend'] },
			{ say: 'If the user does something urgent meanwhile, like typing, that update goes first and the transition can be interrupted.', show: ['note'], focus: ['note'] },
			{ say: 'When Comments is ready, React swaps it in at once. There was no flash of a spinner, and Posts stayed visible until then.', set: { scr: { sub: 'Comments', tone: 'accent' }, bg: { sub: 'done', tone: 'neutral' }, pend: { sub: 'false', tone: 'neutral' } }, pulse: ['scr'] }
		]
	},

	// ───────── server-components ─────────
	{
		id: 'rc-server-client',
		topic: 'react',
		group: 'server-components',
		title: 'Server and Client Components',
		blurb: 'Which code runs where, and what crosses the boundary?',
		stage: { w: 360, h: 300 },
		nodes: [
			box('db', 14, 14, 120, 50, 'Database', { visible: true }),
			box('srv', 14, 110, 120, 56, 'Server Component', { sub: 'ProductPage', visible: true }),
			box('br', 216, 110, 130, 56, 'Browser', { visible: true }),
			box('cli', 216, 208, 130, 56, 'Client Component', { sub: "'use client'" }),
			edge('q', 'db', 'srv', { label: 'query' }),
			edge('pay', 'srv', 'br', { label: 'RSC payload', tone: 'accent' }),
			edge('bundle', 'cli', 'br', { tone: 'warn' }),
			txt('note', 14, 292, 'Props must be serializable: no inline functions.', { w: 340, size: 'sm' })
		],
		steps: [
			{ say: 'A Server Component runs only on the server. It can read the database directly, and it cannot use state or event handlers.', show: ['q'], focus: ['srv'] },
			{ say: 'It renders to a description of the UI, the RSC payload. Its own code is never sent to the browser.', show: ['pay'], pulse: ['srv'] },
			{ say: 'The browser receives the payload and builds the page from it.', pulse: ['br'] },
			{ say: 'A Client Component is marked with "use client". Its code is bundled and sent to the browser, where it can use state and handlers.', show: ['cli', 'bundle'], focus: ['cli'] },
			{ say: 'The server component can render a client one and pass it props, but props must be serializable: strings, numbers, Dates, plain objects, not inline functions.', show: ['note'], set: { cli: { tone: 'accent' } }, focus: ['note'] },
			{ say: 'The "use client" file marks a boundary: that file and everything it imports ships to the client. Keep that boundary small and low in the tree.', focus: ['cli', 'bundle'] }
		]
	},
	{
		id: 'rc-promise-prop',
		topic: 'react',
		group: 'server-components',
		title: 'Passing a promise to the client',
		blurb: 'How can a server component hand over slow data without blocking?',
		stage: { w: 360, h: 290 },
		nodes: [
			box('srv', 14, 14, 150, 56, 'Server Component', { sub: 'starts fetch, no await', visible: true }),
			tok('pr', 100, 100, { label: 'promise' }),
			box('cli', 196, 110, 150, 56, 'Client Component', { sub: 'use(promise)' }),
			box('fb', 196, 200, 150, 44, 'Fallback', { sub: 'Loading comments...' }),
			edge('e1', 'srv', 'cli', { dashed: true, label: 'prop' }),
			txt('note', 14, 276, 'Never create the promise during a client render.', { w: 340, size: 'sm' })
		],
		steps: [
			{ say: 'A Server Component starts a slow fetch but does not await it. All it has right now is a promise.', show: ['pr'], focus: ['srv'] },
			{ say: 'It sends the rest of the page right away and passes the promise as a prop to a Client Component inside a Suspense boundary.', show: ['cli', 'e1'], move: { pr: { x: 270, y: 80 } }, pulse: ['cli'] },
			{ say: 'In the browser, the Client Component reads the promise with use(). It is not resolved yet, so it suspends and the fallback shows.', show: ['fb'], set: { cli: { tone: 'warn', sub: 'suspended' } }, pulse: ['fb'] },
			{ say: 'Meanwhile the server finishes the fetch and streams the result to the browser.', set: { srv: { sub: 'fetch finished', tone: 'accent' } }, pulse: ['srv'] },
			{ say: 'The promise resolves, use() returns the value, and React shows the real Comments. The rest of the page never waited.', hide: ['fb'], set: { cli: { tone: 'accent', sub: 'comments shown' } }, pulse: ['cli'] },
			{ say: 'Do not create the promise inside a Client Component’s render: a new promise each render suspends again and never settles.', show: ['note'], focus: ['note'] }
		]
	},

	// ───────── hydration-and-ssr ─────────
	{
		id: 'rc-hydration-mismatch',
		topic: 'react',
		group: 'hydration-and-ssr',
		title: 'A hydration mismatch',
		blurb: 'Why does React complain that the server and client differ?',
		stage: { w: 360, h: 290 },
		nodes: [
			doc('srv', 70, 30, 220, ['<p>10:42:07</p>'], { title: 'HTML from the server', visible: true }),
			doc('cli', 70, 126, 220, ['<p>10:42:09</p>'], { title: 'Client first render' }),
			box('bad', 100, 210, 160, 44, 'Mismatch', { sub: 'text differs', tone: 'neg' }),
			txt('note', 14, 280, 'Same first render, then update in an effect.', { w: 340, size: 'sm' })
		],
		steps: [
			{ say: 'On the server React renders the component to HTML. It prints the current time: 10:42:07.', focus: ['srv'] },
			{ say: 'The HTML reaches the browser and shows at once. Then React hydrates: it attaches handlers to that existing HTML.', pulse: ['srv'] },
			{ say: 'To hydrate, React renders the component again in the browser and compares the result with the HTML. Now Date.now() says 10:42:09.', show: ['cli'], pulse: ['cli'] },
			{ say: 'The text no longer matches the server HTML. That is a hydration mismatch. React 19 reports it as one error with a diff.', show: ['bad'], pulse: ['bad'] },
			{ say: 'Do not render Date.now(), Math.random() or window values directly. Render something the same on both sides first.', set: { srv: { lines: ['<p>--:--:--</p>'] }, cli: { lines: ['<p>--:--:--</p>'] }, bad: { sub: 'matches', tone: 'accent', label: 'Match' } }, focus: ['srv', 'cli'] },
			{ say: 'Then update after mount in an effect. The first render agrees, and the real time appears right after.', set: { cli: { lines: ['<p>10:42:09</p>'] } }, show: ['note'], pulse: ['cli'] }
		]
	},
	{
		id: 'rc-streaming-ssr',
		topic: 'react',
		group: 'hydration-and-ssr',
		title: 'Streaming server rendering',
		blurb: 'Why does the page appear before the slow data is ready?',
		stage: { w: 360, h: 300 },
		nodes: [
			box('srv', 14, 14, 120, 50, 'Server', { sub: 'renders HTML', visible: true }),
			box('br', 216, 14, 130, 50, 'Browser', { sub: 'empty', visible: true }),
			doc('page', 150, 110, 200, ['<header>...</header>', '<main>', '  <Suspense fallback>', '</main>'], { title: 'what the browser has' }),
			edge('e1', 'srv', 'br', { label: 'HTML', tone: 'accent' }),
			box('slow', 14, 110, 120, 56, 'Comments', { sub: 'slow query' }),
			txt('note', 14, 250, 'Clicks inside a pending boundary are replayed after it hydrates.', { w: 340, size: 'sm' })
		],
		steps: [
			{ say: 'Without streaming, the server waits for the slowest data before it sends any HTML at all.', focus: ['srv'] },
			{ say: 'With Suspense, the server sends the shell right away: the header, the navigation and fallbacks, as HTML.', show: ['e1', 'page'], set: { br: { sub: 'shell visible', tone: 'accent' } }, pulse: ['page'] },
			{ say: 'The page is already visible, and the parts that are ready can start to hydrate.', pulse: ['br'] },
			{ say: 'The slow Comments section is still loading on the server, so its place in the page holds a fallback.', show: ['slow'], set: { slow: { tone: 'warn' } }, pulse: ['slow'] },
			{ say: 'When it is ready, React streams that HTML chunk and swaps it in where the fallback was.', set: { slow: { tone: 'accent', sub: 'ready' }, page: { lines: ['<header>...</header>', '<main>', '  <Comments> loaded', '</main>'], hl: [2] } }, pulse: ['page'] },
			{ say: 'If the user clicks inside a part that has not hydrated yet, React hydrates that part first and replays the click.', show: ['note'], focus: ['note'] }
		]
	},

	// ───────── errors-and-testing ─────────
	{
		id: 'rc-error-boundary',
		topic: 'react',
		group: 'errors-and-testing',
		title: 'An error boundary catches a crash',
		blurb: 'What stops one broken component from blanking the page?',
		stage: { w: 360, h: 300 },
		nodes: [
			box('page', 110, 10, 140, 40, 'Page', { visible: true }),
			box('eb', 110, 82, 140, 44, 'ErrorBoundary', { sub: 'class component', visible: true }),
			box('prof', 110, 160, 140, 44, 'Profile', { sub: 'renders user.name', visible: true }),
			box('fb', 110, 236, 140, 40, 'Fallback UI', { sub: 'Something went wrong' }),
			edge('e1', 'page', 'eb', { visible: true }),
			edge('e2', 'eb', 'prof', { visible: true }),
			txt('note', 14, 296, 'Event handler errors need try/catch.', { w: 340, size: 'sm' })
		],
		steps: [
			{ say: 'An error boundary wraps part of the UI. It is a class component that defines getDerivedStateFromError or componentDidCatch.', focus: ['eb'] },
			{ say: 'Profile throws while rendering: user is null, and user.name crashes.', set: { prof: { tone: 'neg', sub: 'throws during render' } }, pulse: ['prof'] },
			{ say: 'The error travels up the tree to the nearest error boundary.', set: { eb: { tone: 'warn' } }, pulse: ['eb'] },
			{ say: 'The boundary renders its fallback instead of the crashed part. The rest of the page keeps working.', show: ['fb'], hide: [], set: { prof: { tone: 'neutral', sub: 'not shown' } }, pulse: ['fb'] },
			{ say: 'Boundaries only catch errors thrown while rendering. An error inside an onClick handler is not caught: handle it with try/catch.', show: ['note'], focus: ['note'] },
			{ say: 'On createRoot you can pass onCaughtError and onUncaughtError to report errors that a boundary caught, and errors that nothing caught.', focus: ['eb'] }
		]
	},
	{
		id: 'rc-test-findby',
		topic: 'react',
		group: 'errors-and-testing',
		title: 'Testing like a user: find, wait',
		blurb: 'How do you test UI that appears after async data loads?',
		stage: { w: 360, h: 260 },
		nodes: [
			doc('code', 8, 14, 238, ['render(<Results />)', 'await user.click(button)', 'await screen.findByRole(', "  'heading', { name: /results/i })"], { title: 'test', visible: true }),
			box('scr', 254, 30, 98, 60, 'Screen', { sub: 'a button', visible: true }),
			box('hd', 254, 130, 98, 60, 'Heading', { sub: 'not here yet' }),
			txt('note', 8, 232, 'Import act from react in React 19; Testing Library wraps it.', { w: 340, size: 'sm' })
		],
		steps: [
			{ say: 'A good test acts like a user. It renders the component, then finds things the way assistive technology does: by role and name.', set: { code: { hl: [0] } }, focus: ['scr'] },
			{ say: 'userEvent.click simulates the whole sequence a browser sends for a click: pointer and mouse events, focus, then click. fireEvent.click sends just the one click event.', set: { code: { hl: [1] } }, pulse: ['scr'] },
			{ say: 'The click loads data asynchronously, so the heading is not on screen yet. getByRole would fail immediately.', show: ['hd'], set: { hd: { tone: 'warn' } }, pulse: ['hd'] },
			{ say: 'findByRole waits and retries until the heading appears, or a timeout runs out. That makes it the right query for async UI.', set: { code: { hl: [2, 3] } }, focus: ['hd'] },
			{ say: 'The heading renders, the query resolves, and the test moves on.', set: { hd: { tone: 'accent', sub: 'Results' } }, pulse: ['hd'] },
			{ say: 'In React 19, import act from react, not react-dom/test-utils. Testing Library already wraps its helpers in act for you.', show: ['note'], focus: ['note'] }
		]
	}
];
