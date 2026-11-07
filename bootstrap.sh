#!/usr/bin/env bash
# bootstrap.sh — report what is missing; NEVER installs anything automatically.
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT" || exit 1
VENV="$ROOT/.venv-whisper/bin/python"
STUDIO="$ROOT/2d-video"

echo "2D Video — bootstrap preflight (read-only)"
echo "Root: $ROOT"

echo
echo "[1] Node/npm"
node --version 2>/dev/null || echo "MISSING node"
npm --version 2>/dev/null || echo "MISSING npm"

echo
echo "[2] Python"
python3 --version 2>/dev/null || python --version 2>/dev/null || echo "MISSING python"

echo
echo "[3] ffmpeg"
if command -v ffmpeg >/dev/null 2>&1; then ffmpeg -version 2>/dev/null | head -1; else echo "MISSING ffmpeg"; fi

echo
echo "[4] Python venv"
if [ -x "$VENV" ]; then
  "$VENV" --version
  "$VENV" -c "import numpy, scipy, faster_whisper; print('numpy', numpy.__version__, '| scipy', scipy.__version__, '| faster-whisper', faster_whisper.__version__)"
else
  echo "MISSING $VENV"
  echo "  Install with explicit permission:"
  echo "    python3 -m venv .venv-whisper"
  echo "    ./.venv-whisper/bin/python -m pip install -r requirements.txt"
fi

echo
echo "[5] npm packages / Chromium"
if [ -d "$STUDIO/node_modules/three" ]; then
  echo "npm packages present"
else
  echo "MISSING npm packages"
  echo "  Install with explicit permission:"
  echo "    cd \"$STUDIO\""
  echo "    npm install"
fi
if [ -d "$STUDIO/node_modules/playwright" ]; then
  CHROME="$(cd "$STUDIO" && node -e "import('playwright').then(p=>console.log(p.chromium.executablePath()))" 2>/dev/null)"
  if [ -n "$CHROME" ] && [ -f "$CHROME" ]; then echo "Chromium: $CHROME"; else echo "MISSING Chromium (npx playwright install chromium)"; fi
fi

echo
echo "[6] Full environment gate"
if [ -x "$VENV" ]; then
  python3 .sharrowkin/scripts/check_env.py
else
  echo "SKIP: venv missing; install it first."
fi
echo
echo "No installation was performed."
