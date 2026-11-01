// Chat-prompt formatting shared by the Android bridge (localllm.cpp) and the host test harness, so the code that is
// tested on a computer is the code that runs on the phone.
#pragma once
#include <exception>
#include <string>
#include <vector>

#include "chat.h"
#include "llama.h"

struct PromptFormat {
    std::string text;
    bool        templated = false;  // true: `text` came from the model's chat template (tokenize it with special tokens)
    std::string note;               // why a fallback was used, if one was
};

// Formats [system, user] + the assistant prefix with the model's own jinja chat template, like llama-server does.
// Thinking is switched off: reasoning models (Qwen 3.5, ...) would otherwise spend minutes "thinking" on a phone CPU.
// Falls back to the legacy formatter, then to a plain prompt, so an unusual template can never crash the app.
inline PromptFormat format_chat_prompt(const common_chat_templates * tmpls, const llama_model * model, const std::string & sys, const std::string & usr) {
    PromptFormat out;
    common_chat_msg m_sys; m_sys.role = "system"; m_sys.content = sys;
    common_chat_msg m_usr; m_usr.role = "user";   m_usr.content = usr;
    if (common_chat_templates_was_explicit(tmpls)) {
        try {
            const llama_vocab * v = llama_model_get_vocab(model);
            common_chat_templates_inputs in;
            in.messages = { m_sys, m_usr };
            in.use_jinja = true;
            in.add_generation_prompt = true;
            in.enable_thinking = false;
            // tokenization adds BOS/EOS itself, so ask for the template output without a duplicate
            in.add_bos = llama_vocab_get_add_bos(v);
            in.add_eos = llama_vocab_get_add_eos(v);
            out.text = common_chat_templates_apply(tmpls, in).prompt;
            out.templated = !out.text.empty();
        } catch (const std::exception & e) {
            out.note = std::string("jinja template failed: ") + e.what();
        }
        if (!out.templated) {
            try {
                std::vector<common_chat_msg> history;
                out.text  = common_chat_format_single(tmpls, history, m_sys, false, false);
                history.push_back(m_sys);
                out.text += common_chat_format_single(tmpls, history, m_usr, true, false);
                out.templated = !out.text.empty();
            } catch (const std::exception & e) {
                out.note += std::string(" | legacy template failed: ") + e.what();
            }
        }
    }
    if (!out.templated) out.text = sys + "\n\n" + usr + "\n";
    return out;
}
