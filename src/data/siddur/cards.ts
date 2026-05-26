// src/data/siddur/cards.ts
import type { SiddurCard, SectionRef, CardId } from '../../siddur/types';
import { SECTIONS as SHACHARIT } from './shacharit';
import { SECTIONS as BIRKAT_HAMAZON } from './birkat_hamazon';
import { SECTIONS as MINCHA } from './mincha';
import { SECTIONS as MAARIV } from './maariv';
import { SECTIONS as TEFILLOS } from './tefillos';

function refs(loaders: Record<string, () => any>): SectionRef[] {
  return Object.entries(loaders).map(([id, load]) => {
    const data = load();
    return { id, title: data.title, pagePdf: data.sourcePages[0] };
  });
}

export const CARDS: ReadonlyArray<SiddurCard> = [
  {
    id: 'shacharit',
    title: { he: 'שַׁחֲרִית', en: 'Shacharit' },
    kind: 'karaoke',
    sections: refs(SHACHARIT),
  },
  {
    id: 'birkat_hamazon',
    title: { he: 'בִּרְכַּת הַמָּזוֹן', en: 'Birkat Hamazon' },
    kind: 'karaoke',
    sections: refs(BIRKAT_HAMAZON),
  },
  {
    id: 'mincha',
    title: { he: 'מִנְחָה', en: 'Mincha' },
    kind: 'karaoke',
    sections: refs(MINCHA),
  },
  {
    id: 'maariv',
    title: { he: 'מַעֲרִיב', en: 'Maariv' },
    kind: 'karaoke',
    sections: refs(MAARIV),
  },
  {
    id: 'tefillos',
    title: { he: 'תְּפִילּוֹת וּבְרָכוֹת', en: 'Tefillos' },
    kind: 'karaoke',
    sections: refs(TEFILLOS),
  },
  {
    id: 'learn',
    title: { he: 'לִלְמֹד', en: 'Learn' },
    kind: 'reading',
    sections: [],
  },
];

const CARD_MAP: Record<CardId, SiddurCard> = Object.fromEntries(
  CARDS.map((c) => [c.id, c]),
) as Record<CardId, SiddurCard>;

export function getCard(id: CardId): SiddurCard {
  const card = CARD_MAP[id];
  if (!card) throw new Error(`Unknown card id: ${id}`);
  return card;
}

export function getCardIds(): CardId[] {
  return CARDS.map((c) => c.id);
}
