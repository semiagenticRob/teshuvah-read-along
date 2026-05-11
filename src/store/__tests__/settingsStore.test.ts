import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettingsStore } from '../settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const resetStoreToDefaults = () => {
  useSettingsStore.setState({
    textSize: 'medium',
    defaultSpeed: 1.0,
    nusach: 'ashkenaz',
    isLoaded: false,
    displayLanes: { hebrew: true, translit: true, english: false },
    userTier: null,
    hasCompletedOnboarding: false,
    prayerSetSize: 'full',
    location: null,
  });
};

describe('displayLanes', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    resetStoreToDefaults();
  });

  it('allows independent toggling', () => {
    useSettingsStore.getState().setDisplayLane('english', true);
    expect(useSettingsStore.getState().displayLanes).toEqual({
      hebrew: true,
      translit: true,
      english: true,
    });
  });

  it('refuses to turn off the last remaining lane', () => {
    useSettingsStore.setState({ displayLanes: { hebrew: true, translit: false, english: false } });
    useSettingsStore.getState().setDisplayLane('hebrew', false);
    expect(useSettingsStore.getState().displayLanes.hebrew).toBe(true);
  });
});

describe('tier presets', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    resetStoreToDefaults();
  });

  it('sets New tier → Hebrew + translit + English + simplified', () => {
    useSettingsStore.getState().setUserTier('new');
    const s = useSettingsStore.getState();
    expect(s.userTier).toBe('new');
    expect(s.displayLanes).toEqual({ hebrew: true, translit: true, english: true });
    expect(s.prayerSetSize).toBe('simplified');
  });

  it('sets Returning tier → Hebrew + translit + full', () => {
    useSettingsStore.getState().setUserTier('returning');
    const s = useSettingsStore.getState();
    expect(s.userTier).toBe('returning');
    expect(s.displayLanes).toEqual({ hebrew: true, translit: true, english: false });
    expect(s.prayerSetSize).toBe('full');
  });

  it('sets Fluent tier → Hebrew only + full', () => {
    useSettingsStore.getState().setUserTier('fluent');
    const s = useSettingsStore.getState();
    expect(s.userTier).toBe('fluent');
    expect(s.displayLanes).toEqual({ hebrew: true, translit: false, english: false });
    expect(s.prayerSetSize).toBe('full');
  });

  it('lets the user override individual lanes after a tier is applied', () => {
    useSettingsStore.getState().setUserTier('fluent');
    useSettingsStore.getState().setDisplayLane('translit', true);
    expect(useSettingsStore.getState().displayLanes.translit).toBe(true);
  });
});

describe('onboarding completion', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    resetStoreToDefaults();
  });

  it('starts with onboarding not complete', () => {
    expect(useSettingsStore.getState().hasCompletedOnboarding).toBe(false);
  });

  it('completes and persists onboarding', async () => {
    useSettingsStore.getState().completeOnboarding();
    expect(useSettingsStore.getState().hasCompletedOnboarding).toBe(true);
    const stored = await AsyncStorage.getItem('@profile');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).hasCompletedOnboarding).toBe(true);
  });

  it('resetOnboarding clears the completion flag', () => {
    useSettingsStore.getState().completeOnboarding();
    useSettingsStore.getState().resetOnboarding();
    expect(useSettingsStore.getState().hasCompletedOnboarding).toBe(false);
  });
});

describe('loadSettings migration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    resetStoreToDefaults();
  });

  it('treats existing core-settings install as upgrading user → returning + onboarded', async () => {
    await AsyncStorage.setItem(
      '@teshuvah_settings',
      JSON.stringify({ textSize: 'large', defaultSpeed: 1.0, nusach: 'ashkenaz' }),
    );
    await useSettingsStore.getState().loadSettings();
    const s = useSettingsStore.getState();
    expect(s.hasCompletedOnboarding).toBe(true);
    expect(s.userTier).toBe('returning');
    expect(s.prayerSetSize).toBe('full');
    expect(s.textSize).toBe('large');
  });

  it('treats existing displayLanes-only install as upgrading user', async () => {
    await AsyncStorage.setItem(
      '@displayLanes',
      JSON.stringify({ hebrew: true, translit: true, english: false }),
    );
    await useSettingsStore.getState().loadSettings();
    expect(useSettingsStore.getState().hasCompletedOnboarding).toBe(true);
    expect(useSettingsStore.getState().userTier).toBe('returning');
  });

  it('treats fresh install (no persisted keys) as onboarding pending', async () => {
    await useSettingsStore.getState().loadSettings();
    expect(useSettingsStore.getState().hasCompletedOnboarding).toBe(false);
    expect(useSettingsStore.getState().userTier).toBeNull();
  });

  it('restores a previously persisted profile verbatim', async () => {
    await AsyncStorage.setItem(
      '@profile',
      JSON.stringify({
        userTier: 'fluent',
        hasCompletedOnboarding: true,
        prayerSetSize: 'full',
        location: { latitude: 31.78, longitude: 35.22, label: 'Jerusalem', source: 'manual' },
      }),
    );
    await useSettingsStore.getState().loadSettings();
    const s = useSettingsStore.getState();
    expect(s.userTier).toBe('fluent');
    expect(s.hasCompletedOnboarding).toBe(true);
    expect(s.location?.label).toBe('Jerusalem');
  });

  it('sets isLoaded after migration completes', async () => {
    await useSettingsStore.getState().loadSettings();
    expect(useSettingsStore.getState().isLoaded).toBe(true);
  });
});

describe('location', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    resetStoreToDefaults();
  });

  it('stores and persists a device location', async () => {
    useSettingsStore.getState().setLocation({
      latitude: 40.7128,
      longitude: -74.006,
      label: 'New York, NY',
      source: 'device',
    });
    expect(useSettingsStore.getState().location?.label).toBe('New York, NY');
    const stored = await AsyncStorage.getItem('@profile');
    expect(JSON.parse(stored!).location.latitude).toBeCloseTo(40.7128);
  });

  it('clears location when set to null', () => {
    useSettingsStore.getState().setLocation({
      latitude: 1,
      longitude: 2,
      source: 'device',
    });
    useSettingsStore.getState().setLocation(null);
    expect(useSettingsStore.getState().location).toBeNull();
  });
});
