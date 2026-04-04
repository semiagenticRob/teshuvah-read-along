#!/usr/bin/env python3
"""
Test 5: Gap and Overlap Analysis

Walks consecutive word pairs in timing data and flags:
- Gaps > 1s (highlighting freezes while audio continues)
- Overlaps (two words claim the same time range)
- Correlates with section boundaries
"""

import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TIMING_DIR = os.path.join(BASE_DIR, "assets", "timing")

GAP_THRESHOLD_MS = 1000
OVERLAP_THRESHOLD_MS = -50  # small overlaps from rounding are OK

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


def analyze_prayer(service, prayer_id):
    timing_path = os.path.join(TIMING_DIR, service, f"{prayer_id}.json")
    if not os.path.exists(timing_path):
        return None

    with open(timing_path, "r", encoding="utf-8") as f:
        sections = json.load(f)

    # Flatten words with section tracking
    words = []
    for sec_idx, section in enumerate(sections):
        for w_idx, w in enumerate(section.get("words", [])):
            words.append({
                "section": sec_idx,
                "word_idx": w_idx,
                "start": w["startTime"],
                "end": w["endTime"],
            })

    if len(words) < 2:
        return None

    large_gaps = []
    overlaps = []
    all_gaps = []

    for i in range(1, len(words)):
        prev = words[i - 1]
        curr = words[i]
        gap = curr["start"] - prev["end"]
        all_gaps.append(gap)
        at_section_boundary = curr["section"] != prev["section"]

        if gap > GAP_THRESHOLD_MS:
            large_gaps.append({
                "position_ms": prev["end"],
                "gap_ms": gap,
                "between_sections": at_section_boundary,
                "from": f"sec{prev['section']}:w{prev['word_idx']}",
                "to": f"sec{curr['section']}:w{curr['word_idx']}",
            })
        elif gap < OVERLAP_THRESHOLD_MS:
            overlaps.append({
                "position_ms": prev["end"],
                "overlap_ms": gap,
                "between_sections": at_section_boundary,
                "from": f"sec{prev['section']}:w{prev['word_idx']}",
                "to": f"sec{curr['section']}:w{curr['word_idx']}",
            })

    total_gap_time = sum(max(0, g) for g in all_gaps)
    total_duration = words[-1]["end"] - words[0]["start"] if words else 0
    gap_pct = (total_gap_time / total_duration * 100) if total_duration > 0 else 0

    return {
        "prayer": f"{service}/{prayer_id}",
        "total_words": len(words),
        "duration_s": round(total_duration / 1000, 1),
        "large_gaps": large_gaps,
        "overlaps": overlaps,
        "total_gap_time_s": round(total_gap_time / 1000, 1),
        "gap_pct": round(gap_pct, 1),
        "max_gap_ms": max(all_gaps) if all_gaps else 0,
        "min_gap_ms": min(all_gaps) if all_gaps else 0,
    }


def main():
    results = []
    for service, prayers in ALL_PRAYERS.items():
        for prayer_id in prayers:
            r = analyze_prayer(service, prayer_id)
            if r:
                results.append(r)

    # Summary table
    print(f"{'='*100}")
    print(f"  GAP & OVERLAP ANALYSIS")
    print(f"{'='*100}")
    print(
        f"{'Prayer':<35} {'Words':>6} {'Dur':>7} "
        f"{'Gaps>1s':>7} {'Overlaps':>8} "
        f"{'GapTime':>8} {'Gap%':>5} {'MaxGap':>8} {'MinGap':>8}"
    )
    print("-" * 100)

    flagged = []
    for r in sorted(results, key=lambda x: len(x["large_gaps"]) + len(x["overlaps"]), reverse=True):
        has_issues = len(r["large_gaps"]) > 0 or len(r["overlaps"]) > 0
        if has_issues:
            flagged.append(r)
        print(
            f"{r['prayer']:<35} {r['total_words']:>6} {r['duration_s']:>6.1f}s "
            f"{len(r['large_gaps']):>7} {len(r['overlaps']):>8} "
            f"{r['total_gap_time_s']:>7.1f}s {r['gap_pct']:>4.1f}% "
            f"{r['max_gap_ms']:>7.0f}ms {r['min_gap_ms']:>7.0f}ms"
        )

    # Detail on flagged prayers
    if flagged:
        print(f"\n{'='*100}")
        print(f"  DETAILS — {len(flagged)} prayers with gaps > 1s or overlaps")
        print(f"{'='*100}")

        for r in flagged:
            print(f"\n  {r['prayer']}:")
            for g in r["large_gaps"]:
                boundary = " [SECTION BOUNDARY]" if g["between_sections"] else ""
                print(
                    f"    GAP {g['gap_ms']:>6.0f}ms at {g['position_ms']/1000:.1f}s "
                    f"({g['from']} -> {g['to']}){boundary}"
                )
            for o in r["overlaps"]:
                boundary = " [SECTION BOUNDARY]" if o["between_sections"] else ""
                print(
                    f"    OVERLAP {o['overlap_ms']:>6.0f}ms at {o['position_ms']/1000:.1f}s "
                    f"({o['from']} -> {o['to']}){boundary}"
                )

    # Overall
    total_large_gaps = sum(len(r["large_gaps"]) for r in results)
    total_overlaps = sum(len(r["overlaps"]) for r in results)
    print(f"\n{'='*100}")
    print(f"  TOTALS: {total_large_gaps} large gaps (>1s), {total_overlaps} overlaps across {len(results)} prayers")
    print(f"{'='*100}")


if __name__ == "__main__":
    main()
