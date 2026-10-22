<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { view } from './dojo/lib/stores.js';
	import Dojo from './dojo/Dojo.svelte';
	import Prep from './prep/Prep.svelte';
	import Prep2 from './prep2/Prep2.svelte';
	import Assistant from './assistant/Assistant.svelte';
	import Drills from './drills/Drills.svelte';
	import More from './settings/More.svelte';
	import Icon from './ui/Icon.svelte';

	type Tab = 'dojo' | 'prep' | 'prep2' | 'drills' | 'more';
	const GROUPS: { title: string; items: { id: Tab; icon: 'dojo' | 'frontend' | 'react' | 'drills' | 'settings'; label: string; sub: string }[] }[] = [
		{ title: 'Learn', items: [{ id: 'dojo', icon: 'dojo', label: 'Backend lab', sub: 'Python + SQL, XP and streaks' }] },
		{
			title: 'Frontend prep',
			items: [
				{ id: 'prep', icon: 'frontend', label: 'Svelte + TypeScript', sub: '100 MCQs + theory scripts' },
				{ id: 'prep2', icon: 'react', label: 'React + Next + TS', sub: '500 MCQs · React 19, Next 16' }
			]
		},
		{ title: 'Practice', items: [{ id: 'drills', icon: 'drills', label: 'Drills', sub: 'debounce, LRU, promise pool…' }] },
		{ title: 'App', items: [{ id: 'more', icon: 'settings', label: 'Settings', sub: 'AI models, progress, backup' }] }
	];
	const ALL = GROUPS.flatMap((g) => g.items);
	const TAB_IDS = new Set<string>(ALL.map((t) => t.id));
	const stored = localStorage.getItem('prep-pocket:tab') ?? '';

	let tab = $state<Tab>(TAB_IDS.has(stored) ? (stored as Tab) : 'dojo');
	let drawer = $state(false);
	let assistant = $state(false); // app-level assistant sheet (every section except the Backend lab, which has its own tutor)
	let restoring = false;
	const current = $derived(ALL.find((t) => t.id === tab)!);

	// Android's back button == history.back(). Every tab switch / Backend lab screen change pushes an entry,
	// so Back steps through them and exits the app only from the first screen.
	const snapshot = () => ({ tab, view: get(view), drawer, assistant });

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
			assistant = !!e.state.assistant;
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

	// Same pattern for the assistant sheet: Back closes it before anything else.
	function openAssistant() {
		assistant = true;
		history.pushState(snapshot(), '');
	}
	function closeAssistant() {
		if (assistant) history.back();
	}

	function go(t: Tab) {
		if (t === tab) return closeDrawer();
		tab = t;
		assistant = false;
		persist(t);
		drawer = false;
		history.replaceState(snapshot(), ''); // reuse the drawer's history entry instead of stacking another
		window.scrollTo(0, 0);
	}
</script>

<header class="appbar">
	<button class="menu" onclick={openDrawer} aria-label="Open menu" aria-expanded={drawer} data-testid="menu"><Icon name="menu" size={22} /></button>
	<span class="ttl" data-testid="title">{current.label}</span>
</header>

<div class="screen" class:pad={tab !== 'dojo'}>
	{#if tab === 'dojo'}<Dojo />{:else if tab === 'prep'}<Prep />{:else if tab === 'prep2'}<Prep2 />{:else if tab === 'drills'}<Drills />{:else}<More />{/if}
</div>

{#if tab !== 'dojo'}
	<Assistant open={assistant} onopen={openAssistant} onclose={closeAssistant} />
{/if}

{#if drawer}
	<button class="scrim" onclick={closeDrawer} aria-label="Close menu" tabindex="-1"></button>
{/if}
<nav class="drawer" class:open={drawer} aria-label="Main" aria-hidden={!drawer} inert={!drawer}>
	<div class="brand">
		<svg class="mark" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M9 25V5h6.5a5.75 5.75 0 0 1 0 11.5H9" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" /><circle cx="21.5" cy="23.5" r="2.4" fill="currentColor" /></svg>
		<div><b>Preppy</b><small>Study offline. Keep the streak.</small></div>
	</div>
	{#each GROUPS as g}
		<div class="grp">{g.title}</div>
		{#each g.items as t}
			<button class="item" class:on={tab === t.id} onclick={() => go(t.id)} aria-current={tab === t.id ? 'page' : undefined} data-testid="nav-{t.id}">
				<span class="i"><Icon name={t.icon} size={20} /></span>
				<span class="tx"><b>{t.label}</b><small>{t.sub}</small></span>
			</button>
		{/each}
	{/each}
</nav>

<style>
	.appbar {
		position: sticky; top: 0; z-index: 45; display: flex; align-items: center; gap: 4px;
		height: var(--bar-top); padding: var(--safe-t) 8px 0 4px;
		background: var(--ground); border-bottom: 1px solid var(--border);
	}
	.menu { width: 44px; height: 44px; display: grid; place-items: center; background: none; border: 0; border-radius: 50%; color: var(--text); }
	.menu:active { background: var(--surface); }
	.ttl { margin: 0; font-weight: 600; font-size: 17px; letter-spacing: -.01em; }
	/* the bar owns the status-bar inset, so screens must not add it again */
	.screen { --safe-t: 0px; min-height: calc(100dvh - var(--bar-h)); padding-bottom: calc(var(--safe-b) + 84px); } /* room for the floating Ask / Ask tutor button */

	.scrim { position: fixed; inset: 0; z-index: 70; background: rgba(0, 0, 0, .72); border: 0; padding: 0; animation: fade .18s; }
	.drawer {
		position: fixed; top: 0; bottom: 0; left: 0; z-index: 80; width: min(84vw, 320px);
		padding: calc(var(--safe-t) + 20px) 12px calc(var(--safe-b) + 16px); overflow-y: auto;
		background: var(--ground); border-right: 1px solid var(--border);
		transform: translateX(-102%); transition: transform .2s ease; visibility: hidden;
	}
	.drawer.open { transform: none; visibility: visible; }
	.brand { display: flex; align-items: center; gap: 12px; padding: 0 10px 18px; }
	.brand .mark { color: var(--accent); flex: none; }
	.brand b { display: block; font-size: 18px; font-weight: 600; letter-spacing: -.02em; }
	.brand small { color: var(--faint); font-size: var(--fs-small); }
	.grp { color: var(--faint); font-size: var(--fs-small); font-weight: 500; padding: 22px 10px 6px; }
	.item { width: 100%; min-height: 52px; display: flex; align-items: center; gap: 14px; text-align: left; background: none; border: 0; border-radius: var(--radius-row); padding: 6px 10px; color: #bbb; }
	.item:active { background: var(--surface); }
	.item .i { width: 24px; display: grid; place-items: center; flex: none; }
	.item .tx { display: flex; flex-direction: column; min-width: 0; }
	.item b { font-size: 15px; font-weight: 500; }
	.item small { color: var(--faint); font-size: var(--fs-small); }
	/* active = label goes #bbb → #fff (+ heavier weight so it isn't brightness alone) */
	.item.on { color: #fff; background: var(--surface); }
	.item.on b { font-weight: 600; }
	@keyframes fade { from { opacity: 0; } }
</style>
