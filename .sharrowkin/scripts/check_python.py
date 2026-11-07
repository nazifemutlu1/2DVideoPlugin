"""Проверка синтаксиса всех Python-файлов проекта без записи __pycache__.

    python .sharrowkin/scripts/check_python.py
"""

from __future__ import annotations

import ast
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TARGETS = ["original", "2d-video", "tools", ".sharrowkin/scripts"]
SKIP = {"node_modules", ".git", "build", "out", "projects", "__pycache__"}


def walk(base: Path):
    if not base.exists():
        return
    for entry in sorted(base.iterdir()):
        if entry.name in SKIP:
            continue
        if entry.is_dir():
            yield from walk(entry)
        elif entry.suffix == ".py":
            yield entry


def main() -> int:
    files = [f for t in TARGETS for f in walk(ROOT / t)]
    ok = 0
    failures = []
    for f in files:
        rel = f.relative_to(ROOT).as_posix()
        try:
            ast.parse(f.read_text(encoding="utf-8"), filename=rel)
            ok += 1
        except SyntaxError as e:
            failures.append(f"{rel}:{e.lineno}: {e.msg}")
    for line in failures:
        print(f"FAIL {line}")
    print(f"Python syntax: {ok}/{len(files)} OK, {len(failures)} FAIL")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
