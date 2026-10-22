<script>
  import { marked } from "marked";
  import Icon from "../../ui/Icon.svelte";
  let { result } = $props();
  // result: { all_passed, results?|rows?, error_category, detail, explanation?, awarded_xp, new_components }
  let tests = $derived(result?.results || null);
  let rows = $derived(result?.rows || null);
  let explanation = $derived(result?.explanation || null);
  let passedCount = $derived(tests ? tests.filter((t) => t.passed).length : 0);
</script>

{#if result}
  <div class="panel" class:ok={result.all_passed} class:bad={!result.all_passed}>
    <div class="status" role="status">
      {#if result.all_passed}
        <span class="mark pos"><Icon name="check" size={16} /></span>
        <span>{tests ? `All ${tests.length} tests passed` : "Correct"}{#if result.awarded_xp > 0} <span class="xp num">+{result.awarded_xp} XP</span>{:else} <span class="xp">already solved</span>{/if}</span>
      {:else}
        <span class="mark neg"><Icon name="alert" size={16} /></span>
        <span>Not yet <span class="cat">{result.error_category}</span>{#if tests} <span class="xp num">{passedCount} of {tests.length} passed</span>{/if}</span>
      {/if}
    </div>

    {#if !result.all_passed && result.detail}
      <pre class="detail">{result.detail}</pre>
    {/if}

    {#if tests}
      <ul class="tests">
        {#each tests as t}
          <li class:pass={t.passed}>
            <span class="tmark" aria-hidden="true">{#if t.passed}<Icon name="check" size={14} />{:else}<Icon name="close" size={14} />{/if}</span>
            <span class="tbody">
              <span class="sr">{t.passed ? "Passed:" : "Failed:"}</span>
              <code>{t.call}</code>
              {#if !t.passed}
                <span class="why">expected <code>{t.expected}</code>, got <code>{t.got ?? "–"}</code>
                {#if t.error}<span class="terr">({t.error})</span>{/if}</span>
              {/if}
            </span>
          </li>
        {/each}
      </ul>
    {/if}

    {#if rows && rows.length}
      <div class="rows">
        <table>
          <thead><tr>{#each Object.keys(rows[0]) as k}<th>{k}</th>{/each}</tr></thead>
          <tbody>
            {#each rows as r}<tr>{#each Object.values(r) as v}<td class="num">{v}</td>{/each}</tr>{/each}
          </tbody>
        </table>
      </div>
    {/if}

    {#if explanation}
      <div class="explain md">{@html marked.parse(explanation)}</div>
    {/if}

    {#if result.new_components?.length}
      <div class="unlock"><Icon name="layers" size={14} />Unlocked: {result.new_components.join(", ")}</div>
    {/if}
  </div>
{/if}

<style>
  .panel { border-radius: var(--radius-card); padding: var(--pad); margin-top: 16px; background: var(--surface); }
  .status { display: flex; align-items: center; gap: 10px; font-weight: 600; color: var(--text); font-size: 15px; }
  .mark { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; flex: none; background: var(--raised); }
  .mark.pos { color: var(--accent); }
  .mark.neg { color: var(--negative); }
  .xp { color: var(--muted); font-weight: 400; font-size: var(--fs-body); margin-left: 4px; }
  .ok .xp.num { color: var(--accent); font-weight: 600; }
  .cat { color: var(--negative); font-weight: 500; margin-left: 2px; }
  .detail { background: var(--raised); padding: 12px; border-radius: var(--radius-field); color: var(--text); font-size: 12.5px; white-space: pre-wrap; margin: 12px 0 0; }
  .tests { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; gap: 2px; }
  .tests li { display: flex; gap: 10px; font-size: 13px; color: var(--text); padding: 6px 0; }
  .tmark { flex: none; width: 18px; display: grid; place-items: center; color: var(--negative); padding-top: 2px; }
  .tests li.pass .tmark { color: var(--accent); }
  .tests li.pass { color: var(--muted); }
  .tbody { min-width: 0; overflow-wrap: anywhere; }
  .why { display: block; margin-top: 2px; color: var(--muted); }
  .tests code { background: var(--raised); padding: 1px 6px; border-radius: 6px; color: var(--text); font-size: 12.5px; }
  .terr { color: var(--warning); }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .rows { margin-top: 12px; overflow-x: auto; }
  table { border-collapse: collapse; font-size: 13px; }
  th, td { border-bottom: 1px solid var(--rule); padding: 8px 12px; color: var(--text); text-align: left; }
  th { color: var(--faint); font-weight: 400; font-size: var(--fs-small); }
  .unlock { display: flex; align-items: center; gap: 6px; margin-top: 14px; color: var(--muted); font-weight: 500; font-size: 13px; }
  .explain { margin-top: 14px; padding: 12px 14px; background: var(--raised); border-radius: var(--radius-row); color: var(--muted); font-size: 14px; line-height: 1.55; }
  .explain :global(strong) { color: var(--text); font-weight: 600; }
  .explain :global(code) { background: var(--surface); padding: 1px 6px; border-radius: 6px; color: var(--text); font-size: 12.5px; }
  .explain :global(p) { margin: 6px 0; }
  .explain :global(:first-child) { margin-top: 0; }
  .explain :global(:last-child) { margin-bottom: 0; }
</style>
