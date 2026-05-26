import { useEffect } from 'react';
import { useSiddurStore } from '../../store/siddurStore';
import { TIMING } from '../../theme/siddurTheme';

export function useKaraokeTickLoop() {
  const isPlaying = useSiddurStore((s) => s.isPlaying);
  const speed = useSiddurStore((s) => s.speed);
  const advance = useSiddurStore((s) => s.advance);

  useEffect(() => {
    if (!isPlaying) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const result = advance();
      if (result === 'end' || result === 'section-boundary') return;
      const ms = (TIMING.CADENCE_MIN + Math.random() * TIMING.CADENCE_JITTER) / speed;
      timer = setTimeout(tick, ms);
    };
    timer = setTimeout(tick, TIMING.INITIAL_DELAY / speed);
    return () => clearTimeout(timer);
  }, [isPlaying, speed, advance]);
}
