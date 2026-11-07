# Benchmarks

Локальные замеры на текущей машине. Это не SLA: цифры зависят от сцены, GPU, RAM и размера кадра.

## Машина

```text
Windows AMD64
24 CPU threads
NVIDIA RTX 4080 SUPER 16 GB
Node 24.21.0
Chromium Playwright 1194
render.mjs --gl auto
```

## 1080p preview

Команда:

```powershell
cd 2d-video
node render.mjs --project projects/qoder_scene_test --from 0 --to 10 --scale 1.5
```

Фактический проект имеет duration 7.0 s, поэтому отрендерилось 168 кадров 1920×1080.

```text
frames:       168
fps:          ~12.2
wall time:    15.12 s
output:       7.0 s H.264 1920×1080
```

Оценка для 1 минуты 1080p: около **2 минут** при той же сцене и одном worker. Это оценка, не замер полного 60-секундного рендера.

## 4K still

Команда:

```powershell
cd 2d-video
node render.mjs --project projects/qoder_scene_test --stills 3 --scale 3
```

```text
output:       3840×2160 PNG
wall time:    2.73 s (один still + contact sheet)
```

Полный 4K-ролик не замерялся: 1440 кадров при таком темпе — ориентировочно десятки минут; для реальной оценки нужен прогон на конкретном проекте.

## Whisper

На текущей машине:

```text
torch:        not installed
CUDA:         false
WHISPER_DEVICE: auto -> cpu
model:        faster-whisper-small.en (local)
```

Для GPU-Whisper нужен CUDA-совместимый `torch`; он не устанавливается автоматически. TTS-путь Whisper не использует.

## Ограничения замеров

- Сцена `qoder_scene_test` простая, один shot.
- 1080p-замер — 7 секунд, не полная минута.
- 4K — только still, не полный ролик.
- `--workers` по умолчанию ограничен 8; отдельного memory stress-test нет.
