// src/siddur/components/FaqPanel.tsx
import React, { useCallback, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import ExpandablePanel from './ExpandablePanel';
import ItalicEnglishText from './ItalicEnglishText';
import { FONTS, INK, PARCHMENT } from '../../theme/siddurTheme';
import type { FaqBlock } from '../types';

interface Props {
  data: FaqBlock;
}

function iconFor(kind: FaqBlock['kind']): string {
  switch (kind) {
    case 'faq':
      return '❓';
    case 'instant_insight':
      return '💡';
    case 'callout':
      return '✦';
  }
}

function FaqPanel({ data }: Props) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const title =
    data.title ??
    (data.kind === 'faq'
      ? 'FAQ'
      : data.kind === 'instant_insight'
        ? 'Instant Insight'
        : 'Note');
  return (
    <View style={styles.wrap}>
      <Pressable onPress={toggle} style={styles.chip} hitSlop={8}>
        <Text style={styles.icon}>{iconFor(data.kind)}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.chevron}>{open ? '▾' : '▸'}</Text>
      </Pressable>
      <ExpandablePanel open={open}>
        <View style={styles.body}>
          {data.body.map((para, i) => (
            <ItalicEnglishText key={i} spans={para.spans} />
          ))}
        </View>
      </ExpandablePanel>
    </View>
  );
}

export default React.memo(FaqPanel);

const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PARCHMENT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  icon: { fontSize: 16, marginRight: 8 },
  title: { flex: 1, fontFamily: FONTS.serifBody, fontSize: 14, fontWeight: '600', color: INK.strong },
  chevron: { fontSize: 12, color: INK.soft },
  body: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },
});
