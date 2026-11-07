"""Единая проверка проекта: синтаксис Python, синтаксис ESM, целостность студии.

    npm test            (или python .sharrowkin/scripts/check_all.py)

Код возврата 0 — все проверки прошли, 1 — есть падения.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

STEPS = [
    ("python syntax", [sys.executable, ".sharrowkin/scripts/check_python.py"], ROOT),
    ("esm syntax", ["node", "--experimental-vm-modules", ".sharrowkin/scripts/check_syntax.mjs"], ROOT),
    ("kit integrity", [sys.executable, "tools/verify_kit.py"], ROOT / "2d-video"),
]


def main() -> int:
    failed = []
    for name, cmd, cwd in STEPS:
        print(f"== {name}")
        result = subprocess.run(cmd, cwd=str(cwd))
        if result.returncode != 0:
            failed.append(name)
    print()
    if failed:
        print(f"CHECK FAILED: {', '.join(failed)}")
        return 1
    print(f"CHECK PASSED: {len(STEPS)}/{len(STEPS)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
