<script lang="ts">
	import { tick } from 'svelte';
	import { Marked } from 'marked';
	import { appContext } from './context';
	import { askAssistant, type Turn } from './assistant';
	import { loadSettings } from '../settings/settings';

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
	<button class="fab" onclick={onopen} aria-label="Open AI assistant" data-testid="assistant-fab">✨</button>
{/if}

<section class="sheet" class:open aria-hidden={!open} inert={!open} aria-label="AI assistant" data-testid="assistant">
	<header>
		<div class="ht">
			<b>✨ Assistant</b>
			<small>{ctx ? 'Looking at: ' + ctx.label : 'Ask me anything about the app’s topics'}</small>
		</div>
		<button class="hb" onclick={clear} disabled={!turns.length || busy}>Clear</button>
		<button class="hb x" onclick={onclose} aria-label="Close assistant" data-testid="assistant-close">✕</button>
	</header>

	<div class="list" bind:this={listEl} onscroll={onListScroll}>
		{#if noModel}
			<div class="note">
				No AI model is set up yet. Open the ☰ menu → <b>More → AI models</b> and pick a model on this phone (offline), Gemini, Claude or a local server. The same model also powers the Dojo tutor.
			</div>
		{/if}
		{#if !turns.length}
			<div class="hello">
				<p>I can see what you’re looking at — the quiz question, theory section or drill — so you can just ask “why?” or “give me a hint”.</p>
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
					<span class="dots">thinking…</span>
				{/if}
			</div>
		{/each}
	</div>

	<footer>
		<textarea bind:value={input} onkeydown={onKey} rows="1" placeholder="Ask…" enterkeyhint="send" data-testid="assistant-input"></textarea>
		{#if busy}
			<button class="send stop" onclick={stop}>Stop</button>
		{:else}
			<button class="send" onclick={() => send()} disabled={!input.trim()} data-testid="assistant-send">Send</button>
		{/if}
	</footer>
</section>

<style>
	.fab {
		position: fixed; right: 14px; bottom: calc(var(--safe-b) + 16px); z-index: 40;
		width: 52px; height: 52px; border-radius: 50%; border: 0; font-size: 23px;
		background: linear-gradient(135deg, #7a3af0, #2f6df6); box-shadow: 0 6px 20px rgba(47, 109, 246, .45);
	}
	.fab:active { transform: scale(.94); }
	.sheet {
		position: fixed; inset: 0; z-index: 60; display: flex; flex-direction: column; background: #0b0f16;
		padding-top: var(--safe-t); transform: translateY(102%); transition: transform .22s ease; visibility: hidden;
	}
	.sheet.open { transform: none; visibility: visible; }
	header { display: flex; align-items: center; gap: 8px; padding: 8px 10px 8px 14px; border-bottom: 1px solid #1f2735; background: #0f141d; }
	.ht { flex: 1; min-width: 0; display: flex; flex-direction: column; }
	.ht b { font-size: 16px; }
	.ht small { color: #7f90a8; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.hb { background: none; border: 1px solid #2a3344; border-radius: 9px; color: #c4d0e0; padding: 7px 12px; font-size: 13px; }
	.hb:disabled { opacity: .4; }
	.hb.x { border: 0; font-size: 18px; padding: 6px 10px; }
	.list { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; overscroll-behavior: contain; }
	.note { background: #2a1f0d; border: 1px solid #5a4318; color: #f1d9a6; border-radius: 12px; padding: 12px 14px; font-size: 14px; line-height: 1.5; }
	.hello { color: #9fb0c8; font-size: 14.5px; line-height: 1.5; }
	.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
	.chip { background: #121a2b; border: 1px solid #2a3b5c; color: #bcd2ff; border-radius: 999px; padding: 8px 14px; font-size: 13.5px; }
	.chip:disabled { opacity: .5; }
	.msg { max-width: 92%; padding: 10px 13px; border-radius: 14px; font-size: 15px; line-height: 1.5; overflow-wrap: anywhere; white-space: pre-wrap; }
	.msg.you { align-self: flex-end; background: #1e3a6d; color: #fff; border-bottom-right-radius: 4px; }
	.msg.ai { align-self: flex-start; background: #141b27; border: 1px solid #1f2735; color: #dbe5f3; border-bottom-left-radius: 4px; white-space: normal; }
	.dots { color: #7f90a8; font-style: italic; }
	.md :global(p) { margin: 0 0 8px; } .md :global(p:last-child) { margin-bottom: 0; }
	.md :global(pre) { background: #0a0e15; border: 1px solid #1f2735; border-radius: 9px; padding: 10px; overflow-x: auto; font-size: 13px; margin: 8px 0; }
	.md :global(code) { font-family: ui-monospace, Menlo, monospace; font-size: 13px; background: #0e1420; padding: 1px 5px; border-radius: 5px; color: #9fd4ff; }
	.md :global(pre code) { background: none; padding: 0; color: #d6e2f2; }
	.md :global(ul), .md :global(ol) { margin: 4px 0 8px; padding-left: 20px; }
	footer { display: flex; gap: 8px; align-items: flex-end; padding: 8px 10px calc(var(--safe-b) + 8px); border-top: 1px solid #1f2735; background: #0f141d; }
	textarea { flex: 1; resize: none; max-height: 120px; background: #0b0f16; border: 1px solid #232d3e; border-radius: 12px; color: #e8eef6; padding: 10px 12px; font: inherit; font-size: 16px; }
	.send { background: #2f6df6; color: #fff; border: 0; border-radius: 12px; padding: 11px 16px; font-weight: 700; }
	.send:disabled { opacity: .4; }
	.send.stop { background: #8a2f3f; }
</style>
