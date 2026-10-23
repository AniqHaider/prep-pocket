import type { LearnEngine } from './types';
import { csQuestions } from './cs/questions';
import { csTopics } from './cs/topics';

export const cs: LearnEngine = {
	id: 'cs',
	name: 'Computer science',
	tagline: 'The fundamentals every engineer leans on: data, memory, algorithms and networks.',
	topics: csTopics,
	questions: csQuestions,
	quizTopics: csTopics.map((t) => ({ id: t.id, label: t.title.replace(/^Big-O: how cost grows$/, 'Big-O') })),
	playground: 'js',
	quizBlurb: 'data structures, algorithms, memory, operating systems and networks'
};
