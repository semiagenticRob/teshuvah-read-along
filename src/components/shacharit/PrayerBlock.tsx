import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SECTIONS, INK, FONTS, PARCHMENT, type SectionId } from '../../theme/shacharitTheme';
import PrayerHeader from './PrayerHeader';
import ExpandablePanel from './ExpandablePanel';
import AudioPlayerPlaceholder from './AudioPlayerPlaceholder';
import PairRow from './PairRow';
import { PRAYER_META } from '../../data/shacharit/prayerMeta';
import { useSettingsStore } from '../../store/settingsStore';

interface Props {
  prayerId: string;
  englishName: string;
  hebrewName: string;
  sectionId: SectionId;
  hebrewText: string;
  translitText: string;
  englishText: string;
  startIdx: number;
  onTapWord: (globalIdx: number) => void;
  renderHalo: (globalIdx: number) => React.ReactNode;
}

export default function PrayerBlock(p: Props) {
  const [openCommentary, setOpenCommentary] = useState(false);
  const [openAudio, setOpenAudio] = useState(false);
  const spec = SECTIONS[p.sectionId];
  const meta = PRAYER_META[p.prayerId];
  const lanes = useSettingsStore(s => s.displayLanes);

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
          hebrew={p.hebrewText}
          translit={p.translitText}
          showHebrew={lanes.hebrew}
          showTranslit={lanes.translit}
          prayerStartIdx={p.startIdx}
          onTapWord={p.onTapWord}
          renderHalo={p.renderHalo}
        />
      )}
      {lanes.english && p.englishText ? (
        <Text style={styles.english}>{p.englishText}</Text>
      ) : null}
    </View>
  );
}

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
});
