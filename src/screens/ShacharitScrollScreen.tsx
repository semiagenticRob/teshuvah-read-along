import React from 'react';
import { ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { SHACHARIT_STRUCTURE } from '../data/shacharit/structure';
import { PARCHMENT } from '../theme/shacharitTheme';
import SectionBlock from '../components/shacharit/SectionBlock';
import SectionIntro from '../components/shacharit/SectionIntro';

export default function ShacharitScrollScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {SHACHARIT_STRUCTURE.map((sec, idx) => (
          <SectionBlock key={sec.id} sectionId={sec.id} isFirst={idx === 0}>
            <SectionIntro sectionId={sec.id} />
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
