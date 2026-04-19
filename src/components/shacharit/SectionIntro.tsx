import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SECTIONS, INK, FONTS, PARCHMENT, type SectionId } from '../../theme/shacharitTheme';
import ExpandablePanel from './ExpandablePanel';
import AudioPlayerPlaceholder from './AudioPlayerPlaceholder';
import {
  SECTION_BODY,
  SECTION_COMMENTARY,
  SECTION_AUDIO_NOTES,
  SECTION_AUDIO_DURATIONS,
} from '../../data/shacharit/sectionCopy';

interface Props {
  sectionId: SectionId;
}

export default function SectionIntro({ sectionId }: Props) {
  const [openCommentary, setOpenCommentary] = useState(false);
  const [openAudio, setOpenAudio] = useState(false);
  const spec = SECTIONS[sectionId];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.eyebrow, { color: spec.accent }]}>{spec.label}</Text>
      <Text style={styles.hebrewTitle}>{spec.hebrew}</Text>
      <Text style={[styles.englishTitle, { color: INK.soft }]}>{spec.english}</Text>
      <Text style={[styles.body, { color: INK.soft }]}>{SECTION_BODY[sectionId]}</Text>

      <View style={styles.toggles}>
        <Pressable onPress={() => setOpenCommentary(o => !o)}>
          <Text style={[styles.toggle, { color: spec.accent }]}>
            {openCommentary ? 'Commentary ×' : 'Commentary +'}
          </Text>
        </Pressable>
        <Pressable onPress={() => setOpenAudio(o => !o)}>
          <Text style={[styles.toggle, { color: spec.accent }]}>
            {openAudio ? 'Audio & Notes ×' : 'Audio & Notes +'}
          </Text>
        </Pressable>
      </View>

      <ExpandablePanel open={openCommentary}>
        <View style={[styles.commentaryBlock, { borderLeftColor: spec.accent }]}>
          <Text style={styles.commentaryText}>{SECTION_COMMENTARY[sectionId]}</Text>
          <Text style={[styles.attribution, { color: INK.faint }]}>
            — Placeholder · Feigenbaum Commentary
          </Text>
        </View>
      </ExpandablePanel>

      <ExpandablePanel open={openAudio}>
        <AudioPlayerPlaceholder
          title={`Rabbi Feigenbaum · ${spec.label}`}
          duration={SECTION_AUDIO_DURATIONS[sectionId]}
          accent={spec.accent}
          parchment={PARCHMENT}
          notes={SECTION_AUDIO_NOTES[sectionId]}
        />
      </ExpandablePanel>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 36, paddingBottom: 14 },
  eyebrow: {
    fontFamily: FONTS.displayItalic,
    fontSize: 30,
    lineHeight: 34,
    marginBottom: 14,
    fontStyle: 'italic',
  },
  hebrewTitle: {
    fontFamily: FONTS.hebrew,
    fontSize: 46,
    lineHeight: 52,
    color: INK.strong,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginBottom: 6,
  },
  englishTitle: {
    fontFamily: FONTS.serifBodyItalic,
    fontSize: 20,
    marginBottom: 28,
    fontStyle: 'italic',
  },
  body: { fontFamily: FONTS.serifBody, fontSize: 17, lineHeight: 26 },
  toggles: { flexDirection: 'row', gap: 22, marginTop: 22, flexWrap: 'wrap' },
  toggle: {
    fontFamily: FONTS.serifBody,
    fontSize: 13,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  commentaryBlock: { borderLeftWidth: 2, paddingLeft: 22, paddingVertical: 4 },
  commentaryText: {
    fontFamily: FONTS.displayItalic,
    fontSize: 18,
    lineHeight: 28,
    color: INK.soft,
    fontStyle: 'italic',
  },
  attribution: {
    fontFamily: FONTS.serifBody,
    fontSize: 11,
    letterSpacing: 2.4,
    marginTop: 10,
    textTransform: 'uppercase',
  },
});
