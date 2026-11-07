# ENVIRONMENT

Снимок окружения на момент начала исправлений (R0). Нужен, чтобы последующие проверки были воспроизводимы.

## Машина

| Параметр | Значение |
|---|---|
| ОС | Windows, AMD64 |
| CPU | 24 потока |
| GPU | NVIDIA GeForce RTX 4080 SUPER, 16 GB, driver 621.14 |
| CUDA/torch | `torch` не установлен; Whisper фактически работает на CPU |

## Runtime

| Компонент | Версия / путь |
|---|---|
| Node.js | 24.21.0 |
| npm | 11.19.0 |
| Python (система) | 3.14.7, `C:\Python314\python.exe` |
| Python (venv) | 3.12.10, `.venv-whisper\Scripts\python.exe` |
| FFmpeg / ffprobe | 9.0.2-full_build-www.gyan.dev |
| Playwright | 1.56.0 |
| Chromium | Playwright Chromium 1194, `C:\Users\vampa\AppData\Local\ms-playwright\chromium-1194\chrome-win\chrome.exe` |

## npm-пакеты (`2d-video`)

| Пакет | Версия |
|---|---|
| `three` | 0.169.0 |
| `playwright` | 1.56.0 |
| `@fontsource/fredoka` | 5.1.0 |
| `@fontsource/nunito` | 5.1.0 |
| `@fontsource/playfair-display` | 5.1.0 |

`npm ls --depth=0` — exit 0.

## Python-пакеты (`.venv-whisper`)

| Пакет | Версия |
|---|---|
| `numpy` | 2.5.4 |
| `scipy` | 1.18.1 |
| `faster-whisper` | 1.2.1 |
| `ctranslate2` | установлен |
| `onnxruntime` | установлен |
| `torch` | не установлен |

Системный Python 3.14 **не содержит** numpy/scipy/faster-whisper. Прямые команды `python tools/*.py` из старых docs поэтому падают; рабочий интерпретатор — venv.

## Whisper

| Параметр | Значение |
|---|---|
| Модель | `Systran/faster-whisper-small.en` |
| Snapshot | `d1d751a5f8271d482d14ca55d9e2deeebbae577f` |
| Размер | 486 099 705 байт (~486 MB) |
| Язык | **English-only**; для `ru` не подходит |

Модель лежит в `C:\Users\vampa\.cache\huggingface\hub\models--Systran--faster-whisper-small.en\snapshots\d1d751a5f8271d482d14ca55d9e2deeebbae577f`.

## Размеры каталогов

| Каталог | Размер |
|---|---:|
| `.venv-whisper` | 422 094 683 байт |
| `2d-video/node_modules` | 43 572 508 байт |
| `2d-video/projects` | 83 142 893 байта (основное — `build/out`) |
| `original` | 367 411 байт |
| `.sharrowkin` | 2 647 434 байта |

## Как воспроизвести

```powershell
node --version
npm --version
python --version
.\.venv-whisper\Scripts\python.exe --version
ffmpeg -version
cd 2d-video
npm ls --depth=0
..\.venv-whisper\Scripts\python.exe -c "import numpy, scipy, faster_whisper; print(numpy.__version__, scipy.__version__, faster_whisper.__version__)"
```

## Известные ограничения на момент R0

- `npm test` красный: `verify_kit` 26/29 из-за намеренных патчей (см. `patches/`).
- `tools/2dvideo.py mix` ложно сообщает об отсутствии numpy/scipy (P0-3).
- Whisper по умолчанию English-only (P0-4).
- Skills ссылаются на инструменты Sharrowkin, а не текущего DSH (P0-5).
- Нет `.git`/`.gitignore` до R0.1 (исправляется в R0).
