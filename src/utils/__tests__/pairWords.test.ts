import { pairWords } from '../pairWords';

it('pairs equal-length lists one-to-one', () => {
  expect(pairWords('שְׁמַע יִשְׂרָאֵל', 'Shema Yisrael'))
    .toEqual([
      { hebrew: 'שְׁמַע',    translit: 'Shema' },
      { hebrew: 'יִשְׂרָאֵל', translit: 'Yisrael' },
    ]);
});

it('pads the shorter list with null', () => {
  expect(pairWords('א ב ג', 'one two'))
    .toEqual([
      { hebrew: 'א', translit: 'one' },
      { hebrew: 'ב', translit: 'two' },
      { hebrew: 'ג', translit: null },
    ]);
});

it('preserves punctuation attached to words', () => {
  expect(pairWords('ה׳ אֶחָד.', 'Adonai Echad.'))
    .toEqual([
      { hebrew: 'ה׳',    translit: 'Adonai' },
      { hebrew: 'אֶחָד.', translit: 'Echad.' },
    ]);
});
