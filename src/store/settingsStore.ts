import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DisplayMode, Nusach, PlaybackSpeed, TextSize } from '../types';

const SETTINGS_STORAGE_KEY = '@teshuvah_settings';
const DISPLAY_LANES_KEY = '@displayLanes';

export interface DisplayLanes {
  hebrew: boolean;
  translit: boolean;
  english: boolean;
}

interface SettingsState {
  textSize: TextSize;
  displayMode: DisplayMode;
  defaultSpeed: PlaybackSpeed;
  nusach: Nusach;
  isLoaded: boolean;
  displayLanes: DisplayLanes;

  setTextSize: (size: TextSize) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setDefaultSpeed: (speed: PlaybackSpeed) => void;
  setNusach: (nusach: Nusach) => void;
  loadSettings: () => Promise<void>;
  setDisplayLane: (lane: 'hebrew' | 'translit' | 'english', on: boolean) => void;
}

const persistSettings = async (state: Partial<SettingsState>) => {
  const { isLoaded, ...toSave } = state as SettingsState;
  await AsyncStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({
      textSize: toSave.textSize,
      displayMode: toSave.displayMode,
      defaultSpeed: toSave.defaultSpeed,
      nusach: toSave.nusach,
    }),
  );
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  textSize: 'medium',
  displayMode: 'all',
  defaultSpeed: 1.0,
  nusach: 'ashkenaz',
  isLoaded: false,
  displayLanes: { hebrew: true, translit: true, english: false },

  setTextSize: (textSize) => {
    set({ textSize });
    persistSettings(get());
  },

  setDisplayMode: (displayMode) => {
    set({ displayMode });
    persistSettings(get());
  },

  setDefaultSpeed: (defaultSpeed) => {
    set({ defaultSpeed });
    persistSettings(get());
  },

  setNusach: (nusach) => {
    set({ nusach });
    persistSettings(get());
  },

  setDisplayLane: (lane, on) => {
    const current = get().displayLanes;
    const next = { ...current, [lane]: on };
    // Refuse if all three lanes would be off
    if (!next.hebrew && !next.translit && !next.english) {
      return;
    }
    set({ displayLanes: next });
    AsyncStorage.setItem(DISPLAY_LANES_KEY, JSON.stringify(next));
  },

  loadSettings: async () => {
    const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      set({
        textSize: parsed.textSize ?? 'medium',
        displayMode: parsed.displayMode ?? 'all',
        defaultSpeed: parsed.defaultSpeed ?? 1.0,
        nusach: parsed.nusach ?? 'ashkenaz',
        isLoaded: true,
      });
    } else {
      set({ isLoaded: true });
    }

    const lanesStored = await AsyncStorage.getItem(DISPLAY_LANES_KEY);
    if (lanesStored) {
      try {
        const parsed: DisplayLanes = JSON.parse(lanesStored);
        if (
          typeof parsed.hebrew === 'boolean' &&
          typeof parsed.translit === 'boolean' &&
          typeof parsed.english === 'boolean'
        ) {
          set({ displayLanes: parsed });
        }
      } catch {
        // ignore malformed persisted value
      }
    }
  },
}));
