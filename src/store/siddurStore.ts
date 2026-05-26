// src/store/siddurStore.ts
import { create } from 'zustand';
import type { CardId } from '../siddur/types';

/**
 * One entry per SiddurSection in the current card's scroll.
 * `start` and `end` are inclusive global karaoke word indices.
 */
export interface SectionBounds {
  sectionId: string;
  start: number;
  end: number;
}

export type AdvanceResult = 'advanced' | 'section-boundary' | 'end';

interface SiddurState {
  // Which card+section is currently the karaoke target
  activeCardId: CardId | null;
  activeSectionId: string | null;
  // Section bounds for the entire card's continuous scroll
  bounds: SectionBounds[];
  // Currently highlighted word's global index, or null if not started
  activeWordIndex: number | null;
  // Playback (tick loop) state
  isPlaying: boolean;
  speed: number;

  // Setters
  setActiveSection: (cardId: CardId, sectionId: string, bounds: SectionBounds[]) => void;
  setActiveWord: (index: number | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;

  // Advance contract — single call from tick loop OR (V2) useWordSync
  advance: () => AdvanceResult;
  jumpToNextSection: () => void;
  reset: () => void;
}

export const useSiddurStore = create<SiddurState>((set, get) => ({
  activeCardId: null,
  activeSectionId: null,
  bounds: [],
  activeWordIndex: null,
  isPlaying: false,
  speed: 1.0,

  setActiveSection: (cardId, sectionId, bounds) => {
    set({ activeCardId: cardId, activeSectionId: sectionId, bounds, activeWordIndex: null });
  },

  setActiveWord: (activeWordIndex) => {
    if (activeWordIndex !== null) {
      const cur = get().bounds.find((b) => activeWordIndex >= b.start && activeWordIndex <= b.end);
      if (cur && cur.sectionId !== get().activeSectionId) {
        set({ activeSectionId: cur.sectionId });
      }
    }
    set({ activeWordIndex });
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setSpeed: (speed) => set({ speed }),

  advance: () => {
    const s = get();
    if (s.bounds.length === 0) return 'end';
    // From null → start of first section
    if (s.activeWordIndex === null) {
      set({ activeWordIndex: s.bounds[0].start, activeSectionId: s.bounds[0].sectionId });
      return 'advanced';
    }
    const cur = s.bounds.find((b) => s.activeWordIndex! >= b.start && s.activeWordIndex! <= b.end);
    if (!cur) return 'end';
    // At last word of last section overall
    const lastBound = s.bounds[s.bounds.length - 1];
    if (s.activeWordIndex === lastBound.end) return 'end';
    // At last word of current section (but not last section overall)
    if (s.activeWordIndex === cur.end) {
      set({ isPlaying: false });
      return 'section-boundary';
    }
    // Normal advance
    set({ activeWordIndex: s.activeWordIndex + 1 });
    return 'advanced';
  },

  jumpToNextSection: () => {
    const s = get();
    if (s.activeWordIndex === null) return;
    const curIdx = s.bounds.findIndex((b) => s.activeWordIndex! >= b.start && s.activeWordIndex! <= b.end);
    if (curIdx < 0 || curIdx === s.bounds.length - 1) return;
    const next = s.bounds[curIdx + 1];
    set({ activeWordIndex: next.start, activeSectionId: next.sectionId });
  },

  reset: () => {
    set({
      activeCardId: null,
      activeSectionId: null,
      bounds: [],
      activeWordIndex: null,
      isPlaying: false,
      speed: 1.0,
    });
  },
}));
