// Interview · SDE 2: async task queue. At most `concurrency` tasks run at once, FIFO start order.
// add() returns a promise for that task's own result (a failing task must not stop the queue).
// onIdle() resolves once nothing is running or waiting.
export class TaskQueue {
	constructor(private concurrency: number) {}
	add<T>(task: () => Promise<T>): Promise<T> {
		throw new Error('TODO');
	}
	onIdle(): Promise<void> {
		throw new Error('TODO');
	}
}
