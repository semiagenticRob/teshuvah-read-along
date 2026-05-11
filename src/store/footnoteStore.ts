import { create } from 'zustand';

/**
 * Footnote keys are `${prayerId}:${lineIndex}:${wordIndex ?? 'line'}` so a
 * tap-to-toggle scheme can compare equality, and so we can tear down state
 * cleanly when the user scrolls a prayer out of view.
 */
export function footnoteKey(prayerId: string, lineIndex: number, wordIndex?: number): string {
  return `${prayerId}:${lineIndex}:${wordIndex ?? 'line'}`;
}

interface FootnoteState {
  openKey: string | null;
  open: (key: string) => void;
  close: () => void;
  toggle: (key: string) => void;
}

export const useFootnoteStore = create<FootnoteState>((set, get) => ({
  openKey: null,
  open: (key) => set({ openKey: key }),
  close: () => set({ openKey: null }),
  toggle: (key) => set({ openKey: get().openKey === key ? null : key }),
}));
