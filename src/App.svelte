<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { view } from './dojo/lib/stores.js';
	import Dojo from './dojo/Dojo.svelte';
	import Prep from './prep/Prep.svelte';
	import Drills from './drills/Drills.svelte';
	import More from './settings/More.svelte';

	type Tab = 'dojo' | 'prep' | 'drills' | 'more';
	const TABS: { id: Tab; icon: string; label: string }[] = [
		{ id: 'dojo', icon: '⛩️', label: 'Dojo' },
		{ id: 'prep', icon: '🧠', label: 'Prep' },
		{ id: 'drills', icon: '⌨️', label: 'Drills' },
		{ id: 'more', icon: '⚙️', label: 'More' }
	];

	let tab = $state<Tab>((localStorage.getItem('prep-pocket:tab') as Tab) || 'dojo');
	let restoring = false;

	// Android's back button == history.back(). Every tab switch / Dojo screen change pushes an entry,
	// so Back steps through them and exits the app only from the first screen.
	const snapshot = () => ({ tab, view: get(view) });

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
			view.set(e.state.view);
			restoring = false;
		};
		window.addEventListener('popstate', onPop);
		return () => {
			unsub();
			window.removeEventListener('popstate', onPop);
		};
	});

	function go(t: Tab) {
		if (t === tab) return;
		tab = t;
		try {
			localStorage.setItem('prep-pocket:tab', t);
		} catch {
			/* ignore */
		}
		history.pushState(snapshot(), '');
		window.scrollTo(0, 0);
	}
</script>

<div class="screen">
	{#if tab === 'dojo'}<Dojo />{:else if tab === 'prep'}<Prep />{:else if tab === 'drills'}<Drills />{:else}<More />{/if}
</div>

<nav class="bottom" aria-label="Main">
	{#each TABS as t}
		<button class:on={tab === t.id} onclick={() => go(t.id)} aria-current={tab === t.id ? 'page' : undefined} data-testid="nav-{t.id}">
			<span class="i">{t.icon}</span><span class="l">{t.label}</span>
		</button>
	{/each}
</nav>

<style>
	.screen { padding-top: var(--safe-t); padding-bottom: calc(var(--nav-h) + var(--safe-b)); min-height: 100dvh; }
	.bottom {
		position: fixed; left: 0; right: 0; bottom: 0; z-index: 50;
		height: calc(var(--nav-h) + var(--safe-b)); padding-bottom: var(--safe-b);
		display: grid; grid-template-columns: repeat(4, 1fr);
		background: #0f141d; border-top: 1px solid #1f2735;
	}
	.bottom button { background: none; border: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; color: #7f90a8; }
	.bottom button.on { color: #fff; }
	.bottom button.on .i { transform: translateY(-1px) scale(1.12); }
	.i { font-size: 20px; transition: transform .15s; }
	.l { font-size: 11px; font-weight: 600; letter-spacing: .02em; }
</style>
