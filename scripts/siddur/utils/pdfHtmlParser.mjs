/**
 * Pure utility module for parsing pdftohtml output.
 * No file I/O — only string processing.
 */

/**
 * Decodes HTML entities in a text string.
 * Handles: &amp; &lt; &gt; &nbsp; and &#NNN; numeric references.
 * @param {string} str
 * @returns {string}
 */
function decodeEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Tokenize an HTML string into a flat array of token objects.
 *
 * Token shapes:
 *   { kind: 'open',  tag: string, attrs: string }
 *   { kind: 'close', tag: string }
 *   { kind: 'text',  text: string }
 *
 * Comments (<!-- ... -->) and DOCTYPE declarations are skipped.
 * Self-closing tags like <br/> are emitted as 'open' tokens.
 *
 * @param {string} html
 * @returns {Array<{kind: string, tag?: string, attrs?: string, text?: string}>}
 */
export function tokenize(html) {
  const tokens = [];
  let i = 0;
  const len = html.length;

  while (i < len) {
    const ltPos = html.indexOf('<', i);

    if (ltPos === -1) {
      // Remaining content is plain text
      const text = decodeEntities(html.slice(i));
      if (text) tokens.push({ kind: 'text', text });
      break;
    }

    // Emit text before the '<'
    if (ltPos > i) {
      const text = decodeEntities(html.slice(i, ltPos));
      if (text) tokens.push({ kind: 'text', text });
    }

    // Find the matching '>'
    const gtPos = html.indexOf('>', ltPos);
    if (gtPos === -1) {
      // Malformed — emit remaining as text
      const text = decodeEntities(html.slice(ltPos));
      if (text) tokens.push({ kind: 'text', text });
      break;
    }

    const tag = html.slice(ltPos, gtPos + 1); // e.g. "<br/>" or "</i>" or "<!-- comment -->"

    // Skip HTML comments
    if (tag.startsWith('<!--')) {
      // Find the comment end
      const commentEnd = html.indexOf('-->', ltPos);
      i = commentEnd === -1 ? gtPos + 1 : commentEnd + 3;
      continue;
    }

    // Skip DOCTYPE
    if (tag.toLowerCase().startsWith('<!doctype') || tag.startsWith('<!')) {
      i = gtPos + 1;
      continue;
    }

    const inner = tag.slice(1, tag.endsWith('/>') ? -2 : -1).trim();

    if (inner.startsWith('/')) {
      // Closing tag </tagname>
      const closingTag = inner.slice(1).trim().split(/\s/)[0].toLowerCase();
      tokens.push({ kind: 'close', tag: closingTag });
    } else {
      // Opening tag (possibly self-closing)
      const spaceIdx = inner.search(/[\s/]/);
      let tagName, attrs;
      if (spaceIdx === -1) {
        tagName = inner.toLowerCase();
        attrs = '';
      } else {
        tagName = inner.slice(0, spaceIdx).toLowerCase();
        attrs = inner.slice(spaceIdx).trim();
        // Strip trailing slash from attrs for self-closing tags
        if (attrs.endsWith('/')) attrs = attrs.slice(0, -1).trim();
      }
      tokens.push({ kind: 'open', tag: tagName, attrs });
    }

    i = gtPos + 1;
  }

  return tokens;
}

/**
 * Generator that yields italic/bold-aware text runs from a token array.
 *
 * Each run: { text: string, italic: boolean, bold: boolean }
 *
 * Tracks nesting depth for italic tags (i, em) and bold tags (b, strong).
 * Consecutive runs with the same italic+bold state are merged.
 *
 * @param {Array<{kind: string, tag?: string, text?: string}>} tokens
 * @yields {{ text: string, italic: boolean, bold: boolean }}
 */
export function* italicAwareRuns(tokens) {
  let italicDepth = 0;
  let boldDepth = 0;
  let pendingText = '';
  let pendingItalic = false;
  let pendingBold = false;
  let hasPending = false;

  for (const tok of tokens) {
    if (tok.kind === 'open') {
      if (tok.tag === 'i' || tok.tag === 'em') {
        italicDepth++;
      } else if (tok.tag === 'b' || tok.tag === 'strong') {
        boldDepth++;
      }
    } else if (tok.kind === 'close') {
      if (tok.tag === 'i' || tok.tag === 'em') {
        italicDepth = Math.max(0, italicDepth - 1);
      } else if (tok.tag === 'b' || tok.tag === 'strong') {
        boldDepth = Math.max(0, boldDepth - 1);
      }
    } else if (tok.kind === 'text') {
      const curItalic = italicDepth > 0;
      const curBold = boldDepth > 0;

      if (!hasPending) {
        // Start accumulating
        pendingText = tok.text;
        pendingItalic = curItalic;
        pendingBold = curBold;
        hasPending = true;
      } else if (curItalic === pendingItalic && curBold === pendingBold) {
        // Same style — merge
        pendingText += tok.text;
      } else {
        // Style changed — yield accumulated and start fresh
        yield { text: pendingText, italic: pendingItalic, bold: pendingBold };
        pendingText = tok.text;
        pendingItalic = curItalic;
        pendingBold = curBold;
      }
    }
  }

  // Flush remaining
  if (hasPending && pendingText) {
    yield { text: pendingText, italic: pendingItalic, bold: pendingBold };
  }
}
