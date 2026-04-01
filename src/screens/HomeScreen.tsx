import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { getAvailableServices } from '../data/serviceRegistry';

type Props = StackScreenProps<RootStackParamList, 'Home'>;

const SERVICES = getAvailableServices();

/* eslint-disable @typescript-eslint/no-var-requires */
const headerImage = require('../../assets/images/kotel-header.jpg');

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView} bounces={false}>
        {/* Header image with text overlay and gradient fade */}
        <ImageBackground source={headerImage} style={styles.headerImage} resizeMode="cover">
          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.15)', '#FDFAF6']}
            locations={[0, 0.5, 1]}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <Text style={styles.titleEnglish}>Daven Along</Text>
              <Text style={styles.subtitle}>Follow along with the weekday siddur</Text>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* Service cards */}
        <View style={styles.serviceList}>
          {SERVICES.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[styles.serviceCard, !service.available && styles.serviceCardDisabled]}
              disabled={!service.available}
              onPress={() => navigation.navigate('PrayerList', { serviceId: service.id })}
            >
              <Text style={[styles.serviceHebrew, !service.available && styles.disabledText]}>
                {service.name.hebrew}
              </Text>
              <Text style={[styles.serviceEnglish, !service.available && styles.disabledText]}>
                {service.name.english}
              </Text>
              {!service.available && (
                <Text style={styles.comingSoon}>Coming Soon</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Fixed footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={20} color="#4A5568" />
          <Text style={styles.footerButtonText}>Settings</Text>
        </TouchableOpacity>
        <View style={styles.footerDivider} />
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => navigation.navigate('About')}
        >
          <Ionicons name="information-circle-outline" size={20} color="#4A5568" />
          <Text style={styles.footerButtonText}>About</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFAF6',
  },
  scrollView: {
    flex: 1,
  },
  headerImage: {
    width: '100%',
    height: 180,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  titleEnglish: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  serviceList: {
    paddingHorizontal: 20,
    paddingTop: 8,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  footerDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  footerButtonText: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
  },
});
