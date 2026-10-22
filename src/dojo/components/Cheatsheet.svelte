<script>
  import { marked } from "marked";
  import { api } from "../lib/api.js";
  import Icon from "../../ui/Icon.svelte";

  let { open = false, onClose, name = "python-cheatsheet", title = "Python" } = $props();

  let loadedName = $state(null);
  let loading = $state(false);
  let error = $state(null);
  let intro = $state("");
  let sections = $state([]); // [{ title, body }]
  let query = $state("");

  async function load(sheet) {
    loading = true; error = null;
    try {
      const { markdown } = await api.getReference(sheet);
      const parts = markdown.split(/\n## /);
      intro = parts[0].replace(/^# .*\n/, "").trim();
      sections = parts.slice(1).map((chunk) => {
        const nl = chunk.indexOf("\n");
        return { title: chunk.slice(0, nl).trim(), body: chunk.slice(nl + 1).trim() };
      });
      loadedName = sheet;
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  // (re)load whenever opened with a different cheatsheet
  $effect(() => { if (open && name !== loadedName && !loading) load(name); });

  let filtered = $derived(
    query.trim()
      ? sections.filter((s) =>
          (s.title + " " + s.body).toLowerCase().includes(query.trim().toLowerCase()))
      : sections
  );
</script>

<svelte:window onkeydown={(e) => { if (open && e.key === "Escape") onClose(); }} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="overlay" onclick={onClose} role="presentation">
    <div class="sheet" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="{title} cheatsheet" tabindex="-1">
      <div class="head">
        <h2>{title} cheatsheet</h2>
        <button class="close" onclick={onClose} aria-label="Close"><Icon name="close" size={20} /></button>
      </div>

      <input class="search" placeholder="Filter, e.g. dict, loop, f-string"
             aria-label="Filter cheatsheet" bind:value={query} />

      <div class="content">
        {#if error}
          <p class="err">Couldn't load cheatsheet: {error}</p>
        {:else if loadedName !== name}
          <p class="dim" role="status">Loading…</p>
        {:else}
          {#if !query.trim() && intro}
            <div class="intro md">{@html marked.parse(intro)}</div>
          {/if}
          {#if filtered.length === 0}
            <p class="dim">No matches for “{query}”.</p>
          {/if}
          {#each filtered as s (s.title)}
            <details open={Boolean(query.trim())}>
              <summary><span class="chev" aria-hidden="true"><Icon name="chevron" size={14} /></span>{s.title}</summary>
              <div class="md">{@html marked.parse(s.body)}</div>
            </details>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed; inset: 0; z-index: 60; background: rgba(0, 0, 0, 0.72);
    display: flex; justify-content: flex-end;
  }
  .sheet {
    width: min(560px, 100vw); height: 100%; background: var(--ground);
    border-left: 1px solid var(--border); display: flex; flex-direction: column;
    padding-top: var(--safe-t); animation: slidein .18s ease;
  }
  @keyframes slidein { from { transform: translateX(24px); opacity: 0.4; } to { transform: none; opacity: 1; } }
  .head { display: flex; align-items: center; justify-content: space-between; padding: 8px 8px 8px 20px; border-bottom: 1px solid var(--border); }
  .head h2 { margin: 0; font-size: var(--fs-section); font-weight: 600; color: var(--text); }
  .close { width: 44px; height: 44px; display: grid; place-items: center; background: none; border: none; color: var(--muted); cursor: pointer; border-radius: 50%; }
  .close:active { background: var(--surface); color: var(--text); }
  .search {
    margin: 12px 20px 4px; min-height: 44px; padding: 0 14px; background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius-field); color: var(--text); font-size: 16px;
  }
  .search::placeholder { color: var(--faint); }
  .search:focus { outline: none; border-color: var(--control); }
  .search:focus-visible { outline: 2px solid var(--text); outline-offset: 2px; }
  .content { overflow-y: auto; padding: 10px 20px calc(28px + var(--safe-b)); }
  .intro { color: var(--muted); font-size: var(--fs-body); margin-bottom: 8px; }
  details { border-bottom: 1px solid var(--rule); }
  summary { cursor: pointer; display: flex; align-items: center; gap: 8px; min-height: 44px; color: var(--text); font-weight: 500; font-size: var(--fs-body); list-style: none; }
  summary::-webkit-details-marker { display: none; }
  .chev { display: inline-flex; color: var(--faint); transition: transform .15s; }
  details[open] .chev { transform: rotate(90deg); }
  .dim { color: var(--muted); font-size: var(--fs-body); }
  .err { color: var(--negative); font-size: var(--fs-body); }

  .md { color: var(--muted); font-size: var(--fs-body); line-height: 1.6; padding-bottom: 8px; }
  .md :global(p) { margin: 6px 0; }
  .md :global(code) { background: var(--raised); padding: 1px 5px; border-radius: 4px; color: var(--text); font-size: 13px; }
  .md :global(pre) { background: var(--surface); padding: 12px 14px; border-radius: var(--radius-field); overflow-x: auto; margin: 8px 0; }
  .md :global(pre code) { background: none; padding: 0; color: var(--text); font-size: 13px; }
  .md :global(strong) { color: var(--text); font-weight: 600; }
</style>
