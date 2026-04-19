import React, { useCallback, useEffect } from 'react';
import { ScrollView, StyleSheet, SafeAreaView, View, Text } from 'react-native';
import { SHACHARIT_STRUCTURE } from '../data/shacharit/structure';
import { PARCHMENT, TIMING, SECTIONS } from '../theme/shacharitTheme';
import SectionBlock from '../components/shacharit/SectionBlock';
import SectionIntro from '../components/shacharit/SectionIntro';
import PrayerBlock from '../components/shacharit/PrayerBlock';
import Halo from '../components/shacharit/Halo';
import { loadBundledPrayer } from '../data/shacharit/loadPrayer';
import { usePrayerStore } from '../store/prayerStore';
import { useHaloStore } from '../store/haloStore';
import { useShacharitScroll } from '../hooks/useShacharitScroll';
import ProgressRail from '../components/shacharit/ProgressRail';
import BirdMarker from '../components/shacharit/BirdMarker';
import AppBar from '../components/shacharit/AppBar';
import { useSettingsStore } from '../store/settingsStore';

// Precompute flat prayer list with global word start/end indices.
// Done at module load — cheap pure work, deterministic.
interface LoadedPrayer {
  id: string;
  sectionId: import('../theme/shacharitTheme').SectionId;
  data: ReturnType<typeof loadBundledPrayer>;
  startIdx: number;
  endIdx: number;
}

const PRAYER_LOAD_ERROR: string[] = [];

const PRAYERS: LoadedPrayer[] = (() => {
  const arr: LoadedPrayer[] = [];
  let running = 0;
  SHACHARIT_STRUCTURE.forEach(sec => {
    sec.prayerIds.forEach(pid => {
      try {
        const data = loadBundledPrayer(pid);
        const start = running;
        const wordCount = data.hebrewText.trim().split(/\s+/).filter(Boolean).length;
        running += wordCount;
        arr.push({ id: pid, sectionId: sec.id, data, startIdx: start, endIdx: running });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        PRAYER_LOAD_ERROR.push(`${pid}: ${msg}`);
        // eslint-disable-next-line no-console
        console.error(`[ShacharitScrollScreen] Failed to load prayer "${pid}":`, e);
      }
    });
  });
  return arr;
})();

// Declared at module scope so it is never re-created on each render of the screen.
// Per-pair subscription: only pairs whose idx matches activeIdx or sits in the
// trail window re-render when haloStore changes.
function PairHalo({ idx, speed }: { idx: number; speed: number }) {
  const state = useHaloStore(s => {
    if (s.activeIdx === idx) return 'active' as const;
    if (s.recentlyActive.includes(idx)) return 'fading' as const;
    return 'idle' as const;
  });
  // Idle halos never mount — saves 800+ Animated.Views
  if (state === 'idle') return null;
  return <Halo state={state} speed={speed} />;
}

export default function ShacharitScrollScreen() {
  const playing = usePrayerStore(s => s.shacharitPlaying);
  const speed   = usePrayerStore(s => s.shacharitSpeed);
  const lanes = useSettingsStore(s => s.displayLanes);
  const setDisplayLane = useSettingsStore(s => s.setDisplayLane);

  const { scrollRef, onScroll, onSectionLayout, activeSection, birdFraction, jumpToSection } = useShacharitScroll();

  // Guard: if any prayers failed to load at module init, show a diagnostic screen.
  // This surfaces runtime errors (e.g. bad JSON, missing require) that Metro can't
  // catch at bundle time but that would otherwise produce a silent blank screen.
  if (PRAYER_LOAD_ERROR.length > 0 || PRAYERS.length === 0) {
    return (
      <SafeAreaView style={[styles.root, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ fontSize: 16, color: '#c0392b', fontWeight: '600', marginBottom: 8 }}>
          Prayer load error
        </Text>
        <Text style={{ fontSize: 13, color: '#333', textAlign: 'center' }}>
          {PRAYER_LOAD_ERROR.length > 0
            ? PRAYER_LOAD_ERROR.join('\n')
            : 'No prayers were loaded. Check the console for details.'}
        </Text>
      </SafeAreaView>
    );
  }

  // Populate bounds once on mount.
  useEffect(() => {
    usePrayerStore.getState().setShacharitBounds(
      PRAYERS.map(p => ({ prayerId: p.id, sectionId: p.sectionId, start: p.startIdx, end: p.endIdx }))
    );
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
        // prayer-boundary: advanceShacharit already set playing=false; effect will unsubscribe
      }, delay);
    };

    // Initial delay before first tick, reading fresh from store
    scheduleNext(TIMING.INITIAL_DELAY / usePrayerStore.getState().shacharitSpeed);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  // Only restart the loop when play toggles; speed changes are read fresh
  // from the store at each tick, so they don't require effect restart.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const togglePlay = () => {
    const s = usePrayerStore.getState();
    if (!s.shacharitPlaying) {
      // If we're parked at a prayer's last word, jump forward first
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
        // No active word yet — start from global index 0
        s.setShacharitActive(0);
        useHaloStore.getState().setActive(0);
      }
      s.setShacharitPlaying(true);
    } else {
      s.setShacharitPlaying(false);
    }
  };

  const onTapWord = (idx: number) => {
    usePrayerStore.getState().setShacharitActive(idx);
    useHaloStore.getState().setActive(idx);
  };

  const renderHalo = useCallback(
    (idx: number) => <PairHalo idx={idx} speed={speed} />,
    [speed]
  );

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scroll}
      >
        {SHACHARIT_STRUCTURE.map((sec, idx) => (
          <View
            key={sec.id}
            onLayout={e => onSectionLayout(sec.id, e.nativeEvent.layout.y, e.nativeEvent.layout.height)}
          >
            <SectionBlock sectionId={sec.id} isFirst={idx === 0}>
              <SectionIntro sectionId={sec.id} />
              {PRAYERS.filter(p => p.sectionId === sec.id).map(p => (
                <PrayerBlock
                  key={p.id}
                  prayerId={p.id}
                  sectionId={p.sectionId}
                  englishName={p.data.englishName}
                  hebrewName={p.data.hebrewName}
                  hebrewText={p.data.hebrewText}
                  translitText={p.data.translitText}
                  englishText={p.data.englishText}
                  startIdx={p.startIdx}
                  onTapWord={onTapWord}
                  renderHalo={renderHalo}
                />
              ))}
            </SectionBlock>
          </View>
        ))}
      </ScrollView>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <ProgressRail
          activeSection={activeSection}
          onJumpSection={jumpToSection}
          birdFraction={birdFraction}
          renderBird={() => <BirdMarker color={SECTIONS[activeSection].accent} />}
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
  scroll: { paddingVertical: 20, paddingBottom: 120 },
});
