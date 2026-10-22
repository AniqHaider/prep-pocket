// JS side of the on-device narration voices (Android plugin "LocalTts": sherpa-onnx, Kokoro / Piper).
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface InstalledVoice { id: string; installed: boolean; partialBytes: number }
export interface SynthResult { wav: string; sampleRate: number; audioSec: number; synthSec: number; rms: number }

export interface LocalTtsPlugin {
	listVoices(): Promise<{ voices: InstalledVoice[]; loaded: string | null; freeBytes: number }>;
	download(o: { id: string; url: string }): Promise<{ id: string }>;
	cancelDownload(): Promise<void>;
	deleteVoice(o: { id: string }): Promise<{ deleted: boolean }>;
	load(o: { id: string }): Promise<{ loaded: string; speakers: number }>;
	unload(): Promise<void>;
	synthesize(o: { text: string; sid?: number; speed?: number }): Promise<SynthResult>;
	addListener(event: 'downloadProgress', fn: (e: { id: string; phase: 'download' | 'extract'; received: number; total: number }) => void): Promise<PluginListenerHandle>;
}

export const LocalTts = registerPlugin<LocalTtsPlugin>('LocalTts');

/** True only inside the Android app (the plugin doesn't exist in a normal browser). */
export const neuralAvailable = () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalTts');

let loadedId: string | null = null;
/** Loads a voice into memory once; later calls for the same voice are free. */
export async function ensureLoaded(id: string) {
	if (loadedId === id) return;
	await LocalTts.load({ id });
	loadedId = id;
}
export function forgetLoaded() { loadedId = null; }

export function wavToBuffer(b64: string): ArrayBuffer {
	const bin = atob(b64);
	const u = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
	return u.buffer;
}
