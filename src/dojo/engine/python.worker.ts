import { loadPyodide } from 'pyodide';
import { initPython, runPython } from './python-core';

// Assets are bundled under /pyodide/ (see scripts/copy-pyodide.ts) so this works fully offline.
const indexURL = new URL(import.meta.env.BASE_URL + 'pyodide/', self.location.href).href;

const ready = (async () => {
	const py = await loadPyodide({ indexURL });
	await initPython(py as any);
	return py;
})();

ready.then(
	() => postMessage({ type: 'ready' }),
	(e) => postMessage({ type: 'init-error', message: String(e?.message ?? e) })
);

self.onmessage = async (e: MessageEvent) => {
	const { id, code, tests } = e.data;
	try {
		const py = await ready;
		postMessage({ type: 'result', id, result: await runPython(py as any, code, tests) });
	} catch (err: any) {
		postMessage({ type: 'result', id, result: { all_passed: false, results: [], error_category: 'runtime_error', detail: String(err?.message ?? err) } });
	}
};
