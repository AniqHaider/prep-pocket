// Narration choice, stored on-device only.
export interface TtsPrefs {
	/** 'system' = the phone's built-in voice, otherwise a downloaded catalog voice id. */
	voice: string;
	/** Speaker id for multi-speaker voices (Kokoro). */
	sid: number;
	/** Last measured real-time factor per voice on THIS phone (synthesis seconds per audio second), from samples and real reading. */
	speed?: Record<string, number>;
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

/** Remembers how fast a voice runs on this phone. Reads fresh prefs first so it never overwrites a voice choice made meanwhile. */
export function saveVoiceSpeed(voice: string, rtf: number) {
	if (!Number.isFinite(rtf) || rtf <= 0) return;
	const p = loadTtsPrefs();
	saveTtsPrefs({ ...p, speed: { ...(p.speed ?? {}), [voice]: Math.round(rtf * 100) / 100 } });
}
