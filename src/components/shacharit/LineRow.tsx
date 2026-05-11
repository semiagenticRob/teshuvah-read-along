import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import WordPair from './WordPair';
import FootnoteMarker from './FootnoteMarker';
import FootnotePanel from './FootnotePanel';
import MinyanOnlyMarker from './MinyanOnlyMarker';
import { pairWords } from '../../utils/pairWords';
import { footnoteKey, useFootnoteStore } from '../../store/footnoteStore';
import type { BundledCommentary, BundledPrayerSegment } from '../../data/bundled/shacharit';

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
  /** Commentary entries anchored to this line, keyed by wordIndex (`-1` = whole line). */
  commentaryByWord?: Map<number, BundledCommentary>;
  accent: string;
}

function LineRow(p: Props) {
  const openKey = useFootnoteStore((s) => s.openKey);
  const toggle = useFootnoteStore((s) => s.toggle);

  const pairs = React.useMemo(
    () => pairWords(p.hebrew, p.translit),
    [p.hebrew, p.translit],
  );

  const onMarkerPress = useCallback(
    (wordIndex: number) => toggle(footnoteKey(p.prayerId, p.lineIndex, wordIndex)),
    [toggle, p.prayerId, p.lineIndex],
  );

  // Minyan-only segment fully replaces the line content.
  if (p.segment?.minyanOnly) {
    return <MinyanOnlyMarker label={p.segment.minyanLabel} accent={p.accent} />;
  }

  const lineLevelCommentary = p.commentaryByWord?.get(-1);
  const lineLevelKey = footnoteKey(p.prayerId, p.lineIndex, undefined);
  const isLineLevelOpen = openKey === lineLevelKey;

  // Determine which word (if any) currently has its panel open on this line.
  let activeWordIndex: number | null = null;
  if (p.commentaryByWord) {
    for (const wordIdx of p.commentaryByWord.keys()) {
      if (wordIdx < 0) continue;
      const key = footnoteKey(p.prayerId, p.lineIndex, wordIdx);
      if (openKey === key) {
        activeWordIndex = wordIdx;
        break;
      }
    }
  }

  const direction = p.showHebrew ? 'rtl' : 'ltr';

  return (
    <View style={styles.lineWrap}>
      <View style={[styles.pairs, { direction } as object]}>
        {pairs.map((pair, i) => {
          const commentary = p.commentaryByWord?.get(i);
          const markerKey = commentary ? footnoteKey(p.prayerId, p.lineIndex, i) : null;
          const isOpen = markerKey != null && openKey === markerKey;
          return (
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
              {commentary && (
                <FootnoteMarker
                  marker={commentary.marker}
                  accent={p.accent}
                  isOpen={isOpen}
                  onPress={() => onMarkerPress(i)}
                />
              )}
            </View>
          );
        })}
        {lineLevelCommentary && (
          <FootnoteMarker
            marker={lineLevelCommentary.marker}
            accent={p.accent}
            isOpen={isLineLevelOpen}
            onPress={() => toggle(lineLevelKey)}
          />
        )}
      </View>

      {/* Footnote panel for whichever marker on this line is active. */}
      <FootnotePanel
        commentary={
          activeWordIndex != null
            ? p.commentaryByWord?.get(activeWordIndex) ?? null
            : isLineLevelOpen
              ? lineLevelCommentary ?? null
              : null
        }
        accent={p.accent}
        isOpen={activeWordIndex != null || isLineLevelOpen}
      />
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
