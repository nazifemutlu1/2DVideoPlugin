# 2D Video для Sharrowkin (DeepSeek Flash)

Перенос плагина `2d-video.plugin` (Claude) в текущую среду. Движок, рендерер, аудио-инструменты, примеры и стили — оригинальные, без переписывания.

## Что где лежит

| Путь | Что это |
|---|---|
| `2d-video.plugin` | исходный архив, **не изменяется** |
| `original/` | распакованный оригинал 1:1 (43 файла), только чтение |
| `2d-video/` | рабочая студия — побайтовая копия `original/skills/make-2d-video/kit/` |
| `.sharrowkin/skills/make-2d-video/` | главный skill (весь пайплайн) + `references/` |
| `.sharrowkin/skills/{new-video,video-styles,render-video,video-sound}/` | stage-skills |
| `tools/2dvideo.py` | CLI-раннер: обёртка над инструментами студии |
| `MIGRATION.md` | отчёт о переносе, ограничения, зависимости |

## Как вызвать генерацию

**Диалог (основной путь).** Напишите в чат, например:

> Сделай 2D-видео из озвучки `C:\audio\voice.mp3`, 16:9, 1080p, русский.

Sharrowkin сам подхватит skill `make-2d-video` (он виден в списке проектных skills) и пройдёт стадии: проверка студии → тайминги → раскадровка → стиль → сцены → рендер → звук → MP4. Отдельные стадии: `new-video`, `video-styles`, `render-video`, `video-sound`.

**CLI (тот же пайплайн без диалога).** Из корня проекта:

```bash
python tools/2dvideo.py doctor
python tools/2dvideo.py init --name test --voice "C:/audio/voice.mp3" --title "Тест" --lang ru
python tools/2dvideo.py timeline --project projects/test
python tools/2dvideo.py beats --project projects/test
python tools/2dvideo.py status --project projects/test
python tools/2dvideo.py sheet --project projects/test
python tools/2dvideo.py preview --project projects/test --from 0 --to 30
python tools/2dvideo.py render --project projects/test
python tools/2dvideo.py mix --project projects/test
```

Сцены (`scenes/shots/*.js`) пишет модель по правилам из `references/style-bible.md` и `engine-api.md` — это единственная часть, которую нельзя выполнить скриптом.

## Состояние

Проверка проекта одной командой: `npm test` — синтаксис Python, синтаксис ESM и целостность студии (`verify_kit` 29/29).

- Node.js v24.21.0, npm 11.19.0, Python 3.14.7, FFmpeg 9.0.2 — есть.
- `2d-video/node_modules` **не установлены** (запрет на установку без разрешения): `three`, `playwright`, `@fontsource/*`.
- Python-пакеты `numpy`, `scipy`, `faster-whisper` — не проверялись на установку, см. `python tools/2dvideo.py doctor`.
- Рендер видео не запускался.

Подробности и ограничения — в `MIGRATION.md`.
