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

/** A real online store's API traffic, observed: a Next.js storefront was run locally and browsed like a visitor, and each lesson names a practice it follows and what that practice buys. Names, hosts and ids are changed. Basic = how to read the traffic, advanced = design choices. */
export const apis: LearnEngine = {
	id: 'apis',
	name: 'APIs in practice',
	tagline: 'A real online store, run and browsed: which calls it makes, which practices it follows, and what they buy.',
	topics,
	questions,
	quizTopics: topics.map((t) => ({ id: t.id, label: t.title })),
	playground: 'js',
	quizBlurb: 'Server and browser calls, same-origin proxies, signed webhooks, caching and revalidation, rate limits, fail-soft design, third-party scripts and client storage'
};
