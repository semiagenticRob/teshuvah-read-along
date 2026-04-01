import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type Props = StackScreenProps<RootStackParamList, 'Home'>;

const SERVICES = [
  {
    id: 'shacharit',
    hebrew: 'שחרית',
    english: 'Shacharit (Morning)',
    available: true,
  },
  {
    id: 'mincha',
    hebrew: 'מנחה',
    english: 'Mincha (Afternoon)',
    available: false,
  },
  {
    id: 'maariv',
    hebrew: 'מעריב',
    english: "Ma'ariv (Evening)",
    available: false,
  },
  {
    id: 'birkat_hamazon',
    hebrew: 'ברכת המזון',
    english: 'Birkat Hamazon (Grace After Meals)',
    available: false,
  },
];

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.titleHebrew}>תשובה</Text>
        <Text style={styles.titleEnglish}>Teshuvah Read-Along</Text>
        <Text style={styles.subtitle}>Follow along with the weekday siddur</Text>
      </View>

      <View style={styles.serviceList}>
        {SERVICES.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[styles.serviceCard, !service.available && styles.serviceCardDisabled]}
            disabled={!service.available}
            onPress={() => navigation.navigate('PrayerList', { serviceId: service.id })}
          >
            <Text style={[styles.serviceHebrew, !service.available && styles.disabledText]}>
              {service.hebrew}
            </Text>
            <Text style={[styles.serviceEnglish, !service.available && styles.disabledText]}>
              {service.english}
            </Text>
            {!service.available && (
              <Text style={styles.comingSoon}>Coming Soon</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.settingsText}>Settings</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFAF6',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  titleHebrew: {
    fontSize: 42,
    fontWeight: '700',
    color: '#1A365D',
    marginBottom: 4,
  },
  titleEnglish: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2D4A7A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
  },
  serviceList: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceCardDisabled: {
    opacity: 0.5,
  },
  serviceHebrew: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A365D',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  serviceEnglish: {
    fontSize: 16,
    color: '#4A5568',
  },
  disabledText: {
    color: '#A0AEC0',
  },
  comingSoon: {
    fontSize: 12,
    color: '#A0AEC0',
    fontStyle: 'italic',
    marginTop: 4,
  },
  settingsButton: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
  },
  settingsText: {
    fontSize: 16,
    color: '#2D4A7A',
    fontWeight: '500',
  },
});
