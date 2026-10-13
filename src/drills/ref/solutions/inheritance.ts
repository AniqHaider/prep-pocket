export function inherit(Child: Function, Parent: Function): void {
	Child.prototype = Object.create(Parent.prototype, {
		constructor: { value: Child, writable: true, configurable: true } // non-enumerable, like native
	});
	Object.setPrototypeOf(Child, Parent); // static inheritance, what `extends` also does
}
