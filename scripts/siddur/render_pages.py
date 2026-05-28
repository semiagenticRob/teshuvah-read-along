#!/usr/bin/env python3
"""Render every relevant PDF page as a PNG image for LLM-vision analysis.

Reads page ranges from content/feigenbaum-2026/rules/sections.json (sections + essays).
Writes content/feigenbaum-2026/intermediate/page_images/p###.png.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

import pdfplumber

REPO = Path("/Users/robertwarren/teshuvah-read-along")
PDF_PATH = Path("/Users/robertwarren/Desktop/100Reps Project/Daven Along/218b_feigenbaum_interior_R1 - reprint Ashk.pdf")
SECTIONS = REPO / "content/feigenbaum-2026/rules/sections.json"
IMG_DIR = REPO / "content/feigenbaum-2026/intermediate/page_images"
DPI = 180  # balance quality vs size; LLM vision handles this well


def main():
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    rules = json.loads(SECTIONS.read_text())
    pages_needed = set()
    for s in rules["sections"]:
        for p in range(s["pageStart"], s["pageEnd"] + 1):
            pages_needed.add(p)
    for e in rules["essays"]:
        for p in range(e["pageStart"], e["pageEnd"] + 1):
            pages_needed.add(p)
    pages = sorted(pages_needed)
    print(f"Total unique pages to render: {len(pages)} (range {min(pages)}–{max(pages)})")
    rendered = 0
    skipped = 0
    with pdfplumber.open(PDF_PATH) as pdf:
        for pn in pages:
            out = IMG_DIR / f"p{pn:03d}.png"
            if out.exists():
                skipped += 1
                continue
            try:
                page = pdf.pages[pn - 1]
                img = page.to_image(resolution=DPI)
                img.save(out)
                rendered += 1
                if rendered % 20 == 0:
                    print(f"  ... rendered {rendered} pages")
            except Exception as e:
                print(f"  ! failed p{pn}: {e}", file=sys.stderr)
    print(f"Done: {rendered} rendered, {skipped} already existed.")


if __name__ == "__main__":
    main()
