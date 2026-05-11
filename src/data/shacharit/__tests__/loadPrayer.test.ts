import { loadBundledPrayer } from '../loadPrayer';
import { SHACHARIT_STRUCTURE } from '../structure';

// Prayers where canonical Hebrew is intentionally pending (Feigenbaum English
// commentary is wired up but the Hebrew text awaits an editorial sourcing pass).
const HEBREW_PENDING = new Set<string>(['pitum_haketores', 'shesh_zechiros']);

describe('loadBundledPrayer', () => {
  it('returns non-empty text for every structure prayer', () => {
    const failures: string[] = [];
    SHACHARIT_STRUCTURE.forEach((sec) => {
      sec.prayerIds.forEach((id) => {
        const p = loadBundledPrayer(id);
        if (p.hebrewLines.length === 0 && !HEBREW_PENDING.has(id)) {
          failures.push(`${id}: empty hebrewLines`);
        }
        if (p.englishLines.length === 0) failures.push(`${id}: empty englishLines`);
        // translitLines may be legitimately empty for some prayers
      });
    });
    expect(failures).toEqual([]);
  });

  it('flags pending-Hebrew prayers as such (so they show up in editorial QA)', () => {
    for (const id of HEBREW_PENDING) {
      const p = loadBundledPrayer(id);
      expect(p.hebrewLines.length).toBe(0);
      expect(p.englishLines.length).toBeGreaterThan(0);
    }
  });
});
