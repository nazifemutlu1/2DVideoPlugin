# Patches: намеренные отличия рабочей студии от оригинала

Эти патчи отделяют осознанные изменения от «оригинального kit». Они нужны, чтобы `verify_kit` не заставлял blindly копировать оригиналы и не сносил security/CSP/offline-поведение.

Применять **из каталога `2d-video/`**. На Windows с глобальным `core.autocrlf=true` обязательно отключать autocrlf, иначе `git apply` запишет CRLF и хеши не совпадут:

```powershell
git -c core.autocrlf=false apply ..\patches\player-csp.patch
git -c core.autocrlf=false apply ..\patches\transcribe-offline.patch
git -c core.autocrlf=false apply ..\patches\render-http-security.patch
git -c core.autocrlf=false apply ..\patches\runtime-python.patch
git -c core.autocrlf=false apply ..\patches\new-project-safety.patch
```

Проверка обратимости:

```powershell
git -c core.autocrlf=false apply --reverse --check ..\patches\player-csp.patch
git -c core.autocrlf=false apply --reverse --check ..\patches\transcribe-offline.patch
git -c core.autocrlf=false apply --reverse --check ..\patches\render-http-security.patch
git -c core.autocrlf=false apply --reverse --check ..\patches\runtime-python.patch
git -c core.autocrlf=false apply --reverse --check ..\patches\new-project-safety.patch
```

## Состав

| Патч | Файл | Зачем | SHA-256 результата |
|---|---|---|---|
| `player-csp.patch` | `player.html` | CSP: запрет внешних скриптов/фреймов, разрешён import map по SHA-256 | `8a5a4a2bf897dd56d355e5c4466af5d4ea4afd554bb57f62c447affcf301d2ce` |
| `transcribe-offline.patch` | `tools/transcribe.py` | локальная CTranslate2-модель, без автоскачивания; `--audio` обязателен, `--model` указывает на локальный каталог | `2024bf4e364bf4a66dfd59e6d9e9bea687a76f7c229f62230651c89000d5be50` |
| `render-http-security.patch` | `render.mjs` | T1.2C: только `127.0.0.1`, allowlist, realpath containment, route guard, GET/HEAD + `--self-check` | `b6a6aff9ce18158a786d80d3e4ea40146e0a4ffc3f8f5af26592e6ff5a637b50` |
| `runtime-python.patch` | `tools/common.py`, `tools/doctor.py` | R2: единый Python/venv, ленивый numpy, явный выбранный интерпретатор в doctor | `common` `719d9452…`, `doctor` `d6b56eb3…` |
| `new-project-safety.patch` | `tools/new_project.py` | R7: slug-only `--name`, containment в `projects/`, атомарное создание, `--force` без удаления сцен | `ad1b1d45ddb66ac1f1b09000b98743d9e3f5bc39bffc10b918c09ee0703cac92` |

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
- `verify_kit` должен считать эти шесть файлов ожидаемо изменёнными (R1/R2/R7), а не требовать копирования оригинала.
