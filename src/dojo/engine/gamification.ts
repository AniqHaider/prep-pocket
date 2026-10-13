// Port of backend/app/progress/gamification.py

export const levelThreshold = (level: number) => Math.floor((100 * (level - 1) * level) / 2);

export function levelForXp(xp: number): number {
	let level = 1;
	while (levelThreshold(level + 1) <= xp) level++;
	return level;
}

const toDay = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000;

export function nextStreak(cur: number, last: string | null, today: string): number {
	if (!last) return 1;
	const delta = toDay(today) - toDay(last);
	if (delta === 0) return cur;
	if (delta === 1) return cur + 1;
	return 1;
}

/** Local calendar date (the learner's day, not UTC). */
export function localToday(d = new Date()): string {
	const p = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
