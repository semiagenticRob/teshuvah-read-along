import { GeoLocation, Zmanim } from '@hebcal/core';
import { DayZmanim, ZmanimProvider, ZmanimQuery } from './types';

/**
 * @hebcal/core-backed ZmanimProvider.
 * Synchronous, no network. Resolves timezone from the device via Intl.
 */
export class HebcalZmanimProvider implements ZmanimProvider {
  compute({ latitude, longitude, date }: ZmanimQuery): DayZmanim {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const geo = new GeoLocation('user', latitude, longitude, 0, timezone);
    const z = new Zmanim(geo, date, false);

    return {
      sunrise: z.sunrise(),
      sofZmanShemaMGA: z.sofZmanShmaMGA(),
      sofZmanShemaGRA: z.sofZmanShma(),
      sofZmanTfillaGRA: z.sofZmanTfilla(),
      chatzot: z.chatzot(),
      minchaGedola: z.minchaGedola(),
      sunset: z.sunset(),
    };
  }
}
