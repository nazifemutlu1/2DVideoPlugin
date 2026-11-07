"""Security regression tests for the renderer's local HTTP server."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STUDIO = ROOT / "2d-video"


class RendererSecurityTests(unittest.TestCase):
    def test_self_check(self) -> None:
        result = subprocess.run(
            ["node", "render.mjs", "--project", "examples/reaction-time", "--self-check"],
            cwd=STUDIO,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=120,
        )
        output = result.stdout + result.stderr
        self.assertEqual(result.returncode, 0, output)
        self.assertIn("SELF-CHECK PASS", output)
        for expected in (
            "GET /player.html",
            "HEAD /player.html",
            "GET /__manifest",
            "GET /project/config.json",
            "GET /etc/passwd blocked",
            "traversal .. blocked",
            "encoded traversal blocked",
            "engine traversal blocked",
            "POST /player.html blocked",
            "CSP import-map hash",
        ):
            self.assertIn(expected, output)


if __name__ == "__main__":
    unittest.main()
