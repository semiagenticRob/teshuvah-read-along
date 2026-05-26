import React from 'react';
// @ts-expect-error
import TestRenderer from 'react-test-renderer';

jest.mock('../../../store/siddurStore');
jest.mock('../../../theme/siddurTheme', () => ({
  TIMING: { CADENCE_MIN: 100, CADENCE_JITTER: 0, INITIAL_DELAY: 50 },
}));

import { useSiddurStore } from '../../../store/siddurStore';
import { useKaraokeTickLoop } from '../useKaraokeTickLoop';

const mockUseSiddurStore = useSiddurStore as jest.MockedFunction<typeof useSiddurStore>;

function TestComponent() {
  useKaraokeTickLoop();
  return null;
}

describe('useKaraokeTickLoop', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls advance after INITIAL_DELAY when isPlaying=true', () => {
    const advance = jest.fn().mockReturnValue('advanced');
    mockUseSiddurStore.mockImplementation((selector: any) =>
      selector({ isPlaying: true, speed: 1, advance }),
    );

    TestRenderer.act(() => {
      TestRenderer.create(React.createElement(TestComponent));
    });

    TestRenderer.act(() => {
      jest.advanceTimersByTime(50 + 1); // just past INITIAL_DELAY, before first CADENCE tick
    });

    expect(advance).toHaveBeenCalledTimes(1);
  });

  it('stops after section-boundary', () => {
    const advance = jest.fn().mockReturnValue('section-boundary');
    mockUseSiddurStore.mockImplementation((selector: any) =>
      selector({ isPlaying: true, speed: 1, advance }),
    );

    TestRenderer.act(() => {
      TestRenderer.create(React.createElement(TestComponent));
    });

    TestRenderer.act(() => {
      jest.advanceTimersByTime(50 + 100 * 5);
    });

    expect(advance).toHaveBeenCalledTimes(1);
  });

  it('does not call advance when isPlaying=false', () => {
    const advance = jest.fn().mockReturnValue('advanced');
    mockUseSiddurStore.mockImplementation((selector: any) =>
      selector({ isPlaying: false, speed: 1, advance }),
    );

    TestRenderer.act(() => {
      TestRenderer.create(React.createElement(TestComponent));
    });

    TestRenderer.act(() => {
      jest.advanceTimersByTime(50 + 100 * 5);
    });

    expect(advance).not.toHaveBeenCalled();
  });
});
