import { useSiddurStore } from '../siddurStore';

beforeEach(() => {
  useSiddurStore.getState().reset();
});

test('initial state has no active section, no active word', () => {
  const s = useSiddurStore.getState();
  expect(s.activeCardId).toBeNull();
  expect(s.activeSectionId).toBeNull();
  expect(s.activeWordIndex).toBeNull();
  expect(s.isPlaying).toBe(false);
});

test('setActiveSection seeds activeWordIndex to null', () => {
  useSiddurStore.getState().setActiveSection('shacharit', 'seed', [
    { sectionId: 'seed', start: 0, end: 2 },
  ]);
  const s = useSiddurStore.getState();
  expect(s.activeCardId).toBe('shacharit');
  expect(s.activeSectionId).toBe('seed');
  expect(s.activeWordIndex).toBeNull();
});

test('setActiveWord updates the current word', () => {
  const store = useSiddurStore.getState();
  store.setActiveSection('shacharit', 'seed', [{ sectionId: 'seed', start: 0, end: 2 }]);
  store.setActiveWord(1);
  expect(useSiddurStore.getState().activeWordIndex).toBe(1);
});

describe('advance', () => {
  beforeEach(() => {
    const store = useSiddurStore.getState();
    store.setActiveSection('shacharit', 'seed', [
      { sectionId: 'first',  start: 0, end: 2 },
      { sectionId: 'second', start: 3, end: 4 },
    ]);
  });

  test('advance from null sets to first word of first section', () => {
    const result = useSiddurStore.getState().advance();
    expect(result).toBe('advanced');
    expect(useSiddurStore.getState().activeWordIndex).toBe(0);
  });

  test('advance within a section increments by 1', () => {
    useSiddurStore.getState().setActiveWord(0);
    expect(useSiddurStore.getState().advance()).toBe('advanced');
    expect(useSiddurStore.getState().activeWordIndex).toBe(1);
  });

  test('advance at last word of a section returns section-boundary, pauses playback', () => {
    useSiddurStore.getState().setActiveWord(2);
    useSiddurStore.getState().setIsPlaying(true);
    expect(useSiddurStore.getState().advance()).toBe('section-boundary');
    expect(useSiddurStore.getState().isPlaying).toBe(false);
  });

  test('jumpToNextSection moves to start of next section', () => {
    useSiddurStore.getState().setActiveWord(2);
    useSiddurStore.getState().jumpToNextSection();
    expect(useSiddurStore.getState().activeWordIndex).toBe(3);
    expect(useSiddurStore.getState().activeSectionId).toBe('second');
  });

  test('advance past last word of last section returns end', () => {
    useSiddurStore.getState().setActiveWord(4);
    expect(useSiddurStore.getState().advance()).toBe('end');
  });
});

test('reset clears all state', () => {
  const store = useSiddurStore.getState();
  store.setActiveSection('shacharit', 'seed', [{ sectionId: 'seed', start: 0, end: 2 }]);
  store.setActiveWord(1);
  store.setIsPlaying(true);
  store.reset();
  const s = useSiddurStore.getState();
  expect(s.activeCardId).toBeNull();
  expect(s.activeSectionId).toBeNull();
  expect(s.activeWordIndex).toBeNull();
  expect(s.isPlaying).toBe(false);
});
