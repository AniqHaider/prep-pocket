package com.aniqhaider.preppocket;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream;
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorInputStream;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.PriorityBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

import android.content.Context;
import android.util.Base64;
import android.view.WindowManager;

/**
 * "LocalTts" Capacitor plugin: downloads a sherpa-onnx voice (Kokoro / Piper .tar.bz2) into app-private storage,
 * unpacks it, and synthesizes speech on-device. Nothing is sent anywhere except the one-time download from the
 * sherpa-onnx GitHub release the app's catalog points at.
 */
@CapacitorPlugin(name = "LocalTts")
public class LocalTtsPlugin extends Plugin {
    private static final String RELEASE_PREFIX = "https://github.com/k2-fsa/sherpa-onnx/releases/download/";

    private final TtsEngine engine = new TtsEngine();
    private final ExecutorService io = Executors.newSingleThreadExecutor();     // download / extract
    private final ExecutorService cacheIo = Executors.newSingleThreadExecutor(); // cache lookups never wait behind a synthesis
    private final AtomicBoolean cancel = new AtomicBoolean(false);
    private TtsCache cache;

    // load / synthesize run on ONE thread, but as a priority queue: what the learner is hearing (priority 0) always goes before
    // background prefetch of later sentences (priority 1). A prefetch that is already running finishes first (at most one sentence).
    private static final AtomicLong SEQ = new AtomicLong();
    private static class Job implements Runnable, Comparable<Job> {
        final int prio; final long seq = SEQ.getAndIncrement(); final Runnable r;
        Job(int prio, Runnable r) { this.prio = prio; this.r = r; }
        @Override public void run() { r.run(); }
        @Override public int compareTo(Job o) { return prio != o.prio ? Integer.compare(prio, o.prio) : Long.compare(seq, o.seq); }
    }
    private final ThreadPoolExecutor synth = new ThreadPoolExecutor(1, 1, 0L, TimeUnit.MILLISECONDS, new PriorityBlockingQueue<Runnable>());
    private final AtomicLong prefetchEpoch = new AtomicLong();

    private synchronized TtsCache cache() {
        if (cache == null) cache = new TtsCache(getContext().getFilesDir(), getContext().getSharedPreferences("tts", Context.MODE_PRIVATE));
        return cache;
    }

    private File root() {
        File d = new File(getContext().getFilesDir(), "tts");
        if (!d.exists()) d.mkdirs();
        return d;
    }

    private static boolean okId(String id) { return id != null && id.matches("[A-Za-z0-9._-]{1,80}") && !id.contains(".."); }
    private File voiceDir(String id) { return new File(root(), id); }
    private File marker(String id) { return new File(voiceDir(id), ".ok"); }
    private File archive(String id, boolean part) { return new File(root(), id + ".tar.bz2" + (part ? ".part" : "")); }

    private static void rmrf(File f) {
        File[] kids = f.listFiles();
        if (kids != null) for (File k : kids) rmrf(k);
        f.delete();
    }

    @PluginMethod
    public void listVoices(PluginCall call) {
        JSArray arr = new JSArray();
        File[] files = root().listFiles();
        if (files != null) for (File f : files) {
            String n = f.getName();
            JSObject o = new JSObject();
            if (f.isDirectory() && !n.endsWith(".tmp")) {
                o.put("id", n); o.put("installed", marker(n).exists()); o.put("partialBytes", 0);
                arr.put(o);
            } else if (n.endsWith(".tar.bz2.part")) {
                o.put("id", n.substring(0, n.length() - ".tar.bz2.part".length())); o.put("installed", false); o.put("partialBytes", f.length());
                arr.put(o);
            }
        }
        call.resolve(new JSObject().put("voices", arr).put("loaded", engine.loadedId()).put("freeBytes", root().getUsableSpace()));
    }

    private void progress(String id, String phase, long received, long total) {
        notifyListeners("downloadProgress", new JSObject().put("id", id).put("phase", phase).put("received", received).put("total", total));
    }

    @PluginMethod
    public void download(PluginCall call) {
        final String id = call.getString("id");
        final String url = call.getString("url");
        if (!okId(id) || url == null || !url.startsWith(RELEASE_PREFIX)) { call.reject("Bad voice id or URL."); return; }
        cancel.set(false);
        io.execute(() -> {
            HttpURLConnection c = null;
            File part = archive(id, true), arch = archive(id, false);
            try {
                long have = part.exists() ? part.length() : 0;
                c = (HttpURLConnection) new URL(url).openConnection();
                c.setInstanceFollowRedirects(true);
                c.setConnectTimeout(20000);
                c.setReadTimeout(30000);
                if (have > 0) c.setRequestProperty("Range", "bytes=" + have + "-");
                int code = c.getResponseCode();
                if (code == 416 && have > 0) { // the .part file already holds the whole archive (finished before it was renamed)
                    if (!part.renameTo(arch)) { call.reject("Could not finalize the download."); return; }
                    String err = extract(id, arch);
                    if (err != null) { call.reject(err); return; }
                    arch.delete();
                    call.resolve(new JSObject().put("id", id));
                    return;
                }
                if (code != 200 && code != 206) { call.reject("Download failed: HTTP " + code); return; }
                boolean resumed = code == 206;
                if (!resumed) have = 0;
                long total = c.getContentLengthLong() + (resumed ? have : 0);
                if (total > 0 && (total - have) * 2 > root().getUsableSpace()) { call.reject("Not enough free storage."); return; }

                long received = have, lastEmit = 0;
                try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(part, resumed)) {
                    byte[] buf = new byte[256 * 1024];
                    int n;
                    while ((n = in.read(buf)) > 0) {
                        if (cancel.get()) { call.reject("cancelled"); return; }
                        out.write(buf, 0, n);
                        received += n;
                        long now = System.currentTimeMillis();
                        if (now - lastEmit > 400) { lastEmit = now; progress(id, "download", received, total); }
                    }
                }
                if (total > 0 && received < total) { call.reject("Download incomplete. Tap Download again to resume."); return; }
                if (!part.renameTo(arch)) { call.reject("Could not finalize the download."); return; }
                progress(id, "download", total, total);

                String err = extract(id, arch);
                if (err != null) { call.reject(err); return; }
                arch.delete();
                call.resolve(new JSObject().put("id", id));
            } catch (Exception e) {
                call.reject("Download interrupted (" + e.getMessage() + "). Tap Download again to resume.");
            } finally {
                if (c != null) c.disconnect();
            }
        });
    }

    /** Counts compressed bytes consumed so extraction progress can be reported against the archive size. */
    private static class Counting extends FilterInputStream {
        long n;
        Counting(InputStream in) { super(in); }
        @Override public int read() throws IOException { int b = super.read(); if (b >= 0) n++; return b; }
        @Override public int read(byte[] b, int o, int l) throws IOException { int r = super.read(b, o, l); if (r > 0) n += r; return r; }
    }

    private String extract(String id, File arch) {
        File tmp = new File(root(), id + ".tmp"), dest = voiceDir(id);
        rmrf(tmp); rmrf(dest);
        tmp.mkdirs();
        long total = arch.length(), lastEmit = 0;
        try (Counting cin = new Counting(new BufferedInputStream(new FileInputStream(arch), 1 << 16));
             TarArchiveInputStream tar = new TarArchiveInputStream(new BZip2CompressorInputStream(cin))) {
            TarArchiveEntry e;
            byte[] buf = new byte[256 * 1024];
            String canonicalTmp = tmp.getCanonicalPath() + File.separator;
            while ((e = tar.getNextEntry()) != null) {
                if (cancel.get()) { rmrf(tmp); return "cancelled"; }
                String name = e.getName();
                int slash = name.indexOf('/');
                if (slash < 0) continue;               // top-level directory entry
                String rel = name.substring(slash + 1); // strip "<voice>/" prefix
                if (rel.isEmpty()) continue;
                File out = new File(tmp, rel);
                if (!out.getCanonicalPath().startsWith(canonicalTmp)) { rmrf(tmp); return "The voice archive looks unsafe."; }
                if (e.isDirectory()) { out.mkdirs(); continue; }
                if (!e.isFile()) continue;
                out.getParentFile().mkdirs();
                try (OutputStream os = new FileOutputStream(out)) {
                    int n;
                    while ((n = tar.read(buf)) > 0) {
                        os.write(buf, 0, n);
                        long now = System.currentTimeMillis();
                        if (now - lastEmit > 400) { lastEmit = now; progress(id, "extract", Math.min(cin.n, total), total); }
                    }
                }
            }
            new FileOutputStream(new File(tmp, ".ok")).close();
            if (!tmp.renameTo(dest)) { rmrf(tmp); return "Could not finalize the voice."; }
            progress(id, "extract", total, total);
            return null;
        } catch (Exception ex) {
            rmrf(tmp);
            return "Could not unpack the voice (" + ex.getMessage() + "). Delete it and download again.";
        }
    }

    @PluginMethod
    public void cancelDownload(PluginCall call) { cancel.set(true); call.resolve(); }

    @PluginMethod
    public void deleteVoice(PluginCall call) {
        String id = call.getString("id");
        if (!okId(id)) { call.reject("bad voice id"); return; }
        if (id.equals(engine.loadedId())) engine.unload();
        rmrf(voiceDir(id)); rmrf(new File(root(), id + ".tmp"));
        archive(id, false).delete(); archive(id, true).delete();
        call.resolve(new JSObject().put("deleted", true));
    }

    @PluginMethod
    public void load(PluginCall call) {
        final String id = call.getString("id");
        if (!okId(id) || !marker(id).exists()) { call.reject("Voice not downloaded yet."); return; }
        final int threads = call.getInt("threads", TtsEngine.defaultThreads());
        synth.execute(new Job(0, () -> { // same queue as synthesize(), so a load always finishes before the next sentence and never waits behind a download
            String err = engine.load(voiceDir(id), id, threads);
            if (err == null) call.resolve(new JSObject().put("loaded", id).put("speakers", engine.numSpeakers()).put("threads", engine.loadedThreads()));
            else call.reject(err);
        }));
    }

    @PluginMethod
    public void unload(PluginCall call) { engine.unload(); call.resolve(); }

    /** Audio length, sample rate and RMS level from a WAV written by TtsEngine.wav16 (used for cache hits, where no synthesis ran). */
    private static double[] wavStats(byte[] wav) {
        ByteBuffer bb = ByteBuffer.wrap(wav).order(ByteOrder.LITTLE_ENDIAN);
        int rate = bb.getInt(24), data = bb.getInt(40);
        int n = data / 2;
        double sum = 0;
        for (int i = 0; i < n; i++) { double v = bb.getShort(44 + i * 2) / 32768.0; sum += v * v; }
        return new double[]{rate, n / (double) rate, n == 0 ? 0 : Math.sqrt(sum / n)};
    }

    private static JSObject audioResult(byte[] wav, int sampleRate, double audioSec, double synthSec, double rms, boolean cached, boolean noAudio) {
        JSObject o = new JSObject().put("sampleRate", sampleRate).put("audioSec", audioSec).put("synthSec", synthSec).put("rms", rms).put("cached", cached);
        if (!noAudio) o.put("wav", Base64.encodeToString(wav, Base64.NO_WRAP));
        return o;
    }

    private static JSObject fromCache(byte[] hit, boolean noAudio) {
        double[] st = wavStats(hit);
        return audioResult(hit, (int) st[0], st[1], 0, st[2], true, noAudio);
    }

    /**
     * One chunk of speech as base64 WAV plus {audioSec, synthSec, rms, cached}. With a `key` (SHA-256 hex from JS) the persistent cache is
     * consulted first (a hit costs no synthesis and reports synthSec 0 and cached true, so it never counts as a speed measurement) and
     * a fresh result is stored. `voice` makes a stale request (the voice changed meanwhile) fail instead of caching the wrong voice
     * under the right key. `nocache` bypasses the cache (speed tests), `noAudio` skips returning the audio (prefetch), `low` queues behind
     * anything the learner is waiting for.
     */
    @PluginMethod
    public void synthesize(PluginCall call) {
        final String text = call.getString("text", "");
        final int sid = call.getInt("sid", 0);
        final float speed = call.getFloat("speed", 1.0f);
        final String voice = call.getString("voice");
        final String key = call.getString("key");
        final boolean noCache = Boolean.TRUE.equals(call.getBoolean("nocache", false));
        final boolean noAudio = Boolean.TRUE.equals(call.getBoolean("noAudio", false));
        final boolean low = Boolean.TRUE.equals(call.getBoolean("low", false));
        final boolean useCache = !noCache && TtsCache.okKey(key);
        if (engine.loadedId() == null) { call.reject("No voice loaded."); return; }
        if (voice != null && !voice.equals(engine.loadedId())) { call.reject("The voice changed."); return; }
        if (text.trim().isEmpty()) { call.reject("Nothing to say."); return; }
        final long epoch = prefetchEpoch.get();

        final Runnable synthJob = () -> {
            try {
                if (low && epoch != prefetchEpoch.get()) { call.reject("cancelled"); return; }
                if (voice != null && !voice.equals(engine.loadedId())) { call.reject("The voice changed."); return; }
                if (useCache) { // another request may have produced it while this one waited
                    byte[] hit = cache().get(key);
                    if (hit != null) { call.resolve(fromCache(hit, noAudio)); return; }
                }
                TtsEngine.Result r = engine.synthesize(text, sid, speed);
                if (r == null) { call.reject("No voice loaded."); return; }
                call.resolve(audioResult(r.wav, r.sampleRate, r.audioSec, r.synthSec, r.rms, false, noAudio));
                if (useCache) cache().put(key, r.wav); // after resolving: storing must never delay the audio
            } catch (Throwable t) {
                call.reject("Speech failed (" + t.getMessage() + ").");
            }
        };
        if (useCache) {
            cacheIo.execute(() -> {
                byte[] hit = cache().get(key);
                if (hit != null) { call.resolve(fromCache(hit, noAudio)); return; }
                synth.execute(new Job(low ? 1 : 0, synthJob));
            });
        } else {
            synth.execute(new Job(low ? 1 : 0, synthJob));
        }
    }

    /** Which of these cache keys are already stored: lets the player treat those sentences as free when planning playback. */
    @PluginMethod
    public void cacheHas(PluginCall call) {
        final JSArray keys = call.getArray("keys");
        cacheIo.execute(() -> {
            JSArray has = new JSArray();
            try {
                if (keys != null) for (int i = 0; i < keys.length(); i++) {
                    String k = keys.getString(i);
                    has.put(TtsCache.okKey(k) && cache().has(k));
                }
            } catch (Exception e) { /* report what we have */ }
            call.resolve(new JSObject().put("has", has));
        });
    }

    @PluginMethod
    public void cacheStats(PluginCall call) {
        cacheIo.execute(() -> {
            long[] st = cache().stats();
            call.resolve(new JSObject().put("bytes", st[0]).put("files", st[1]).put("limitBytes", cache().limit()));
        });
    }

    @PluginMethod
    public void clearCache(PluginCall call) {
        cacheIo.execute(() -> { cache().clear(); call.resolve(); });
    }

    /** `mb` for the app, or `bytes` for tests (a tiny cap to watch eviction). */
    @PluginMethod
    public void setCacheLimit(PluginCall call) {
        // read the raw JSON numbers: PluginCall.getLong() only accepts values that arrived as Long, and JS integers arrive as Integer
        final JSObject data = call.getData();
        final long limit = data.has("bytes") ? data.optLong("bytes", TtsCache.DEFAULT_LIMIT)
                : data.has("mb") ? data.optLong("mb", 200) * 1024L * 1024L : TtsCache.DEFAULT_LIMIT;
        cacheIo.execute(() -> {
            cache().setLimit(limit);
            long[] st = cache().stats();
            call.resolve(new JSObject().put("bytes", st[0]).put("files", st[1]).put("limitBytes", cache().limit()));
        });
    }

    /** Drops queued background prefetch jobs (the one already running finishes). */
    @PluginMethod
    public void cancelPrefetch(PluginCall call) { prefetchEpoch.incrementAndGet(); call.resolve(); }

    /** CPU layout for choosing a thread count: the performance cores, all core frequencies (MHz) when readable, and the default. */
    @PluginMethod
    public void cpuInfo(PluginCall call) {
        long[] f = TtsEngine.coreMaxFreqs();
        JSArray mhz = new JSArray();
        if (f != null) for (long x : f) mhz.put(x / 1000);
        call.resolve(new JSObject().put("cores", Runtime.getRuntime().availableProcessors()).put("performance", TtsEngine.performanceCores())
                .put("freqsMhz", mhz).put("freqsKnown", f != null).put("defaultThreads", TtsEngine.defaultThreads()));
    }

    /**
     * Keep the screen on while a lesson or narration is playing (FLAG_KEEP_SCREEN_ON on the app window). The flag only
     * applies while this app is in front, and is cleared when playback stops, so the screen sleeps normally again.
     */
    @PluginMethod
    public void keepAwake(PluginCall call) {
        final boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        if (getActivity() == null) { call.resolve(); return; }
        getActivity().runOnUiThread(() -> {
            if (on) getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            call.resolve();
        });
    }
}
