/**
 * Shared bundled content dispatcher.
 * Routes getBundledPrayerText() calls to the correct per-service index.
 */

import { getBundledPrayerText as getShacharitText, BundledPrayerText } from './shacharit';
import { getBundledPrayerText as getMinchaText } from './mincha';
import { getBundledPrayerText as getMaarivText } from './maariv';
import { getBundledPrayerText as getBirkatHamazonText } from './birkatHamazon';

export type { BundledPrayerText, BundledFootnoteEntry } from './shacharit';

const SERVICE_BUNDLED: Record<string, (prayerId: string) => BundledPrayerText | undefined> = {
  shacharit: getShacharitText,
  mincha: getMinchaText,
  maariv: getMaarivText,
  birkat_hamazon: getBirkatHamazonText,
};

export function getBundledPrayerText(serviceId: string, prayerId: string): BundledPrayerText | undefined {
  const loader = SERVICE_BUNDLED[serviceId];
  return loader ? loader(prayerId) : undefined;
}
