// src/siddur/components/MinyanRevealBlock.tsx
import React, { useCallback, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import ItalicEnglishText from './ItalicEnglishText';
import { FONTS, INK } from '../../theme/siddurTheme';
import type { MinyanOnlyBlock } from '../types';

interface Props {
  data: MinyanOnlyBlock;
}

function MinyanRevealBlock({ data }: Props) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  if (!open) {
    return (
      <Pressable onPress={toggle} style={styles.collapsed} hitSlop={4}>
        <View style={styles.rule} />
        <Text style={styles.prompt}>
          Recited only with a minyan — tap to view  ▸
        </Text>
        <View style={styles.rule} />
      </Pressable>
    );
  }
  return (
    <View style={styles.expanded}>
      <Pressable onPress={toggle} hitSlop={4}>
        <Text style={styles.collapseLabel}>Hide minyan-only content  ▾</Text>
      </Pressable>
      {data.he.map((line) => (
        <Text key={line.lineIndex} style={styles.hebrew} allowFontScaling={false}>
          {line.words.map((w) => w.text).join('  ')}
        </Text>
      ))}
      {data.en.map((para, i) => (
        <ItalicEnglishText key={i} spans={para.spans} baseStyle={styles.english} />
      ))}
    </View>
  );
}

export default React.memo(MinyanRevealBlock);

const styles = StyleSheet.create({
  collapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 4,
  },
  rule: { flex: 1, height: 1, backgroundColor: INK.faint, opacity: 0.4 },
  prompt: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 12,
    color: INK.soft,
    paddingHorizontal: 12,
  },
  expanded: { marginVertical: 12, paddingHorizontal: 8, opacity: 0.7 },
  collapseLabel: {
    fontFamily: FONTS.serifBodyItalic,
    fontSize: 12,
    color: INK.soft,
    paddingBottom: 6,
  },
  hebrew: {
    fontFamily: FONTS.hebrew,
    fontSize: 20,
    lineHeight: 30,
    writingDirection: 'rtl',
    textAlign: 'right',
    color: INK.soft,
    marginBottom: 4,
  },
  english: { color: INK.soft },
});
