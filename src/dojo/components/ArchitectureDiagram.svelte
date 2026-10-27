<script>
  import { diagram, justUnlocked } from "../lib/stores.js";
  import Icon from "../../ui/Icon.svelte";

  const ZONES = [
    { key: "application", title: "Application", icon: "layers" },
    { key: "data", title: "Data", icon: "database" },
    { key: "infrastructure", title: "Infrastructure", icon: "settings" },
  ];

  let comps = $derived($diagram.components || []);
  let unlocked = $derived(new Set($diagram.unlocked || []));
  let popping = $derived(new Set($justUnlocked || []));

  let clientComp = $derived(comps.find((c) => c.group === "client"));
  let zones = $derived(
    ZONES.map((z) => ({ ...z, items: comps.filter((c) => c.group === z.key) }))
  );

  let total = $derived(comps.filter((c) => !c.always).length);
  let totalOn = $derived(comps.filter((c) => !c.always && unlocked.has(c.id)).length);

  // collapsed by default on phones — the chapter list is the main thing there
  let open = $state(typeof window === "undefined" || window.innerWidth > 640);

  const isOn = (id) => unlocked.has(id);
  const isPop = (id) => popping.has(id);
</script>

<div class="diagram">
  <button class="head" onclick={() => (open = !open)} aria-expanded={open}>
    <h3>Your TicketPay stack</h3>
    <span class="count num">{totalOn} / {total} built <span class="chev" class:open aria-hidden="true"><Icon name="chevron" size={16} /></span></span>
  </button>

  {#if open}
  <div class="flow">
    {#if clientComp}
      <div class="node on"><div class="lbl">Client</div></div>
    {/if}

    {#each zones as z}
      <div class="card" class:dim={!z.items.some((c) => isOn(c.id))}>
        <div class="card-title"><Icon name={z.icon} size={16} />{z.title}</div>
        <div class="chips">
          {#each z.items as c}
            <div class="chip" class:on={isOn(c.id)} class:pop={isPop(c.id)}>{c.label}</div>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  {#if totalOn === 0}
    <p class="hint">Solve your first exercise to start building your backend.</p>
  {/if}
  {/if}
</div>

<style>
  .diagram { background: var(--surface); border-radius: var(--radius-card); padding: var(--pad); border: 1px solid var(--rule); }
  .head { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 44px; margin: -8px 0; background: none; border: 0; padding: 0; cursor: pointer; text-align: left; color: inherit; }
  .head h3 { margin: 0; color: var(--text); font-size: var(--fs-section); font-weight: 600; }
  .count { display: inline-flex; align-items: center; gap: 4px; color: var(--muted); font-size: var(--fs-body); }
  .chev { display: inline-flex; color: var(--faint); transition: transform .15s; }
  .chev.open { transform: rotate(90deg); }
  .flow { display: flex; align-items: stretch; gap: var(--gap); flex-wrap: wrap; margin-top: 16px; }
  .node {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 12px 16px; border-radius: var(--radius-row); background: var(--raised);
  }
  .node .lbl { font-size: var(--fs-small); color: var(--text); }
  .card { flex: 1 1 200px; min-width: 190px; background: var(--raised); border-radius: var(--radius-row); padding: 14px; transition: opacity .4s; }
  .card.dim { opacity: 0.6; }
  .card-title { display: flex; align-items: center; gap: 8px; font-size: var(--fs-body); font-weight: 500; color: var(--muted); margin-bottom: 10px; }
  .chips { display: flex; flex-direction: column; gap: 6px; }
  /* built = accent mark on the left edge + full-contrast label; not built = dashed outline, muted */
  .chip {
    font-size: var(--fs-small); padding: 7px 11px; border-radius: 8px;
    background: transparent; color: var(--faint); border: 1px dashed var(--control);
    transition: color .3s, background .3s;
  }
  .chip.on { background: var(--surface); color: var(--text); border: 1px solid var(--surface); border-left: 3px solid var(--accent); }
  .chip.pop { animation: pop 1.1s ease; }
  @keyframes pop {
    0% { transform: scale(0.94); }
    40% { transform: scale(1.04); }
    100% { transform: scale(1); }
  }
  .hint { color: var(--muted); font-size: var(--fs-body); margin: 16px 0 0; }

  @media (max-width: 640px) {
    .flow { flex-direction: column; gap: 8px; }
    .node { flex-direction: row; justify-content: flex-start; padding: 8px 12px; }
    .card { flex: none; min-width: 0; padding: 12px; }
    .chips { flex-direction: row; flex-wrap: wrap; }
  }
</style>
