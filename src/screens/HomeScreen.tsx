// src/screens/HomeScreen.tsx
import React, { useCallback } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { ZmanimHeader } from '../components/ZmanimHeader';
import { FONTS, INK, PARCHMENT } from '../theme/siddurTheme';
import { CARDS } from '../data/siddur/cards';
import { FEATURE_FLAGS } from '../lib/featureFlags';
import type { CardId } from '../siddur/types';

interface Props {
  navigation: any;
  route: any;
}

const ACCENT = '#b07a1c';
const headerImage = require('../../assets/images/kotel-header.jpg');

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const handleCardPress = useCallback(
    (cardId: CardId) => {
      if (cardId === 'learn') {
        navigation.navigate('Learn');
        return;
      }
      if (cardId === 'shacharit' && FEATURE_FLAGS.USE_LEGACY_SHACHARIT_SCROLL) {
        navigation.navigate('ShacharitScroll');
        return;
      }
      navigation.navigate('SiddurScroll', { cardId });
    },
    [navigation],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView} bounces={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerWrap}>
          <ImageBackground source={headerImage} style={styles.headerImage} imageStyle={styles.headerImageInner} resizeMode="cover">
            <LinearGradient
              colors={['rgba(246,233,210,0.25)', 'rgba(236,209,151,0.55)', PARCHMENT]}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
            <SafeAreaView edges={['top']} style={styles.headerContent}>
              <Text style={styles.eyebrow}>A Weekday Siddur</Text>
              <Text style={styles.titleEnglish}>Daven Along</Text>
              <Text style={styles.subtitle}>Follow along with the weekday siddur</Text>
            </SafeAreaView>
          </ImageBackground>
        </View>

        <ZmanimHeader />

        <View style={styles.grid}>
          {CARDS.map((card) => (
            <Pressable
              key={card.id}
              onPress={() => handleCardPress(card.id)}
              style={styles.card}
              hitSlop={4}
            >
              <Text style={styles.cardHebrew}>{card.title.he}</Text>
              <Text style={styles.cardEnglish}>{card.title.en}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

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

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PARCHMENT,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 84,
  },
  headerWrap: {
    width: '100%',
    height: 200,
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
    paddingBottom: 20,
    justifyContent: 'flex-end',
    flex: 1,
  },
  eyebrow: {
    fontFamily: FONTS.serifBody,
    fontSize: 11,
    letterSpacing: 3.0,
    textTransform: 'uppercase',
    color: ACCENT,
    marginBottom: 6,
  },
  titleEnglish: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 48,
    lineHeight: 52,
    color: INK.strong,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 24,
    color: INK.soft,
  },
  grid: {
    marginTop: 18,
    paddingHorizontal: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    aspectRatio: 1.4,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,80,20,0.10)',
    shadowColor: '#2a1a0a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHebrew: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: INK.strong,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  cardEnglish: {
    fontFamily: FONTS.serifBody,
    fontSize: 13,
    color: INK.soft,
    marginTop: 6,
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
