export class TaskQueue {
	private queue: Array<() => void> = [];
	private running = 0;
	private idleWaiters: Array<() => void> = [];
	constructor(private concurrency: number) {}

	add<T>(task: () => Promise<T>): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.queue.push(() => {
				this.running++;
				Promise.resolve()
					.then(task)
					.then(resolve, reject)
					.finally(() => {
						this.running--;
						this.next();
					});
			});
			this.next();
		});
	}

	private next() {
		while (this.running < this.concurrency && this.queue.length) this.queue.shift()!();
		if (this.running === 0 && this.queue.length === 0) {
			const waiters = this.idleWaiters;
			this.idleWaiters = [];
			waiters.forEach((w) => w());
		}
	}

	onIdle(): Promise<void> {
		if (this.running === 0 && this.queue.length === 0) return Promise.resolve();
		return new Promise((r) => this.idleWaiters.push(r));
	}
}
