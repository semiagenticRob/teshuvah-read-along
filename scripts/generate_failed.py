#!/usr/bin/env python3
"""Re-run generation for the 8 prayers that exceeded the character limit."""
import sys
sys.path.insert(0, ".")
from scripts.generate_audio import process_prayer

FAILED = [
    ("shacharit", "korbanot"),
    ("shacharit", "pesukei_dezimrah"),
    ("shacharit", "shema"),
    ("shacharit", "amidah"),
    ("shacharit", "shir_shel_yom"),
    ("mincha", "mincha_amidah"),
    ("maariv", "maariv_shema"),
    ("maariv", "maariv_amidah"),
]

success = 0
failed = []
for service, prayer_id in FAILED:
    if process_prayer(service, prayer_id):
        success += 1
    else:
        failed.append(f"{service}/{prayer_id}")

print(f"\nDone: {success}/{len(FAILED)} generated")
if failed:
    print(f"Failed: {', '.join(failed)}")
