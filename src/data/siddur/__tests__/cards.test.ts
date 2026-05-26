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

test('karaoke cards have non-empty sections arrays derived from bundled content', () => {
  const karaoke = CARDS.filter((c) => c.kind === 'karaoke');
  karaoke.forEach((card) => {
    expect(card.sections.length).toBeGreaterThan(0);
  });
  // learn card has no sections (essays are accessed separately)
  expect(getCard('learn').sections).toEqual([]);
});

test('each section ref has id, bilingual title, and pagePdf', () => {
  CARDS.forEach((card) => {
    card.sections.forEach((section) => {
      expect(typeof section.id).toBe('string');
      expect(section.id.length).toBeGreaterThan(0);
      expect(typeof section.title.he).toBe('string');
      expect(typeof section.title.en).toBe('string');
      expect(typeof section.pagePdf).toBe('number');
      expect(section.pagePdf).toBeGreaterThan(0);
    });
  });
});

test('getCard throws on unknown id', () => {
  // @ts-expect-error testing runtime guard
  expect(() => getCard('bogus')).toThrow();
});
