import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { Prayer, DisplayMode, TextSize } from '../types';
import { getScaledFontSizes } from '../utils/hebrewUtils';

interface ReadAlongViewProps {
  prayer: Prayer;
  currentLineIndex: number;
  currentWordIndex: number;
  displayMode: DisplayMode;
  textSize: TextSize;
  onWordTap: (lineIndex: number, wordIndex: number) => void;
  onLineLayout?: (lineIndex: number, y: number) => void;
}

/**
 * Renders English text with footnote markers as tappable blue superscripts.
 * Splits on the ⁽N⁾ pattern inserted by the bundler.
 */
function renderEnglishWithMarkers(
  english: string,
  fontSize: number,
  isHighlighted: boolean,
  onMarkerTap: () => void,
) {
  const parts = english.split(/(⁽\d+⁾)/);
  if (parts.length === 1) {
    // No markers — plain text
    return (
      <Text style={[styles.englishLine, { fontSize }, isHighlighted && styles.highlightedEnglish]}>
        {english}
      </Text>
    );
  }

  return (
    <Text style={[styles.englishLine, { fontSize }, isHighlighted && styles.highlightedEnglish]}>
      {parts.map((part, i) => {
        const markerMatch = part.match(/^⁽(\d+)⁾$/);
        if (markerMatch) {
          return (
            <Text
              key={i}
              style={styles.inlineFootnoteMarker}
              onPress={onMarkerTap}
            >
              ⁽{markerMatch[1]}⁾
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

export const ReadAlongView: React.FC<ReadAlongViewProps> = ({
  prayer,
  currentLineIndex,
  currentWordIndex,
  displayMode,
  textSize,
  onWordTap,
  onLineLayout,
}) => {
  const fontSizes = getScaledFontSizes(textSize);
  const showTransliteration = displayMode === 'hebrew_translit' || displayMode === 'all';
  const showEnglish = displayMode === 'hebrew_english' || displayMode === 'all';

  // Track which lines have their footnotes expanded (collapsed by default)
  const [expandedFootnotes, setExpandedFootnotes] = useState<Set<number>>(new Set());

  const toggleFootnotes = useCallback((lineIndex: number) => {
    setExpandedFootnotes((prev) => {
      const next = new Set(prev);
      if (next.has(lineIndex)) {
        next.delete(lineIndex);
      } else {
        next.add(lineIndex);
      }
      return next;
    });
  }, []);

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
          const hasFootnotes = line.footnotes && line.footnotes.length > 0;
          const footnotesExpanded = expandedFootnotes.has(lineIndex);

          return (
            <View
              key={`${section.id}-${lineIndex}`}
              style={[styles.lineContainer, isCurrentLine && styles.currentLineContainer]}
              onLayout={onLineLayout ? (e: LayoutChangeEvent) => onLineLayout(lineIndex, e.nativeEvent.layout.y) : undefined}
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

              {/* English translation with tappable footnote markers */}
              {showEnglish && (
                hasFootnotes
                  ? renderEnglishWithMarkers(
                      line.english,
                      fontSizes.english,
                      isCurrentLine,
                      () => toggleFootnotes(lineIndex),
                    )
                  : (
                    <Text
                      style={[
                        styles.englishLine,
                        { fontSize: fontSizes.english },
                        isCurrentLine && styles.highlightedEnglish,
                      ]}
                    >
                      {line.english}
                    </Text>
                  )
              )}

              {/* Footnotes (collapsed by default, toggled by marker tap) */}
              {showEnglish && hasFootnotes && footnotesExpanded && (
                <View style={styles.footnotesContainer}>
                  {line.footnotes!.map((fn) => (
                    <Text key={fn.marker} style={styles.footnoteText}>
                      <Text style={styles.footnoteMarker}>{fn.marker}. </Text>
                      {fn.text}
                    </Text>
                  ))}
                </View>
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
  inlineFootnoteMarker: {
    color: '#3182CE',
    fontWeight: '700',
    fontSize: 11,
  },
  footnotesContainer: {
    marginTop: 6,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#E2E8F0',
  },
  footnoteText: {
    fontSize: 12,
    color: '#A0AEC0',
    lineHeight: 18,
    marginBottom: 2,
  },
  footnoteMarker: {
    fontWeight: '700',
    color: '#718096',
  },
  lineDivider: {
    height: 1,
    backgroundColor: '#EDF2F7',
    marginTop: 8,
  },
});
