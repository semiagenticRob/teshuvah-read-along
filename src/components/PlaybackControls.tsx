import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlaybackSpeed, PLAYBACK_SPEEDS } from '../types';

interface PlaybackControlsProps {
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  onPlayPause: () => void;
  onSpeedChange: (speed: number) => void;
  onPreviousPrayer: () => void;
  onNextPrayer: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
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
}) => {
  const handleSpeedCycle = () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    onSpeedChange(PLAYBACK_SPEEDS[nextIndex]);
  };

  return (
    <View style={styles.container}>
      {/* Speed control */}
      <TouchableOpacity style={styles.speedButton} onPress={handleSpeedCycle}>
        <Text style={styles.speedText}>{playbackSpeed}x</Text>
      </TouchableOpacity>

      {/* Main controls */}
      <View style={styles.mainControls}>
        {/* Previous prayer */}
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

        {/* Play/Pause */}
        <TouchableOpacity style={styles.playButton} onPress={onPlayPause}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Next prayer */}
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

      {/* Spacer to balance the speed button */}
      <View style={styles.speedButton}>
        <Text style={styles.speedLabel}>Speed</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    gap: 20,
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
  speedButton: {
    width: 50,
    alignItems: 'center',
  },
  speedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3182CE',
  },
  speedLabel: {
    fontSize: 11,
    color: '#A0AEC0',
  },
});
