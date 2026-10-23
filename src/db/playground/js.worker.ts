// The playground's own Web Worker for JavaScript / TypeScript: no DOM, no access to the app. It removes the network APIs from its
// global scope (the runner also shadows them for the learner's code), streams every console line to the page as it is produced
// (so output survives a terminated endless loop) and sends a heartbeat the page's watchdog listens for.
import { runScript, NETWORK_OFF } from './jsRun';

const off = () => { throw new Error(NETWORK_OFF); };
try { Object.defineProperty(self, 'fetch', { value: () => Promise.reject(new Error(NETWORK_OFF)), configurable: true, writable: true }); } catch { /* not configurable here */ }
for (const k of ['importScripts', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'WebTransport', 'Worker', 'SharedWorker']) {
	try { Object.defineProperty(self, k, { value: off, configurable: true, writable: true }); } catch { /* not configurable here */ }
}

setInterval(() => postMessage({ type: 'hb' }), 400);

self.onmessage = async (e: MessageEvent) => {
	const { id, code, ts, timeoutMs } = e.data as { id: number; code: string; ts: boolean; timeoutMs?: number };
	const result = await runScript(code, { ts, timeoutMs, onLine: (l) => postMessage({ type: 'line', id, level: l.level, text: l.text }) });
	postMessage({ type: 'done', id, result });
};
