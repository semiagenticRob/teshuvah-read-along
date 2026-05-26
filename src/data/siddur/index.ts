// src/data/siddur/index.ts
import type { CardId, SiddurSection } from '../../siddur/types';

type SectionLoader = () => SiddurSection;
type CardRegistry = Record<string, SectionLoader>;

// Lazy require thunks — Metro needs static require() paths, but the
// require() itself is deferred until first access to avoid eagerly
// parsing every section's JSON at startup.
const REGISTRY: Record<CardId, CardRegistry> = {
  shacharit: {
    seed: () => require('./fixtures/seed.json') as SiddurSection,
  },
  birkat_hamazon: {},
  mincha: {},
  maariv: {},
  tefillos: {},
  learn: {},
};

export function getSiddurSection(cardId: CardId, sectionId: string): SiddurSection | null {
  const loader = REGISTRY[cardId]?.[sectionId];
  if (!loader) return null;
  return loader();
}

export function listSectionIds(cardId: CardId): string[] {
  return Object.keys(REGISTRY[cardId] ?? {});
}
