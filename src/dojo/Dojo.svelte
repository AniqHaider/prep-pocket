<script>
  import { onMount } from "svelte";
  import { view, refreshAll } from "./lib/stores.js";
  import StatsBar from "./components/StatsBar.svelte";
  import ArchitectureDiagram from "./components/ArchitectureDiagram.svelte";
  import ChapterList from "./components/ChapterList.svelte";
  import LessonView from "./components/LessonView.svelte";
  import ExerciseView from "./components/ExerciseView.svelte";
  import ChatPanel from "./components/ChatPanel.svelte";

  let booted = $state(false);
  let bootError = $state(null);

  onMount(async () => {
    try { await refreshAll(); booted = true; }
    catch (e) { bootError = e.message; }
  });
</script>

<StatsBar />

<main>
  {#if bootError}
    <div class="boot err"><h2>Couldn't load the dojo</h2><p class="dim">{bootError}</p></div>
  {:else if !booted}
    <div class="boot" role="status">Loading your dojo…</div>
  {:else if $view.name === "dashboard"}
    <div class="dashboard">
      <ArchitectureDiagram />
      <ChapterList />
    </div>
  {:else if $view.name === "lesson"}
    <LessonView />
  {:else if $view.name === "exercise"}
    <ExerciseView />
  {/if}
</main>

<ChatPanel />

<style>
  main { padding: 20px; max-width: 1200px; margin: 0 auto; }
  .dashboard { display: flex; flex-direction: column; gap: 28px; }
  .boot { color: var(--muted); text-align: center; padding: 80px 20px; }
  .boot.err h2 { color: var(--negative); font-size: var(--fs-section); font-weight: 600; }
  .dim { color: var(--faint); font-size: var(--fs-small); }
  @media (max-width: 640px) { main { padding: 16px 16px 24px; } }
</style>
