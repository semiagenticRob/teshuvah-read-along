import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Ellipse, Circle } from 'react-native-svg';
import { StyleSheet } from 'react-native';

interface Props {
  color: string;
}

export default function BirdMarker({ color }: Props) {
  const y = useSharedValue(0);
  const r = useSharedValue(-3);

  useEffect(() => {
    y.value = withRepeat(withTiming(-2, { duration: 1700 }), -1, true);
    r.value = withRepeat(withTiming(3,  { duration: 1700 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: y.value },
      { rotate: `${r.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.wrap, animStyle]}>
      <Svg width="100%" height="100%" viewBox="0 0 42 24">
        <Path d="M2 16 Q 9 3 18 13"  stroke={color} strokeWidth={3.2} strokeLinecap="round" fill="none" />
        <Path d="M24 13 Q 33 3 40 16" stroke={color} strokeWidth={3.2} strokeLinecap="round" fill="none" />
        <Ellipse cx={21} cy={15} rx={4.6} ry={3.3} fill={color} />
        <Circle cx={21}   cy={11.4} r={2.4} fill="#fffcf3" />
        <Circle cx={21.3} cy={11}   r={0.75} fill="rgba(40,25,10,0.85)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: '100%',
    shadowColor: '#2a1a0a',
    shadowOpacity: 0.28,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 6,
  },
});
