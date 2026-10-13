// 2. Async: run `tasks` with at most `limit` in flight, preserve result order,
// reject on first error. (Real use: batching 500 quote fetches without 500 sockets.)
export async function promisePool<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]> {
	throw new Error('TODO');
}
