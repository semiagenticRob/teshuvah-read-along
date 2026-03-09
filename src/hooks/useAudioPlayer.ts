import { useEffect, useCallback, useRef } from 'react';
import TrackPlayer, {
  Capability,
  State,
  Event,
} from 'react-native-track-player';
import Tts from 'react-native-tts';
import { Prayer } from '../types';

let isTrackPlayerInitialized = false;

/**
 * Initializes the track player service (called once on app start).
 */
async function initializeTrackPlayer() {
  if (isTrackPlayerInitialized) return;

  await TrackPlayer.setupPlayer({
    waitForBuffer: true,
  });

  await TrackPlayer.updateOptions({
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.SeekTo,
    ],
    compactCapabilities: [Capability.Play, Capability.Pause],
  });

  isTrackPlayerInitialized = true;
}

/**
 * Hook for managing audio playback of a prayer.
 * Supports both pre-recorded audio files and TTS fallback.
 */
export function useAudioPlayer(prayer: Prayer | undefined) {
  const ttsUtteranceId = useRef<string | null>(null);

  useEffect(() => {
    initializeTrackPlayer();
  }, []);

  // Load the prayer's audio track when the prayer changes
  useEffect(() => {
    if (!prayer) return;

    const loadTrack = async () => {
      await TrackPlayer.reset();

      if (prayer.audioSource === 'recorded' && prayer.audioFile) {
        await TrackPlayer.add({
          id: prayer.id,
          url: prayer.audioFile,
          title: prayer.name.english,
          artist: 'Teshuvah Read-Along',
        });
      }
      // TTS prayers are handled in the play function
    };

    loadTrack();
  }, [prayer]);

  const play = useCallback(async () => {
    if (!prayer) return;

    if (prayer.audioSource === 'recorded' && prayer.audioFile) {
      await TrackPlayer.play();
    } else {
      // TTS fallback: speak each line of Hebrew text
      const hebrewText = prayer.sections
        .flatMap((s) => s.lines.map((l) => l.hebrew))
        .join('. ');

      if (hebrewText) {
        Tts.setDefaultLanguage('he-IL');
        Tts.setDefaultRate(0.45); // Slower default for learning
        Tts.speak(hebrewText);
      }
    }
  }, [prayer]);

  const pause = useCallback(async () => {
    if (!prayer) return;

    if (prayer.audioSource === 'recorded') {
      await TrackPlayer.pause();
    } else {
      Tts.stop();
    }
  }, [prayer]);

  const seek = useCallback(async (positionSeconds: number) => {
    if (!prayer) return;

    if (prayer.audioSource === 'recorded') {
      await TrackPlayer.seekTo(positionSeconds);
    }
    // TTS doesn't support seeking — would need to restart from a specific line
  }, [prayer]);

  const setSpeed = useCallback(async (speed: number) => {
    if (!prayer) return;

    if (prayer.audioSource === 'recorded') {
      await TrackPlayer.setRate(speed);
    } else {
      Tts.setDefaultRate(0.45 * speed);
    }
  }, [prayer]);

  return { play, pause, seek, setSpeed };
}
