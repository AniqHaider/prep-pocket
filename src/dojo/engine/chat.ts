// Context-aware tutor. Port of backend/app/chat.py: same prompts and the same "personal" context
// (current exercise, latest submission, solved list, recent mistakes), but the model call goes to a
// provider the user configures instead of the local `claude` CLI.
import { loadSettings, DEFAULT_MODELS, type TutorSettings } from '../../settings/settings';
import { getExercisePublic } from './content';
import { store } from './store';

const TUTOR_PROMPT =
	'You are a patient backend-engineering tutor for a learner who is a strong FRONTEND engineer but NEW to backend. ' +
	'Use a Socratic style: give hints, ask leading questions, and point out the learner\'s specific past mistakes shown in the context. ' +
	'DO NOT give the full solution to the current exercise outright; guide them to it. Be concise and encouraging. Define backend jargon when you use it.';

const EXPLAIN_PROMPT =
	'You are a clear backend-engineering teacher for a learner who is a strong FRONTEND engineer but NEW to backend. ' +
	'Explain concepts directly and concretely with small examples and analogies. Define every backend term you use. Be concise. ' +
	"It's fine to give direct answers to conceptual questions, but still avoid writing the complete solution to an active coding exercise unless explicitly asked.";

export const systemPromptFor = (mode: string) => (mode === 'explain' ? EXPLAIN_PROMPT : TUTOR_PROMPT);

export function buildContext(question: string, currentExerciseId: string | null): string {
	const parts: string[] = [];
	if (currentExerciseId) {
		try {
			const ex = getExercisePublic(currentExerciseId);
			const best = store.getExercise(currentExerciseId).best_code;
			parts.push('## Current exercise', `id: ${ex.id}`, `title: ${ex.title ?? ''}`, `prompt: ${ex.prompt_md ?? ''}`);
			if (best) parts.push("learner's latest submission:\n```\n" + best + '\n```');
		} catch {
			/* exercise vanished — skip */
		}
	}
	const solved = [...store.solvedIds()].sort();
	if (solved.length) parts.push('## Exercises already solved', solved.join(', '));
	const mistakes = store.recentMistakes(8);
	if (mistakes.length) {
		parts.push("## Learner's recent mistakes (most recent first)");
		for (const m of mistakes) parts.push(`- ${m.exercise_id}: ${m.error_category}` + (m.detail ? ` — ${m.detail}` : ''));
	}
	parts.push("## The learner's question", question);
	return parts.join('\n');
}

/** Reads a Server-Sent-Events body and yields each `data:` payload. */
async function* sse(res: Response): AsyncGenerator<string> {
	const reader = res.body!.getReader();
	const dec = new TextDecoder();
	let buf = '';
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		buf += dec.decode(value, { stream: true });
		let i: number;
		while ((i = buf.indexOf('\n')) >= 0) {
			const line = buf.slice(0, i).trim();
			buf = buf.slice(i + 1);
			if (line.startsWith('data:')) yield line.slice(5).trim();
		}
	}
}

async function fail(res: Response): Promise<never> {
	let body = '';
	try {
		body = (await res.text()).slice(0, 300);
	} catch {
		/* ignore */
	}
	throw new Error(`${res.status} ${res.statusText} ${body}`.trim());
}

async function* gemini(s: TutorSettings, system: string, user: string, signal?: AbortSignal) {
	const model = s.model || DEFAULT_MODELS.gemini;
	const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
		method: 'POST',
		signal,
		headers: { 'content-type': 'application/json', 'x-goog-api-key': s.apiKey },
		body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user }] }] })
	});
	if (!res.ok || !res.body) await fail(res);
	for await (const data of sse(res)) {
		try {
			const parts = JSON.parse(data)?.candidates?.[0]?.content?.parts ?? [];
			for (const p of parts) if (p.text) yield p.text as string;
		} catch {
			/* ignore keep-alives */
		}
	}
}

async function* anthropic(s: TutorSettings, system: string, user: string, signal?: AbortSignal) {
	const res = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		signal,
		headers: {
			'content-type': 'application/json',
			'x-api-key': s.apiKey,
			'anthropic-version': '2023-06-01',
			'anthropic-dangerous-direct-browser-access': 'true'
		},
		body: JSON.stringify({ model: s.model || DEFAULT_MODELS.anthropic, max_tokens: 1024, stream: true, system, messages: [{ role: 'user', content: user }] })
	});
	if (!res.ok || !res.body) await fail(res);
	for await (const data of sse(res)) {
		try {
			const j = JSON.parse(data);
			if (j.type === 'content_block_delta' && j.delta?.type === 'text_delta') yield j.delta.text as string;
		} catch {
			/* ignore */
		}
	}
}

async function* openaiCompatible(s: TutorSettings, system: string, user: string, signal?: AbortSignal) {
	const base = (s.baseUrl || 'http://localhost:11434/v1').replace(/\/+$/, '');
	const res = await fetch(`${base}/chat/completions`, {
		method: 'POST',
		signal,
		headers: { 'content-type': 'application/json', ...(s.apiKey ? { authorization: `Bearer ${s.apiKey}` } : {}) },
		body: JSON.stringify({ model: s.model || DEFAULT_MODELS['openai-compatible'], stream: true, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] })
	});
	if (!res.ok || !res.body) await fail(res);
	for await (const data of sse(res)) {
		if (data === '[DONE]') return;
		try {
			const t = JSON.parse(data)?.choices?.[0]?.delta?.content;
			if (t) yield t as string;
		} catch {
			/* ignore */
		}
	}
}

/** Streams the tutor's answer; calls onChunk(fullTextSoFar) as text arrives and returns the full answer. */
export async function chatStream(question: string, mode: string, currentExerciseId: string | null, onChunk?: (full: string) => void, signal?: AbortSignal): Promise<string> {
	const s = loadSettings();
	if (s.provider === 'none') {
		const msg = '(No tutor is set up yet. Open **More → Tutor settings** and choose Gemini, Claude, or a local model such as Ollama.)';
		onChunk?.(msg);
		return msg;
	}
	if (s.provider !== 'openai-compatible' && !s.apiKey) {
		const msg = '(Add your API key in **More → Tutor settings** first.)';
		onChunk?.(msg);
		return msg;
	}
	const system = systemPromptFor(mode);
	const user = buildContext(question, currentExerciseId);
	const gen = s.provider === 'gemini' ? gemini(s, system, user, signal) : s.provider === 'anthropic' ? anthropic(s, system, user, signal) : openaiCompatible(s, system, user, signal);
	let full = '';
	try {
		for await (const chunk of gen) {
			full += chunk;
			onChunk?.(full);
		}
	} catch (e: any) {
		if (e?.name === 'AbortError') return full;
		const hint = s.provider === 'openai-compatible' ? ' — is the server reachable from the phone (same Wi-Fi, OLLAMA_HOST=0.0.0.0, OLLAMA_ORIGINS=*)?' : '';
		throw new Error(String(e?.message ?? e) + hint);
	}
	if (!full) {
		full = '(No response.)';
		onChunk?.(full);
	}
	return full;
}
