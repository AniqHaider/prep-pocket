<script lang="ts">
	import type { Theory } from './types';
	import { inline } from './inline';
	import { publish } from '../assistant/context';

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
			<span class="muted small">{knownCount} / {theory.sections.length} sections I can explain</span>
			<label class="check">
				<input type="checkbox" bind:checked={hideSay} onchange={() => (revealed = false)} />
				Practice mode — hide the script, say it aloud first
			</label>
		</div>
		<div class="bar"><div style="width:{(knownCount / theory.sections.length) * 100}%"></div></div>
	</header>

	<nav class="toc" aria-label="Sections">
		{#each theory.sections as s, n}
			<button class="toc-item" class:on={n === idx} class:done={known[theory.id + ':' + s.id]} onclick={() => go(n)}>
				<span class="num">{n + 1}</span>{s.heading.replace(/ \(.*\)$/, '')}
			</button>
		{/each}
	</nav>

	<article class="card" data-testid="theory-card">
		<h2>{section.heading}</h2>

		{#if section.say}
			<div class="say">
				<div class="say-h">🎤 Say it like this</div>
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
			<div class="tip">💡 {section.tip}</div>
		{/if}

		<div class="nav">
			<button class="ghost" onclick={() => go(idx - 1)} disabled={idx === 0}>← Prev</button>
			<button class="known" class:on={isKnown} onclick={toggleKnown}>{isKnown ? '✓ I can explain this' : 'Mark as explainable'}</button>
			<button class="primary" onclick={() => go(idx + 1)} disabled={idx === theory.sections.length - 1}>Next →</button>
		</div>
	</article>
</div>

<style>
	h1 { margin: 12px 0 4px; font-size: 1.7rem; }
	h2 { margin: 0 0 12px; font-size: 1.3rem; }
	h3 { margin: 18px 0 6px; font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
	.muted { color: var(--muted); }
	.small { font-size: .85rem; }
	.meta { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-top: 10px; align-items: center; }
	.check { color: var(--muted); font-size: .85rem; display: flex; gap: 8px; align-items: center; }
	.bar { height: 5px; background: var(--line); border-radius: 9px; overflow: hidden; margin-top: 8px; }
	.bar > div { height: 100%; background: var(--good); transition: width .25s; }
	.toc { display: flex; flex-wrap: wrap; gap: 6px; margin: 16px 0; }
	.toc-item { background: transparent; border: 1px solid var(--line); border-radius: 10px; padding: 5px 10px; font-size: .82rem; color: var(--muted); display: flex; gap: 6px; align-items: center; }
	.toc-item .num { opacity: .6; }
	.toc-item.on { background: var(--panel); border-color: var(--accent); color: var(--text); }
	.toc-item.done { border-color: color-mix(in srgb, var(--good) 60%, var(--line)); }
	.toc-item.done .num { color: var(--good); opacity: 1; }
	.card { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 18px; }
	.say { background: #0d1c3a; border: 1px solid #1f3a6e; border-radius: 12px; padding: 12px 14px; }
	.say-h { font-size: .8rem; color: var(--accent); font-weight: 700; margin-bottom: 4px; }
	.say p { margin: 0; line-height: 1.65; }
	.reveal { background: transparent; border: 1px dashed var(--accent); color: var(--accent); border-radius: 10px; padding: 8px 12px; }
	ul { margin: 0; padding-left: 1.2rem; display: grid; gap: 6px; }
	li code { background: #060a16; border: 1px solid var(--line); border-radius: 6px; padding: 0 5px; font-size: .88em; }
	.code-t { margin: 16px 0 6px; font-size: .8rem; color: var(--muted); }
	pre { background: #060a16; border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; overflow-x: auto; font-size: .85rem; line-height: 1.5; margin: 0; }
	.code-t + pre { margin-top: 0; }
	.tip { margin-top: 16px; padding: 10px 14px; border-radius: 12px; background: #2a2410; border: 1px solid #5c4d12; color: #fde68a; }
	.nav { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; gap: 8px; flex-wrap: wrap; }
	.primary { background: var(--accent); color: #06121f; border: 0; border-radius: 12px; padding: 10px 16px; font-weight: 700; }
	.ghost { background: transparent; border: 1px solid var(--line); border-radius: 12px; padding: 10px 16px; }
	.primary:disabled, .ghost:disabled { opacity: .35; cursor: not-allowed; }
	.known { background: transparent; border: 1px solid var(--line); border-radius: 12px; padding: 10px 14px; color: var(--muted); }
	.known.on { border-color: var(--good); color: var(--good); background: #0d2420; }
</style>
