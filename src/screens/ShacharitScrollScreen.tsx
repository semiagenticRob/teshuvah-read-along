import React from 'react';
import { ScrollView, View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { SHACHARIT_STRUCTURE } from '../data/shacharit/structure';
import { PARCHMENT, INK } from '../theme/shacharitTheme';

export default function ShacharitScrollScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {SHACHARIT_STRUCTURE.map(sec => (
          <View key={sec.id} style={styles.placeholder}>
            <Text style={styles.label}>{sec.id}</Text>
            <Text style={styles.ids}>{sec.prayerIds.join(' · ')}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PARCHMENT },
  scroll: { paddingVertical: 20 },
  placeholder: { padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)' },
  label: { fontSize: 20, color: INK.strong, marginBottom: 6 },
  ids: { fontSize: 13, color: INK.faint },
});
