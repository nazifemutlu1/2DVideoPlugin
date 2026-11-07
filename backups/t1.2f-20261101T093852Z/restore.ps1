# T1.2F rollback: restore the two original 2DVideoPlugin renderer sources.
param([string]$Target = 'F:\AI\2DVideoPlugin\2d-video')
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$expected = @{ 'render.mjs' = '1d33ddb3e2fc9b0719a06e333c3b2762d506c281a9f301a176c4648b44ba0a35'; 'player.html' = 'bcec243e446e9aca1c19ff48e1969bef467813882aa74ea8dbf00a27eb9f2654' }
foreach ($name in 'render.mjs','player.html') {
  Copy-Item (Join-Path $here $name) (Join-Path $Target $name) -Force
  $actual = (Get-FileHash (Join-Path $Target $name) -Algorithm SHA256).Hash.ToLower()
  if ($actual -ne $expected[$name]) { throw ('rollback hash mismatch for ' + $name + ': ' + $actual) }
  Write-Output ('restored ' + $name + ' ' + $actual)
}
Write-Output 'rollback complete'