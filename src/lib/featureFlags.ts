// src/lib/featureFlags.ts
// Toggle off when Plan B's content lands and Plan C cuts over.
// At that point the legacy Shacharit scroll is deleted entirely.
export const FEATURE_FLAGS = {
  USE_LEGACY_SHACHARIT_SCROLL: true,
} as const;
