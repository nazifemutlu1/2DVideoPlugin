# Patches: намеренные отличия рабочей студии от оригинала

Эти патчи отделяют осознанные изменения от «оригинального kit». Они нужны, чтобы `verify_kit` не заставлял blindly копировать оригиналы и не сносил security/CSP/offline-поведение.

Применять **из каталога `2d-video/`**. На Windows с глобальным `core.autocrlf=true` обязательно отключать autocrlf, иначе `git apply` запишет CRLF и хеши не совпадут:

```powershell
git -c core.autocrlf=false apply ..\patches\player-csp.patch
git -c core.autocrlf=false apply ..\patches\transcribe-offline.patch
git -c core.autocrlf=false apply ..\patches\render-http-security.patch
git -c core.autocrlf=false apply ..\patches\runtime-python.patch
git -c core.autocrlf=false apply ..\patches\new-project-safety.patch
git -c core.autocrlf=false apply ..\patches\error-handling.patch
git -c core.autocrlf=false apply ..\patches\media-fixes.patch
```

Проверка обратимости:

```powershell
git -c core.autocrlf=false apply --reverse --check ..\patches\player-csp.patch
git -c core.autocrlf=false apply --reverse --check ..\patches\transcribe-offline.patch
git -c core.autocrlf=false apply --reverse --check ..\patches\render-http-security.patch
git -c core.autocrlf=false apply --reverse --check ..\patches\runtime-python.patch
git -c core.autocrlf=false apply --reverse --check ..\patches\new-project-safety.patch
git -c core.autocrlf=false apply --reverse --check ..\patches\error-handling.patch
git -c core.autocrlf=false apply --reverse --check ..\patches\media-fixes.patch
```

## Состав

| Патч | Файл | Зачем | SHA-256 результата |
|---|---|---|---|
| `player-csp.patch` | `player.html` | CSP: запрет внешних скриптов/фреймов, разрешён import map по SHA-256 | `8a5a4a2bf897dd56d355e5c4466af5d4ea4afd554bb57f62c447affcf301d2ce` |
| `transcribe-offline.patch` | `tools/transcribe.py` | локальная CTranslate2-модель, `--audio` обязателен, `--model` локальный; `WHISPER_DEVICE`, понятные ошибки | `c36a633d1249e49d5d01ee2a436bbc54a2fb7b8a58ac18bebe3fba1aa30232cb` |
| `render-http-security.patch` | `render.mjs` | T1.2C: loopback, allowlist, realpath, route guard, GET/HEAD, self-check, ffmpeg/worker checks | `a7d11bd68464bbaf81f0dd4df34f1d6407706146a4139cdf2c8ebf60ea8d6e37` |
| `runtime-python.patch` | `tools/common.py`, `tools/doctor.py` | R2/R11: единый Python/venv, ленивый numpy, явный интерпретатор, GPU/device, атомарный timeline | `common` `1bceb5f4…`, `doctor` `23be6329…` |
| `new-project-safety.patch` | `tools/new_project.py` | R7: slug-only, containment, atomарное создание, force-update с rollback | `3149f32845cb9206194174ff987afbcdfecbcbd3d4e17e943970f4bf15afec11` |
| `error-handling.patch` | `tools/parse_script.py`, `tools/beats.py` | R10: пустые/битые тайминги, VTT settings, finite/intervals, exit 2 | `parse` `c924861c…`, `beats` `4f066a56…` |
| `media-fixes.patch` | `engine/core.js`, `engine/player.js`, `engine/styles.js`, `audio/music.py`, `audio/mix.py` | R12/R16: Unicode wordTime, детерминированный whip, короткая музыка, отказ обрезки voice, style `studio3d` | `core` `2a54e4aa…`, `player` `35aa5b54…`, `styles` `7a5b1496…`, `music` `5be68409…`, `mix` `f000af05…` |

Исходные хеши (для сверки):

| Файл | SHA-256 оригинала |
|---|---|
| `player.html` | `bcec243e446e9aca1c19ff48e1969bef467813882aa74ea8dbf00a27eb9f2654` |
| `tools/transcribe.py` | `208b3284897d38abacc70785d8d6c535c39bba43b67c07668c78884f9466e347` |
| `render.mjs` | `1d33ddb3e2fc9b0719a06e333c3b2762d506c281a9f301a176c4648b44ba0a35` |

## Важно

- `render-http-security.patch` — **только `render.mjs`**. CSP вынесен в отдельный `player-csp.patch`, чтобы патчи применялись независимо.
- Исходный внешний патч T1.2C содержал и `player.html`, и `render.mjs`; здесь он разделён.
- Не запускать `backups/t1.2f-*/restore.ps1` для «починки» тестов: он вернёт незащищённые `render.mjs`/`player.html`.
- `verify_kit` должен считать эти тринадцать файлов ожидаемо изменёнными (R1/R2/R7/R10/R12/R16), а не требовать копирования оригинала.
