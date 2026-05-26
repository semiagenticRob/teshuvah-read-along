// src/screens/HomeScreen.tsx
import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
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
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
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
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PARCHMENT },
  scroll: { paddingHorizontal: 12, paddingBottom: 32 },
  grid: {
    marginTop: 18,
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
});
