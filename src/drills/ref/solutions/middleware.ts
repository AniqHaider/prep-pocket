type Next = () => Promise<void>;
type Middleware<C> = (ctx: C, next: Next) => void | Promise<void>;

export class App<C = any> {
	private stack: Middleware<C>[] = [];
	use(fn: Middleware<C>): this {
		this.stack.push(fn);
		return this;
	}
	async run(ctx: C): Promise<void> {
		let called = -1;
		const dispatch = async (i: number): Promise<void> => {
			if (i <= called) throw new Error('next() called multiple times');
			called = i;
			const fn = this.stack[i];
			if (!fn) return;
			await fn(ctx, () => dispatch(i + 1));
		};
		await dispatch(0);
	}
}
