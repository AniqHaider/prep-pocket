import type { Scene, SceneNode, Tone } from '../../types';

/** How Preppy was built, craft area: content model, lessons, design, navigation and the keyboard. Ids `bt-*`; `group` = a topic id in src/db/built/craft.ts. */

// A vertical chain of boxes joined by arrows: box ids `<p>0..n`, edge ids `<p>e0..` (edge i joins box i and box i+1). The first box starts visible.
type Item = { l: string; s?: string; tone?: Tone };
const stack = (p: string, items: Item[], o: { x?: number; w?: number; y?: number; h?: number; gap?: number } = {}): SceneNode[] => {
	const { x = 16, w = 200, y = 14, h = 44, gap = 28 } = o;
	const out: SceneNode[] = [];
	items.forEach((it, i) => {
		out.push({ id: p + i, kind: 'box', x, y: y + i * (h + gap), w, h, label: it.l, sub: it.s, tone: it.tone, visible: i === 0 ? true : undefined });
		if (i) out.push({ id: p + 'e' + (i - 1), kind: 'edge', from: p + (i - 1), to: p + i });
	});
	return out;
};

export const btCraft: Scene[] = [
	// ───────────── bt-content-model ─────────────
	{
		id: 'bt-engine-object',
		topic: 'built',
		group: 'bt-content-model',
		title: 'One object per section',
		blurb: 'What is a Preppy section made of, and who reads it?',
		stage: { w: 360, h: 320 },
		nodes: [
			{ id: 'e', kind: 'box', x: 16, y: 14, w: 328, h: 44, label: 'LearnEngine object', sub: 'name, tagline, topics, questions, playground', visible: true },
			{ id: 'topic', kind: 'doc', x: 16, y: 76, w: 328, title: 'One topic is plain data', lines: ["id: 'opensearch-search'", 'notes: markdown text', "scenes: ['aw-search-inverted-index', ...]", 'try: [{ label, code }]'] },
			{ id: 'e1', kind: 'edge', from: 'e', to: 'topic' },
			{ id: 'screen', kind: 'box', x: 16, y: 186, w: 328, h: 40, label: 'Database.svelte', sub: 'one screen: Learn, Quiz, Playground' },
			{ id: 'e2', kind: 'edge', from: 'topic', to: 'screen' },
			{ id: 'cap', kind: 'text', x: 180, y: 248, text: 'The same objects are also read by', anchor: 'middle', size: 'sm' },
			{ id: 'hub', kind: 'box', x: 16, y: 258, w: 100, h: 44, label: 'Visual hub', sub: 'lists lessons' },
			{ id: 'ai', kind: 'box', x: 130, y: 258, w: 100, h: 44, label: 'Assistant', sub: 'searches notes' },
			{ id: 'val', kind: 'box', x: 244, y: 258, w: 100, h: 44, label: 'Validator', sub: 'checks rules' }
		],
		steps: [
			{ say: 'Every learn section is one LearnEngine object: a name, topics, a question bank, quiz topics and an optional playground.', focus: ['e'] },
			{ say: 'A topic is plain data too: an id, markdown notes, the ids of its lessons and runnable snippets. No screen code lives inside it.', show: ['topic', 'e1'], focus: ['topic'] },
			{ say: 'One generic screen draws any engine with Learn, Quiz and Playground tabs. A new section needs no new UI.', show: ['screen', 'e2'], set: { screen: { tone: 'accent' } }, focus: ['screen'] },
			{ say: 'The Visual lessons hub reads the same objects to list lessons by topic and group.', show: ['cap', 'hub'], focus: ['hub'] },
			{ say: 'The Assistant indexes every topic\'s notes and quiz explanations, so it can answer from them and list its sources.', show: ['ai'], focus: ['ai'] },
			{ say: 'The validator checks every engine against the same rules before a release, so a mistake in data is caught on the desk, not on the phone.', show: ['val'], pulse: ['val'] }
		]
	},
	{
		id: 'bt-add-section',
		topic: 'built',
		group: 'bt-content-model',
		title: 'Adding a section: the checklist',
		blurb: 'Which files change when Preppy gets a new section?',
		stage: { w: 360, h: 360 },
		nodes: stack(
			'a',
			[
				{ l: 'The engine file', s: 'src/db/built.ts: topics, questions, id, name' },
				{ l: 'Type unions', s: 'add the id in db/types.ts and explain/types.ts' },
				{ l: 'App.svelte', s: 'a Tab, a menu item and a render branch' },
				{ l: 'groups.ts and registry.ts', s: 'lesson headings, the scene list, the label' },
				{ l: 'Visual.svelte and knowledge.ts', s: 'the hub chip and the Assistant search' },
				{ l: 'validate-content.ts', s: 'the scene id prefix and the checks' }
			],
			{ w: 328, h: 40, gap: 18 }
		),
		steps: [
			{ say: 'A section starts as one engine file: its topics, its question bank and a short name. Everything else is registration.', focus: ['a0'] },
			{ say: 'The id is added to the type unions, so the compiler knows the new section exists and flags every place that forgot it.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'App.svelte gets a Tab value, a menu entry on Home and in the slide-out menu, and a branch that renders the generic screen.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'groups.ts supplies lesson headings and registry.ts lists the scenes and the topic label, so lessons appear grouped in the Visual hub.', show: ['a3', 'ae2'], focus: ['a3'] },
			{ say: 'Visual.svelte adds the hub chip, and knowledge.ts adds the engine to the Assistant\'s search.', show: ['a4', 'ae3'], focus: ['a4'] },
			{ say: 'validate-content.ts learns the scene prefix, so the new section is held to the same rules as all the others.', show: ['a5', 'ae4'], focus: ['a5'] },
			{ say: 'Then bun run content and bun run check confirm that every id, scene and question resolves.', set: { a5: { tone: 'accent' } }, pulse: ['a5'] }
		]
	},

	// ───────────── bt-scenes ─────────────
	{
		id: 'bt-scene-anatomy',
		topic: 'built',
		group: 'bt-scenes',
		title: 'A lesson is a list of steps',
		blurb: 'How does a lesson turn data into pictures that can be replayed?',
		stage: { w: 360, h: 270 },
		nodes: [
			{ id: 'd', kind: 'doc', x: 16, y: 14, w: 328, title: 'Scene steps (each builds on the last)', lines: ['1  say: "A request leaves the client"', '2  show: [server]', '3  show: [db]   set: server tone warn', '4  hide: [server]'], hl: [], visible: true },
			{ id: 'c', kind: 'box', x: 16, y: 140, w: 90, h: 44, label: 'Client', visible: true },
			{ id: 's', kind: 'box', x: 135, y: 140, w: 90, h: 44, label: 'Server' },
			{ id: 'b', kind: 'box', x: 254, y: 140, w: 90, h: 44, label: 'Database' },
			{ id: 'e1', kind: 'edge', from: 'c', to: 's' },
			{ id: 'e2', kind: 'edge', from: 's', to: 'b' },
			{ id: 'legend', kind: 'text', x: 16, y: 222, w: 328, text: 'accent = the thing followed or the fast path · warn = cost or risk · neg = failure' }
		],
		steps: [
			{ say: 'Step 1: only the client is on stage. A scene starts with just the nodes marked visible, and everything else waits to be shown.', set: { d: { hl: [0] } }, focus: ['c'] },
			{ say: 'Step 2 shows the server. A step can show, hide, move or change any node, and the player animates the difference.', set: { d: { hl: [1] } }, show: ['s', 'e1'], focus: ['s'] },
			{ say: 'State is cumulative: step 3 keeps what steps 1 and 2 showed, adds the database, and recolours the server.', set: { d: { hl: [2] }, s: { tone: 'warn' } }, show: ['b', 'e2'], focus: ['b'] },
			{ say: 'Step 4 hides the server. Every step is computed from step 1, so the player can jump to any step and get the same picture.', set: { d: { hl: [3] } }, hide: ['s', 'e1', 'e2'] },
			{ say: 'Colour carries meaning, never decoration. A reader learns that warn means cost or risk and can read it as a hint.', show: ['legend'], set: { c: { tone: 'accent' }, b: { tone: 'warn' } }, focus: ['legend'] }
		]
	},
	{
		id: 'bt-player-layout',
		topic: 'built',
		group: 'bt-scenes',
		title: 'Inside the video-style player',
		blurb: 'Why does nothing jump while a lesson plays?',
		stage: { w: 360, h: 320 },
		nodes: [
			{ id: 'top', kind: 'box', x: 16, y: 12, w: 328, h: 34, label: 'Top bar: previous lesson, title, next lesson', visible: true },
			{ id: 'pic', kind: 'box', x: 16, y: 60, w: 328, h: 120, label: 'Animation box (fixed size)', sub: 'the scene is cropped and scaled to fit' },
			{ id: 'sub', kind: 'box', x: 16, y: 194, w: 328, h: 40, label: 'Subtitle area', sub: 'as tall as this lesson\'s longest caption' },
			{ id: 'ctl', kind: 'box', x: 16, y: 248, w: 328, h: 40, label: 'Controls: play, step, speed, read aloud', sub: 'tap the screen to show or hide' },
			{ id: 'ov1', kind: 'text', x: 180, y: 250, text: 'Subtitle laid over the picture', anchor: 'middle' },
			{ id: 'ov2', kind: 'text', x: 180, y: 282, text: 'Slim controls row, tap to show', anchor: 'middle' }
		],
		steps: [
			{ say: 'The picture sits in a box of fixed size. Every scene is cropped to what it uses and scaled to fit, so no lesson ever needs scrolling.', show: ['pic'], focus: ['pic'] },
			{ say: 'Under it the subtitle area is sized for this lesson\'s longest caption, so a new step never moves anything. Measured layout shift: 0.001.', show: ['sub'], focus: ['sub'] },
			{ say: 'Controls get their own band. Tap the screen to show or hide them; they stay up while a lesson is paused or finished.', show: ['ctl'], focus: ['ctl'] },
			{ say: 'While a lesson plays, the controls fade after a few seconds. Only a thin progress line stays, so nothing covers the data.', hide: ['ctl'] },
			{ say: 'Pause or reach the end and the controls return: play, previous and next step, progress, speed 1x, 1.5x or 2x, and Read aloud.', show: ['ctl'], set: { ctl: { tone: 'accent' } }, pulse: ['ctl'] },
			{ say: 'Held sideways, the picture takes the full height. The subtitle sits on top of it and one slim row of controls overlays it.', hide: ['sub', 'ctl'], set: { pic: { h: 236, label: 'Animation: full height', sub: '' } }, show: ['ov1', 'ov2'], focus: ['pic'] }
		]
	},

	// ───────────── bt-design ─────────────
	{
		id: 'bt-design-path',
		topic: 'built',
		group: 'bt-design',
		title: 'How the look changed',
		blurb: 'Which looks did Preppy go through before Midnight gold?',
		stage: { w: 360, h: 360 },
		nodes: stack(
			'a',
			[
				{ l: 'Early versions', s: 'borders, shadows, gradients, emoji icons' },
				{ l: '1.3 · true black', s: 'one typeface (Inter), lime on progress only' },
				{ l: '2.2 · deep indigo', s: 'softer rounded cards, violet primary' },
				{ l: '2.3 · Midnight gold', s: 'chosen from twenty directions' },
				{ l: 'docs/design.md', s: 'the rules, written down' }
			],
			{ w: 328, h: 44, gap: 28 }
		),
		steps: [
			{ say: 'Early versions used borders, shadows, gradients and emoji icons. Version 1.3 removed all four.', focus: ['a0'] },
			{ say: '1.3 (22 October) went true black: surfaces separated by lightness alone, one typeface, one icon set, and lime used only on progress.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: '2.2 (27 October) swapped pure black for deep indigo, with softer rounded cards, a violet primary colour and a frosted top bar.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: '2.3 (27 October) settled on Midnight gold, picked from twenty directions: near-black, cream text, thin gold lines and a classical serif.', show: ['a3', 'ae2'], set: { a3: { tone: 'accent' } }, focus: ['a3'] },
			{ say: 'The rules were written into docs/design.md, so every later screen follows the same ones.', show: ['a4', 'ae3'], pulse: ['a4'] }
		]
	},
	{
		id: 'bt-gold-rules',
		topic: 'built',
		group: 'bt-design',
		title: 'Gold has jobs, colour never works alone',
		blurb: 'What does each colour mean in Preppy?',
		stage: { w: 360, h: 270 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 20,
				title: 'Who gets which colour',
				cols: ['Meaning', 'Colour', 'Also carries'],
				colW: 109,
				rows: [
					['Primary action', 'gold', 'solid button'],
					['Progress', 'gold', 'bar, count'],
					['Correct', 'green', 'check icon'],
					['Wrong', 'red', 'icon, word'],
					['Anything else', 'none', 'cream or grey']
				],
				hl: [],
				visible: true
			},
			{ id: 'f', kind: 'box', x: 16, y: 206, w: 328, h: 44, label: 'Accessibility floor', sub: '44 px targets, 12 px text, 4.5:1, focus ring' }
		],
		steps: [
			{ say: 'Colour in Preppy is not decoration. Each colour has one job, and the table lists them.', focus: ['t'] },
			{ say: 'Gold is for what you act on and where you are: the one primary button, progress bars, the active tab and the active menu row.', set: { t: { hl: [0, 1] } } },
			{ say: 'Green means correct and red means wrong. Both always come with an icon or a word, for anyone who cannot tell them apart.', set: { t: { hl: [2, 3] } } },
			{ say: 'Nothing else is coloured. That restraint is what lets the few coloured things be read at a glance.', set: { t: { hl: [4] } } },
			{ say: 'Under the look sits a floor: 44 px touch targets, 12 px minimum text, 4.5:1 contrast, a visible focus ring and reduced motion honoured.', set: { t: { hl: [] }, f: { tone: 'accent' } }, show: ['f'], pulse: ['f'] }
		]
	},

	// ───────────── bt-nav ─────────────
	{
		id: 'bt-back-planner',
		topic: 'built',
		group: 'bt-nav',
		title: 'What the Back button does',
		blurb: 'How does one planner decide between closing, Home and quitting?',
		stage: { w: 360, h: 300 },
		nodes: [
			{ id: 's', kind: 'box', x: 16, y: 14, w: 180, h: 44, label: 'Android Back', sub: 'hardware button or gesture', visible: true },
			{ id: 'q1', kind: 'box', x: 16, y: 86, w: 180, h: 44, label: 'Anything open on top?', sub: 'menu, assistant, player, topic' },
			{ id: 'r1', kind: 'box', x: 214, y: 86, w: 130, h: 44, label: 'history.back()', sub: 'closes the top layer', tone: 'accent' },
			{ id: 'q2', kind: 'box', x: 16, y: 158, w: 180, h: 44, label: 'In a section?', sub: 'any tab except Home' },
			{ id: 'r2', kind: 'box', x: 214, y: 158, w: 130, h: 44, label: 'Go to Home', sub: 'from a top screen' },
			{ id: 'qq', kind: 'box', x: 16, y: 230, w: 180, h: 44, label: 'Ask "Quit Preppy?"', sub: 'Stay or Quit', tone: 'warn' },
			{ id: 'e0', kind: 'edge', from: 's', to: 'q1' },
			{ id: 'e1', kind: 'edge', from: 'q1', to: 'r1', label: 'yes' },
			{ id: 'e2', kind: 'edge', from: 'q1', to: 'q2', label: 'no' },
			{ id: 'e3', kind: 'edge', from: 'q2', to: 'r2', label: 'yes' },
			{ id: 'e4', kind: 'edge', from: 'q2', to: 'qq', label: 'no' }
		],
		steps: [
			{ say: 'On Android, Back is history.back(), so Preppy has to decide what that should mean on every screen.', focus: ['s'] },
			{ say: 'First question: is anything open on top? The menu, the assistant sheet, the lesson player and an opened topic, drill or quiz screen all count.', show: ['q1', 'e0'], focus: ['q1'] },
			{ say: 'If so, Back closes it with history.back(). Each of those layers pushed its own history entry when it opened.', show: ['r1', 'e1'], pulse: ['r1'] },
			{ say: 'If nothing is open, the planner asks whether a section is showing rather than Home.', show: ['q2', 'e2'], focus: ['q2'] },
			{ say: 'Yes: go to Home. Back from a section\'s top screen no longer retraces the sections you visited earlier.', show: ['r2', 'e3'], pulse: ['r2'] },
			{ say: 'No, you are on Home, so the app asks Quit Preppy? with Stay and Quit. One stray press never closes it.', show: ['qq', 'e4'], pulse: ['qq'] }
		]
	},
	{
		id: 'bt-history-stack',
		topic: 'built',
		group: 'bt-nav',
		title: 'How history entries pile up',
		blurb: 'Which actions add a history entry, and which reuse one?',
		stage: { w: 360, h: 200 },
		nodes: [
			{ id: 'h', kind: 'doc', x: 16, y: 20, w: 328, title: 'History stack (the last line is the top)', lines: ['Home'], visible: true },
			{ id: 'pop', kind: 'box', x: 16, y: 124, w: 328, h: 44, label: 'popstate event', sub: 'restores what the entry below recorded' }
		],
		steps: [
			{ say: 'Preppy starts with one history entry: Home. Everything else either adds to it or reuses it.', focus: ['h'] },
			{ say: 'Opening a section from Home replaces the entry instead of pushing, so Back from its top screen has nothing earlier to retrace.', set: { h: { lines: ['AWS section'] } }, pulse: ['h'] },
			{ say: 'Opening a topic pushes an entry through useBack, so Back can close the topic and land on the section\'s list.', set: { h: { lines: ['AWS section', 'topic: S3'] } }, pulse: ['h'] },
			{ say: 'The lesson player is a layer on top of everything, so it pushes an entry too.', set: { h: { lines: ['AWS section', 'topic: S3', 'player: lesson'] } }, pulse: ['h'] },
			{ say: 'Back pops the player. The popstate handler restores what the entry below recorded, and the player closes.', set: { h: { lines: ['AWS section', 'topic: S3'] } }, show: ['pop'], pulse: ['pop'] },
			{ say: 'The menu pushes an entry as well. Choosing an item reuses that entry, so switching sections never stacks more.', set: { h: { lines: ['AWS section', 'topic: S3', 'menu open'] } }, hide: ['pop'], pulse: ['h'] }
		]
	},

	// ───────────── bt-keyboard ─────────────
	{
		id: 'bt-keyboard-layers',
		topic: 'built',
		group: 'bt-keyboard',
		title: 'Three layers and a fixed top row',
		blurb: 'What is on Preppy\'s code keyboard, and what never moves?',
		stage: { w: 360, h: 310 },
		nodes: [
			{ id: 'top', kind: 'box', x: 16, y: 14, w: 328, h: 40, label: 'Tab  (  )  {  }  [  ]  ;  Undo  Hide', sub: 'the fixed top row, on every layer', visible: true },
			{ id: 'l1', kind: 'box', x: 16, y: 70, w: 328, h: 46, label: 'Letters', sub: 'three rows; Shift once, twice for caps lock' },
			{ id: 'l2', kind: 'box', x: 16, y: 130, w: 328, h: 46, label: 'Numbers', sub: '0 to 9, = + - * / % _ < > & ! ? : and quotes' },
			{ id: 'l3', kind: 'box', x: 16, y: 190, w: 328, h: 46, label: 'Symbols', sub: '~ ^ @ # $ | \\ ` & _ and the brackets again' },
			{ id: 'bot', kind: 'box', x: 16, y: 250, w: 328, h: 40, label: 'Layer key  ,  space  .  arrows  Enter', sub: 'the fixed bottom row' }
		],
		steps: [
			{ say: 'A top row stays on every layer: Tab, parentheses, braces, brackets, the semicolon, Undo and a hide key. They are most of what code is made of.', focus: ['top'] },
			{ say: 'Letters come with Shift. Tap once for one capital, tap twice for caps lock, tap again to turn it off.', show: ['l1'], focus: ['l1'] },
			{ say: 'The numbers layer holds the digits and the operators, plus ! ? : the quotes, the backtick and the period.', show: ['l2'], focus: ['l2'] },
			{ say: 'The symbols layer adds ~ ^ @ # $ | and a backslash. Brackets and the semicolon are still on the top row.', show: ['l3'], focus: ['l3'] },
			{ say: 'The bottom row has the layer switch, comma, space and period, cursor keys that repeat when held, and a gold Enter.', show: ['bot'], set: { bot: { tone: 'accent' } }, pulse: ['bot'] }
		]
	},
	{
		id: 'bt-enter-indent',
		topic: 'built',
		group: 'bt-keyboard',
		title: 'Enter keeps your indentation',
		blurb: 'What does the new line start with after you press Enter?',
		stage: { w: 360, h: 300 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				title: 'The rule for the next line',
				cols: ['Line above', 'Enter gives'],
				colW: 164,
				rows: [
					['let total = 0;', 'same indentation'],
					['function f() {', 'one level deeper'],
					['if (ready) {', 'one level deeper'],
					['def total(xs):', 'one level deeper'],
					['const rows = [', 'one level deeper']
				],
				hl: [],
				visible: true
			},
			{ id: 'tab', kind: 'box', x: 16, y: 192, w: 328, h: 40, label: 'Tab inserts two spaces', sub: 'or indentMore in a CodeMirror editor' },
			{ id: 'two', kind: 'box', x: 16, y: 246, w: 328, h: 40, label: 'Two kinds of editor, one result', sub: 'plain boxes use this rule, CodeMirror its own' }
		],
		steps: [
			{ say: 'Enter copies the indentation of the line you are on, so a block of code stays aligned as you type.', set: { t: { hl: [0] } } },
			{ say: 'When the line ends with an opening brace, the next line goes one level deeper: two spaces.', set: { t: { hl: [1, 2] } } },
			{ say: 'A colon (Python) and an opening bracket or parenthesis do the same, so you rarely indent by hand.', set: { t: { hl: [3, 4] } } },
			{ say: 'Tab is a key of its own, because a phone keyboard has none. It inserts two spaces.', set: { t: { hl: [] } }, show: ['tab'], focus: ['tab'] },
			{ say: 'The playgrounds use plain text boxes with this rule, while CodeMirror editors use their own indent command. Enter feels the same in both.', show: ['two'], set: { two: { tone: 'accent' } }, pulse: ['two'] }
		]
	}
];
