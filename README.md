# 2D Video для DeepSeek Harness (DSH)

Порт Claude-плагина `2d-video.plugin`: движок, рендерер, аудио-инструменты, примеры и стили сохранены. Творческие правила — в `.sharrowkin/skills/`.

## Что где лежит

| Путь | Что это |
|---|---|
| `2d-video.plugin` | исходный архив, не изменяется |
| `original/` | распакованный оригинал; read-only reference |
| `2d-video/` | рабочая студия: код + намеренные патчи (CSP, security, offline Whisper) |
| `.venv-whisper/` | рабочий Python 3.12 с numpy/scipy; faster-whisper — optional legacy (не коммитится) |
| `.sharrowkin/skills/` | skills и references |
| `tools/2dvideo.py` | CLI-обёртка над студией |
| `patches/` | намеренные отличия от оригинала (CSP, security, offline Whisper, runtime-python) + инструкция |
| `requirements.txt` | закреплённые Python-зависимости |
| `AUDIT.md`, `ROADMAP.md`, `ENVIRONMENT.md` | аудит, план, снимок окружения |

## Состояние на 2026-11-07

- Node.js 24.21.0, npm 11.19.0, FFmpeg 9.0.2 — есть.
- `2d-video/node_modules` установлены: `three`, `playwright`, три `@fontsource`.
- Chromium для Playwright установлен.
- `.venv-whisper`: Python 3.12.10, numpy 2.5.4, scipy 1.18.1; faster-whisper 1.2.1 — optional legacy.
- Системный Python 3.14 **не содержит** numpy/scipy/faster-whisper; используйте runner или venv.
- `npm test` — PASS 6/6: Python syntax, unit tests (20), ESM syntax, skills runtime, kit 29/29 (12 intentional patches), environment 14/14.
- Эталонный render sheet — PASS: 14 кадров + contact sheet.
- 9:16 sheet — PASS: 5 кадров 540×960.
- Финальный MP4 из `whisper_en_e2e` — H.264 + AAC, 9.893 s, −14.5 LUFS.
- Основной путь озвучки — **TTS через внешний API + SRT/JSON**: API отдаёт готовый WAV/MP3 и тайминги, затем `init --voice ... --script ...` и `timeline --mode timestamps`. Whisper не требуется.
- Whisper `small.en` остаётся только как legacy-опция для английского; для русского TTS-путь не использует модель.
- Финальная проверка озвучки/микса через `ffprobe`/`ffmpeg` — только в конце, на готовом MP4, а не на этапе timeline.

Полные доказательства и открытые P0/P1 — в [AUDIT.md](AUDIT.md) и [ROADMAP.md](ROADMAP.md).

## Как вызывать

Из корня проекта:

```powershell
python tools/2dvideo.py doctor
python tools/2dvideo.py check
python tools/2dvideo.py init --name test --voice "C:/audio/voice.mp3" --script "C:/audio/script.srt" --title "Тест" --lang ru
python tools/2dvideo.py timeline --project projects/test --mode timestamps
python tools/2dvideo.py beats --project projects/test
python tools/2dvideo.py status --project projects/test
python tools/2dvideo.py sheet --project projects/test
python tools/2dvideo.py preview --project projects/test --from 0 --to 30
python tools/2dvideo.py render --project projects/test
python tools/2dvideo.py mix --project projects/test
```

Быстрый gate: `npm test`. Integration smoke (16:9/9:16 sheet, preview, короткий mux): `npm run test:integration`.

Runner сам выбирает Python в таком порядке: `--python` → `PYTHON`/`PYTHON_EXE` → `.venv-whisper` → системный. `--project` принимает `projects/x`, `2d-video/projects/x` или абсолютный путь — одинаково для всех команд.

```powershell
python tools/2dvideo.py --python ".\.venv-whisper\Scripts\python.exe" doctor
```

Прямые команды `python tools/*.py` допустимы только для не-аудио этапов; для Whisper и `audio/mix.py` нужен venv. Для `audio/mix.py` сначала перейдите в `2d-video/`:

```powershell
cd 2d-video
..\.venv-whisper\Scripts\python.exe audio/mix.py --project projects/test
```

Сцены (`scenes/shots/*.js`) пишет модель по правилам из `references/style-bible.md` и `engine-api.md`.

## TTS через внешний API

Озвучка генерируется **внешним TTS API**, а не локальным TTS. Студия не вызывает API сама и не хранит API-ключи: на вход приходят готовые файлы.

```text
история/сценарий
  → внешний TTS API
  → voice.wav / voice.mp3 + script.srt (или JSON с word timings)
  → init --voice ... --script ...
  → timeline --mode timestamps
  → beats → сцены → preview → render → mix
  → финальная проверка готового MP4: ffprobe/ffmpeg
```

Правила:

- если API не отдаёт тайминги — нужен SRT/VTT/JSON, а не «примерная» раскладка;
- fallback для аудио без таймингов: `python tools/tts_pause_srt.py --audio <mp3> --text <txt> --out <srt>`; границы предложений берутся из пауз, времена слов интерполируются — это **не** word timings провайдера;
- TTS-файл не подаётся в Whisper автоматически;
- финальный `ffprobe`/`ffmpeg`-контроль (кодек, длительность, audio stream, loudness) выполняется **в конце**, на готовом ролике.

## Whisper — только отдельное аудио

Основной путь — **TTS через внешний API + SRT/JSON**; Whisper в нём не участвует и не вызывается автоматически.

Если нужен legacy-Whisper, ему всегда подаётся **отдельный аудиофайл**:

```powershell
python tools/2dvideo.py timeline `
  --project projects/test `
  --mode whisper `
  --audio "C:\audio\whisper_input.wav" `
  --model "C:\models\faster-whisper-small" `
  --lang en
```

Правила:

- `--audio` обязателен; проектный `voiceover` и TTS-озвучка **не подставляются** по умолчанию;
- `--model` — локальный каталог CTranslate2; автоскачивания нет;
- TTS-путь (`--mode timestamps`) Whisper не требует и `--audio` не использует.

## Зависимости и первый запуск

Ничего не устанавливается автоматически. Проверка и точные команды:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\bootstrap.ps1
```

Ручная установка (только с разрешения):

```powershell
python -m venv .venv-whisper
.\.venv-whisper\Scripts\python.exe -m pip install -r requirements.txt
cd 2d-video
npm install
npx playwright install chromium
```

`requirements.txt` — только core/TTS (`numpy`, `scipy`). Legacy Whisper ставится отдельно:

```powershell
.\.venv-whisper\Scripts\python.exe -m pip install -r requirements-whisper.txt
```

`bootstrap.ps1` только проверяет окружение и печатает команды; он ничего не устанавливает.

Проверка HTTP-сервера рендера без полного рендера:

```powershell
cd 2d-video
node render.mjs --project examples/reaction-time --self-check
```

## Troubleshooting

- **`ModuleNotFoundError: numpy`** — запускайте через `python tools/2dvideo.py` (он выбирает venv) или явно `.venv-whisper\Scripts\python.exe`.
- **`ffmpeg not found`** — установите ffmpeg/ffprobe и откройте новый терминал; проверка: `python tools/2dvideo.py check`.
- **`Chromium for Playwright` missing** — `cd 2d-video; npx playwright install chromium`.
- **Кириллица в кадре** — используйте Nunito/Playfair; Fredoka только Latin.
- **Whisper не видит речь** — проверьте, что передан отдельный `--audio`, локальный `--model` и правильный `--lang`; TTS-файл не подставляется автоматически.
- **TTS API не дал тайминги** — запросите SRT/VTT/JSON; не подменяйте распознаванием.
- **Финальный MP4 короче/длиннее** — сверьте `story.duration` с `shots.json`, затем проверьте `mix` и `ffprobe` в конце.

## Ограничения

- `Ifverse/` — reserved future-integration workspace; сейчас не трогаем, не чистим и не включаем в artifact.
- TTS через внешний API + SRT/JSON не использует Whisper; legacy-путь с Whisper `small.en` ограничен английским.
- `vizavi-motion` — optional режиссёрский overlay, не часть основного runtime. Шесть Vizavi-стилей (ink/paper/pixel/SaaS) — backlog R16, а не текущие пресеты. Сейчас выбор стиля — 5 color-grade пресетов `engine/styles.js`.
- Полный длинный рендер 4K не проверялся; проверены sheet, 9:16 sheet, preview и финальный 9.9-секундный MP4.
- Skills адаптированы под DSH: `ask_user_question`, `bash`/`pwsh`, `job_output`, `read_image`; слэш-команд нет.
- Художественная оценка кадров требует image-capable модели; текущая модель не читает PNG через `read_image`.
