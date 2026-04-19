import { loadBundledPrayer } from '../loadPrayer';
import { SHACHARIT_STRUCTURE } from '../structure';

describe('loadBundledPrayer', () => {
  it('returns non-empty text for every structure prayer', () => {
    const failures: string[] = [];
    SHACHARIT_STRUCTURE.forEach(sec => {
      sec.prayerIds.forEach(id => {
        const p = loadBundledPrayer(id);
        if (!p.hebrewText) failures.push(`${id}: empty hebrewText`);
        if (!p.englishText) failures.push(`${id}: empty englishText`);
        // translitText may be legitimately empty for some prayers
      });
    });
    expect(failures).toEqual([]);
  });
});
