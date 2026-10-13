import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export default mount(App, { target: document.getElementById('app')! });

// Android hardware/gesture Back: step back through in-app history, exit only from the first screen.
if (Capacitor.isNativePlatform()) {
	CapApp.addListener('backButton', ({ canGoBack }) => {
		if (canGoBack) history.back();
		else CapApp.exitApp();
	});
}
