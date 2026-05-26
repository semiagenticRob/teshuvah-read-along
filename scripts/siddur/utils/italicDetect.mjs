/**
 * Utility for converting raw italic/bold runs into EnglishSpan arrays.
 *
 * EnglishSpan = { text: string, style?: 'italic' | 'bold' }
 */

/**
 * Converts an array of italic/bold-aware runs into merged EnglishSpan objects.
 *
 * Input: Array<{ text: string, italic: boolean, bold: boolean }>
 *   (as produced by italicAwareRuns in pdfHtmlParser.mjs)
 *
 * Returns: Array<{ text: string, style?: 'italic' | 'bold' }>
 *
 * Rules:
 * - Merge consecutive runs with the same italic/bold state.
 * - Drop runs where text.trim() === '' UNLESS it's whitespace between
 *   meaningful runs (preserve single spaces between words).
 * - If italic && bold → style: 'bold' (bold takes priority at MVP).
 * - If italic && !bold → style: 'italic'.
 * - If !italic && !bold → no style property (omitted).
 * - Strip leading/trailing whitespace from the final merged run text.
 *
 * @param {Array<{ text: string, italic: boolean, bold: boolean }>} runs
 * @returns {Array<{ text: string, style?: 'italic' | 'bold' }>}
 */
export function runsToSpans(runs) {
  if (!runs || runs.length === 0) return [];

  // Step 1: Merge consecutive runs with the same italic/bold state.
  const merged = [];
  for (const run of runs) {
    if (merged.length === 0) {
      merged.push({ text: run.text, italic: run.italic, bold: run.bold });
    } else {
      const last = merged[merged.length - 1];
      if (last.italic === run.italic && last.bold === run.bold) {
        last.text += run.text;
      } else {
        merged.push({ text: run.text, italic: run.italic, bold: run.bold });
      }
    }
  }

  // Step 2: Filter out empty-text runs while preserving inter-word whitespace.
  // A run is kept if it has non-whitespace content, OR if it consists of
  // whitespace that separates two meaningful (non-empty) runs.
  const filtered = [];
  for (let i = 0; i < merged.length; i++) {
    const run = merged[i];
    if (run.text.trim() !== '') {
      // Has meaningful content — always keep.
      filtered.push(run);
    } else {
      // Pure whitespace — keep only if it sits between two meaningful runs.
      const hasBefore = i > 0 && merged[i - 1].text.trim() !== '';
      const hasAfter = i < merged.length - 1 && merged[i + 1].text.trim() !== '';
      if (hasBefore && hasAfter) {
        // Collapse to a single space to avoid accumulating nbsp runs.
        filtered.push({ text: ' ', italic: run.italic, bold: run.bold });
      }
      // Otherwise discard.
    }
  }

  // Step 3: Convert to EnglishSpan objects, stripping leading/trailing whitespace.
  return filtered.map(run => {
    const text = run.text.trim();
    if (text === '') return null; // Shouldn't happen after filtering, but guard.

    /** @type {{ text: string, style?: 'italic' | 'bold' }} */
    const span = { text };
    if (run.bold) {
      span.style = 'bold';
    } else if (run.italic) {
      span.style = 'italic';
    }
    // !italic && !bold → no style property
    return span;
  }).filter(Boolean);
}
