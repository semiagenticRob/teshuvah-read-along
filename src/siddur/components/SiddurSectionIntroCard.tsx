import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import ExpandablePanel from './ExpandablePanel';
import { FONTS, INK } from '../../theme/siddurTheme';
import type { FaqBlock } from '../types';

const ACCENT = '#b07a1c';

const ORDINALS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

interface Props {
  cardTitle: { he: string; en: string };
  sectionIndex: number;
  introBlocks: FaqBlock[];
}

export default function SiddurSectionIntroCard({ cardTitle, sectionIndex, introBlocks }: Props) {
  const [openNotes, setOpenNotes] = useState(false);

  // First intro block provides the subtitle (first sentence) and start of notes.
  const firstText = introBlocks[0]?.body?.[0]?.spans?.[0]?.text ?? '';
  const bangIdx = firstText.indexOf('!');
  const subtitle = bangIdx >= 0 ? firstText.slice(0, bangIdx + 1).trim() : '';
  const firstRemainder = bangIdx >= 0 ? firstText.slice(bangIdx + 1).trim() : firstText;

  // Collect all notes text: remainder of first block + all subsequent intro blocks.
  const notesSegments: string[] = [];
  if (firstRemainder) notesSegments.push(firstRemainder);
  for (const block of introBlocks.slice(1)) {
    for (const para of block.body ?? []) {
      const text = para.spans?.map((s) => s.text).join('') ?? '';
      if (text) notesSegments.push(text);
    }
  }
  const notesText = notesSegments.join(' ');

  const label = `Section ${ORDINALS[sectionIndex] ?? String(sectionIndex + 1)}`;

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>{label}</Text>
      <Text style={styles.hebrewTitle}>{cardTitle.he}</Text>
      <Text style={styles.englishTitle}>{cardTitle.en}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {notesText ? (
        <>
          <View style={styles.toggleRow}>
            <Pressable onPress={() => setOpenNotes((o) => !o)}>
              <Text style={styles.toggle}>{openNotes ? 'Notes ×' : 'Notes +'}</Text>
            </Pressable>
          </View>
          <ExpandablePanel open={openNotes}>
            <Text style={styles.notesBody}>{notesText}</Text>
          </ExpandablePanel>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 36, paddingBottom: 14 },
  eyebrow: {
    fontFamily: FONTS.displayItalic,
    fontSize: 30,
    lineHeight: 34,
    color: ACCENT,
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
    color: INK.soft,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: FONTS.serifBody,
    fontSize: 17,
    lineHeight: 26,
    color: INK.soft,
    marginBottom: 4,
  },
  toggleRow: { marginTop: 18, flexDirection: 'row' },
  toggle: {
    fontFamily: FONTS.serifBody,
    fontSize: 13,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: ACCENT,
  },
  notesBody: {
    fontFamily: FONTS.serifBody,
    fontSize: 15,
    lineHeight: 23,
    color: INK.soft,
  },
});
