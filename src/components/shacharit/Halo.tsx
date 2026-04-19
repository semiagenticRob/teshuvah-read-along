import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { TIMING } from '../../theme/shacharitTheme';

interface Props {
  state: 'idle' | 'active' | 'fading';
  speed: number;
}

/**
 * Absolute-positioned glow behind a word pair.
 * Crescendo on 'active', slow decrescendo on 'fading', invisible on 'idle'.
 * Uses a white radial glow approximated with backgroundColor + shadow.
 */
function Halo({ state, speed }: Props) {
  const opacity = useSharedValue(0);
  const scale   = useSharedValue(0.88);

  useEffect(() => {
    const crescendoMs = TIMING.HALO_CRESCENDO_AVG / speed;
    const fadeMs      = TIMING.HALO_DECRESCENDO_AVG / speed;
    if (state === 'active') {
      opacity.value = withTiming(1, { duration: crescendoMs, easing: Easing.in(Easing.ease) });
      scale.value   = withTiming(1.1, { duration: crescendoMs, easing: Easing.in(Easing.ease) });
    } else if (state === 'fading') {
      opacity.value = withTiming(0, { duration: fadeMs, easing: Easing.linear });
      scale.value   = withTiming(1.04, { duration: fadeMs, easing: Easing.linear });
    } else {
      opacity.value = withTiming(0, { duration: 100 });
      scale.value   = 0.88;
    }
  }, [state, speed]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View pointerEvents="none" style={[styles.halo, animStyle]} />;
}

export default React.memo(Halo);

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
    left: -4,
    right: -4,
    top: -6,
    bottom: -6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.72)',
    shadowColor: '#fff',
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
});
