import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { DisplayMode, TextSize, PLAYBACK_SPEED_PRESETS } from '../types';

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
            {PLAYBACK_SPEED_PRESETS.map((speed) => (
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
});
