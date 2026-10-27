export function groupBy<T>(items: T[], key: string | ((item: T) => string | number)): Record<string, T[]> {
	const fn = typeof key === 'function' ? key : (x: any) => x[key];
	const out: Record<string, T[]> = Object.create(null);
	for (const item of items) (out[String(fn(item))] ||= []).push(item);
	return out;
}

export function chunk<T>(arr: T[], size: number): T[][] {
	if (!Number.isInteger(size) || size < 1) throw new RangeError('size must be a positive integer');
	const out: T[][] = [];
	for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
	return out;
}
