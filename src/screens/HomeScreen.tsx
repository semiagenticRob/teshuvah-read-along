import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { getAvailableServices } from '../data/serviceRegistry';
import { FONTS, INK, PARCHMENT, SECTIONS } from '../theme/shacharitTheme';

type Props = StackScreenProps<RootStackParamList, 'Home'>;

const SERVICES = getAvailableServices();
const headerImage = require('../../assets/images/kotel-header.jpg');

// Shared amber/gold palette from the Shacharit "birchot" section so Home
// feels like the opening page of the same siddur.
const AMBER = SECTIONS.birchot;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView} bounces={false} contentContainerStyle={styles.scrollContent}>
        {/* Faded Western Wall header with amber tint fading into parchment */}
        <View style={styles.headerWrap}>
          <ImageBackground source={headerImage} style={styles.headerImage} imageStyle={styles.headerImageInner} resizeMode="cover">
            <LinearGradient
              colors={['rgba(246,233,210,0.25)', 'rgba(236,209,151,0.55)', PARCHMENT]}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.headerContent}>
              <Text style={styles.eyebrow}>A Weekday Siddur</Text>
              <Text style={styles.titleEnglish}>Daven Along</Text>
              <Text style={styles.subtitle}>Follow along with the weekday siddur</Text>
            </View>
          </ImageBackground>
        </View>

        {/* Service cards */}
        <View style={styles.serviceList}>
          {SERVICES.map((service) => (
            <Pressable
              key={service.id}
              disabled={!service.available}
              onPress={() =>
                service.id === 'shacharit'
                  ? navigation.navigate('ShacharitScroll')
                  : navigation.navigate('PrayerList', { serviceId: service.id })
              }
              style={({ pressed }) => [
                styles.serviceCard,
                !service.available && styles.serviceCardDisabled,
                pressed && service.available && styles.serviceCardPressed,
              ]}
            >
              <LinearGradient
                colors={AMBER.gradient}
                locations={AMBER.gradientStops}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.accentBar, { backgroundColor: AMBER.accent }]} />
              <View style={styles.serviceInner}>
                <View style={styles.serviceLeft}>
                  <Text style={[styles.serviceEyebrow, { color: AMBER.accent }]}>{service.eyebrow}</Text>
                  <Text style={styles.serviceEnglish}>{service.name.english}</Text>
                  <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
                  {!service.available && (
                    <Text style={[styles.comingSoon, { color: AMBER.accent }]}>Coming Soon</Text>
                  )}
                </View>
                <Text style={styles.serviceHebrew}>{service.name.hebrew}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Floating pill footer — mirrors the Shacharit AppBar */}
      <View style={styles.footer} pointerEvents="box-none">
        <Pressable style={styles.footerButton} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={17} color={INK.strong} />
          <Text style={styles.footerButtonText}>Settings</Text>
        </Pressable>
        <View style={styles.footerDivider} />
        <Pressable style={styles.footerButton} onPress={() => navigation.navigate('About')}>
          <Ionicons name="information-circle-outline" size={17} color={INK.strong} />
          <Text style={styles.footerButtonText}>About</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PARCHMENT,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  headerWrap: {
    width: '100%',
    height: 260,
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  headerImageInner: {
    opacity: 0.55,
  },
  headerContent: {
    paddingHorizontal: 28,
    paddingBottom: 32,
  },
  eyebrow: {
    fontFamily: FONTS.serifBody,
    fontSize: 11,
    letterSpacing: 3.0,
    textTransform: 'uppercase',
    color: AMBER.accent,
    marginBottom: 8,
  },
  titleEnglish: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 48,
    lineHeight: 52,
    color: INK.strong,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 24,
    color: INK.soft,
  },
  serviceList: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 14,
  },
  serviceCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(120,80,20,0.12)',
    shadowColor: '#2a1a0a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  serviceCardPressed: {
    opacity: 0.85,
  },
  serviceCardDisabled: {
    opacity: 0.55,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  serviceInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 22,
    paddingLeft: 22,
    paddingRight: 22,
    gap: 16,
  },
  serviceLeft: {
    flex: 1,
  },
  serviceEyebrow: {
    fontFamily: FONTS.serifBody,
    fontSize: 10,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  serviceEnglish: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 26,
    lineHeight: 30,
    color: INK.strong,
    marginBottom: 4,
  },
  serviceSubtitle: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 18,
    color: INK.soft,
  },
  serviceHebrew: {
    fontFamily: FONTS.hebrew,
    fontSize: 28,
    lineHeight: 34,
    color: INK.strong,
    textAlign: 'right',
    writingDirection: 'rtl',
    minWidth: 120,
  },
  comingSoon: {
    fontFamily: FONTS.serifBody,
    fontSize: 10,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 22,
    right: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,253,247,0.78)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#2a1a0a',
    shadowOpacity: 0.13,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  footerButtonText: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 15,
    color: INK.strong,
  },
  footerDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginHorizontal: 4,
  },
});
