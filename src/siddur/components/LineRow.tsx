// src/siddur/components/LineRow.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import WordPair from './WordPair';
import { FONTS, INK } from '../../theme/siddurTheme';
import type { HebrewLine, TranslitLine, EnglishParagraph } from '../types';

interface Props {
  hebrewLine?: HebrewLine;
  translitLine?: TranslitLine;
  englishParagraph?: EnglishParagraph;
  activeWordIndex: number | null;
  showHebrew: boolean;
  showTranslit: boolean;
  showEnglish: boolean;
}

function LineRow({
  hebrewLine,
  translitLine,
  englishParagraph,
  activeWordIndex,
  showHebrew,
  showTranslit,
  showEnglish,
}: Props) {
  return (
    <View style={styles.lineWrap}>
      {showHebrew && hebrewLine && (
        <Text style={styles.hebrewLine}>
          {hebrewLine.words.map((word, i) => (
            <Text
              key={`${word.globalIndex}-${i}`}
              style={activeWordIndex === word.globalIndex ? styles.hebrewActive : styles.hebrewWord}
            >
              {word.text}{i < hebrewLine.words.length - 1 ? ' ' : ''}
            </Text>
          ))}
        </Text>
      )}
      {showTranslit && !showHebrew && hebrewLine && (
        <View style={styles.translitRow}>
          {hebrewLine.words.map((word, i) => {
            const translitText = translitLine?.words[i]?.text ?? null;
            if (!translitText) return null;
            return (
              <WordPair
                key={`${word.globalIndex}-${i}`}
                hebrew={null}
                translit={translitText}
                showHebrew={false}
                showTranslit={true}
                idx={word.globalIndex}
                isActive={activeWordIndex === word.globalIndex}
              />
            );
          })}
        </View>
      )}
      {showTranslit && showHebrew && hebrewLine && translitLine && (
        <Text style={styles.translitLine}>
          {translitLine.words.map((tw, i) => (
            <Text key={i} style={styles.translitWord}>{tw.text}{i < translitLine.words.length - 1 ? ' ' : ''}</Text>
          ))}
        </Text>
      )}
      {showEnglish && englishParagraph && (
        <Text style={styles.english}>
          {englishParagraph.spans.map((s) => s.text).join('')}
        </Text>
      )}
    </View>
  );
}

export default React.memo(LineRow);

const styles = StyleSheet.create({
  lineWrap: {
    marginVertical: 4,
  },
  hebrewLine: {
    fontFamily: FONTS.hebrew,
    fontSize: 24,
    lineHeight: 36,
    color: INK.strong,
    writingDirection: 'rtl',
    textAlign: 'right',
    width: '100%',
  },
  hebrewWord: {
    color: INK.strong,
  },
  hebrewActive: {
    color: '#b07a1c',
  },
  translitLine: {
    fontFamily: FONTS.serifBodyItalic,
    fontSize: 11,
    lineHeight: 16,
    color: INK.faint,
    textAlign: 'right',
    fontStyle: 'italic',
    width: '100%',
    marginTop: 2,
  },
  translitWord: {
    color: INK.faint,
  },
  translitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  english: {
    fontFamily: FONTS.serifBody,
    fontSize: 15,
    lineHeight: 23,
    color: INK.strong,
    marginTop: 6,
  },
});
