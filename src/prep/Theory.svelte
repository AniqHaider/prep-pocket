<script lang="ts">
	import type { Theory } from './types';
	import { inline } from './inline';
	import { publish } from '../assistant/context';
	import Icon from '../ui/Icon.svelte';

	let { theory }: { theory: Theory } = $props();

	const KEY = 'stp-theory-v1';
	let idx = $state(0);
	let hideSay = $state(false); // practice mode: say it aloud first, then reveal
	let revealed = $state(false);
	let known = $state<Record<string, boolean>>({});
	let loaded = false;

	const section = $derived(theory.sections[idx]);
	const knownCount = $derived(theory.sections.filter((s) => known[theory.id + ':' + s.id]).length);
	const isKnown = $derived(!!known[theory.id + ':' + section.id]);
	const showSay = $derived(!hideSay || revealed);

	$effect(() =>
		publish('prep-theory', {
			label: `${theory.title} · theory`,
			text: `Interview theory script "${theory.title}", section ${idx + 1}/${theory.sections.length}: ${section.heading}\n` +
				(section.say ? `Talking script: ${section.say}\n` : '') +
				`Key points:\n- ${section.points.join('\n- ')}`
		})
	);

	$effect(() => {
		if (loaded) return;
		try {
			known = JSON.parse(localStorage.getItem(KEY) ?? '{}');
		} catch {
			/* ignore */
		}
		loaded = true;
	});

	function toggleKnown() {
		known[theory.id + ':' + section.id] = !isKnown;
		try {
			localStorage.setItem(KEY, JSON.stringify(known));
		} catch {
			/* ignore */
		}
	}

	function go(n: number) {
		idx = Math.max(0, Math.min(theory.sections.length - 1, n));
		revealed = false;
		document.getElementById('theory-top')?.scrollIntoView({ block: 'start' });
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'ArrowRight') go(idx + 1);
		else if (e.key === 'ArrowLeft') go(idx - 1);
	}
</script>

<svelte:window onkeydown={onKey} />

<div id="theory-top">
	<header>
		<h1>{theory.title}</h1>
		<p class="muted">{theory.tagline}</p>
		<div class="meta">
			<span class="muted num">{knownCount} of {theory.sections.length} sections I can explain</span>
			<label class="check">
				<input type="checkbox" bind:checked={hideSay} onchange={() => (revealed = false)} />
				Practice mode — hide the script, say it aloud first
			</label>
		</div>
		<div class="bar" role="progressbar" aria-label="Sections I can explain" aria-valuemin="0" aria-valuemax={theory.sections.length} aria-valuenow={knownCount}><div style="width:{(knownCount / theory.sections.length) * 100}%"></div></div>
	</header>

	<nav class="toc" aria-label="Sections">
		{#each theory.sections as s, n}
			<button class="toc-item" class:on={n === idx} class:done={known[theory.id + ':' + s.id]} aria-current={n === idx ? 'step' : undefined} onclick={() => go(n)}>
				<span class="num">{n + 1}</span>{s.heading.replace(/ \(.*\)$/, '')}{#if known[theory.id + ':' + s.id]}<Icon name="check" size={14} label="explainable" />{/if}
			</button>
		{/each}
	</nav>

	<article class="card" data-testid="theory-card">
		<h2>{section.heading}</h2>

		{#if section.say}
			<div class="say">
				<div class="say-h"><Icon name="mic" size={16} />Say it like this</div>
				{#if showSay}
					<p>{section.say}</p>
				{:else}
					<button class="reveal" onclick={() => (revealed = true)}>Reveal the script (after you've tried)</button>
				{/if}
			</div>
		{/if}

		<h3>Key points</h3>
		<ul>
			{#each section.points as p}
				<li>{#each inline(p) as seg}{#if seg.kind === 'code'}<code>{seg.t}</code>{:else if seg.kind === 'bold'}<b>{seg.t}</b>{:else}{seg.t}{/if}{/each}</li>
			{/each}
		</ul>

		{#if section.code}
			{#if section.code.title}<div class="code-t">{section.code.title}</div>{/if}
			<pre><code>{section.code.text}</code></pre>
		{/if}

		{#if section.tip}
			<div class="tip"><Icon name="sparkle" size={16} /><span>{section.tip}</span></div>
		{/if}

		<div class="nav">
			<button class="btn" onclick={() => go(idx - 1)} disabled={idx === 0}><Icon name="back" size={16} />Prev</button>
			<button class="btn known" class:on={isKnown} aria-pressed={isKnown} onclick={toggleKnown}>{#if isKnown}<Icon name="check" size={16} />I can explain this{:else}Mark as explainable{/if}</button>
			<button class="btn primary" onclick={() => go(idx + 1)} disabled={idx === theory.sections.length - 1}>Next<Icon name="chevron" size={16} /></button>
		</div>
	</article>
</div>

<style>
	header { padding: 0 2px; }
	h1 { margin: 8px 0 4px; font-size: var(--fs-title); font-weight: 600; letter-spacing: -.01em; }
	h2 { margin: 0 0 14px; font-size: 18px; font-weight: 600; }
	h3 { margin: 22px 0 8px; font-size: var(--fs-section); font-weight: 600; }
	.muted { color: var(--muted); }
	.num { font-variant-numeric: tabular-nums; }
	.meta { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px 12px; margin-top: 10px; align-items: center; font-size: var(--fs-body); }
	.check { color: var(--muted); font-size: var(--fs-body); display: flex; gap: 10px; align-items: center; min-height: 44px; }
	.check input { width: 20px; height: 20px; accent-color: var(--text); }
	.bar { height: 4px; background: var(--raised); border-radius: 9px; overflow: hidden; margin-top: 4px; }
	.bar > div { height: 100%; background: var(--accent); transition: width .25s; }
	.toc { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
	.toc-item { min-height: 44px; background: var(--surface); border: 1px solid var(--rule); border-radius: var(--radius-control); padding: 0 14px; font-size: var(--fs-body); color: var(--muted); display: flex; gap: 8px; align-items: center; }
	.toc-item .num { color: var(--faint); }
	.toc-item.on { background: var(--raised); border-color: var(--text); color: var(--text); font-weight: 600; }
	.toc-item.done :global(svg) { color: var(--accent); }
	.card { background: var(--surface); border-radius: var(--radius-card); padding: var(--pad); border: 1px solid var(--rule); }
	.say { background: var(--raised); border-radius: var(--radius-row); padding: 14px 16px; }
	.say-h { display: flex; align-items: center; gap: 8px; font-size: var(--fs-small); color: var(--muted); font-weight: 600; margin-bottom: 6px; }
	.say p { margin: 0; line-height: 1.65; }
	.reveal { min-height: 44px; background: transparent; border: 1px dashed var(--control); color: var(--text); border-radius: var(--radius-row); padding: 0 14px; font-size: var(--fs-body); }
	ul { margin: 0; padding-left: 1.2rem; display: grid; gap: 8px; }
	li code { background: var(--raised); border-radius: 6px; padding: 1px 6px; font-family: var(--mono); font-size: .88em; }
	.code-t { margin: 16px 0 6px; font-size: var(--fs-small); color: var(--muted); }
	pre { background: var(--raised); border-radius: var(--radius-row); padding: 14px; overflow-x: auto; font-family: var(--mono); font-size: 13px; line-height: 1.55; margin: 0; }
	.code-t + pre { margin-top: 0; }
	.tip { display: flex; gap: 10px; align-items: flex-start; margin-top: 16px; padding: 12px 14px; border-radius: var(--radius-row); background: var(--pill-warning-bg); color: var(--pill-warning-ink); }
	.tip :global(svg) { flex: none; margin-top: 2px; }
	.nav { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; gap: 8px; flex-wrap: wrap; }
	.nav :global(.btn) { gap: 6px; padding: 0 16px; }
	.known.on { background: var(--pill-positive-bg); border-color: transparent; }
	.known.on :global(svg) { color: var(--accent); }
</style>
