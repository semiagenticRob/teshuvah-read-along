import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { PrayerListScreen } from '../screens/PrayerListScreen';
import { ReadAlongScreen } from '../screens/ReadAlongScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FDFAF6',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTintColor: '#1A365D',
          headerTitleStyle: {
            fontWeight: '600',
          },
          cardStyle: {
            backgroundColor: '#FDFAF6',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PrayerList"
          component={PrayerListScreen}
          options={{ title: 'Prayers' }}
        />
        <Stack.Screen
          name="ReadAlong"
          component={ReadAlongScreen}
          options={{ title: 'Read Along' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
