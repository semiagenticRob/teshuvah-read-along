import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import type { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import { onboardingStyles as s } from './onboardingStyles';

type Props = StackScreenProps<RootStackParamList, 'LocationPermission'>;

export const LocationPermissionScreen: React.FC<Props> = ({ navigation }) => {
  const setLocation = useSettingsStore((state) => state.setLocation);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAllow = async () => {
    setIsRequesting(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError("We'll continue without location — you can add it later in Settings.");
        finish();
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Lowest,
      });

      let label: string | undefined;
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        const place = places[0];
        if (place) {
          label = [place.city, place.region].filter(Boolean).join(', ') || undefined;
        }
      } catch {
        // reverse geocode is best-effort
      }

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        label,
        source: 'device',
      });
      finish();
    } catch {
      setError("We couldn't read your location — continuing without it.");
      finish();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    finish();
  };

  const finish = () => {
    navigation.navigate('TranslationPhilosophy');
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.center}>
        <View>
          <Text style={s.eyebrow}>Almost there</Text>
          <Text style={s.title}>When should you daven?</Text>
          <Text style={s.subtitle}>
            We'll show today's davening times based on where you are. The location stays on your device.
          </Text>

          {error && (
            <Text style={[s.footerNote, { textAlign: 'left', marginTop: 0, marginBottom: 8 }]}>
              {error}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable
            disabled={isRequesting}
            style={({ pressed }) => [s.primaryButton, pressed && s.primaryButtonPressed]}
            onPress={handleAllow}
          >
            {isRequesting ? (
              <ActivityIndicator color="#f6e9d2" />
            ) : (
              <Text style={s.primaryButtonText}>Use my location</Text>
            )}
          </Pressable>
          <Pressable style={s.secondaryButton} onPress={handleSkip} disabled={isRequesting}>
            <Text style={s.secondaryButtonText}>Skip for now</Text>
          </Pressable>
          <Text style={s.footerNote}>We never share your location.</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 28,
  },
  actions: {
    gap: 4,
  },
});
