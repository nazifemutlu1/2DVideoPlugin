# Отчёт: перенос `2d-video.plugin` (Claude) → Sharrowkin / DeepSeek Flash

Дата: 2026-10-24. Исходный архив не изменялся, `F:\AI\ViralFactory` не затрагивался, рендер видео не запускался, ничего не устанавливалось.

## 1. Созданные файлы

| Путь | Назначение |
|---|---|
| `original/` | распакованный оригинал, 43 файла, 1:1 (CRC архива OK, путей с `..` нет) |
| `2d-video/` | рабочая студия — побайтовая копия `original/skills/make-2d-video/kit/` (`verify_kit.py` → 29/29) |
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

**Есть:** Node.js v24.21.0, npm 11.19.0, Python 3.14.7, FFmpeg/ffprobe 9.0.2, 24 потока CPU, NVIDIA GPU.

**Отсутствует (ничего не устанавливалось):**

| Чего нет | Кому нужно | Установка (не выполнялась) |
|---|---|---|
| npm: `three`, `playwright`, `@fontsource/{fredoka,nunito,playfair-display}` | `render.mjs` (любой рендер кадра) | `cd 2d-video && npm install` |
| Chromium для Playwright | `render.mjs` | `cd 2d-video && npx playwright install chromium` |
| python: `numpy` | **все** стадии: `tools/common.py` импортирует numpy на уровне модуля, поэтому без него падает даже `new_project.py` | `python -m pip install numpy` |
| python: `scipy` | `audio/mix.py` | `python -m pip install scipy` |
| python: `faster-whisper` | `tools/transcribe.py` (только если нет таймкодов) | `python -m pip install faster-whisper` + модель (~150–500 МБ при первом запуске) |

## 6. Выполненные проверки

| Проверка | Результат |
|---|---|
| Целостность архива (CRC, 43 записи, безопасные пути) | PASS |
| `verify_kit.py` в `2d-video/` | PASS 29/29 |
| `diff -r` references (оригинал ↔ skill) | PASS, идентичны |
| Синтаксис Python (25 файлов) | PASS 25/25 |
| Синтаксис ESM (15 файлов) | PASS 15/15 |
| `doctor.py` | отчёт получен: 5 позиций MISSING (см. §5) |
| Раннер: `init` → `timeline` (SRT) → `beats` → `status` на `_smoke` | PASS (8.0 с, 13 слов, 3 предложения, 5 битов, 9.44 с) |
| Раннер: `sheet` без `node_modules` | PASS — корректный отказ, код 2, с командой установки |
| Рендер видео | **не запускался** (по условию задачи) |

Замечание: сквозной прогон `init/timeline/beats` выполнялся с временной правкой `tools/common.py` (ленивый импорт numpy). Правка **откачена**, студия снова побайтово равна оригиналу (29/29), артефакты `_smoke` остались. Без `numpy` первый этап не запустится — это поведение оригинального кита, а не дефект переноса.

## 7. Ограничения

1. Слэш-команд нет: стадии вызываются как skills (`new-video`, `video-styles`, `render-video`, `video-sound`) или через `tools/2dvideo.py`.
2. Автоустановка отключена: `doctor.py` только сообщает, установка — по вашему разрешению.
3. Модель Whisper не скачивается автоматически.
4. В архиве у примера нет `input/voiceover.mp3` и `timeline/` — пример годится для рендера кадров, но не для сведения звука.
5. Локального TTS нет: для тестового ролика нужен ваш файл озвучки (или таймкодированный SRT + озвучка).
6. Claude умел прикреплять файл к ответу; здесь выдаётся путь к MP4.
7. `plugin.json` (маркетплейс Claude) не используется — оставлен в `original/` как справка.

## 8. Первый тестовый запуск — один конкретный способ

Предусловие (нужно ваше разрешение, ~1 минута): `numpy` + npm-пакеты + Chromium. Без них не работает ни создание проекта, ни рендер кадра.

```bash
cd F:\AI\2DVideoPlugin\2d-video
npm install
npx playwright install chromium
python -m pip install numpy scipy
```

Затем в чате Sharrowkin одной фразой:

> Сделай 2D-видео из озвучки `C:\audio\voice.mp3`, 16:9, 1080p, русский, стиль dusk. Сначала покажи раскадровку и контактный лист, полный рендер — после моего подтверждения.

Что произойдёт: skill `make-2d-video` → `doctor` → `new_project` → тайминги (Whisper или ваш SRT) → `beats` → раскадровка и `bible.md` → сетка стилей → сцены батчами с QC по контактным листам → превью 30 с → полный рендер в фоне → `audio/mix.py` → `out/<title>.mp4`.

Тот же путь без диалога:

```bash
python tools/2dvideo.py init --name test --voice "C:/audio/voice.mp3" --title "Тест" --lang ru
python tools/2dvideo.py timeline --project projects/test
python tools/2dvideo.py beats --project projects/test
python tools/2dvideo.py status --project projects/test
```

Дальше сцены пишет модель (единственный шаг, который нельзя выполнить скриптом), затем `sheet` → `preview` → `render` → `mix`.
