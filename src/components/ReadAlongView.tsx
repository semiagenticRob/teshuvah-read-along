import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { Prayer, DisplayMode, TextSize, WordTiming } from '../types';
import { getScaledFontSizes } from '../utils/hebrewUtils';

const WORDS_PER_ROW = 3;

interface ReadAlongViewProps {
  prayer: Prayer;
  currentLineIndex: number;
  currentWordIndex: number;
  displayMode: DisplayMode;
  textSize: TextSize;
  onWordTap: (lineIndex: number, wordIndex: number) => void;
  onLineLayout?: (lineIndex: number, y: number) => void;
}

/** Split an array into chunks of size n */
function chunk<T>(arr: T[], n: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n) {
    result.push(arr.slice(i, i + n));
  }
  return result;
}

/**
 * Renders English text with footnote markers as tappable blue superscripts.
 */
function renderEnglishWithMarkers(
  english: string,
  fontSize: number,
  isHighlighted: boolean,
  onMarkerTap: () => void,
) {
  const parts = english.split(/(⁽\d+⁾)/);
  if (parts.length === 1) {
    return (
      <Text style={[styles.englishLine, { fontSize }, isHighlighted && styles.highlightedEnglish]}>
        {english}
      </Text>
    );
  }
  return (
    <Text style={[styles.englishLine, { fontSize }, isHighlighted && styles.highlightedEnglish]}>
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
  const showEnglish = displayMode === 'hebrew_english' || displayMode === 'all';
  const hebrewOnly = displayMode === 'hebrew';
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

          return (
            <View
              key={`${section.id}-${lineIndex}`}
              style={[styles.lineContainer, isCurrentLine && styles.currentLineContainer]}
              onLayout={onLineLayout ? (e: LayoutChangeEvent) => onLineLayout(lineIndex, e.nativeEvent.layout.y) : undefined}
            >
              {hebrewOnly ? (
                /* Hebrew only — single column, RTL wrapping */
                <View style={styles.hebrewLineStandalone}>
                  {line.words.map((word, wordIndex) => renderHebrewWord(word, lineIndex, wordIndex, isCurrentLine, currentWordIndex, fontSizes, onWordTap))}
                </View>
              ) : (
                /* Synced two-column: chunk words into rows of N */
                renderSyncedColumns(
                  line.words,
                  lineIndex,
                  isCurrentLine,
                  currentWordIndex,
                  fontSizes,
                  onWordTap,
                  rightColumnIsEnglish,
                  rightColumnIsEnglish ? line.english : undefined,
                )
              )}

              {/* In "All Three" mode: English full-width below */}
              {displayMode === 'all' && showEnglish && (
                hasFootnotes
                  ? renderEnglishWithMarkers(line.english, fontSizes.english, isCurrentLine, () => toggleFootnotes(lineIndex))
                  : <Text style={[styles.englishLine, { fontSize: fontSizes.english }, isCurrentLine && styles.highlightedEnglish]}>{line.english}</Text>
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

              {/* Footnote toggle for Hebrew+English mode */}
              {rightColumnIsEnglish && hasFootnotes && !footnotesExpanded && (
                <TouchableOpacity onPress={() => toggleFootnotes(lineIndex)}>
                  <Text style={styles.footnoteToggle}>Show footnotes</Text>
                </TouchableOpacity>
              )}

              <View style={styles.lineDivider} />
            </View>
          );
        }),
      )}
    </View>
  );
};

/** Render a single Hebrew word with highlighting and tap handler */
function renderHebrewWord(
  word: WordTiming,
  lineIndex: number,
  wordIndex: number,
  isCurrentLine: boolean,
  currentWordIndex: number,
  fontSizes: ReturnType<typeof getScaledFontSizes>,
  onWordTap: (li: number, wi: number) => void,
) {
  const isCurrentWord = isCurrentLine && wordIndex === currentWordIndex;
  return (
    <TouchableOpacity
      key={`he-${wordIndex}`}
      onPress={() => onWordTap(lineIndex, wordIndex)}
      activeOpacity={0.7}
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
}

/**
 * Renders synced two-column rows.
 * Words are chunked into groups of WORDS_PER_ROW. Each chunk becomes a row
 * with Hebrew on the left (right-justified) and transliteration (or English)
 * on the right (left-justified). Both sides always have the same words per row.
 */
function renderSyncedColumns(
  words: WordTiming[],
  lineIndex: number,
  isCurrentLine: boolean,
  currentWordIndex: number,
  fontSizes: ReturnType<typeof getScaledFontSizes>,
  onWordTap: (li: number, wi: number) => void,
  rightIsEnglish: boolean,
  englishText?: string,
) {
  // For Hebrew+English mode, we can't chunk English by word alignment —
  // show English as a single block in the right column
  if (rightIsEnglish) {
    return (
      <View style={styles.twoColumnRow}>
        <View style={styles.columnLeft}>
          <View style={styles.hebrewLineInColumn}>
            {words.map((word, wi) => (
              <View key={`he-${wi}`} style={styles.hebrewWordInRow}>
                {renderHebrewWord(word, lineIndex, wi, isCurrentLine, currentWordIndex, fontSizes, onWordTap)}
              </View>
            ))}
          </View>
        </View>
        <View style={styles.columnRight}>
          <Text style={[styles.columnEnglish, { fontSize: fontSizes.english }, isCurrentLine && styles.highlightedEnglish]}>
            {englishText}
          </Text>
        </View>
      </View>
    );
  }

  // Hebrew + Transliteration: chunk into synced rows
  const wordIndices = words.map((_, i) => i);
  const chunks = chunk(wordIndices, WORDS_PER_ROW);

  return (
    <View>
      {chunks.map((chunkIndices, chunkIdx) => (
        <View key={`chunk-${chunkIdx}`} style={styles.syncedRow}>
          {/* Hebrew side */}
          <View style={styles.syncedColumnLeft}>
            {chunkIndices.map((wi) => {
              const word = words[wi];
              const isCurrentWord = isCurrentLine && wi === currentWordIndex;
              return (
                <TouchableOpacity
                  key={`he-${wi}`}
                  onPress={() => onWordTap(lineIndex, wi)}
                  activeOpacity={0.7}
                  style={styles.syncedHebrewWord}
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

          {/* Transliteration side */}
          <View style={styles.syncedColumnRight}>
            {chunkIndices.map((wi) => {
              const word = words[wi];
              const isCurrentWord = isCurrentLine && wi === currentWordIndex;
              return (
                <Text
                  key={`tr-${wi}`}
                  style={[
                    styles.transliterationWord,
                    { fontSize: fontSizes.transliteration },
                    isCurrentWord && styles.highlightedTransliteration,
                    styles.syncedTranslitWord,
                  ]}
                >
                  {word.transliteration}
                </Text>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

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
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  currentLineContainer: {
    backgroundColor: 'rgba(49, 130, 206, 0.05)',
  },

  // ── Hebrew-only mode ──
  hebrewLineStandalone: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },

  // ── Synced two-column rows (Hebrew + Transliteration) ──
  syncedRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  syncedColumnLeft: {
    flex: 1,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    gap: 5,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  syncedColumnRight: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    gap: 4,
    paddingLeft: 8,
  },
  syncedHebrewWord: {
  },
  syncedTranslitWord: {
  },

  // ── Two-column (Hebrew + English) ──
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  columnLeft: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  columnRight: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  hebrewLineInColumn: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 6,
  },
  hebrewWordInRow: {
    // Wrapper for Hebrew word in column mode
  },

  // ── Word styles ──
  hebrewWord: {
    color: '#1A365D',
    fontWeight: '500',
    lineHeight: 24,
  },
  highlightedWord: {
    backgroundColor: '#FBD38D',
    color: '#744210',
    fontWeight: '700',
    borderRadius: 4,
    overflow: 'hidden',
  },
  transliterationWord: {
    color: '#718096',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  highlightedTransliteration: {
    color: '#975A16',
    fontWeight: '600',
    fontStyle: 'italic',
  },

  // ── English ──
  englishLine: {
    color: '#4A5568',
    lineHeight: 22,
    marginTop: 4,
    marginBottom: 2,
  },
  columnEnglish: {
    color: '#4A5568',
    lineHeight: 22,
  },
  highlightedEnglish: {
    color: '#2D3748',
    fontWeight: '500',
  },

  // ── Footnotes ──
  inlineFootnoteMarker: {
    color: '#3182CE',
    fontWeight: '700',
    fontSize: 11,
  },
  footnoteToggle: {
    fontSize: 12,
    color: '#3182CE',
    marginTop: 4,
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
