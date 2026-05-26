// src/data/siddur/cards.ts
import type { SiddurCard, CardId } from '../../siddur/types';

export const CARDS: ReadonlyArray<SiddurCard> = [
  {
    id: 'shacharit',
    title: { he: 'שַׁחֲרִית', en: 'Shacharit' },
    kind: 'karaoke',
    sections: [],
  },
  {
    id: 'birkat_hamazon',
    title: { he: 'בִּרְכַּת הַמָּזוֹן', en: 'Birkat Hamazon' },
    kind: 'karaoke',
    sections: [],
  },
  {
    id: 'mincha',
    title: { he: 'מִנְחָה', en: 'Mincha' },
    kind: 'karaoke',
    sections: [],
  },
  {
    id: 'maariv',
    title: { he: 'מַעֲרִיב', en: 'Maariv' },
    kind: 'karaoke',
    sections: [],
  },
  {
    id: 'tefillos',
    title: { he: 'תְּפִילּוֹת וּבְרָכוֹת', en: 'Tefillos' },
    kind: 'karaoke',
    sections: [],
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
