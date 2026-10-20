// "What is the learner looking at?" — each section publishes a short text snapshot here and the
// app-level assistant reads it when a question is sent. Only one section is mounted at a time, so
// a section clears its entry when it unmounts.
import { writable } from 'svelte/store';

export interface AppContext {
	/** Human label shown in the assistant header, e.g. "React + Next + TS · quiz question". */
	label: string;
	/** Plain text handed to the model. Keep it small (the on-device model has a 4k-token window). */
	text: string;
}

export const appContext = writable<(AppContext & { owner: string }) | null>(null);

/**
 * Publishes `ctx` as `owner` and returns a cleanup that clears it only if `owner` still owns the slot
 * (so a section that is unmounting can't wipe what the next section just published).
 * Call from `$effect(() => publish('drills', ctx))`; pass null to publish nothing.
 */
export function publish(owner: string, ctx: AppContext | null) {
	if (!ctx) return;
	appContext.set({ ...ctx, owner });
	return () => appContext.update((c) => (c?.owner === owner ? null : c));
}
