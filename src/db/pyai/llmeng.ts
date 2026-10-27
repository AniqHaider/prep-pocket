import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');
// Python for AI engineering: LLM engineering and production. Library names are fine; no version numbers or prices (they go stale).

export const topics: DbTopic[] = [
	// ───────────────────────── Calling LLMs ─────────────────────────
	{
		id: 'pa-llm-apis',
		title: 'Calling LLMs from Python',
		level: 'basic',
		summary: 'You can call a hosted model from Python, stream and validate its output, and let it use tools safely.',
		notes: md(
			'A hosted LLM is just an HTTP API. The official Python SDKs wrap it in a **client** object: you send a list of **messages** (each with a role such as user or assistant), an optional **system prompt** that sets behaviour, and limits like max output tokens. Class and method names change between SDK versions, so read the current docs, but the shape stays the same.',
			'',
			'```python',
			'from some_llm_sdk import Client  # name differs per provider',
			'',
			'client = Client()  # reads the API key from an environment variable',
			'reply = client.chat(',
			'    model="your-model-name",',
			'    system="You are a terse support assistant.",',
			'    messages=[{"role": "user", "content": "Where is my order?"}],',
			'    max_tokens=300,',
			')',
			'print(reply.text)',
			'```',
			'',
			'**Streaming** returns the answer in small pieces so users see text at once. In Python it is an iterator (`for chunk in stream`) or an async iterator.',
			'',
			'**Structured output**: ask for JSON that matches a schema, then validate it with pydantic. If validation fails, retry once or twice with the error message.',
			'',
			'```python',
			'from pydantic import BaseModel, ValidationError',
			'',
			'class Ticket(BaseModel):',
			'    category: str',
			'    urgent: bool',
			'',
			'try:',
			'    ticket = Ticket.model_validate_json(reply.text)',
			'except ValidationError as err:',
			'    ...  # send str(err) back to the model and retry',
			'```',
			'',
			'**Tool calling**: you describe functions with a JSON schema. The model replies with a tool call, your code runs the function, and you send the result back. The model never runs code itself.',
			'',
			'Production habits:',
			'- Set a **timeout** and retry with exponential backoff on rate limits (HTTP 429) and server errors, never on bad requests.',
			'- Count tokens before sending. Cost and latency grow with input plus output tokens.',
			'- Levers: shorter prompts, a smaller model for easy steps, caching repeated prefixes, capping output length, streaming for perceived speed.',
			'- For many calls use `asyncio` with `httpx` or the SDK async client, and limit concurrency with a semaphore.'
		),
		scenes: ['pa-tool-call-loop', 'pa-streaming', 'pa-structured-output']
	},

	// ───────────────────────── Embeddings and RAG ─────────────────────────
	{
		id: 'pa-embeddings-rag',
		title: 'Embeddings and vector search',
		level: 'mid',
		summary: 'You can turn text into vectors, search them by meaning, and wire retrieval into a small RAG function.',
		notes: md(
			'An **embedding** is a list of numbers (a vector) that represents the meaning of a text. Texts with similar meaning get vectors pointing in similar directions. **Cosine similarity** measures that angle: 1 is identical direction, near 0 is unrelated.',
			'',
			'```python',
			'import numpy as np',
			'',
			'def cosine(a: np.ndarray, b: np.ndarray) -> float:',
			'    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))',
			'```',
			'',
			'`sentence-transformers` runs embedding models locally: `model.encode(["text"])` returns a numpy array. Hosted APIs offer the same through an endpoint. One index must always use one embedding model.',
			'',
			'**Vector stores** find nearest neighbours fast:',
			'- **FAISS**: a library, in memory, great for experiments and single-machine jobs.',
			'- **pgvector**: a Postgres extension; best if you already run Postgres and want joins and transactions.',
			'- **Qdrant**: a dedicated server with strong filtering and scaling.',
			'- **Chroma**: simple local store for prototypes.',
			'',
			'**Chunking**: cut documents into pieces (a few hundred tokens, some overlap, split on headings first). Store **metadata** (source, page, date) so you can filter and cite.',
			'',
			'**Hybrid search** combines BM25 keyword ranking with vectors, since exact ids and rare words suit keywords. A **reranker** (cross-encoder) then re-scores the short list.',
			'',
			'A minimal RAG function:',
			'',
			'```python',
			'def answer(question: str, k: int = 4) -> str:',
			'    q_vec = embed(question)',
			'    hits = store.search(q_vec, k=k)  # your vector store',
			'    context = "\\n\\n".join(h.text for h in hits)',
			'    prompt = (',
			'        "Answer using only the context. Say you do not know if it is missing.\\n\\n"',
			'        f"Context:\\n{context}\\n\\nQuestion: {question}"',
			'    )',
			'    return llm(prompt)',
			'```',
			'',
			'Most RAG failures are retrieval failures: wrong chunks in, wrong answer out. Evaluate retrieval separately from generation.'
		),
		scenes: ['pa-embed-search', 'pa-chunking', 'pa-rag-pipeline', 'pa-hybrid-rerank']
	},

	// ───────────────────────── Agents and frameworks ─────────────────────────
	{
		id: 'pa-agent-frameworks',
		title: 'Agents, LangChain and friends',
		level: 'mid',
		summary: 'You can write the agent loop yourself and judge when LangChain, LlamaIndex or LangGraph earn their weight.',
		notes: md(
			'An **agent** is a loop: the model picks a tool, your code runs it, the result goes back, repeat until the model answers. You can write it in plain Python in about twenty lines.',
			'',
			'```python',
			'def run_agent(question: str, max_steps: int = 6) -> str:',
			'    messages = [{"role": "user", "content": question}]',
			'    for _ in range(max_steps):',
			'        reply = llm(messages, tools=TOOLS)',
			'        if not reply.tool_calls:',
			'            return reply.text',
			'        messages.append(reply.as_message())',
			'        for call in reply.tool_calls:',
			'            result = REGISTRY[call.name](**call.args)',
			'            messages.append({"role": "tool", "id": call.id, "content": str(result)})',
			'    raise RuntimeError("agent did not finish")',
			'```',
			'',
			'What frameworks add:',
			'- **LangChain**: many ready-made integrations (models, vector stores, loaders) and composable building blocks.',
			'- **LlamaIndex**: focused on connecting your data: loaders, indexes, query engines.',
			'- **LangGraph**: models the agent as a graph of steps with state, branches, loops, checkpoints and human approval.',
			'',
			'**When a framework helps**: you need many integrations, durable state, resuming after a crash, or a team wants a shared structure. **When plain code is better**: one or two tools, a simple loop, and you want to debug every prompt. Frameworks add layers that hide what is sent to the model, and they change fast.',
			'',
			'**MCP (Model Context Protocol)** is an open protocol for exposing tools and data to any compatible client. You write a tool server once and different apps can use it, instead of rewriting integrations for each.',
			'',
			'Production concerns:',
			'- **Guardrails**: validate tool arguments, allow-list actions, require approval for risky ones, filter outputs.',
			'- **Memory**: short-term is the message list; long-term is a store you query and summarise into.',
			'- **Cost control**: step limit, token budget per run, cheaper model for routine steps, caching, and logging every run.'
		),
		scenes: ['pa-tool-call-loop'],
	},

	// ───────────────────────── Evals ─────────────────────────
	{
		id: 'pa-evals',
		title: 'Evals, tracing and quality',
		level: 'advanced',
		summary: 'You can measure whether an AI feature works, catch regressions, and see inside a run when it fails.',
		notes: md(
			'Model output is not deterministic and "looks fine" does not scale. **Evals are the test suite of an AI app**: a fixed set of inputs with a way to score the outputs, run on every change to the prompt, model, retrieval or code.',
			'',
			'**Golden dataset**: start with 30 to 100 real cases, each with an expected answer or a note on what a good answer contains. Add every production failure as a new case.',
			'',
			'**Scoring styles**:',
			'- **Exact match** or regex: cheap and strict, good for classification, ids, extraction.',
			'- **Rubric**: a checklist (mentions the refund window, no invented policy) scored by code or by a person.',
			'- **LLM-as-judge**: another model grades against a rubric. Flexible, but biased and noisy: calibrate it against human labels and keep the judge prompt fixed.',
			'',
			'```python',
			'cases = load_cases("golden.jsonl")',
			'results = []',
			'for case in cases:',
			'    output = app(case["input"])',
			'    results.append({"id": case["id"], "ok": score(output, case["expected"])})',
			'pass_rate = sum(r["ok"] for r in results) / len(results)',
			'assert pass_rate >= 0.85, f"eval regression: {pass_rate:.0%}"',
			'```',
			'',
			'**RAG metrics**: *retrieval recall* (was the right chunk in the top k?) and *faithfulness* (is every claim in the answer supported by the retrieved text?). Measure them separately to know which half is broken.',
			'',
			'**Regression runs**: store results per version and diff them, so a fix that breaks other cases is visible.',
			'',
			'**Tracing and observability**: record every step (prompt, retrieved chunks, tool calls, latency, tokens) as a trace. Tools such as Langfuse, LangSmith, OpenTelemetry-based setups and Weights & Biases give you a UI for this. Version your prompts like code.',
			'',
			'**Hallucination handling**: ground answers in retrieved text, ask for citations, allow "I do not know", validate outputs, and route uncertain cases to a person.'
		),
		scenes: ['pa-eval-loop']
	},

	// ───────────────────────── Serving ─────────────────────────
	{
		id: 'pa-serving',
		title: 'Serving models',
		level: 'advanced',
		summary: 'You can put a model behind an API, size its memory, and choose a serving stack for latency or throughput.',
		notes: md(
			'A model service is an ordinary web service with unusual costs: a slow startup, a lot of memory, and an expensive device (the GPU). The standard Python shape is **FastAPI** plus **pydantic**.',
			'',
			'```python',
			'from contextlib import asynccontextmanager',
			'from fastapi import FastAPI',
			'from pydantic import BaseModel',
			'',
			'state = {}',
			'',
			'@asynccontextmanager',
			'async def lifespan(app: FastAPI):',
			'    state["model"] = load_model()  # once, at startup',
			'    yield',
			'    state.clear()',
			'',
			'app = FastAPI(lifespan=lifespan)',
			'',
			'class Req(BaseModel):',
			'    prompt: str',
			'    max_tokens: int = 64',
			'',
			'@app.post("/generate")',
			'async def generate(req: Req):',
			'    return {"text": await state["model"].agenerate(req.prompt, req.max_tokens)}',
			'```',
			'',
			'**Batching** groups requests into one GPU pass. **Streaming** (server-sent events) sends tokens as they are made. **Latency** is time for one request; **throughput** is requests or tokens per second overall. Raising one often hurts the other.',
			'',
			'**Serving engines**: vLLM and TGI serve many users from a GPU with continuous batching; llama.cpp and Ollama run quantized models on a laptop or CPU; ONNX Runtime runs exported models fast on many hardware types.',
			'',
			'**Memory math**: weights = parameters x bytes per parameter. 7 billion parameters in fp16 (2 bytes) is about 14 GB; in int4 (half a byte) about 3.5 GB. **Quantization** (int8, int4, formats like GGUF) trades a little accuracy for a lot of memory.',
			'',
			'**Context length** costs memory too: the KV cache stores attention state per token per request, so a long context times many users can exceed GPU memory even if the weights fit.'
		),
		scenes: ['pa-quantization', 'pa-batching', 'pa-model-service']
	},

	// ───────────────────────── MLOps ─────────────────────────
	{
		id: 'pa-mlops',
		title: 'MLOps basics',
		level: 'mid',
		summary: 'You can track experiments, version data and models, package them, and notice when production decays.',
		notes: md(
			'**MLOps** is DevOps for models: the extra practices that make training and deployment repeatable. A model depends on code, data and settings, so all three must be tracked.',
			'',
			'**Experiment tracking**: MLflow or Weights & Biases record parameters, metrics and artifacts for each run, so you can answer "which settings produced this model?"',
			'',
			'```python',
			'import mlflow',
			'',
			'with mlflow.start_run():',
			'    mlflow.log_param("lr", 3e-4)',
			'    for epoch in range(3):',
			'        loss = train_one_epoch()',
			'        mlflow.log_metric("loss", loss, step=epoch)',
			'    mlflow.log_artifact("model.pt")',
			'```',
			'',
			'**Versioning**: DVC keeps large data and models next to git by storing pointers in git and the files in remote storage. The Hugging Face Hub hosts models and datasets with versions.',
			'',
			'**Docker for ML**: use a base image that matches your CUDA and framework, pin dependency versions, and keep model weights out of the image when large (download at startup or mount them).',
			'',
			'**CI for models**: run unit tests, then a small eval on every change; fail if quality drops.',
			'',
			'**Feature stores** (concept): one place that computes and serves the same input features for training and for live inference, avoiding training-serving skew.',
			'',
			'**Monitoring and drift**: watch latency, errors, cost, input distributions and (when labels arrive) accuracy. **Drift** means live data no longer looks like training data.',
			'',
			'**Safe release**: canary (send a small share of traffic to the new model), compare, then roll out or roll back.',
			'',
			'**Cost control**: right-size GPUs, scale to zero when idle, cache results, use smaller models where quality allows.',
			'',
			'**Notebooks to production**: move logic into functions and modules, add tests, pin dependencies, and let the notebook import the code, not the other way round.'
		),
		scenes: ['pa-drift-monitor']
	},

	// ───────────────────────── Vision, speech ─────────────────────────
	{
		id: 'pa-vision-speech',
		title: 'Vision, speech and beyond',
		level: 'mid',
		summary: 'You know which library fits image, audio and multimodal tasks, and when to reach for each.',
		notes: md(
			'Text is only one kind of input. The Python tools for other kinds:',
			'',
			'- **Pillow (PIL)**: open, resize, crop and convert images. The everyday basics.',
			'- **OpenCV**: classic computer vision: filters, edges, video capture, camera frames, geometry. Fast and mature.',
			'- **torchvision**: datasets, transforms and pretrained image models for PyTorch.',
			'- **CLIP-style models**: embed images and text into the same vector space, so you can search images with a sentence or classify without training.',
			'- **diffusers** (Hugging Face): pipelines for diffusion models, which generate images by starting from noise and removing it step by step. Think of it as a prompt-to-image library.',
			'- **Whisper-style models**: speech-to-text. Audio goes in, a transcript with timestamps comes out.',
			'- **Multimodal LLMs**: accept images (and sometimes audio) inside the message list next to text.',
			'',
			'```python',
			'from PIL import Image',
			'',
			'img = Image.open("receipt.jpg").convert("RGB")',
			'img.thumbnail((1024, 1024))  # keep within size limits, keeps aspect ratio',
			'img.save("receipt_small.jpg", quality=85)',
			'```',
			'',
			'**Which to use**:',
			'- Read text or answer questions about a screenshot or document page: a multimodal LLM first.',
			'- Count objects, track motion, read a camera stream: OpenCV plus a detection model.',
			'- Train your own image classifier: torchvision with transfer learning.',
			'- Search a photo library by description: CLIP embeddings in a vector store.',
			'- Transcribe meetings or calls: a Whisper-style model, then an LLM for summaries.',
			'- Generate images: diffusers locally, or a hosted image API.',
			'',
			'Practical notes: images and audio are large, so resize and compress before sending; validate file types and sizes; and remember that every extra image costs tokens in a multimodal call.'
		),
		scenes: []
	},

	// ───────────────────────── Learning path ─────────────────────────
	{
		id: 'pa-learning-path',
		title: 'A 12-week plan',
		level: 'basic',
		summary: 'A week-by-week path for a full-stack developer, with one small project per step to show in a portfolio.',
		notes: md(
			'You already know how to build software. The plan adds data, models and evaluation. Spend about 8 to 10 hours a week and finish each week with something that runs.',
			'',
			'**Weeks 1-2: Python for data.** NumPy arrays, pandas tables, matplotlib charts. *Project*: clean a public dataset and write up three findings in a notebook.',
			'',
			'**Weeks 3-4: Classical ML.** scikit-learn: train/test split, pipelines, cross-validation, overfitting. *Project*: a classifier on tabular data with an honest metric and a baseline to beat.',
			'',
			'**Weeks 5-6: Deep learning with PyTorch.** Tensors, autograd, a training loop, GPU use. *Project*: an MNIST loop written by hand, then one pretrained model fine-tuned on a small image set.',
			'',
			'**Week 7: Transformers and Hugging Face.** Tokenizers, `pipeline`, loading models and datasets. *Project*: a small text classifier using a pretrained model.',
			'',
			'**Week 8: Fine-tuning with LoRA.** Train a small adapter instead of all weights. *Project*: fine-tune a small model on a narrow task and compare with the base model.',
			'',
			'**Weeks 9-10: LLM apps and RAG.** SDK calls, structured output, embeddings, a vector store, tools. *Project*: a RAG app over documents you know, with citations.',
			'',
			'**Week 11: Evals and tracing.** A golden dataset, retrieval recall, faithfulness, a trace UI. *Project*: add an eval suite to the Week 9 app and improve the score with evidence.',
			'',
			'**Week 12: Serve and ship.** FastAPI, Docker, a quantized model, basic monitoring. *Project*: deploy one model behind an API with a health check.',
			'',
			'**Reading**: the documentation of each library, one hands-on course for each of ML and deep learning, and the source of a small open-source project.',
			'',
			'**Portfolio**: for every project keep a README with the problem, the data, the metric, what failed first, and a chart or demo. Employers trust measured results and honest limits more than a long list of buzzwords.'
		),
		scenes: []
	}
];

// ───────────────────────── quiz ─────────────────────────
const t = (topic: string) => builder('PA', topic);

// ----- Calling LLMs -----
const a = t('pa-llm-apis');
a.add('basic', 'messages', 'What is the usual role of the system prompt in a chat-style LLM call?',
	'It sets standing instructions for behaviour and tone across the conversation',
	['It stores the full conversation history on the provider servers for later calls', 'It is the only place where the API key may be included', 'It makes the model remember users between separate calls'],
	'The system prompt carries instructions such as role, tone and rules. The model is stateless: history is whatever list of messages you resend, and the key travels in a header, not the prompt.');
a.add('basic', 'stateless', 'You call a model twice, and the second call does not include the first question. What happens?',
	'The model has no knowledge of the first call',
	['The model quietly reuses the first call as context', 'The provider merges both calls using your API key', 'The model answers but with a warning about missing history'],
	'LLM APIs are stateless: each request is independent, so you must resend any earlier messages you want the model to see. Nothing is merged by key and no warning is added.');
a.add('basic', 'streaming', 'What is the main benefit of streaming a response?',
	'The user sees text sooner, so the app feels faster',
	['The total generation time becomes much shorter than a normal call', 'The model produces more accurate answers', 'The token cost of the call is reduced to zero'],
	'Streaming improves time to first token and perceived speed. Generation still takes about as long overall, quality is unchanged, and tokens are billed as usual.');
a.add('basic', 'pydantic', 'Why validate model JSON with a pydantic model before using it?',
	'Model output is untrusted text, so bad shapes fail early instead of deeper in your app',
	['Pydantic forces the model itself to always return perfectly valid JSON every time', 'Pydantic makes the API call cheaper by shrinking the prompt', 'Valid JSON from a model is guaranteed once a schema is sent'],
	'Even with a schema in the prompt a reply can be malformed or wrong typed. Validation catches that at the boundary. Pydantic does not control the model, change the price, or turn a request into a guarantee.',
	'class Ticket(BaseModel):\n    category: str\n    urgent: bool\n\nticket = Ticket.model_validate_json(reply.text)');
a.add('mid', 'tools', 'In tool calling, who actually executes the function?',
	'Your code, after the model replies with a call',
	['The model, inside the provider data centre', 'The SDK, by importing your function automatically', 'The provider, through a hidden sandbox on request'],
	'The model only produces a function name and arguments as text. Your code decides whether to run it, runs it, and sends the result back as a message.');
a.add('mid', 'retries', 'Which failure is most reasonable to retry with exponential backoff?',
	'A rate-limit response (HTTP 429)',
	['A request rejected for an invalid parameter', 'A response that said the API key is wrong', 'A prompt refused because it is too long'],
	'Rate limits and transient server errors usually succeed later. Invalid parameters, bad keys and oversized prompts fail the same way every time, so retrying only wastes time.');
a.add('mid', 'async', 'You must send 200 independent LLM calls from Python. What is a sound approach?',
	'Use asyncio with an async client and a semaphore to cap concurrency',
	['Run them in one plain for loop and wait for each reply before the next one', 'Start 200 threads at once with no limit', 'Send them as one long prompt to save requests'],
	'Calls spend most of their time waiting on the network, so async runs many at once; a semaphore keeps you under rate limits. A plain loop is slow, unbounded fan-out triggers 429 errors, and one giant prompt changes the task.',
	'sem = asyncio.Semaphore(10)\n\nasync def one(prompt):\n    async with sem:\n        return await client.achat(prompt)\n\nresults = await asyncio.gather(*(one(p) for p in prompts))');
a.add('advanced', 'cost', 'Which change most reliably lowers cost and latency for a chat feature that repeats a long fixed instruction?',
	'Reusing a cached prompt prefix and trimming input tokens',
	['Raising the temperature setting of the model to get shorter replies', 'Adding more examples to every single prompt', 'Asking the model to think longer before replying'],
	'Cost and latency grow with tokens processed, so caching a stable prefix and sending less input helps. Temperature does not change token counts, and more examples or longer reasoning usually add tokens.');

// ----- Embeddings and RAG -----
const e = t('pa-embeddings-rag');
e.add('basic', 'embedding', 'What is a text embedding?',
	'A vector of numbers where similar meanings land close together',
	['A compressed copy of the text that can later be unzipped back to the original', 'A keyword list extracted from the text by counting words', 'A hash of the text used to detect exact duplicates'],
	'Embeddings capture meaning as coordinates, so distance reflects semantic similarity. They cannot be turned back into the exact text, are not keyword counts, and unlike hashes similar texts get similar values.');
e.add('basic', 'cosine', 'What does a cosine similarity near 1 between two embeddings mean?',
	'The vectors point in nearly the same direction',
	['The two texts share almost every single word in the same order', 'The vectors have exactly the same length', 'The two texts were written by the same author'],
	'Cosine compares direction, not word overlap or length. Paraphrases with no shared words can still score high.');
e.add('basic', 'numpy', 'Which expression computes cosine similarity of two numpy vectors a and b?',
	'a @ b / (np.linalg.norm(a) * np.linalg.norm(b))',
	['a * b / (np.linalg.norm(a) + np.linalg.norm(b))', 'np.sum(a - b) / np.linalg.norm(a - b)', 'a @ b * np.linalg.norm(a) * np.linalg.norm(b)'],
	'Cosine is the dot product divided by the product of the two lengths. The other forms add instead of multiplying the norms, subtract the vectors, or multiply by the norms instead of dividing.');
e.add('mid', 'stores', 'Your app already runs Postgres and you need vector search with SQL joins and filters. What fits best?',
	'pgvector',
	['A FAISS index loaded in each web worker', 'A Chroma store kept on one laptop', 'A separate keyword search engine only'],
	'pgvector adds a vector type and index to Postgres, so retrieval lives next to your relational data. FAISS and Chroma are good for prototypes, and keyword-only search ignores meaning.');
e.add('mid', 'chunking', 'Why do many chunkers add overlap between neighbouring chunks?',
	'A sentence cut at a boundary still appears whole in one chunk',
	['It lets the embedding model produce longer and richer vectors', 'It guarantees each chunk is unique in the index', 'It reduces the storage needed for the index'],
	'Overlap protects ideas that straddle a boundary. It slightly increases storage, does not change vector size, and duplicates some text by design.');
e.add('mid', 'metadata', 'What is the main value of storing metadata (source, date, tenant) with each chunk?',
	'You can filter results and show citations',
	['It makes the vectors themselves more accurate', 'It removes the need to embed the chunk', 'It lets the model skip reading the retrieved text'],
	'Metadata enables filters such as only this customer or this year, and citations to a source. It does not alter vectors or replace embedding or reading.');
e.add('mid', 'hybrid', 'A user searches for the exact order code AX-4410. Which approach handles it best?',
	'Hybrid search that adds keyword (BM25) scoring to vectors',
	['Vector search alone with a much bigger embedding model and more results', 'Raising the chunk size to 5000 tokens', 'Lowering the number of results returned'],
	'Exact tokens such as ids are what keyword ranking is good at, while embeddings can blur them. Hybrid search covers both. A larger chunk or fewer results does nothing for this.');
e.add('advanced', 'rerank', 'What does a cross-encoder reranker do differently from a bi-encoder embedding search?',
	'It reads the query and a candidate together and scores the pair',
	['It embeds each document once ahead of time and stores the vector', 'It searches the whole corpus faster than a vector index', 'It replaces the LLM that writes the final answer'],
	'Joint reading is more precise but slower, so it is run on a short candidate list from the first stage. Embedding once is the bi-encoder approach, and rerankers do not write answers.');
e.add('advanced', 'rag', 'A RAG app gives wrong answers. Retrieved chunks do not contain the fact. Where is the problem?',
	'Retrieval, so fix chunking, search or filters before the prompt',
	['Generation, so switch to a much larger model before looking at anything else', 'Temperature, so lower it to zero', 'Streaming, so turn it off for the call'],
	'If the evidence never reached the model no prompt can fix it. Check what was retrieved first. A bigger model cannot use facts it was not given, and neither temperature nor streaming changes retrieval.',
	'hits = store.search(embed(q), k=4)\nprint([h.id for h in hits])  # inspect before blaming the LLM');

// ----- Agents -----
const g = t('pa-agent-frameworks');
g.add('basic', 'loop', 'When does a plain tool-using agent loop normally stop?',
	'When the model replies with no tool calls, or a step limit is hit',
	['After exactly one tool call has been executed, whatever the model says next', 'When the context window is half full', 'When the framework prints its first log line'],
	'The loop continues while the model asks for tools. A maximum step count is a necessary safety stop. The other conditions are not how agent loops end.');
g.add('basic', 'limits', 'Why put a maximum step count in an agent loop?',
	'A confused model could otherwise loop forever and spend tokens',
	['The API refuses any request that has more than three messages in it', 'Tool results are deleted after five iterations', 'The model becomes more accurate with fewer steps'],
	'Agents can repeat the same failing action. A step and token budget bounds cost and time. There is no such API message limit, and accuracy does not improve by itself.');
g.add('mid', 'frameworks', 'Which is a good reason to choose LangGraph over a hand-written loop?',
	'You need branching state, checkpoints and a human approval step',
	['You want to avoid ever having to read the prompts that get sent', 'You want the model to need fewer tokens', 'You only have one tool and one prompt'],
	'LangGraph models stateful workflows with resumable checkpoints and approvals. With one tool a plain loop is simpler, and a framework does not shrink tokens or remove the need to read prompts.');
g.add('mid', 'frameworks', 'What is LlamaIndex mainly known for?',
	'Connecting your own data to an LLM with loaders and indexes',
	['Training brand new base models from scratch on large GPU clusters', 'Serving models with continuous batching', 'Tracking experiment metrics across runs'],
	'LlamaIndex focuses on data ingestion, indexing and query engines. Training, serving and experiment tracking belong to PyTorch, vLLM and MLflow style tools.');
g.add('mid', 'mcp', 'What problem does MCP (Model Context Protocol) solve?',
	'A standard way to expose tools and data to many AI clients',
	['A faster way to compress model weights so they load quickly on any device', 'A method for encrypting API keys on disk', 'A format for storing vectors in Postgres'],
	'MCP defines how a client discovers and calls tools and resources from a server, so one integration works across apps. It is not about compression, key storage or vector formats.');
g.add('advanced', 'guardrails', 'An agent can call a delete_record tool. Which guardrail is most appropriate?',
	'Validate arguments and require human approval for destructive calls',
	['Tell the model in the system prompt never to delete anything, under any circumstances', 'Hide the tool name from the logs for safety', 'Give the tool broader database permissions to avoid errors'],
	'A prompt rule is only a request; real safety is enforced in code with validation, permissions and approvals. Hiding logs hurts debugging, and broader permissions increase risk.');

// ----- Evals -----
const v = t('pa-evals');
v.add('basic', 'why', 'Why are evals compared to a test suite for AI apps?',
	'They re-check behaviour on fixed cases every time something changes',
	['They guarantee the model never makes a mistake once the score reaches a threshold', 'They replace the need for any user feedback', 'They train the model on your private data'],
	'Evals give repeatable evidence that a change helped or hurt. They do not remove errors, do not replace real feedback, and scoring does not train the model.');
v.add('basic', 'dataset', 'What belongs in a good golden dataset?',
	'Real cases that matter, plus every production failure you later find',
	['Only easy examples so that the score stays high and the team stays happy', 'Random text unrelated to your product', 'Examples copied from the prompt itself'],
	'A golden set should reflect real use and grow with each failure. Easy or irrelevant cases inflate the score, and copying prompt examples tests memory, not ability.');
v.add('mid', 'judge', 'What is a known weakness of LLM-as-judge scoring?',
	'It can be biased or noisy, so calibrate it against human labels',
	['It cannot read any text that is longer than a single short sentence', 'It always agrees with the model being tested', 'It needs no rubric, which makes results random'],
	'Judges have position and style biases and vary between runs, so check them on human-labelled samples and fix the judge prompt. The other claims are not true.');
v.add('mid', 'rag-metrics', 'What does faithfulness measure in a RAG answer?',
	'Whether every claim is supported by the retrieved text',
	['Whether the right chunk was in the top results', 'How fast the answer was generated compared with the previous version', 'How many tokens the answer contains'],
	'Faithfulness checks grounding in the retrieved context. Whether the right chunk was found is retrieval recall, and speed and length are different measures.');
v.add('advanced', 'regression', 'Why store eval results for each prompt version?',
	'You can diff versions and see which cases a change broke',
	['It lets the model provider train its next version on your stored cases', 'It removes the need for a golden dataset', 'It makes the model deterministic at all times'],
	'Per-case results across versions reveal regressions hidden by an average score. Stored results do nothing for training, datasets or determinism.');
v.add('advanced', 'tracing', 'What is a trace in an LLM observability tool?',
	'A recorded tree of steps: prompts, retrieved chunks, tool calls, latency and tokens',
	['A compressed copy of the model weights that can be reloaded on another machine', 'A list of users who opened the app', 'A summary of the final answer only'],
	'Traces let you open a failing run and see each step. They are not weights, user lists, or just the final text.');

// ----- Serving -----
const s = t('pa-serving');
s.add('basic', 'memory', 'About how much memory do the weights of a 7 billion parameter model need in fp16?',
	'About 14 GB',
	['About 3.5 GB', 'About 7 GB', 'About 28 GB'],
	'fp16 uses 2 bytes per parameter, and 7 billion times 2 bytes is 14 GB. 7 GB is int8, 3.5 GB is int4, and 28 GB would be fp32 at 4 bytes.');
s.add('basic', 'quant', 'What does int4 quantization trade away?',
	'A little accuracy, in return for much less memory',
	['Some memory, in return for a lot of extra accuracy on hard questions', 'The ability to run on a GPU at all', 'Nothing, since it is lossless by design'],
	'Fewer bits per weight shrinks memory but loses precision. It is not lossless, and quantized models still run on GPUs and CPUs.');
s.add('mid', 'fastapi', 'Where should a FastAPI model service load a large model?',
	'Once at startup in a lifespan hook',
	['Inside each request handler call', 'In a middleware before every request', 'In the response model class body'],
	'Loading takes seconds and gigabytes, so it must happen once. A per-request load would make every call slow and could run out of memory.',
	'@asynccontextmanager\nasync def lifespan(app):\n    state["model"] = load_model()\n    yield');
s.add('mid', 'batching', 'Why does batching improve GPU throughput?',
	'Weights are read once and applied to many requests together',
	['Every request gets its own dedicated GPU core while the others wait their turn', 'Requests skip the model for repeated words', 'The batch makes the prompt shorter automatically'],
	'GPUs are efficient at large parallel math, and sharing the cost of reading weights across requests raises work done per second. Requests are not skipped and prompts are not shortened.');
s.add('mid', 'engines', 'Which tool is best known for running quantized models locally on a laptop?',
	'llama.cpp or Ollama',
	['vLLM with a cluster of GPUs', 'Postgres with an extension', 'Docker Compose alone'],
	'llama.cpp and Ollama run GGUF-style quantized models on consumer hardware. vLLM targets GPU servers, and the other options are not model runtimes.');
s.add('advanced', 'kv-cache', 'A model fits in GPU memory, but the server runs out of memory with many long chats. What is the likely cause?',
	'The KV cache grows with context length for each request',
	['The weights grow a little every time a new request arrives at the server', 'The tokenizer stores every user message forever', 'Quantization doubles in size at runtime'],
	'The KV cache holds attention state per token per request, so long contexts times many users use a lot of memory on top of the weights. Weights are fixed in size.');
s.add('advanced', 'latency', 'Raising the maximum batch size usually has which effect?',
	'Higher throughput, but individual requests may wait longer',
	['Lower throughput, but every single request gets a lot faster than before', 'No change, since batching is only for training', 'Lower memory use on the GPU'],
	'Larger batches use the GPU better but can delay individual requests. Batching helps inference too, and bigger batches normally need more memory, not less.');

// ----- MLOps -----
const m = t('pa-mlops');
m.add('basic', 'tracking', 'What does an experiment tracker like MLflow record?',
	'Parameters, metrics and artifacts for each training run',
	['The full source code of every dependency installed in the environment', 'The private keys used by your team', 'Only the final accuracy on a single line'],
	'Trackers answer which settings produced which model, with metrics over time and saved files. They are not dependency archives, key stores, or a single number.');
m.add('basic', 'versioning', 'What is DVC used for?',
	'Versioning large data and model files next to git',
	['Compiling Python code to optimized machine code for faster training', 'Serving models with continuous batching', 'Labelling images with a web interface'],
	'DVC keeps small pointer files in git while the large files live in remote storage. It does not compile, serve or label.');
m.add('mid', 'drift', 'What is data drift in a deployed model?',
	'Live inputs gradually stop resembling the training data',
	['The model weights change on their own at night while nobody is using it', 'The server clock moves away from the true time', 'The database grows larger than its disk'],
	'Drift is a change in the data distribution, which can quietly reduce quality. Weights do not change on their own and the other options are unrelated.');
m.add('mid', 'release', 'What is a canary release for a model?',
	'Send a small share of traffic to the new model and compare',
	['Replace the old model for every user at once and watch the dashboards', 'Run the new model only on a developer laptop', 'Keep the new model offline until it is perfect'],
	'A canary limits the blast radius and gives real comparison data before the full rollout or a rollback.');
m.add('mid', 'docker', 'Which practice is sensible when building a Docker image for a GPU model?',
	'Match the CUDA base image to the framework and pin dependency versions',
	['Always use the smallest possible base image regardless of the CUDA version it ships with', 'Install the latest of every package on each build', 'Copy several large model files into every layer'],
	'GPU libraries and frameworks must be compatible, and pinned versions make builds repeatable. Ignoring CUDA breaks GPU use, and floating versions or bundled weights cause surprises and huge images.');
m.add('advanced', 'skew', 'What problem does a feature store help prevent?',
	'Training-serving skew, where features differ between training and live use',
	['Slow GPU kernels during training caused by badly written custom layers and loops', 'Typos in the prompts sent to an LLM', 'Merge conflicts in the notebook files'],
	'A feature store computes and serves the same features in both places, so the model sees the same kind of input. The other problems are unrelated.');

// ----- Vision and speech -----
const w = t('pa-vision-speech');
w.add('basic', 'pillow', 'Which library is the usual choice for simply resizing and converting images in Python?',
	'Pillow',
	['Whisper', 'diffusers', 'FAISS'],
	'Pillow (PIL) handles opening, resizing, cropping and converting images. Whisper is speech-to-text, diffusers generates images, and FAISS searches vectors.',
	'from PIL import Image\nimg = Image.open("a.jpg")\nimg.thumbnail((512, 512))');
w.add('basic', 'whisper', 'What does a Whisper-style model do?',
	'Turns speech audio into text',
	['Generates photographs from a text prompt', 'Detects faces in a video stream', 'Ranks search results by keywords'],
	'Whisper-style models are speech recognition: audio in, a transcript out. Image generation, detection and ranking are other model families.');
w.add('mid', 'clip', 'What makes CLIP-style models useful for image search?',
	'Images and text share one vector space, so a sentence can find pictures',
	['They convert every image into a long written caption and then search the caption words', 'They compress images to save disk space', 'They only work with images of faces'],
	'Matching embeddings let you compare a text query vector with image vectors directly. They are not compression and not limited to faces.');
w.add('mid', 'diffusion', 'How does a diffusion model generate an image?',
	'It starts from noise and removes it step by step',
	['It copies the nearest image in its training set', 'It draws one pixel at a time left to right', 'It stitches together stock photos from a database'],
	'Diffusion repeatedly denoises toward an image guided by the prompt. It does not look up or paste existing images.');
w.add('mid', 'opencv', 'Which task is the best fit for OpenCV rather than an LLM?',
	'Reading frames from a camera and tracking motion',
	['Summarizing a long legal contract into a few plain paragraphs', 'Translating a paragraph into Hindi', 'Writing a short product description'],
	'OpenCV is a computer vision toolkit for video capture, filters and geometry. The other tasks are language tasks for an LLM.');

// ----- Learning path -----
const p = t('pa-learning-path');
p.add('basic', 'order', 'In the 12-week plan, what comes before fine-tuning with LoRA?',
	'PyTorch basics and a first look at Hugging Face transformers',
	['Serving a quantized model in production behind a FastAPI service', 'Deploying a RAG app with a trace dashboard', 'Writing an MLOps pipeline for drift alerts'],
	'You need tensors, a training loop and the transformers tools before adapting a model. Serving, RAG evals and drift monitoring come later in the plan.');
p.add('basic', 'baseline', 'Why compare a scikit-learn classifier with a simple baseline?',
	'It shows whether the model learned anything beyond a trivial rule',
	['It guarantees the model will generalize well to completely new data', 'It removes the need for a test set', 'It makes training run faster on a GPU'],
	'A baseline such as always predicting the most common class tells you if the model adds value. It does not guarantee generalization and does not replace a test set.');
p.add('basic', 'portfolio', 'What should a portfolio README for an AI project emphasise?',
	'The problem, the data, a measured result and what failed first',
	['A complete list of every library that the project imported at any point', 'Screenshots with no description of the method', 'Only the names of the models that were used'],
	'Evidence of measurement and honest limits shows real engineering. Library lists, bare screenshots or model names do not show how well it works.');
p.add('basic', 'lora', 'What is the idea of LoRA fine-tuning?',
	'Train small adapter matrices instead of updating all model weights',
	['Replace the model with a big lookup table of stored training examples', 'Train only the tokenizer on your own text', 'Delete the layers that your task does not use'],
	'LoRA freezes the base weights and learns small low-rank updates, which needs far less memory and storage. It does not swap in a table or edit the tokenizer.');

export const banks: { out: Question[] }[] = [a, e, g, v, s, m, w, p];
