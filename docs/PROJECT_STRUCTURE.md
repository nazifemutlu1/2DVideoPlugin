# PROJECT_STRUCTURE

Карта рабочего workspace `F:\AI\2DVideoPlugin`. Цель — отделить исходники от runtime-мусора и не перепутать TTS-путь с legacy-Whisper.

## Верхний уровень

```text
2d-video.plugin       исходный архив Claude-плагина, read-only
original/             распакованный оригинал, read-only reference
2d-video/             рабочая студия: renderer, engine, tools, audio, examples
.sharrowkin/          skills + QA-скрипты + runtime state (часть ignored)
Ifverse/              reserved future-integration workspace; НЕ ТРОГАТЬ (R17)
tools/2dvideo.py      CLI-обёртка над студией
patches/              намеренные отличия от оригинала
requirements.txt      core/TTS: numpy, scipy
requirements-whisper.txt  optional legacy: faster-whisper, ctranslate2
bootstrap.ps1/.sh     read-only preflight, ничего не устанавливает
README.md             входная документация
AUDIT.md              результаты аудита
ROADMAP.md            план R0–R16
ENVIRONMENT.md        снимок версий и размеров
docs/                 структура и служебные документы
dist/                 будущий artifact (R15; в git не входит)
```

## `2d-video/` — рабочая студия

| Путь | Что это | Можно ли менять |
|---|---|---|
| `render.mjs` | HTTP-сервер, Playwright, ffmpeg | только через патч + тесты |
| `player.html` | страница рендера + CSP | только через патч |
| `engine/` | Canvas/Three.js, сцены, стили | с осторожностью, стили — через `styles.js` |
| `tools/` | `new_project`, `parse_script`, `transcribe`, `beats`, `doctor`, `verify_kit` | да, с тестами |
| `audio/` | музыка, SFX, mix, DSP | да, с тестами |
| `examples/reaction-time/` | эталонный пример на 14 кадров | не ломать API |
| `package.json`, `package-lock.json` | npm-зависимости | только осознанно |
| `projects/` | рабочие и тестовые проекты | да, но не удалять пользовательские `out` |
| `node_modules/` | установленные npm-пакеты | generated, ignored |
| `projects/*/build`, `out`, `review` | рендеры и QC | generated, ignored |

## `projects/` — что где

| Проект | Роль |
|---|---|
| `_smoke` | техническая fixture: тон + SRT, без сцен |
| `whisper_en_e2e` | fixture: английское аудио + timeline + сцены + готовый MP4 |
| `mars_star_robot_test` | тестовые 3D/2D-сцены, без озвучки |
| `qoder_scene_test` | тестовая сцена, без озвучки |
| `vizavi_paper_test` | тестовая 9:16-сцена, без озвучки |

`mars_star_robot_test`, `qoder_scene_test`, `vizavi_paper_test` — **не пользовательские ролики**. Их можно позже перенести в `tests/fixtures`, но сначала нужно проверить ссылки в документации.

## TTS-путь

```text
история/сценарий
  → внешний TTS API: WAV/MP3 + SRT/VTT/JSON
  → init --voice ... --script ...
  → timeline --mode timestamps
  → beats → сцены → style/preview → render → mix
  → финальная проверка готового MP4: ffprobe/ffmpeg
```

Whisper в этом пути **не вызывается**. TTS API не встроен в студию: ключи/вызовы не хранятся в репозитории.

## Legacy Whisper

```text
отдельное аудио
  → timeline --mode whisper --audio <file> --model <local-dir> --lang ...
```

Правила:

- `--audio` обязателен;
- project `voiceover` и TTS-озвучка не подставляются;
- `--model` — локальный каталог, без автоскачивания;
- `faster-whisper` — optional, не требуется для TTS.

## Что не коммитится / не входит в runtime

- `.venv-whisper/`, `2d-video/node_modules/`, Chromium, Whisper-модели;
- `projects/*/build`, `projects/*/out`, `projects/*/review`;
- `__pycache__`, `*.pyc`, `*.log`, `%SystemDrive%`, `.qoder`, `.whisper-e2e-test`;
- `.sharrowkin/brain.db`, `skills.sqlite`, `context/`, `checkpoints/`, `snapshots/`;
- `dist/`.

## `original/` и `patches/`

- `original/` — эталон; **не редактировать**.
- `patches/` — три исходных + `runtime-python`; применяются с `git -c core.autocrlf=false apply`.
- `vizavi-motion` — optional overlay/reference, не часть core 2D-pipeline. Стилевые грамматики — backlog R16.

## Правило изменений

1. Сначала `npm test` и `python tools/2dvideo.py check`.
2. Менять только рабочую копию, не `original/`.
3. Намеренное изменение `player.html`/`render.mjs`/`transcribe.py` — через патч + обновление `verify_kit`.
4. После изменений — evidence в `ROADMAP.md`.
