import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export default function SectionDivider() {
  const { width } = useWindowDimensions();
  const opacity = useSharedValue(0.75);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 2500 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.wrap, { width }, animStyle]} pointerEvents="none">
      <LinearGradient
        colors={[
          'rgba(230,178,74,0)',
          'rgba(230,178,74,0.25)',
          '#e6b24a',
          'rgba(230,178,74,0.25)',
          'rgba(230,178,74,0)',
        ]}
        locations={[0, 0.15, 0.5, 0.85, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.line}
      />
      <View style={styles.glow} pointerEvents="none" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 18, justifyContent: 'center', alignItems: 'center' },
  line: { height: 1, width: '100%' },
  glow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 8,
    height: 2,
    shadowColor: '#e6b24a',
    shadowOpacity: 0.7,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
});
