import { Prayer, Nusach } from '../types';
import { getShacharitPrayers } from './prayerOrders/shacharit';
import { getMinchaPrayers } from './prayerOrders/mincha';
import { getMaarivPrayers } from './prayerOrders/maariv';
import { getBirkatHamazonPrayers } from './prayerOrders/birkatHamazon';

export interface ServiceDefinition {
  id: string;
  name: { hebrew: string; english: string };
  nusach: Nusach;
  getPrayers: () => Prayer[];
  available: boolean;
}

const SERVICE_REGISTRY: ServiceDefinition[] = [
  {
    id: 'shacharit',
    name: { hebrew: 'שחרית', english: 'Shacharit (Morning)' },
    nusach: 'ashkenaz',
    getPrayers: getShacharitPrayers,
    available: true,
  },
  {
    id: 'mincha',
    name: { hebrew: 'מנחה', english: 'Mincha (Afternoon)' },
    nusach: 'ashkenaz',
    getPrayers: getMinchaPrayers,
    available: true,
  },
  {
    id: 'maariv',
    name: { hebrew: 'מעריב', english: "Ma'ariv (Evening)" },
    nusach: 'ashkenaz',
    getPrayers: getMaarivPrayers,
    available: true,
  },
  {
    id: 'birkat_hamazon',
    name: { hebrew: 'ברכת המזון', english: 'Birkat Hamazon' },
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
