// Is the app on a section's top screen, with nothing opened on top of it? App.svelte registers the check; the native Back handler asks it,
// because browser history can still hold entries from sections you already left, and Back at the top must offer to quit, not wander there.
let probe: () => boolean = () => false;
export const setRootProbe = (fn: () => boolean) => { probe = fn; };
export const atRoot = () => probe();
