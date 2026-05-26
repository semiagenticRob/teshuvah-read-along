// src/siddur/components/PrayerBlock.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import LineRow from './LineRow';
import type { PrayerBlock as PrayerBlockData } from '../types';

interface Props {
  data: PrayerBlockData;
  activeWordIndex: number | null;
  showHebrew: boolean;
  showTranslit: boolean;
  showEnglish: boolean;
}

function PrayerBlock({ data, activeWordIndex, showHebrew, showTranslit, showEnglish }: Props) {
  return (
    <View style={styles.block}>
      {data.he.map((line, i) => {
        const translit = data.translit?.[i];
        const english = data.en.find((p) => p.anchorLine === line.lineIndex);
        return (
          <LineRow
            key={line.lineIndex}
            hebrewLine={line}
            translitLine={translit}
            englishParagraph={english}
            activeWordIndex={activeWordIndex}
            showHebrew={showHebrew}
            showTranslit={showTranslit}
            showEnglish={showEnglish}
          />
        );
      })}
      {/* English paragraphs not bound to a specific line render below */}
      {data.en
        .filter((p) => p.anchorLine === undefined)
        .map((para, i) => (
          <LineRow
            key={`unbound-${i}`}
            englishParagraph={para}
            activeWordIndex={null}
            showHebrew={false}
            showTranslit={false}
            showEnglish={showEnglish}
          />
        ))}
    </View>
  );
}

export default React.memo(PrayerBlock);

const styles = StyleSheet.create({
  block: {
    marginVertical: 12,
  },
});
