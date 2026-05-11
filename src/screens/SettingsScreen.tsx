import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import type { StackScreenProps } from '@react-navigation/stack';
import { useSettingsStore } from '../store/settingsStore';
import {
  DisplayMode,
  PLAYBACK_SPEED_PRESETS,
  PrayerSetSize,
  RootStackParamList,
  TextSize,
  UserTier,
} from '../types';
import { FONTS, INK, PARCHMENT, SECTIONS } from '../theme/shacharitTheme';

type Props = StackScreenProps<RootStackParamList, 'Settings'>;

const AMBER = SECTIONS.birchot;

const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  xlarge: 'Extra large',
};

const TIER_LABELS: Record<UserTier, { label: string; description: string }> = {
  new: { label: 'New to davening', description: 'Hebrew + transliteration + English, simplified set' },
  returning: { label: 'Returning', description: 'Hebrew + transliteration, full service' },
  fluent: { label: 'Fluent', description: 'Hebrew only, full service' },
};

const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  hebrew: 'Hebrew only',
  hebrew_translit: 'Hebrew + transliteration',
  hebrew_english: 'Hebrew + English',
  all: 'All three',
};

export const SettingsScreen: React.FC<Props> = () => {
  const store = useSettingsStore();
  const [showTierPicker, setShowTierPicker] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const handleManualLookup = async () => {
    const query = cityInput.trim();
    if (query.length < 2) return;
    setIsGeocoding(true);
    setGeocodeError(null);
    try {
      const results = await Location.geocodeAsync(query);
      if (results.length === 0) {
        setGeocodeError(`Couldn't find a location for "${query}".`);
        return;
      }
      const first = results[0];
      store.setLocation({
        latitude: first.latitude,
        longitude: first.longitude,
        label: query,
        source: 'manual',
      });
      setShowManualEntry(false);
      setCityInput('');
    } catch {
      setGeocodeError('Lookup failed. Try again or check your connection.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleUseDeviceLocation = async () => {
    setIsGeocoding(true);
    setGeocodeError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGeocodeError('Location permission denied. Try the city lookup above.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
      let label: string | undefined;
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        const place = places[0];
        if (place) label = [place.city, place.region].filter(Boolean).join(', ') || undefined;
      } catch {
        // best-effort
      }
      store.setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        label,
        source: 'device',
      });
    } catch {
      setGeocodeError("Couldn't read device location.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Redo onboarding?',
      'You’ll see the welcome screens again next time the app opens. Your existing settings stay until you change them.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => store.resetOnboarding() },
      ],
    );
  };

  const handleClearLocation = () => {
    Alert.alert(
      'Clear saved location?',
      'Zmanim will not show until you grant location again or add it manually.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => store.setLocation(null) },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Hero — current profile */}
      <View style={styles.hero}>
        <LinearGradient
          colors={AMBER.gradient}
          locations={AMBER.gradientStops}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.eyebrow}>Your siddur</Text>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Skill tier */}
      <Section title="Starting point" subtitle="Sets your default display + prayer set. You can override individual lanes below.">
        {showTierPicker ? (
          <View style={styles.tierList}>
            {(Object.keys(TIER_LABELS) as UserTier[]).map((tier) => (
              <Pressable
                key={tier}
                onPress={() => {
                  store.setUserTier(tier);
                  setShowTierPicker(false);
                }}
                style={({ pressed }) => [
                  styles.tierCard,
                  store.userTier === tier && styles.tierCardSelected,
                  pressed && styles.cardPressed,
                ]}
              >
                <Text style={styles.tierLabel}>{TIER_LABELS[tier].label}</Text>
                <Text style={styles.tierDescription}>{TIER_LABELS[tier].description}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setShowTierPicker(false)} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setShowTierPicker(true)}
            style={({ pressed }) => [styles.rowCard, pressed && styles.cardPressed]}
          >
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>{store.userTier ? TIER_LABELS[store.userTier].label : 'Not set'}</Text>
              {store.userTier && (
                <Text style={styles.rowDescription}>{TIER_LABELS[store.userTier].description}</Text>
              )}
            </View>
            <Text style={styles.rowAction}>Change</Text>
          </Pressable>
        )}
      </Section>

      {/* Display lanes */}
      <Section title="Display lanes" subtitle="Mix and match — at least one must stay on.">
        <LaneToggle label="Hebrew" value={store.displayLanes.hebrew} onChange={(v) => store.setDisplayLane('hebrew', v)} />
        <LaneToggle label="Transliteration" value={store.displayLanes.translit} onChange={(v) => store.setDisplayLane('translit', v)} />
        <LaneToggle label="English" value={store.displayLanes.english} onChange={(v) => store.setDisplayLane('english', v)} />
      </Section>

      {/* Prayer set size */}
      <Section title="Prayer set" subtitle="Simplified skips lengthy and optional sections.">
        <View style={styles.segmentedRow}>
          {(['simplified', 'full'] as PrayerSetSize[]).map((size) => (
            <Pressable
              key={size}
              onPress={() => store.setPrayerSetSize(size)}
              style={({ pressed }) => [
                styles.segment,
                store.prayerSetSize === size && styles.segmentSelected,
                pressed && styles.cardPressed,
              ]}
            >
              <Text style={[styles.segmentLabel, store.prayerSetSize === size && styles.segmentLabelSelected]}>
                {size === 'simplified' ? 'Simplified' : 'Full'}
              </Text>
            </Pressable>
          ))}
        </View>
      </Section>

      {/* Location */}
      <Section title="Location" subtitle="Used to show today's davening times. Stays on your device.">
        {store.location && !showManualEntry ? (
          <View style={styles.rowCard}>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>{store.location.label ?? 'Location set'}</Text>
              <Text style={styles.rowDescription}>
                {store.location.latitude.toFixed(3)}, {store.location.longitude.toFixed(3)} · {store.location.source === 'device' ? 'device' : 'manual'}
              </Text>
            </View>
            <Pressable onPress={handleClearLocation}>
              <Text style={styles.rowAction}>Clear</Text>
            </Pressable>
          </View>
        ) : null}

        {showManualEntry ? (
          <View style={styles.manualEntry}>
            <TextInput
              value={cityInput}
              onChangeText={setCityInput}
              placeholder="City, region or address"
              placeholderTextColor="rgba(90,72,53,0.5)"
              autoFocus
              autoCapitalize="words"
              returnKeyType="search"
              onSubmitEditing={handleManualLookup}
              editable={!isGeocoding}
              style={styles.manualInput}
            />
            {geocodeError && <Text style={styles.errorText}>{geocodeError}</Text>}
            <View style={styles.manualButtons}>
              <Pressable
                onPress={handleManualLookup}
                disabled={isGeocoding || cityInput.trim().length < 2}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (isGeocoding || cityInput.trim().length < 2) && styles.primaryButtonDisabled,
                  pressed && styles.cardPressed,
                ]}
              >
                {isGeocoding ? (
                  <ActivityIndicator color={PARCHMENT} size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Look up</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowManualEntry(false);
                  setGeocodeError(null);
                  setCityInput('');
                }}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.column}>
            {!store.location && (
              <View style={styles.rowCard}>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Not set</Text>
                  <Text style={styles.rowDescription}>Zmanim won't show until you add a location.</Text>
                </View>
              </View>
            )}
            <Pressable
              onPress={handleUseDeviceLocation}
              disabled={isGeocoding}
              style={({ pressed }) => [styles.rowCard, pressed && styles.cardPressed]}
            >
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>{isGeocoding ? 'Reading…' : 'Use device location'}</Text>
                <Text style={styles.rowDescription}>Asks for permission, then reads your current position.</Text>
              </View>
              <Text style={styles.rowAction}>{isGeocoding ? '…' : 'Use'}</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowManualEntry(true)}
              style={({ pressed }) => [styles.rowCard, pressed && styles.cardPressed]}
            >
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Enter a city</Text>
                <Text style={styles.rowDescription}>Type a city or address; we'll look up coordinates.</Text>
              </View>
              <Text style={styles.rowAction}>Enter</Text>
            </Pressable>
            {geocodeError && <Text style={styles.errorText}>{geocodeError}</Text>}
          </View>
        )}
      </Section>

      {/* Text size */}
      <Section title="Text size">
        <View style={styles.segmentedRow}>
          {(Object.keys(TEXT_SIZE_LABELS) as TextSize[]).map((size) => (
            <Pressable
              key={size}
              onPress={() => store.setTextSize(size)}
              style={({ pressed }) => [
                styles.segment,
                store.textSize === size && styles.segmentSelected,
                pressed && styles.cardPressed,
              ]}
            >
              <Text style={[styles.segmentLabel, store.textSize === size && styles.segmentLabelSelected]}>
                {TEXT_SIZE_LABELS[size]}
              </Text>
            </Pressable>
          ))}
        </View>
      </Section>

      {/* Display mode (legacy enum — kept for any consumer still reading it) */}
      <Section title="Display preset" subtitle="Quick preset, overridden by the lane toggles above.">
        <View style={styles.column}>
          {(Object.keys(DISPLAY_MODE_LABELS) as DisplayMode[]).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => store.setDisplayMode(mode)}
              style={({ pressed }) => [
                styles.rowCard,
                store.displayMode === mode && styles.rowCardSelected,
                pressed && styles.cardPressed,
              ]}
            >
              <Text style={styles.rowLabel}>{DISPLAY_MODE_LABELS[mode]}</Text>
              {store.displayMode === mode && <Text style={styles.rowAction}>Selected</Text>}
            </Pressable>
          ))}
        </View>
      </Section>

      {/* Playback speed */}
      <Section title="Default playback speed">
        <View style={styles.segmentedRow}>
          {PLAYBACK_SPEED_PRESETS.map((speed) => (
            <Pressable
              key={speed}
              onPress={() => store.setDefaultSpeed(speed)}
              style={({ pressed }) => [
                styles.segment,
                store.defaultSpeed === speed && styles.segmentSelected,
                pressed && styles.cardPressed,
              ]}
            >
              <Text style={[styles.segmentLabel, store.defaultSpeed === speed && styles.segmentLabelSelected]}>
                {speed}x
              </Text>
            </Pressable>
          ))}
        </View>
      </Section>

      {/* Reset onboarding */}
      <Section title="Reset">
        <Pressable
          onPress={handleResetOnboarding}
          style={({ pressed }) => [styles.dangerButton, pressed && styles.cardPressed]}
        >
          <Text style={styles.dangerButtonText}>Redo onboarding</Text>
        </Pressable>
      </Section>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, subtitle, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

interface LaneToggleProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

const LaneToggle: React.FC<LaneToggleProps> = ({ label, value, onChange }) => (
  <View style={styles.laneRow}>
    <Text style={styles.laneLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ true: AMBER.accent, false: 'rgba(0,0,0,0.18)' }}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PARCHMENT },
  scrollContent: { paddingBottom: 32 },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  eyebrow: {
    fontFamily: FONTS.serifBody,
    fontSize: 11,
    letterSpacing: 3.0,
    textTransform: 'uppercase',
    color: AMBER.accent,
    marginBottom: 6,
  },
  title: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 32,
    color: INK.strong,
  },

  section: { paddingHorizontal: 24, marginTop: 22 },
  sectionTitle: {
    fontFamily: FONTS.serifBody,
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: AMBER.accent,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: INK.faint,
    marginBottom: 10,
    lineHeight: 19,
  },
  sectionBody: { gap: 8 },
  column: { gap: 6 },

  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,253,247,0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,80,20,0.12)',
  },
  rowCardSelected: {
    borderColor: AMBER.accent,
    backgroundColor: 'rgba(176,122,28,0.10)',
  },
  rowContent: { flex: 1, paddingRight: 12 },
  rowLabel: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 17,
    color: INK.strong,
  },
  rowDescription: {
    fontFamily: FONTS.serifBody,
    fontSize: 12,
    color: INK.soft,
    marginTop: 3,
  },
  rowAction: {
    fontFamily: FONTS.serifBody,
    fontSize: 11,
    letterSpacing: 2.0,
    textTransform: 'uppercase',
    color: AMBER.accent,
  },

  tierList: { gap: 10 },
  tierCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,253,247,0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,80,20,0.12)',
  },
  tierCardSelected: {
    borderColor: AMBER.accent,
    borderWidth: 2,
    backgroundColor: 'rgba(176,122,28,0.10)',
  },
  tierLabel: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 18,
    color: INK.strong,
  },
  tierDescription: {
    fontFamily: FONTS.serifBody,
    fontSize: 12,
    color: INK.soft,
    marginTop: 3,
  },

  segmentedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segment: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,253,247,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(120,80,20,0.12)',
  },
  segmentSelected: {
    backgroundColor: INK.strong,
    borderColor: INK.strong,
  },
  segmentLabel: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: INK.soft,
  },
  segmentLabelSelected: {
    color: PARCHMENT,
  },

  laneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,253,247,0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,80,20,0.12)',
  },
  laneLabel: {
    fontFamily: FONTS.serifBody,
    fontSize: 15,
    color: INK.strong,
  },

  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: INK.soft,
  },

  dangerButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(170,40,40,0.4)',
    backgroundColor: 'rgba(170,40,40,0.06)',
    alignItems: 'center',
  },
  dangerButtonText: {
    fontFamily: FONTS.serifBody,
    fontSize: 14,
    color: '#8a1717',
    letterSpacing: 0.5,
  },

  cardPressed: { opacity: 0.78 },

  manualEntry: {
    backgroundColor: 'rgba(255,253,247,0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,80,20,0.12)',
    padding: 14,
    gap: 10,
  },
  manualInput: {
    fontFamily: FONTS.serifBody,
    fontSize: 15,
    color: INK.strong,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(120,80,20,0.18)',
    backgroundColor: PARCHMENT,
  },
  manualButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: INK.strong,
    alignItems: 'center',
  },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonText: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 15,
    color: PARCHMENT,
  },
  errorText: {
    fontFamily: FONTS.serifBody,
    fontSize: 12,
    color: '#8a1717',
    marginTop: 2,
  },
});
