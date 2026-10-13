// Copies the Pyodide runtime into public/pyodide so the app runs fully offline (no CDN).
import { cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// fileURLToPath (not URL.pathname) so Windows paths like C:\\dev\\kata work
const from = fileURLToPath(new URL('../node_modules/pyodide/', import.meta.url));
const to = fileURLToPath(new URL('../public/pyodide/', import.meta.url));
mkdirSync(to, { recursive: true });
for (const f of ['pyodide.asm.wasm', 'pyodide.asm.mjs', 'python_stdlib.zip', 'pyodide-lock.json']) cpSync(join(from, f), join(to, f));
console.log('pyodide runtime copied to public/pyodide');
