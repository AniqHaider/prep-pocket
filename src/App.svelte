<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { view } from './dojo/lib/stores.js';
	import Dojo from './dojo/Dojo.svelte';
	import Prep from './prep/Prep.svelte';
	import Prep2 from './prep2/Prep2.svelte';
	import Drills from './drills/Drills.svelte';
	import More from './settings/More.svelte';

	type Tab = 'dojo' | 'prep' | 'prep2' | 'drills' | 'more';
	const GROUPS: { title: string; items: { id: Tab; icon: string; label: string; sub: string }[] }[] = [
		{ title: 'Backend', items: [{ id: 'dojo', icon: '⛩️', label: 'Dojo', sub: 'Python + SQL, XP & streaks' }] },
		{
			title: 'Frontend prep',
			items: [
				{ id: 'prep', icon: '🧠', label: 'Svelte + TypeScript', sub: '100 MCQs + theory scripts' },
				{ id: 'prep2', icon: '⚛️', label: 'React + Next + TS', sub: '500 MCQs · React 19, Next 16' }
			]
		},
		{ title: 'Practice', items: [{ id: 'drills', icon: '⌨️', label: 'Drills', sub: 'debounce, LRU, promise pool…' }] },
		{ title: 'App', items: [{ id: 'more', icon: '⚙️', label: 'More', sub: 'Tutor, models, progress' }] }
	];
	const ALL = GROUPS.flatMap((g) => g.items);
	const TAB_IDS = new Set<string>(ALL.map((t) => t.id));
	const stored = localStorage.getItem('prep-pocket:tab') ?? '';

	let tab = $state<Tab>(TAB_IDS.has(stored) ? (stored as Tab) : 'dojo');
	let drawer = $state(false);
	let restoring = false;
	const current = $derived(ALL.find((t) => t.id === tab)!);

	// Android's back button == history.back(). Every tab switch / Dojo screen change pushes an entry,
	// so Back steps through them and exits the app only from the first screen.
	const snapshot = () => ({ tab, view: get(view), drawer });

	onMount(() => {
		history.replaceState(snapshot(), '');
		const unsub = view.subscribe(() => {
			if (restoring || !history.state) return;
			if (JSON.stringify(history.state.view) !== JSON.stringify(get(view))) history.pushState(snapshot(), '');
		});
		const onPop = (e: PopStateEvent) => {
			if (!e.state) return;
			restoring = true;
			tab = e.state.tab;
			drawer = !!e.state.drawer;
			view.set(e.state.view);
			restoring = false;
		};
		window.addEventListener('popstate', onPop);
		return () => {
			unsub();
			window.removeEventListener('popstate', onPop);
		};
	});

	function persist(t: Tab) {
		try {
			localStorage.setItem('prep-pocket:tab', t);
		} catch {
			/* ignore */
		}
	}

	// Opening the drawer pushes a history entry so Android's Back button closes it first.
	function openDrawer() {
		drawer = true;
		history.pushState(snapshot(), '');
	}

	function closeDrawer() {
		if (drawer) history.back(); // popstate handler flips `drawer` off
	}

	function go(t: Tab) {
		if (t === tab) return closeDrawer();
		tab = t;
		persist(t);
		drawer = false;
		history.replaceState(snapshot(), ''); // reuse the drawer's history entry instead of stacking another
		window.scrollTo(0, 0);
	}
</script>

<header class="appbar">
	<button class="menu" onclick={openDrawer} aria-label="Open menu" aria-expanded={drawer} data-testid="menu">
		<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
	</button>
	<span class="ico">{current.icon}</span>
	<span class="ttl" data-testid="title">{current.label}</span>
</header>

<div class="screen">
	{#if tab === 'dojo'}<Dojo />{:else if tab === 'prep'}<Prep />{:else if tab === 'prep2'}<Prep2 />{:else if tab === 'drills'}<Drills />{:else}<More />{/if}
</div>

{#if drawer}
	<button class="scrim" onclick={closeDrawer} aria-label="Close menu" tabindex="-1"></button>
{/if}
<nav class="drawer" class:open={drawer} aria-label="Main" aria-hidden={!drawer} inert={!drawer}>
	<div class="brand"><span class="logo">⛩️</span><div><b>Kata</b><small>pocket dev dojo</small></div></div>
	{#each GROUPS as g}
		<div class="grp">{g.title}</div>
		{#each g.items as t}
			<button class="item" class:on={tab === t.id} onclick={() => go(t.id)} aria-current={tab === t.id ? 'page' : undefined} data-testid="nav-{t.id}">
				<span class="i">{t.icon}</span>
				<span class="tx"><b>{t.label}</b><small>{t.sub}</small></span>
			</button>
		{/each}
	{/each}
</nav>

<style>
	.appbar {
		position: sticky; top: 0; z-index: 45; display: flex; align-items: center; gap: 10px;
		height: var(--bar-top); padding: var(--safe-t) 12px 0 6px;
		background: #0f141d; border-bottom: 1px solid #1f2735;
	}
	.menu { width: 40px; height: 40px; display: grid; place-items: center; background: none; border: 0; border-radius: 10px; color: #e8eef6; }
	.menu:active { background: #1a2230; }
	.ico { font-size: 18px; }
	.ttl { font-weight: 700; font-size: 16px; letter-spacing: -.01em; }
	/* the bar owns the status-bar inset, so screens must not add it again */
	.screen { --safe-t: 0px; min-height: calc(100dvh - var(--bar-h)); padding-bottom: var(--safe-b); }

	.scrim { position: fixed; inset: 0; z-index: 70; background: rgba(3, 6, 12, .6); border: 0; padding: 0; animation: fade .18s; }
	.drawer {
		position: fixed; top: 0; bottom: 0; left: 0; z-index: 80; width: min(82vw, 320px);
		padding: calc(var(--safe-t) + 16px) 12px calc(var(--safe-b) + 16px); overflow-y: auto;
		background: #0f141d; border-right: 1px solid #1f2735; box-shadow: 8px 0 32px rgba(0, 0, 0, .45);
		transform: translateX(-102%); transition: transform .2s ease; visibility: hidden;
	}
	.drawer.open { transform: none; visibility: visible; }
	.brand { display: flex; align-items: center; gap: 12px; padding: 4px 8px 14px; }
	.brand .logo { font-size: 30px; }
	.brand b { display: block; font-size: 20px; letter-spacing: -.02em; }
	.brand small { color: #7f90a8; font-size: 12px; }
	.grp { color: #6b7d96; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; padding: 14px 10px 6px; }
	.item { width: 100%; display: flex; align-items: center; gap: 12px; text-align: left; background: none; border: 0; border-radius: 12px; padding: 10px; color: #c4d0e0; }
	.item:active { background: #1a2230; }
	.item.on { background: #16315a; color: #fff; }
	.item .i { font-size: 22px; width: 30px; text-align: center; }
	.item .tx { display: flex; flex-direction: column; min-width: 0; }
	.item b { font-size: 15px; }
	.item small { color: #7f90a8; font-size: 12px; }
	.item.on small { color: #a9c1e6; }
	@keyframes fade { from { opacity: 0; } }
</style>
