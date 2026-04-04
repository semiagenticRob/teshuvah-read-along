#!/usr/bin/env python3
"""
Generate word-level timing from Whisper transcription of actual audio.

1. Run Whisper on each prayer's MP3 to get word-level timestamps
2. Map Whisper words to bundled Hebrew text sections
3. Write new timing JSON files in the app's format
"""

import json
import os
import sys

sys.path.insert(0, "/Users/robertwarren/Library/Python/3.9/lib/python/site-packages")
import whisper

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUNDLED_DIR = os.path.join(BASE_DIR, "src", "data", "bundled")
AUDIO_DIR = os.path.join(BASE_DIR, "assets", "audio")
TIMING_DIR = os.path.join(BASE_DIR, "assets", "timing")
WHISPER_DIR = os.path.join(BASE_DIR, "assets", "whisper_raw")

ALL_PRAYERS = {
    "shacharit": [
        "modeh_ani", "netilat_yadayim", "asher_yatzar", "elokai_neshama",
        "birchot_hatorah", "birchot_hashachar", "akedah", "korbanot",
        "pesukei_dezimrah", "shema", "amidah", "tachanun",
        "ashrei_uva_letziyon", "aleinu", "shir_shel_yom"
    ],
    "mincha": [
        "mincha_ashrei", "mincha_amidah", "mincha_tachanun", "mincha_aleinu"
    ],
    "maariv": [
        "maariv_vehu_rachum", "maariv_shema", "maariv_amidah", "maariv_aleinu"
    ],
    "birkatHamazon": [
        "bh_zimmun", "bh_hazan", "bh_haaretz", "bh_yerushalayim", "bh_hatov"
    ],
}


def transcribe(mp3_path, model, cache_path):
    """Transcribe with Whisper, caching raw results."""
    if os.path.exists(cache_path):
        with open(cache_path, "r", encoding="utf-8") as f:
            return json.load(f)

    result = model.transcribe(
        mp3_path,
        language="he",
        word_timestamps=True,
    )

    # Extract word-level data
    words = []
    for segment in result["segments"]:
        for w in segment.get("words", []):
            words.append({
                "text": w["word"].strip(),
                "start": round(w["start"] * 1000),
                "end": round(w["end"] * 1000),
            })

    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(words, f, indent=2, ensure_ascii=False)

    return words


def map_to_sections(whisper_words, he_sections):
    """
    Map Whisper's word list to the bundled Hebrew text sections.

    Strategy: assign Whisper words to sections by count, handling
    mismatches by interpolating when Whisper has fewer/more words.
    """
    section_word_counts = [len(s.split()) for s in he_sections]
    total_bundled = sum(section_word_counts)
    total_whisper = len(whisper_words)

    timing_sections = []
    w_idx = 0

    if total_whisper == 0:
        # No Whisper words — return empty timing
        for count in section_word_counts:
            timing_sections.append({"words": [{"startTime": 0, "endTime": 0}] * count})
        return timing_sections

    if total_bundled == total_whisper:
        # Perfect match — direct assignment
        for count in section_word_counts:
            section_words = []
            for _ in range(count):
                if w_idx < total_whisper:
                    ww = whisper_words[w_idx]
                    section_words.append({"startTime": ww["start"], "endTime": ww["end"]})
                    w_idx += 1
                else:
                    # Shouldn't happen but safety
                    prev_end = section_words[-1]["endTime"] if section_words else 0
                    section_words.append({"startTime": prev_end, "endTime": prev_end + 200})
            timing_sections.append({"words": section_words})
        return timing_sections

    # Mismatch — use proportional mapping
    # Map each bundled word to the nearest Whisper word by position ratio
    ratio = total_whisper / total_bundled if total_bundled > 0 else 1

    bundled_idx = 0
    for count in section_word_counts:
        section_words = []
        for _ in range(count):
            # Find corresponding Whisper word
            wh_idx = min(round(bundled_idx * ratio), total_whisper - 1)
            ww = whisper_words[wh_idx]

            # For endTime, check if next bundled word maps to a different Whisper word
            next_wh_idx = min(round((bundled_idx + 1) * ratio), total_whisper - 1)
            if next_wh_idx > wh_idx:
                end_time = ww["end"]
            else:
                # Multiple bundled words map to same Whisper word — subdivide
                # Find how many bundled words share this Whisper word
                start_b = bundled_idx
                while start_b > 0 and min(round((start_b - 1) * ratio), total_whisper - 1) == wh_idx:
                    start_b -= 1
                end_b = bundled_idx
                while end_b < total_bundled - 1 and min(round((end_b + 1) * ratio), total_whisper - 1) == wh_idx:
                    end_b += 1

                # Subdivide this Whisper word's time span
                span = ww["end"] - ww["start"]
                n_sharing = end_b - start_b + 1
                offset_in_group = bundled_idx - start_b
                sub_dur = span / n_sharing if n_sharing > 0 else span

                sub_start = round(ww["start"] + offset_in_group * sub_dur)
                sub_end = round(ww["start"] + (offset_in_group + 1) * sub_dur)

                section_words.append({"startTime": sub_start, "endTime": sub_end})
                bundled_idx += 1
                continue

            section_words.append({"startTime": ww["start"], "endTime": end_time})
            bundled_idx += 1

        timing_sections.append({"words": section_words})

    return timing_sections


def process_prayer(service, prayer_id, model):
    mp3_path = os.path.join(AUDIO_DIR, service, f"{prayer_id}.mp3")
    bundled_path = os.path.join(BUNDLED_DIR, service, f"{prayer_id}.json")
    timing_path = os.path.join(TIMING_DIR, service, f"{prayer_id}.json")
    cache_path = os.path.join(WHISPER_DIR, service, f"{prayer_id}.json")

    if not os.path.exists(mp3_path) or not os.path.exists(bundled_path):
        return None

    # Transcribe
    whisper_words = transcribe(mp3_path, model, cache_path)

    # Load bundled text
    with open(bundled_path, "r", encoding="utf-8") as f:
        bundled = json.load(f)
    he_sections = bundled["he"]

    total_bundled = sum(len(s.split()) for s in he_sections)
    total_whisper = len(whisper_words)

    # Map to sections
    timing_sections = map_to_sections(whisper_words, he_sections)

    # Write timing JSON
    timing_dir = os.path.dirname(timing_path)
    os.makedirs(timing_dir, exist_ok=True)
    with open(timing_path, "w", encoding="utf-8") as f:
        json.dump(timing_sections, f, indent=2, ensure_ascii=False)

    # Stats
    timing_end = 0
    for section in timing_sections:
        for w in section.get("words", []):
            timing_end = max(timing_end, w["endTime"])

    return {
        "prayer": f"{service}/{prayer_id}",
        "bundled_words": total_bundled,
        "whisper_words": total_whisper,
        "diff": total_whisper - total_bundled,
        "timing_end_ms": timing_end,
    }


def main():
    print("Loading Whisper model (medium)...")
    model = whisper.load_model("medium")
    print("Model loaded.\n")

    print(f"{'Prayer':<40} {'Bundled':>8} {'Whisper':>8} {'Diff':>6} {'TimEnd':>8}")
    print("-" * 75)

    results = []
    for service, prayers in ALL_PRAYERS.items():
        for prayer_id in prayers:
            label = f"{service}/{prayer_id}"
            sys.stdout.write(f"  Processing {label}...")
            sys.stdout.flush()

            r = process_prayer(service, prayer_id, model)
            if r:
                results.append(r)
                print(
                    f"\r{r['prayer']:<40} {r['bundled_words']:>8} {r['whisper_words']:>8} "
                    f"{r['diff']:>+6} {r['timing_end_ms']/1000:>7.1f}s"
                )

    total_bundled = sum(r["bundled_words"] for r in results)
    total_whisper = sum(r["whisper_words"] for r in results)
    exact_match = sum(1 for r in results if r["diff"] == 0)

    print(f"\n{'='*75}")
    print(f"  {len(results)} prayers processed")
    print(f"  Total: {total_bundled} bundled words, {total_whisper} Whisper words")
    print(f"  Exact word count match: {exact_match}/{len(results)}")
    print(f"{'='*75}")


if __name__ == "__main__":
    main()
