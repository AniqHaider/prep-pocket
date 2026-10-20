import type { AppContext } from './context';

interface QuizItem {
	q: { q: string; code?: string; topic: string; level: string; tag?: string; correct: string; why: string };
	options: string[];
	correctIndex: number;
}

/** Context for the assistant while a quiz (Svelte+TS or React+Next+TS) is on screen. */
export function quizContext(area: string, screen: 'home' | 'quiz' | 'result', cur: QuizItem | undefined, pick: number | null, revealed: boolean, score: number, total: number): AppContext {
	if (screen === 'home') return { label: `${area} · quiz setup`, text: `The learner is on the ${area} quiz setup screen (choosing topic, level and length).` };
	if (screen === 'result' || !cur) return { label: `${area} · quiz results`, text: `The learner just finished a ${area} quiz: ${score} / ${total} correct.` };
	const lines = [
		`${area} quiz, ${cur.q.topic} · ${cur.q.level}${cur.q.tag ? ' · ' + cur.q.tag : ''}`,
		`Question: ${cur.q.q}`
	];
	if (cur.q.code) lines.push('Code:\n' + cur.q.code);
	lines.push('Options:\n' + cur.options.map((o, i) => `${i + 1}) ${o}`).join('\n'));
	if (revealed && pick !== null) {
		lines.push(
			`The learner chose option ${pick + 1} and it was ${pick === cur.correctIndex ? 'CORRECT' : 'WRONG'}.`,
			`Correct answer: ${cur.q.correct}`,
			`Official explanation: ${cur.q.why}`
		);
	} else if (pick !== null) {
		lines.push(`The learner picked option ${pick + 1} (exam mode: result hidden until the end — do not reveal whether it is right).`);
	} else {
		lines.push('The learner has NOT answered yet — hint, do not reveal the answer.');
	}
	return { label: `${area} · quiz question`, text: lines.join('\n') };
}
