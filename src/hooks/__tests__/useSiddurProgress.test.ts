// Hook test for useSiddurProgress.
// This project lacks @testing-library/react-native's renderHook, so we invoke
// the hook inside a thin test component rendered with react-test-renderer.

import React from 'react';
// @ts-expect-error — react-test-renderer ships without types in this project.
import TestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSiddurProgress } from '../useSiddurProgress';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

type HookApi = ReturnType<typeof useSiddurProgress>;

function HookHarness({ apiRef }: { apiRef: { current: HookApi | null } }) {
  const api = useSiddurProgress();
  apiRef.current = api;
  return null;
}

function mountHook(): { current: HookApi | null } {
  const apiRef: { current: HookApi | null } = { current: null };
  TestRenderer.act(() => {
    TestRenderer.create(React.createElement(HookHarness, { apiRef }));
  });
  return apiRef;
}

beforeEach(() => {
  jest.useFakeTimers();
  (AsyncStorage.getItem as jest.Mock).mockReset().mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

test('initial state has no progress for any card', async () => {
  const apiRef = mountHook();
  await TestRenderer.act(async () => {
    await apiRef.current!.hydrate();
  });
  expect(apiRef.current!.getProgress('shacharit')).toBeNull();
  expect(apiRef.current!.getProgress('mincha')).toBeNull();
});

test('record() persists card+section+wordIndex to storage', async () => {
  const apiRef = mountHook();
  await TestRenderer.act(async () => {
    await apiRef.current!.hydrate();
  });

  TestRenderer.act(() => {
    apiRef.current!.record('shacharit', 'pesukei_dzimrah', 42);
  });

  // Synchronous update should be available immediately.
  expect(apiRef.current!.getProgress('shacharit')).toEqual({
    sectionId: 'pesukei_dzimrah',
    wordIndex: 42,
  });

  // setItem should NOT be called yet — it's debounced.
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();

  // Advance past the debounce window.
  await TestRenderer.act(async () => {
    jest.advanceTimersByTime(600);
  });

  expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
  const [key, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
  expect(key).toBe('@siddur_progress');
  expect(JSON.parse(value)).toEqual({
    shacharit: { sectionId: 'pesukei_dzimrah', wordIndex: 42 },
  });
});

test('hydrate() restores per-card progress from storage', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
    JSON.stringify({ shacharit: { sectionId: 'shema', wordIndex: 17 } }),
  );

  const apiRef = mountHook();
  await TestRenderer.act(async () => {
    await apiRef.current!.hydrate();
  });

  expect(apiRef.current!.getProgress('shacharit')).toEqual({
    sectionId: 'shema',
    wordIndex: 17,
  });
  expect(apiRef.current!.getProgress('mincha')).toBeNull();
});
