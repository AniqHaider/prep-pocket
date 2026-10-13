// Port of backend/app/grading.py: execute -> record -> award XP/streak -> unlock diagram components.
import { allExercises, getExerciseFull, listChapters } from './content';
import { COMPONENTS, componentsToUnlock } from './diagram';
import { levelForXp, localToday, nextStreak } from './gamification';
import { execPython, execSql } from './runners';
import { store } from './store';

const seeds = import.meta.glob('../seeds/*.sql', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const seedFor = (key: string) => seeds[`../seeds/${key}.sql`] ?? '';

const chapterNumber = (id: string) => {
	const d = id.replace(/\D/g, '');
	return d ? Number(d) : null;
};

function chapterMaps(solved: Set<string>) {
	const solvedMap: Record<number, boolean> = {};
	const totals: Record<number, number> = {};
	for (const ch of listChapters()) {
		const n = chapterNumber(ch.id);
		if (n == null) continue;
		const ids: string[] = ch.exercise_ids;
		solvedMap[n] = ids.length > 0 && ids.every((i) => solved.has(i));
		totals[n] = ch.exercise_count;
	}
	return { solvedMap, totals };
}

function runQuiz(answer: string, ex: any) {
	const choice = Number.parseInt(String(answer).trim(), 10);
	const passed = choice === ex.correct_index;
	return {
		all_passed: passed,
		selected: Number.isNaN(choice) ? -1 : choice,
		error_category: passed ? null : 'wrong_choice',
		detail: passed ? null : "That's not the best answer — read the explanation and try again.",
		explanation: ex.explanation_md ?? ''
	};
}

export async function processRun(exerciseId: string, code: string) {
	const ex = getExerciseFull(exerciseId);
	const type = ex.type ?? 'python';
	let result: any;
	let payloadKey: string;
	if (type === 'sql') {
		result = await execSql(seedFor(ex.schema_key), code, ex.expected_query_result ?? [], !!ex.order_sensitive);
		payloadKey = 'rows';
	} else if (type === 'quiz') {
		result = runQuiz(code, ex);
		payloadKey = 'selected';
	} else {
		result = await execPython(code, ex.tests ?? []);
		payloadKey = 'results';
	}

	const wasSolved = store.getExercise(exerciseId).status === 'solved';
	store.recordAttempt(exerciseId, { passed: result.all_passed, code, errorCategory: result.error_category, detail: result.detail });

	let awarded = 0;
	const newComponents: string[] = [];
	if (result.all_passed && !wasSolved) {
		awarded = Number(ex.xp ?? 10);
		const s = store.getStats();
		const today = localToday();
		const xp = s.xp + awarded;
		const streak = nextStreak(s.current_streak, s.last_active_date, today);
		store.setStats({ xp, level: levelForXp(xp), current_streak: streak, longest_streak: Math.max(s.longest_streak, streak), last_active_date: today });

		const solved = store.solvedIds();
		const { solvedMap, totals } = chapterMaps(solved);
		const already = new Set(store.unlockedComponents());
		for (const id of componentsToUnlock(solved, solvedMap, totals)) {
			if (!already.has(id)) {
				store.unlockComponent(id);
				newComponents.push(id);
			}
		}
	}

	return {
		all_passed: result.all_passed,
		[payloadKey]: result[payloadKey] ?? [],
		error_category: result.error_category ?? null,
		detail: result.detail ?? null,
		explanation: result.explanation ?? null,
		awarded_xp: awarded,
		new_components: newComponents,
		stats: store.getStats()
	};
}

export { COMPONENTS, allExercises };
