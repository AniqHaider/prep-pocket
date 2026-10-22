// Narration choice, stored on-device only.
export interface TtsPrefs {
	/** 'system' = the phone's built-in voice, otherwise a downloaded catalog voice id. */
	voice: string;
	/** Speaker id for multi-speaker voices (Kokoro). */
	sid: number;
}

const KEY = 'prep-pocket:tts:v1';
const DEFAULT: TtsPrefs = { voice: 'system', sid: 3 };

export function loadTtsPrefs(): TtsPrefs {
	try {
		const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
		if (raw && typeof raw === 'object') return { ...DEFAULT, ...raw };
	} catch {
		/* ignore */
	}
	return { ...DEFAULT };
}

export function saveTtsPrefs(p: TtsPrefs) {
	try {
		localStorage.setItem(KEY, JSON.stringify(p));
	} catch {
		/* ignore */
	}
}
