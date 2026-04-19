import { useSettingsStore } from '../settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('displayLanes', () => {
  beforeEach(() => {
    useSettingsStore.setState({ displayLanes: { hebrew: true, translit: true, english: false } });
  });

  it('allows independent toggling', () => {
    useSettingsStore.getState().setDisplayLane('english', true);
    expect(useSettingsStore.getState().displayLanes).toEqual({ hebrew: true, translit: true, english: true });
  });

  it('refuses to turn off the last remaining lane', () => {
    useSettingsStore.setState({ displayLanes: { hebrew: true, translit: false, english: false } });
    useSettingsStore.getState().setDisplayLane('hebrew', false);
    expect(useSettingsStore.getState().displayLanes.hebrew).toBe(true);
  });
});
