export async function promisePool<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]> {
	const results: T[] = new Array(tasks.length);
	let next = 0;
	async function worker() {
		// single-threaded JS: `next++` is atomic between awaits, so no two workers take the same task
		while (next < tasks.length) {
			const i = next++;
			results[i] = await tasks[i]();
		}
	}
	await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
	return results;
}
