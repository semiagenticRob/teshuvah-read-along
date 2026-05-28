// src/siddur/SiddurScrollScreen.tsx
import React, { useCallback, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BlockRenderer from './components/BlockRenderer';
import SiddurSectionIntroCard from './components/SiddurSectionIntroCard';
import SectionJumpSheet from './components/SectionJumpSheet';
import AppBar from '../components/shacharit/AppBar';
import { useKaraokeTickLoop } from './hooks/useKaraokeTickLoop';
import { getSiddurSection, listSectionIds } from '../data/siddur';
import { getCard } from '../data/siddur/cards';
import { useSiddurStore, SectionBounds } from '../store/siddurStore';
import { useSettingsStore } from '../store/settingsStore';
import { FONTS, INK, PARCHMENT } from '../theme/siddurTheme';
import type { CardId, SiddurSection, PrayerBlock, FaqBlock } from './types';

interface Props {
  route: { params: { cardId: CardId; sectionId?: string; wordIndex?: number } };
  navigation: any;
}

function computeBounds(sections: SiddurSection[]): SectionBounds[] {
  return sections.map((s) => {
    const prayers = s.blocks.filter((b): b is PrayerBlock => b.kind === 'prayer');
    if (prayers.length === 0) return { sectionId: s.id, start: 0, end: -1 };
    return {
      sectionId: s.id,
      start: prayers[0].wordIndexStart,
      end: prayers[prayers.length - 1].wordIndexEnd,
    };
  });
}

export default function SiddurScrollScreen({ route, navigation }: Props) {
  const { cardId } = route.params;
  const card = useMemo(() => getCard(cardId), [cardId]);
  const sections = useMemo(() => {
    return listSectionIds(cardId)
      .map((id) => getSiddurSection(cardId, id))
      .filter((s): s is SiddurSection => s !== null);
  }, [cardId]);

  const activeWordIndex = useSiddurStore((s) => s.activeWordIndex);
  const activeSectionId = useSiddurStore((s) => s.activeSectionId);
  const setActiveSection = useSiddurStore((s) => s.setActiveSection);
  const isPlaying = useSiddurStore((s) => s.isPlaying);
  const setIsPlaying = useSiddurStore((s) => s.setIsPlaying);
  const speed = useSiddurStore((s) => s.speed);
  const setSpeed = useSiddurStore((s) => s.setSpeed);
  const displayLanes = useSettingsStore((s) => s.displayLanes);
  const setDisplayLane = useSettingsStore((s) => s.setDisplayLane);

  useKaraokeTickLoop();

  const [jumpSheetVisible, setJumpSheetVisible] = React.useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const sectionLayoutsRef = React.useRef<Record<string, number>>({});

  // settingsStore exposes a `displayLanes: { hebrew, translit, english }` object.
  const showHebrew = useSettingsStore((s) => s.displayLanes.hebrew);
  const showTranslit = useSettingsStore((s) => s.displayLanes.translit);
  const showEnglish = useSettingsStore((s) => s.displayLanes.english);

  React.useEffect(() => {
    if (sections.length > 0) {
      setActiveSection(cardId, sections[0].id, computeBounds(sections));
    }
  }, [cardId, sections, setActiveSection]);

  const onLearnLinkPress = useCallback(
    (essayId: string) => {
      navigation.navigate('Essay', { essayId });
    },
    [navigation],
  );

  if (sections.length === 0) {
    return (
      <SafeAreaView style={styles.empty}>
        <Text style={styles.emptyTitle}>{cardId}</Text>
        <Text style={styles.emptyBody}>
          Content for this card hasn&apos;t been bundled yet. Plan B&apos;s content pipeline will fill this in.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={navigation.goBack} hitSlop={8}>
          <Text style={styles.back}>‹ Home</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {card.title.en}
        </Text>
        <Pressable onPress={() => setJumpSheetVisible(true)} hitSlop={8} style={styles.jumpButton}>
          <Text style={styles.jumpButtonText}>§</Text>
        </Pressable>
      </View>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scroll}>
        {sections.map((section, sectionIndex) => {
          // For the first section of a card, extract any intro callout blocks that
          // appear before the first prayer block and display them as a section intro card.
          const isFirst = sectionIndex === 0;
          let introBlocks: FaqBlock[] = [];
          let blocksToRender = section.blocks;

          if (isFirst) {
            const firstPrayerIdx = section.blocks.findIndex((b) => b.kind === 'prayer');
            if (firstPrayerIdx > 0) {
              const preBlocks = section.blocks.slice(0, firstPrayerIdx);
              introBlocks = preBlocks.filter(
                (b): b is FaqBlock =>
                  b.kind === 'faq' || b.kind === 'callout' || b.kind === 'instant_insight',
              );
              // Keep learn_links and other pre-prayer blocks in the render list
              blocksToRender = [
                ...preBlocks.filter((b) => b.kind !== 'faq' && b.kind !== 'callout' && b.kind !== 'instant_insight'),
                ...section.blocks.slice(firstPrayerIdx),
              ];
            }
          }

          return (
            <View
              key={section.id}
              onLayout={(e) => { sectionLayoutsRef.current[section.id] = e.nativeEvent.layout.y; }}
            >
              {isFirst ? (
                <SiddurSectionIntroCard
                  cardTitle={card.title}
                  sectionIndex={sectionIndex}
                  introBlocks={introBlocks}
                />
              ) : (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderHe}>{section.title.he}</Text>
                  <Text style={styles.sectionHeaderEn}>{section.title.en}</Text>
                </View>
              )}
              {blocksToRender.map((block, i) => (
                <BlockRenderer
                  key={i}
                  block={block}
                  activeWordIndex={activeWordIndex}
                  showHebrew={showHebrew}
                  showTranslit={showTranslit}
                  showEnglish={showEnglish}
                  onLearnLinkPress={onLearnLinkPress}
                />
              ))}
            </View>
          );
        })}
      </ScrollView>
      <SectionJumpSheet
        visible={jumpSheetVisible}
        sections={sections.map((s) => ({ id: s.id, title: s.title }))}
        activeSectionId={activeSectionId}
        onSelect={(sectionId) => {
          setJumpSheetVisible(false);
          const y = sectionLayoutsRef.current[sectionId];
          if (y !== undefined) {
            scrollViewRef.current?.scrollTo({ y, animated: true });
          }
        }}
        onClose={() => setJumpSheetVisible(false)}
      />
      <AppBar
        lanes={displayLanes}
        onToggleLane={(lane) => setDisplayLane(lane, !displayLanes[lane])}
        playing={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        speed={speed}
        onSpeedChange={setSpeed}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PARCHMENT },
  empty: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: PARCHMENT },
  emptyTitle: { fontFamily: FONTS.display, fontSize: 28, color: INK.strong, textTransform: 'capitalize' },
  emptyBody: { fontFamily: FONTS.serifBody, fontSize: 14, color: INK.soft, marginTop: 12, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { fontFamily: FONTS.serifBody, fontSize: 15, color: INK.soft },
  title: { fontFamily: FONTS.display, fontSize: 18, color: INK.strong, flex: 1, textAlign: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  jumpButton: { width: 60, alignItems: 'flex-end', justifyContent: 'center' },
  jumpButtonText: { fontFamily: FONTS.serifBody, fontSize: 20, color: INK.soft },
  sectionHeader: { marginTop: 16, marginBottom: 12, alignItems: 'center' },
  sectionHeaderHe: { fontFamily: FONTS.display, fontSize: 22, color: INK.strong, writingDirection: 'rtl' },
  sectionHeaderEn: { fontFamily: FONTS.serifBodyItalic, fontStyle: 'italic', fontSize: 13, color: INK.soft, marginTop: 4 },
});
