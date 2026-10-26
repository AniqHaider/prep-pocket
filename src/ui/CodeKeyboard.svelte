<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import { kb, setKbMode, targetFor } from './kbState.svelte';

	/** The in-app keyboard for code: letters, numbers, every symbol programmers reach for, Tab and cursor keys. Replaces the phone keyboard in code editors. */
	type Layer = 'abc' | 'num' | 'sym';
	let layer = $state<Layer>('abc');
	let shift = $state<'off' | 'once' | 'lock'>('off');
	let panel: HTMLDivElement | undefined = $state();

	const ROWS: Record<Layer, string[][]> = {
		abc: [['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], ['z', 'x', 'c', 'v', 'b', 'n', 'm']],
		num: [['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], ['=', '+', '-', '*', '/', '%', '_', '<', '>', '&'], ['!', '?', ':', '"', "'", '`', '.']],
		sym: [['~', '^', '@', '#', '$', '|', '\\', '`', '&', '_'], ['<', '>', '(', ')', '[', ']', '{', '}', '=', '+'], ['!', '?', '-', '*', '/', '%', ':']]
	};
	// brackets and ; are on every layer: they are most of what code is made of
	const CODE_ROW = ['(', ')', '{', '}', '[', ']', ';'];

	const NAMES: Record<string, string> = {
		'(': 'open parenthesis', ')': 'close parenthesis', '{': 'open brace', '}': 'close brace', '[': 'open bracket', ']': 'close bracket', ';': 'semicolon',
		'<': 'less than', '>': 'greater than', '=': 'equals', '+': 'plus', '-': 'minus', '*': 'asterisk', '/': 'slash', '\\': 'backslash', '%': 'percent',
		_: 'underscore', '&': 'ampersand', '|': 'pipe', '!': 'exclamation mark', '?': 'question mark', ':': 'colon', '"': 'double quote', "'": 'single quote',
		'`': 'backtick', '.': 'period', ',': 'comma', '~': 'tilde', '^': 'caret', '@': 'at sign', '#': 'hash', $: 'dollar sign'
	};
	const nameOf = (k: string) => NAMES[k] ?? k;

	const visible = $derived(kb.mode === 'app' && !!kb.target && !kb.collapsed);
	const upper = $derived(layer === 'abc' && shift !== 'off');

	function press(k: string) {
		const t = kb.target;
		if (!t) return;
		t.insert(layer === 'abc' && shift !== 'off' ? k.toUpperCase() : k);
		if (shift === 'once') shift = 'off';
	}
	const act = (fn: (t: NonNullable<typeof kb.target>) => void) => { const t = kb.target; if (t) fn(t); };

	function tapShift() {
		shift = shift === 'off' ? 'once' : shift === 'once' ? 'lock' : 'off';
	}

	// Backspace and the arrows repeat while held. A plain click (screen reader, switch access, keyboard) does one step.
	function repeat(node: HTMLElement, fn: () => void) {
		let hold: ReturnType<typeof setTimeout> | undefined, rep: ReturnType<typeof setInterval> | undefined, viaPointer = false;
		const stop = () => { clearTimeout(hold); clearInterval(rep); hold = rep = undefined; };
		const down = () => { viaPointer = true; fn(); hold = setTimeout(() => { rep = setInterval(fn, 55); }, 380); };
		const cancel = () => { stop(); viaPointer = false; };
		const click = () => { if (!viaPointer) fn(); viaPointer = false; };
		node.addEventListener('pointerdown', down);
		node.addEventListener('pointerup', stop);
		node.addEventListener('pointerleave', cancel);
		node.addEventListener('pointercancel', cancel);
		node.addEventListener('click', click);
		return { destroy() { stop(); node.removeEventListener('pointerdown', down); node.removeEventListener('pointerup', stop); node.removeEventListener('pointerleave', cancel); node.removeEventListener('pointercancel', cancel); node.removeEventListener('click', click); } };
	}

	// Follow focus: typing into a code editor opens the keyboard; leaving it for anything else closes it.
	let closeTimer: ReturnType<typeof setTimeout> | undefined;
	function onFocusIn(e: FocusEvent) {
		const t = targetFor(e.target as Element);
		clearTimeout(closeTimer);
		if (t) { kb.target = t; kb.collapsed = false; }
		else kb.target = null;
	}
	function onFocusOut() {
		clearTimeout(closeTimer);
		closeTimer = setTimeout(() => { if (!targetFor(document.activeElement)) kb.target = null; }, 160);
	}
	// Tapping an editor that already has focus (after the keyboard was hidden) brings it back.
	function onTap(e: Event) {
		if (kb.collapsed && targetFor(e.target as Element)) kb.collapsed = false;
	}

	function hide() { kb.collapsed = true; (document.activeElement as HTMLElement | null)?.blur(); }

	// Reserve room under the page so the editor can scroll clear of the keyboard.
	$effect(() => {
		const root = document.documentElement;
		if (!visible) { root.style.removeProperty('--kb-h'); root.classList.remove('kb-open'); return; }
		const el = panel;
		if (!el) return;
		const apply = () => { root.style.setProperty('--kb-h', el.offsetHeight + 'px'); };
		apply();
		root.classList.add('kb-open');
		const ro = new ResizeObserver(apply);
		ro.observe(el);
		const tgt = kb.target?.el;
		const land = matchMedia('(orientation: landscape) and (max-height: 560px)').matches;
		requestAnimationFrame(() => tgt?.scrollIntoView({ block: land ? 'start' : 'nearest', behavior: 'smooth' }));
		return () => { ro.disconnect(); root.style.removeProperty('--kb-h'); root.classList.remove('kb-open'); };
	});

	onMount(() => {
		document.addEventListener('focusin', onFocusIn);
		document.addEventListener('focusout', onFocusOut);
		document.addEventListener('click', onTap);
		return () => {
			document.removeEventListener('focusin', onFocusIn);
			document.removeEventListener('focusout', onFocusOut);
			document.removeEventListener('click', onTap);
		};
	});

	// A pointerdown on a key must not steal focus from the editor.
	const keep = (e: Event) => e.preventDefault();
</script>

{#if visible}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="kbd" bind:this={panel} role="group" aria-label="Code keyboard" onpointerdown={keep} onmousedown={keep} data-testid="code-keyboard">
		<div class="row top">
			<button class="k fn" aria-label="Tab" onclick={() => act((t) => t.tab())}>Tab</button>
			{#each CODE_ROW as c}
				<button class="k" aria-label={nameOf(c)} onclick={() => press(c)}>{c}</button>
			{/each}
			<button class="k fn" aria-label="Undo" onclick={() => act((t) => t.undo())}><Icon name="replay" size={18} /></button>
			<button class="k fn" aria-label="Hide the code keyboard" onclick={hide}><Icon name="chevron" size={18} /></button>
		</div>

		{#each ROWS[layer] as row, i}
			<div class="row">
				{#if i === 2}
					{#if layer === 'abc'}
						<button class="k fn wide" class:on={shift !== 'off'} aria-pressed={shift !== 'off'} aria-label={shift === 'lock' ? 'Caps lock on' : shift === 'once' ? 'Shift on' : 'Shift'} onclick={tapShift}>{shift === 'lock' ? 'ABC' : 'Shift'}</button>
					{:else}
						<button class="k fn wide" aria-label={layer === 'num' ? 'More symbols' : 'Numbers'} onclick={() => (layer = layer === 'num' ? 'sym' : 'num')}>{layer === 'num' ? '#+=' : '123'}</button>
					{/if}
				{/if}
				{#each row as k}
					<button class="k" aria-label={nameOf(upper ? k.toUpperCase() : k)} onclick={() => press(k)}>{upper ? k.toUpperCase() : k}</button>
				{/each}
				{#if i === 2}
					<button class="k fn wide" aria-label="Backspace" use:repeat={() => act((t) => t.backspace())}><span aria-hidden="true">⌫</span></button>
				{/if}
			</div>
		{/each}

		<div class="row bottom">
			<button class="k fn wide" aria-label={layer === 'abc' ? 'Numbers and symbols' : 'Letters'} onclick={() => (layer = layer === 'abc' ? 'num' : 'abc')}>{layer === 'abc' ? '123' : 'abc'}</button>
			<button class="k" aria-label="comma" onclick={() => press(',')}>,</button>
			<button class="k space" aria-label="Space" onclick={() => press(' ')}><span aria-hidden="true">space</span></button>
			<button class="k" aria-label="period" onclick={() => press('.')}>.</button>
			<button class="k fn" aria-label="Cursor left" use:repeat={() => act((t) => t.left())}>←</button>
			<button class="k fn" aria-label="Cursor right" use:repeat={() => act((t) => t.right())}>→</button>
			<button class="k fn" aria-label="Cursor up" use:repeat={() => act((t) => t.up())}>↑</button>
			<button class="k fn" aria-label="Cursor down" use:repeat={() => act((t) => t.down())}>↓</button>
			<button class="k go wide" aria-label="New line" onclick={() => act((t) => t.enter())}>Enter</button>
		</div>

		<button class="phone" onclick={() => setKbMode('phone')}>Use the phone keyboard instead</button>
	</div>
{:else if kb.mode === 'phone' && kb.target}
	<button class="pill" onpointerdown={keep} onclick={() => setKbMode('app')} data-testid="code-keyboard-on">Code keyboard</button>
{/if}

<style>
	.kbd {
		position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; background: #0b0b0b; border-top: 1px solid var(--rule);
		padding: 8px 6px calc(6px + var(--safe-b)); display: grid; gap: 6px; user-select: none; -webkit-user-select: none; touch-action: manipulation;
	}
	.row { display: flex; gap: 5px; justify-content: center; }
	.k {
		flex: 1 1 0; min-width: 0; height: 44px; border: 0; border-radius: 9px; background: var(--raised); color: var(--text);
		font: 500 18px var(--mono); padding: 0; display: inline-flex; align-items: center; justify-content: center;
	}
	.k:active { background: #444; }
	.k.fn { background: #1b1b1b; color: var(--muted); font: 500 13px var(--font); }
	.k.fn:active { background: #333; }
	.k.fn.on { background: #333; color: var(--text); }
	.k.wide { flex: 1.5 1 0; }
	.k.space { flex: 3 1 0; font: 500 12px var(--font); color: var(--faint); }
	.k.go { background: var(--text); color: #000; font: 600 14px var(--font); }
	.k.go:active { background: #d9d9d9; }
	.row.top .k { height: 40px; font-size: 17px; }
	.k:focus-visible { outline-offset: -2px; }
	.phone { justify-self: center; background: transparent; border: 0; color: var(--faint); font-size: 12px; min-height: 28px; padding: 0 12px; text-decoration: underline; text-underline-offset: 3px; }
	.pill {
		position: fixed; right: 12px; bottom: calc(12px + var(--safe-b)); z-index: 60; min-height: 44px; padding: 0 18px; border-radius: 999px;
		border: 1px solid var(--control); background: var(--surface); color: var(--text); font-weight: 600; font-size: 13px;
	}
	/* Landscape phones: shorter keys so the editor keeps room above the keyboard. */
	@media (orientation: landscape) and (max-height: 560px) {
		.kbd { gap: 3px; padding: 4px 6px calc(4px + var(--safe-b)); }
		.k { height: 32px; font-size: 16px; }
		.row.top .k { height: 28px; }
		.phone { display: none; }
	}
</style>
