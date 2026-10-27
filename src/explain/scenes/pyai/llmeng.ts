import type { Scene, SceneNode } from '../../types';

type Extra = { visible?: boolean; tone?: 'neutral' | 'accent' | 'warn' | 'neg' };

const box = (id: string, x: number, y: number, w: number, h: number, label: string, sub?: string, o: Extra = {}): SceneNode => ({ id, kind: 'box', x, y, w, h, label, sub, ...o });
const edge = (id: string, from: string | { x: number; y: number }, to: string | { x: number; y: number }, label?: string, o: Extra & { dashed?: boolean } = {}): SceneNode => ({ id, kind: 'edge', from, to, label, ...o });
const txt = (id: string, x: number, y: number, text: string, o: Extra & { w?: number; size?: 'sm' | 'md' | 'lg'; anchor?: 'start' | 'middle' | 'end' } = {}): SceneNode => ({ id, kind: 'text', x, y, text, ...o });
const doc = (id: string, x: number, y: number, w: number, title: string, lines: string[], o: Extra & { hl?: number[] } = {}): SceneNode => ({ id, kind: 'doc', x, y, w, title, lines, ...o });

/** Memory bars for the quantization scene: 20 units per GB. */
const GB = 20;

/** Weekly accuracy bars for the drift scene: 2 units per percent, baseline y = 250. */
const ACC = [92, 91, 92, 90, 86, 80, 91];
const accBar = (i: number): SceneNode => ({ id: `w${i + 1}`, kind: 'box', x: 16 + i * 46, y: 250 - 2 * ACC[i], w: 36, h: 2 * ACC[i], label: '' });
const accLabel = (i: number): SceneNode => ({ id: `l${i + 1}`, kind: 'text', x: 34 + i * 46, y: 266, text: String(ACC[i]), anchor: 'middle', size: 'sm' });

/** Python for AI engineering: LLM engineering and production lessons. */
export const paLlm: Scene[] = [
	// ───────── pa-llm-apis ─────────
	{
		id: 'pa-tool-call-loop',
		topic: 'pyai',
		group: 'pa-llm-apis',
		title: 'The tool-call loop',
		blurb: 'How does a model use a function that only your code can run?',
		nodes: [
			box('app', 10, 14, 130, 50, 'Your code', 'Python loop', { visible: true }),
			box('llm', 220, 14, 130, 50, 'Model', 'LLM API', { visible: true }),
			edge('e1', 'app', 'llm', 'request'),
			edge('e2', 'llm', 'app', 'reply'),
			doc('msgs', 10, 90, 340, 'messages list', ['user: Weather in Pune?'], { visible: true }),
			box('tool', 10, 214, 130, 46, 'Tool', 'get_weather(city)'),
			edge('e3', 'app', 'tool', 'run'),
			edge('e4', 'tool', 'app', 'result'),
			txt('code', 10, 286, 'while reply has tool calls: run them, append, call again', { size: 'sm', w: 340 })
		],
		steps: [
			{ say: 'Your code sends the user message plus a list of tools the model may ask for. The model only reads text and returns text: it cannot run anything itself.', focus: ['app', 'msgs'] },
			{ say: 'The request goes to the model API. Each tool is described by a name and a JSON schema of its arguments, so the model knows how to ask for it.', show: ['e1'], pulse: ['llm'] },
			{
				say: 'The model decides it needs live data. Instead of a final answer it replies with a tool call: a function name and arguments.',
				show: ['e2'],
				set: { msgs: { lines: ['user: Weather in Pune?', 'assistant: tool_call get_weather(city="Pune")'] }, llm: { tone: 'warn' } },
				pulse: ['msgs']
			},
			{ say: 'Your code runs the function. The model never executes anything, so you decide what is allowed, check the arguments, and handle errors.', show: ['tool', 'e3'], pulse: ['tool'] },
			{
				say: 'The tool returns a result. Your code appends it to the messages list as a tool message.',
				show: ['e4'],
				set: { msgs: { lines: ['user: Weather in Pune?', 'assistant: tool_call get_weather(city="Pune")', 'tool: {"temp_c": 31}'] } },
				pulse: ['msgs']
			},
			{ say: 'The whole list, including the tool result, goes back to the model. The model has no memory between calls, so you always resend the history.', set: { e1: { label: 'history' }, llm: { tone: 'neutral' } }, pulse: ['e1'] },
			{
				say: 'This time the model has what it needs and answers in plain text. A reply with no tool calls is the signal to stop looping.',
				set: { msgs: { lines: ['user: Weather in Pune?', 'assistant: tool_call get_weather(city="Pune")', 'tool: {"temp_c": 31}', 'assistant: It is 31 C in Pune.'] }, llm: { tone: 'accent' } },
				pulse: ['msgs']
			},
			{ say: 'In code this is a small while loop. Add a maximum number of rounds so a confused model cannot loop forever and burn tokens.', show: ['code'], focus: ['code'] }
		]
	},
	{
		id: 'pa-streaming',
		topic: 'pyai',
		group: 'pa-llm-apis',
		title: 'Streaming tokens',
		blurb: 'Why does streaming make a slow model feel fast?',
		nodes: [
			box('llm', 10, 24, 130, 50, 'Model', 'generates tokens', { visible: true }),
			box('app', 220, 24, 130, 50, 'Your app', 'HTTP client', { visible: true }),
			edge('st', 'llm', 'app', 'chunks'),
			doc('scr', 10, 104, 340, 'What the user sees', ['(blank, waiting...)'], { visible: true, tone: 'warn' }),
			doc('code', 10, 192, 340, 'Python', ['for chunk in stream:', '    print(chunk.text, end="", flush=True)']),
			txt('end', 10, 280, 'Last event carries the stop reason and token counts.', { size: 'sm', w: 340 })
		],
		steps: [
			{ say: 'Without streaming, the server waits until the whole answer exists, then sends it. For a long answer the user stares at a blank screen for seconds.', focus: ['scr'] },
			{ say: 'Set stream to true in the request. The HTTP connection stays open and the server pushes small pieces (events) as soon as they are generated.', show: ['st'], pulse: ['st'] },
			{ say: 'First chunk lands almost immediately. The time until this moment is called time to first token, and it drives how fast the app feels.', set: { scr: { lines: ['The'], tone: 'accent' } }, pulse: ['scr'] },
			{ say: 'More chunks arrive, each a few characters or a word. Your app appends them to the screen as they come, in order.', set: { scr: { lines: ['The capital of'] } }, pulse: ['scr'] },
			{ say: 'The answer completes. Total time is the same as before, but the user read most of it while it was still being written.', set: { scr: { lines: ['The capital of France is Paris.'] } }, pulse: ['scr'] },
			{ say: 'In Python the stream is an iterator: you loop over it and handle each chunk. In an async server use an async for loop instead.', show: ['code'], focus: ['code'] },
			{ say: 'The final event reports why generation stopped and how many tokens were used. Read it for cost tracking, and handle a dropped connection mid-stream.', show: ['end'], focus: ['end'] }
		]
	},
	{
		id: 'pa-structured-output',
		topic: 'pyai',
		group: 'pa-llm-apis',
		title: 'Structured output with retry',
		blurb: 'How do you get typed data, not free text, from a model?',
		stage: { w: 360, h: 300 },
		nodes: [
			doc('sch', 10, 10, 180, 'pydantic model', ['class Invoice(BaseModel):', '  id: str', '  total: float'], { visible: true }),
			doc('rep', 190, 10, 160, 'model reply', ['{"id": "A7",', ' "total": "12,5"}']),
			box('val', 110, 120, 140, 40, 'Validate', 'Invoice.model_validate'),
			edge('v1', 'rep', 'val'),
			box('retry', 10, 205, 120, 44, 'Retry', 'send the error back'),
			box('ok', 230, 205, 120, 44, 'Invoice object', 'typed, safe to use'),
			edge('v2', 'val', 'retry', 'fail'),
			edge('v3', 'val', 'ok', 'pass'),
			txt('note', 10, 282, 'Cap retries at 2 or 3, then fail loudly.', { size: 'sm', w: 340 })
		],
		steps: [
			{ say: 'You describe the shape you want as a pydantic model. It is both documentation for you and a validator that checks real data.', focus: ['sch'] },
			{ say: 'The model class is turned into a JSON schema and sent with the request. Many APIs can also constrain decoding so the reply must fit the schema.', pulse: ['sch'] },
			{ say: 'The reply arrives as text. Even with a schema, treat it as untrusted input: here total came back as a string with a comma.', show: ['rep', 'v1'], pulse: ['rep'] },
			{ say: 'Validation runs. pydantic raises a ValidationError saying total is not a valid number, so bad data stops here, not deep in your app.', show: ['val'], set: { val: { tone: 'neg' } }, pulse: ['val'] },
			{ say: 'On failure, send the error text back to the model and ask it to fix its answer. Models usually correct a precise error message.', show: ['retry', 'v2'], set: { retry: { tone: 'warn' } }, pulse: ['retry'] },
			{ say: 'The second reply has a real number. Validation now succeeds.', set: { rep: { lines: ['{"id": "A7",', ' "total": 12.5}'] }, val: { tone: 'accent' } }, pulse: ['rep'] },
			{ say: 'You get an Invoice object with the right types. The rest of your code never sees raw model text.', show: ['ok', 'v3'], set: { ok: { tone: 'accent' } }, pulse: ['ok'] },
			{ say: 'Limit the number of retries. If validation still fails, raise an error or use a fallback, because each retry costs tokens and time.', show: ['note'], focus: ['note'] }
		]
	},

	// ───────── pa-embeddings-rag ─────────
	{
		id: 'pa-embed-search',
		topic: 'pyai',
		group: 'pa-embeddings-rag',
		title: 'From text to nearest neighbours',
		blurb: 'How does search find meaning, not just matching words?',
		stage: { w: 360, h: 310 },
		nodes: [
			box('q', 10, 10, 150, 44, 'Query', '"refund policy"', { visible: true }),
			box('m', 200, 10, 150, 40, 'Embedding model', 'text to numbers'),
			edge('e1', 'q', 'm'),
			doc('vec', 10, 74, 340, 'query vector', ['[0.12, -0.40, 0.88, ...]  (e.g. 384 numbers)']),
			{
				id: 'tab', kind: 'table', x: 10, y: 150, colW: 170, title: 'Stored chunks (already embedded)',
				cols: ['chunk', 'cosine'],
				rows: [['Refunds within 30 days', '?'], ['Shipping takes 3-5 days', '?'], ['Reset your password', '?'], ['Return and refund rules', '?']]
			},
			txt('cap', 10, 296, 'Similar meaning gives a similar direction.', { size: 'sm', w: 340 })
		],
		steps: [
			{ say: 'A user types a query. Keyword search would need the same words, but we want to match on meaning.', show: ['q'], focus: ['q'] },
			{ say: 'An embedding model turns text into a vector: a list of numbers. Texts with similar meaning end up with vectors pointing in similar directions.', show: ['m', 'e1'], pulse: ['m'] },
			{ say: 'The query is now a vector, for example 384 numbers. The size depends on the model, and one index must use one model throughout.', show: ['vec'], pulse: ['vec'] },
			{ say: 'Your documents were embedded earlier and stored. Each stored chunk has its own vector, shown here with a score column still empty.', show: ['tab'], focus: ['tab'] },
			{
				say: 'Cosine similarity compares directions: 1 means the same direction, near 0 means unrelated. In numpy it is a dot product divided by both lengths.',
				set: { tab: { rows: [['Refunds within 30 days', '0.82'], ['Shipping takes 3-5 days', '0.31'], ['Reset your password', '0.12'], ['Return and refund rules', '0.79']] } },
				pulse: ['tab']
			},
			{
				say: 'Sort by score. The two refund chunks win even though one says "return" and not "refund". That is the point of embeddings.',
				set: { tab: { rows: [['Refunds within 30 days', '0.82'], ['Return and refund rules', '0.79'], ['Shipping takes 3-5 days', '0.31'], ['Reset your password', '0.12']], hl: [0, 1] } }
			},
			{ say: 'Keep the top k chunks as the result. A vector store does this nearest-neighbour search quickly even with millions of vectors.', show: ['cap'], set: { tab: { hl: [0, 1] } }, focus: ['tab'] }
		]
	},
	{
		id: 'pa-chunking',
		topic: 'pyai',
		group: 'pa-embeddings-rag',
		title: 'Chunking a document',
		blurb: 'How should a long document be cut up before indexing?',
		nodes: [
			box('doc', 10, 40, 340, 26, 'Document: 1400 tokens', undefined, { visible: true }),
			txt('s0', 10, 28, '0', { size: 'sm', visible: true }),
			txt('s1', 350, 28, '1400', { size: 'sm', anchor: 'end', visible: true }),
			box('c1', 10, 86, 121, 28, 'chunk 1', undefined, { tone: 'accent' }),
			box('c2', 119, 124, 121, 28, 'chunk 2', undefined, { tone: 'accent' }),
			box('c3', 229, 162, 121, 28, 'chunk 3', undefined, { tone: 'accent' }),
			txt('t5', 10, 214, 'Too big: a vague vector and wasted prompt space. Too small: each chunk loses its context.', { size: 'sm', w: 340, tone: 'warn' }),
			box('sp', 10, 210, 340, 46, 'Split on structure first', 'headings, then paragraphs, then size', { tone: 'accent' }),
			doc('rec', 10, 208, 340, 'chunk record', ['id: c2', 'source: policy.pdf  page: 3', 'section: Refunds', 'text: "Refunds are accepted..."'])
		],
		steps: [
			{ say: 'A 1400 token document is too long to embed as one vector: the vector blurs many topics together, and you cannot paste it all into a prompt.', focus: ['doc'] },
			{ say: 'Chunk size 500 tokens: chunk 1 covers tokens 0 to 500.', show: ['c1'], pulse: ['c1'] },
			{ say: 'Chunk 2 starts at token 450, not 500. This 50 token overlap keeps a sentence cut at the boundary whole in at least one chunk.', show: ['c2'], pulse: ['c2'] },
			{ say: 'Chunk 3 runs from 900 to 1400. Three overlapping chunks now cover the whole document.', show: ['c3'], pulse: ['c3'] },
			{ say: 'Size is a trade-off. Tune it by running retrieval on your own questions, not by copying a number from a tutorial.', show: ['t5'], focus: ['t5'] },
			{ say: 'Better than blind cuts: split on headings and paragraphs first and only then by size, so a chunk is a complete idea.', hide: ['t5'], show: ['sp'], focus: ['sp'] },
			{ say: 'Store each chunk with metadata: source, page, section. It lets you filter results and show citations to the user.', hide: ['sp'], show: ['rec'], focus: ['rec'] }
		]
	},
	{
		id: 'pa-rag-pipeline',
		topic: 'pyai',
		group: 'pa-embeddings-rag',
		title: 'RAG: index time and query time',
		blurb: 'What runs once ahead of time, and what runs per question?',
		stage: { w: 360, h: 320 },
		nodes: [
			txt('lab1', 10, 20, 'INDEX TIME (once, or on updates)', { size: 'sm' }),
			box('d1', 10, 30, 72, 36, 'Docs'),
			box('d2', 98, 30, 72, 36, 'Chunks'),
			box('d3', 186, 30, 72, 36, 'Embed'),
			box('d4', 274, 30, 72, 36, 'Vector DB', undefined, { tone: 'accent' }),
			edge('a1', 'd1', 'd2'),
			edge('a2', 'd2', 'd3'),
			edge('a3', 'd3', 'd4'),
			txt('lab2', 10, 112, 'QUERY TIME (every question)', { size: 'sm' }),
			box('q1', 10, 122, 72, 36, 'Question'),
			box('q2', 98, 122, 72, 36, 'Embed'),
			box('q3', 186, 122, 72, 36, 'Search'),
			box('q4', 274, 122, 72, 36, 'Top chunks'),
			edge('b1', 'q1', 'q2'),
			edge('b2', 'q2', 'q3'),
			edge('b3', 'q3', 'q4'),
			edge('lk', 'd4', 'q3', 'lookup', { dashed: true }),
			box('p1', 10, 206, 72, 36, 'Prompt'),
			box('p2', 98, 206, 72, 36, 'LLM'),
			box('p3', 186, 206, 100, 40, 'Answer', 'with sources', { tone: 'accent' }),
			edge('c1', 'q4', 'p1', 'context'),
			edge('c2', 'p1', 'p2'),
			edge('c3', 'p2', 'p3'),
			txt('code', 10, 290, 'answer = llm(prompt(q, search(embed(q))))', { size: 'sm', w: 340 })
		],
		steps: [
			{ say: 'RAG (retrieval-augmented generation) lets a model answer from your documents. Work is split in two phases, and the first one runs before any question.', show: ['lab1', 'd1'], focus: ['d1'] },
			{ say: 'Index time, step one: cut the documents into chunks of a sensible size.', show: ['d2', 'a1'], pulse: ['d2'] },
			{ say: 'Step two: embed each chunk, turning its text into a vector.', show: ['d3', 'a2'], pulse: ['d3'] },
			{ say: 'Step three: store vectors and metadata in a vector database. Re-run this only when the documents change.', show: ['d4', 'a3'], pulse: ['d4'] },
			{ say: 'Query time starts when a user asks. The question is embedded with the same model that embedded the chunks.', show: ['lab2', 'q1', 'q2', 'b1'], pulse: ['q2'] },
			{ say: 'The query vector is used to search the vector database, which returns the nearest chunks. Those are the top chunks.', show: ['q3', 'q4', 'b2', 'b3', 'lk'], pulse: ['q3'] },
			{ say: 'Build a prompt: the question plus the retrieved chunks, with an instruction to answer only from them.', show: ['p1', 'c1'], pulse: ['p1'] },
			{ say: 'The model writes an answer grounded in those chunks and can cite them. Without grounding it would guess from training data.', show: ['p2', 'p3', 'c2', 'c3'], pulse: ['p3'] },
			{ say: 'The whole query path is a few function calls. Frameworks wrap it, but plain Python is enough to start.', show: ['code'], focus: ['code'] }
		]
	},
	{
		id: 'pa-hybrid-rerank',
		topic: 'pyai',
		group: 'pa-embeddings-rag',
		title: 'Hybrid search and reranking',
		blurb: 'Why combine keyword and vector search, then rerank?',
		stage: { w: 360, h: 340 },
		nodes: [
			box('q', 80, 8, 200, 38, 'Query', '"error E1042 refund"', { visible: true }),
			box('bm', 10, 66, 150, 36, 'BM25 keywords', 'exact words'),
			box('vs', 200, 66, 150, 36, 'Vector search', 'meaning'),
			edge('e1', 'q', 'bm'),
			edge('e2', 'q', 'vs'),
			doc('bl', 10, 116, 160, 'BM25 top 3', ['1  doc 7', '2  doc 2', '3  doc 9']),
			doc('vl', 190, 116, 160, 'Vector top 3', ['1  doc 2', '2  doc 5', '3  doc 7']),
			box('mg', 90, 214, 180, 36, 'Merge (rank fusion)', 'docs in both lists rise'),
			box('rr', 90, 262, 180, 36, 'Rerank (cross-encoder)', 'reads query + doc together'),
			edge('e3', 'mg', 'rr'),
			txt('fin', 10, 322, 'Top 3 to the LLM: doc 7, doc 2, doc 5', { size: 'sm', w: 340, tone: 'accent' })
		],
		steps: [
			{ say: 'The query holds an exact code (E1042) and a loose idea (refund). Vector search alone can miss exact codes; keyword search alone can miss meaning.', focus: ['q'] },
			{ say: 'BM25 is classic keyword ranking: it scores documents by how rare and frequent the query words are in them. Great for ids, codes and names.', show: ['bm', 'e1'], pulse: ['bm'] },
			{ say: 'Vector search runs in parallel and ranks by meaning, so it finds paraphrases that share no words with the query.', show: ['vs', 'e2'], pulse: ['vs'] },
			{ say: 'Each returns its own ranked list. Doc 7 and doc 2 appear in both lists, which is a strong sign they are relevant.', show: ['bl', 'vl'], set: { bl: { hl: [0, 1] }, vl: { hl: [0, 2] } } },
			{ say: 'Rank fusion merges the lists using ranks, not raw scores, since the two scoring scales are not comparable. Docs found by both rise to the top.', show: ['mg'], pulse: ['mg'] },
			{ say: 'A reranker (a cross-encoder) reads the query and each candidate together and scores the pair. It is slower but sharper, so use it on a short list only.', show: ['rr', 'e3'], pulse: ['rr'] },
			{ say: 'Only the best few go into the prompt. This costs fewer tokens and gives the model less noise to get distracted by.', show: ['fin'], focus: ['fin'] }
		]
	},

	// ───────── pa-evals ─────────
	{
		id: 'pa-eval-loop',
		topic: 'pyai',
		group: 'pa-evals',
		title: 'The eval loop',
		blurb: 'How do you know a prompt change made things better?',
		stage: { w: 360, h: 330 },
		nodes: [
			{
				id: 'tab', kind: 'table', x: 10, y: 10, colW: 85, title: 'Golden dataset',
				cols: ['case', 'expected', 'v1', 'v2'],
				rows: [['refund days', '30 days', '', ''], ['ship to Pune', 'yes', '', ''], ['reset login', 'Settings', '', ''], ['COD offered', 'yes', '', '']],
				visible: true
			},
			box('app', 10, 170, 150, 40, 'App', 'prompt v1'),
			box('sc', 200, 170, 150, 40, 'Scorer', 'exact, rubric or judge'),
			edge('e1', 'app', 'sc', 'out'),
			txt('sum', 10, 244, 'v1: 2 of 4 pass', { size: 'md', w: 340 }),
			txt('ci', 10, 288, 'Run it in CI on every prompt or model change. Fail the build under a threshold.', { size: 'sm', w: 340 })
		],
		steps: [
			{ say: 'An eval starts with a golden dataset: real questions you care about, each with the expected answer or fact. It is the test suite of an AI app.', focus: ['tab'] },
			{
				say: 'Run the app, prompt version 1, on every case and record its raw output.',
				show: ['app'],
				set: { tab: { rows: [['refund days', '30 days', '30 days', ''], ['ship to Pune', 'yes', 'yes', ''], ['reset login', 'Settings', 'Email us', ''], ['COD offered', 'yes', 'no', '']] } },
				pulse: ['app']
			},
			{
				say: 'A scorer compares each output with the expectation. Exact match is cheap; a rubric or an LLM judge handles answers worded differently.',
				show: ['sc', 'e1'],
				set: { tab: { rows: [['refund days', '30 days', 'pass', ''], ['ship to Pune', 'yes', 'pass', ''], ['reset login', 'Settings', 'fail', ''], ['COD offered', 'yes', 'fail', '']], hl: [2, 3] } },
				pulse: ['sc']
			},
			{ say: 'Aggregate to one number you can track: v1 passes 2 of the 4 cases. Look at the failing rows, not only the total.', show: ['sum'], focus: ['sum'] },
			{
				say: 'Edit the prompt to v2 and run the same dataset again. Same cases, same scorer: the only thing that changed is your edit.',
				set: {
					app: { label: 'App', sub: 'prompt v2' },
					tab: { rows: [['refund days', '30 days', 'pass', '30 days'], ['ship to Pune', 'yes', 'pass', 'yes'], ['reset login', 'Settings', 'fail', 'Settings'], ['COD offered', 'yes', 'fail', 'no']], hl: [] }
				},
				pulse: ['app']
			},
			{
				say: 'Score v2. It fixes the login case and still fails the COD case, which points at a real bug to investigate.',
				set: {
					tab: { rows: [['refund days', '30 days', 'pass', 'pass'], ['ship to Pune', 'yes', 'pass', 'pass'], ['reset login', 'Settings', 'fail', 'pass'], ['COD offered', 'yes', 'fail', 'fail']], hl: [3] },
					sum: { text: 'v1: 2 of 4 pass     v2: 3 of 4 pass', tone: 'accent' }
				},
				pulse: ['sum']
			},
			{ say: 'v2 beats v1 and broke nothing that v1 passed: no regressions. Automate this in CI so every change is checked the same way.', show: ['ci'], focus: ['ci'] }
		]
	},

	// ───────── pa-serving ─────────
	{
		id: 'pa-quantization',
		topic: 'pyai',
		group: 'pa-serving',
		title: 'Quantization shrinks memory',
		blurb: 'Why does a 7B model need 14 GB in fp16 but far less in int4?',
		nodes: [
			txt('f', 10, 24, 'weights memory = parameters x bytes per parameter', { size: 'sm', w: 340 }),
			txt('m', 10, 46, 'Example model: 7 billion parameters', { size: 'sm' }),
			txt('h1', 10, 84, 'fp16: 2 bytes each', { size: 'sm' }),
			box('b1', 10, 90, 14 * GB, 34, '14 GB', undefined, { tone: 'warn' }),
			txt('h2', 10, 150, 'int8: 1 byte each', { size: 'sm' }),
			box('b2', 10, 156, 7 * GB, 34, '7 GB'),
			txt('h3', 10, 216, 'int4: 0.5 byte each', { size: 'sm' }),
			box('b3', 10, 222, 3.5 * GB, 34, '3.5 GB', undefined, { tone: 'accent' }),
			txt('nt', 10, 284, 'Weights only. The KV cache grows with context length on top.', { size: 'sm', w: 340 })
		],
		steps: [
			{ say: 'A model is mostly a big list of numbers called parameters. Memory for the weights is parameters times the bytes used to store each one.', show: ['f', 'm'], focus: ['f'] },
			{ say: 'In fp16 each parameter takes 2 bytes. 7 billion times 2 bytes is 14 GB, more than many consumer GPUs have.', show: ['h1', 'b1'], pulse: ['b1'] },
			{ say: 'Quantization stores each number with fewer bits. int8 uses 1 byte, so the same model needs 7 GB, half the size.', show: ['h2', 'b2'], pulse: ['b2'] },
			{ say: 'int4 uses half a byte per parameter: about 3.5 GB, plus a little extra for the scale values that map small integers back to real numbers.', show: ['h3', 'b3'], pulse: ['b3'] },
			{ say: 'The price is some accuracy, because fewer values can be represented. For large models int4 often loses little, but measure on your own evals.', focus: ['b3'] },
			{ say: 'Formats like GGUF package quantized weights for llama.cpp and Ollama, so a model that needed a server GPU can run on a laptop.', set: { b3: { label: '3.5 GB, laptop' } }, pulse: ['b3'] },
			{ say: 'Weights are not the whole bill. The KV cache stores attention state per token, so long contexts and many users eat extra GPU memory.', show: ['nt'], focus: ['nt'] }
		]
	},
	{
		id: 'pa-batching',
		topic: 'pyai',
		group: 'pa-serving',
		title: 'Batching requests on a GPU',
		blurb: 'Why serve several requests in one GPU pass?',
		nodes: [
			box('r1', 10, 30, 80, 36, 'Request A', undefined, { visible: true }),
			box('r2', 10, 90, 80, 36, 'Request B', undefined, { visible: true }),
			box('r3', 10, 150, 80, 36, 'Request C', undefined, { visible: true }),
			box('bt', 140, 60, 90, 96, 'Batcher', 'waits a few ms'),
			box('gpu', 270, 60, 80, 96, 'GPU', 'one pass'),
			edge('a1', 'r1', 'bt'),
			edge('a2', 'r2', 'bt'),
			edge('a3', 'r3', 'bt'),
			edge('g1', 'bt', 'gpu'),
			txt('n1', 10, 220, 'One by one: 3 GPU passes, mostly idle between small jobs.', { size: 'sm', w: 340, tone: 'warn' }),
			txt('n2', 10, 220, 'Batched: 1 pass handles all 3, so throughput goes up.', { size: 'sm', w: 340, tone: 'accent' }),
			txt('n3', 10, 262, 'Continuous batching: new requests join between tokens.', { size: 'sm', w: 340 })
		],
		steps: [
			{ say: 'Three requests arrive at nearly the same time. A GPU is built for huge parallel math, so one small job at a time leaves most of it idle.', focus: ['r1', 'r2', 'r3'] },
			{ say: 'Without batching each request runs alone in its own GPU pass. Each is fast on its own, but the total work done per second is low.', show: ['n1'], pulse: ['r1'] },
			{ say: 'A batcher holds incoming requests for a few milliseconds and groups them. That short wait is the cost.', hide: ['n1'], show: ['bt', 'a1', 'a2', 'a3'], pulse: ['bt'] },
			{ say: 'The group goes to the GPU as one batch. The same weights are read once and applied to all three, which is far more efficient.', show: ['gpu', 'g1', 'n2'], set: { gpu: { tone: 'accent' } }, pulse: ['gpu'] },
			{ say: 'Text generation produces one token per step, and requests finish at different times. A naive batch would wait for its slowest member.', hide: ['n2'], set: { gpu: { tone: 'warn' } }, focus: ['gpu'] },
			{ say: 'Continuous batching, used by servers like vLLM, swaps finished requests out and new ones in between token steps, so the GPU stays full.', show: ['n3'], set: { gpu: { tone: 'accent' } }, pulse: ['n3'] },
			{ say: 'The trade-off is latency versus throughput: bigger batches serve more users per GPU but each user may wait a little longer.', set: { bt: { tone: 'warn' } }, focus: ['bt'] }
		]
	},
	{
		id: 'pa-model-service',
		topic: 'pyai',
		group: 'pa-serving',
		title: 'A model behind FastAPI',
		blurb: 'What happens between a client call and the model answer?',
		stage: { w: 360, h: 310 },
		nodes: [
			box('cl', 10, 10, 140, 40, 'Client', 'browser or backend', { visible: true }),
			box('api', 10, 100, 140, 50, 'FastAPI', 'pydantic validates', { visible: true }),
			box('mod', 10, 200, 140, 50, 'Model', 'loaded once at startup', { tone: 'warn' }),
			doc('rq', 190, 10, 160, 'POST /generate', ['{"prompt": "Hi",', ' "max_tokens": 64}']),
			doc('rs', 190, 200, 160, '200 response', ['{"text": "Hello!",', ' "tokens": 3}']),
			edge('e1', 'cl', 'api', 'POST'),
			edge('e2', 'api', 'mod', 'call'),
			edge('e3', 'mod', 'api', 'text'),
			edge('e4', 'api', 'cl', '200'),
			txt('nt', 10, 284, 'Add GET /health, a request id, and latency logs.', { size: 'sm', w: 340 })
		],
		steps: [
			{ say: 'Loading a model takes seconds and gigabytes. Do it once when the server starts (a lifespan hook), never inside a request handler.', show: ['mod'], focus: ['mod'] },
			{ say: 'A client sends a POST request with a JSON body: the prompt and a limit on output tokens.', show: ['rq', 'e1'], pulse: ['rq'] },
			{ say: 'FastAPI parses the body into a pydantic model. A missing field or wrong type gets a 422 error before any GPU time is spent.', set: { api: { tone: 'accent' } }, pulse: ['api'] },
			{ say: 'The handler calls the model. Declare it async so the server keeps accepting requests while it waits; heavy compute belongs in a worker or a separate inference server.', show: ['e2'], set: { mod: { tone: 'accent' } }, pulse: ['mod'] },
			{ say: 'The model returns generated text. Keep the maximum tokens and a timeout under your control so one request cannot hog the GPU.', show: ['e3'], pulse: ['e3'] },
			{ say: 'The handler builds a typed response and returns it as JSON. For long answers, stream the tokens instead of waiting.', show: ['e4', 'rs'], pulse: ['rs'] },
			{ say: 'In production add a health endpoint, a request id and latency logging. They show how the service behaves, as the first step towards monitoring.', show: ['nt'], focus: ['nt'] }
		]
	},

	// ───────── pa-mlops ─────────
	{
		id: 'pa-drift-monitor',
		topic: 'pyai',
		group: 'pa-mlops',
		title: 'Drift: a model decays quietly',
		blurb: 'How do you notice a deployed model getting worse?',
		nodes: [
			txt('ttl', 10, 22, 'Weekly accuracy on a labelled sample (%)', { size: 'sm', visible: true }),
			accBar(0), accBar(1), accBar(2), accBar(3), accBar(4), accBar(5), accBar(6),
			accLabel(0), accLabel(1), accLabel(2), accLabel(3), accLabel(4), accLabel(5), accLabel(6),
			edge('thr', { x: 10, y: 80 }, { x: 350, y: 80 }, 'alert 85', { dashed: true, tone: 'warn' }),
			txt('nt', 10, 292, 'Log inputs and predictions, join labels later.', { size: 'sm', w: 340 })
		],
		steps: [
			{ say: 'A model ships with about 92 percent accuracy on a held-out test set. The first weeks in production look the same.', show: ['w1', 'l1', 'w2', 'l2', 'w3', 'l3'], set: { w1: { tone: 'accent' }, w2: { tone: 'accent' }, w3: { tone: 'accent' } } },
			{ say: 'The world changes: new product lines, new slang, a season. Live inputs slowly stop resembling the training data. This is drift.', show: ['w4', 'l4'], set: { w4: { tone: 'warn' } }, pulse: ['w4'] },
			{ say: 'Labels often arrive late, so watch the inputs too: mean values, missing-value rate, category mix. Input shift shows up before accuracy does.', show: ['nt'], focus: ['nt'] },
			{ say: 'Accuracy keeps sliding, now 86. Nobody changed the code and no error was raised, which is why this failure is silent.', show: ['w5', 'l5'], set: { w5: { tone: 'warn' } }, pulse: ['w5'] },
			{ say: 'Set an alert threshold, here 85 percent, so a person is paged instead of someone noticing months later.', show: ['thr'], pulse: ['thr'] },
			{ say: 'This week reads 80 and crosses the line. The alert fires: check recent inputs, compare with the training data, then decide.', show: ['w6', 'l6'], set: { w6: { tone: 'neg' } }, pulse: ['w6'] },
			{ say: 'Roll back to a previous model or retrain on fresh data. After the retrain, accuracy returns to 91 and monitoring continues.', show: ['w7', 'l7'], set: { w7: { tone: 'accent' } }, pulse: ['w7'] }
		]
	}
];
