// A small tap under the finger when a key is pressed. Native: the phone's own keyboard-tap haptic ("light") or the motor's click
// effect ("strong"). Browser: the Vibration API where it exists. Never awaited: a missing or failing motor must not slow typing.
import { Capacitor } from '@capacitor/core';
import { LocalTts } from '../tts/native';
import { kb } from './kbState.svelte';

export function haptic() {
	const mode = kb.haptic;
	if (mode === 'off') return;
	try {
		if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalTts')) void LocalTts.haptic({ mode }).catch(() => {});
		else navigator.vibrate?.(mode === 'strong' ? 18 : 8);
	} catch {
		/* unsupported: no buzz */
	}
}
