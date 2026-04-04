#!/usr/bin/env python3
"""
Test 3: Chunked vs Non-Chunked Prayer — Timing End vs MP3 Duration

Compares the last word's endTime in each timing JSON against the actual
MP3 duration (via ffprobe). Groups results by single-chunk vs multi-chunk
prayers to isolate whether MP3 concatenation / offset stacking causes drift.
"""

import json
import os
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(BASE_DIR, "assets", "audio")
TIMING_DIR = os.path.join(BASE_DIR, "assets", "timing")

# The 8 prayers that required chunking (>4500 chars, multiple API calls)
CHUNKED = {
    ("shacharit", "korbanot"),
    ("shacharit", "pesukei_dezimrah"),
    ("shacharit", "shema"),
    ("shacharit", "amidah"),
    ("shacharit", "shir_shel_yom"),
    ("mincha", "mincha_amidah"),
    ("maariv", "maariv_shema"),
    ("maariv", "maariv_amidah"),
}

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


def get_mp3_duration_ms(mp3_path):
    """Get MP3 duration in milliseconds via ffprobe."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_format", mp3_path
        ],
        capture_output=True, text=True
    )
    data = json.loads(result.stdout)
    return float(data["format"]["duration"]) * 1000


def get_timing_end_ms(timing_path):
    """Get the last word's endTime from a timing JSON."""
    with open(timing_path, "r", encoding="utf-8") as f:
        sections = json.load(f)

    # Walk backwards to find the last section with words
    for section in reversed(sections):
        if section.get("words"):
            return section["words"][-1]["endTime"]
    return 0


def get_timing_word_count(timing_path):
    """Count total words in timing data."""
    with open(timing_path, "r", encoding="utf-8") as f:
        sections = json.load(f)
    return sum(len(s.get("words", [])) for s in sections)


def main():
    single_results = []
    chunked_results = []

    for service, prayers in ALL_PRAYERS.items():
        for prayer_id in prayers:
            mp3_path = os.path.join(AUDIO_DIR, service, f"{prayer_id}.mp3")
            timing_path = os.path.join(TIMING_DIR, service, f"{prayer_id}.json")

            if not os.path.exists(mp3_path) or not os.path.exists(timing_path):
                print(f"  SKIP {service}/{prayer_id} — missing files")
                continue

            mp3_ms = get_mp3_duration_ms(mp3_path)
            timing_ms = get_timing_end_ms(timing_path)
            word_count = get_timing_word_count(timing_path)
            drift_ms = mp3_ms - timing_ms
            drift_pct = (drift_ms / mp3_ms * 100) if mp3_ms > 0 else 0

            entry = {
                "prayer": f"{service}/{prayer_id}",
                "mp3_duration_ms": round(mp3_ms),
                "timing_end_ms": round(timing_ms),
                "drift_ms": round(drift_ms),
                "drift_pct": round(drift_pct, 2),
                "word_count": word_count,
            }

            is_chunked = (service, prayer_id) in CHUNKED
            if is_chunked:
                chunked_results.append(entry)
            else:
                single_results.append(entry)

    # Print results
    def print_group(label, results):
        print(f"\n{'='*80}")
        print(f"  {label} ({len(results)} prayers)")
        print(f"{'='*80}")
        print(f"{'Prayer':<40} {'MP3 (ms)':>10} {'Timing (ms)':>12} {'Drift (ms)':>11} {'Drift %':>8} {'Words':>6}")
        print("-" * 80)

        total_drift = 0
        for r in sorted(results, key=lambda x: abs(x["drift_ms"]), reverse=True):
            print(
                f"{r['prayer']:<40} {r['mp3_duration_ms']:>10,} {r['timing_end_ms']:>12,} "
                f"{r['drift_ms']:>+11,} {r['drift_pct']:>+7.1f}% {r['word_count']:>6}"
            )
            total_drift += r["drift_ms"]

        if results:
            avg_drift = total_drift / len(results)
            max_drift = max(abs(r["drift_ms"]) for r in results)
            print("-" * 80)
            print(f"{'Avg drift:':<40} {' ':>10} {' ':>12} {round(avg_drift):>+11,} ms")
            print(f"{'Max |drift|:':<40} {' ':>10} {' ':>12} {round(max_drift):>11,} ms")

    print_group("SINGLE-CHUNK PRAYERS (no concatenation)", single_results)
    print_group("MULTI-CHUNK PRAYERS (concatenated MP3s)", chunked_results)

    # Summary comparison
    if single_results and chunked_results:
        s_avg = sum(r["drift_ms"] for r in single_results) / len(single_results)
        c_avg = sum(r["drift_ms"] for r in chunked_results) / len(chunked_results)
        s_max = max(abs(r["drift_ms"]) for r in single_results)
        c_max = max(abs(r["drift_ms"]) for r in chunked_results)

        print(f"\n{'='*80}")
        print("  COMPARISON SUMMARY")
        print(f"{'='*80}")
        print(f"  Single-chunk:  avg drift = {round(s_avg):>+,} ms,  max |drift| = {round(s_max):>,} ms")
        print(f"  Multi-chunk:   avg drift = {round(c_avg):>+,} ms,  max |drift| = {round(c_max):>,} ms")

        if abs(c_avg) > abs(s_avg) * 2:
            print("\n  >> Multi-chunk prayers show significantly more drift.")
            print("  >> Root cause likely: MP3 byte concatenation + offset accumulation.")
        elif abs(s_avg) > 1000:
            print("\n  >> Both groups show substantial drift.")
            print("  >> Root cause likely upstream: ElevenLabs timestamps or app sync loop.")
        else:
            print("\n  >> Both groups show minimal drift. Issue may be app-layer only.")


if __name__ == "__main__":
    main()
