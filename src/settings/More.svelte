<script lang="ts">
	import { DEFAULT_MODELS, loadSettings, saveSettings, type Provider, type TutorSettings } from './settings';
	import { store } from '../dojo/engine/store';
	import { onMount } from 'svelte';
	import { LocalLlm, MODEL_CATALOG, fmtBytes, onDeviceAvailable, type LocalModel } from './localllm';

	let s = $state<TutorSettings>(loadSettings());
	let status = $state('');
	let testing = $state(false);

	const providers: { id: Provider; label: string; note: string }[] = [
		{ id: 'none', label: 'Off', note: 'No tutor. Everything else works offline.' },
		{ id: 'on-device', label: 'On this phone (offline)', note: 'Runs a small open model right on your phone — no internet, no Mac, no account. One-time download of 0.5–2 GB.' },
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
			llmMsg = 'Model loaded ✓ — ask the tutor in the Dojo.';
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
		status = 'Saved ✓';
		setTimeout(() => (status = ''), 1800);
	}

	async function test() {
		save();
		testing = true;
		status = 'Asking the tutor…';
		try {
			const { chatStream } = await import('../dojo/engine/chat');
			const out = await chatStream('Reply with the single word: ready', 'explain', null);
			status = 'Tutor says: ' + out.slice(0, 120);
		} catch (e: any) {
			status = '❌ ' + (e?.message ?? e);
		} finally {
			testing = false;
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
		if (confirm('Erase all Backend Dojo progress (XP, streak, solved exercises) on this device?')) {
			store.reset();
			status = 'Dojo progress erased.';
		}
	}
</script>

<div class="more">
	<h1>⚙️ More</h1>

	<section>
		<h2>🧑‍🏫 Dojo tutor</h2>
		<p class="muted">The Dojo chat needs an LLM. Pick one — your key is stored only on this phone and sent only to that provider.</p>
		{#each providers as p}
			<label class="opt" class:on={s.provider === p.id}>
				<input type="radio" name="prov" value={p.id} bind:group={s.provider} onchange={() => (s.model = '')} />
				<span><b>{p.label}</b><small>{p.note}</small></span>
			</label>
		{/each}

		{#if s.provider === 'on-device'}
			{#if !native}
				<p class="muted small">On-device models run inside the Android app. This browser build can't load them.</p>
			{:else}
				<p class="muted small">Models are open-weights GGUF files from Hugging Face, stored privately in the app. {freeBytes ? fmtBytes(freeBytes) + ' free.' : ''} Bigger = smarter but slower.</p>
				{#each MODEL_CATALOG as m}
					{@const h = have[m.file]}
					{@const p = progress[m.file]}
					<div class="model" class:sel={s.model === m.file}>
						<div class="mhead"><b>{m.label}</b><span class="muted small">{fmtBytes(m.bytes)}</span></div>
						<div class="muted small">{m.note}</div>
						{#if p}
							<div class="bar"><div style="width:{Math.round((p.received / p.total) * 100)}%"></div></div>
							<div class="muted small">{fmtBytes(p.received)} / {fmtBytes(p.total)}</div>
							<button class="ghost" onclick={() => LocalLlm.cancelDownload()}>Pause</button>
						{:else if h?.complete}
							<div class="row tight">
								<button class="primary" disabled={busy !== null} onclick={() => useModel(m.file)}>{s.model === m.file ? '✓ In use' : 'Use this'}</button>
								<button class="ghost" disabled={busy !== null || loadedFile === m.file} onclick={() => warmUp(m.file)}>{loadedFile === m.file ? 'Loaded' : 'Load now'}</button>
								<button class="ghost danger" onclick={() => removeModel(m.file)}>Delete</button>
							</div>
						{:else}
							<button class="primary" disabled={busy !== null} onclick={() => download(m)}>{h ? `Resume download (${fmtBytes(h.bytes)})` : 'Download'}</button>
						{/if}
					</div>
				{/each}
				{#if llmMsg}<p class="status">{llmMsg}</p>{/if}
				<p class="muted small">Tip: keep the app open while it answers. The first question after a restart loads the model (10–30 s).</p>
			{/if}
		{/if}

		{#if s.provider !== 'none' && s.provider !== 'on-device'}
			{#if s.provider === 'openai-compatible'}
				<label class="f">Server URL<input bind:value={s.baseUrl} placeholder="http://192.168.1.20:11434/v1" autocapitalize="off" autocomplete="off" /></label>
			{/if}
			<label class="f">Model<input bind:value={s.model} placeholder={DEFAULT_MODELS[s.provider]} autocapitalize="off" autocomplete="off" /></label>
			<label class="f">API key{s.provider === 'openai-compatible' ? ' (optional)' : ''}<input type="password" bind:value={s.apiKey} autocapitalize="off" autocomplete="off" /></label>
			{#if s.provider === 'openai-compatible'}
				<p class="muted small">Ollama on the Mac: run <code>OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=* ollama serve</code>, then use <code>http://&lt;mac-ip&gt;:11434/v1</code>.</p>
			{/if}
		{/if}
		<div class="row">
			<button class="primary" onclick={save}>Save</button>
			{#if s.provider !== 'none'}<button class="ghost" onclick={test} disabled={testing}>Test</button>{/if}
		</div>
		{#if status}<p class="status">{status}</p>{/if}
	</section>

	<section>
		<h2>📦 Your data</h2>
		<p class="muted">Progress lives on this device. Quiz/drill/theory progress is stored separately per tab.</p>
		<div class="row">
			<button class="ghost" onclick={exportProgress}>Export Dojo progress</button>
			<button class="ghost danger" onclick={resetProgress}>Reset Dojo progress</button>
		</div>
	</section>

	<section>
		<h2>ℹ️ About</h2>
		<p class="muted">Kata bundles Backend Dojo (Python via Pyodide, SQL via real Postgres-in-WASM), the Svelte/TypeScript quiz + theory, and the JS/TS drills — all offline.</p>
	</section>
</div>

<style>
	.more { max-width: 640px; margin: 0 auto; padding: 16px 14px 24px; color: #e8eef6; }
	h1 { font-size: 21px; margin: 6px 0 14px; } h2 { font-size: 16px; margin: 0 0 6px; }
	section { background: #11161f; border: 1px solid #1f2735; border-radius: 14px; padding: 14px; margin-bottom: 14px; }
	.muted { color: #8aa0bd; font-size: 13.5px; line-height: 1.5; } .small { font-size: 12.5px; }
	.opt { display: flex; gap: 10px; align-items: flex-start; padding: 10px; border: 1px solid #232d3e; border-radius: 10px; margin-top: 8px; }
	.opt.on { border-color: #2f6df6; background: #14213a; }
	.opt small { display: block; color: #8aa0bd; margin-top: 2px; font-size: 12.5px; }
	.f { display: flex; flex-direction: column; gap: 4px; margin-top: 12px; font-size: 13px; color: #aebfd6; }
	.f input { background: #0f141d; border: 1px solid #232d3e; border-radius: 9px; color: #e8eef6; padding: 10px; }
	.row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
	.row.tight { margin-top: 8px; }
	.model { border: 1px solid #232d3e; border-radius: 12px; padding: 12px; margin-top: 10px; display: flex; flex-direction: column; gap: 6px; background: #0f141d; }
	.model.sel { border-color: #2f6df6; }
	.mhead { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
	.bar { height: 6px; border-radius: 4px; background: #1f2735; overflow: hidden; }
	.bar > div { height: 100%; background: #2f6df6; transition: width .3s; }
	.primary { background: #2f6df6; color: #fff; border: 0; border-radius: 10px; padding: 11px 20px; font-weight: 700; }
	.ghost { background: #161d29; border: 1px solid #2a3344; border-radius: 10px; padding: 11px 16px; color: #c4d0e0; }
	.ghost.danger { color: #ff9d9d; border-color: #5a2a2a; }
	.status { margin: 10px 0 0; color: #9cc4ff; font-size: 13px; word-break: break-word; }
	code { background: #161d29; padding: 1px 5px; border-radius: 4px; color: #8fd0ff; font-size: 12px; }
</style>
