<script lang="ts">
	import type { DbEngine } from './types';
	import SqlMongoPlayground from './playground/SqlMongoPlayground.svelte';
	import JsPlayground from './playground/JsPlayground.svelte';

	/** In-app playground, chosen by the engine: PostgreSQL (SQL) and MongoDB over a sample shop, or JavaScript / TypeScript scripts. */
	let { engine, seed = '' }: { engine: DbEngine; seed?: string } = $props();
</script>

{#if engine.playground === 'js'}
	<JsPlayground {engine} {seed} />
{:else}
	<SqlMongoPlayground {engine} {seed} />
{/if}
