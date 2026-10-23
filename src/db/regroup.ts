import type { Question, TopicDef } from '../quiz/types';

/**
 * Re-uses an existing question bank (e.g. the React / Next.js / TypeScript bank in src/prep2/questions) as a quiz for a learn section:
 * keeps only questions whose original `topic` is `from`, and regroups them by `tag` into the section's own topic chips.
 * Tags that no group lists go to a group with id `other`. Question ids stay the same, so saved "missed" progress is unaffected.
 */
export function regroup(bank: Question[], from: string, groups: { id: string; label: string; tags: string[] }[]): { questions: Question[]; quizTopics: TopicDef[] } {
	const byTag = new Map<string, string>();
	for (const g of groups) for (const t of g.tags) byTag.set(t, g.id);
	const questions = bank.filter((q) => q.topic === from).map((q) => ({ ...q, topic: byTag.get(q.tag) ?? 'other' }));
	const used = new Set(questions.map((q) => q.topic));
	const quizTopics = groups.filter((g) => used.has(g.id)).map((g) => ({ id: g.id, label: g.label }));
	if (used.has('other') && !groups.some((g) => g.id === 'other')) quizTopics.push({ id: 'other', label: 'Other' });
	return { questions, quizTopics };
}
