/**
 * hebrewTokenize.mjs — Pure Hebrew tokenization utilities for Stage 04.
 *
 * Two exports:
 *   tokenizeHebrewLines(text)   — extract Hebrew-only lines from rawText
 *   assignGlobalIndices(lines, startIndex) — assign monotonic word indices
 */

/**
 * RTL embedding markers used by pdftohtml to wrap Hebrew runs.
 *   U+202B  RIGHT-TO-LEFT EMBEDDING  (RLE)
 *   U+202C  POP DIRECTIONAL FORMATTING (PDF)
 */
const RLE = '‫';
const PDF_MARK = '‬';

/**
 * True if a string contains at least one Hebrew base letter (alef–tav,
 * U+05D0–U+05EA).
 *
 * @param {string} s
 * @returns {boolean}
 */
function hasHebrew(s) {
  return /[א-ת]/.test(s);
}

/**
 * Tokenize a prayer block's rawText into an array of Hebrew-only lines.
 *
 * The rawText produced by pdftohtml is a single flat string where Hebrew
 * runs are wrapped in RTL embedding marks (U+202B…U+202C).  We treat each
 * such segment as one logical "line" of prayer text, then split its words
 * on whitespace.
 *
 * Rules (per spec):
 *   - Split on \n first (most rawTexts are single-line, but future-proof).
 *   - Within each physical line, extract RTL-embedded segments.
 *   - If no RTL markers are present, treat the whole physical line as a
 *     candidate Hebrew line (fallback for plain Hebrew text).
 *   - Keep only segments that contain at least one Hebrew letter.
 *   - Split words on whitespace (/\s+/), filter empty strings.
 *   - Niqqud (U+05B0–U+05C7) and ta'amim (U+0591–U+05AF) are kept
 *     attached — we do NOT strip them.
 *   - lineIndex is the sequential index among Hebrew-only lines (0-based),
 *     counting across the entire rawText input.
 *
 * @param {string} text  Raw text from a prayer block's `rawText` field.
 * @returns {Array<{ lineIndex: number, words: string[] }>}
 */
export function tokenizeHebrewLines(text) {
  if (!text) return [];

  const result = [];
  let lineIndex = 0;

  // Split on newlines first (future-proof; most rawTexts are single-line).
  const physicalLines = text.split('\n');

  for (const physLine of physicalLines) {
    if (!hasHebrew(physLine)) continue;

    // Extract RTL-embedded segments from this physical line.
    // Each segment between RLE (U+202B) and PDF (U+202C) is one candidate line.
    const rtlSegments = [];
    let pos = 0;
    while (pos < physLine.length) {
      const start = physLine.indexOf(RLE, pos);
      if (start === -1) break;
      const end = physLine.indexOf(PDF_MARK, start + 1);
      if (end === -1) {
        // Unclosed RLE — treat remainder as one segment.
        rtlSegments.push(physLine.slice(start + 1));
        break;
      }
      rtlSegments.push(physLine.slice(start + 1, end));
      pos = end + 1;
    }

    // Fallback: if no RTL markers found but line has Hebrew, treat the
    // whole physical line as one segment.
    const candidates = rtlSegments.length > 0 ? rtlSegments : [physLine];

    for (const seg of candidates) {
      // Strip leading/trailing whitespace and directional control chars.
      const cleaned = seg.replace(/[‎‏‪-‮]/g, '').trim();

      if (!hasHebrew(cleaned)) continue;

      // Split on whitespace, discard empty tokens.
      const words = cleaned.split(/\s+/).filter(w => w.length > 0 && hasHebrew(w));

      if (words.length === 0) continue;

      result.push({ lineIndex, words });
      lineIndex++;
    }
  }

  return result;
}

/**
 * Assign monotonically increasing globalIndex values to every word across
 * the provided lines.
 *
 * @param {Array<{ lineIndex: number, words: string[] }>} lines
 *   Output of tokenizeHebrewLines (or equivalent).
 * @param {number} startIndex
 *   The global index counter value for the first word in this block.
 * @returns {{
 *   lines: Array<{ lineIndex: number, words: Array<{ text: string, globalIndex: number }> }>,
 *   nextIndex: number
 * }}
 */
export function assignGlobalIndices(lines, startIndex) {
  let counter = startIndex;
  const assignedLines = lines.map(line => ({
    lineIndex: line.lineIndex,
    words: line.words.map(text => ({
      text,
      globalIndex: counter++,
    })),
  }));
  return { lines: assignedLines, nextIndex: counter };
}
