// First index i where a[i] >= x (a.length if none). Half-open range [lo, hi).
export function lowerBound(a: number[], x: number): number {
	let lo = 0, hi = a.length;
	while (lo < hi) {
		const mid = (lo + hi) >>> 1;
		if (a[mid] < x) lo = mid + 1;
		else hi = mid;
	}
	return lo;
}

// First index i where a[i] > x.
export function upperBound(a: number[], x: number): number {
	let lo = 0, hi = a.length;
	while (lo < hi) {
		const mid = (lo + hi) >>> 1;
		if (a[mid] <= x) lo = mid + 1;
		else hi = mid;
	}
	return lo;
}

export function searchRotated(a: number[], target: number): number {
	let lo = 0, hi = a.length - 1;
	while (lo <= hi) {
		const mid = (lo + hi) >>> 1;
		if (a[mid] === target) return mid;
		if (a[lo] <= a[mid]) {
			if (a[lo] <= target && target < a[mid]) hi = mid - 1;
			else lo = mid + 1;
		} else {
			if (a[mid] < target && target <= a[hi]) lo = mid + 1;
			else hi = mid - 1;
		}
	}
	return -1;
}
