<script lang="ts">
	import Explainer from './Explainer.svelte';
	import { allScenes } from './registry';
	// Dev tool: open http://localhost:5180/#gallery (all) or #gallery:pg- (scene ids starting with "pg-").
	const filter = decodeURIComponent(location.hash.split(':')[1] ?? '');
	const scenes = allScenes.filter((s) => s.id.startsWith(filter));
</script>

<div class="g">
	<h1>Scene gallery · {scenes.length} scenes{filter ? ` · "${filter}"` : ''}</h1>
	{#each scenes as s (s.id)}
		<section>
			<h2>{s.id} <small>{s.title}</small></h2>
			<div class="strip">
				{#each s.steps as st, i}
					<figure>
						<div class="box"><Explainer scene={s} step={i} /></div>
						<figcaption><b>{i + 1}</b> {st.say}</figcaption>
					</figure>
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	.g { padding: 12px; color: var(--text); }
	h1 { font-size: 16px; margin: 0 0 12px; }
	h2 { font-size: 14px; margin: 22px 0 8px; } h2 small { color: var(--muted); font-weight: 400; margin-left: 8px; }
	.strip { display: flex; flex-wrap: wrap; gap: 10px; }
	figure { margin: 0; width: 196px; }
	.box { background: var(--surface); border-radius: 12px; padding: 6px; }
	figcaption { font-size: 11px; line-height: 1.35; color: var(--muted); margin-top: 4px; }
	figcaption b { color: var(--accent); margin-right: 4px; }
</style>
