import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useSettingsStore } from './src/store/settingsStore';
import { usePrayerProgress } from './src/hooks/usePrayerProgress';

const App: React.FC = () => {
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  usePrayerProgress();

  return <AppNavigator />;
};

export default App;
