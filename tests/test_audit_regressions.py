"""Regressions for the independent audit findings."""

from __future__ import annotations

import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STUDIO = ROOT / "2d-video"
VENV_PY = ROOT / ".venv-whisper" / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
VOICE = STUDIO / "projects" / "_smoke" / "input" / "voiceover.wav"


def load_parser():
    path = STUDIO / "tools" / "parse_script.py"
    spec = importlib.util.spec_from_file_location("audit_parse_script", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class AuditRegressionTests(unittest.TestCase):
    def test_wordtime_unicode(self) -> None:
        code = (
            "import {E,wordTime} from './2d-video/engine/core.js';"
            "E.words=[{word:'Привет',start:1,end:2},{word:'мир',start:3,end:4}];"
            "console.log(wordTime('мир'),wordTime('несуществующее'),wordTime(''));"
        )
        result = subprocess.run(["node", "--input-type=module", "-e", code], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), "3 null null")

    def test_vtt_settings_are_not_caption_text(self) -> None:
        parser = load_parser()
        cues = parser.parse_srt_vtt("WEBVTT\n\n00:00:01.000 --> 00:00:02.000 align:start position:0%\nHello")
        self.assertEqual(cues, [{"start": 1.0, "end": 2.0, "text": "Hello"}])

    def test_infinite_and_reverse_intervals_are_rejected(self) -> None:
        parser = load_parser()
        with self.assertRaises(ValueError):
            parser.to_sec("Infinity")
        with self.assertRaises(ValueError):
            parser.spread_words([{"start": 5, "end": 2, "text": "Hello"}], 8)

    def test_short_music_does_not_crash(self) -> None:
        if not VENV_PY.is_file():
            self.skipTest("venv not available")
        code = "import sys; sys.path.insert(0,'2d-video/audio'); import music; a=music.render_score(music.default_plan(2),2); print(a.shape, float(abs(a).max()))"
        result = subprocess.run([str(VENV_PY), "-B", "-c", code], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("(120000, 2)", result.stdout)

    def test_mix_refuses_a_voice_longer_than_story(self) -> None:
        if not VENV_PY.is_file():
            self.skipTest("venv not available")
        tmp = Path(tempfile.mkdtemp(prefix="2dvideo-audit-mix-"))
        try:
            (tmp / "input").mkdir()
            (tmp / "story").mkdir()
            shutil.copy2(VOICE, tmp / "input" / "voiceover.wav")
            (tmp / "config.json").write_text(json.dumps({"voiceover": "input/voiceover.wav", "music": {"enabled": False}, "sfx": {"enabled": False}, "loudness": -14}), encoding="utf-8")
            (tmp / "story" / "shots.json").write_text(json.dumps({"duration": 2.0, "shots": [{"start": 0, "end": 2}]}), encoding="utf-8")
            result = subprocess.run([str(VENV_PY), "-B", str(STUDIO / "audio" / "mix.py"), "--project", str(tmp), "--no-music", "--no-sfx"], capture_output=True, text=True, encoding="utf-8")
            self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
            self.assertIn("voiceover is", result.stdout + result.stderr)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
