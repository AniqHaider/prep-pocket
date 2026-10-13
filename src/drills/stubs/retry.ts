// 9. Error handling + async: retry with exponential backoff + AbortSignal support.
// Real use: flaky quote/order APIs on bad mobile networks.
export async function retry<T>(fn: (attempt: number) => Promise<T>, opts: { retries: number; baseMs: number; signal?: AbortSignal }): Promise<T> {
	throw new Error('TODO');
}
