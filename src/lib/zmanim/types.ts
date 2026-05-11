/**
 * Provider-agnostic zmanim types. ZmanimHeader and useZmanim depend only on
 * these shapes — swapping implementations (e.g., @hebcal/core → KosherZmanim)
 * is a single-file change in this module, not a refactor across the app.
 */

export interface ZmanimQuery {
  latitude: number;
  longitude: number;
  date: Date;
}

export interface DayZmanim {
  /** Halachic sunrise (netz hachama). */
  sunrise: Date;
  /** End of time for Shema (Magen Avraham). */
  sofZmanShemaMGA: Date;
  /** End of time for Shema (Vilna Gaon). */
  sofZmanShemaGRA: Date;
  /** End of time for Shacharit / morning tefilla (Vilna Gaon). */
  sofZmanTfillaGRA: Date;
  /** Solar midday — earliest mincha gedola anchor. */
  chatzot: Date;
  /** Earliest time for Mincha (Mincha Gedola). */
  minchaGedola: Date;
  /** Halachic sunset. */
  sunset: Date;
}

export interface ZmanimProvider {
  /** Compute the day's zmanim for a given location + date. Synchronous. */
  compute(query: ZmanimQuery): DayZmanim;
}
