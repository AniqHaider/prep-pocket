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
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

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
    private final ExecutorService synth = Executors.newSingleThreadExecutor();  // load / synthesize
    private final AtomicBoolean cancel = new AtomicBoolean(false);

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
        synth.execute(() -> { // same thread as synthesize(), so a load always finishes before the first sentence and never waits behind a download
            String err = engine.load(voiceDir(id), id);
            if (err == null) call.resolve(new JSObject().put("loaded", id).put("speakers", engine.numSpeakers()));
            else call.reject(err);
        });
    }

    @PluginMethod
    public void unload(PluginCall call) { engine.unload(); call.resolve(); }

    /** Returns one chunk of speech as base64 WAV plus {audioSec, synthSec, rms} so JS can pipeline and report speed. */
    @PluginMethod
    public void synthesize(PluginCall call) {
        final String text = call.getString("text", "");
        final int sid = call.getInt("sid", 0);
        final float speed = call.getFloat("speed", 1.0f);
        if (engine.loadedId() == null) { call.reject("No voice loaded."); return; }
        if (text.trim().isEmpty()) { call.reject("Nothing to say."); return; }
        synth.execute(() -> {
            try {
                TtsEngine.Result r = engine.synthesize(text, sid, speed);
                if (r == null) { call.reject("No voice loaded."); return; }
                call.resolve(new JSObject().put("wav", r.wavBase64).put("sampleRate", r.sampleRate).put("audioSec", r.audioSec)
                        .put("synthSec", r.synthSec).put("rms", r.rms));
            } catch (Throwable t) {
                call.reject("Speech failed (" + t.getMessage() + ").");
            }
        });
    }
}
