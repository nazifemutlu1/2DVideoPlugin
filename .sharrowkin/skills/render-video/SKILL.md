---
name: render-video
description: >
  This skill should be used when the user asks to "build the scenes", "check the shots", "show me a contact sheet",
  "preview the video", "render the video", "render in 4K / 9:16", "re-render after a fix", "export the final MP4",
  «собери сцены», «покажи раскадровку», «отрендерь ролик» for a 2D Video project. It writes or repairs shot code
  in batches with contact-sheet QC, makes preview clips, runs the full frame-by-frame render, and muxes the final
  video with sound.
metadata:
  version: "0.1.1-sharrowkin.1"
  author: Андрей Зенин
  adapted_for: DSH (DeepSeek Harness)
---

# render-video: build, QC, preview and final render

Work inside `2d-video/` on the active project (`projects/<slug>`; if several exist, ask which one). Shared references are in `.sharrowkin/skills/make-2d-video/references/`. Read `engine-api.md`, `style-bible.md` and `render-qc.md` before writing or fixing scenes.

## Current DSH runtime

- Contact sheets and stills are PNG files: open them with `read_image` and judge them yourself before any long render. If the current model is not image-capable, say visual QC is pending and ask the user to open the sheet; do not claim you saw it.
- Long renders: start a background `bash`/`pwsh` job (never `nohup`, never `&`), then poll with `job_output`.
- `python`, not `python3`. Quote paths with spaces.
- **Python convention:** use `python tools/2dvideo.py` from the workspace root or `.venv-whisper\Scripts\python.exe` inside `2d-video/`; the host Python 3.14 lacks numpy/scipy.
- **Never install packages without permission.** If `node_modules` is missing, `render.mjs` fails with `ERR_MODULE_NOT_FOUND` — report it and ask before `npm install` / `npx playwright install chromium`.
- Do not start a full video render until the user has seen the preview and approved it.
- CLI runner equivalents (workspace root): `python tools/2dvideo.py sheet|preview|render|mix --project projects/<slug>`.

## Language policy

- For each new project, ask once: «На каком языке создаём материал? По умолчанию — русский». If the user already specified the language, do not ask again. Use Russian (`ru`) if they choose the default or explicitly delegate the choice; do not treat silence as an answer.
- Save the chosen output language in `config.json` → `language`. All new titles, labels, charts, calls to action and other authored on-screen text must use that language. Preserve proper names and the user's supplied wording.
- Ask about a different source voiceover language only when needed; save it separately as `speechLanguage` (Whisper code or `auto`). Default it to the output language. Transcribe with that source language, never hard-code English.
- Preserve the original narration and verbatim captions. If the existing voiceover is in a different language, explain this and ask whether to keep it or use a translated script and matching replacement voiceover. This kit does not synthesize translated narration or align translated captions automatically.
- For existing projects, reuse the stored language; for legacy projects without it, confirm once, with Russian as the suggested default. Never translate or overwrite an existing project merely by re-rendering it.
- Do not copy English text from the example scenes into a Russian project. Pass explicit text in the selected language to UI helpers (including `subscribeLabel` on the end screen); check a preview for stray English and missing Cyrillic glyphs.

## 1. Build or repair shots (batches of 8–12)
- List what's missing: `node render.mjs --project projects/<slug> --sheet --scale 0.4`. The console lists MISSING shots and shot errors, and `build/sheets/sheet_XX.png` shows one still per shot.
- Write `scenes/sets/*.js` and `scenes/shots/NN_name.js` (`registerShot(id, …)` for each shot id). Study `examples/reaction-time/scenes/` for working patterns.
- After each batch, re-run the sheet and **open every sheet PNG** against the QC checklist in `render-qc.md`. Fix and repeat until there are no MISSING or ERROR frames and every shot passes.
- To check motion, use `--stills t1,t2,t3` (several moments of one shot) or `--from A --to B --scale 0.5` (writes `build/preview.mp4`).

## 2. Preview checkpoint
Render `node render.mjs --project projects/<slug> --from 0 --to 30 --scale 0.5` and show the user the preview, or the contact sheets, before the long render. Mention the expected render time (speed guide in `render-qc.md`: frames = seconds × 24; ~2 frames/s at 720p on a small 2-core CPU, 1080p ~2× slower, 4K ~8× slower, desktops 3–5× faster).

## 3. Final render
- To change resolution or aspect, edit `projects/<slug>/config.json` (`resolution`, `aspect`). Switching aspect needs a fresh sheet review, because 9:16 framing differs.
- Run `node render.mjs --project projects/<slug> [--workers N] [--format jpeg]` with фоновый job (`bash`/`pwsh`) for anything over a minute or two, then poll the log and report progress and ETA at sensible intervals.
- Use fewer workers if memory is tight (about 1–1.5 GB each at 1080p, more at 4K). With no GPU, add `--gl swiftshader` (already the Linux default).
- Output: `build/video_silent.mp4`. The end of the log lists any shot errors. Fix them and re-render if there are any.

## 4. Sound, mux and deliver
Make sure the music plan and SFX are set (see the `video-sound` skill), then run `python tools/2dvideo.py mix --project projects/<slug>` from the workspace root, which writes `out/<title>.mp4`. QC: `ffprobe` duration ≈ `story/shots.json` duration, an audio stream is present, and a contact sheet of the final file (`ffmpeg -i out/<file>.mp4 -vf fps=1/10,scale=320:-1,tile=6x5 -frames:v 1 build/final_sheet.png`) looks right. Give the user the MP4 path and say in plain words where it was saved.
