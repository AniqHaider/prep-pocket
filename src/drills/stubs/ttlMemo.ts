// Interview · SDE 2: memoize with a time-to-live. `now` is injectable so tests control the clock.
export function memoizeTTL<A extends any[], R>(fn: (...a: A) => R, ttlMs: number, now: () => number = Date.now): ((...a: A) => R) & { clear(): void } {
	throw new Error('TODO');
}
