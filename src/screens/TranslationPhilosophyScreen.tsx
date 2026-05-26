// src/screens/TranslationPhilosophyScreen.tsx
import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS, INK, PARCHMENT } from '../theme/siddurTheme';

interface Props {
  onComplete?: () => void;
  mode: 'onboarding' | 'settings';
  navigation?: any;
}

export default function TranslationPhilosophyScreen({ onComplete, mode, navigation }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      {mode === 'settings' && navigation && (
        <View style={styles.headerRow}>
          <Pressable onPress={navigation.goBack} hitSlop={8}>
            <Text style={styles.back}>‹ Settings</Text>
          </Pressable>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>About this translation</Text>
        <Text style={styles.body}>
          Rabbi Feigenbaum's translation isn't literal — it aims to convey the essence of each tefillah and help you have a real conversation with Hashem. You'll see <Text style={styles.italic}>italicized words</Text> in the English; those are additions to make the meaning clearer, not part of the literal Hebrew.
        </Text>

        <View style={styles.example}>
          <Text style={styles.exampleHe}>אַשְׁרֵי יוֹשְׁבֵי בֵיתֶךָ</Text>
          <Text style={styles.exampleEn}>
            Happy are those who <Text style={styles.italic}>(wherever they are)</Text> are living in the house of Hashem.
          </Text>
        </View>

        <Text style={styles.subhead}>A few specific word choices to know:</Text>
        <View style={styles.choice}>
          <Text style={styles.choiceHebrew}>בָּרוּךְ</Text>
          <Text style={styles.choiceEn}>"You, Hashem, are the Source of everything"</Text>
        </View>
        <View style={styles.choice}>
          <Text style={styles.choiceHebrew}>קָדוֹשׁ</Text>
          <Text style={styles.choiceEn}>"You, Hashem, are separate and removed from this physical world"</Text>
        </View>
        <View style={styles.choice}>
          <Text style={styles.choiceHebrew}>שֵׁם</Text>
          <Text style={styles.choiceEn}>"the impact and presence of Hashem in the world"</Text>
        </View>

        <Text style={styles.footer}>A full glossary is available under <Text style={styles.bold}>Learn</Text>.</Text>

        {mode === 'onboarding' && (
          <Pressable onPress={onComplete} style={styles.cta} hitSlop={8}>
            <Text style={styles.ctaLabel}>Got it</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PARCHMENT },
  headerRow: { paddingHorizontal: 16, paddingVertical: 10 },
  back: { fontFamily: FONTS.serifBody, fontSize: 15, color: INK.soft },
  scroll: { paddingHorizontal: 22, paddingVertical: 24, paddingBottom: 64 },
  title: { fontFamily: FONTS.display, fontSize: 26, color: INK.strong, marginBottom: 16 },
  body: { fontFamily: FONTS.serifBody, fontSize: 15, lineHeight: 24, color: INK.strong },
  italic: { fontFamily: FONTS.serifBodyItalic, fontStyle: 'italic' },
  bold: { fontFamily: FONTS.serifBody, fontWeight: '700' },
  example: { marginVertical: 18, padding: 12, borderLeftWidth: 2, borderLeftColor: INK.faint },
  exampleHe: { fontFamily: FONTS.hebrew, fontSize: 22, color: INK.strong, writingDirection: 'rtl', textAlign: 'right' },
  exampleEn: { fontFamily: FONTS.serifBody, fontSize: 14, color: INK.soft, marginTop: 6 },
  subhead: { fontFamily: FONTS.display, fontSize: 16, color: INK.strong, marginTop: 16, marginBottom: 10 },
  choice: { marginBottom: 12 },
  choiceHebrew: { fontFamily: FONTS.hebrew, fontSize: 20, color: INK.strong, writingDirection: 'rtl', textAlign: 'right' },
  choiceEn: { fontFamily: FONTS.serifBody, fontSize: 13, color: INK.soft, marginTop: 2 },
  footer: { fontFamily: FONTS.serifBody, fontSize: 14, color: INK.soft, marginTop: 18 },
  cta: { marginTop: 28, backgroundColor: INK.strong, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  ctaLabel: { fontFamily: FONTS.serifBody, fontSize: 15, fontWeight: '600', color: PARCHMENT },
});
