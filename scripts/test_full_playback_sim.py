#!/usr/bin/env python3
"""
Automated Full-Playback Simulation — Test 2 at scale.

For each prayer, simulates playback by stepping through the audio duration
at 50ms intervals (matching SYNC_INTERVAL_MS) and checking whether the
timing data's word window contains the current playback position.

Reports:
- % of playback time where no word window matches (gaps/drift)
- Max consecutive drift (longest run of mismatches)
- Drift at 25%, 50%, 75%, and 100% of playback
- Per-prayer pass/fail against a tolerance threshold
"""

import json
import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(BASE_DIR, "assets", "audio")
TIMING_DIR = os.path.join(BASE_DIR, "assets", "timing")

SYNC_INTERVAL_MS = 50  # matches app's useWordSync polling rate
DRIFT_TOLERANCE_MS = 2000  # a word window match within 2s is acceptable

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
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", mp3_path],
        capture_output=True, text=True
    )
    data = json.loads(result.stdout)
    return float(data["format"]["duration"]) * 1000


def load_timing(timing_path):
    """Load timing JSON and return flat list of (startTime, endTime) tuples, sorted."""
    with open(timing_path, "r", encoding="utf-8") as f:
        sections = json.load(f)
    words = []
    for section in sections:
        for w in section.get("words", []):
            words.append((w["startTime"], w["endTime"]))
    words.sort(key=lambda x: x[0])
    return words


def find_word_at_time(words, time_ms):
    """Binary search matching the app's findWordAtTime logic. Returns (start, end) or None."""
    low, high = 0, len(words) - 1
    result = None
    while low <= high:
        mid = (low + high) // 2
        start, end = words[mid]
        if start <= time_ms < end:
            return (start, end)
        if time_ms >= start:
            result = (start, end)
            low = mid + 1
        else:
            high = mid - 1
    return result


def simulate_prayer(service, prayer_id):
    mp3_path = os.path.join(AUDIO_DIR, service, f"{prayer_id}.mp3")
    timing_path = os.path.join(TIMING_DIR, service, f"{prayer_id}.json")

    if not os.path.exists(mp3_path) or not os.path.exists(timing_path):
        return None

    mp3_duration = get_mp3_duration_ms(mp3_path)
    words = load_timing(timing_path)
    if not words:
        return None

    timing_end = words[-1][1]
    is_chunked = (service, prayer_id) in CHUNKED

    # Simulate playback at SYNC_INTERVAL_MS steps
    total_steps = 0
    mismatches = 0
    max_consecutive_mismatch = 0
    current_mismatch_run = 0
    quartile_drift = {}  # drift at 25%, 50%, 75%, 100%

    pos = 0.0
    while pos <= mp3_duration:
        total_steps += 1
        matched = find_word_at_time(words, pos)

        if matched is None:
            # No word covers this position — check if we're past all timing data
            if pos > timing_end:
                # Audio still playing but timing data exhausted
                drift = pos - timing_end
            else:
                # In a gap between words (could be normal for short pauses)
                drift = 0
            mismatches += 1
            current_mismatch_run += 1
            max_consecutive_mismatch = max(max_consecutive_mismatch, current_mismatch_run)
        else:
            word_mid = (matched[0] + matched[1]) / 2
            drift = pos - word_mid
            current_mismatch_run = 0

        # Record drift at quartile boundaries
        pct = (pos / mp3_duration) * 100 if mp3_duration > 0 else 0
        for q in [25, 50, 75, 100]:
            if q not in quartile_drift and pct >= q:
                quartile_drift[q] = round(drift)

        pos += SYNC_INTERVAL_MS

    # Time spent past timing data (audio playing with no words left)
    tail_ms = max(0, mp3_duration - timing_end)
    mismatch_pct = (mismatches / total_steps * 100) if total_steps > 0 else 0

    return {
        "prayer": f"{service}/{prayer_id}",
        "chunked": is_chunked,
        "mp3_ms": round(mp3_duration),
        "timing_end_ms": round(timing_end),
        "tail_ms": round(tail_ms),
        "total_steps": total_steps,
        "mismatch_pct": round(mismatch_pct, 1),
        "max_consec_mismatch_ms": max_consecutive_mismatch * SYNC_INTERVAL_MS,
        "drift_25": quartile_drift.get(25, 0),
        "drift_50": quartile_drift.get(50, 0),
        "drift_75": quartile_drift.get(75, 0),
        "drift_100": quartile_drift.get(100, 0),
    }


def main():
    results = []
    for service, prayers in ALL_PRAYERS.items():
        for prayer_id in prayers:
            r = simulate_prayer(service, prayer_id)
            if r:
                results.append(r)

    single = [r for r in results if not r["chunked"]]
    chunked = [r for r in results if r["chunked"]]

    def print_group(label, group):
        print(f"\n{'='*110}")
        print(f"  {label} ({len(group)} prayers)")
        print(f"{'='*110}")
        print(
            f"{'Prayer':<35} {'MP3':>8} {'TimEnd':>8} {'Tail':>7} "
            f"{'Mis%':>5} {'MaxRun':>7} "
            f"{'@25%':>7} {'@50%':>7} {'@75%':>7} {'@100%':>7} {'PASS':>5}"
        )
        print("-" * 110)

        pass_count = 0
        for r in sorted(group, key=lambda x: abs(x["drift_100"]), reverse=True):
            passed = abs(r["drift_100"]) < DRIFT_TOLERANCE_MS and r["tail_ms"] < DRIFT_TOLERANCE_MS
            if passed:
                pass_count += 1
            print(
                f"{r['prayer']:<35} "
                f"{r['mp3_ms']/1000:>7.1f}s "
                f"{r['timing_end_ms']/1000:>7.1f}s "
                f"{r['tail_ms']/1000:>6.1f}s "
                f"{r['mismatch_pct']:>4.1f}% "
                f"{r['max_consec_mismatch_ms']/1000:>6.1f}s "
                f"{r['drift_25']:>+6}ms "
                f"{r['drift_50']:>+6}ms "
                f"{r['drift_75']:>+6}ms "
                f"{r['drift_100']:>+6}ms "
                f"{'OK' if passed else 'FAIL':>5}"
            )

        print("-" * 110)
        print(f"  {pass_count}/{len(group)} passed (drift < {DRIFT_TOLERANCE_MS}ms at end, tail < {DRIFT_TOLERANCE_MS}ms)")

    print_group("SINGLE-CHUNK PRAYERS", single)
    print_group("MULTI-CHUNK PRAYERS", chunked)

    # Overall summary
    all_pass = sum(1 for r in results if abs(r["drift_100"]) < DRIFT_TOLERANCE_MS and r["tail_ms"] < DRIFT_TOLERANCE_MS)
    print(f"\n{'='*110}")
    print(f"  OVERALL: {all_pass}/{len(results)} prayers pass")
    print(f"  Tolerance: drift < {DRIFT_TOLERANCE_MS}ms at 100%, tail audio < {DRIFT_TOLERANCE_MS}ms")
    print(f"{'='*110}")


if __name__ == "__main__":
    main()
