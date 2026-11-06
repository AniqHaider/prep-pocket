import type { Scene, SceneNode, Tone } from '../../types';

/** How Preppy was built, part 3: the on-device model, the Assistant, narration, checking, releasing and the trade-offs. Ids `bt-*`; `group` = a topic id in src/db/built/native.ts. */

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

/** A small note beside a stacked box (same row as box `i`). */
const note = (id: string, i: number, text: string, o: { x?: number; w?: number; y?: number; h?: number; gap?: number } = {}): SceneNode => {
	const { x = 228, w = 120, y = 14, h = 44, gap = 28 } = o;
	return { id, kind: 'text', x, y: y + i * (h + gap) + 18, w, text, size: 'sm' };
};

export const btNative: Scene[] = [
	// ───────────── bt-local-llm ─────────────
	{
		id: 'bt-llm-stack',
		topic: 'built',
		group: 'bt-local-llm',
		title: 'From a question to tokens on screen',
		blurb: 'Which layers carry a question from the page to the model and back?',
		stage: { w: 360, h: 360 },
		nodes: [
			...stack('s', [
				{ l: 'The Assistant page', s: 'JavaScript in the WebView' },
				{ l: 'LocalLlm plugin', s: 'Capacitor, in Java' },
				{ l: 'LlamaEngine and JNI', s: 'localllm.cpp' },
				{ l: 'llama.cpp', s: 'CPU backend variant' },
				{ l: 'Tokens stream back', s: 'a token event each' }
			], { gap: 24 }),
			note('n0', 0, 'generate(system, user)', { gap: 24 }),
			note('n1', 1, 'also list, download, load, stop', { gap: 24 }),
			note('n2', 2, 'applies the chat template', { gap: 24 }),
			note('n3', 3, '4096-token window, 2 to 4 threads', { gap: 24 }),
			{ id: 'end', kind: 'text', x: 180, y: 350, w: 328, text: 'After the model download, nothing leaves the phone.', size: 'sm', anchor: 'middle' }
		],
		steps: [
			{ say: 'A learner asks a question. The page calls LocalLlm.generate with a system prompt and a user prompt.', show: ['n0'], focus: ['s0'] },
			{ say: 'The Capacitor plugin is written in Java. It also lists, downloads and loads models. LlamaEngine is its thin wrapper over the native code.', show: ['s1', 'se0', 'n1'], focus: ['s1'] },
			{ say: 'JNI crosses into C++. localllm.cpp formats the prompt with the model\'s own chat template, with thinking switched off.', show: ['s2', 'se1', 'n2'], focus: ['s2'] },
			{ say: 'llama.cpp runs on the CPU with the best backend variant for this phone, 2 to 4 threads and a 4096-token context window.', show: ['s3', 'se2', 'n3'], focus: ['s3'] },
			{ say: 'Each new token goes back up as a token event, so the answer appears word by word instead of all at once.', show: ['s4', 'se3'], set: { s4: { tone: 'accent' } }, pulse: ['s4'] },
			{ say: 'No server is involved. Once the model file is on the phone, the whole path runs on the phone.', show: ['end'], focus: ['s0', 's1', 's2', 's3', 's4'] }
		]
	},
	{
		id: 'bt-llm-prompt',
		topic: 'built',
		group: 'bt-local-llm',
		title: 'Three ways to format a prompt',
		blurb: 'What happens when a model\'s chat template does not work?',
		stage: { w: 360, h: 340 },
		nodes: [
			{ id: 'q', kind: 'box', x: 16, y: 14, w: 328, h: 40, label: 'System prompt + user prompt', visible: true },
			{ id: 'j', kind: 'box', x: 16, y: 84, w: 328, h: 52, label: '1. The model\'s own template', sub: 'jinja, thinking off', tone: 'accent' },
			{ id: 'l', kind: 'box', x: 16, y: 166, w: 328, h: 52, label: '2. The legacy formatter', sub: 'one system message, then one user message' },
			{ id: 'p', kind: 'box', x: 16, y: 248, w: 328, h: 52, label: '3. A plain prompt', sub: 'system text, a blank line, user text' },
			{ id: 'e0', kind: 'edge', from: 'q', to: 'j' },
			{ id: 'e1', kind: 'edge', from: 'j', to: 'l', dashed: true },
			{ id: 'e2', kind: 'edge', from: 'l', to: 'p', dashed: true },
			{ id: 'end', kind: 'text', x: 180, y: 326, w: 328, text: 'A failure costs quality, never a crash.', size: 'sm', anchor: 'middle' }
		],
		steps: [
			{ say: 'The native bridge receives two plain strings: a system prompt and a user prompt.', focus: ['q'] },
			{ say: 'First choice: the model\'s own chat template, with thinking switched off so replies begin at once.', show: ['j', 'e0'], focus: ['j'] },
			{ say: 'Tokenizing adds the start-of-text token by itself, so the template is asked to leave its own out: no duplicate.', set: { j: { sub: 'jinja, thinking off, no duplicate BOS' } }, focus: ['j'] },
			{ say: 'If the template throws, the error is caught and noted. The legacy formatter is tried next.', show: ['l', 'e1'], set: { j: { tone: 'warn' } }, focus: ['l'] },
			{ say: 'If that throws as well, a plain prompt is used. An unusual template can never crash the app.', show: ['p', 'e2'], set: { l: { tone: 'warn' } }, focus: ['p'] },
			{ say: 'Whichever path produced the text, the model gets a prompt and replies. A bad template only makes answers worse.', show: ['end'], set: { j: { tone: 'accent' }, l: { tone: 'neutral' } } }
		]
	},

	// ───────────── bt-assistant ─────────────
	{
		id: 'bt-grounding-flow',
		topic: 'built',
		group: 'bt-assistant',
		title: 'How the Assistant answers',
		blurb: 'What happens between a question and an answer with sources?',
		stage: { w: 360, h: 372 },
		nodes: [
			...stack('g', [
				{ l: 'Your question' },
				{ l: 'Search Preppy\'s notes', s: 'offline, always' },
				{ l: 'Web lookup', s: 'optional' },
				{ l: 'Build the prompt', s: 'notes, web, screen, chat' },
				{ l: 'The model', s: 'phone, Gemini, Claude, Ollama' },
				{ l: 'Answer plus Sources' }
			], { h: 38, gap: 22 }),
			note('gn1', 1, 'BM25, about 30 ms to build', { h: 38, gap: 22 }),
			note('gn2', 2, 'off by default; needs a provider and a connection', { h: 38, gap: 22 }),
			note('gn3', 3, 'about 9000 characters', { h: 38, gap: 22 }),
			note('gn4', 4, 'all through runModel', { h: 38, gap: 22 })
		],
		steps: [
			{ say: 'A learner asks the Assistant a question. It also knows what is on screen, such as the quiz question being read.', focus: ['g0'] },
			{ say: 'Preppy\'s own notes and quiz explanations are searched first, on the phone, with no internet.', show: ['g1', 'ge0', 'gn1'], focus: ['g1'] },
			{ say: 'Web lookup is off by default. When switched on and online, it runs if the notes found nothing or the question is about something new.', show: ['g2', 'ge1', 'gn2'], focus: ['g2'] },
			{ say: 'The prompt builder packs the notes, web text, the screen and recent chat into about 9000 characters.', show: ['g3', 'ge2', 'gn3'], focus: ['g3'] },
			{ say: 'The model gets the prompt. The phone model, Gemini, Claude and an Ollama server all go through the same runModel function.', show: ['g4', 'ge3', 'gn4'], focus: ['g4'] },
			{ say: 'The reply ends with a Sources list: the Preppy topics used and any web pages, as links.', show: ['g5', 'ge4'], set: { g5: { tone: 'accent' } }, pulse: ['g5'] }
		]
	},
	{
		id: 'bt-knowledge-index',
		topic: 'built',
		group: 'bt-assistant',
		title: 'Searching the notes on the phone',
		blurb: 'How does a question find the right passage of Preppy?',
		stage: { w: 360, h: 372 },
		nodes: [
			...stack('k', [
				{ l: 'The question', s: 'What is MCP?' },
				{ l: 'Keep the meaning words', s: 'what and is are dropped; mcp stays' },
				{ l: 'Is there a distinctive word?', s: 'mcp is in under 6% of chunks' },
				{ l: 'Score every chunk', s: 'rare words count more than common ones' },
				{ l: 'Put the opening chunk first', s: 'the definition leads' },
				{ l: 'Passages go into the prompt', s: 'up to 3, about 1,700 characters' }
			], { w: 328, h: 38, gap: 22 })
		],
		steps: [
			{ say: 'Every topic\'s notes, split into chunks of up to about 650 characters, and every quiz explanation are in one index.', focus: ['k0'] },
			{ say: 'Filler words such as what and is are dropped and plurals are trimmed, so tokens matches token.', show: ['k1', 'ke0'], focus: ['k1'] },
			{ say: 'MCP appears in under about 6% of chunks, so the search goes on. A question like give me a hint has no such word and finds nothing.', show: ['k2', 'ke1'], focus: ['k2'] },
			{ say: 'Each chunk is scored with BM25. A chunk that holds most of the question\'s rare words beats one that repeats a single word.', show: ['k3', 'ke2'], focus: ['k3'] },
			{ say: 'If the best chunk is later in a topic, that topic\'s opening chunk is moved to the front, so the definition comes first.', show: ['k4', 'ke3'], focus: ['k4'] },
			{ say: 'Up to three passages, at most two from one topic, go into the prompt. Their topic names become the Sources list.', show: ['k5', 'ke4'], set: { k5: { tone: 'accent' } }, pulse: ['k5'] }
		]
	},
	{
		id: 'bt-grounding-results',
		topic: 'built',
		group: 'bt-assistant',
		title: 'Same question, with and without notes',
		blurb: 'Did giving a model Preppy\'s notes fix the MCP answer?',
		nodes: [
			{ id: 'tbl', kind: 'table', x: 16, y: 20, title: 'What is MCP?  (tried on a Mac)', cols: ['Model', 'No notes', 'With notes'], rows: [['Qwen2.5 0.5B', 'invented', 'correct'], ['Qwen3.5 0.8B', 'invented', 'right, messy'], ['Qwen3.5 4B', 'knew MCP', 'precise'], ['Gemma 4 E2B', 'ambiguous', 'correct']], colW: 108, visible: true },
			{ id: 'why', kind: 'text', x: 180, y: 190, w: 328, text: 'Notes fix missing knowledge. They do not fix a small model\'s formatting.', size: 'sm', anchor: 'middle' }
		],
		steps: [
			{ say: 'The same question, What is MCP?, was tried on four models, once alone and once with Preppy\'s notes in the prompt.', focus: ['tbl'] },
			{ say: 'Qwen2.5 0.5B, a 2024 model, invented Maximum Common Port on its own and was correct once it had the notes.', set: { tbl: { hl: [0] } } },
			{ say: 'Qwen3.5 0.8B also invented an answer alone. With the notes the facts were right, but the formatting came out garbled.', set: { tbl: { hl: [1] } } },
			{ say: 'Qwen3.5 4B already knew MCP. With the notes its answer was precise.', set: { tbl: { hl: [2] } } },
			{ say: 'Gemma 4 E2B said the term was ambiguous alone, and was correct with the notes.', set: { tbl: { hl: [3] } } },
			{ say: 'The lesson: when a model lacks a fact, give it the passage. A small model\'s untidy output still needs its own care.', set: { tbl: { hl: [] } }, show: ['why'] }
		]
	},

	// ───────────── bt-narration ─────────────
	{
		id: 'bt-tts-buffer',
		topic: 'built',
		group: 'bt-narration',
		title: 'Why narration waits before it starts',
		blurb: 'How does Preppy stop a slow voice from stuttering?',
		stage: { w: 360, h: 290 },
		nodes: [
			{ id: 'eng', kind: 'box', x: 16, y: 14, w: 150, h: 44, label: 'Voice engine', sub: 'makes audio on the CPU', visible: true },
			{ id: 'spk', kind: 'box', x: 194, y: 14, w: 150, h: 44, label: 'Speaker', sub: 'plays it, 1 s per second', visible: true },
			{ id: 'ee', kind: 'edge', from: 'eng', to: 'spk', visible: true },
			{ id: 't1', kind: 'text', x: 16, y: 92, w: 328, text: 'rtf 0.5: 1 s of speech costs 0.5 s of CPU', size: 'sm' },
			{ id: 't2', kind: 'text', x: 16, y: 120, w: 328, text: 'rtf 1.3: 1 s of speech costs 1.3 s of CPU', size: 'sm' },
			{ id: 't3', kind: 'text', x: 16, y: 148, w: 328, text: 'So: keep 6 to 20 s of audio ready before starting', size: 'sm' },
			{ id: 't4', kind: 'text', x: 16, y: 176, w: 328, text: 'Run dry anyway: wait once, at most 25 s', size: 'sm' },
			{ id: 'c0', kind: 'box', x: 16, y: 206, w: 100, h: 44, label: 'Smooth', sub: 'rtf up to 0.7' },
			{ id: 'c1', kind: 'box', x: 130, y: 206, w: 100, h: 44, label: 'May pause', sub: 'up to 1.0' },
			{ id: 'c2', kind: 'box', x: 244, y: 206, w: 100, h: 44, label: 'Too slow', sub: 'above 1.0' }
		],
		steps: [
			{ say: 'A voice has a real-time factor, rtf: the seconds of CPU it needs for each second of speech. The speaker uses audio at one second per second.', focus: ['eng', 'spk'] },
			{ say: 'At 0.5 the engine makes a sentence in half the time it takes to say, so it stays ahead of the speaker.', show: ['t1'], set: { eng: { tone: 'accent' } }, focus: ['t1'] },
			{ say: 'At 1.3 each sentence takes longer to make than to say, so playback falls further behind and stutters at every sentence.', show: ['t2'], set: { eng: { tone: 'warn' } }, focus: ['t2'] },
			{ say: 'So the scheduler measures rtf as it goes, and waits to start until 6 to 20 seconds of audio are ready.', show: ['t3'], focus: ['t3'] },
			{ say: 'If playback still runs dry, it waits once and re-buffers, never longer than 25 seconds, instead of stuttering sentence by sentence.', show: ['t4'], focus: ['t4'] },
			{ say: 'A measured rtf also gives each voice a label: smooth up to 0.7, may pause up to 1.0, too slow above that.', show: ['c0', 'c1', 'c2'], set: { c0: { tone: 'accent' }, c1: { tone: 'warn' }, c2: { tone: 'neg' } } }
		]
	},
	{
		id: 'bt-tts-cache',
		topic: 'built',
		group: 'bt-narration',
		title: 'A sentence is only synthesized once',
		blurb: 'How does the narration cache decide what to keep?',
		stage: { w: 360, h: 390 },
		nodes: [
			{ id: 's', kind: 'box', x: 16, y: 14, w: 328, h: 40, label: 'A sentence to speak', visible: true },
			{ id: 'k', kind: 'box', x: 16, y: 84, w: 328, h: 40, label: 'SHA-256 of voice, speaker, speed, text' },
			{ id: 'd', kind: 'box', x: 16, y: 154, w: 328, h: 40, label: 'Is a file with that key in the cache?' },
			{ id: 'h', kind: 'box', x: 16, y: 224, w: 156, h: 52, label: 'Hit: read the file', sub: 'about 30 ms' },
			{ id: 'm', kind: 'box', x: 188, y: 224, w: 156, h: 52, label: 'Miss: synthesize', sub: 'Natural: 913 ms' },
			{ id: 'v', kind: 'box', x: 188, y: 306, w: 156, h: 52, label: 'Save the audio', sub: 'temp file, then rename' },
			{ id: 'ev', kind: 'text', x: 16, y: 380, w: 328, text: 'Over the limit: oldest-used files go first', size: 'sm' },
			{ id: 'e0', kind: 'edge', from: 's', to: 'k' },
			{ id: 'e1', kind: 'edge', from: 'k', to: 'd' },
			{ id: 'e2', kind: 'edge', from: 'd', to: 'h' },
			{ id: 'e3', kind: 'edge', from: 'd', to: 'm' },
			{ id: 'e4', kind: 'edge', from: 'm', to: 'v' }
		],
		steps: [
			{ say: 'Before synthesizing a sentence, the app checks whether it already has the audio.', focus: ['s'] },
			{ say: 'The key is the SHA-256 of the voice, the speaker, the speed and the exact text. Change any one and it is a different entry.', show: ['k', 'e0'], focus: ['k'] },
			{ say: 'The cache is a folder of WAV files named by that key. One lookup says whether this sentence was ever made.', show: ['d', 'e1'], focus: ['d'] },
			{ say: 'A hit reads the file from disk: about 30 ms for the Natural voice, with no synthesis at all.', show: ['h', 'e2'], set: { h: { tone: 'accent' } }, pulse: ['h'] },
			{ say: 'A miss runs the voice. The same sentence took 913 ms with Natural on the test phone.', show: ['m', 'e3'], set: { m: { tone: 'warn' } }, pulse: ['m'] },
			{ say: 'The result goes to a temporary file and is then renamed, so a half-written file is never read. A corrupt file counts as a miss.', show: ['v', 'e4'], focus: ['v'] },
			{ say: 'The folder is capped at 100, 200 (the default) or 500 MB. When it is full, the least recently used files are deleted first.', show: ['ev'], focus: ['ev'] }
		]
	},
	{
		id: 'bt-tts-tune',
		topic: 'built',
		group: 'bt-narration',
		title: 'Finding the fastest thread count',
		blurb: 'Why measure threads instead of using as many as possible?',
		stage: { w: 360, h: 320 },
		nodes: [
			...stack('t', [
				{ l: 'Candidates', s: '1, 2, 3, 4, performance cores' },
				{ l: 'Load the voice', s: 'with that many threads' },
				{ l: 'One warm-up run', s: 'timed, then thrown away' },
				{ l: 'Two timed runs', s: 'speed = the mean' },
				{ l: 'Keep the fastest', s: 'saved for this voice' }
			], { h: 40, gap: 20 }),
			{ id: 'tbl', kind: 'table', x: 232, y: 90, title: 'Example result', cols: ['threads', 'rtf'], rows: [['2', '0.92x'], ['3', '0.71x'], ['4', '0.85x']], colW: 56 }
		],
		steps: [
			{ say: 'More threads is not always faster. Phones mix fast and slow cores, and a thread on a slow core can hold up all the others.', focus: ['t0'] },
			{ say: 'For each candidate count, the voice is loaded with that many threads. The list never goes above 6 or above the phone\'s cores.', show: ['t1', 'te0'], focus: ['t1'] },
			{ say: 'One synthesis is a warm-up and is discarded, because the first run after a load is slower than the rest.', show: ['t2', 'te1'], focus: ['t2'] },
			{ say: 'Then two timed runs of real synthesis, never from the cache. The count\'s speed is the mean of the two.', show: ['t3', 'te2'], focus: ['t3'] },
			{ say: 'An example from the release notes: 2 threads 0.92x, 3 threads 0.71x, 4 threads 0.85x. Lower is faster.', show: ['tbl'], focus: ['tbl'] },
			{ say: 'The fastest wins and is saved for that voice: here, 3 threads. Cancelling keeps the old setting.', show: ['t4', 'te3'], set: { tbl: { hl: [1] }, t4: { tone: 'accent' } }, pulse: ['t4'] }
		]
	},

	// ───────────── bt-quality ─────────────
	{
		id: 'bt-verify-loop',
		topic: 'built',
		group: 'bt-quality',
		title: 'The checks behind a release',
		blurb: 'Which check catches which kind of mistake?',
		stage: { w: 360, h: 362 },
		nodes: [
			...stack('v', [
				{ l: 'bun run check', s: 'types across the code' },
				{ l: 'bun run content', s: 'lesson and quiz rules' },
				{ l: 'verify-snippets', s: 'every Try it runs' },
				{ l: 'bun run verify', s: 'exercises and drills' },
				{ l: 'Assistant and voice scripts', s: 'lookup, requests, timing' },
				{ l: 'Eyes and a real APK', s: 'Gallery, then an emulator' }
			], { w: 328, h: 36, gap: 22 })
		],
		steps: [
			{ say: 'Types first: svelte-check reads all the Svelte and TypeScript code for mistakes a compiler can see.', focus: ['v0'] },
			{ say: 'The content validator checks shapes and rules: nodes inside the stage, four distinct quiz options, explanations of 80 characters or more.', show: ['v1', 've0'], focus: ['v1'] },
			{ say: 'Every Try-it snippet runs against the real playground engines, so no example in a topic is broken.', show: ['v2', 've1'], focus: ['v2'] },
			{ say: 'Every Backend lab reference solution and every drill solution must pass. An untouched drill starter must fail.', show: ['v3', 've2'], focus: ['v3'] },
			{ say: 'The Assistant scripts check the notes lookup and web requests (Tavily and Serper mocked). The voice script simulates narration on a virtual clock.', show: ['v4', 've3'], focus: ['v4'] },
			{ say: 'Last, eyes: lessons in the Gallery, then the real APK on an emulator. Scripts cannot judge whether a lesson makes sense.', show: ['v5', 've4'], set: { v5: { tone: 'accent' } }, pulse: ['v5'] }
		]
	},
	{
		id: 'bt-emulator-loop',
		topic: 'built',
		group: 'bt-quality',
		title: 'Testing the real APK, and its gaps',
		blurb: 'How was the packaged app checked, and what was never measured?',
		stage: { w: 360, h: 340 },
		nodes: [
			...stack('m', [
				{ l: 'The built APK', s: 'Gradle assembleDebug' },
				{ l: 'An Android emulator', s: 'adb install, then am start' },
				{ l: 'The WebView\'s DevTools socket', s: 'adb forward to the Mac' },
				{ l: 'A small script', s: 'runs JavaScript in the app' },
				{ l: 'What it showed', s: 'real screens, real replies' }
			], { w: 328, h: 40, gap: 22 }),
			{ id: 'gaps', kind: 'doc', x: 16, y: 40, w: 328, title: 'Not measured', lines: ['Speed on a real 12 GB phone', 'Tavily or Serper with a real key', 'Qwen3.5 9B and the Gemma 4 E4B files', 'Llama 3.2 on the newer template'] }
		],
		steps: [
			{ say: 'The same debug APK that would go to a phone is built with Gradle.', focus: ['m0'] },
			{ say: 'It is installed on an emulator and started with am start. This is the real app, not a browser tab.', show: ['m1', 'me0'], focus: ['m1'] },
			{ say: 'The app\'s WebView exposes a DevTools socket, and adb forward makes it reachable from the Mac.', show: ['m2', 'me1'], focus: ['m2'] },
			{ say: 'A small script sends JavaScript to the page: open a section, press a button, read what the screen shows.', show: ['m3', 'me2'], focus: ['m3'] },
			{ say: 'That showed the real Assistant answering through the native model, the Web lookup test, and the new topics in the lists.', show: ['m4', 'me3'], set: { m4: { tone: 'accent' } } },
			{ say: 'And, said plainly, what this did not cover: phone speed, a real Tavily or Serper key, and the larger model files.', hide: ['m0', 'm1', 'm2', 'm3', 'm4', 'me0', 'me1', 'me2', 'me3'], show: ['gaps'], set: { gaps: { tone: 'warn' } } }
		]
	},

	// ───────────── bt-release ─────────────
	{
		id: 'bt-release-pipeline',
		topic: 'built',
		group: 'bt-release',
		title: 'From code to a GitHub release',
		blurb: 'What are the steps of a Preppy release?',
		stage: { w: 360, h: 362 },
		nodes: [
			...stack('r', [
				{ l: 'Bump the versions', s: 'package.json, build.gradle' },
				{ l: 'Write the CHANGELOG entry', s: 'top of the file' },
				{ l: 'Build and sync the web app', s: 'bun run build, cap sync android' },
				{ l: 'Build the APK', s: './gradlew assembleDebug' },
				{ l: 'Commit and push' },
				{ l: 'Create the GitHub release', s: 'APK attached' }
			], { h: 36, gap: 22 }),
			note('rn1', 1, 'feeds the What\'s new popup too', { h: 36, gap: 22 }),
			note('rn3', 3, 'same signing key every time, about 45 MB', { h: 36, gap: 22 }),
			note('rn4', 4, 'README links updated', { h: 36, gap: 22 }),
			note('rn5', 5, 'notes = the CHANGELOG entry', { h: 36, gap: 22 })
		],
		steps: [
			{ say: 'A release starts by bumping version in package.json and versionName and versionCode in android/app/build.gradle.', focus: ['r0'] },
			{ say: 'Add an entry at the top of CHANGELOG.md. The same text becomes the in-app What\'s new popup and the release notes.', show: ['r1', 're0', 'rn1'], focus: ['r1'] },
			{ say: 'bun run build bundles the web app, and cap sync android copies it into the Android project.', show: ['r2', 're1'], focus: ['r2'] },
			{ say: 'Gradle builds the APK and signs it with the debug key. The key is the same every time, so it installs over the last version.', show: ['r3', 're2', 'rn3'], focus: ['r3'] },
			{ say: 'Commit and push. The README download links are updated to the new version number.', show: ['r4', 're3', 'rn4'], focus: ['r4'] },
			{ say: 'A GitHub release is created with the APK attached and the CHANGELOG entry as its notes.', show: ['r5', 're4', 'rn5'], set: { r5: { tone: 'accent' } }, pulse: ['r5'] }
		]
	},
	{
		id: 'bt-update-keeps-progress',
		topic: 'built',
		group: 'bt-release',
		title: 'Why an update keeps your progress',
		blurb: 'What decides whether a new APK installs over the old one?',
		stage: { w: 360, h: 376 },
		nodes: [
			{ id: 'inst', kind: 'box', x: 16, y: 14, w: 328, h: 44, label: 'Installed: Preppy 2.4.0', sub: 'signed with key A, progress in localStorage', visible: true },
			{ id: 'nw', kind: 'box', x: 16, y: 88, w: 328, h: 44, label: 'New APK: 2.4.1', sub: 'signed with key A' },
			{ id: 'res', kind: 'box', x: 16, y: 162, w: 328, h: 44, label: 'Updated in place', sub: 'same package id, same key' },
			{ id: 'un', kind: 'box', x: 16, y: 236, w: 328, h: 44, label: 'Uninstall, then install?', sub: 'erases the saved progress' },
			{ id: 'ex', kind: 'box', x: 16, y: 310, w: 328, h: 44, label: 'Settings, Your data', sub: 'exports Backend lab progress only' },
			{ id: 'e0', kind: 'edge', from: 'nw', to: 'inst' },
			{ id: 'e1', kind: 'edge', from: 'nw', to: 'res' },
			{ id: 'e2', kind: 'edge', from: 'res', to: 'un', dashed: true },
			{ id: 'e3', kind: 'edge', from: 'un', to: 'ex', dashed: true }
		],
		steps: [
			{ say: 'Preppy 2.4.0 is installed. Its progress sits in the WebView\'s localStorage, inside the app\'s private storage.', focus: ['inst'] },
			{ say: 'A new APK arrives, built for the same package id and signed with the same key A. Android compares the two.', show: ['nw', 'e0'], focus: ['nw'] },
			{ say: 'Same id and same key: Android installs it over the old app, and the private storage stays. Progress is kept.', show: ['res', 'e1'], set: { res: { tone: 'accent' } }, pulse: ['res'] },
			{ say: 'Now an APK built on another computer with a different debug key B. The package id still matches, but the signature does not.', set: { nw: { sub: 'signed with key B', tone: 'warn' }, res: { label: 'Update refused', sub: 'INSTALL_FAILED_UPDATE_INCOMPATIBLE', tone: 'neg' } }, focus: ['nw', 'res'] },
			{ say: 'The only way past it is to uninstall first, and that erases localStorage, which is where progress lives.', show: ['un', 'e2'], set: { un: { tone: 'neg' } }, focus: ['un'] },
			{ say: 'Settings, Your data can export the Backend lab progress as a file first. Quiz progress is not part of that file.', show: ['ex', 'e3'], focus: ['ex'] },
			{ say: 'That is why every release uses the same key, why the keystore is copied between computers, and why the package id never changed.', set: { ex: { tone: 'accent' }, nw: { sub: 'signed with key A', tone: 'neutral' } } }
		]
	},

	// ───────────── bt-tradeoffs ─────────────
	{
		id: 'bt-decision-log',
		topic: 'built',
		group: 'bt-tradeoffs',
		title: 'The decision log',
		blurb: 'What was chosen, what was given up, and at what cost?',
		nodes: [
			{ id: 'tbl', kind: 'table', x: 16, y: 20, title: 'Decision log', cols: ['Chosen', 'Instead of', 'Costs'], rows: [['Capacitor app', 'Native Kotlin', 'WebView speed'], ['No backend', 'A server', 'No sync'], ['CPU llama.cpp', 'A GPU backend', 'No GPU boost'], ['4-bit default', '8-bit default', 'Less precise'], ['Thinking off', 'Reasoning on', 'Less deliberate'], ['GitHub APK', 'Play Store', 'Install by hand']], colW: 108, visible: true },
			{ id: 'end', kind: 'text', x: 180, y: 250, w: 328, text: 'Each line names what was given up.', size: 'sm', anchor: 'middle' }
		],
		steps: [
			{ say: 'Every choice closed off another. This is the log, one line each, with the cost stated.', focus: ['tbl'] },
			{ say: 'The prep projects were already web code, and Pyodide, PGlite and the editors run in a WebView. The cost is WebView speed.', set: { tbl: { hl: [0] } } },
			{ say: 'No backend means no accounts and nothing to run, but progress stays on one phone, in localStorage.', set: { tbl: { hl: [1] } } },
			{ say: 'Only CPU code is built, so there is no GPU speed-up. In return one APK runs on any arm64 phone.', set: { tbl: { hl: [2] } } },
			{ say: 'The default file is 4-bit: small and quick, a little less precise than the 8-bit file that is also offered.', set: { tbl: { hl: [3] } } },
			{ say: 'Thinking is off so a reply starts straight away on a phone CPU. The model deliberates less before it answers.', set: { tbl: { hl: [4] } } },
			{ say: 'Releases are an APK on GitHub: a few commands and no store review. Learners install by hand and may see a Play Protect warning.', set: { tbl: { hl: [5] } } },
			{ say: 'Writing the cost beside each choice is what lets you change your mind later with open eyes.', set: { tbl: { hl: [] } }, show: ['end'] }
		]
	},
	{
		id: 'bt-limits-map',
		topic: 'built',
		group: 'bt-tradeoffs',
		title: 'Three kinds of limit',
		blurb: 'Which limits are chosen, which are gaps, and which are next?',
		stage: { w: 360, h: 300 },
		nodes: [
			{ id: 'b0', kind: 'box', x: 16, y: 14, w: 328, h: 56, label: 'By design', sub: 'Offline, no accounts, no sync across devices, progress in localStorage' },
			{ id: 'b1', kind: 'box', x: 16, y: 98, w: 328, h: 56, label: 'Known gaps', sub: 'The Backend tutor has no notes lookup, and small models still make mistakes' },
			{ id: 'b2', kind: 'box', x: 16, y: 182, w: 328, h: 56, label: 'Not yet done', sub: 'Speed on a real phone, Tavily or Serper with a real key' },
			{ id: 'e0', kind: 'edge', from: 'b0', to: 'b1' },
			{ id: 'e1', kind: 'edge', from: 'b1', to: 'b2' },
			{ id: 'end', kind: 'text', x: 180, y: 276, w: 328, text: 'Knowing which kind a limit is tells you what to do.', size: 'sm', anchor: 'middle' }
		],
		steps: [
			{ say: 'Limits come in three kinds, and it helps to know which is which.', show: ['b0'], focus: ['b0'] },
			{ say: 'Some are chosen: no accounts, no server and no sync. Learners get privacy and zero running cost, and give up moving between devices.', show: ['b1', 'e0'], focus: ['b0'] },
			{ say: 'Some are gaps. The README notes that the Backend lab tutor keeps its own prompts. Small models can still misread a passage.', set: { b1: { tone: 'warn' } }, focus: ['b1'] },
			{ say: 'And some are simply not done yet: nobody has timed the model on a real phone, or tried Tavily or Serper with a real key.', show: ['b2', 'e1'], set: { b2: { tone: 'neg' } }, focus: ['b2'] },
			{ say: 'A chosen limit is a trade. A gap is work. A not-yet is a question to answer with a measurement.', show: ['end'], set: { b0: { tone: 'accent' } } }
		]
	}
];
