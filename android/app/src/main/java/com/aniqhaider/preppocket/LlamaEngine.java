package com.aniqhaider.preppocket;

import android.content.Context;

/** Thin wrapper over the llama.cpp JNI bridge (see src/main/cpp/localllm.cpp). One model at a time. */
public class LlamaEngine {
    public interface TokenListener { void onToken(String piece); }

    static { System.loadLibrary("localllm"); }

    private boolean ready = false;
    private String loadedFile = null;

    private native void nativeInit(String libDir);
    private native int nativeLoad(String path, int nCtx, int nThreads);
    private native void nativeUnload();
    private native void nativeStop();
    private native int nativeGenerate(String system, String user, int maxTokens, float temp, TokenListener listener);
    private native String nativeSystemInfo();

    public synchronized int load(Context ctx, String path, String fileName, int nCtx) {
        if (!ready) { nativeInit(ctx.getApplicationInfo().nativeLibraryDir); ready = true; }
        // big cores only: little cores slow down matrix math more than they help
        int threads = Math.max(2, Math.min(4, Runtime.getRuntime().availableProcessors() - 2));
        int rc = nativeLoad(path, nCtx, threads);
        loadedFile = rc == 0 ? fileName : null;
        return rc;
    }

    public String loadedFile() { return loadedFile; }
    public void unload() { nativeUnload(); loadedFile = null; }
    public void stop() { nativeStop(); }
    public String systemInfo() { return ready ? nativeSystemInfo() : ""; }
    public int generate(String system, String user, int maxTokens, float temp, TokenListener l) {
        return nativeGenerate(system, user, maxTokens, temp, l);
    }
}
