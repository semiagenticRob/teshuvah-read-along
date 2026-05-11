import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONTS, INK } from '../../theme/shacharitTheme';

interface Props {
  /** Optional short label, e.g. "Kaddish" or "Barchu response". */
  label?: string;
  accent: string;
}

/**
 * Renders in place of a prayer line that's only said with a minyan.
 * Single understated line — acknowledges what was skipped without
 * inviting the solo daveners to recite it.
 */
function MinyanOnlyMarker({ label, accent }: Props) {
  const prefix = label ? `${label} — ` : '';
  return (
    <View style={styles.wrap}>
      <View style={[styles.bullet, { backgroundColor: accent }]} />
      <Text style={styles.text}>
        {prefix}
        <Text style={styles.italic}>said with a minyan</Text>
      </Text>
    </View>
  );
}

export default React.memo(MinyanOnlyMarker);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 10,
    paddingVertical: 4,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.55,
  },
  text: {
    fontFamily: FONTS.serifBody,
    fontSize: 12,
    letterSpacing: 0.6,
    color: INK.faint,
  },
  italic: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
  },
});
