import { runDrill } from './drills-core';
import { DRILLS } from './drills';

postMessage({ type: 'ready' });

self.onmessage = async (e: MessageEvent) => {
	const { id, drillId, code } = e.data;
	const drill = DRILLS.find((d) => d.id === drillId)!;
	postMessage({ type: 'result', id, result: await runDrill(drill, code) });
};
