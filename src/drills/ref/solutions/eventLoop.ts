export async function eventLoopOrder(): Promise<string[]> {
	const log: string[] = [];
	const l = (s: string) => log.push(s);
	const done = new Promise<void>((r) => setTimeout(r, 5));
	setTimeout(() => l('timeout'), 0);
	Promise.resolve().then(() => l('micro1'));
	queueMicrotask(() => l('micro2'));
	l('sync');
	(async () => {
		l('async-start');
		await null;
		l('async-after-await');
	})();
	await done;
	return log;
}
