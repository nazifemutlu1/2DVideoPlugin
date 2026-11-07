"""tools/verify_kit.py — verify the studio files against the tested working copy.

  python tools/verify_kit.py                 # verify 2d-video/ in place
  python tools/verify_kit.py --root <dir>    # verify a copy (used by the self-test)

Some files are intentionally different from the original plugin kit:
  player.html         — CSP
  render.mjs          — T1.2C loopback/security hardening
  tools/transcribe.py — local/offline Whisper model
  tools/common.py     — lazy numpy import
  tools/doctor.py     — explicit selected interpreter
They are listed in PATCHED below. A mismatch is a failure unless it is one of
those files with the expected patched hash. If you intentionally change a
patched file, update EXPECTED and patches/README.md; do not blindly copy the
original file back.

(Line endings and leading/trailing blank lines are ignored.)
"""
import argparse
import hashlib
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PATCHED = {
    "player.html": "player-csp.patch",
    "render.mjs": "render-http-security.patch",
    "tools/transcribe.py": "transcribe-offline.patch",
    "tools/common.py": "runtime-python.patch",
    "tools/doctor.py": "runtime-python.patch",
    "tools/new_project.py": "new-project-safety.patch",
    "tools/parse_script.py": "error-handling.patch",
    "tools/beats.py": "error-handling.patch",
}

EXPECTED = {
    "audio/dsp.py": "589d305d94d8acc3",
    "audio/mix.py": "a48273c523b68c3b",
    "audio/music.py": "2fb3ce1df2fe5c7d",
    "audio/sfx.py": "2fa56141e2423718",
    "engine/core.js": "cb84a01d65e347a9",
    "engine/fx2d.js": "d09f93f6d44366fa",
    "engine/player.js": "a4555d1692bf274d",
    "engine/rig2d.js": "ec2a665e0aa8ffed",
    "engine/styles.js": "66b00b1b5f87326f",
    "engine/three-kit.js": "02e249e302b95420",
    "engine/ui2d.js": "a54167c66d043de7",
    "examples/reaction-time/config.json": "9ee341c65b3cfe9a",
    "examples/reaction-time/scenes/cast.js": "e4faad3c508a5cf5",
    "examples/reaction-time/scenes/sets/cafe.js": "fb9adaa553e87b74",
    "examples/reaction-time/scenes/sets/lab.js": "a2da3ca0fff2d8c4",
    "examples/reaction-time/scenes/shots/01_cafe.js": "931e9c360ba052b3",
    "examples/reaction-time/scenes/shots/02_orbit3d.js": "77897bcae80a501e",
    "examples/reaction-time/scenes/shots/03_explain.js": "c22f0e7a8f505c78",
    "examples/reaction-time/story/bible.md": "e22b689a54461b41",
    "examples/reaction-time/story/shots.json": "9b1921e8e42c2498",
    "package.json": "20ec9c70ce291e3c",
    # Patched intentionally; see PATCHED above and patches/README.md.
    "player.html": "22a3882b61abe1a1",
    "render.mjs": "6664e662ce55fb3f",
    "tools/beats.py": "4f066a561c9d6d1d",
    "tools/common.py": "719d9452a233a962",
    "tools/doctor.py": "c59b82f9f6ab9569",
    "tools/new_project.py": "aca57b03253da28a",
    "tools/parse_script.py": "266581e03bdebcee",
    "tools/transcribe.py": "a4d710366c0afe61",
}


def digest(path: str) -> str:
    with open(path, "rb") as fh:
        data = fh.read().replace(b"\r\n", b"\n").strip()
    return hashlib.sha256(data).hexdigest()[:16]


def main() -> int:
    ap = argparse.ArgumentParser(description="Verify the 2D Video studio files.")
    ap.add_argument("--root", default=ROOT, help="studio root to verify (default: %(default)s)")
    args = ap.parse_args()
    root = os.path.abspath(args.root)

    bad = 0
    for rel, want in EXPECTED.items():
        path = os.path.join(root, *rel.split("/"))
        if not os.path.exists(path):
            print(f"MISSING   {rel}")
            bad += 1
            continue
        got = digest(path)
        if got != want:
            patch = PATCHED.get(rel)
            if patch:
                print(f"MISMATCH  {rel}  (patched; expected {want}, got {got}; see patches/{patch})")
            else:
                print(f"MISMATCH  {rel}  (expected {want}, got {got})")
            bad += 1

    total = len(EXPECTED)
    print(f"{total - bad}/{total} files verified; {len(PATCHED)} intentional patches.")
    if bad:
        print("If a mismatch is intentional, update EXPECTED and patches/README.md. Do not copy originals blindly.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
