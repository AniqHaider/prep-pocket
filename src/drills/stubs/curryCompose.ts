// Interview · SDE 1/2: curry (by fn.length, any grouping of args), compose (right to left), pipe (left to right).
export function curry(fn: (...a: any[]) => any): (...a: any[]) => any {
	throw new Error('TODO');
}

export function compose(...fns: Array<(x: any) => any>): (x: any) => any {
	throw new Error('TODO');
}

export function pipe(...fns: Array<(...a: any[]) => any>): (...a: any[]) => any {
	throw new Error('TODO');
}
