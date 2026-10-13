export function debounce<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
	let t: ReturnType<typeof setTimeout> | undefined;
	const d = (...a: A) => {
		clearTimeout(t);
		t = setTimeout(() => fn(...a), ms);
	};
	d.cancel = () => clearTimeout(t);
	return d;
}
export function throttle<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
	let last = -Infinity;
	return (...a: A) => {
		const now = Date.now();
		if (now - last >= ms) {
			last = now;
			fn(...a);
		}
	};
}
