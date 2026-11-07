---
name: new-video
description: >
  This skill should be used when the user asks to "start a new 2D video", "set up a video from this voiceover",
  "timestamp my voiceover", "transcribe and time my narration", "import my SRT/timestamped script",
  "plan the shots for my script", «начни новый ролик», «разметь тайминги по озвучке», «разложи сцены»
  in the 2D Video studio. It covers intake, checking the studio, creating the project, building word-level
  timestamps (Whisper or the user's timestamped script), and the story breakdown with the shot list.
metadata:
  version: "0.1.1-sharrowkin.1"
  author: Андрей Зенин
  adapted_for: Sharrowkin (DeepSeek Flash)
---

# new-video: intake → studio check → timeline → story breakdown

This skill covers stages 1–4 of the 2D Video pipeline. Shared references live in `.sharrowkin/skills/make-2d-video/references/` (workspace root), and the studio is installed at `2d-video/`.

## Sharrowkin runtime

- There are no slash commands: the user asks for this stage in words, or names the skill `new-video`.
- `AskUserQuestion` → `ask_user` (2–4 options, one recommended).
- Shell → `run_command` (cmd.exe; `python`, not `python3`; quote paths with spaces).
- **Python convention:** use `python tools/2dvideo.py` from the workspace root; it selects `.venv-whisper`. Bare host `python` lacks numpy/scipy.
- **Never install packages or download a Whisper model without explicit permission.**
- Never edit `original/` or `2d-video.plugin`.
- The CLI runner `python tools/2dvideo.py` (workspace root) wraps these stages: `init`, `timeline`, `beats`, `status`.

## Language policy

- For each new project, ask once: «На каком языке создаём материал? По умолчанию — русский». If the user already specified the language, do not ask again. Use Russian (`ru`) if they choose the default or explicitly delegate the choice; do not treat silence as an answer.
- Save the chosen output language in `config.json` → `language`. All new titles, labels, charts, calls to action and other authored on-screen text must use that language. Preserve proper names and the user's supplied wording.
- Ask about a different source voiceover language only when needed; save it separately as `speechLanguage` (Whisper code or `auto`). Default it to the output language. Transcribe with that source language, never hard-code English.
- Preserve the original narration and verbatim captions. If the existing voiceover is in a different language, explain this and ask whether to keep it or use a translated script and matching replacement voiceover. This kit does not synthesize translated narration or align translated captions automatically.
- For existing projects, reuse the stored language; for legacy projects without it, confirm once, with Russian as the suggested default. Never translate or overwrite an existing project merely by re-rendering it.
- Do not copy English text from the example scenes into a Russian project. Pass explicit text in the selected language to UI helpers (including `subscribeLabel` on the end screen); check a preview for stray English and missing Cyrillic glyphs.

## 1. Intake
Ask once (`ask_user` when available), skipping anything the user already said:
- **Voiceover file** (required).
- **Script:** timestamped (SRT, VTT, JSON, or TXT with `[mm:ss]`), plain text, or none.
- **Aspect:** 16:9 or 9:16.
- **Resolution:** 720p / 1080p / 1440p / 2160p.
- **Captions:** default on for 9:16.
- **Music:** generated, own file, or none. **SFX:** on or off.
- **Title.**

Defaults: language `ru`, speech language same as output, 16:9, 1080p, generated music + SFX.

## 2. Studio
The studio is at `2d-video/` (original kit + 3 intentional patches). From the workspace root run `python tools/2dvideo.py doctor` and, inside `2d-video/`, `python tools/verify_kit.py` (29/29). Report anything MISSING with its fix command — but **ask before installing**. If `2d-video/render.mjs` is missing, copy `original/skills/make-2d-video/kit/` to `2d-video/` and follow `references/install.md`.

## 3. Project and timestamps
Run the CLI from the workspace root:
```bash
python tools/2dvideo.py init --name <slug> --lang <language> --speech-lang <speech-language> --voice "<voiceover>" [--script "<script>"] --aspect <16:9|9:16> --resolution <res> --title "<title>" [--captions]
```
- **Timestamped script** → `python tools/2dvideo.py timeline --project projects/<slug> --mode timestamps --script projects/<slug>/input/script.<ext>`. It accepts SRT, VTT, JSON (`[{start,end,text}]`, `{segments}`, `{words}`) and TXT lines like `[00:12.5] text`, `00:12 - 00:15 text` or `00:00:12,500 --> 00:00:15,000 text`. If the parser reports no timestamps, fall back to the plain-script route.
- **Plain script** → `python tools/2dvideo.py timeline --project projects/<slug> --mode plain --script projects/<slug>/input/script.txt --lang <speech-language> --model <local-model-dir>`. It keeps the script's exact words with Whisper timing. Require ≥ 90% match; if lower, tell the user the script and audio differ.
- **No script** → `python tools/2dvideo.py timeline --project projects/<slug> --mode whisper --lang <speech-language> --model <local-model-dir>`. The model must exist locally; ask before downloading one.

Open `timeline/transcript.txt` and confirm it reads correctly and ends near the voiceover length. Then run `python tools/2dvideo.py beats --project projects/<slug>` (add `--force` to overwrite an existing shots.json).

## 4. Story breakdown
Read `.sharrowkin/skills/make-2d-video/references/style-bible.md` and `references/story-breakdown.md` fully, then:
1. Write `projects/<slug>/story/bible.md`: logline and tone, the cast (one saturated signature item each), locations (mood, key light, window view, props), motifs and the music plan.
2. Write `projects/<slug>/scenes/cast.js` with the outfits.
3. Rewrite `projects/<slug>/story/shots.json` following the pacing rules. Every shot needs a concrete `scene` description, plus transitions, bars, sfx and amb where they matter.
4. Send the user a 5–10 line summary: the cast, the locations, the shot count, and the highlights per act.

Finish by saying the next step is the `video-styles` skill (or continue with the full pipeline in the `make-2d-video` skill if the user asked for the whole video).
