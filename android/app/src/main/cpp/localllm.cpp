// JNI bridge: on-device LLM inference for the Tutor, built on llama.cpp (CPU).
// Stateless per call: every generate() clears the KV cache, formats [system, user] with the model's own
// chat template, and streams tokens back through a Java listener. Modelled on llama.cpp's examples/llama.android.
#include <android/log.h>
#include <jni.h>
#include <unistd.h>
#include <atomic>
#include <mutex>
#include <string>
#include <vector>

#include "sampling.h"
#include "chat.h"
#include "common.h"
#include "llama.h"

#define TAG "LocalLlm"
#define LOGi(...) __android_log_print(ANDROID_LOG_INFO, TAG, __VA_ARGS__)
#define LOGe(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

namespace {
constexpr int BATCH_SIZE = 512;

std::mutex                      g_mutex;
std::atomic<bool>               g_stop{false};
bool                            g_backend_ready = false;
llama_model                   * g_model   = nullptr;
llama_context                 * g_ctx     = nullptr;
common_batch                    g_batch;
common_chat_templates_ptr       g_templates;
int                             g_n_ctx   = 0;

void android_log_cb(ggml_log_level level, const char * text, void *) {
    int prio = level == GGML_LOG_LEVEL_ERROR ? ANDROID_LOG_ERROR : level == GGML_LOG_LEVEL_WARN ? ANDROID_LOG_WARN : ANDROID_LOG_INFO;
    __android_log_write(prio, TAG, text);
}

bool is_valid_utf8(const char * s) {
    const auto * b = (const unsigned char *) s;
    while (*b) {
        int n;
        if ((*b & 0x80) == 0x00) n = 1;
        else if ((*b & 0xE0) == 0xC0) n = 2;
        else if ((*b & 0xF0) == 0xE0) n = 3;
        else if ((*b & 0xF8) == 0xF0) n = 4;
        else return false;
        b++;
        for (int i = 1; i < n; i++, b++) if ((*b & 0xC0) != 0x80) return false;
    }
    return true;
}

void free_all() {
    g_batch = common_batch();
    g_templates.reset();
    if (g_ctx)   { llama_free(g_ctx);         g_ctx = nullptr; }
    if (g_model) { llama_model_free(g_model); g_model = nullptr; }
}

std::string jstr(JNIEnv * env, jstring s) {
    const char * c = env->GetStringUTFChars(s, nullptr);
    std::string out(c ? c : "");
    if (c) env->ReleaseStringUTFChars(s, c);
    return out;
}
}  // namespace

extern "C" JNIEXPORT void JNICALL
Java_com_aniqhaider_preppocket_LlamaEngine_nativeInit(JNIEnv * env, jobject, jstring libDir) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_backend_ready) return;
    llama_log_set(android_log_cb, nullptr);
    const std::string dir = jstr(env, libDir);
    LOGi("loading ggml backends from %s", dir.c_str());
    ggml_backend_load_all_from_path(dir.c_str());
    llama_backend_init();
    g_backend_ready = true;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_aniqhaider_preppocket_LlamaEngine_nativeSystemInfo(JNIEnv * env, jobject) {
    return env->NewStringUTF(llama_print_system_info());
}

// returns 0 ok, 1 model load failed, 2 context creation failed
extern "C" JNIEXPORT jint JNICALL
Java_com_aniqhaider_preppocket_LlamaEngine_nativeLoad(JNIEnv * env, jobject, jstring jpath, jint nCtx, jint nThreads) {
    std::lock_guard<std::mutex> lock(g_mutex);
    free_all();
    const std::string path = jstr(env, jpath);
    LOGi("loading model %s", path.c_str());

    llama_model_params mp = llama_model_default_params();
    g_model = llama_model_load_from_file(path.c_str(), mp);
    if (!g_model) return 1;

    llama_context_params cp = llama_context_default_params();
    cp.n_ctx = nCtx;
    cp.n_batch = BATCH_SIZE;
    cp.n_ubatch = BATCH_SIZE;
    cp.n_threads = nThreads;
    cp.n_threads_batch = nThreads;
    g_ctx = llama_init_from_model(g_model, cp);
    if (!g_ctx) { free_all(); return 2; }

    g_n_ctx = (int) llama_n_ctx(g_ctx);
    g_batch = common_batch(g_ctx);
    g_templates = common_chat_templates_init(g_model, "");
    LOGi("model ready: n_ctx=%d threads=%d", g_n_ctx, (int) nThreads);
    return 0;
}

extern "C" JNIEXPORT void JNICALL
Java_com_aniqhaider_preppocket_LlamaEngine_nativeUnload(JNIEnv *, jobject) {
    std::lock_guard<std::mutex> lock(g_mutex);
    free_all();
}

extern "C" JNIEXPORT void JNICALL
Java_com_aniqhaider_preppocket_LlamaEngine_nativeStop(JNIEnv *, jobject) {
    g_stop = true;  // deliberately lock-free: generate() holds the mutex
}

// returns number of generated tokens, or a negative error: -1 no model, -2 prompt too long, -3 decode failed
extern "C" JNIEXPORT jint JNICALL
Java_com_aniqhaider_preppocket_LlamaEngine_nativeGenerate(JNIEnv * env, jobject, jstring jsystem, jstring juser,
                                                          jint maxTokens, jfloat temp, jobject listener) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (!g_model || !g_ctx) return -1;
    g_stop = false;

    jclass cls = env->GetObjectClass(listener);
    jmethodID onToken = env->GetMethodID(cls, "onToken", "(Ljava/lang/String;)V");

    // 1) format with the model's chat template (system, then user + assistant prefix)
    const std::string sys = jstr(env, jsystem), usr = jstr(env, juser);
    std::vector<common_chat_msg> history;
    common_chat_msg m_sys; m_sys.role = "system"; m_sys.content = sys;
    common_chat_msg m_usr; m_usr.role = "user";   m_usr.content = usr;
    const bool has_tmpl = common_chat_templates_was_explicit(g_templates.get());
    std::string prompt;
    if (has_tmpl) {
        prompt  = common_chat_format_single(g_templates.get(), history, m_sys, false, false);
        history.push_back(m_sys);
        prompt += common_chat_format_single(g_templates.get(), history, m_usr, true, false);
    } else {
        prompt = sys + "\n\n" + usr + "\n";
    }

    // 2) tokenize and make sure prompt + answer fit
    auto tokens = common_tokenize(g_ctx, prompt, has_tmpl, has_tmpl);
    if ((int) tokens.size() + 16 >= g_n_ctx) { LOGe("prompt too long: %d tokens (n_ctx %d)", (int) tokens.size(), g_n_ctx); return -2; }
    const int budget = std::min((int) maxTokens, g_n_ctx - (int) tokens.size() - 4);

    // 3) fresh KV cache, then prefill the prompt in batches
    llama_memory_clear(llama_get_memory(g_ctx), false);
    for (int i = 0; i < (int) tokens.size(); i += BATCH_SIZE) {
        const int n = std::min((int) tokens.size() - i, BATCH_SIZE);
        g_batch.clear();
        for (int j = 0; j < n; j++) g_batch.add(tokens[i + j], i + j, 0, i + j == (int) tokens.size() - 1);
        if (llama_process(g_ctx, LLAMA_PROCESS_TYPE_DECODE, g_batch.get()) != 0) { LOGe("prefill decode failed"); return -3; }
        if (g_stop) return 0;
    }

    // 4) sample + stream
    common_params_sampling sp;
    sp.temp = temp;
    common_sampler * sampler = common_sampler_init(g_model, sp);
    const llama_vocab * vocab = llama_model_get_vocab(g_model);
    int pos = (int) tokens.size(), produced = 0;
    std::string cache;
    int rc = 0;

    while (produced < budget && !g_stop) {
        const llama_token tok = common_sampler_sample(sampler, g_ctx, -1);
        common_sampler_accept(sampler, tok, true);
        if (llama_vocab_is_eog(vocab, tok)) break;

        cache += common_token_to_piece(g_ctx, tok);
        if (is_valid_utf8(cache.c_str())) {   // hold back partial multi-byte characters
            jstring piece = env->NewStringUTF(cache.c_str());
            env->CallVoidMethod(listener, onToken, piece);
            env->DeleteLocalRef(piece);
            cache.clear();
        }
        produced++;

        g_batch.clear();
        g_batch.add(tok, pos, 0, true);
        if (llama_process(g_ctx, LLAMA_PROCESS_TYPE_DECODE, g_batch.get()) != 0) { LOGe("decode failed"); rc = -3; break; }
        pos++;
    }
    common_sampler_free(sampler);
    return rc ? rc : produced;
}
