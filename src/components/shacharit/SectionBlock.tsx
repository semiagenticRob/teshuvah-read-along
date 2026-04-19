import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SECTIONS, type SectionId } from '../../theme/shacharitTheme';
import SectionDivider from './SectionDivider';

interface Props {
  sectionId: SectionId;
  isFirst?: boolean;
  children: React.ReactNode;
}

export default function SectionBlock({ sectionId, isFirst, children }: Props) {
  const spec = SECTIONS[sectionId];
  const { width } = useWindowDimensions();

  const driftX = useSharedValue(0);
  const driftY = useSharedValue(0);
  useEffect(() => {
    // ~40 second drift cycle, alternates direction via reverse animation
    driftX.value = withRepeat(withTiming(-0.025, { duration: 40000 }), -1, true);
    driftY.value = withRepeat(withTiming(0.02,   { duration: 40000 }), -1, true);
  }, []);

  const { width: screenW, height: screenH } = Dimensions.get('window');
  const driftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: driftX.value * screenW },
      { translateY: driftY.value * screenH },
    ],
  }));

  return (
    <View style={styles.wrap}>
      {!isFirst && <SectionDivider />}

      <LinearGradient
        colors={spec.gradient}
        locations={spec.gradientStops}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Ambient motion overlay — soft light + dark pair that slowly drifts */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.driftWrap, driftStyle]}
      >
        <LinearGradient
          colors={['rgba(255,252,240,0.10)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.driftA}
        />
        <LinearGradient
          colors={['rgba(30,20,10,0.06)', 'transparent']}
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.driftB}
        />
      </Animated.View>

      <View style={[styles.column, { maxWidth: Math.min(width, 760) }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:   { width: '100%', alignItems: 'center' },
  column: { width: '100%', paddingHorizontal: 22, paddingVertical: 16 },
  driftWrap: { opacity: 0.85 },
  driftA: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '80%',
    height: '60%',
  },
  driftB: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '75%',
    height: '55%',
  },
});
