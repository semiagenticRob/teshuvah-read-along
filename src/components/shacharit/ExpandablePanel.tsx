import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  open: boolean;
  children: React.ReactNode;
}

export default function ExpandablePanel({ open, children }: Props) {
  const progress = useDerivedValue(() => withTiming(open ? 1 : 0, { duration: 450 }));
  const animStyle = useAnimatedStyle(() => ({
    maxHeight: progress.value * 900,
    opacity: progress.value,
    marginTop: progress.value * 22,
  }));
  return (
    <Animated.View style={[styles.wrap, animStyle]}>
      <View>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
});
