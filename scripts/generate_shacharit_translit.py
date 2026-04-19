#!/usr/bin/env python3
"""
Generate Ashkenazi-pronunciation transliteration JSONs for bundled Shacharit prayers.

Reads src/data/bundled/shacharit/<id>.json (Sefaria format with `he` array of Hebrew paragraphs),
writes src/data/bundled/shacharit/<id>.translit.json with a `translit` array aligned to `he`.

Rule-based transliteration: processes Hebrew character-by-character, splitting consonants
and nikkud (vowel marks). Ashkenazi conventions:
  - kamatz (ָ) → "o"
  - tav without dagesh (ת) → "s"
  - ayin (ע) and aleph (א) → silent
  - chet (ח) and khaf (כ without dagesh) → "ch"

This is a pragmatic rule set. Edge cases (kamatz katan, shva na vs shva nach, mappik heh,
furtive patach) are approximated, not perfect. Good enough for read-along alignment.
"""

from __future__ import annotations
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "src" / "data" / "bundled" / "shacharit"

# ----- Unicode codepoints -----
# Hebrew letters
ALEF, BET, GIMEL, DALET, HEI, VAV, ZAYIN, CHET, TET, YOD = (
    "\u05D0", "\u05D1", "\u05D2", "\u05D3", "\u05D4", "\u05D5", "\u05D6", "\u05D7", "\u05D8", "\u05D9",
)
KAF, KAF_FINAL, LAMED, MEM, MEM_FINAL, NUN, NUN_FINAL = (
    "\u05DB", "\u05DA", "\u05DC", "\u05DE", "\u05DD", "\u05E0", "\u05DF",
)
SAMECH, AYIN, PEI, PEI_FINAL, TZADI, TZADI_FINAL = (
    "\u05E1", "\u05E2", "\u05E4", "\u05E3", "\u05E6", "\u05E5",
)
QOF, RESH, SHIN, TAV = "\u05E7", "\u05E8", "\u05E9", "\u05EA"

# Nikkud (vowel marks and dots)
SHEVA = "\u05B0"
CHATAF_SEGOL, CHATAF_PATACH, CHATAF_KAMATZ = "\u05B1", "\u05B2", "\u05B3"
HIRIK, TZERE, SEGOL = "\u05B4", "\u05B5", "\u05B6"
PATACH, KAMATZ = "\u05B7", "\u05B8"
HOLAM, HOLAM_HASER_VAV = "\u05B9", "\u05BA"
KUBUTZ, SHURUK_DOT = "\u05BB", "\u05BC"  # 05BC is DAGESH/shuruk dot
DAGESH = "\u05BC"
METEG = "\u05BD"
RAFE = "\u05BF"
SHIN_DOT = "\u05C1"
SIN_DOT = "\u05C2"
# Punctuation
MAQAF = "\u05BE"  # hyphen
SOF_PASUQ = "\u05C3"  # colon
GERSHAYIM = "\u05F4"

NIKKUD_SET = {
    SHEVA, CHATAF_SEGOL, CHATAF_PATACH, CHATAF_KAMATZ,
    HIRIK, TZERE, SEGOL, PATACH, KAMATZ,
    HOLAM, HOLAM_HASER_VAV, KUBUTZ, DAGESH,
    METEG, RAFE, SHIN_DOT, SIN_DOT,
}

VOWEL_MARKS = {
    SHEVA, CHATAF_SEGOL, CHATAF_PATACH, CHATAF_KAMATZ,
    HIRIK, TZERE, SEGOL, PATACH, KAMATZ,
    HOLAM, HOLAM_HASER_VAV, KUBUTZ,
}

# Ashkenazi vowel map
VOWEL_MAP = {
    PATACH: "a",
    KAMATZ: "o",           # Ashkenazi
    SEGOL: "e",
    TZERE: "ei",
    HIRIK: "i",
    HOLAM: "o",
    HOLAM_HASER_VAV: "o",
    KUBUTZ: "u",
    CHATAF_PATACH: "a",
    CHATAF_SEGOL: "e",
    CHATAF_KAMATZ: "o",
    # SHEVA handled contextually
}

HEBREW_LETTERS = {
    ALEF, BET, GIMEL, DALET, HEI, VAV, ZAYIN, CHET, TET, YOD,
    KAF, KAF_FINAL, LAMED, MEM, MEM_FINAL, NUN, NUN_FINAL,
    SAMECH, AYIN, PEI, PEI_FINAL, TZADI, TZADI_FINAL,
    QOF, RESH, SHIN, TAV,
}


def _consonant(letter: str, has_dagesh: bool, shin_variant: str | None) -> str:
    """Return Ashkenazi Latin rendering for a Hebrew consonant with optional dagesh."""
    if letter == ALEF:
        return ""
    if letter == BET:
        return "b" if has_dagesh else "v"
    if letter == GIMEL:
        return "g"
    if letter == DALET:
        return "d"
    if letter == HEI:
        return "h"
    if letter == VAV:
        return "v"  # overridden as vowel by caller when appropriate
    if letter == ZAYIN:
        return "z"
    if letter == CHET:
        return "ch"
    if letter == TET:
        return "t"
    if letter == YOD:
        return "y"
    if letter in (KAF, KAF_FINAL):
        return "k" if has_dagesh else "ch"
    if letter == LAMED:
        return "l"
    if letter in (MEM, MEM_FINAL):
        return "m"
    if letter in (NUN, NUN_FINAL):
        return "n"
    if letter == SAMECH:
        return "s"
    if letter == AYIN:
        return ""
    if letter in (PEI, PEI_FINAL):
        return "p" if has_dagesh else "f"
    if letter in (TZADI, TZADI_FINAL):
        return "tz"
    if letter == QOF:
        return "k"
    if letter == RESH:
        return "r"
    if letter == SHIN:
        if shin_variant == "sin":
            return "s"
        return "sh"
    if letter == TAV:
        return "t" if has_dagesh else "s"  # Ashkenazi
    return ""


def _tokenize_hebrew_word(word: str) -> list[tuple[str, set[str], str | None]]:
    """Break a Hebrew word into (letter, nikkud_set, shin_variant) triples, skipping non-Hebrew."""
    out: list[tuple[str, set[str], str | None]] = []
    i = 0
    while i < len(word):
        ch = word[i]
        if ch in HEBREW_LETTERS:
            marks: set[str] = set()
            shin_variant = None
            i += 1
            while i < len(word) and word[i] in NIKKUD_SET:
                m = word[i]
                if m == SHIN_DOT:
                    shin_variant = "shin"
                elif m == SIN_DOT:
                    shin_variant = "sin"
                else:
                    marks.add(m)
                i += 1
            out.append((ch, marks, shin_variant))
        else:
            # strip punctuation / cantillation by skipping
            i += 1
    return out


def transliterate_word(word: str) -> str:
    """Transliterate a single Hebrew word (may contain nikkud) to Ashkenazi Latin."""
    # Divine name YHVH — traditionally read as "Adonoy" in Ashkenazi prayer.
    stripped = "".join(c for c in word if c in HEBREW_LETTERS)
    if stripped in (YOD + HEI + VAV + HEI, YOD + HEI):
        return "Adonoy"

    letters = _tokenize_hebrew_word(word)
    if not letters:
        return ""

    # If the word has no vowel marks at all, it's likely unvoweled commentary/instruction
    # text (e.g., kavanot in amidah.json). Return as-is; caller's fallback keeps the
    # original Hebrew rather than emitting a consonant-only Latin soup.
    has_any_vowel = any(
        (m in VOWEL_MARKS) for _, marks, _ in letters for m in marks
    )
    if not has_any_vowel:
        return ""

    parts: list[str] = []
    i = 0
    while i < len(letters):
        letter, marks, shin_variant = letters[i]
        has_dagesh = DAGESH in marks
        vowel_marks_here = [m for m in (SHEVA, CHATAF_SEGOL, CHATAF_PATACH, CHATAF_KAMATZ,
                                         HIRIK, TZERE, SEGOL, PATACH, KAMATZ,
                                         HOLAM, HOLAM_HASER_VAV, KUBUTZ) if m in marks]

        # Special: vav as mater lectionis / shuruk / holam
        if letter == VAV:
            # Shuruk: vav with dagesh and no other vowel + not first letter → "u"
            if has_dagesh and not vowel_marks_here and i > 0:
                parts.append("u")
                i += 1
                continue
            # Holam on the vav itself → "o"
            if HOLAM in marks or HOLAM_HASER_VAV in marks:
                parts.append("o")
                i += 1
                continue
            # Preceding letter carries holam and this vav is silent mater → already handled; here vav is consonant "v"
            # Fall through to consonant

        # Special: yod as vowel (hirik-yod) — handled by previous letter's vowel rendering
        # We treat yod as "y" consonant unless it's a pure mater after a hirik on the previous letter.
        if letter == YOD and not vowel_marks_here and i > 0:
            prev_letter, prev_marks, _ = letters[i - 1]
            if HIRIK in prev_marks:
                # mater lectionis for hirik; do not emit anything (the "i" was already emitted)
                i += 1
                continue

        # Alef/ayin/hei as silent mater after a vowel at word end
        if letter in (ALEF, AYIN) and not vowel_marks_here:
            # truly silent
            i += 1
            continue
        if letter == HEI and not vowel_marks_here and i == len(letters) - 1:
            # mater at end, silent unless mappik (approximated as silent)
            i += 1
            continue

        consonant = _consonant(letter, has_dagesh, shin_variant)

        # Handle vowels
        vowel_out = ""
        if HOLAM in marks or HOLAM_HASER_VAV in marks:
            vowel_out = "o"
        elif HIRIK in marks:
            vowel_out = "i"
        elif TZERE in marks:
            vowel_out = "ei"
        elif SEGOL in marks or CHATAF_SEGOL in marks:
            vowel_out = "e"
        elif PATACH in marks or CHATAF_PATACH in marks:
            vowel_out = "a"
        elif KAMATZ in marks or CHATAF_KAMATZ in marks:
            vowel_out = "o"
        elif KUBUTZ in marks:
            vowel_out = "u"
        elif SHEVA in marks:
            # mobile sheva at start of word → "e"; otherwise silent
            if i == 0:
                vowel_out = "e"
            else:
                vowel_out = ""

        parts.append(consonant + vowel_out)
        i += 1

    result = "".join(parts)
    # Cleanup: collapse triple letters, drop trailing empty
    result = re.sub(r"(.)\1{2,}", r"\1\1", result)
    return result


_SPLIT_RE = re.compile(r"(\s+)")


def transliterate_line(line: str) -> str:
    """Transliterate a line of Hebrew prose, preserving whitespace and most punctuation."""
    out_parts: list[str] = []
    for token in _SPLIT_RE.split(line):
        if not token:
            continue
        if token.isspace():
            out_parts.append(token)
            continue
        # Strip common Hebrew/Latin punctuation at edges, remember them
        lead = ""
        trail = ""
        # Hebrew punctuation and common marks
        punct_set = set(",.;:!?\"'()[]{}—–-" + MAQAF + SOF_PASUQ + GERSHAYIM)
        while token and token[0] in punct_set:
            lead += token[0]
            token = token[1:]
        while token and token[-1] in punct_set:
            trail = token[-1] + trail
            token = token[:-1]
        tl = transliterate_word(token) if token else ""
        # If nothing transliterated (e.g., unvoweled instruction text), keep original Hebrew;
        # downstream PairRow renders null/empty as absent, so unvoweled lines stay Hebrew-only.
        if not tl and token:
            tl = ""
        out_parts.append(lead + tl + trail)
    return "".join(out_parts).strip()


def main() -> int:
    if not SRC_DIR.is_dir():
        print(f"Source dir not found: {SRC_DIR}", file=sys.stderr)
        return 1

    count = 0
    for src_path in sorted(SRC_DIR.glob("*.json")):
        if src_path.name.endswith(".translit.json"):
            continue
        with src_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        he_lines = data.get("he")
        if not isinstance(he_lines, list):
            continue
        translit_lines = [transliterate_line(ln) for ln in he_lines]
        out_path = src_path.with_name(src_path.stem + ".translit.json")
        with out_path.open("w", encoding="utf-8") as f:
            json.dump({"translit": translit_lines}, f, ensure_ascii=False, indent=2)
        count += 1
        # Emit a preview of the first line for each prayer
        first_he = (he_lines[0][:60] + "…") if he_lines and he_lines[0] else ""
        first_tr = (translit_lines[0][:60] + "…") if translit_lines and translit_lines[0] else ""
        print(f"✓ {src_path.stem:25s}  {first_he}")
        print(f"  → {first_tr}")

    print(f"\nGenerated {count} transliteration files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
