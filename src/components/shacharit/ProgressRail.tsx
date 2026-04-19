import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SECTION_ORDER, type SectionId } from '../../theme/shacharitTheme';

interface Props {
  activeSection: SectionId;
  onJumpSection: (id: SectionId) => void;
  birdTop: number;
  renderBird: () => React.ReactNode;
}

const SEG_GRADIENTS: Record<SectionId, [string, string]> = {
  birchot:    ['#eab864', '#b07a1c'],
  pesukei:    ['#b07a1c', '#d48d23'],
  shema:      ['#d48d23', '#1d4a7a'],
  concluding: ['#1d4a7a', '#5c6b2f'],
};

export default function ProgressRail({ activeSection, onJumpSection, birdTop, renderBird }: Props) {
  return (
    <View style={styles.rail} pointerEvents="box-none">
      <View style={styles.segments}>
        {SECTION_ORDER.map(id => (
          <Pressable
            key={id}
            onPress={() => onJumpSection(id)}
            style={[styles.seg, id === activeSection && styles.segActive]}
          >
            <LinearGradient
              colors={SEG_GRADIENTS[id]}
              style={StyleSheet.absoluteFill}
            />
          </Pressable>
        ))}
      </View>
      <View style={[styles.birdHost, { top: birdTop }]} pointerEvents="none">
        {renderBird()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    right: 16,
    top: 80,
    bottom: 140,
    width: 12,
    alignItems: 'center',
  },
  segments: {
    flex: 1,
    width: 4,
    justifyContent: 'space-between',
    gap: 6,
  },
  seg: {
    flex: 1,
    borderRadius: 999,
    overflow: 'hidden',
    opacity: 0.55,
  },
  segActive: { opacity: 1 },
  birdHost: {
    position: 'absolute',
    right: '100%',
    marginRight: 6,
    width: 40,
    height: 24,
  },
});
