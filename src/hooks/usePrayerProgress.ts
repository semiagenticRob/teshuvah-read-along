import { useEffect } from 'react';
import { usePrayerStore } from '../store/prayerStore';

/**
 * Hook that automatically saves prayer progress when the user navigates away
 * or the app goes to background.
 */
export function usePrayerProgress() {
  const { saveProgress, loadProgress } = usePrayerStore();

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    // Save progress periodically (every 30 seconds while active)
    const interval = setInterval(() => {
      saveProgress();
    }, 30000);

    return () => {
      clearInterval(interval);
      // Save on unmount
      saveProgress();
    };
  }, [saveProgress]);
}
