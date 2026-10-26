<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { DbEngine } from '../types';
	import Icon from '../../ui/Icon.svelte';
	import { codeinput } from '../../ui/kbState.svelte';
	import { publish } from '../../assistant/context';
	import { sqlEngine, type SqlRun } from './sqlEngine';
	import { runMongo, MongoInputError, type MongoResult } from './mongoEval';
	import { shopCollections, MONGO_SCHEMA } from './shop.mongo';
	import { SQL_SCHEMA } from './shop.sql';

	/** A throwaway query playground over a small sample shop: PostgreSQL (PGlite, in-app) or MongoDB (mingo, read-only). */
	let { engine, seed = '' }: { engine: DbEngine; seed?: string } = $props();

	const isSql = $derived(engine.playground === 'sql');
	const LIMIT = 200;

	const EXAMPLES = {
		sql: [
			{ label: 'All customers', code: 'SELECT * FROM customers ORDER BY id;' },
			{ label: 'Orders per status', code: 'SELECT status, count(*) AS orders\nFROM orders\nGROUP BY status\nORDER BY orders DESC;' },
			{ label: 'Who ordered what', code: 'SELECT c.name, o.id AS order_id, o.status, o.placed_at\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nORDER BY o.placed_at\nLIMIT 10;' },
			{ label: 'Revenue per customer', code: 'SELECT c.name, sum(i.qty * p.price_cents) / 100.0 AS revenue\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nJOIN order_items i ON i.order_id = o.id\nJOIN products p ON p.id = i.product_id\nGROUP BY c.name\nORDER BY revenue DESC;' },
			{ label: 'Customers with no orders', code: 'SELECT c.name\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.id IS NULL;' },
			{ label: 'Explain a lookup', code: 'EXPLAIN SELECT * FROM orders WHERE customer_id = 3;' }
		],
		mongo: [
			{ label: 'All customers', code: 'db.customers.find({})' },
			{ label: 'Paid orders, newest first', code: "db.orders.find({ status: 'paid' }).sort({ placedAt: -1 }).limit(3)" },
			{ label: 'Gift products under 20.00', code: "db.products.find({ tags: 'gift', priceCents: { $lt: 2000 } }, { name: 1, priceCents: 1 })" },
			{ label: 'Orders per status', code: "db.orders.aggregate([\n  { $group: { _id: '$status', orders: { $sum: 1 } } },\n  { $sort: { orders: -1 } }\n])" },
			{ label: 'Units sold per product', code: "db.orders.aggregate([\n  { $unwind: '$items' },\n  { $group: { _id: '$items.productId', units: { $sum: '$items.qty' } } },\n  { $sort: { units: -1 } },\n  { $limit: 3 }\n])" },
			{ label: 'Distinct cities', code: "db.customers.distinct('city')" }
		]
	};
	const examples = $derived(isSql ? EXAMPLES.sql : EXAMPLES.mongo);
	const schema = $derived(isSql ? SQL_SCHEMA.map((t) => ({ name: t.name, items: t.cols })) : MONGO_SCHEMA.map((t) => ({ name: t.name, items: t.fields })));

	// svelte-ignore state_referenced_locally
	const draftKey = `preppy:db:${engine.id}:draft`;
	const draft = (() => { try { return localStorage.getItem(draftKey); } catch { return null; } })();
	// svelte-ignore state_referenced_locally
	let query = $state(seed || draft || examples[0].code);
	let running = $state(false);
	let booting = $state(false);
	let error = $state('');
	let sqlRes = $state<SqlRun | null>(null);
	let mongoRes = $state<MongoResult | null>(null);
	let mongoMs = $state(0);
	let note = $state('');
	let editor: HTMLTextAreaElement | undefined = $state();
	let mongoData = shopCollections();

	onMount(() => {
		if (isSql && !sqlEngine.booted) {
			booting = true;
			sqlEngine.warm().then(() => (booting = false), (e) => { booting = false; error = String(e?.message ?? e); });
		}
	});

	// A "Try it" snippet arrives through `seed`: show it in the editor, never run it for the learner.
	let lastSeed = untrack(() => seed);
	$effect(() => {
		if (seed && seed !== lastSeed) {
			lastSeed = seed;
			query = seed;
			clear();
			editor?.scrollIntoView({ block: 'center', behavior: 'smooth' });
		}
	});
	$effect(() => { const q = query; try { localStorage.setItem(draftKey, q); } catch { /* ignore */ } });

	function clear() { error = ''; sqlRes = null; mongoRes = null; note = ''; }

	async function run() {
		if (running || !query.trim()) return;
		running = true;
		clear();
		try {
			if (isSql) {
				if (!sqlEngine.booted) booting = true;
				sqlRes = await sqlEngine.run(query);
				booting = false;
			} else {
				const t0 = performance.now();
				mongoRes = runMongo(query, mongoData);
				mongoMs = Math.max(1, Math.round(performance.now() - t0));
			}
		} catch (e: any) {
			booting = false;
			error = e instanceof MongoInputError ? e.message : String(e?.message ?? e);
		} finally {
			running = false;
		}
	}

	async function reset() {
		clear();
		if (isSql) {
			running = true;
			try { await sqlEngine.reset(); note = 'Sample data restored.'; } catch (e: any) { error = String(e?.message ?? e); } finally { running = false; }
		} else {
			mongoData = shopCollections();
			note = 'Sample data restored.';
		}
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run(); }
	}
	function load(code: string) { query = code; clear(); editor?.focus(); }

	// ---------- result shaping ----------
	const isFlat = (d: Record<string, unknown>) => Object.values(d).every((v) => v === null || typeof v !== 'object');
	const mongoDocs = $derived(mongoRes?.kind === 'docs' ? mongoRes.docs : []);
	const mongoAsTable = $derived(mongoDocs.length > 0 && mongoDocs.every(isFlat));
	const mongoCols = $derived([...new Set(mongoDocs.flatMap((d) => Object.keys(d)))]);
	const cell = (v: unknown) => (v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v));
	const isNum = (v: unknown) => typeof v === 'number';
	const pretty = (v: unknown) => JSON.stringify(v, null, 2);

	const rowCount = $derived(isSql ? (sqlRes && sqlRes.columns.length ? sqlRes.rows.length : null) : mongoRes?.kind === 'docs' ? mongoRes.total : null);
	const shown = $derived(Math.min(rowCount ?? 0, LIMIT));
	const summary = $derived.by(() => {
		if (error) return '';
		if (isSql && sqlRes) return sqlRes.columns.length ? `${sqlRes.rows.length} ${sqlRes.rows.length === 1 ? 'row' : 'rows'} in ${sqlRes.ms} ms` : `Done in ${sqlRes.ms} ms (${sqlRes.statements} ${sqlRes.statements === 1 ? 'statement' : 'statements'}, no rows returned)`;
		if (!isSql && mongoRes) return mongoRes.kind === 'docs' ? `${mongoRes.total} ${mongoRes.total === 1 ? 'document' : 'documents'} in ${mongoMs} ms` : `Result in ${mongoMs} ms`;
		return '';
	});

	// What the assistant can see: the engine, the query, and the last error or the first rows.
	$effect(() => {
		const outcome = error ? `Last error: ${error}` : isSql && sqlRes ? `Result (${summary}), first rows: ${JSON.stringify(sqlRes.rows.slice(0, 3))}` : mongoRes ? `Result (${summary}): ${JSON.stringify(mongoRes.kind === 'docs' ? mongoRes.docs.slice(0, 2) : mongoRes.value)}` : 'Not run yet.';
		return publish('db-playground', {
			label: `${engine.name} · playground`,
			text: `The learner is in the ${engine.name} playground over a sample shop (customers, products, orders${isSql ? ', order_items' : ' with embedded items'}).\nQuery in the editor:\n${query}\n${outcome}`.slice(0, 1500)
		});
	});
</script>

<div class="pg">
	<div class="examples" role="group" aria-label="Example queries">
		{#each examples as ex}
			<button class="chip" onclick={() => load(ex.code)}>{ex.label}</button>
		{/each}
	</div>

	<div class="colin">
	<label class="lbl" for="pg-editor">{isSql ? 'SQL' : 'MongoDB shell'}</label>
	<textarea
		id="pg-editor"
		bind:this={editor}
		bind:value={query}
		onkeydown={onKey}
		rows="7"
		spellcheck="false"
		autocapitalize="off"
		autocomplete="off"
		aria-describedby="pg-hint"
		data-testid="pg-editor"
		use:codeinput
	></textarea>
	<p class="hint" id="pg-hint">{isSql ? 'Any SQL works: it is your own throwaway copy of the shop.' : 'Read-only: find, findOne, aggregate, countDocuments, distinct.'} Ctrl or Cmd + Enter runs it.</p>

	<div class="actions">
		<button class="btn primary run" onclick={run} disabled={running || !query.trim()} data-testid="pg-run"><Icon name="play" size={18} />{running ? 'Running' : 'Run'}</button>
		<button class="btn" onclick={reset} disabled={running} data-testid="pg-reset"><Icon name="replay" size={18} />Reset data</button>
	</div>
	</div>

	<div class="colout">
	<div class="out" aria-live="polite" aria-atomic="false">
		{#if booting}
			<p class="status" data-testid="pg-status">Starting PostgreSQL… the first start takes a few seconds.</p>
		{:else if error}
			<div class="err" role="alert" data-testid="pg-error">
				<b><Icon name="alert" size={18} />Something went wrong</b>
				<p>{error}</p>
			</div>
		{:else if summary}
			<p class="status" data-testid="pg-status"><Icon name="check" size={16} label="Done" /><span class="num">{summary}</span></p>
		{:else if note}
			<p class="status" data-testid="pg-status"><Icon name="check" size={16} label="Done" />{note}</p>
		{/if}
	</div>

	{#if !error && isSql && sqlRes && sqlRes.columns.length}
		{#if sqlRes.rows.length === 0}
			<p class="empty">The query ran but matched no rows.</p>
		{:else}
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div class="scroller" tabindex="0" role="region" aria-label="Query result">
				<table>
					<thead><tr>{#each sqlRes.columns as c}<th scope="col">{c}</th>{/each}</tr></thead>
					<tbody>
						{#each sqlRes.rows.slice(0, LIMIT) as row}
							<tr>{#each sqlRes.columns as c}<td class:num={isNum(row[c])} class:nul={row[c] === null}>{row[c] === null ? '—' : cell(row[c])}</td>{/each}</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if rowCount! > LIMIT}<p class="hint">Showing the first {LIMIT} of {rowCount} rows. Add a LIMIT or a WHERE to narrow it.</p>{/if}
		{/if}
	{/if}

	{#if !error && !isSql && mongoRes}
		{#if mongoRes.kind === 'value'}
			<pre class="json">{pretty(mongoRes.value)}</pre>
		{:else if mongoDocs.length === 0}
			<p class="empty">The query ran but matched no documents.</p>
		{:else if mongoAsTable}
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div class="scroller" tabindex="0" role="region" aria-label="Query result">
				<table>
					<thead><tr>{#each mongoCols as c}<th scope="col">{c}</th>{/each}</tr></thead>
					<tbody>
						{#each mongoDocs.slice(0, LIMIT) as d}
							<tr>{#each mongoCols as c}<td class:num={isNum(d[c])} class:nul={d[c] === undefined || d[c] === null}>{d[c] === undefined || d[c] === null ? '—' : cell(d[c])}</td>{/each}</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="docs">
				{#each mongoDocs.slice(0, LIMIT) as d, n}
					<details open={n < 3}>
						<summary>Document {n + 1}{d._id !== undefined ? ` · _id ${cell(d._id)}` : ''}</summary>
						<pre class="json">{pretty(d)}</pre>
					</details>
				{/each}
			</div>
		{/if}
		{#if mongoRes.kind === 'docs' && mongoRes.total > LIMIT}<p class="hint">Showing the first {LIMIT} of {mongoRes.total} documents. Add a limit to narrow it.</p>{/if}
	{/if}

	<details class="ref">
		<summary>{isSql ? 'Tables in the sample shop' : 'Collections in the sample shop'}</summary>
		<div class="refgrid">
			{#each schema as t}
				<div class="reft"><b>{t.name}</b><ul>{#each t.items as it}<li>{it}</li>{/each}</ul></div>
			{/each}
		</div>
		<p class="hint">8 customers, 10 products, 15 orders. One customer has never ordered and one product has never been ordered, so joins and anti-joins have something to find.</p>
	</details>
	</div>
</div>

<style>
	.pg { display: grid; gap: 12px; }
	.examples { display: flex; flex-wrap: wrap; gap: 8px; }
	.chip { min-height: 44px; background: transparent; border: 1px solid var(--control); border-radius: var(--radius-control); padding: 0 14px; color: var(--muted); font-size: 13px; }
	.chip:active { background: var(--raised); }
	.lbl { color: var(--muted); font-size: var(--fs-small); font-weight: 500; margin-top: 4px; }
	textarea {
		width: 100%; min-height: 168px; resize: vertical; padding: 14px; background: var(--surface); color: var(--text);
		border: 1px solid var(--control); border-radius: var(--radius-field); font-family: var(--mono); font-size: 16px; line-height: 1.5; tab-size: 2;
	}
	textarea::placeholder { color: var(--faint); }
	.hint { margin: 0; color: var(--faint); font-size: var(--fs-small); }
	.actions { display: flex; gap: 10px; flex-wrap: wrap; }
	.run { min-width: 120px; }
	.out { min-height: 26px; }
	.status { margin: 0; display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: var(--fs-body); }
	.status :global(svg) { color: var(--accent); flex: none; }
	.status .num { color: var(--accent); font-weight: 600; }
	.err { background: var(--surface); border-radius: var(--radius-row); padding: 14px 16px; }
	.err b { display: flex; align-items: center; gap: 8px; font-weight: 600; }
	.err b :global(svg) { color: var(--negative); }
	.err p { margin: 8px 0 0; color: var(--muted); font-family: var(--mono); font-size: 13px; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.5; }
	.empty { margin: 0; padding: 16px; background: var(--surface); border-radius: var(--radius-row); color: var(--muted); }
	.scroller { overflow-x: auto; background: var(--surface); border-radius: var(--radius-row); }
	table { border-collapse: collapse; min-width: 100%; font-size: 13px; }
	th { text-align: left; color: var(--muted); font-weight: 500; font-size: var(--fs-small); padding: 10px 14px; white-space: nowrap; border-bottom: 1px solid var(--rule); }
	td { padding: 10px 14px; white-space: nowrap; border-bottom: 1px solid var(--rule); font-variant-numeric: tabular-nums; }
	tr:last-child td { border-bottom: 0; }
	td.num { text-align: right; }
	td.nul { color: var(--faint); }
	.docs { display: grid; gap: 8px; }
	.docs details { background: var(--surface); border-radius: var(--radius-row); padding: 0 14px; }
	.docs summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; font-weight: 500; list-style: none; }
	.docs summary::-webkit-details-marker { display: none; }
	.json { margin: 0 0 14px; padding: 14px; background: var(--raised); border-radius: var(--radius-row); overflow-x: auto; font-family: var(--mono); font-size: 13px; line-height: 1.55; }
	.docs .json { margin: 0 0 12px; }
	.ref { background: var(--surface); border-radius: var(--radius-card); padding: 0 16px; }
	.ref summary { min-height: 48px; display: flex; align-items: center; cursor: pointer; font-weight: 500; }
	.refgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; padding: 4px 0 12px; }
	.reft b { font-family: var(--mono); font-size: 13px; }
	.reft ul { list-style: none; margin: 6px 0 0; padding: 0; color: var(--muted); font-size: 12px; line-height: 1.6; }
	.ref .hint { padding-bottom: 14px; }
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
