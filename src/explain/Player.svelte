<script lang="ts">
	import { onDestroy } from 'svelte';
	import Icon from '../ui/Icon.svelte';
	import Explainer from './Explainer.svelte';
	import { playlist, stop, markWatched } from './nav';
	import { sceneById, captionMs, TOPIC_LABEL } from './registry';
	import { createSpeaker } from '../tts/speaker';

	/** Full-screen scene player. Autoplays; pause, step, speed and "read aloud" are all optional. */
	let { onclose }: { onclose: () => void } = $props();

	const list = $derived($playlist);
	const scene = $derived(list ? sceneById(list.ids[list.i]) : undefined);
	let step = $state(0);
	let playing = $state(true);
	let speed = $state(1);
	let narrate = $state(false);
	const last = $derived(scene ? scene.steps.length - 1 : 0);
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
				onWord() {}, onPreparing() {}, onNotice() {},
				onEnd: () => { timer = setTimeout(advance, 600 / speed); },
				onError: () => { timer = setTimeout(advance, captionMs(say) / speed); }
			});
		} else {
			timer = setTimeout(advance, captionMs(say) / speed);
		}
		return () => clearTimeout(timer);
	});

	onDestroy(() => { clearTimeout(timer); speaker.stop(); });

	const SPEEDS = [1, 1.5, 2];
	const cycleSpeed = () => (speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]);
	function toggle() {
		if (atEnd) { step = 0; playing = true; return; }
		playing = !playing;
	}
	function go(n: number) { speaker.stop(); step = Math.max(0, Math.min(last, n)); }
	function nextScene() { if (list && hasNext) playlist.set({ ids: list.ids, i: list.i + 1 }); }

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
		</header>

		<div class="body">
			<div class="stagewrap"><Explainer {scene} {step} /></div>

			<div class="segs" role="progressbar" aria-label="Step {step + 1} of {scene.steps.length}" aria-valuemin="1" aria-valuemax={scene.steps.length} aria-valuenow={step + 1}>
				{#each scene.steps as _, n}
					<button class="seg" class:done={n <= step} onclick={() => go(n)} aria-label="Go to step {n + 1}"></button>
				{/each}
			</div>

			<p class="cap" role="status" aria-live="polite" data-testid="caption">{scene.steps[step].say}</p>
		</div>

		<footer>
			<div class="row">
				<button class="btn round" onclick={() => go(step - 1)} disabled={step === 0} aria-label="Previous step"><Icon name="back" size={18} /></button>
				<button class="btn primary mid" onclick={toggle} data-testid="toggle">
					<Icon name={atEnd ? 'replay' : playing ? 'pause' : 'play'} size={18} />{atEnd ? 'Replay' : playing ? 'Pause' : 'Play'}
				</button>
				<button class="btn round" onclick={() => go(step + 1)} disabled={atEnd} aria-label="Next step"><Icon name="chevron" size={18} /></button>
			</div>
			<div class="row sub">
				<button class="btn small" onclick={cycleSpeed} aria-label="Speed {speed} times">{speed}×</button>
				{#if speaker.supported}
					<button class="btn small" class:on={narrate} aria-pressed={narrate} onclick={() => { narrate = !narrate; speaker.stop(); }}><Icon name="mic" size={16} />Read aloud</button>
				{/if}
				{#if atEnd && hasNext}
					<button class="btn small primary" onclick={nextScene}>Next lesson<Icon name="chevron" size={16} /></button>
				{:else if atEnd}
					<button class="btn small" onclick={onclose}>Done</button>
				{/if}
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
	.ttl { min-width: 0; }
	.kick { color: var(--faint); font-size: var(--fs-small); }
	h2 { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: -.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.body { flex: 1; overflow-y: auto; padding: 16px; max-width: 640px; width: 100%; margin: 0 auto; }
	.stagewrap { background: var(--surface); border-radius: var(--radius-card); padding: 14px 10px; }
	.segs { display: flex; gap: 4px; margin: 14px 0 4px; }
	.seg { flex: 1; height: 22px; background: none; border: 0; padding: 9px 0; cursor: pointer; }
	.seg::after { content: ''; display: block; height: 4px; border-radius: 2px; background: var(--raised); transition: background .3s; }
	.seg.done::after { background: var(--accent); }
	.cap { font-size: 17px; line-height: 1.5; margin: 12px 2px 0; min-height: 5.2em; font-weight: 500; }
	footer { padding: 10px 16px calc(var(--safe-b) + 14px); border-top: 1px solid var(--border); display: grid; gap: 10px; max-width: 640px; width: 100%; margin: 0 auto; }
	.row { display: flex; align-items: center; justify-content: center; gap: 10px; }
	.row.sub { gap: 8px; flex-wrap: wrap; }
	.mid { min-width: 132px; }
	.round { width: 48px; padding: 0; }
	.small { min-height: 44px; padding: 0 14px; font-size: 13px; }
	.small.on { background: var(--raised); border-color: var(--text); }
</style>
