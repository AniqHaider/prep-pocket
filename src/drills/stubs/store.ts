// Interview · SDE 2: a tiny Redux-style store. subscribe() returns an unsubscribe fn.
// Listeners run after every successful dispatch, using a snapshot taken at dispatch time.
export function createStore<S, A>(reducer: (state: S, action: A) => S, initialState: S) {
	return {
		getState(): S {
			throw new Error('TODO');
		},
		dispatch(action: A): A {
			throw new Error('TODO');
		},
		subscribe(listener: () => void): () => void {
			throw new Error('TODO');
		}
	};
}
