package com.aniqhaider.preppocket;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * "LocalLlm" Capacitor plugin: downloads GGUF models into app-private storage, loads one into llama.cpp and
 * streams generated tokens to JS as "token" events. Everything runs on-device; nothing is sent anywhere
 * except the one-time model download from the URL the user chose.
 */
@CapacitorPlugin(name = "LocalLlm")
public class LocalLlmPlugin extends Plugin {
    private static final int N_CTX = 4096;

    private final LlamaEngine engine = new LlamaEngine();
    private final ExecutorService io = Executors.newSingleThreadExecutor();       // download / load
    private final ExecutorService infer = Executors.newSingleThreadExecutor();    // generate
    private final AtomicBoolean cancelDownload = new AtomicBoolean(false);

    private File modelsDir() {
        File d = new File(getContext().getFilesDir(), "models");
        if (!d.exists()) d.mkdirs();
        return d;
    }

    /** Only plain file names inside the models dir — never a path from JS. */
    private File modelFile(String name, boolean part) {
        if (name == null || !name.matches("[A-Za-z0-9._-]{1,120}") || name.contains("..")) return null;
        return new File(modelsDir(), part ? name + ".part" : name);
    }

    @PluginMethod
    public void listModels(PluginCall call) {
        JSArray arr = new JSArray();
        File[] files = modelsDir().listFiles();
        if (files != null) for (File f : files) {
            JSObject o = new JSObject();
            boolean part = f.getName().endsWith(".part");
            o.put("file", part ? f.getName().substring(0, f.getName().length() - 5) : f.getName());
            o.put("bytes", f.length());
            o.put("complete", !part);
            arr.put(o);
        }
        JSObject res = new JSObject();
        res.put("models", arr);
        res.put("loaded", engine.loadedFile());
        res.put("freeBytes", modelsDir().getUsableSpace());
        call.resolve(res);
    }

    @PluginMethod
    public void download(PluginCall call) {
        final String url = call.getString("url");
        final String name = call.getString("file");
        final File target = modelFile(name, false), part = modelFile(name, true);
        if (url == null || !url.startsWith("https://") || target == null) { call.reject("Need an https:// URL and a simple file name."); return; }
        cancelDownload.set(false);
        io.execute(() -> {
            HttpURLConnection c = null;
            try {
                long have = part.exists() ? part.length() : 0;
                c = (HttpURLConnection) new URL(url).openConnection();
                c.setInstanceFollowRedirects(true);
                c.setConnectTimeout(20000);
                c.setReadTimeout(30000);
                if (have > 0) c.setRequestProperty("Range", "bytes=" + have + "-");
                int code = c.getResponseCode();
                if (code != 200 && code != 206) { call.reject("Download failed: HTTP " + code); return; }
                boolean resumed = code == 206;
                if (!resumed) have = 0;
                long total = c.getContentLengthLong() + (resumed ? have : 0);
                if (total > 0 && total - have > modelsDir().getUsableSpace()) { call.reject("Not enough free storage."); return; }

                long received = have, lastEmit = 0;
                try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(part, resumed)) {
                    byte[] buf = new byte[256 * 1024];
                    int n;
                    while ((n = in.read(buf)) > 0) {
                        if (cancelDownload.get()) { call.reject("cancelled"); return; }
                        out.write(buf, 0, n);
                        received += n;
                        long now = System.currentTimeMillis();
                        if (now - lastEmit > 400) {
                            lastEmit = now;
                            JSObject p = new JSObject();
                            p.put("file", name); p.put("received", received); p.put("total", total);
                            notifyListeners("downloadProgress", p);
                        }
                    }
                }
                if (total > 0 && received < total) { call.reject("Download incomplete — tap Download again to resume."); return; }
                if (!part.renameTo(target)) { call.reject("Could not finalize the model file."); return; }
                JSObject res = new JSObject();
                res.put("file", name); res.put("bytes", target.length());
                call.resolve(res);
            } catch (Exception e) {
                call.reject("Download interrupted (" + e.getMessage() + ") — tap Download again to resume.");
            } finally {
                if (c != null) c.disconnect();
            }
        });
    }

    @PluginMethod
    public void cancelDownload(PluginCall call) { cancelDownload.set(true); call.resolve(); }

    @PluginMethod
    public void deleteModel(PluginCall call) {
        String name = call.getString("file");
        File f = modelFile(name, false), p = modelFile(name, true);
        if (f == null) { call.reject("bad file name"); return; }
        if (name.equals(engine.loadedFile())) engine.unload();
        boolean ok = (!f.exists() || f.delete());
        if (p.exists()) ok &= p.delete();
        call.resolve(new JSObject().put("deleted", ok));
    }

    @PluginMethod
    public void load(PluginCall call) {
        final String name = call.getString("file");
        final File f = modelFile(name, false);
        if (f == null || !f.exists()) { call.reject("Model file not found — download it first."); return; }
        if (name.equals(engine.loadedFile())) { call.resolve(new JSObject().put("loaded", name)); return; }
        io.execute(() -> {
            int rc = engine.load(getContext(), f.getAbsolutePath(), name, N_CTX);
            if (rc == 0) call.resolve(new JSObject().put("loaded", name).put("system", engine.systemInfo()));
            else call.reject(rc == 1 ? "Could not read this model file (corrupt download or unsupported format)." : "Not enough memory to start this model.");
        });
    }

    @PluginMethod
    public void unload(PluginCall call) { engine.unload(); call.resolve(); }

    @PluginMethod
    public void stop(PluginCall call) { engine.stop(); call.resolve(); }

    @PluginMethod
    public void generate(PluginCall call) {
        final String system = call.getString("system", "");
        final String user = call.getString("user", "");
        final int maxTokens = call.getInt("maxTokens", 512);
        final float temp = call.getFloat("temperature", 0.4f);
        if (engine.loadedFile() == null) { call.reject("No model loaded."); return; }
        infer.execute(() -> {
            final StringBuilder all = new StringBuilder();
            final long t0 = System.currentTimeMillis();
            int n = engine.generate(system, user, maxTokens, temp, piece -> {
                all.append(piece);
                notifyListeners("token", new JSObject().put("text", piece));
            });
            if (n < 0) {
                call.reject(n == -2 ? "The question plus context is too long for the on-device model." : n == -1 ? "No model loaded." : "Generation failed.");
                return;
            }
            double secs = Math.max(0.001, (System.currentTimeMillis() - t0) / 1000.0);
            call.resolve(new JSObject().put("text", all.toString()).put("tokens", n).put("tokensPerSec", n / secs));
        });
    }
}
