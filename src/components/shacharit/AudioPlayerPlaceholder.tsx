import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { FONTS, INK } from '../../theme/shacharitTheme';

interface Props {
  title: string;
  duration: string;
  accent: string;
  parchment: string;
  notes: string;
}

function WaveBar({ playing, delay, color }: { playing: boolean; delay: number; color: string }) {
  const h = useSharedValue(4);
  useEffect(() => {
    if (playing) {
      h.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(18, { duration: 500 }),
            withTiming(4,  { duration: 500 })
          ),
          -1,
          false
        )
      );
    } else {
      h.value = withTiming(4, { duration: 200 });
    }
  }, [playing, delay]);
  const style = useAnimatedStyle(() => ({ height: h.value }));
  return (
    <Animated.View
      style={[
        { width: 2, backgroundColor: color, borderRadius: 1, marginHorizontal: 1 },
        style,
      ]}
    />
  );
}

export default function AudioPlayerPlaceholder({ title, duration, accent, parchment, notes }: Props) {
  const [playing, setPlaying] = useState(false);
  return (
    <View>
      <View style={styles.player}>
        <Pressable
          onPress={() => setPlaying(p => !p)}
          style={[styles.playBtn, { backgroundColor: accent }]}
        >
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path
              d={playing ? 'M6 5h4v14H6zm8 0h4v14h-4z' : 'M7 5v14l12-7z'}
              fill={parchment}
            />
          </Svg>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.duration}>{duration} · Placeholder</Text>
        </View>
        <View style={styles.wave}>
          {Array.from({ length: 10 }).map((_, i) => (
            <WaveBar key={i} playing={playing} delay={i * 120} color={accent} />
          ))}
        </View>
      </View>
      <View style={[styles.notes, { borderLeftColor: accent }]}>
        <Text style={styles.notesText}>{notes}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(255,252,245,0.55)',
    borderColor: 'rgba(0,0,0,0.08)',
    borderWidth: 1,
    borderRadius: 14,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: FONTS.serifBodyItalic, fontSize: 14, color: INK.strong, fontStyle: 'italic' },
  duration: {
    fontFamily: FONTS.serifBody,
    fontSize: 10,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: INK.faint,
    marginTop: 2,
  },
  wave: { flexDirection: 'row', alignItems: 'center', height: 18, flexShrink: 0 },
  notes: { marginTop: 10, paddingLeft: 16, borderLeftWidth: 1.5 },
  notesText: {
    fontFamily: FONTS.displayItalic,
    fontSize: 15,
    lineHeight: 22,
    color: INK.soft,
    fontStyle: 'italic',
  },
});
