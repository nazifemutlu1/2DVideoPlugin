"""Regression tests for --project path normalization."""

from __future__ import annotations

import importlib.util
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STUDIO = ROOT / "2d-video"
CLI = ROOT / "tools" / "2dvideo.py"


def load_cli():
    spec = importlib.util.spec_from_file_location("twodvideo_cli", CLI)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class ProjectPathTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.cli = load_cli()

    def test_resolution_variants(self) -> None:
        expected = (STUDIO / "projects" / "whisper_en_e2e").resolve()
        self.assertEqual(self.cli.project_dir("projects/whisper_en_e2e"), expected)
        self.assertEqual(self.cli.project_dir("./projects/whisper_en_e2e"), expected)
        self.assertEqual(self.cli.project_dir("2d-video/projects/whisper_en_e2e"), expected)
        self.assertEqual(self.cli.project_dir(str(expected)), expected)

    def test_status_from_root_variants(self) -> None:
        for project in ("projects/whisper_en_e2e", "2d-video/projects/whisper_en_e2e", str(STUDIO / "projects" / "whisper_en_e2e")):
            with self.subTest(project=project):
                result = subprocess.run(
                    [sys.executable, str(CLI), "status", "--project", project],
                    cwd=ROOT,
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                )
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_status_from_studio(self) -> None:
        result = subprocess.run(
            [sys.executable, str(CLI), "status", "--project", "projects/whisper_en_e2e"],
            cwd=STUDIO,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertNotIn("2d-video\\2d-video", result.stdout)


if __name__ == "__main__":
    unittest.main()
