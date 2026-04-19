import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import { INK, FONTS, PARCHMENT, TIMING } from '../../theme/shacharitTheme';

interface Props {
  lanes: { hebrew: boolean; translit: boolean; english: boolean };
  onToggleLane: (lane: 'hebrew' | 'translit' | 'english') => void;
  playing: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (v: number) => void;
}

export default function AppBar(p: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.modes}>
        {(['hebrew', 'translit', 'english'] as const).map(lane => (
          <Pressable
            key={lane}
            onPress={() => p.onToggleLane(lane)}
            style={[styles.modeBtn, p.lanes[lane] && styles.modeBtnOn]}
          >
            <Text style={[styles.modeText, p.lanes[lane] && styles.modeTextOn]}>
              {lane === 'hebrew' ? 'א' : lane === 'translit' ? 'Aa' : 'En'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.rightGroup}>
        <Pressable onPress={p.onTogglePlay} style={[styles.play, p.playing && styles.playOn]}>
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path
              d={p.playing ? 'M6 5h4v14H6zm8 0h4v14h-4z' : 'M7 5v14l12-7z'}
              fill={PARCHMENT}
            />
          </Svg>
        </Pressable>

        <Text style={styles.speedVal}>{p.speed.toFixed(1)}×</Text>
        <Slider
          style={styles.slider}
          minimumValue={TIMING.SPEED_MIN}
          maximumValue={TIMING.SPEED_MAX}
          step={TIMING.SPEED_STEP}
          value={p.speed}
          onValueChange={p.onSpeedChange}
          minimumTrackTintColor={INK.strong}
          maximumTrackTintColor="rgba(0,0,0,0.15)"
          thumbTintColor={INK.strong}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 22,
    left: 22,
    right: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingLeft: 14,
    paddingRight: 10,
    backgroundColor: 'rgba(255,253,247,0.78)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#2a1a0a',
    shadowOpacity: 0.13,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  modes: { flexDirection: 'row' },
  rightGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slider: { width: 80, height: 28 },
  modeBtn: {
    minWidth: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  modeBtnOn: { backgroundColor: INK.strong },
  modeText: {
    color: INK.faint,
    fontFamily: FONTS.serifBodyItalic,
    fontSize: 15,
    fontStyle: 'italic',
  },
  modeTextOn: {
    color: PARCHMENT,
    fontFamily: FONTS.serifBody,
    fontStyle: 'normal',
  },
  play: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: INK.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOn: { backgroundColor: '#b07a1c' },
  speedVal: {
    fontFamily: FONTS.displayItalic,
    fontSize: 13,
    color: INK.soft,
    minWidth: 30,
    textAlign: 'center',
    fontStyle: 'italic',
    marginLeft: 4,
  },
});
