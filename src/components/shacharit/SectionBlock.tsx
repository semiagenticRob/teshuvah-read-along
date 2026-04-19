import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  return (
    <View style={styles.wrap}>
      {!isFirst && <SectionDivider />}
      <LinearGradient
        colors={spec.gradient}
        locations={spec.gradientStops}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={[styles.column, { maxWidth: Math.min(width, 760) }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:   { width: '100%', alignItems: 'center' },
  column: { width: '100%', paddingHorizontal: 22, paddingVertical: 16 },
});
