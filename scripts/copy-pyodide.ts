// Copies the Pyodide runtime into public/pyodide so the app runs fully offline (no CDN).
import { cpSync, mkdirSync } from 'node:fs';

const from = new URL('../node_modules/pyodide/', import.meta.url).pathname;
const to = new URL('../public/pyodide/', import.meta.url).pathname;
mkdirSync(to, { recursive: true });
for (const f of ['pyodide.asm.wasm', 'pyodide.asm.mjs', 'python_stdlib.zip', 'pyodide-lock.json']) cpSync(from + f, to + f);
console.log('pyodide runtime copied to public/pyodide');
