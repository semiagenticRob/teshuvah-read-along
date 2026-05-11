import { sunTimes } from './sunMath';
import { DayZmanim, ZmanimProvider, ZmanimQuery } from './types';

/**
 * In-process zmanim provider. Computes everything from sun position math
 * (see ./sunMath.ts). No external dependencies, Hermes-safe.
 *
 * Halachic conventions:
 *   - GRA opinion: halachic day = sunrise → sunset, hour = day / 12.
 *     - Sof zman shema = sunrise + 3 halachic hours.
 *     - Sof zman tfilla = sunrise + 4 halachic hours.
 *     - Mincha gedola = chatzot + 0.5 halachic hours.
 *   - MGA opinion (approximated): day extended by 72 minutes on each end
 *     (alot 72 minutes before sunrise; tzeis 72 minutes after sunset).
 *     Halachic hour proportionally longer.
 *     - Sof zman shema MGA = alot + 3 (MGA) halachic hours.
 */
export class LocalZmanimProvider implements ZmanimProvider {
  compute({ latitude, longitude, date }: ZmanimQuery): DayZmanim {
    const { sunrise, sunset, chatzot } = sunTimes(date, latitude, longitude);

    const dayMs = sunset.getTime() - sunrise.getTime();
    const hourGRA = dayMs / 12;

    // MGA day: 72 minutes earlier start, 72 minutes later end.
    const MGA_OFFSET_MS = 72 * 60_000;
    const alotMGA = new Date(sunrise.getTime() - MGA_OFFSET_MS);
    const tzeisMGA = new Date(sunset.getTime() + MGA_OFFSET_MS);
    const hourMGA = (tzeisMGA.getTime() - alotMGA.getTime()) / 12;

    return {
      sunrise,
      sofZmanShemaMGA: new Date(alotMGA.getTime() + 3 * hourMGA),
      sofZmanShemaGRA: new Date(sunrise.getTime() + 3 * hourGRA),
      sofZmanTfillaGRA: new Date(sunrise.getTime() + 4 * hourGRA),
      chatzot,
      minchaGedola: new Date(chatzot.getTime() + hourGRA * 0.5),
      sunset,
    };
  }
}
