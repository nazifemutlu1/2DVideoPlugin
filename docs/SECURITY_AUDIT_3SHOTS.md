# Security check — 2D / 2.5D / 3D

Дата: 2026-11-08. Проверялся текущий workspace, **кроме `Ifverse/`** (папка исключена из аудита и не читалась).

## Проверки

| Проверка | Результат |
|---|---|
| `npm test` | 6/6 PASS, 20 unit tests |
| `verify_kit.py` | 29/29, 12 intentional patches |
| `render.mjs --project security_3shots --self-check` | 11/11 PASS |
| `POST /player.html` | 405 |
| `GET /etc/passwd` | 404 |
| `GET /project/../package.json` | 404 |
| `GET /project/%2e%2e/package.json` | 404 |
| `GET /engine/../package.json` | 404 |
| CSP import-map hash | matches |
| `--project ../outside` | exit 2, containment |
| missing scene | exit 2, `RENDER FAILED` |
| `git grep` secret patterns | no matches |
| tracked `Ifverse/`, `node_modules`, venv | none |

## 3-shot render

Проект: `2d-video/projects/security_3shots`.

```text
s001  0–20 s   2D canvas / neon city
s002  20–40 s  2.5D layered city / parallax
s003  40–60 s  3D Three.js procedural city / orbit
```

Файлы:

```text
out/security_3shots_60s.mp4   later copied below
out/shot_2d_20s.mp4
out/shot_25d_20s.mp4
out/shot_3d_20s.mp4
```

Фактический общий файл: `build/video_silent.mp4` — H.264, 1920×1080, 24 fps, 1440 кадров, 60.000 s.

## Остаточные риски / непроверенное

- Symlink-проверка на Windows: `skipped: EPERM`; нужен Linux-прогон.
- Браузерный внешний `fetch` из сцены не автоматизирован; CSP и route guard есть, но отдельного доказательства нет.
- `--self-check` не запускает Chromium; проверяет HTTP-сервер, а не browser route.
- Полный fuzz HTTP/JSON не проводился; проверены конкретные traversal/POST/HEAD кейсы.
- `Ifverse/` не оценивался.

## Вывод

В проверенном объёме **P0 не найдено**. Основные входные границы (path traversal, missing scene, HTTP methods, CSP hash, secret patterns) ведут себя ожидаемо. Остались browser-level и Linux-symlink проверки.
