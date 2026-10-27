import type { LearnEngine } from './types';
import type { Question } from '../quiz/types';
import * as foundations from './pyai/foundations';
import * as deep from './pyai/deeplearning';
import * as llm from './pyai/llmeng';

const areas = [foundations, deep, llm];
const topics = areas.flatMap((a) => a.topics);
const questions: Question[] = areas
	.flatMap((a) => a.banks)
	.flatMap((b) => b.out)
	.map((q, i) => ({ ...q, id: 'PA' + String(i + 1).padStart(3, '0') }));

/** What to learn to do AI engineering in Python: the language tooling, NumPy and pandas, scikit-learn, PyTorch, transformers and Hugging Face, LLM apps, evals, serving and MLOps. Basic = the foundations, advanced = production AI. */
export const pyai: LearnEngine = {
	id: 'pyai',
	name: 'Python for AI',
	tagline: 'The path into AI engineering with Python: the libraries, what each is for, and what to learn in what order.',
	topics,
	questions,
	quizTopics: topics.map((t) => ({ id: t.id, label: t.title })),
	quizBlurb: 'NumPy, pandas, scikit-learn, PyTorch, transformers, Hugging Face, RAG, evals, serving and MLOps'
};
