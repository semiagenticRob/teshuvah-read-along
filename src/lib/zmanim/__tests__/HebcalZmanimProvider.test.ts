// Mock @hebcal/core because its transitive dep @hebcal/noaa uses top-level await
// which Jest cannot load. The mock returns deterministic Date values so the
// provider's method→field mapping is testable without the real library.
jest.mock('@hebcal/core', () => {
  const fixedTimes = {
    sunrise:           new Date('2026-05-11T10:30:00Z'),
    sofZmanShmaMGA:    new Date('2026-05-11T12:00:00Z'),
    sofZmanShma:       new Date('2026-05-11T12:30:00Z'),
    sofZmanTfilla:     new Date('2026-05-11T13:30:00Z'),
    chatzot:           new Date('2026-05-11T16:00:00Z'),
    minchaGedola:      new Date('2026-05-11T16:30:00Z'),
    sunset:            new Date('2026-05-11T23:30:00Z'),
  };
  class Zmanim {
    constructor(_geo: unknown, _date: Date, _useElevation: boolean) {}
    sunrise() { return fixedTimes.sunrise; }
    sofZmanShmaMGA() { return fixedTimes.sofZmanShmaMGA; }
    sofZmanShma() { return fixedTimes.sofZmanShma; }
    sofZmanTfilla() { return fixedTimes.sofZmanTfilla; }
    chatzot() { return fixedTimes.chatzot; }
    minchaGedola() { return fixedTimes.minchaGedola; }
    sunset() { return fixedTimes.sunset; }
  }
  class GeoLocation {
    constructor(
      _name: string,
      _lat: number,
      _lon: number,
      _elevation: number,
      _tz: string,
    ) {}
  }
  return { Zmanim, GeoLocation };
});

import { HebcalZmanimProvider } from '../HebcalZmanimProvider';

describe('HebcalZmanimProvider', () => {
  const provider = new HebcalZmanimProvider();

  it('maps Zmanim methods to the DayZmanim shape', () => {
    const zmanim = provider.compute({
      latitude: 40.7128,
      longitude: -74.006,
      date: new Date('2026-05-11T12:00:00Z'),
    });

    expect(zmanim.sunrise.toISOString()).toBe('2026-05-11T10:30:00.000Z');
    expect(zmanim.sofZmanShemaMGA.toISOString()).toBe('2026-05-11T12:00:00.000Z');
    expect(zmanim.sofZmanShemaGRA.toISOString()).toBe('2026-05-11T12:30:00.000Z');
    expect(zmanim.sofZmanTfillaGRA.toISOString()).toBe('2026-05-11T13:30:00.000Z');
    expect(zmanim.chatzot.toISOString()).toBe('2026-05-11T16:00:00.000Z');
    expect(zmanim.minchaGedola.toISOString()).toBe('2026-05-11T16:30:00.000Z');
    expect(zmanim.sunset.toISOString()).toBe('2026-05-11T23:30:00.000Z');
  });

  it('preserves halachic ordering of zmanim across the day', () => {
    const zmanim = provider.compute({
      latitude: 31.78,
      longitude: 35.22,
      date: new Date('2026-05-11T12:00:00Z'),
    });
    expect(zmanim.sunrise.getTime()).toBeLessThan(zmanim.sofZmanShemaMGA.getTime());
    expect(zmanim.sofZmanShemaMGA.getTime()).toBeLessThan(zmanim.sofZmanShemaGRA.getTime());
    expect(zmanim.sofZmanShemaGRA.getTime()).toBeLessThan(zmanim.sofZmanTfillaGRA.getTime());
    expect(zmanim.sofZmanTfillaGRA.getTime()).toBeLessThan(zmanim.chatzot.getTime());
    expect(zmanim.chatzot.getTime()).toBeLessThan(zmanim.minchaGedola.getTime());
    expect(zmanim.minchaGedola.getTime()).toBeLessThan(zmanim.sunset.getTime());
  });
});
