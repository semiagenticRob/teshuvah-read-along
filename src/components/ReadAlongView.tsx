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
 */
function renderEnglishWithMarkers(
  english: string,
  fontSize: number,
  isHighlighted: boolean,
  onMarkerTap: () => void,
  isColumn?: boolean,
) {
  const baseStyle = isColumn ? styles.columnEnglish : styles.englishLine;
  const parts = english.split(/(⁽\d+⁾)/);
  if (parts.length === 1) {
    return (
      <Text style={[baseStyle, { fontSize }, isHighlighted && styles.highlightedEnglish]}>
        {english}
      </Text>
    );
  }
  return (
    <Text style={[baseStyle, { fontSize }, isHighlighted && styles.highlightedEnglish]}>
      {parts.map((part, i) => {
        const m = part.match(/^⁽(\d+)⁾$/);
        if (m) {
          return (
            <Text key={i} style={styles.inlineFootnoteMarker} onPress={onMarkerTap}>
              ⁽{m[1]}⁾
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
  const hebrewOnly = displayMode === 'hebrew';
  // In "all" mode: two columns (Hebrew + Translit), English below
  // In "hebrew_english" mode: two columns (Hebrew + English)
  // In "hebrew_translit" mode: two columns (Hebrew + Translit)
  const twoColumn = !hebrewOnly;
  // What goes in the right column?
  const rightColumnIsEnglish = displayMode === 'hebrew_english';

  const [expandedFootnotes, setExpandedFootnotes] = useState<Set<number>>(new Set());

  const toggleFootnotes = useCallback((lineIndex: number) => {
    setExpandedFootnotes((prev) => {
      const next = new Set(prev);
      if (next.has(lineIndex)) next.delete(lineIndex);
      else next.add(lineIndex);
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

          // Hebrew words (used in both layouts)
          const hebrewWords = line.words.map((word, wordIndex) => {
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
          });

          // Transliteration words
          const translitWords = line.words.map((word, wordIndex) => {
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
          });

          return (
            <View
              key={`${section.id}-${lineIndex}`}
              style={[styles.lineContainer, isCurrentLine && styles.currentLineContainer]}
              onLayout={onLineLayout ? (e: LayoutChangeEvent) => onLineLayout(lineIndex, e.nativeEvent.layout.y) : undefined}
            >
              {hebrewOnly ? (
                /* Hebrew only — single column */
                <View style={styles.hebrewLine}>{hebrewWords}</View>
              ) : (
                /* Two-column layout */
                <View style={styles.twoColumnRow}>
                  {/* Left column: Hebrew (right-justified) */}
                  <View style={styles.columnLeft}>
                    <View style={styles.hebrewLine}>{hebrewWords}</View>
                  </View>

                  {/* Right column: Transliteration or English */}
                  <View style={styles.columnRight}>
                    {rightColumnIsEnglish ? (
                      <Text
                        style={[
                          styles.columnEnglish,
                          { fontSize: fontSizes.english },
                          isCurrentLine && styles.highlightedEnglish,
                        ]}
                      >
                        {line.english}
                      </Text>
                    ) : (
                      <View style={styles.transliterationLine}>{translitWords}</View>
                    )}
                  </View>
                </View>
              )}

              {/* In "All Three" mode: English full-width below the two columns */}
              {displayMode === 'all' && showEnglish && (
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

              {/* In "Hebrew + English" mode: footnotes below the two-column row */}
              {rightColumnIsEnglish && hasFootnotes && (
                renderEnglishWithMarkers(
                  '', // empty — just for marker taps
                  fontSizes.english,
                  isCurrentLine,
                  () => toggleFootnotes(lineIndex),
                )
              )}

              {/* Footnotes (collapsed by default) */}
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
    paddingBottom: 120,
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
  // Two-column layout
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  columnLeft: {
    flex: 1,
    alignItems: 'flex-end',
  },
  columnRight: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  // Hebrew words
  hebrewLine: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  hebrewWord: {
    color: '#1A365D',
    fontWeight: '500',
    lineHeight: 36,
  },
  hebrewWordSpacing: {
    marginLeft: 8,
  },
  highlightedWord: {
    backgroundColor: '#FBD38D',
    color: '#744210',
    fontWeight: '700',
    borderRadius: 4,
    overflow: 'hidden',
  },
  // Transliteration
  transliterationLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  transliterationWord: {
    color: '#718096',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  transliterationWordSpacing: {
    marginRight: 5,
  },
  highlightedTransliteration: {
    color: '#975A16',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  // English (full-width below columns)
  englishLine: {
    color: '#4A5568',
    lineHeight: 22,
    marginTop: 4,
    marginBottom: 2,
  },
  // English in right column
  columnEnglish: {
    color: '#4A5568',
    lineHeight: 22,
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
