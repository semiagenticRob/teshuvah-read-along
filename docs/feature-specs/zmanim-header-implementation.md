2026-04-20

Status: #baby

Tags: [[teshuvah-read-along]] [[davenAlong]] [[technical-spec]] [[react-native]] [[zmanim]]

# DavenAlong — ZmanimHeader Implementation

CEO Agent overnight run, 2026-04-20.

Proposed implementation for the `ZmanimHeader` component described in [[DavenAlong - Continuous Scroll Redesign Spec]]. The continuous scroll `ShacharitScrollScreen` is already built and navigable. This is the next development unit.

DRY RUN — not committed to repo. Ready to implement when Rob approves.

---

## Status Check (as of 2026-04-20)

The `ShacharitScrollScreen` is already implemented in the repo with:
- ✅ Continuous FlatList scroll through all of Shacharit
- ✅ Four-section structure (birchot, pesukei, shema, concluding)
- ✅ Section intro cards + prayer blocks
- ✅ Display mode toggle (via settings store)
- ✅ Word halo / highlighting system
- ✅ Progress rail

Not yet implemented:
- ❌ `ZmanimHeader` — the sticky strip showing Shacharit end time + countdown
- ❌ Dual entry path selection (beginner vs. returning onboarding screen)
- ❌ `@hebcal/core` installed in repo

---

## Files to Create/Modify

1. `src/components/shacharit/ZmanimHeader.tsx` — **CREATE** (new component)
2. `src/hooks/useZmanim.ts` — **CREATE** (hook that calculates times)
3. `src/screens/ShacharitScrollScreen.tsx` — **MODIFY** (add ZmanimHeader at top)
4. `package.json` — **MODIFY** (add `@hebcal/core` and `expo-location`)

---

## Install Dependencies

```bash
npm install @hebcal/core
npx expo install expo-location
```

---

## src/hooks/useZmanim.ts

```typescript
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Zmanim, GeoLocation } from '@hebcal/core';

export interface ZmanimData {
  sofZmanTfilla: Date | null;   // End of Shacharit (GRA opinion)
  minutesRemaining: number | null;
  urgency: 'normal' | 'amber' | 'red'; // normal >30min, amber 10-30min, red <10min
  locationGranted: boolean;
}

export function useZmanim(): ZmanimData {
  const [data, setData] = useState<ZmanimData>({
    sofZmanTfilla: null,
    minutesRemaining: null,
    urgency: 'normal',
    locationGranted: false,
  });

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    async function init() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;

      // Determine timezone from device (works offline)
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const geo = new GeoLocation('user', latitude, longitude, 0, timezone);

      function calculate() {
        const now = new Date();
        const zmanim = new Zmanim(geo, now);
        const sofZmanTfilla = zmanim.sofZmanTfillaGRA(); // End of Shacharit per GRA

        const msRemaining = sofZmanTfilla.getTime() - now.getTime();
        const minutesRemaining = Math.max(0, Math.floor(msRemaining / 60000));

        let urgency: ZmanimData['urgency'] = 'normal';
        if (minutesRemaining <= 10) urgency = 'red';
        else if (minutesRemaining <= 30) urgency = 'amber';

        setData({ sofZmanTfilla, minutesRemaining, urgency, locationGranted: true });
      }

      calculate();
      interval = setInterval(calculate, 60_000); // refresh every minute
    }

    init();
    return () => clearInterval(interval);
  }, []);

  return data;
}
```

---

## src/components/shacharit/ZmanimHeader.tsx

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useZmanim } from '../../hooks/useZmanim';

// Color constants aligned with the ShacharitScrollScreen amber/gold palette
const COLORS = {
  normal: { bg: 'rgba(176,122,28,0.12)', text: '#7A5C1E', icon: '🌅' },
  amber:  { bg: 'rgba(217,119,6,0.18)',  text: '#92400E', icon: '⏳' },
  red:    { bg: 'rgba(220,38,38,0.15)',  text: '#991B1B', icon: '⚠️' },
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export const ZmanimHeader: React.FC = () => {
  const { sofZmanTfilla, minutesRemaining, urgency, locationGranted } = useZmanim();

  // Don't render until location is granted and times are calculated
  if (!locationGranted || !sofZmanTfilla || minutesRemaining === null) return null;

  // After the zman passes, don't show the header
  if (minutesRemaining <= 0) return null;

  const c = COLORS[urgency];
  const endTimeStr = formatTime(sofZmanTfilla);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>
        {c.icon}{'  '}
        <Text style={styles.label}>Shacharit ends: </Text>
        <Text style={styles.value}>{endTimeStr}</Text>
        {'  ·  '}
        <Text style={styles.value}>{minutesRemaining} min left</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(176,122,28,0.25)',
  },
  text: {
    fontSize: 12,
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  label: {
    fontWeight: '400',
    opacity: 0.8,
  },
  value: {
    fontWeight: '600',
  },
});
```

---

## ShacharitScrollScreen.tsx — Modification

Add ZmanimHeader at the top of the screen, above the FlatList. In `ShacharitScrollScreen.tsx`, find the return statement and insert:

```tsx
// Add import at top of file
import { ZmanimHeader } from '../components/shacharit/ZmanimHeader';

// In the return JSX, above the FlatList:
return (
  <SafeAreaView style={styles.safeArea}>
    <AppBar ... />
    <ZmanimHeader />          {/* ← ADD THIS LINE */}
    <ProgressRail ... />
    <FlatList ... />
    ...
  </SafeAreaView>
);
```

---

## Expo Location Permission (app.json)

Add location permission to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "DavenAlong uses your location to calculate prayer times (Zmanim) for your area."
        }
      ]
    ]
  }
}
```

---

## Notes

- The `sofZmanTfillaGRA()` method uses the Vilna Gaon's opinion — this is the stricter/more common Ashkenazic standard. For a Sephardic option, use `sofZmanTfillaMGA()`.
- The header only appears during the Shacharit zman window. After the deadline passes, it hides itself automatically.
- Color shifts: gold/amber tones at >30 min (matches the app palette), amber at 10-30 min, red at <10 min.
- This component has zero external dependencies beyond `@hebcal/core` and `expo-location`.
- `expo-location` may already be in the project — check `package.json` before adding.

---

## Next After Zmanim

After ZmanimHeader is implemented, the remaining spec item is **Dual Entry Paths**:

A `ShacharitEntryScreen` that asks first-time users:
- "I'm new to davening" → `beginner` path (transliteration default, section intros visible, "About this prayer" disclosures shown)
- "I know the prayers" → `returning` path (Hebrew default, minimal intros, no disclosures)

This preference is stored in `useSettingsStore` and is changeable in Settings. Estimated implementation: 1-2 hours.
