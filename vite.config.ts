import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
	plugins: [svelte()],
	define: { __APP_VERSION__: JSON.stringify(pkg.version) },
	// PGlite ships its own wasm/data assets and must not be pre-bundled.
	optimizeDeps: { exclude: ['@electric-sql/pglite'] },
	worker: { format: 'es' },
	build: { target: 'es2022', chunkSizeWarningLimit: 4000 }
});
