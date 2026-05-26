import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import ShacharitScrollScreen from '../screens/ShacharitScrollScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { SkillTierScreen } from '../screens/onboarding/SkillTierScreen';
import { LocationPermissionScreen } from '../screens/onboarding/LocationPermissionScreen';
import TranslationPhilosophyScreen from '../screens/TranslationPhilosophyScreen';
import SiddurScrollScreen from '../siddur/SiddurScrollScreen';
import LearnScreen from '../siddur/LearnScreen';
import EssayScreen from '../siddur/EssayScreen';
import { useSettingsStore } from '../store/settingsStore';
import { PARCHMENT, INK } from '../theme/shacharitTheme';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const hasCompletedOnboarding = useSettingsStore((state) => state.hasCompletedOnboarding);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: PARCHMENT,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTintColor: INK.strong,
          headerTitleStyle: {
            fontWeight: '600',
          },
          cardStyle: {
            backgroundColor: PARCHMENT,
          },
        }}
      >
        {hasCompletedOnboarding ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ShacharitScroll"
              component={ShacharitScrollScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SiddurScroll"
              component={SiddurScrollScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Learn"
              component={LearnScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Essay"
              component={EssayScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Settings' }}
            />
            <Stack.Screen
              name="About"
              component={AboutScreen}
              options={{ title: 'About' }}
            />
            <Stack.Screen
              name="TranslationPhilosophy"
              options={{ headerShown: false }}
            >
              {(props) => <TranslationPhilosophyScreen {...props} mode="settings" />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SkillTier"
              component={SkillTierScreen}
              options={{ headerShown: false, gestureEnabled: true }}
            />
            <Stack.Screen
              name="LocationPermission"
              component={LocationPermissionScreen}
              options={{ headerShown: false, gestureEnabled: true }}
            />
            <Stack.Screen
              name="TranslationPhilosophy"
              options={{ headerShown: false, gestureEnabled: true }}
            >
              {() => (
                <TranslationPhilosophyScreen
                  mode="onboarding"
                  onComplete={() => useSettingsStore.getState().completeOnboarding()}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
