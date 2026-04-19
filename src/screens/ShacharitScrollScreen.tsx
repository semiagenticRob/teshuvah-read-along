import React from 'react';
import { ScrollView, StyleSheet, SafeAreaView, View, Pressable, Text } from 'react-native';
import { SHACHARIT_STRUCTURE } from '../data/shacharit/structure';
import { PARCHMENT, TIMING } from '../theme/shacharitTheme';
import SectionBlock from '../components/shacharit/SectionBlock';
import SectionIntro from '../components/shacharit/SectionIntro';
import PrayerBlock from '../components/shacharit/PrayerBlock';
import { loadBundledPrayer } from '../data/shacharit/loadPrayer';
import { useHaloStore } from '../store/haloStore';
import Halo from '../components/shacharit/Halo';

// Precompute flat prayer list with global word start indices.
// Done at module load — cheap pure work, deterministic.
interface LoadedPrayer {
  id: string;
  sectionId: import('../theme/shacharitTheme').SectionId;
  data: ReturnType<typeof loadBundledPrayer>;
  startIdx: number;
}

const PRAYERS: LoadedPrayer[] = (() => {
  const arr: LoadedPrayer[] = [];
  let running = 0;
  SHACHARIT_STRUCTURE.forEach(sec => {
    sec.prayerIds.forEach(pid => {
      const data = loadBundledPrayer(pid);
      arr.push({ id: pid, sectionId: sec.id, data, startIdx: running });
      const hebrewWordCount = data.hebrewText.trim().split(/\s+/).filter(Boolean).length;
      running += hebrewWordCount;
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
  // onTapWord remains a placeholder — Phase 8 wires it to the store's active word
  const onTapWord = (_idx: number) => {};

  const speed = TIMING.SPEED_DEFAULT; // Phase 8 swaps this for the store's speed
  const renderHalo = (idx: number) => <PairHalo idx={idx} speed={speed} />;

  return (
    <SafeAreaView style={styles.root}>
      {/* TEMPORARY — Phase 7.3 dev controls, removed when play button replaces them in Phase 8 */}
      <View style={{ flexDirection: 'row', gap: 8, padding: 8, backgroundColor: 'rgba(0,0,0,0.05)' }}>
        <Pressable
          onPress={() => {
            const cur = useHaloStore.getState().activeIdx ?? -1;
            useHaloStore.getState().setActive(cur + 1);
          }}
          style={{ padding: 8, backgroundColor: '#b07a1c', borderRadius: 6 }}
        >
          <Text style={{ color: '#fffcf3', fontSize: 12 }}>DEV · Advance halo</Text>
        </Pressable>
        <Pressable
          onPress={() => useHaloStore.getState().setActive(null)}
          style={{ padding: 8, backgroundColor: '#2a1d12', borderRadius: 6 }}
        >
          <Text style={{ color: '#fffcf3', fontSize: 12 }}>DEV · Reset</Text>
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
  scroll: { paddingVertical: 20 },
});
