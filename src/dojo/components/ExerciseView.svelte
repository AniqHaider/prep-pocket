<script>
  import { api } from "../lib/api.js";
  import { warmPython, warmSql } from "../engine/runners";
  import { marked } from "marked";
  import { view, chapters, goLesson, goExercise, refreshProgressAndDiagram } from "../lib/stores.js";
  import CodeEditor from "./CodeEditor.svelte";
  import ResultsPanel from "./ResultsPanel.svelte";
  import Cheatsheet from "./Cheatsheet.svelte";
  import Icon from "../../ui/Icon.svelte";

  let exercise = $state(null);
  let code = $state("");
  let result = $state(null);
  let running = $state(false);
  let error = $state(null);
  let loadedId = $state(null);
  let selectedChoice = $state(null); // for quiz exercises
  let showCheat = $state(false);
  let isQuiz = $derived(exercise?.type === "quiz");
  let syntaxHints = $derived(exercise?.syntax_hints || []);
  let hasCheat = $derived(exercise?.type === "python" || exercise?.type === "sql");
  let cheat = $derived(
    exercise?.type === "sql"
      ? { name: "sql-cheatsheet", title: "SQL" }
      : { name: "python-cheatsheet", title: "Python" }
  );

  // Prev/Next within the chapter, derived from the chapter's exercise order.
  let chapter = $derived($chapters.find((c) => c.id === $view.chapterId));
  let ids = $derived(chapter?.exercise_ids || []);
  let idx = $derived(ids.indexOf($view.exerciseId));
  let prevId = $derived(idx > 0 ? ids[idx - 1] : null);
  let nextId = $derived(idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null);
  let isSolved = $derived(Boolean(result?.all_passed) || Boolean(exercise?.solved));

  async function load(id) {
    exercise = null; result = null; error = null; loadedId = id; selectedChoice = null;
    try {
      const ex = await api.getExercise(id);
      exercise = ex;
      if (ex.type === "python") warmPython(); else if (ex.type === "sql") warmSql();
      code = ex.best_code || ex.starter_code || "";
      if (ex.type === "quiz" && ex.best_code != null && ex.best_code !== "") {
        selectedChoice = Number(ex.best_code);
      }
    } catch (e) { error = e.message; }
  }

  $effect(() => {
    if ($view.name === "exercise" && $view.exerciseId !== loadedId) load($view.exerciseId);
  });

  async function run() {
    running = true; result = null;
    const submission = isQuiz ? String(selectedChoice) : code;
    try {
      result = await api.runExercise(exercise.id, submission);
      await refreshProgressAndDiagram(result.new_components || []);
    } catch (e) {
      result = { all_passed: false, error_category: "network", detail: e.message };
    } finally { running = false; }
  }
</script>

<div class="exercise">
  <button class="back" onclick={() => goLesson($view.chapterId)}>
    <Icon name="back" size={16} />
    Back to chapter
  </button>

  {#if error}
    <p class="err">Couldn't load exercise: {error}</p>
  {:else if !exercise}
    <p class="loading">Loading…</p>
  {:else}
    <div class="head">
      <h1>{exercise.title}</h1>
      <span class="pill num">{exercise.type} · {exercise.xp} XP</span>
    </div>

    <div class="prompt">{@html marked.parse(exercise.prompt_md || "")}</div>

    {#if isQuiz}
      <div class="options">
        {#each exercise.options as opt, i}
          <button class="option" class:sel={selectedChoice === i}
                  onclick={() => (selectedChoice = i)}>
            <span class="optmark">{String.fromCharCode(65 + i)}</span>
            <span class="opttext">{opt}</span>
          </button>
        {/each}
      </div>
    {:else}
      {#if syntaxHints.length || hasCheat}
        <div class="syntaxbar">
          {#if syntaxHints.length}
            <details class="syntax" open>
              <summary>Syntax you'll need <span class="dim">the building blocks, not the answer</span></summary>
              <ul>
                {#each syntaxHints as h}
                  <li><code>{h.code}</code>{#if h.note}<span class="note">{h.note}</span>{/if}</li>
                {/each}
              </ul>
            </details>
          {:else}
            <span class="syntax-spacer"></span>
          {/if}
          {#if hasCheat}
            <button class="btn cheatbtn" onclick={() => (showCheat = true)}><Icon name="book" size={16} />{cheat.title} cheatsheet</button>
          {/if}
        </div>
      {/if}
      <CodeEditor {code} language={exercise.type === "sql" ? "sql" : "python"}
                  onChange={(v) => (code = v)} />
    {/if}

    <div class="actions">
      <button class="btn primary run" onclick={run} disabled={running || (isQuiz && selectedChoice === null)}>
        {#if isQuiz && !running}<Icon name="check" size={16} />{/if}{running ? "Checking…" : isQuiz ? "Submit answer" : "Run"}
      </button>
      {#if exercise.hints?.length}
        <details class="hints">
          <summary>Hints ({exercise.hints.length})</summary>
          <ul>{#each exercise.hints as h}<li>{h}</li>{/each}</ul>
        </details>
      {/if}
    </div>

    <ResultsPanel {result} />

    <nav class="exnav">
      <button class="btn navbtn" disabled={!prevId}
              onclick={() => prevId && goExercise($view.chapterId, prevId)}>
        <Icon name="back" size={16} />
        Previous
      </button>

      <span class="exnav-count num">{idx >= 0 ? idx + 1 : "–"} / {ids.length}</span>

      <button class="btn navbtn next" class:primary={isSolved} disabled={!nextId}
              onclick={() => nextId && goExercise($view.chapterId, nextId)}>
        Next
        <Icon name="chevron" size={16} />
      </button>
    </nav>
  {/if}
</div>

<Cheatsheet open={showCheat} name={cheat.name} title={cheat.title} onClose={() => (showCheat = false)} />

<style>
  .exercise { max-width: 820px; }
  .back {
    display: inline-flex; align-items: center; gap: 6px; min-height: 44px;
    background: none; border: none; color: var(--muted); cursor: pointer; font-size: var(--fs-body);
    margin-left: -6px; padding: 0 10px 0 6px; border-radius: var(--radius-control);
  }
  .back:active { background: var(--surface); color: var(--text); }
  .head { display: flex; align-items: center; gap: 12px; }
  h1 { color: var(--text); font-size: var(--fs-title); font-weight: 600; letter-spacing: -.01em; margin: 4px 0 0; }
  .prompt { color: var(--muted); line-height: 1.6; font-size: 15px; margin: 12px 0 16px; }
  .prompt :global(strong) { color: var(--text); font-weight: 600; }
  .prompt :global(code) { background: var(--raised); padding: 1px 6px; border-radius: 6px; color: var(--text); font-size: 13px; }
  .actions { display: flex; align-items: center; gap: 16px; margin-top: 14px; }
  .run { min-width: 120px; }
  .hints { color: var(--muted); font-size: var(--fs-body); }
  .hints summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; }
  .hints ul { margin: 0 0 6px; color: var(--muted); }
  .loading, .err { color: var(--muted); }

  .syntaxbar { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
  .syntax { flex: 1; background: var(--surface); border-radius: var(--radius-row); padding: 0 14px; }
  .syntax-spacer { flex: 1; }
  .syntax summary { cursor: pointer; color: var(--text); font-size: var(--fs-body); font-weight: 600; min-height: 44px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; list-style: none; }
  .syntax summary::-webkit-details-marker { display: none; }
  .syntax summary::before { content: ""; width: 6px; height: 6px; border-right: 1.6px solid var(--faint); border-bottom: 1.6px solid var(--faint); transform: rotate(-45deg); flex: none; margin-right: 4px; }
  .syntax[open] summary::before { transform: rotate(45deg); }
  .syntax summary .dim { color: var(--faint); font-weight: 400; font-size: var(--fs-small); }
  .syntax ul { list-style: none; margin: 0 0 12px; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .syntax li { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  .syntax code {
    background: var(--raised); color: var(--text);
    padding: 3px 8px; border-radius: 8px; font-size: 12.5px; white-space: pre;
  }
  .syntax .note { color: var(--muted); font-size: 13px; }
  .cheatbtn { flex-shrink: 0; }

  .options { display: flex; flex-direction: column; gap: 10px; }
  .option {
    display: flex; align-items: center; gap: 12px; text-align: left; width: 100%; min-height: 56px;
    background: var(--surface); border: 1px solid transparent; color: var(--text);
    padding: 12px 14px; border-radius: var(--radius-row); cursor: pointer; font-size: 15px; line-height: 1.4;
  }
  .option:active { background: var(--raised); }
  .option.sel { border-color: var(--text); background: var(--raised); }
  .optmark {
    flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%;
    display: grid; place-items: center; background: var(--raised); color: var(--muted);
    font-weight: 600; font-size: 13px;
  }
  .option.sel .optmark { background: var(--brand); color: var(--brand-ink); }
  .opttext { flex: 1; }

  .exnav {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 24px; padding: 16px 0; border-top: 1px solid var(--border);
  }
  .exnav-count { color: var(--faint); font-size: var(--fs-body); font-weight: 500; }
  .navbtn:disabled { opacity: 0.35; }

  @media (max-width: 640px) {
    .head { flex-wrap: wrap; gap: 6px 10px; }
    .syntaxbar { flex-direction: column; }
    .syntax { width: 100%; }
    .cheatbtn { width: 100%; }
    .actions { flex-wrap: wrap; gap: 12px; }
  }
</style>
