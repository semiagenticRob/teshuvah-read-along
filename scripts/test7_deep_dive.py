#!/usr/bin/env python3
"""
Test 7: Worst-Prayer Deep Dive

Simulates playback at 1-second resolution for the worst mid-prayer drift
offenders. Logs drift continuously and identifies the exact timestamps
where spikes occur, cross-referenced against section boundaries.
"""

import json
import os
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(BASE_DIR, "assets", "audio")
TIMING_DIR = os.path.join(BASE_DIR, "assets", "timing")

# The 5 worst mid-prayer drift offenders from the simulation
WORST_PRAYERS = [
    ("shacharit", "aleinu"),           # -19,453ms at 50%
    ("shacharit", "birchot_hatorah"),   # -15,140ms at 50%
    ("birkatHamazon", "bh_hatov"),      # -12,060ms at 75%
    ("mincha", "mincha_tachanun"),      # -10,006ms at 75%
    ("shacharit", "akedah"),            #  -2,810ms at 75%
]


def get_mp3_duration_ms(mp3_path):
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", mp3_path],
        capture_output=True, text=True
    )
    data = json.loads(result.stdout)
    return float(data["format"]["duration"]) * 1000


def load_timing_flat(timing_path):
    """Load timing and return flat word list with section info."""
    with open(timing_path, "r", encoding="utf-8") as f:
        sections = json.load(f)

    words = []
    section_boundaries = []  # (start_ms of first word in section)
    for sec_idx, section in enumerate(sections):
        sec_words = section.get("words", [])
        if sec_words:
            section_boundaries.append({
                "section": sec_idx,
                "start_ms": sec_words[0]["startTime"],
                "end_ms": sec_words[-1]["endTime"],
                "word_count": len(sec_words),
            })
        for w in sec_words:
            words.append({
                "section": sec_idx,
                "start": w["startTime"],
                "end": w["endTime"],
            })
    words.sort(key=lambda x: x["start"])
    return words, section_boundaries


def find_word_at_time(words, time_ms):
    low, high = 0, len(words) - 1
    result = None
    while low <= high:
        mid = (low + high) // 2
        w = words[mid]
        if w["start"] <= time_ms < w["end"]:
            return w
        if time_ms >= w["start"]:
            result = w
            low = mid + 1
        else:
            high = mid - 1
    return result


def analyze_prayer(service, prayer_id):
    mp3_path = os.path.join(AUDIO_DIR, service, f"{prayer_id}.mp3")
    timing_path = os.path.join(TIMING_DIR, service, f"{prayer_id}.json")

    mp3_ms = get_mp3_duration_ms(mp3_path)
    words, section_boundaries = load_timing_flat(timing_path)
    if not words:
        return

    timing_end = words[-1]["end"]
    label = f"{service}/{prayer_id}"

    print(f"\n{'='*90}")
    print(f"  {label} — MP3: {mp3_ms/1000:.1f}s, Timing: {timing_end/1000:.1f}s, "
          f"{len(words)} words, {len(section_boundaries)} sections")
    print(f"{'='*90}")

    # Print section boundaries
    print(f"\n  Section boundaries:")
    for sb in section_boundaries:
        print(f"    Section {sb['section']:>3}: {sb['start_ms']/1000:>7.1f}s - "
              f"{sb['end_ms']/1000:>7.1f}s ({sb['word_count']} words, "
              f"span={( sb['end_ms'] - sb['start_ms'])/1000:.1f}s)")

    # Simulate at 1-second resolution
    print(f"\n  {'Time':>6} {'AudioPos':>10} {'WordStart':>10} {'WordEnd':>10} "
          f"{'Drift':>8} {'Section':>8} {'Note'}")
    print(f"  {'-'*72}")

    prev_drift = 0
    spike_locations = []

    pos = 0.0
    step = 1000  # 1 second
    while pos <= mp3_ms:
        matched = find_word_at_time(words, pos)
        if matched:
            word_mid = (matched["start"] + matched["end"]) / 2
            drift = pos - word_mid
            drift_change = drift - prev_drift
            section = matched["section"]

            note = ""
            if abs(drift_change) > 2000:
                note = f"<< SPIKE {drift_change:+.0f}ms"
                spike_locations.append({
                    "time_s": pos / 1000,
                    "drift": drift,
                    "drift_change": drift_change,
                    "section": section,
                })

            # Print every 5 seconds, or if there's a spike
            if int(pos) % 5000 == 0 or note:
                pct = (pos / mp3_ms * 100)
                print(
                    f"  {pct:>5.1f}% {pos/1000:>9.1f}s {matched['start']/1000:>9.1f}s "
                    f"{matched['end']/1000:>9.1f}s {drift:>+7.0f}ms {section:>8} {note}"
                )

            prev_drift = drift
        else:
            if int(pos) % 5000 == 0:
                pct = (pos / mp3_ms * 100)
                print(f"  {pct:>5.1f}% {pos/1000:>9.1f}s {'---':>10} {'---':>10} {'N/A':>8} {'---':>8}")

        pos += step

    # Spike summary
    if spike_locations:
        print(f"\n  DRIFT SPIKES (>{2000}ms change):")
        for s in spike_locations:
            print(f"    At {s['time_s']:.1f}s (section {s['section']}): "
                  f"drift={s['drift']:+.0f}ms, change={s['drift_change']:+.0f}ms")
    else:
        print(f"\n  No significant drift spikes detected.")


def main():
    for service, prayer_id in WORST_PRAYERS:
        analyze_prayer(service, prayer_id)


if __name__ == "__main__":
    main()
