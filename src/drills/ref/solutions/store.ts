export function createStore<S, A>(reducer: (state: S, action: A) => S, initialState: S) {
	let state = initialState;
	let listeners: Array<() => void> = [];
	return {
		getState: () => state,
		dispatch(action: A) {
			state = reducer(state, action); // if the reducer throws, state is untouched and nobody is notified
			const snapshot = listeners.slice();
			snapshot.forEach((l) => l());
			return action;
		},
		subscribe(listener: () => void) {
			listeners.push(listener);
			return () => {
				listeners = listeners.filter((l) => l !== listener);
			};
		}
	};
}
