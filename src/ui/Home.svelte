<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import { progress, refreshAll } from '../dojo/lib/stores.js';

	type Item = { id: string; icon: string; label: string; sub: string };
	type Group = { title: string; items: Item[] };
	let { groups, last, onpick }: { groups: Group[]; last: string; onpick: (id: string) => void } = $props();

	// One hue per section so a tile is recognisable at a glance; the tile colours come from it.
	const HUE: Record<string, number> = {
		dojo: 150, cs: 205, ai: 275, py: 48, aws: 28, visual: 320, js: 52, ts: 215, react: 190, next: 240, pg: 220, mysql: 25, mongo: 140,
		prep: 12, prep2: 262, drills: 45, interview: 335
	};
	const hue = (id: string) => HUE[id] ?? 250;

	const h = new Date().getHours();
	const hello = h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
	const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

	const all = $derived(groups.flatMap((g) => g.items));
	const resume = $derived(all.find((t) => t.id === last) ?? all[0]);

	onMount(() => { refreshAll().catch(() => {}); });
</script>

<main class="home" data-testid="home">
	<header class="hero">
		<p class="date">{today}</p>
		<h1>{hello}.</h1>
		<div class="stats" aria-label="Your progress">
			<span class="stat"><Icon name="flame" size={16} /><b class="num">{$progress.current_streak}</b> day streak</span>
			<span class="stat"><b class="num">{$progress.xp}</b> XP</span>
			<span class="stat"><Icon name="check" size={16} /><b class="num">{$progress.solved_count}</b> solved</span>
		</div>
	</header>

	{#if resume}
		<button class="resume" style="--h:{hue(resume.id)}" onclick={() => onpick(resume.id)} data-testid="home-continue">
			<span class="chip"><Icon name={resume.icon as never} size={24} /></span>
			<span class="tx"><small>Continue</small><b>{resume.label}</b><em>{resume.sub}</em></span>
			<Icon name="chevron" size={20} />
		</button>
	{/if}

	{#each groups as g}
		<section>
			<h2>{g.title}</h2>
			<div class="grid">
				{#each g.items as t, i}
					<button class="tile" class:wide={g.items.length % 2 === 1 && i === g.items.length - 1} style="--h:{hue(t.id)}" onclick={() => onpick(t.id)} data-testid="home-{t.id}">
						<span class="chip"><Icon name={t.icon as never} size={22} /></span>
						<span class="t"><b>{t.label}</b><small>{t.sub}</small></span>
					</button>
				{/each}
			</div>
		</section>
	{/each}
</main>

<style>
	.home { padding: 20px var(--pad) 8px; display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px; }
	.hero { padding: 6px 0 14px; }
	.date { margin: 0; color: var(--faint); font-size: var(--fs-small); }
	h1 { margin: 2px 0 14px; font-size: 30px; font-weight: 650; letter-spacing: -.03em; line-height: 1.1; }
	.stats { display: flex; flex-wrap: wrap; gap: 8px; }
	.stat { display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 12px; border-radius: 999px; background: var(--surface); color: var(--muted); font-size: 13px; }
	.stat b { color: var(--text); font-weight: 600; }
	.stat :global(svg) { color: var(--accent); }

	.resume {
		width: 100%; display: flex; align-items: center; gap: 14px; text-align: left; padding: 16px; border: 0; color: var(--text);
		border-radius: var(--radius-card); margin: 4px 0 10px; min-height: 84px;
		background: linear-gradient(135deg, hsl(var(--h) 55% 28%), var(--brand-soft) 78%);
	}
	.resume:active { filter: brightness(1.12); }
	.resume .tx { display: flex; flex-direction: column; min-width: 0; flex: 1; gap: 1px; }
	.resume small { color: hsl(var(--h) 80% 86%); font-size: var(--fs-small); font-weight: 500; }
	.resume b { font-size: 18px; font-weight: 600; letter-spacing: -.01em; }
	.resume em { font-style: normal; color: hsl(var(--h) 30% 84%); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

	section { margin-top: 12px; }
	h2 { margin: 0 2px 10px; font-size: 13px; font-weight: 600; color: var(--muted); letter-spacing: .01em; }
	.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
	.tile {
		display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left; padding: 14px; min-height: 124px;
		background: var(--surface); border: 0; border-radius: var(--radius-card); color: var(--text);
	}
	.tile:active { background: var(--raised); }
	.tile.wide { grid-column: 1 / -1; min-height: 0; flex-direction: row; align-items: center; gap: 14px; }
	.t { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
	.tile b { font-size: 15px; font-weight: 600; margin-top: 8px; }
	.tile.wide b { margin-top: 0; }
	.tile small { color: var(--faint); font-size: var(--fs-small); line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
	.tile.wide small { -webkit-line-clamp: 2; line-clamp: 2; }
	.chip {
		width: 40px; height: 40px; border-radius: 13px; display: grid; place-items: center; flex: none;
		background: hsl(var(--h) 45% 22%); color: hsl(var(--h) 90% 78%);
	}
	.resume .chip { width: 48px; height: 48px; border-radius: 15px; background: hsl(var(--h) 45% 16% / .7); }
</style>
