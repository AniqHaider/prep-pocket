// App-level study assistant: same model plumbing as the Backend lab tutor (runModel), but the prompt is
// general and the context is whatever the learner is currently looking at in any section.
import { runModel } from '../dojo/engine/chat';
import type { AppContext } from './context';

export interface Turn { role: 'you' | 'ai'; text: string }

const SYSTEM =
	'You are the study assistant inside Preppy, a phone app a software engineer uses to prepare for interviews. ' +
	'The app has: a Backend lab (Python + SQL), a Svelte + TypeScript quiz with theory scripts, a React + Next.js + TypeScript quiz ' +
	'(React 19, Next.js 15/16 App Router), and JS/TS coding drills. ' +
	'The learner is a strong frontend engineer. Answer questions about whatever they are looking at, or any programming topic they ask about. ' +
	'Be concise and concrete (short paragraphs, small code snippets, markdown). Use the "What the learner is looking at" context when it is relevant, ' +
	'and say so if the question is unrelated to it. If they are in the middle of a quiz question and have not answered yet, give a hint or explain the concept ' +
	'instead of revealing the answer, unless they explicitly ask for it. For a coding drill, guide them and avoid dumping the whole solution unless asked. ' +
	'If you are not sure about something version-specific, say so rather than guessing.';

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) + '\n…(trimmed)' : s);

/** Keeps the prompt inside the on-device model's 4096-token window (~3.5 chars/token). */
export function buildPrompt(question: string, ctx: AppContext | null, history: Turn[]): string {
	const parts: string[] = [];
	if (ctx) parts.push(`## What the learner is looking at (${ctx.label})`, clip(ctx.text, 2600));
	const recent = history.filter((t) => t.text && !t.text.startsWith('(')).slice(-6);
	if (recent.length) {
		parts.push('## Conversation so far');
		let used = 0;
		const lines: string[] = [];
		for (const t of [...recent].reverse()) {
			const line = `${t.role === 'you' ? 'Learner' : 'Assistant'}: ${clip(t.text, 700)}`;
			used += line.length;
			if (used > 2400) break;
			lines.unshift(line);
		}
		parts.push(lines.join('\n'));
	}
	parts.push('## The learner’s question', clip(question, 1500));
	return parts.join('\n');
}

export function askAssistant(question: string, ctx: AppContext | null, history: Turn[], onChunk?: (full: string) => void, signal?: AbortSignal) {
	return runModel(SYSTEM, buildPrompt(question, ctx, history), onChunk, signal);
}
