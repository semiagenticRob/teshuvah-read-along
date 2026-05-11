import { LocalZmanimProvider } from '../LocalZmanimProvider';

describe('LocalZmanimProvider', () => {
  const provider = new LocalZmanimProvider();

  it('preserves halachic ordering of zmanim across the day', () => {
    const zmanim = provider.compute({
      latitude: 40.7128,
      longitude: -74.006,
      date: new Date('2026-05-11T12:00:00Z'),
    });
    expect(zmanim.sunrise.getTime()).toBeLessThan(zmanim.sofZmanShemaMGA.getTime());
    expect(zmanim.sofZmanShemaMGA.getTime()).toBeLessThan(zmanim.sofZmanShemaGRA.getTime());
    expect(zmanim.sofZmanShemaGRA.getTime()).toBeLessThan(zmanim.sofZmanTfillaGRA.getTime());
    expect(zmanim.sofZmanTfillaGRA.getTime()).toBeLessThan(zmanim.chatzot.getTime());
    expect(zmanim.chatzot.getTime()).toBeLessThan(zmanim.minchaGedola.getTime());
    expect(zmanim.minchaGedola.getTime()).toBeLessThan(zmanim.sunset.getTime());
  });

  it('computes sunrise within a reasonable window for known location/date', () => {
    // NYC on May 11, 2026 — sunrise is around 5:46 AM EDT (= 09:46 UTC)
    const zmanim = provider.compute({
      latitude: 40.7128,
      longitude: -74.006,
      date: new Date('2026-05-11T12:00:00Z'),
    });
    const sunriseHourUTC = zmanim.sunrise.getUTCHours();
    expect(sunriseHourUTC).toBeGreaterThanOrEqual(9);
    expect(sunriseHourUTC).toBeLessThanOrEqual(10);
  });

  it('produces different times for different latitudes on the same date', () => {
    const date = new Date('2026-05-11T12:00:00Z');
    const ny = provider.compute({ latitude: 40.7128, longitude: -74.006, date });
    const jerusalem = provider.compute({ latitude: 31.78, longitude: 35.22, date });
    // Jerusalem is ~7 hours east of NY, so its sunrise is many hours earlier in UTC.
    expect(jerusalem.sunrise.getTime()).toBeLessThan(ny.sunrise.getTime());
  });

  it('chatzot falls between sunrise and sunset for non-polar latitudes', () => {
    const zmanim = provider.compute({
      latitude: 31.78,
      longitude: 35.22,
      date: new Date('2026-05-11T12:00:00Z'),
    });
    expect(zmanim.chatzot.getTime()).toBeGreaterThan(zmanim.sunrise.getTime());
    expect(zmanim.chatzot.getTime()).toBeLessThan(zmanim.sunset.getTime());
  });
});
