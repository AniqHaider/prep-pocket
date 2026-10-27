export function twoSum(nums: number[], target: number): [number, number] | null {
	const seen = new Map<number, number>();
	for (let i = 0; i < nums.length; i++) {
		const j = seen.get(target - nums[i]);
		if (j !== undefined) return [j, i];
		seen.set(nums[i], i);
	}
	return null;
}

export function validParentheses(s: string): boolean {
	const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
	const stack: string[] = [];
	for (const ch of s) {
		if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);
		else if (stack.pop() !== pairs[ch]) return false;
	}
	return stack.length === 0;
}

export function mergeIntervals(intervals: number[][]): number[][] {
	const sorted = intervals.map((i) => [...i]).sort((a, b) => a[0] - b[0]);
	const out: number[][] = [];
	for (const cur of sorted) {
		const last = out[out.length - 1];
		if (last && cur[0] <= last[1]) last[1] = Math.max(last[1], cur[1]);
		else out.push(cur);
	}
	return out;
}

export function topKFrequent(nums: number[], k: number): number[] {
	const count = new Map<number, number>();
	for (const n of nums) count.set(n, (count.get(n) ?? 0) + 1);
	return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, k).map((e) => e[0]);
}
