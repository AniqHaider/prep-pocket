import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import Gallery from './explain/Gallery.svelte';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { kbShowing, hideKb } from './ui/kbState.svelte';
import { exitAsk } from './ui/exitState.svelte';
import { atRoot } from './ui/rootState';
import { initLandscapeImmersive } from './ui/immersive';

// #gallery is a dev-only contact sheet of every animated scene (see docs/explainers.md)
export default mount(import.meta.env.DEV && location.hash.startsWith('#gallery') ? Gallery : App, { target: document.getElementById('app')! });

// Android hardware/gesture Back: step back through in-app history, exit only from the first screen.
initLandscapeImmersive();

if (Capacitor.isNativePlatform()) {
	CapApp.addListener('backButton', ({ canGoBack }) => {
		const wn = document.querySelector<HTMLElement>('[data-testid="whats-new-ok"]');
		if (wn) wn.click();
		else if (exitAsk.open) exitAsk.open = false;
		else if (kbShowing()) hideKb();
		else if (!atRoot() && canGoBack) history.back();
		else exitAsk.open = true;
	});
}
