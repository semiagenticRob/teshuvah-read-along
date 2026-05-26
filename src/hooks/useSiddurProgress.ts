// src/hooks/useSiddurProgress.ts
import { useCallback, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CardId } from '../siddur/types';

const STORAGE_KEY = '@siddur_progress';
const DEBOUNCE_MS = 500;

export interface CardProgress {
  sectionId: string;
  wordIndex: number;
}

type ProgressMap = Partial<Record<CardId, CardProgress>>;

export function useSiddurProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<ProgressMap | null>(null);

  const hydrate = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setProgress(JSON.parse(raw) as ProgressMap);
      } catch {
        // Ignore malformed storage; reset to empty.
      }
    }
  }, []);

  const flush = useCallback(() => {
    if (!pending.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pending.current)).catch(() => {});
    pending.current = null;
  }, []);

  const record = useCallback(
    (cardId: CardId, sectionId: string, wordIndex: number) => {
      setProgress((prev) => {
        const next: ProgressMap = { ...prev, [cardId]: { sectionId, wordIndex } };
        pending.current = next;
        if (flushTimer.current) clearTimeout(flushTimer.current);
        flushTimer.current = setTimeout(flush, DEBOUNCE_MS);
        return next;
      });
    },
    [flush],
  );

  const getProgress = useCallback(
    (cardId: CardId): CardProgress | null => progress[cardId] ?? null,
    [progress],
  );

  return { hydrate, record, getProgress };
}
