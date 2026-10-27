<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import type { DbEngine } from './types';
	import QuizView from '../quiz/QuizView.svelte';
	import Playground from './Playground.svelte';
	import Icon from '../ui/Icon.svelte';
	import { play, loadWatched } from '../explain/nav';
	import { sceneById } from '../explain/registry';
	import { publish } from '../assistant/context';
	import { useBack } from '../ui/backNav.svelte';

	let { engine }: { engine: DbEngine } = $props();

	// Start PostgreSQL in the background while the learner reads, so the playground is warm when they get there
	// (first boot takes a few seconds on a phone).
	onMount(() => {
		if (engine.playground !== 'sql') return;
		const t = setTimeout(() => import('./playground/sqlEngine').then((m) => m.sqlEngine.warm()).catch(() => {}), 1500);
		return () => clearTimeout(t);
	});

	type Tab = 'learn' | 'quiz' | 'play';
	// svelte-ignore state_referenced_locally
	const key = `preppy:db:${engine.id}:tab`;
	const saved = (() => { try { return localStorage.getItem(key); } catch { return null; } })();
	let tab = $state<Tab>(saved === 'quiz' || saved === 'play' ? saved : 'learn');
	let open = $state<string | null>(null);
	let seed = $state('');
	useBack(() => open ?? '', (v) => (open = v || null));
	let watched = $state(loadWatched());
	const tabs = $derived<{ id: Tab; label: string }[]>([
		{ id: 'learn', label: 'Learn' },
		{ id: 'quiz', label: 'Quiz' },
		...(engine.playground ? [{ id: 'play' as Tab, label: 'Playground' }] : [])
	]);
	$effect(() => { try { localStorage.setItem(key, tab); } catch { /* ignore */ } });

	// Tell the app-level assistant what the learner is looking at (the quiz publishes its own context).
	$effect(() => {
		if (tab === 'quiz') return;
		const t = engine.topics.find((x) => x.id === open);
		return publish(`db-${engine.id}`, {
			label: `${engine.name} · ${t ? t.title : tab === 'play' ? 'playground' : 'topics'}`,
			text: t ? `The learner is reading the ${engine.name} topic "${t.title}":\n${t.notes}` : `The learner is browsing the ${engine.name} section (${tab}).`
		});
	});

	const sceneCount = $derived(engine.topics.reduce((n, t) => n + t.scenes.filter((id) => sceneById(id)).length, 0));
	const levelLabel = { basic: 'Basic', mid: 'Intermediate', advanced: 'Advanced' } as const;

	function watch(ids: string[], i: number) {
		play(ids, i);
		const stop = setInterval(() => (watched = loadWatched()), 1500);
		setTimeout(() => clearInterval(stop), 120000);
	}
	function tryIt(code: string) { seed = code; tab = 'play'; window.scrollTo(0, 0); }
	const html = (md: string) => marked.parse(md, { async: false }) as string;
</script>

<div class="db">
	<header>
		<h1 class="sr-only">{engine.name}</h1>
		<p class="muted">{engine.tagline}</p>
		<p class="stats num">{engine.topics.length} topics · {sceneCount} animated lessons · {engine.questions.length} quiz questions</p>
	</header>

	<div class="tabs" role="tablist" aria-label="{engine.name} sections">
		{#each tabs as t}
			<button role="tab" class="tab" class:on={tab === t.id} aria-selected={tab === t.id} onclick={() => (tab = t.id)}>{t.label}</button>
		{/each}
	</div>

	{#if tab === 'learn'}
		{#if engine.topics.length === 0}
			<p class="muted empty">Topics are on the way.</p>
		{/if}
		<ol class="topics">
			{#each engine.topics as t, n (t.id)}
				{@const ids = t.scenes.filter((id) => sceneById(id))}
				<li class="topic" class:open={open === t.id}>
					<button class="head" aria-expanded={open === t.id} onclick={() => (open = open === t.id ? null : t.id)}>
						<span class="idx num">{n + 1}</span>
						<span class="tx"><b>{t.title}</b><small>{t.summary}</small></span>
						<span class="pill">{levelLabel[t.level]}</span>
						<Icon name="chevron" size={16} />
					</button>
					{#if open === t.id}
						<div class="bodyx">
							{#if ids.length}
								<div class="watch" role="group" aria-label="Animated lessons">
									{#each ids as id, i}
										{@const sc = sceneById(id)!}
										<button class="btn wbtn" onclick={() => watch(ids, i)}>
											<Icon name={watched.has(id) ? 'check' : 'play'} size={16} /><span>{sc.title}</span>
										</button>
									{/each}
								</div>
							{/if}
							<div class="notes">{@html html(t.notes)}</div>
							{#if t.try?.length && engine.playground}
								<div class="try">
									{#each t.try as s}
										<button class="btn small" onclick={() => tryIt(s.code)}><Icon name="dojo" size={16} />{s.label}</button>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ol>
	{:else if tab === 'quiz'}
		<QuizView questions={engine.questions} topics={engine.quizTopics} area={engine.name} storageKey={`preppy:db:${engine.id}:missed`} owner={`db-${engine.id}-quiz`} blurb={engine.quizBlurb} />
	{:else}
		<Playground {engine} {seed} />
	{/if}
</div>

<style>
	.db { max-width: 760px; margin: 0 auto; padding: 16px 16px 24px; }
	h1 { margin: 8px 0 4px; font-size: var(--fs-title); font-weight: 600; letter-spacing: -.01em; }
	.muted { color: var(--muted); margin: 0; }
	.stats { color: var(--faint); font-size: var(--fs-small); margin: 8px 0 0; }
	.tabs { display: flex; gap: 0; border-bottom: 1px solid var(--rule); margin: 16px 0; }
	.tab { flex: 1; min-height: 44px; border: 0; background: none; border-radius: 0; color: var(--muted); font-weight: 500; font-size: var(--fs-body); }
	.tab.on { color: var(--text); font-weight: 600; box-shadow: inset 0 -2px 0 var(--brand); }
	.empty { padding: 24px 4px; }
	.topics { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
	.topic { background: var(--surface); border-radius: var(--radius-card); overflow: hidden; border: 1px solid var(--rule); }
	.head { width: 100%; display: flex; align-items: center; gap: 12px; text-align: left; padding: 14px 16px; min-height: 64px; background: none; border: 0; color: var(--text); }
	.head :global(svg:last-child) { color: var(--faint); transition: transform .2s; flex: none; }
	.topic.open .head :global(svg:last-child) { transform: rotate(90deg); }
	.idx { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: var(--raised); color: var(--muted); font-size: var(--fs-small); font-weight: 600; flex: none; }
	.tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
	.tx b { font-size: 15px; font-weight: 600; }
	.tx small { color: var(--muted); font-size: 13px; line-height: 1.4; }
	.bodyx { padding: 0 16px 18px; }
	.watch { display: grid; gap: 8px; margin-bottom: 14px; }
	.wbtn { justify-content: flex-start; text-align: left; padding: 8px 16px; height: auto; min-height: 48px; font-weight: 500; }
	.wbtn span { flex: 1; }
	.wbtn :global(svg) { flex: none; color: var(--accent); }
	.notes { color: var(--muted); line-height: 1.65; font-size: 15px; overflow-wrap: anywhere; }
	.notes :global(p) { margin: 0 0 12px; }
	.notes :global(strong) { color: var(--text); font-weight: 600; }
	.notes :global(code) { background: var(--raised); padding: 1px 6px; border-radius: 5px; font-size: 13px; color: var(--text); }
	.notes :global(pre) { background: var(--raised); padding: 14px; border-radius: var(--radius-row); overflow-x: auto; margin: 0 0 14px; }
	.notes :global(pre code) { background: none; padding: 0; }
	.notes :global(ul), .notes :global(ol) { padding-left: 20px; margin: 0 0 12px; }
	.notes :global(li) { margin: 4px 0; }
	.try { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
	.small { min-height: 44px; padding: 0 14px; font-size: 13px; }

	/* Landscape phones are short: drop the tagline, tighten the header and list topics in two columns (an open topic spans both). */
	@media (orientation: landscape) and (max-height: 560px) {
		.db { max-width: 1100px; padding-left: max(16px, env(safe-area-inset-left)); padding-right: max(16px, env(safe-area-inset-right)); padding-top: 8px; }
		header .muted { display: none; }
		.stats { margin-top: 4px; }
		.tabs { margin: 8px 0 10px; }
		.topics { grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
		.topic.open { grid-column: 1 / -1; }
		.notes { max-width: 70ch; }
	}
</style>
