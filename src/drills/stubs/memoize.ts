// 5. Closures: memoize with a custom key resolver and a max cache size (evict oldest).
// Follow-up: memory leak risk? (hint: WeakMap for object keys)
export function memoize<A extends unknown[], R>(fn: (...a: A) => R, opts?: { key?: (...a: A) => string; max?: number }) {
	throw new Error('TODO');
}
