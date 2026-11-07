# Фактические возможности 2DVideoPlugin

Проверено по `2d-video/engine/player.js`, `core.js`, `three-kit.js`, `render.mjs`, `audio/mix.py` и текущему `../../make-2d-video/references/engine-api.md`. Это не пожелания Vizavi, а реальные границы studio.

## Формат и таймлайн

| Параметр | Факт |
|---|---|
| Логическая сцена | 1920×1080 для 16:9, 1080×1920 для 9:16; все координаты сцен — в этих единицах |
| Разрешения | 720p, 1080p, 1440p, 2160p/4K; итоговый размер задаётся `config.json` → `resolution` и `--scale` |
| fps | `config.json` → `fps`; default 24. Значение можно изменить, но 60 fps в этом workspace не проверялся |
| Рендер | Детерминированные кадры `i / fps`, headless Chromium + Canvas/WebGL, затем ffmpeg |
| Видеокодек | H.264 (`libx264`), CRF 18 по умолчанию, `yuv420p`, fps из config |
| Звук в render | `render.mjs` всегда пишет немое видео; звук добавляет только `audio/mix.py` |
| Финальный файл | `build/video_silent.mp4` → после mix `out/<title>.mp4` |
| Длительность | `story/shots.json` → `duration`; последний shot должен заканчиваться на этой точке |

## 2D-камера и слои

- Камера: `{x, y, z, r}`, где `z` — масштаб, `r` — roll. Других параметров 2D-камеры нет.
- Параллакс: `layer(g, cam, depth, fn)`. Типичные depth: 0.1–0.2 небо, 0.3–0.4 дальний план, 0.5–0.6 стена, 0.8–0.9 пол/предметы, 1.0 герои, 1.5–1.8 передний blurred-план.
- `blurLayer(g, amount, fn, cam?, depth?)` — приблизительная глубина: уменьшенная копия слоя с Canvas blur. Нет focus distance, автофокуса и follow-focus.
- В каждом shot базовый skill требует движение камеры и атмосферу. Движение должно быть мотивировано, а не бессмысленно.
- Непрерывность между shots не обязательна: монтажный cut может менять локацию. Внутри одной локации сохраняй геометрию, направление экрана, одежду и свет.

## 3D

- Three.js 0.169, `T.stage({mood, fov, fog, sky, keyPos, keyIntensity, ambient, bloom})`.
- Камера: `T.orbit(camera, t, {...})`, `T.dolly(camera, t, [[t, {pos, look, fov}], ...])`.
- Есть перспектива, fov, туман, свет, тени, bloom.
- Нет GLTFLoader и импорта моделей. Доступны процедурные примитивы и `figure3D`; сложные реальные объекты придётся собирать из примитивов.
- Нет DOF и motion blur. Глубину задавай туманом, светом, перекрытиями и композицией.
- 3D-кадры получают тот же grade, bars и grain, что и 2D.

## Оптика: что можно и чего нельзя

| Приём | Статус | Реализация |
|---|---|---|
| Motion blur | Нет | Ghost-копии с alpha, `trail`, `FX.speedLines`; называть имитацией |
| DOF | Приблизительно | `blurLayer` для переднего/дальнего плана; без focus distance |
| Focus pull | Нет | Можно менять blur amount по времени, но это не физический фокус |
| Radial/zoom blur | Нет | Масштабируемые ghost-слои, `speedLines`, `rings`; только акцент |
| Shallow depth | Приблизительно | Blur слоёв + veil + композиция |
| FOV | Да в 3D | `T.stage({fov})`, `dolly` с fov |
| Shake | Да | `shake(t, amp, freq, seed)` |
| Speed ramp | Вручную | Управляй `t`/phase в сцене; помни о детерминизме и пересчёте звука |

Не пиши в отчёте «motion blur» или «DOF», если использован `blurLayer`/ghosting. Пиши «имитация смаза» или «мягкая глубина слоёв».

## Типографика

- `text(g, str, x, y, {size, font, weight, color, align, base, glow, glowColor, spacing, alpha, stroke, strokeColor, italic})`.
- `measure()` для раскладки; `FONTS` содержит доступные семейства.
- Fredoka — только Latin. Nunito и Playfair Display поддерживают Latin + Cyrillic. Для `ru/uk/be/bg/mk/sr/kk/ky` базовый `FONTS.title` автоматически становится Nunito.
- Кинетическая типографика реализуется кодом сцены: рисуй глифы/слова по одному, меняй позицию, маску, масштаб, прозрачность и интервалы.
- `wordTime(word, afterGlobalT)` и `timeline/words.json` дают привязку к произнесённым словам. Если words.json нет, используй тайминги shots.json и `line`.
- Читаемое финальное состояние проектируй раньше анимации букв. Не оставляй текст под captions и в опасной зоне 9:16.
- Никаких «стен текста»: 1–2 короткие подписи одновременно, кроме title/end screen.

## Персонажи, свет, среда

- `drawFigure` + `POSES`, `posesAt`, `blendPose`, `breathe`, `walkPose`, `bigFace`, `headPos`.
- Обязательны rim light у освещённой фигуры, контактная тень и наземная опора.
- Один signature-цвет на персонажа; одежда и screen direction не меняются внутри сцены.
- Свет: `mood(name)` и `S()`, один ключевой источник, 1–3 ярких акцента, тёмная середина.
- Атмосфера: `FX.dust`, `rain`, `drops`, `stars`, `fog`, `godRays`, `lensStreak`, `speedLines`, `rings`.
- Детерминизм: только `rng(seed)`, `t`, `noise`, `shake` с seed. Никаких `Math.random()` и `Date.now()`.

## UI и продуктовые сцены

- `ui2d.js`: `titleCard`, `bigLine`, `badge`, `readout`, `callout`, `dimension`, `dataCard`, `compareBars`, `meter`, `blueprint`, `lineFigure`, `bubble`, `endScreen`, `captions`.
- UI-анимация в 2D/2.5D реализуема кодом: карточки, курсор, hover/pressed/processing/result, drag/drop, панели на разных depth.
- 3D UI возможен только как собственная геометрия Three.js; это не готовый UI-kit.
- Курсор и состояния веди одним детерминированным таймлайном, а не через реальные mouse events. Для world-space UI считай экранную проекцию якоря; для screen-space overlay используй экранные координаты.

## Звук

- `story/shots.json` → `music`: непрерывные секции `{start, end, mood, intensity}`.
- Moods: `mystery, tension, action, wonder, hopeful, sad, triumph, playful, calm, dark, epic`.
- `sfx`: `{at, name, gain, dur?, seed?, pitch?}`; `at` — секунды от начала shot.
- `amb`: `rain, wind, city, roomtone, murmur, hum`, gain обычно −18…−28.
- `mix.py` генерирует музыку/SFX, ducking −9 dB под голосом, ambience −5 dB, loudness `config.loudness` (default −14 LUFS), AAC 192k, mux с `-shortest`.
- **Блокер:** `mix.py` безусловно загружает `config.voiceover`. Проект без voiceover не получит штатный финальный микс с музыкой/SFX. Не обещай silent/music-only final.
- Beat detection и экспортируемой карты акцентов нет. `music.py` использует внутреннюю ритмическую сетку; для синхронизации выбирай SFX вручную, слушай preview и проверяй фактический микс.
- Пользовательская музыка: `config.music.file`; она loop/trim с fade. Учитывай её реальные акценты, а не только BPM.

## Команды

Из `2d-video/`:

```bash
node render.mjs --project projects/<slug> --sheet --scale 0.5
node render.mjs --project projects/<slug> --stills t1,t2,t3
node render.mjs --project projects/<slug> --from 0 --to 30 --scale 0.5
node render.mjs --project projects/<slug> [--workers N] [--format jpeg]
# from workspace root:
python tools/2dvideo.py mix --project projects/<slug>
```

`--sheet` даёт по одному still на shot, `--stills` — моменты внутри shot, `--from/--to` — preview-фрагмент. `--out` указывай только если понимаешь, что относительный путь разрешается от cwd, а не от проекта. Полный рендер не запускай до preview и согласования.

## Ассеты

- Dev-server умеет отдавать `.png`, `.jpg`, `.svg`, `.woff2`.
- В документированном engine API нет загрузчика изображений/спрайтов и нет GLTFLoader. Использование ассетов потребовало бы собственного асинхронного кода в проекте; это не проверенный штатный путь.
- Внешние image/3D-провайдеры не интегрированы. Не вызывай их и не устанавливай MCP/зависимости в рамках этого skill.

## Что считать проверенным

- Параметры рендера и fps — из `render.mjs`/`player.js`.
- Voiceover-блокер — из `mix.py`.
- Отсутствие GLTF/ассетного API — из `three-kit.js`/`engine-api.md`.
- 60 fps — технически настраивается, но не проверено; не выдавай за готовую возможность.
- Любое визуальное качество считается проверенным только после просмотра кадров/движения и, для звука, прослушивания.
