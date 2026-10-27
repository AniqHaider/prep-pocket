// What should Android's Back do right now? App.svelte registers the planner. Browser history can still hold entries from sections you already
// left, so Back must not trust it: it closes what is open on top ('back'), else returns to Home ('home', done by the planner), else offers to quit.
export type BackAction = 'back' | 'home' | 'quit';
let planner: () => BackAction = () => 'quit';
export const setBackPlanner = (fn: () => BackAction) => { planner = fn; };
export const planBack = () => planner();
