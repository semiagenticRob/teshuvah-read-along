import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Linking,
} from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { DisplayMode, TextSize, PlaybackSpeed, PLAYBACK_SPEEDS } from '../types';

const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Extra Large' },
];

const DISPLAY_MODES: { value: DisplayMode; label: string; description: string }[] = [
  { value: 'hebrew', label: 'Hebrew Only', description: 'Show only Hebrew text' },
  { value: 'hebrew_translit', label: 'Hebrew + Transliteration', description: 'Hebrew with pronunciation guide' },
  { value: 'hebrew_english', label: 'Hebrew + English', description: 'Hebrew with translation' },
  { value: 'all', label: 'All Three', description: 'Hebrew, transliteration, and English' },
];

export const SettingsScreen: React.FC = () => {
  const {
    textSize,
    displayMode,
    defaultSpeed,
    setTextSize,
    setDisplayMode,
    setDefaultSpeed,
  } = useSettingsStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Text Size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text Size</Text>
          <View style={styles.optionRow}>
            {TEXT_SIZES.map((size) => (
              <TouchableOpacity
                key={size.value}
                style={[styles.optionButton, textSize === size.value && styles.optionSelected]}
                onPress={() => setTextSize(size.value)}
              >
                <Text style={[styles.optionLabel, textSize === size.value && styles.optionLabelSelected]}>
                  {size.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Display Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Mode</Text>
          {DISPLAY_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.value}
              style={[styles.modeCard, displayMode === mode.value && styles.modeCardSelected]}
              onPress={() => setDisplayMode(mode.value)}
            >
              <Text style={[styles.modeLabel, displayMode === mode.value && styles.modeLabelSelected]}>
                {mode.label}
              </Text>
              <Text style={styles.modeDescription}>{mode.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Default Playback Speed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Playback Speed</Text>
          <View style={styles.optionRow}>
            {PLAYBACK_SPEEDS.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[styles.optionButton, defaultSpeed === speed && styles.optionSelected]}
                onPress={() => setDefaultSpeed(speed)}
              >
                <Text style={[styles.optionLabel, defaultSpeed === speed && styles.optionLabelSelected]}>
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
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
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionSelected: {
    backgroundColor: '#3182CE',
    borderColor: '#3182CE',
  },
  optionLabel: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: '#FFFFFF',
  },
  modeCard: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  modeCardSelected: {
    borderColor: '#3182CE',
    borderWidth: 2,
    backgroundColor: '#EBF8FF',
  },
  modeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
  },
  modeLabelSelected: {
    color: '#2B6CB0',
  },
  modeDescription: {
    fontSize: 13,
    color: '#718096',
    marginTop: 2,
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
