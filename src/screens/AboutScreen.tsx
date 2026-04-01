import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Linking,
} from 'react-native';

export const AboutScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* About */}
        <View style={styles.section}>
          <Text style={styles.aboutText}>
            Daven Along helps ba'alei teshuvah follow along with the
            weekday siddur by providing synchronized audio with word-by-word
            highlighting in Hebrew, transliteration, and English.
          </Text>
          <Text style={styles.aboutText}>
            Nusach: Ashkenaz
          </Text>
          <Text style={styles.versionText}>Version 0.1.0</Text>
        </View>

        {/* Sources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sources</Text>

          <View style={styles.sourceCard}>
            <Text style={styles.sourceTitle}>Sefaria</Text>
            <Text style={styles.sourceDescription}>
              Hebrew prayer texts, English translations, and commentary.
              Open-source library of Jewish texts.
            </Text>
            <Text
              style={styles.sourceLink}
              onPress={() => Linking.openURL('https://www.sefaria.org')}
            >
              sefaria.org
            </Text>
          </View>

          <View style={styles.sourceCard}>
            <Text style={styles.sourceTitle}>Read-Along Siddur</Text>
            <Text style={styles.sourceDescription}>
              Hebrew prayer audio recordings. Used with permission.
            </Text>
            <Text style={styles.sourceCredits}>Created by Adam Moskowitz</Text>
            <Text style={styles.sourceCredits}>Audio by Ari Hoffman and Shimon Stroll</Text>
            <Text style={styles.sourceCredits}>Technical and design by Lev Lawrence, Jonah Lawrence, and Raphael Lawrence</Text>
            <Text
              style={styles.sourceLink}
              onPress={() => Linking.openURL('https://readalongsiddur.com')}
            >
              readalongsiddur.com
            </Text>
          </View>

          <View style={styles.sourceCard}>
            <Text style={styles.sourceTitle}>Metsudah Siddur</Text>
            <Text style={styles.sourceDescription}>
              English translations and footnotes sourced via Sefaria.
              Metsudah Publications' linear translation of the Siddur.
            </Text>
          </View>

          <View style={styles.sourceCard}>
            <Text style={styles.sourceTitle}>Transliteration</Text>
            <Text style={styles.sourceDescription}>
              Generated using Ashkenazi pronunciation conventions.
              The Tetragrammaton (Name of God) is always rendered as "Adonai."
            </Text>
          </View>

          <View style={styles.sourceCard}>
            <Text style={styles.sourceTitle}>Header Image</Text>
            <Text style={styles.sourceDescription}>
              Western Wall photograph by Bruno Aguirre on Unsplash.
            </Text>
            <Text
              style={styles.sourceLink}
              onPress={() => Linking.openURL('https://unsplash.com/photos/TgUs0JOtXZA')}
            >
              View on Unsplash
            </Text>
          </View>

          <Text style={styles.disclaimerText}>
            This app is intended as a learning aid and is not a substitute for
            guidance from a qualified rabbi or teacher.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFAF6',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A365D',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 22,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 8,
  },
  sourceCard: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  sourceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  sourceDescription: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 20,
  },
  sourceCredits: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 20,
    marginTop: 2,
  },
  sourceLink: {
    fontSize: 13,
    color: '#3182CE',
    marginTop: 4,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#A0AEC0',
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 8,
  },
});
