import type { Level, Question, TopicDef } from '../quiz/types';

/** One teachable topic: short notes plus the animated lessons that explain it. */
export interface DbTopic {
	id: string; // also the `group` of its scenes and the `topic` of its quiz questions
	title: string;
	level: Level;
	/** One sentence: what you will understand after this topic. */
	summary: string;
	/** Markdown: short paragraphs, bullet lists and fenced code. No raw HTML. Aim for 120-220 words. */
	notes: string;
	/** Scene ids (see src/explain/scenes) shown as "Watch" buttons. */
	scenes: string[];
	/** Snippets that run in the playground (Postgres: SQL, MongoDB: a shell-style query, JavaScript/TypeScript/CS: runnable code). */
	try?: { label: string; code: string }[];
}

/** A learn section: topics (notes + animated lessons), a quiz, and optionally a playground. Used for databases and the CS / frontend sections. */
export interface LearnEngine {
	id: 'postgres' | 'mysql' | 'mongodb' | 'cs' | 'ai' | 'aws' | 'javascript' | 'typescript' | 'react' | 'nextjs' | 'interview' | 'pyai';
	name: string;
	tagline: string;
	topics: DbTopic[];
	questions: Question[];
	quizTopics: TopicDef[];
	/** Which in-app playground this engine has, if any. MySQL has none: it cannot run in a WebView. React and Next.js have none. */
	playground?: 'sql' | 'mongo' | 'js';
	/** What the quiz screen says under its title. */
	quizBlurb: string;
}

export type DbEngine = LearnEngine;
