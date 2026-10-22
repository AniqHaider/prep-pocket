export type Level = 'basic' | 'mid' | 'advanced';

export interface Question {
	id: string;
	/** Topic id within one bank, e.g. "indexes" or "react". Labels come from the bank's topic list. */
	topic: string;
	level: Level;
	/** Short subtopic label shown as a chip, e.g. "joins", "transactions". */
	tag: string;
	q: string;
	code?: string;
	/** The right answer is authored first; the UI shuffles options per attempt. */
	correct: string;
	wrong: [string, string, string];
	/** Self-contained explanation: why `correct` is right AND why the traps are wrong. */
	why: string;
}

export interface TopicDef {
	id: string;
	label: string;
}

/** Tiny authoring helper: ids are assigned by position so they stay stable as long as order is kept. */
export function builder(prefix: string, topic: string) {
	const out: Question[] = [];
	const add = (level: Level, tag: string, q: string, correct: string, wrong: [string, string, string], why: string, code?: string) => {
		out.push({ id: prefix + String(out.length + 1).padStart(2, '0'), topic, level, tag, q, code, correct, wrong, why });
	};
	return { out, add };
}
