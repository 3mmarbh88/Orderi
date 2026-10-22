package com.orderi.radar

import android.content.Context
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig

/**
 * Optional on-device Gemma runtime. The model must be legally obtained and placed
 * in app-private storage; the APK does not contain the gated model asset.
 * All calls are made by OrderiLocalAIPlugin's background executor.
 */
object OrderiLiteRtRuntime {
    @Volatile private var engine: Engine? = null
    @Volatile private var loadedPath: String? = null

    @Synchronized
    @JvmStatic
    fun initialize(context: Context, modelPath: String): Boolean {
        if (engine != null && loadedPath == modelPath) return true
        close()
        val candidate = Engine(
            EngineConfig(
                modelPath = modelPath,
                backend = Backend.CPU(),
                cacheDir = context.cacheDir.absolutePath
            )
        )
        return try {
            candidate.initialize()
            engine = candidate
            loadedPath = modelPath
            true
        } catch (error: Throwable) {
            // Engine.close() is not safe after initialize() itself failed.
            engine = null
            loadedPath = null
            throw error
        }
    }

    @JvmStatic
    fun isLoaded(modelPath: String): Boolean = engine != null && loadedPath == modelPath

    @Synchronized
    @JvmStatic
    fun generate(context: Context, modelPath: String, prompt: String): String {
        initialize(context, modelPath)
        val activeEngine = engine ?: throw IllegalStateException("LiteRT-LM engine is not loaded")
        val conversation = activeEngine.createConversation()
        return try {
            conversation.sendMessage(prompt)
        } finally {
            conversation.close()
        }
    }

    @Synchronized
    @JvmStatic
    fun close() {
        try { engine?.close() } catch (_: Throwable) {}
        engine = null
        loadedPath = null
    }
}
