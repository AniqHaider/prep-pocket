export function memoizeTTL<A extends any[], R>(fn: (...a: A) => R, ttlMs: number, now: () => number = Date.now) {
	const cache = new Map<string, { value: R; at: number }>();
	const wrapped = (...args: A): R => {
		const key = JSON.stringify(args);
		const hit = cache.get(key);
		if (hit && now() - hit.at < ttlMs) return hit.value;
		const value = fn(...args);
		const entry = { value, at: now() };
		cache.set(key, entry);
		if (value && typeof (value as any).then === 'function') {
			(value as any).then(undefined, () => {
				if (cache.get(key) === entry) cache.delete(key); // do not cache failures
			});
		}
		return value;
	};
	wrapped.clear = () => cache.clear();
	return wrapped;
}
