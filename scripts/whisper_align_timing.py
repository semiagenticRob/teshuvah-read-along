#!/usr/bin/env python3
"""
Text-Based Alignment: Match Whisper words to bundled Hebrew words
by comparing actual Hebrew text, not positional index.

Uses dynamic programming (similar to diff/LCS) to find the best
alignment between Whisper's tokenization and the bundled text's
tokenization, then assigns timestamps accordingly.
"""

import json
import os
import re
import subprocess

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


def strip_nikkud(text):
    """Remove vowel points, cantillation marks, and punctuation from Hebrew."""
    # Remove Unicode Hebrew points (U+0591-U+05C7) and punctuation
    cleaned = re.sub(r'[\u0591-\u05C7]', '', text)
    cleaned = re.sub(r'[,.:;!?\-־׃]', '', cleaned)
    cleaned = cleaned.replace('־', '')  # maqaf
    return cleaned.strip()


def get_mp3_duration_ms(mp3_path):
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", mp3_path],
        capture_output=True, text=True
    )
    data = json.loads(result.stdout)
    return float(data["format"]["duration"]) * 1000


def char_sequence(word):
    """Get the consonant sequence for fuzzy matching."""
    return strip_nikkud(word)


def align_words(whisper_words, bundled_words):
    """
    Align Whisper words to bundled words using character-level matching.

    Returns a list of (bundled_idx, start_ms, end_ms) for each bundled word.
    When Whisper merges multiple bundled words into one token, the timestamp
    is subdivided. When Whisper splits one bundled word, timestamps are merged.
    """
    # Build character streams
    w_chars = []  # (char, whisper_word_idx)
    for i, ww in enumerate(whisper_words):
        for ch in char_sequence(ww["text"]):
            w_chars.append((ch, i))

    b_chars = []  # (char, bundled_word_idx)
    for i, bw in enumerate(bundled_words):
        for ch in char_sequence(bw):
            b_chars.append((ch, i))

    # LCS-based alignment of character sequences
    n = len(w_chars)
    m = len(b_chars)

    # For large sequences, use a banded approach
    if n * m > 10_000_000:
        return align_words_proportional(whisper_words, bundled_words)

    # Standard LCS DP
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if w_chars[i-1][0] == b_chars[j-1][0]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])

    # Backtrack to find alignment
    # Map: bundled_word_idx -> set of whisper_word_idxs that align to it
    b_to_w = {}
    i, j = n, m
    while i > 0 and j > 0:
        if w_chars[i-1][0] == b_chars[j-1][0]:
            w_idx = w_chars[i-1][1]
            b_idx = b_chars[j-1][1]
            if b_idx not in b_to_w:
                b_to_w[b_idx] = set()
            b_to_w[b_idx].add(w_idx)
            i -= 1
            j -= 1
        elif dp[i-1][j] > dp[i][j-1]:
            i -= 1
        else:
            j -= 1

    # Convert alignment to timestamps
    # For each bundled word, find the PRIMARY Whisper word (most character matches)
    result = []
    for b_idx in range(len(bundled_words)):
        if b_idx in b_to_w:
            w_indices = sorted(b_to_w[b_idx])
            if len(w_indices) == 1:
                wi = w_indices[0]
                result.append({"startTime": whisper_words[wi]["start"],
                               "endTime": whisper_words[wi]["end"]})
            else:
                # Multiple Whisper words matched — use the one with most char matches
                w_counts = {}
                for wi in w_indices:
                    w_counts[wi] = w_counts.get(wi, 0) + 1
                primary_wi = max(w_counts, key=w_counts.get)
                result.append({"startTime": whisper_words[primary_wi]["start"],
                               "endTime": whisper_words[primary_wi]["end"]})
        else:
            # No alignment — will be interpolated later
            result.append(None)

    # Interpolate unaligned words
    interpolate_gaps(result)

    # Fix overlaps: when multiple bundled words map to the same Whisper word,
    # subdivide the time range
    fix_shared_timestamps(result, bundled_words)

    return result


def align_words_proportional(whisper_words, bundled_words):
    """Fallback for very long prayers where LCS is too expensive."""
    n_w = len(whisper_words)
    n_b = len(bundled_words)

    if n_w == 0:
        return [{"startTime": 0, "endTime": 0} for _ in bundled_words]

    result = []
    for b_idx in range(n_b):
        # Map by position ratio
        w_idx = min(round(b_idx * n_w / n_b), n_w - 1)
        ww = whisper_words[w_idx]
        result.append({"startTime": ww["start"], "endTime": ww["end"]})

    fix_shared_timestamps(result, bundled_words)
    return result


def interpolate_gaps(result):
    """Fill None entries by interpolating between neighbors."""
    n = len(result)
    for i in range(n):
        if result[i] is not None:
            continue

        # Find previous and next non-None
        prev_end = 0
        for p in range(i - 1, -1, -1):
            if result[p] is not None:
                prev_end = result[p]["endTime"]
                break

        next_start = prev_end + 500
        for nx in range(i + 1, n):
            if result[nx] is not None:
                next_start = result[nx]["startTime"]
                break

        # Count consecutive Nones
        gap_start = i
        gap_end = i
        while gap_end < n and result[gap_end] is None:
            gap_end += 1

        gap_len = gap_end - gap_start
        step = (next_start - prev_end) / gap_len if gap_len > 0 else 0

        for g in range(gap_len):
            result[gap_start + g] = {
                "startTime": round(prev_end + g * step),
                "endTime": round(prev_end + (g + 1) * step),
            }


def fix_shared_timestamps(result, bundled_words):
    """When consecutive words share the same start/end, subdivide."""
    i = 0
    while i < len(result):
        # Find runs of words with identical timestamps
        j = i + 1
        while j < len(result) and result[j]["startTime"] == result[i]["startTime"] and result[j]["endTime"] == result[i]["endTime"]:
            j += 1

        if j > i + 1:
            # Subdivide this range
            start = result[i]["startTime"]
            end = result[i]["endTime"]
            span = end - start
            count = j - i

            # Weight by character length
            char_lens = [max(len(strip_nikkud(bundled_words[k])), 1) for k in range(i, j)]
            total_chars = sum(char_lens)

            cursor = start
            for k in range(count):
                share = (char_lens[k] / total_chars) * span
                result[i + k] = {
                    "startTime": round(cursor),
                    "endTime": round(cursor + share),
                }
                cursor += share

        i = j


def process_prayer(service, prayer_id):
    whisper_path = os.path.join(WHISPER_DIR, service, f"{prayer_id}.json")
    bundled_path = os.path.join(BUNDLED_DIR, service, f"{prayer_id}.json")
    timing_path = os.path.join(TIMING_DIR, service, f"{prayer_id}.json")
    mp3_path = os.path.join(AUDIO_DIR, service, f"{prayer_id}.mp3")

    if not os.path.exists(whisper_path) or not os.path.exists(bundled_path):
        return None

    with open(whisper_path, "r", encoding="utf-8") as f:
        whisper_words = json.load(f)
    with open(bundled_path, "r", encoding="utf-8") as f:
        bundled = json.load(f)

    he_sections = bundled["he"]

    # Flatten bundled words with section tracking
    all_bundled_words = []
    section_word_counts = []
    for section in he_sections:
        words = section.split()
        section_word_counts.append(len(words))
        all_bundled_words.extend(words)

    # Align
    aligned = align_words(whisper_words, all_bundled_words)

    # Split back into sections
    timing_sections = []
    idx = 0
    for count in section_word_counts:
        section_words = []
        for _ in range(count):
            if idx < len(aligned):
                section_words.append(aligned[idx])
                idx += 1
            else:
                section_words.append({"startTime": 0, "endTime": 0})
        timing_sections.append({"words": section_words})

    # Ensure strictly non-overlapping timestamps
    all_words_flat = []
    for sec in timing_sections:
        all_words_flat.extend(sec["words"])

    for i in range(1, len(all_words_flat)):
        prev_end = all_words_flat[i-1]["endTime"]
        # startTime must be >= previous endTime
        if all_words_flat[i]["startTime"] < prev_end:
            all_words_flat[i]["startTime"] = prev_end
        # endTime must be > startTime
        if all_words_flat[i]["endTime"] <= all_words_flat[i]["startTime"]:
            # Steal some time from the next gap or add minimum duration
            all_words_flat[i]["endTime"] = all_words_flat[i]["startTime"] + 50
        # Also clamp previous word's endTime if it extends past this word's start
        if all_words_flat[i-1]["endTime"] > all_words_flat[i]["startTime"]:
            all_words_flat[i-1]["endTime"] = all_words_flat[i]["startTime"]

    # Write
    os.makedirs(os.path.dirname(timing_path), exist_ok=True)
    with open(timing_path, "w", encoding="utf-8") as f:
        json.dump(timing_sections, f, indent=2, ensure_ascii=False)

    # Stats
    total_words = len(all_bundled_words)
    total_whisper = len(whisper_words)
    timing_end = max(w["endTime"] for w in all_words_flat) if all_words_flat else 0

    return {
        "prayer": f"{service}/{prayer_id}",
        "bundled": total_words,
        "whisper": total_whisper,
        "timing_end_ms": timing_end,
    }


def main():
    print(f"{'Prayer':<40} {'Bundled':>8} {'Whisper':>8} {'TimEnd':>8}")
    print("-" * 68)

    results = []
    for service, prayers in ALL_PRAYERS.items():
        for prayer_id in prayers:
            r = process_prayer(service, prayer_id)
            if r:
                results.append(r)
                print(
                    f"{r['prayer']:<40} {r['bundled']:>8} {r['whisper']:>8} "
                    f"{r['timing_end_ms']/1000:>7.1f}s"
                )

    print(f"\n{'='*68}")
    print(f"  {len(results)} prayers aligned")
    print(f"{'='*68}")


if __name__ == "__main__":
    main()
