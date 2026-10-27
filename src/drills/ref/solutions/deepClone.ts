export function deepClone<T>(value: T, seen = new WeakMap<object, any>()): T {
	if (value === null || typeof value !== 'object') return value;
	const v: any = value;
	if (seen.has(v)) return seen.get(v);
	if (v instanceof Date) return new Date(v.getTime()) as any;
	if (v instanceof Map) {
		const out = new Map();
		seen.set(v, out);
		v.forEach((val, k) => out.set(deepClone(k, seen), deepClone(val, seen)));
		return out as any;
	}
	if (v instanceof Set) {
		const out = new Set();
		seen.set(v, out);
		v.forEach((val) => out.add(deepClone(val, seen)));
		return out as any;
	}
	const out: any = Array.isArray(v) ? [] : {};
	seen.set(v, out);
	for (const k of Object.keys(v)) out[k] = deepClone(v[k], seen);
	return out;
}

export function deepEqual(a: any, b: any): boolean {
	if (Object.is(a, b)) return true;
	if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
	if (Array.isArray(a) !== Array.isArray(b)) return false;
	if (a instanceof Date || b instanceof Date) return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
	const ka = Object.keys(a);
	const kb = Object.keys(b);
	if (ka.length !== kb.length) return false;
	return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
}
