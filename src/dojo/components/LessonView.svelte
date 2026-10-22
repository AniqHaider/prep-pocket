<script>
  import { marked } from "marked";
  import { api } from "../lib/api.js";
  import { view, goExercise, goDashboard } from "../lib/stores.js";
  import ExerciseCallout from "./ExerciseCallout.svelte";
  import { onDestroy } from "svelte";
  import Icon from "../../ui/Icon.svelte";
  import { createSpeaker } from "../../tts/speaker";

  let chapter = $state(null);
  let error = $state(null);
  let articleEl = $state(null);

  // Narration engine: the system voice, or a downloaded neural voice chosen in Settings → Narration voice.
  const speaker = createSpeaker();
  const ttsSupported = speaker.supported;
  let preparing = $state(false);
  let notice = $state("");
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
    speaker.stop();
    preparing = false;
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

  function speakFrom(startWordIdx) {
    if (!ttsSupported || words.length === 0) return;
    if (startWordIdx >= words.length) { stopReading(); return; }
    wordIdx = startWordIdx;
    notice = "";
    speaker.speakFrom(words, startWordIdx, rate, {
      onWord: (i) => { highlightWord(i); wordIdx = i + 1; },
      onEnd: () => { playing = false; paused = false; preparing = false; clearHighlight(); activeWidx = -1; },
      onError: () => { playing = false; paused = false; preparing = false; },
      onPreparing: (on) => { preparing = on; },
      onNotice: (m) => { notice = m; }
    });
    playing = true;
    paused = false;
  }

  function togglePlay() {
    if (!ttsSupported) return;
    if (!playing) speakFrom(0);
    else if (paused) { speaker.resume(); paused = false; }
    else { speaker.pause(); paused = true; }
  }

  function stopReading() {
    speaker.stop();
    preparing = false;
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
    <Icon name="back" size={18} />
    Dashboard
  </button>

  {#if error}
    <p class="err">Couldn't load chapter: {error}</p>
  {:else if !chapter}
    <p class="loading">Loading…</p>
  {:else}
    <span class="sr-only">{chapter.title}</span>
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
        <h2 class="exh">{hasInline ? "All exercises" : "Exercises"}</h2>
        {#if hasInline}
          <p class="exhint">Cards appear in the reading as you reach each one, or jump from here.</p>
        {/if}
        {#each chapter.exercises as ex, i}
          <button class="exitem" class:solved={ex.solved}
                  onclick={() => goExercise(chapter.id, ex.id)}>
            <span class="idx num">{#if ex.solved}<span class="ok" role="img" aria-label="Solved"><Icon name="check" size={16} /></span>{:else}{i + 1}{/if}</span>
            <span class="extitle">{ex.title}</span>
            <span class="xp">{ex.xp} XP</span>
          </button>
        {/each}
      </aside>
    </div>
    {#if ttsSupported}
      <div class="tts-float">
        {#if preparing}<span class="tts-note" role="status">Preparing voice…</span>{:else if notice}<span class="tts-note" role="status">{notice}</span>{/if}
        {#if playing}
          <button class="tts-fab tts-fab-speed num" onclick={cycleRate} title="Reading speed" aria-label="Reading speed {rate}x">{rate}x</button>
          <button class="tts-fab" onclick={stopReading} title="Stop" aria-label="Stop reading"><Icon name="stop" size={18} /></button>
        {/if}
        <button class="tts-fab tts-fab-primary" onclick={togglePlay} title={playing && !paused ? "Pause" : "Read aloud"} aria-label={playing && !paused ? "Pause reading" : "Read aloud"}>
          <Icon name={playing && !paused ? "pause" : "play"} size={22} />
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .lesson { max-width: 1100px; }
  .back { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; background: none; border: none; color: var(--muted); cursor: pointer; font-size: var(--fs-body); margin: -8px 0 4px -6px; padding: 0 12px 0 6px; border-radius: var(--radius-control); }
  .back:active { color: var(--text); background: var(--surface); }
  .layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; }
  .tts-float {
    /* Floats left of the Ask button; both are fixed to the bottom edge. */
    position: fixed; bottom: 16px; right: 156px; z-index: 39;
    display: flex; align-items: center; gap: 10px;
  }
  .tts-note { max-width: 190px; padding: 6px 12px; border-radius: var(--radius-control); background: var(--raised); color: var(--text); font-size: var(--fs-small); line-height: 1.3; }
  .tts-fab {
    width: 44px; height: 44px; border-radius: 50%; cursor: pointer;
    background: var(--raised); color: var(--text); border: 0; font-size: var(--fs-small); font-weight: 600;
    display: flex; align-items: center; justify-content: center;
  }
  .tts-fab:active:not(:disabled) { background: var(--control); }
  .tts-fab:disabled { opacity: 0.45; cursor: default; }
  .tts-fab-primary { width: 48px; height: 48px; background: var(--raised); color: var(--text); border: 1px solid var(--control); }
  .layout > * { min-width: 0; }
  .theory { color: var(--muted); line-height: 1.7; font-size: 15px; overflow-wrap: anywhere; }
  .theory :global(h1) { color: var(--text); font-size: var(--fs-title); font-weight: 600; margin: 6px 0 10px; }
  .theory :global(table) { display: block; overflow-x: auto; }
  .theory :global(img) { max-width: 100%; }
  .theory :global(.tts-word.active) { background: var(--text); color: #000; border-radius: 3px; }
  .theory :global(h2) { color: var(--text); font-size: var(--fs-section); font-weight: 600; margin: 28px 0 8px; padding-bottom: 8px; border-bottom: 1px solid var(--rule); }
  .theory :global(h3) { color: var(--text); font-size: 15px; font-weight: 600; margin: 20px 0 6px; }
  .theory :global(code) { background: var(--raised); padding: 1px 6px; border-radius: 5px; font-size: 13px; color: var(--text); }
  .theory :global(pre) { background: var(--surface); padding: 14px; border-radius: var(--radius-row); overflow-x: auto; }
  .theory :global(pre code) { background: none; padding: 0; color: var(--text); }
  .theory :global(strong) { color: var(--text); font-weight: 600; }
  .theory :global(blockquote) { margin: 12px 0; padding: 8px 16px; color: var(--muted); background: var(--surface); border-radius: var(--radius-row); }
  .theory :global(th) { text-align: left; color: var(--muted); font-weight: 500; font-size: var(--fs-small); padding: 6px 12px 6px 0; }
  .theory :global(td) { padding: 6px 12px 6px 0; border-top: 1px solid var(--rule); }
  .exlist { background: var(--surface); border-radius: var(--radius-card); padding: 16px; position: sticky; top: calc(80px + var(--bar-top, 0px)); }
  .exh { color: var(--text); font-size: var(--fs-section); font-weight: 600; margin: 0 0 10px; }
  .exhint { color: var(--muted); font-size: var(--fs-small); line-height: 1.45; margin: 0 0 12px; }
  .exitem {
    width: 100%; display: flex; align-items: center; gap: 10px; text-align: left; min-height: 44px;
    background: var(--raised); border: 0; border-radius: var(--radius-row);
    padding: 8px 12px; margin-bottom: 8px; cursor: pointer; color: var(--text); font-size: var(--fs-body);
  }
  .exitem:active { background: var(--control); }
  .idx { width: 22px; text-align: center; color: var(--faint); font-weight: 500; flex: none; }
  .ok { color: var(--accent); display: inline-flex; justify-content: center; }
  .extitle { flex: 1; }
  .xp { color: var(--faint); font-size: var(--fs-small); flex: none; }
  .loading, .err { color: var(--muted); }
  .err { color: var(--negative); }

  @media (max-width: 800px) {
    .layout { grid-template-columns: minmax(0, 1fr); gap: 16px; }
    .exlist { position: static; }
    .tts-float { bottom: calc(var(--nav-h) + var(--safe-b) + 14px); right: 156px; }
    .theory { font-size: 15.5px; }
  }
</style>
