import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFonts, FrankRuhlLibre_500Medium } from '@expo-google-fonts/frank-ruhl-libre';
import { EBGaramond_400Regular, EBGaramond_400Regular_Italic } from '@expo-google-fonts/eb-garamond';
import {
  CormorantGaramond_500Medium,
  CormorantGaramond_500Medium_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useSettingsStore } from './src/store/settingsStore';
import { usePrayerProgress } from './src/hooks/usePrayerProgress';

const App: React.FC = () => {
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  usePrayerProgress();

  const [fontsLoaded] = useFonts({
    FrankRuhlLibre_500Medium,
    EBGaramond_400Regular,
    EBGaramond_400Regular_Italic,
    CormorantGaramond_500Medium,
    CormorantGaramond_500Medium_Italic,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f6e9d2', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#b07a1c" />
      </View>
    );
  }

  return <AppNavigator />;
};

export default App;
