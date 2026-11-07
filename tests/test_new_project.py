"""Regression tests for tools/new_project.py path safety and --force."""

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


class NewProjectSafetyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="2dvideo-r7-"))
        (self.tmp / "tools").mkdir()
        (self.tmp / "projects").mkdir()
        shutil.copy2(STUDIO / "tools" / "new_project.py", self.tmp / "tools" / "new_project.py")
        shutil.copy2(STUDIO / "tools" / "common.py", self.tmp / "tools" / "common.py")

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp, ignore_errors=True)

    def run_init(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, "tools/new_project.py", *args],
            cwd=self.tmp,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )

    def test_rejects_paths_and_bad_slugs(self) -> None:
        for name in ("../escape", "..\\escape", "bad name", "кириллица", "a" * 65):
            with self.subTest(name=name):
                result = self.run_init("--name", name, "--voice", str(VOICE))
                self.assertEqual(result.returncode, 2, result.stderr)
                self.assertFalse((self.tmp / "escape").exists())

    def test_creates_new_project(self) -> None:
        result = self.run_init("--name", "safe_project", "--voice", str(VOICE), "--title", "Тест")
        self.assertEqual(result.returncode, 0, result.stderr)
        target = self.tmp / "projects" / "safe_project"
        self.assertTrue((target / "config.json").is_file())
        self.assertTrue((target / "input" / "voiceover.wav").is_file())
        self.assertEqual(json.loads((target / "config.json").read_text(encoding="utf-8"))["title"], "Тест")
        self.assertEqual(list((self.tmp / "projects").glob(".tmp-*")), [])

    def test_refuses_existing_without_force(self) -> None:
        args = ("--name", "safe_project", "--voice", str(VOICE))
        self.assertEqual(self.run_init(*args).returncode, 0)
        result = self.run_init(*args)
        self.assertEqual(result.returncode, 2, result.stdout)
        self.assertIn("--force", result.stdout)

    def test_force_preserves_scenes(self) -> None:
        args = ("--name", "safe_project", "--voice", str(VOICE))
        self.assertEqual(self.run_init(*args).returncode, 0)
        sentinel = self.tmp / "projects" / "safe_project" / "scenes" / "shots" / "keep.js"
        sentinel.write_text("// sentinel\n", encoding="utf-8")
        result = self.run_init(*args, "--force", "--title", "Updated")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue(sentinel.is_file())
        cfg = json.loads((self.tmp / "projects" / "safe_project" / "config.json").read_text(encoding="utf-8"))
        self.assertEqual(cfg["title"], "Updated")

    def test_failed_probe_leaves_no_project_or_temp(self) -> None:
        bad_audio = self.tmp / "not-audio.txt"
        bad_audio.write_text("not audio\n", encoding="utf-8")
        result = self.run_init("--name", "broken", "--voice", str(bad_audio))
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.tmp / "projects" / "broken").exists())
        self.assertEqual(list((self.tmp / "projects").glob(".tmp-*")), [])


if __name__ == "__main__":
    unittest.main()
