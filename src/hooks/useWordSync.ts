import { useEffect, useRef } from 'react';
import TrackPlayer from 'react-native-track-player';
import { Prayer, WordTiming } from '../types';
import { usePrayerStore } from '../store/prayerStore';

const SYNC_INTERVAL_MS = 50;

/**
 * Hook that synchronizes the currently highlighted word with the audio playback position.
 *
 * For pre-recorded audio: polls TrackPlayer.getPosition() every 50ms and uses binary search
 * on the timing data to find the current word.
 *
 * For TTS audio: uses estimated timing based on ~300ms per word.
 */
export function useWordSync(prayer: Prayer | undefined, isPlaying: boolean) {
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

    // Build a flat index of all words with their line positions for binary search
    const wordIndex = buildWordIndex(prayer);

    if (wordIndex.length === 0) return;

    if (prayer.audioSource === 'recorded') {
      // Poll audio position and find current word
      intervalRef.current = setInterval(async () => {
        try {
          const position = await TrackPlayer.getPosition();
          const positionMs = position * 1000;
          const result = findWordAtTime(wordIndex, positionMs);
          if (result) {
            setCurrentWord(result.lineIndex, result.wordIndex);
          }
        } catch {
          // TrackPlayer may not be ready yet
        }
      }, SYNC_INTERVAL_MS);
    } else {
      // TTS: use estimated timing with a simple timer
      let startTime = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const result = findWordAtTime(wordIndex, elapsed);
        if (result) {
          setCurrentWord(result.lineIndex, result.wordIndex);
        }
      }, SYNC_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [prayer, isPlaying, setCurrentWord]);
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
