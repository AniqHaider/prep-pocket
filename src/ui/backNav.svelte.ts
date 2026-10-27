// Android's Back button is history.back(). App.svelte already gives tabs, the menu, the assistant and the player their own history entries;
// this does the same for the screens inside a section (an open topic, a drill, a quiz screen). A component calls `useBack` once with a getter
// and a setter for the value that says which screen it is on. Changing the value pushes an entry; Back (or the screen's own "back" button) restores the old value.

interface Entry { prev: string; owner: object; restore: (v: string) => void }
const stack: Entry[] = [];

/** How many in-section entries are on the history stack (App.svelte stores it in each entry). */
export const innerDepth = () => stack.length;
/** Switching tab unmounts every screen, so their entries no longer mean anything. */
export const resetInner = () => { stack.length = 0; };

if (typeof window !== 'undefined') {
	window.addEventListener('popstate', (e) => {
		const target = (e.state && e.state.inner) || 0;
		while (stack.length > target) { const en = stack.pop()!; en.restore(en.prev); }
	});
}

export function useBack(read: () => string, write: (v: string) => void) {
	const owner = {};
	let prev = read();
	let muted = false;
	const restore = (v: string) => { if (read() !== v) { muted = true; write(v); } };
	$effect(() => {
		const cur = read();
		if (muted) { muted = false; prev = cur; return; }
		if (cur === prev) return;
		const top = stack[stack.length - 1];
		if (top && top.owner === owner && top.prev === cur) {
			// the screen went back by itself (its own back button): drop the entry the same way Back would
			prev = cur;
			history.back();
			return;
		}
		stack.push({ prev, owner, restore });
		history.pushState({ ...(history.state ?? {}), inner: stack.length }, '');
		prev = cur;
	});
}
