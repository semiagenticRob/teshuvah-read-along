import React, { useCallback } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { FONTS, INK } from '../../theme/shacharitTheme';

interface Props {
  hebrew: string | null;
  translit: string | null;
  showHebrew: boolean;
  showTranslit: boolean;
  idx: number;
  onTapWord: (idx: number) => void;
  renderHalo: (idx: number) => React.ReactNode;
}

function WordPair({ hebrew, translit, showHebrew, showTranslit, idx, onTapWord, renderHalo }: Props) {
  const handlePress = useCallback(() => onTapWord(idx), [idx, onTapWord]);
  return (
    <Pressable onPress={handlePress} hitSlop={4} style={styles.pair}>
      {renderHalo(idx)}
      {showHebrew && hebrew !== null && <Text allowFontScaling={false} style={styles.hebrew}>{hebrew}</Text>}
      {showTranslit && translit !== null && <Text allowFontScaling={false} style={styles.translit}>{translit}</Text>}
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
