import { svelteTheory } from './svelte';
import { typescriptTheory } from './typescript';

export const theories = { svelte: svelteTheory, typescript: typescriptTheory } as const;
