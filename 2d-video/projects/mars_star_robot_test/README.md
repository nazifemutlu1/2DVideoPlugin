# Mars Star Robot — original 2.5D engine short

A new, self-contained 2DVideoPlugin project. No image references and no reuse of the
earlier robot rig: every shape is drawn procedurally in this project's scene modules.

## Deliverables

| Item | Path |
|---|---|
| Final MP4 | `out/mars_star_robot_720p.mp4` |
| Beat contact sheet (labelled, 10 frames) | `review/contact_sheet.png` |
| Shot contact sheet (3 shots) | `review/contact_sheet_shots.png` |
| Contact sheet sampled from the encoded MP4 | `review/contact_sheet_from_mp4.png` |
| Character turnaround sheet | `review/character_sheet.png` |
| Key frame (6.0 s) | `review/final_key_frame.png` |

## Specs

- 1280 x 720, 24 fps, H.264 High, yuv420p, 7.4167 s, 178 frames.
- 2:1 letterbox (engine `wide` bars), `dusk` colour grade, no captions.
- Silent visual piece (music/SFX disabled intentionally).
- Style: cinematic 2.5D / premium animated explainer.

## Engine use

Rendered with the established pipeline only:

```bash
cd F:/AI/2DVideoPlugin/2d-video
node render.mjs --project projects/mars_star_robot_test \
  --workers 4 --crf 16 --preset slow \
  --out F:/AI/2DVideoPlugin/2d-video/projects/mars_star_robot_test/out/mars_star_robot_720p.mp4
```

Reusable modules:

- `scenes/robot.js` — TIB, an original rig: square glass-faced head with two independent
  aqua eye lights, copper ear pods/crest, pear-shaped teal chassis, backpack, visible
  ball/hinge joints, two-bone IK arms and legs, three-finger star cradle, and a
  self-contained emissive star with layered bloom, spikes, orbiting motes and sparkles.
- `scenes/mars_env.js` — six parallax layers: sky/stars/Phobos, far mesas, mid ridge,
  erosion cliffs and butte, dunes, cratered ground; plus volumetric-looking haze,
  wind-blown dust, bokeh and blurred foreground boulders.
- `scenes/shots/01_reveal.js`, `02_lift.js`, `03_wonder.js` — the three beats
  (wide reveal → lift and swell → close wonder and settle).

## Technical validation

- `ffprobe`: 1280x720, 24/1 fps, 178 frames, H.264 High, yuv420p, 7.416667 s.
- Full decode pass: `ffmpeg -v error -i out/mars_star_robot_720p.mp4 -f null -` exit 0.
- 178 unique frame hashes out of 178 frames.
- Structural motion check (blurred 0.5 s frame pairs): 4.3%–90.5% of pixels changed,
  mean MAD 6.52; star centroid rises during the lift and the camera never stops.
- Contact sheet scan: no red `ERROR` frames, no missing shots, no selection overlap.

## Isolation

Only `2d-video/projects/mars_star_robot_test/` was created or written. Engine files,
`original/`, and the existing projects (`qoder_scene_test`, `vizavi_paper_test`,
`whisper_en_e2e`, `_smoke`) were not modified. `F:/AI/2DVideoPlugin-LumenBridge` was
never touched.
