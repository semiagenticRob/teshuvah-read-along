// src/siddur/LearnScreen.tsx
import React, { useMemo } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS, INK, PARCHMENT } from '../theme/siddurTheme';
import { ESSAYS } from '../data/siddur/learn';
import { useSiddurProgress } from '../hooks/useSiddurProgress';
import type { LearnEssay } from './types';

interface Props { navigation: any; route: any; }

const ALL_ESSAYS: LearnEssay[] = Object.values(ESSAYS).map((load) => load());

function SectionHeader({ children }: { children: string }) {
  return <Text style={styles.sectionHeader}>{children}</Text>;
}

function EssayRow({ essay, onPress }: { essay: LearnEssay; onPress: () => void }) {
  return (
    <Pressable key={essay.id} onPress={onPress} style={styles.row}>
      <Text style={styles.rowTitle}>{essay.title.en}</Text>
      {essay.title.he ? <Text style={styles.rowHe}>{essay.title.he}</Text> : null}
    </Pressable>
  );
}

export default function LearnScreen({ navigation }: Props) {
  const { getProgress } = useSiddurProgress();

  const appendixEssays = useMemo(() => {
    return ALL_ESSAYS
      .filter((e) => e.essayKind === 'appendix')
      .sort((a, b) => {
        const numA = Number(a.id.match(/(\d+)/)?.[1] ?? 0);
        const numB = Number(b.id.match(/(\d+)/)?.[1] ?? 0);
        return numA - numB;
      });
  }, []);

  const rabbiEssays = useMemo(() => {
    return ALL_ESSAYS.filter(
      (e) => e.essayKind === 'personal_note' || e.essayKind === 'introduction',
    );
  }, []);

  const glossaryEssays = useMemo(() => {
    return ALL_ESSAYS.filter((e) => e.essayKind === 'glossary');
  }, []);

  const recentEssays = useMemo(() => {
    const shacharitProgress = getProgress('shacharit');
    const minchaProgress = getProgress('mincha');
    const sectionId =
      shacharitProgress?.sectionId ?? minchaProgress?.sectionId ?? null;
    if (!sectionId) return [];
    const matches = ALL_ESSAYS.filter((e) =>
      e.anchoredFrom.some((a) => a.sectionId === sectionId),
    );
    return matches.slice(0, 3);
  }, [getProgress]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerRow}>
        <Pressable onPress={navigation.goBack} hitSlop={8}>
          <Text style={styles.back}>‹ Home</Text>
        </Pressable>
        <Text style={styles.title}>Learn</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {recentEssays.length > 0 && (
          <>
            <SectionHeader>Recently relevant</SectionHeader>
            {recentEssays.map((essay) => (
              <EssayRow
                key={essay.id}
                essay={essay}
                onPress={() => navigation.navigate('Essay', { essayId: essay.id })}
              />
            ))}
          </>
        )}

        <SectionHeader>Essays from the siddur</SectionHeader>
        {appendixEssays.map((essay) => (
          <EssayRow
            key={essay.id}
            essay={essay}
            onPress={() => navigation.navigate('Essay', { essayId: essay.id })}
          />
        ))}

        <SectionHeader>From Rabbi Feigenbaum</SectionHeader>
        {rabbiEssays.map((essay) => (
          <EssayRow
            key={essay.id}
            essay={essay}
            onPress={() => navigation.navigate('Essay', { essayId: essay.id })}
          />
        ))}

        <SectionHeader>Glossary</SectionHeader>
        {glossaryEssays.map((essay) => (
          <EssayRow
            key={essay.id}
            essay={essay}
            onPress={() => navigation.navigate('Essay', { essayId: essay.id })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PARCHMENT },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { fontFamily: FONTS.serifBody, fontSize: 15, color: INK.soft },
  title: { fontFamily: FONTS.display, fontSize: 22, color: INK.strong },
  scroll: { paddingHorizontal: 20, paddingBottom: 64 },
  sectionHeader: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: INK.strong,
    marginTop: 24,
    marginBottom: 8,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  rowTitle: {
    fontFamily: FONTS.serifBody,
    fontSize: 15,
    color: INK.strong,
  },
  rowHe: {
    fontFamily: FONTS.hebrew,
    fontSize: 14,
    color: INK.soft,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 2,
  },
});
