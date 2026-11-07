# bootstrap.ps1 — report what is missing; NEVER installs anything automatically.
# Usage: powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$venv = Join-Path $root '.venv-whisper\Scripts\python.exe'
$studio = Join-Path $root '2d-video'

Write-Host '2D Video — bootstrap preflight (read-only)'
Write-Host "Root: $root"

Write-Host "`n[1] Node/npm"
node --version
npm --version

Write-Host "`n[2] Python"
python --version

Write-Host "`n[3] ffmpeg"
if (Get-Command ffmpeg -ErrorAction SilentlyContinue) { ffmpeg -version | Select-Object -First 1 } else { Write-Host 'MISSING ffmpeg' }

Write-Host "`n[4] Python venv"
if (Test-Path $venv) {
    & $venv --version
    & $venv -c "import numpy, scipy, faster_whisper; print('numpy', numpy.__version__, '| scipy', scipy.__version__, '| faster-whisper', faster_whisper.__version__)"
} else {
    Write-Host "MISSING $venv"
    Write-Host '  Install with explicit permission:'
    Write-Host '    python -m venv .venv-whisper'
    Write-Host '    .\.venv-whisper\Scripts\python.exe -m pip install -r requirements.txt'
}

Write-Host "`n[5] npm packages / Chromium"
if (Test-Path (Join-Path $studio 'node_modules\three')) {
    Write-Host 'npm packages present'
} else {
    Write-Host 'MISSING npm packages'
    Write-Host '  Install with explicit permission:'
    Write-Host "    cd `"$studio`""
    Write-Host '    npm install'
}
if (Test-Path (Join-Path $studio 'node_modules\playwright')) {
    Push-Location $studio
    try { $chrome = node -e "import('playwright').then(p=>console.log(p.chromium.executablePath()))" 2>$null } finally { Pop-Location }
    if ($chrome -and (Test-Path $chrome)) { Write-Host "Chromium: $chrome" } else { Write-Host 'MISSING Chromium (npx playwright install chromium)' }
}

Write-Host "`n[6] Full environment gate"
if (Test-Path $venv) {
    python .sharrowkin/scripts/check_env.py
} else {
    Write-Host 'SKIP: venv missing; install it first.'
}
Write-Host "`nNo installation was performed. Report generated at $(Get-Date -Format o)"
