<script lang="ts">
	import { questions } from './questions/index';
	import { buildDeck, type Config, type Item } from './quiz';
	import { loadMissed, saveMissed } from './storage';
	import { publish } from '../assistant/context';
	import { quizContext } from '../assistant/quizContext';
	import Icon from '../ui/Icon.svelte';
	import { theories } from './theory/index';
	import Theory from './Theory.svelte';

	type Screen = 'home' | 'quiz' | 'result';
	type View = 'quiz' | 'svelte' | 'typescript';
	let view = $state<View>('quiz');

	let screen = $state<Screen>('home');
	let cfg = $state<Config>({ topic: 'all', level: 'all', mode: 'practice', count: 10, onlyMissed: false });
	let missed = $state(loadMissed());

	let deck = $state<Item[]>([]);
	let i = $state(0);
	let picks = $state<(number | null)[]>([]);

	const cur = $derived(deck[i]);
	const pick = $derived(picks[i] ?? null);
	const revealed = $derived(cfg.mode === 'practice' && pick !== null);
	const score = $derived(deck.filter((d, n) => picks[n] === d.correctIndex).length);
	const poolSize = $derived(
		questions.filter(
			(q) =>
				(cfg.topic === 'all' || q.topic === cfg.topic) &&
				(cfg.level === 'all' || q.level === cfg.level) &&
				(!cfg.onlyMissed || missed.has(q.id))
		).length
	);

	// tell the app-level assistant what is on screen (quiz view only; Theory publishes its own)
	$effect(() => {
		if (view !== 'quiz') return;
		return publish('prep-quiz', quizContext('Svelte + TypeScript', screen, cur, pick, revealed, score, deck.length));
	});

	function start() {
		deck = buildDeck(questions, cfg, missed);
		if (!deck.length) return;
		picks = deck.map(() => null);
		i = 0;
		screen = 'quiz';
	}

	function choose(n: number) {
		if (revealed) return; // practice mode locks after the first pick
		picks[i] = n;
	}

	function next() {
		if (pick === null) return;
		if (i < deck.length - 1) i++;
		else finish();
	}

	function finish() {
		const m = new Set(missed);
		deck.forEach((d, n) => {
			if (picks[n] === d.correctIndex) m.delete(d.q.id);
			else m.add(d.q.id);
		});
		missed = m;
		saveMissed(m);
		screen = 'result';
	}

	function onKey(e: KeyboardEvent) {
		if (view !== 'quiz' || screen !== 'quiz') return;
		if (['1', '2', '3', '4'].includes(e.key)) choose(Number(e.key) - 1);
		else if (e.key === 'Enter' || e.key === 'ArrowRight') next();
		else if (e.key === 'ArrowLeft' && cfg.mode === 'exam' && i > 0) i--;
	}

	const letters = ['A', 'B', 'C', 'D'];
	const topicLabel = { svelte: 'Svelte', typescript: 'TypeScript' } as const;
</script>

<svelte:window onkeydown={onKey} />

<div class="prep">
	<div class="tabs" role="tablist" aria-label="Sections">
		{#each [['quiz', 'Quiz'], ['svelte', 'Svelte'], ['typescript', 'TypeScript']] as [v, l]}
			<button class="tab" role="tab" aria-selected={view === v} class:on={view === v} onclick={() => (view = v as View)} data-testid="tab-{v}">{l}</button>
		{/each}
	</div>

	{#if view !== 'quiz'}
		{#key view}
			<Theory theory={theories[view]} />
		{/key}
	{:else if screen === 'home'}
		<header>
			<h1>Quiz setup</h1>
			<p class="muted">{questions.length} multiple-choice questions · every answer explains <em>why</em> · Svelte 5 runes, SvelteKit, TypeScript basic → mid</p>
		</header>

		<section class="panel">
			<div class="row" role="group" aria-label="Topic">
				<span class="lbl" aria-hidden="true">Topic</span>
				{#each [['all', 'All'], ['svelte', 'Svelte'], ['typescript', 'TypeScript']] as [v, l]}
					<button class="chip" class:on={cfg.topic === v} aria-pressed={cfg.topic === v} onclick={() => (cfg.topic = v as Config['topic'])}>{l}</button>
				{/each}
			</div>
			<div class="row" role="group" aria-label="Level">
				<span class="lbl" aria-hidden="true">Level</span>
				{#each [['all', 'All'], ['basic', 'Basic'], ['mid', 'Mid']] as [v, l]}
					<button class="chip" class:on={cfg.level === v} aria-pressed={cfg.level === v} onclick={() => (cfg.level = v as Config['level'])}>{l}</button>
				{/each}
			</div>
			<div class="row" role="group" aria-label="Mode">
				<span class="lbl" aria-hidden="true">Mode</span>
				<button class="chip" class:on={cfg.mode === 'practice'} aria-pressed={cfg.mode === 'practice'} onclick={() => (cfg.mode = 'practice')}>Practice</button>
				<button class="chip" class:on={cfg.mode === 'exam'} aria-pressed={cfg.mode === 'exam'} onclick={() => (cfg.mode = 'exam')}>Exam</button>
			</div>
			<p class="muted" style="margin:-6px 0 0;font-size:var(--fs-small)">Practice explains each answer straight away. Exam shows results at the end.</p>
			<div class="row" role="group" aria-label="Length">
				<span class="lbl" aria-hidden="true">Length</span>
				{#each [10, 25, 50, 0] as n}
					<button class="chip" class:on={cfg.count === n} aria-pressed={cfg.count === n} onclick={() => (cfg.count = n)}>{n === 0 ? 'All' : n}</button>
				{/each}
			</div>
			<div class="row">
				<label class="check">
					<input type="checkbox" bind:checked={cfg.onlyMissed} disabled={missed.size === 0} />
					Only questions I missed before ({missed.size})
				</label>
			</div>
			<button class="btn primary start" onclick={start} disabled={poolSize === 0} data-testid="start">
				Start · {cfg.count === 0 ? poolSize : Math.min(cfg.count, poolSize)} questions
			</button>
		</section>
		<p class="muted small">Keys: 1–4 choose · Enter next. Options are shuffled every attempt, so explanations never rely on letters.</p>
	{:else if screen === 'quiz' && cur}
		<div class="top">
			<span class="muted num">Question {i + 1} of {deck.length}</span>
			<span class="pill">{topicLabel[cur.q.topic]} · {cur.q.level}</span>
			<button class="link" onclick={() => (screen = 'home')}>Quit</button>
		</div>
		<div class="bar" role="progressbar" aria-label="Quiz progress" aria-valuemin="0" aria-valuemax={deck.length} aria-valuenow={i + (pick !== null ? 1 : 0)}><div style="width:{((i + (pick !== null ? 1 : 0)) / deck.length) * 100}%"></div></div>

		<h2 class="q">{cur.q.q}</h2>
		{#if cur.q.code}<pre><code>{cur.q.code}</code></pre>{/if}

		<div class="opts" role="radiogroup" aria-label="Answer options">
			{#each cur.options as opt, n}
				<button
					class="opt"
					class:picked={pick === n && !revealed}
					class:good={revealed && n === cur.correctIndex}
					class:bad={revealed && pick === n && n !== cur.correctIndex}
					class:dim={revealed && n !== cur.correctIndex && pick !== n}
					onclick={() => choose(n)}
					role="radio"
					aria-checked={pick === n}
					data-testid="opt-{n}"
				>
					<b aria-hidden="true">{letters[n]}</b><span>{opt}</span>{#if revealed && n === cur.correctIndex}<Icon name="check" size={20} label="Correct answer" />{:else if revealed && pick === n}<Icon name="close" size={20} label="Your answer, incorrect" />{/if}
				</button>
			{/each}
		</div>

		{#if revealed}
			<div class="why" class:ok={pick === cur.correctIndex} role="status" data-testid="why">
				<b><Icon name={pick === cur.correctIndex ? 'check' : 'close'} size={18} />{pick === cur.correctIndex ? 'Correct' : 'Not quite'}</b>
				<p>{cur.q.why}</p>
			</div>
		{/if}

		<div class="nav">
			{#if cfg.mode === 'exam' && i > 0}<button class="btn" onclick={() => i--}><Icon name="back" size={16} />Back</button>{:else}<span></span>{/if}
			<button class="btn primary" onclick={next} disabled={pick === null} data-testid="next">
				{i === deck.length - 1 ? 'Finish' : 'Next'}<Icon name="chevron" size={16} />
			</button>
		</div>
	{:else if screen === 'result'}
		<header>
			<h1 class="score num">{score}<span class="of"> / {deck.length}</span></h1>
			<p class="muted"><span class="pct num">{Math.round((score / deck.length) * 100)}%</span> — {score === deck.length ? 'flawless' : 'review the misses below, then retry only those'}</p>
		</header>
		<div class="nav">
			<button class="btn" onclick={() => (screen = 'home')}>Home</button>
			<button class="btn primary" onclick={() => ((cfg.onlyMissed = true), (cfg.count = 0), start())} disabled={missed.size === 0}>Retry all missed ({missed.size})</button>
		</div>

		<h3>Review</h3>
		{#each deck as d, n}
			{@const ok = picks[n] === d.correctIndex}
			<details class="rev" class:ok open={!ok}>
				<summary><Icon name={ok ? 'check' : 'close'} size={18} label={ok ? 'Correct' : 'Missed'} /><span>{d.q.q}</span></summary>
				{#if d.q.code}<pre><code>{d.q.code}</code></pre>{/if}
				<p><span class="muted">Your answer:</span> {picks[n] === null ? '—' : d.options[picks[n]!]}</p>
				<p><span class="good-t">Correct:</span> {d.q.correct}</p>
				<p class="why-t">{d.q.why}</p>
			</details>
		{/each}
	{/if}
</div>

<style>
	.prep { max-width: 760px; margin: 0 auto; padding: 16px 16px 24px; color: var(--text); font-size: var(--fs-body); line-height: 1.5; }
	h1 { margin: 8px 0 4px; font-size: var(--fs-title); font-weight: 600; letter-spacing: -.01em; }
	h2.q { font-size: 17px; font-weight: 500; line-height: 1.45; margin: 20px 0 14px; }
	h3 { font-size: var(--fs-section); font-weight: 600; margin: 24px 0 8px; }
	.muted { color: var(--muted); }
	.small { font-size: var(--fs-small); color: var(--faint); }
	.num { font-variant-numeric: tabular-nums; }
	.tabs { display: flex; gap: 4px; background: var(--surface); border-radius: var(--radius-control); padding: 4px; margin-bottom: 8px; }
	.tab { flex: 1; min-height: 44px; background: transparent; border: 0; border-radius: var(--radius-control); padding: 0 8px; color: var(--muted); font-weight: 500; font-size: var(--fs-body); }
	.tab.on { background: var(--raised); color: var(--text); font-weight: 600; }
	.panel { background: var(--surface); border-radius: var(--radius-card); padding: var(--pad); display: grid; gap: var(--gap); margin-top: 16px; }
	.row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
	.lbl { width: 100%; color: var(--muted); font-size: var(--fs-small); font-weight: 500; }
	.chip { min-height: 44px; background: transparent; border: 1px solid var(--control); border-radius: var(--radius-control); padding: 0 16px; color: var(--muted); font-size: var(--fs-body); }
	.chip:active { background: var(--raised); }
	.chip.on { background: var(--raised); border-color: var(--text); color: var(--text); font-weight: 600; }
	.check { color: var(--muted); font-size: var(--fs-body); display: flex; gap: 10px; align-items: center; min-height: 44px; }
	.check input { width: 20px; height: 20px; accent-color: var(--text); }
	.start { width: 100%; }
	.link { min-height: 44px; padding: 0 4px; background: none; border: 0; color: var(--muted); text-decoration: underline; font-size: var(--fs-body); }
	.top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
	.bar { height: 4px; background: var(--raised); border-radius: 9px; overflow: hidden; margin-top: 4px; }
	.bar > div { height: 100%; background: var(--accent); transition: width .25s; }
	pre { background: var(--raised); border-radius: var(--radius-row); padding: 14px; overflow-x: auto; font-family: var(--mono); font-size: 13px; line-height: 1.55; margin: 0 0 14px; }
	.opts { display: grid; gap: 10px; }
	.opt { display: flex; gap: 12px; text-align: left; align-items: center; min-height: 52px; font-size: 15px; background: var(--surface); border: 1px solid transparent; border-radius: var(--radius-row); padding: 12px 14px; }
	.opt span { flex: 1; min-width: 0; }
	.opt b { flex: none; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: var(--raised); color: var(--muted); font-size: var(--fs-small); font-weight: 600; }
	.opt :global(svg) { flex: none; }
	.opt.picked { border-color: var(--text); }
	.opt.good { background: var(--pill-positive-bg); }
	.opt.good :global(svg) { color: var(--accent); }
	.opt.bad { background: var(--pill-negative-bg); }
	.opt.bad :global(svg) { color: var(--negative); }
	.opt.dim { opacity: .6; }
	.why { margin-top: 16px; padding: 16px; border-radius: var(--radius-row); background: var(--surface); }
	.why > b { display: flex; align-items: center; gap: 8px; font-weight: 600; }
	.why.ok > b :global(svg) { color: var(--accent); }
	.why:not(.ok) > b :global(svg) { color: var(--negative); }
	.why p { margin: 8px 0 0; }
	.nav { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; gap: 10px; }
	.nav :global(.btn) { gap: 6px; }
	.score { font-size: 40px; font-weight: 600; letter-spacing: -.02em; }
	.score .of { color: var(--faint); font-weight: 400; }
	.pct { color: var(--accent); font-weight: 600; }
	.rev { background: var(--surface); border-radius: var(--radius-row); padding: 4px 14px; margin: 10px 0; }
	.rev summary { cursor: pointer; font-weight: 500; display: flex; gap: 10px; align-items: flex-start; min-height: 44px; padding: 10px 0; list-style: none; }
	.rev summary::-webkit-details-marker { display: none; }
	.rev summary :global(svg) { flex: none; margin-top: 2px; }
	.rev:not(.ok) summary :global(svg) { color: var(--negative); }
	.rev.ok summary :global(svg) { color: var(--accent); }
	.rev p { margin: 0 0 10px; }
	.good-t { color: var(--accent); font-weight: 500; }
	.why-t { color: var(--muted); }
</style>
