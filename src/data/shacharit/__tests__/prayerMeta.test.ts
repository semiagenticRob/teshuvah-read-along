import { SHACHARIT_STRUCTURE } from '../structure';
import { PRAYER_META } from '../prayerMeta';

it('every structure prayer has metadata', () => {
  const missing: string[] = [];
  SHACHARIT_STRUCTURE.forEach(sec => {
    sec.prayerIds.forEach(id => {
      if (!PRAYER_META[id]) missing.push(id);
    });
  });
  expect(missing).toEqual([]);
});
