import React from 'react';
import { ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { SHACHARIT_STRUCTURE } from '../data/shacharit/structure';
import { PARCHMENT } from '../theme/shacharitTheme';
import SectionBlock from '../components/shacharit/SectionBlock';
import SectionIntro from '../components/shacharit/SectionIntro';
import PrayerBlock from '../components/shacharit/PrayerBlock';
import { loadBundledPrayer } from '../data/shacharit/loadPrayer';

export default function ShacharitScrollScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {SHACHARIT_STRUCTURE.map((sec, idx) => (
          <SectionBlock key={sec.id} sectionId={sec.id} isFirst={idx === 0}>
            <SectionIntro sectionId={sec.id} />
            {sec.prayerIds.map(pid => {
              const data = loadBundledPrayer(pid);
              return (
                <PrayerBlock
                  key={pid}
                  prayerId={pid}
                  sectionId={sec.id}
                  englishName={data.englishName}
                  hebrewName={data.hebrewName}
                  hebrewText={data.hebrewText}
                  translitText={data.translitText}
                  englishText={data.englishText}
                />
              );
            })}
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
