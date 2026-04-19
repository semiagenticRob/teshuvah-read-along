import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  open: boolean;
  children: React.ReactNode;
}

// Lazy-mount: don't construct the children's tree until the panel is opened
// for the first time. Keep mounted after that so re-open is instant.
// Animation: native LayoutAnimation (single layout pass per open/close) instead
// of driving maxHeight on the JS thread across the 7k+ nodes below.
export default function ExpandablePanel({ open, children }: Props) {
  const [hasEverOpened, setHasEverOpened] = useState(open);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      if (open) setHasEverOpened(true);
      return;
    }
    LayoutAnimation.configureNext({
      duration: 260,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'easeInEaseOut' },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    if (open) setHasEverOpened(true);
  }, [open]);

  if (!hasEverOpened) return null;

  return (
    <View style={open ? styles.open : styles.closed}>
      <View>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  open: { marginTop: 22, overflow: 'hidden' },
  closed: { height: 0, overflow: 'hidden', marginTop: 0 },
});
