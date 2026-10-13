export function all<T>(values: Array<T | Promise<T>>): Promise<T[]> {
	return new Promise((resolve, reject) => {
		if (values.length === 0) return resolve([]);
		const out: T[] = new Array(values.length);
		let remaining = values.length;
		values.forEach((v, i) => {
			Promise.resolve(v).then((val) => {
				out[i] = val;
				if (--remaining === 0) resolve(out);
			}, reject);
		});
	});
}
export function allSettled<T>(values: Array<T | Promise<T>>) {
	return all(
		values.map((v) =>
			Promise.resolve(v).then(
				(value) => ({ status: 'fulfilled' as const, value }),
				(reason) => ({ status: 'rejected' as const, reason })
			)
		)
	);
}
