<script lang="ts">
	import { onDestroy } from 'svelte';
	import Icon from '../ui/Icon.svelte';
	import Explainer from './Explainer.svelte';
	import { playlist, stop, markWatched } from './nav';
	import { sceneById, captionMs, TOPIC_LABEL } from './registry';
	import { createSpeaker } from '../tts/speaker';
	import { holdAwake } from '../ui/keepAwake';
	import { loadSubLevel, subAlpha } from './subtitle';

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
	const subBg = subAlpha(loadSubLevel()); // how solid the subtitle's background is (Settings → Lesson subtitles)
	let preparing = $state(false); // the neural voice is buffering enough audio to play without pauses
	let preparingPct = $state(0);
	let notice = $state('');
	let autoNext = $state(true); // a playlist rolls on to its next lesson by itself, until the learner stays on one
	let upNext = $state(false); // the short pause between two lessons
	const last = $derived(scene ? scene.steps.length - 1 : 0);
	// Landscape phones are short and wide: the subtitle gets longer lines there.
	const mq = typeof matchMedia === 'function' ? matchMedia('(orientation: landscape) and (max-height: 560px)') : null;
	let landscape = $state(!!mq?.matches);
	$effect(() => {
		if (!mq) return;
		const f = () => (landscape = mq.matches);
		mq.addEventListener('change', f);
		return () => mq.removeEventListener('change', f);
	});
	// The subtitle area is as tall as this lesson's longest caption (about 44 characters a line on a phone held upright, 76 on its side),
	// so changing steps never moves anything.
	const capLines = $derived(scene ? Math.max(2, ...scene.steps.map((s) => Math.ceil(s.say.length / (landscape ? 76 : 44)))) : 2);
	const atEnd = $derived(step >= last);
	const hasNext = $derived(!!list && list.i < list.ids.length - 1);

	const speaker = createSpeaker();
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Video-player controls: shown for a few seconds when something happens or you tap the screen, hidden while a lesson plays,
	// always shown when it is paused or finished. A thin progress line stays visible either way.
	let controls = $state(true);
	let hideTimer: ReturnType<typeof setTimeout> | undefined;
	function showControls() {
		controls = true;
		clearTimeout(hideTimer);
		if (playing && !upNext) hideTimer = setTimeout(() => { if (playing) controls = false; }, 3200);
	}
	function toggleControls() {
		if (controls && playing && !upNext) { controls = false; clearTimeout(hideTimer); }
		else showControls();
	}
	$effect(() => {
		if (!scene) return;
		if (!playing || upNext) { controls = true; clearTimeout(hideTimer); }
		else showControls();
	});

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

	onDestroy(() => { clearTimeout(timer); clearTimeout(hideTimer); speaker.stop(); speaker.cancelPrefetch(); });

	const SPEEDS = [1, 1.5, 2];
	const cycleSpeed = () => { speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]; showControls(); };
	function toggle() {
		if (atEnd) { step = 0; playing = true; autoNext = true; return; }
		playing = !playing;
		showControls();
	}
	function go(n: number) { if (atEnd && n < step) autoNext = false; speaker.stop(); step = Math.max(0, Math.min(last, n)); showControls(); }
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
		else if (e.key === 'Escape') onclose();
		else if (e.key === 'Tab') showControls(); // keyboard users: bring the controls back so they can be reached
	}
</script>

<svelte:window onkeydown={onKey} />

{#if scene}
	<div class="player" role="dialog" aria-modal="true" aria-label="{scene.title}, animated explainer" data-testid="player">
		<div class="theater">
			<header class="top" class:hide={!controls} inert={!controls}>
				<button class="ib" onclick={onclose} aria-label="Close"><Icon name="close" size={22} /></button>
				<div class="ttl">
					<span class="kick">{TOPIC_LABEL[scene.topic]}{list && list.ids.length > 1 ? ` · ${list.i + 1} of ${list.ids.length}` : ''}</span>
					<h2>{scene.title}</h2>
				</div>
				{#if list && list.ids.length > 1}
					<!-- jump between the lessons of this playlist, at any time -->
					<div class="lessonnav" role="group" aria-label="Lessons">
						<button class="ib" onclick={() => { prevScene(); showControls(); }} disabled={list.i === 0} aria-label="Previous lesson"><Icon name="back" size={20} /></button>
						<button class="ib" onclick={() => { nextScene(); showControls(); }} disabled={!hasNext} aria-label="Next lesson"><Icon name="chevron" size={20} /></button>
					</div>
				{/if}
			</header>

			<div class="mid">
				<div class="frame">
					<div class="stagewrap"><Explainer {scene} {step} /></div>

					<!-- tapping the picture shows or hides the controls, like a video -->
					<button class="tap" onclick={toggleControls} aria-label={controls ? 'Hide controls' : 'Show controls'} aria-expanded={controls}></button>

					{#if upNext}
						<p class="status" role="status">Next lesson starts in a moment <button class="stay" onclick={stay}>Stay here</button></p>
					{:else if narrate && (preparing || notice)}
						<p class="status" role="status" aria-live="polite">{#if preparing}Preparing voice…{#if preparingPct > 0} {Math.round(preparingPct)}%{/if}{:else}{notice}{/if}</p>
					{/if}
				</div>

				<!-- the narration, as a light subtitle right under the picture; always the same height for this lesson -->
				<div class="subzone" style="--cap-lines: {capLines}; --sub-bg: rgba(0, 0, 0, {subBg})">
					<p class="cap" class:clear={subBg < 0.2} role="status" aria-live="polite" data-testid="caption">{scene.steps[step].say}</p>
				</div>
			</div>

			<div class="bottom" class:hide={!controls} inert={!controls}>
				<div class="segs" role="progressbar" aria-label="Step {step + 1} of {scene.steps.length}" aria-valuemin="1" aria-valuemax={scene.steps.length} aria-valuenow={step + 1}>
					{#each scene.steps as _, n}
						<button class="seg" class:done={n <= step} onclick={() => go(n)} aria-label="Go to step {n + 1}"></button>
					{/each}
				</div>
				<div class="bar">
					<div class="grp">
						<button class="cb main" onclick={toggle} data-testid="toggle" aria-label={atEnd ? 'Replay' : playing ? 'Pause' : 'Play'}>
							<Icon name={atEnd ? 'replay' : playing ? 'pause' : 'play'} size={22} /><span class="sr-only">{atEnd ? 'Replay' : playing ? 'Pause' : 'Play'}</span>
						</button>
						<button class="cb" onclick={() => go(step - 1)} disabled={step === 0} aria-label="Previous step"><Icon name="back" size={22} /></button>
						<button class="cb" onclick={() => go(step + 1)} disabled={atEnd} aria-label="Next step"><Icon name="chevron" size={22} /></button>
					</div>
					<div class="grp">
						<!-- at the end of a lesson this slot offers the way on; otherwise speed and narration -->
						{#if atEnd && hasNext}
							<button class="pill-b strong" onclick={() => nextScene()}>Next lesson<Icon name="chevron" size={16} /></button>
						{:else if atEnd}
							<button class="pill-b strong" onclick={onclose}>Done</button>
						{:else}
							<button class="pill-b" onclick={cycleSpeed} aria-label="Speed {speed} times">{speed}×</button>
							{#if speaker.supported}
								<button class="pill-b" class:on={narrate} aria-pressed={narrate} onclick={() => { setNarrate(!narrate); speaker.stop(); preparing = false; notice = ''; showControls(); }}><Icon name="mic" size={18} />Read aloud</button>
							{/if}
						{/if}
					</div>
				</div>
			</div>
		</div>
		<div class="hair" aria-hidden="true"><div style="width: {((step + 1) / scene.steps.length) * 100}%"></div></div>
	</div>
{/if}

<style>
	.player { position: fixed; inset: 0; z-index: 60; background: var(--ground); display: flex; flex-direction: column; animation: up .22s ease; }
	@keyframes up { from { transform: translateY(24px); opacity: 0; } }

	/* Upright: a top bar, the picture with its subtitle (centred in the space between), and the controls at the bottom.
	   The bars fade while a lesson plays but keep their space, so nothing ever moves. */
	.theater { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: calc(var(--safe-t) + 4px) max(10px, env(safe-area-inset-right)) 0 max(10px, env(safe-area-inset-left)); }
	.mid { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; }
	.frame { position: relative; flex: none; width: 100%; max-width: 760px; margin: 0 auto; aspect-ratio: 360 / 330; }
	.stagewrap { position: absolute; inset: 0; background: var(--surface); border-radius: var(--radius-card); padding: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
	.stagewrap :global(svg.stage) { width: 100%; height: 100%; max-height: 100%; }
	.tap { position: absolute; inset: 0; z-index: 1; background: none; border: 0; padding: 0; border-radius: var(--radius-card); cursor: pointer; -webkit-tap-highlight-color: transparent; }
	.tap:focus-visible { outline-offset: -4px; }

	.top, .bottom { transition: opacity .2s ease; }
	.hide { opacity: 0; visibility: hidden; transition: opacity .2s ease, visibility 0s .2s; }
	.top { flex: none; height: 56px; display: flex; align-items: center; gap: 4px; padding: 0 4px 0 0; }
	.ib { width: 44px; height: 44px; display: grid; place-items: center; background: none; border: 0; border-radius: 50%; color: var(--text); flex: none; }
	.ib:active { background: var(--surface); }
	.ib:disabled { opacity: .35; }
	.ttl { min-width: 0; flex: 1; }
	.kick { display: block; color: var(--muted); font-size: var(--fs-small); line-height: 16px; }
	h2 { margin: 0; font-size: 15px; line-height: 20px; font-weight: 600; letter-spacing: -.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.lessonnav { display: flex; flex: none; }

	.bottom { flex: none; padding: 0 4px 10px; max-width: 760px; width: 100%; margin: 0 auto; }
	.segs { display: flex; gap: 4px; }
	.seg { flex: 1; height: 24px; background: none; border: 0; padding: 10px 0; cursor: pointer; }
	.seg::after { content: ''; display: block; height: 4px; border-radius: 2px; background: var(--raised); transition: background .3s; }
	.seg.done::after { background: var(--accent); }
	.bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
	.grp { display: flex; align-items: center; gap: 4px; }
	.cb { width: 44px; height: 44px; display: grid; place-items: center; background: none; border: 0; border-radius: 50%; color: var(--text); }
	.cb:active { background: var(--surface); }
	.cb:disabled { opacity: .35; }
	.cb.main { width: 48px; height: 48px; background: var(--text); color: #000; margin-right: 6px; }
	.cb.main:active { background: #d9d9d9; }
	.pill-b { min-height: 44px; display: inline-flex; align-items: center; gap: 6px; padding: 0 14px; border-radius: 999px; background: none; border: 1px solid var(--control); color: var(--text); font-size: 13px; font-weight: 600; }
	.pill-b.on { background: var(--raised); border-color: var(--text); }
	.pill-b.strong { border-color: var(--text); }
	.pill-b:active { background: var(--raised); }

	/* Status (preparing the voice / next lesson): shown even when the controls are hidden. */
	.status { position: absolute; z-index: 3; left: 50%; transform: translateX(-50%); top: 10px; margin: 0; padding: 4px 6px 4px 14px; border-radius: 999px; background: rgba(0, 0, 0, .86); color: var(--muted); font-size: 13px; line-height: 20px; white-space: nowrap; display: flex; align-items: center; gap: 8px; }
	.status:not(:has(.stay)) { padding-right: 14px; }
	.stay { min-height: 36px; padding: 0 12px; border-radius: 999px; background: none; border: 1px solid var(--control); color: var(--text); font-size: 13px; font-weight: 600; }

	/* The narration as a light subtitle right under the picture. */
	.subzone { flex: none; width: 100%; max-width: 760px; margin: 0 auto; display: flex; align-items: center; justify-content: center; min-height: calc(var(--cap-lines, 2) * 22px + 20px); padding: 10px 8px; }
	.cap { margin: 0; max-width: 62ch; text-align: center; font-size: 16px; line-height: 22px; font-weight: 400; color: color-mix(in srgb, var(--text) 90%, transparent); }
	.hair { flex: none; height: 3px; margin-bottom: var(--safe-b); background: var(--raised); }
	.hair > div { height: 100%; background: var(--accent); transition: width .3s ease; }

	/* Landscape phones have no spare height: the picture takes all of it (scaled to fit, never cut off), the controls overlay it
	   and fade away, and the subtitle sits underneath. */
	@media (orientation: landscape) and (max-height: 560px) {
		.theater { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) auto; padding-top: calc(var(--safe-t) + 4px); }
		.mid { display: contents; }
		.frame { grid-area: 1 / 1; max-width: none; aspect-ratio: auto; width: 100%; height: 100%; min-height: 0; margin: 0; }
		.top, .bottom { grid-area: 1 / 1; position: relative; z-index: 2; background: rgba(0, 0, 0, .97); max-width: none; margin: 0; }
		.top { align-self: start; height: 44px; padding: 0 6px 0 2px; border-radius: var(--radius-card) var(--radius-card) 0 0; }
		/* one slim row: play and step buttons, the progress segments in the middle, speed and narration */
		.bottom { align-self: end; margin-bottom: 64px; display: flex; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 0 0 var(--radius-card) var(--radius-card); }
		.bar { display: contents; }
		.bar .grp:first-child { order: 1; }
		.segs { order: 2; flex: 1; min-width: 0; }
		.bar .grp:last-child { order: 3; }
		.ib:active, .cb:active { background: var(--raised); }
		.kick { display: none; }
		.status { top: 50px; }
		.theater { grid-template-rows: minmax(0, 1fr); }
		/* the subtitle sits on the picture (which gets the full height) and never moves; the control bar sits just above it */
		.stagewrap { padding-bottom: 46px; }
		.subzone { grid-area: 1 / 1; align-self: end; justify-self: center; z-index: 1; min-height: 0; width: auto; max-width: min(78ch, 88%); margin: 0 0 10px; padding: 0; pointer-events: none; }
		.cap { font-size: 15px; line-height: 21px; max-width: none; background: var(--sub-bg); padding: 5px 14px; border-radius: 10px; }
		.cap.clear { text-shadow: 0 1px 4px rgba(0, 0, 0, .95), 0 0 2px #000; } /* taste-skill-ignore: a subtitle with no plate needs it to stay readable */
	}
	@media (prefers-reduced-motion: reduce) { .top, .bottom, .hide { transition: none; } }
</style>
