import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { MIN_PLAYBACK_SPEED, MAX_PLAYBACK_SPEED, SPEED_STEP } from '../types';

interface PlaybackControlsProps {
  isPlaying: boolean;
  playbackSpeed: number;
  onPlayPause: () => void;
  onSpeedChange: (speed: number) => void;
  onPreviousPrayer: () => void;
  onNextPrayer: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  awaitingPlay?: boolean;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  playbackSpeed,
  onPlayPause,
  onSpeedChange,
  onPreviousPrayer,
  onNextPrayer,
  hasPrevious,
  hasNext,
  awaitingPlay,
}) => {
  const handleSliderChange = (value: number) => {
    // Snap to nearest step
    const snapped = Math.round(value / SPEED_STEP) * SPEED_STEP;
    const clamped = Math.max(MIN_PLAYBACK_SPEED, Math.min(MAX_PLAYBACK_SPEED, snapped));
    onSpeedChange(parseFloat(clamped.toFixed(2)));
  };

  return (
    <View style={styles.container}>
      {/* Main controls row */}
      <View style={styles.mainControls}>
        <TouchableOpacity
          style={[styles.navButton, !hasPrevious && styles.disabledButton]}
          onPress={onPreviousPrayer}
          disabled={!hasPrevious}
        >
          <Ionicons
            name="play-skip-back"
            size={22}
            color={hasPrevious ? '#4A5568' : '#A0AEC0'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playButton, awaitingPlay && !isPlaying && styles.playButtonPulsing]}
          onPress={onPlayPause}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, !hasNext && styles.disabledButton]}
          onPress={onNextPrayer}
          disabled={!hasNext}
        >
          <Ionicons
            name="play-skip-forward"
            size={22}
            color={hasNext ? '#4A5568' : '#A0AEC0'}
          />
        </TouchableOpacity>
      </View>

      {/* Speed slider row */}
      <View style={styles.speedRow}>
        <Text style={styles.speedBound}>{MIN_PLAYBACK_SPEED}x</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.speedValue}>{playbackSpeed.toFixed(2)}x</Text>
          <Slider
            style={styles.slider}
            minimumValue={MIN_PLAYBACK_SPEED}
            maximumValue={MAX_PLAYBACK_SPEED}
            step={SPEED_STEP}
            value={playbackSpeed}
            onSlidingComplete={handleSliderChange}
            minimumTrackTintColor="#3182CE"
            maximumTrackTintColor="#E2E8F0"
            thumbTintColor="#3182CE"
          />
        </View>
        <Text style={styles.speedBound}>{MAX_PLAYBACK_SPEED}x</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3182CE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3182CE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  playButtonPulsing: {
    shadowOpacity: 0.6,
    shadowRadius: 12,
    borderWidth: 2,
    borderColor: '#63B3ED',
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.4,
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderContainer: {
    flex: 1,
    alignItems: 'center',
  },
  speedValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3182CE',
    marginBottom: 2,
  },
  slider: {
    width: '100%',
    height: 28,
  },
  speedBound: {
    fontSize: 10,
    color: '#A0AEC0',
    width: 28,
    textAlign: 'center',
  },
});
