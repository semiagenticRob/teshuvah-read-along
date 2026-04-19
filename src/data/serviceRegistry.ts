import { Prayer, Nusach } from '../types';
import { getShacharitPrayers } from './prayerOrders/shacharit';
import { getMinchaPrayers } from './prayerOrders/mincha';
import { getMaarivPrayers } from './prayerOrders/maariv';
import { getBirkatHamazonPrayers } from './prayerOrders/birkatHamazon';

export interface ServiceDefinition {
  id: string;
  name: { hebrew: string; english: string };
  subtitle: string;
  eyebrow: string;
  nusach: Nusach;
  getPrayers: () => Prayer[];
  available: boolean;
}

const SERVICE_REGISTRY: ServiceDefinition[] = [
  {
    id: 'shacharit',
    name: { hebrew: 'שַׁחֲרִית', english: 'Shacharit' },
    subtitle: 'Morning prayer — the first words of the day',
    eyebrow: 'I · Morning',
    nusach: 'ashkenaz',
    getPrayers: getShacharitPrayers,
    available: true,
  },
  {
    id: 'mincha',
    name: { hebrew: 'מִנְחָה', english: 'Mincha' },
    subtitle: 'Afternoon prayer — a pause before the day turns',
    eyebrow: 'II · Afternoon',
    nusach: 'ashkenaz',
    getPrayers: getMinchaPrayers,
    available: true,
  },
  {
    id: 'maariv',
    name: { hebrew: 'מַעֲרִיב', english: "Ma'ariv" },
    subtitle: 'Evening prayer — nightfall and rest',
    eyebrow: 'III · Evening',
    nusach: 'ashkenaz',
    getPrayers: getMaarivPrayers,
    available: true,
  },
  {
    id: 'birkat_hamazon',
    name: { hebrew: 'בִּרְכַּת הַמָּזוֹן', english: 'Birkat Hamazon' },
    subtitle: 'Grace after meals — gratitude for sustenance',
    eyebrow: 'Blessing',
    nusach: 'ashkenaz',
    getPrayers: getBirkatHamazonPrayers,
    available: true,
  },
];

export function getService(serviceId: string): ServiceDefinition | undefined {
  return SERVICE_REGISTRY.find((s) => s.id === serviceId);
}

export function getAvailableServices(): ServiceDefinition[] {
  return SERVICE_REGISTRY;
}

export function getPrayersForService(serviceId: string): Prayer[] {
  const service = getService(serviceId);
  return service ? service.getPrayers() : [];
}
