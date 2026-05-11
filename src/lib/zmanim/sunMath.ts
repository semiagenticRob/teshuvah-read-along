/**
 * Solar position calculations using the NOAA algorithm.
 * Reference: https://gml.noaa.gov/grad/solcalc/calcdetails.html
 *
 * Pure math, no dependencies. Bundles cleanly in Hermes (replaces the
 * @hebcal/core dependency which used top-level await in its transitive
 * @hebcal/noaa dep and crashed Hermes at JS compile time).
 */

const RAD = Math.PI / 180;

function toJulian(date: Date): number {
  return date.getTime() / 86_400_000 + 2_440_587.5;
}

interface SolarParams {
  /** Solar declination in radians. */
  decl: number;
  /** Equation of time in minutes. */
  eqTime: number;
}

function solarParams(date: Date): SolarParams {
  const J = toJulian(date);
  const T = (J - 2_451_545) / 36_525;

  const L0 = (280.46646 + T * (36_000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35_999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);

  const C =
    Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * M * RAD) * 0.000289;

  const trueLong = L0 + C;
  const omega = 125.04 - 1_934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);

  const epsilon0 =
    23.43929111 - T * (46.815 + T * (0.00059 - T * 0.001813)) / 3600;
  const epsilon = epsilon0 + 0.00256 * Math.cos(omega * RAD);

  const decl = Math.asin(Math.sin(epsilon * RAD) * Math.sin(lambda * RAD));

  const y = Math.tan((epsilon / 2) * RAD) ** 2;
  const eqTime =
    (4 / RAD) *
    (y * Math.sin(2 * L0 * RAD) -
      2 * e * Math.sin(M * RAD) +
      4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
      0.5 * y * y * Math.sin(4 * L0 * RAD) -
      1.25 * e * e * Math.sin(2 * M * RAD));

  return { decl, eqTime };
}

/** Hour angle in degrees for a given zenith angle. */
function hourAngle(latDeg: number, declRad: number, zenithDeg: number): number {
  const cosH =
    (Math.cos(zenithDeg * RAD) -
      Math.sin(latDeg * RAD) * Math.sin(declRad)) /
    (Math.cos(latDeg * RAD) * Math.cos(declRad));
  // Clamp for polar latitudes where the sun never rises/sets.
  const clamped = Math.max(-1, Math.min(1, cosH));
  return Math.acos(clamped) / RAD;
}

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  /** Solar noon (chatzot). */
  chatzot: Date;
}

/**
 * Sunrise / sunset / chatzot for the given date (anchored at UTC midnight of
 * that date) at the given latitude/longitude.
 *
 * Standard zenith of 90.833° accounts for atmospheric refraction at the
 * horizon plus the sun's apparent radius — matches the "halachic sunrise"
 * (netz hachama) used by GRA opinion.
 */
export function sunTimes(date: Date, latitude: number, longitude: number): SunTimes {
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);

  // Anchor at solar noon UTC for declination/eqTime calc.
  const noonAnchor = new Date(dayStart.getTime() + 12 * 3_600_000);
  const { decl, eqTime } = solarParams(noonAnchor);

  const zenith = 90 + 50 / 60; // 90°50' — geometric horizon + refraction
  const ha = hourAngle(latitude, decl, zenith);

  const solarNoonUTC = 720 - 4 * longitude - eqTime; // minutes after UTC midnight
  const sunriseUTC = solarNoonUTC - 4 * ha;
  const sunsetUTC = solarNoonUTC + 4 * ha;

  return {
    sunrise: new Date(dayStart.getTime() + sunriseUTC * 60_000),
    sunset: new Date(dayStart.getTime() + sunsetUTC * 60_000),
    chatzot: new Date(dayStart.getTime() + solarNoonUTC * 60_000),
  };
}
