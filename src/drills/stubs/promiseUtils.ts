// 3. Re-implement Promise.all and Promise.allSettled WITHOUT using them.
// Gotchas: empty array, non-promise values, preserve order, resolve on microtask.
export function all<T>(values: Array<T | Promise<T>>): Promise<T[]> {
	throw new Error('TODO');
}
export function allSettled<T>(values: Array<T | Promise<T>>): Promise<Array<{ status: 'fulfilled'; value: T } | { status: 'rejected'; reason: unknown }>> {
	throw new Error('TODO');
}
