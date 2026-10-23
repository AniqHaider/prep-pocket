// On a landscape phone the screen is short, so hide the status bar (notification bar) and let a swipe from the top edge bring it back.
// Portrait keeps it. Only inside the Android app; in a browser there is nothing to hide.
import { Capacitor, SystemBars, SystemBarType } from '@capacitor/core';

export function initLandscapeImmersive() {
	if (!Capacitor.isNativePlatform()) return;
	const landscape = window.matchMedia('(orientation: landscape) and (max-height: 560px)');
	const apply = () => {
		const p = landscape.matches ? SystemBars.hide({ bar: SystemBarType.StatusBar }) : SystemBars.show({ bar: SystemBarType.StatusBar });
		p.catch(() => {
			/* not supported on this device: the bar just stays */
		});
	};
	apply();
	landscape.addEventListener('change', apply);
}
