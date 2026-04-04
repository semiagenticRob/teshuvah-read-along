import { useEffect, useRef } from 'react';
import { Prayer } from '../types';
import { usePrayerStore } from '../store/prayerStore';

const SYNC_INTERVAL_MS = 50;
const ANTICIPATION_OFFSET_MS = 85; // Compensate for render pipeline latency

/**
 * Hook that synchronizes the currently highlighted word with the audio playback position.
 *
 * Uses getPositionMs() from the audio player to get the actual playback position,
 * then binary-searches the word timing index to find the current word.
 */
export function useWordSync(
  prayer: Prayer | undefined,
  isPlaying: boolean,
  getPositionMs: () => Promise<number>,
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setCurrentWord } = usePrayerStore();

  useEffect(() => {
    if (!prayer || !isPlaying || !prayer.sections.length) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const wordIndex = buildWordIndex(prayer);
    if (wordIndex.length === 0) return;

    intervalRef.current = setInterval(async () => {
      const rawPosMs = await getPositionMs();
      const posMs = rawPosMs + ANTICIPATION_OFFSET_MS;
      const result = findWordAtTime(wordIndex, posMs);
      if (result) {
        setCurrentWord(result.lineIndex, result.wordIndex);
      }
    }, SYNC_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [prayer, isPlaying, setCurrentWord, getPositionMs]);
}

interface IndexedWord {
  lineIndex: number;
  wordIndex: number;
  startTime: number;
  endTime: number;
}

/**
 * Builds a flat, sorted array of all words with their timing and position data.
 */
function buildWordIndex(prayer: Prayer): IndexedWord[] {
  const index: IndexedWord[] = [];

  for (const section of prayer.sections) {
    for (let lineIdx = 0; lineIdx < section.lines.length; lineIdx++) {
      const line = section.lines[lineIdx];
      for (let wordIdx = 0; wordIdx < line.words.length; wordIdx++) {
        const word = line.words[wordIdx];
        index.push({
          lineIndex: lineIdx,
          wordIndex: wordIdx,
          startTime: word.startTime,
          endTime: word.endTime,
        });
      }
    }
  }

  return index;
}

/**
 * Binary search to find which word is active at the given time position.
 */
function findWordAtTime(
  wordIndex: IndexedWord[],
  timeMs: number,
): { lineIndex: number; wordIndex: number } | null {
  if (wordIndex.length === 0) return null;

  let low = 0;
  let high = wordIndex.length - 1;
  let result: IndexedWord | null = null;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const word = wordIndex[mid];

    if (timeMs >= word.startTime && timeMs < word.endTime) {
      return { lineIndex: word.lineIndex, wordIndex: word.wordIndex };
    }

    if (timeMs >= word.startTime) {
      result = word;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (result) {
    return { lineIndex: result.lineIndex, wordIndex: result.wordIndex };
  }

  return null;
}
