# ROADMAP: 2DVideoPlugin → production-ready

Основание: [AUDIT.md](AUDIT.md). Статус на 2026-11-07: аудит завершён, **R0–R3, R5, R7 и R8 выполнены**; R4 пере-сформулирован под **TTS через внешний API** и ждёт API-фикстуру; R6 выполнен кроме R6.3; R9–R11 в основном выполнены; R12 почти выполнен (R12.5 — частично); следующий исполнимый пункт — R13. Этот файл — источник истины по порядку работ.

> **Проект не закрывается на R15.** R15 — это стабильный baseline, а не финальная заморозка. После него ожидаются интеграции (TTS, стили, внешний API/сервис); они вынесены в R16–R17. Поэтому упаковка и release-freeze не делаются, пока не определён scope интеграции.
>
> **Ifverse:** папка `Ifverse/` появилась как зарезервированное место под будущую интеграцию. **Не изменять, не удалять, не чистить, не включать в artifact и не коммитить без отдельного разрешения.** Работа с ней — только в R17 после определения контракта.

## Правила выполнения

1. Работать строго по ID: `R0 → R15`, если зависимость не требует иного. Не перескакивать через красный gate.
2. Перед каждым пунктом: прочитать `AUDIT.md`/`ROADMAP.md`, воспроизвести проблему, сделать минимальный обратимый патч.
3. После каждого пункта: обновить статус и evidence в этом файле, запустить применимые проверки, показать результат.
4. Не откатывать намеренные патчи `render.mjs` (T1.2C security), `player.html` (CSP) и `transcribe.py` (offline/local model), если это не отдельное решение с записью в `patches/`.
5. Ничего не устанавливать и не скачивать (npm, pip, Chromium, Whisper-модели) без явного разрешения пользователя.
6. Не трогать `original/` и `2d-video.plugin`; изменения — только в рабочей копии и `patches/`.
7. После каждой волны — checkpoint: короткий отчёт, обновлённый ROADMAP, список открытых рисков.

## Команды управления

| Команда | Что делает агент |
|---|---|
| `Старт` | начинает с первого незавершённого пункта и идёт по порядку; после каждого пункта фиксирует evidence; останавливается на checkpoint/разрешении |
| `Старт R<N>` | выполняет только указанный пункт и останавливается |
| `Дальше` | переходит к следующему незавершённому пункту |
| `Стоп` | останавливается, сохраняет состояние в ROADMAP |
| `Статус` | показывает текущий пункт, статусы, открытые блокеры |

Статусы: `[ ]` не начато, `[~]` в работе, `[x]` готово, `[!]` заблокировано.

---

## R0. Страховка и базовая линия — P0

**Цель:** чтобы каждое следующее исправление было обратимым и проверяемым.

- [x] R0.1 Инициализировать git, добавить `.gitignore`, зафиксировать baseline-коммит.
- [x] R0.2 Добавить в `.gitignore`: `node_modules/`, `.venv-whisper/`, `projects/*/build/`, `projects/*/out/`, `__pycache__/`, `*.pyc`, `debug.log`, `%SystemDrive%/`, `.qoder/`, `.whisper-e2e-test/`, `.sharrowkin/checkpoints/`, `.sharrowkin/brain.db`, `.sharrowkin/skills.sqlite`.
- [x] R0.3 Зафиксировать текущие версии: Node 24.21.0, npm 11.19.0, venv Python 3.12.10, FFmpeg 9.0.2, Playwright 1.56.0, Chromium 1194, npm-пакеты, Python-пакеты, Whisper small.en.
- [x] R0.4 Создать `patches/` и перенести туда три намеренных изменения: CSP, T1.2C security, offline transcribe. Приложить `patches/README.md` с причиной и способом применения. (R2 добавляет `runtime-python.patch` для common/doctor.)
- [x] R0.5 Проверить, что `AUDIT.md` и `ROADMAP.md` не попадают в runtime-артефакт.

**DoD:** есть откат, baseline зафиксирован, патчи не потеряны, рабочая копия не изменилась функционально.

**Evidence (2026-11-07):**
- `git init -b main`; baseline-коммит `531e2df`; `git status --short --branch` → `## main` (чисто).
- `.gitignore` + `.gitattributes` добавлены; `git check-ignore` подтвердил игнор `node_modules`, `.venv-whisper`, `projects/*/build`, `%SystemDrive%`, `debug.log`.
- [ENVIRONMENT.md](ENVIRONMENT.md) фиксирует версии и размеры окружения.
- [patches/README.md](patches/README.md) + 3 патча; на чистых оригиналах с `git -c core.autocrlf=false apply` все три дают хеши, совпадающие с рабочей копией.
- `AUDIT.md`/`ROADMAP.md` лежат только в корне; в `2d-video/` и `.sharrowkin/skills/` их нет. Финальная проверка artifact — в R15.


---

## R1. Зелёный тестовый gate и происхождение патчей — P0

**Цель:** `npm test` снова зелёный, но без отката security/CSP/offline-правок.

- [x] R1.1 Выбрать схему: **A** — обновить `EXPECTED` в `verify_kit.py` на текущие хеши + `patches/README.md`; **B** — добавить `verify_kit.py --allow-patched` с явным списком. По умолчанию делать A, если нет причин для B.
- [x] R1.2 Обновить `2d-video/tools/verify_kit.py`: внятное сообщение «файл изменён намеренно, см. patches/…», не советовать бездумно копировать оригинал.
- [x] R1.3 Добавить проверку, что unexpected mismatch всё ещё валит gate.
- [x] R1.4 Обновить `npm test`, чтобы он проверял: синтаксис Python + ESM + integrity + наличие ключевых зависимостей/конфигурации (без установки).
- [x] R1.5 Записать evidence: `npm test` exit 0, 29/29, вывод без `MISMATCH`.

**DoD:** `npm test` → exit 0, 29/29; `patches/` объясняет каждое отклонение; случайное изменение файла по-прежнему ловится.

**Evidence (2026-11-07):**
- `verify_kit.py` переведён на схему A: ожидаемые хеши patched-файлов + `PATCHED` с ссылками на `patches/*`.
- `npm test` → `CHECK PASSED: 4/4`, exit 0; Python syntax 27/27, ESM 15/15, kit 29/29, environment 13/13.
- Self-test `verify_kit.py --root <temp copy>`: чистая копия — 29/29 exit 0; после порчи `player.html` — `MISMATCH ... exit 1`.
- Новый [.sharrowkin/scripts/check_env.py](.sharrowkin/scripts/check_env.py) проверяет Node, npm-пакеты, ffmpeg/ffprobe, venv, numpy/scipy/faster-whisper и Chromium без установки.


---

## R2. Единый Python/venv — P0

**Цель:** никаких «в одном терминале работает, в другом нет».

- [x] R2.1 Зафиксировать `requirements.txt` из `.venv-whisper`: `numpy`, `scipy`, `faster-whisper` (и при необходимости `ctranslate2`), с версиями.
- [x] R2.2 В `tools/2dvideo.py` сделать единый resolver: `--python`/`PYTHON` → `.venv-whisper` → системный Python; печатать выбранный интерпретатор в `doctor`.
- [x] R2.3 `doctor.py` должен проверять тот же интерпретатор, который будет использовать runner; либо принимать `--python`.
- [x] R2.4 Сделать импорт `numpy` ленивым в `tools/common.py` для команд, которым он не нужен (`--help`, `beats` без аудио и т.п.), либо явно требовать venv с понятным сообщением.
- [x] R2.5 Добавить bootstrap-скрипт (`bootstrap.ps1`/`bootstrap.sh`) **без автозапуска установки**: только проверка и печать команд.
- [x] R2.6 Обновить `README.md`, `MIGRATION.md`, `.sharrowkin/skills/**`: все команды — через `python tools/2dvideo.py` или явный venv.

**DoD:** `python tools/2dvideo.py doctor` и прямой запуск из документации дают одинаковый результат; `python tools/new_project.py --help` либо работает, либо печатает точную команду с venv, а не `ModuleNotFoundError`.

**Evidence (2026-11-07):**
- `requirements.txt`: numpy 2.5.4, scipy 1.18.1, faster-whisper 1.2.1, ctranslate2 4.8.3.
- `tools/2dvideo.py` resolver: `--python` → `PYTHON`/`PYTHON_EXE` → `.venv-whisper` → host; `doctor` печатает выбранный путь.
- `doctor.py` при вызове через runner проверяет venv; прямой запуск печатает свой интерпретатор.
- `tools/common.py` импортирует numpy только внутри `load_audio`; `python tools/new_project.py --help` и `beats.py --help` → exit 0 без numpy.
- `bootstrap.ps1` и `bootstrap.sh` только проверяют и печатают команды; Chromium определяется корректно.
- `README.md`, `MIGRATION.md` и 5 skills обновлены на `python tools/2dvideo.py` / явный venv.
- `npm test` → PASS 4/4; `verify_kit` 29/29 (12 intentional patches); CLI `mix` → exit 0.


---

## R3. CLI `mix` без ложных отказов — P0

**Цель:** финальная стадия запускается одной командой.

- [x] R3.1 Заменить `require_python_deps()` в `tools/2dvideo.py` на проверку через `PY -c "import numpy, scipy"`.
- [x] R3.2 Разделить проверки: `ffmpeg` — для init/timeline/mix; `numpy+faster_whisper` — для Whisper; `numpy+scipy` — для mix.
- [x] R3.3 Добавить `--dry-run`/`--check` для проверки зависимостей без запуска.
- [x] R3.4 Тест: `python tools/2dvideo.py mix --project projects/whisper_en_e2e` → exit 0, `out/*.mp4` содержит H.264+AAC.
- [x] R3.5 Тест негативный: без scipy в выбранном интерпретаторе — понятная ошибка, exit 2.

**DoD:** CLI `mix` работает на текущей машине; ложного «нет numpy/scipy» нет; финальный MP4 валиден.

**Evidence (2026-11-07):**
- `python tools/2dvideo.py check` → exit 0; печатает выбранный Python и проверяет ffmpeg, npm, Python-пакеты.
- `python tools/2dvideo.py --python C:\Python314\python.exe check` → exit 2, «numpy, scipy, faster_whisper» — корректный негативный тест.
- `python tools/2dvideo.py mix --project projects/whisper_en_e2e` → exit 0; `ffprobe`: H.264 + AAC, 9.893 s.
- `python tools/2dvideo.py --python C:\Python314\python.exe mix ...` → exit 2 с понятной командой установки.
- `npm test` → PASS 4/4; `verify_kit` 29/29 (12 intentional patches).


---

## R4. TTS через внешний API + тайминги (Whisper не обязателен) — P0

**Решение 2026-11-07:** Whisper-модель **не скачиваем**. Озвучка генерируется **внешним TTS API**, а не локальным TTS. На вход студии идут готовый WAV/MP3 и SRT/VTT/JSON с таймингами (либо TTS-провайдер отдаёт word timings). Whisper остаётся опциональным для legacy-аудио, но не является основным путём.

**Цель:** TTS-ролик проходит `init → timeline → beats` без Whisper и без скачивания моделей; финальная проверка озвучки/микса через ffmpeg/ffprobe — **только в конце, на готовом MP4**.

**Жёсткое правило:** Whisper — отдельный инструмент. Ему всегда подаётся **отдельный аудиофайл** через `--audio`; project `voiceover` и TTS-озвучка **не подставляются автоматически**. TTS-путь (`--mode timestamps`) Whisper не вызывает. API-ключи и вызов TTS-провайдера в этот репозиторий не добавляются.

- [ ] R4.1 Зафиксировать TTS API-контракт: `init --voice <wav|mp3> --script <srt|vtt|json>`; `timeline --mode timestamps`; текст и тайминги берутся из TTS-файла, не из распознавания.
- [ ] R4.2 Если TTS API не даёт тайминги — требовать SRT/JSON; не подменять их `.en`-моделью и не делать «примерную» раскладку без предупреждения.
- [ ] R4.3 Проверить, что `--mode auto` для `.srt/.vtt/.json` **не вызывает Whisper**; добавить тест с русским TTS WAV + SRT.
- [ ] R4.4 Добавить фикстуру русской TTS-озвучки из API + SRT и прогнать `init → timeline → beats → status`; проверить, что words/sentences совпадают с SRT.
- [~] R4.5 Legacy-путь: Whisper только с явным `--audio` и локальным `--model`; `.en` + не-`en` — понятная ошибка; автоскачивания нет.
- [x] R4.6 Обновить README/install/SKILL: TTS через API + SRT — основной путь; Whisper — опциональный legacy с отдельным аудио.
- [x] R4.7 Разделить зависимости: core/TTS (`numpy`, `scipy`) и legacy Whisper (`faster-whisper`); `check_env`/`2dvideo check` не требуют `faster_whisper` для TTS-пути.
- [ ] R4.8 Финальная проверка TTS-ролика через ffprobe/ffmpeg — на готовом MP4, не на этапе timeline; выполняется в конце.

**DoD:** русский TTS WAV + SRT проходит `init → timeline → beats` без Whisper, без модели и без сети; текст/тайминги совпадают с SRT; legacy-путь с Whisper требует отдельный `--audio`; финальный MP4 проверен ffprobe/ffmpeg в конце.

**Статус:** `[~]` — TTS API-контракт и разделение зависимостей готовы; ждёт API-фикстуру (WAV + SRT/JSON или word timings) и финальную проверку готового MP4.

**Evidence (частично, 2026-11-07):**
- `timeline --mode whisper` без `--audio` → exit 2, «Whisper работает только с отдельным аудио».
- `timeline --mode whisper --audio <file> --model <local-dir>` → exit 0, 14 слов.
- `check_env` → 14 checks, core/TTS = numpy/scipy; `Whisper legacy (optional)` не валит gate.
- `requirements.txt` — core/TTS; `requirements-whisper.txt` — optional legacy.
- `--audio` проброшен в `transcribe.py`; project voiceover/TTS туда автоматически не попадают.



---

## R5. Skills под реальный runtime — P0/P1

**Цель:** агент не вызывает несуществующие инструменты.

- [x] R5.1 Зафиксировать target: **DSH** (текущий DeepSeek Harness).
- [x] R5.2 В `.sharrowkin/skills/*` заменить: `ask_user` → `ask_user_question`; `run_command` → `bash`/`pwsh`; `run_background`/`process_output` → `job_output`; `view_image` → `read_image`; убрать слэш-команды.
- [x] R5.3 Все команды stages привести к `python tools/2dvideo.py` или явному venv.
- [x] R5.4 Учесть ограничение: `read_image` требует image-capable модель; в skills добавить fallback/проверку.
- [x] R5.5 Добавить grep-тест: в skills нет запрещённых имён инструментов.
- [x] R5.6 Синхронизировать `references/install.md` с фактическим окружением.

**DoD:** ни один skill не ссылается на отсутствующий инструмент; команды из skills воспроизводятся в текущем runtime.

**Evidence (2026-11-07):**
- `python .sharrowkin/scripts/check_skills.py` → 16 файлов, 0 stale reference(s), exit 0.
- Обновлены 5 skills + `references/install.md`, `sound-design.md`, `render-qc.md`; metadata `adapted_for: DSH (DeepSeek Harness)`.
- Убраны `run_command`, `run_background`, `process_output`, `view_image`, `ask_user`, `AskUserQuestion`, слэш-команды.
- Добавлен fallback: если `read_image` недоступен, visual QC помечается как pending, а не выдумывается.
- `npm test` → PASS 5/5 (python syntax, ESM, skill runtime, kit 29/29, environment).


---

## R6. Порядок и чистота (без упаковки) — P0/P1

**Цель:** навести порядок в рабочей копии и сделать структуру предсказуемой. **Упаковка/artifact откладывается до R15**, пока проект не отполирован.

- [x] R6.1 Удалить/изолировать generated junk: `%SystemDrive%`, `debug.log`, `__pycache__`, `.whisper-e2e-test`; `.qoder` оставлен как отдельный Qoder bridge (не нужен для рендера, но не мусор).
- [x] R6.2 Решить судьбу `original/skills/vizavi-motion`: **оставить отдельным optional overlay/reference**, не включать в основной 2D-runtime; стилевые грамматики — backlog R16. `.qoder` bridge не трогать, пока используется Qoder.
- [ ] R6.3 Разложить тестовые проекты: `_smoke` и `whisper_en_e2e` — fixtures; `mars_star_robot_test`, `qoder_scene_test`, `vizavi_paper_test` — в `tests/fixtures` или `examples`; пользовательские `projects/*/out` не трогать.
- [x] R6.4 Проверить `.gitignore` и `git ls-files` на тяжёлые/сгенерированные файлы: `node_modules`, venv, модели, `build/out`, аудио, `.db`.
- [x] R6.5 Зафиксировать структуру проекта в `docs/PROJECT_STRUCTURE.md`: что где лежит, что read-only, что генерируется.
- [x] R6.6 Проверить, что в репозитории нет секретов/API-ключей и пользовательских аудио вне fixtures.

**DoD:** дерево чистое и понятное; тяжёлые/generated файлы не отслеживаются; тестовые проекты отделены от пользовательских; структура описана. Упаковка здесь **не выполняется**.

**Evidence (2026-11-07):**
- Удалены после проверки: `%SystemDrive%`, `2d-video/debug.log`, `.whisper-e2e-test`, `__pycache__` вне venv.
- `.qoder` оставлен как bridge; `original/skills/vizavi-motion` — optional reference.
- `docs/PROJECT_STRUCTURE.md` создан.
- `git ls-files`: 181 файл, 2.99 MB; 0 файлов >1 MB; `node_modules`, venv, `__pycache__` не отслеживаются.
- Секреты/ключи: `git grep` по приватным ключам и API-key шаблонам — совпадений нет.
- R6.3 отложен: тестовые проекты оставлены в `projects/`, чтобы не ломать существующие пути; перенос — после проверки ссылок.


**Решение по vizavi-motion (2026-11-07):** это не рендерер и не style pack, а режиссёрский overlay. Шесть стилей из оригинала — исторические prompt-описания конкретного демо; в `engine/styles.js` их нет. Сейчас `vizavi-motion` остаётся optional-надстройкой, основной pipeline — `make-2d-video` + `video-styles` (5 color-grade пресетов). Интеграция style grammars (ink/paper/pixel/SaaS 2D/2.5D/3D) — отдельная будущая задача R16, не блокирует production-ready.

---

## R7. Безопасность ввода `new_project.py` — P1

- [x] R7.1 Валидировать `--name`: `^[A-Za-z0-9_][A-Za-z0-9_-]{0,63}$` (slug, без путей; Unicode-имена отклоняются).
- [x] R7.2 Резолвить путь и проверять, что он внутри `2d-video/projects`.
- [x] R7.3 Запрещать существующий проект без `--force`; с `--force` — обновлять config/input, сохраняя сцены.
- [x] R7.4 Атомарное создание: temp dir → rename, чтобы не оставлять половину проекта.
- [x] R7.5 Тесты: `..\outside`, абсолютный путь, пробелы, кириллица, существующий проект.

**DoD:** запись вне `projects/` невозможна; случайная перезапись существующего проекта невозможна без `--force`.

**Evidence (2026-11-07):**
- `python -m unittest discover -s tests -v` → 5 тестов OK.
- `../escape`, `..\escape`, `bad name`, `кириллица`, имя >64 символов → exit 2; запись вне `projects/` не создаётся.
- Новый проект создаётся; повтор без `--force` → exit 2; с `--force` → exit 0, sentinel scene сохраняется.
- Битый audio → проект и temp не остаются.
- `npm test` → PASS 6/6 (добавлены unit tests); `verify_kit` 29/29 (12 intentional patches).


---

## R8. Нормализация `--project` в CLI — P1

- [x] R8.1 Приводить `--project` к абсолютному пути до subprocess.
- [x] R8.2 Поддержать: `projects/x` (от студии), абсолютный путь, `2d-video/projects/x` от корня.
- [x] R8.3 Одинаково обрабатывать `timeline`, `beats`, `sheet`, `preview`, `render`, `mix`, `status`.
- [x] R8.4 Тесты из корня и из `2d-video/`.

**DoD:** одна и та же команда работает из корня и из студии; путь не дублируется (`2d-video/2d-video/...`).

**Evidence (2026-11-07):**
- `project_dir()` поддерживает `projects/x`, `./projects/x`, `2d-video/projects/x`, абсолютный путь.
- `cmd_timeline`, `cmd_beats`, `_render`, `cmd_mix` передают нормализованный абсолютный путь.
- [tests/test_project_paths.py](tests/test_project_paths.py): 3 теста; статус из корня для трёх вариантов и из студии — exit 0.
- `python -m unittest discover -s tests -v` → 8 тестов OK.


---

## R9. Тесты security-патча рендера — P1

- [x] R9.1 Добавить тестовый режим `--self-check` для allowlist/резолвера.
- [x] R9.2 Тесты: `/player.html` 200, `/__manifest` 200, `/project/config.json` 200, `/etc/passwd` 404, `..` 404, encoded traversal 404, symlink outside 404 (conditional), POST 405, HEAD 200.
- [ ] R9.3 Проверить, что сцена не может сделать внешний fetch (route guard + CSP).
- [x] R9.4 Проверить CSP-хеш import map.
- [~] R9.5 Прогнать на Windows и Linux: Windows — PASS; Linux-окружение недоступно.

**Evidence (2026-11-07):**
- `node render.mjs --project examples/reaction-time --self-check` → `SELF-CHECK PASS (11/11)`.
- [tests/test_render_security.py](tests/test_render_security.py) → PASS; 9 unit tests total.
- `npm test` → 6/6, exit 0; kit 29/29, 12 intentional patches.
- Symlink check skipped на Windows (`EPERM`); на Linux должен выполняться.
- R9.3 (внешний fetch) пока не автоматизирован; CSP и route guard присутствуют, но нужен отдельный browser test.


**DoD:** security-тесты автоматизированы и зелёные; регрессия не возвращает старую уязвимость.

---

## R10. Устойчивость и коды ошибок — P1

- [x] R10.1 Guard на пустые `words` в `parse_script.py`, `beats.py`, `transcribe.py`.
- [x] R10.2 Проверка `ffmpeg`/`ffprobe` до старта в CLI, parse_script и renderVideo; понятная ошибка.
- [x] R10.3 Единые exit codes: 0 — OK, 1 — stage failed, 2 — prerequisite/user error.
- [~] R10.4 Убирать partial outputs (`build/parts`) при падении; `preview.mp4` и старый финальный файл пока не трогаются.
- [x] R10.5 Тесты: пустой SRT, битый JSON, пустые words, нет audio, нет ffmpeg; сцена без scene остаётся warning, не ошибкой.

**DoD:** пользователь видит причину и следующий шаг; нет `IndexError`/сырых traceback на ожидаемых ошибках.

**Evidence (2026-11-07):**
- [tests/test_error_handling.py](tests/test_error_handling.py): 6 тестов, включая empty SRT, bad JSON, empty words, no audio, no ffmpeg.
- `python -m unittest discover -s tests -v` → 15 тестов OK.
- `npm test` → 6/6, exit 0; `verify_kit` 29/29, 12 intentional patches.
- `parse_script.py`/`beats.py` имеют `FAIL:` и exit 2; `transcribe.py` — exit 2 для отсутствия audio/model/faster-whisper.
- `render.mjs` проверяет ffmpeg и удаляет `build/parts` при ошибке.


---

## R11. GPU и производительность — P1

- [x] R11.1 `doctor.py`: явно пишет `torch`, `ctranslate2`, CUDA, выбранный device.
- [x] R11.2 `transcribe.py`: `WHISPER_DEVICE=cpu|cuda|auto`; при CUDA — проверка доступности.
- [x] R11.3 Документировать CUDA/torch отдельно, без автозапуска; добавлен `docs/benchmarks.md`.
- [~] R11.4 Замерены 7 s 1080p (168 кадров, ~12.2 fps) и один 4K still (2.73 s); полный 1 min 1080p/4K не гонялся.
- [~] R11.5 `--workers` ограничен 8; отдельного memory stress-test нет.

**DoD:** doctor не обещает GPU, которого нет; есть проверенные цифры производительности.

**Evidence (2026-11-07):**
- `python tools/2dvideo.py doctor`: `torch not installed`, `CUDA available: False`, `Whisper device: cpu`.
- `WHISPER_DEVICE=cuda` без CUDA/torch → exit 2 с понятной ошибкой.
- [docs/benchmarks.md](docs/benchmarks.md): 1080p 7 s → 15.12 s (~12.2 fps); 4K still → 2.73 s.
- `npm test` → 6/6; `verify_kit` 29/29, 12 intentional patches.


---

## R12. Документация: truth pass — P1

- [x] R12.1 Обновить `README.md`: фактические версии, venv, модель, права, команды, ограничения.
- [x] R12.2 Обновить `MIGRATION.md`: 29/29, 12 патчей, реальные артефакты, 43 файла в `original/`.
- [x] R12.3 Обновить `references/install.md`, `render-qc.md`, `SKILL.md` под текущие команды.
- [x] R12.4 Добавить troubleshooting: venv, модель, ffmpeg, Chromium, права, кириллица.
- [~] R12.5 Проверить команды из README: все `--help` (10 команд) exit 0; `doctor/check/status` exit 0; полный render/mix — по ранее снятым evidence, не перезапускались.

**DoD:** нет утверждений, противоречащих фактическому состоянию; новый человек проходит путь без догадок.

**Evidence (2026-11-07):**
- README: текущие 6/6, 20 unit tests, 14 env checks, 12 patches; TTS через внешний API; финальный ffprobe/ffmpeg — в конце.
- MIGRATION: таблица проверок обновлена; исторические числа отделены.
- install/render-qc/SKILL: команды `python tools/2dvideo.py`, отдельный `--audio` для Whisper, финальный ffmpeg QC.
- README troubleshooting: venv, ffmpeg, Chromium, кириллица, Whisper audio, TTS timing, duration.
- CLI: `doctor/check/status --help` и все subcommand `--help` → exit 0; `doctor/check/status` → exit 0.

### Независимый аудит 2026-11-07 — исправлено

- A03: `wordTime` Unicode-aware; RU-слово находится, пустой ключ → null.
- A09: короткая музыка/фейд не падает на длине < 3 s.
- A10: VTT settings не попадают в текст; reverse/Infinity/non-finite интервалы отклоняются.
- A01: finite/interval validation до записи; `write_timeline` пишет через temp + replace.
- A05: `mix` отказывает, если voice длиннее story; `--allow-truncate` — явный opt-in.
- A06: `listScenes` проверяет realpath, containment и циклы.
- A02/A08: missing scene/scene errors валят финальный рендер; worker ffmpeg проверяет exit code; browser закрывается в `finally`; `build/parts` чистится.
- A07: canvas очищается перед transition compositing.
- A11: `--project` containment в `2d-video/projects`.
- A12/A13/A14/A15: runner config/timestamps guards; check_env проверяет exit code; transcribe проверяет script/alignment; self-check тестирует sentinel через symlink.
- A04: `--force` обновляет config/input с rollback и запрещает symlink destinations.
- Docs: README/MIGRATION примеры передают script и `--mode timestamps`; `--model small` убран.

**Ещё не закрыто:** R9.3 (браузерный внешний fetch), R9.5 (Linux), R10.4 (старые preview/final), fault-injection тест rollback A04, symlink-тест на Linux; полный E2E — R14.


---

## R13. Тесты и CI — P2

- [ ] R13.1 Unit-тесты: `parse_script`, `beats`, `dsp`, `mix` (на коротких фикстурах).
- [ ] R13.2 Integration: render sheet 16:9/9:16, preview, mux.
- [ ] R13.3 CI: syntax + unit + integrity + короткий render; без сети/модели или с mock.
- [ ] R13.4 `npm test` запускает всё; отдельный `npm run test:integration`.
- [ ] R13.5 Coverage/отчёт не обязателен, но failures должны быть воспроизводимы.

**DoD:** CI зелёный; регрессии ловятся до ручного запуска.

---

## R14. End-to-end приёмка — P2

- [ ] R14.1 Русская TTS API-озвучка + SRT: `init → timeline → beats → sheet → preview → render → mix`.
- [ ] R14.2 Если TTS API не даёт SRT — требовать JSON с word timings; Whisper multilanguage только отдельным `--audio`, не основной путь.
- [ ] R14.3 16:9 1080p и 9:16 1080p; один 4K-кадр/короткий фрагмент.
- [ ] R14.4 Проверить **готовый** MP4 в конце: duration, H.264, AAC, −14 LUFS, отсутствие чёрных/битых кадров (ffprobe/ffmpeg).
- [ ] R14.5 Проверить установку на чистой машине/VM по README.

**DoD:** два реальных ролика (16:9 и 9:16) проходят полный цикл; приёмка подписана.

---

## R15. Релиз и упаковка — P2

- [ ] R15.1 Финальный `npm test` + `doctor` + security-тесты.
- [ ] R15.2 Собрать artifact без кэшей; проверить размер и состав.
- [ ] R15.3 Проверить установку на чистой папке: `npm ci`, venv, `doctor`, короткий render sheet.
- [ ] R15.4 Обновить `AUDIT.md`/`ROADMAP.md`: все P0/P1 закрыты или явно приняты.
- [ ] R15.5 Tag/version, changelog, инструкция отката.
- [ ] R15.6 Передать пользователю: что изменено, что проверено, что осталось.

**DoD:** релиз воспроизводим, P0/P1 не открыты, есть откат, установка на чистой машине проверена.

---

## R16. Backlog: style grammars (optional, после production-ready)

**Не входит в текущий P0/P1.** Шесть стилей Vizavi (ink, paper, pixel, 2D/2.5D/3D SaaS) — это визуальные грамматики, а не color-grade пресеты. Для них нужны новые scene helpers, шрифты/текстуры, тесты и, возможно, ассетный pipeline. Сейчас штатные стили — 5 пресетов `engine/styles.js` (`dusk`, `midnight`, `golden`, `neon`, `storybook`) плюс custom grade.

- [ ] R16.1 Определить, что именно нужно: color grade, visual grammar или image-generation pipeline.
- [ ] R16.2 Спроектировать API стиля без поломки текущих 5 пресетов.
- [ ] R16.3 Реализовать 1–2 грамматики как пилот, с тестами и visual QC.
- [ ] R16.4 Решить, нужны ли внешние image/3D-провайдеры; не добавлять без явного разрешения.

---

## R17. Integration backlog (TBD)

**Проект остаётся открытым для внедрений.** Точный scope появится, когда пользователь назовёт интеграцию. До этого не замораживать API и не собирать финальный artifact.

- [ ] R17.0 `Ifverse/` — reserved future-integration workspace; не трогать до отдельного решения.
- [ ] R17.1 Зафиксировать, что именно внедряем: TTS-провайдер, style picker, Ifverse, API/сервис, другое.
- [ ] R17.2 Определить контракт входа/выхода: story/script, TTS WAV + SRT/JSON, style id, project id.
- [ ] R17.3 Добавить adapter layer, не меняя core engine и не ломая текущий CLI.
- [ ] R17.4 Integration-тесты на контракт; smoke на реальном TTS.
- [ ] R17.5 Только после этого — version freeze и упаковка.

---

## Сводная таблица

| ID | Приоритет | Тема | Зависит от | Статус |
|---|---|---|---|---|
| R0 | P0 | Страховка, git, патчи | — | [x] |
| R1 | P0 | Зелёный gate | R0 | [x] |
| R2 | P0 | Python/venv | R0 | [x] |
| R3 | P0 | CLI mix | R2 | [x] |
| R4 | P0 | TTS API + тайминги (Whisper опционален) | R2 | [~] |
| R5 | P0/P1 | Skills/runtime | R2 | [x] |
| R6 | P0/P1 | Порядок и чистота | R0 | [~] |
| R7 | P1 | Безопасность `new_project` | R2 | [x] |
| R8 | P1 | Пути `--project` | R2 | [x] |
| R9 | P1 | Security-тесты рендера | R1 | [~] |
| R10 | P1 | Ошибки/exit codes | R2 | [~] |
| R11 | P1 | GPU/производительность | R2 | [~] |
| R12 | P1 | Документация | R2–R6 | [~] |
| R13 | P2 | Тесты/CI | R1–R12 | [ ] |
| R14 | P2 | E2E-приёмка | R1–R13 | [ ] |
| R15 | P2 | Релиз | R14 | [ ] |

## Ближайший checkpoint

После `R1–R3` должно быть: `npm test` зелёный, CLI `mix` работает, Python-окружение однозначное. После `R4` — TTS API WAV + SRT проходят `init/timeline/beats` без Whisper; финальная проверка MP4 — через ffprobe/ffmpeg в конце. После `R6` — чистое и понятное дерево проекта, без упаковки. После `R12` — документация, которой можно верить. После `R14` — приёмка на реальных роликах; упаковка/artifact — только в R15.
