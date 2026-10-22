<script>
  import { progress } from "../lib/stores.js";
  import Icon from "../../ui/Icon.svelte";

  // XP needed for next level uses the same curve as the backend: 100 * n*(n-1)/2
  const threshold = (lvl) => (100 * (lvl - 1) * lvl) / 2;
  let cur = $derived(threshold($progress.level));
  let next = $derived(threshold($progress.level + 1));
  let pct = $derived(Math.min(100, Math.round((($progress.xp - cur) / (next - cur)) * 100)));
</script>

<!-- The app bar already names the section, so this is a single divided stats strip, label over value. -->
<header class="strip" aria-label="Your progress">
  <div class="cell lvl">
    <span class="lbl">Level</span>
    <span class="val num">{$progress.level}</span>
  </div>
  <div class="cell">
    <span class="lbl">XP</span>
    <span class="val num">{$progress.xp}<small> / {next}</small></span>
  </div>
  <div class="cell" title="Day streak">
    <span class="lbl">Streak</span>
    <span class="val num"><span class="ico"><Icon name="flame" size={16} /></span>{$progress.current_streak}<small> {$progress.current_streak === 1 ? "day" : "days"}</small></span>
  </div>
  <div class="cell" title="Exercises solved">
    <span class="lbl">Solved</span>
    <span class="val num">{$progress.solved_count}</span>
  </div>
  <div class="xpbar" role="progressbar" aria-label="Progress to level {$progress.level + 1}" aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct}>
    <div class="xpfill" style="width:{pct}%"></div>
  </div>
</header>

<style>
  .strip {
    display: grid; grid-template-columns: .8fr 1.3fr 1.2fr .9fr;
    margin: 0; background: var(--surface);
    position: sticky; top: var(--bar-top, 0px); z-index: 20;
  }
  .cell { display: flex; flex-direction: column; justify-content: flex-start; gap: 2px; padding: 12px 14px 14px; min-width: 0; }
  .cell:first-child { padding-left: 20px; }
  .cell + .cell { border-left: 1px solid var(--border); }
  .lbl { color: var(--muted); font-size: var(--fs-small); }
  .val { display: inline-flex; align-items: baseline; gap: 4px; color: var(--text); font-size: var(--fs-section); font-weight: 600; white-space: nowrap; }
  .val small { color: var(--faint); font-size: var(--fs-small); font-weight: 400; margin-left: 0; }
  .ico { color: var(--accent); align-self: center; display: inline-flex; margin-right: 2px; }
  .xpbar { grid-column: 1 / -1; height: 3px; background: var(--raised); overflow: hidden; }
  .xpfill { height: 100%; background: var(--accent); transition: width .5s ease; }

  @media (min-width: 641px) {
    .strip { grid-template-columns: repeat(4, minmax(0, 1fr)); padding: 0 calc(50% - 600px); }
    .cell { padding: 14px 24px; }
  }
</style>
