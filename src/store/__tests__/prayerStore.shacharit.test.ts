import { usePrayerStore } from '../prayerStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('shacharit advance', () => {
  beforeEach(() => {
    usePrayerStore.getState().setShacharitBounds([
      { prayerId: 'a', sectionId: 'birchot', start: 0, end: 3 },
      { prayerId: 'b', sectionId: 'birchot', start: 3, end: 5 },
    ]);
    usePrayerStore.getState().setShacharitActive(0);
    usePrayerStore.getState().setShacharitPlaying(true);
  });

  it('advances within a prayer', () => {
    expect(usePrayerStore.getState().advanceShacharit()).toBe('advanced');
    expect(usePrayerStore.getState().shacharitActiveWord).toBe(1);
  });

  it('stops at prayer boundary', () => {
    usePrayerStore.getState().setShacharitActive(2);
    expect(usePrayerStore.getState().advanceShacharit()).toBe('prayer-boundary');
    expect(usePrayerStore.getState().shacharitPlaying).toBe(false);
    expect(usePrayerStore.getState().shacharitActiveWord).toBe(2);
  });

  it('jumpToNextPrayer moves into following prayer', () => {
    usePrayerStore.getState().setShacharitActive(2);
    usePrayerStore.getState().jumpToNextPrayer();
    expect(usePrayerStore.getState().shacharitActiveWord).toBe(3);
  });

  it('returns end when no active word', () => {
    usePrayerStore.getState().setShacharitActive(null);
    expect(usePrayerStore.getState().advanceShacharit()).toBe('end');
  });
});
