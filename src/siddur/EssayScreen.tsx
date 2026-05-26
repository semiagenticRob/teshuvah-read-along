// src/siddur/EssayScreen.tsx
import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS, INK, PARCHMENT } from '../theme/siddurTheme';

interface Props {
  navigation: any;
  route: { params: { essayId: string; returnTo?: any } };
}

export default function EssayScreen({ navigation, route }: Props) {
  const { essayId } = route.params;
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerRow}>
        <Pressable onPress={navigation.goBack} hitSlop={8}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{essayId}</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.emptyNote}>
          Essay content not yet bundled. Plan B's content pipeline will fill this in.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PARCHMENT },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  back: { fontFamily: FONTS.serifBody, fontSize: 15, color: INK.soft },
  title: { fontFamily: FONTS.display, fontSize: 18, color: INK.strong, flex: 1, textAlign: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 64 },
  emptyNote: { fontFamily: FONTS.serifBodyItalic, fontStyle: 'italic', fontSize: 13, color: INK.soft, marginTop: 24 },
});
