import { BundledPrayerText } from '../shacharit';

const bundled: Record<string, BundledPrayerText> = {
  maariv_vehu_rachum: require('./maariv_vehu_rachum.json'),
  maariv_shema: require('./maariv_shema.json'),
  maariv_amidah: require('./maariv_amidah.json'),
  maariv_aleinu: require('./maariv_aleinu.json'),
};

export function getBundledPrayerText(prayerId: string): BundledPrayerText | undefined {
  return bundled[prayerId];
}
