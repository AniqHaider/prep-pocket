export async function retry<T>(fn: (attempt: number) => Promise<T>, opts: { retries: number; baseMs: number; signal?: AbortSignal }): Promise<T> {
	for (let attempt = 0; ; attempt++) {
		opts.signal?.throwIfAborted();
		try {
			return await fn(attempt);
		} catch (e) {
			if (attempt >= opts.retries || opts.signal?.aborted) throw e;
			const delay = opts.baseMs * 2 ** attempt;
			await new Promise<void>((res, rej) => {
				const t = setTimeout(res, delay);
				opts.signal?.addEventListener('abort', () => (clearTimeout(t), rej(opts.signal!.reason)), { once: true });
			});
		}
	}
}
