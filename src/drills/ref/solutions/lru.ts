// Map preserves insertion order → re-insert on access to mark "most recent". O(1) amortised.
export class LRUCache<K, V> {
	private m = new Map<K, V>();
	constructor(private capacity: number) {}
	get(key: K): V | undefined {
		if (!this.m.has(key)) return undefined;
		const v = this.m.get(key)!;
		this.m.delete(key);
		this.m.set(key, v);
		return v;
	}
	put(key: K, value: V): void {
		this.m.delete(key);
		this.m.set(key, value);
		if (this.m.size > this.capacity) this.m.delete(this.m.keys().next().value!);
	}
}
