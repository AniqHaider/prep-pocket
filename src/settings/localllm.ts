// JS side of the on-device LLM (Android plugin "LocalLlm", llama.cpp CPU inference).
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface LocalModel { file: string; bytes: number; complete: boolean }

export interface LocalLlmPlugin {
	listModels(): Promise<{ models: LocalModel[]; loaded: string | null; freeBytes: number }>;
	download(o: { url: string; file: string }): Promise<{ file: string; bytes: number }>;
	cancelDownload(): Promise<void>;
	deleteModel(o: { file: string }): Promise<{ deleted: boolean }>;
	load(o: { file: string }): Promise<{ loaded: string; system?: string }>;
	unload(): Promise<void>;
	stop(): Promise<void>;
	generate(o: { system: string; user: string; maxTokens?: number; temperature?: number }): Promise<{ text: string; tokens: number; tokensPerSec: number }>;
	addListener(event: 'token', fn: (e: { text: string }) => void): Promise<PluginListenerHandle>;
	addListener(event: 'downloadProgress', fn: (e: { file: string; received: number; total: number }) => void): Promise<PluginListenerHandle>;
}

export const LocalLlm = registerPlugin<LocalLlmPlugin>('LocalLlm');

/** True only inside the Android app (the plugin doesn't exist in a normal browser). */
export const onDeviceAvailable = () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalLlm');

export interface CatalogModel {
	id: string;
	label: string;
	file: string;
	url: string;
	bytes: number;
	note: string;
	/** rough RAM needed while loaded */
	ram: string;
	/** Released in 2026: newer training data than the 2024 Qwen2.5 / Llama 3.2 models. */
	recent?: boolean;
}

// Open-weights GGUF models. Q4_K_M (4-bit) unless the label says 8-bit. Bigger = smarter but slower and more RAM.
// A model only knows what was in its training data (the Qwen2.5 and Llama 3.2 models predate MCP, for example), so the
// assistant also feeds it Preppy's own notes and, if enabled, web results (src/assistant).
export const MODEL_CATALOG: CatalogModel[] = [
	{
		id: 'qwen35-4b',
		label: 'Qwen3.5 4B',
		file: 'Qwen3.5-4B-Q4_K_M.gguf',
		url: 'https://huggingface.co/unsloth/Qwen3.5-4B-GGUF/resolve/main/Qwen3.5-4B-Q4_K_M.gguf',
		bytes: 2740937888,
		ram: '~3.5 GB',
		recent: true,
		note: 'The everyday pick (March 2026). Much newer than the Qwen2.5 models and fast enough on a 12 GB phone. Thinking is switched off so answers start straight away.'
	},
	{
		id: 'qwen35-9b',
		label: 'Qwen3.5 9B',
		file: 'Qwen3.5-9B-Q4_K_M.gguf',
		url: 'https://huggingface.co/unsloth/Qwen3.5-9B-GGUF/resolve/main/Qwen3.5-9B-Q4_K_M.gguf',
		bytes: 5680522464,
		ram: '~7 GB',
		recent: true,
		note: 'Best quality that fits a 12 GB phone. Slower (a few words per second) and a long first load. Close other apps first.'
	},
	{
		id: 'gemma4-e4b',
		label: 'Gemma 4 E4B',
		file: 'gemma-4-E4B-it-Q4_K_M.gguf',
		url: 'https://huggingface.co/unsloth/gemma-4-E4B-it-GGUF/resolve/main/gemma-4-E4B-it-Q4_K_M.gguf',
		bytes: 4977171584,
		ram: '~6 GB',
		recent: true,
		note: 'Google Gemma 4 (April 2026), training data to January 2025. A strong alternative to Qwen3.5 4B with a different writing style.'
	},
	{
		id: 'qwen35-4b-q8',
		label: 'Qwen3.5 4B (8-bit)',
		file: 'Qwen3.5-4B-Q8_0.gguf',
		url: 'https://huggingface.co/unsloth/Qwen3.5-4B-GGUF/resolve/main/Qwen3.5-4B-Q8_0.gguf',
		bytes: 4482403488,
		ram: '~5.5 GB',
		recent: true,
		note: 'The same model at 8-bit: almost no quantization loss, but about 1.6x the size and slower. It is more precise, not smarter; try it if 4-bit answers feel off.'
	},
	{
		id: 'qwen35-2b',
		label: 'Qwen3.5 2B',
		file: 'Qwen3.5-2B-Q4_K_M.gguf',
		url: 'https://huggingface.co/unsloth/Qwen3.5-2B-GGUF/resolve/main/Qwen3.5-2B-Q4_K_M.gguf',
		bytes: 1280835840,
		ram: '~2 GB',
		recent: true,
		note: 'Fast and light; fine for quiz hints and short explanations.'
	},
	{
		id: 'qwen25-coder-7b',
		label: 'Qwen2.5-Coder 7B Instruct',
		file: 'Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf',
		url: 'https://huggingface.co/bartowski/Qwen2.5-Coder-7B-Instruct-GGUF/resolve/main/Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf',
		bytes: 4683074336,
		ram: '~6 GB',
		note: 'Older (2024), tuned for code. Does not know tools released after mid-2024, such as MCP, unless Preppy’s notes or web lookup supply them.'
	},
	{
		id: 'qwen25-7b',
		label: 'Qwen2.5 7B Instruct',
		file: 'Qwen2.5-7B-Instruct-Q4_K_M.gguf',
		url: 'https://huggingface.co/bartowski/Qwen2.5-7B-Instruct-GGUF/resolve/main/Qwen2.5-7B-Instruct-Q4_K_M.gguf',
		bytes: 4683074240,
		ram: '~6 GB',
		note: 'Older (2024). Good explanations, slow replies, and no knowledge of anything newer than mid-2024.'
	},
	{
		id: 'qwen25-3b',
		label: 'Qwen2.5 3B Instruct',
		file: 'qwen2.5-3b-instruct-q4_k_m.gguf',
		url: 'https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf',
		bytes: 2104932768,
		ram: '~3 GB',
		note: 'Older (2024) speed/quality balance.'
	},
	{
		id: 'qwen25-15b',
		label: 'Qwen2.5 1.5B Instruct',
		file: 'qwen2.5-1.5b-instruct-q4_k_m.gguf',
		url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
		bytes: 1117320736,
		ram: '~2 GB',
		note: 'Older (2024). Faster; handles beginner questions and quiz hints.'
	},
	{
		id: 'llama32-3b',
		label: 'Llama 3.2 3B Instruct',
		file: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
		url: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
		bytes: 2019377696,
		ram: '~3 GB',
		note: 'Older (2024) with a conversational style.'
	},
	{
		id: 'qwen25-05b',
		label: 'Qwen2.5 0.5B Instruct',
		file: 'qwen2.5-0.5b-instruct-q4_k_m.gguf',
		url: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf',
		bytes: 491400032,
		ram: '~1 GB',
		note: 'Tiny and fastest: good for trying it out, weak at explanations.'
	}
];

export const DEFAULT_ON_DEVICE_MODEL = MODEL_CATALOG[0].file;
export const fmtBytes = (n: number) => (n >= 1e9 ? (n / 1e9).toFixed(2) + ' GB' : (n / 1e6).toFixed(0) + ' MB');
