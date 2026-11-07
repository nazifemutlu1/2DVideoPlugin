"""Environment gate for the 2D Video studio: required runtime, packages, Chromium, ffmpeg.

    python .sharrowkin/scripts/check_env.py

This intentionally does not install anything. It only reports whether the
already-installed environment can run the pipeline. The canonical Python is
`.venv-whisper` when present; this script never imports numpy/scipy into the
host interpreter.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STUDIO = ROOT / "2d-video"
VENV = ROOT / ".venv-whisper" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
NODE_PACKAGES = ["three", "playwright", "@fontsource/fredoka", "@fontsource/nunito", "@fontsource/playfair-display"]

failures: list[str] = []
rows: list[tuple[str, str, bool]] = []


def run(cmd: list[str], cwd: Path | None = None, timeout: int = 60) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        cmd,
        cwd=str(cwd) if cwd else None,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
    )


def add(name: str, detail: str, ok: bool) -> None:
    rows.append((name, detail, ok))
    if not ok:
        failures.append(name)


def check_node() -> None:
    node = shutil.which("node")
    if not node:
        add("Node.js >= 18", "node not found", False)
        return
    try:
        out = run(["node", "--version"]).stdout.strip()
        major = int(out.lstrip("v").split(".")[0])
        add("Node.js >= 18", out, major >= 18)
    except Exception as exc:  # noqa: BLE001
        add("Node.js >= 18", str(exc), False)


def check_packages() -> None:
    pkg = STUDIO / "package.json"
    if not pkg.is_file():
        add("npm package manifest", f"missing {pkg}", False)
        return
    try:
        data = json.loads(pkg.read_text(encoding="utf-8"))
        deps = data.get("dependencies", {})
        missing = [name for name in NODE_PACKAGES if name not in deps]
        add("npm package manifest", "package.json + dependencies", not missing)
        if missing:
            add("npm dependencies declared", ", ".join(missing), False)
    except Exception as exc:  # noqa: BLE001
        add("npm package manifest", str(exc), False)

    for name in NODE_PACKAGES:
        add(f"npm: {name}", "node_modules/" + name, (STUDIO / "node_modules" / name).is_dir())
    add("npm: package-lock", "package-lock.json", (STUDIO / "package-lock.json").is_file())


def check_ffmpeg() -> None:
    for name in ("ffmpeg", "ffprobe"):
        exe = shutil.which(name)
        if not exe:
            add(name, "not found on PATH", False)
            continue
        try:
            first = run([exe, "-version"]).stdout.splitlines()[0]
            add(name, first, True)
        except Exception as exc:  # noqa: BLE001
            add(name, str(exc), False)


def check_python() -> None:
    py = VENV if VENV.is_file() else Path(sys.executable)
    add("Python interpreter", f"{py} ({'venv' if py == VENV else 'host'})", py.is_file())
    if not VENV.is_file():
        add("Python venv", f"missing {VENV}", False)
    code = "import importlib.util as u; print(' '.join(f'{m}={bool(u.find_spec(m))}' for m in ('numpy','scipy')))"
    try:
        proc = run([str(py), "-c", code], timeout=120)
        out = proc.stdout.strip()
        values = out.split()
        ok = proc.returncode == 0 and len(values) == 2 and all(v.endswith("True") for v in values)
        add("Python packages (core/TTS)", f"{out or '<empty>'} (exit {proc.returncode})", ok)
    except Exception as exc:  # noqa: BLE001
        add("Python packages (core/TTS)", str(exc), False)
    try:
        legacy = run([str(py), "-c", "import importlib.util as u; print(bool(u.find_spec('faster_whisper')))"], timeout=120).stdout.strip() == "True"
        add("Whisper legacy (optional)", "installed" if legacy else "not installed; TTS path does not need it", True)
    except Exception as exc:  # noqa: BLE001
        add("Whisper legacy (optional)", str(exc), True)


def check_chromium() -> None:
    script = "import('playwright').then(p=>{console.log(p.chromium.executablePath())}).catch(e=>{console.error(e.message);process.exit(1)})"
    try:
        result = run(["node", "-e", script], cwd=STUDIO, timeout=60)
        path = result.stdout.strip().splitlines()[-1] if result.stdout.strip() else ""
        add("Chromium for Playwright", path or result.stderr.strip()[:160], result.returncode == 0 and bool(path) and Path(path).is_file())
    except Exception as exc:  # noqa: BLE001
        add("Chromium for Playwright", str(exc), False)


def main() -> int:
    print("2D Video — environment gate\n")
    check_node()
    check_packages()
    check_ffmpeg()
    check_python()
    check_chromium()

    for name, detail, ok in rows:
        print(f"  {'OK ' if ok else 'MISSING '}{name:42s} {detail}")

    print()
    if failures:
        print("ENV FAILED: " + ", ".join(failures))
        print("Nothing was installed. Fix the MISSING lines, then re-run this check.")
        return 1
    print(f"ENV PASSED: {len(rows)} checks.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
