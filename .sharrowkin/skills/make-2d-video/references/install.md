# Installing the studio (once per machine or workspace)

The studio is a Node + Python toolkit. In this workspace it is already installed at `2d-video/`; `original/skills/make-2d-video/kit/` is the read-only source. A writable copy is needed for `node_modules`, `.venv-whisper`, projects and renders.

## 1. Locate the source

- Source kit: `original/skills/make-2d-video/kit/` (workspace root).
- Working studio: `2d-video/` (original kit + intentional patches in `patches/`).
- CLI runner: `tools/2dvideo.py` (workspace root).

## 2. Install into a new workspace

- Create `2d-video/` next to the workspace root.
- If `2d-video/render.mjs` exists, the studio is already installed; never overwrite an existing `projects/` folder.
- Copy the kit and apply the patches; see `patches/README.md`. Do not copy the original over the working copy.

```powershell
Copy-Item -Recurse "original\skills\make-2d-video\kit\*" "2d-video\"
cd 2d-video
git -c core.autocrlf=false apply ..\patches\player-csp.patch
git -c core.autocrlf=false apply ..\patches\transcribe-offline.patch
git -c core.autocrlf=false apply ..\patches\render-http-security.patch
git -c core.autocrlf=false apply ..\patches\runtime-python.patch
python tools/verify_kit.py
```

`verify_kit.py` must report **29/29** with 12 intentional patches.

## 3. Dependencies

Nothing is installed automatically. Tell the user in one short list what is being installed and why: FFmpeg (encode/decode), Node packages (renderer, Three.js, fonts), headless Chromium (frames), Python packages (sound/timestamps).

| Need | Windows | macOS / Linux |
|---|---|---|
| ffmpeg + ffprobe | `winget install --id Gyan.FFmpeg -e` (new terminal) | `brew install ffmpeg` / `sudo apt-get install -y ffmpeg` |
| Node.js ≥ 18 | `winget install OpenJS.NodeJS.LTS` | distro / nodesource |
| Python ≥ 3.9 | python.org installer | distro package |
| JS packages | `cd 2d-video; npm install` | same |
| Chromium | `cd 2d-video; npx playwright install chromium` | same (`install-deps` on Linux if needed) |
| Python packages | `python -m venv .venv-whisper; .\.venv-whisper\Scripts\python.exe -m pip install -r requirements.txt` | `python3 -m venv .venv-whisper; ./.venv-whisper/bin/python -m pip install -r requirements.txt` |

`requirements.txt` — core/TTS (`numpy`, `scipy`); `requirements-whisper.txt` — optional legacy Whisper (`faster-whisper`, `ctranslate2`). The environment gate requires the venv, but **not** `faster_whisper` for the TTS path.

## 4. Check and self-test

```powershell
# workspace root
python tools/2dvideo.py doctor
python tools/2dvideo.py check

# studio
cd 2d-video
node render.mjs --project examples/reaction-time --sheet --scale 0.3
```

The self-test writes `examples/reaction-time/build/sheets/sheet_01.png` with 14 frames. Open it and confirm; if the current model is not image-capable, say visual QC is pending and ask the user to open it.

Full gate:

```powershell
npm test
```

It runs Python syntax, ESM syntax, skills-runtime lint, kit integrity and environment checks. It does not install anything.

## Notes

- TTS via an external API + SRT/JSON is the primary voice path: the API returns audio + timings; `init --voice ... --script ...` then `timeline --mode timestamps`. Whisper is legacy-only and its model is **not downloaded automatically**; it always needs a **separate audio file** via `--audio` and a local `--model` directory. Final ffprobe/ffmpeg check runs at the end on the finished MP4.
- On Linux servers Chromium uses SwiftShader (`--gl swiftshader`); CPU rendering is slower.
- Disk: node_modules + Chromium ≈ 600 MB, venv ≈ 420 MB, Whisper model (optional) ≈ 486 MB, plus renders.
- Updating: apply the current `patches/` to the new kit; never overwrite `projects/`.
