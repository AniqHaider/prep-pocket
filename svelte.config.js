import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	preprocess: vitePreprocess(),
	// Prep/Drills/Settings are runes-mode TS; the copied Backend Dojo components also use runes ($state etc.).
	compilerOptions: { runes: true }
};
