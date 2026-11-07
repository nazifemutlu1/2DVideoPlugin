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
```

Проверка обратимости:

```powershell
git -c core.autocrlf=false apply --reverse --check ..\patches\player-csp.patch
git -c core.autocrlf=false apply --reverse --check ..\patches\transcribe-offline.patch
git -c core.autocrlf=false apply --reverse --check ..\patches\render-http-security.patch
git -c core.autocrlf=false apply --reverse --check ..\patches\runtime-python.patch
git -c core.autocrlf=false apply --reverse --check ..\patches\new-project-safety.patch
git -c core.autocrlf=false apply --reverse --check ..\patches\error-handling.patch
```

## Состав

| Патч | Файл | Зачем | SHA-256 результата |
|---|---|---|---|
| `player-csp.patch` | `player.html` | CSP: запрет внешних скриптов/фреймов, разрешён import map по SHA-256 | `8a5a4a2bf897dd56d355e5c4466af5d4ea4afd554bb57f62c447affcf301d2ce` |
| `transcribe-offline.patch` | `tools/transcribe.py` | локальная CTranslate2-модель, `--audio` обязателен, `--model` локальный; понятные ошибки | `b662a21b667f1a4e3fa4d994bc3d02e5005f4e2b0561d75b5144f96442e3d7cf` |
| `render-http-security.patch` | `render.mjs` | T1.2C: только `127.0.0.1`, allowlist, realpath, route guard, GET/HEAD, `--self-check`, ffmpeg check | `797d907110d00547e020e14dd727eb8d92892a788f4c7369001c2cb65057a452` |
| `runtime-python.patch` | `tools/common.py`, `tools/doctor.py` | R2: единый Python/venv, ленивый numpy, явный интерпретатор в doctor | `common` `719d9452…`, `doctor` `d6b56eb3…` |
| `new-project-safety.patch` | `tools/new_project.py` | R7: slug-only `--name`, containment, атомарное создание, `--force` без удаления сцен | `ad1b1d45ddb66ac1f1b09000b98743d9e3f5bc39bffc10b918c09ee0703cac92` |
| `error-handling.patch` | `tools/parse_script.py`, `tools/beats.py` | R10: понятные ошибки на пустых/битых таймингах, exit 2 | `parse` `266581e0…`, `beats` `4f066a56…` |

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
- `verify_kit` должен считать эти восемь файлов ожидаемо изменёнными (R1/R2/R7/R10), а не требовать копирования оригинала.
