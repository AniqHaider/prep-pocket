import type { LearnEngine } from './types';
import type { Question } from '../quiz/types';
import * as core from './gcp/core';
import * as compute from './gcp/compute';
import * as ops from './gcp/ops';

const areas = [core, compute, ops];
const topics = areas.flatMap((a) => a.topics);
const questions: Question[] = areas
	.flatMap((a) => a.banks)
	.flatMap((b) => b.out)
	.map((q, i) => ({ ...q, id: 'GC' + String(i + 1).padStart(3, '0') }));

/** The Google Cloud services a web engineer meets most: projects and billing, Cloud Storage, IAM, DNS and load balancing, Cloud Run, GKE, databases, Pub/Sub, BigQuery, logging and monitoring. Basic = the core ideas, advanced = production design. */
export const gcp: LearnEngine = {
	id: 'gcp',
	name: 'Google Cloud',
	tagline: 'The Google Cloud services a web engineer meets most: storage, CDN, access, data, compute, messaging and operations.',
	topics,
	questions,
	quizTopics: topics.map((t) => ({ id: t.id, label: t.title })),
	playground: 'js',
	quizBlurb: 'Google Cloud projects and billing, Cloud Storage, IAM, DNS and load balancing, Cloud Run, GKE, databases, Pub/Sub, BigQuery, logging and monitoring'
};
