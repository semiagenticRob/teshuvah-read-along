import { useRef, useState, useCallback } from 'react';
import type { NativeSyntheticEvent, NativeScrollEvent, ScrollView } from 'react-native';
import { SECTION_ORDER, type SectionId } from '../theme/shacharitTheme';

export interface SectionLayout {
  id: SectionId;
  y: number;
  height: number;
}

export function useShacharitScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const layoutsRef = useRef<Record<SectionId, SectionLayout | null>>({
    birchot: null, pesukei: null, shema: null, concluding: null,
  });
  const [activeSection, setActiveSection] = useState<SectionId>('birchot');
  const [birdFraction, setBirdFraction] = useState(0);

  const onSectionLayout = useCallback((id: SectionId, y: number, height: number) => {
    layoutsRef.current = { ...layoutsRef.current, [id]: { id, y, height } };
  }, []);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const viewH = e.nativeEvent.layoutMeasurement.height;
    const focus = y + viewH * 0.42;

    const entries = SECTION_ORDER
      .map(id => layoutsRef.current[id])
      .filter((l): l is SectionLayout => l !== null);
    if (entries.length !== SECTION_ORDER.length) return;

    const first = entries[0].y;
    const last  = entries[entries.length - 1];
    const total = Math.max(1, last.y + last.height - first);
    setBirdFraction(Math.max(0, Math.min(1, (focus - first) / total)));

    let active: SectionId = SECTION_ORDER[0];
    for (const entry of entries) {
      if (entry.y < y + viewH * 0.5) active = entry.id;
    }
    setActiveSection(prev => prev === active ? prev : active);
  }, []);

  const jumpToSection = useCallback((id: SectionId) => {
    const l = layoutsRef.current[id];
    if (!l || !scrollRef.current) return;
    scrollRef.current.scrollTo({ y: Math.max(0, l.y - 20), animated: true });
  }, []);

  return { scrollRef, onScroll, onSectionLayout, activeSection, birdFraction, jumpToSection };
}
