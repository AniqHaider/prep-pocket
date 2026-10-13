// Bundled chapter content (copied from Backend Dojo). Loaded eagerly at build time.
// Mirrors backend/app/content_loader.py, including hiding answer fields from the UI.

export type Json = Record<string, any>;

const metas = import.meta.glob('../content/*/meta.json', { eager: true, import: 'default' }) as Record<string, Json>;
const theories = import.meta.glob('../content/*/theory.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const exerciseFiles = import.meta.glob('../content/*/exercises/*.json', { eager: true, import: 'default' }) as Record<string, Json>;

const HIDDEN_FIELDS = ['tests', 'expected_query_result', 'reference_solution', 'correct_index'];

interface Chapter {
	dir: string;
	meta: Json;
	theory: string;
	exercises: Json[];
}

const chapters: Chapter[] = Object.keys(metas)
	.sort()
	.map((metaPath) => {
		const dir = metaPath.slice(0, metaPath.lastIndexOf('/'));
		const exercises = Object.keys(exerciseFiles)
			.filter((p) => p.startsWith(dir + '/exercises/'))
			.sort()
			.map((p) => exerciseFiles[p]);
		return { dir, meta: metas[metaPath], theory: theories[dir + '/theory.md'] ?? '', exercises };
	});

const strip = (ex: Json): Json => Object.fromEntries(Object.entries(ex).filter(([k]) => !HIDDEN_FIELDS.includes(k)));

export function listChapters(): Json[] {
	return chapters
		.map((c) => ({
			id: c.meta.id,
			title: c.meta.title,
			order: c.meta.order ?? 0,
			summary: c.meta.summary ?? '',
			exercise_count: c.exercises.length,
			exercise_ids: c.exercises.map((e) => e.id)
		}))
		.sort((a, b) => a.order - b.order);
}

export function getChapter(id: string): Json {
	const c = chapters.find((c) => c.meta.id === id);
	if (!c) throw new Error('chapter not found');
	return { id: c.meta.id, title: c.meta.title, summary: c.meta.summary ?? '', theory_md: c.theory, exercises: c.exercises.map(strip) };
}

export function findExercise(id: string): Json {
	for (const c of chapters) {
		const ex = c.exercises.find((e) => e.id === id);
		if (ex) return ex;
	}
	throw new Error('exercise not found');
}

export const getExercisePublic = (id: string) => strip(findExercise(id));
export const getExerciseFull = findExercise;
export const allExercises = (): Json[] => chapters.flatMap((c) => c.exercises);
