"""tools/transcribe.py — word-level timestamps for a voiceover with faster-whisper.

  python tools/transcribe.py --project projects/my-video --audio <separate-audio> --model <local-model-dir> [--lang en] [--script input/script.txt]

Whisper is a separate legacy tool: the audio file is always passed explicitly
with --audio; it is never taken from project voiceover or TTS automatically.

If a plain-text script is given, its exact wording is kept and aligned onto Whisper's word timings
(so on-screen text and captions use the script's spelling, not Whisper's guesses).
Writes timeline/words.json, timeline/sentences.json, timeline/transcript.txt.
"""
import argparse, difflib, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import load_audio, load_json, norm_word, sentences_from_words, write_timeline


def align_script(script_text, wwords):
    """Map script tokens onto whisper words with difflib; interpolate the gaps."""
    toks = [t for t in re.findall(r"\S+", script_text)]
    a = [norm_word(t) for t in toks]
    b = [norm_word(w["word"]) for w in wwords]
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    times = [None] * len(toks)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            w = wwords[blk.b + k]
            times[blk.a + k] = (w["start"], w["end"])
    # fill unmatched tokens by interpolating between known neighbours
    n = len(toks)
    i = 0
    while i < n:
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < n and times[j] is None:
            j += 1
        t0 = times[i - 1][1] if i > 0 else (wwords[0]["start"] if wwords else 0.0)
        t1 = times[j][0] if j < n else (wwords[-1]["end"] if wwords else t0 + 0.4 * (j - i))
        span = max(0.05, t1 - t0) / (j - i)
        for k in range(i, j):
            times[k] = (t0 + span * (k - i), t0 + span * (k - i + 1))
        i = j
    matched = sum(b.size for b in sm.get_matching_blocks())
    print(f"script alignment: {matched}/{len(toks)} script words matched to audio ({100 * matched / max(1, len(toks)):.0f}%)")
    return [{"word": t, "start": round(s, 3), "end": round(e, 3)} for t, (s, e) in zip(toks, times)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--audio", required=True, help="separate audio file for Whisper; never pass TTS output automatically")
    ap.add_argument("--model", default=None, help="local CTranslate2 model directory (offline; no auto-download)")
    ap.add_argument("--lang", default=None, help="source language; defaults to project speechLanguage/language, then ru; auto detects")
    ap.add_argument("--script", help="plain-text script to align (keeps exact wording)")
    a = ap.parse_args()
    cfg = load_json(os.path.join(a.project, "config.json"))
    lang = a.lang or cfg.get("speechLanguage") or cfg.get("language") or "ru"
    lang = None if lang == "auto" else lang
    audio_path = a.audio
    if not os.path.isfile(audio_path):
        sys.exit(f"audio file not found: {audio_path}")
    if not a.model:
        sys.exit("--model must point to a local CTranslate2 Whisper model directory")
    if not os.path.isdir(a.model):
        sys.exit(f"Whisper model directory not found: {a.model}")
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    from faster_whisper import WhisperModel  # pip install faster-whisper
    try:
        import torch  # noqa
        device = "cuda" if torch.cuda.is_available() else "cpu"
    except Exception:
        device = "cpu"
    model_name = os.path.abspath(a.model)
    print(f"loading whisper '{model_name}' on {device}…")
    model = WhisperModel(model_name, device=device, compute_type="float16" if device == "cuda" else "int8")
    audio = load_audio(audio_path, 16000)
    segs, info = model.transcribe(audio, language=lang, word_timestamps=True, vad_filter=True, beam_size=5)
    words = []
    for s in segs:
        for w in s.words or []:
            words.append({"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)})
        print(f"  {s.start:7.2f}  {s.text.strip()[:90]}")
    if not words:
        sys.exit("no speech found in the voiceover")
    source = f"whisper:{model_name}"
    script = a.script or (os.path.join(a.project, cfg["script"]) if cfg.get("script") and cfg["script"].endswith((".txt", ".md")) else None)
    if script and os.path.exists(script):
        txt = open(script, encoding="utf-8").read()
        txt = re.sub(r"^\s*#.*$", "", txt, flags=re.M)  # drop markdown headings
        words = align_script(txt, words)
        source += "+script"
    write_timeline(os.path.join(a.project, "timeline"), words, sentences_from_words(words), source)


if __name__ == "__main__":
    main()
