export type Topic = 'svelte' | 'typescript';
export type Level = 'basic' | 'mid';

export interface Question {
	id: string;
	topic: Topic;
	level: Level;
	q: string;
	code?: string;
	/** The right answer is authored first; the UI shuffles options per attempt. */
	correct: string;
	wrong: [string, string, string];
	/** Self-contained explanation: why `correct` is right AND why the traps are wrong. */
	why: string;
}

/** Tiny authoring helper: ids are assigned by position so they stay stable as long as order is kept. */
export function builder(prefix: string, topic: Topic) {
	const out: Question[] = [];
	const add = (
		level: Level,
		q: string,
		correct: string,
		wrong: [string, string, string],
		why: string,
		code?: string
	) => {
		out.push({ id: prefix + String(out.length + 1).padStart(2, '0'), topic, level, q, code, correct, wrong, why });
	};
	return { out, add };
}

// ───────────── Theory tabs ─────────────

export interface TheorySection {
	id: string;
	heading: string;
	/** Spoken script — first person, ~20-40 seconds out loud. */
	say?: string;
	/** Key points to hit; `inline code` uses backticks. */
	points: string[];
	code?: { title?: string; text: string };
	/** One-line "if they push back / if you only remember one thing". */
	tip?: string;
}

export interface Theory {
	id: 'svelte' | 'typescript';
	title: string;
	tagline: string;
	sections: TheorySection[];
}
