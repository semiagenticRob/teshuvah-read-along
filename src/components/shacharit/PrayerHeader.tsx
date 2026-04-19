import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FONTS, INK } from '../../theme/shacharitTheme';

interface Props {
  englishName: string;
  hebrewName: string;
  subtitle: string;
  accent: string;
  commentaryOpen: boolean;
  audioOpen: boolean;
  onToggleCommentary: () => void;
  onToggleAudio: () => void;
}

export default function PrayerHeader(p: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.name}>{p.englishName}</Text>
        <Text style={[styles.hebrewName, { color: p.accent }]}>{p.hebrewName}</Text>
      </View>
      <Text style={styles.subtitle}>{p.subtitle}</Text>
      <View style={styles.toggles}>
        <Pressable onPress={p.onToggleCommentary}>
          <Text style={[styles.toggle, { color: p.accent }]}>
            {p.commentaryOpen ? 'Commentary ×' : 'Commentary +'}
          </Text>
        </Pressable>
        <Pressable onPress={p.onToggleAudio}>
          <Text style={[styles.toggle, { color: p.accent }]}>
            {p.audioOpen ? 'Audio & Notes ×' : 'Audio & Notes +'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: 10,
  },
  name: {
    fontFamily: FONTS.displayItalic,
    fontSize: 23,
    color: INK.strong,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  hebrewName: {
    fontFamily: FONTS.hebrew,
    fontSize: 17,
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: FONTS.serifBodyItalic,
    fontSize: 15,
    color: INK.faint,
    marginTop: 2,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  toggles: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  toggle: {
    fontFamily: FONTS.serifBody,
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
});
