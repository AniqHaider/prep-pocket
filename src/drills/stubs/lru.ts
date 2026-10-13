// 7. DSA: LRU cache with O(1) get/put. (They WILL ask a DSA question — this is the classic frontend one.)
export class LRUCache<K, V> {
	constructor(private capacity: number) {}
	get(key: K): V | undefined { throw new Error('TODO'); }
	put(key: K, value: V): void { throw new Error('TODO'); }
}
