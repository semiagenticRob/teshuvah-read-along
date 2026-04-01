import { BundledPrayerText } from '../shacharit';

const bundled: Record<string, BundledPrayerText> = {
  mincha_ashrei: require('./mincha_ashrei.json'),
  mincha_amidah: require('./mincha_amidah.json'),
  mincha_tachanun: require('./mincha_tachanun.json'),
  mincha_aleinu: require('./mincha_aleinu.json'),
};

export function getBundledPrayerText(prayerId: string): BundledPrayerText | undefined {
  return bundled[prayerId];
}
