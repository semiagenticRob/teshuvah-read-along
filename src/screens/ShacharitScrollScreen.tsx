import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, SafeAreaView, View, Pressable, Text } from 'react-native';
import { SHACHARIT_STRUCTURE } from '../data/shacharit/structure';
import { PARCHMENT, TIMING, INK } from '../theme/shacharitTheme';
import SectionBlock from '../components/shacharit/SectionBlock';
import SectionIntro from '../components/shacharit/SectionIntro';
import PrayerBlock from '../components/shacharit/PrayerBlock';
import Halo from '../components/shacharit/Halo';
import { loadBundledPrayer } from '../data/shacharit/loadPrayer';
import { usePrayerStore } from '../store/prayerStore';
import { useHaloStore } from '../store/haloStore';

// Precompute flat prayer list with global word start/end indices.
// Done at module load — cheap pure work, deterministic.
interface LoadedPrayer {
  id: string;
  sectionId: import('../theme/shacharitTheme').SectionId;
  data: ReturnType<typeof loadBundledPrayer>;
  startIdx: number;
  endIdx: number;
}

const PRAYERS: LoadedPrayer[] = (() => {
  const arr: LoadedPrayer[] = [];
  let running = 0;
  SHACHARIT_STRUCTURE.forEach(sec => {
    sec.prayerIds.forEach(pid => {
      const data = loadBundledPrayer(pid);
      const start = running;
      const wordCount = data.hebrewText.trim().split(/\s+/).filter(Boolean).length;
      running += wordCount;
      arr.push({ id: pid, sectionId: sec.id, data, startIdx: start, endIdx: running });
    });
  });
  return arr;
})();

// Declared at module scope so it is never re-created on each render of the screen.
// Per-pair subscription: only pairs whose idx matches activeIdx or sits in the
// trail window re-render when haloStore changes.
function PairHalo({ idx, speed }: { idx: number; speed: number }) {
  const activeIdx = useHaloStore(s => s.activeIdx);
  const trail     = useHaloStore(s => s.recentlyActive);
  const state =
    idx === activeIdx ? 'active' :
    trail.includes(idx) ? 'fading' :
    'idle';
  return <Halo state={state} speed={speed} />;
}

export default function ShacharitScrollScreen() {
  const playing = usePrayerStore(s => s.shacharitPlaying);
  const speed   = usePrayerStore(s => s.shacharitSpeed);

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

    // Initial delay before first tick
    scheduleNext(TIMING.INITIAL_DELAY / speed);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [playing, speed]);

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

  const renderHalo = (idx: number) => <PairHalo idx={idx} speed={speed} />;

  return (
    <SafeAreaView style={styles.root}>
      {/* TEMPORARY — will be replaced by Phase 10 AppBar */}
      <View style={styles.tempBar}>
        <Pressable onPress={togglePlay} style={styles.playBtn}>
          <Text style={styles.playText}>{playing ? '⏸ Pause' : '▶ Play'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {SHACHARIT_STRUCTURE.map((sec, idx) => (
          <SectionBlock key={sec.id} sectionId={sec.id} isFirst={idx === 0}>
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
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PARCHMENT },
  scroll: { paddingVertical: 20, paddingBottom: 120 },
  tempBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: 'rgba(255,253,247,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  playBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: INK.strong,
  },
  playText: { color: PARCHMENT, fontSize: 14, fontWeight: '500' },
});
