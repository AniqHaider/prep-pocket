// What the full-screen player is playing. App.svelte mirrors this store into browser history so Android's
// Back button closes the player before anything else, exactly like the menu and the assistant sheet.
import { writable } from 'svelte/store';

export interface Playlist {
	ids: string[];
	i: number;
}

export const playlist = writable<Playlist | null>(null);

/** Play one scene, or a list of scenes back to back. */
export function play(ids: string | string[], start = 0) {
	const list = Array.isArray(ids) ? ids : [ids];
	if (list.length) playlist.set({ ids: list, i: Math.min(start, list.length - 1) });
}

export function stop() {
	playlist.set(null);
}

const KEY = 'preppy:watched:v1';
export function loadWatched(): Set<string> {
	try {
		return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
	} catch {
		return new Set();
	}
}
export function markWatched(id: string) {
	try {
		const s = loadWatched();
		s.add(id);
		localStorage.setItem(KEY, JSON.stringify([...s]));
	} catch {
		/* private mode */
	}
}
