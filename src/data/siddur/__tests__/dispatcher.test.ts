import { getSiddurSection } from '../index';

test('hashkamas_haboker loads as a valid SiddurSection', () => {
  const section = getSiddurSection('shacharit', 'hashkamas_haboker');
  expect(section).not.toBeNull();
  expect(section!.id).toBe('hashkamas_haboker');
  expect(section!.cardId).toBe('shacharit');
  expect(section!.blocks.length).toBeGreaterThan(0);
});

test('unknown card returns null', () => {
  expect(getSiddurSection('shacharit', 'nonexistent')).toBeNull();
});

test('hashkamas_haboker has at least one PrayerBlock with contiguous word indices', () => {
  const section = getSiddurSection('shacharit', 'hashkamas_haboker')!;
  const prayers = section.blocks.filter((b) => b.kind === 'prayer');
  expect(prayers.length).toBeGreaterThan(0);
  const first = prayers[0] as Extract<typeof prayers[number], { kind: 'prayer' }>;
  expect(first.wordIndexStart).toBe(0);
  expect(first.wordIndexEnd).toBeGreaterThanOrEqual(first.wordIndexStart);
});
