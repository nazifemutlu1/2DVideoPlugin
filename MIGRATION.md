# Отчёт: перенос `2d-video.plugin` (Claude) → Sharrowkin / DeepSeek Flash

> **Актуальное состояние на 2026-11-07:** документ ниже — исторический отчёт о переносе от 2026-10-24. После аудита выполнены R0 (git, baseline, `patches/`) и R1 (зелёный `npm test`, `verify_kit` 29/29). Свежие факты — в [README.md](README.md), [ENVIRONMENT.md](ENVIRONMENT.md), [AUDIT.md](AUDIT.md) и [ROADMAP.md](ROADMAP.md).

Дата: 2026-10-24. Исходный архив не изменялся, `F:\AI\ViralFactory` не затрагивался, рендер видео не запускался, ничего не устанавливалось.

## 1. Созданные файлы

| Путь | Назначение |
|---|---|
| `original/` | распакованный оригинал, 43 файла, 1:1 (CRC архива OK, путей с `..` нет) |
| `2d-video/` | рабочая студия: оригинальный kit + намеренные патчи (CSP, T1.2C security, offline transcribe, runtime-python), см. `patches/` |
| `.sharrowkin/skills/make-2d-video/SKILL.md` | главный skill: весь пайплайн, 8 стадий, оригинальные правила |
| `.sharrowkin/skills/make-2d-video/references/` | 6 файлов references, `diff -r` с оригиналом — идентичны |
| `.sharrowkin/skills/new-video/SKILL.md` | стадии 1–4 (интейк, студия, тайминги, раскадровка) |
| `.sharrowkin/skills/video-styles/SKILL.md` | стадия 5 (сетка стилей, кастомный стиль) |
| `.sharrowkin/skills/render-video/SKILL.md` | стадии 6 и 8 (сцены, QC, превью, рендер) |
| `.sharrowkin/skills/video-sound/SKILL.md` | стадия 7 (музыка, SFX, сведение) |
| `tools/2dvideo.py` | CLI-раннер: `doctor/init/timeline/beats/sheet/preview/render/mix/status` |
| `README.md` | точка входа: что где лежит и как вызывать |
| `MIGRATION.md` | этот отчёт |
| `.sharrowkin/scripts/inspect_plugin.py` | безопасная инспекция/распаковка архива |
| `.sharrowkin/scripts/check_python.py` | синтаксис всех `.py` без записи `__pycache__` |
| `.sharrowkin/scripts/check_syntax.mjs` | синтаксис всех ESM-файлов через `vm.SourceTextModule` |
| `.sharrowkin/scripts/fixtures/{tone.wav,smoke.srt}` | фикстуры smoke-теста (тон 8 с + SRT) |
| `2d-video/projects/_smoke/` | служебный smoke-проект (тон вместо речи, 5 битов, 0 сцен) — можно удалить |

## 2. Что сохранено из оригинала

- **Движок Canvas + Three.js** целиком: `engine/{core,cast,ui,styles,three-kit,player}.js` — без правок.
- **Рендерер** `render.mjs` (headless Chromium → ffmpeg, параллельные воркеры, `--sheet/--stills/--styles/--from/--to/--scale/--workers/--format/--gl`) — без правок.
- **Аудио**: `audio/{music,sfx,mix,dsp}.py` (генеративная музыка по настроениям, библиотека SFX, ambience, дакинг, −14 LUFS) — без правок.
- **Инструменты**: `tools/{new_project,parse_script,transcribe,beats,doctor,verify_kit,common}.py` — без правок.
- **Пример** `examples/reaction-time` (14 кадров в `story/shots.json`, 14 `registerShot`, длительность 46.002 с) — без правок.
- **Все 5 стилей**: `dusk, midnight, golden, neon, storybook` + `moods` и `grade` в `engine/styles.js`.
- **Все 5 Skills** перенесены полностью: правила сцен, движений, света, камеры, монтажа, графики, 9:16, «golden rules», language policy, стадии 1–8, defaults — дословно. Заменена только runtime-обвязка.

## 3. Что зависит от Claude, а что — обычный код

**Зависело от Claude (адаптировано):**

| Claude | Sharrowkin | Статус |
|---|---|---|
| Загрузчик Skills + `description`-триггеры | `.sharrowkin/skills/<name>/SKILL.md` | работает, проверено `list_skills` |
| Слэш-команды `/new-video`, `/video-styles`, `/render-video`, `/video-sound` | одноимённые skills, вызов по имени/описанию в чате | **слэш-команд в Sharrowkin нет** — ограничение |
| `AskUserQuestion` | `ask_user` (карточка выбора) | работает |
| Bash-тул | `run_command` (cmd.exe) | работает |
| Фоновый bash для долгого рендера | `run_background` + `process_output` | работает |
| Чтение PNG контактных листов «глазами» | `view_image` | работает |
| Автоустановка зависимостей | `doctor.py` отчитывается, установка — только с разрешения | изменено намеренно |
| `.claude-plugin/plugin.json` (манифест маркетплейса) | не используется Sharrowkin | сохранён в `original/` |
| «Отправь файл пользователю» | путь к MP4 в чате | ограничение |

**Не зависело от Claude (перенесено как есть):** `render.mjs`, весь `engine/`, все `tools/*.py`, `audio/*.py`, `examples/`, `player.html`, `package.json`. Это чистый Node.js + Python + FFmpeg.

## 4. Как Sharrowkin обнаруживает Skills

Проверено эмпирически: skill появился в `list_skills` сразу после создания `.sharrowkin/skills/make-2d-video/SKILL.md` с YAML-frontmatter `name` + `description`. Формат совместим с оригинальным (frontmatter не менялся, добавлены только `metadata.version/adapted_for`). Механизма слэш-команд в проекте нет — стадии вызываются как skills.

## 5. Зависимости

**Фактически установлено (2026-11-07):** Node.js v24.21.0, npm 11.19.0, Python 3.12.10 в `.venv-whisper`, FFmpeg/ffprobe 9.0.2, Playwright 1.56.0 + Chromium 1194, 24 потока CPU, NVIDIA RTX 4080 SUPER (Whisper на CPU, `torch` не установлен).

| Компонент | Где | Версия / примечание |
|---|---|---|
| npm `three`, `playwright`, `@fontsource/*` | `2d-video/node_modules` | 43.6 MB, `npm ls` exit 0 |
| Chromium для Playwright | `%LOCALAPPDATA%\ms-playwright\chromium-1194` | есть |
| `numpy` | `.venv-whisper` | 2.5.4 |
| `scipy` | `.venv-whisper` | 1.18.1 |
| `faster-whisper` | `.venv-whisper` | 1.2.1, `ctranslate2` 4.8.3 |
| Whisper-модель | HF cache | `small.en`, English-only, 486 MB |

Системный Python 3.14 по-прежнему не содержит этих пакетов; прямой `python tools/*.py` для аудио/Whisper не использовать. Канонический вход — `python tools/2dvideo.py` или `.venv-whisper\Scripts\python.exe`.

## 6. Выполненные проверки

> Таблица ниже обновлена до текущего состояния 2026-11-07; первичный отчёт был 2026-10-24. Актуальные числа — в README/ROADMAP.

| Проверка | Результат |
|---|---|
| Целостность архива (CRC, 43 записи, безопасные пути) | PASS |
| `verify_kit.py` в `2d-video/` | PASS 29/29 (8 намеренных патчей, см. `patches/`) |
| Синтаксис Python | PASS 28/28 |
| Синтаксис ESM | PASS 15/15 |
| `npm test` | PASS 6/6, exit 0 |
| Unit tests | PASS 15/15 |
| `doctor.py` через runner | PASS: ffmpeg, Node, npm, Chromium, numpy, scipy; Whisper/torch — optional |
| Раннер: `init` → `timeline` (SRT) → `beats` → `status` | PASS (13 слов, 3 предложения, 5 битов) |
| Раннер: Whisper EN | PASS (14 слов, 3 предложения) |
| Рендер: эталонный sheet | PASS: 14 кадров + contact sheet |
| Рендер: 9:16 sheet | PASS: 5 кадров 540×960 |
| Рендер: preview | PASS: 48 кадров, H.264, 2.000 s |
| Финальный MP4 | PASS: H.264 + AAC, 9.893 s, decode OK, ≈ −14.5 LUFS |
| CLI `mix` | PASS после R2 (проверка зависимостей в выбранном Python) |

Замечание: ленивый импорт numpy теперь **внедрён** в `tools/common.py` (R2); `new_project.py --help` и `beats.py --help` работают без numpy. Для `audio/mix.py` и Whisper всё равно нужен venv.

## 7. Ограничения

1. Слэш-команд нет: стадии вызываются как skills (`new-video`, `video-styles`, `render-video`, `video-sound`) или через `tools/2dvideo.py`.
2. Автоустановка отключена: `doctor.py` только сообщает, установка — по вашему разрешению.
3. Модель Whisper не скачивается автоматически.
4. В архиве у примера нет `input/voiceover.mp3` и `timeline/` — пример годится для рендера кадров, но не для сведения звука.
5. Локального TTS нет: озвучка генерируется **внешним TTS API**; студия принимает WAV/MP3 + SRT/JSON. Финальная проверка готового MP4 — через ffprobe/ffmpeg в конце.
6. Claude умел прикреплять файл к ответу; здесь выдаётся путь к MP4.
7. `plugin.json` (маркетплейс Claude) не используется — оставлен в `original/` как справка.

## 8. Первый тестовый запуск — один конкретный способ

Предусловие: зависимости уже установлены (см. §5). Проверить и, при необходимости, установить с разрешения:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\bootstrap.ps1
python -m venv .venv-whisper
.\.venv-whisper\Scripts\python.exe -m pip install -r requirements.txt
cd 2d-video
npm install
npx playwright install chromium
```

Затем в чате Sharrowkin одной фразой:

> Сделай 2D-видео из озвучки `C:\audio\voice.mp3`, 16:9, 1080p, русский, стиль dusk. Сначала покажи раскадровку и контактный лист, полный рендер — после моего подтверждения.

Что произойдёт: skill `make-2d-video` → `doctor` → `init` → тайминги (TTS API + SRT/JSON; Whisper только отдельным аудио) → `beats` → раскадровка и `bible.md` → сетка стилей → сцены батчами с QC по контактным листам → превью 30 с → полный рендер в фоне → `mix` → `out/<title>.mp4` → финальный ffprobe/ffmpeg-контроль.

Тот же путь без диалога:

```powershell
python tools/2dvideo.py doctor
python tools/2dvideo.py init --name test --voice "C:/audio/voice.mp3" --title "Тест" --lang ru
python tools/2dvideo.py timeline --project projects/test
python tools/2dvideo.py beats --project projects/test
python tools/2dvideo.py status --project projects/test
```

Дальше сцены пишет модель (единственный шаг, который нельзя выполнить скриптом), затем `sheet` → `preview` → `render` → `mix`.
