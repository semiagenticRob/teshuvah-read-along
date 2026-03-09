import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PrayerLine, TextSize } from '../types';
import { getScaledFontSizes } from '../utils/hebrewUtils';

interface PrayerTextProps {
  line: PrayerLine;
  textSize: TextSize;
  showTransliteration: boolean;
  showEnglish: boolean;
}

/**
 * Renders a single prayer line with Hebrew, transliteration, and English.
 * Used for simple display (without word-level highlighting).
 */
export const PrayerText: React.FC<PrayerTextProps> = ({
  line,
  textSize,
  showTransliteration,
  showEnglish,
}) => {
  const fontSizes = getScaledFontSizes(textSize);

  return (
    <View style={styles.container}>
      <Text
        style={[styles.hebrew, { fontSize: fontSizes.hebrewPrimary }]}
      >
        {line.hebrew}
      </Text>

      {showTransliteration && (
        <Text style={[styles.transliteration, { fontSize: fontSizes.transliteration }]}>
          {line.transliteration}
        </Text>
      )}

      {showEnglish && (
        <Text style={[styles.english, { fontSize: fontSizes.english }]}>
          {line.english}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  hebrew: {
    color: '#1A365D',
    fontWeight: '500',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 38,
    marginBottom: 4,
  },
  transliteration: {
    color: '#718096',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 2,
  },
  english: {
    color: '#4A5568',
    lineHeight: 22,
  },
});
