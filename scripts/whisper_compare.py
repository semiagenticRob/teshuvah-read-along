#!/usr/bin/env python3
"""
Whisper Word-Level Timestamp Extraction & Comparison

1. Run Whisper on each prayer's MP3 to get word-level timestamps
2. Compare Whisper's timestamps against our current timing data
3. Report per-word drift and identify where they diverge
"""

import json
import os
import sys

# Whisper installed to user site-packages
sys.path.insert(0, "/Users/robertwarren/Library/Python/3.9/lib/python/site-packages")
import whisper

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(BASE_DIR, "assets", "audio")
TIMING_DIR = os.path.join(BASE_DIR, "assets", "timing")
WHISPER_DIR = os.path.join(BASE_DIR, "assets", "whisper_timing")

# Start with a few test prayers — short ones first
TEST_PRAYERS = [
    ("shacharit", "modeh_ani"),
    ("shacharit", "netilat_yadayim"),
    ("shacharit", "asher_yatzar"),
]


def load_timing_words(timing_path):
    """Load our timing data as flat list of (startTime, endTime)."""
    with open(timing_path, "r", encoding="utf-8") as f:
        sections = json.load(f)
    words = []
    for section in sections:
        for w in section.get("words", []):
            words.append((w["startTime"], w["endTime"]))
    return words


def extract_whisper_words(mp3_path, model):
    """Run Whisper on audio and extract word-level timestamps."""
    result = model.transcribe(
        mp3_path,
        language="he",
        word_timestamps=True,
    )

    words = []
    for segment in result["segments"]:
        for word_info in segment.get("words", []):
            words.append({
                "text": word_info["word"].strip(),
                "start_ms": round(word_info["start"] * 1000),
                "end_ms": round(word_info["end"] * 1000),
            })
    return words, result


def compare_timing(our_words, whisper_words, prayer_label):
    """Compare our timing against Whisper's word timestamps."""
    n_ours = len(our_words)
    n_whisper = len(whisper_words)

    print(f"\n{'='*80}")
    print(f"  {prayer_label}")
    print(f"  Our words: {n_ours}, Whisper words: {n_whisper}")
    print(f"{'='*80}")

    # Compare word-by-word up to min count
    n = min(n_ours, n_whisper)
    drifts = []

    print(f"\n  {'#':>4} {'Our Start':>10} {'Wh Start':>10} {'Drift':>8} {'Wh Text'}")
    print(f"  {'-'*60}")

    for i in range(n):
        our_start = our_words[i][0]
        wh_start = whisper_words[i]["start_ms"]
        drift = our_start - wh_start
        drifts.append(drift)

        # Print every 5th word, or if drift > 500ms
        if i % 5 == 0 or abs(drift) > 500:
            flag = " <<" if abs(drift) > 500 else ""
            print(
                f"  {i:>4} {our_start:>9}ms {wh_start:>9}ms {drift:>+7}ms "
                f" {whisper_words[i]['text'][:20]}{flag}"
            )

    if drifts:
        avg_drift = sum(drifts) / len(drifts)
        max_drift = max(abs(d) for d in drifts)
        print(f"\n  Avg drift: {avg_drift:+.0f}ms")
        print(f"  Max |drift|: {max_drift:.0f}ms")
        print(f"  Words within 120ms: {sum(1 for d in drifts if abs(d) <= 120)}/{len(drifts)}")
        print(f"  Words within 500ms: {sum(1 for d in drifts if abs(d) <= 500)}/{len(drifts)}")

    return drifts


def main():
    print("Loading Whisper model (medium)...")
    model = whisper.load_model("medium")
    print("Model loaded.\n")

    os.makedirs(WHISPER_DIR, exist_ok=True)

    for service, prayer_id in TEST_PRAYERS:
        mp3_path = os.path.join(AUDIO_DIR, service, f"{prayer_id}.mp3")
        timing_path = os.path.join(TIMING_DIR, service, f"{prayer_id}.json")

        if not os.path.exists(mp3_path):
            print(f"SKIP {service}/{prayer_id} — no MP3")
            continue

        # Check for cached Whisper result
        whisper_cache = os.path.join(WHISPER_DIR, service, f"{prayer_id}.json")
        os.makedirs(os.path.dirname(whisper_cache), exist_ok=True)

        if os.path.exists(whisper_cache):
            print(f"Loading cached Whisper result for {service}/{prayer_id}")
            with open(whisper_cache, "r", encoding="utf-8") as f:
                whisper_words = json.load(f)
        else:
            print(f"Transcribing {service}/{prayer_id}...")
            whisper_words, raw_result = extract_whisper_words(mp3_path, model)

            # Cache the result
            with open(whisper_cache, "w", encoding="utf-8") as f:
                json.dump(whisper_words, f, indent=2, ensure_ascii=False)

        our_words = load_timing_words(timing_path)
        compare_timing(our_words, whisper_words, f"{service}/{prayer_id}")


if __name__ == "__main__":
    main()
