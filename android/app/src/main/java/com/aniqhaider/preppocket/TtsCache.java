package com.aniqhaider.preppocket;

import android.content.SharedPreferences;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Arrays;
import java.util.Comparator;
import java.util.UUID;

/**
 * Persistent cache of synthesized narration: `<key>.wav` files in a private directory. The key is a SHA-256 (hex) computed by JS
 * from voice + speaker + speed + exact text, so the same words in the same voice are never synthesized twice.
 * Safe to call from several threads (every method is synchronized); a corrupt or half-written file is deleted and treated as a miss;
 * writes are atomic (temp file, then rename); the total size is capped and the least recently used files are evicted first.
 */
class TtsCache {
    static final long DEFAULT_LIMIT = 200L * 1024 * 1024;
    private static final String PREF_LIMIT = "tts_cache_limit_bytes";

    private final File dir;
    private final SharedPreferences prefs;
    private long limit;

    TtsCache(File filesDir, SharedPreferences prefs) {
        this.dir = new File(filesDir, "tts-cache");
        this.prefs = prefs;
        this.limit = prefs.getLong(PREF_LIMIT, DEFAULT_LIMIT);
        //noinspection ResultOfMethodCallIgnored
        dir.mkdirs();
    }

    static boolean okKey(String k) { return k != null && k.matches("[0-9a-f]{64}"); }

    private File file(String key) { return new File(dir, key + ".wav"); }

    /** A WAV as written by TtsEngine.wav16: 44-byte header, 16-bit mono PCM, lengths consistent with the file size. */
    static boolean valid(byte[] b) {
        if (b == null || b.length < 46) return false;
        ByteBuffer bb = ByteBuffer.wrap(b).order(ByteOrder.LITTLE_ENDIAN);
        boolean tags = b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'A' && b[10] == 'V' && b[11] == 'E'
                && b[36] == 'd' && b[37] == 'a' && b[38] == 't' && b[39] == 'a';
        if (!tags) return false;
        int riff = bb.getInt(4), data = bb.getInt(40), rate = bb.getInt(24);
        return riff == b.length - 8 && data == b.length - 44 && data % 2 == 0 && rate >= 8000 && rate <= 96000;
    }

    synchronized boolean has(String key) {
        File f = file(key);
        return f.isFile() && f.length() > 44;
    }

    /** The cached WAV, or null on a miss. A file that fails validation is removed. Reading refreshes its LRU time. */
    synchronized byte[] get(String key) {
        File f = file(key);
        if (!f.isFile()) return null;
        try (FileInputStream in = new FileInputStream(f)) {
            byte[] b = new byte[(int) f.length()];
            int off = 0, n;
            while (off < b.length && (n = in.read(b, off, b.length - off)) > 0) off += n;
            if (off != b.length || !valid(b)) { f.delete(); return null; }
            //noinspection ResultOfMethodCallIgnored
            f.setLastModified(System.currentTimeMillis());
            return b;
        } catch (IOException | RuntimeException e) {
            f.delete();
            return null;
        }
    }

    /** Stores atomically. Returns false (and keeps nothing) when it does not fit the cap or the disk is full: the caller still has the audio. */
    synchronized boolean put(String key, byte[] wav) {
        if (wav == null || wav.length > limit) return false;
        File tmp = new File(dir, key + ".tmp-" + UUID.randomUUID().toString().substring(0, 8));
        try {
            dir.mkdirs();
            try (FileOutputStream out = new FileOutputStream(tmp)) { out.write(wav); out.getFD().sync(); }
            File dest = file(key);
            if (!tmp.renameTo(dest)) { tmp.delete(); return false; }
            //noinspection ResultOfMethodCallIgnored
            dest.setLastModified(System.currentTimeMillis());
            evict();
            return true;
        } catch (IOException | RuntimeException e) {
            tmp.delete();
            return false;
        }
    }

    private File[] wavs() {
        File[] fs = dir.listFiles((d, n) -> n.endsWith(".wav"));
        return fs == null ? new File[0] : fs;
    }

    /** Deletes least-recently-used files until the total fits the cap, and sweeps stale temp files. */
    private void evict() {
        File[] stale = dir.listFiles((d, n) -> n.contains(".tmp-"));
        if (stale != null) for (File f : stale) if (System.currentTimeMillis() - f.lastModified() > 10 * 60 * 1000L) f.delete();
        File[] fs = wavs();
        long total = 0;
        for (File f : fs) total += f.length();
        if (total <= limit) return;
        Arrays.sort(fs, Comparator.comparingLong(File::lastModified));
        for (File f : fs) {
            if (total <= limit) break;
            long len = f.length();
            if (f.delete()) total -= len;
        }
    }

    /** {bytes, files}. */
    synchronized long[] stats() {
        long bytes = 0;
        File[] fs = wavs();
        for (File f : fs) bytes += f.length();
        return new long[]{bytes, fs.length};
    }

    synchronized void clear() {
        File[] fs = dir.listFiles();
        if (fs != null) for (File f : fs) f.delete();
    }

    synchronized long limit() { return limit; }

    synchronized void setLimit(long bytes) {
        limit = Math.max(0, bytes);
        prefs.edit().putLong(PREF_LIMIT, limit).apply();
        evict();
    }
}
