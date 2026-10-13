export function memoize<A extends unknown[], R>(fn: (...a: A) => R, opts: { key?: (...a: A) => string; max?: number } = {}) {
	const cache = new Map<string, R>();
	const key = opts.key ?? ((...a: A) => JSON.stringify(a));
	return (...a: A): R => {
		const k = key(...a);
		if (cache.has(k)) return cache.get(k)!;
		const v = fn(...a);
		cache.set(k, v);
		if (opts.max && cache.size > opts.max) cache.delete(cache.keys().next().value!); // Map keeps insertion order
		return v;
	};
}
