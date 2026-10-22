<script>
  import { goExercise } from "../lib/stores.js";
  import Icon from "../../ui/Icon.svelte";
  let { ex, chapterId } = $props();
</script>

<button class="callout" class:solved={ex.solved} onclick={() => goExercise(chapterId, ex.id)}>
  <span class="body">
    <span class="title">{#if ex.solved}<span class="done"><Icon name="check" size={16} label="Solved" /></span>{/if}{ex.title}</span>
    <span class="sub num">{ex.type} · {ex.xp} XP</span>
  </span>
  <span class="cta">{ex.solved ? "Revisit" : "Try it"}<Icon name="chevron" size={14} /></span>
</button>

<style>
  .callout {
    width: 100%; display: flex; align-items: center; gap: 14px; text-align: left; min-height: 64px;
    background: var(--surface); border: 0; border-radius: var(--radius-card);
    padding: 14px 18px; margin: 18px 0; cursor: pointer; color: var(--text);
  }
  .callout:active { background: var(--raised); }
  .body { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  .done { color: var(--accent); display: inline-flex; vertical-align: -3px; margin-right: 6px; }
  .sub { font-size: var(--fs-small); color: var(--muted); }
  .title { font-size: 15px; font-weight: 600; color: var(--text); }
  .cta { display: inline-flex; align-items: center; gap: 2px; color: var(--text); font-size: var(--fs-body); font-weight: 600; white-space: nowrap; }
</style>
