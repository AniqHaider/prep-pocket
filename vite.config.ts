import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte()],
	// PGlite ships its own wasm/data assets and must not be pre-bundled.
	optimizeDeps: { exclude: ['@electric-sql/pglite'] },
	worker: { format: 'es' },
	build: { target: 'es2022', chunkSizeWarningLimit: 4000 }
});
