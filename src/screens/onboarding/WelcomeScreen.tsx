import React from 'react';
import { View, Text, Pressable, ScrollView, StatusBar } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { onboardingStyles as s } from './onboardingStyles';

type Props = StackScreenProps<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={s.scrollContent}>
        <Text style={s.eyebrow}>Welcome</Text>
        <Text style={s.title}>Daven Along</Text>
        <Text style={s.subtitle}>
          A weekday siddur for praying alongside the words — at your pace, with the help you want.
        </Text>

        <View style={s.buttonGroup}>
          <Pressable
            style={({ pressed }) => [s.primaryButton, pressed && s.primaryButtonPressed]}
            onPress={() => navigation.navigate('SkillTier')}
          >
            <Text style={s.primaryButtonText}>Begin</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};
