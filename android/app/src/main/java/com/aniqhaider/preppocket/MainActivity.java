package com.aniqhaider.preppocket;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocalLlmPlugin.class); // on-device tutor LLM (llama.cpp)
        super.onCreate(savedInstanceState);
    }
}
