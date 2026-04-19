import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList, StyleSheet, SafeAreaView, View, Text, Pressable,
  InteractionManager,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { SHACHARIT_STRUCTURE } from '../data/shacharit/structure';
import { PARCHMENT, TIMING, SECTIONS, INK, type SectionId } from '../theme/shacharitTheme';
import SectionIntro from '../components/shacharit/SectionIntro';
import SectionDivider from '../components/shacharit/SectionDivider';
import PrayerBlock from '../components/shacharit/PrayerBlock';
import Halo from '../components/shacharit/Halo';
import { loadBundledPrayer } from '../data/shacharit/loadPrayer';
import { usePrayerStore } from '../store/prayerStore';
import { useHaloStore } from '../store/haloStore';
import ProgressRail from '../components/shacharit/ProgressRail';
import AppBar from '../components/shacharit/AppBar';
import { useSettingsStore } from '../store/settingsStore';
import WORD_COUNTS from '../data/bundled/shacharit/wordCounts.json';

// Build a flat item list without loading any prayer text. Each prayer's
// global word offset is derived from the pre-baked wordCounts.json so the
// tick loop and halo targeting work before any prayer JSON is parsed.
type Item =
  | { kind: 'intro'; key: string; sectionId: SectionId; isFirst: boolean }
  | { kind: 'prayer'; key: string; sectionId: SectionId; prayerId: string; startIdx: number; endIdx: number };

const ITEMS: Item[] = (() => {
  const out: Item[] = [];
  let running = 0;
  SHACHARIT_STRUCTURE.forEach((sec, secIdx) => {
    out.push({ kind: 'intro', key: `intro-${sec.id}`, sectionId: sec.id, isFirst: secIdx === 0 });
    sec.prayerIds.forEach(pid => {
      const wc = (WORD_COUNTS as Record<string, number>)[pid] ?? 0;
      const start = running;
      running += wc;
      out.push({ kind: 'prayer', key: `prayer-${pid}`, sectionId: sec.id, prayerId: pid, startIdx: start, endIdx: running });
    });
  });
  return out;
})();

const BOUNDS = ITEMS
  .filter((i): i is Extract<Item, { kind: 'prayer' }> => i.kind === 'prayer')
  .map(p => ({ prayerId: p.prayerId, sectionId: p.sectionId, start: p.startIdx, end: p.endIdx }));

const SECTION_ORDER_IDS: SectionId[] = ['birchot', 'pesukei', 'shema', 'concluding'];

// Fallback height estimate used only for items that haven't been laid out yet.
// Once an item renders, its measured height overrides this.
const EST_INTRO_HEIGHT = 360;
const EST_PX_PER_WORD = 18;
function estimatedHeight(item: Item): number {
  if (item.kind === 'intro') return EST_INTRO_HEIGHT;
  const wc = (WORD_COUNTS as Record<string, number>)[item.prayerId] ?? 0;
  return Math.max(140, wc * EST_PX_PER_WORD);
}

// Per-pair halo subscription (unchanged semantics).
function PairHalo({ idx, speed }: { idx: number; speed: number }) {
  const state = useHaloStore(s => {
    if (s.activeIdx === idx) return 'active' as const;
    if (s.recentlyActive.includes(idx)) return 'fading' as const;
    return 'idle' as const;
  });
  if (state === 'idle') return null;
  return <Halo state={state} speed={speed} />;
}

// One FlatList item = one prayer. Hebrew/translit/English text loads lazily
// the first time this item mounts (i.e., enters the virtualized window).
function PrayerItem({
  prayerId, sectionId, startIdx, onTapWord, renderHalo,
}: {
  prayerId: string;
  sectionId: SectionId;
  startIdx: number;
  onTapWord: (idx: number) => void;
  renderHalo: (idx: number) => React.ReactNode;
}) {
  const data = useMemo(() => {
    try {
      return loadBundledPrayer(prayerId);
    } catch (e) {
      console.error(`[ShacharitScrollScreen] Failed to load prayer "${prayerId}":`, e);
      return null;
    }
  }, [prayerId]);

  const spec = SECTIONS[sectionId];

  if (!data) {
    return (
      <View style={[styles.itemBg, { backgroundColor: spec.gradient[1] }]}>
        <View style={styles.itemInner}>
          <Text style={{ color: '#c0392b' }}>Failed to load prayer: {prayerId}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.itemBg}>
      <LinearGradient
        colors={[spec.gradient[0], spec.gradient[1]]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.itemInner}>
        <PrayerBlock
          prayerId={prayerId}
          sectionId={sectionId}
          englishName={data.englishName}
          hebrewName={data.hebrewName}
          hebrewText={data.hebrewText}
          translitText={data.translitText}
          englishText={data.englishText}
          startIdx={startIdx}
          onTapWord={onTapWord}
          renderHalo={renderHalo}
        />
      </View>
    </View>
  );
}

const PrayerItemMemo = React.memo(PrayerItem);

function IntroItem({ sectionId, isFirst }: { sectionId: SectionId; isFirst: boolean }) {
  const spec = SECTIONS[sectionId];
  return (
    <View style={styles.itemBg}>
      <LinearGradient
        colors={[spec.gradient[0], spec.gradient[1]]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.itemInner}>
        {!isFirst && <SectionDivider />}
        <SectionIntro sectionId={sectionId} />
      </View>
    </View>
  );
}

const IntroItemMemo = React.memo(IntroItem);

export default function ShacharitScrollScreen() {
  const navigation = useNavigation();
  const playing = usePrayerStore(s => s.shacharitPlaying);
  const speed   = usePrayerStore(s => s.shacharitSpeed);
  const lanes = useSettingsStore(s => s.displayLanes);
  const setDisplayLane = useSettingsStore(s => s.setDisplayLane);

  const listRef = useRef<FlatList<Item>>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('birchot');
  const [birdFraction, setBirdFraction] = useState(0);

  // Measured height of each item, by key. Populated via per-item onLayout.
  // Missing entries fall back to `estimatedHeight(item)`.
  const itemHeightsRef = useRef<Record<string, number>>({});
  const onItemHeight = useCallback((key: string, h: number) => {
    if (Math.abs((itemHeightsRef.current[key] ?? 0) - h) > 0.5) {
      itemHeightsRef.current[key] = h;
    }
  }, []);

  // Populate word bounds immediately — these come from the pre-baked wordCounts.json
  // and are already computed at module scope, so no prayer JSONs are parsed.
  useEffect(() => {
    usePrayerStore.getState().setShacharitBounds(BOUNDS);
  }, []);

  // Eagerly pre-parse the first section's prayers after the first paint lands.
  // This costs ~5 small JSONs instead of 15, and happens after interactions so
  // first paint stays snappy.
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      try {
        SHACHARIT_STRUCTURE[0]?.prayerIds.forEach(pid => loadBundledPrayer(pid));
      } catch {
        // errors surface per-item via PrayerItem's catch
      }
    });
    return () => task.cancel();
  }, []);

  // Tick loop — only runs while playing is true.
  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = (delay: number) => {
      timer = setTimeout(() => {
        if (cancelled) return;
        const result = usePrayerStore.getState().advanceShacharit();
        const nextIdx = usePrayerStore.getState().shacharitActiveWord;
        useHaloStore.getState().setActive(nextIdx);
        if (result === 'advanced') {
          const { CADENCE_MIN, CADENCE_JITTER } = TIMING;
          const currentSpeed = usePrayerStore.getState().shacharitSpeed;
          scheduleNext((CADENCE_MIN + Math.random() * CADENCE_JITTER) / currentSpeed);
        }
      }, delay);
    };

    scheduleNext(TIMING.INITIAL_DELAY / usePrayerStore.getState().shacharitSpeed);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [playing]);

  const togglePlay = useCallback(() => {
    const s = usePrayerStore.getState();
    if (!s.shacharitPlaying) {
      if (s.shacharitActiveWord !== null) {
        const cur = s.shacharitBounds.find(
          b => s.shacharitActiveWord! >= b.start && s.shacharitActiveWord! < b.end
        );
        if (cur && s.shacharitActiveWord === cur.end - 1) {
          s.jumpToNextPrayer();
          const newIdx = usePrayerStore.getState().shacharitActiveWord;
          useHaloStore.getState().setActive(newIdx);
        }
      } else {
        s.setShacharitActive(0);
        useHaloStore.getState().setActive(0);
      }
      s.setShacharitPlaying(true);
    } else {
      s.setShacharitPlaying(false);
    }
  }, []);

  const onTapWord = useCallback((idx: number) => {
    usePrayerStore.getState().setShacharitActive(idx);
    useHaloStore.getState().setActive(idx);
  }, []);

  const renderHalo = useCallback(
    (idx: number) => <PairHalo idx={idx} speed={speed} />,
    [speed]
  );

  const renderItem = useCallback(({ item }: { item: Item }) => {
    const body = item.kind === 'intro'
      ? <IntroItemMemo sectionId={item.sectionId} isFirst={item.isFirst} />
      : <PrayerItemMemo
          prayerId={item.prayerId}
          sectionId={item.sectionId}
          startIdx={item.startIdx}
          onTapWord={onTapWord}
          renderHalo={renderHalo}
        />;
    return (
      <View onLayout={(e) => onItemHeight(item.key, e.nativeEvent.layout.height)}>
        {body}
      </View>
    );
  }, [onTapWord, renderHalo, onItemHeight]);

  const keyExtractor = useCallback((item: Item) => item.key, []);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const scrollY = contentOffset.y;

    // Compute the absolute Y offset of each section's intro by walking ITEMS
    // and summing measured heights (falling back to estimates for items that
    // haven't rendered yet). Items render in order, so by the time scrollY
    // approaches a given section, all items above it have been measured.
    const sectionYs: Record<SectionId, number> = { birchot: 0, pesukei: 0, shema: 0, concluding: 0 };
    let y = 0;
    for (const item of ITEMS) {
      if (item.kind === 'intro') sectionYs[item.sectionId] = y;
      const h = itemHeightsRef.current[item.key] ?? estimatedHeight(item);
      y += h;
    }
    const totalContentH = Math.max(y, contentSize.height);

    // Identify the section that currently owns scrollY: largest intro Y ≤ scrollY.
    let secIdx = 0;
    for (let i = 0; i < SECTION_ORDER_IDS.length; i++) {
      if (sectionYs[SECTION_ORDER_IDS[i]] <= scrollY + 1) secIdx = i;
    }
    const currentId = SECTION_ORDER_IDS[secIdx];
    const nextId = SECTION_ORDER_IDS[secIdx + 1];
    const startY = sectionYs[currentId];
    const endY = nextId
      ? sectionYs[nextId]
      : Math.max(startY + 1, totalContentH - layoutMeasurement.height);
    const localFrac = Math.max(0, Math.min(1, (scrollY - startY) / Math.max(1, endY - startY)));

    // Rail segments are equal vertical slices, one per section.
    const railFrac = (secIdx + localFrac) / SECTION_ORDER_IDS.length;

    setActiveSection(prev => prev === currentId ? prev : currentId);
    setBirdFraction(prev => (Math.abs(prev - railFrac) > 0.001 ? railFrac : prev));
  }, []);

  const jumpToSection = useCallback((id: SectionId) => {
    const idx = ITEMS.findIndex(i => i.kind === 'intro' && i.sectionId === id);
    if (idx >= 0) listRef.current?.scrollToIndex({ index: idx, animated: true });
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        ref={listRef}
        data={ITEMS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onScroll={onScroll}
        scrollEventThrottle={16}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScrollToIndexFailed={({ index }) => {
          // Fallback when target layout isn't measured yet: approximate then retry.
          setTimeout(() => listRef.current?.scrollToIndex({ index, animated: true }), 50);
        }}
      />

      <Pressable
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Back to home"
      >
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path d="M15 18l-6-6 6-6" stroke={INK.strong} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <ProgressRail
          activeSection={activeSection}
          onJumpSection={jumpToSection}
          birdFraction={birdFraction}
        />
      </View>

      <AppBar
        lanes={lanes}
        onToggleLane={(l) => setDisplayLane(l, !lanes[l])}
        playing={playing}
        onTogglePlay={togglePlay}
        speed={speed}
        onSpeedChange={(v) => usePrayerStore.getState().setShacharitSpeed(v)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PARCHMENT },
  scroll: { paddingBottom: 120 },
  itemBg: { width: '100%', position: 'relative' },
  itemInner: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  backBtn: {
    position: 'absolute',
    top: 58,
    left: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,253,247,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2a1a0a',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});
