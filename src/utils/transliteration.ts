/**
 * Hebrew-to-English transliteration utility.
 *
 * Follows standard Ashkenazi transliteration conventions.
 * Handles niqqud (vowel marks), dagesh, final letters, and common
 * consonant combinations.
 */

// Hebrew consonant mappings (Ashkenazi pronunciation)
const CONSONANTS: Record<string, string> = {
  '\u05D0': '', // Alef (silent unless voweled)
  '\u05D1': 'v', // Bet (without dagesh)
  '\u05D2': 'g', // Gimel
  '\u05D3': 'd', // Dalet
  '\u05D4': 'h', // He
  '\u05D5': 'v', // Vav (consonant)
  '\u05D6': 'z', // Zayin
  '\u05D7': 'ch', // Chet
  '\u05D8': 't', // Tet
  '\u05D9': 'y', // Yud
  '\u05DA': 'ch', // Final Kaf
  '\u05DB': 'ch', // Kaf (without dagesh)
  '\u05DC': 'l', // Lamed
  '\u05DD': 'm', // Final Mem
  '\u05DE': 'm', // Mem
  '\u05DF': 'n', // Final Nun
  '\u05E0': 'n', // Nun
  '\u05E1': 's', // Samekh
  '\u05E2': '', // Ayin (silent in Ashkenazi)
  '\u05E3': 'f', // Final Pe
  '\u05E4': 'f', // Pe (without dagesh)
  '\u05E5': 'tz', // Final Tsadi
  '\u05E6': 'tz', // Tsadi
  '\u05E7': 'k', // Qof
  '\u05E8': 'r', // Resh
  '\u05E9': 'sh', // Shin (default — with shin dot)
  '\u05EA': 's', // Tav (Ashkenazi: 's' without dagesh)
};

// Niqqud (vowel marks) mappings
const VOWELS: Record<string, string> = {
  '\u05B0': 'e', // Shva (reduced)
  '\u05B1': 'e', // Hataf Segol
  '\u05B2': 'a', // Hataf Patach
  '\u05B3': 'o', // Hataf Qamats
  '\u05B4': 'i', // Hiriq
  '\u05B5': 'ei', // Tsere
  '\u05B6': 'e', // Segol
  '\u05B7': 'a', // Patach
  '\u05B8': 'a', // Qamats (Ashkenazi: often 'o' in some traditions)
  '\u05B9': 'o', // Holam
  '\u05BA': 'o', // Holam Haser for Vav
  '\u05BB': 'u', // Qubbuts
  '\u05BC': '', // Dagesh (handled separately)
  '\u05BD': '', // Meteg (ignore)
  '\u05BE': '-', // Maqaf (hyphen)
  '\u05BF': '', // Rafe (ignore)
};

// Shin/Sin dot modifiers
const SHIN_DOT = '\u05C1'; // Right dot = Shin
const SIN_DOT = '\u05C2'; // Left dot = Sin

// Dagesh
const DAGESH = '\u05BC';

// Letters that change pronunciation with dagesh
const DAGESH_CHANGES: Record<string, string> = {
  '\u05D1': 'b', // Bet with dagesh = 'b' (not 'v')
  '\u05DB': 'k', // Kaf with dagesh = 'k' (not 'ch')
  '\u05E4': 'p', // Pe with dagesh = 'p' (not 'f')
  '\u05EA': 't', // Tav with dagesh = 't' (not 's')
};

// Vav combinations
const VAV = '\u05D5';

// The Tetragrammaton (יהוה) — always transliterated as "Adonai" per halachic convention.
// Matches the four letters with any interleaved niqqud/cantillation marks.
const TETRAGRAMMATON_PATTERN = /\u05D9[\u0590-\u05CF]*\u05D4[\u0590-\u05CF]*\u05D5[\u0590-\u05CF]*\u05D4[\u0590-\u05CF]*/g;

/**
 * Transliterates a Hebrew string to Latin characters.
 *
 * @param hebrew - Hebrew text (with or without niqqud)
 * @returns Transliterated string
 */
export function transliterateHebrew(hebrew: string): string {
  // Replace the Tetragrammaton with a placeholder before processing
  const processed = hebrew.replace(TETRAGRAMMATON_PATTERN, '\uFFFDAdonai\uFFFD');

  const result: string[] = [];
  const chars = Array.from(processed);

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const nextChar = chars[i + 1];

    // Whitespace
    if (/\s/.test(char)) {
      result.push(' ');
      continue;
    }

    // Handle Tetragrammaton placeholder: read "Adonai" between sentinels
    if (char === '\uFFFD') {
      // Collect characters until the closing sentinel
      let word = '';
      i++;
      while (i < chars.length && chars[i] !== '\uFFFD') {
        word += chars[i];
        i++;
      }
      result.push(word);
      continue;
    }

    // Skip non-Hebrew characters (punctuation, etc.)
    if (char < '\u0590' || char > '\u05FF') {
      // Pass through common punctuation
      if (/[.,;:!?\-'"()]/.test(char)) {
        result.push(char);
      }
      continue;
    }

    // Shin with sin dot = 's'
    if (char === '\u05E9' && nextChar === SIN_DOT) {
      result.push('s');
      i++; // skip the dot
      continue;
    }

    // Shin with shin dot = 'sh' (explicit)
    if (char === '\u05E9' && nextChar === SHIN_DOT) {
      result.push('sh');
      i++; // skip the dot
      continue;
    }

    // Handle dagesh on BG"D KP"T letters
    if (nextChar === DAGESH && DAGESH_CHANGES[char]) {
      result.push(DAGESH_CHANGES[char]);
      i++; // skip the dagesh
      continue;
    }

    // Vav with holam = 'o' (vav-cholam)
    if (char === VAV && nextChar === '\u05B9') {
      result.push('o');
      i++; // skip holam
      continue;
    }

    // Vav with dagesh = 'u' (shuruq)
    if (char === VAV && nextChar === DAGESH) {
      result.push('u');
      i++; // skip dagesh
      continue;
    }

    // Double vav = 'v'
    if (char === VAV && nextChar === VAV) {
      result.push('v');
      i++; // skip second vav
      continue;
    }

    // Yud-yud = 'ei' (common in Yiddish-influenced words)
    if (char === '\u05D9' && nextChar === '\u05D9') {
      result.push('ei');
      i++;
      continue;
    }

    // Vowel marks (niqqud)
    if (VOWELS[char] !== undefined) {
      if (char !== DAGESH && char !== '\u05BD' && char !== '\u05BF') {
        result.push(VOWELS[char]);
      }
      continue;
    }

    // Standard consonant
    if (CONSONANTS[char] !== undefined) {
      result.push(CONSONANTS[char]);
      continue;
    }
  }

  // Clean up the result
  return cleanTransliteration(result.join(''));
}

/**
 * Cleans up the transliterated output.
 */
function cleanTransliteration(text: string): string {
  return text
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .replace(/\s([.,;:!?])/g, '$1') // remove space before punctuation
    .replace(/-\s/g, '-') // remove space after hyphen
    .replace(/\s-/g, '-') // remove space before hyphen
    .trim();
}

/**
 * Capitalizes the first letter of a transliterated string.
 */
export function capitalizeTransliteration(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
