import { getSiddurSection, listSectionIds } from '../index';
import type { CardId, PrayerBlock, MinyanOnlyBlock, SiddurBlock } from '../../../siddur/types';

const ALL_CARDS: CardId[] = ['shacharit', 'birkat_hamazon', 'mincha', 'maariv', 'tefillos', 'learn'];

function eachSection(cb: (cardId: CardId, sectionId: string) => void) {
  for (const cardId of ALL_CARDS) {
    for (const sectionId of listSectionIds(cardId)) {
      cb(cardId, sectionId);
    }
  }
}

describe('section invariants', () => {
  test('word-index continuity: contiguous from 0, strictly increasing, no duplicates', () => {
    eachSection((cardId, sectionId) => {
      const section = getSiddurSection(cardId, sectionId)!;
      const prayerBlocks = section.blocks.filter(
        (b): b is PrayerBlock => b.kind === 'prayer',
      );
      let expected = 0;
      for (const block of prayerBlocks) {
        expect(block.wordIndexStart).toBe(expected);
        for (const line of block.he) {
          for (const word of line.words) {
            expect(word.globalIndex).toBe(expected);
            expected += 1;
          }
        }
        expect(block.wordIndexEnd).toBe(expected - 1);
      }
    });
  });

  test('minyan-only words have globalIndex < 0 (excluded from karaoke sequence)', () => {
    eachSection((cardId, sectionId) => {
      const section = getSiddurSection(cardId, sectionId)!;
      const minyanBlocks = section.blocks.filter(
        (b): b is MinyanOnlyBlock => b.kind === 'minyan_only',
      );
      for (const block of minyanBlocks) {
        for (const line of block.he) {
          for (const word of line.words) {
            expect(word.globalIndex).toBeLessThan(0);
          }
        }
      }
    });
  });

  test('translit lines align 1:1 with Hebrew lines when present', () => {
    eachSection((cardId, sectionId) => {
      const section = getSiddurSection(cardId, sectionId)!;
      section.blocks.forEach((block: SiddurBlock) => {
        if (block.kind !== 'prayer') return;
        if (!block.translit) return;
        block.translit.forEach((tLine, i) => {
          const hLine = block.he[i];
          expect(tLine.words.length).toBe(hLine.words.length);
        });
      });
    });
  });

  test('sourcePages: start <= end, both within 1..296', () => {
    eachSection((cardId, sectionId) => {
      const section = getSiddurSection(cardId, sectionId)!;
      const [start, end] = section.sourcePages;
      expect(start).toBeGreaterThanOrEqual(1);
      expect(end).toBeLessThanOrEqual(296);
      expect(start).toBeLessThanOrEqual(end);
    });
  });

  test('conditional tag references point to real blocks', () => {
    eachSection((cardId, sectionId) => {
      const section = getSiddurSection(cardId, sectionId)!;
      (section.conditionalTags ?? []).forEach((tag) => {
        expect(tag.blockIndex).toBeGreaterThanOrEqual(0);
        expect(tag.blockIndex).toBeLessThan(section.blocks.length);
      });
    });
  });
});
