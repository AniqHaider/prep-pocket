<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import type { DbEngine } from '../types';
	import Icon from '../../ui/Icon.svelte';
	import { publish } from '../../assistant/context';
	import { jsEngine } from './jsEngine';
	import type { RunLine, RunResult } from './jsRun';
	import { examplesFor } from './jsExamples';

	/** A throwaway scripting playground: JavaScript (or TypeScript, with types stripped) in its own Web Worker, console output captured. */
	let { engine, seed = '' }: { engine: DbEngine; seed?: string } = $props();

	const isTs = $derived(engine.id === 'typescript');
	const examples = $derived(examplesFor(engine.id));

	// svelte-ignore state_referenced_locally
	const draftKey = `preppy:db:${engine.id}:js-draft`;
	const draft = (() => { try { return localStorage.getItem(draftKey); } catch { return null; } })();
	// svelte-ignore state_referenced_locally
	let code = $state(seed || draft || examples[0].code);
	let running = $state(false);
	let ran = $state(false);
	let lines = $state<RunLine[]>([]);
	let result = $state<RunResult | null>(null);
	let editor: HTMLTextAreaElement | undefined = $state();

	// A "Try it" snippet arrives through `seed`: show it in the editor, never run it for the learner.
	let lastSeed = untrack(() => seed);
	$effect(() => {
		if (seed && seed !== lastSeed) {
			lastSeed = seed;
			code = seed;
			clearOutput();
			editor?.scrollIntoView({ block: 'center', behavior: 'smooth' });
		}
	});
	$effect(() => { const c = code; try { localStorage.setItem(draftKey, c); } catch { /* ignore */ } });
	onDestroy(() => jsEngine.stop());

	function clearOutput() { lines = []; result = null; ran = false; }

	async function run() {
		if (running || !code.trim()) return;
		running = true;
		ran = true;
		lines = [];
		result = null;
		const res = await jsEngine.run(code, isTs, (l) => { if (lines.length < 200) lines.push(l); });
		lines = res.lines;
		result = res;
		running = false;
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run(); }
	}
	function load(c: string) { code = c; clearOutput(); editor?.focus(); }

	const failed = $derived(!!result?.error);
	const lineAt = $derived(result?.error?.line);
	const summary = $derived(running ? 'Running…' : result ? `${lines.length} ${lines.length === 1 ? 'line' : 'lines'} in ${result.ms} ms` : '');

	// What the assistant can see: the engine, the script, and the last output or error.
	$effect(() => {
		const tail = lines.slice(0, 12).map((l) => `${l.level === 'log' ? '' : l.level + ': '}${l.text}`).join('\n');
		const outcome = !ran ? 'Not run yet.' : result?.error ? `The last run ended with an error: ${result.error.message}${lineAt ? ` (line ${lineAt})` : ''}\n${tail}` : `Output of the last run:\n${tail || '(no output)'}`;
		return publish('db-playground', {
			label: `${engine.name} · playground`,
			text: `The learner is in the ${engine.name} playground, running ${isTs ? 'TypeScript (types are stripped, not checked)' : 'JavaScript'} in a worker with no network.\nScript in the editor:\n${code}\n${outcome}`.slice(0, 1500)
		});
	});
</script>

<div class="pg">
	<div class="examples" role="group" aria-label="Example scripts">
		{#each examples as ex}
			<button class="chip" onclick={() => load(ex.code)}>{ex.label}</button>
		{/each}
	</div>

	<div class="colin">
	<label class="lbl" for="js-editor">{isTs ? 'TypeScript' : 'JavaScript'}</label>
	<textarea
		id="js-editor"
		bind:this={editor}
		bind:value={code}
		onkeydown={onKey}
		rows="9"
		spellcheck="false"
		autocapitalize="off"
		autocomplete="off"
		aria-describedby="js-hint"
		data-testid="pg-editor"
	></textarea>
	<p class="hint" id="js-hint">
		{#if isTs}Types are stripped, not checked: your editor shows type errors. {/if}Runs in a sandbox with no network and no imports; top-level <code>await</code> works. Ctrl or Cmd + Enter runs it.
	</p>

	<div class="actions">
		<button class="btn primary run" onclick={run} disabled={running || !code.trim()} data-testid="pg-run"><Icon name="play" size={18} />{running ? 'Running' : 'Run'}</button>
		{#if running}<button class="btn" onclick={() => jsEngine.stop()} data-testid="pg-stop"><Icon name="stop" size={18} />Stop</button>{/if}
		<button class="btn" onclick={clearOutput} disabled={running || !ran} data-testid="pg-clear"><Icon name="trash" size={18} />Clear output</button>
	</div>
	</div>

	<div class="colout">
	<div class="out" aria-live="polite" aria-atomic="true">
		{#if running}
			<p class="status" data-testid="pg-status">{summary}</p>
		{:else if failed}
			<p class="status bad" data-testid="pg-status"><Icon name="alert" size={16} label="Error" />The script ended with an error{lineAt ? ` on line ${lineAt}` : ''}. <span class="num">{summary}</span></p>
		{:else if result}
			<p class="status" data-testid="pg-status"><Icon name="check" size={16} label="Done" /><span class="num">{summary}</span></p>
		{/if}
	</div>

	{#if ran && !running && lines.length === 0}
		<p class="empty" data-testid="pg-empty">No output: use <code>console.log</code> to print something.</p>
	{:else if lines.length}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div class="console" role="log" aria-label="Output" tabindex="0" data-testid="pg-console">
			{#each lines as l}
				<div class="ln {l.level}">
					{#if l.level === 'warn'}<span class="tag">warn</span>{:else if l.level === 'error'}<span class="tag"><Icon name="alert" size={13} />error</span>{/if}<span class="tx">{l.text}</span>
				</div>
			{/each}
		</div>
	{/if}

	{#if result?.notes.length}
		<ul class="notes">
			{#each result.notes as n}<li>{n}</li>{/each}
		</ul>
	{/if}
	</div>
</div>

<style>
	.pg { display: grid; gap: 12px; }
	.examples { display: flex; flex-wrap: wrap; gap: 8px; }
	.chip { min-height: 44px; background: transparent; border: 1px solid var(--control); border-radius: var(--radius-control); padding: 0 14px; color: var(--muted); font-size: 13px; }
	.chip:active { background: var(--raised); }
	.lbl { color: var(--muted); font-size: var(--fs-small); font-weight: 500; margin-top: 4px; }
	textarea {
		width: 100%; min-height: 200px; resize: vertical; padding: 14px; background: var(--surface); color: var(--text);
		border: 1px solid var(--control); border-radius: var(--radius-field); font-family: var(--mono); font-size: 16px; line-height: 1.5; tab-size: 2;
	}
	.hint { margin: 0; color: var(--faint); font-size: var(--fs-small); }
	.hint code, .empty code { font-family: var(--mono); color: var(--muted); }
	.actions { display: flex; gap: 10px; flex-wrap: wrap; }
	.run { min-width: 120px; }
	.out { min-height: 26px; }
	.status { margin: 0; display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: var(--fs-body); }
	.status :global(svg) { color: var(--accent); flex: none; }
	.status .num { color: var(--accent); font-weight: 600; }
	.status.bad :global(svg) { color: var(--negative); }
	.status.bad .num { color: var(--muted); font-weight: 400; }
	.empty { margin: 0; padding: 16px; background: var(--surface); border-radius: var(--radius-row); color: var(--muted); }
	.console { background: var(--surface); border-radius: var(--radius-row); padding: 10px 14px; overflow-x: auto; font-family: var(--mono); font-size: 13px; line-height: 1.55; user-select: text; }
	.ln { display: flex; gap: 8px; padding: 2px 0; font-variant-numeric: tabular-nums; }
	.tx { white-space: pre-wrap; overflow-wrap: anywhere; min-width: 0; }
	.tag { flex: none; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; font-family: var(--font); padding: 0 7px; border-radius: 999px; height: 18px; margin-top: 2px; background: var(--pill-warning-bg); color: var(--pill-warning-ink); }
	.ln.error .tag { background: var(--pill-negative-bg); color: var(--pill-negative-ink); }
	.ln.warn .tx { color: var(--text); }
	.ln.info .tx, .ln.debug .tx { color: var(--muted); }
	.notes { margin: 0; padding: 0; list-style: none; display: grid; gap: 4px; }
	.notes li { color: var(--muted); font-size: var(--fs-small); }
	/* Landscape phones are short: the editor and its buttons on the left, the output on the right, so nothing needs scrolling past the editor. */
	@media (orientation: landscape) and (max-height: 560px) {
		.pg { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); column-gap: 16px; align-items: start; }
		.examples { grid-column: 1 / -1; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
		.examples :global(.chip) { flex: none; }
		.colin, .colout { display: grid; gap: 10px; min-width: 0; }
		.colin textarea { height: clamp(96px, calc(100dvh - 318px), 220px); }
		.colin .hint { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; } /* still read by screen readers via aria-describedby */
		.colout { max-height: calc(100dvh - 150px); overflow-y: auto; }
	}
</style>
