<script lang="ts">
	import { DEFAULT_MODELS, loadSettings, saveSettings, type Provider, type TutorSettings } from './settings';
	import { store } from '../dojo/engine/store';
	import { onMount } from 'svelte';
	import Icon from '../ui/Icon.svelte';
	import { LocalLlm, MODEL_CATALOG, fmtBytes, onDeviceAvailable, type LocalModel } from './localllm';
	import { LocalTts, neuralAvailable, forgetLoaded } from '../tts/native';
	import { VOICES, type CatalogVoice } from '../tts/catalog';
	import { loadTtsPrefs, saveTtsPrefs } from '../tts/prefs';
	import { playSample, stopSample } from '../tts/speaker';

	let s = $state<TutorSettings>(loadSettings());
	let status = $state('');
	let testing = $state(false);

	const providers: { id: Provider; label: string; note: string }[] = [
		{ id: 'none', label: 'Off', note: 'No AI. Everything else works offline.' },
		{ id: 'on-device', label: 'On this phone (offline)', note: 'Runs a small open model right on your phone — no internet, no Mac, no account. One-time download of 0.5–4.7 GB (7B models need a 12 GB phone).' },
		{ id: 'gemini', label: 'Google Gemini', note: 'Free API key from aistudio.google.com. Needs internet.' },
		{ id: 'anthropic', label: 'Claude (Anthropic)', note: 'API key from console.anthropic.com. Needs internet.' },
		{ id: 'openai-compatible', label: 'Local / other (OpenAI-compatible)', note: 'Ollama, LM Studio, llama.cpp server… running on your Mac (same Wi-Fi) or anywhere reachable.' }
	];

	// ---- on-device models ----
	const native = onDeviceAvailable();
	let have = $state<Record<string, LocalModel>>({});
	let loadedFile = $state<string | null>(null);
	let freeBytes = $state(0);
	let progress = $state<Record<string, { received: number; total: number }>>({});
	let busy = $state<string | null>(null);
	let llmMsg = $state('');

	async function refreshModels() {
		if (!native) return;
		const r = await LocalLlm.listModels();
		have = Object.fromEntries(r.models.map((m) => [m.file, m]));
		loadedFile = r.loaded;
		freeBytes = r.freeBytes;
	}

	onMount(() => {
		refreshModels();
		let off: (() => void) | undefined;
		if (native) LocalLlm.addListener('downloadProgress', (e) => (progress[e.file] = { received: e.received, total: e.total })).then((h) => (off = () => h.remove()));
		return () => off?.();
	});

	async function download(m: { file: string; url: string; bytes: number }) {
		llmMsg = '';
		if (freeBytes && m.bytes > freeBytes) return (llmMsg = `Not enough free storage (${fmtBytes(freeBytes)} free).`);
		busy = m.file;
		progress[m.file] = { received: have[m.file]?.bytes ?? 0, total: m.bytes };
		try {
			await LocalLlm.download({ url: m.url, file: m.file });
			s.provider = 'on-device';
			s.model = m.file;
			save();
		} catch (e: any) {
			llmMsg = String(e?.message ?? e);
		} finally {
			busy = null;
			delete progress[m.file];
			await refreshModels();
		}
	}

	async function useModel(file: string) {
		s.provider = 'on-device';
		s.model = file;
		save();
	}

	async function warmUp(file: string) {
		busy = file;
		llmMsg = 'Loading model into memory…';
		try {
			await LocalLlm.load({ file });
			llmMsg = 'Model loaded. Ask in the Backend lab, or tap Ask in any other section.';
		} catch (e: any) {
			llmMsg = String(e?.message ?? e);
		} finally {
			busy = null;
			await refreshModels();
		}
	}

	async function removeModel(file: string) {
		if (!confirm('Delete this model from the phone?')) return;
		await LocalLlm.deleteModel({ file });
		if (s.model === file) s.model = '';
		await refreshModels();
	}

	function save() {
		saveSettings({ ...s });
		status = 'Saved';
		setTimeout(() => (status = ''), 1800);
	}

	async function test() {
		save();
		testing = true;
		status = 'Asking the model…';
		try {
			const { chatStream } = await import('../dojo/engine/chat');
			const out = await chatStream('Reply with the single word: ready', 'explain', null);
			status = 'Model says: ' + out.slice(0, 120);
		} catch (e: any) {
			status = 'Failed: ' + (e?.message ?? e);
		} finally {
			testing = false;
		}
	}

	// ---- narration voices ----
	const ttsNative = neuralAvailable();
	let tp = $state(loadTtsPrefs());
	let vHave = $state<Record<string, { installed: boolean; partialBytes: number }>>({});
	let vProg = $state<Record<string, { phase: string; received: number; total: number }>>({});
	let vBusy = $state<string | null>(null);
	let vMsg = $state('');

	async function refreshVoices() {
		if (!ttsNative) return;
		const r = await LocalTts.listVoices();
		vHave = Object.fromEntries(r.voices.map((v) => [v.id, v]));
	}

	onMount(() => {
		refreshVoices();
		let off: (() => void) | undefined;
		if (ttsNative) LocalTts.addListener('downloadProgress', (e) => (vProg[e.id] = { phase: e.phase, received: e.received, total: e.total })).then((h) => (off = () => h.remove()));
		return () => { off?.(); stopSample(); };
	});

	function pickVoice(id: string) {
		tp.voice = id;
		saveTtsPrefs({ ...tp });
		vMsg = id === 'system' ? 'Narration will use the system voice.' : 'Narration will use this voice. Open any lesson and tap play.';
	}

	function pickSpeaker(sid: number) {
		tp.sid = sid;
		saveTtsPrefs({ ...tp });
	}

	async function downloadVoice(v: CatalogVoice) {
		vMsg = '';
		vBusy = v.id;
		vProg[v.id] = { phase: 'download', received: vHave[v.id]?.partialBytes ?? 0, total: v.bytes };
		try {
			await LocalTts.download({ id: v.id, url: v.url });
			pickVoice(v.id);
		} catch (e: any) {
			vMsg = String(e?.message ?? e);
		} finally {
			vBusy = null;
			delete vProg[v.id];
			await refreshVoices();
		}
	}

	async function removeVoice(v: CatalogVoice) {
		if (!confirm(`Delete the "${v.label}" voice from the phone?`)) return;
		await LocalTts.deleteVoice({ id: v.id });
		forgetLoaded();
		if (tp.voice === v.id) pickVoice('system');
		await refreshVoices();
	}

	async function sampleVoice(v: CatalogVoice) {
		vBusy = v.id;
		vMsg = 'Loading the voice…';
		try {
			const sid = v.speakers ? tp.sid : 0;
			const r = await playSample(v.id, v.speakers && !v.speakers.some((x) => x.sid === sid) ? v.speakers[0].sid : sid);
			vMsg = `Spoke ${r.audioSec.toFixed(1)} s of audio in ${r.synthSec.toFixed(1)} s${r.rtf > 0.9 ? '. This phone may pause between sentences with this voice.' : '.'}`;
		} catch (e: any) {
			vMsg = String(e?.message ?? e);
		} finally {
			vBusy = null;
		}
	}

	function exportProgress() {
		const blob = new Blob([store.exportJson()], { type: 'application/json' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = 'prep-pocket-progress.json';
		a.click();
	}

	function resetProgress() {
		if (confirm('Erase all Backend lab progress (XP, streak, solved exercises) on this device?')) {
			store.reset();
			status = 'Backend lab progress erased.';
		}
	}
</script>

<div class="more">
	<h1 class="sr-only">Settings</h1>

	<section>
		<div class="lab">
			<h2>AI models</h2>
			<p>One model powers both the Backend lab tutor (Ask, inside the lab) and the app-wide Assistant (Ask, every other section). Your key stays on this phone and is sent only to that provider.</p>
			<p class="now num">Now: {providers.find((x) => x.id === s.provider)?.label}{s.provider === 'on-device' && s.model ? ' · ' + (MODEL_CATALOG.find((m) => m.file === s.model)?.label ?? s.model) : s.model ? ' · ' + s.model : ''}</p>
		</div>
		<div class="panel">
			<div role="radiogroup" aria-label="AI provider">
				{#each providers as p}
					<label class="opt" class:on={s.provider === p.id}>
						<input type="radio" name="prov" value={p.id} bind:group={s.provider} onchange={() => (s.model = '')} />
						<span><b>{p.label}</b><small>{p.note}</small></span>
					</label>
				{/each}
			</div>

			{#if s.provider === 'on-device'}
				{#if !native}
					<p class="hint">On-device models run inside the Android app. This browser build can't load them.</p>
				{:else}
					<p class="hint">Open-weights GGUF files from Hugging Face, stored privately in the app.{freeBytes ? ' ' + fmtBytes(freeBytes) + ' free.' : ''} Bigger is smarter but slower; the 7B models need a 12 GB phone and a few minutes to download, so use Wi-Fi.</p>
					{#each MODEL_CATALOG as m}
						{@const h = have[m.file]}
						{@const p = progress[m.file]}
						<div class="model" class:sel={s.model === m.file}>
							<div class="mhead">
								<b>{m.label}</b>
								{#if s.model === m.file}<span class="pill pos"><Icon name="check" size={12} />In use</span>{:else if h?.complete}<span class="pill">Downloaded</span>{/if}
							</div>
							<div class="meta num">{fmtBytes(m.bytes)} · RAM {m.ram}</div>
							<div class="hint">{m.note}</div>
							{#if p}
								{@const pct = Math.round((p.received / p.total) * 100)}
								<div class="bar" role="progressbar" aria-label="Download {m.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct}><div style="width:{pct}%"></div></div>
								<div class="meta num">{pct}% · {fmtBytes(p.received)} of {fmtBytes(p.total)}</div>
								<div class="row tight"><button class="btn" onclick={() => LocalLlm.cancelDownload()}>Pause</button></div>
							{:else if h?.complete}
								<div class="row tight">
									<button class="btn primary" disabled={busy !== null || s.model === m.file} onclick={() => useModel(m.file)}>{s.model === m.file ? 'In use' : 'Use this'}</button>
									<button class="btn" disabled={busy !== null || loadedFile === m.file} onclick={() => warmUp(m.file)}>{loadedFile === m.file ? 'Loaded' : 'Load now'}</button>
									<button class="btn danger" onclick={() => removeModel(m.file)}>Delete</button>
								</div>
							{:else}
								<div class="row tight"><button class="btn primary" disabled={busy !== null} onclick={() => download(m)}>{h ? `Resume download (${fmtBytes(h.bytes)})` : 'Download'}</button></div>
							{/if}
						</div>
					{/each}
					{#if llmMsg}<p class="status" role="status">{llmMsg}</p>{/if}
					<p class="hint">Keep the app open while it answers. The first question after a restart loads the model (10–30 s).</p>
				{/if}
			{/if}

			{#if s.provider !== 'none' && s.provider !== 'on-device'}
				{#if s.provider === 'openai-compatible'}
					<label class="f">Server URL<input bind:value={s.baseUrl} placeholder="http://192.168.1.20:11434/v1" autocapitalize="off" autocomplete="off" /></label>
				{/if}
				<label class="f">Model<input bind:value={s.model} placeholder={DEFAULT_MODELS[s.provider]} autocapitalize="off" autocomplete="off" /></label>
				<label class="f">API key{s.provider === 'openai-compatible' ? ' (optional)' : ''}<input type="password" bind:value={s.apiKey} autocapitalize="off" autocomplete="off" /></label>
				{#if s.provider === 'openai-compatible'}
					<p class="hint">Ollama on the Mac: run <code>OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=* ollama serve</code>, then use <code>http://&lt;mac-ip&gt;:11434/v1</code>.</p>
				{/if}
			{/if}
			<div class="row">
				<button class="btn primary" onclick={save}>Save</button>
				{#if s.provider !== 'none'}<button class="btn" onclick={test} disabled={testing}>Test</button>{/if}
			</div>
			{#if status}<p class="status" role="status">{status}</p>{/if}
		</div>
	</section>

	<section>
		<div class="lab">
			<h2>Narration voice</h2>
			<p>The voice that reads lessons aloud. Downloaded voices are neural, so they sound far more natural than the system voice, and they work offline once installed.</p>
			<p class="now">Now: {tp.voice === 'system' || !ttsNative ? 'System voice' : (VOICES.find((v) => v.id === tp.voice)?.label ?? 'System voice')}</p>
		</div>
		<div class="panel">
			<div class="model" class:sel={tp.voice === 'system'}>
				<div class="mhead">
					<b>System voice</b>
					{#if tp.voice === 'system'}<span class="pill pos"><Icon name="check" size={12} />In use</span>{/if}
				</div>
				<div class="hint">The phone's built-in text-to-speech. Always available, no download.</div>
				{#if tp.voice !== 'system'}<div class="row tight"><button class="btn primary" onclick={() => pickVoice('system')}>Use this</button></div>{/if}
			</div>
			{#if !ttsNative}
				<p class="hint">Downloadable natural voices work inside the Android app. This browser build uses the system voice.</p>
			{:else}
				{#each VOICES as v}
					{@const h = vHave[v.id]}
					{@const p = vProg[v.id]}
					<div class="model" class:sel={tp.voice === v.id}>
						<div class="mhead">
							<b>{v.label}</b>
							{#if tp.voice === v.id}<span class="pill pos"><Icon name="check" size={12} />In use</span>{:else if h?.installed}<span class="pill">Downloaded</span>{/if}
						</div>
						<div class="meta num">{fmtBytes(v.bytes)} · {v.engine === 'kokoro' ? 'Kokoro' : 'Piper'}</div>
						<div class="hint">{v.note}</div>
						{#if p}
							{@const pct = p.total > 0 ? Math.round((p.received / p.total) * 100) : 0}
							<div class="bar" role="progressbar" aria-label="{p.phase === 'extract' ? 'Unpacking' : 'Downloading'} {v.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct}><div style="width:{pct}%"></div></div>
							<div class="meta num">{p.phase === 'extract' ? 'Unpacking' : 'Downloading'} {pct}%{p.phase === 'download' ? ` · ${fmtBytes(p.received)} of ${fmtBytes(p.total)}` : ''}</div>
							{#if p.phase === 'download'}<div class="row tight"><button class="btn" onclick={() => LocalTts.cancelDownload()}>Pause</button></div>{/if}
						{:else if h?.installed}
							{#if v.speakers && tp.voice === v.id}
								<div class="chips" role="group" aria-label="Speaker">
									{#each v.speakers as sp}
										<button class="chip" aria-pressed={tp.sid === sp.sid} onclick={() => pickSpeaker(sp.sid)}>{sp.label}</button>
									{/each}
								</div>
							{/if}
							<div class="row tight">
								<button class="btn primary" disabled={vBusy !== null || tp.voice === v.id} onclick={() => pickVoice(v.id)}>{tp.voice === v.id ? 'In use' : 'Use this'}</button>
								<button class="btn" disabled={vBusy !== null} onclick={() => sampleVoice(v)}>Play sample</button>
								<button class="btn danger" disabled={vBusy !== null} onclick={() => removeVoice(v)}>Delete</button>
							</div>
						{:else}
							<div class="row tight"><button class="btn primary" disabled={vBusy !== null} onclick={() => downloadVoice(v)}>{h?.partialBytes ? `Resume download (${fmtBytes(h.partialBytes)})` : 'Download'}</button></div>
						{/if}
					</div>
				{/each}
				{#if vMsg}<p class="status" role="status">{vMsg}</p>{/if}
				<p class="hint">Voices come from the open sherpa-onnx project on GitHub and are stored privately in the app. Use Wi-Fi for the larger ones.</p>
			{/if}
		</div>
	</section>

	<section>
		<div class="lab">
			<h2>About</h2>
			<p>Preppy bundles the Backend lab (Python via Pyodide, SQL via real Postgres-in-WASM), the Svelte/TypeScript and React/Next/TypeScript quizzes, theory and the JS/TS drills, all offline. The AI assistant is optional.</p>
		</div>
	</section>

	<section>
		<div class="lab">
			<h2>Your data</h2>
			<p>Progress lives on this device. Quiz, drill and theory progress is stored separately per section.</p>
		</div>
		<div class="panel">
			<div class="row first"><button class="btn" onclick={exportProgress}>Export Backend lab progress</button></div>
			<p class="hint">Resetting erases all Backend lab XP, streak and solved exercises on this device. It cannot be undone.</p>
			<div class="row first" style="margin-top:14px"><button class="btn danger" onclick={resetProgress}>Reset Backend lab progress</button></div>
		</div>
	</section>
</div>

<style>
	.more { max-width: 640px; margin: 0 auto; padding: 8px 16px 32px; }
	h1 { font-size: var(--fs-title); font-weight: 600; margin: 8px 0 4px; letter-spacing: -.01em; }
	section { padding: 24px 0; border-top: 1px solid var(--rule); }
	section:first-of-type { border-top: 0; }
	h2 { font-size: var(--fs-section); font-weight: 600; margin: 0 0 4px; }
	.lab p { margin: 0 0 12px; color: var(--muted); font-size: var(--fs-body); line-height: 1.5; }
	.lab .now { color: var(--text); font-size: var(--fs-small); font-weight: 500; margin: 0 0 12px; }
	.panel { background: var(--surface); border-radius: var(--radius-card); padding: 16px; }
	.opt { display: flex; gap: 12px; align-items: flex-start; min-height: 44px; padding: 10px 12px; border-radius: var(--radius-row); }
	.opt + .opt { margin-top: 2px; }
	.opt.on { background: var(--raised); }
	.opt input { width: 20px; height: 20px; margin: 2px 0 0; accent-color: #fff; flex: none; }
	.opt b { font-weight: 500; }
	.opt small { display: block; color: var(--muted); margin-top: 2px; font-size: var(--fs-small); line-height: 1.45; }
	.f { display: flex; flex-direction: column; gap: 8px; margin-top: 18px; font-size: var(--fs-body); font-weight: 500; }
	.f input { background: var(--surface); border: 1px solid var(--control); border-radius: var(--radius-field); color: var(--text); padding: 0 12px; min-height: 44px; font-weight: 400; }
	.f input::placeholder { color: var(--faint); }
	.row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
	.row.tight { margin-top: 4px; }
	.row.first { margin-top: 0; }
	.model { background: var(--raised); border-radius: var(--radius-row); padding: 14px; margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
	.mhead { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
	.mhead b { font-weight: 600; }
	.meta { color: var(--muted); font-size: var(--fs-small); }
	.hint { color: var(--muted); font-size: var(--fs-small); line-height: 1.5; margin: 12px 0 0; }
	.model .hint { margin: 0; }
	.bar { height: 4px; border-radius: 2px; background: var(--control); overflow: hidden; margin-top: 4px; }
	.bar > div { height: 100%; background: var(--accent); transition: width .3s; }
	.btn.danger { color: var(--negative); border-color: var(--negative); }
	.status { margin: 14px 0 0; color: var(--text); font-size: var(--fs-body); word-break: break-word; }
	code { background: var(--raised); padding: 1px 6px; border-radius: 6px; font-size: var(--fs-small); color: var(--text); }
	.mhead .pill { gap: 4px; }
	.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
	.chip { min-height: 44px; padding: 0 14px; border-radius: var(--radius-control); background: transparent; border: 1px solid var(--control); color: var(--text); font-size: var(--fs-body); cursor: pointer; }
	.chip[aria-pressed='true'] { background: var(--surface); border-color: var(--text); font-weight: 600; }
</style>
