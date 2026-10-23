package com.aniqhaider.preppocket;

import com.k2fsa.sherpa.onnx.GeneratedAudio;
import com.k2fsa.sherpa.onnx.OfflineTts;
import com.k2fsa.sherpa.onnx.OfflineTtsConfig;
import com.k2fsa.sherpa.onnx.OfflineTtsKokoroModelConfig;
import com.k2fsa.sherpa.onnx.OfflineTtsModelConfig;
import com.k2fsa.sherpa.onnx.OfflineTtsVitsModelConfig;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

/**
 * Wraps one sherpa-onnx OfflineTts instance (Kokoro or Piper/VITS, detected from the extracted file layout).
 * Synthesis is blocking; the plugin calls it from a single worker thread.
 */
class TtsEngine {
    static class Result {
        byte[] wav; int sampleRate; double audioSec; double synthSec; double rms;
    }

    private OfflineTts tts;
    // volatile and read without the engine lock: a synthesis in progress holds the lock for seconds, and the plugin must be able to
    // check which voice is loaded without waiting for it
    private volatile String loadedId;
    private volatile int loadedThreads;
    private volatile int numSpeakers;

    String loadedId() { return loadedId; }
    int loadedThreads() { return loadedThreads; }
    int numSpeakers() { return numSpeakers; }

    synchronized void unload() {
        if (tts != null) { tts.release(); tts = null; }
        loadedId = null;
        loadedThreads = 0;
        numSpeakers = 0;
    }

    /**
     * CPU topology from sysfs: max frequency of each core (kHz), or null when it cannot be read (newer Android may hide it).
     * "Performance" cores are those within 75% of the fastest; phones mix fast and efficiency cores, and a thread landing on an
     * efficiency core can hold up the whole synthesis.
     */
    static long[] coreMaxFreqs() {
        int n = Runtime.getRuntime().availableProcessors();
        long[] f = new long[n];
        for (int i = 0; i < n; i++) {
            f[i] = readLong("/sys/devices/system/cpu/cpu" + i + "/cpufreq/cpuinfo_max_freq");
            if (f[i] <= 0) f[i] = readLong("/sys/devices/system/cpu/cpu" + i + "/cpufreq/scaling_max_freq");
            if (f[i] < 100_000) return null; // under 100 MHz is not a real reading (some devices and emulators report 0 or garbage)
        }
        return f;
    }

    private static long readLong(String path) {
        try (java.io.BufferedReader r = new java.io.BufferedReader(new java.io.FileReader(path))) {
            String l = r.readLine();
            return l == null ? -1 : Long.parseLong(l.trim());
        } catch (Exception e) {
            return -1;
        }
    }

    static int performanceCores() {
        long[] f = coreMaxFreqs();
        int n = Runtime.getRuntime().availableProcessors();
        if (f == null) return n;
        long max = 0;
        for (long x : f) max = Math.max(max, x);
        int perf = 0;
        for (long x : f) if (x >= 0.75 * max) perf++;
        return Math.max(1, perf);
    }

    /** Threads used when a voice has never been tuned: the performance cores, at most 4, at least 2. */
    static int defaultThreads() { return Math.max(2, Math.min(4, performanceCores())); }

    private static File find(File dir, String suffix, String... mustNotContain) {
        File[] fs = dir.listFiles();
        if (fs == null) return null;
        java.util.Arrays.sort(fs);
        outer:
        for (File f : fs) {
            if (!f.isFile() || f.getName().startsWith(".") || !f.getName().endsWith(suffix)) continue; // skip hidden / AppleDouble (._x) files
            for (String bad : mustNotContain) if (f.getName().contains(bad)) continue outer;
            return f;
        }
        return null;
    }

    /** Loads the voice in `dir`. Returns null on success or a human-readable error. */
    synchronized String load(File dir, String id, int threads) {
        threads = Math.max(1, Math.min(8, threads));
        if (id.equals(loadedId) && threads == loadedThreads && tts != null) return null;
        unload();
        try {
            File tokens = new File(dir, "tokens.txt");
            File espeak = new File(dir, "espeak-ng-data");
            File voices = new File(dir, "voices.bin");
            OfflineTtsModelConfig.Builder mb = OfflineTtsModelConfig.builder().setNumThreads(threads).setDebug(false).setProvider("cpu");
            if (voices.exists()) { // Kokoro
                File model = find(dir, ".onnx");
                File lex = new File(dir, "lexicon-us-en.txt");
                if (model == null || !tokens.exists()) return "This voice is incomplete. Delete it and download again.";
                OfflineTtsKokoroModelConfig.Builder kb = OfflineTtsKokoroModelConfig.builder()
                        .setModel(model.getAbsolutePath()).setVoices(voices.getAbsolutePath()).setTokens(tokens.getAbsolutePath())
                        .setDataDir(espeak.getAbsolutePath()).setLang("en-us");
                if (lex.exists()) kb.setLexicon(lex.getAbsolutePath());
                mb.setKokoro(kb.build());
            } else { // Piper (VITS)
                File model = find(dir, ".onnx");
                if (model == null || !tokens.exists()) return "This voice is incomplete. Delete it and download again.";
                mb.setVits(OfflineTtsVitsModelConfig.builder()
                        .setModel(model.getAbsolutePath()).setTokens(tokens.getAbsolutePath())
                        .setDataDir(espeak.getAbsolutePath()).build());
            }
            tts = new OfflineTts(OfflineTtsConfig.builder().setModel(mb.build()).setMaxNumSentences(1).build());
            numSpeakers = tts.getNumSpeakers();
            loadedId = id;
            loadedThreads = threads;
            return null;
        } catch (Throwable t) {
            unload();
            return "Could not start this voice (" + t.getMessage() + ").";
        }
    }

    /** Generates one chunk of speech as a 16-bit mono WAV (bytes) plus timing/level stats. */
    synchronized Result synthesize(String text, int sid, float speed) {
        if (tts == null) return null;
        long t0 = System.nanoTime();
        GeneratedAudio a = tts.generate(text, Math.max(0, Math.min(sid, Math.max(0, numSpeakers - 1))), speed);
        double synthSec = (System.nanoTime() - t0) / 1e9;
        float[] s = a.getSamples();
        int sr = a.getSampleRate();
        Result r = new Result();
        r.sampleRate = sr;
        r.audioSec = s.length / (double) sr;
        r.synthSec = synthSec;
        double sum = 0;
        for (float v : s) sum += v * v;
        r.rms = s.length == 0 ? 0 : Math.sqrt(sum / s.length);
        r.wav = wav16(s, sr);
        return r;
    }

    static byte[] wav16(float[] samples, int sampleRate) {
        int dataLen = samples.length * 2;
        ByteBuffer b = ByteBuffer.allocate(44 + dataLen).order(ByteOrder.LITTLE_ENDIAN);
        b.put(new byte[]{'R', 'I', 'F', 'F'}).putInt(36 + dataLen).put(new byte[]{'W', 'A', 'V', 'E', 'f', 'm', 't', ' '})
                .putInt(16).putShort((short) 1).putShort((short) 1).putInt(sampleRate).putInt(sampleRate * 2).putShort((short) 2).putShort((short) 16)
                .put(new byte[]{'d', 'a', 't', 'a'}).putInt(dataLen);
        for (float v : samples) {
            int x = Math.round(Math.max(-1f, Math.min(1f, v)) * 32767f);
            b.putShort((short) x);
        }
        return b.array();
    }
}
