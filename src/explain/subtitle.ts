// How solid the subtitle's background is in the lesson player. In landscape the subtitle sits on top of the picture (which then gets the
// full height), so the learner chooses between seeing more of the picture behind it and reading it more easily. Stored on the phone.
export const SUB_LEVELS = [
	{ id: 'clear', label: 'Clear', alpha: 0, hint: 'No background: the picture shows through' },
	{ id: 'light', label: 'Light', alpha: 0.45, hint: 'A faint dark plate' },
	{ id: 'medium', label: 'Medium', alpha: 0.72, hint: 'Easy to read, picture still visible' },
	{ id: 'solid', label: 'Solid', alpha: 0.94, hint: 'Almost opaque: easiest to read' }
] as const;
export type SubLevel = (typeof SUB_LEVELS)[number]['id'];

const KEY = 'preppy:player:subtitle';

export function loadSubLevel(): SubLevel {
	try {
		const v = localStorage.getItem(KEY);
		return (SUB_LEVELS.find((l) => l.id === v)?.id ?? 'medium') as SubLevel;
	} catch {
		return 'medium';
	}
}

export function saveSubLevel(id: SubLevel) {
	try {
		localStorage.setItem(KEY, id);
	} catch {
		/* private mode: the choice just isn't remembered */
	}
}

export const subAlpha = (id: SubLevel) => SUB_LEVELS.find((l) => l.id === id)?.alpha ?? 0.72;
