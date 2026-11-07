# TTS E2E — «Тихий маяк»

Дата: 2026-11-08. Источник озвучки — TTS-аудио, переданное пользователем.

## Вход

| Параметр | Значение |
|---|---|
| Аудио | `C:\Users\vampa\Downloads\Каждую_ночь_старый_смотритель_поднимался_по_винтовой.mp3` |
| Формат | MP3, 44.1 kHz, mono, 114.416 s |
| Текст | [tests/fixtures/lighthouse.txt](../tests/fixtures/lighthouse.txt), 248 слов |
| SRT | [tests/fixtures/lighthouse.srt](../tests/fixtures/lighthouse.srt), 25 cues |
| Проект 16:9 | `2d-video/projects/lighthouse_tts` |
| Проект 9:16 | `2d-video/projects/lighthouse_tts_9x16` |

## Важное ограничение таймингов

TTS API не отдал word-level timestamps. SRT построен fallback-скриптом
[tools/tts_pause_srt.py](../tools/tts_pause_srt.py): границы **предложений**
взяты из пауз (`silencedetect`), а времена слов внутри предложения
интерполированы `parse_script.py`.

Это **не** точные word timings TTS-провайдера. Для финального продакшена
лучше передать SRT/JSON из API; текущий результат — честный E2E-прогон
пайплайна с предложенческой синхронизацией.

## Результаты

### 16:9

```text
out:        2d-video/projects/lighthouse_tts/out/Тихий_маяк.mp4
codec:      H.264, yuv420p
size:       1920×1080
fps:        24
frames:     2780
duration:   115.839 s
audio:      AAC
loudness:   -14.4 LUFS
size:       ~32.9 MB
```

### 9:16

```text
out:        2d-video/projects/lighthouse_tts_9x16/out/Тихий_маяк_916.mp4
codec:      H.264, yuv420p
size:       1080×1920
fps:        24
frames:     2780
duration:   115.839 s
audio:      AAC
loudness:   -14.4 LUFS
size:       ~42.4 MB
```

## Проверки

- `ffprobe`: H.264 + AAC, ожидаемые размеры, 2780 кадров, duration ≈ 115.84 s.
- `ebur128`: −14.4 LUFS, LRA 3.2 LU.
- `blackdetect` (0.5 s, pix_th 0.02): чёрных сегментов не найдено.
- `freezedetect` (2 s): замороженных сегментов не найдено.
- Рендер сцен: 29 shots, ошибок сцен в логе нет.

## Что не проверено

- Визуальный QC контактных листов: текущая модель не читает PNG через
  `read_image`; листы лежат в `build/sheets` и `build/final_sheet.png`.
- Точная синхронизация каждого слова: см. ограничение выше.
- 4K: не рендерился.
- Музыка: сгенерирована стандартная `mystery`-секция; SFX-куи не добавлялись.
