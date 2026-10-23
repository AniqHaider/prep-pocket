<script lang="ts">
	import Icon from '../ui/Icon.svelte';
	import { allScenes, sceneSeconds, TOPIC_LABEL } from './registry';
	import { play, loadWatched } from './nav';
	import type { Topic } from './types';
	import { groupTitle } from './groups';
	import { publish } from '../assistant/context';

	const TOPICS: Topic[] = ['backend', 'cs', 'ai', 'aws', 'javascript', 'typescript', 'react', 'nextjs', 'postgres', 'mysql', 'mongodb'];
	const stored = (() => { try { return localStorage.getItem('preppy:visual:topic'); } catch { return null; } })();
	let topic = $state<Topic>(TOPICS.includes(stored as Topic) ? (stored as Topic) : 'backend');
	let watched = $state(loadWatched());
	$effect(() => { try { localStorage.setItem('preppy:visual:topic', topic); } catch { /* ignore */ } });

	const inTopic = $derived(allScenes.filter((s) => s.topic === topic));
	const groups = $derived.by(() => {
		const m = new Map<string, typeof inTopic>();
		for (const s of inTopic) m.set(s.group, [...(m.get(s.group) ?? []), s]);
		return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
	});
	const counts = $derived(Object.fromEntries(TOPICS.map((t) => [t, allScenes.filter((s) => s.topic === t).length])) as Record<Topic, number>);
	const done = $derived(inTopic.filter((s) => watched.has(s.id)).length);

	$effect(() => publish('visual', { label: `Visual lessons · ${TOPIC_LABEL[topic]}`, text: `The learner is browsing animated explainers for ${TOPIC_LABEL[topic]}.` }));

	function start(ids: string[], i: number) {
		play(ids, i);
		const poll = setInterval(() => (watched = loadWatched()), 1500);
		setTimeout(() => clearInterval(poll), 180000);
	}
</script>

<div class="vis">
	<header>
		<h1 class="sr-only">Visual lessons</h1>
		<p class="muted">Short animated walk-throughs. Watch the data move, step by step. Every topic also has a written version.</p>
	</header>

	<div class="chips" role="group" aria-label="Topic">
		{#each TOPICS as t}
			<button class="chip" class:on={topic === t} aria-pressed={topic === t} onclick={() => (topic = t)}>{TOPIC_LABEL[t]}<span class="n num">{counts[t]}</span></button>
		{/each}
	</div>

	{#if inTopic.length === 0}
		<p class="muted empty">Lessons for {TOPIC_LABEL[topic]} are on the way.</p>
	{:else}
		<div class="meta">
			<span class="num muted">{done} of {inTopic.length} watched</span>
			<button class="btn small primary" onclick={() => start(inTopic.map((s) => s.id), 0)}><Icon name="play" size={16} />Play all</button>
		</div>
		<div class="bar" role="progressbar" aria-label="Watched" aria-valuemin="0" aria-valuemax={inTopic.length} aria-valuenow={done}><div style="width:{(done / inTopic.length) * 100}%"></div></div>

		{#each groups as [g, list]}
			<h2>{groupTitle(topic, g)}</h2>
			<ul>
				{#each list as s, i (s.id)}
					<li>
						<button class="card" onclick={() => start(list.map((x) => x.id), i)}>
							<span class="ic" class:seen={watched.has(s.id)}><Icon name={watched.has(s.id) ? 'check' : 'play'} size={18} label={watched.has(s.id) ? 'Watched' : undefined} /></span>
							<span class="tx"><b>{s.title}</b><small>{s.blurb}</small></span>
							<span class="dur num">{s.steps.length} steps · {sceneSeconds(s)}s</span>
						</button>
					</li>
				{/each}
			</ul>
		{/each}
	{/if}
</div>

<style>
	.vis { max-width: 760px; margin: 0 auto; padding: 16px 16px 24px; }
	h1 { margin: 8px 0 4px; font-size: var(--fs-title); font-weight: 600; letter-spacing: -.01em; }
	h2 { font-size: var(--fs-section); font-weight: 600; margin: 24px 0 8px; }
	.muted { color: var(--muted); margin: 0; }
	.empty { padding: 28px 4px; }
	.chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
	.chip { min-height: 44px; display: inline-flex; align-items: center; gap: 8px; background: transparent; border: 1px solid var(--control); border-radius: var(--radius-control); padding: 0 16px; color: var(--muted); font-size: var(--fs-body); }
	.chip.on { background: var(--raised); border-color: var(--text); color: var(--text); font-weight: 600; }
	.chip .n { color: var(--faint); font-size: var(--fs-small); font-weight: 400; }
	.meta { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 8px; }
	.small { min-height: 44px; padding: 0 16px; }
	.bar { height: 4px; background: var(--raised); border-radius: 9px; overflow: hidden; }
	.bar > div { height: 100%; background: var(--accent); transition: width .25s; }
	ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
	.card { width: 100%; display: flex; align-items: center; gap: 12px; text-align: left; min-height: 68px; padding: 12px 14px; background: var(--surface); border: 0; border-radius: var(--radius-row); color: var(--text); }
	.card:active { background: var(--raised); }
	.ic { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--raised); color: var(--text); flex: none; }
	.ic.seen { color: var(--accent); }
	.tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
	.tx b { font-size: 15px; font-weight: 600; }
	.tx small { color: var(--muted); font-size: 13px; line-height: 1.4; }
	.dur { color: var(--faint); font-size: var(--fs-small); flex: none; text-align: right; max-width: 80px; }

	/* Landscape phones are short: one scrolling row of topic chips and two columns of lessons, so lessons start high on screen. */
	@media (orientation: landscape) and (max-height: 560px) {
		.vis { max-width: 1100px; padding-left: max(16px, env(safe-area-inset-left)); padding-right: max(16px, env(safe-area-inset-right)); }
		header p { display: none; }
		.chips { flex-wrap: nowrap; overflow-x: auto; margin: 10px 0; padding-bottom: 4px; scrollbar-width: none; }
		.chip { flex: none; }
		ul { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		h2 { grid-column: 1 / -1; }
	}
</style>
