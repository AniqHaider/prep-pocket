// localStorage is a per-viewer convenience: always wrapped, the app works without it.
export function loadMissed(key: string): Set<string> {
	try {
		return new Set(JSON.parse(localStorage.getItem(key) ?? '[]'));
	} catch {
		return new Set();
	}
}

export function saveMissed(key: string, s: Set<string>) {
	try {
		localStorage.setItem(key, JSON.stringify([...s]));
	} catch {
		/* private mode / blocked */
	}
}
