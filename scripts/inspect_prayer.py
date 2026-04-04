#!/usr/bin/env python3
"""
Per-Prayer Sync Inspection Tool

Usage: python3 scripts/inspect_prayer.py {service} {prayer_id}
Example: python3 scripts/inspect_prayer.py shacharit modeh_ani

Shows:
1. Side-by-side Whisper word ↔ bundled word alignment with match quality
2. Sliver words (≤50ms, will be skipped visually)
3. Gaps > 500ms between consecutive words
4. Overlap detection
5. Total timing coverage vs MP3 duration
"""

import json
import os
import re
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUNDLED_DIR = os.path.join(BASE_DIR, "src", "data", "bundled")
AUDIO_DIR = os.path.join(BASE_DIR, "assets", "audio")
TIMING_DIR = os.path.join(BASE_DIR, "assets", "timing")
WHISPER_DIR = os.path.join(BASE_DIR, "assets", "whisper_raw")


def strip_nikkud(text):
    cleaned = re.sub(r'[\u0591-\u05C7]', '', text)
    cleaned = re.sub(r'[,.:;!?\-־׃]', '', cleaned)
    return cleaned.strip()


def get_mp3_duration_ms(mp3_path):
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", mp3_path],
        capture_output=True, text=True
    )
    data = json.loads(result.stdout)
    return float(data["format"]["duration"]) * 1000


def find_best_whisper_match(bundled_word, whisper_words, timing_start):
    """Find the Whisper word that best matches this bundled word near this timestamp."""
    b_clean = strip_nikkud(bundled_word)
    best = None
    best_score = -1

    for i, ww in enumerate(whisper_words):
        w_clean = ww["text"]
        # Character overlap score
        overlap = 0
        for ch in b_clean:
            if ch in w_clean:
                overlap += 1
        # Penalize distance from expected time
        time_dist = abs(ww["start"] - timing_start)
        score = overlap * 1000 - time_dist
        if score > best_score:
            best_score = score
            best = i

    return best


def inspect(service, prayer_id):
    mp3_path = os.path.join(AUDIO_DIR, service, f"{prayer_id}.mp3")
    whisper_path = os.path.join(WHISPER_DIR, service, f"{prayer_id}.json")
    bundled_path = os.path.join(BUNDLED_DIR, service, f"{prayer_id}.json")
    timing_path = os.path.join(TIMING_DIR, service, f"{prayer_id}.json")

    for path, name in [(mp3_path, "MP3"), (whisper_path, "Whisper"), (bundled_path, "Bundled"), (timing_path, "Timing")]:
        if not os.path.exists(path):
            print(f"ERROR: {name} not found at {path}")
            return

    mp3_ms = get_mp3_duration_ms(mp3_path)
    with open(whisper_path, "r", encoding="utf-8") as f:
        whisper_words = json.load(f)
    with open(bundled_path, "r", encoding="utf-8") as f:
        bundled = json.load(f)
    with open(timing_path, "r", encoding="utf-8") as f:
        timing_sections = json.load(f)

    # Flatten
    he_words = []
    for s in bundled["he"]:
        he_words.extend(s.split())

    t_words = []
    for sec in timing_sections:
        t_words.extend(sec["words"])

    # Header
    print(f"\n{'='*95}")
    print(f"  {service}/{prayer_id}")
    print(f"  MP3: {mp3_ms/1000:.1f}s | Bundled: {len(he_words)} words | "
          f"Whisper: {len(whisper_words)} words | Timing sections: {len(timing_sections)}")
    print(f"{'='*95}")

    # Alignment table
    issues = []
    print(f"\n{'#':>4} {'Bundled':>20} {'Time':>14} {'Dur':>6} {'Nearest Whisper':>18} {'Whisper Time':>14} {'Status':>10}")
    print("-" * 95)

    for i in range(len(he_words)):
        bw = he_words[i]
        bw_clean = strip_nikkud(bw)

        if i < len(t_words):
            tw = t_words[i]
            t_start = tw["startTime"]
            t_end = tw["endTime"]
            dur = t_end - t_start
        else:
            t_start = t_end = dur = 0

        # Find nearest Whisper word by time
        best_wi = None
        best_dist = 999999
        for wi, ww in enumerate(whisper_words):
            dist = abs(ww["start"] - t_start)
            if dist < best_dist:
                best_dist = dist
                best_wi = wi

        if best_wi is not None:
            ww = whisper_words[best_wi]
            ww_text = ww["text"]
            ww_time = f"{ww['start']}-{ww['end']}ms"
        else:
            ww_text = "---"
            ww_time = "---"

        # Check text match
        ww_clean = strip_nikkud(ww_text) if best_wi is not None else ""
        # Simple match: do first 2 consonants match?
        match = bw_clean[:2] == ww_clean[:2] if len(bw_clean) >= 2 and len(ww_clean) >= 2 else bw_clean == ww_clean

        # Status flags
        flags = []
        if dur <= 50 and dur > 0:
            flags.append("SLIVER")
            issues.append(f"  [{i}] SLIVER: \"{bw}\" has only {dur}ms — will be skipped visually")
        if dur == 0:
            flags.append("ZERO")
            issues.append(f"  [{i}] ZERO: \"{bw}\" has no timing")
        if not match and best_wi is not None:
            flags.append("MISMATCH")
            issues.append(f"  [{i}] MISMATCH: bundled \"{bw_clean}\" ≠ whisper \"{ww_clean}\"")

        # Gap from previous word
        if i > 0 and i < len(t_words):
            gap = t_words[i]["startTime"] - t_words[i-1]["endTime"]
            if gap > 500:
                flags.append(f"GAP:{gap}ms")
                issues.append(f"  [{i}] GAP: {gap}ms gap before \"{bw}\"")
            if gap < 0:
                flags.append("OVERLAP")
                issues.append(f"  [{i}] OVERLAP: {gap}ms overlap with previous word")

        status = ", ".join(flags) if flags else "OK"

        print(
            f"{i:>4} {bw:>20} {t_start:>6}-{t_end:>5}ms {dur:>5}ms "
            f"{ww_text:>18} {ww_time:>14} {status:>10}"
        )

    # Summary
    timing_end = t_words[-1]["endTime"] if t_words else 0
    tail = mp3_ms - timing_end
    slivers = sum(1 for tw in t_words if 0 < tw["endTime"] - tw["startTime"] <= 50)
    zeros = sum(1 for tw in t_words if tw["startTime"] == 0 and tw["endTime"] == 0 and t_words.index(tw) > 0)
    overlaps = 0
    for i in range(1, len(t_words)):
        if t_words[i]["startTime"] < t_words[i-1]["endTime"]:
            overlaps += 1

    print(f"\n{'='*95}")
    print(f"  SUMMARY")
    print(f"    Timing coverage: {timing_end/1000:.1f}s / {mp3_ms/1000:.1f}s (tail: {tail:.0f}ms)")
    print(f"    Slivers (≤50ms): {slivers}")
    print(f"    Overlaps: {overlaps}")
    print(f"    Text mismatches: {sum(1 for iss in issues if 'MISMATCH' in iss)}")
    print(f"    Large gaps (>500ms): {sum(1 for iss in issues if 'GAP' in iss)}")

    if issues:
        print(f"\n  ISSUES ({len(issues)}):")
        for iss in issues:
            print(iss)
    else:
        print(f"\n  No issues found.")

    print(f"{'='*95}\n")


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 scripts/inspect_prayer.py {service} {prayer_id}")
        print("Example: python3 scripts/inspect_prayer.py shacharit modeh_ani")
        print()
        print("To inspect all prayers:")
        print("  python3 scripts/inspect_prayer.py all")
        sys.exit(1)

    if sys.argv[1] == "all":
        ALL = {
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
        for service, prayers in ALL.items():
            for pid in prayers:
                inspect(service, pid)
    else:
        inspect(sys.argv[1], sys.argv[2])


if __name__ == "__main__":
    main()
