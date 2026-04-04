#!/usr/bin/env python3
"""
Fix timing drift by linearly scaling all word timestamps to match actual MP3 duration.

For each prayer:
1. Get actual MP3 duration via ffprobe
2. Get timing data's last word endTime
3. Scale all startTime/endTime values by (mp3_duration / timing_end)
4. Write corrected timing JSON (overwrites in place, backs up originals)
"""

import json
import os
import shutil
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(BASE_DIR, "assets", "audio")
TIMING_DIR = os.path.join(BASE_DIR, "assets", "timing")
BACKUP_DIR = os.path.join(BASE_DIR, "assets", "timing_backup_prescale")

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


def get_timing_end(sections):
    for section in reversed(sections):
        if section.get("words"):
            return section["words"][-1]["endTime"]
    return 0


def scale_timing(sections, scale_factor):
    for section in sections:
        for word in section.get("words", []):
            word["startTime"] = round(word["startTime"] * scale_factor)
            word["endTime"] = round(word["endTime"] * scale_factor)
    return sections


def main():
    # Create backup directory
    os.makedirs(BACKUP_DIR, exist_ok=True)

    print(f"{'Prayer':<40} {'MP3':>8} {'TimEnd':>8} {'Scale':>7} {'NewEnd':>8}")
    print("-" * 75)

    for service, prayers in ALL_PRAYERS.items():
        for prayer_id in prayers:
            mp3_path = os.path.join(AUDIO_DIR, service, f"{prayer_id}.mp3")
            timing_path = os.path.join(TIMING_DIR, service, f"{prayer_id}.json")

            if not os.path.exists(mp3_path) or not os.path.exists(timing_path):
                print(f"  SKIP {service}/{prayer_id}")
                continue

            # Backup original
            backup_service_dir = os.path.join(BACKUP_DIR, service)
            os.makedirs(backup_service_dir, exist_ok=True)
            backup_path = os.path.join(backup_service_dir, f"{prayer_id}.json")
            if not os.path.exists(backup_path):
                shutil.copy2(timing_path, backup_path)

            # Load
            mp3_ms = get_mp3_duration_ms(mp3_path)
            with open(timing_path, "r", encoding="utf-8") as f:
                sections = json.load(f)

            timing_end = get_timing_end(sections)
            if timing_end <= 0:
                print(f"  SKIP {service}/{prayer_id} — no timing data")
                continue

            # Leave a small buffer (500ms) so timing doesn't extend past audio
            target_end = mp3_ms - 500
            scale_factor = target_end / timing_end

            # Scale
            sections = scale_timing(sections, scale_factor)
            new_end = get_timing_end(sections)

            # Write corrected timing
            with open(timing_path, "w", encoding="utf-8") as f:
                json.dump(sections, f, indent=2, ensure_ascii=False)

            print(
                f"{service + '/' + prayer_id:<40} "
                f"{mp3_ms/1000:>7.1f}s "
                f"{timing_end/1000:>7.1f}s "
                f"{scale_factor:>6.3f}x "
                f"{new_end/1000:>7.1f}s"
            )

    print(f"\nOriginals backed up to: {BACKUP_DIR}")
    print("Done. Re-run test scripts to verify.")


if __name__ == "__main__":
    main()
