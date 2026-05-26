import React from 'react';
import { View, StyleSheet } from 'react-native';
import WordPair from './WordPair';
import { pairWords } from '../../utils/pairWords';
import type { BundledPrayerSegment } from '../../data/bundled/shacharit';

interface Props {
  prayerId: string;
  lineIndex: number;
  hebrew: string;
  translit: string;
  showHebrew: boolean;
  showTranslit: boolean;
  /** Flat global word offset for the first word on this line. */
  lineGlobalStart: number;
  onTapWord: (globalIdx: number) => void;
  renderHalo: (globalIdx: number) => React.ReactNode;
  segment?: BundledPrayerSegment;
  accent: string;
}

function LineRow(p: Props) {
  const pairs = React.useMemo(
    () => pairWords(p.hebrew, p.translit),
    [p.hebrew, p.translit],
  );

  const direction = p.showHebrew ? 'rtl' : 'ltr';

  return (
    <View style={styles.lineWrap}>
      <View style={[styles.pairs, { direction } as object]}>
        {pairs.map((pair, i) => (
          <View key={i} style={styles.pairAndMarker}>
            <WordPair
              hebrew={pair.hebrew}
              translit={pair.translit}
              showHebrew={p.showHebrew}
              showTranslit={p.showTranslit}
              idx={p.lineGlobalStart + i}
              onTapWord={p.onTapWord}
              renderHalo={p.renderHalo}
            />
          </View>
        ))}
      </View>
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
  pairAndMarker: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
