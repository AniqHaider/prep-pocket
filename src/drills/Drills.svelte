<script lang="ts">
	import { marked } from 'marked';
	import CodeEditor from '../dojo/components/CodeEditor.svelte';
	import { execDrill, warmDrills } from '../dojo/engine/runners';
	import type { DrillResult } from './drills-core';
	import { DRILLS } from './drills';
	import { referenceFor, starterFor } from './drills-code';
	import { publish } from '../assistant/context';
	import Icon from '../ui/Icon.svelte';

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

	$effect(() =>
		publish(
			'drills',
			drill
				? {
						label: `${drill.title} · drill`,
						text:
							`JS/TS coding drill "${drill.title}" (${drill.topic}).\nTask: ${drill.prompt}\n\nThe learner's current code:\n${code.slice(0, 1800)}\n\n` +
							(result
								? result.all_passed
									? 'Last run: all tests passed.'
									: `Last run: FAILED${result.error_category ? ' (' + result.error_category + ')' : ''}. ${result.detail ?? ''}\n` +
										result.results.filter((r) => !r.passed).map((r) => `- ${r.name}: ${r.error ?? ''}`).join('\n')
								: 'The learner has not run the tests yet.')
					}
				: { label: 'drills · list', text: `The learner is browsing the JS/TS drills list (${solvedCount}/${DRILLS.length} solved).` }
		)
	);

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
			<h1>Choose a drill</h1>
			<p class="muted">Write the function, run the tests — on-device, offline.</p>
			<div class="prog"><span class="num"><b class="acc">{solvedCount}</b> of {DRILLS.length} solved</span><div class="bar" role="progressbar" aria-label="Drills solved" aria-valuemin="0" aria-valuemax={DRILLS.length} aria-valuenow={solvedCount}><div style="width:{(solvedCount / DRILLS.length) * 100}%"></div></div></div>
		</header>
		<ul class="list">
			{#each DRILLS as d, i}
				<li>
					<button class="item" class:done={saved[d.id]?.solved} onclick={() => open(d.id)} data-testid="drill-{d.id}">
						<span class="n num">{#if saved[d.id]?.solved}<Icon name="check" size={16} label="Solved" />{:else}{i + 1}{/if}</span>
						<span class="t"><b>{d.title}</b><small>{d.topic}</small></span>
						<span class="go"><Icon name="chevron" size={18} /></span>
					</button>
				</li>
			{/each}
		</ul>
	{:else}
		<button class="back" onclick={() => (openId = null)}><Icon name="back" size={16} />All drills</button>
		<h1>{drill.title} <small class="muted">{drill.topic}</small></h1>
		<div class="prompt">{@html marked.parse(drill.prompt)}</div>

		{#key openId}
			<CodeEditor {code} language="ts" {onChange} />
		{/key}

		<div class="actions">
			<button class="btn primary" onclick={run} disabled={running} data-testid="run-drill">{running ? 'Running…' : 'Run tests'}</button>
			<button class="btn" onclick={reset}>Reset</button>
			<button class="btn" aria-pressed={showRef} onclick={() => (showRef = !showRef)}>{showRef ? 'Hide solution' : 'Peek solution'}</button>
		</div>

		{#if result}
			<div class="res" class:ok={result.all_passed} role="status" data-testid="drill-result">
				<b class="res-h"><Icon name={result.all_passed ? 'check' : 'close'} size={18} />{result.all_passed ? 'All tests pass' : 'Not yet' + (result.error_category ? ` — ${result.error_category}` : '')}</b>
				{#if !result.all_passed && !result.results.length && result.detail}<pre class="detail">{result.detail}</pre>{/if}
				<ul>
					{#each result.results as t}
						<li class:pass={t.passed}><Icon name={t.passed ? 'check' : 'close'} size={14} label={t.passed ? 'Pass' : 'Fail'} />{t.name}{#if t.error}<span class="err">{t.error}</span>{/if}</li>
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
	.drills { max-width: 820px; margin: 0 auto; padding: 16px 16px 24px; color: var(--text); }
	h1 { font-size: var(--fs-title); font-weight: 600; letter-spacing: -.01em; margin: 8px 0 4px; }
	h1 small { font-size: var(--fs-small); font-weight: 500; display: block; margin-top: 2px; }
	.muted { color: var(--muted); } .small { font-size: var(--fs-small); color: var(--faint); }
	.num { font-variant-numeric: tabular-nums; }
	.prog { margin-top: 14px; color: var(--muted); display: grid; gap: 8px; }
	.acc { color: var(--accent); font-weight: 600; }
	.bar { height: 4px; background: var(--raised); border-radius: 9px; overflow: hidden; }
	.bar > div { height: 100%; background: var(--accent); transition: width .25s; }
	.list { list-style: none; margin: 16px 0 0; padding: 0; display: grid; gap: 8px; }
	.item { width: 100%; min-height: 64px; display: flex; align-items: center; gap: 14px; text-align: left; background: var(--surface); border: 0; border-radius: var(--radius-row); padding: 10px 14px; }
	.item:active { background: var(--raised); }
	.n { width: 32px; height: 32px; border-radius: 50%; background: var(--raised); display: grid; place-items: center; font-size: var(--fs-small); font-weight: 600; color: var(--muted); flex: none; }
	.item.done .n { color: var(--accent); }
	.t { flex: 1; display: flex; flex-direction: column; min-width: 0; }
	.t b { font-weight: 500; font-size: 15px; }
	.t small { color: var(--faint); font-size: var(--fs-small); margin-top: 2px; }
	.go { color: var(--faint); display: grid; }
	.back { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; background: none; border: 0; color: var(--muted); font-size: var(--fs-body); padding: 0 4px; margin-left: -4px; }
	.prompt { color: var(--muted); line-height: 1.6; font-size: 15px; margin: 8px 0 14px; }
	.prompt :global(code) { background: var(--raised); padding: 1px 6px; border-radius: 6px; color: var(--text); font-family: var(--mono); font-size: 13px; }
	.prompt :global(pre) { background: var(--raised); border-radius: var(--radius-row); padding: 14px; overflow-x: auto; font-family: var(--mono); }
	.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
	.res { margin-top: 14px; padding: 16px; border-radius: var(--radius-row); background: var(--pill-negative-bg); }
	.res.ok { background: var(--pill-positive-bg); }
	.res-h { display: flex; align-items: center; gap: 8px; font-weight: 600; }
	.res.ok .res-h :global(svg) { color: var(--accent); }
	.res:not(.ok) .res-h :global(svg) { color: var(--negative); }
	.res ul { list-style: none; padding: 0; margin: 10px 0 0; font-size: var(--fs-body); }
	.res li { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; color: var(--pill-negative-ink); padding: 4px 0; }
	.res li.pass { color: var(--text); }
	.res li.pass :global(svg) { color: var(--accent); }
	.err { flex-basis: 100%; color: var(--muted); font-size: var(--fs-small); padding-left: 22px; }
	.detail { background: var(--raised); padding: 12px; border-radius: var(--radius-field); color: var(--text); font-family: var(--mono); font-size: 12px; white-space: pre-wrap; }
	.ref { margin-top: 14px; }
	.ref pre { background: var(--raised); border-radius: var(--radius-row); padding: 14px; overflow-x: auto; font-family: var(--mono); font-size: 13px; line-height: 1.55; }
</style>
