import React from 'react';
import { View, StyleSheet } from 'react-native';
import WordPair from './WordPair';
import { pairWords } from '../../utils/pairWords';

interface Props {
  hebrew: string;
  translit: string;
  showHebrew: boolean;
  showTranslit: boolean;
  prayerStartIdx: number;
  onTapWord: (globalIdx: number) => void;
  renderHalo: (globalIdx: number) => React.ReactNode;
}

function PairRow({
  hebrew, translit, showHebrew, showTranslit,
  prayerStartIdx, onTapWord, renderHalo,
}: Props) {
  const pairs = React.useMemo(() => pairWords(hebrew, translit), [hebrew, translit]);
  const direction = showHebrew ? 'rtl' : 'ltr';
  return (
    <View style={[styles.row, { direction } as any]}>
      {pairs.map((p, i) => (
        <WordPair
          key={i}
          hebrew={p.hebrew}
          translit={p.translit}
          showHebrew={showHebrew}
          showTranslit={showTranslit}
          onPress={() => onTapWord(prayerStartIdx + i)}
          renderHalo={() => renderHalo(prayerStartIdx + i)}
        />
      ))}
    </View>
  );
}

export default React.memo(PairRow);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
    columnGap: 14,
    marginVertical: 6,
  },
});
