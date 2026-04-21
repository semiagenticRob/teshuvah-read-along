2026-04-21

Status: #baby

Tags: [[davenAlong]] [[teshuvah-read-along]] [[technical-spec]] [[react-native]] [[onboarding]]

# DavenAlong — Entry Path Screen Implementation

CEO Agent overnight run, 2026-04-21.

Proposed implementation for the dual entry path onboarding screen described in [[DavenAlong - Continuous Scroll Redesign Spec]]. This is the second remaining development unit after `ZmanimHeader` (see [[DavenAlong - ZmanimHeader Implementation]]).

DRY RUN — not committed to repo. Ready to implement when Rob approves.

---

## Status Check (as of 2026-04-21)

What's built:
- ✅ `ShacharitScrollScreen` — continuous scroll, fully navigable
- ✅ `ZmanimHeader` — implementation drafted in vault (not yet in repo)

Not yet implemented:
- ❌ `EntryPathScreen` — one-time onboarding screen for beginner/returning path selection
- ❌ `userEntryPath` field in `useSettingsStore`
- ❌ `hasCompletedOnboarding` gate in `HomeScreen` or `AppNavigator`

---

## Files to Create/Modify

1. `src/screens/EntryPathScreen.tsx` — **CREATE** (new onboarding screen)
2. `src/store/settingsStore.ts` — **MODIFY** (add `userEntryPath` + `hasCompletedOnboarding`)
3. `src/types/index.ts` — **MODIFY** (add `EntryPath` to `RootStackParamList`)
4. `src/navigation/AppNavigator.tsx` — **MODIFY** (register `EntryPathScreen` in stack)
5. `src/screens/HomeScreen.tsx` — **MODIFY** (check onboarding completion, redirect if not done)

---

## Step 1 — Extend Types (`src/types/index.ts`)

Add `EntryPath` to the navigation param list:

```typescript
// Add this type alias (near the top with other type exports)
export type UserEntryPath = 'beginner' | 'returning';

// Extend RootStackParamList:
export type RootStackParamList = {
  Home: undefined;
  EntryPath: undefined;          // ← ADD THIS
  PrayerList: { serviceId: string };
  ReadAlong: { serviceId: string; prayerIndex: number };
  ShacharitScroll: undefined;
  Settings: undefined;
  About: undefined;
};
```

---

## Step 2 — Extend Settings Store (`src/store/settingsStore.ts`)

Add two new fields and their setters. Insert into `SettingsState` interface and store implementation:

```typescript
// Add to SettingsState interface:
userEntryPath: UserEntryPath;
hasCompletedOnboarding: boolean;
setUserEntryPath: (path: UserEntryPath) => void;
setOnboardingComplete: () => void;

// Add to create() initial state:
userEntryPath: 'beginner',
hasCompletedOnboarding: false,

// Add setters:
setUserEntryPath: (path) => {
  set({ userEntryPath: path });
  AsyncStorage.setItem('@userEntryPath', path);
},
setOnboardingComplete: () => {
  set({ hasCompletedOnboarding: true });
  AsyncStorage.setItem('@hasCompletedOnboarding', 'true');
},

// In loadSettings(), add:
const storedEntryPath = await AsyncStorage.getItem('@userEntryPath');
const storedOnboarding = await AsyncStorage.getItem('@hasCompletedOnboarding');
if (storedEntryPath) set({ userEntryPath: storedEntryPath as UserEntryPath });
if (storedOnboarding === 'true') set({ hasCompletedOnboarding: true });
```

---

## Step 3 — Register Screen in Navigator (`src/navigation/AppNavigator.tsx`)

```typescript
// Import at top:
import EntryPathScreen from '../screens/EntryPathScreen';

// Add inside Stack.Navigator, before or after the Home screen:
<Stack.Screen
  name="EntryPath"
  component={EntryPathScreen}
  options={{ headerShown: false }}
/>
```

---

## Step 4 — Add Onboarding Gate to HomeScreen (`src/screens/HomeScreen.tsx`)

When the user taps the Shacharit card, check if onboarding is complete before navigating:

```typescript
// In HomeScreen, pull from settings store:
const { hasCompletedOnboarding } = useSettingsStore();

// Update the Shacharit card onPress:
onPress={() =>
  service.id === 'shacharit'
    ? hasCompletedOnboarding
      ? navigation.navigate('ShacharitScroll')
      : navigation.navigate('EntryPath')
    : navigation.navigate('PrayerList', { serviceId: service.id })
}
```

---

## Step 5 — Create EntryPathScreen (`src/screens/EntryPathScreen.tsx`)

Full implementation:

```typescript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, UserEntryPath } from '../types';
import { useSettingsStore } from '../store/settingsStore';
import { PARCHMENT, INK, FONTS, SECTIONS } from '../theme/shacharitTheme';

type Props = StackScreenProps<RootStackParamList, 'EntryPath'>;

const AMBER = SECTIONS.birchot; // amber/gold from Shacharit theme

interface PathOption {
  path: UserEntryPath;
  hebrew: string;
  englishLabel: string;
  englishSub: string;
  description: string;
  accent: string;
}

const PATH_OPTIONS: PathOption[] = [
  {
    path: 'beginner',
    hebrew: 'לְהַתְחִיל',
    englishLabel: 'New to davening',
    englishSub: 'מַתְחִיל',
    description:
      'Section introductions explain what each prayer means and why we say it. Transliteration is shown by default so you can follow along without reading Hebrew.',
    accent: AMBER.medium,
  },
  {
    path: 'returning',
    hebrew: 'לַחֲזוֹר',
    englishLabel: 'Coming back to it',
    englishSub: 'חוֹזֵר',
    description:
      'A clean siddur-style view. Section headers appear without explanatory text. Hebrew is shown by default. Transliteration and English are one tap away.',
    accent: SECTIONS.shema.medium,
  },
];

const EntryPathScreen: React.FC<Props> = ({ navigation }) => {
  const { setUserEntryPath, setOnboardingComplete } = useSettingsStore();

  const handleSelect = (path: UserEntryPath) => {
    setUserEntryPath(path);
    setOnboardingComplete();
    navigation.replace('ShacharitScroll');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={[PARCHMENT, '#ECD19740']}
        locations={[0, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>Daven Along</Text>
        <Text style={styles.prompt}>Where are you in your davening journey?</Text>
        <Text style={styles.promptSub}>
          This shapes how the siddur presents itself. You can change it any time in Settings.
        </Text>
      </View>

      {/* Path cards */}
      <View style={styles.cards}>
        {PATH_OPTIONS.map((opt) => (
          <Pressable
            key={opt.path}
            onPress={() => handleSelect(opt.path)}
            style={({ pressed }) => [
              styles.card,
              { borderColor: opt.accent, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            {/* Accent top bar */}
            <View style={[styles.cardAccent, { backgroundColor: opt.accent }]} />

            <View style={styles.cardBody}>
              <Text style={styles.hebrewLabel}>{opt.hebrew}</Text>
              <Text style={styles.englishLabel}>{opt.englishLabel}</Text>
              <Text style={styles.englishSub}>{opt.englishSub}</Text>
              <Text style={styles.description}>{opt.description}</Text>
            </View>

            {/* Arrow indicator */}
            <View style={[styles.arrow, { backgroundColor: opt.accent + '22' }]}>
              <Text style={[styles.arrowText, { color: opt.accent }]}>→</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Skip / Settings note */}
      <Text style={styles.footer}>
        You can switch between paths any time in{' '}
        <Text style={styles.footerEmphasis}>Settings → Siddur preference</Text>.
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PARCHMENT,
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 32,
  },
  appName: {
    fontFamily: FONTS?.display ?? 'Georgia',
    fontSize: 14,
    color: INK.light,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  prompt: {
    fontFamily: FONTS?.display ?? 'Georgia',
    fontSize: 26,
    color: INK.primary,
    lineHeight: 34,
    marginBottom: 12,
  },
  promptSub: {
    fontFamily: FONTS?.body ?? 'System',
    fontSize: 15,
    color: INK.secondary,
    lineHeight: 22,
  },
  cards: {
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFDF8',
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAccent: {
    height: 4,
    width: '100%',
  },
  cardBody: {
    padding: 20,
    paddingBottom: 12,
  },
  hebrewLabel: {
    fontFamily: FONTS?.hebrew ?? 'System',
    fontSize: 28,
    color: INK.primary,
    textAlign: 'right',
    marginBottom: 8,
  },
  englishLabel: {
    fontFamily: FONTS?.display ?? 'Georgia',
    fontSize: 19,
    color: INK.primary,
    marginBottom: 2,
  },
  englishSub: {
    fontFamily: FONTS?.body ?? 'System',
    fontSize: 13,
    color: INK.light,
    marginBottom: 12,
  },
  description: {
    fontFamily: FONTS?.body ?? 'System',
    fontSize: 14,
    color: INK.secondary,
    lineHeight: 21,
  },
  arrow: {
    alignSelf: 'flex-end',
    margin: 16,
    marginTop: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
    paddingHorizontal: 28,
    fontSize: 13,
    color: INK.light,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerEmphasis: {
    color: INK.secondary,
    fontStyle: 'italic',
  },
});

export default EntryPathScreen;
```

---

## SectionIntroCard — Beginner vs. Returning Behavior

The `SectionIntro` component in `ShacharitScrollScreen` already exists. To support beginner/returning behavior, modify it to accept and use `userEntryPath`:

```typescript
// In ShacharitScrollScreen.tsx, pull entry path from store:
const { userEntryPath } = useSettingsStore();

// Pass to SectionIntro render item:
case 'intro':
  return (
    <SectionIntro
      sectionId={item.sectionId}
      isFirst={item.isFirst}
      entryPath={userEntryPath}   // ← ADD THIS PROP
    />
  );
```

Then in `SectionIntro.tsx`, conditionally show/hide the description text:

```typescript
// In SectionIntro props:
entryPath?: UserEntryPath;

// In render:
{entryPath !== 'returning' && (
  <Text style={styles.description}>{SECTION_DESCRIPTIONS[sectionId]}</Text>
)}
```

Add a `SECTION_DESCRIPTIONS` map to `SectionIntro.tsx` or `structure.ts` with explanation text for each section (beginner-oriented copy).

---

## Implementation Order

Suggested sequence to avoid breaking the existing flow:

1. **Add types** — `UserEntryPath` to `types/index.ts` + `EntryPath` to `RootStackParamList`
2. **Extend settings store** — add `userEntryPath` + `hasCompletedOnboarding` + persistence
3. **Create `EntryPathScreen.tsx`** — paste the code above
4. **Register in `AppNavigator.tsx`** — add `EntryPath` screen to stack
5. **Gate in `HomeScreen.tsx`** — redirect to EntryPath if onboarding not complete
6. **Wire into `ShacharitScrollScreen`** — pass `userEntryPath` to `SectionIntro`
7. **Update `SectionIntro.tsx`** — accept prop, conditionally show description

Total estimated dev time: 60–90 minutes.

---

## Settings Screen Addition (optional, post-MVP)

After onboarding, let the user change their path in Settings:

```typescript
// In SettingsScreen.tsx, add a new section:
<View style={styles.section}>
  <Text style={styles.sectionLabel}>Siddur Preference</Text>
  <View style={styles.segmentRow}>
    <Pressable
      onPress={() => setUserEntryPath('beginner')}
      style={[styles.segment, userEntryPath === 'beginner' && styles.segmentActive]}
    >
      <Text>New to davening</Text>
    </Pressable>
    <Pressable
      onPress={() => setUserEntryPath('returning')}
      style={[styles.segment, userEntryPath === 'returning' && styles.segmentActive]}
    >
      <Text>Coming back</Text>
    </Pressable>
  </View>
</View>
```

---

## References

- [[DavenAlong - Continuous Scroll Redesign Spec]] — parent design doc
- [[DavenAlong - ZmanimHeader Implementation]] — the other remaining dev unit
- [[DavenAlong - Zmanim API Research]] — @hebcal/core integration details
