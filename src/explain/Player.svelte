<script lang="ts">
	import { onDestroy } from 'svelte';
	import Icon from '../ui/Icon.svelte';
	import Explainer from './Explainer.svelte';
	import { playlist, stop, markWatched } from './nav';
	import { sceneById, captionMs, TOPIC_LABEL } from './registry';
	import { createSpeaker } from '../tts/speaker';
	import { holdAwake } from '../ui/keepAwake';

	/** Full-screen scene player. Autoplays; pause, step, speed and "read aloud" are all optional. */
	let { onclose }: { onclose: () => void } = $props();

	const list = $derived($playlist);
	const scene = $derived(list ? sceneById(list.ids[list.i]) : undefined);
	let step = $state(0);
	let playing = $state(true);
	let speed = $state(1);
	// Read aloud is on by default (it only does anything when a voice is available); turning it off is remembered.
	const NARRATE_KEY = 'preppy:player:narrate';
	let narrate = $state((() => { try { return localStorage.getItem(NARRATE_KEY) !== '0'; } catch { return true; } })());
	const setNarrate = (on: boolean) => {
		narrate = on;
		try { localStorage.setItem(NARRATE_KEY, on ? '1' : '0'); } catch { /* ignore */ }
	};
	let preparing = $state(false); // the neural voice is buffering enough audio to play without pauses
	let preparingPct = $state(0);
	let notice = $state('');
	let autoNext = $state(true); // a playlist rolls on to its next lesson by itself, until the learner stays on one
	let upNext = $state(false); // the short pause between two lessons
	const last = $derived(scene ? scene.steps.length - 1 : 0);
	// The caption area is at least four lines, and as tall as this scene's longest caption (about 34 characters a line on a phone), so changing steps never moves anything.
	const capLines = $derived(scene ? Math.max(4, ...scene.steps.map((s) => Math.ceil(s.say.length / 34))) : 2);
	const atEnd = $derived(step >= last);
	const hasNext = $derived(!!list && list.i < list.ids.length - 1);

	const speaker = createSpeaker();
	let timer: ReturnType<typeof setTimeout> | undefined;

	// New scene: restart from the top, playing.
	let lastKey = '';
	$effect(() => {
		const key = scene?.id ?? '';
		if (key !== lastKey) { lastKey = key; step = 0; playing = true; speaker.stop(); }
	});

	// Auto-advance: by timer, or by the end of the spoken caption when narration is on.
	$effect(() => {
		clearTimeout(timer);
		if (!scene || !playing) { speaker.stop(); return; }
		if (atEnd) { playing = false; markWatched(scene.id); return; }
		const say = scene.steps[step].say;
		const advance = () => { if (playing) step = Math.min(step + 1, last); };
		if (narrate && speaker.supported) {
			speaker.speakFrom(say.split(/\s+/), 0, speed, {
				onWord() {}, onPreparing: (on, pct) => { preparing = on; preparingPct = pct ?? 0; }, onNotice: (m) => { notice = m; },
				onEnd: () => { preparing = false; timer = setTimeout(advance, 600 / speed); },
				onError: () => { preparing = false; timer = setTimeout(advance, captionMs(say) / speed); }
			});
		} else {
			timer = setTimeout(advance, captionMs(say) / speed);
		}
		return () => clearTimeout(timer);
	});

	// With a downloaded voice and Read aloud on, synthesize the captions still to come (and the first two of the next lesson) into the
	// on-phone audio cache in the background, one at a time and never ahead of the caption being spoken, so later steps start instantly.
	// Re-runs on every step (what is already cached is skipped) and stops when narration is turned off or the player closes.
	$effect(() => {
		if (!scene || !narrate || !speaker.supported) { speaker.cancelPrefetch(); return; }
		const later = scene.steps.slice(step + 1).map((s) => s.say);
		const nextId = list && list.i < list.ids.length - 1 ? list.ids[list.i + 1] : null;
		const upNext = (nextId ? sceneById(nextId) : undefined)?.steps.slice(0, 2).map((s) => s.say) ?? [];
		speaker.prefetch([...later, ...upNext], speed);
		return () => speaker.cancelPrefetch();
	});

	// After the last step of a lesson in a playlist, continue to the next one after a short pause.
	$effect(() => {
		if (!(scene && atEnd && hasNext && autoNext)) { upNext = false; return; }
		upNext = true;
		const t = setTimeout(() => { upNext = false; nextScene(); }, 3500);
		return () => clearTimeout(t);
	});

	// The screen stays on while a lesson is playing and in the pause before the next one; it may sleep again on pause,
	// at the end of the playlist, or when the player is closed.
	$effect(() => (scene && (playing || upNext) ? holdAwake('player') : undefined));

	onDestroy(() => { clearTimeout(timer); speaker.stop(); speaker.cancelPrefetch(); });

	const SPEEDS = [1, 1.5, 2];
	const cycleSpeed = () => (speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]);
	function toggle() {
		if (atEnd) { step = 0; playing = true; autoNext = true; return; }
		playing = !playing;
	}
	function go(n: number) { if (atEnd && n < step) autoNext = false; speaker.stop(); step = Math.max(0, Math.min(last, n)); }
	function nextScene() {
		if (!(list && hasNext)) return;
		autoNext = true; upNext = false;
		step = 0; playing = true; // start the next lesson from its first step, in the same tick
		playlist.set({ ids: list.ids, i: list.i + 1 });
	}
	function prevScene() {
		if (!(list && list.i > 0)) return;
		upNext = false; step = 0; playing = true;
		playlist.set({ ids: list.ids, i: list.i - 1 });
	}
	function stay() { autoNext = false; upNext = false; }

	function onKey(e: KeyboardEvent) {
		if (!scene) return;
		if (e.key === 'ArrowRight') go(step + 1);
		else if (e.key === 'ArrowLeft') go(step - 1);
		else if (e.key === ' ') { e.preventDefault(); toggle(); }
	}
</script>

<svelte:window onkeydown={onKey} />

{#if scene}
	<div class="player" role="dialog" aria-modal="true" aria-label="{scene.title}, animated explainer" data-testid="player">
		<header>
			<button class="ib" onclick={onclose} aria-label="Close"><Icon name="close" size={22} /></button>
			<div class="ttl">
				<span class="kick">{TOPIC_LABEL[scene.topic]}{list && list.ids.length > 1 ? ` · ${list.i + 1} of ${list.ids.length}` : ''}</span>
				<h2>{scene.title}</h2>
			</div>
			{#if list && list.ids.length > 1}
				<!-- jump between the lessons of this playlist from the top bar, at any time -->
				<div class="lessonnav" role="group" aria-label="Lessons">
					<button class="ib" onclick={prevScene} disabled={list.i === 0} aria-label="Previous lesson"><Icon name="back" size={20} /></button>
					<button class="ib" onclick={nextScene} disabled={!hasNext} aria-label="Next lesson"><Icon name="chevron" size={20} /></button>
				</div>
			{/if}
		</header>

		<div class="body">
			<div class="inner">
			<div class="stagewrap"><Explainer {scene} {step} /></div>

			<div class="segs" role="progressbar" aria-label="Step {step + 1} of {scene.steps.length}" aria-valuemin="1" aria-valuemax={scene.steps.length} aria-valuenow={step + 1}>
				{#each scene.steps as _, n}
					<button class="seg" class:done={n <= step} onclick={() => go(n)} aria-label="Go to step {n + 1}"></button>
				{/each}
			</div>

			<div class="capwrap">
			<p class="cap" role="status" aria-live="polite" data-testid="caption" style="--cap-lines: {capLines}">{scene.steps[step].say}</p>
			<p class="note" role="status" aria-live="polite">{#if upNext}Next lesson starts in a moment.{:else if narrate && preparing}Preparing voice…{#if preparingPct > 0} {Math.round(preparingPct)}%{/if}{:else if narrate && notice}{notice}{/if}</p>
			</div>
			</div>
		</div>

		<footer>
			<div class="row main">
				<button class="btn round" onclick={() => go(step - 1)} disabled={step === 0} aria-label="Previous step"><Icon name="back" size={18} /></button>
				<button class="btn primary mid" onclick={toggle} data-testid="toggle">
					<Icon name={atEnd ? 'replay' : playing ? 'pause' : 'play'} size={18} />{atEnd ? 'Replay' : playing ? 'Pause' : 'Play'}
				</button>
				<!-- the forward slot is the same size on every step: it becomes "Next lesson" or "Done" at the end, so the footer never changes height -->
				{#if atEnd && hasNext}
					<button class="btn fwd" onclick={nextScene}>Next lesson<Icon name="chevron" size={16} /></button>
				{:else if atEnd}
					<button class="btn fwd" onclick={onclose}>Done</button>
				{:else}
					<button class="btn round" onclick={() => go(step + 1)} aria-label="Next step"><Icon name="chevron" size={18} /></button>
				{/if}
			</div>
			<div class="row sub">
				<button class="btn small" onclick={cycleSpeed} aria-label="Speed {speed} times">{speed}×</button>
				{#if speaker.supported}
					<button class="btn small" class:on={narrate} aria-pressed={narrate} onclick={() => { setNarrate(!narrate); speaker.stop(); preparing = false; notice = ''; }}><Icon name="mic" size={16} />Read aloud</button>
				{/if}
				{#if upNext}<button class="btn small" onclick={stay}>Stay here</button>{/if}
			</div>
		</footer>
	</div>
{/if}

<style>
	.player { position: fixed; inset: 0; z-index: 60; background: var(--ground); display: flex; flex-direction: column; padding-top: var(--safe-t); animation: up .22s ease; }
	@keyframes up { from { transform: translateY(24px); opacity: 0; } }
	header { display: flex; align-items: center; gap: 4px; padding: 6px 8px 6px 4px; border-bottom: 1px solid var(--border); }
	.ib { width: 44px; height: 44px; display: grid; place-items: center; background: none; border: 0; border-radius: 50%; color: var(--text); flex: none; }
	.ib:active { background: var(--surface); }
	.ttl { min-width: 0; flex: 1; }
	.lessonnav { display: flex; gap: 2px; flex: none; }
	.ib:disabled { opacity: .35; }
	.kick { color: var(--faint); font-size: var(--fs-small); }
	h2 { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: -.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.body { flex: 1; overflow-y: auto; padding: 16px; max-width: 640px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; }
	.inner { margin: 0; width: 100%; } /* top-aligned: nothing here moves between steps or between lessons */
	.stagewrap { background: var(--surface); border-radius: var(--radius-card); padding: 10px; aspect-ratio: 360 / 330; display: flex; align-items: center; justify-content: center; overflow: hidden; } /* a fixed-size box: the scene is centred inside it, so the box never changes size */
	.stagewrap :global(svg.stage) { max-height: 100%; width: 100%; }
	.segs { display: flex; gap: 4px; margin: 14px 0 4px; }
	.seg { flex: 1; height: 22px; background: none; border: 0; padding: 9px 0; cursor: pointer; }
	.seg::after { content: ''; display: block; height: 4px; border-radius: 2px; background: var(--raised); transition: background .3s; }
	.seg.done::after { background: var(--accent); }
	.cap { font-size: 17px; line-height: 1.5; margin: 12px 2px 0; min-height: calc(var(--cap-lines, 3) * 1.5em); font-weight: 500; }
	footer { padding: 10px 16px calc(var(--safe-b) + 14px); border-top: 1px solid var(--border); display: grid; gap: 10px; max-width: 640px; width: 100%; margin: 0 auto; }
	.note { color: var(--muted); font-size: 13px; line-height: 20px; min-height: 20px; margin: 8px 2px 0; } /* always there, so it appearing never shifts the layout */
	.row { display: flex; align-items: center; justify-content: center; gap: 10px; }
	.row.sub { gap: 8px; flex-wrap: wrap; }
	.mid { min-width: 132px; }
	.round { width: 48px; padding: 0; }
	.row.main { min-height: 48px; display: grid; grid-template-columns: 48px 132px 148px; justify-content: center; gap: 10px; }
	.row.main .mid { min-width: 0; width: 100%; }
	.row.sub { min-height: 44px; }
	.fwd { min-height: 48px; padding: 0 14px; width: 100%; }
	.small { min-height: 44px; padding: 0 14px; font-size: 13px; }
	.small.on { background: var(--raised); border-color: var(--text); }

	/* Landscape phones are short: put the animation on the left and the caption + controls on the right, nothing scrolls. */
	@media (orientation: landscape) and (max-height: 560px) {
		.player {
			display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); grid-template-rows: auto auto minmax(0, 1fr) auto;
			grid-template-areas: "head head" "stage segs" "stage cap" "stage foot";
			column-gap: 16px; padding-left: env(safe-area-inset-left, 0px); padding-right: env(safe-area-inset-right, 0px);
		}
		header { grid-area: head; padding-top: 0; padding-bottom: 0; }
		.body, .inner { display: contents; }
		.stagewrap { grid-area: stage; min-height: 0; margin: 10px 0 10px 16px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
		.stagewrap :global(svg.stage) { max-height: 100%; width: 100%; }
		.segs { grid-area: segs; margin: 10px 16px 0 0; }
		.capwrap { grid-area: cap; min-height: 0; overflow-y: auto; margin-right: 16px; align-self: start; }
		.cap { font-size: 18px; line-height: 1.45; min-height: 0; margin: 6px 0 0; }
		footer { grid-area: foot; max-width: none; margin: 0; border-top: 0; padding: 6px 16px calc(var(--safe-b) + 8px) 0; gap: 6px; }
		footer .row, footer .row.sub { justify-content: flex-start; }
		footer .row.main { justify-content: start; }
	}
</style>
