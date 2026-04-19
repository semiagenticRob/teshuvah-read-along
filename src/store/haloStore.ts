import { create } from 'zustand';

interface HaloState {
  activeIdx: number | null;
  recentlyActive: number[];
  setActive: (i: number | null) => void;
}

export const useHaloStore = create<HaloState>((set) => ({
  activeIdx: null,
  recentlyActive: [],
  setActive: (i) =>
    set((s) => {
      const trail = s.activeIdx !== null
        ? [s.activeIdx, ...s.recentlyActive].slice(0, 12)
        : s.recentlyActive;
      return { activeIdx: i, recentlyActive: trail };
    }),
}));
