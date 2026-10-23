<script lang="ts">
	import { DEFAULT_MODELS, loadSettings, saveSettings, type Provider, type TutorSettings } from './settings';
	import { store } from '../dojo/engine/store';
	import { onMount } from 'svelte';
	import Icon from '../ui/Icon.svelte';
	import { LocalLlm, MODEL_CATALOG, fmtBytes, onDeviceAvailable, type LocalModel } from './localllm';
	import { LocalTts, neuralAvailable, forgetLoaded, getCpuInfo, type CpuInfo, type CacheStats } from '../tts/native';
	import { tuneVoice } from '../tts/tune';
	import { VOICES, type CatalogVoice } from '../tts/catalog';
	import { loadTtsPrefs, saveTtsPrefs } from '../tts/prefs';
	import { speedClass, SPEED_LABEL } from '../tts/schedule';
	import { playSample, stopSample } from '../tts/speaker';
	import { SUB_LEVELS, loadSubLevel, saveSubLevel, subAlpha, type SubLevel } from '../explain/subtitle';

	let subLevel = $state<SubLevel>(loadSubLevel());
	const pickSub = (id: SubLevel) => { subLevel = id; saveSubLevel(id); };
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

	// ---- thread tuning + narration cache ----
	let cpu = $state<CpuInfo | null>(null);
	let tune = $state<{ id: string; text: string; pct: number } | null>(null);
	let tuneCancel = false;
	let cache = $state<CacheStats | null>(null);
	const CAPS = [100, 200, 500];
	const plural = (n: number) => `${n}\u00A0thread${n === 1 ? '' : 's'}`; // no line break between the number and the word
	const x2 = (r: number) => r.toFixed(2) + 'x';
	/** Small cache sizes in KB so "38 KB" does not read as "0 MB". */
	const cacheSize = (b: number) => (b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(b < 10485760 ? 1 : 0)} MB`);
	/** "35 MB · Piper · 0.20x real time · 4 threads (tuned)": built as one string so every separator keeps its spaces. */
	const voiceMeta = (v: CatalogVoice, installed: boolean) => {
		const parts = [fmtBytes(v.bytes), v.engine === 'kokoro' ? 'Kokoro' : 'Piper'];
		if (installed) {
			if (tp.speed?.[v.id] != null) parts.push(`${x2(tp.speed[v.id])} real time`);
			if (tp.threads?.[v.id]) parts.push(`${plural(tp.threads[v.id].threads)} (tuned)`);
			else if (cpu) parts.push(`${plural(cpu.defaultThreads)} (default)`);
		}
		return parts.join(' · ');
	};

	async function refreshCache() {
		if (!ttsNative) return;
		try { cache = await LocalTts.cacheStats(); } catch { /* older build */ }
	}
	async function setCap(mb: number) {
		try { cache = await LocalTts.setCacheLimit({ mb }); } catch (e: any) { vMsg = String(e?.message ?? e); }
	}
	async function clearCacheNow() {
		try { await LocalTts.clearCache(); await refreshCache(); vMsg = 'Narration cache cleared. The next listen of each sentence is a little slower.'; } catch (e: any) { vMsg = String(e?.message ?? e); }
	}

	async function tuneNow(v: CatalogVoice) {
		vMsg = '';
		vBusy = v.id;
		tuneCancel = false;
		tune = { id: v.id, text: 'Starting…', pct: 0 };
		try {
			const sid = v.speakers ? (v.speakers.some((x) => x.sid === tp.sid) ? tp.sid : v.speakers[0].sid) : 0;
			const r = await tuneVoice(v.id, sid, (p) => (tune = { id: v.id, ...p }), () => tuneCancel);
			tp = loadTtsPrefs();
			vMsg = r.cancelled ? 'Cancelled. The previous setting is kept.' : `Done: ${plural(r.best!)} is fastest here (${x2(r.bestRtf!)} real time).`;
		} catch (e: any) {
			vMsg = String(e?.message ?? e);
		} finally {
			tune = null;
			vBusy = null;
		}
	}

	onMount(() => {
		refreshVoices();
		if (ttsNative) { getCpuInfo().then((c) => (cpu = c)).catch(() => {}); refreshCache(); }
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

	/** 'smooth' / 'may-pause' / 'slow' for a voice, from its last measured speed on this phone (null = not measured yet). */
	const voiceSpeed = (id: string) => (tp.speed?.[id] != null ? speedClass(tp.speed[id]) : null);
	const speedPill = { smooth: 'pos', 'may-pause': 'warn', slow: 'neg' } as const;

	// One line under the list when the chosen voice is slow on this phone and a faster one is available
	const speedTip = $derived.by(() => {
		if (!ttsNative || tp.voice === 'system') return '';
		const cur = tp.speed?.[tp.voice];
		if (cur == null || cur <= 0.7) return '';
		const name = VOICES.find((v) => v.id === tp.voice)?.label ?? 'This voice';
		const faster = VOICES.filter((v) => v.id !== tp.voice && vHave[v.id]?.installed && tp.speed?.[v.id] != null && tp.speed[v.id] < cur)
			.sort((a, b) => tp.speed![a.id] - tp.speed![b.id])[0];
		const verb = cur > 1 ? 'will pause between sentences' : 'may pause between sentences';
		if (faster) return `${name} ${verb} on this phone. ${faster.label} is faster here (${SPEED_LABEL[speedClass(tp.speed![faster.id])].toLowerCase()}): tap Use this on it.`;
		const unmeasured = VOICES.some((v) => v.id !== tp.voice && vHave[v.id]?.installed && tp.speed?.[v.id] == null);
		return `${name} ${verb} on this phone. ${unmeasured ? 'Play a sample on your other downloaded voice to compare speeds.' : 'A lighter voice (Clear or Warm) reads without pauses; download one from the list.'}`;
	});

	async function sampleVoice(v: CatalogVoice) {
		vBusy = v.id;
		vMsg = 'Loading the voice…';
		try {
			const sid = v.speakers ? tp.sid : 0;
			const r = await playSample(v.id, v.speakers && !v.speakers.some((x) => x.sid === sid) ? v.speakers[0].sid : sid);
			tp = { ...tp, speed: { ...(tp.speed ?? {}), [v.id]: Math.round(r.rtf * 100) / 100 } };
			saveTtsPrefs({ ...tp });
			vMsg = `Spoke ${r.audioSec.toFixed(1)} s of audio in ${r.synthSec.toFixed(1)} s. ${SPEED_LABEL[speedClass(r.rtf)]}.`;
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
							{#if h?.installed}{@const sc = voiceSpeed(v.id)}{#if sc}<span class="pill {speedPill[sc]}"><Icon name={sc === 'smooth' ? 'check' : 'alert'} size={12} />{SPEED_LABEL[sc]}</span>{/if}{/if}
						</div>
						<div class="meta num">{voiceMeta(v, !!h?.installed)}</div>
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
								<button class="btn" disabled={vBusy !== null} onclick={() => tuneNow(v)}>Find fastest setting</button>
								<button class="btn danger" disabled={vBusy !== null} onclick={() => removeVoice(v)}>Delete</button>
							</div>
							{#if tune?.id === v.id}
								<div class="bar" role="progressbar" aria-label="Finding the fastest setting for {v.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow={tune.pct}><div style="width:{tune.pct}%"></div></div>
								<div class="meta num" role="status">{tune.text} · {tune.pct}%</div>
								<div class="row tight"><button class="btn" onclick={() => (tuneCancel = true)}>Cancel</button></div>
							{:else if tp.threads?.[v.id]}
								{@const t = tp.threads[v.id]}
								<div class="hint num">{t.tried.map((x) => `${plural(x.n)}\u00A0${x2(x.rtf)}`).join(' · ')} · using {plural(t.threads)}</div>
							{/if}
						{:else}
							<div class="row tight"><button class="btn primary" disabled={vBusy !== null} onclick={() => downloadVoice(v)}>{h?.partialBytes ? `Resume download (${fmtBytes(h.partialBytes)})` : 'Download'}</button></div>
						{/if}
					</div>
				{/each}
				<div class="model">
					<div class="mhead"><b>Narration cache</b></div>
					<div class="meta num">{cache ? `Using ${cacheSize(cache.bytes)} of ${cacheSize(cache.limitBytes)} · ${cache.files} ${cache.files === 1 ? 'sentence' : 'sentences'}` : 'Reading the cache…'}</div>
					<div class="hint">Sentences you have heard are kept on the phone, so hearing them again is instant, even with the heavier voices. Lessons also prepare their later sentences in the background.</div>
					<div class="chips" role="group" aria-label="Cache size limit">
						{#each CAPS as mb}
							<button class="chip" aria-pressed={cache ? Math.round(cache.limitBytes / 1048576) === mb : false} onclick={() => setCap(mb)}>{mb} MB</button>
						{/each}
					</div>
					<div class="row tight"><button class="btn" disabled={!cache || cache.files === 0} onclick={clearCacheNow}>Clear cache</button></div>
					<div class="hint">Clearing only makes the next listen slower. Nothing else is lost.</div>
				</div>
				{#if vMsg}<p class="status" role="status">{vMsg}</p>{/if}
				<p class="hint">Under 1x keeps up with speech; lower is faster.</p>
				{#if speedTip}<p class="hint tip" role="note"><Icon name="alert" size={14} />{speedTip}</p>{/if}
				<p class="hint">Voices come from the open sherpa-onnx project on GitHub and are stored privately in the app. Use Wi-Fi for the larger ones.</p>
			{/if}
		</div>
	</section>

	<section>
		<div class="lab">
			<h2>Lesson subtitles</h2>
			<p>In the animated lessons the narration shows as a subtitle. Held sideways it sits on top of the picture, which then gets the whole screen. Choose how solid its background is.</p>
			<p class="now">Now: {SUB_LEVELS.find((l) => l.id === subLevel)?.label}</p>
		</div>
		<div class="panel">
			<div class="chips" role="radiogroup" aria-label="Subtitle background">
				{#each SUB_LEVELS as l}
					<button class="chip" role="radio" aria-checked={subLevel === l.id} onclick={() => pickSub(l.id)}>{l.label}</button>
				{/each}
			</div>
			<p class="hint">{SUB_LEVELS.find((l) => l.id === subLevel)?.hint}</p>
			<div class="subprev" aria-hidden="true">
				<div class="sp-a"></div><div class="sp-b"></div><div class="sp-c"></div>
				<span class="sp-cap" class:clear={subAlpha(subLevel) < 0.2} style="--sub-bg: rgba(0, 0, 0, {subAlpha(subLevel)})">Every pass of the loop leaves a trace.</span>
			</div>
		</div>
	</section>

	<section>
		<div class="lab">
			<h2>About</h2>
			<p>Preppy bundles the Backend lab (Python via Pyodide, SQL via real Postgres-in-WASM), computer science, AI, JavaScript, TypeScript, React, Next.js and database lessons with animated explainers, quizzes, playgrounds and drills, all offline. The AI assistant is optional.</p>
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
	.mhead { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; row-gap: 6px; }
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
	.tip { display: flex; gap: 8px; align-items: flex-start; color: var(--muted); }
	.tip :global(svg) { flex: none; margin-top: 2px; color: var(--warning); }
	.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
	.chip { min-height: 44px; padding: 0 14px; border-radius: var(--radius-control); background: transparent; border: 1px solid var(--control); color: var(--text); font-size: var(--fs-body); cursor: pointer; }
		.chip[aria-pressed='true'], .chip[aria-checked='true'] { background: var(--surface); border-color: var(--text); font-weight: 600; }
	/* a tiny picture with the subtitle on it, so the choice can be judged at once */
	.subprev { position: relative; margin-top: 10px; height: 96px; border-radius: var(--radius-row); background: var(--ground); border: 1px solid var(--rule); overflow: hidden; }
	.sp-a, .sp-b, .sp-c { position: absolute; border-radius: 8px; background: var(--raised); }
	.sp-a { left: 12px; top: 12px; width: 96px; height: 34px; }
	.sp-b { left: 124px; top: 12px; width: 70px; height: 34px; background: var(--pill-warning-bg); border: 1.5px solid var(--warning); }
	.sp-c { left: 12px; top: 58px; width: 150px; height: 28px; }
	.sp-cap { position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%); white-space: nowrap; padding: 4px 12px; border-radius: 9px; font-size: 13px; background: var(--sub-bg); color: var(--text); }
	.sp-cap.clear { text-shadow: 0 1px 4px rgba(0, 0, 0, .95), 0 0 2px #000; } /* taste-skill-ignore: same as the player */
</style>
