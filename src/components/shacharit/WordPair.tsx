import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { FONTS, INK } from '../../theme/shacharitTheme';

interface Props {
  hebrew: string | null;
  translit: string | null;
  showHebrew: boolean;
  showTranslit: boolean;
  onPress: () => void;
  renderHalo: () => React.ReactNode;
}

function WordPair({ hebrew, translit, showHebrew, showTranslit, onPress, renderHalo }: Props) {
  return (
    <Pressable onPress={onPress} hitSlop={4} style={styles.pair}>
      {renderHalo()}
      {showHebrew && hebrew !== null && <Text style={styles.hebrew}>{hebrew}</Text>}
      {showTranslit && translit !== null && <Text style={styles.translit}>{translit}</Text>}
    </Pressable>
  );
}

export default React.memo(WordPair);

const styles = StyleSheet.create({
  pair: {
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 2,
    position: 'relative',
  },
  hebrew: {
    fontFamily: FONTS.hebrew,
    fontSize: 24,
    lineHeight: 28,
    color: INK.strong,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  translit: {
    fontFamily: FONTS.serifBodyItalic,
    fontSize: 11,
    lineHeight: 14,
    color: INK.faint,
    textAlign: 'center',
    marginTop: 3,
    fontStyle: 'italic',
  },
});
