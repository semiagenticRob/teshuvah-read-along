import { Prayer, PrayerLine, PrayerSection, WordTiming, Footnote } from '../types';
import { fetchPrayerText, flattenTextArray, stripHtml } from './sefariaClient';
import { transliterateHebrew } from '../utils/transliteration';
import { getBundledPrayerText, BundledFootnoteEntry } from '../data/bundled/shacharit';

/**
 * Loads prayer text, preferring bundled content over API fetch.
 * Bundled content loads synchronously (no network needed).
 * Falls back to Sefaria API if no bundled content exists.
 */
export async function loadPrayerContent(prayer: Prayer): Promise<Prayer> {
  // Try bundled content first (instant, offline-capable)
  const bundled = getBundledPrayerText(prayer.id);

  let hebrewLines: string[];
  let englishLines: string[];
  let footnoteEntries: BundledFootnoteEntry[] | undefined;

  if (bundled) {
    // Bundled content is already flattened, HTML-stripped, and footnotes extracted
    hebrewLines = bundled.he;
    englishLines = bundled.text;
    footnoteEntries = bundled.footnotes;
  } else {
    // Fallback to Sefaria API (footnotes will remain inline — not ideal but functional)
    const response = await fetchPrayerText(prayer.sefariaRef);
    hebrewLines = flattenTextArray(response.he).map(stripHtml).filter(Boolean);
    englishLines = flattenTextArray(response.text).map(stripHtml).filter(Boolean);
  }

  // Build a lookup for footnotes by line index
  const footnotesByLine = new Map<number, Footnote[]>();
  if (footnoteEntries) {
    for (const entry of footnoteEntries) {
      footnotesByLine.set(entry.lineIndex, entry.footnotes);
    }
  }

  const lines: PrayerLine[] = hebrewLines.map((hebrewLine, index) => {
    const english = englishLines[index] || '';
    const hebrewWords = splitHebrewWords(hebrewLine);
    const transliteration = transliterateHebrew(hebrewLine);

    const words: WordTiming[] = hebrewWords.map((word) => ({
      hebrew: word,
      transliteration: transliterateHebrew(word),
      startTime: 0,
      endTime: 0,
    }));

    const line: PrayerLine = {
      hebrew: hebrewLine,
      english,
      transliteration,
      words,
    };

    const footnotes = footnotesByLine.get(index);
    if (footnotes) {
      line.footnotes = footnotes;
    }

    return line;
  });

  const section: PrayerSection = {
    id: `${prayer.id}_main`,
    lines,
  };

  return {
    ...prayer,
    sections: [section],
  };
}

/**
 * Splits a Hebrew text line into individual words.
 * Handles Hebrew punctuation and special characters.
 */
function splitHebrewWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 0);
}

/**
 * Loads timing data from bundled JSON files for pre-recorded prayers.
 * Falls back to estimated timing if no timing file exists.
 */
export function applyTimingData(
  prayer: Prayer,
  timingData: { words: { startTime: number; endTime: number }[] }[],
): Prayer {
  const updatedSections = prayer.sections.map((section) => {
    const updatedLines = section.lines.map((line, lineIndex) => {
      const lineTiming = timingData[lineIndex];
      if (!lineTiming) return line;

      const updatedWords = line.words.map((word, wordIndex) => {
        const timing = lineTiming.words[wordIndex];
        if (!timing) return word;
        return {
          ...word,
          startTime: timing.startTime,
          endTime: timing.endTime,
        };
      });

      return { ...line, words: updatedWords };
    });

    return { ...section, lines: updatedLines };
  });

  return { ...prayer, sections: updatedSections };
}

/**
 * Generates estimated timing data for TTS playback.
 * Estimates ~300ms per Hebrew word at 1.0x speed.
 */
export function generateEstimatedTiming(prayer: Prayer): Prayer {
  const MS_PER_WORD = 300;
  let currentTime = 0;

  const updatedSections = prayer.sections.map((section) => {
    const updatedLines = section.lines.map((line) => {
      const updatedWords = line.words.map((word) => {
        const start = currentTime;
        currentTime += MS_PER_WORD;
        return {
          ...word,
          startTime: start,
          endTime: currentTime,
        };
      });
      // Small pause between lines
      currentTime += 200;
      return { ...line, words: updatedWords };
    });

    return { ...section, lines: updatedLines };
  });

  return { ...prayer, sections: updatedSections };
}
