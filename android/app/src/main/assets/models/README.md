# Bundled Gemma model asset

The Android runtime looks for the licensed Gemma 3 1B IT LiteRT-LM model at:

`android/app/src/main/assets/models/gemma3-1b-it-int4.litertlm`

**The model binary is intentionally not committed by this change.** The app will continue to use its deterministic local fallback until a valid model is supplied, and it must not report inference as ready without successfully initializing LiteRT-LM.

A compatible Gemma 3 1B IT int4 LiteRT-LM artifact is documented here:
https://huggingface.co/cuesetac/gemma-3-1b-it-litertlm

That repository lists a 584,417,280-byte model artifact. If using that artifact, rename it to the filename above before building. Verify the downloaded file and review/accept Google's Gemma Terms of Use and Prohibited Use Policy before redistributing it in an APK:
- https://ai.google.dev/gemma/terms
- https://ai.google.dev/gemma/prohibited_use_policy

Expected SHA-256 for the documented artifact:
`1325ae366d31950f137c9c357b9fa89448b176d76998180c08ceaca78bba98be`

Do not use a placeholder or empty file. The build and device inference test must be completed with the actual licensed model before this feature can be called complete.
