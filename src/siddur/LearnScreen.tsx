// src/siddur/LearnScreen.tsx
import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS, INK, PARCHMENT } from '../theme/siddurTheme';

interface Props { navigation: any; route: any; }

function SectionHeader({ children }: { children: string }) {
  return <Text style={styles.sectionHeader}>{children}</Text>;
}

export default function LearnScreen({ navigation }: Props) {
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
        <SectionHeader>Essays from the siddur</SectionHeader>
        <Text style={styles.emptyNote}>Content for Learn hasn't been bundled yet. Plan B's content pipeline will fill this in.</Text>

        <SectionHeader>From Rabbi Feigenbaum</SectionHeader>
        <Text style={styles.emptyNote}>Personal notes and introductions will appear here.</Text>

        <SectionHeader>Glossary</SectionHeader>
        <Text style={styles.emptyNote}>Glossary not yet bundled.</Text>
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
  emptyNote: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: INK.soft,
  },
});
