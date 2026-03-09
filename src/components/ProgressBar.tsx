import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

/**
 * Simple progress bar showing advancement through a prayer or service.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, label }) => {
  const progress = total > 0 ? current / total : 0;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.counter}>
        {current} / {total}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: '#718096',
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: '#EDF2F7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#3182CE',
    borderRadius: 2,
  },
  counter: {
    fontSize: 12,
    color: '#A0AEC0',
    minWidth: 40,
    textAlign: 'right',
  },
});
