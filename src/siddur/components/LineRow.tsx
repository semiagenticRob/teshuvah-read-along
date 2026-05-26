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
  const showAnyKaraoke = showHebrew || showTranslit;
  const hasKaraokeContent = !!hebrewLine && showAnyKaraoke;

  return (
    <View style={styles.lineWrap}>
      {hasKaraokeContent && (
        <View style={styles.pairs}>
          {hebrewLine!.words.map((word, i) => {
            const translitText = translitLine?.words[i]?.text ?? null;
            return (
              <WordPair
                key={`${word.globalIndex}-${i}`}
                hebrew={word.text}
                translit={translitText ?? ''}
                showHebrew={showHebrew}
                showTranslit={showTranslit && translitText !== null}
                idx={word.globalIndex}
                onTapWord={undefined}
                renderHalo={undefined}
                isActive={activeWordIndex !== null && word.globalIndex === activeWordIndex}
              />
            );
          })}
        </View>
      )}
      {showEnglish && englishParagraph && (
        // TODO(Plan A Task 10): swap this for <ItalicEnglishText spans={englishParagraph.spans} />
        // which will render italic interpretive spans with the dedicated font.
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
  pairs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
    columnGap: 14,
    alignItems: 'flex-end',
  },
  english: {
    fontFamily: FONTS.serifBody,
    fontSize: 15,
    lineHeight: 23,
    color: INK.strong,
    marginTop: 6,
  },
});
