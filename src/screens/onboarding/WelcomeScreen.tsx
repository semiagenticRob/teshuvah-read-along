import React from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { onboardingStyles as s } from './onboardingStyles';

type Props = StackScreenProps<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.center}>
        <View style={styles.copy}>
          <Text style={s.eyebrow}>Welcome</Text>
          <Text style={s.title}>Daven Along</Text>
          <Text style={s.subtitle}>
            A weekday siddur for praying alongside the words — at your pace, with the help you want.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [s.primaryButton, pressed && s.primaryButtonPressed]}
          onPress={() => navigation.navigate('SkillTier')}
        >
          <Text style={s.primaryButtonText}>Begin</Text>
        </Pressable>
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
  copy: {
    // No top padding — the parent centers everything as a unit.
  },
});
