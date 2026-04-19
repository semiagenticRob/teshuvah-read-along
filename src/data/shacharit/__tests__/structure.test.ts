import { SHACHARIT_STRUCTURE } from '../structure';
import fs from 'fs';
import path from 'path';

describe('SHACHARIT_STRUCTURE', () => {
  it('every prayer id maps to a bundled prayer file', () => {
    const bundled = fs.readdirSync(
      path.join(__dirname, '../../bundled/shacharit'),
    );
    const bundledIds = new Set(
      bundled
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace(/\.json$/, '')),
    );
    const missing: string[] = [];
    SHACHARIT_STRUCTURE.forEach(sec => {
      sec.prayerIds.forEach(id => {
        if (!bundledIds.has(id)) missing.push(`${sec.id}/${id}`);
      });
    });
    expect(missing).toEqual([]);
  });
});
