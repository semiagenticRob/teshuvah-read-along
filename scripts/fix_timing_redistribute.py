#!/usr/bin/env python3
"""
Word-Level Hybrid Fix

1. Global scale to match MP3 duration
2. Within each section, identify broken words:
   - Monster words: duration > MAX_WORD_MS
   - Collapsed clusters: runs of words each < MIN_WORD_MS
3. Group broken words into zones between good "anchor" words
4. Redistribute zone words proportionally by character length
5. Preserve original per-word timing for all good words
"""

import json
import os
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUNDLED_DIR = os.path.join(BASE_DIR, "src", "data", "bundled")
AUDIO_DIR = os.path.join(BASE_DIR, "assets", "audio")
TIMING_DIR = os.path.join(BASE_DIR, "assets", "timing")

END_BUFFER_MS = 500
MAX_WORD_MS = 3000    # words longer than this are broken
MIN_WORD_MS = 30      # words shorter than this are collapsed
WORD_TIME_RATIO = 0.85

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


def fix_section_words(words, he_words, sec_start, sec_end):
    """
    Fix word timing within a section.

    Strategy:
    - If section has monster words: stretch good words' relative timing to fill
      the full section, then redistribute collapsed/monster words in gaps
    - If no monsters but has collapsed words: redistribute collapsed zones
      between neighboring good anchor words
    - If all good: no changes
    """
    n = len(words)
    if n == 0:
        return 0

    # Classify each word
    is_good = []
    has_monster = False
    for w in words:
        dur = w["endTime"] - w["startTime"]
        good = MIN_WORD_MS <= dur <= MAX_WORD_MS
        is_good.append(good)
        if dur > MAX_WORD_MS:
            has_monster = True

    if all(is_good):
        return 0

    if not any(is_good):
        redistribute(words, sec_start, sec_end, he_words)
        return n

    if has_monster:
        return fix_section_with_stretch(words, is_good, he_words, sec_start, sec_end)
    else:
        return fix_section_zones(words, is_good, he_words, sec_start, sec_end)


def fix_section_with_stretch(words, is_good, he_words, sec_start, sec_end):
    """
    Stretch good words' relative timing to fill the section span,
    then redistribute broken words in the gaps.
    """
    n = len(words)

    # Collect good words with their original relative positions
    good_indices = [i for i in range(n) if is_good[i]]
    if not good_indices:
        redistribute(words, sec_start, sec_end, he_words)
        return n

    # Original span of good words
    orig_good_start = words[good_indices[0]]["startTime"]
    orig_good_end = words[good_indices[-1]]["endTime"]
    orig_good_span = orig_good_end - orig_good_start

    # Target: stretch good words to fill the section, leaving proportional
    # space for broken words based on their count vs total
    total_good = len(good_indices)
    total_broken = n - total_good
    # Give broken words their fair share of time based on char length
    good_chars = sum(
        max(len(he_words[i]), 1) if i < len(he_words) else 3
        for i in good_indices
    )
    broken_chars = sum(
        max(len(he_words[i]), 1) if i < len(he_words) else 3
        for i in range(n) if not is_good[i]
    )
    total_chars = good_chars + broken_chars

    # Allocate section time proportionally
    section_span = sec_end - sec_start
    good_time_share = (good_chars / total_chars) * section_span if total_chars > 0 else section_span
    broken_time_share = section_span - good_time_share

    # Stretch good words: map their original positions to the new span
    # Good words get placed proportionally within good_time_share
    # We need to interleave broken words in the gaps

    # First pass: compute where each good word goes in the new timeline
    if orig_good_span > 0:
        good_scale = good_time_share / orig_good_span
    else:
        good_scale = 1.0

    # Calculate new positions for good words, offset to fill section
    # Distribute broken time proportionally in gaps before/between/after good words
    # Count broken words in each gap
    gaps = []  # list of (broken_word_indices, gap_position)

    # Before first good word
    pre_broken = [i for i in range(0, good_indices[0]) if not is_good[i]]
    if pre_broken:
        gaps.append(("before", pre_broken))

    # Between consecutive good words
    for g in range(len(good_indices) - 1):
        gi = good_indices[g]
        gj = good_indices[g + 1]
        between = [i for i in range(gi + 1, gj) if not is_good[i]]
        if between:
            gaps.append(("between", between))

    # After last good word
    post_broken = [i for i in range(good_indices[-1] + 1, n) if not is_good[i]]
    if post_broken:
        gaps.append(("after", post_broken))

    # Total broken chars for proportional gap sizing
    gap_char_totals = []
    for _, indices in gaps:
        chars = sum(
            max(len(he_words[i]), 1) if i < len(he_words) else 3
            for i in indices
        )
        gap_char_totals.append(chars)
    total_gap_chars = sum(gap_char_totals) if gap_char_totals else 1

    # Build the new timeline
    cursor = sec_start
    fixed_count = 0

    # Process pre-gap broken words
    pre_gap = gaps[0] if gaps and gaps[0][0] == "before" else None
    if pre_gap:
        _, indices = pre_gap
        gap_chars = gap_char_totals[gaps.index(pre_gap)]
        gap_time = broken_time_share * (gap_chars / total_gap_chars)
        _redistribute_indices(words, indices, cursor, cursor + gap_time, he_words)
        cursor += gap_time
        fixed_count += len(indices)
        gaps = gaps[1:]
        gap_char_totals = gap_char_totals[1:]
        total_gap_chars = sum(gap_char_totals) if gap_char_totals else 1

    # Place good words with stretched timing, interleaving broken gaps
    gap_idx = 0
    for g_pos, gi in enumerate(good_indices):
        # Place this good word
        orig_offset = words[gi]["startTime"] - orig_good_start
        orig_dur = words[gi]["endTime"] - words[gi]["startTime"]
        new_dur = orig_dur * good_scale

        words[gi]["startTime"] = round(cursor)
        words[gi]["endTime"] = round(cursor + new_dur)
        cursor += new_dur

        # Check if there's a gap after this good word
        if gap_idx < len(gaps):
            gap_type, indices = gaps[gap_idx]
            # Is this gap right after the current good word?
            if indices[0] == gi + 1:
                gap_chars = gap_char_totals[gap_idx]
                remaining_gap_chars = sum(gap_char_totals[gap_idx:])
                remaining_broken_time = broken_time_share * (
                    gap_chars / total_gap_chars
                ) if total_gap_chars > 0 else 0

                _redistribute_indices(
                    words, indices, cursor, cursor + remaining_broken_time, he_words
                )
                cursor += remaining_broken_time
                fixed_count += len(indices)
                gap_idx += 1

    return fixed_count


def _redistribute_indices(words, indices, start_ms, end_ms, he_words):
    """Redistribute specific word indices within a time window."""
    available = end_ms - start_ms
    n = len(indices)
    if available <= 0 or n == 0:
        return

    char_lens = []
    for i in indices:
        if i < len(he_words):
            char_lens.append(max(len(he_words[i]), 1))
        else:
            char_lens.append(3)

    total_chars = sum(char_lens)
    word_time = available * WORD_TIME_RATIO
    gap_time = available * (1 - WORD_TIME_RATIO)
    gap_per_word = gap_time / n

    cursor = start_ms
    for idx, i in enumerate(indices):
        char_share = char_lens[idx] / total_chars
        w_dur = word_time * char_share
        words[i]["startTime"] = round(cursor)
        words[i]["endTime"] = round(cursor + w_dur)
        cursor += w_dur + gap_per_word


def fix_section_zones(words, is_good, he_words, sec_start, sec_end):
    """Original zone-based fix for sections without monster words."""
    n = len(words)
    fixed_count = 0
    i = 0
    while i < n:
        if is_good[i]:
            i += 1
            continue

        zone_start_idx = i
        while i < n and not is_good[i]:
            i += 1
        zone_end_idx = i

        if zone_start_idx > 0:
            zone_time_start = words[zone_start_idx - 1]["endTime"]
        else:
            zone_time_start = sec_start

        if zone_end_idx < n:
            zone_time_end = words[zone_end_idx]["startTime"]
        else:
            zone_time_end = sec_end

        if zone_time_end <= zone_time_start:
            zone_time_end = zone_time_start + 50 * (zone_end_idx - zone_start_idx)

        zone_words = words[zone_start_idx:zone_end_idx]
        zone_he = he_words[zone_start_idx:zone_end_idx] if he_words else []

        redistribute(zone_words, zone_time_start, zone_time_end, zone_he)
        fixed_count += len(zone_words)

    return fixed_count


def redistribute(words, start_ms, end_ms, he_words):
    """Distribute words within a time window, weighted by character length."""
    available = end_ms - start_ms
    n = len(words)
    if available <= 0 or n == 0:
        return

    char_lens = []
    for i in range(n):
        if i < len(he_words):
            char_lens.append(max(len(he_words[i]), 1))
        else:
            char_lens.append(3)

    total_chars = sum(char_lens)
    word_time = available * WORD_TIME_RATIO
    gap_time = available * (1 - WORD_TIME_RATIO)
    gap_per_word = gap_time / n

    cursor = start_ms
    for i, w in enumerate(words):
        char_share = char_lens[i] / total_chars
        w_dur = word_time * char_share
        w["startTime"] = round(cursor)
        w["endTime"] = round(cursor + w_dur)
        cursor += w_dur + gap_per_word


def process_prayer(service, prayer_id):
    mp3_path = os.path.join(AUDIO_DIR, service, f"{prayer_id}.mp3")
    timing_path = os.path.join(TIMING_DIR, service, f"{prayer_id}.json")
    bundled_path = os.path.join(BUNDLED_DIR, service, f"{prayer_id}.json")

    if not all(os.path.exists(p) for p in [mp3_path, timing_path, bundled_path]):
        return None

    mp3_ms = get_mp3_duration_ms(mp3_path)
    target_end = mp3_ms - END_BUFFER_MS

    with open(timing_path, "r", encoding="utf-8") as f:
        timing_sections = json.load(f)
    with open(bundled_path, "r", encoding="utf-8") as f:
        bundled = json.load(f)

    he_sections = bundled["he"]

    # --- Step 1: Global scale to match MP3 duration ---
    orig_end = 0
    for section in timing_sections:
        for w in section.get("words", []):
            orig_end = max(orig_end, w["endTime"])

    if orig_end <= 0:
        return None

    global_scale = target_end / orig_end

    # Apply global scale to all words
    for section in timing_sections:
        for w in section.get("words", []):
            w["startTime"] = round(w["startTime"] * global_scale)
            w["endTime"] = round(w["endTime"] * global_scale)

    # --- Step 2: Fix broken words within each section ---
    total_fixed = 0
    total_words = 0

    for sec_idx, section in enumerate(timing_sections):
        words = section.get("words", [])
        if not words:
            continue

        total_words += len(words)
        sec_start = words[0]["startTime"]
        sec_end = words[-1]["endTime"]

        he_words = he_sections[sec_idx].split() if sec_idx < len(he_sections) else []

        fixed = fix_section_words(words, he_words, sec_start, sec_end)
        total_fixed += fixed

    # --- Step 3: Final scale to ensure timing covers MP3 duration ---
    post_fix_end = 0
    for section in timing_sections:
        for w in section.get("words", []):
            post_fix_end = max(post_fix_end, w["endTime"])

    if post_fix_end > 0:
        final_scale = target_end / post_fix_end
        for section in timing_sections:
            for w in section.get("words", []):
                w["startTime"] = round(w["startTime"] * final_scale)
                w["endTime"] = round(w["endTime"] * final_scale)

    # --- Step 4: Write ---
    with open(timing_path, "w", encoding="utf-8") as f:
        json.dump(timing_sections, f, indent=2, ensure_ascii=False)

    new_end = 0
    for section in timing_sections:
        for w in section.get("words", []):
            new_end = max(new_end, w["endTime"])

    return {
        "prayer": f"{service}/{prayer_id}",
        "total_words": total_words,
        "fixed": total_fixed,
        "preserved": total_words - total_fixed,
        "mp3_ms": round(mp3_ms),
        "new_end_ms": new_end,
        "scale": round(global_scale, 4),
    }


def main():
    print(f"{'Prayer':<40} {'Words':>6} {'Fixed':>6} {'Kept':>6} "
          f"{'MP3':>8} {'NewEnd':>8} {'Scale':>7}")
    print("-" * 85)

    results = []
    for service, prayers in ALL_PRAYERS.items():
        for prayer_id in prayers:
            r = process_prayer(service, prayer_id)
            if r:
                results.append(r)
                print(
                    f"{r['prayer']:<40} {r['total_words']:>6} {r['fixed']:>6} "
                    f"{r['preserved']:>6} {r['mp3_ms']/1000:>7.1f}s "
                    f"{r['new_end_ms']/1000:>7.1f}s {r['scale']:>6.3f}x"
                )

    total_fixed = sum(r["fixed"] for r in results)
    total_kept = sum(r["preserved"] for r in results)
    total_words = sum(r["total_words"] for r in results)
    print(f"\n{'='*85}")
    print(f"  {total_kept}/{total_words} words preserved with original timing")
    print(f"  {total_fixed}/{total_words} broken words redistributed between anchors")
    print(f"{'='*85}")


if __name__ == "__main__":
    main()
