"""Regression tests for user-facing errors and prerequisite exit codes."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STUDIO = ROOT / "2d-video"
VOICE = STUDIO / "projects" / "_smoke" / "input" / "voiceover.wav"


class ErrorHandlingTests(unittest.TestCase):
    def setUp(self) -> None:
        self.projects = []
        self.project = Path(tempfile.mkdtemp(prefix="_r10_", dir=STUDIO / "projects"))
        self.projects.append(self.project)
        (self.project / "input").mkdir()
        (self.project / "timeline").mkdir()
        shutil.copy2(VOICE, self.project / "input" / "voiceover.wav")
        cfg = {
            "language": "ru",
            "speechLanguage": "ru",
            "title": "R10",
            "voiceover": "input/voiceover.wav",
            "duration": 8.0,
            "style": "dusk",
        }
        (self.project / "config.json").write_text(json.dumps(cfg), encoding="utf-8")

    def tearDown(self) -> None:
        for p in self.projects:
            shutil.rmtree(p, ignore_errors=True)

    def run_tool(self, name: str, *args: str, env: dict | None = None) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(STUDIO / "tools" / name), *args],
            cwd=STUDIO,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            env=env,
        )

    def test_empty_srt_is_user_error(self) -> None:
        script = self.project / "empty.srt"
        script.write_text("", encoding="utf-8")
        result = self.run_tool("parse_script.py", "--project", str(self.project), "--script", str(script))
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("no timestamps", result.stdout)

    def test_bad_json_is_user_error(self) -> None:
        script = self.project / "bad.json"
        script.write_text('{"bad": ', encoding="utf-8")
        result = self.run_tool("parse_script.py", "--project", str(self.project), "--script", str(script))
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("invalid script", result.stdout)

    def test_beats_empty_words_is_user_error(self) -> None:
        (self.project / "timeline" / "words.json").write_text('{"words": []}', encoding="utf-8")
        result = self.run_tool("beats.py", "--project", str(self.project))
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("no words", result.stdout)

    def test_beats_bad_json_is_user_error(self) -> None:
        (self.project / "timeline" / "words.json").write_text("{bad", encoding="utf-8")
        result = self.run_tool("beats.py", "--project", str(self.project))
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("cannot read", result.stdout)

    def test_transcribe_without_audio_is_usage_error(self) -> None:
        result = self.run_tool("transcribe.py", "--project", str(self.project))
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)

    def test_check_reports_missing_ffmpeg(self) -> None:
        env = os.environ.copy()
        env["PATH"] = ""
        result = subprocess.run(
            [sys.executable, str(ROOT / "tools" / "2dvideo.py"), "check"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            env=env,
        )
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("ffmpeg", (result.stdout + result.stderr).lower())


if __name__ == "__main__":
    unittest.main()
