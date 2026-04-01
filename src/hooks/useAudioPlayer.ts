import { useCallback, useRef, useEffect } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Speech from 'expo-speech';
import { Prayer } from '../types';
import { getAudioAsset } from '../data/audioAssets';

/**
 * Dual-mode audio player hook.
 * - Recorded audio: uses expo-av (Audio.Sound) with real play/pause/seek/speed.
 * - TTS fallback: uses expo-speech for prayers without recordings.
 *
 * Returns a stable interface regardless of mode.
 */
// Cache the male Hebrew voice identifier so we only look it up once
let cachedMaleVoice: string | undefined;
async function getMaleHebrewVoice(): Promise<string | undefined> {
  if (cachedMaleVoice !== undefined) return cachedMaleVoice || undefined;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const hebrewVoices = voices.filter((v) => v.language?.startsWith('he'));
    // Prefer a male voice; fall back to any non-default Hebrew voice
    const male = hebrewVoices.find(
      (v) => v.identifier?.toLowerCase().includes('male') ||
             v.identifier?.toLowerCase().includes('grandpa') ||
             v.name?.toLowerCase().includes('male'),
    );
    cachedMaleVoice = male?.identifier ?? '';
    return cachedMaleVoice || undefined;
  } catch {
    cachedMaleVoice = '';
    return undefined;
  }
}

export function useAudioPlayer(prayer: Prayer | undefined, initialSpeed: number = 1.0) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioAsset = prayer ? getAudioAsset(prayer.id) : undefined;
  const isRecorded = prayer?.audioSource === 'recorded' && audioAsset !== undefined;

  // TTS state
  const ttsRate = useRef<number>(0.45 * initialSpeed);
  const ttsVoice = useRef<string | undefined>(undefined);
  const ttsStopping = useRef<boolean>(false); // suppress onDone when deliberately paused
  const ttsStartTime = useRef<number>(0);
  const ttsPlaying = useRef<boolean>(false);
  const ttsPausedElapsed = useRef<number>(0);
  const ttsSpeedMultiplier = useRef<number>(1.0);

  // Callbacks for playback events
  const onCompleteRef = useRef<(() => void) | null>(null);

  // Clean up sound on unmount or prayer change
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      Speech.stop();
    };
  }, [prayer?.id]);

  // Load recorded audio when prayer changes
  useEffect(() => {
    if (!isRecorded || !audioAsset) return;

    let cancelled = false;

    const loadSound = async () => {
      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        audioAsset,
        { shouldPlay: false },
        (status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            onCompleteRef.current?.();
          }
        },
      );

      if (!cancelled) {
        soundRef.current = sound;
        // Apply persisted speed to newly loaded audio
        if (initialSpeed !== 1.0) {
          await sound.setRateAsync(initialSpeed, true);
        }
      } else {
        sound.unloadAsync();
      }
    };

    loadSound();
    return () => { cancelled = true; };
  }, [prayer?.id, isRecorded, audioAsset, initialSpeed]);

  const play = useCallback(async () => {
    if (!prayer) return;

    if (isRecorded && soundRef.current) {
      await soundRef.current.playAsync();
    } else {
      // TTS mode — prefer male voice
      const hebrewText = prayer.sections
        .flatMap((s) => s.lines.map((l) => l.hebrew))
        .join('. ');

      if (hebrewText) {
        // Resolve male voice if not yet cached
        if (!ttsVoice.current) {
          ttsVoice.current = await getMaleHebrewVoice() ?? undefined;
        }
        ttsStartTime.current = Date.now() - ttsPausedElapsed.current;
        ttsPlaying.current = true;
        ttsStopping.current = false;
        Speech.speak(hebrewText, {
          language: 'he-IL',
          rate: ttsRate.current,
          voice: ttsVoice.current,
          onDone: () => {
            ttsPlaying.current = false;
            // Only trigger completion if not deliberately paused
            if (!ttsStopping.current) {
              onCompleteRef.current?.();
            }
          },
        });
      }
    }
  }, [prayer, isRecorded]);

  const pause = useCallback(async () => {
    if (isRecorded && soundRef.current) {
      await soundRef.current.pauseAsync();
    } else {
      // TTS: stop and record elapsed time for resume estimation
      ttsStopping.current = true;
      ttsPausedElapsed.current = Date.now() - ttsStartTime.current;
      ttsPlaying.current = false;
      Speech.stop();
    }
  }, [isRecorded]);

  const seek = useCallback(async (positionMs: number) => {
    if (isRecorded && soundRef.current) {
      await soundRef.current.setPositionAsync(positionMs);
    } else {
      // TTS: update estimated position for word sync
      ttsPausedElapsed.current = positionMs;
      ttsStartTime.current = Date.now() - positionMs;
    }
  }, [isRecorded]);

  const setSpeed = useCallback(async (speed: number) => {
    ttsSpeedMultiplier.current = speed;
    if (isRecorded && soundRef.current) {
      await soundRef.current.setRateAsync(speed, true);
    } else {
      ttsRate.current = 0.45 * speed;
    }
  }, [isRecorded]);

  /**
   * Returns the current playback position in milliseconds.
   * For recorded audio: queries expo-av for actual position.
   * For TTS: returns estimated position from elapsed time.
   */
  const getPositionMs = useCallback(async (): Promise<number> => {
    if (isRecorded && soundRef.current) {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        return status.positionMillis;
      }
      return 0;
    }
    // TTS estimation
    if (ttsPlaying.current) {
      return (Date.now() - ttsStartTime.current) * ttsSpeedMultiplier.current;
    }
    return ttsPausedElapsed.current * ttsSpeedMultiplier.current;
  }, [isRecorded]);

  /**
   * Register a callback for when playback completes.
   */
  const onComplete = useCallback((callback: () => void) => {
    onCompleteRef.current = callback;
  }, []);

  return { play, pause, seek, setSpeed, getPositionMs, onComplete };
}
