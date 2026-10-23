// Keeps the screen on while something is playing (an animated lesson, a lesson being read aloud, narration).
// Native: the app window's FLAG_KEEP_SCREEN_ON (reliable inside the app). Browser: the Screen Wake Lock API where it exists.
// Holders are counted by name, so the screen can sleep again only when the last one lets go.
import { Capacitor } from '@capacitor/core';
import { LocalTts } from '../tts/native';

const holders = new Set<string>();
let sentinel: { release(): Promise<void> } | null = null;

async function apply() {
	const on = holders.size > 0;
	try {
		if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalTts')) {
			await LocalTts.keepAwake({ on });
		} else if (on && !sentinel && 'wakeLock' in navigator) {
			sentinel = await (navigator as any).wakeLock.request('screen');
		} else if (!on && sentinel) {
			await sentinel.release();
			sentinel = null;
		}
	} catch {
		/* not supported or denied: playback still works, the screen just follows the phone's timeout */
	}
}

/** Hold the screen on as `owner`. Returns the function that releases it (use it as an $effect cleanup). */
export function holdAwake(owner: string): () => void {
	holders.add(owner);
	apply();
	return () => {
		holders.delete(owner);
		apply();
	};
}
