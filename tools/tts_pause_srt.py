"""Build a sentence-level SRT from TTS audio + exact script.

This is a fallback for when the TTS API does not return word timestamps:
speech pauses define sentence boundaries; word times inside a sentence are
interpolated by parse_script.py. It is not a substitute for real word timings.

    python tools/tts_pause_srt.py --audio voice.mp3 --text script.txt --out script.srt
"""
from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path


def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, encoding="utf-8", check=True,
    ).stdout.strip()
    return float(out)


def speech_intervals(audio: Path, noise_db: int, min_silence: float, duration: float) -> list[tuple[float, float]]:
    proc = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(audio), "-af", f"silencedetect=noise={noise_db}dB:d={min_silence}", "-f", "null", "-"],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    starts = [float(x) for x in re.findall(r"silence_start:\s*([\d.]+)", proc.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end:\s*([\d.]+)", proc.stderr)]
    intervals, cur = [], 0.0
    for start, end in zip(starts, ends):
        if start - cur >= 0.25:
            intervals.append((cur, start))
        cur = end
    if duration - cur >= 0.25:
        intervals.append((cur, duration))
    return intervals


def sentences(text: str) -> list[str]:
    text = re.sub(r"\s+", " ", text.replace("\r", " ").replace("\n", " ")).strip()
    parts = re.split(r"(?<=[.!?…])\s+", text)
    return [p.strip() for p in parts if p.strip()]


def merge_to_count(intervals: list[tuple[float, float]], count: int) -> list[tuple[float, float]]:
    intervals = list(intervals)
    while len(intervals) > count:
        gaps = [intervals[i + 1][0] - intervals[i][1] for i in range(len(intervals) - 1)]
        i = min(range(len(gaps)), key=gaps.__getitem__)
        intervals[i:i + 2] = [(intervals[i][0], intervals[i + 1][1])]
    while len(intervals) < count:
        i = max(range(len(intervals)), key=lambda j: intervals[j][1] - intervals[j][0])
        start, end = intervals[i]
        mid = (start + end) / 2
        intervals[i:i + 1] = [(start, mid), (mid, end)]
    return intervals


def ts(seconds: float) -> str:
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--audio", required=True)
    ap.add_argument("--text", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--noise-db", type=int, default=-35)
    ap.add_argument("--min-silence", type=float, default=0.3)
    a = ap.parse_args()
    audio = Path(a.audio)
    if not audio.is_file():
        raise SystemExit(f"audio not found: {audio}")
    lines = sentences(Path(a.text).read_text(encoding="utf-8-sig"))
    if not lines:
        raise SystemExit("script has no sentences")
    duration = probe_duration(audio)
    intervals = speech_intervals(audio, a.noise_db, a.min_silence, duration)
    if not intervals:
        raise SystemExit("no speech intervals found")
    intervals = merge_to_count(intervals, len(lines))
    srt = []
    for i, (line, (start, end)) in enumerate(zip(lines, intervals), 1):
        srt.append(f"{i}\n{ts(start)} --> {ts(end)}\n{line}\n")
    Path(a.out).write_text("\n".join(srt), encoding="utf-8", newline="\n")
    print(f"wrote {a.out}: {len(lines)} cues from {len(intervals)} speech intervals; word times are interpolated")
    print("NOTE: sentence boundaries come from pauses, not from TTS word timings.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
