// src/siddur/components/BlockRenderer.tsx
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import PrayerBlock from './PrayerBlock';
import FaqPanel from './FaqPanel';
import MinyanRevealBlock from './MinyanRevealBlock';
import LearnCrossLink from './LearnCrossLink';
import ItalicEnglishText from './ItalicEnglishText';
import { FONTS, INK } from '../../theme/siddurTheme';
import type { SiddurBlock, VariantBlock, OmerCountBlock } from '../types';

interface Props {
  block: SiddurBlock;
  activeWordIndex: number | null;
  showHebrew: boolean;
  showTranslit: boolean;
  showEnglish: boolean;
  onLearnLinkPress: (essayId: string) => void;
}

function BlockRenderer({ block, activeWordIndex, showHebrew, showTranslit, showEnglish, onLearnLinkPress }: Props) {
  switch (block.kind) {
    case 'prayer':
      return (
        <PrayerBlock
          data={block}
          activeWordIndex={activeWordIndex}
          showHebrew={showHebrew}
          showTranslit={showTranslit}
          showEnglish={showEnglish}
        />
      );
    case 'heading':
    case 'subsection':
      return (
        <View style={styles.headingWrap}>
          {block.he && <Text style={styles.headingHebrew}>{block.he}</Text>}
          <Text style={styles.headingEn}>{block.en}</Text>
        </View>
      );
    case 'rubric':
      return (
        <View style={styles.rubricWrap}>
          {block.text.he && <Text style={[styles.rubricHe, block.italic && styles.italic]}>{block.text.he}</Text>}
          <Text style={[styles.rubricEn, block.italic && styles.italic]}>{block.text.en}</Text>
        </View>
      );
    case 'faq':
    case 'callout':
    case 'instant_insight':
      return <FaqPanel data={block} />;
    case 'minyan_only':
      return <MinyanRevealBlock data={block} />;
    case 'learn_link':
      return (
        <LearnCrossLink
          essayId={block.essayId}
          promptText={block.promptText}
          onPress={onLearnLinkPress}
        />
      );
    case 'variant':
      return <VariantBlockRenderer block={block} showHebrew={showHebrew} showEnglish={showEnglish} />;
    case 'omer_count':
      return <OmerCountRenderer block={block} showHebrew={showHebrew} showEnglish={showEnglish} />;
  }
}

function VariantBlockRenderer({ block, showHebrew, showEnglish }: { block: VariantBlock; showHebrew: boolean; showEnglish: boolean }) {
  return (
    <View style={styles.variantWrap}>
      {block.variants.map((v, i) => (
        <View key={i} style={i > 0 ? styles.variantSeparator : undefined}>
          <Text style={styles.variantLabel}>{v.label}</Text>
          {v.he && showHebrew && v.he.map((line) => (
            <Text key={line.lineIndex} style={styles.variantHebrew}>
              {line.words.map((w) => w.text).join('  ')}
            </Text>
          ))}
          {v.en && showEnglish && v.en.map((para, j) => (
            <ItalicEnglishText key={j} spans={para.spans} />
          ))}
        </View>
      ))}
    </View>
  );
}

function OmerCountRenderer({ block, showHebrew, showEnglish }: { block: OmerCountBlock; showHebrew: boolean; showEnglish: boolean }) {
  return (
    <View style={styles.omerWrap}>
      {showHebrew && block.he.map((line) => (
        <Text key={line.lineIndex} style={styles.variantHebrew}>
          {line.words.map((w) => w.text).join('  ')}
        </Text>
      ))}
      {showEnglish && block.en.map((para, j) => (
        <ItalicEnglishText key={j} spans={para.spans} />
      ))}
    </View>
  );
}

export default React.memo(BlockRenderer);

const styles = StyleSheet.create({
  headingWrap: { marginTop: 24, marginBottom: 12 },
  headingHebrew: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: INK.strong,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  headingEn: {
    fontFamily: FONTS.serifBody,
    fontSize: 16,
    color: INK.soft,
    marginTop: 4,
  },
  rubricWrap: { marginVertical: 10 },
  rubricHe: {
    fontFamily: FONTS.hebrew,
    fontSize: 16,
    color: INK.soft,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  rubricEn: {
    fontFamily: FONTS.serifBody,
    fontSize: 14,
    color: INK.soft,
    marginTop: 2,
  },
  italic: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
  },
  variantWrap: { marginVertical: 12 },
  variantSeparator: { marginTop: 12, borderTopWidth: 1, borderTopColor: INK.faint, paddingTop: 12, opacity: 0.95 },
  variantLabel: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: INK.soft,
    marginBottom: 6,
  },
  variantHebrew: {
    fontFamily: FONTS.hebrew,
    fontSize: 22,
    lineHeight: 32,
    color: INK.strong,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginBottom: 4,
  },
  omerWrap: { marginVertical: 12 },
});
