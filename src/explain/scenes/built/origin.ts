import type { Scene, SceneNode, Tone } from '../../types';

/** How Preppy was built, part 1 (why it exists, the stack, offline engines, the Backend lab port). Ids `bt-*`; `group` = a topic id in src/db/built/origin.ts. */

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

export const btOrigin: Scene[] = [
	// ───────────── bt-why ─────────────
	{
		id: 'bt-why-origin',
		topic: 'built',
		group: 'bt-why',
		title: 'From four projects to one app',
		blurb: 'How did scattered study projects become one offline app, and what rules came with it?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 's0', kind: 'box', x: 10, y: 14, w: 76, h: 50, label: 'Backend Dojo', visible: true },
			{ id: 's1', kind: 'box', x: 98, y: 14, w: 76, h: 50, label: 'Svelte + TS prep', visible: true },
			{ id: 's2', kind: 'box', x: 186, y: 14, w: 76, h: 50, label: 'React bank', visible: true },
			{ id: 's3', kind: 'box', x: 274, y: 14, w: 76, h: 50, label: 'JS drills', visible: true },
			{ id: 'app', kind: 'box', x: 40, y: 130, w: 280, h: 56, label: 'Prep Pocket', sub: 'one offline Android app' },
			{ id: 'e0', kind: 'edge', from: 's0', to: 'app' },
			{ id: 'e1', kind: 'edge', from: 's1', to: 'app' },
			{ id: 'e2', kind: 'edge', from: 's2', to: 'app' },
			{ id: 'e3', kind: 'edge', from: 's3', to: 'app' },
			{
				id: 'rules',
				kind: 'doc',
				x: 16,
				y: 214,
				w: 328,
				title: 'Early rules',
				lines: ['One APK, one progress store, one design', 'Works with no signal', 'No account, no backend, no analytics code', 'Debug-signed APK on GitHub releases']
			}
		],
		steps: [
			{ say: 'Study material lived in four separate projects. Each needed a laptop, a dev server or a network, so none suited short sessions on a phone.', focus: ['s0', 's1', 's2', 's3'] },
			{ say: 'On 13 October 2026 the first commit bundled the Backend lab, the Svelte and TypeScript prep and the JS drills into one app, Prep Pocket.', show: ['app', 'e0', 'e1', 'e3'], focus: ['app'] },
			{ say: 'The same day it was renamed Kata, with a new icon.', set: { app: { label: 'Kata' } }, pulse: ['app'] },
			{ say: 'On 14 October, version 1.1.0 added the React, Next.js and TypeScript question bank: 500 questions.', show: ['e2'], set: { s2: { tone: 'accent' } }, focus: ['s2'] },
			{ say: 'On 22 October, 1.3.0 renamed it Preppy. The package id stayed the same, so it installed over Kata and kept its progress.', set: { app: { label: 'Preppy', tone: 'accent' } }, pulse: ['app'] },
			{ say: 'The rules from the start: offline first, no account, backend or analytics code, and updates shipped as debug-signed APKs on GitHub.', show: ['rules'], focus: ['rules'] }
		]
	},
	{
		id: 'bt-why-releases',
		topic: 'built',
		group: 'bt-why',
		title: 'Twenty-one releases in 23 days',
		blurb: 'What shipped when, from 1.0.0 on 14 October to 2.5.0 on 6 November?',
		stage: { w: 360, h: 372 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 164,
				cols: ['Release', 'What arrived'],
				rows: [
					['1.0.0 · 14 Oct', 'Offline app, Backend lab'],
					['1.1.0 · 14 Oct', '500-question React bank'],
					['1.2.0 · 20 Oct', 'Assistant, 7B models'],
					['1.3.0 · 22 Oct', 'Preppy name, voices'],
					['1.4.0 · 23 Oct', 'Visual lessons, databases'],
					['1.7.0 · 23 Oct', 'Six sections, playground'],
					['1.8.0 · 24 Oct', 'AWS, video-style player'],
					['1.9.0 · 26 Oct', 'In-app code keyboard'],
					['2.1.0 · 27 Oct', 'Interview prep'],
					['2.2.1 · 27 Oct', 'Python for AI section'],
					['2.3.0 · 27 Oct', 'Midnight gold design'],
					['2.4.0 · 1 Nov', 'Newer models, grounding'],
					['2.4.1 · 2 Nov', 'OpenSearch topics'],
					['2.5.0 · 6 Nov', 'How Preppy was built']
				],
				visible: true
			}
		],
		steps: [
			{ say: 'From 1.0.0 on 14 October to 2.5.0 on 6 November 2026 there were 21 releases in 23 days. These rows are the milestones.', focus: ['t'] },
			{ say: 'Day one: the offline app with the Backend lab, Svelte and TypeScript prep, drills and a tutor, then the 500-question React bank.', set: { t: { hl: [0, 1] } } },
			{ say: 'Next came the Assistant and bigger on-device models, then the rename to Preppy with natural narration voices.', set: { t: { hl: [2, 3] } } },
			{ say: 'On 23 and 24 October: visual lessons and three databases, six new sections with a JavaScript playground, then AWS and a video-style player.', set: { t: { hl: [4, 5, 6] } } },
			{ say: 'On 26 October an in-app keyboard made for writing code.', set: { t: { hl: [7] } } },
			{ say: 'On 27 October alone there were six releases, from 1.9.2 to 2.3.0: interview prep, Python for AI, a Home screen and the new look.', set: { t: { hl: [8, 9, 10] } } },
			{ say: 'On 1 and 2 November: newer models and an Assistant that checks the notes and the web, then the OpenSearch topics.', set: { t: { hl: [11, 12] } } },
			{ say: 'On 6 November this section arrived: the story and every decision behind the app, written down as lessons.', set: { t: { hl: [13] } } }
		]
	},

	// ───────────── bt-stack ─────────────
	{
		id: 'bt-stack-layers',
		topic: 'built',
		group: 'bt-stack',
		title: 'What runs where in Preppy',
		blurb: 'Which layer of the stack does what, from the screen down to native code?',
		nodes: [
			...stack('a', [
				{ l: 'Svelte 5 + TypeScript', s: 'screens, quizzes, lessons' },
				{ l: 'Capacitor 8 bridge', s: 'JavaScript calls native code' },
				{ l: 'Native plugins', s: 'LocalLlm and LocalTts' },
				{ l: 'C++ libraries', s: 'llama.cpp and sherpa-onnx' }
			]),
			{ id: 'w', kind: 'box', x: 240, y: 14, w: 104, h: 60, label: 'Web Workers', sub: 'Pyodide, PGlite' },
			{ id: 'we', kind: 'edge', from: 'a0', to: 'w' }
		],
		steps: [
			{ say: 'The whole interface is a web app: Svelte 5 and TypeScript, bundled by Vite 8.', focus: ['a0'] },
			{ say: 'Heavy engines run in Web Workers, so a long run never freezes the screen.', show: ['w', 'we'], focus: ['w'] },
			{ say: 'Capacitor 8 puts the app in an Android WebView and lets JavaScript call native code.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'Two small plugins do what a WebView cannot do well: LocalLlm runs a language model and LocalTts speaks neural voices.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'They wrap llama.cpp and sherpa-onnx, C++ libraries built for arm64 phones.', show: ['a3', 'ae2'], focus: ['a3'] },
			{ say: 'In the browser dev loop (bun run dev) the plugins are absent, so the app checks first and falls back.', set: { a2: { tone: 'warn', sub: 'absent in the browser' } }, focus: ['a2'] }
		]
	},
	{
		id: 'bt-stack-choices',
		topic: 'built',
		group: 'bt-stack',
		title: 'Choices and what was skipped',
		blurb: 'For each part of the stack, what was used and what was left out?',
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 12,
				y: 14,
				colW: 112,
				cols: ['Need', 'Used', 'Skipped'],
				rows: [
					['Shell', 'Capacitor', 'Kotlin, Flutter'],
					['UI', 'Svelte 5', 'React Native'],
					['Screens', 'tab + history', 'a router'],
					['State', 'Svelte stores', 'a state library'],
					['Look', 'own CSS tokens', 'a UI kit'],
					['Assets', 'bundled', 'a CDN']
				],
				visible: true
			}
		],
		steps: [
			{ say: 'Each choice answered one question: what already runs in a WebView and can be reused as it is?', focus: ['t'] },
			{ say: 'Pyodide, PGlite, CodeMirror and sucrase are web code. A WebView runs them unchanged, so Kotlin or Flutter would need another way to run them.', set: { t: { hl: [0, 1] } } },
			{ say: 'No router: one tab value picks the screen, and the browser history stack answers Android\'s Back button.', set: { t: { hl: [2] } } },
			{ say: 'No state library: Svelte stores and runes already hold all the state this app needs.', set: { t: { hl: [3] } } },
			{ say: 'No UI kit: the look is a small set of CSS tokens in src/app.css.', set: { t: { hl: [4] } } },
			{ say: 'No CDN: Pyodide is copied in at build time and the fonts are bundled, so nothing can fail while offline.', set: { t: { hl: [5] } } },
			{ say: 'The cost: native-only features need a plugin, so llama.cpp and sherpa-onnx had to be wrapped by hand.', set: { t: { hl: [0, 1, 2, 3, 4, 5] } } }
		]
	},

	// ───────────── bt-offline ─────────────
	{
		id: 'bt-offline-engines',
		topic: 'built',
		group: 'bt-offline',
		title: 'Real engines in workers',
		blurb: 'What runs the learner\'s code on the phone, and where?',
		nodes: [
			...stack('a', [
				{ l: 'Exercise screen', s: 'Run is pressed' },
				{ l: 'Runner', s: 'main thread, posts a message' },
				{ l: 'Web Worker', s: 'the engine runs here' },
				{ l: 'public/pyodide', s: 'copied at build, no CDN', tone: 'accent' }
			]),
			{ id: 'eng', kind: 'doc', x: 232, y: 158, w: 112, title: 'Engines', lines: ['Python: Pyodide', 'SQL: PGlite', 'Mongo: mingo', 'JS/TS: sucrase'] },
			{ id: 'ee', kind: 'edge', from: 'a2', to: 'eng' }
		],
		steps: [
			{ say: 'A learner presses Run. The screen itself never runs the code.', focus: ['a0'] },
			{ say: 'A small runner on the main thread posts the code to a worker as a message with an id.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'The worker runs the engine away from the main thread, so scrolling and animations keep going.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'Python runs in Pyodide, SQL on real PostgreSQL (PGlite), JS and TS after sucrase strips types. MongoDB queries use mingo on small in-memory data.', show: ['eng', 'ee'], focus: ['eng'] },
			{ say: 'The worker answers with the same id, and the runner hands the result back to the screen.', set: { a0: { tone: 'accent', sub: 'result shown' } }, pulse: ['a0'] },
			{ say: 'The Pyodide runtime is copied into public/pyodide at build time, so the first Run works in airplane mode.', show: ['a3', 'ae2'], focus: ['a3'] }
		]
	},
	{
		id: 'bt-offline-timeout',
		topic: 'built',
		group: 'bt-offline',
		title: 'Stopping an endless loop',
		blurb: 'How does the app stop code that never finishes, without freezing?',
		stage: { w: 360, h: 340 },
		nodes: [
			{ id: 'r', kind: 'box', x: 16, y: 14, w: 200, h: 44, label: 'Runner', sub: 'main thread', visible: true },
			{ id: 'tm', kind: 'box', x: 240, y: 14, w: 104, h: 44, label: 'Timer', sub: '8 seconds' },
			{ id: 'w', kind: 'box', x: 16, y: 100, w: 200, h: 44, label: 'Worker', sub: 'Python in Pyodide' },
			{ id: 'res', kind: 'box', x: 16, y: 186, w: 200, h: 44, label: 'Result', sub: 'shown to the learner' },
			{ id: 'w2', kind: 'box', x: 16, y: 272, w: 200, h: 44, label: 'New worker', sub: 'ready for the next run', tone: 'accent' },
			{ id: 'e0', kind: 'edge', from: 'r', to: 'w', label: 'code + id' },
			{ id: 'e1', kind: 'edge', from: 'w', to: 'res', label: 'result + id' },
			{ id: 'e2', kind: 'edge', from: 'res', to: 'w2', label: 'next Run' }
		],
		steps: [
			{ say: 'Run is pressed: the runner posts the code and an id to the worker, and starts an 8 second timer.', show: ['w', 'e0', 'tm'], focus: ['r'] },
			{ say: 'Normal case: the worker answers in time, the timer is cleared and the result goes to the learner.', show: ['res', 'e1'], set: { res: { tone: 'accent' } }, pulse: ['res'] },
			{ say: 'Now an endless loop. The worker is busy forever, so it can never read a message, not even one that says stop.', hide: ['res', 'e1'], set: { w: { tone: 'warn', sub: 'stuck in while True' } }, focus: ['w'] },
			{ say: 'At 8 seconds the runner calls terminate() on the worker. That is the only way to end a loop on a thread.', set: { w: { tone: 'neg', label: 'Worker (terminated)', sub: 'stopped by the runner' } }, pulse: ['tm'] },
			{ say: 'The learner sees "Execution exceeded 8s (possible infinite loop)." and can fix their code.', show: ['res', 'e1'], set: { res: { tone: 'neg', label: 'Timeout', sub: 'Execution exceeded 8s' } }, focus: ['res'] },
			{ say: 'The next Run spawns a fresh worker, so one bad submission never breaks the lesson.', show: ['w2', 'e2'], focus: ['w2'] },
			{ say: 'An engine\'s first start gets 120 seconds, because Pyodide and PGlite boot slowly on a phone. The JS playground uses a 5 second watchdog.', set: { tm: { label: 'Start-up timer', sub: '120 seconds' } }, pulse: ['tm'] }
		]
	},

	// ───────────── bt-dojo-port ─────────────
	{
		id: 'bt-dojo-grading',
		topic: 'built',
		group: 'bt-dojo-port',
		title: 'From Run to XP',
		blurb: 'What happens, in order, between pressing Run and seeing XP in the Backend lab?',
		stage: { w: 360, h: 340 },
		nodes: stack(
			'a',
			[
				{ l: 'Run is pressed', s: 'exercise id and the answer' },
				{ l: 'Run the exercise', s: 'Python, SQL or quiz' },
				{ l: 'Record the attempt', s: 'saved in localStorage' },
				{ l: 'Award XP and streak', s: 'first solve only' },
				{ l: 'Unlock diagram parts', s: 'by chapter progress' }
			],
			{ y: 12, w: 210, gap: 24 }
		),
		steps: [
			{ say: 'Pressing Run sends the exercise id and the learner\'s code to processRun in grading.ts.', focus: ['a0'] },
			{ say: 'Python runs its tests in Pyodide, SQL is compared with the expected rows from PGlite, and a quiz compares the chosen option number.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'Every attempt is recorded: the attempt count and the code, plus a mistakes log entry (the latest 200 are kept) when it fails.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'XP is awarded only when it passed and was not solved before, so repeating an exercise cannot farm points. The streak moves too.', show: ['a3', 'ae2'], set: { a3: { tone: 'accent' } }, focus: ['a3'] },
			{ say: 'Solving exercises unlocks parts of the architecture diagram: after the first one, after half, or when the whole chapter is done.', show: ['a4', 'ae3'], focus: ['a4'] },
			{ say: 'The result goes back to the screen: pass or fail, XP earned, new diagram parts and the updated stats.', set: { a0: { tone: 'accent', sub: 'result shown' } }, pulse: ['a0'] }
		]
	},
	{
		id: 'bt-dojo-xp',
		topic: 'built',
		group: 'bt-dojo-port',
		title: 'Levels and streaks',
		blurb: 'How are levels worked out from XP, and how does a streak count days?',
		nodes: [
			{
				id: 'lv',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 90,
				cols: ['Level', 'XP to reach'],
				rows: [['1', '0'], ['2', '100'], ['3', '300'], ['4', '600'], ['5', '1,000'], ['6', '1,500']],
				visible: true
			},
			{ id: 'f', kind: 'text', x: 216, y: 30, w: 128, size: 'sm', text: 'XP for level n = floor(100 x (n - 1) x n / 2)', visible: true },
			{
				id: 'sk',
				kind: 'doc',
				x: 16,
				y: 190,
				w: 328,
				title: 'Streak: one solve per day',
				lines: ['Mon 26 Oct   solve  ->  streak 3', 'Tue 27 Oct   solve  ->  streak 4', 'Tue 27 Oct   solve  ->  streak 4 (same day)', 'Thu 29 Oct   solve  ->  streak 1 (gap)']
			}
		],
		steps: [
			{ say: 'Reaching level n takes floor(100 x (n - 1) x n / 2) XP in total, so each level costs 100 XP more than the one before.', focus: ['lv'] },
			{ say: 'Level 4 needs 600 XP: 100 x 3 x 4 / 2. Anything from 300 to 599 XP is level 3.', set: { lv: { hl: [3] } } },
			{ say: 'With 250 XP you are level 2, because level 3 starts at 300.', set: { lv: { hl: [1] } } },
			{ say: 'A streak counts days using the phone\'s own calendar date, not UTC, so a late-night solve counts for the learner\'s day.', show: ['sk'], focus: ['sk'] },
			{ say: 'Solving on the next day adds one to the streak.', set: { sk: { hl: [1] } } },
			{ say: 'A second solve on the same day changes nothing.', set: { sk: { hl: [2] } } },
			{ say: 'Skipping a day resets the streak to 1 at the next solve.', set: { sk: { hl: [3] }, f: { text: 'A gap of more than one day starts again at 1.' } } }
		]
	}
];
