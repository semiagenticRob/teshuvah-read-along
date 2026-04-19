import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SECTIONS, INK, FONTS, PARCHMENT, type SectionId } from '../../theme/shacharitTheme';
import PrayerHeader from './PrayerHeader';
import ExpandablePanel from './ExpandablePanel';
import AudioPlayerPlaceholder from './AudioPlayerPlaceholder';
import { PRAYER_META } from '../../data/shacharit/prayerMeta';

interface Props {
  prayerId: string;
  englishName: string;
  hebrewName: string;
  sectionId: SectionId;
  hebrewText: string;
  translitText: string;
  englishText: string;
}

export default function PrayerBlock(p: Props) {
  const [openCommentary, setOpenCommentary] = useState(false);
  const [openAudio, setOpenAudio] = useState(false);
  const spec = SECTIONS[p.sectionId];
  const meta = PRAYER_META[p.prayerId];

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

      {/* Body — plain text for now; Phase 6 replaces with interlinear word pairs */}
      {p.hebrewText ? (
        <Text style={[styles.hebrew, { color: INK.strong }]}>{p.hebrewText}</Text>
      ) : null}
      {p.translitText ? (
        <Text style={styles.translit}>{p.translitText}</Text>
      ) : null}
      {p.englishText ? (
        <Text style={styles.english}>{p.englishText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingLeft: 32,
    paddingRight: 0,
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
  hebrew: {
    fontFamily: FONTS.hebrew,
    fontSize: 26,
    lineHeight: 42,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 12,
  },
  translit: {
    fontFamily: FONTS.serifBody,
    fontSize: 16,
    color: INK.soft,
    lineHeight: 28,
    marginTop: 10,
  },
  english: {
    fontFamily: FONTS.serifBodyItalic,
    fontSize: 17,
    color: INK.soft,
    lineHeight: 28,
    marginTop: 10,
    fontStyle: 'italic',
  },
});
