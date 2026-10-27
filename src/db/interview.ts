import type { LearnEngine } from './types';
import type { Question } from '../quiz/types';
import * as frontend from './interview/frontend';
import * as backend from './interview/backend';
import * as dataCloud from './interview/data-cloud';
import * as systemDesign from './interview/system-design';
import * as behavioral from './interview/behavioral';

const areas = [frontend, backend, dataCloud, systemDesign, behavioral];
// Each "**Q. ...** `SDE n`" line stands alone, so the question is not run into its answer.
const split = (notes: string) => notes.replace(/(\*\*Q\.[^\n]*?\*\*\s*`SDE [12]`)[ \t]*\n?(?!\n)/g, '$1\n\n');
const topics = areas.flatMap((a) => a.topics).map((t) => ({ ...t, notes: split(t.notes) }));
const questions: Question[] = areas
	.flatMap((a) => a.banks)
	.flatMap((b) => b.out)
	.map((q, i) => ({ ...q, id: 'IV' + String(i + 1).padStart(3, '0') }));

/** SDE 1 and SDE 2 interview prep: model answers by topic, a quiz, and runnable exercises. Level: basic = SDE 1 core, mid = SDE 1 to 2, advanced = SDE 2. */
export const interview: LearnEngine = {
	id: 'interview',
	name: 'Interviews',
	tagline: 'SDE 1 and SDE 2 questions with model answers, a quiz and exercises.',
	topics,
	questions,
	quizTopics: topics.map((t) => ({ id: t.id, label: t.title })),
	playground: 'js',
	quizBlurb: 'questions asked for SDE 1 and SDE 2 roles: coding, frontend, backend, data, system design and behavioral'
};
