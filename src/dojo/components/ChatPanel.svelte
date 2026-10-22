<script>
  import { tick } from "svelte";
  import { marked } from "marked";
  import { api } from "../lib/api.js";
  import { view } from "../lib/stores.js";
  import Icon from "../../ui/Icon.svelte";

  const THREADS_KEY = "dojo-chat-threads-v1";
  const SIZE_KEY = "dojo-chat-size-v1";
  const GENERAL = "__general__";

  function loadThreads() {
    try { return JSON.parse(localStorage.getItem(THREADS_KEY)) || {}; }
    catch { return {}; }
  }
  function loadSize() {
    try {
      const s = JSON.parse(localStorage.getItem(SIZE_KEY));
      if (s && s.w && s.h) return s;
    } catch {}
    return { w: 390, h: 520 };
  }

  let open = $state(false);
  let mode = $state("tutor");
  let input = $state("");
  let busy = $state(false);
  let threads = $state(loadThreads()); // { threadId: [{role,text}] }
  let size = $state(loadSize());
  let msgsEl = $state();
  // Follow the stream only while the reader is at the bottom; scrolling up pauses it.
  let stick = true;
  const onMsgsScroll = () => { stick = msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 80; };

  // Which thread are we in? An exercise's id, or the shared general thread.
  let threadId = $derived($view.name === "exercise" ? $view.exerciseId : GENERAL);
  let currentExerciseId = $derived($view.name === "exercise" ? $view.exerciseId : null);
  let messages = $derived(threads[threadId] || []);

  function persist() {
    try { localStorage.setItem(THREADS_KEY, JSON.stringify(threads)); } catch {}
  }

  function pushMessage(id, msg) {
    threads = { ...threads, [id]: [...(threads[id] || []), msg] };
    persist();
  }

  // Replace the text of the most recent tutor message (the streaming placeholder).
  function updateLastTutor(id, text) {
    const arr = [...(threads[id] || [])];
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i].role === "tutor") { arr[i] = { ...arr[i], text }; break; }
    }
    threads = { ...threads, [id]: arr };
    persist();
    scrollToBottom();
  }

  async function scrollToBottom(force = false) {
    if (force) stick = true;
    await tick();
    if (msgsEl && stick) msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  // auto-scroll when the visible thread changes or grows
  // jump to the end when a message is added, the thread changes or the panel opens — never while a reply streams in
  let msgCount = $derived(messages.length);
  $effect(() => { msgCount; threadId; open; scrollToBottom(true); });

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    const id = threadId;
    pushMessage(id, { role: "you", text: q });
    pushMessage(id, { role: "tutor", text: "" }); // streaming placeholder
    input = ""; busy = true;
    try {
      await api.chatStream(q, mode, currentExerciseId, null, (full) => {
        updateLastTutor(id, full);
      });
    } catch (e) {
      updateLastTutor(id, "(error: " + e.message + ")");
    } finally { busy = false; }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function clearThread() {
    threads = { ...threads, [threadId]: [] };
    persist();
  }

  // ---- resize (drag the top-left grip) ----
  function startResize(e) {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const startW = size.w, startH = size.h;
    const move = (ev) => {
      const w = Math.min(900, Math.max(330, startW + (startX - ev.clientX)));
      const h = Math.min(window.innerHeight * 0.9, Math.max(320, startH + (startY - ev.clientY)));
      size = { w, h };
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      try { localStorage.setItem(SIZE_KEY, JSON.stringify(size)); } catch {}
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const render = (t) => marked.parse(t || "");
  let threadLabel = $derived(threadId === GENERAL ? "General" : "This exercise");
</script>

<button class="btn primary fab" onclick={() => (open = !open)} aria-expanded={open} aria-controls="dojo-chat">
  {#if open}<Icon name="close" size={16} />Close{:else}<Icon name="sparkle" size={16} />Ask tutor{/if}
</button>

{#if open}
  <div class="chat" id="dojo-chat" role="dialog" aria-label="Backend tutor" style="width:{size.w}px; height:{size.h}px">
    <div class="grip" onpointerdown={startResize} title="Drag to resize" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M13 1 L1 13 M13 6 L6 13 M13 11 L11 13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
    </div>

    <div class="chead">
      <span class="ttl">Backend tutor <span class="scope">{threadLabel}</span></span>
      <div class="right">
        <div class="toggle" role="group" aria-label="Reply style">
          <button class:active={mode === "tutor"} aria-pressed={mode === "tutor"} onclick={() => (mode = "tutor")}>Tutor</button>
          <button class:active={mode === "explain"} aria-pressed={mode === "explain"} onclick={() => (mode = "explain")}>Explain</button>
        </div>
        {#if messages.length}
          <button class="clear" aria-label="Clear this thread" title="Clear this thread" onclick={clearThread}><Icon name="trash" size={18} /></button>
        {/if}
      </div>
    </div>

    <div class="msgs" bind:this={msgsEl} onscroll={onMsgsScroll} role="region" aria-label="Conversation">
      {#if messages.length === 0}
        <p class="empty">
          {#if threadId === GENERAL}
            Ask anything about backend or this app. Open an exercise to get help tied to it.
          {:else}
            Questions here are about <b>this exercise</b> and remember your past mistakes.
          {/if}
          <br /><b>Tutor</b> nudges with hints; <b>Explain</b> answers directly.
        </p>
      {/if}
      {#each messages as m}
        <div class="msg {m.role}">
          {#if m.role === "tutor"}
            {#if m.text}
              <div class="bubble md">{@html render(m.text)}</div>
            {:else}
              <div class="bubble thinking" aria-hidden="true"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
            {/if}
          {:else}
            <div class="bubble">{m.text}</div>
          {/if}
        </div>
      {/each}
    </div>
    <div class="sr" role="status">{busy ? "Tutor is replying" : ""}</div>

    <div class="composer">
      <textarea bind:value={input} onkeydown={onKey} rows="2" aria-label="Message the tutor"
                placeholder={currentExerciseId ? "Ask about this exercise…" : "Ask a question…"}></textarea>
      <button class="btn primary send" onclick={send} disabled={busy} aria-label="Send"><Icon name="send" size={18} /></button>
    </div>
  </div>
{/if}

<style>
  .fab { position: fixed; bottom: 22px; right: 22px; z-index: 40; }
  .chat {
    position: fixed; bottom: 78px; right: 22px; z-index: 40;
    display: flex; flex-direction: column;
    background: var(--surface); border-radius: var(--radius-card); overflow: hidden;
    box-shadow: 0 12px 40px rgba(0,0,0,0.7); /* taste-skill-ignore: floats, so it may carry a shadow */
  }
  .grip {
    position: absolute; top: 0; left: 0; width: 22px; height: 22px;
    display: grid; place-items: center; cursor: nwse-resize; z-index: 2; color: var(--faint);
  }
  .chead { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 10px 10px 26px; border-bottom: 1px solid var(--rule); color: var(--text); font-weight: 600; font-size: var(--fs-body); }
  .ttl .scope { color: var(--faint); font-weight: 400; font-size: var(--fs-small); margin-left: 6px; }
  .right { display: flex; align-items: center; gap: 4px; }
  .toggle { display: flex; background: var(--raised); border-radius: var(--radius-control); padding: 2px; }
  .toggle button { background: none; border: none; color: var(--muted); min-height: 36px; padding: 0 14px; border-radius: var(--radius-control); cursor: pointer; font-size: var(--fs-small); font-weight: 500; }
  .toggle button.active { background: var(--text); color: #000; }
  .clear { width: 44px; height: 44px; display: grid; place-items: center; background: none; border: none; border-radius: 50%; cursor: pointer; color: var(--muted); }
  .clear:active { background: var(--raised); color: var(--text); }
  .msgs { flex: 1; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 14px; }
  .empty { color: var(--muted); font-size: var(--fs-body); line-height: 1.6; }
  .msg { display: flex; }
  .msg.you { justify-content: flex-end; }
  .bubble { max-width: 88%; font-size: 14px; line-height: 1.55; }
  .msg.you .bubble { background: var(--raised); color: var(--text); padding: 9px 14px; border-radius: var(--radius-row); border-bottom-right-radius: 4px; white-space: pre-wrap; }
  .msg.tutor .bubble { max-width: 100%; color: var(--text); padding: 0; }
  .thinking { display: flex; gap: 4px; align-items: center; min-height: 22px; }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--faint); animation: blink 1.3s infinite both; }
  .dot:nth-child(2) { animation-delay: 0.18s; }
  .dot:nth-child(3) { animation-delay: 0.36s; }
  @keyframes blink { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .composer { display: flex; align-items: flex-end; gap: 8px; padding: 10px; border-top: 1px solid var(--rule); }
  .composer textarea { flex: 1; resize: none; background: var(--raised); border: 0; border-radius: var(--radius-field); color: var(--text); padding: 10px 12px; font-size: 16px; line-height: 1.4; }
  .composer textarea::placeholder { color: var(--faint); }
  .send { width: 44px; padding: 0; flex: none; }

  /* markdown rendering inside tutor replies */
  .md :global(h1), .md :global(h2), .md :global(h3), .md :global(h4) { color: var(--text); font-weight: 600; margin: 12px 0 5px; font-size: 14px; line-height: 1.3; }
  .md :global(h1) { font-size: 16px; }
  .md :global(p) { margin: 6px 0; }
  .md :global(ul), .md :global(ol) { margin: 6px 0; padding-left: 20px; }
  .md :global(li) { margin: 3px 0; }
  .md :global(code) { background: var(--raised); padding: 1px 6px; border-radius: 6px; font-size: 12.5px; color: var(--text); }
  .md :global(pre) { background: var(--raised); padding: 12px; border-radius: var(--radius-field); overflow-x: auto; margin: 8px 0; }
  .md :global(pre code) { background: none; padding: 0; }
  .md :global(strong) { color: var(--text); font-weight: 600; }
  .md :global(a) { color: var(--text); text-decoration: underline; }
  .md :global(blockquote) { border-left: 2px solid var(--control); margin: 8px 0; padding: 2px 12px; color: var(--muted); }
  .md :global(:first-child) { margin-top: 0; }
  .md :global(:last-child) { margin-bottom: 0; }

  @media (max-width: 640px) {
    .fab { bottom: calc(var(--nav-h) + var(--safe-b) + 14px); right: 14px; }
    .chat {
      left: 8px; right: 8px; width: auto !important;
      bottom: calc(var(--nav-h) + var(--safe-b) + 66px);
      height: min(70dvh, 560px) !important;
    }
    .grip { display: none; }
    .chead { padding-left: 16px; }
  }
</style>
