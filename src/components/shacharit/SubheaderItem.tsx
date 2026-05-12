import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SECTIONS, FONTS, type SectionId } from '../../theme/shacharitTheme';

interface Props {
  sectionId: SectionId;
  text: string;
}

/**
 * Standalone block rendered BETWEEN two prayer blocks in the scroll.
 * Used for Feigenbaum's pedagogical transition lines ("OK — but I can't
 * climb to the next rung if I don't understand what to do!"). Lives in
 * the FlatList as its own item so it visually separates from either
 * neighboring prayer.
 */
function SubheaderItem({ sectionId, text }: Props) {
  const spec = SECTIONS[sectionId];
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[spec.gradient[0], spec.gradient[1]]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.inner}>
        <Text style={[styles.text, { color: spec.accent }]} allowFontScaling={false}>
          {text}
        </Text>
      </View>
    </View>
  );
}

export default React.memo(SubheaderItem);

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  inner: {
    paddingHorizontal: 36,
    paddingVertical: 24,
    alignItems: 'center',
  },
  text: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

