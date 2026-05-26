import type {
  CardId,
  SiddurCard,
  SectionRef,
  SiddurSection,
  SiddurBlock,
  PrayerBlock,
  HebrewLine,
  EnglishParagraph,
  EnglishSpan,
  TranslitLine,
  HeadingBlock,
  RubricBlock,
  FaqBlock,
  MinyanOnlyBlock,
  LearnCrossLinkBlock,
  VariantBlock,
  OmerCountBlock,
  ConditionalRule,
  ConditionalTag,
  SpecialDay,
  HebrewDateRef,
  HebrewMonth,
  LearnEssay,
} from '../types';

test('CardId union covers six cards', () => {
  const ids: CardId[] = ['shacharit', 'birkat_hamazon', 'mincha', 'maariv', 'tefillos', 'learn'];
  expect(ids).toHaveLength(6);
});

test('PrayerBlock requires wordIndex range and Hebrew lines', () => {
  const block: PrayerBlock = {
    kind: 'prayer',
    he: [{ lineIndex: 0, words: [{ globalIndex: 0, text: 'בָּרוּךְ' }] }],
    en: [{ spans: [{ text: 'Blessed' }] }],
    wordIndexStart: 0,
    wordIndexEnd: 0,
  };
  expect(block.kind).toBe('prayer');
});

test('EnglishSpan supports italic style for Feigenbaum interpretive additions', () => {
  const span: EnglishSpan = { text: 'wherever they are', style: 'italic' };
  expect(span.style).toBe('italic');
});

test('VariantBlock has primaryVariantIndex for MVP karaoke targeting', () => {
  const block: VariantBlock = {
    kind: 'variant',
    primaryVariantIndex: 0,
    variants: [{
      label: 'Winter',
      rule: { type: 'amidah_winter' },
    }],
  };
  expect(block.primaryVariantIndex).toBe(0);
});

test('LearnEssay carries essayKind discriminator', () => {
  const essay: LearnEssay = {
    id: 'appendix_01',
    essayKind: 'appendix',
    title: { en: 'How Davening Works' },
    source: 'feigenbaum',
    sourcePages: [242, 246],
    body: [],
    anchoredFrom: [],
  };
  expect(essay.essayKind).toBe('appendix');
});
