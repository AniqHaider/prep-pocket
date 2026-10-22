<script>
  import { onMount, onDestroy } from "svelte";
  import { EditorView, basicSetup } from "codemirror";
  import { EditorState } from "@codemirror/state";
  import { keymap } from "@codemirror/view";
  import { indentWithTab } from "@codemirror/commands";
  import { python } from "@codemirror/lang-python";
  import { sql } from "@codemirror/lang-sql";
  import { javascript } from "@codemirror/lang-javascript";
  import { oneDark } from "@codemirror/theme-one-dark";

  let { code = "", language = "python", onChange } = $props();

  let host;
  let editor;

  onMount(() => {
    const langExt = language === "sql" ? sql() : language === "ts" ? javascript({ typescript: true }) : python();
    editor = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: code,
        extensions: [
          keymap.of([indentWithTab]),
          basicSetup,
          langExt,
          oneDark,
          EditorView.updateListener.of((v) => {
            if (v.docChanged && onChange) onChange(editor.state.doc.toString());
          }),
          // matches the app's true-black surfaces (keeps oneDark's syntax colours only)
          EditorView.theme({
            "&": { fontSize: "13.5px", backgroundColor: "var(--surface)", color: "var(--text)" },
            ".cm-content": { fontFamily: "var(--mono)", caretColor: "#fff" },
            ".cm-gutters": { backgroundColor: "var(--surface)", color: "var(--faint)", border: "none" },
            ".cm-activeLine": { backgroundColor: "#ffffff0d" },
            ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--muted)" },
            "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": { backgroundColor: "#ffffff29" },
            "&.cm-focused": { outline: "2px solid var(--text)", outlineOffset: "2px" },
          }, { dark: true }),
        ],
      }),
    });
  });

  onDestroy(() => editor && editor.destroy());
</script>

<div class="editor" bind:this={host}></div>

<style>
  .editor :global(.cm-editor) {
    border-radius: var(--radius-row);
    overflow: hidden;
    max-height: 420px;
  }
  .editor :global(.cm-scroller) { overflow: auto; }
</style>
