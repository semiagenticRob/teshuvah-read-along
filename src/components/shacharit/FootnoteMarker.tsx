import React, { useCallback } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { FONTS } from '../../theme/shacharitTheme';

interface Props {
  marker: string;
  accent: string;
  isOpen: boolean;
  onPress: () => void;
}

/**
 * Inline superscript glyph rendered next to a word that carries a commentary.
 * Tapping toggles the matching FootnotePanel via footnoteStore.
 */
function FootnoteMarker({ marker, accent, isOpen, onPress }: Props) {
  const handlePress = useCallback(() => onPress(), [onPress]);
  return (
    <Pressable onPress={handlePress} hitSlop={8} style={styles.wrap}>
      <Text
        allowFontScaling={false}
        style={[styles.glyph, { color: accent, opacity: isOpen ? 1 : 0.85 }]}
      >
        {marker}
      </Text>
    </Pressable>
  );
}

export default React.memo(FootnoteMarker);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 2,
  },
  glyph: {
    fontFamily: FONTS.serifBody,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
  },
});
