<script lang="ts">
	import { questions } from './questions/index';
	import { buildDeck, type Config, type Item } from './quiz';
	import { loadMissed, saveMissed } from './storage';
	import { publish } from '../assistant/context';
	import { quizContext } from '../assistant/quizContext';
	import { inline } from './inline';

	type Screen = 'home' | 'quiz' | 'result';

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

	// tell the app-level ✨ assistant what is on screen
	$effect(() => publish('prep2-quiz', quizContext('React + Next + TypeScript', screen, cur, pick, revealed, score, deck.length)));

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
		if (screen !== 'quiz') return;
		if (['1', '2', '3', '4'].includes(e.key)) choose(Number(e.key) - 1);
		else if (e.key === 'Enter' || e.key === 'ArrowRight') next();
		else if (e.key === 'ArrowLeft' && cfg.mode === 'exam' && i > 0) i--;
	}

	const letters = ['A', 'B', 'C', 'D'];
	const topicLabel = { react: 'React', next: 'Next.js', typescript: 'TypeScript' } as const;
	const levelLabel = { basic: 'Basic', mid: 'Mid', advanced: 'Advanced' } as const;
	const topicColor = { react: '#61dafb', next: '#f4f4f5', typescript: 'var(--ts)' } as const;
</script>

<svelte:window onkeydown={onKey} />

{#snippet rich(text: string)}{#each inline(text) as s}{#if s.kind === 'code'}<code class="ic">{s.t}</code>{:else if s.kind === 'bold'}<strong>{s.t}</strong>{:else}{s.t}{/if}{/each}{/snippet}

<div class="prep">
	{#if screen === 'home'}
		<header>
			<h1>React + Next + TypeScript</h1>
			<p class="muted">{questions.length} multiple-choice questions · every answer explains <em>why</em> · React 19, Next.js 15/16 App Router, TypeScript, basic → advanced</p>
		</header>

		<section class="panel">
			<div class="row">
				<span class="lbl">Topic</span>
				{#each [['all', 'All'], ['react', 'React'], ['next', 'Next.js'], ['typescript', 'TypeScript']] as [v, l]}
					<button class="chip" class:on={cfg.topic === v} onclick={() => (cfg.topic = v as Config['topic'])}>{l}</button>
				{/each}
			</div>
			<div class="row">
				<span class="lbl">Level</span>
				{#each [['all', 'All'], ['basic', 'Basic'], ['mid', 'Mid'], ['advanced', 'Adv.']] as [v, l]}
					<button class="chip" class:on={cfg.level === v} onclick={() => (cfg.level = v as Config['level'])}>{l}</button>
				{/each}
			</div>
			<div class="row">
				<span class="lbl">Mode</span>
				<button class="chip" class:on={cfg.mode === 'practice'} onclick={() => (cfg.mode = 'practice')}>Practice (explain instantly)</button>
				<button class="chip" class:on={cfg.mode === 'exam'} onclick={() => (cfg.mode = 'exam')}>Exam (review at end)</button>
			</div>
			<div class="row">
				<span class="lbl">Length</span>
				{#each [10, 25, 50, 0] as n}
					<button class="chip" class:on={cfg.count === n} onclick={() => (cfg.count = n)}>{n === 0 ? 'All' : n}</button>
				{/each}
			</div>
			<div class="row">
				<label class="check">
					<input type="checkbox" bind:checked={cfg.onlyMissed} disabled={missed.size === 0} />
					Only questions I missed before ({missed.size})
				</label>
			</div>
			<button class="primary" onclick={start} disabled={poolSize === 0} data-testid="start">
				Start · {cfg.count === 0 ? poolSize : Math.min(cfg.count, poolSize)} questions
			</button>
		</section>
		<p class="muted small">Keys: 1–4 choose · Enter next. Options are shuffled every attempt, so explanations never rely on letters.</p>
	{:else if screen === 'quiz' && cur}
		<div class="top">
			<span class="muted">{i + 1} / {deck.length}</span>
			<span class="tags"><span class="tag" style="--c: {topicColor[cur.q.topic]}">{topicLabel[cur.q.topic]} · {levelLabel[cur.q.level]}</span><span class="tag dim">{cur.q.tag}</span></span>
			<button class="link" onclick={() => (screen = 'home')}>Quit</button>
		</div>
		<div class="bar"><div style="width:{((i + (pick !== null ? 1 : 0)) / deck.length) * 100}%"></div></div>

		<h2 class="q">{@render rich(cur.q.q)}</h2>
		{#if cur.q.code}<pre><code>{cur.q.code}</code></pre>{/if}

		<div class="opts" role="radiogroup">
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
					<b>{letters[n]}</b><span>{@render rich(opt)}</span>
				</button>
			{/each}
		</div>

		{#if revealed}
			<div class="why" class:ok={pick === cur.correctIndex} data-testid="why">
				<b>{pick === cur.correctIndex ? '✅ Correct' : '❌ Not quite'}</b>
				<p>{@render rich(cur.q.why)}</p>
			</div>
		{/if}

		<div class="nav">
			{#if cfg.mode === 'exam' && i > 0}<button class="ghost" onclick={() => i--}>← Back</button>{:else}<span></span>{/if}
			<button class="primary" onclick={next} disabled={pick === null} data-testid="next">
				{i === deck.length - 1 ? 'Finish' : 'Next →'}
			</button>
		</div>
	{:else if screen === 'result'}
		<header>
			<h1>{score} / {deck.length}</h1>
			<p class="muted">{Math.round((score / deck.length) * 100)}% — {score === deck.length ? 'flawless 🎯' : 'review the misses below, then retry only those'}</p>
		</header>
		<div class="nav">
			<button class="ghost" onclick={() => (screen = 'home')}>Home</button>
			<button class="primary" onclick={() => ((cfg.onlyMissed = true), (cfg.count = 0), start())} disabled={missed.size === 0}>Retry all missed ({missed.size})</button>
		</div>

		<h3>Review</h3>
		{#each deck as d, n}
			{@const ok = picks[n] === d.correctIndex}
			<details class="rev" class:ok open={!ok}>
				<summary>{ok ? '✅' : '❌'} {@render rich(d.q.q)}</summary>
				{#if d.q.code}<pre><code>{d.q.code}</code></pre>{/if}
				<p><span class="muted">Your answer:</span> {#if picks[n] === null}—{:else}{@render rich(d.options[picks[n]!])}{/if}</p>
				<p><span class="good-t">Correct:</span> {@render rich(d.q.correct)}</p>
				<p class="why-t">{@render rich(d.q.why)}</p>
			</details>
		{/each}
	{/if}
</div>

<style>
	.prep { max-width: 760px; margin: 0 auto; padding: 14px 14px 24px; color: var(--text); font-size: 16px; line-height: 1.55; }
	h1 { margin: 12px 0 4px; font-size: 1.7rem; }
	h2.q { font-size: 1.2rem; line-height: 1.45; margin: 18px 0 12px; }
	.muted { color: var(--muted); }
	.small { font-size: .85rem; }
	.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 16px; display: grid; gap: 14px; margin-top: 16px; }
	.row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
	.lbl { width: 64px; color: var(--muted); font-size: .85rem; }
	.chip { background: transparent; border: 1px solid var(--line); border-radius: 999px; padding: 6px 14px; color: var(--muted); }
	.chip.on { background: var(--accent); color: #06121f; border-color: var(--accent); font-weight: 600; }
	.check { color: var(--muted); font-size: .9rem; display: flex; gap: 8px; align-items: center; }
	.primary { background: var(--accent); color: #06121f; border: 0; border-radius: 12px; padding: 12px 18px; font-weight: 700; }
	.primary:disabled { opacity: .35; cursor: not-allowed; }
	.ghost { background: transparent; border: 1px solid var(--line); border-radius: 12px; padding: 12px 18px; }
	.link { background: none; border: 0; color: var(--muted); text-decoration: underline; }
	.top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
	.tags { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
	.tag.dim { --c: var(--muted); }
	.tag { color: var(--c); border: 1px solid var(--c); border-radius: 999px; padding: 2px 10px; font-size: .8rem; }
	.ic { background: #0a1124; border: 1px solid var(--line); border-radius: 5px; padding: 0 5px; font-size: .88em; color: #bfe3ff; }
	.bar { height: 5px; background: var(--line); border-radius: 9px; overflow: hidden; margin-top: 10px; }
	.bar > div { height: 100%; background: var(--accent); transition: width .25s; }
	pre { background: #060a16; border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; overflow-x: auto; font-size: .85rem; line-height: 1.5; margin: 0 0 12px; }
	.opts { display: grid; gap: 10px; }
	.opt { display: flex; gap: 12px; text-align: left; align-items: flex-start; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; }
	.opt b { flex: none; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--line); font-size: .8rem; }
	.opt:hover:not(:disabled) { border-color: var(--accent); }
	.opt.picked { border-color: var(--accent); background: #16315a; }
	.opt.good { border-color: var(--good); background: #0f2d25; }
	.opt.bad { border-color: var(--bad); background: #35141d; }
	.opt.dim { opacity: .55; }
	.why { margin-top: 16px; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--bad); background: #2a1219; }
	.why.ok { border-color: var(--good); background: #0d2420; }
	.why p { margin: 6px 0 0; }
	.nav { display: flex; justify-content: space-between; align-items: center; margin-top: 18px; gap: 10px; }
	.rev { background: var(--panel); border: 1px solid var(--bad); border-radius: 12px; padding: 10px 14px; margin: 10px 0; }
	.rev.ok { border-color: var(--line); }
	.rev summary { cursor: pointer; font-weight: 600; }
	.good-t { color: var(--good); }
	.why-t { color: var(--muted); }
</style>
