import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');

// How Preppy was built, part 3: the on-device model, the Assistant, narration voices, checking, releasing and the trade-offs.
// Every number here comes from the repo (CHANGELOG.md, README.md, src/, android/) or from the checks run while building it.

export const topics: DbTopic[] = [
	// ───────────────────────── An LLM on the phone ─────────────────────────
	{
		id: 'bt-local-llm',
		title: 'An LLM on the phone',
		level: 'advanced',
		summary: 'See how a language model runs inside the app with no server: the native build, the plugin, the model files and the choices that keep it usable.',
		scenes: ['bt-llm-stack', 'bt-llm-prompt'],
		notes: md(
			"The Backend tutor and the Assistant can run a language model on the phone itself: no account, and no internet after a one-time download. It is the biggest piece of native code in the app.",
			"",
			"**What was built**",
			"",
			"- llama.cpp is compiled by CMake inside the Gradle build. `localllm.cpp` is the JNI bridge, `LlamaEngine.java` wraps it, and `LocalLlmPlugin.java` exposes it to the WebView as a Capacitor plugin, `LocalLlm`, with a `token` event that streams the reply.",
			"- llama.cpp is pinned to one commit and fetched by `scripts/fetch-llama.sh`; it is not vendored in git.",
			"- Models are GGUF files in app-private storage. The download resumes and checks free space first.",
			"",
			"**Decisions**",
			"",
			"- **CPU only**, built as several per-CPU-feature variants (dotprod, i8mm, SVE and others). The best one is picked when the app starts, so one APK is fast on a new phone and safe on an old one.",
			"- **Threads** are the core count minus two, kept between 2 and 4, so the slow cores stay out of the matrix maths.",
			"- **Context window** of 4096 tokens. That is why the Assistant's prompt builder has a character budget.",
			"- **Q4_K_M** (4-bit) is the default. Qwen3.5 4B is 2.74 GB; its 8-bit file is 4.48 GB, about 1.6 times larger and slower. More bits add precision, not knowledge.",
			"- **Each model's own chat template**, with thinking switched off (a reasoning model would otherwise think for minutes on a phone CPU) and no duplicate start token. If it throws, a legacy formatter runs, then a plain prompt.",
			"- The 2024 Qwen2.5 and Llama 3.2 models stay in the list, labelled as older.",
			"- One function, `runModel`, sends the same prompt to the phone model, Gemini, Claude or an OpenAI-compatible server such as Ollama.",
			"",
			"**Trade-off**: no GPU speed-up, and small models make mistakes, so answers are best read as hints."
		),
		try: [
			{
				label: 'How many threads a phone gets',
				code: md(
					"// LlamaEngine.load: threads = max(2, min(4, cores - 2))",
					"const threads = (cores) => Math.max(2, Math.min(4, cores - 2));",
					"for (const cores of [4, 6, 8, 10]) {",
					"  console.log(cores + ' cores -> ' + threads(cores) + ' threads');",
					"}"
				)
			},
			{
				label: 'Model file sizes (exact bytes from the catalog)',
				code: md(
					"const fmt = (n) => (n >= 1e9 ? (n / 1e9).toFixed(2) + ' GB' : (n / 1e6).toFixed(0) + ' MB');",
					"const q4 = 2740937888; // Qwen3.5 4B, Q4_K_M",
					"const q8 = 4482403488; // Qwen3.5 4B, Q8_0",
					"console.log('4-bit: ' + fmt(q4));",
					"console.log('8-bit: ' + fmt(q8));",
					"console.log('8-bit is ' + (q8 / q4).toFixed(2) + 'x the size');",
					"console.log('Qwen3.5 2B 4-bit: ' + fmt(1280835840));",
					"console.log('Qwen3.5 9B 4-bit: ' + fmt(5680522464));"
				)
			}
		]
	},

	// ───────────────────────── The Assistant and grounding ─────────────────────────
	{
		id: 'bt-assistant',
		title: 'The Assistant and grounding',
		level: 'advanced',
		summary: 'Understand why a small model got MCP wrong, and how searching Preppy’s own notes, an optional web lookup and a careful prompt fixed it.',
		scenes: ['bt-grounding-flow', 'bt-knowledge-index', 'bt-grounding-results'],
		notes: md(
			"The Assistant is the Ask button in every section except the Backend lab, which keeps its own tutor. Each section publishes a short text snapshot of what is on screen (`context.ts`): the quiz question, the theory section, or the drill and your code. While a quiz question is unanswered, the Assistant is told to hint instead of revealing the answer.",
			"",
			"**The problem (2.4.0).** Asked 'What is MCP?', a Qwen2.5 model invented an answer. The cause was neither size nor 4-bit quantization: MCP was announced on 25 November 2024, after that model's training data ended. A bigger or 8-bit file is more precise, not better informed.",
			"",
			"**The fix has three layers**",
			"",
			"1. **Preppy's own notes, always, offline.** A BM25 index over every topic's notes and every quiz explanation (about 30 ms to build). Filler words are dropped, the question needs a distinctive term (one in under about 6% of chunks), and a topic's opening chunk goes first so the definition leads.",
			"2. **Web lookup, optional and off by default.** Wikipedia needs no key; Tavily and Serper need your own. It runs when the notes have nothing, the question asks about something recent, or you chose every question. Only keywords are sent, only while online.",
			"3. **A careful prompt.** About 9000 characters inside the 4096-token window. The system prompt names only the sections actually present, because small models echo headings. Web text is marked untrusted, and a Sources list is appended.",
			"",
			"**Results** (same prompts, on a Mac): Qwen2.5 0.5B invented 'Maximum Common Port' without notes and was correct with them. Qwen3.5 4B already knew MCP and was precise with notes.",
			"",
			"**Checks**: `bun scripts/check-assistant-knowledge.ts` and `bun scripts/check-web-lookup.ts`.",
			"",
			"**Trade-off**: small models can still misread a passage, and the Backend lab tutor does not use the notes lookup."
		),
		try: [
			{
				label: 'A tiny notes search (BM25-style)',
				code: md(
					"const STOP = new Set('what is a an the of in how do does why and to'.split(' '));",
					"const tokenize = (s) => (s.toLowerCase().match(/[a-z0-9]+/g) || [])",
					"  .filter((w) => !STOP.has(w))",
					"  .map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w));",
					"const chunks = [",
					"  'MCP is the Model Context Protocol, an open standard for connecting models to tools',",
					"  'A closure is a function that remembers the variables around it',",
					"  'Idempotency means repeating a request has the same effect as sending it once',",
					"  'A hash table maps keys to buckets using a hash function'",
					"].map((text) => ({ text, words: tokenize(text) }));",
					"const N = chunks.length, K1 = 1.4, B = 0.75;",
					"const avg = chunks.reduce((n, c) => n + c.words.length, 0) / N;",
					"const df = (w) => chunks.filter((c) => c.words.includes(w)).length;",
					"const idf = (w) => Math.log(1 + (N - df(w) + 0.5) / (df(w) + 0.5));",
					"function search(q) {",
					"  const known = [...new Set(tokenize(q))].filter((w) => df(w) > 0);",
					"  return chunks.map((c) => {",
					"    let score = 0;",
					"    for (const w of known) {",
					"      const f = c.words.filter((x) => x === w).length;",
					"      if (f) score += (idf(w) * f * (K1 + 1)) / (f + K1 * (1 - B + (B * c.words.length) / avg));",
					"    }",
					"    return { score, text: c.text };",
					"  }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score);",
					"}",
					"for (const q of ['What is MCP?', 'explain closures', 'give me a hint']) {",
					"  const top = search(q)[0];",
					"  console.log(q + ' -> ' + (top ? top.score.toFixed(2) + '  ' + top.text.slice(0, 40) : 'nothing to look up'));",
					"}"
				)
			},
			{
				label: 'The prompt budget',
				code: md(
					"// prompt.ts: the whole prompt stays near 9000 characters inside the 4096-token window",
					"const PROMPT_BUDGET = 9000;",
					"const roomForHistory = (fixed) => Math.max(600, Math.min(2400, PROMPT_BUDGET - fixed));",
					"for (const fixed of [1500, 5000, 7000, 8800]) {",
					"  console.log('notes + question take ' + fixed + ' chars -> history gets ' + roomForHistory(fixed));",
					"}"
				)
			}
		]
	},

	// ───────────────────────── Narration voices ─────────────────────────
	{
		id: 'bt-narration',
		title: 'Narration voices',
		level: 'advanced',
		summary: 'Follow how lessons are read aloud on the phone: the native engine, the real-time factor, a pure scheduler, the sentence cache and thread tuning.',
		scenes: ['bt-tts-buffer', 'bt-tts-cache', 'bt-tts-tune'],
		notes: md(
			"Lessons can be read aloud by a neural voice that runs on the phone (sherpa-onnx, in `LocalTtsPlugin.java`, `TtsEngine.java` and `TtsCache.java`). The system voice stays the default and the fallback, so a failed voice never silences a lesson. Voices: Natural (Kokoro, 132 MB, five speakers), Clear (Piper, 35 MB), Warm (Piper, 21 MB) and British (Piper, 21 MB).",
			"",
			"**The real-time factor.** A voice needs `rtf` seconds of CPU per second of audio. Below 1 the next sentence is ready in time; at 1 or above it never catches up and stutters.",
			"",
			"**Decisions**",
			"",
			"- **A pure scheduler** (`src/tts/schedule.ts`): no audio, no DOM, no clock. The real speaker and `scripts/verify-tts.ts` run the same decisions, so stutter is tested on a virtual clock.",
			"- **Measure, then buffer.** The scheduler tracks rtf, keeps 6 to 20 seconds of audio ahead, waits for enough buffer before starting, re-buffers once when it runs dry (never longer than 25 s), and says so when a voice is too slow. A voice is smooth at 0.7 or below, may pause up to 1.0, and is too slow above that.",
			"- **A sentence cache.** Each sentence is stored under the SHA-256 of voice, speaker, speed and text, with a 100, 200 or 500 MB limit (200 by default) that evicts the least recently used. Natural took 913 ms to synthesize a sentence and 30 ms to play it from the cache.",
			"- **Prefetch.** While step 1 plays, the rest of the lesson and the first two captions of the next are prepared in the background.",
			"- **Find fastest setting.** It tries a few thread counts, discards a warm-up, times two runs each and keeps the quickest, because on phones with fast and slow cores more threads can be slower.",
			"",
			"**Trade-off**: the heaviest voice may still pause the first time a lesson is heard; the cache fixes repeats, not the first listen."
		),
		try: [
			{
				label: 'How a voice speed is classified',
				code: md(
					"// schedule.ts",
					"const speedClass = (rtf) => (rtf <= 0.7 ? 'smooth' : rtf <= 1.0 ? 'may-pause' : 'slow');",
					"const leadSeconds = (rtf) => Math.min(20, Math.max(6, 6 + (rtf - 0.5) * 20));",
					"for (const rtf of [0.5, 0.71, 0.92, 1.3]) {",
					"  console.log('rtf ' + rtf + ' -> ' + speedClass(rtf) + ', keep ' + leadSeconds(rtf).toFixed(1) + ' s of audio ahead');",
					"}"
				)
			},
			{
				label: 'The cache key input and the thread candidates',
				code: md(
					"// cacheKey.ts builds the text that is hashed with SHA-256",
					"const cacheKeyInput = (voice, sid, speed, text) =>",
					"  voice + '|' + Math.trunc(sid) + '|' + (Math.round(speed * 100) / 100).toFixed(2) + '|' + text;",
					"console.log(cacheKeyInput('vits-piper-en_US-lessac-high-int8', 0, 1.001, 'Every request travels to the server.'));",
					"console.log(cacheKeyInput('vits-piper-en_US-lessac-high-int8', 0, 1, 'Every request travels to the server.'));",
					"",
					"// tune.ts: 1, 2, 3, 4 and the performance-core count, capped at 6 and at the phone's cores",
					"const candidateThreads = (info) => {",
					"  const cap = Math.max(1, Math.min(6, info.cores));",
					"  const out = [...new Set([1, 2, 3, 4, info.performance])].filter((n) => n >= 1 && n <= cap).sort((a, b) => a - b);",
					"  return out.length ? out : [cap];",
					"};",
					"console.log(JSON.stringify(candidateThreads({ cores: 8, performance: 4 })));",
					"console.log(JSON.stringify(candidateThreads({ cores: 8, performance: 6 })));",
					"console.log(JSON.stringify(candidateThreads({ cores: 4, performance: 4 })));"
				)
			}
		]
	},

	// ───────────────────────── How it was checked ─────────────────────────
	{
		id: 'bt-quality',
		title: 'How it was checked',
		level: 'mid',
		summary: 'See the layers of checking behind each release, from scripts that run every example to testing the real APK, and what was never measured.',
		scenes: ['bt-verify-loop', 'bt-emulator-loop'],
		notes: md(
			"Preppy has no test framework and no server, so the checks are plain scripts run with Bun, plus a few things done by eye. Each one catches a different kind of mistake.",
			"",
			"**The scripts**",
			"",
			"- `bun run check` (svelte-check): types across the Svelte and TypeScript code.",
			"- `bun run content`: the validator for lessons and quizzes. Nodes inside the stage, no overlaps, captions of a sane length, four distinct options, no 'all of the above', explanations of at least 80 characters.",
			"- `bun run verify`: every Backend lab reference solution (147 exercises) and every drill's reference solution through the real in-browser engines. A drill's untouched starter must fail.",
			"- `bun scripts/verify-snippets.ts`: every Try-it snippet runs against the real engines.",
			"- `bun scripts/verify-tts.ts`: narration simulated on a virtual clock at several synthesis speeds.",
			"- The two assistant scripts: the notes lookup finds the right topics and stays quiet for 'hello'; web requests and replies are parsed correctly (Tavily and Serper mocked).",
			"",
			"**By eye.** The validator cannot see taste, so lessons are opened in the dev-only Gallery (`#gallery:aw-`) as a filmstrip. A fact-check pass on the database content (1.5.0) corrected wording the scripts could not judge.",
			"",
			"**On a real APK.** The packaged app runs on an emulator and a script drives the WebView over its DevTools socket. In 1.7.1 the lesson player was measured on a phone-sized screen: identical positions across seven lessons and a layout shift of 0.001.",
			"",
			"**Honest gaps.** Speed on a real phone was never measured. Tavily and Serper were tested with mocks, not a real key. Of the Gemma 4 models only the smaller one was tested for its template."
		),
		try: [
			{
				label: 'The quiz rules, in miniature',
				code: md(
					"// A small version of the rules in scripts/validate-content.ts",
					"function check(q) {",
					"  const problems = [];",
					"  const opts = [q.correct, ...q.wrong];",
					"  if (new Set(opts.map((o) => o.trim())).size !== 4) problems.push('options are not 4 distinct strings');",
					"  if (opts.some((o) => /all of the above|none of the above|both a and b/i.test(o))) problems.push('all/none of the above');",
					"  if (q.why.length < 80) problems.push('explanation too short (' + q.why.length + ')');",
					"  return problems;",
					"}",
					"const good = { correct: 'Port 443', wrong: ['Port 21', 'Port 25', 'Port 8'], why: 'HTTPS uses port 443 by default; 21 is FTP, 25 is SMTP and 8 is not a standard web port at all.' };",
					"const bad = { correct: 'Port 443', wrong: ['Port 443', 'All of the above', 'Port 25'], why: 'Too short.' };",
					"console.log('good:', JSON.stringify(check(good)));",
					"console.log('bad:', JSON.stringify(check(bad)));"
				)
			}
		]
	},

	// ───────────────────────── Building and shipping ─────────────────────────
	{
		id: 'bt-release',
		title: 'Building and shipping',
		level: 'mid',
		summary: 'Walk through a release: the toolchain, the build commands, why the signing key matters, and how one CHANGELOG feeds the popup and the GitHub release.',
		scenes: ['bt-release-pipeline', 'bt-update-keeps-progress'],
		notes: md(
			"Preppy is shipped as an APK attached to a GitHub release. There is no Play Store listing, so the release process is a short checklist you can run by hand.",
			"",
			"**Toolchain**: JDK 21, Android SDK platform 36, build tools 36.0.0, NDK 27.2.12479018 and CMake 3.31.6. The APK is arm64 only, and `minSdk` is 33 (Android 13). The native libraries for llama.cpp and sherpa-onnx are fetched by `scripts/fetch-llama.sh` and `scripts/fetch-sherpa.sh`, not stored in git.",
			"",
			"**Steps**",
			"",
			"1. Bump `version` in `package.json` and `versionName` and `versionCode` in `android/app/build.gradle`.",
			"2. Add an entry at the top of `CHANGELOG.md`.",
			"3. `bun run build`, then `cap sync android`, then `./gradlew assembleDebug`.",
			"4. Commit, push, and create a GitHub release with the APK attached and the CHANGELOG entry as its notes.",
			"5. Update the README download links. The APK is about 45 MB.",
			"",
			"**Decisions**",
			"",
			"- **The same signing key every time.** Android installs an update over an installed app only if both are signed with the same key. A debug build uses `~/.android/debug.keystore`, which differs per computer, so a Windows build copies the Mac's keystore first.",
			"- **The package id never changed**, even when Kata became Preppy in 1.3.0, so the new app installed over the old one and kept its progress.",
			"- **One CHANGELOG, two uses.** The in-app What's new popup reads the newest entry (`src/ui/whatsNew.ts`), and the same text is the release notes. The popup shows once per update and not on a fresh install.",
			"",
			"**Trade-off**: progress lives in the WebView's localStorage, so uninstalling erases it. Settings → Your data exports the Backend lab progress as a JSON file; quiz progress is not part of that export."
		),
		try: [
			{
				label: 'Reading the newest CHANGELOG entry',
				code: md(
					"// whatsNew.ts: the first '## [version] - date' block of CHANGELOG.md",
					"const changelog = [",
					"  '# Changelog',",
					"  '',",
					"  '## [2.4.1] — 2026-11-02',",
					"  'Elasticsearch and OpenSearch join the AWS section.',",
					"  '',",
					"  '### Added',",
					"  '- Two new AWS topics.',",
					"  '',",
					"  '## [2.4.0] — 2026-11-01',",
					"  'Newer on-device models.'",
					"].join('\\n');",
					"const m = changelog.match(/^## \\[([^\\]]+)\\]\\s*[—-]\\s*(\\S+)\\n([\\s\\S]*?)(?=^## \\[|(?![\\s\\S]))/m);",
					"console.log('version: ' + m[1]);",
					"console.log('date: ' + m[2]);",
					"console.log('summary: ' + m[3].trim().split('\\n\\n')[0]);"
				)
			},
			{
				label: 'Should the popup show?',
				code: md(
					"// whatsNew.ts: shown once per update, never on a fresh install",
					"function shouldShow(seen, appVersion, hasPreppyData, latest) {",
					"  if (seen === appVersion) return false;",
					"  if (seen === null && !hasPreppyData) return false; // fresh install",
					"  return latest === appVersion;",
					"}",
					"console.log('fresh install:', shouldShow(null, '2.4.1', false, '2.4.1'));",
					"console.log('updated from 2.4.0:', shouldShow('2.4.0', '2.4.1', true, '2.4.1'));",
					"console.log('already dismissed:', shouldShow('2.4.1', '2.4.1', true, '2.4.1'));"
				)
			}
		]
	},

	// ───────────────────────── Decisions, trade-offs and limits ─────────────────────────
	{
		id: 'bt-tradeoffs',
		title: 'Decisions, trade-offs and limits',
		level: 'advanced',
		summary: 'Read the decision log in one place: what was chosen, what was left out, and what each choice costs the learner.',
		scenes: ['bt-decision-log', 'bt-limits-map'],
		notes: md(
			"Every choice in Preppy closed off another. This is the log, with the cost stated plainly.",
			"",
			"- **A WebView app (Capacitor) instead of native Kotlin.** The prep projects were already web code, and Pyodide, PGlite and the code editors run inside a WebView. Cost: WebView speed, and no iOS build; the app targets arm64 Android 13 and up.",
			"- **Offline only, no backend.** No accounts, nothing to run or pay for. Cost: no sync between devices, and progress sits in localStorage, so uninstalling erases it. Settings can export the Backend lab progress only.",
			"- **MySQL has lessons and a quiz but no playground**, because MySQL cannot run inside a phone WebView. PostgreSQL runs as PGlite and MongoDB queries through mingo.",
			"- **CPU-only llama.cpp.** No GPU backend is built, so there is no GPU speed-up. In return one APK runs on any arm64 phone.",
			"- **4-bit by default, thinking off.** Smaller and faster, with a small loss of precision and less step-by-step reasoning. The 8-bit file is one tap away.",
			"- **Small models make mistakes.** The notes lookup and the Sources list exist to reduce that, not to remove it. The README documents one gap: the Backend lab tutor keeps its own prompts and does not get the notes lookup.",
			"- **A debug-signed APK from GitHub, not the Play Store.** Learners install by hand and Play Protect may warn about an unknown developer. In return a release is a few commands.",
			"",
			"**Not yet done**: measuring speed on a real phone, trying Tavily or Serper with a real key, and giving the Backend tutor the notes lookup.",
			"",
			"The point of a log like this is that each line names the thing you gave up, so you can change your mind later with open eyes."
		),
		try: [
			{
				label: 'Which catalog models fit this phone?',
				code: md(
					"// RAM figures are the catalog's rough estimates (src/settings/localllm.ts)",
					"const models = [",
					"  ['Qwen3.5 2B', 2], ['Qwen3.5 4B', 3.5], ['Qwen3.5 4B (8-bit)', 5.5],",
					"  ['Gemma 4 E4B', 6], ['Qwen3.5 9B', 7], ['Qwen2.5 0.5B', 1]",
					"];",
					"const fits = (phoneGb, headroomGb) => models.filter(([, ram]) => ram <= phoneGb - headroomGb).map(([n]) => n);",
					"// headroom is a rule of thumb for Android itself and the app, not a measured number",
					"console.log('12 GB phone, 4 GB spare: ' + fits(12, 4).join(', '));",
					"console.log(' 8 GB phone, 4 GB spare: ' + fits(8, 4).join(', '));",
					"console.log(' 6 GB phone, 4 GB spare: ' + fits(6, 4).join(', '));"
				)
			}
		]
	}
];

// ───────────────────────── Quiz ─────────────────────────
const t = (topic: string) => builder('BT', topic);

// bt-local-llm
const l = t('bt-local-llm');
l.add('basic', 'plugin', 'How does the web part of Preppy talk to the llama.cpp code that runs on the phone?',
	'A Capacitor plugin called LocalLlm, which calls Java that calls the native code over JNI',
	['A local HTTP server that llama.cpp opens on a port inside the phone, which the page then calls',
	 'A WebAssembly build of llama.cpp that is loaded and run inside the page itself',
	 'A cloud endpoint that the app calls once the model file has been downloaded to storage'],
	'The page calls the LocalLlm Capacitor plugin, LocalLlmPlugin.java hands work to LlamaEngine.java, and that calls localllm.cpp over JNI. There is no local server, no WebAssembly build of llama.cpp, and no cloud call.');
l.add('mid', 'variants', 'Why is llama.cpp built as several CPU-feature variants instead of one build tuned for a single phone?',
	'The best variant is picked at start-up, so one APK is fast on new phones and safe on old ones',
	['Each variant is a different model size, and the app fetches the one that suits the free storage',
	 'Android caps native libraries at a fixed size, so the code is split into several parts',
	 'The variants all run at once and the app keeps whichever one finishes first'],
	'Variants such as dotprod, i8mm and SVE use different CPU instructions. Picking at runtime means no phone gets code it cannot run, and newer phones still use their faster instructions. The variants are not model sizes and do not race.');
l.add('mid', 'threads', 'A phone reports 8 cores. How many threads does LlamaEngine use, and why not all 8?',
	'4: cores minus two, kept between 2 and 4, so slow cores do not hold back fast ones',
	['8, because each extra core adds more speed to all of the matrix maths that the model does',
	 '2, because the model needs one spare core for each layer it has to run',
	 '1, because generating tokens is strictly one at a time and cannot be split up'],
	'The rule is max(2, min(4, cores - 2)), which gives 4 for 8 cores. Matrix multiplication does split across threads, but a thread on a slow core can make the others wait, so the count is capped and leaves cores free.');
l.add('advanced', 'template', 'Why does the native code format prompts with each model\'s own chat template and switch thinking off?',
	'Models expect the format they were trained on, and thinking would run for minutes',
	['The template shrinks the prompt so that it always fits inside the 4096-token window',
	 'Thinking mode needs an internet connection, which the phone does not have offline',
	 'The template encrypts the prompt so that it never leaves the running app process'],
	'A model answers best in the format it was trained on, which is why Qwen3.5 and Gemma 4 needed their own templates. Thinking is switched off so replies start straight away on a phone CPU. If the template throws, a legacy formatter and then a plain prompt take over.');
l.add('advanced', 'eight-bit', 'Qwen3.5 4B is 2.74 GB at 4-bit and 4.48 GB at 8-bit. What does the extra size buy?',
	'Less quantization loss, so answers are more precise, but nothing new is known',
	['A newer training date, so it can now answer questions about recent tools such as MCP',
	 'A longer context window than the 4096 tokens that the app sets',
	 'A thinking mode that the 4-bit file is not able to run at all'],
	'Quantization stores the same weights with more or fewer bits. More bits keep more precision, but the training data, and so the knowledge, is unchanged. The context window is set by the app (4096), not by the file.');

// bt-assistant
const a = t('bt-assistant');
a.add('basic', 'cutoff', 'Why could an older Qwen2.5 model not explain MCP, though it explained many other tools?',
	'Its training data ended before MCP was announced, so it never learned it',
	['The model was too small, so a larger download of the same family would know it well',
	 '4-bit quantization removes the newest facts first',
	 'The app blocks the topic until a web search key has been entered'],
	'A model only knows what was in its training data. MCP was announced on 25 November 2024, after Qwen2.5. Size and quantization change precision and fluency, not what the model was taught, which is why notes and web lookup were added.');
a.add('mid', 'bm25', 'Before the model answers, what does the Assistant search for the best passages?',
	'All topics\' notes and quiz explanations on the phone, ranked with BM25, offline',
	['Only the topic on screen, then a web search for everything else it does not cover',
	 'A vector database that the app downloads after the first install is finished',
	 'The model\'s own memory, asked a second time with a different prompt'],
	'The notes lookup runs offline over all topics and quiz explanations, builds in about 30 ms and ranks chunks with BM25. It does not use a downloaded vector store, a web search by default, or a second pass through the model.');
a.add('mid', 'generic', 'A learner types "give me a hint". Why does the notes lookup return nothing?',
	'No distinctive word is left once filler words go, so nothing is worth looking up',
	['Hints are blocked for quiz questions until the learner has shown the answer first',
	 'The index only holds topics that have at least two animated lessons attached',
	 'Short questions are always sent to the web search instead of the notes'],
	'The lookup needs a word that appears in under about 6% of chunks. "Give me a hint" has none, so no passages are added, which also keeps the prompt free of noise. Hints are still given, from the on-screen context.');
a.add('advanced', 'web', 'Which statement about the web lookup is true?',
	'Off by default; only keywords are sent, and only when a provider is set and online',
	['It runs on every question once a model is downloaded and sends the whole chat history',
	 'It needs a Tavily key, because Wikipedia is not available as a provider',
	 'It replaces the on-phone notes lookup whenever it is switched on'],
	'Wikipedia needs no key, Tavily and Serper need your own, and nothing is sent unless you pick one. It adds to the notes lookup rather than replacing it, and it runs when the notes are empty, the question is about something recent, or you chose every question.');
a.add('advanced', 'headings', 'Why does the system prompt name only the sections that are actually in the prompt?',
	'Small models echo headings they are told about, so absent ones would leak into answers',
	['The 4096-token window cannot hold a system prompt that lists every possible section',
	 'Server providers reject prompts that mention a section which is missing from the prompt',
	 'Each section name adds about a second to the time before the first word'],
	'During testing a model answered with the line "What the learner is looking at". Telling it only about sections that exist removed that. It is a prompt-design fix, unrelated to the token window, to server providers or to timing.');

// bt-narration
const n = t('bt-narration');
n.add('basic', 'rtf', 'What does a real-time factor of 1.3 mean for a narration voice?',
	'It takes 1.3 s of CPU to make 1 s of audio, so playback cannot keep up unaided',
	['It makes 1.3 s of audio for every second of CPU, so it is quicker than real time',
	 'The voice speaks 1.3 times faster than whatever the speed setting says',
	 'The sentence cache is 1.3 times larger than its limit allows it to be'],
	'The real-time factor is synthesis time divided by audio length. Above 1 the voice falls further behind with every sentence, so the app buffers first. Below 1 the next sentence is ready before the current one ends.');
n.add('mid', 'class', 'Which label does a voice with a measured real-time factor of 0.85 get?',
	'May pause, since it is above 0.7 and at most 1.0',
	['Smooth, since any value under 1.0 keeps up with speech',
	 'Too slow, since any value above 0.5 is slow',
	 'None until it has been tuned with Find fastest setting'],
	'speedClass treats 0.7 or lower as smooth, up to 1.0 as may-pause, and above 1.0 as too slow. At 0.85 the voice keeps up on average but can run dry when a long sentence arrives, hence "may pause".');
n.add('mid', 'key', 'What goes into the SHA-256 key of a cached narration sentence?',
	'Voice id, speaker id, speed and exact text, so changing any one gives a new entry',
	['Only the text, because the same words always sound the same whichever voice or speed is used',
	 'The lesson id and step number, so that each caption keeps exactly one file',
	 'The phone model and today\'s date, so the whole cache expires every day'],
	'The key input is voice, speaker, speed (rounded to 2 decimals) and text. A different voice or speed must not reuse another voice\'s audio, and the same words in the same voice never need synthesizing twice.');
n.add('advanced', 'pure', 'Why is the scheduling logic in schedule.ts written with no audio, no DOM and no clock of its own?',
	'The same decisions replay on a virtual clock, so stutter is testable without a phone',
	['Pure code runs faster than audio code on the slow cores of a phone CPU',
	 'The WebView forbids timers inside any module that is also allowed to play audio, so none is used',
	 'It lets a voice download carry on while a lesson is paused by the learner'],
	'Because the module only computes, scripts/verify-tts.ts can simulate whole lessons at several synthesis speeds and check for gaps in seconds. The real speaker calls the same code, so what is tested is what runs.');
n.add('advanced', 'tuning', 'Why does Find fastest setting try several thread counts instead of always using the most?',
	'Phones mix fast and slow cores, so a thread on a slow core can hold up the rest',
	['Each extra thread lowers the audio quality, most of all at the higher speed settings',
	 'Android limits narration to three threads for each app that plays audio',
	 'The first run is always the fastest, so the tuner keeps that one'],
	'The tuner loads the voice with each candidate count, discards one warm-up run, times two runs and keeps the quickest. It measures instead of assuming, because the answer depends on the phone\'s core layout. Quality does not change with threads.');

// bt-quality
const q = t('bt-quality');
q.add('basic', 'snippets', 'What does the Try-it check (verify-snippets) prove about a topic\'s code examples?',
	'Each snippet runs without an error on the same engines the playground uses',
	['Each snippet is the shortest possible way to solve the problem it shows',
	 'Each snippet\'s printed output matches the wording of the lesson that explains it',
	 'Each snippet passes a style linter before the app bundles it'],
	'The script runs every snippet through the real playground engines (PGlite, mingo, the JavaScript runner) and fails on an uncaught error. It does not judge style, brevity or whether the output matches the prose, which is a human check.');
q.add('mid', 'validator', 'Which problem can the content validator catch that a type check cannot?',
	'A lesson node outside the stage, or a quiz explanation under 80 characters',
	['A quiz answer that is factually wrong, even though it is clearly written and well formed',
	 'A lesson whose colours clash with the rest of the theme',
	 'A Svelte component that never renders on the screen at all'],
	'svelte-check understands types, not content rules. The validator knows the lesson stage size and the quiz rules (four distinct options, an explanation of 80 characters or more). Facts and taste still need a person.');
q.add('mid', 'gallery', 'Why were lessons also opened in the Gallery by eye, with the validator passing?',
	'The validator checks geometry and rules, not whether a lesson makes sense',
	['The Gallery is the only place where the timing of an animation can be measured at all',
	 'The validator only runs on the lessons that were edited that same day',
	 'A visual review is required before a release can be tagged on GitHub'],
	'A scene can pass every rule and still show a wrong total or a confusing order. The Gallery lays out every step as a filmstrip so a person can read it, which is how mistakes such as an arrow left pointing at a removed node get caught.');
q.add('advanced', 'drills', 'How does the drill check keep its tests honest?',
	'Reference solutions must pass every test, and untouched starters must fail them',
	['Starter code must pass them, to show the tests are not too hard for a newcomer to meet',
	 'Every drill runs ten times and the median run time is compared',
	 'A second model grades each solution before it is accepted as correct'],
	'A test that an empty starter passes proves nothing, and a test that the reference fails is broken. Requiring pass for the reference and fail for the stub checks the tests from both sides, with no model involved.');
q.add('advanced', 'gaps', 'Which of these had not been measured when 2.4.0 shipped?',
	'How fast Qwen3.5 4B generates on a real 12 GB phone',
	['Whether the notes lookup finds the MCP topic when it is asked about it',
	 'Whether the Wikipedia lookup works from the app\'s own origin',
	 'Whether the native path runs a model on the emulator'],
	'The notes lookup has a check script, Wikipedia was tested live from the app, and the emulator ran a model through the real Assistant. Speed on the phone itself was left for the owner to report, and Tavily and Serper had only mocked tests.');

// bt-release
const r = t('bt-release');
r.add('basic', 'version', 'Which files hold the app\'s version number in code, apart from the release notes?',
	'package.json, and versionName and versionCode in build.gradle',
	['README.md and CHANGELOG.md, which are edited by hand at every release',
	 'capacitor.config.ts and vite.config.ts, which both carry the version number',
	 'AndroidManifest.xml and the launcher icon files, which hold it for Android'],
	'A release bumps version in package.json and versionName and versionCode in build.gradle. versionCode must rise on every release so Android treats the APK as an update. The README and CHANGELOG describe the version but do not define it.');
r.add('mid', 'same-key', 'Why must every release be signed with the same key?',
	'Android installs over an installed app only when both carry the same signing key',
	['The Play Store refuses uploads that are signed with a key that has been used before',
	 'The key encrypts the saved progress, so a new key could not read it back',
	 'Gradle refuses to build whenever the key file on the computer changes'],
	'Update compatibility is checked by Android from the signature. A different debug key gives INSTALL_FAILED_UPDATE_INCOMPATIBLE. The key does not encrypt progress and Gradle does not mind a new key, but the install fails.');
r.add('mid', 'whats-new', 'Where does the in-app What\'s new popup get its text?',
	'The newest entry of CHANGELOG.md, the same text used for the GitHub release',
	['A separate JSON file that is edited by hand at release time',
	 'A request to the GitHub releases API, made each time the app is launched online',
	 'The commit messages written since the last tag was created'],
	'whatsNew.ts imports CHANGELOG.md as raw text and reads its first entry. That keeps the popup, the file and the release notes identical with no extra upkeep, and it works offline because nothing is fetched.');
r.add('mid', 'popup-rule', 'When is the What\'s new popup not shown?',
	'On a fresh install, and after it was dismissed for the current version',
	['On any update where the only change is to quiz questions and not to features',
	 'When the phone is offline at the moment the app launches',
	 'On the first update after the app was installed on the phone'],
	'A fresh install has nothing of Preppy\'s in storage, so there is nothing new to someone who has never seen the old version. After an update it shows once, and the app remembers the version it was dismissed for.');
r.add('advanced', 'foreign-key', 'An APK built on another computer used a different debug key. What happens when it is installed over the app?',
	'Android refuses the update; uninstalling first would lose the saved progress',
	['It installs, but the progress is wiped because the new key cannot read it',
	 'It installs and keeps the progress, since the package id is the same as before',
	 'It installs as a second copy that sits next to the first one'],
	'The package id matches, so Android treats it as the same app and then checks the signature, which fails. The only way past it is to uninstall, and progress lives in the WebView\'s localStorage, so it would be lost (Settings can export the Backend lab part first). That is why the keystore is copied between computers.');

// bt-tradeoffs
const d = t('bt-tradeoffs');
d.add('basic', 'storage', 'Where is a learner\'s progress stored, and what follows from that?',
	'In localStorage on the phone: no sync, and uninstalling erases it',
	['In an account on a server, so that it follows the learner to a new phone',
	 'In the Android Keystore, so that it survives uninstalling the app',
	 'In the GitHub release, so that it updates itself with each version'],
	'There is no backend, so progress is a JSON blob in localStorage. That keeps the app free to run and fully offline, at the cost of no sync between devices. Settings → Your data can export or reset the Backend lab part of it.');
d.add('mid', 'mysql', 'Why does MySQL have lessons and a quiz but no playground?',
	'MySQL cannot run inside a phone WebView, unlike PGlite and mingo',
	['MySQL\'s licence does not allow it to be bundled inside an Android app',
	 'The playground was dropped because the quiz already covered the same ground',
	 'A MySQL playground would need a hosted server and an internet connection'],
	'The playgrounds are in-app engines: PGlite is real PostgreSQL compiled to WebAssembly and mingo implements MongoDB queries in JavaScript. There is no equivalent MySQL engine that runs in a WebView, so its topics keep notes, lessons and a quiz.');
d.add('mid', 'four-bit', 'Why is the default model a 4-bit Q4_K_M file rather than 8-bit?',
	'It is smaller and faster on a phone, and 8-bit adds precision, not knowledge',
	['8-bit files cannot be read by llama.cpp when it runs on Android phones',
	 '4-bit files know more recent events than 8-bit files of the same model',
	 '8-bit files cannot be used together with the model\'s own chat template at all'],
	'Both formats load and use the template. The 8-bit Qwen3.5 4B is about 1.6 times larger and slower, and it is offered for anyone who finds the 4-bit answers off. The default favours speed and memory on a phone.');
d.add('advanced', 'tutor-gap', 'Which limit of the grounding is written down in the README?',
	'The Backend lab tutor keeps its own prompts, so it gets no notes lookup',
	['The Assistant cannot see what is currently on screen when the learner asks it something',
	 'The notes lookup needs an API key before it is able to run at all',
	 'The Assistant only works inside the quiz screens of each section'],
	'The README says generic prompts trigger neither lookup and that the Backend lab tutor keeps its own prompts. The Assistant does see the screen, the notes lookup is offline and keyless, and it works in every section except the Backend lab.');
d.add('advanced', 'sideload', 'What is the cost of shipping a debug-signed APK from GitHub instead of the Play Store?',
	'Learners install it by hand, and Play Protect may warn about an unknown developer',
	['The app cannot be updated in place, so each release is a fresh install with no progress',
	 'The app loses its offline features because it is not signed by the Play Store',
	 'The app only runs on the one computer that built it and nowhere else'],
	'Updates do install over the previous version when the key is the same, and nothing about offline use changes. The cost is the manual install and an expected warning. In return a release is a handful of commands with no store review.');

export const banks: { out: Question[] }[] = [l, a, n, q, r, d];
