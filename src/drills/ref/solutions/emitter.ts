export class Emitter<E extends Record<string, unknown[]>> {
	constructor(private onError: (e: unknown) => void = console.error) {}
	private h = new Map<keyof E, Set<(...a: any[]) => void>>();
	on<K extends keyof E>(event: K, fn: (...a: E[K]) => void) {
		const set = this.h.get(event) ?? new Set();
		set.add(fn);
		this.h.set(event, set);
		return () => {
			set.delete(fn);
			if (set.size === 0) this.h.delete(event); // no empty buckets retained
		};
	}
	once<K extends keyof E>(event: K, fn: (...a: E[K]) => void) {
		const off = this.on(event, ((...a: E[K]) => (off(), fn(...a))) as (...a: E[K]) => void);
		return off;
	}
	emit<K extends keyof E>(event: K, ...a: E[K]) {
		// copy: handlers may unsubscribe while we iterate
		for (const fn of [...(this.h.get(event) ?? [])]) {
			try {
				fn(...a);
			} catch (e) {
				this.onError(e); // surface, but don't break siblings
			}
		}
	}
	listenerCount<K extends keyof E>(event: K) {
		return this.h.get(event)?.size ?? 0;
	}
}
