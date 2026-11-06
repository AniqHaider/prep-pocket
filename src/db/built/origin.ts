import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');

// How Preppy was built, part 1: where it came from and what it runs on. Facts come from CHANGELOG.md, README.md, package.json,
// capacitor.config.ts and the source under src/dojo/engine and src/db/playground.

export const topics: DbTopic[] = [
	// ───────────────────────── Why Preppy exists ─────────────────────────
	{
		id: 'bt-why',
		title: 'Why Preppy exists',
		level: 'basic',
		summary: 'Know the problem Preppy solves, how it grew from four projects into one offline app, and the early decisions that shaped everything after.',
		scenes: ['bt-why-origin', 'bt-why-releases'],
		notes: md(
			'**The problem.** Study material lived in four separate projects: a Python and SQL lab (Backend Dojo), a Svelte and TypeScript question set, a React, Next.js and TypeScript question bank, and a set of JavaScript drills. Each needed a laptop, a dev server or a network. The goal was to study in short sessions on a phone, mostly at night, with no signal needed.',
			'',
			'**What was built.** The first commit, on 13 October 2026, was called Prep Pocket: the Backend lab, the Svelte and TypeScript prep and the JavaScript drills as one Android app. It was renamed Kata the same day, and the React bank arrived in 1.1.0 on 14 October. Preppy became the name in 1.3.0 on 22 October. The package id (`com.aniqhaider.preppocket`) never changed, so the Preppy rename installed over Kata and kept its progress.',
			'',
			'**Decisions**',
			'',
			'- **One APK instead of four tools:** one place to open, one progress store, one design.',
			'- **Offline first:** after install the app needs the network only for things you choose, such as downloading a model or a voice, a cloud model key, or web lookup. The manifest asks for just two permissions, internet and vibrate.',
			'- **No account, no backend, no analytics code.** Progress lives in the phone\'s `localStorage`.',
			'- **Distribution:** a debug-signed APK attached to each GitHub release, not the Play Store. There is no store account or review to wait for. The cost is a Play Protect warning about an unknown developer, and updates install over the old app only when the same key signs every build.',
			'',
			'**Trade-off accepted.** Uninstalling erases progress unless you export it, and there is no sync between devices. For one learner on one phone, that was cheaper than running a server.'
		),
		try: [
			{
				label: 'Releases per day, from the changelog',
				code: md(
					'// Every Preppy release and its date, from CHANGELOG.md (1.6.0 was skipped).',
					"const releases = [['1.0.0','2026-10-14'],['1.1.0','2026-10-14'],['1.2.0','2026-10-20'],['1.3.0','2026-10-22'],['1.4.0','2026-10-23'],['1.5.0','2026-10-23'],['1.6.1','2026-10-23'],['1.7.0','2026-10-23'],['1.7.1','2026-10-23'],['1.8.0','2026-10-24'],['1.9.0','2026-10-26'],['1.9.1','2026-10-26'],['1.9.2','2026-10-27'],['2.0.0','2026-10-27'],['2.1.0','2026-10-27'],['2.2.0','2026-10-27'],['2.2.1','2026-10-27'],['2.3.0','2026-10-27'],['2.4.0','2026-11-01'],['2.4.1','2026-11-02'],['2.5.0','2026-11-06']];",
					'const perDay = {};',
					'for (const [, d] of releases) perDay[d] = (perDay[d] || 0) + 1;',
					'console.log(perDay);',
					'const day = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86400000;',
					'const span = day(releases.at(-1)[1]) - day(releases[0][1]);',
					"console.log(releases.length + ' releases in ' + span + ' days');"
				)
			}
		]
	},

	// ───────────────────────── The stack and why ─────────────────────────
	{
		id: 'bt-stack',
		title: 'The stack and why',
		level: 'basic',
		summary: 'Name each layer of the stack, what the native code is for, and why a WebView app beat the alternatives.',
		scenes: ['bt-stack-layers', 'bt-stack-choices'],
		notes: md(
			'**What was built.** The interface is a single-page web app: Svelte 5 with runes, TypeScript 6 and Vite 8. Capacitor 8 wraps it in an Android WebView and lets JavaScript call native code. Bun runs the scripts: the dev server, `bun run content`, `bun run verify` and the type check.',
			'',
			'**Native code is small.** Two Capacitor plugins are registered in `MainActivity`: `LocalLlm` (llama.cpp, the on-device model) and `LocalTts` (sherpa-onnx, the narration voices). Everything else is web code. In the browser, with `bun run dev` on port 5180, those plugins do not exist, so the app checks that a plugin is available before it calls one. That keeps a fast edit-and-reload loop in the browser; the APK is needed only for the native parts and for releases.',
			'',
			'**Decisions and what was skipped**',
			'',
			'- **A WebView over React Native, Flutter or Kotlin:** the engines the app depends on (Pyodide, PGlite, CodeMirror, sucrase) are web code, and a web runtime reuses them unchanged.',
			'- **No router:** one tab value picks the screen, and the browser history stack serves Android\'s Back button.',
			'- **No state library:** Svelte\'s own stores and runes are enough.',
			'- **No UI kit:** the look is its own set of CSS tokens in `src/app.css`.',
			'- **No CDN:** Pyodide is copied into the app and the fonts are bundled, so nothing can fail offline.',
			'',
			'**Server settings.** `capacitor.config.ts` serves the app from `http://localhost` and allows cleartext traffic. `localhost` is still a secure context, and an `https` origin would block calls to a model server on the local network over plain `http` as mixed content.'
		),
		try: [
			{
				label: 'Why the app origin is http, not https',
				code: md(
					'// A page served over https may not call plain-http addresses (mixed content). The app wants to reach',
					'// a model server on the local network, such as http://192.168.1.20:11434.',
					"const blocked = (pageScheme, requestScheme) => pageScheme === 'https' && requestScheme === 'http';",
					"for (const page of ['https', 'http']) {",
					"  console.log(page + '://localhost app calling an http LAN server:', blocked(page, 'http') ? 'blocked' : 'allowed');",
					'}'
				)
			},
			{
				label: 'Use a plugin, or fall back (the keep-awake pattern)',
				code: md(
					'// In the APK both plugins exist. In the browser dev loop they do not, so code checks first.',
					'const available = { browser: [], apk: ["LocalLlm", "LocalTts"] };',
					'function keepScreenOn(env) {',
					'  return available[env].includes("LocalTts") ? "native window flag" : "Screen Wake Lock API, if the browser has it";',
					'}',
					'console.log("apk:", keepScreenOn("apk"));',
					'console.log("browser:", keepScreenOn("browser"));'
				)
			}
		]
	},

	// ───────────────────────── Real engines on the phone ─────────────────────────
	{
		id: 'bt-offline',
		title: 'Real engines on the phone',
		level: 'mid',
		summary: 'See which engines run Python, SQL, MongoDB queries and JavaScript offline, why the heavy ones live in workers, and how a stuck run is stopped.',
		scenes: ['bt-offline-engines', 'bt-offline-timeout'],
		notes: md(
			'**What was built.** Nothing the learner runs goes to a server. Python runs in Pyodide (CPython compiled to WebAssembly). SQL runs on PGlite, a real PostgreSQL build in WebAssembly, so `EXPLAIN` and transactions behave as in Postgres. MongoDB queries run on mingo, a MongoDB query engine in JavaScript, behind a hand-written parser with no `eval`. TypeScript becomes JavaScript through sucrase, which strips types without checking them. Code is edited in CodeMirror.',
			'',
			'**Workers.** Python, PostgreSQL, the drills and the JavaScript playground each run in their own Web Worker, so a heavy run never freezes the screen. The MongoDB playground is the exception: mingo works on small in-memory sample data, so it runs directly. `scripts/copy-pyodide.ts` copies the Pyodide runtime into `public/pyodide` before every dev start and build, so there is no CDN call.',
			'',
			'**Timeouts.** A runner on the main thread posts the code with an id and starts a timer: 120 s for an engine\'s first start (booting on a phone is slow) and 8 s for a run. A loop that never yields cannot receive a stop message, so on timeout the runner terminates the worker and spawns a fresh one for the next run. The JavaScript playground applies the same idea with a 5 s watchdog: a worker that sends nothing for 5 s is terminated.',
			'',
			'**Warm-up.** Opening an exercise starts its engine early. Opening a PostgreSQL section starts PGlite about 1.5 s later, and the sample shop is analysed after loading so `EXPLAIN` shows realistic row estimates.',
			'',
			'**Gaps accepted.** MySQL has no playground: it cannot run inside a phone WebView. Pyodide\'s CPython has no OpenSSL, so `hashlib.pbkdf2_hmac` is a small shim over `hmac.digest`, checked against the RFC 6070 test vectors.'
		),
		try: [
			{
				label: 'Stop a stuck run with a timeout race',
				code: md(
					'// The runner races the worker\'s answer against a timer. Preppy uses 8000 ms; this uses 300 ms.',
					'const RUN_TIMEOUT_MS = 300;',
					'const stuckWorker = new Promise(() => {}); // an endless loop never answers',
					'const quickWorker = new Promise((res) => setTimeout(() => res({ all_passed: true }), 50));',
					'const timeout = () => new Promise((res) => setTimeout(() => res({ all_passed: false, error_category: "timeout" }), RUN_TIMEOUT_MS));',
					'console.log("quick:", await Promise.race([quickWorker, timeout()]));',
					'console.log("stuck:", await Promise.race([stuckWorker, timeout()]));',
					'// In the app the timeout branch also calls worker.terminate() and the next run starts a new worker.'
				)
			},
			{
				label: 'Check PBKDF2 against an RFC 6070 vector',
				code: md(
					'// RFC 6070: PBKDF2-HMAC-SHA1, password "password", salt "salt", 1 iteration, 20 bytes.',
					'const enc = new TextEncoder();',
					'const key = await crypto.subtle.importKey("raw", enc.encode("password"), "PBKDF2", false, ["deriveBits"]);',
					'const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-1", salt: enc.encode("salt"), iterations: 1 }, key, 160);',
					'const hex = [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");',
					'console.log(hex);',
					'console.log("matches the RFC:", hex === "0c60c80f961f0e71f3a9b524af6012062fe037a6");'
				)
			}
		]
	},

	// ───────────────────────── Porting the Backend lab ─────────────────────────
	{
		id: 'bt-dojo-port',
		title: 'Porting the Backend lab off its server',
		level: 'mid',
		summary: 'Follow how a server-backed learning app became on-device code: where progress lives, how XP and streaks work, and how the port is checked.',
		scenes: ['bt-dojo-grading', 'bt-dojo-xp'],
		notes: md(
			'**What was ported.** Backend Dojo began as a local web app: a FastAPI server, a Postgres database and a locally installed AI command-line tool for the tutor. In Preppy that server is gone. Its jobs became TypeScript modules in `src/dojo/engine`: `grading.ts` (run, record, award), `gamification.ts` (levels and streaks), `diagram.ts` (architecture diagram unlocks), `store.ts` (progress) and `runners.ts` (the workers). The grading, XP, streak and unlock rules were kept the same on purpose, so the 147 exercises (76 Python, 24 SQL, 47 quizzes) behave as before.',
			'',
			'**How progress is stored.** One JSON object under the key `prep-pocket:dojo:v1` in `localStorage`, with the old data model: `exercises` (status and attempts), `mistakes` (capped at 200), `stats` and `diagram`. One learner on one device needs no queries, and a single blob is simple to export and reset.',
			'',
			'**Rules.**',
			'',
			'- XP for level n is `floor(100 * (n - 1) * n / 2)`, so each level costs 100 XP more than the last.',
			'- XP is awarded only the first time an exercise is solved. Every attempt is recorded, and failures also go in the mistakes log.',
			'- A streak counts the learner\'s local calendar day, not UTC: the next day adds one, the same day changes nothing, a gap resets it to 1.',
			'- Diagram parts unlock per chapter: after the first solved exercise, after half, or when the chapter is complete.',
			'',
			'**Checking the port.** `bun run verify` runs every Python and SQL reference solution through the same engines (Pyodide and PGlite), confirms every quiz has a valid correct answer, and runs the drills. **Trade-off:** uninstalling erases `localStorage`, hence Settings, Your data, Export.'
		),
		try: [
			{
				label: 'Levels and streaks (the app\'s own rules)',
				code: md(
					'// Ported from gamification.ts',
					'const levelThreshold = (level) => Math.floor((100 * (level - 1) * level) / 2);',
					'function levelForXp(xp) {',
					'  let level = 1;',
					'  while (levelThreshold(level + 1) <= xp) level++;',
					'  return level;',
					'}',
					'console.log([1, 2, 3, 4, 5, 6].map((l) => l + ": " + levelThreshold(l) + " XP").join(" | "));',
					'console.log("250 XP is level", levelForXp(250));',
					'const toDay = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86400000;',
					'function nextStreak(cur, last, today) {',
					'  if (!last) return 1;',
					'  const delta = toDay(today) - toDay(last);',
					'  if (delta === 0) return cur;',
					'  if (delta === 1) return cur + 1;',
					'  return 1;',
					'}',
					'console.log("next day:", nextStreak(3, "2026-10-26", "2026-10-27"));',
					'console.log("same day:", nextStreak(3, "2026-10-27", "2026-10-27"));',
					'console.log("skipped a day:", nextStreak(3, "2026-10-26", "2026-10-28"));'
				)
			},
			{
				label: 'When diagram parts unlock',
				code: md(
					'// The three unlock rules from diagram.ts, for one chapter with 12 exercises.',
					'const total = 12;',
					'const unlocked = (rule, solved) =>',
					'  rule === "first" ? solved >= 1 : rule === "mid" ? solved >= Math.ceil(total / 2) : solved === total;',
					'for (const solved of [0, 1, 6, 12]) {',
					'  console.log(solved + " solved ->", ["first", "mid", "complete"].filter((r) => unlocked(r, solved)).join(", ") || "nothing yet");',
					'}'
				)
			}
		]
	}
];

// ───────────────────────── Quiz ─────────────────────────
const t = (topic: string) => builder('BT', topic);

// bt-why
const why = t('bt-why');

why.add('basic', 'first-commit',
	'What did the first commit on 13 October 2026, then called Prep Pocket, bundle together?',
	'The Backend lab, the Svelte and TypeScript prep and the JavaScript drills in one app',
	['A web dashboard plus an API server that the phone talks to whenever it has a connection',
	 'The React and Next.js question bank together with the on-device Assistant',
	 'Only the Backend lab, with the other projects linked from its menu'],
	'The first commit combined three of the four study projects into one app. The React, Next.js and TypeScript bank came later, in 1.1.0 on 14 October, and the Assistant arrived in 1.2.0. There was never a server for the phone to talk to.');

why.add('basic', 'rename-keeps-progress',
	'Why did the 1.3.0 rename from Kata to Preppy keep learners\' progress?',
	'The package id stayed the same, so Android saw an update to the same app',
	['Progress was uploaded to a server before the rename and then restored after it',
	 'The app copied its stored data to a file on shared storage before every update',
	 'Android keeps the data of any apps that share the same display name'],
	'Android identifies an app by its package id (com.aniqhaider.preppocket) and signing key, not by the name on the launcher. Because both stayed the same, the new build installed over Kata and its localStorage survived. No server was involved.');

why.add('mid', 'debug-apk-cost',
	'Which is a real cost of shipping a debug-signed APK on GitHub instead of using the Play Store?',
	'Play Protect may warn about an unknown developer, and updates need the same signing key',
	['The internet permission is unavailable, so models and voices cannot be downloaded at all',
	 'Learners must create an account with the developer before the app will open',
	 'Progress is erased on every update because the signature changes the data folder'],
	'Sideloading skips store review and fees but brings a Play Protect warning, and updates depend on one signing key staying the same. Internet access, accounts and data loss are not consequences: the data folder follows the package id, and the app has no accounts.');

why.add('mid', 'no-backend',
	'What was the reasoning behind having no account, no backend and no analytics code?',
	'One learner on one phone needs no server, so progress can stay in localStorage',
	['Android does not allow apps to send learner data to any server, so none was built',
	 'Svelte cannot make network requests from inside a WebView',
	 'Servers cannot keep progress for a learner who studies late at night'],
	'The decision was about need, not capability: with one learner and one device, a server adds cost and failure modes for no benefit. Android and Svelte can both make requests, and the app still does for chosen features such as model downloads.');

why.add('advanced', 'uninstall-loses',
	'A learner uninstalls Preppy without exporting anything and installs the same APK again. What happens to their Backend lab progress?',
	'It is gone: progress lives only in the app\'s localStorage and no server holds a copy',
	['It is restored automatically, because the same signing key unlocks the old data on install',
	 'It is kept in the GitHub release the APK came from and loads on first start',
	 'It moves to the next install through the Capacitor bridge'],
	'Uninstalling deletes the app\'s data, and nothing else holds a copy: there is no account, server or sync. The signing key only decides whether an update may install over an existing app. This is the trade-off of the no-backend decision, and why Settings has an Export.');

// bt-stack
const stk = t('bt-stack');

stk.add('basic', 'capacitor-role',
	'What does Capacitor do in Preppy?',
	'It hosts the web app in an Android WebView and lets JavaScript call native plugins',
	['It compiles every Svelte component into native Android views at the time the APK is built',
	 'It replaces Vite as the bundler for the web code',
	 'It runs the Python and SQL engines on the phone'],
	'Capacitor is the bridge between a web app and the device: it hosts the WebView and exposes plugins. Vite still bundles the code, Svelte still renders in the WebView, and the engines run as WebAssembly in workers rather than through Capacitor.');

stk.add('basic', 'two-plugins',
	'Which two native plugins does Preppy register in MainActivity?',
	'LocalLlm for the model and LocalTts for the voices',
	['LocalDb for PostgreSQL and LocalPy for running Python code',
	 'LocalSync for backups and LocalAuth for sign-in',
	 'LocalCam for scanning code and LocalMap for lessons'],
	'Only the two jobs that a WebView cannot do well needed native code: running a language model through llama.cpp and speaking with neural voices through sherpa-onnx. Python and SQL run as WebAssembly, and there is no sync or sign-in.');

stk.add('mid', 'why-webview',
	'Why was a WebView app chosen over React Native, Flutter or native Kotlin?',
	'Pyodide, PGlite, CodeMirror and sucrase are web code, so a WebView reuses them unchanged',
	['WebView screens are always faster than native screens, which suits a study app best',
	 'Capacitor is the only tool that can produce an arm64 APK for the Play Store, so it was used',
	 'Native frameworks cannot show animated lessons'],
	'The deciding factor was reuse: the engines that make the app offline are built for the web. Speed is not the reason, since native screens are usually faster, and every Android toolchain can target arm64. Animations are possible in any framework.');

stk.add('mid', 'http-origin',
	'Why does capacitor.config.ts serve the app from http://localhost with cleartext allowed?',
	'localhost is a secure context, and https would block calls to a LAN model server over http',
	['Android WebView cannot load https origins at all, so every Capacitor app has to use http here',
	 'Cleartext lets the app skip signing its APK',
	 'It makes the app reachable from other phones on the same network'],
	'An https page calling an http address is mixed content and is blocked. Using http://localhost keeps secure-context APIs while allowing a local Ollama-style server. WebView supports https, cleartext has nothing to do with signing, and localhost is not exposed to other devices.');

stk.add('advanced', 'browser-dev-loop',
	'You run bun run dev in a browser, where the native plugins do not exist. What should code that needs one do?',
	'Check availability first and fall back, as the keep-awake code does with isPluginAvailable',
	['Call the plugin anyway, because Capacitor emulates every custom plugin when running in a browser',
	 'Load the llama.cpp library through WebAssembly automatically',
	 'Throw an error at start-up so the developer notices the missing plugin'],
	'Plugins exist only in the APK. Guarding each call keeps the browser loop usable for everything else and lets the app degrade, for example to the Screen Wake Lock API. Capacitor does not emulate custom plugins, and throwing would make the fast loop pointless.');

// bt-offline
const off = t('bt-offline');

off.add('basic', 'sql-engine',
	'What runs SQL in the Backend lab and the PostgreSQL playground?',
	'PGlite, a real PostgreSQL build compiled to WebAssembly',
	['A SQLite file with a Postgres-style parser placed on top',
	 'A small server process that the APK starts on the phone',
	 'A JavaScript library that matches queries by pattern instead of running them'],
	'PGlite is PostgreSQL itself in WebAssembly, which is why EXPLAIN, transactions and Postgres-specific syntax behave faithfully. Nothing is pattern-matched or faked, and no server process is involved.');

off.add('basic', 'copy-pyodide',
	'What is scripts/copy-pyodide.ts for?',
	'It copies the Pyodide runtime into public/pyodide so no CDN is needed',
	['It downloads Python packages the first time a lesson needs them, then caches them',
	 'It compiles Python exercises to JavaScript before the build',
	 'It signs the Pyodide files so Android will load them'],
	'Running before every dev start and build, the script puts the WebAssembly runtime, standard library and lock file inside the app. That is what lets Python work in airplane mode. It neither downloads packages nor compiles or signs anything.');

off.add('mid', 'endless-loop',
	'A learner submits "while True: pass" in a Python exercise. What happens when the 8 second timer fires?',
	'The runner terminates the worker, reports a timeout and starts a new worker next run',
	['The worker receives a stop message and exits cleanly',
	 'The main thread interrupts the loop with a signal and keeps using the very same worker',
	 'The run continues until Android\'s watchdog closes the whole app'],
	'A loop that never yields cannot process messages, so a stop message is never read. Terminating the worker is the only way to end it, and the next run needs a fresh worker. Because the work is in a worker, the app itself stays responsive throughout.');

off.add('mid', 'init-timeout',
	'Why is an engine\'s first-start timeout 120 seconds while one run gets 8 seconds?',
	'Booting an engine on a phone can take long, once, but a run of learner code should be short',
	['Engines are downloaded from the internet at first start, which can take a few minutes on mobile data',
	 'The 8 second limit applies only to SQL, and Python gets 120 seconds',
	 'Longer timeouts keep the screen awake while the engine boots'],
	'The two limits guard different things. Start-up cost is paid once and varies with the phone, so it gets a generous bound. A run is the learner\'s code, where more than 8 seconds almost always means an endless loop. The engines are bundled, so nothing is downloaded.');

off.add('advanced', 'pbkdf2-shim',
	'Why does the Backend lab ship a shim for hashlib.pbkdf2_hmac?',
	'Pyodide has no OpenSSL, so the shim builds PBKDF2 on hmac.digest and is tested against RFC 6070',
	['pbkdf2_hmac was removed from Python 3 because the algorithm is considered insecure for passwords',
	 'The WebView blocks crypto calls, so hashes are faked with fixed strings',
	 'PGlite already hashes passwords, and the shim returns the database\'s value'],
	'The authentication chapter uses pbkdf2_hmac, which needs OpenSSL, and Pyodide\'s build lacks it. The shim implements RFC 8018 on the C-level hmac.digest (about 0.2 s for 100,000 iterations) and is tested against known vectors so results are real, not faked.');

// bt-dojo-port
const dp = t('bt-dojo-port');

dp.add('basic', 'server-replaced',
	'What replaced Backend Dojo\'s FastAPI and Postgres backend inside Preppy?',
	'TypeScript modules in src/dojo/engine on the phone, with progress in localStorage',
	['A cut-down FastAPI server bundled inside the APK and started automatically when the app opens',
	 'A hosted database that the app syncs with whenever it is online',
	 'Native Kotlin services started by MainActivity'],
	'The server\'s jobs (grading, XP, streaks, diagram unlocks, progress) were ported to TypeScript, and the engines run in workers. Nothing about the port needs a bundled server, a hosted database or Kotlin services.');

dp.add('basic', 'progress-key',
	'Where is Backend lab progress stored?',
	'One JSON object under prep-pocket:dojo:v1 in localStorage',
	['In a SQLite file inside the app\'s cache folder',
	 'In a table inside PGlite that persists between runs',
	 'In the Capacitor Preferences plugin, stored as one separate key for every exercise'],
	'The old progress database was replaced by a single JSON blob with the same data model. PGlite is created in memory for running queries, not for storing progress, and no extra plugin is used.');

dp.add('mid', 'repeat-solve',
	'A learner solves an exercise they already solved. What happens?',
	'Attempts go up, but no XP is awarded because XP is given only on a first solve',
	['XP is awarded again, since every successful run earns the exercise\'s points, and attempts stay the same',
	 'Nothing is recorded, because solved exercises are locked',
	 'The status returns to unsolved until it passes twice'],
	'Every attempt is recorded, and a solved exercise stays solved. The grading code awards XP only when the run passed and the exercise was not already solved, so repeating one cannot farm points.');

dp.add('mid', 'level-four',
	'Using levelThreshold(n) = floor(100 x (n - 1) x n / 2), how much total XP is needed to reach level 4?',
	'600 XP',
	['400 XP', '300 XP', '1,000 XP'],
	'For n = 4 the formula gives 100 x 3 x 4 / 2 = 600. The thresholds are 100, 300, 600, 1,000 for levels 2 to 5, so each level costs 100 XP more than the one before. 300 is level 3 and 1,000 is level 5.');

dp.add('advanced', 'streak-gap',
	'A learner has a streak of 3, last active on 26 October, and next solves something on 28 October. What is the streak afterwards, and which date is used?',
	'1, because a day was skipped; the date is the learner\'s local day, not UTC',
	['4, because streaks only reset after a full week without any activity in the app',
	 '3, because a gap leaves the streak unchanged until the next consecutive day',
	 '2, because a skipped day subtracts only one from the streak'],
	'nextStreak compares day numbers: a difference of 0 keeps the streak, 1 adds one, and anything larger resets to 1. Here the difference is 2, so it resets. The local date is used so that a late-night solve counts for the day the learner thinks it is.');

export const banks: { out: Question[] }[] = [why, stk, off, dp];
