import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, UserTier } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import { FONTS, INK, SECTIONS } from '../../theme/shacharitTheme';
import { onboardingStyles as s } from './onboardingStyles';

type Props = StackScreenProps<RootStackParamList, 'SkillTier'>;

interface TierCard {
  tier: UserTier;
  label: string;
  englishName: string;
  description: string;
  accent: string;
  gradient: [string, string, string, string];
  gradientStops: [number, number, number, number];
}

const TIER_CARDS: TierCard[] = [
  {
    tier: 'new',
    label: 'Start fresh',
    englishName: 'New to davening',
    description:
      'Show Hebrew, transliteration, and English side by side, and start with a shorter version of the service.',
    accent: SECTIONS.birchot.accent,
    gradient: SECTIONS.birchot.gradient,
    gradientStops: SECTIONS.birchot.gradientStops,
  },
  {
    tier: 'returning',
    label: 'Returning',
    englishName: 'Coming back to it',
    description:
      "Show Hebrew with transliteration alongside. Bring back the full service — I'll lean on the support where I need it.",
    accent: SECTIONS.pesukei.accent,
    gradient: SECTIONS.pesukei.gradient,
    gradientStops: SECTIONS.pesukei.gradientStops,
  },
  {
    tier: 'fluent',
    label: 'Fluent',
    englishName: 'I read Hebrew well',
    description: 'Just the Hebrew. Show the full weekday service without transliteration or translation.',
    accent: SECTIONS.shema.accent,
    gradient: SECTIONS.shema.gradient,
    gradientStops: SECTIONS.shema.gradientStops,
  },
];

export const SkillTierScreen: React.FC<Props> = ({ navigation }) => {
  const setUserTier = useSettingsStore((state) => state.setUserTier);

  const handleSelect = (tier: UserTier) => {
    setUserTier(tier);
    navigation.navigate('LocationPermission');
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={s.scrollContent}>
        <Text style={s.eyebrow}>Find your starting point</Text>
        <Text style={s.title}>How comfortable are you with davening?</Text>
        <Text style={s.subtitle}>You can change this anytime in Settings.</Text>

        <View style={tierStyles.cardList}>
          {TIER_CARDS.map((card) => (
            <Pressable
              key={card.tier}
              onPress={() => handleSelect(card.tier)}
              style={({ pressed }) => [tierStyles.card, pressed && tierStyles.cardPressed]}
            >
              <LinearGradient
                colors={card.gradient}
                locations={card.gradientStops}
                style={StyleSheet.absoluteFill}
              />
              <View style={[tierStyles.accentBar, { backgroundColor: card.accent }]} />
              <View style={tierStyles.cardBody}>
                <Text style={[tierStyles.cardEyebrow, { color: card.accent }]}>{card.label}</Text>
                <Text style={tierStyles.cardTitle}>{card.englishName}</Text>
                <Text style={tierStyles.cardDescription}>{card.description}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const tierStyles = StyleSheet.create({
  cardList: {
    gap: 14,
    marginBottom: 24,
  },
  card: {
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
  cardPressed: {
    opacity: 0.85,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  cardBody: {
    paddingVertical: 20,
    paddingLeft: 22,
    paddingRight: 22,
  },
  cardEyebrow: {
    fontFamily: FONTS.serifBody,
    fontSize: 10,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
    fontSize: 22,
    lineHeight: 26,
    color: INK.strong,
    marginBottom: 6,
  },
  cardDescription: {
    fontFamily: FONTS.serifBody,
    fontSize: 14,
    lineHeight: 21,
    color: INK.soft,
  },
});

