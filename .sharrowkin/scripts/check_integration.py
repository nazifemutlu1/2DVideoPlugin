"""Integration smoke: 16:9/9:16 sheets, preview, and a short mux.

Default npm test stays fast; run this explicitly:
    python .sharrowkin/scripts/check_integration.py
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STUDIO = ROOT / "2d-video"
PY = ROOT / ".venv-whisper" / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
VOICE = STUDIO / "projects" / "_smoke" / "input" / "voiceover.wav"


def run(cmd: list[str], cwd: Path = STUDIO) -> None:
    print("+", " ".join(cmd))
    subprocess.run(cmd, cwd=str(cwd), check=True)


def ffprobe(path: Path) -> dict:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", str(path)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True,
    ).stdout
    return json.loads(out)


def main() -> int:
    if not PY.is_file():
        print(f"SKIP: venv Python not found: {PY}")
        return 2
    if not shutil.which("node") or not shutil.which("ffmpeg"):
        print("SKIP: node/ffmpeg missing")
        return 2

    run(["node", "render.mjs", "--project", "examples/reaction-time", "--sheet", "--scale", "0.25"])
    sheet16 = STUDIO / "examples" / "reaction-time" / "build" / "sheets" / "sheet_01.png"
    assert sheet16.is_file() and sheet16.stat().st_size > 0, sheet16

    run(["node", "render.mjs", "--project", "projects/vizavi_paper_test", "--sheet", "--scale", "0.5"])
    sheet9 = next((STUDIO / "projects" / "vizavi_paper_test" / "build" / "sheets").glob("sheet_*.png"), None)
    assert sheet9 and sheet9.stat().st_size > 0, "9:16 sheet missing"

    run(["node", "render.mjs", "--project", "projects/qoder_scene_test", "--from", "0", "--to", "2", "--scale", "0.25"])
    preview = STUDIO / "projects" / "qoder_scene_test" / "build" / "preview.mp4"
    meta = ffprobe(preview)
    assert abs(float(meta["format"]["duration"]) - 2.0) < 0.15, meta
    assert any(s["codec_type"] == "video" for s in meta["streams"]), meta

    build_root = STUDIO / "build"
    build_root.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="2dvideo-integration-", dir=build_root) as td:
        p = Path(td)
        (p / "input").mkdir()
        (p / "story").mkdir()
        (p / "build").mkdir()
        (p / "out").mkdir()
        shutil.copy2(VOICE, p / "input" / "voiceover.wav")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(p / "input" / "voiceover.wav"), "-t", "2", "-c:a", "pcm_s16le", str(p / "input" / "voice2.wav")], check=True)
        (p / "input" / "voice2.wav").replace(p / "input" / "voiceover.wav")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "color=c=black:s=320x180:r=24:d=2", "-c:v", "libx264", "-pix_fmt", "yuv420p", str(p / "build" / "video_silent.mp4")], check=True)
        (p / "config.json").write_text(json.dumps({"voiceover": "input/voiceover.wav", "music": {"enabled": False}, "sfx": {"enabled": False}, "loudness": -14, "title": "integration"}), encoding="utf-8")
        (p / "story" / "shots.json").write_text(json.dumps({"duration": 2.0, "shots": [{"start": 0, "end": 2}]}), encoding="utf-8")
        run([str(PY), "audio/mix.py", "--project", str(p), "--video", str(p / "build" / "video_silent.mp4"), "--out", str(p / "out" / "integration.mp4"), "--no-music", "--no-sfx"])
        final = p / "out" / "integration.mp4"
        meta = ffprobe(final)
        assert {s["codec_type"] for s in meta["streams"]} >= {"video", "audio"}, meta

    print("INTEGRATION PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
