import React, { useState } from 'react';
import { View, Pressable, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SECTION_ORDER, type SectionId } from '../../theme/shacharitTheme';

interface Props {
  activeSection: SectionId;
  onJumpSection: (id: SectionId) => void;
  birdFraction: number;   // 0..1
}

const SEG_GRADIENTS: Record<SectionId, [string, string]> = {
  birchot:    ['#eab864', '#b07a1c'],
  pesukei:    ['#b07a1c', '#d48d23'],
  shema:      ['#d48d23', '#1d4a7a'],
  concluding: ['#1d4a7a', '#5c6b2f'],
};

const DOT_SIZE = 9;

export default function ProgressRail({ activeSection, onJumpSection, birdFraction }: Props) {
  const [segsHeight, setSegsHeight] = useState(0);
  const onSegsLayout = (e: LayoutChangeEvent) => setSegsHeight(e.nativeEvent.layout.height);

  const dotTop = Math.max(0, Math.min(segsHeight - DOT_SIZE, birdFraction * segsHeight - DOT_SIZE / 2));

  return (
    <View style={styles.rail} pointerEvents="box-none">
      <View style={styles.segments} onLayout={onSegsLayout}>
        {SECTION_ORDER.map(id => (
          <Pressable
            key={id}
            onPress={() => onJumpSection(id)}
            hitSlop={{ left: 18, right: 8, top: 4, bottom: 4 }}
            style={[styles.seg, id === activeSection && styles.segActive]}
          >
            <LinearGradient
              colors={SEG_GRADIENTS[id]}
              style={StyleSheet.absoluteFill}
            />
          </Pressable>
        ))}
      </View>
      <View style={[styles.dot, { top: dotTop }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    right: 6,
    top: 80,
    bottom: 140,
    width: 3,
    alignItems: 'center',
  },
  segments: {
    flex: 1,
    width: 3,
    justifyContent: 'space-between',
    gap: 6,
  },
  seg: { flex: 1, borderRadius: 999, overflow: 'hidden', opacity: 0.55 },
  segActive: { opacity: 1 },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#ffffff',
    left: -((DOT_SIZE - 3) / 2),
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
});
