import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, Prayer } from '../types';
import { usePrayerStore } from '../store/prayerStore';
import { useSettingsStore } from '../store/settingsStore';
import { getShacharitPrayers } from '../data/prayerOrder';
import { ReadAlongView } from '../components/ReadAlongView';
import { PlaybackControls } from '../components/PlaybackControls';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useWordSync } from '../hooks/useWordSync';
import { loadPrayerContent, generateEstimatedTiming } from '../api/prayerTextService';

type Props = NativeStackScreenProps<RootStackParamList, 'ReadAlong'>;

export const ReadAlongScreen: React.FC<Props> = ({ route }) => {
  const { serviceId, prayerIndex } = route.params;
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    currentPrayerIndex,
    currentLineIndex,
    currentWordIndex,
    isPlaying,
    playbackSpeed,
    setCurrentPrayer,
    setIsPlaying,
    setPlaybackSpeed,
    setCurrentWord,
    nextPrayer,
    previousPrayer,
    markPrayerCompleted,
  } = usePrayerStore();

  const { displayMode, textSize } = useSettingsStore();

  // Load prayers for this service
  const prayers = serviceId === 'shacharit' ? getShacharitPrayers() : [];
  const currentPrayer = prayers[currentPrayerIndex];

  // Loaded prayer state — fetches text from Sefaria on demand
  const [loadedPrayer, setLoadedPrayer] = useState<Prayer | undefined>(undefined);
  const [isLoadingText, setIsLoadingText] = useState(false);

  useEffect(() => {
    if (!currentPrayer) return;
    setLoadedPrayer(undefined);
    setIsLoadingText(true);
    loadPrayerContent(currentPrayer)
      .then((prayer) => generateEstimatedTiming(prayer))
      .then((prayer) => {
        setLoadedPrayer(prayer);
        setIsLoadingText(false);
      })
      .catch((err) => {
        console.error('Failed to load prayer text:', err);
        setIsLoadingText(false);
      });
  }, [currentPrayer?.id]);

  const activePrayer = loadedPrayer ?? currentPrayer;

  // Set initial prayer index from navigation params
  useEffect(() => {
    setCurrentPrayer(prayerIndex);
  }, [prayerIndex, setCurrentPrayer]);

  // Audio player hook
  const { play, pause, seek, setSpeed } = useAudioPlayer(activePrayer);

  // Word sync hook — updates currentWord based on audio position
  useWordSync(activePrayer, isPlaying);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
      setIsPlaying(false);
    } else {
      play();
      setIsPlaying(true);
    }
  }, [isPlaying, play, pause, setIsPlaying]);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed as any);
    setSpeed(speed);
  }, [setPlaybackSpeed, setSpeed]);

  const handleWordTap = useCallback((lineIndex: number, wordIndex: number) => {
    const line = activePrayer?.sections[0]?.lines[lineIndex];
    if (line?.words[wordIndex]) {
      seek(line.words[wordIndex].startTime / 1000);
      setCurrentWord(lineIndex, wordIndex);
    }
  }, [activePrayer, seek, setCurrentWord]);

  const handleNextPrayer = useCallback(() => {
    if (activePrayer) {
      markPrayerCompleted(activePrayer.id);
    }
    nextPrayer(prayers.length);
  }, [activePrayer, markPrayerCompleted, nextPrayer, prayers.length]);

  if (!currentPrayer) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Prayer not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.prayerNameHebrew}>{currentPrayer.name.hebrew}</Text>
        <Text style={styles.prayerNameEnglish}>{currentPrayer.name.english}</Text>
        <Text style={styles.progress}>
          Prayer {currentPrayerIndex + 1} of {prayers.length}
        </Text>
      </View>

      {/* Prayer text with read-along highlighting */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.textContainer}
        contentContainerStyle={styles.textContent}
      >
        <ReadAlongView
          prayer={activePrayer}
          currentLineIndex={currentLineIndex}
          currentWordIndex={currentWordIndex}
          displayMode={displayMode}
          textSize={textSize}
          onWordTap={handleWordTap}
        />
      </ScrollView>

      {/* Playback controls */}
      <PlaybackControls
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        onPlayPause={handlePlayPause}
        onSpeedChange={handleSpeedChange}
        onPreviousPrayer={previousPrayer}
        onNextPrayer={handleNextPrayer}
        hasPrevious={currentPrayerIndex > 0}
        hasNext={currentPrayerIndex < prayers.length - 1}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFAF6',
  },
  header: {
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  prayerNameHebrew: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A365D',
  },
  prayerNameEnglish: {
    fontSize: 16,
    color: '#4A5568',
    marginTop: 2,
  },
  progress: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 4,
  },
  textContainer: {
    flex: 1,
  },
  textContent: {
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#E53E3E',
    textAlign: 'center',
    marginTop: 40,
  },
});
