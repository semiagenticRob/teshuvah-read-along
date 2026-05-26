// src/siddur/components/LearnCrossLink.tsx
import React, { useCallback } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { FONTS, INK, PARCHMENT } from '../../theme/siddurTheme';

interface Props {
  essayId: string;
  promptText?: string;
  onPress: (essayId: string) => void;
}

function LearnCrossLink({ essayId, promptText, onPress }: Props) {
  const handlePress = useCallback(() => onPress(essayId), [essayId, onPress]);
  const label = promptText ?? essayId;
  return (
    <Pressable onPress={handlePress} style={styles.pill} hitSlop={6}>
      <View style={styles.row}>
        <Text style={styles.prefix}>Read more:</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

export default React.memo(LearnCrossLink);

const styles = StyleSheet.create({
  pill: {
    backgroundColor: PARCHMENT,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  prefix: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: INK.soft,
    marginRight: 8,
  },
  label: {
    flex: 1,
    fontFamily: FONTS.serifBody,
    fontSize: 15,
    fontWeight: '600',
    color: INK.strong,
  },
  chevron: { fontSize: 22, color: INK.soft, marginLeft: 8 },
});
