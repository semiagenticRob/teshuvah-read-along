import React from 'react';
import { ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { SHACHARIT_STRUCTURE } from '../data/shacharit/structure';
import { PARCHMENT } from '../theme/shacharitTheme';
import SectionBlock from '../components/shacharit/SectionBlock';
import SectionIntro from '../components/shacharit/SectionIntro';
import PrayerBlock from '../components/shacharit/PrayerBlock';
import { loadBundledPrayer } from '../data/shacharit/loadPrayer';

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

export default function ShacharitScrollScreen() {
  // Placeholder callbacks — Phase 7/8 replace these
  const onTapWord = (_idx: number) => {};
  const renderHalo = (_idx: number) => null;

  return (
    <SafeAreaView style={styles.root}>
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
