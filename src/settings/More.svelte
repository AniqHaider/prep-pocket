<script lang="ts">
	import { DEFAULT_MODELS, loadSettings, saveSettings, type Provider, type TutorSettings } from './settings';
	import { store } from '../dojo/engine/store';

	let s = $state<TutorSettings>(loadSettings());
	let status = $state('');
	let testing = $state(false);

	const providers: { id: Provider; label: string; note: string }[] = [
		{ id: 'none', label: 'Off', note: 'No tutor. Everything else works offline.' },
		{ id: 'gemini', label: 'Google Gemini', note: 'Free API key from aistudio.google.com. Needs internet.' },
		{ id: 'anthropic', label: 'Claude (Anthropic)', note: 'API key from console.anthropic.com. Needs internet.' },
		{ id: 'openai-compatible', label: 'Local / other (OpenAI-compatible)', note: 'Ollama, LM Studio, llama.cpp server… running on your Mac (same Wi-Fi) or anywhere reachable.' }
	];

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

		{#if s.provider !== 'none'}
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
		<p class="muted">Prep Pocket bundles Backend Dojo (Python via Pyodide, SQL via real Postgres-in-WASM), the Svelte/TypeScript quiz + theory, and the JS/TS drills — all offline.</p>
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
	.primary { background: #2f6df6; color: #fff; border: 0; border-radius: 10px; padding: 11px 20px; font-weight: 700; }
	.ghost { background: #161d29; border: 1px solid #2a3344; border-radius: 10px; padding: 11px 16px; color: #c4d0e0; }
	.ghost.danger { color: #ff9d9d; border-color: #5a2a2a; }
	.status { margin: 10px 0 0; color: #9cc4ff; font-size: 13px; word-break: break-word; }
	code { background: #161d29; padding: 1px 5px; border-radius: 4px; color: #8fd0ff; font-size: 12px; }
</style>
