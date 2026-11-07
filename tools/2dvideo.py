"""tools/2dvideo.py — Sharrowkin CLI runner for the 2D Video studio.

Thin wrapper around the studio's own tools (2d-video/tools/*.py, 2d-video/render.mjs,
2d-video/audio/mix.py). It adds no rendering or animation logic of its own: every stage
is the original plugin command, run from the studio folder.

  python tools/2dvideo.py doctor
  python tools/2dvideo.py init --name my-video --voice "C:/audio/voice.mp3" --title "Мой ролик"
  python tools/2dvideo.py timeline --project projects/my-video [--script <file>] [--mode auto|timestamps|plain]
  python tools/2dvideo.py beats --project projects/my-video [--force]
  python tools/2dvideo.py sheet --project projects/my-video [--scale 0.5]
  python tools/2dvideo.py preview --project projects/my-video [--from 0] [--to 30] [--scale 0.5]
  python tools/2dvideo.py render --project projects/my-video [--workers N] [--format jpeg]
  python tools/2dvideo.py mix --project projects/my-video
  python tools/2dvideo.py status --project projects/my-video

Exit codes: 0 ok, 1 stage failed, 2 missing prerequisite (studio / node_modules / python deps).
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STUDIO = ROOT / "2d-video"
VENV_PY = ROOT / ".venv-whisper" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")


def resolve_python(explicit: str | None = None) -> str:
    """Choose one Python for every stage: --python, PYTHON, project venv, host."""
    candidates = [explicit, os.environ.get("PYTHON"), os.environ.get("PYTHON_EXE"), str(VENV_PY), sys.executable]
    for candidate in candidates:
        if candidate and Path(candidate).expanduser().is_file():
            return str(Path(candidate).expanduser().resolve())
    return sys.executable


PY = resolve_python()
_WHISPER_SNAPSHOT = (
    Path.home()
    / ".cache/huggingface/hub/models--Systran--faster-whisper-small.en"
    / "snapshots/d1d751a5f8271d482d14ca55d9e2deeebbae577f"
)
WHISPER_MODEL = Path(os.environ.get("WHISPER_MODEL") or _WHISPER_SNAPSHOT)
NODE_MODULES = ["three", "playwright", "@fontsource/fredoka", "@fontsource/nunito", "@fontsource/playfair-display"]


def fail(msg: str, code: int = 2) -> int:
    print(f"FAIL: {msg}")
    return code


def require_studio() -> bool:
    if not (STUDIO / "render.mjs").is_file():
        print(f"FAIL: студия не найдена в {STUDIO}")
        print("      восстановить: cp -r original/skills/make-2d-video/kit 2d-video")
        return False
    return True


def missing_node_modules() -> list[str]:
    return [p for p in NODE_MODULES if not (STUDIO / "node_modules" / p).is_dir()]


def require_node_modules() -> bool:
    missing = missing_node_modules()
    if missing:
        print("FAIL: не установлены npm-пакеты: " + ", ".join(missing))
        print(f'      установка (нужно разрешение пользователя): cd "{STUDIO}" && npm install')
        print(f'      Chromium: cd "{STUDIO}" && npx playwright install chromium')
        return False
    return True


def require_ffmpeg() -> bool:
    missing = [name for name in ("ffmpeg", "ffprobe") if not shutil.which(name)]
    if missing:
        print("FAIL: не найдены в PATH: " + ", ".join(missing))
        print("      установите ffmpeg/ffprobe (winget install Gyan.FFmpeg) и откройте новый терминал")
        return False
    return True


def require_python_deps(mods: tuple[str, ...] = ("numpy", "scipy")) -> bool:
    """Check packages in the selected interpreter, not in the hosting Python."""
    code = f"import importlib.util as u; print(','.join(m for m in {mods!r} if u.find_spec(m) is None))"
    result = subprocess.run([PY, "-c", code], capture_output=True, text=True)
    missing = [m for m in result.stdout.strip().split(",") if m]
    if result.returncode != 0 or missing:
        print("FAIL: не установлены python-пакеты: " + (", ".join(missing) or "не удалось проверить"))
        print(f'      установка (нужно разрешение пользователя): "{PY}" -m pip install -r "{ROOT / "requirements.txt"}"')
        return False
    return True


def run(cmd: list[str], cwd: Path = STUDIO) -> int:
    print("$ " + " ".join(cmd))
    return subprocess.run(cmd, cwd=str(cwd)).returncode


def project_dir(project: str) -> Path:
    p = Path(project)
    return p if p.is_absolute() else STUDIO / p


def load_json(path: Path):
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


# ---------------------------------------------------------------- stages
def cmd_doctor(_a) -> int:
    if not require_studio():
        return 2
    return run([PY, "tools/doctor.py"])


def cmd_check(_a) -> int:
    if not require_studio():
        return 2
    print(f"Python: {PY}")
    ok = True
    ok = require_ffmpeg() and ok
    ok = require_node_modules() and ok
    ok = require_python_deps(("numpy", "scipy", "faster_whisper")) and ok
    return 0 if ok else 2


def cmd_init(a) -> int:
    if not require_studio() or not require_ffmpeg():
        return 2
    voice = Path(a.voice).expanduser()
    if not voice.is_file():
        return fail(f"файл озвучки не найден: {voice}")
    # new_project.py runs with cwd=2d-video/, so hand it absolute paths
    cmd = [PY, "tools/new_project.py", "--name", a.name, "--voice", str(voice.resolve()),
           "--lang", a.lang, "--speech-lang", a.speech_lang or a.lang,
           "--aspect", a.aspect, "--resolution", a.resolution, "--style", a.style,
           "--fps", str(a.fps), "--title", a.title or a.name]
    if a.script:
        script_path = Path(a.script).expanduser()
        if not script_path.is_file():
            return fail(f"файл сценария не найден: {script_path}")
        cmd += ["--script", str(script_path.resolve())]
    if a.captions:
        cmd.append("--captions")
    return run(cmd)


def cmd_timeline(a) -> int:
    if not require_studio() or not require_ffmpeg():
        return 2
    pdir = project_dir(a.project)
    cfg_path = pdir / "config.json"
    if not cfg_path.is_file():
        return fail(f"нет {cfg_path} — сначала выполните init")
    cfg = load_json(cfg_path)
    script = str(Path(a.script).expanduser().resolve()) if a.script else (
        str(pdir / cfg["script"]) if cfg.get("script") else None)
    mode = a.mode
    if mode == "auto":
        if not script:
            mode = "whisper"
        else:
            mode = "timestamps" if Path(script).suffix.lower() in (".srt", ".vtt", ".json") else "plain"
    if mode == "timestamps":
        return run([PY, "tools/parse_script.py", "--project", a.project, "--script", script])
    if not require_python_deps(("numpy", "faster_whisper")):
        return 2
    if not Path(PY).is_file():
        return fail(f"не найден Python-интерпретатор: {PY}")
    model = Path(a.model).expanduser() if a.model else WHISPER_MODEL
    if not model.is_dir():
        return fail(f"локальная модель Whisper не найдена: {model}")
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
    model_arg = str(model.resolve())
    if mode == "plain":
        return run([PY, "tools/transcribe.py", "--project", a.project, "--script", script,
                    "--lang", a.lang or cfg.get("speechLanguage") or cfg.get("language") or "ru",
                    "--model", model_arg])
    return run([PY, "tools/transcribe.py", "--project", a.project,
                "--lang", a.lang or cfg.get("speechLanguage") or cfg.get("language") or "ru",
                "--model", model_arg])


def cmd_beats(a) -> int:
    if not require_studio():
        return 2
    cmd = [PY, "tools/beats.py", "--project", a.project]
    if a.force:
        cmd.append("--force")
    return run(cmd)


def _render(a, extra: list[str]) -> int:
    if not require_studio() or not require_node_modules():
        return 2
    return run(["node", "render.mjs", "--project", a.project, *extra])


def cmd_sheet(a) -> int:
    return _render(a, ["--sheet", "--scale", str(a.scale)])


def cmd_preview(a) -> int:
    return _render(a, ["--from", str(a.start), "--to", str(a.end), "--scale", str(a.scale)])


def cmd_render(a) -> int:
    extra = []
    if a.workers:
        extra += ["--workers", str(a.workers)]
    if a.format:
        extra += ["--format", a.format]
    if a.gl:
        extra += ["--gl", a.gl]
    return _render(a, extra)


def cmd_mix(a) -> int:
    if not require_studio() or not require_ffmpeg() or not require_python_deps(("numpy", "scipy")):
        return 2
    return run([PY, "audio/mix.py", "--project", a.project])


def cmd_status(a) -> int:
    if not require_studio():
        return 2
    pdir = project_dir(a.project)
    if not (pdir / "config.json").is_file():
        return fail(f"нет {pdir / 'config.json'}")
    cfg = load_json(pdir / "config.json")
    print(f"Проект:      {pdir}")
    print(f"Название:    {cfg.get('title')}")
    print(f"Язык:        {cfg.get('language')} (озвучка: {cfg.get('speechLanguage')})")
    print(f"Формат:      {cfg.get('aspect')} {cfg.get('resolution')} @ {cfg.get('fps')} fps, стиль {cfg.get('style')}")
    print(f"Длительность:{cfg.get('duration')} s")
    voice = pdir / (cfg.get("voiceover") or "")
    print(f"Озвучка:     {'OK' if voice.is_file() else 'НЕТ'} {voice}")

    words = pdir / "timeline" / "words.json"
    print(f"Тайминги:    {'OK' if words.is_file() else 'НЕТ'} {words}")
    shots_path = pdir / "story" / "shots.json"
    if not shots_path.is_file():
        print("Раскадровка:  НЕТ story/shots.json")
        return 0
    story = load_json(shots_path)
    shots = story.get("shots", [])
    print(f"Раскадровка:  {len(shots)} кадров, {story.get('duration')} s, музыка: {len(story.get('music') or [])} секц.")

    registered = set()
    shots_dir = pdir / "scenes" / "shots"
    if shots_dir.is_dir():
        for f in sorted(shots_dir.glob("*.js")):
            registered |= set(re.findall(r"registerShot\(\s*['\"]([^'\"]+)['\"]", f.read_text(encoding="utf-8", errors="replace")))
    ids = [s.get("id") for s in shots]
    missing = [i for i in ids if i not in registered]
    print(f"Сцены:        {len(registered)} registerShot(), покрыто {len(ids) - len(missing)}/{len(ids)} кадров")
    if missing:
        print("  без сцены:  " + ", ".join(missing[:20]) + (" …" if len(missing) > 20 else ""))

    build = pdir / "build"
    for name, label in [("sheets", "контактные листы"), ("stills", "кадры"), ("styles", "сетка стилей"),
                        ("preview.mp4", "превью"), ("video_silent.mp4", "видео без звука"), ("mix.wav", "сведение")]:
        p = build / name
        print(f"  {label:18s} {'OK' if p.exists() else '—'}")
    out = pdir / "out"
    finals = sorted(out.glob("*.mp4")) if out.is_dir() else []
    print(f"  {'итоговый MP4':18s} {finals[0].name if finals else '—'}")

    missing_mods = missing_node_modules()
    print(f"npm-пакеты:   {'OK' if not missing_mods else 'НЕТ: ' + ', '.join(missing_mods)}")
    return 0


# ---------------------------------------------------------------- cli
def main() -> int:
    ap = argparse.ArgumentParser(prog="2dvideo", description="Sharrowkin runner for the 2D Video studio")
    ap.add_argument("--python", default=None, help="Python interpreter for all stages (default: PYTHON, .venv-whisper, host)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("doctor", help="проверить окружение студии").set_defaults(func=cmd_doctor)
    sub.add_parser("check", help="проверить ffmpeg, npm-пакеты и Python-зависимости без запуска этапа").set_defaults(func=cmd_check)

    p = sub.add_parser("init", help="создать проект (new_project.py)")
    p.add_argument("--name", required=True)
    p.add_argument("--voice", required=True)
    p.add_argument("--script")
    p.add_argument("--lang", default="ru")
    p.add_argument("--speech-lang", dest="speech_lang")
    p.add_argument("--aspect", default="16:9", choices=["16:9", "9:16"])
    p.add_argument("--resolution", default="1080p", choices=["720p", "1080p", "1440p", "2160p", "4k"])
    p.add_argument("--style", default="dusk")
    p.add_argument("--fps", type=int, default=24)
    p.add_argument("--title", default="")
    p.add_argument("--captions", action="store_true")
    p.set_defaults(func=cmd_init)

    p = sub.add_parser("timeline", help="тайминги: parse_script.py или transcribe.py")
    p.add_argument("--project", required=True)
    p.add_argument("--script")
    p.add_argument("--mode", default="auto", choices=["auto", "timestamps", "plain", "whisper"])
    p.add_argument("--model", default=None,
                   help="локальная папка CTranslate2 (по умолчанию WHISPER_MODEL или small.en snapshot)")
    p.add_argument("--lang")
    p.set_defaults(func=cmd_timeline)

    p = sub.add_parser("beats", help="бит-лист и черновик shots.json (beats.py)")
    p.add_argument("--project", required=True)
    p.add_argument("--force", action="store_true")
    p.set_defaults(func=cmd_beats)

    p = sub.add_parser("sheet", help="контактный лист по кадрам (render.mjs --sheet)")
    p.add_argument("--project", required=True)
    p.add_argument("--scale", default="0.5")
    p.set_defaults(func=cmd_sheet)

    p = sub.add_parser("preview", help="превью-фрагмент (render.mjs --from/--to)")
    p.add_argument("--project", required=True)
    p.add_argument("--from", dest="start", default="0")
    p.add_argument("--to", dest="end", default="30")
    p.add_argument("--scale", default="0.5")
    p.set_defaults(func=cmd_preview)

    p = sub.add_parser("render", help="полный рендер без звука (render.mjs)")
    p.add_argument("--project", required=True)
    p.add_argument("--workers", type=int)
    p.add_argument("--format", choices=["png", "jpeg"])
    p.add_argument("--gl", choices=["auto", "gpu", "swiftshader"])
    p.set_defaults(func=cmd_render)

    p = sub.add_parser("mix", help="музыка, SFX, сведение и mux (audio/mix.py)")
    p.add_argument("--project", required=True)
    p.set_defaults(func=cmd_mix)

    p = sub.add_parser("status", help="состояние проекта без запуска рендера")
    p.add_argument("--project", required=True)
    p.set_defaults(func=cmd_status)

    a = ap.parse_args()
    if a.python:
        candidate = Path(a.python).expanduser()
        if not candidate.is_file():
            return fail(f"не найден Python-интерпретатор: {candidate}")
        globals()["PY"] = str(candidate.resolve())
    return a.func(a)


if __name__ == "__main__":
    sys.exit(main())
