<script lang="ts">
	import { tick } from 'svelte';
	import { Marked } from 'marked';
	import { appContext } from './context';
	import { askAssistant, type Turn } from './assistant';
	import { loadSettings } from '../settings/settings';
	import Icon from '../ui/Icon.svelte';

	let { open, onopen, onclose }: { open: boolean; onopen: () => void; onclose: () => void } = $props();

	const KEY = 'prep-pocket:assistant:v1';
	// Model output is untrusted text: escape any raw HTML instead of letting marked pass it through.
	const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	const md = new Marked({ renderer: { html: (t: any) => esc(typeof t === 'string' ? t : t.text) } });
	const render = (t: string) => md.parse(t || '', { async: false }) as string;

	function load(): Turn[] {
		try {
			const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
			return Array.isArray(v) ? v.slice(-40) : [];
		} catch {
			return [];
		}
	}
	let turns = $state<Turn[]>(load());
	let input = $state('');
	let busy = $state(false);
	let abort: AbortController | null = null;
	let listEl: HTMLDivElement | undefined = $state();

	const ctx = $derived($appContext);
	const noModel = $derived(loadSettings().provider === 'none');

	function persist() {
		try {
			localStorage.setItem(KEY, JSON.stringify(turns.slice(-40)));
		} catch {
			/* ignore */
		}
	}
	// Follow the stream only while the reader is at the bottom (like Claude / ChatGPT): scrolling up pauses it,
	// sending a message or opening the sheet jumps to the end again.
	let stick = true;
	const onListScroll = () => {
		if (listEl) stick = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 80;
	};
	async function toEnd(force = false) {
		if (force) stick = true;
		await tick();
		if (listEl && stick) listEl.scrollTop = listEl.scrollHeight;
	}
	$effect(() => {
		if (open) toEnd(true);
	});

	const SUGGESTIONS = $derived(
		ctx?.label.includes('quiz')
			? ['Give me a hint', 'Explain the concept behind this', 'Why might the wrong options be tempting?']
			: ctx?.label.includes('drill')
				? ['Give me a hint', 'Review my code', 'What edge cases should I test?']
				: ctx?.label.includes('theory')
					? ['Quiz me on this', 'Explain it simply', 'How would I say this in an interview?']
					: ['Explain closures simply', 'React vs Svelte reactivity?', 'What is idempotency?']
	);

	async function send(text = input) {
		const q = text.trim();
		if (!q || busy) return;
		const history = turns.slice();
		turns = [...turns, { role: 'you', text: q }, { role: 'ai', text: '' }];
		input = '';
		busy = true;
		toEnd(true); // the new message + the stream that is about to start
		abort = new AbortController();
		const set = (t: string) => {
			turns[turns.length - 1] = { role: 'ai', text: t };
			toEnd();
		};
		try {
			await askAssistant(q, ctx, history, set, abort.signal);
		} catch (e: any) {
			set('(error: ' + (e?.message ?? e) + ')');
		} finally {
			busy = false;
			abort = null;
			persist();
		}
	}
	// runModel also stops on-device generation through the plugin when the signal aborts
	const stop = () => abort?.abort();
	function clear() {
		turns = [];
		persist();
	}
	function onKey(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}
</script>

{#if !open}
	<button class="fab btn primary" onclick={onopen} aria-label="Open AI assistant" data-testid="assistant-fab"><Icon name="sparkle" size={18} />Ask</button>
{/if}

<div class="sheet" class:open aria-hidden={!open} inert={!open} role="dialog" aria-modal="true" aria-label="Ask Preppy" data-testid="assistant">
	<header>
		<div class="ht">
			<h2>Ask Preppy</h2>
			<small>{ctx ? 'Looking at: ' + ctx.label : 'Ask about any topic in the app'}</small>
		</div>
		<button class="hb" onclick={clear} disabled={!turns.length || busy} aria-label="Clear conversation"><Icon name="trash" size={18} /></button>
		<button class="hb" onclick={onclose} aria-label="Close assistant" data-testid="assistant-close"><Icon name="close" size={20} /></button>
	</header>

	<div class="list" bind:this={listEl} onscroll={onListScroll}>
		{#if noModel}
			<div class="note">
				No AI model is set up yet. Open the menu, then <b>Settings → AI models</b>, and pick a model on this phone (offline), Gemini, Claude or a local server. The same model also powers the Backend lab tutor.
			</div>
		{/if}
		{#if !turns.length}
			<div class="hello">
				<p>I can see what you’re looking at (the quiz question, theory section or drill), so you can just ask “why?” or “give me a hint”.</p>
				<div class="chips">
					{#each SUGGESTIONS as s}<button class="chip" onclick={() => send(s)} disabled={busy}>{s}</button>{/each}
				</div>
			</div>
		{/if}
		{#each turns as t}
			<div class="msg {t.role}">
				{#if t.role === 'you'}
					{t.text}
				{:else if t.text}
					<div class="md">{@html render(t.text)}</div>
				{:else}
					<span class="dots">Thinking…</span>
				{/if}
			</div>
		{/each}
	</div>
	<div class="sr" role="status" aria-live="polite">{busy ? 'Assistant is replying' : ''}</div>

	<footer>
		<textarea bind:value={input} onkeydown={onKey} rows="1" placeholder="Ask a question" aria-label="Your question" enterkeyhint="send" data-testid="assistant-input"></textarea>
		{#if busy}
			<button class="btn stop" onclick={stop}>Stop</button>
		{:else}
			<button class="btn primary send" onclick={() => send()} disabled={!input.trim()} aria-label="Send" data-testid="assistant-send"><Icon name="send" size={20} /></button>
		{/if}
	</footer>
</div>

<style>
	.fab { position: fixed; right: 16px; bottom: calc(var(--safe-b) + 16px); z-index: 40; padding: 0 18px 0 14px; }
	.sheet {
		position: fixed; inset: 0; z-index: 60; display: flex; flex-direction: column; background: var(--ground);
		padding-top: var(--safe-t); transform: translateY(102%); transition: transform .22s ease; visibility: hidden;
	}
	.sheet.open { transform: none; visibility: visible; }
	header { display: flex; align-items: center; gap: 2px; padding: 4px 6px 4px 18px; border-bottom: 1px solid var(--border); }
	.ht { flex: 1; min-width: 0; display: flex; flex-direction: column; }
	.ht h2 { margin: 0; font-size: var(--fs-section); font-weight: 600; }
	.ht small { color: var(--muted); font-size: var(--fs-small); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.hb { width: 44px; height: 44px; display: grid; place-items: center; background: none; border: 0; border-radius: 50%; color: var(--text); }
	.hb:active { background: var(--surface); }
	.hb:disabled { color: var(--faint); opacity: .6; }
	.list { flex: 1; overflow-y: auto; padding: 16px 18px; display: flex; flex-direction: column; gap: 14px; overscroll-behavior: contain; }
	.note { background: var(--pill-warning-bg); color: var(--pill-warning-ink); border-radius: var(--radius-row); padding: 12px 14px; font-size: var(--fs-body); line-height: 1.5; }
	.hello { color: var(--muted); font-size: 15px; line-height: 1.55; }
	.hello p { margin: 0; }
	.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
	.chip { min-height: 44px; background: none; border: 1px solid var(--control); color: var(--text); border-radius: var(--radius-control); padding: 0 16px; font-size: var(--fs-body); }
	.chip:active { background: var(--surface); }
	.chip:disabled { opacity: .5; }
	.msg { overflow-wrap: anywhere; white-space: pre-wrap; font-size: 15px; line-height: 1.55; }
	.msg.you { align-self: flex-end; max-width: 88%; background: var(--raised); color: var(--text); padding: 10px 14px; border-radius: var(--radius-card); border-bottom-right-radius: 6px; }
	.msg.ai { align-self: stretch; color: var(--text); white-space: normal; }
	.dots { color: var(--faint); }
	.md :global(p) { margin: 0 0 10px; } .md :global(p:last-child) { margin-bottom: 0; }
	.md :global(pre) { background: var(--surface); border-radius: var(--radius-row); padding: 12px; overflow-x: auto; font-size: 13px; margin: 10px 0; border: 1px solid var(--rule); }
	.md :global(code) { font-family: var(--mono); font-size: 13px; background: var(--surface); padding: 1px 5px; border-radius: 6px; color: var(--text); }
	.md :global(pre code) { background: none; padding: 0; }
	.md :global(ul), .md :global(ol) { margin: 4px 0 10px; padding-left: 20px; }
	footer { display: flex; gap: 8px; align-items: flex-end; padding: 8px 12px calc(var(--safe-b) + 8px); border-top: 1px solid var(--border); }
	textarea { flex: 1; resize: none; max-height: 120px; min-height: 44px; background: var(--surface); border: 1px solid var(--control); border-radius: 22px; color: var(--text); padding: 11px 16px; font: inherit; font-size: 16px; }
	textarea::placeholder { color: var(--faint); }
	.send { width: 44px; padding: 0; flex: none; }
	.stop { flex: none; }
	.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
</style>
