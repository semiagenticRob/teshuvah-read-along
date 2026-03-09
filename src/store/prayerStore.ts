import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlaybackSpeed } from '../types';

const PROGRESS_STORAGE_KEY = '@teshuvah_progress';

interface PrayerState {
  /** Current service being prayed (e.g., "shacharit") */
  currentServiceId: string | null;
  /** Index of current prayer within the service */
  currentPrayerIndex: number;
  /** Index of currently highlighted word */
  currentWordIndex: number;
  /** Index of current line */
  currentLineIndex: number;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current playback speed */
  playbackSpeed: PlaybackSpeed;
  /** Set of prayer IDs the user has completed in this session */
  completedPrayers: Set<string>;

  // Actions
  setCurrentService: (serviceId: string) => void;
  setCurrentPrayer: (index: number) => void;
  setCurrentWord: (lineIndex: number, wordIndex: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  markPrayerCompleted: (prayerId: string) => void;
  nextPrayer: (totalPrayers: number) => void;
  previousPrayer: () => void;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  reset: () => void;
}

export const usePrayerStore = create<PrayerState>((set, get) => ({
  currentServiceId: null,
  currentPrayerIndex: 0,
  currentWordIndex: -1,
  currentLineIndex: 0,
  isPlaying: false,
  playbackSpeed: 1.0,
  completedPrayers: new Set(),

  setCurrentService: (serviceId) => {
    set({ currentServiceId: serviceId, currentPrayerIndex: 0, currentWordIndex: -1, currentLineIndex: 0 });
  },

  setCurrentPrayer: (index) => {
    set({ currentPrayerIndex: index, currentWordIndex: -1, currentLineIndex: 0, isPlaying: false });
  },

  setCurrentWord: (lineIndex, wordIndex) => {
    set({ currentLineIndex: lineIndex, currentWordIndex: wordIndex });
  },

  setIsPlaying: (isPlaying) => {
    set({ isPlaying });
  },

  setPlaybackSpeed: (playbackSpeed) => {
    set({ playbackSpeed });
  },

  markPrayerCompleted: (prayerId) => {
    const completed = new Set(get().completedPrayers);
    completed.add(prayerId);
    set({ completedPrayers: completed });
  },

  nextPrayer: (totalPrayers) => {
    const { currentPrayerIndex } = get();
    if (currentPrayerIndex < totalPrayers - 1) {
      set({
        currentPrayerIndex: currentPrayerIndex + 1,
        currentWordIndex: -1,
        currentLineIndex: 0,
        isPlaying: false,
      });
    }
  },

  previousPrayer: () => {
    const { currentPrayerIndex } = get();
    if (currentPrayerIndex > 0) {
      set({
        currentPrayerIndex: currentPrayerIndex - 1,
        currentWordIndex: -1,
        currentLineIndex: 0,
        isPlaying: false,
      });
    }
  },

  saveProgress: async () => {
    const { currentServiceId, currentPrayerIndex, completedPrayers } = get();
    await AsyncStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        currentServiceId,
        currentPrayerIndex,
        completedPrayers: Array.from(completedPrayers),
      }),
    );
  },

  loadProgress: async () => {
    const stored = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      set({
        currentServiceId: parsed.currentServiceId,
        currentPrayerIndex: parsed.currentPrayerIndex,
        completedPrayers: new Set(parsed.completedPrayers),
      });
    }
  },

  reset: () => {
    set({
      currentServiceId: null,
      currentPrayerIndex: 0,
      currentWordIndex: -1,
      currentLineIndex: 0,
      isPlaying: false,
      playbackSpeed: 1.0,
      completedPrayers: new Set(),
    });
  },
}));
