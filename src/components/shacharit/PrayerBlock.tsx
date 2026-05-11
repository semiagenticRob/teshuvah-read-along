import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SECTIONS, INK, FONTS, PARCHMENT, type SectionId } from '../../theme/shacharitTheme';
import PrayerHeader from './PrayerHeader';
import ExpandablePanel from './ExpandablePanel';
import AudioPlayerPlaceholder from './AudioPlayerPlaceholder';
import PairRow from './PairRow';
import { PRAYER_META } from '../../data/shacharit/prayerMeta';
import { useSettingsStore } from '../../store/settingsStore';
import type {
  BundledCommentary,
  BundledPrayerSegment,
  TextBlock,
} from '../../data/bundled/shacharit';

interface Props {
  prayerId: string;
  englishName: string;
  hebrewName: string;
  sectionId: SectionId;
  hebrewLines: string[];
  translitLines: string[];
  englishLines: string[];
  textBlocks?: TextBlock[];
  startIdx: number;
  onTapWord: (globalIdx: number) => void;
  renderHalo: (globalIdx: number) => React.ReactNode;
  commentary?: BundledCommentary[];
  segments?: BundledPrayerSegment[];
}

function PrayerBlock(p: Props) {
  const [openCommentary, setOpenCommentary] = useState(false);
  const [openAudio, setOpenAudio] = useState(false);
  const spec = SECTIONS[p.sectionId];
  const meta = PRAYER_META[p.prayerId];
  const lanes = useSettingsStore(s => s.displayLanes);

  // Prefer textBlocks (typed paragraphs) so headings/subheadings/FAQs render
  // with their own styling. Fall back to englishLines (all 'body') when the
  // bundled JSON predates the textBlocks field.
  const blocks: TextBlock[] = lanes.english
    ? (p.textBlocks && p.textBlocks.length > 0
        ? p.textBlocks
        : p.englishLines.filter(Boolean).map((t) => ({ kind: 'body' as const, text: t })))
    : [];

  return (
    <View style={[styles.wrap, { borderLeftColor: spec.accent }]}>
      <PrayerHeader
        englishName={p.englishName}
        hebrewName={p.hebrewName}
        subtitle={meta?.subtitle ?? ''}
        accent={spec.accent}
        commentaryOpen={openCommentary}
        audioOpen={openAudio}
        onToggleCommentary={() => setOpenCommentary(o => !o)}
        onToggleAudio={() => setOpenAudio(o => !o)}
      />
      <ExpandablePanel open={openCommentary}>
        <View style={[styles.commentaryBlock, { borderLeftColor: spec.accent }]}>
          <Text style={styles.commentaryText}>{meta?.commentary ?? ''}</Text>
        </View>
      </ExpandablePanel>
      <ExpandablePanel open={openAudio}>
        <AudioPlayerPlaceholder
          title={`Rabbi Feigenbaum · ${p.englishName}`}
          duration={meta?.audioDuration ?? '0:00'}
          accent={spec.accent}
          parchment={PARCHMENT}
          notes="Audio commentary plays alongside the written notes. Placeholder recording — final audio will be recorded by Rabbi Feigenbaum."
        />
      </ExpandablePanel>

      {(lanes.hebrew || lanes.translit) && (
        <PairRow
          prayerId={p.prayerId}
          hebrewLines={p.hebrewLines}
          translitLines={p.translitLines}
          showHebrew={lanes.hebrew}
          showTranslit={lanes.translit}
          prayerStartIdx={p.startIdx}
          onTapWord={p.onTapWord}
          renderHalo={p.renderHalo}
          commentary={p.commentary}
          segments={p.segments}
          accent={spec.accent}
        />
      )}
      {blocks.length > 0 && (
        <View style={styles.englishGroup}>
          {blocks.map((block, idx) => (
            <EnglishBlock key={idx} block={block} accent={spec.accent} />
          ))}
        </View>
      )}
    </View>
  );
}

interface EnglishBlockProps {
  block: TextBlock;
  accent: string;
}

function EnglishBlock({ block, accent }: EnglishBlockProps) {
  switch (block.kind) {
    case 'heading':
      return (
        <Text style={[styles.heading, { color: accent }]}>{block.text}</Text>
      );
    case 'subheading':
      return (
        <Text style={[styles.subheading, { color: accent }]}>{block.text}</Text>
      );
    case 'faq':
      return (
        <View style={[styles.callout, { borderLeftColor: accent }]}>
          <Text style={[styles.calloutLabel, { color: accent }]}>FAQ</Text>
          <Text style={styles.calloutBody}>{block.text.replace(/^FAQ\s*:\s*/i, '')}</Text>
        </View>
      );
    case 'callout':
      return (
        <View style={[styles.callout, { borderLeftColor: accent }]}>
          <Text style={[styles.calloutLabel, { color: accent }]}>Instant Insight</Text>
          <Text style={styles.calloutBody}>
            {block.text.replace(/^Instant Insight\s*:\s*/i, '')}
          </Text>
        </View>
      );
    case 'body':
    default:
      return <Text style={styles.body}>{block.text}</Text>;
  }
}

export default React.memo(PrayerBlock);

const styles = StyleSheet.create({
  wrap: {
    paddingLeft: 32,
    paddingVertical: 26,
    marginVertical: 10,
    position: 'relative',
    borderLeftWidth: 2,
  },
  commentaryBlock: { borderLeftWidth: 1.5, paddingLeft: 16, paddingVertical: 3 },
  commentaryText: {
    fontFamily: FONTS.displayItalic,
    fontSize: 16,
    lineHeight: 25,
    color: INK.soft,
    fontStyle: 'italic',
  },
  english: {
    fontFamily: FONTS.serifBodyItalic,
    fontSize: 17,
    color: INK.soft,
    lineHeight: 28,
    marginTop: 10,
    fontStyle: 'italic',
  },
  englishGroup: {
    marginTop: 14,
    gap: 14,
  },
  body: {
    fontFamily: FONTS.serifBodyItalic,
    fontSize: 16,
    color: INK.soft,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  heading: {
    fontFamily: FONTS.display,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0.2,
    marginTop: 8,
    marginBottom: -4,
  },
  subheading: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 4,
    marginBottom: -6,
  },
  callout: {
    borderLeftWidth: 2,
    paddingLeft: 14,
    paddingVertical: 6,
    marginVertical: 4,
  },
  calloutLabel: {
    fontFamily: FONTS.serifBody,
    fontSize: 10,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  calloutBody: {
    fontFamily: FONTS.serifBody,
    fontSize: 15,
    lineHeight: 24,
    color: INK.soft,
  },
});
