import { useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';
import { Prayer } from '../types';

/**
 * Hook for managing audio playback of a prayer.
 * Currently uses TTS via expo-speech. Will add recorded audio support
 * (via expo-av) once chazzan recordings are available.
 */
export function useAudioPlayer(prayer: Prayer | undefined) {
  const ttsRate = useRef<number>(0.45);

  const play = useCallback(async () => {
    if (!prayer) return;

    const hebrewText = prayer.sections
      .flatMap((s) => s.lines.map((l) => l.hebrew))
      .join('. ');

    if (hebrewText) {
      Speech.speak(hebrewText, {
        language: 'he-IL',
        rate: ttsRate.current,
      });
    }
  }, [prayer]);

  const pause = useCallback(async () => {
    Speech.stop();
  }, []);

  const seek = useCallback(async (_positionSeconds: number) => {
    // TTS doesn't support seeking — will be supported with recorded audio
  }, []);

  const setSpeed = useCallback(async (speed: number) => {
    ttsRate.current = 0.45 * speed;
  }, []);

  return { play, pause, seek, setSpeed };
}
