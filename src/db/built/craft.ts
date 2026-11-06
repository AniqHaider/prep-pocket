import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');

export const topics: DbTopic[] = [
	// ───────────────────────── Content as data ─────────────────────────
	{
		id: 'bt-content-model',
		title: 'Content as data',
		level: 'mid',
		summary: 'See why every Preppy section is one plain object, which files a new section has to be registered in, and why question ids must never shift.',
		scenes: ['bt-engine-object', 'bt-add-section'],
		notes: md(
			'Every learn section in Preppy is one object of type `LearnEngine` (`src/db/types.ts`): a name, a tagline, a list of topics, a question bank, the quiz topics, an optional playground and a one-line quiz blurb. A topic is plain data too: an id, a title, a level, a one-sentence summary, markdown notes, the ids of its animated lessons and optional runnable "Try it" snippets.',
			'',
			'**The decision: content is data, screens are generic.** One `Database.svelte` screen renders any engine with Learn, Quiz and Playground tabs, so a new section needs no new UI. The Visual lessons hub, the Assistant and the validator read the same objects. Lessons themselves are data as well (see the next topic).',
			'',
			'**Adding a section touches a short list:** the engine file, the `id` unions in `src/db/types.ts` and `src/explain/types.ts`, a tab, a menu entry and a render branch in `App.svelte`, `groups.ts` and `registry.ts` for lesson headings and the scene list, `Visual.svelte` for the hub chip, `knowledge.ts` so the Assistant searches it, and `validate-content.ts` for its scene prefix.',
			'',
			'**Question ids are positional.** `builder()` in `src/quiz/types.ts` numbers questions by position, and each engine renumbers across all its banks. Saved progress and the missed-question list are keyed by id, so a new bank is always appended last. Insert one in the middle and every later id silently points at a different question.',
			'',
			'**The validator** (`bun run content`) turns house rules into errors: four distinct options, no "all of the above", an explanation of at least 80 characters, no emoji, captions of at most 190 characters, nodes inside the stage, no overlapping nodes, and boxes big enough for their text.',
			'',
			'**Not chosen:** a hand-built screen per section (more freedom, but every one costs UI work and drifts in look) and a content server (it would break offline use). **Accepted trade-off:** data is less flexible than code, so an unusual lesson has to fit the available node kinds.'
		),
		try: [
			{
				label: 'Positional ids: append, never insert',
				code: md(
					'// builder() numbers a bank by position; the engine then renumbers across all its banks.',
					'const number = (banks) => banks.flat().map((q, i) => "BT" + String(i + 1).padStart(3, "0") + "  " + q);',
					'const before = [["hash tables", "big-o"], ["trees"]];',
					'console.log("before:\\n" + number(before).join("\\n"));',
					'console.log("\\nappended last (old ids unchanged):\\n" + number([...before, ["graphs"]]).join("\\n"));',
					'console.log("\\ninserted in the middle (BT003 now means something else):\\n" + number([before[0], ["graphs"], before[1]]).join("\\n"));'
				)
			},
			{
				label: 'The validator rules for one question',
				code: md(
					'const q = {',
					'  q: "Why is a new bank appended last?",',
					'  correct: "It keeps every saved id pointing at the same question",',
					'  wrong: ["It makes the quiz load faster", "The validator only reads the last bank", "Ids are random and reshuffled each launch"],',
					'  why: "Progress is stored by id. Ids are positional, so inserting a bank in the middle shifts every id after it and old answers point at the wrong questions."',
					'};',
					'const opts = [q.correct, ...q.wrong];',
					'const problems = [];',
					'if (new Set(opts.map((o) => o.trim())).size !== 4) problems.push("options are not 4 distinct strings");',
					'if (opts.some((o) => /all of the above|none of the above/i.test(o))) problems.push("all/none of the above");',
					'if (q.why.length < 80) problems.push("explanation too short (" + q.why.length + ")");',
					'console.log(problems.length ? problems : "passes the checks (" + q.why.length + " character explanation)");'
				)
			}
		]
	},

	// ───────────────────────── How the animated lessons work ─────────────────────────
	{
		id: 'bt-scenes',
		title: 'How the animated lessons work',
		level: 'mid',
		summary: 'Understand a lesson as data (nodes and cumulative steps), why nothing jumps on screen, and how the video-style player behaves.',
		scenes: ['bt-scene-anatomy', 'bt-player-layout'],
		notes: md(
			'A lesson ("scene") is a stage of named nodes plus a list of steps. The stage is 360 units wide and scales to the phone. Node kinds are `box`, `db`, `table`, `doc`, `text`, `token` and `edge`. A step can `show`, `hide`, `set` (change properties), `move`, `focus` or `pulse` things, and it carries one or two plain sentences of caption. State is cumulative: the player computes step N by applying steps 1 to N to the starting nodes, so it can jump to any step.',
			'',
			'**Decision: no animation library.** Everything stays mounted and CSS transitions animate the difference between steps. `Explainer.svelte` crops the stage to the highest and lowest points any node ever reaches (never under 150 tall), so a short lesson fills the box.',
			'',
			'**Colour carries meaning:** accent is the thing followed or the fast path, warn is cost or risk, neg is failure.',
			'',
			'**The player (1.4.0, then 1.7.1 and 1.8.0).** The first version moved things around between steps; 1.7.1 fixed that with a fixed-size animation box and a subtitle area as tall as the lesson\'s longest caption, measured at a layout-shift total of 0.001. 1.8.0 made it video-style: the picture scales to the whole screen, tap to show or hide the controls, a thin progress line always stays, and landscape overlays the subtitle and controls on the picture.',
			'',
			'**Around the player:** the screen stays on while a lesson plays (`keepAwake.ts` counts holders by name), "Play all" and "Watch this chapter" play through to the next lesson, Read aloud is on by default, and the Backend lab has a "Watch this chapter" button.',
			'',
			'**Not used:** an animation library or pre-rendered video. Data stays small, searchable, captioned and checkable by the validator.'
		),
		try: [
			{
				label: 'Steps are cumulative: replay from the start',
				code: md(
					'const nodes = { client: { shown: true }, server: { shown: false }, db: { shown: false } };',
					'const steps = [',
					'  { say: "A request leaves the client" },',
					'  { say: "It reaches the server", show: ["server"] },',
					'  { say: "The server asks the database", show: ["db"], set: { server: { tone: "warn" } } },',
					'  { say: "The client is done", hide: ["client"] }',
					'];',
					'function stateAt(i) {',
					'  const m = JSON.parse(JSON.stringify(nodes));',
					'  for (let s = 0; s <= i; s++) {',
					'    const st = steps[s];',
					'    (st.show || []).forEach((id) => (m[id].shown = true));',
					'    (st.hide || []).forEach((id) => (m[id].shown = false));',
					'    for (const [id, patch] of Object.entries(st.set || {})) Object.assign(m[id], patch);',
					'  }',
					'  return m;',
					'}',
					'// jump straight to step 4: no animation needed to know what is on stage',
					'const on = (i) => Object.entries(stateAt(i)).filter(([, n]) => n.shown).map(([id, n]) => id + (n.tone ? ":" + n.tone : ""));',
					'steps.forEach((s, i) => console.log("step " + (i + 1) + ": " + on(i).join(", ")));'
				)
			},
			{
				label: 'How long a caption stays on screen',
				code: md(
					'// registry.ts: at least 2.8 s, otherwise 62 ms per character (before the speed setting)',
					'const captionMs = (say) => Math.max(2800, say.length * 62);',
					'const short = "Route 53 is DNS.";',
					'const long = "The browser connects to a nearby edge location, which keeps copies of content so most requests never travel far.";',
					'console.log(short.length + " chars -> " + captionMs(short) + " ms");',
					'console.log(long.length + " chars -> " + captionMs(long) + " ms");',
					'console.log("at 2x speed the long caption lasts " + captionMs(long) / 2 + " ms");'
				)
			}
		]
	},

	// ───────────────────────── The design system ─────────────────────────
	{
		id: 'bt-design',
		title: 'The design system',
		level: 'basic',
		summary: 'Follow how the look moved from true black to indigo to Midnight gold, and the rules that keep every screen consistent and accessible.',
		scenes: ['bt-design-path', 'bt-gold-rules'],
		notes: md(
			'Preppy is a one-person study app used in short sessions, mostly at night, on an AMOLED phone. That is why it stays dark and calm.',
			'',
			'**Three looks.** Version 1.3 (22 October) replaced borders, shadows, gradients and emoji icons with true-black surfaces separated by lightness, one typeface (Inter), one icon set, and lime used only on progress. Version 2.2 (27 October) moved to deep indigo with softer rounded cards and a violet primary colour. Version 2.3 (27 October) settled on **Midnight gold**, picked from a set of twenty directions: near-black ground, warm cream text, thin gold lines and a classical serif for titles.',
			'',
			'**The seven rules** (`docs/design.md`): hairlines, not fills (1px outlined cards, no shadows); gold has jobs (primary action, active row, tab underline, progress); one primary action per screen; colour is never the only signal; type is Cormorant Garamond for titles and Instrument Sans for the rest, both bundled so they work offline; no emoji and no glow, with one gradient only on the Home Continue card; and an accessibility floor of 44px touch targets, 12px text, 4.5:1 contrast, a visible focus ring and reduced motion honoured.',
			'',
			'**Tokens live in `src/app.css`.** The older names (`--bg`, `--panel`, `--line`, `--good`, `--bad`) remain as aliases of the new ones, so older components kept working through two redesigns while new code uses the new names.',
			'',
			'**Not used:** a light theme (it does not fit the use case) and a different colour per section (2.2 gave each Home tile its own colour; 2.3 went back to one gold treatment). **Trade-off:** restraint means fewer cues, so every colour that remains has to mean something.'
		),
		try: [
			{
				label: 'Contrast ratios of the text tokens',
				code: md(
					'// WCAG contrast ratio between two hex colours; the design floor is 4.5:1',
					'const lum = (h) => {',
					'  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));',
					'  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];',
					'};',
					'const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };',
					'const surface = "#111114";',
					'const tokens = { "--text": "#f3ead2", "--muted": "#b6a984", "--faint": "#9c906c", "--brand": "#c9a24b" };',
					'for (const [name, hex] of Object.entries(tokens)) {',
					'  const r = ratio(hex, surface);',
					'  console.log(name.padEnd(8), hex, r.toFixed(2) + ":1", r >= 4.5 ? "meets 4.5:1" : "too low");',
					'}'
				)
			}
		]
	},

	// ───────────────────────── Navigation and the Back button ─────────────────────────
	{
		id: 'bt-nav',
		title: 'Navigation and the Back button',
		level: 'mid',
		summary: 'Learn how Android Back became history.back(), which layers push history entries, and how one planner decides between closing, Home and quitting.',
		scenes: ['bt-back-planner', 'bt-history-stack'],
		notes: md(
			'**From a bottom bar to a menu.** The first versions had a bottom bar; 1.1.0 moved to a top app bar with a slide-out menu so more sections fit. Version 2.2.0 added a Home screen: a greeting, streak, XP, a Continue card for the last section and a tile for every section.',
			'',
			'**Android Back is `history.back()`.** `App.svelte` pushes a history entry for each layer that can be closed: the menu, the assistant sheet and the lesson player. `useBack` in `src/ui/backNav.svelte.ts` does the same for screens inside a section (an open topic, a drill, a quiz screen): changing the screen value pushes an entry, and Back restores the old value.',
			'',
			'**Switching sections is not a history step.** Picking a section from Home or the menu replaces the current entry, so Back does not retrace every section you visited.',
			'',
			'**The planner.** Browser history can still hold entries from sections you already left, so Back must not trust it. `setBackPlanner` in `rootState.ts` registers one function: if something is open it says `back`, else if you are not on Home it goes `home`, else it says `quit`, which opens "Quit Preppy?" with Stay and Quit. In `main.ts` the What\'s new popup, the quit dialog and the code keyboard are handled before the planner runs.',
			'',
			'**It changed four times, each fixing a real annoyance:** 1.9.2 asked before quitting from the first screen; 2.1.0 made Back step through opened topics and tabs; 2.2.0 made Back at a section\'s top ask to quit instead of jumping to an earlier section; 2.2.1 made it return to Home first.',
			'',
			'**Not chosen:** trusting raw history, and leaving the app on a single Back press.'
		),
		try: [
			{
				label: 'The Back planner decision',
				code: md(
					'// rootState.ts / App.svelte: what should Back do right now?',
					'function planBack(s) {',
					'  const open = s.drawer || s.assistant || s.player || s.inner > 0 || (s.tab === "dojo" && s.view !== "dashboard");',
					'  if (open) return "back";',
					'  if (s.tab !== "home") return "home";',
					'  return "quit";',
					'}',
					'const idle = { tab: "home", drawer: false, assistant: false, player: false, inner: 0, view: "dashboard" };',
					'const cases = {',
					'  "on Home, nothing open": idle,',
					'  "AWS section, top screen": { ...idle, tab: "aws" },',
					'  "AWS section, a topic open": { ...idle, tab: "aws", inner: 1 },',
					'  "lesson player open": { ...idle, tab: "aws", player: true },',
					'  "menu open on Home": { ...idle, drawer: true },',
					'  "Backend lab, inside an exercise": { ...idle, tab: "dojo", view: "exercise" }',
					'};',
					'for (const [name, state] of Object.entries(cases)) console.log(name.padEnd(34), "->", planBack(state));'
				)
			}
		]
	},

	// ───────────────────────── The code keyboard and touch details ─────────────────────────
	{
		id: 'bt-keyboard',
		title: 'The code keyboard and touch details',
		level: 'mid',
		summary: 'See why Preppy has its own keyboard for code, how its keys behave, and the landscape and haptic decisions around it.',
		scenes: ['bt-keyboard-layers', 'bt-enter-indent'],
		notes: md(
			'**Why a keyboard of its own (1.9.0).** Phone keyboards bury `{ } [ ] ; < >` behind extra taps, and code is mostly those characters. Code editors (the playgrounds, the Backend lab and the Drills) show Preppy\'s keyboard and keep the phone keyboard closed with `inputmode="none"`. Chat boxes and settings fields keep the phone keyboard, because the code keyboard is built for code editors. "Use the phone keyboard instead" and Settings switch back.',
			'',
			'**The layers.** Letters with Shift (tap twice for caps lock), numbers, and symbols. A fixed top row keeps Tab, `( ) { } [ ] ;`, Undo and a hide key on every layer. The bottom row has the layer switch, comma, space, period, cursor keys and a gold Enter. Every key has a spoken label for screen readers.',
			'',
			'**Enter keeps the indentation** of the line above and adds one level (two spaces) after `{`, `(`, `[` or `:`. Plain text boxes use this rule; CodeMirror editors use their own indent command.',
			'',
			'**One tap is one step (1.9.2).** Backspace and the arrows repeat while held (after about 0.4 s, then every 55 ms), but a touch fires `pointerdown` and then `click`, which deleted two characters per tap. The click that follows a pointer press is now swallowed.',
			'',
			'**Haptics (1.9.1).** No vibration, Light tap (the phone\'s own keyboard-tap feedback, which follows Android\'s touch-feedback setting) or Strong click (the motor\'s click effect, independent of it). Held keys tap once, not on every repeat.',
			'',
			'**Landscape (1.7.1, 1.9.1).** The status bar hides and a swipe from the top brings it back. On coding screens the header scrolls away and disappears while the keyboard is up. Keys get shorter so the editor keeps room above them.',
			'',
			'**Not chosen:** relying on the phone keyboard alone. **Trade-off:** a custom keyboard has to be built, labelled and tuned for every touch quirk.'
		),
		try: [
			{
				label: 'What Enter inserts after a line',
				code: md(
					'// kbState.svelte.ts: copy the line\'s indent, add one level after { ( [ or :',
					'const INDENT = "  ";',
					'function enter(line) {',
					'  const ind = /^[ \\t]*/.exec(line)[0];',
					'  const opens = /[{(\\[:]\\s*$/.test(line);',
					'  return "\\n" + ind + (opens ? INDENT : "");',
					'}',
					'const show = (s) => JSON.stringify(s);',
					'for (const line of ["let total = 0;", "function f() {", "  if (ready) {", "def total(xs):", "  const rows = ["]) {',
					'  console.log(line.padEnd(18), "->", show(enter(line)));',
					'}'
				)
			}
		]
	}
];

// ───────────────────────── Quiz ─────────────────────────
const t = (topic: string) => builder('BT', topic);

// ── content model
const cm = t('bt-content-model');
cm.add('basic', 'one-object',
	'What does a new learn section need in order to appear with Learn, Quiz and Playground tabs in Preppy?',
	'One LearnEngine data object, drawn by the shared screen',
	['A new Svelte screen written just for that section', 'A server endpoint that sends its topics to the phone', 'A separate APK module with its own navigation stack'],
	'A section is a LearnEngine object (topics, questions, quiz topics, optional playground) and one generic Database screen renders any of them. Only a menu entry and registration are needed; no new UI, no server and no module.');
cm.add('mid', 'append-last',
	'A new quiz bank is placed in the middle of an engine\'s list of banks. What goes wrong?',
	'Later questions get new ids, so saved answers point at the wrong ones',
	['The validator refuses to run until the banks are sorted by name and number', 'The new questions are shown twice in every quiz session', 'Nothing, because ids are taken from the text of each question'],
	'Ids are assigned by position and progress is stored by id. Inserting a bank shifts all later ids, so a saved "missed" question silently becomes a different one. Appending last keeps every existing id the same.');
cm.add('mid', 'assistant-index',
	'Why can the Assistant answer about a section added last week without any new code in the Assistant?',
	'Its notes search indexes every engine in one list, and the new one joins it',
	['It searches the web for the section on every single question it is asked', 'The on-device model was trained on the section earlier', 'The validator copies every topic into each prompt it sends'],
	'knowledge.ts builds its search index from a list of engines, so registering the new engine there is enough. Web search is optional and off by default, and a model cannot be retrained on the phone.');
cm.add('mid', 'validator',
	'Which problem would `bun run content` catch in a quiz question?',
	'Two of the four answer options being the same text',
	['A correct answer that has since become outdated over time', 'An explanation that is dull and hard to get through', 'A question that is too easy for the level it is filed under'],
	'The validator checks things a program can decide: four distinct options, no "all of the above", explanation length, no emoji, scene geometry. Whether a fact is current or a question is interesting still needs a human reading it.');
cm.add('advanced', 'data-tradeoff',
	'What is the main price of describing lessons as data rather than writing each screen by hand?',
	'Unusual lessons must fit the node kinds the renderer knows',
	['Data renders more slowly, so lessons stutter on older phones', 'Data cannot be checked automatically, so mistakes reach users', 'Offline use becomes impossible because data needs a server'],
	'Data is limited to what the renderer understands, which is the cost. The benefit is that a validator can check every scene and question, all sections look alike, and everything ships inside the APK with no server.');

// ── scenes
const sc = t('bt-scenes');
sc.add('basic', 'cumulative',
	'A learner jumps straight to step 5 of a lesson. How does the player know what is on stage?',
	'It applies steps 1 to 5 in order to the starting nodes',
	['It saved a picture of every step inside the app package', 'It plays the animation quickly from step 1 on screen', 'It asks the narration engine which nodes were visible'],
	'Steps are cumulative and computed, not stored as pictures. Applying show, hide, set and move from step 1 up to step 5 gives the exact state, so jumping or replaying needs no animation.');
sc.add('basic', 'tone',
	'What does the warn tone mean in a lesson?',
	'Cost or risk: something slow, waiting or dangerous',
	['The scene contains a mistake that the author must fix', 'The step is optional and the learner may skip it', 'The node is the one the learner most recently tapped'],
	'Tones carry meaning: accent is the thing followed or the fast path, warn is cost or risk, neg is failure. They are not decoration, so a learner can read the colour as a hint.');
sc.add('mid', 'no-jump',
	'Why is the subtitle area sized for the lesson\'s longest caption?',
	'So nothing below it moves when a short caption replaces a long one',
	['So the narration voice has more room to speak each line', 'Because Android cannot resize text boxes while they play', 'To force every caption in the lesson to one fixed length'],
	'If the subtitle area grew and shrank per step, everything beneath it would jump. Reserving the height of the longest caption keeps positions identical in every step; a measured layout-shift total of 0.001 shows it works.');
sc.add('mid', 'crop',
	'How does Explainer make a short lesson fill its picture box instead of floating in empty stage?',
	'It crops the stage to what any step actually uses',
	['It stretches every node until it touches the edges', 'Authors choose a crop height by hand for each scene', 'It zooms in on whichever node currently has focus'],
	'contentBounds scans every step for the top and bottom of every node and the stage is cropped to that (never under 150 tall, never taller than authored). Nodes keep their size, so text stays readable.');
sc.add('advanced', 'keep-awake',
	'Narration and a lesson both ask for the screen to stay on. Why does keepAwake count holders by name?',
	'The screen sleeps only when the last holder lets go',
	['Each holder needs its own wake lock with a separate timeout', 'Android allows only one keep-awake request at any moment', 'The names are logged to find which lesson drained the battery'],
	'A named set means releasing one holder does nothing while another remains. Without it, the end of narration could let the screen sleep in the middle of a lesson that is still playing.');

// ── design
const ds = t('bt-design');
ds.add('basic', 'gold-jobs',
	'In the Midnight gold design, what does the gold colour mark?',
	'Primary actions, progress and where you are',
	['Correct answers, which are the only thing ever coloured', 'Errors and warnings that need the learner\'s attention', 'Decorative flourishes repeated on every card and heading'],
	'Gold has jobs: the one primary button, the active menu row, tab underlines and progress. Green is reserved for correct and red for wrong, and nothing else is coloured, which is what makes the few coloured things stand out.');
ds.add('basic', 'colour-alone',
	'Why do correct and wrong results always carry an icon or a word as well as green or red?',
	'Some people cannot tell those two colours apart',
	['Green and red look identical on AMOLED screens at night', 'Android removes colour from apps when the battery is low', 'The icons are what the quiz actually counts as the score'],
	'Colour is never the only signal is a written design rule. A reader with colour blindness still gets the result from the icon or the word, and a screen reader announces it as text.');
ds.add('mid', 'aliases',
	'Why do old token names such as `--bg` and `--panel` still exist in app.css?',
	'They alias the new tokens so older components keep working',
	['They hold a separate light theme that is used only in the daytime', 'Browsers require every colour token to have two names', 'They are unused and are kept only for the project history'],
	'Two redesigns changed the palette. Pointing the old names at the new tokens means components written earlier pick up the new look without being rewritten; new code should use the new names.');
ds.add('mid', 'why-dark',
	'What reason does the design give for staying dark and calm?',
	'It is used in short night sessions on an AMOLED phone',
	['A dark theme makes the on-device Python engine start faster', 'WebViews are not allowed to show a light theme at all', 'Dark colours need fewer fonts to be bundled in the app'],
	'The design notes start from how the app is used: one person, short sessions, mostly at night, on an AMOLED phone. Near-black grounds are easy on the eyes there, and the choice has nothing to do with engine speed or fonts.');
ds.add('advanced', 'hairlines',
	'What replaced shadows and filled panels in the 2.3 design?',
	'Cards outlined with a 1px line and stepped surface lightness',
	['Soft drop shadows with a faint gold glow around every single card', 'A different gradient on every card to tell sections apart', 'Fully rounded pill cards in the earlier indigo palette'],
	'Rule one is hairlines, not fills: ground, surface and raised differ in lightness and cards get a 1px rule with nearly square corners. Only one gradient remains, on the Home Continue card. Indigo was the previous look.');

// ── navigation
const nv = t('bt-nav');
nv.add('basic', 'top-bar',
	'What changed in 1.1 about how a learner moves between sections?',
	'A bottom bar became a top bar with a slide-out menu',
	['Swipe gestures replaced every button in the app', 'All sections were merged into one very long scrolling page', 'The menu moved to a web address that you type in'],
	'With more sections coming, a bottom bar ran out of room. A top app bar with a slide-out menu can list many more, and Android Back closes the menu first.');
nv.add('mid', 'trust-history',
	'Why does the Back planner check what is open instead of simply calling history.back()?',
	'Browser history can hold entries from sections already left',
	['history.back() is not available inside an Android WebView at all', 'Calling it twice is needed to leave the Home screen', 'It would stop the app from ever offering to quit at Home'],
	'Switching sections replaces entries rather than pushing, and old entries can linger. The planner looks at what is actually open: close it, else go Home, else ask Quit Preppy? That gives the same result whatever history holds.');
nv.add('mid', 'top-of-section',
	'A learner is on the first screen of the AWS section with nothing open. What does Back do?',
	'It goes to Home',
	['It asks "Quit Preppy?" with Stay and Quit buttons', 'It closes the app immediately without asking anything', 'It returns to the section the learner visited before'],
	'Since 2.2.1, Back from a section\'s top screen returns to Home, and only from Home does it ask Quit Preppy?. Earlier versions jumped to a previous section, which surprised learners.');
nv.add('mid', 'use-back',
	'How can Back close an opened topic or quiz screen inside a section?',
	'The screen calls useBack, which pushes a history entry on change',
	['Each screen registers its own Android permission when the app launches', 'A timer closes the screen after a few seconds of no input', 'The page reloads to its last saved scroll position instead'],
	'useBack takes a getter and a setter for the value that says which screen is showing. A change pushes a history entry; Back pops it and the setter puts the old value back.');
nv.add('advanced', 'reuse-entry',
	'Why does choosing an item in the slide-out menu reuse the menu\'s history entry instead of pushing a new one?',
	'Otherwise Back would retrace every section switch one by one',
	['History entries use up memory that an Android phone cannot spare', 'Android allows only one history push for each second', 'The menu closes itself before a push could ever finish'],
	'Opening the menu pushed an entry so Back can close it. Choosing a section replaces that entry with the new state. Pushing again would leave one entry per switch, and Back would walk back through them.');

// ── keyboard
const kk = t('bt-keyboard');
kk.add('basic', 'why-own',
	'Why does Preppy ship its own keyboard for code editors?',
	'Phone keyboards bury brackets, braces and semicolons',
	['Android forbids typing code with the system keyboard', 'Code editors cannot receive text from a phone keyboard', 'The in-app keyboard is required by the narration voice'],
	'Code is mostly symbols, and a standard keyboard hides them on secondary layers. Preppy\'s keyboard keeps brackets and the semicolon on a fixed top row on every layer. The phone keyboard still works if you choose it.');
kk.add('mid', 'one-tap',
	'After the double-step bug was fixed, what does a single tap on backspace do?',
	'It deletes one character; only a hold starts repeating',
	['It deletes two characters, and holding deletes a whole word', 'It does nothing until the key is pressed for a long time', 'It deletes one entire line each time the key is touched'],
	'A touch fires pointerdown and then click, so one tap used to act twice. The click that follows a pointer press is now swallowed. Holding starts a repeat after about 0.4 s, then steps every 55 ms.');
kk.add('mid', 'enter-indent',
	'A line ends with `{` and the learner presses Enter on the in-app keyboard. What does the new line start with?',
	'That line\'s indentation plus one more level of two spaces',
	['No indentation at all, so the learner types it by hand', 'Four spaces, whatever the indentation of the line above', 'Exactly the same indentation as that line and nothing more'],
	'The rule copies the current line\'s leading whitespace and adds INDENT (two spaces) when the line ends with {, (, [ or a colon. Without the extra level, every block would have to be indented by hand.');
kk.add('mid', 'opt-in',
	'Why do chat boxes and settings fields keep the phone keyboard?',
	'Only code editors opt in; the keyboard is built for code',
	['Chat boxes cannot receive any keys from an in-app keyboard', 'Settings fields are read only, so they never take input', 'Android hides the code keyboard whenever a chat is open'],
	'Plain text boxes opt in with a data attribute and CodeMirror editors are recognised by their class. Anything else is not an editor, so the keyboard stays closed there and the phone keyboard handles ordinary text.');
kk.add('advanced', 'haptic-modes',
	'What is the difference between Light tap and Strong click for key vibration?',
	'Light follows Android\'s touch-feedback setting; Strong does not',
	['Light is used for letters and Strong is used only for the Enter key', 'Strong repeats on every held key while Light does not repeat', 'Light vibrates the whole screen while Strong plays a sound'],
	'Light is the phone\'s own keyboard-tap haptic, so it respects Android\'s touch-feedback switch. Strong calls the vibration motor\'s click effect, which does not. In both, a held key taps once on press rather than on every repeat.');

export const banks: { out: Question[] }[] = [cm, sc, ds, nv, kk];
