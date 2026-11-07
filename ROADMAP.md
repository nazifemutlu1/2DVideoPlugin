# ROADMAP: 2DVideoPlugin → production-ready

Основание: [AUDIT.md](AUDIT.md). Статус на 2026-11-07: аудит завершён, **R0–R3 и R5 выполнены**; R4 пере-сформулирован под TTS и ждёт TTS-фикстуру; следующий исполнимый пункт — R6. Этот файл — источник истины по порядку работ.

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
- `AUDIT.md`/`ROADMAP.md` лежат только в корне; в `2d-video/` и `.sharrowkin/skills/` их нет. Финальная проверка package — в R6.


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
- `npm test` → PASS 4/4; `verify_kit` 29/29 (5 intentional patches); CLI `mix` → exit 0.


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
- `npm test` → PASS 4/4; `verify_kit` 29/29 (5 intentional patches).


---

## R4. TTS-озвучка и тайминги (Whisper не обязателен) — P0

**Решение 2026-11-07:** Whisper-модель **не скачиваем**. Озвучку делаем через TTS; на вход студии идут готовый WAV/MP3 и SRT/VTT/JSON с таймингами (либо TTS-провайдер отдаёт word timings). Whisper остаётся опциональным для legacy-аудио, но не является основным путём.

**Цель:** TTS-ролик проходит `init → timeline → beats` без Whisper и без скачивания моделей.

- [ ] R4.1 Зафиксировать TTS-контракт: `init --voice <wav|mp3> --script <srt|vtt|json>`; `timeline --mode timestamps`; текст и тайминги берутся из TTS-файла, не из распознавания.
- [ ] R4.2 Если TTS не даёт тайминги — требовать SRT/JSON; не подменять их `.en`-моделью и не делать «примерную» раскладку без предупреждения.
- [ ] R4.3 Проверить, что `--mode auto` для `.srt/.vtt/.json` **не вызывает Whisper**; добавить тест с русским TTS WAV + SRT.
- [ ] R4.4 Добавить фикстуру русской TTS-озвучки + SRT и прогнать `init → timeline → beats → status`; проверить, что words/sentences совпадают с SRT.
- [ ] R4.5 Legacy-путь: Whisper только по явному локальному пути; `.en` + не-`en` — понятная ошибка; автоскачивания нет.
- [ ] R4.6 Обновить README/install/SKILL: TTS + SRT — основной путь; Whisper — опциональный legacy.

**DoD:** русский TTS WAV + SRT проходит `init → timeline → beats` без Whisper, без модели и без сети; текст/тайминги совпадают с SRT; legacy-путь с Whisper не ломает этот сценарий.

**Статус:** `[~]` — решение принято, реализация ждёт TTS-провайдера/фикстуру (WAV + SRT или word timings).


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

## R6. Версии, упаковка и чистота — P0/P1

**Цель:** воспроизводимый артефакт без пользовательских данных.

- [ ] R6.1 Выровнять версии: plugin `0.1.1`, studio `1.0.1`, skill `0.1.1-sharrowkin.1` → одна схема; добавить `CHANGELOG.md`.
- [ ] R6.2 Удалить/изолировать `%SystemDrive%`, `debug.log`, `__pycache__`, `.qoder`, `.whisper-e2e-test`; решить судьбу `original/skills/vizavi-motion` (лишний относительно архива).
- [ ] R6.3 Перенести тестовые проекты в `tests/fixtures` или `examples`; не включать `build/`, `out/`, аудио пользователя в пакет.
- [ ] R6.4 Добавить `MANIFEST`/`package`-скрипт: только код, skills, references, examples, package-lock, requirements.
- [ ] R6.5 Проверить сборку на чистой папке: распаковать, `npm ci`, создать venv, `doctor`, короткий render sheet.

**DoD:** размер артефакта без кэшей/модели/venv/проектов; `git status` чистый; установка на чистой машине воспроизводится по README.

---

## R7. Безопасность ввода `new_project.py` — P1

- [ ] R7.1 Валидировать `--name`: `^[a-z0-9][a-z0-9_-]*$` (или явно разрешить Unicode с проверкой).
- [ ] R7.2 Резолвить путь и проверять, что он внутри `2d-video/projects`.
- [ ] R7.3 Запрещать существующий проект без `--force`; с `--force` — явное подтверждение.
- [ ] R7.4 Атомарное создание: temp dir → rename, чтобы не оставлять половину проекта.
- [ ] R7.5 Тесты: `..\outside`, абсолютный путь, пробелы, кириллица, существующий проект.

**DoD:** запись вне `projects/` невозможна; случайная перезапись существующего проекта невозможна без `--force`.

---

## R8. Нормализация `--project` в CLI — P1

- [ ] R8.1 Приводить `--project` к абсолютному пути до subprocess.
- [ ] R8.2 Поддержать: `projects/x` (от студии), абсолютный путь, optionally `2d-video/projects/x` от корня.
- [ ] R8.3 Одинаково обрабатывать `timeline`, `beats`, `sheet`, `preview`, `render`, `mix`, `status`.
- [ ] R8.4 Тесты из корня и из `2d-video/`.

**DoD:** одна и та же команда работает из корня и из студии; путь не дублируется (`2d-video/2d-video/...`).

---

## R9. Тесты security-патча рендера — P1

- [ ] R9.1 Вынести/экспортировать allowlist/резолвер в тестируемую функцию (или добавить тестовый режим `--self-check`).
- [ ] R9.2 Тесты: `/player.html` 200, `/__manifest` 200, `/project/config.json` 200, `/etc/passwd` 404, `..` 404, encoded traversal 404, symlink outside 404, POST 405, HEAD 200.
- [ ] R9.3 Проверить, что сцена не может сделать внешний fetch (route guard + CSP).
- [ ] R9.4 Проверить CSP-хеш import map и реакцию на его изменение.
- [ ] R9.5 Прогнать на Windows и Linux (если доступно).

**DoD:** security-тесты автоматизированы и зелёные; регрессия не возвращает старую уязвимость.

---

## R10. Устойчивость и коды ошибок — P1

- [ ] R10.1 Guard на пустые `words` в `parse_script.py`, `beats.py`, `transcribe.py`.
- [ ] R10.2 Проверка `ffmpeg`/`ffprobe` до старта; понятная ошибка при `spawn` failure.
- [ ] R10.3 Единые exit codes: 0 — OK, 1 — stage failed, 2 — prerequisite/user error.
- [ ] R10.4 Убирать partial outputs (`build/parts`, `preview.mp4`) при падении, чтобы не выдавать битый файл за готовый.
- [ ] R10.5 Тесты: пустой SRT, нет озвучки, нет сцены, нет ffmpeg, битый JSON.

**DoD:** пользователь видит причину и следующий шаг; нет `IndexError`/сырых traceback на ожидаемых ошибках.

---

## R11. GPU и производительность — P1

- [ ] R11.1 `doctor.py`: явно писать `torch`, `ctranslate2`, CUDA, выбранный device.
- [ ] R11.2 `transcribe.py`: `WHISPER_DEVICE=cpu|cuda|auto`; при CUDA — проверка доступности.
- [ ] R11.3 Документировать установку CUDA-совместимого `torch` отдельно, без автозапуска.
- [ ] R11.4 Замерить: 1 мин 1080p и 1 кадр 4K; записать fps/ETA в `docs/benchmarks.md`.
- [ ] R11.5 Проверить, что `--workers` не превышает лимиты и не роняет память.

**DoD:** doctor не обещает GPU, которого нет; есть проверенные цифры производительности.

---

## R12. Документация: truth pass — P1

- [ ] R12.1 Обновить `README.md`: фактические версии, venv, модель, права, команды, ограничения.
- [ ] R12.2 Обновить `MIGRATION.md`: 26/29 vs 29/29, реальные артефакты, патчи, 55 файлов в `original/`.
- [ ] R12.3 Обновить `references/install.md`, `render-qc.md`, `SKILL.md` под текущие команды.
- [ ] R12.4 Добавить troubleshooting: venv, модель, ffmpeg, Chromium, права, кириллица.
- [ ] R12.5 Проверить каждую команду из README в чистом shell.

**DoD:** нет утверждений, противоречащих фактическому состоянию; новый человек проходит путь без догадок.

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

- [ ] R14.1 Русская озвучка + SRT: `init → timeline → beats → sheet → preview → render → mix`.
- [ ] R14.2 Русская озвучка без SRT: Whisper multilanguage.
- [ ] R14.3 16:9 1080p и 9:16 1080p; один 4K-кадр/короткий фрагмент.
- [ ] R14.4 Проверить финальный MP4: duration, H.264, AAC, −14 LUFS, отсутствие чёрных/битых кадров.
- [ ] R14.5 Проверить установку на чистой машине/VM по README.

**DoD:** два реальных ролика (16:9 и 9:16) проходят полный цикл; приёмка подписана.

---

## R15. Релиз — P2

- [ ] R15.1 Финальный `npm test` + `doctor` + security-тесты.
- [ ] R15.2 Собрать artifact без кэшей; проверить размер и состав.
- [ ] R15.3 Обновить `AUDIT.md`/`ROADMAP.md`: все P0/P1 закрыты или явно приняты.
- [ ] R15.4 Tag/version, changelog, инструкция отката.
- [ ] R15.5 Передать пользователю: что изменено, что проверено, что осталось.

**DoD:** релиз воспроизводим, P0/P1 не открыты, есть откат.

---

## Сводная таблица

| ID | Приоритет | Тема | Зависит от | Статус |
|---|---|---|---|---|
| R0 | P0 | Страховка, git, патчи | — | [x] |
| R1 | P0 | Зелёный gate | R0 | [x] |
| R2 | P0 | Python/venv | R0 | [x] |
| R3 | P0 | CLI mix | R2 | [x] |
| R4 | P0 | TTS + тайминги (Whisper опционален) | R2 | [~] |
| R5 | P0/P1 | Skills/runtime | R2 | [x] |
| R6 | P0/P1 | Версии, упаковка | R0 | [ ] |
| R7 | P1 | Безопасность `new_project` | R2 | [ ] |
| R8 | P1 | Пути `--project` | R2 | [ ] |
| R9 | P1 | Security-тесты рендера | R1 | [ ] |
| R10 | P1 | Ошибки/exit codes | R2 | [ ] |
| R11 | P1 | GPU/производительность | R2 | [ ] |
| R12 | P1 | Документация | R2–R6 | [ ] |
| R13 | P2 | Тесты/CI | R1–R12 | [ ] |
| R14 | P2 | E2E-приёмка | R1–R13 | [ ] |
| R15 | P2 | Релиз | R14 | [ ] |

## Ближайший checkpoint

После `R1–R3` должно быть: `npm test` зелёный, CLI `mix` работает, Python-окружение однозначное. После `R4` — TTS WAV + SRT проходят `init/timeline/beats` без Whisper. После `R6` — чистый воспроизводимый артефакт. После `R12` — документация, которой можно верить. После `R14` — приёмка на реальных роликах.
