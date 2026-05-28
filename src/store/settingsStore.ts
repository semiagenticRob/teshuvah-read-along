import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Nusach,
  PlaybackSpeed,
  PrayerSetSize,
  TextSize,
  UserLocation,
  UserTier,
} from '../types';

const SETTINGS_STORAGE_KEY = '@teshuvah_settings';
const DISPLAY_LANES_KEY = '@displayLanes';
const PROFILE_KEY = '@profile';

export interface DisplayLanes {
  hebrew: boolean;
  translit: boolean;
  english: boolean;
}

interface PersistedProfile {
  userTier: UserTier | null;
  hasCompletedOnboarding: boolean;
  prayerSetSize: PrayerSetSize;
  location: UserLocation | null;
}

interface SettingsState {
  textSize: TextSize;
  defaultSpeed: PlaybackSpeed;
  nusach: Nusach;
  isLoaded: boolean;
  displayLanes: DisplayLanes;

  userTier: UserTier | null;
  hasCompletedOnboarding: boolean;
  prayerSetSize: PrayerSetSize;
  location: UserLocation | null;

  setTextSize: (size: TextSize) => void;
  setDefaultSpeed: (speed: PlaybackSpeed) => void;
  setNusach: (nusach: Nusach) => void;
  loadSettings: () => Promise<void>;
  setDisplayLane: (lane: 'hebrew' | 'translit' | 'english', on: boolean) => void;
  setUserTier: (tier: UserTier) => void;
  setPrayerSetSize: (size: PrayerSetSize) => void;
  setLocation: (location: UserLocation | null) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const TIER_PRESETS: Record<UserTier, { lanes: DisplayLanes; size: PrayerSetSize }> = {
  new: {
    lanes: { hebrew: true, translit: true, english: true },
    size: 'simplified',
  },
  returning: {
    lanes: { hebrew: true, translit: true, english: false },
    size: 'full',
  },
  fluent: {
    lanes: { hebrew: true, translit: false, english: false },
    size: 'full',
  },
};

const persistCoreSettings = async (state: SettingsState) => {
  await AsyncStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({
      textSize: state.textSize,
      defaultSpeed: state.defaultSpeed,
      nusach: state.nusach,
    }),
  );
};

const persistProfile = async (state: SettingsState) => {
  const profile: PersistedProfile = {
    userTier: state.userTier,
    hasCompletedOnboarding: state.hasCompletedOnboarding,
    prayerSetSize: state.prayerSetSize,
    location: state.location,
  };
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

const persistLanes = async (lanes: DisplayLanes) => {
  await AsyncStorage.setItem(DISPLAY_LANES_KEY, JSON.stringify(lanes));
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  textSize: 'medium',
  defaultSpeed: 1.0,
  nusach: 'ashkenaz',
  isLoaded: false,
  displayLanes: { hebrew: true, translit: true, english: true },

  userTier: null,
  hasCompletedOnboarding: false,
  prayerSetSize: 'full',
  location: null,

  setTextSize: (textSize) => {
    set({ textSize });
    persistCoreSettings(get());
  },

  setDefaultSpeed: (defaultSpeed) => {
    set({ defaultSpeed });
    persistCoreSettings(get());
  },

  setNusach: (nusach) => {
    set({ nusach });
    persistCoreSettings(get());
  },

  setDisplayLane: (lane, on) => {
    const current = get().displayLanes;
    const next = { ...current, [lane]: on };
    if (!next.hebrew && !next.translit && !next.english) {
      return;
    }
    set({ displayLanes: next });
    persistLanes(next);
  },

  setUserTier: (userTier) => {
    const preset = TIER_PRESETS[userTier];
    set({
      userTier,
      displayLanes: preset.lanes,
      prayerSetSize: preset.size,
    });
    persistProfile(get());
    persistLanes(preset.lanes);
  },

  setPrayerSetSize: (prayerSetSize) => {
    set({ prayerSetSize });
    persistProfile(get());
  },

  setLocation: (location) => {
    set({ location });
    persistProfile(get());
  },

  completeOnboarding: () => {
    set({ hasCompletedOnboarding: true });
    persistProfile(get());
  },

  resetOnboarding: () => {
    set({ hasCompletedOnboarding: false });
    persistProfile(get());
  },

  loadSettings: async () => {
    const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    const profileStored = await AsyncStorage.getItem(PROFILE_KEY);
    const lanesStored = await AsyncStorage.getItem(DISPLAY_LANES_KEY);

    // Migration: any existing persisted core settings or lanes means this is
    // an upgrading user. Default them to 'returning' + onboarding-complete so
    // they're not force-restarted into onboarding.
    const isUpgradingUser = profileStored == null && (stored != null || lanesStored != null);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        set({
          textSize: parsed.textSize ?? 'medium',
          defaultSpeed: parsed.defaultSpeed ?? 1.0,
          nusach: parsed.nusach ?? 'ashkenaz',
        });
      } catch {
        // ignore malformed persisted value
      }
    }

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

    if (profileStored) {
      try {
        const parsed = JSON.parse(profileStored) as Partial<PersistedProfile>;
        set({
          userTier: parsed.userTier ?? null,
          hasCompletedOnboarding: parsed.hasCompletedOnboarding ?? false,
          prayerSetSize: parsed.prayerSetSize ?? 'full',
          location: parsed.location ?? null,
        });
      } catch {
        // ignore malformed persisted value
      }
    } else if (isUpgradingUser) {
      set({
        userTier: 'returning',
        hasCompletedOnboarding: true,
        prayerSetSize: 'full',
      });
      await persistProfile(get());
    }

    set({ isLoaded: true });
  },
}));
