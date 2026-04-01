import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Prayer, DisplayMode, TextSize } from '../types';
import { getScaledFontSizes } from '../utils/hebrewUtils';

interface ReadAlongViewProps {
  prayer: Prayer;
  currentLineIndex: number;
  currentWordIndex: number;
  displayMode: DisplayMode;
  textSize: TextSize;
  onWordTap: (lineIndex: number, wordIndex: number) => void;
}

export const ReadAlongView: React.FC<ReadAlongViewProps> = ({
  prayer,
  currentLineIndex,
  currentWordIndex,
  displayMode,
  textSize,
  onWordTap,
}) => {
  const fontSizes = getScaledFontSizes(textSize);
  const showTransliteration = displayMode === 'hebrew_translit' || displayMode === 'all';
  const showEnglish = displayMode === 'hebrew_english' || displayMode === 'all';

  if (!prayer.sections.length) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading prayer text...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {prayer.instructions && (
        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}>{prayer.instructions}</Text>
        </View>
      )}

      {prayer.sections.map((section) =>
        section.lines.map((line, lineIndex) => {
          const isCurrentLine = lineIndex === currentLineIndex;

          return (
            <View
              key={`${section.id}-${lineIndex}`}
              style={[styles.lineContainer, isCurrentLine && styles.currentLineContainer]}
            >
              {/* Hebrew text (RTL, primary) */}
              <View style={styles.hebrewLine}>
                {line.words.map((word, wordIndex) => {
                  const isCurrentWord = isCurrentLine && wordIndex === currentWordIndex;

                  return (
                    <TouchableOpacity
                      key={`he-${wordIndex}`}
                      onPress={() => onWordTap(lineIndex, wordIndex)}
                      activeOpacity={0.7}
                      style={wordIndex < line.words.length - 1 ? styles.hebrewWordSpacing : undefined}
                    >
                      <Text
                        style={[
                          styles.hebrewWord,
                          { fontSize: fontSizes.hebrewPrimary },
                          isCurrentWord && styles.highlightedWord,
                        ]}
                      >
                        {word.hebrew}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Transliteration (LTR) */}
              {showTransliteration && (
                <View style={styles.transliterationLine}>
                  {line.words.map((word, wordIndex) => {
                    const isCurrentWord = isCurrentLine && wordIndex === currentWordIndex;

                    return (
                      <Text
                        key={`tr-${wordIndex}`}
                        style={[
                          styles.transliterationWord,
                          { fontSize: fontSizes.transliteration },
                          isCurrentWord && styles.highlightedTransliteration,
                          wordIndex < line.words.length - 1 && styles.transliterationWordSpacing,
                        ]}
                      >
                        {word.transliteration}
                      </Text>
                    );
                  })}
                </View>
              )}

              {/* English translation (LTR) */}
              {showEnglish && (
                <Text
                  style={[
                    styles.englishLine,
                    { fontSize: fontSizes.english },
                    isCurrentLine && styles.highlightedEnglish,
                  ]}
                >
                  {line.english}
                </Text>
              )}

              {/* Divider between lines */}
              <View style={styles.lineDivider} />
            </View>
          );
        }),
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 100, // space for playback controls
  },
  loading: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#718096',
  },
  instructionBox: {
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#3182CE',
  },
  instructionText: {
    fontSize: 13,
    color: '#2B6CB0',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  lineContainer: {
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  currentLineContainer: {
    backgroundColor: 'rgba(49, 130, 206, 0.05)',
  },
  hebrewLine: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  hebrewWord: {
    color: '#1A365D',
    fontWeight: '500',
    lineHeight: 40,
  },
  hebrewWordSpacing: {
    marginLeft: 10,
  },
  highlightedWord: {
    backgroundColor: '#FBD38D',
    color: '#744210',
    fontWeight: '700',
    borderRadius: 4,
    overflow: 'hidden',
  },
  transliterationLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  transliterationWord: {
    color: '#718096',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  transliterationWordSpacing: {
    marginRight: 6,
  },
  highlightedTransliteration: {
    color: '#975A16',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  englishLine: {
    color: '#4A5568',
    lineHeight: 22,
    marginBottom: 2,
  },
  highlightedEnglish: {
    color: '#2D3748',
    fontWeight: '500',
  },
  lineDivider: {
    height: 1,
    backgroundColor: '#EDF2F7',
    marginTop: 8,
  },
});
