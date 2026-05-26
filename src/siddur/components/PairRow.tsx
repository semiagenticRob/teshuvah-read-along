import React from 'react';
import { View } from 'react-native';
import LineRow from './LineRow';
import type { BundledCommentary, BundledPrayerSegment } from '../../data/bundled/shacharit';

interface Props {
  prayerId: string;
  hebrewLines: string[];
  translitLines: string[];
  showHebrew: boolean;
  showTranslit: boolean;
  prayerStartIdx: number;
  onTapWord: (globalIdx: number) => void;
  renderHalo: (globalIdx: number) => React.ReactNode;
  commentary?: BundledCommentary[];
  segments?: BundledPrayerSegment[];
  accent: string;
}

function PairRow(p: Props) {
  // Pre-compute per-line cumulative global word offsets so halos and word-sync
  // keep their stable global word index even with line-aware rendering.
  const lineOffsets = React.useMemo(() => {
    const offsets: number[] = [];
    let running = 0;
    for (let i = 0; i < p.hebrewLines.length; i++) {
      offsets.push(running);
      const h = p.hebrewLines[i]?.trim().split(/\s+/).filter(Boolean).length ?? 0;
      const t = p.translitLines[i]?.trim().split(/\s+/).filter(Boolean).length ?? 0;
      running += Math.max(h, t);
    }
    return offsets;
  }, [p.hebrewLines, p.translitLines]);

  // Index commentary by (lineIndex, wordIndex). wordIndex `undefined` → line-level (-1).
  const commentaryByLine = React.useMemo(() => {
    const map = new Map<number, Map<number, BundledCommentary>>();
    for (const c of p.commentary ?? []) {
      let lineMap = map.get(c.lineIndex);
      if (!lineMap) {
        lineMap = new Map();
        map.set(c.lineIndex, lineMap);
      }
      lineMap.set(c.wordIndex ?? -1, c);
    }
    return map;
  }, [p.commentary]);

  const segmentByLine = React.useMemo(() => {
    const map = new Map<number, BundledPrayerSegment>();
    for (const s of p.segments ?? []) {
      map.set(s.lineIndex, s);
    }
    return map;
  }, [p.segments]);

  return (
    <View>
      {p.hebrewLines.map((hebrew, lineIdx) => (
        <LineRow
          key={lineIdx}
          prayerId={p.prayerId}
          lineIndex={lineIdx}
          hebrew={hebrew}
          translit={p.translitLines[lineIdx] ?? ''}
          showHebrew={p.showHebrew}
          showTranslit={p.showTranslit}
          lineGlobalStart={p.prayerStartIdx + (lineOffsets[lineIdx] ?? 0)}
          onTapWord={p.onTapWord}
          renderHalo={p.renderHalo}
          segment={segmentByLine.get(lineIdx)}
          commentaryByWord={commentaryByLine.get(lineIdx)}
          accent={p.accent}
        />
      ))}
    </View>
  );
}

export default React.memo(PairRow);
