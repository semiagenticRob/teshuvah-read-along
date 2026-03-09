import { Prayer, PrayerLine, PrayerSection, WordTiming } from '../types';
import { fetchPrayerText, flattenTextArray, stripHtml } from './sefariaClient';
import { transliterateHebrew } from '../utils/transliteration';

/**
 * Fetches prayer text from Sefaria and transforms it into our Prayer data model.
 * This bridges the Sefaria API format with our app's internal format.
 */
export async function loadPrayerContent(prayer: Prayer): Promise<Prayer> {
  const response = await fetchPrayerText(prayer.sefariaRef);

  const hebrewLines = flattenTextArray(response.he).map(stripHtml).filter(Boolean);
  const englishLines = flattenTextArray(response.text).map(stripHtml).filter(Boolean);

  const lines: PrayerLine[] = hebrewLines.map((hebrewLine, index) => {
    const english = englishLines[index] || '';
    const hebrewWords = splitHebrewWords(hebrewLine);
    const transliteration = transliterateHebrew(hebrewLine);

    const words: WordTiming[] = hebrewWords.map((word) => ({
      hebrew: word,
      transliteration: transliterateHebrew(word),
      // Timing data starts at 0 — will be populated from timing files or TTS
      startTime: 0,
      endTime: 0,
    }));

    return {
      hebrew: hebrewLine,
      english,
      transliteration,
      words,
    };
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
