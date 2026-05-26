import React, { useCallback } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { FONTS, INK } from '../../theme/siddurTheme';

interface Props {
  hebrew: string | null;
  translit: string | null;
  showHebrew: boolean;
  showTranslit: boolean;
  idx: number;
  /**
   * Optional tap handler. When omitted, the pair is rendered non-interactive.
   * The legacy karaoke scroll uses this to drive jump-to-word.
   */
  onTapWord?: (idx: number) => void;
  /**
   * Optional halo renderer. Pre-Plan-A LineRow uses this to inject animated
   * halos behind each word. New typed-data LineRow (Plan A Task 9+) drives
   * halo state externally via `isActive` and does not render its own halo
   * layer here.
   */
  renderHalo?: (idx: number) => React.ReactNode;
  /**
   * Plan A Task 9: marks this pair as the currently active karaoke word.
   * Used by callers that don't render their own halo via `renderHalo` —
   * future halo wiring (Plan A Task 11+) can read this to drive the
   * crescendo state machine. Today it is informational only so the prop
   * surface is stable when halos are re-attached.
   */
  isActive?: boolean;
}

function WordPair({ hebrew, translit, showHebrew, showTranslit, idx, onTapWord, renderHalo }: Props) {
  const handlePress = useCallback(() => {
    if (onTapWord) onTapWord(idx);
  }, [idx, onTapWord]);
  return (
    <Pressable onPress={handlePress} hitSlop={4} style={styles.pair} disabled={!onTapWord}>
      {renderHalo ? renderHalo(idx) : null}
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
