// Local replacement for Backend Dojo's HTTP API. Same function names and response shapes, so the
// copied UI components work unchanged — but everything runs on-device (no server).
import { listChapters, getChapter, getExercisePublic } from "../engine/content";
import { COMPONENTS } from "../engine/diagram";
import { processRun } from "../engine/grading";
import { store } from "../engine/store";
import { chatStream } from "../engine/chat";

const references = import.meta.glob("../reference/*.md", { eager: true, query: "?raw", import: "default" });

export const api = {
  getChapters: async () => {
    const solved = store.solvedIds();
    return listChapters().map((ch) => ({ ...ch, solved_count: ch.exercise_ids.filter((i) => solved.has(i)).length }));
  },
  getChapter: async (id) => {
    const ch = getChapter(id);
    const solved = store.solvedIds();
    ch.exercises = ch.exercises.map((ex) => ({ ...ex, solved: solved.has(ex.id) }));
    return ch;
  },
  getExercise: async (id) => {
    const ex = getExercisePublic(id);
    const prog = store.getExercise(id);
    return { ...ex, solved: prog.status === "solved", best_code: prog.best_code };
  },
  runExercise: (id, code) => processRun(id, code),
  getProgress: async () => {
    const solved = store.solvedIds();
    return { ...store.getStats(), solved_ids: [...solved].sort(), solved_count: solved.size };
  },
  getDiagram: async () => ({ components: COMPONENTS, unlocked: store.unlockedComponents() }),
  getReference: async (name) => {
    const md = references[`../reference/${name}.md`];
    if (md == null) throw new Error("reference not found");
    return { name, markdown: md };
  },
  // `model` is ignored: the provider/model comes from Tutor settings.
  chatStream: (question, mode, currentExerciseId, _model, onChunk) => chatStream(question, mode, currentExerciseId, onChunk),
};
