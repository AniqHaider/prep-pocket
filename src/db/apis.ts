import type { LearnEngine } from './types';
import type { Question } from '../quiz/types';
import * as calls from './apis/calls';
import * as practices from './apis/practices';
import * as design from './apis/design';

const areas = [calls, practices, design];
const topics = areas.flatMap((a) => a.topics);
const questions: Question[] = areas
	.flatMap((a) => a.banks)
	.flatMap((b) => b.out)
	.map((q, i) => ({ ...q, id: 'AP' + String(i + 1).padStart(3, '0') }));

/** A real API read in practice: Cardify Lite's backend was started locally and called, and each lesson names a practice it follows and what that practice does for it. Basic = how to read an API, advanced = design choices. */
export const apis: LearnEngine = {
	id: 'apis',
	name: 'APIs in practice',
	tagline: 'A real API, started and called: what each request looks like, which practices it follows, and what they buy.',
	topics,
	questions,
	quizTopics: topics.map((t) => ({ id: t.id, label: t.title })),
	playground: 'js',
	quizBlurb: 'Routes and status codes, validation, auth by key, CORS, caching, idempotency, errors, config and testing in a real API'
};
