import type { LearnEngine } from './types';
import type { Question } from '../quiz/types';
import * as origin from './built/origin';
import * as craft from './built/craft';
import * as native from './built/native';

const areas = [origin, craft, native];
const topics = areas.flatMap((a) => a.topics);
const questions: Question[] = areas
	.flatMap((a) => a.banks)
	.flatMap((b) => b.out)
	.map((q, i) => ({ ...q, id: 'BT' + String(i + 1).padStart(3, '0') }));

/** The story and decisions behind Preppy itself: why it exists, the stack, offline engines, the content model, the lesson player, design, navigation, the on-device model, narration, testing and releases. */
export const built: LearnEngine = {
	id: 'built',
	name: 'How Preppy was built',
	tagline: 'Every major decision behind this app: what was built, what was tried, what was rejected, and why.',
	topics,
	questions,
	quizTopics: topics.map((t) => ({ id: t.id, label: t.title })),
	playground: 'js',
	quizBlurb: 'The stack, offline engines, content model, lesson player, design, navigation, on-device AI, narration, testing and releases'
};
