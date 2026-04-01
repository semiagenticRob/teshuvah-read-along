import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, Prayer } from '../types';
import { usePrayerStore } from '../store/prayerStore';
import { useSettingsStore } from '../store/settingsStore';
import { getShacharitPrayers } from '../data/prayerOrder';
import { ReadAlongView } from '../components/ReadAlongView';
import { PlaybackControls } from '../components/PlaybackControls';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useWordSync } from '../hooks/useWordSync';
import { loadPrayerContent, generateEstimatedTiming } from '../api/prayerTextService';

type Props = StackScreenProps<RootStackParamList, 'ReadAlong'>;

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
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCurrentPrayer = useCallback(() => {
    if (!currentPrayer) return;
    setLoadedPrayer(undefined);
    setLoadError(null);
    setIsLoadingText(true);
    loadPrayerContent(currentPrayer)
      .then((prayer) => generateEstimatedTiming(prayer))
      .then((prayer) => {
        setLoadedPrayer(prayer);
        setIsLoadingText(false);
      })
      .catch((err) => {
        console.error('Failed to load prayer text:', err);
        setLoadError('Could not load prayer text. Check your connection and try again.');
        setIsLoadingText(false);
      });
  }, [currentPrayer]);

  useEffect(() => {
    loadCurrentPrayer();
  }, [loadCurrentPrayer]);

  const activePrayer = loadedPrayer ?? currentPrayer;

  // Set initial prayer index from navigation params
  useEffect(() => {
    setCurrentPrayer(prayerIndex);
  }, [prayerIndex, setCurrentPrayer]);

  // Audio player hook
  const { play, pause, seek, setSpeed, getPositionMs, onComplete } = useAudioPlayer(activePrayer);

  // Auto-advance when playback finishes
  useEffect(() => {
    onComplete(() => {
      setIsPlaying(false);
      if (activePrayer) {
        markPrayerCompleted(activePrayer.id);
      }
      if (currentPrayerIndex < prayers.length - 1) {
        nextPrayer(prayers.length);
      }
    });
  }, [onComplete, activePrayer, setIsPlaying, markPrayerCompleted, nextPrayer, currentPrayerIndex, prayers.length]);

  // Word sync hook — updates currentWord based on audio position
  useWordSync(activePrayer, isPlaying, getPositionMs);

  // Auto-scroll: track line Y positions and scroll when the current line changes
  const linePositions = useRef<Record<number, number>>({});
  const userScrolling = useRef(false);
  const userScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLineLayout = useCallback((lineIndex: number, y: number) => {
    linePositions.current[lineIndex] = y;
  }, []);

  useEffect(() => {
    if (!isPlaying || userScrolling.current) return;
    const y = linePositions.current[currentLineIndex];
    if (y !== undefined && scrollViewRef.current) {
      const screenHeight = Dimensions.get('window').height;
      scrollViewRef.current.scrollTo({
        y: Math.max(0, y - screenHeight / 3),
        animated: true,
      });
    }
  }, [currentLineIndex, isPlaying]);

  const handleScrollBeginDrag = useCallback(() => {
    userScrolling.current = true;
    if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);
    // Re-enable auto-scroll after 5 seconds of no manual scrolling
    userScrollTimeout.current = setTimeout(() => {
      userScrolling.current = false;
    }, 5000);
  }, []);

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
      seek(line.words[wordIndex].startTime);
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
        onScrollBeginDrag={handleScrollBeginDrag}
      >
        {loadError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{loadError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadCurrentPrayer}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ReadAlongView
            prayer={activePrayer}
            currentLineIndex={currentLineIndex}
            currentWordIndex={currentWordIndex}
            displayMode={displayMode}
            textSize={textSize}
            onWordTap={handleWordTap}
            onLineLayout={handleLineLayout}
          />
        )}
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
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorMessage: {
    fontSize: 15,
    color: '#C53030',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3182CE',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
