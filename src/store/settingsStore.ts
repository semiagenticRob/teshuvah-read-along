import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DisplayMode, Nusach, PlaybackSpeed, TextSize } from '../types';

const SETTINGS_STORAGE_KEY = '@teshuvah_settings';

interface SettingsState {
  textSize: TextSize;
  displayMode: DisplayMode;
  defaultSpeed: PlaybackSpeed;
  nusach: Nusach;
  isLoaded: boolean;

  setTextSize: (size: TextSize) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setDefaultSpeed: (speed: PlaybackSpeed) => void;
  setNusach: (nusach: Nusach) => void;
  loadSettings: () => Promise<void>;
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

  loadSettings: async () => {
    const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      set({ ...parsed, isLoaded: true });
    } else {
      set({ isLoaded: true });
    }
  },
}));
