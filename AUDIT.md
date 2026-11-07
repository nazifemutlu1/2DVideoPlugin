# Аудит проекта 2DVideoPlugin

Дата прогона: 2026-11-07. Проверялась рабочая копия `F:\AI\2DVideoPlugin` (порт Claude-плагина `2d-video` в Sharrowkin/DeepSeek-среду).

> **Обновление 2026-11-07:** R0–R3, R5, R7 и R8 закрыты: `npm test` зелёный (6/6, kit 29/29 с 12 намеренными патчами), Python/venv унифицирован, CLI `mix` исправлен, skills переведены на DSH, `new_project.py` защищён. R9–R11 в основном закрыты. P0-4 пере-сформулирован: основной путь — **TTS через внешний API + SRT/JSON**, Whisper-модель не скачивается; финальный ffprobe/ffmpeg-контроль — в конце, на готовом MP4. Актуальные статусы — в [ROADMAP.md](ROADMAP.md).

> **Историческая часть ниже** описывает состояние до R1–R12. Числа `26/29`, «красный gate» и старые P0 — это исходный аудит, а не текущее состояние. Для текущего состояния используйте шапку выше и ROADMAP.

## Краткий вердикт

**Проект рабочий, но к внедрению в текущем виде не готов.** Ядро рендера, 16:9/9:16, H.264/FFmpeg, звук и CLI-этапы `init → timeline → beats → status` проверены и работают. При этом есть блокирующие дефекты вокруг Python-окружения, Whisper для русского языка, тестового gate и документации. `npm test` сейчас красный: 26/29 файлов целостности, хотя причина — намеренные патчи, а не поломка рендера.

Если внедрение — это запуск из текущего DeepSeek-харнесса, runtime-обвязка skills была несовместима; **R5 закрыл это**: skills переведены на `ask_user_question`, `bash`/`pwsh`, `job_output`, `read_image`.

## 1. Что проверено фактически

| Проверка | Команда | Результат |
|---|---|---|
| Синтаксис Python | `npm test` → `check_python.py` | **PASS 26/26** |
| Синтаксис ESM | `npm test` → `check_syntax.mjs` | **PASS 15/15** |
| Целостность kit | `python tools/verify_kit.py` | **FAIL 26/29**: `player.html`, `render.mjs`, `tools/transcribe.py` |
| Общий тест | `npm test` | **FAIL**: падение на `kit integrity`, код 1 |
| Окружение через venv | `python tools/2dvideo.py doctor` | **PASS**: ffmpeg, Node, npm, Chromium, numpy, scipy, faster-whisper |
| Окружение системным Python | `python tools/doctor.py` | **FAIL**: нет `numpy`, `scipy`, `faster-whisper` в Python 3.14 |
| Архив плагина | `python .sharrowkin/scripts/inspect_plugin.py` | **PASS**: CRC OK, 43 записи, безопасные пути |
| Эталонный рендер | `node render.mjs --project examples/reaction-time --sheet --scale 0.3` | **PASS**: 14 кадров + contact sheet, exit 0 |
| 9:16 | `node render.mjs --project projects/vizavi_paper_test --sheet --scale 0.5` | **PASS**: 5 кадров 540×960 + sheet |
| Видео-сборка | `node render.mjs --project projects/mars_star_robot_test --from 0 --to 2 --scale 0.25 --workers 1` | **PASS**: 48 кадров, H.264 320×180, 2.000 s |
| Сетка стилей | `node render.mjs --project projects/qoder_scene_test --styles dusk,neon --at 3 --scale 0.25` | **PASS**: 2 стиля + `style_grid.png` |
| CLI init/timeline/beats | `python tools/2dvideo.py ...` на временном SRT-проекте | **PASS**: проект, 13 слов, 3 предложения, 5 битов |
| CLI Whisper EN | `python tools/2dvideo.py timeline --project projects/_audit_whisper` | **PASS**: 14 слов, 3 предложения, модель small.en |
| CLI mix | `python tools/2dvideo.py mix --project projects/whisper_en_e2e` | **FAIL**: ложное «нет numpy/scipy», exit 2 |
| Прямой mix через venv | `.venv-whisper\Scripts\python.exe audio/mix.py ...` | **PASS**: `mix.wav`, финальный MP4 |
| Финальный MP4 | `ffprobe` + `ffmpeg -f null -` | **PASS**: H.264 + AAC, 9.893 s, декодируется без ошибок |
| Громкость | `ffmpeg loudnorm` | **PASS**: input_i ≈ −14.53 LUFS, TP −1.15 dB |
| npm-дерево | `npm ls --depth=0` | **PASS**: 5 пакетов, exit 0 |

## 2. Что установлено и за что отвечает

### Runtime

| Компонент | Версия / путь | За что отвечает |
|---|---|---|
| Node.js | 24.21.0 | запуск `render.mjs`, Playwright, Three.js |
| npm | 11.19.0 | установка JS-пакетов |
| Python (система) | 3.14.7, `C:\Python314\python.exe` | запуск тестов/скриптов; **без numpy/scipy/faster-whisper** |
| Python (venv) | 3.12.10, `.venv-whisper` | фактический интерпретатор для `tools/*.py`, `audio/*.py` |
| FFmpeg / ffprobe | 9.0.2-full_build | декодирование, H.264, AAC, concat, loudnorm |
| Chromium | Playwright Chromium 1194, `C:\Users\vampa\AppData\Local\ms-playwright\...` | headless-отрисовка кадров |
| GPU | NVIDIA RTX 4080 SUPER, 16 GB, driver 621.14 | есть физически; Whisper сейчас на CPU, т.к. `torch` не установлен |

### JS-пакеты (`2d-video/package.json`, `package-lock.json`)

| Пакет | Версия | За что отвечает |
|---|---|---|
| `three` | 0.169.0 | 3D-сцены и 3D-облёты |
| `playwright` | 1.56.0 | управление headless Chromium, скриншоты кадров |
| `@fontsource/fredoka` | 5.1.0 | латинский display-шрифт |
| `@fontsource/nunito` | 5.1.0 | основной UI/кириллический шрифт |
| `@fontsource/playfair-display` | 5.1.0 | акцентный шрифт |

Размер `node_modules` ≈ 43.6 MB. `npm ls` чистый; lock-файл согласован.

### Python-пакеты в `.venv-whisper`

| Пакет | Версия | За что отвечает |
|---|---|---|
| `numpy` | 2.5.4 | аудио-DSP, массивы, тайминги |
| `scipy` | 1.18.1 | фильтры/ресемплинг в аудио |
| `faster-whisper` | 1.2.1 | распознавание речи |
| `ctranslate2` | установлен | inference-движок Whisper |
| `onnxruntime` | установлен | зависимость окружения |
| `torch` | **не установлен** | из-за этого `transcribe.py` выбирает CPU, а не GPU |

Размер venv ≈ 422 MB.

### Whisper-модель

- Установлена только `models--Systran--faster-whisper-small.en`, snapshot `d1d751a5...`, размер ≈ **486 MB**.
- Это **English-only** модель. Для русского языка она не подходит: при `--lang ru` faster-whisper пишет `The current model is English-only ... using 'en' instead`.
- В `tools/2dvideo.py` путь к этой модели захардкожен как `WHISPER_MODEL` по умолчанию. Поэтому дефолтный сценарий «русская озвучка без SRT» фактически сломан.

### Компоненты студии

| Путь | Назначение | Состояние |
|---|---|---|
| `2d-video/render.mjs` | локальный HTTP-сервер только на `127.0.0.1`, Playwright-рендер, ffmpeg-чанки и concat | работает; содержит security-патч T1.2C |
| `2d-video/player.html` | загрузка `player.js`, CSP, import map для Three.js | работает; CSP-хеш проверен |
| `2d-video/engine/core.js` | базовые функции сцен, `E`, `V`, `ease`, текст, шрифты | работает |
| `2d-video/engine/player.js` | загрузка проекта, выбор кадра, переходы, grade, captions, бары | работает |
| `2d-video/engine/rig2d.js` | 2D-риг персонажей | работает |
| `2d-video/engine/fx2d.js` | эффекты/частицы/атмосфера | работает |
| `2d-video/engine/ui2d.js` | UI-графика и субтитры | работает |
| `2d-video/engine/styles.js` | 5 стилей: dusk, midnight, golden, neon, storybook | работает |
| `2d-video/engine/three-kit.js` | Three.js/3D-рендер | работает, эталонный 3D-кадр отрендерен |
| `2d-video/tools/new_project.py` | создание проекта, копирование озвучки/сценария, config | работает через venv |
| `2d-video/tools/parse_script.py` | SRT/VTT/JSON/TXT → слова/предложения | работает на тестовом SRT |
| `2d-video/tools/transcribe.py` | Whisper → word timestamps | работает для EN/small.en; для RU модель неверная |
| `2d-video/tools/beats.py` | бит-лист и черновик `shots.json` | работает |
| `2d-video/tools/doctor.py` | проверка окружения | отчёт верный, но интерпретатор зависит от запуска |
| `2d-video/tools/verify_kit.py` | сверка 29 файлов с оригиналом | **красный** из-за намеренных патчей |
| `2d-video/audio/music.py` | генеративная музыка | работает в mix |
| `2d-video/audio/sfx.py` | библиотека SFX/ambience | работает в mix |
| `2d-video/audio/mix.py` | сведение, ducking, −14 LUFS, mux | работает через venv; CLI-обёртка блокирует |
| `2d-video/audio/dsp.py` | DSP-примитивы | используется музыкой/SFX |
| `2d-video/examples/reaction-time` | эталонный пример на 14 кадров | рендерится |
| `2d-video/projects/*` | тестовые проекты и артефакты | 5 проектов; не все пригодны для полного цикла |
| `tools/2dvideo.py` | CLI-обёртка над студией | работает, кроме `mix` и пути к модели |
| `.sharrowkin/skills/*` | 5 skills + references | творческие правила сохранены; runtime-часть устарела |
| `backups/t1.2f-...` | бэкап оригинальных `render.mjs`/`player.html` | есть; restore вернёт незащищённую версию |
| `original/` | распакованный оригинал | 55 файлов, но в архиве 43; есть лишний `vizavi-motion` |

## 3. Блокирующие проблемы (P0)

### P0-1. `npm test` красный, `verify_kit` 26/29

Факт:

```text
MISMATCH  player.html
MISMATCH  render.mjs
MISMATCH  tools/transcribe.py
26/29 files verified.
CHECK FAILED: kit integrity
```

Это не случайная поломка: в рабочей студии намеренно изменены:
- `player.html` — добавлен CSP;
- `render.mjs` — добавлен T1.2C security-патч (allowlist, loopback, realpath containment, route guard);
- `tools/transcribe.py` — локальная модель, offline-режим.

Проблема в том, что `verify_kit.py` сравнивает с хешами **оригинального** kit и советует «скопировать файлы заново». Если последовать совету, снесутся и CSP, и security-патч, и offline-поведение.

**Что сделать:** выбрать один из вариантов и зафиксировать его в репозитории:
1. обновить `EXPECTED` в `verify_kit.py` на текущие хеши и добавить `PATCHES.md` с причиной; **или**
2. вынести патчи в `patches/` и научить `verify_kit.py` режиму `--allow-patched`; **или**
3. держать `2d-video` строго оригинальным, а патчи применять отдельным шагом.

После этого `npm test` должен быть зелёным. Сейчас CI/приёмка невозможны.

### P0-2. Два Python-окружения, документация ведёт не туда

Факт:

```text
python tools/doctor.py
  MISSING python: numpy
  MISSING python: scipy
  MISSING python: faster-whisper
```

Но:

```text
python tools/2dvideo.py doctor
  OK ffmpeg / Node / npm / Chromium
  OK python: numpy / scipy / faster-whisper
```

Причина: `tools/2dvideo.py` подхватывает `.venv-whisper` (Python 3.12), а `README.md`, `SKILL.md` и прямые команды используют системный `python` (3.14) без пакетов. Поэтому:

- `python tools/new_project.py --help` → `ModuleNotFoundError: No module named 'numpy'`;
- `python audio/mix.py ...` → та же ошибка;
- агент, следующий skill-документации, сломается на Stage 3/7.

**Что сделать:** один канонический интерпретатор. Либо все команды идут через `python tools/2dvideo.py`, либо в документации явно `.venv-whisper\Scripts\python.exe`; `doctor.py` должен проверять тот же интерпретатор, который реально используется. Добавить `requirements.txt`/`pyproject.toml` и bootstrap-скрипт.

### P0-3. CLI `mix` ложно требует пакеты у системного Python

Факт:

```text
python tools/2dvideo.py mix --project projects/whisper_en_e2e
FAIL: не установлены python-пакеты: numpy, scipy
exit 2
```

При этом прямой запуск через venv работает и даёт валидный MP4:

```text
.venv-whisper\Scripts\python.exe audio/mix.py --project projects/whisper_en_e2e
FINAL VIDEO: ...\Whisper_EN_E2E.mp4
exit 0
```

Причина: `cmd_mix()` вызывает `require_python_deps()`, а тот делает `importlib.util.find_spec()` **в процессе системного Python**, хотя сам subprocess запускается через `PY` (venv). Это блокирует финальную стадию ровно на той машине, где всё установлено правильно.

**Что сделать:** проверять зависимости через `PY -c "import numpy, scipy"` в subprocess или убрать предварительную проверку и доверять коду ошибки `mix.py`.

### P0-4. Whisper по умолчанию English-only, а основной язык проекта — русский

> **Решение 2026-11-07:** не скачивать Whisper-модель. Основной путь — **TTS через внешний API + SRT/JSON** с таймингами; Whisper остаётся опциональным legacy. **Whisper всегда получает отдельный аудиофайл через `--audio`; TTS-озвучка и project voiceover ему не подставляются.** Финальный ffprobe/ffmpeg-контроль — в конце, на готовом MP4. R4 в ROADMAP пере-сформулирован под TTS API.

Факт:

```text
python tools/2dvideo.py timeline --project projects/_audit_ru --lang ru --model <small.en>
The current model is English-only but the language parameter is set to 'ru'; using 'en' instead.
no speech found in the voiceover
exit 1
```

Дополнительно:

```text
python tools/transcribe.py --project projects/_smoke --model small
Whisper model directory not found: small
exit 1
```

Причины:
- в `tools/2dvideo.py` `WHISPER_MODEL` жёстко указывает на snapshot `faster-whisper-small.en`;
- `transcribe.py` после патча требует **локальный каталог** модели и больше не принимает `small`/`base`/`large-v3`;
- `README.md`/`SKILL.md` всё ещё обещают `--model small` и автоскачивание модели;
- `HF_HUB_OFFLINE=1` выставлен до проверки наличия модели.

**Что сделать:** выбирать модель по `speechLanguage`; для `ru` использовать многоязычную `small` (не `.en`) или `large-v3`; добавить управляемую загрузку/кэш и понятную ошибку, если модели нет; обновить `transcribe.py --help`, `README`, `install.md`, `SKILL.md`. Это главный бизнес-риск: без SRT русская озвучка сейчас не распознаётся.

### P0-5. Skills ссылаются на инструменты другого runtime

В `.sharrowkin/skills/*/SKILL.md` используются:

- `ask_user` / `AskUserQuestion`;
- `run_command` (cmd.exe);
- `run_background` + `process_output`;
- `view_image`;
- слэш-команды `/new-video` и т.п.

В текущем DeepSeek-харнессе доступны другие имена: `ask_user_question`, `bash`/`pwsh`, `job_output`, `read_image`; слэш-команд нет. Если эти skills будут подключены к текущему агенту, он будет пытаться вызвать несуществующие инструменты. Это отдельный слой от того, что сам рендерер работает.

**Что сделать:** либо оставить проект в Sharrowkin и не подключать skills к DSH, либо переписать таблицу tool mapping и все команды в 5 skill-файлах под текущий runtime. Заодно убрать утверждения «Sharrowkin has no slash commands» из пользовательской документации, если продукт уже другой.

### P0-6. Нет version control и packaging-границ

Факт:

- `.git` отсутствует;
- `.gitignore` отсутствует;
- в рабочей папке лежат `node_modules` (43 MB), `.venv-whisper` (422 MB), модель (486 MB), `projects` (83 MB), `.sharrowkin` runtime-БД, `%SystemDrive%` (3 мусорных .db), `.qoder`, `.whisper-e2e-test`, `__pycache__`, `debug.log`.

Для внедрения это означает: невозможно откатить изменения, невозможно собрать чистый артефакт, а рядом с кодом лежат пользовательские данные и кэши. `backups/restore.ps1` вернёт только два файла и не покрывает `transcribe.py`.

**Что сделать:** `git init`, `.gitignore` для `node_modules/`, `.venv-whisper/`, `projects/*/build/`, `projects/*/out/`, `__pycache__/`, `*.pyc`, `debug.log`, `%SystemDrive%/`; вынести тестовые проекты в `tests/fixtures` или `examples`; собирать отдельный artifact без кэшей.

## 4. Важные, но не блокирующие проблемы (P1)

### P1-1. `new_project.py`: path traversal и перезапись

> **Закрыто в R7:** slug-only `--name`, containment в `projects/`, атомарное создание, `--force` сохраняет сцены. См. [ROADMAP.md](ROADMAP.md).

`--name` подставляется прямо в `os.path.join("projects", a.name)`. Имя вида `..\outside` или абсолютный путь может создать/перезаписать каталог вне `projects`. Повторный `init` с тем же именем молча перезапишет `config.json` и `input/voiceover.*` (нет `--force`/проверки существования).

Если CLI будет вызываться из API/веб-сервиса — это обязательно исправить: разрешить `^[a-z0-9][a-z0-9_-]*$`, резолвить путь и проверять, что он внутри `projects`, добавить `--force`.

### P1-2. Семантика `--project` в CLI

`tools/2dvideo.py` трактует относительный `--project` как путь **внутри `2d-video`** (`projects/x`), а не относительно текущего каталога. Абсолютный путь работает. В документации это не сказано. Если интеграция будет передавать `2d-video/projects/x` из корня, команда упадёт. Нужно либо документировать, либо нормализовать путь в абсолютный до вызова subprocess.

### P1-3. Security-патч рендера нужно покрыть тестами

Код `render.mjs` после T1.2C выглядит корректно:
- сервер слушает только `127.0.0.1`;
- allowlist путей;
- `realpath` + containment;
- только GET/HEAD;
- route guard в Playwright;
- CSP в player.html, SHA-256 import map совпадает.

Самотест и 9:16-рендер проходят. Но нет автотестов на:
- `..`/encoded traversal;
- symlink внутри проекта;
- внешние запросы из сцены;
- HEAD/405;
- корректный CSP при изменении import map.

Добавить хотя бы тест-скрипт, который поднимает сервер и проверяет 403/404/200.

### P1-4. Ошибки на пустых таймингах

`parse_script.py` и `beats.py` обращаются к `words[-1]`/`words[0]` без проверки пустого списка. На нормальном аудио это не проявляется, но пустой/битый SRT даст `IndexError` вместо понятной ошибки. Добавить guard и код возврата 2.

### P1-5. GPU не используется для Whisper

`doctor.py` сообщает «NVIDIA GPU found», но `transcribe.py` проверяет только `torch`; `torch` в venv нет, поэтому устройство — CPU. Если ожидается скорость GPU, нужно либо ставить CUDA-совместимый `torch`/`ctranslate2`, либо честно писать в doctor: «GPU есть, Whisper работает на CPU». Иначе производительность на длинных роликах будет неожиданно низкой.

### P1-6. `debug.log` и GPU-предупреждения

В корне студии есть `debug.log` с повторяющимися `GPU stall due to ReadPixels`. Это не ошибка рендера, но засоряет поставку. Перенаправлять логи Chromium в `build/` или подавлять некритичные сообщения.

### P1-7. Документация устарела

Противоречия:
- `README.md`: «`node_modules` не установлены», «рендер не запускался» — фактически установлены и рендер проходил;
- `README.md`/`MIGRATION.md`: «`2d-video` — побайтовая копия» — сейчас 3 файла изменены;
- `MIGRATION.md`: `verify_kit` PASS 29/29 — сейчас 26/29;
- `MIGRATION.md`: «оригинал 43 файла», а в `original/` 55 файлов из-за лишнего `vizavi-motion`;
- `SKILL.md`: `--model small`, «first run downloads» — противоречит offline-патчу;
- `README.md` обещает «всё ставится само», но установка теперь ручная/по разрешению.

Перед внедрением документация должна описывать **фактическое** поведение, иначе оператор/агент будет действовать по неверным инструкциям.

## 5. Что сделать перед внедрением: порядок

### Обязательно (без этого не выпускать)

1. **Сделать `npm test` зелёным.** Обновить baseline `verify_kit` или вынести патчи; не откатывать security/CSP/offline-правки.
2. **Зафиксировать один Python.** `tools/2dvideo.py` + `.venv-whisper` как канон; `requirements.txt`; все команды в docs — через wrapper или явный venv.
3. **Исправить `cmd_mix`.** Проверка `numpy/scipy` должна идти в `PY`, а не в хостовом интерпретаторе.
4. **Перевести русскую озвучку на TTS через внешний API + SRT/JSON.** Не скачивать Whisper-модель; принимать WAV/MP3 и тайминги от TTS; Whisper оставить опциональным legacy; финальную проверку MP4 делать через ffprobe/ffmpeg в конце.
5. **Синхронизировать skills с runtime.** Либо DSH-имена инструментов, либо явно оставить Sharrowkin и не заявлять совместимость с DSH.
6. **Добавить `.gitignore`/VCS и чистую сборку.** Без `node_modules`, venv, модели, `projects/*/build`, `out`, кэшей и `%SystemDrive%`.

### Желательно (следующий спринт)

7. Валидация `--name` и запрет перезаписи проекта.
8. Нормализация `--project` и понятные ошибки пути.
9. Тесты security-патча рендера (traversal/loopback/405).
10. Guard на пустые words; коды возврата 2 для пользовательских ошибок.
11. GPU-политика для Whisper (torch/CUDA или честный CPU-режим).
12. Почистить `original/` от `vizavi-motion`/`.qoder`, убрать `%SystemDrive%`, `debug.log`, `__pycache__`, тестовые проекты — или задокументировать их как fixtures.

### Позже

13. Выровнять версии: плагин `0.1.1`, skill `0.1.1-sharrowkin.1`, studio `1.0.1` — выбрать единую схему.
14. Добавить unit-тесты на `parse_script`, `beats`, `mix`, `verify_kit`.
15. Добавить CI (хотя бы `npm test` + `doctor` + короткий render sheet).

## 6. Критерии готовности к внедрению

- [ ] `npm test` → exit 0, 29/29, без «скопируйте оригиналы».
- [ ] `python tools/2dvideo.py doctor` и `python tools/doctor.py` дают одинаковый PASS (или doctor явно пишет, какой интерпретатор проверяет).
- [ ] `python tools/2dvideo.py mix --project ...` → exit 0, финальный MP4 с audio.
- [ ] Русская озвучка без SRT → корректный `timeline/transcript.txt` (не English-only warning).
- [ ] `python tools/2dvideo.py timeline ... --model small` либо работает, либо даёт понятную инструкцию, а не «directory not found».
- [ ] `node render.mjs --project examples/reaction-time --sheet --scale 0.3` → 14 кадров, exit 0.
- [ ] 16:9 и 9:16 листы открываются, размеры корректны.
- [ ] Финальный MP4: H.264 + AAC, duration совпадает, `ffmpeg -f null -` без ошибок.
- [ ] В артефакт не попадают `node_modules`, `.venv-whisper`, модель, `projects/*/build`, `out`, `__pycache__`, `debug.log`, `%SystemDrive%`.
- [ ] Skills не ссылаются на отсутствующие инструменты.

## 7. Ограничения этого аудита

- Полный длинный рендер (47 s и 4K, много воркеров) не запускался; проверены эталонный sheet, 9:16 sheet, 2-секундный preview и финальный 9.9-секундный MP4 из готового проекта.
- Визуальная эстетика кадров **не оценена**: текущая модель не принимает изображения (`read_image` вернул «model does not declare image input»). Проверены размеры, наличие 14/5 кадров, разброс яркости/цвета и отсутствие явно пустых кадров; для художественного QC нужен image-capable просмотр.
- Русская озвучка проверена только на уровне выбора модели; реального русского аудио в фикстурах нет. Это и есть P0-4, а не «не проверено».
- Security-патч проверен код-ревью и успешным рендером, но без фаззинга traversal.

## 8. Итог одной фразой

**Рендерер и медиа-пайплайн живы; перед внедрением нужно починить тестовый gate, унифицировать Python/venv, перевести русскую озвучку на TTS через внешний API + SRT, исправить CLI `mix` и привести skills/документацию к реальному runtime.**
