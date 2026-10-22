<script>
  import { chapters, goLesson } from "../lib/stores.js";
  import Icon from "../../ui/Icon.svelte";
</script>

<section class="chapters" aria-labelledby="chapters-h">
  <h2 id="chapters-h">Chapters</h2>
  <div class="list">
    {#each $chapters as ch}
      {@const pct = ch.exercise_count ? Math.round((ch.solved_count / ch.exercise_count) * 100) : 0}
      <button class="chapter" onclick={() => goLesson(ch.id)} aria-label="{ch.title}, {ch.solved_count} of {ch.exercise_count} solved">
        <div class="meta">
          <div class="title">{ch.title}</div>
          <div class="summary">{ch.summary}</div>
          <div class="prog">
            <div class="bar" aria-hidden="true"><div class="fill" style="width:{pct}%"></div></div>
            <span class="num">{ch.solved_count} / {ch.exercise_count} solved</span>
          </div>
        </div>
        <span class="go" aria-hidden="true"><Icon name="chevron" size={18} /></span>
      </button>
    {/each}
  </div>
</section>

<style>
  .chapters h2 { color: var(--text); font-size: var(--fs-section); font-weight: 600; margin: 0 0 12px; }
  .list { display: flex; flex-direction: column; gap: var(--gap); }
  .chapter {
    width: 100%; display: flex; align-items: center; gap: 16px; text-align: left;
    background: var(--surface); border: 0; border-radius: var(--radius-card);
    padding: var(--pad); cursor: pointer; color: inherit; min-height: 44px;
  }
  .chapter:active { background: var(--raised); }
  .meta { flex: 1; min-width: 0; }
  .title { color: var(--text); font-weight: 600; font-size: 15px; line-height: 1.35; }
  .summary {
    color: var(--muted); font-size: var(--fs-body); margin: 4px 0 12px;
    display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .prog { display: flex; align-items: center; gap: 12px; color: var(--faint); font-size: var(--fs-small); }
  .bar { flex: 1; height: 4px; background: var(--raised); border-radius: 2px; overflow: hidden; }
  .fill { height: 100%; background: var(--accent); }
  .prog .num { flex: none; }
  .go { color: var(--faint); display: grid; place-items: center; }
</style>
