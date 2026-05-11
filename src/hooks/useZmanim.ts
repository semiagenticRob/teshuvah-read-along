import { useEffect, useMemo, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { DayZmanim, defaultZmanimProvider, ZmanimProvider } from '../lib/zmanim';

export interface ZmanimState {
  /** Today's zmanim, or null if location is not set. */
  zmanim: DayZmanim | null;
  /** True once we know whether to render (location resolved one way or the other). */
  ready: boolean;
  /** True if the user has a location set (from onboarding or settings). */
  hasLocation: boolean;
  /** Now timestamp, ticked once per minute. Useful for live countdowns. */
  now: Date;
}

const RECOMPUTE_INTERVAL_MS = 60_000;

export function useZmanim(provider: ZmanimProvider = defaultZmanimProvider): ZmanimState {
  const location = useSettingsStore((s) => s.location);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), RECOMPUTE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const zmanim = useMemo<DayZmanim | null>(() => {
    if (!location) return null;
    try {
      return provider.compute({
        latitude: location.latitude,
        longitude: location.longitude,
        date: now,
      });
    } catch {
      return null;
    }
  }, [location, now, provider]);

  return {
    zmanim,
    ready: true,
    hasLocation: location != null,
    now,
  };
}
