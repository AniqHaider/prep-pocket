import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import Gallery from './explain/Gallery.svelte';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// #gallery is a dev-only contact sheet of every animated scene (see docs/explainers.md)
export default mount(import.meta.env.DEV && location.hash.startsWith('#gallery') ? Gallery : App, { target: document.getElementById('app')! });

// Android hardware/gesture Back: step back through in-app history, exit only from the first screen.
if (Capacitor.isNativePlatform()) {
	CapApp.addListener('backButton', ({ canGoBack }) => {
		if (canGoBack) history.back();
		else CapApp.exitApp();
	});
}
