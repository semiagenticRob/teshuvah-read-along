#!/usr/bin/env python3
"""
Test 6: Timing Density Uniformity

Divides each prayer into 10 equal time slices of the MP3 duration and counts
how many word boundaries fall in each slice. Large deviations indicate
compressed or stretched timing regions.
"""

import json
import os
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(BASE_DIR, "assets", "audio")
TIMING_DIR = os.path.join(BASE_DIR, "assets", "timing")

NUM_SLICES = 10

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
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", mp3_path],
        capture_output=True, text=True
    )
    data = json.loads(result.stdout)
    return float(data["format"]["duration"]) * 1000


def analyze_prayer(service, prayer_id):
    mp3_path = os.path.join(AUDIO_DIR, service, f"{prayer_id}.mp3")
    timing_path = os.path.join(TIMING_DIR, service, f"{prayer_id}.json")

    if not os.path.exists(mp3_path) or not os.path.exists(timing_path):
        return None

    mp3_ms = get_mp3_duration_ms(mp3_path)
    with open(timing_path, "r", encoding="utf-8") as f:
        sections = json.load(f)

    # Flatten word start times
    word_starts = []
    for section in sections:
        for w in section.get("words", []):
            word_starts.append(w["startTime"])
    word_starts.sort()

    if not word_starts:
        return None

    total_words = len(word_starts)
    slice_ms = mp3_ms / NUM_SLICES
    expected_per_slice = total_words / NUM_SLICES

    slices = []
    for i in range(NUM_SLICES):
        slice_start = i * slice_ms
        slice_end = (i + 1) * slice_ms
        count = sum(1 for t in word_starts if slice_start <= t < slice_end)
        deviation = ((count - expected_per_slice) / expected_per_slice * 100) if expected_per_slice > 0 else 0
        slices.append({
            "slice": i,
            "range": f"{slice_start/1000:.0f}-{slice_end/1000:.0f}s",
            "count": count,
            "deviation_pct": deviation,
        })

    max_dev = max(abs(s["deviation_pct"]) for s in slices)
    # Coefficient of variation
    counts = [s["count"] for s in slices]
    mean = sum(counts) / len(counts)
    variance = sum((c - mean) ** 2 for c in counts) / len(counts)
    cv = (variance ** 0.5 / mean * 100) if mean > 0 else 0

    return {
        "prayer": f"{service}/{prayer_id}",
        "total_words": total_words,
        "duration_s": round(mp3_ms / 1000, 1),
        "slices": slices,
        "max_deviation_pct": round(max_dev, 1),
        "cv": round(cv, 1),
    }


def main():
    results = []
    for service, prayers in ALL_PRAYERS.items():
        for prayer_id in prayers:
            r = analyze_prayer(service, prayer_id)
            if r:
                results.append(r)

    # Summary sorted by CV (most non-uniform first)
    print(f"{'='*100}")
    print(f"  TIMING DENSITY UNIFORMITY ({NUM_SLICES} slices per prayer)")
    print(f"{'='*100}")
    print(f"{'Prayer':<35} {'Words':>6} {'Dur':>7} {'CV%':>6} {'MaxDev%':>8}  Slice Distribution")
    print("-" * 100)

    for r in sorted(results, key=lambda x: x["cv"], reverse=True):
        # Mini bar chart of word counts
        counts = [s["count"] for s in r["slices"]]
        max_count = max(counts) if counts else 1
        bars = ""
        for c in counts:
            bar_len = round(c / max_count * 8) if max_count > 0 else 0
            bars += "█" * bar_len + "░" * (8 - bar_len) + " "

        flag = " ⚠" if r["cv"] > 30 else ""
        print(
            f"{r['prayer']:<35} {r['total_words']:>6} {r['duration_s']:>6.1f}s "
            f"{r['cv']:>5.1f}% {r['max_deviation_pct']:>7.1f}%  {bars}{flag}"
        )

    # Detail on worst 5
    worst = sorted(results, key=lambda x: x["cv"], reverse=True)[:5]
    print(f"\n{'='*100}")
    print(f"  DETAIL — Top 5 most non-uniform")
    print(f"{'='*100}")

    for r in worst:
        print(f"\n  {r['prayer']} (CV={r['cv']}%):")
        print(f"    {'Slice':<15} {'Words':>6} {'Expected':>9} {'Deviation':>10}")
        expected = r["total_words"] / NUM_SLICES
        for s in r["slices"]:
            flag = " <<" if abs(s["deviation_pct"]) > 50 else ""
            print(
                f"    {s['range']:<15} {s['count']:>6} {expected:>9.1f} "
                f"{s['deviation_pct']:>+9.1f}%{flag}"
            )


if __name__ == "__main__":
    main()
