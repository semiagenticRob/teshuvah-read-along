#!/usr/bin/env python3
"""
Test 4: Word Count Alignment

Compares word count per section between bundled Hebrew text and timing JSON.
Mismatches cause interpolation/misassignment in applyTimingData, leading to
mid-prayer drift.
"""

import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUNDLED_DIR = os.path.join(BASE_DIR, "src", "data", "bundled")
TIMING_DIR = os.path.join(BASE_DIR, "assets", "timing")

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


def main():
    total_prayers = 0
    prayers_with_mismatches = 0
    all_mismatches = []

    for service, prayers in ALL_PRAYERS.items():
        for prayer_id in prayers:
            bundled_path = os.path.join(BUNDLED_DIR, service, f"{prayer_id}.json")
            timing_path = os.path.join(TIMING_DIR, service, f"{prayer_id}.json")

            if not os.path.exists(bundled_path) or not os.path.exists(timing_path):
                continue

            total_prayers += 1

            with open(bundled_path, "r", encoding="utf-8") as f:
                bundled = json.load(f)
            with open(timing_path, "r", encoding="utf-8") as f:
                timing_sections = json.load(f)

            he_sections = bundled["he"]
            n_bundled = len(he_sections)
            n_timing = len(timing_sections)

            prayer_label = f"{service}/{prayer_id}"
            prayer_has_mismatch = False
            section_mismatches = []

            # Compare section counts first
            if n_bundled != n_timing:
                section_mismatches.append(
                    f"  SECTION COUNT: bundled={n_bundled}, timing={n_timing}"
                )
                prayer_has_mismatch = True

            # Compare word counts per section (up to min of both)
            for i in range(min(n_bundled, n_timing)):
                bundled_words = len(he_sections[i].split())
                timing_words = len(timing_sections[i].get("words", []))
                diff = timing_words - bundled_words

                if diff != 0:
                    prayer_has_mismatch = True
                    section_mismatches.append(
                        f"  Section {i:>3}: bundled={bundled_words:>4} words, "
                        f"timing={timing_words:>4} words, diff={diff:>+4}"
                    )

            if prayer_has_mismatch:
                prayers_with_mismatches += 1
                # Totals
                total_bundled_words = sum(len(s.split()) for s in he_sections)
                total_timing_words = sum(
                    len(s.get("words", [])) for s in timing_sections
                )
                all_mismatches.append({
                    "prayer": prayer_label,
                    "section_count_match": n_bundled == n_timing,
                    "total_bundled": total_bundled_words,
                    "total_timing": total_timing_words,
                    "total_diff": total_timing_words - total_bundled_words,
                    "details": section_mismatches,
                })

    # Print results
    print(f"{'='*80}")
    print(f"  WORD COUNT ALIGNMENT — {prayers_with_mismatches}/{total_prayers} prayers have mismatches")
    print(f"{'='*80}")

    if not all_mismatches:
        print("\n  All prayers have perfect word count alignment.")
        return

    for m in sorted(all_mismatches, key=lambda x: abs(x["total_diff"]), reverse=True):
        status = "SECTIONS MATCH" if m["section_count_match"] else "SECTION COUNT MISMATCH"
        print(
            f"\n{m['prayer']} ({status}) — "
            f"bundled={m['total_bundled']} words, timing={m['total_timing']} words, "
            f"diff={m['total_diff']:+d}"
        )
        for detail in m["details"]:
            print(detail)

    # Summary
    print(f"\n{'='*80}")
    total_diff = sum(abs(m["total_diff"]) for m in all_mismatches)
    print(f"  Total absolute word difference across all mismatched prayers: {total_diff}")
    print(f"{'='*80}")


if __name__ == "__main__":
    main()
