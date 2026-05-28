#!/usr/bin/env python3
"""Aggregate LLM-vision page analyses into per-section JSON for the app.

Reads:
  - content/feigenbaum-2026/intermediate/llm_pages/p###.json
  - content/feigenbaum-2026/rules/sections.json (page ranges)
  - content/feigenbaum-2026/rules/learn_anchors.json (essay link insertions)

Writes:
  - src/data/siddur/{card}/{section}.json

Mapping rules (per section):
1. Concatenate blocks from all pages in section's range, in document order.
2. Drop chrome (page_header / page_footer).
3. Split into:
   - intro (before first prayer-Hebrew block)
   - prayer (the prayer block plus its in-line commentary + sidebars)
   - outro (after last prayer-Hebrew block)
4. Intro blocks become callouts/instant_insights. Learn_links inserted from rules.
5. Prayer block: aggregate Hebrew lines (split by sof-pasuk `:`), assign lineIndex + globalIndex,
   anchor English commentary by matching verse_anchor consonant prefix to he-line consonants.
6. Sidebars become instant_insight blocks placed inline at the verse they anchor to (before the verse).
7. Outro blocks become trailing callouts.
"""
from __future__ import annotations
import json, re, sys
from pathlib import Path
from typing import Optional

REPO = Path("/Users/robertwarren/teshuvah-read-along")
SECTIONS = REPO / "content/feigenbaum-2026/rules/sections.json"
LEARN_ANCHORS = REPO / "content/feigenbaum-2026/rules/learn_anchors.json"
LLM_PAGES = REPO / "content/feigenbaum-2026/intermediate/llm_pages"
OUTPUT_DIR = REPO / "src/data/siddur"

HEB_LETTER_RE = re.compile(r"[א-ת]")
SOF_PASUK_RE = re.compile(r"[:׃]\s*")
NIQQUD_RE = re.compile(r"[ֵ-ׇ]")  # Hebrew points & cantillation marks


def consonants(s: str) -> str:
    if not s: return ""
    return "".join(c for c in s if HEB_LETTER_RE.match(c))


def split_by_sof_pasuk(hebrew: str) -> list[str]:
    """Split Hebrew text into verses by sof-pasuk colon. Keep non-empty pieces."""
    if not hebrew: return []
    raw = SOF_PASUK_RE.split(hebrew)
    out = []
    for chunk in raw:
        chunk = chunk.strip()
        if chunk and HEB_LETTER_RE.search(chunk):
            # restore sof-pasuk at end
            out.append(chunk + ":")
    return out


def tokenize_hebrew_line(text: str, start_global: int) -> list[dict]:
    """Split Hebrew line into words; return [{text, globalIndex}]."""
    words = []
    raw_words = text.split()
    gi = start_global
    for w in raw_words:
        # Skip word-tokens that have no Hebrew letters (e.g. stray punctuation)
        if not HEB_LETTER_RE.search(w):
            continue
        words.append({"text": w, "globalIndex": gi})
        gi += 1
    return words


def find_matching_line(he_lines: list[dict], anchor: str) -> Optional[int]:
    """Given a verse_anchor (Hebrew text or lemma), find which he_line it matches.

    Strategy: take first 3-4 consonants of anchor, find he_line whose first
    consonants match.
    """
    if not anchor: return None
    anchor_cons = consonants(anchor)
    if len(anchor_cons) < 2: return None
    needle = anchor_cons[:5]
    best_match = None
    best_score = 0
    for line in he_lines:
        line_text = " ".join(w["text"] for w in line["words"])
        line_cons = consonants(line_text)
        if len(line_cons) < 2: continue
        # check prefix match
        haystack = line_cons[:12]
        # find longest common prefix
        i = 0
        while i < min(len(needle), len(haystack)) and needle[i] == haystack[i]:
            i += 1
        if i > best_score:
            best_score = i
            best_match = line["lineIndex"]
    if best_score >= 3:
        return best_match
    # fallback: contains match (anchor first 3 consonants somewhere in line)
    for line in he_lines:
        line_text = " ".join(w["text"] for w in line["words"])
        line_cons = consonants(line_text)
        if needle[:3] in line_cons[:15]:
            return line["lineIndex"]
    return None


def load_llm_pages(pages: range) -> dict[int, dict]:
    out = {}
    for pn in pages:
        path = LLM_PAGES / f"p{pn:03d}.json"
        if path.exists():
            out[pn] = json.loads(path.read_text())
    return out


def collect_blocks_in_order(llm_pages: dict[int, dict]) -> list[dict]:
    """Flatten all page blocks in document order, filtering chrome."""
    out = []
    for pn in sorted(llm_pages):
        for b in llm_pages[pn]["blocks"]:
            if b.get("kind") in ("page_header", "page_footer"):
                continue
            b["_page"] = pn
            out.append(b)
    return out


def build_prayer_block(prayer_region_blocks: list[dict]) -> tuple[dict, list[dict]]:
    """Build the prayer block + any sidebars-as-instant_insight blocks.

    Returns (prayer_block, inline_sidebar_blocks). Sidebars are returned separately
    so caller can place them adjacent to their anchor verse.
    """
    he_lines: list[dict] = []
    en_paras: list[dict] = []
    sidebars: list[dict] = []
    line_index = 0
    global_word_index = 0

    for b in prayer_region_blocks:
        k = b.get("kind", "")
        if k in ("verse_hebrew", "hebrew_paragraph"):
            heb_text = b.get("hebrew_text") or ""
            verses = split_by_sof_pasuk(heb_text)
            if not verses:
                verses = [heb_text] if HEB_LETTER_RE.search(heb_text) else []
            for v in verses:
                words = tokenize_hebrew_line(v, global_word_index)
                if not words:
                    continue
                global_word_index = words[-1]["globalIndex"] + 1
                he_lines.append({"lineIndex": line_index, "words": words, "text": v})
                line_index += 1
        elif k == "english_commentary":
            anchor = b.get("verse_anchor") or b.get("leading_hebrew_lemma") or ""
            anchor_line = find_matching_line(he_lines, anchor)
            text = b.get("english_text") or ""
            if not text: continue
            para = {"spans": [{"text": text}]}
            if anchor_line is not None:
                para["anchorLine"] = anchor_line
            en_paras.append(para)
        elif k in ("sidebar_instant_insight", "sidebar_crucial_insight"):
            text = b.get("english_text") or ""
            if not text: continue
            sb = {"kind": "instant_insight", "body": [{"spans": [{"text": text}]}]}
            # bind to verse if possible
            anchor = b.get("verse_anchor") or ""
            anchor_line = find_matching_line(he_lines, anchor)
            if anchor_line is not None:
                sb["anchorLine"] = anchor_line
            sidebars.append(sb)
        elif k in ("sidebar_faq", "sidebar_answer"):
            text = b.get("english_text") or ""
            if not text: continue
            sb = {"kind": "faq", "body": [{"spans": [{"text": text}]}]}
            sidebars.append(sb)
        # conditional_insert, italic_note, rubric, heading_section, subheading inside prayer region:
        # convert to callout blocks but place inline in output (returned via sidebars list for ordering)
        elif k == "conditional_insert":
            heb = b.get("hebrew_text") or ""
            eng = b.get("english_text") or ""
            text = (eng + " " + heb).strip()
            if text:
                sidebars.append({"kind": "callout", "tags": ["conditional"], "body": [{"spans": [{"text": text}]}]})
        elif k == "italic_note":
            text = b.get("english_text") or ""
            if text:
                sidebars.append({"kind": "callout", "tags": ["note"], "body": [{"spans": [{"text": text}]}]})
        elif k == "rubric":
            text = b.get("english_text") or b.get("hebrew_text") or ""
            if text:
                sidebars.append({"kind": "callout", "tags": ["rubric"], "body": [{"spans": [{"text": text}]}]})
        elif k == "heading_section":
            heb = b.get("hebrew_text") or ""
            eng = b.get("english_text") or ""
            sidebars.append({"kind": "subsection", "he": heb, "en": eng})
        elif k == "subheading":
            text = b.get("english_text") or ""
            sidebars.append({"kind": "subsection", "he": "", "en": text})

    prayer = {
        "kind": "prayer",
        "he": [{"lineIndex": l["lineIndex"], "words": l["words"]} for l in he_lines],
        "en": en_paras,
        "_legacySource": None,
    }
    return prayer, sidebars


# Hardcoded section titles (proper Hebrew with niqqud + English).
# Take precedence over the manifest's per-card title.
SECTION_TITLES = {
    # Mincha
    "mincha_ashrei": {"he": "אַשְׁרֵי", "en": "Ashrei"},
    "shemoneh_esrei_mincha": {"he": "שְׁמוֹנֶה עֶשְׂרֵה", "en": "Shemoneh Esrei"},
    "avinu_malkeinu_mincha": {"he": "אָבִֽינוּ מַלְכֵּֽנוּ", "en": "Avinu Malkeinu"},
    "tachanun_mincha": {"he": "תַּחֲנוּן", "en": "Tachanun"},
    "aleinu_mincha": {"he": "עָלֵֽינוּ", "en": "Aleinu"},
    # Shacharit (filled in later when those sections are processed)
}


def find_section_start_index(all_blocks: list[dict], section_id: str) -> int:
    """Find the first block belonging to this section.

    Strategy: look for a heading_card whose Hebrew matches the section's title.
    Drop everything before it. If no match (no card heading found), look for the
    first verse_hebrew/hebrew_paragraph after a heading_section.
    """
    section_title = SECTION_TITLES.get(section_id)
    if section_title:
        section_cons = consonants(section_title["he"])
        if section_cons:
            for i, b in enumerate(all_blocks):
                if b.get("kind") in ("heading_card", "heading_section"):
                    heb = b.get("hebrew_text") or ""
                    block_cons = consonants(heb)
                    if block_cons and (block_cons[:4] == section_cons[:4] or
                                       section_cons[:4] in block_cons[:6]):
                        return i
    return 0  # default: start from the beginning


def find_section_end_index(all_blocks: list[dict], section_id: str, start: int) -> int:
    """Find the last block (inclusive) belonging to this section.

    Strategy: walk forward from start; if we hit a heading_card with a DIFFERENT
    Hebrew title than the current section, that's the next section's start —
    return previous index. Otherwise return len(all_blocks) - 1.
    """
    section_title = SECTION_TITLES.get(section_id)
    if not section_title:
        return len(all_blocks) - 1
    section_cons = consonants(section_title["he"])
    for i in range(start + 1, len(all_blocks)):
        b = all_blocks[i]
        if b.get("kind") == "heading_card":
            heb = b.get("hebrew_text") or ""
            block_cons = consonants(heb)
            if block_cons and section_cons and block_cons[:4] != section_cons[:4] and section_cons[:4] not in block_cons[:6]:
                return i - 1
    return len(all_blocks) - 1


def build_section(section_def: dict, learn_anchors: list[dict]) -> dict:
    section_id = section_def["id"]
    card_id = section_def["cardId"]
    page_start = section_def["pageStart"]
    page_end = section_def["pageEnd"]
    title = SECTION_TITLES.get(section_id) or section_def["title"]

    pages = load_llm_pages(range(page_start, page_end + 1))
    all_blocks = collect_blocks_in_order(pages)

    # Narrow to this section's blocks (drop preceding/following section content)
    start_idx = find_section_start_index(all_blocks, section_id)
    end_idx = find_section_end_index(all_blocks, section_id, start_idx)
    all_blocks = all_blocks[start_idx:end_idx + 1]

    # Find prayer region: first verse_hebrew/hebrew_paragraph to last
    prayer_kinds = ("verse_hebrew", "hebrew_paragraph")
    prayer_indices = [i for i, b in enumerate(all_blocks) if b.get("kind") in prayer_kinds]
    if not prayer_indices:
        # No prayer found — section is empty / all callouts
        intro_blocks = all_blocks
        prayer_region = []
        outro_blocks = []
    else:
        first = prayer_indices[0]
        last = prayer_indices[-1]
        intro_blocks = all_blocks[:first]
        prayer_region = all_blocks[first:last + 1]
        outro_blocks = all_blocks[last + 1:]

    # Build output
    output_blocks = []

    # Intro: callouts/instant_insights
    for b in intro_blocks:
        k = b.get("kind", "")
        if k in ("intro_essay", "intro_essay_continuation"):
            text = b.get("english_text") or ""
            if text:
                output_blocks.append({"kind": "callout", "body": [{"spans": [{"text": text}]}]})
        elif k == "italic_note":
            text = b.get("english_text") or ""
            if text:
                output_blocks.append({"kind": "instant_insight", "body": [{"spans": [{"text": text}]}]})
        elif k == "rubric":
            text = b.get("english_text") or b.get("hebrew_text") or ""
            if text:
                output_blocks.append({"kind": "callout", "tags": ["rubric"], "body": [{"spans": [{"text": text}]}]})
        elif k in ("subheading", "heading_section"):
            heb = b.get("hebrew_text") or ""
            eng = b.get("english_text") or ""
            if heb or eng:
                output_blocks.append({"kind": "subsection", "he": heb, "en": eng})
        elif k == "heading_card":
            # The section's overall card title — skip (top-level title field carries it)
            pass
        elif k.startswith("sidebar"):
            text = b.get("english_text") or ""
            if text:
                kind = "instant_insight" if "instant" in k or "crucial" in k else "faq"
                output_blocks.append({"kind": kind, "body": [{"spans": [{"text": text}]}]})
        elif k == "conditional_insert":
            heb = b.get("hebrew_text") or ""
            eng = b.get("english_text") or ""
            text = (eng + " " + heb).strip()
            if text:
                output_blocks.append({"kind": "callout", "tags": ["conditional"], "body": [{"spans": [{"text": text}]}]})

    # Learn-link anchors for this section.
    # Structure in rules: {essayId, anchorAt: [{cardId, sectionId, position}]}
    sec_learn_before: list[dict] = []
    sec_learn_after: list[dict] = []
    for anchor in learn_anchors:
        for at in anchor.get("anchorAt", []):
            if at.get("sectionId") == section_id:
                target = sec_learn_before if at.get("position", "before-first-prayer") == "before-first-prayer" else sec_learn_after
                target.append({"essayId": anchor["essayId"], "promptText": anchor.get("label") or anchor["essayId"]})
    for ll in sec_learn_before:
        output_blocks.append({"kind": "learn_link", "essayId": ll["essayId"], "promptText": ll["promptText"]})

    # Prayer block — emit before in-region sidebars so the user sees the prayer first
    if prayer_region:
        prayer, sidebars = build_prayer_block(prayer_region)
        output_blocks.append(prayer)
        # In-region sidebars rendered after the prayer (callouts, conditional inserts, insight boxes)
        for sb in sidebars:
            output_blocks.append(sb)

    # Outro
    for b in outro_blocks:
        k = b.get("kind", "")
        if k in ("intro_essay", "intro_essay_continuation"):
            text = b.get("english_text") or ""
            if text:
                output_blocks.append({"kind": "callout", "body": [{"spans": [{"text": text}]}]})
        elif k == "italic_note":
            text = b.get("english_text") or ""
            if text:
                output_blocks.append({"kind": "instant_insight", "body": [{"spans": [{"text": text}]}]})

    # Learn-link after
    for ll in sec_learn_after:
        output_blocks.append({"kind": "learn_link", "essayId": ll["essayId"], "promptText": ll["promptText"]})

    return {
        "id": section_id,
        "cardId": card_id,
        "title": title,
        "source": "feigenbaum",
        "sourcePages": [page_start, page_end],
        "blocks": output_blocks,
    }


def main():
    sections_def = json.loads(SECTIONS.read_text())["sections"]
    learn_def = json.loads(LEARN_ANCHORS.read_text()) if LEARN_ANCHORS.exists() else []
    # find target card from cli
    target_card = sys.argv[1] if len(sys.argv) > 1 else None
    for sd in sections_def:
        if target_card and sd["cardId"] != target_card:
            continue
        # only process sections whose pages have LLM analyses
        ps, pe = sd["pageStart"], sd["pageEnd"]
        have_all = all((LLM_PAGES / f"p{p:03d}.json").exists() for p in range(ps, pe + 1))
        if not have_all:
            print(f"  SKIP {sd['id']}: missing LLM pages")
            continue
        out = build_section(sd, learn_def if isinstance(learn_def, list) else [])
        # write to src/data/siddur/{card}/{id}.json
        out_path = OUTPUT_DIR / sd["cardId"] / f"{sd['id']}.json"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2))
        n_he = sum(len(b.get("he", [])) for b in out["blocks"] if b.get("kind") == "prayer")
        n_en = sum(len(b.get("en", [])) for b in out["blocks"] if b.get("kind") == "prayer")
        n_blocks = len(out["blocks"])
        print(f"  WROTE {sd['id']}: {n_blocks} blocks, {n_he} he-lines, {n_en} en-paragraphs → {out_path.relative_to(REPO)}")


if __name__ == "__main__":
    main()
