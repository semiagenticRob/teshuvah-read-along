// src/siddur/EssayScreen.tsx
import React, { useMemo } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS, INK, PARCHMENT } from '../theme/siddurTheme';
import { ESSAYS } from '../data/siddur/learn';
import ItalicEnglishText from './components/ItalicEnglishText';
import type { LearnEssay } from './types';

interface Props {
  navigation: any;
  route: { params: { essayId: string; returnTo?: any } };
}

export default function EssayScreen({ navigation, route }: Props) {
  const { essayId } = route.params;

  const essay: LearnEssay | null = useMemo(() => {
    const loader = ESSAYS[essayId as keyof typeof ESSAYS];
    return loader ? loader() : null;
  }, [essayId]);

  if (!essay) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.headerRow}>
          <Pressable onPress={navigation.goBack} hitSlop={8}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>{essayId}</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.emptyNote}>Essay not found.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerRow}>
        <Pressable onPress={navigation.goBack} hitSlop={8}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>{essay.title.en}</Text>
          {essay.essayKind === 'glossary' && essay.title.he ? (
            <Text style={styles.titleHe}>{essay.title.he}</Text>
          ) : null}
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {essay.body.map((para, i) => (
          <ItalicEnglishText
            key={i}
            spans={para.spans}
            baseStyle={styles.bodyText}
          />
        ))}

        {essay.anchoredFrom.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedHeader}>While davening, this is relevant during:</Text>
            {essay.anchoredFrom.map((anchor, i) => (
              <Pressable
                key={i}
                onPress={() =>
                  navigation.navigate('SiddurScroll', {
                    cardId: anchor.cardId,
                    sectionId: anchor.sectionId,
                  })
                }
                style={styles.anchorRow}
              >
                <Text style={styles.anchorText}>{anchor.cardId} · {anchor.sectionId}</Text>
              </Pressable>
            ))}
          </View>
        )}
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
  titleBlock: { flex: 1, alignItems: 'center' },
  back: { fontFamily: FONTS.serifBody, fontSize: 15, color: INK.soft },
  title: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: INK.strong,
    textAlign: 'center',
  },
  titleHe: {
    fontFamily: FONTS.hebrew,
    fontSize: 14,
    color: INK.soft,
    writingDirection: 'rtl',
    textAlign: 'center',
    marginTop: 2,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 64 },
  bodyText: {
    fontFamily: FONTS.serifBody,
    fontSize: 15,
    lineHeight: 24,
    color: INK.strong,
    marginBottom: 14,
  },
  emptyNote: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: INK.soft,
    marginTop: 24,
  },
  relatedSection: { marginTop: 8 },
  relatedHeader: {
    fontFamily: FONTS.display,
    fontSize: 16,
    color: INK.strong,
    marginTop: 28,
    marginBottom: 8,
  },
  anchorRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  anchorText: {
    fontFamily: FONTS.serifBody,
    fontSize: 14,
    color: INK.soft,
  },
});
