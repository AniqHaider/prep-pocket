// Recurse only while depth remains; never mutate the input.
export function flatten(arr: any[], depth: number = Infinity): any[] {
	const out: any[] = [];
	for (const x of arr) {
		if (Array.isArray(x) && depth > 0) out.push(...flatten(x, depth - 1));
		else out.push(x);
	}
	return out;
}
