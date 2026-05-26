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

test('SiddurBlock switch is exhaustive over all 8 block kinds', () => {
  // If a new variant is added or one removed without updating this switch,
  // TypeScript will error at the `_exhaustive: never` line.
  function assertExhaustive(block: SiddurBlock): string {
    switch (block.kind) {
      case 'prayer':          return 'prayer';
      case 'heading':         return 'heading';
      case 'subsection':      return 'subsection';
      case 'rubric':          return 'rubric';
      case 'faq':             return 'faq';
      case 'callout':         return 'callout';
      case 'instant_insight': return 'instant_insight';
      case 'minyan_only':     return 'minyan_only';
      case 'learn_link':      return 'learn_link';
      case 'variant':         return 'variant';
      case 'omer_count':      return 'omer_count';
      default: {
        const _exhaustive: never = block;
        return _exhaustive;
      }
    }
  }
  const sample: SiddurBlock = { kind: 'prayer', he: [], en: [], wordIndexStart: 0, wordIndexEnd: -1 };
  expect(assertExhaustive(sample)).toBe('prayer');
});

test('ConditionalRule switch is exhaustive over all 15 rule types', () => {
  function assertExhaustive(rule: ConditionalRule): string {
    switch (rule.type) {
      case 'skip_on':              return 'skip_on';
      case 'rosh_chodesh_only':    return 'rosh_chodesh_only';
      case 'chanukah_only':        return 'chanukah_only';
      case 'purim_only':           return 'purim_only';
      case 'chol_hamoed_only':     return 'chol_hamoed_only';
      case 'sefirah_only':         return 'sefirah_only';
      case 'motzaei_shabbos_only': return 'motzaei_shabbos_only';
      case 'fast_day_only':        return 'fast_day_only';
      case 'days_of_week_only':    return 'days_of_week_only';
      case 'date_window':          return 'date_window';
      case 'amidah_winter':        return 'amidah_winter';
      case 'amidah_summer':        return 'amidah_summer';
      case 'amidah_geshem_only':   return 'amidah_geshem_only';
      case 'hallel':               return 'hallel';
      case 'community_minhag':     return 'community_minhag';
      default: {
        const _exhaustive: never = rule;
        return _exhaustive;
      }
    }
  }
  const sample: ConditionalRule = { type: 'rosh_chodesh_only' };
  expect(assertExhaustive(sample)).toBe('rosh_chodesh_only');
});
