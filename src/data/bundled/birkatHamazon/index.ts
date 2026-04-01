import { BundledPrayerText } from '../shacharit';

const bundled: Record<string, BundledPrayerText> = {
  bh_zimmun: require('./bh_zimmun.json'),
  bh_hazan: require('./bh_hazan.json'),
  bh_haaretz: require('./bh_haaretz.json'),
  bh_yerushalayim: require('./bh_yerushalayim.json'),
  bh_hatov: require('./bh_hatov.json'),
};

export function getBundledPrayerText(prayerId: string): BundledPrayerText | undefined {
  return bundled[prayerId];
}
