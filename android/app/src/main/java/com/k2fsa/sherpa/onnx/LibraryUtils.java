package com.k2fsa.sherpa.onnx;

/**
 * Android replacement for upstream's JVM LibraryUtils (which extracts libraries from jar resources).
 * On Android the prebuilt libs ship in jniLibs/arm64-v8a, so System.loadLibrary is enough.
 */
class LibraryUtils {
    static void load() {
        System.loadLibrary("onnxruntime");
        System.loadLibrary("sherpa-onnx-jni");
    }
}
