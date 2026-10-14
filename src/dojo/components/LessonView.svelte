<script>
  import { marked } from "marked";
  import { api } from "../lib/api.js";
  import { view, goExercise, goDashboard } from "../lib/stores.js";
  import ExerciseCallout from "./ExerciseCallout.svelte";
  import { onDestroy } from "svelte";

  let chapter = $state(null);
  let error = $state(null);
  let articleEl = $state(null);

  const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  let playing = $state(false);
  let paused = $state(false);
  let rate = $state(1);
  let activeWidx = $state(-1);
  let wordIdx = 0;

  async function load(id) {
    // Reset TTS playback state directly, without touching articleEl — that's
    // a $state read, and doing it inside this $effect-triggered function
    // would make the effect depend on articleEl, which nulls out whenever
    // the article unmounts (e.g. while chapter is null below), causing an
    // infinite reload loop.
    if (ttsSupported) speechSynthesis.cancel();
    playing = false;
    paused = false;
    wordIdx = 0;
    activeWidx = -1;
    chapter = null; error = null;
    try { chapter = await api.getChapter(id); }
    catch (e) { error = e.message; }
  }

  $effect(() => { if ($view.name === "lesson") load($view.chapterId); });

  // Wraps every word of a rendered HTML segment in a <span data-widx="N">
  // so playback can highlight the word currently being read. Words inside
  // <pre> (code blocks) are left unwrapped and unspoken.
  function wrapWords(html, startIdx, words) {
    const container = document.createElement("div");
    container.innerHTML = html;
    let idx = startIdx;

    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (!text || !text.trim()) return;
        const frag = document.createDocumentFragment();
        for (const part of text.split(/(\s+)/)) {
          if (part === "") continue;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            const span = document.createElement("span");
            span.className = "tts-word";
            span.dataset.widx = String(idx);
            span.textContent = part;
            frag.appendChild(span);
            words.push(part);
            idx++;
          }
        }
        node.replaceWith(frag);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === "PRE") return;
        Array.from(node.childNodes).forEach(walk);
      }
    }

    Array.from(container.childNodes).forEach(walk);
    return { html: container.innerHTML, nextIdx: idx };
  }

  // Interleave theory with inline "Ready to try" cards. Theory authored with
  // [[exercise:ID]] markers gets split into prose + callout segments. Chapters
  // without markers collapse to a single prose segment (unchanged behaviour).
  // Prose segments also get every word wrapped for the read-aloud highlight.
  function buildSegments(md, exercises) {
    const byId = new Map((exercises || []).map((e) => [e.id, e]));
    const re = /\[\[exercise:([A-Za-z0-9_-]+)\]\]/g;
    const segs = [];
    const words = [];
    let last = 0, m, widx = 0;
    while ((m = re.exec(md))) {
      const chunk = md.slice(last, m.index);
      if (chunk.trim()) {
        const wrapped = wrapWords(marked.parse(chunk), widx, words);
        segs.push({ type: "md", html: wrapped.html });
        widx = wrapped.nextIdx;
      }
      const ex = byId.get(m[1]);
      if (ex) segs.push({ type: "ex", ex });
      last = re.lastIndex;
    }
    const tail = md.slice(last);
    if (tail.trim()) {
      const wrapped = wrapWords(marked.parse(tail), widx, words);
      segs.push({ type: "md", html: wrapped.html });
    }
    return { segs, words };
  }

  let built = $derived(buildSegments(chapter?.theory_md || "", chapter?.exercises));
  let segments = $derived(built.segs);
  let words = $derived(built.words);
  let hasInline = $derived(segments.some((s) => s.type === "ex"));

  function clearHighlight() {
    articleEl?.querySelector(".tts-word.active")?.classList.remove("active");
  }

  function isInViewport(el) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return r.top >= 80 && r.bottom <= vh - 80;
  }

  function highlightWord(idx) {
    clearHighlight();
    const el = articleEl?.querySelector(`[data-widx="${idx}"]`);
    if (el) {
      el.classList.add("active");
      // Only scroll when the word has actually left the visible area —
      // scrolling on every single boundary event (several times a second on
      // short/filler words) restarts the smooth-scroll animation each time
      // and makes the highlight look like it's stuttering out of sync.
      if (!isInViewport(el)) el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    activeWidx = idx;
  }

  // Bumped on every stop/restart so a stale utterance's onend/onerror —
  // which the browser can fire asynchronously after speechSynthesis.cancel()
  // — can't clobber state set by whatever utterance replaced it (this was
  // the cause of the Stop button going disabled right after changing speed).
  let speechToken = 0;

  function speakFrom(startWordIdx) {
    if (!ttsSupported || words.length === 0) return;
    speechSynthesis.cancel();
    const slice = words.slice(startWordIdx);
    if (slice.length === 0) { stopReading(); return; }
    wordIdx = startWordIdx;
    const token = ++speechToken;
    const utterance = new SpeechSynthesisUtterance(slice.join(" "));
    utterance.rate = rate;
    utterance.onboundary = (e) => {
      if (token !== speechToken || e.name !== "word") return;
      highlightWord(wordIdx);
      wordIdx++;
    };
    utterance.onend = () => {
      if (token !== speechToken) return;
      playing = false;
      paused = false;
      clearHighlight();
      activeWidx = -1;
    };
    utterance.onerror = () => {
      if (token !== speechToken) return;
      playing = false;
      paused = false;
    };
    speechSynthesis.speak(utterance);
    playing = true;
    paused = false;
  }

  function togglePlay() {
    if (!ttsSupported) return;
    if (!playing) speakFrom(0);
    else if (paused) { speechSynthesis.resume(); paused = false; }
    else { speechSynthesis.pause(); paused = true; }
  }

  function stopReading() {
    speechToken++;
    if (ttsSupported) speechSynthesis.cancel();
    playing = false;
    paused = false;
    wordIdx = 0;
    clearHighlight();
    activeWidx = -1;
  }

  const RATES = [0.75, 1, 1.25, 1.5];

  function setRate(newRate) {
    rate = newRate;
    if (playing) speakFrom(Math.max(0, activeWidx));
  }

  function cycleRate() {
    setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length]);
  }

  onDestroy(stopReading);
</script>

<div class="lesson">
  <button class="back" onclick={goDashboard}>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3.5 5.5 8l4.5 4.5" stroke="currentColor" stroke-width="1.6"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Dashboard
  </button>

  {#if error}
    <p class="err">Couldn't load chapter: {error}</p>
  {:else if !chapter}
    <p class="loading">Loading…</p>
  {:else}
    <h1>{chapter.title}</h1>
    <div class="layout">
      <article class="theory" bind:this={articleEl}>
        {#each segments as seg}
          {#if seg.type === "md"}
            {@html seg.html}
          {:else}
            <ExerciseCallout ex={seg.ex} chapterId={chapter.id} />
          {/if}
        {/each}
      </article>
      <aside class="exlist">
        <h3>{hasInline ? "All exercises" : "Exercises"}</h3>
        {#if hasInline}
          <p class="exhint">Cards appear in the reading as you reach each one — or jump from here.</p>
        {/if}
        {#each chapter.exercises as ex, i}
          <button class="exitem" class:solved={ex.solved}
                  onclick={() => goExercise(chapter.id, ex.id)}>
            <span class="num">{ex.solved ? "✅" : i + 1}</span>
            <span class="extitle">{ex.title}</span>
            <span class="xp">{ex.xp} XP</span>
          </button>
        {/each}
      </aside>
    </div>
    {#if ttsSupported}
      <div class="tts-float">
        {#if playing}
          <button class="tts-fab tts-fab-speed" onclick={cycleRate} title="Reading speed">{rate}x</button>
          <button class="tts-fab" onclick={stopReading} title="Stop">⏹</button>
        {/if}
        <button class="tts-fab tts-fab-primary" onclick={togglePlay} title={playing && !paused ? "Pause" : "Read aloud"}>
          {#if playing && !paused}⏸{:else}▶{/if}
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .lesson { max-width: 1100px; }
  .back { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; color: #6ea8ff; cursor: pointer; font-size: 14px; margin-bottom: 10px; padding: 4px 6px 4px 0; }
  .back:hover { color: #9cc4ff; }
  .back svg { display: block; }
  h1 { color: #eef4fb; font-size: 24px; margin: 4px 0 18px; }
  .layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; }
  .tts-float {
    /* The Ask button is 42.5px tall vs. this container's 54px (set by the
       primary fab); both share this vertical center only at bottom: 16px,
       not 22px — sharing the Ask button's bottom offset looks off-center
       because the two buttons aren't the same height. */
    position: fixed; bottom: 16px; right: 130px; z-index: 39;
    display: flex; align-items: center; gap: 10px;
  }
  .tts-fab {
    width: 44px; height: 44px; border-radius: 50%; border: none; cursor: pointer;
    background: #181f2c; color: #eef4fb; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 6px 20px rgba(0,0,0,0.4); border: 1px solid #2a3444;
  }
  .tts-fab:hover:not(:disabled) { border-color: #2f6df6; }
  .tts-fab:disabled { opacity: 0.45; cursor: default; }
  .tts-fab-speed { font-size: 12px; font-weight: 700; width: 40px; height: 40px; }
  .tts-fab-primary {
    width: 54px; height: 54px; font-size: 20px;
    background: linear-gradient(135deg, #2f6df6, #7a3af0); border: none;
    box-shadow: 0 6px 24px rgba(47,109,246,0.4);
  }
  .layout > * { min-width: 0; }
  .theory { color: #c8d4e4; line-height: 1.7; font-size: 15px; overflow-wrap: anywhere; }
  .theory :global(h1) { color: #eef4fb; font-size: 22px; margin: 6px 0 10px; }
  .theory :global(table) { display: block; overflow-x: auto; }
  .theory :global(img) { max-width: 100%; }
  .theory :global(.tts-word.active) { background: #2f6df6; color: #fff; border-radius: 3px; }
  .theory :global(h2) { color: #eef4fb; font-size: 19px; margin: 22px 0 8px; border-bottom: 1px solid #1f2735; padding-bottom: 6px; }
  .theory :global(h3) { color: #dce6f4; font-size: 16px; margin: 18px 0 6px; }
  .theory :global(code) { background: #161d29; padding: 1px 6px; border-radius: 5px; font-size: 13px; color: #8fd0ff; }
  .theory :global(pre) { background: #0e131c; border: 1px solid #1f2735; padding: 14px; border-radius: 10px; overflow-x: auto; }
  .theory :global(pre code) { background: none; color: #d6e2f2; }
  .theory :global(strong) { color: #eef4fb; }
  .theory :global(blockquote) { border-left: 3px solid #2f6df6; margin: 12px 0; padding: 4px 14px; color: #aebfd6; background: #11161f; border-radius: 0 8px 8px 0; }
  .exlist { background: #11161f; border: 1px solid #1f2735; border-radius: 14px; padding: 14px; position: sticky; top: calc(80px + var(--bar-top, 0px)); }
  .exlist h3 { color: #aebfd6; font-size: 14px; margin: 0 0 10px; }
  .exhint { color: #6b7d96; font-size: 11.5px; line-height: 1.45; margin: 0 0 12px; }
  .exitem {
    width: 100%; display: flex; align-items: center; gap: 10px; text-align: left;
    background: #0f141d; border: 1px solid #1f2735; border-radius: 9px;
    padding: 9px 11px; margin-bottom: 7px; cursor: pointer; color: #c4d0e0; font-size: 13px;
  }
  .exitem:hover { border-color: #2f6df6; }
  .exitem.solved { border-color: #1c7a55; }
  .num { width: 22px; text-align: center; color: #6b7d96; font-weight: 700; }
  .extitle { flex: 1; }
  .xp { color: #6b7d96; font-size: 11px; }
  .loading, .err { color: #8aa0bd; }

  @media (max-width: 800px) {
    .layout { grid-template-columns: minmax(0, 1fr); gap: 16px; }
    .exlist { position: static; }
    h1 { font-size: 20px; margin-bottom: 12px; }
    .tts-float { bottom: calc(var(--nav-h) + var(--safe-b) + 14px); right: 112px; }
    .theory { font-size: 15.5px; }
  }
</style>
