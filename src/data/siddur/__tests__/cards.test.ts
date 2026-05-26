import { CARDS, getCard, getCardIds } from '../cards';

test('exposes six cards in print order', () => {
  expect(getCardIds()).toEqual([
    'shacharit', 'birkat_hamazon', 'mincha', 'maariv', 'tefillos', 'learn',
  ]);
});

test('first five cards are karaoke, learn is reading', () => {
  expect(getCard('shacharit').kind).toBe('karaoke');
  expect(getCard('birkat_hamazon').kind).toBe('karaoke');
  expect(getCard('mincha').kind).toBe('karaoke');
  expect(getCard('maariv').kind).toBe('karaoke');
  expect(getCard('tefillos').kind).toBe('karaoke');
  expect(getCard('learn').kind).toBe('reading');
});

test('each card has a Hebrew and English title', () => {
  CARDS.forEach((card) => {
    expect(card.title.he.length).toBeGreaterThan(0);
    expect(card.title.en.length).toBeGreaterThan(0);
  });
});

test('every card starts with an empty sections array (filled by Plan B)', () => {
  CARDS.forEach((card) => {
    expect(card.sections).toEqual([]);
  });
});

test('getCard throws on unknown id', () => {
  // @ts-expect-error testing runtime guard
  expect(() => getCard('bogus')).toThrow();
});
