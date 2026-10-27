// Interview · SDE 2: an Express/Koa-style middleware pipeline ("onion" model).
// use(fn) registers fn(ctx, next); run(ctx) starts the chain. Errors thrown downstream must
// reach an upstream try/catch around `await next()`. Calling next() twice must reject.
export class App<C = any> {
	use(fn: (ctx: C, next: () => Promise<void>) => void | Promise<void>): this {
		throw new Error('TODO');
	}
	async run(ctx: C): Promise<void> {
		throw new Error('TODO');
	}
}
