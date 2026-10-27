export function curry(fn: (...a: any[]) => any): (...a: any[]) => any {
	const curried = (...args: any[]): any => (args.length >= fn.length ? fn(...args) : (...more: any[]) => curried(...args, ...more));
	return curried;
}

export const compose = (...fns: Array<(x: any) => any>) => (x: any) => fns.reduceRight((acc, f) => f(acc), x);

export const pipe = (...fns: Array<(...a: any[]) => any>) => (...args: any[]) => {
	if (fns.length === 0) return args[0];
	const [first, ...rest] = fns;
	return rest.reduce((acc, f) => f(acc), first(...args));
};
