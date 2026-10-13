// 8. Memory management: EventEmitter whose `on` returns an unsubscribe fn, supports `once`,
// and never leaks (removing last listener deletes the event key). Handler errors must not
// stop other handlers (error handling question).
export class Emitter<E extends Record<string, unknown[]>> {
	constructor(private onError: (e: unknown) => void = console.error) {}
	on<K extends keyof E>(event: K, fn: (...a: E[K]) => void): () => void { throw new Error('TODO'); }
	once<K extends keyof E>(event: K, fn: (...a: E[K]) => void): () => void { throw new Error('TODO'); }
	emit<K extends keyof E>(event: K, ...a: E[K]): void { throw new Error('TODO'); }
	listenerCount<K extends keyof E>(event: K): number { throw new Error('TODO'); }
}
