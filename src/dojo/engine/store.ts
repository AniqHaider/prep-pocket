// Progress store. Replaces the backend's SQLite (progress.db) with one JSON blob in localStorage.
// Same data model: exercise_progress, mistakes_log, stats, diagram_state.

export interface ExerciseProgress {
	exercise_id: string;
	status: 'solved' | 'unsolved';
	attempts: number;
	solved_at: string | null;
	best_code: string | null;
}
export interface Mistake { exercise_id: string; ts: string; error_category: string | null; detail: string | null }
export interface Stats { xp: number; level: number; current_streak: number; longest_streak: number; last_active_date: string | null }

interface Data {
	exercises: Record<string, ExerciseProgress>;
	mistakes: Mistake[];
	stats: Stats;
	diagram: { id: string; at: string }[];
}

const KEY = 'prep-pocket:dojo:v1';
const fresh = (): Data => ({
	exercises: {},
	mistakes: [],
	stats: { xp: 0, level: 1, current_streak: 0, longest_streak: 0, last_active_date: null },
	diagram: []
});

let cache: Data | null = null;

function load(): Data {
	if (cache) return cache;
	try {
		const raw = localStorage.getItem(KEY);
		cache = raw ? { ...fresh(), ...JSON.parse(raw) } : fresh();
	} catch {
		cache = fresh();
	}
	return cache!;
}
function save() {
	try {
		localStorage.setItem(KEY, JSON.stringify(cache));
	} catch {
		/* storage blocked/full — progress stays in memory for this session */
	}
}

const now = () => new Date().toISOString();

export const store = {
	recordAttempt(id: string, o: { passed: boolean; code: string; errorCategory?: string | null; detail?: string | null }) {
		const d = load();
		const prev = d.exercises[id];
		const attempts = (prev?.attempts ?? 0) + 1;
		const wasSolved = prev?.status === 'solved';
		d.exercises[id] = {
			exercise_id: id,
			status: o.passed || wasSolved ? 'solved' : 'unsolved',
			attempts,
			solved_at: prev?.solved_at ?? (o.passed ? now() : null),
			best_code: o.code
		};
		if (!o.passed) d.mistakes.push({ exercise_id: id, ts: now(), error_category: o.errorCategory ?? null, detail: o.detail ?? null });
		if (d.mistakes.length > 200) d.mistakes.splice(0, d.mistakes.length - 200);
		save();
	},
	getExercise(id: string): ExerciseProgress {
		return load().exercises[id] ?? { exercise_id: id, status: 'unsolved', attempts: 0, solved_at: null, best_code: null };
	},
	solvedIds(): Set<string> {
		return new Set(Object.values(load().exercises).filter((e) => e.status === 'solved').map((e) => e.exercise_id));
	},
	recentMistakes(limit = 10): Mistake[] {
		return load().mistakes.slice(-limit).reverse();
	},
	getStats(): Stats {
		return { ...load().stats };
	},
	setStats(s: Stats) {
		load().stats = s;
		save();
	},
	unlockComponent(id: string) {
		const d = load();
		if (!d.diagram.some((c) => c.id === id)) {
			d.diagram.push({ id, at: now() });
			save();
		}
	},
	unlockedComponents(): string[] {
		return load().diagram.map((c) => c.id);
	},
	reset() {
		cache = fresh();
		save();
	},
	exportJson(): string {
		return JSON.stringify(load(), null, 2);
	}
};
