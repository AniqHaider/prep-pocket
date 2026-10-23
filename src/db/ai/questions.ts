import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

// AI and agents quiz bank. Durable concepts only: no vendor model versions, prices or window sizes.
// One builder per topic; ids are re-assigned positionally at the bottom.
const t = (topic: string) => builder('AI', topic);

// ───────────────────────── how-llms-work ─────────────────────────
const hw = t('how-llms-work');

hw.add('basic', 'next-token',
	'At each step of generating text, what does a language model actually produce?',
	'A probability for every token in its vocabulary, from which one token is chosen',
	['The one correct next word, which it finds by looking it up in a table of facts stored inside its weights',
	 'A complete sentence that is then checked for grammar before the first word is shown',
	 'A search query that is sent to a database of known answers'],
	'The model scores every token in its vocabulary, one probability each, and a decoding rule picks one. The pick is appended and the process repeats. It does not look anything up in a table of facts, it does not write whole sentences in one go, and it does not query a database: it only predicts continuations.');

hw.add('basic', 'inference',
	'While you chat with a model (inference), what happens to its weights?',
	'They stay fixed; the model only predicts tokens from the text it is given',
	['They are updated a little after every message you send, so the model gradually learns about you and your project',
	 'They are rewritten overnight from all of the day\'s conversations',
	 'They are swapped for a smaller set to save memory while it replies'],
	'Training changes the weights; inference only reads them. A chat seems to remember you because the app resends the earlier messages in the prompt, not because anything inside the model changed. Weights are not updated live, rewritten overnight by the chat itself, or swapped during a reply.');

hw.add('basic', 'hallucination',
	'Why can a model give a confident answer that is false?',
	'It generates likely-sounding text; fluency is not the same as having checked the facts',
	['Because a separate fact-checking model attaches a confidence score to each answer and that checker sometimes fails',
	 'Because it always copies the first matching sentence from its training data word for word',
	 'Because it only answers after a web search, and the search results were wrong'],
	'A language model is trained to produce plausible continuations, so a smooth, assured style says nothing about truth. There is no built-in fact checker, it does not copy matching sentences verbatim, and it does not search the web unless a harness gives it a search tool. That is why grounding and verification matter.');

hw.add('mid', 'temperature',
	'What does lowering the temperature do when a token is sampled?',
	'It concentrates probability on the top tokens, so output is steadier and more repeatable',
	['It makes the model think longer before answering, which improves accuracy on hard questions',
	 'It switches the model to a smaller, cheaper set of weights',
	 'It raises the chance of rare tokens so answers become more creative'],
	'Temperature rescales the probabilities before the draw. Low values sharpen the curve toward the likeliest token; high values flatten it so unlikely tokens get chances. It does not add reasoning time, change the weights or model size, and the creative, wandering behaviour comes from raising it, not lowering it.');

hw.add('mid', 'top-p',
	'What is top-p (nucleus) sampling?',
	'Drawing only from the smallest set of top tokens whose probabilities add up to p',
	['Always taking the single most likely token, which is the same as greedy decoding in every case',
	 'Choosing from exactly the p most likely tokens, where p is a count such as 40',
	 'Removing the p percent of tokens that already appeared earlier in the text'],
	'Top-p keeps the smallest group of the likeliest tokens whose chances sum to p (for example 0.9) and ignores the long tail. Always taking the top token is greedy decoding. A fixed count of candidates is top-k, a different knob. Removing repeated tokens is a repetition penalty, not top-p.');

// ───────────────────────── tokens-and-context ─────────────────────────
const tc = t('tokens-and-context');

tc.add('basic', 'tokens',
	'In the context of language models, what is a token?',
	'A piece of text from the model\'s vocabulary, often a word or part of a word',
	['Always exactly one character, so a 10 letter word is always ten tokens',
	 'Always exactly one whole word, so tokens and words are the same thing in every language',
	 'A secret key that authorises a single request to a model provider'],
	'Tokenizers cut text into frequent pieces: common words are often one token, rare words and code split into several. It is neither a single character nor always a whole word, and it has nothing to do with authentication keys. Limits and prices are counted in these pieces.');

tc.add('basic', 'context-window',
	'What has to fit inside the context window for one request?',
	'The whole prompt (instructions, history, documents, tool results) plus the reply being generated',
	['Only the user\'s latest message',
	 'Only the system prompt and any documents, since the model\'s own reply is counted separately and has no limit',
	 'Only the text the user typed during the current session'],
	'The window is the total token budget for a request: everything the model reads, and the tokens it writes, share it. Dropping the history, ignoring the reply, or counting only what the user typed all undercount. Anything that does not fit is cut or the request fails.');

tc.add('basic', 'no-memory',
	'Why does a chat app resend the earlier conversation with every new message?',
	'The model keeps no memory between requests, so the history has to be in the prompt',
	['To let the model re-learn the conversation by updating its weights each time',
	 'Because the provider erases each request after answering it and must be given the text again before it can be billed',
	 'To check whether the user has quietly edited their earlier messages'],
	'Each request is independent: the model only sees what is in the prompt. Resending the history is how a conversation feels continuous. The weights are not updated by this, and the resending is not for billing or tamper checks.');

tc.add('mid', 'tokenizer-differences',
	'The same paragraph is sent to two different models. What can differ between them?',
	'The token count, and so the cost and how much of the window it uses',
	['The meaning of the paragraph, because each tokenizer translates it into its own language',
	 'The number of characters in the paragraph, since tokenizers rewrite spelling',
	 'Nothing, because every model splits text into tokens in exactly the same way'],
	'Different models use different tokenizers, so identical text can become different numbers of tokens, which changes both the price and the share of the context window used. Tokenizing does not translate meaning or change the characters, and there is no universal tokenizer.');

tc.add('advanced', 'long-context',
	'A key detail sits in the middle of a very long prompt and the model overlooks it. Which explanation is most plausible?',
	'Attention over very long input is imperfect, so details in the middle can be overlooked',
	['The window silently deletes the middle of any prompt longer than a few pages',
	 'The model reads only the first and last token of every message',
	 'Documents inside prompts are ignored unless they were uploaded as separate files'],
	'Fitting in the window does not guarantee equal use of every part: models can pay less attention to material buried in long input, so important facts are better placed prominently or retrieved on demand. Nothing is silently deleted when it fits, models read all tokens, and pasted text counts like any other.');

// ───────────────────────── prompting ─────────────────────────
const pr = t('prompting');

pr.add('basic', 'system-message',
	'Where do stable rules and a persona usually belong in a chat request?',
	'In the system message',
	['In every user message, copied word for word each turn so the model cannot forget them',
	 'In the assistant\'s previous reply',
	 'In the tool results'],
	'The system message is the place for rules and persona that apply to the whole conversation, and models give it high priority. Repeating them in every user message wastes tokens, and neither earlier assistant text nor tool results are meant to carry your standing instructions.');

pr.add('basic', 'few-shot',
	'What is a few-shot prompt?',
	'A prompt that includes a few worked examples of input and output',
	['A prompt limited to a handful of words',
	 'A prompt sent to a few different models at once so their answers can be compared',
	 'A prompt that the model may answer in at most a few tokens'],
	'Few-shot prompting shows the model examples of the task, which teaches format and style better than a long description. It says nothing about prompt length, sending to several models, or limiting the answer.');

pr.add('mid', 'structured-output',
	'You ask for JSON and the model returns text that does not parse. What is the right reaction in your code?',
	'Treat it as a normal failure: validate, then retry or repair, because a prompt does not guarantee format',
	['Decide the model is broken and stop using it for any structured output',
	 'Parse it with a looser parser and trust whatever fields turn up in the text, then move on to the next request',
	 'Delete the system message, since it is what causes invalid JSON'],
	'Output format is a request, not a guarantee, so production code validates and retries or repairs, and may use a schema-guided output mode. Abandoning structured output over one failure is an overreaction, trusting loosely parsed fields invites bugs, and the system message is not the cause.');

pr.add('mid', 'not-found',
	'What does adding "if the answer is not in the text, say not found" to a prompt mainly help with?',
	'It gives the model a safe way out, which reduces invented answers',
	['It makes the model run faster',
	 'It forces the model to read the whole document before replying',
	 'It guarantees the model will never make something up'],
	'Without an exit, a model tends to produce some answer even when the source is silent. Offering "not found" reduces that but cannot eliminate it. The sentence does not affect speed, and it cannot force the model to read every part of the text.');

pr.add('advanced', 'untrusted-system',
	'Why is it a bad idea to paste untrusted user text into the system message?',
	'The system message carries the most authority, so injected instructions there are more likely to be obeyed',
	['System messages are billed at a higher rate for the rest of the conversation, unlike user messages, which are billed once',
	 'The model refuses to read user text when it appears inside a system message',
	 'System messages cannot be longer than a short sentence'],
	'Models usually weight the system message above user text, so smuggling instructions into it hands an attacker the strongest position. It is not about billing, the model does not refuse to read it, and system messages can be long.');

// ───────────────────────── embeddings-and-search ─────────────────────────
const em = t('embeddings-and-search');

em.add('basic', 'definition',
	'What is an embedding?',
	'A list of numbers that represents the meaning of a piece of text',
	['A compressed copy of the original text that can be unpacked back to the exact words',
	 'A keyword index built from every word that appears in a document',
	 'A hash that is the same only when two texts are word-for-word identical'],
	'An embedding model maps text to a vector so that similar meanings sit near each other. It cannot be decompressed to the original wording, it is not a keyword index, and unlike a hash, similar (not just identical) texts get similar vectors.');

em.add('basic', 'cosine',
	'What does a high cosine similarity between two embedding vectors suggest?',
	'The two texts have similar meaning',
	['The two texts contain the same number of words',
	 'The two texts were written by the same author on the same day',
	 'The two texts are word-for-word identical'],
	'Cosine similarity measures how closely two vectors point in the same direction, which for embeddings reflects similarity of meaning. It does not measure word count or authorship, and similar vectors do not require identical wording.');

em.add('mid', 'semantic-search',
	'Why can embedding search find a document about "young dog care" for the query "puppy tips"?',
	'Embeddings place texts with similar meaning near each other, even without shared words',
	['The search engine silently expands every query with a built-in thesaurus of synonyms',
	 'Embedding search first translates each text into its most common synonym',
	 'Both texts are stored in the same hash bucket'],
	'Embeddings capture meaning, so a query and a document can be close in vector space with no words in common. It is not a thesaurus expansion or a synonym translation step, and hash buckets are about exact identity, not similarity.');

em.add('mid', 'model-mixing',
	'You switch to a different embedding model for new documents but keep the old vectors in the same index. What goes wrong?',
	'Vectors from different models are not comparable, so similarity scores become meaningless',
	['Nothing, because every embedding model produces vectors in one shared space',
	 'Only the speed changes, since search simply takes a little longer',
	 'The index deletes the old vectors automatically to make space'],
	'Each embedding model has its own space, so distances between vectors from different models carry no meaning. The query and all documents must come from the same model, which means re-embedding everything when you change it. Nothing deletes old vectors for you.');

em.add('advanced', 'ann',
	'Why do vector databases usually use approximate nearest-neighbour search?',
	'Exact search over millions of vectors is slow, so they trade a little accuracy for a large speed gain',
	['Exact nearest-neighbour search is mathematically impossible for vectors with more than three dimensions',
	 'Approximate search always returns better matches than exact search',
	 'Embeddings are too imprecise for an exact comparison to mean anything'],
	'Exact search compares the query to every vector, which gets slow at scale; approximate indexes skip most comparisons and occasionally miss a true neighbour. Exact search is possible in any dimension, approximate search is never better than exact, and embeddings are precise enough for exact comparison.');

// ───────────────────────── rag ─────────────────────────
const rg = t('rag');

rg.add('basic', 'purpose',
	'What problem does retrieval-augmented generation (RAG) mainly solve?',
	'Giving a model facts it was not trained on, or that change, at request time',
	['Making the model\'s weights larger so it can store more facts',
	 'Making answers faster by skipping the prompt entirely',
	 'Removing the need for a context window'],
	'RAG fetches relevant text at request time and puts it in the prompt, so the model can use private or fresh information without retraining. It does not change the weights or the model size, it makes the prompt longer rather than skipping it, and the context window still applies.');

rg.add('mid', 'pipeline',
	'Which steps happen when a question arrives in a typical RAG pipeline?',
	'Embed the question, retrieve the closest chunks, build a prompt with them, then generate',
	['Retrain the model on the question, then generate the answer',
	 'Generate an answer first, then search for a document that happens to match it and quote it afterwards',
	 'Copy the whole document store into the prompt and let the model pick'],
	'The usual order is embed, retrieve, assemble the prompt with the chunks and rules, then generate, ideally with citations. Retraining per question is far too slow, generating first defeats the grounding, and pasting everything would not fit the window and would bury the facts.');

rg.add('mid', 'stale-answer',
	'A RAG answer confidently quotes an outdated policy. What is the most likely cause?',
	'The outdated document was retrieved, because the index holds stale content or ranked it first',
	['The model\'s weights were damaged by the retrieval step',
	 'The embedding vectors have too many dimensions',
	 'The model refused to read the newer document because it was shorter than the old policy page it replaced'],
	'Models answer from what is in their context, so an old chunk in the prompt produces an old answer. The fix is on the retrieval side: remove stale documents, filter by date, rerank. Retrieval does not damage weights, dimension count is not the cause, and models do not skip text for being short.');

rg.add('advanced', 'overlap',
	'Why do retrieval pipelines often split documents into overlapping chunks?',
	'A fact can straddle a chunk boundary, and overlap keeps both sides together in at least one chunk',
	['Overlap makes embeddings more accurate by repeating each word twice',
	 'The context window requires every chunk to share text with the next one, otherwise the request is rejected',
	 'Overlap lets the model skip the retrieval step'],
	'If a sentence is cut in half at a boundary, neither half may match the question well; overlapping chunks make sure a complete statement appears intact somewhere. Overlap does not improve embeddings by repetition, no window rule demands it, and it does not remove retrieval.');

rg.add('advanced', 'rerank',
	'Retrieval returns five chunks, but the passage the user needs is only the sixth most similar. Which change most directly helps?',
	'Retrieve a larger candidate set and rerank it with a stronger model before keeping the best few',
	['Raise the temperature so the model can guess the missing passage from the five chunks it was given',
	 'Shrink every chunk to a single sentence regardless of topic',
	 'Delete the instruction to answer only from the sources'],
	'A first-pass vector search is fast but rough; fetching more candidates and reranking them with a better scorer pulls the right passage into the top few. A higher temperature invites guessing, tiny chunks lose context, and removing the grounding rule makes hallucination more likely, not less.');

// ───────────────────────── tool-use ─────────────────────────
const tu = t('tool-use');

tu.add('basic', 'who-runs',
	'With ordinary function calling, where you define the functions, who runs your function?',
	'Your own code (the harness), after the model proposes the call',
	['The model itself, from inside its weights, while it writes the reply',
	 'The model\'s runtime, as a side effect of generating the call text',
	 'The user\'s browser, as soon as the reply arrives'],
	'The model only writes a structured request. Your harness validates it, runs the real function and returns the result. The model has no way to execute code by writing text, the call text alone triggers nothing, and the browser is not involved.');

tu.add('basic', 'call-format',
	'What does the model\'s output look like when it wants to use a tool?',
	'Structured text naming the tool and its arguments',
	['A binary signal that triggers the function directly',
	 'A change to its own weights that adds the function permanently',
	 'A picture of the function\'s source code'],
	'A tool call is ordinary output: usually JSON naming a tool and giving arguments, which the harness parses. It is not a binary trigger, it does not alter weights, and it is not an image.');

tu.add('mid', 'validation',
	'Why should a harness validate a tool call\'s arguments before running it?',
	'The model can produce wrong types, missing fields or unsafe values, so its output is untrusted input',
	['Validation makes the model more accurate on later turns',
	 'Providers reject any call whose arguments were not validated by the client before it reaches their servers',
	 'Arguments are always correct when the tool schema is well written'],
	'A schema guides the model but cannot guarantee a correct call, and a fooled or confused model can request something harmful, so checks belong in code. Validation does not retrain the model, providers do not demand it, and even a perfect schema does not guarantee valid arguments.');

tu.add('mid', 'result-size',
	'A tool returns a 4 MB blob of JSON. What should the harness usually do before giving it to the model?',
	'Trim or summarise it to what is useful, because tool results consume context',
	['Send all of it, because more data always produces better answers',
	 'Hide it from the model and show it only to the user',
	 'Turn it into an image so it uses fewer tokens'],
	'Everything in a tool result takes up window space and attention, so a harness should pass back only the relevant part, or a summary with a way to fetch more. Sending everything can overflow the window and bury the facts, hiding it defeats the point, and images are not cheaper.');

tu.add('advanced', 'error-messages',
	'A tool call fails. Which result gives the model the best chance of recovering on the next step?',
	'A short, specific message saying what failed and what could be tried instead',
	['An empty result, so the model concludes there was nothing to find',
	 'The complete server stack trace, including internal paths and credentials, so the model has maximum detail',
	 'No result at all, leaving the model\'s request unanswered'],
	'Error text is read by the model, so a clear, actionable message lets it adjust arguments or try another tool. An empty result misleads it, a raw stack trace is noisy and can leak secrets, and an unanswered request breaks the protocol of the conversation.');

// ───────────────────────── agent-loop ─────────────────────────
const al = t('agent-loop');

al.add('basic', 'definition',
	'What is an AI agent, in the usual engineering sense?',
	'A loop in which a model repeatedly chooses actions, the harness runs them, and the results feed back in',
	['A model that has more parameters than an ordinary chatbot and can therefore call a few more tools at once',
	 'A model that has been fine-tuned on the user\'s own email',
	 'Any program that calls a language model one time'],
	'What makes something an agent is the loop: decide, act, observe, repeat towards a goal. Size, fine-tuning on personal data, and a single call to a model are not what define it.');

al.add('basic', 'budget',
	'Why give an agent a step or cost budget?',
	'To stop a loop that is not making progress from running, and billing, indefinitely',
	['To make each individual step more accurate',
	 'To keep the model\'s weights from drifting during long runs',
	 'Because models cannot produce more than a fixed number of tokens in total over their lifetime'],
	'A budget is a safety limit on the loop: if the task cannot be solved, the agent stops instead of trying for ever. It does not improve accuracy, weights do not drift during use, and there is no fixed lifetime token cap.');

al.add('mid', 'feedback',
	'Which feedback makes a coding agent most effective at fixing a bug?',
	'Real results from tools, such as failing test output and error messages',
	['A longer prompt that repeats the goal in more detail on every step',
	 'A higher temperature so it tries more varied code each time',
	 'Hiding the test results so it cannot overfit to them'],
	'Agents improve when each action returns real evidence: test output, compiler errors, file contents. More repetition of the goal adds little, extra randomness is not a strategy, and hiding results removes the very signal the loop needs.');

al.add('mid', 'compounding',
	'Why do mistakes tend to compound in a long agent run?',
	'Each step\'s output becomes input for later steps, so an early wrong step shapes everything after it',
	['Models get tired after many tokens and become gradually less accurate, much like a person on a long shift',
	 'The weights degrade slightly every time a tool is called',
	 'Every tool call randomly changes the model\'s goal'],
	'In a loop, an early error enters the context and influences later decisions, so small mistakes can grow. Models do not tire, tool calls do not alter weights, and goals only change if the context changes them.');

al.add('advanced', 'stuck',
	'An agent has repeated the same failing action for ten steps. Which harness response is best?',
	'Detect the repeated pattern, stop or change strategy, and report that it is stuck',
	['Raise the step budget so it gets more attempts at the same action',
	 'Remove the failed action from the log so the model forgets it happened and tries something else',
	 'Set the temperature to 0 so it stops varying its behaviour'],
	'Spotting loops and stopping or redirecting is the harness\'s job; more attempts at the same action just burn budget. Erasing the failure removes the evidence that should change the plan, and temperature 0 makes repetition more likely, not less.');

// ───────────────────────── harness ─────────────────────────
const hn = t('harness');

hn.add('basic', 'definition',
	'What is the harness in an AI agent system?',
	'The code around the model that builds context, runs tools, enforces permissions and manages limits',
	['The cloud hardware that the model runs on',
	 'The set of weights that makes the model follow instructions, loaded from disk at the start of each request',
	 'The user interface that displays the chat'],
	'The harness is software: it decides what the model sees, executes the tools it asks for, checks permissions, applies limits and logs the run. Hardware, weights and the chat UI are different things.');

hn.add('mid', 'enforcement',
	'Where should the rule "never delete files without asking" be enforced?',
	'In the harness, by requiring approval before the delete tool runs',
	['In the system prompt alone, written in capital letters so it is followed',
	 'In the model\'s weights, through extra training for every user',
	 'In a log file that the model reads at the start of each turn'],
	'Text rules can be ignored or overridden by confused or manipulated models, while a check in code cannot be talked out of running. Weights cannot be retrained per user for each rule, and a log file is not an enforcement mechanism.');

hn.add('mid', 'same-model',
	'Two products use the same model, but one solves tasks far more reliably. What is a likely reason?',
	'Its harness provides better tools, context management and feedback',
	['One of them secretly runs a bigger set of weights at inference time',
	 'One product sets a larger context window in its user interface',
	 'Models give better answers to products that have more users'],
	'Much of an agent\'s practical quality comes from the harness: which tools exist, what context is assembled, how errors are fed back. Hidden extra weights, a UI setting for the window and user counts do not explain a same-model difference.');

hn.add('advanced', 'rejected-call',
	'A tool call is rejected by a permission rule. What should the harness do?',
	'Return a clear "not allowed" result to the model so it can choose another path, and log it',
	['Run the call anyway and note the rejection in the log',
	 'End the whole conversation immediately',
	 'Quietly swap in a different tool without telling the model so the whole run can carry on smoothly'],
	'Telling the model what happened lets it adapt, and logging gives you an audit trail. Running the call defeats the rule, ending the session throws away useful work, and silently substituting a tool leaves the model with a false picture of what occurred.');

hn.add('advanced', 'logging',
	'Why should a harness log every model request and tool call?',
	'So behaviour can be debugged, audited and replayed when something goes wrong',
	['Because providers require the logs to be sent back to improve the model',
	 'Because the model needs the log file as its only memory',
	 'To make the next request cheaper through caching'],
	'Traces turn an opaque failure into something you can inspect and reproduce, and they support audits. Providers do not require your logs, the model does not read them as memory unless you choose to feed them in, and logging does not create cache hits.');

// ───────────────────────── context-engineering ─────────────────────────
const ce = t('context-engineering');

ce.add('basic', 'definition',
	'What is context engineering?',
	'Deciding what goes into the model\'s limited context window and keeping it useful',
	['Training the model on new documents so it knows more',
	 'Compressing the model\'s weights so it fits on a phone',
	 'Choosing the colours and layout of the chat window'],
	'Context engineering is about the prompt-side information: what to include, in what order, and how to shrink or fetch it as a task grows. Training, weight compression and UI design are different jobs.');

ce.add('mid', 'compaction',
	'A conversation is nearly out of context. What does compaction do?',
	'It replaces older turns with a shorter summary and keeps the recent turns intact',
	['It deletes the system prompt to make room for the history',
	 'It raises the model\'s context limit for the rest of the session',
	 'It zips the text so the model can read it in compressed form'],
	'Compaction summarises the old part of the conversation to free space while keeping the newest material verbatim. It should not drop the instructions, it cannot raise a model\'s fixed limit, and models cannot read zipped text.');

ce.add('mid', 'notes',
	'Why keep a plan and key decisions in a notes file outside the chat?',
	'It survives compaction and can be reloaded exactly, unlike details inside a summary',
	['The model can read files but never chat messages',
	 'Reloading a notes file uses no tokens, so it is free',
	 'Providers store notes files permanently inside the model\'s weights after each session ends'],
	'A notes file is durable, exact memory that the harness can load into each turn, so important facts do not depend on a lossy summary. Models read chat text fine, loaded notes do consume tokens, and nothing is written into weights.');

ce.add('advanced', 'sub-agent',
	'Why can a sub-agent help with a task that involves reading forty files?',
	'It does the reading in its own context and returns only a short summary, keeping the main context small',
	['Sub-agents have unlimited context windows, so nothing the main agent sends them is ever cut off, however long it is',
	 'Reading files inside a sub-agent costs no tokens',
	 'The main agent is unable to read files at all'],
	'Isolating noisy work in a separate context keeps the main conversation focused; only the findings come back. Sub-agents have the same kind of limits, their reading still costs tokens, and a main agent can read files perfectly well.');

ce.add('advanced', 'summary-risk',
	'What is the main risk of replacing old turns with a model-written summary?',
	'Important details, such as exact names, errors or decisions, may be lost or distorted',
	['Summaries are always longer than the turns they replace',
	 'The model can no longer read any text after a summary appears',
	 'A summary permanently lowers the model\'s accuracy on all later tasks even in unrelated conversations'],
	'Summaries are lossy, and a detail that mattered later (a file path, an error string, a decision) may not survive, which is why harnesses keep such facts in notes. Summaries are shorter by design, the model reads text normally afterwards, and the effect is on that conversation only.');

// ───────────────────────── mcp ─────────────────────────
const mc = t('mcp');

mc.add('basic', 'definition',
	'What is the Model Context Protocol (MCP)?',
	'An open standard for connecting AI applications to tools and data through servers',
	['A file format for storing model weights',
	 'A prompt template that every language model is required to follow before it is allowed to answer',
	 'A training method that teaches models how to use tools'],
	'MCP standardises how AI applications discover and use tools, data and prompts offered by servers. It is not a weights format, a mandatory prompt template, or a training method.');

mc.add('basic', 'host',
	'In MCP, what is the host?',
	'The AI application, which creates a client for each server it connects to',
	['The remote machine that runs an MCP server',
	 'The language model itself',
	 'A database that stores the descriptions of all available tools'],
	'The host is the AI application (such as a coding assistant). It runs one MCP client per server, each with a dedicated connection. A server is where the tools live, and the model is separate from both.');

mc.add('mid', 'transports',
	'Which transports does MCP define?',
	'Stdio for local servers and Streamable HTTP for remote servers',
	['Only WebSockets, for every kind of server',
	 'Only email and message queues',
	 'Only a shared file on disk that both sides poll'],
	'Local servers typically talk over standard input and output; remote servers use Streamable HTTP, with normal HTTP authentication. The other options are not MCP transports.');

mc.add('mid', 'primitives',
	'What three kinds of thing can an MCP server expose?',
	'Tools, resources and prompts',
	['Models, weights and tokens',
	 'Agents, workers and harnesses',
	 'Embeddings, indexes and chunks'],
	'Tools are functions the model can call, resources are data the application can read as context, and prompts are reusable templates. The others are concepts from elsewhere in AI, not MCP primitives.');

mc.add('advanced', 'server-trust',
	'An MCP server you found online describes its tools in text the model will read. Why is that a security concern?',
	'Its descriptions and results enter the model\'s context, so a malicious server can inject instructions',
	['MCP servers can read the model\'s weights directly',
	 'Any server you connect to automatically receives all of your API keys and can use them for any purpose it likes',
	 'JSON-RPC messages can never be secured, so every server is unsafe'],
	'Whatever a server returns becomes text in the model\'s context, so an untrusted server is a channel for prompt injection; connect only to servers you trust and keep permissions narrow. Servers do not touch weights, keys are not shared by default, and transports can be secured.');

// ───────────────────────── multi-agent-patterns ─────────────────────────
const ma = t('multi-agent-patterns');

ma.add('basic', 'orchestrator',
	'In the orchestrator-workers pattern, what does the orchestrator do?',
	'It breaks the job into parts, hands them to workers, and merges the results',
	['It runs every tool call itself while the workers only watch',
	 'It trains the workers on the task before they begin',
	 'It votes on which worker produced the longest answer'],
	'The orchestrator plans and delegates, then combines what the workers return. Workers do the sub-tasks; nothing is trained, and answer length is not the criterion.');

ma.add('mid', 'worker-context',
	'What is a real advantage of giving each worker agent its own context?',
	'Each stays small and focused, and independent parts can run in parallel',
	['Workers share one memory, so they can never disagree',
	 'It removes the need for a harness',
	 'It makes every worker\'s answer correct by construction'],
	'Separate contexts keep each worker uncluttered and let independent work run at the same time. Separate contexts mean separate memories, a harness is still needed, and nothing guarantees correctness.');

ma.add('advanced', 'when-single',
	'When is a single agent usually a better choice than several?',
	'When the task is small, sequential or tightly coupled, so coordination would cost more than it gains',
	['When the task needs more than one tool',
	 'When you want the answer to be more creative, because separate agents add variety to the wording of each reply',
	 'Whenever the model supports tool use'],
	'Several agents add calls, tokens and coordination, which pays off only when parts are independent or large. Needing multiple tools, wanting creativity or supporting tool use does not call for more agents.');

ma.add('advanced', 'new-problems',
	'What new problem do multi-agent systems add that one agent does not have?',
	'Errors and misunderstandings can pass between agents, and coordination adds cost and debugging effort',
	['They cannot use tools safely',
	 'They always need a larger context window than a single agent, since every agent must hold the whole conversation',
	 'They require every agent to run on a different model'],
	'Handoffs create places for information to be lost or distorted, and more calls make runs costlier and harder to trace. Tool safety is not inherently worse, windows are per agent, and agents may use the same model.');

ma.add('advanced', 'shared-blind-spots',
	'A writer agent and a reviewer agent both run the same model with similar prompts. What is a risk of that setup?',
	'They may share the same blind spots, so the review can miss what the writer missed',
	['The reviewer will always reject the writer\'s work',
	 'They will refuse to communicate with each other',
	 'The harness will be unable to tell their messages apart and will merge them into one reply'],
	'Agents built from the same model tend to make correlated mistakes, so a self-review is weaker than an independent check such as tests or a different method. The other outcomes are not caused by sharing a model.');

// ───────────────────────── evals ─────────────────────────
const ev = t('evals');

ev.add('basic', 'definition',
	'What is an eval for an AI feature?',
	'A repeatable set of test cases with a way to grade the outputs',
	['A one-time survey of what users think of the feature',
	 'A benchmark that only the model provider is allowed to run',
	 'A tool that retrains the model on its own mistakes'],
	'An eval is a test suite for model behaviour: fixed inputs, a grading method, and a score you can compare over time. It is not a survey, a provider-only benchmark, or a training tool.');

ev.add('mid', 'average-trap',
	'A prompt change raises the average eval score from 60% to 70%. What should you still do?',
	'Check each case, because one important case may have regressed while the average rose',
	['Nothing; a higher average means every case improved, so there is nothing left to inspect',
	 'Look only at the cases that were already passing',
	 'Delete the test set now that the score is higher'],
	'Averages hide movement: some cases can get worse while others improve more. Inspect per-case changes, including newly failing ones, and keep the test set for next time.');

ev.add('mid', 'llm-judge',
	'What is a known weakness of using a model as a judge?',
	'Judges can be noisy and biased, for example favouring longer answers, so they need checking against human labels',
	['Judges can only grade answers shorter than ten words',
	 'Judges cannot read text, only numbers',
	 'Judges are fully deterministic, which hides real variation, so repeated runs always give the same verdict regardless of wording'],
	'Model judges are convenient but imperfect: they vary, and have biases such as preferring verbose answers, so calibrate them with human review. They can grade long text and read text, and they are not perfectly deterministic.');

ev.add('mid', 'failure-set',
	'Why add every real production failure to your eval set?',
	'So the same failure is caught automatically if it ever comes back',
	['To make the set bigger so the score looks better',
	 'Because an eval must contain at least a thousand cases',
	 'To retrain the model on exactly those cases'],
	'Turning each real failure into a test builds a regression suite that protects against repeats. Size for its own sake, a fixed minimum, and training on the test cases (which would invalidate it) are not the reason.');

ev.add('advanced', 'small-set',
	'Your eval set has only twelve cases. What risk does that create when comparing two prompts?',
	'A difference of a case or two can be luck, so a small gap is weak evidence',
	['Small sets are always biased towards the newer prompt, because testers write cases after the change',
	 'Twelve cases cannot be graded by a model',
	 'The comparison will always show the prompts as equal'],
	'With few cases, one flipped result moves the score a lot and may be noise, so grow the set and look at which cases changed. Small sets are not systematically biased towards new prompts, can be graded, and do not force a tie.');

// ───────────────────────── safety-and-guardrails ─────────────────────────
const sg = t('safety-and-guardrails');

sg.add('basic', 'injection',
	'What is prompt injection?',
	'Instructions hidden in data the model reads, aiming to make it do something unintended',
	['Adding extra examples to a prompt to improve accuracy',
	 'Sending so many prompts at once that the server slows down and legitimate users cannot connect',
	 'Editing the model\'s weights by writing a prompt'],
	'Prompt injection puts instructions in content the model processes, such as a web page or email, hoping it will follow them. Adding examples is ordinary prompting, flooding is a different attack, and prompts cannot edit weights.');

sg.add('basic', 'least-privilege',
	'What does least privilege mean for an agent?',
	'Give a task only the tools and permissions it actually needs',
	['Use the smallest model available for every task',
	 'Allow every tool but record each call in a log',
	 'Let the agent decide for itself which permissions to hold'],
	'Least privilege limits what a fooled or mistaken agent can do by granting only what the task requires. Model size, logging alone, and self-granted permissions do not provide that protection.');

sg.add('mid', 'summariser-design',
	'An agent summarises web pages. Which design limits the damage from prompt injection best?',
	'Give it no send or delete tools at all, and require approval for anything with side effects',
	['Add "ignore hidden instructions" to the system prompt and keep every tool enabled for maximum flexibility',
	 'Strip every sentence containing the word "ignore" from fetched pages',
	 'Run it at temperature 0 so it cannot be persuaded'],
	'Removing dangerous capabilities limits what even a fooled model can do, and approvals catch much of the rest; no defence is complete, so layers matter. A prompt request, a keyword strip and a temperature setting are all easy to bypass and leave the dangerous tools in place.');

sg.add('mid', 'blocklists',
	'Why is a keyword blocklist an unreliable defence against prompt injection?',
	'Attackers can rephrase or disguise the instruction, so the filter misses it',
	['Blocklists make the model slower than a human reviewer',
	 'Blocklists only work on text longer than a paragraph',
	 'Models ignore any text that has passed through a filter'],
	'Natural language has endless ways to say the same thing, so a fixed list of phrases is easy to evade. Speed, text length and model behaviour after filtering are not the issue.');

sg.add('advanced', 'secrets',
	'Which practice best reduces the harm if an agent leaks its context?',
	'Keep secrets such as API keys out of the model\'s context and use them only inside tools',
	['Tell the model in the prompt never to reveal its secrets',
	 'Put the keys in the system message, which users cannot see, so the model alone can use them',
	 'Encode the keys in base64 inside the prompt'],
	'What the model never sees it cannot leak: tools can hold credentials and attach them to requests. Instructions not to reveal secrets can be overridden, a hidden system message can still be extracted, and base64 is encoding, not protection.');

// ───────────────────────── cost-latency-caching ─────────────────────────
const cl = t('cost-latency-caching');

cl.add('basic', 'cost-drivers',
	'What mainly drives the cost of a language model request?',
	'The number of input tokens and the number of output tokens',
	['The number of words the user typed and the time of day',
	 'The number of tools defined and the number of other users online',
	 'The model\'s training date and the length of its name'],
	'Providers price by tokens read and tokens written, and long outputs also take longer. Time of day, other users, training dates and names are not the meter.');

cl.add('mid', 'cache-prefix',
	'Prompt caching reuses earlier work for which part of a prompt?',
	'A prefix that matches a recently seen prompt exactly, up to the first difference',
	['Any sentence that appears anywhere in the prompt, even if the surrounding text has changed completely',
	 'Only the user\'s most recent message',
	 'The model\'s reply from the previous request'],
	'Caching works on an unchanged beginning of the prompt: once the text differs, the rest has to be processed normally. Sentences in the middle, the latest user message or earlier replies are not what is cached.');

cl.add('mid', 'cache-order',
	'How should you order a prompt to benefit most from prompt caching?',
	'Stable content first and the changing question last',
	['The changing question first, so the model sees it clearly',
	 'Alphabetically by section name',
	 'Longest section first and shortest last'],
	'Because caching matches a shared prefix, putting rules, tool definitions and reference documents first and the new question at the end lets many requests share the same beginning. Putting the changing part first, or ordering by name or length, breaks that sharing.');

cl.add('mid', 'cache-breaker',
	'Which change is most likely to waste a prompt cache?',
	'Adding a timestamp or user name at the very top of every prompt',
	['Adding a new question at the end of the prompt',
	 'Keeping the tool definitions the same between requests and sending them in the same order',
	 'Reusing the same system message for every request'],
	'A value that changes at the top makes every prompt start differently, so no prefix is ever shared. A new question at the end, stable tool definitions and a reused system message all preserve a common prefix.');

cl.add('advanced', 'model-mix',
	'A pipeline has easy classification steps and one hard reasoning step. Which approach is usually the most cost-effective?',
	'Use a smaller, cheaper model for the easy steps and a larger one only for the hard step',
	['Use the largest model everywhere for consistency',
	 'Use the smallest model everywhere and accept the errors',
	 'Run every step three times on the largest model and average the results, then keep whichever answer appears most often'],
	'Matching model size to the difficulty of each step saves money and time while keeping quality where it matters. The largest model everywhere overspends, the smallest everywhere sacrifices the hard step, and triple runs multiply cost.');

// ───────────────────────── fine-tuning-vs-rag-vs-prompting ─────────────────────────
const ft = t('fine-tuning-vs-rag-vs-prompting');

ft.add('basic', 'facts',
	'Which situation points to retrieval (RAG) rather than fine-tuning?',
	'The model lacks facts that are private or change often',
	['The model needs a distinctive brand voice in every answer',
	 'You need the model to reply in one fixed output format every time',
	 'You want a smaller model to match a larger one on a narrow task'],
	'Retrieval supplies facts at request time and is easy to update by editing documents. Voice, fixed formats and distilling a smaller model are the kinds of behaviour changes where prompting and fine-tuning are the usual tools.');

ft.add('mid', 'first-try',
	'What is usually the first thing to try when a model\'s tone or format is wrong?',
	'A clearer prompt with a few examples',
	['Training a new model from scratch',
	 'Switching to retrieval over your documents',
	 'Fine-tuning on a thousand examples'],
	'Prompting is the cheapest and fastest lever and often enough. Training from scratch is enormously expensive, retrieval addresses missing facts, and fine-tuning is worth it only if prompting falls short.');

ft.add('advanced', 'changing-facts',
	'Why is fine-tuning a poor way to keep a model current with prices that change weekly?',
	'Every change would need new data and another training run, and the model can still recall old values',
	['Fine-tuning cannot change what a model says about numbers',
	 'A model forgets everything from pre-training once it is fine-tuned, so it must be re-taught basic grammar',
	 'Fine-tuning always makes a model slower at inference'],
	'Facts that change are better supplied at request time, where updating means editing a document. Fine-tuning can affect numbers, does not erase pre-training, and does not inherently slow inference.');

ft.add('advanced', 'narrow-volume',
	'A team needs consistent JSON in a narrow format across millions of requests with a long prompt. Which option is reasonable to evaluate?',
	'Fine-tune a smaller model on good examples and compare it with the prompted one using evals',
	['Fine-tune on last month\'s news articles',
	 'Turn off evals to save time',
	 'Keep adding instructions until the prompt reaches the window limit, then trim whatever does not fit'],
	'A narrow, high-volume task with a fixed format is a classic fit for fine-tuning a smaller model, as long as evals confirm it matches quality. News articles do not teach the format, skipping evals removes the evidence, and ever-longer prompts raise cost.');

ft.add('advanced', 'combining',
	'Which statement about combining prompting, retrieval and fine-tuning is true?',
	'A fine-tuned model can still use retrieval and a good prompt, and all of them need evals',
	['Once a model is fine-tuned, retrieval can no longer be used with it',
	 'Fine-tuning replaces the need for evals because it was trained on your data and therefore cannot regress',
	 'Prompting and retrieval cannot be used together'],
	'The techniques are complementary: fine-tuning shapes behaviour, retrieval supplies facts, prompts steer each request, and evals measure whether any of it helped. None of the other statements is true.');

// ───────────────────────── on-device-models ─────────────────────────
const od = t('on-device-models');

od.add('basic', 'benefit',
	'What is a main benefit of running a model on the device?',
	'It works offline and keeps the text on the device',
	['It is always more accurate than a server model of the same family',
	 'It has no limit on how long the input can be',
	 'It never makes mistakes on simple questions'],
	'On-device models run locally, so they need no connection and nothing is sent to a server. They are usually smaller and less capable, have context limits, and still make mistakes.');

od.add('basic', 'quantization',
	'What does quantization do?',
	'It stores each weight in fewer bits so the model needs less memory',
	['It adds more weights so the model can learn faster from each new conversation',
	 'It splits the model across several phones',
	 'It translates the model into another language'],
	'Quantization reduces the precision of the numbers that make up the model, shrinking its memory footprint at some cost in accuracy. It does not add weights, distribute the model, or translate anything.');

od.add('mid', 'size-maths',
	'Roughly how much memory do the weights of a 7-billion-parameter model need at 4 bits per weight?',
	'About 3.5 GB',
	['About 28 GB',
	 'About 350 megabytes',
	 'About 14 GB'],
	'Seven billion weights at half a byte each is about 3.5 GB. 28 GB is the figure at 32 bits, 14 GB at 16 bits, and 350 MB would need less than half a bit per weight.');

od.add('mid', 'real-size',
	'Why is a real 4-bit model file a little larger than parameters times half a byte?',
	'Some layers and metadata are kept at higher precision',
	['Quantized files include a copy of the training data',
	 'Every weight needs one extra byte to record its position',
	 'The phone adds padding to align the file with its screen'],
	'Quantization schemes typically keep sensitive parts (and some bookkeeping data) at higher precision, so files come out a bit bigger than the plain arithmetic. They do not contain training data, per-weight position bytes, or screen padding.');

od.add('mid', 'ram-use',
	'Besides the weights, what else uses memory when a model runs on a phone?',
	'The context (the KV cache) and the app itself',
	['The tokenizer\'s training corpus',
	 'A full copy of the model kept on the provider\'s server',
	 'Nothing: the weights are the only thing held in memory'],
	'While generating, the model keeps a cache of attention state for the tokens in the context, and the app and operating system need RAM too, so a model must be smaller than total memory. The other options are not loaded on the device.');

// ───────────────────────── assemble ─────────────────────────
const banks = [hw, tc, pr, em, rg, tu, al, hn, ce, mc, ma, ev, sg, cl, ft, od];
export const aiQuestions: Question[] = banks
	.flatMap((b) => b.out)
	.map((q, i) => ({ ...q, id: 'AI' + String(i + 1).padStart(2, '0') }));
