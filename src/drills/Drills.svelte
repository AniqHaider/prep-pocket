<script lang="ts">
	import { marked } from 'marked';
	import CodeEditor from '../dojo/components/CodeEditor.svelte';
	import { execDrill, warmDrills } from '../dojo/engine/runners';
	import type { DrillResult } from './drills-core';
	import { DRILLS } from './drills';
	import { referenceFor, starterFor } from './drills-code';

	const KEY = 'prep-pocket:drills:v1';
	interface Saved { code?: string; solved?: boolean }
	let saved = $state<Record<string, Saved>>(load());
	let openId = $state<string | null>(null);
	let code = $state('');
	let result = $state<DrillResult | null>(null);
	let running = $state(false);
	let showRef = $state(false);

	const drill = $derived(DRILLS.find((d) => d.id === openId) ?? null);
	const solvedCount = $derived(DRILLS.filter((d) => saved[d.id]?.solved).length);

	function load(): Record<string, Saved> {
		try {
			return JSON.parse(localStorage.getItem(KEY) ?? '{}');
		} catch {
			return {};
		}
	}
	function persist() {
		try {
			localStorage.setItem(KEY, JSON.stringify(saved));
		} catch {
			/* ignore */
		}
	}

	function open(id: string) {
		const d = DRILLS.find((x) => x.id === id)!;
		openId = id;
		code = saved[id]?.code ?? starterFor(d.file);
		result = null;
		showRef = false;
		warmDrills();
		window.scrollTo(0, 0);
	}

	function onChange(v: string) {
		code = v;
		saved[openId!] = { ...saved[openId!], code: v };
		persist();
	}

	async function run() {
		if (!drill || running) return;
		running = true;
		result = await execDrill(drill.id, code);
		if (result.all_passed) saved[drill.id] = { ...saved[drill.id], code, solved: true };
		persist();
		running = false;
	}

	function reset() {
		if (!drill || !confirm('Reset to the starter code? Your changes will be lost.')) return;
		code = starterFor(drill.file);
		saved[drill.id] = { ...saved[drill.id], code };
		persist();
		openId = null;
		queueMicrotask(() => (openId = drill.id)); // remount the editor
		result = null;
	}
</script>

<div class="drills">
	{#if !drill}
		<header>
			<h1>⌨️ JS/TS drills</h1>
			<p class="muted">Write the function, run the tests — on-device, offline. {solvedCount} / {DRILLS.length} solved.</p>
		</header>
		<ul class="list">
			{#each DRILLS as d, i}
				<li>
					<button class="item" class:done={saved[d.id]?.solved} onclick={() => open(d.id)} data-testid="drill-{d.id}">
						<span class="n">{saved[d.id]?.solved ? '✅' : i + 1}</span>
						<span class="t"><b>{d.title}</b><small>{d.topic}</small></span>
						<span class="go">→</span>
					</button>
				</li>
			{/each}
		</ul>
	{:else}
		<button class="back" onclick={() => (openId = null)}>‹ All drills</button>
		<h1>{drill.title} <small class="muted">{drill.topic}</small></h1>
		<div class="prompt">{@html marked.parse(drill.prompt)}</div>

		{#key openId}
			<CodeEditor {code} language="ts" {onChange} />
		{/key}

		<div class="actions">
			<button class="run" onclick={run} disabled={running} data-testid="run-drill">{running ? 'Running…' : '▶ Run tests'}</button>
			<button class="ghost" onclick={reset}>Reset</button>
			<button class="ghost" onclick={() => (showRef = !showRef)}>{showRef ? 'Hide solution' : 'Peek solution'}</button>
		</div>

		{#if result}
			<div class="res" class:ok={result.all_passed} data-testid="drill-result">
				<b>{result.all_passed ? '🎉 All tests pass' : '❌ Not yet' + (result.error_category ? ` — ${result.error_category}` : '')}</b>
				{#if !result.all_passed && !result.results.length && result.detail}<pre class="detail">{result.detail}</pre>{/if}
				<ul>
					{#each result.results as t}
						<li class:pass={t.passed}>{t.passed ? '✓' : '✗'} {t.name}{#if t.error}<span class="err">{t.error}</span>{/if}</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if showRef}
			<div class="ref"><div class="muted small">Reference solution — try the drill yourself first.</div><pre><code>{referenceFor(drill.file)}</code></pre></div>
		{/if}
	{/if}
</div>

<style>
	.drills { max-width: 820px; margin: 0 auto; padding: 16px 14px 24px; color: #e8eef6; }
	h1 { font-size: 21px; margin: 6px 0 6px; }
	h1 small { font-size: 12px; font-weight: 500; display: block; margin-top: 2px; }
	.muted { color: #8aa0bd; } .small { font-size: 12px; }
	.list { list-style: none; margin: 16px 0 0; padding: 0; display: grid; gap: 10px; }
	.item { width: 100%; display: flex; align-items: center; gap: 14px; text-align: left; background: #11161f; border: 1px solid #1f2735; border-radius: 14px; padding: 14px; }
	.item:active { border-color: #2f6df6; }
	.item.done { border-color: #1c7a55; }
	.n { width: 30px; height: 30px; border-radius: 50%; background: #1c2536; display: grid; place-items: center; font-size: 13px; font-weight: 700; color: #8aa0bd; flex: none; }
	.t { flex: 1; display: flex; flex-direction: column; }
	.t small { color: #6b7d96; font-size: 12px; margin-top: 2px; }
	.go { color: #4a5a72; font-size: 20px; }
	.back { background: none; border: 0; color: #6ea8ff; font-size: 15px; padding: 4px 0 8px; }
	.prompt { color: #c8d4e4; line-height: 1.6; font-size: 15px; margin: 8px 0 14px; }
	.prompt :global(code) { background: #161d29; padding: 1px 6px; border-radius: 5px; color: #8fd0ff; font-size: 13px; }
	.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
	.run { background: linear-gradient(135deg, #2f6df6, #1a52d0); color: #fff; border: 0; padding: 12px 22px; border-radius: 10px; font-weight: 700; }
	.run:disabled { opacity: .6; }
	.ghost { background: #161d29; border: 1px solid #2a3344; border-radius: 10px; padding: 12px 16px; color: #c4d0e0; }
	.res { margin-top: 14px; padding: 14px; border-radius: 12px; background: #11161f; border: 1px solid #7a2f2f; }
	.res.ok { border-color: #1c7a55; }
	.res ul { list-style: none; padding: 0; margin: 10px 0 0; font-size: 13.5px; }
	.res li { color: #ff9d9d; padding: 3px 0; } .res li.pass { color: #74d6a4; }
	.err { display: block; color: #ffb38a; font-size: 12.5px; padding-left: 16px; }
	.detail { background: #0e131c; padding: 10px; border-radius: 8px; color: #ffc9c9; font-size: 12.5px; white-space: pre-wrap; }
	.ref { margin-top: 14px; }
	.ref pre { background: #060a16; border: 1px solid #232d3e; border-radius: 12px; padding: 12px; overflow-x: auto; font-size: 12.5px; line-height: 1.5; }
</style>
