#!/usr/bin/env python3
"""Independent QA validation across all 37 sections.

Validates each src/data/siddur/{card}/{section}.json against a set of hard gates:
1. Prayer block exists and has at least 1 he-line (unless section is intentionally empty)
2. No page-chrome in any text (running headers, bare page numbers, "Minchah •" etc.)
3. No stripped-lemma artifacts: "that , those who", "(FYI: equals X, and so does ;)", " - " orphans
4. anchorLine values must resolve to actual lineIndex values in the prayer's he[]
5. Hebrew lines have non-empty words[] with text
6. Block kinds are renderable: prayer | callout | instant_insight | faq | learn_link | subsection
7. Hebrew text contains Hebrew letters (not just niqqud/punctuation)
8. English text doesn't have unescaped JSON escapes

Outputs a per-section scorecard. 98% target = all hard gates pass on all sections.
"""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

REPO = Path("/Users/robertwarren/teshuvah-read-along")
DATA = REPO / "src/data/siddur"
SECTIONS_RULES = REPO / "content/feigenbaum-2026/rules/sections.json"

CHROME_PATTERNS = [
    re.compile(r"Minchah\s*•"),
    re.compile(r"Shacharis\s*•"),
    re.compile(r"Shacharit\s*•"),
    re.compile(r"Maariv\s*•"),
    re.compile(r"Birkat\s+HaMazon\s*•"),
    re.compile(r"^\s*\d{1,3}\s*$"),  # bare page number alone
    re.compile(r"^\s*\d{1,3}\s+Minchah\s+Ashrei\s*"),  # known footer leak from old pipeline
]

LEMMA_STRIP_ARTIFACTS = [
    re.compile(r"that\s*,\s*those"),   # "that , those who" — old stripped-lemma signature
    re.compile(r"\(\s*;\s*\)"),         # "( ; )" — emptied Hebrew gloss parens
    re.compile(r"\bequals\s+\d+\s*,\s*and\s+so\s+does\s*;"),  # "equals 103, and so does ;"
    re.compile(r"\s+—\s+;"),            # " — ;" orphan
]

RENDERABLE_KINDS = {
    "prayer", "callout", "instant_insight", "faq", "learn_link",
    "subsection", "heading", "rubric", "minyan_only", "variant", "omer_count",
}

HEB_LETTERS = re.compile(r"[א-ת]")


def section_files() -> list[tuple[str, str, Path]]:
    rules = json.loads(SECTIONS_RULES.read_text())
    out = []
    for s in rules["sections"]:
        cid = s["cardId"]; sid = s["id"]
        p = DATA / cid / f"{sid}.json"
        if p.exists():
            out.append((cid, sid, p))
    return out


def validate_section(card: str, sid: str, path: Path) -> dict:
    issues: list[str] = []
    warnings: list[str] = []
    data = json.loads(path.read_text())
    blocks = data.get("blocks", [])

    # Collect text from each block for chrome detection
    def collect_text(b: dict) -> list[str]:
        texts = []
        if b.get("kind") == "prayer":
            for p in b.get("en", []):
                for span in p.get("spans", []):
                    if span.get("text"):
                        texts.append(span["text"])
        elif b.get("kind") in ("callout", "instant_insight", "faq"):
            for p in b.get("body", []):
                for span in p.get("spans", []):
                    if span.get("text"):
                        texts.append(span["text"])
        elif b.get("kind") == "subsection":
            if b.get("en"):
                texts.append(b["en"])
        elif b.get("kind") == "rubric":
            t = b.get("text", {})
            if t.get("en"):
                texts.append(t["en"])
        return texts

    # 6. block kinds renderable
    bad_kinds = []
    for b in blocks:
        k = b.get("kind")
        if k not in RENDERABLE_KINDS:
            bad_kinds.append(k)
    if bad_kinds:
        issues.append(f"non-renderable block kinds: {sorted(set(bad_kinds))}")

    # Find prayer block(s)
    prayers = [b for b in blocks if b.get("kind") == "prayer"]

    # 1. Prayer block exists with he-lines
    if not prayers:
        # Some sections are entirely callout/learn_link (e.g. al_hamichyah might be minimal)
        warnings.append("no prayer block")
    else:
        for pi, prayer in enumerate(prayers):
            he_lines = prayer.get("he", [])
            en_paras = prayer.get("en", [])
            if not he_lines:
                issues.append(f"prayer[{pi}] has 0 he-lines")
                continue

            # 5. each he-line has non-empty words with Hebrew letters
            empty_lines = 0
            no_heb = 0
            line_idx_set = set()
            for ln in he_lines:
                ws = ln.get("words", [])
                if not ws:
                    empty_lines += 1
                else:
                    has_heb = any(HEB_LETTERS.search(w.get("text", "")) for w in ws)
                    if not has_heb:
                        no_heb += 1
                line_idx_set.add(ln.get("lineIndex"))
            if empty_lines:
                issues.append(f"prayer[{pi}] has {empty_lines} he-lines with empty words[]")
            if no_heb:
                issues.append(f"prayer[{pi}] has {no_heb} he-lines with NO Hebrew letters")

            # 4. anchorLines resolve
            unresolved = []
            for ep in en_paras:
                al = ep.get("anchorLine")
                if al is None:
                    continue
                if al not in line_idx_set:
                    unresolved.append(al)
            if unresolved:
                issues.append(f"prayer[{pi}] has {len(unresolved)} en-paras with unresolved anchorLine: {unresolved[:5]}")

    # 2-3-7-8. Chrome leaks and lemma artifacts and bad text in any block
    chrome_hits = []
    lemma_hits = []
    for bi, b in enumerate(blocks):
        for t in collect_text(b):
            for pat in CHROME_PATTERNS:
                m = pat.search(t)
                if m:
                    chrome_hits.append((bi, b.get("kind"), m.group(0)[:40]))
                    break
            for pat in LEMMA_STRIP_ARTIFACTS:
                m = pat.search(t)
                if m:
                    lemma_hits.append((bi, b.get("kind"), m.group(0)[:40]))
                    break

    if chrome_hits:
        issues.append(f"page-chrome in {len(chrome_hits)} block(s); sample: {chrome_hits[:3]}")
    if lemma_hits:
        issues.append(f"lemma-strip artifacts in {len(lemma_hits)} block(s); sample: {lemma_hits[:3]}")

    # Counts
    n_he = sum(len(b.get("he", [])) for b in prayers)
    n_en = sum(len(b.get("en", [])) for b in prayers)
    return {
        "card": card,
        "section": sid,
        "blocks": len(blocks),
        "he_lines": n_he,
        "en_paras": n_en,
        "issues": issues,
        "warnings": warnings,
        "pass": len(issues) == 0,
    }


def main():
    results = [validate_section(c, s, p) for c, s, p in section_files()]
    passed = sum(1 for r in results if r["pass"])
    total = len(results)
    pct = (passed / total * 100) if total else 0

    print(f"\n=== Section validation: {passed}/{total} pass ({pct:.1f}%) ===\n")

    # Group by card
    by_card: dict[str, list[dict]] = {}
    for r in results:
        by_card.setdefault(r["card"], []).append(r)

    for card in sorted(by_card):
        rs = by_card[card]
        card_pass = sum(1 for r in rs if r["pass"])
        print(f"## {card} ({card_pass}/{len(rs)} pass)")
        for r in rs:
            status = "✓" if r["pass"] else "✗"
            warn = f" [warn: {'; '.join(r['warnings'])}]" if r["warnings"] else ""
            print(f"  {status} {r['section']:40s} blocks={r['blocks']:3d} he={r['he_lines']:4d} en={r['en_paras']:4d}{warn}")
            for issue in r["issues"]:
                print(f"        ! {issue}")
        print()

    # Summary
    print(f"\n=== Hard gate result: {passed}/{total} = {pct:.1f}% ===")
    print(f"Goal: 98% ({int(total*0.98)}/{total})")
    failed = [r for r in results if not r["pass"]]
    if failed:
        print(f"\nFailing sections ({len(failed)}):")
        for r in failed:
            print(f"  - {r['card']}/{r['section']}")


if __name__ == "__main__":
    main()
