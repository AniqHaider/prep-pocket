// App-level study assistant: same model plumbing as the Backend lab tutor (runModel), but the prompt is
// general and the context is whatever the learner is currently looking at in any section. Before the model
// answers, the app looks the question up in Preppy's own notes (always, offline) and, if the learner turned it
// on, on the web, then hands the best passages to the model. A small model's memory ends at its training date;
// grounding is what lets it answer about newer things such as MCP.
import { runModel } from '../dojo/engine/chat';
import type { AppContext } from './context';
import { searchKnowledge, tokenize } from './knowledge';
import { isOnline, loadWebSettings, wantsFresh, webReady, webSearch, type WebHit } from './web';
import { buildPrompt, sourcesBlock, systemPrompt, type Grounding, type Turn } from './prompt';

export type { Turn };

export async function askAssistant(question: string, ctx: AppContext | null, history: Turn[], onChunk?: (full: string) => void, signal?: AbortSignal) {
	const notes = searchKnowledge(question);
	const web = loadWebSettings();
	let hits: WebHit[] = [];
	let webNote = '';
	// Only questions with a real subject are worth a search ("give me a hint" is not).
	const subject = tokenize(question).length > 0;
	if (subject && webReady(web) && (web.always || notes.hits.length === 0 || wantsFresh(question))) {
		if (!isOnline()) webNote = 'Web lookup skipped: no internet connection.';
		else {
			onChunk?.('(Searching the web…)');
			try {
				hits = await webSearch(question, web, signal);
				if (!hits.length) webNote = 'Web lookup found nothing useful.';
			} catch (e: any) {
				if (signal?.aborted) return '';
				webNote = `Web lookup failed (${String(e?.message ?? e).slice(0, 80)}).`;
			}
		}
	}
	const g: Grounding = { notes: notes.hits, web: hits };
	const system = systemPrompt({ context: !!ctx, notes: g.notes.length > 0, web: g.web.length > 0 });
	const full = await runModel(system, buildPrompt(question, ctx, history, g), onChunk, signal);
	const src = sourcesBlock(g, webNote);
	if (src && full && !full.startsWith('(')) {
		onChunk?.(full + src);
		return full + src;
	}
	return full;
}
