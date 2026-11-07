"""Reject stale runtime tool names in skill docs.

    python .sharrowkin/scripts/check_skills.py

The current runtime is DSH. Skills must not tell the agent to call
`run_command`, `run_background`, `process_output`, `view_image`, `ask_user`
or slash commands.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SKILLS = ROOT / ".sharrowkin" / "skills"

CHECKS = [
    (re.compile(r"\bAskUserQuestion\b"), "use ask_user_question"),
    (re.compile(r"\bask_user\b"), "use ask_user_question"),
    (re.compile(r"\brun_command\b"), "use bash/pwsh"),
    (re.compile(r"\brun_background\b"), "use a background job + job_output"),
    (re.compile(r"\bprocess_output\b"), "use job_output"),
    (re.compile(r"\bview_image\b"), "use read_image"),
    (re.compile(r"(?<![\w])/(?:new-video|video-styles|render-video|video-sound)\b"), "no slash commands"),
]


def main() -> int:
    files = sorted(SKILLS.rglob("*.md")) if SKILLS.is_dir() else []
    hits = []
    for path in files:
        text = path.read_text(encoding="utf-8")
        for lineno, line in enumerate(text.splitlines(), 1):
            for rx, hint in CHECKS:
                if rx.search(line):
                    hits.append((path.relative_to(ROOT).as_posix(), lineno, hint, line.strip()))
    for rel, lineno, hint, line in hits:
        print(f"FAIL {rel}:{lineno}: {hint}: {line[:120]}")
    print(f"Skills runtime: {len(files)} files, {len(hits)} stale reference(s).")
    return 1 if hits else 0


if __name__ == "__main__":
    sys.exit(main())
