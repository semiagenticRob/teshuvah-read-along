// V2 scaffolding sanity test — these hooks are not driven at MVP, but their
// presence and the tuned 85ms anticipation offset must survive the remap.
// See spec §4.4 ("Kept as load-bearing").

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import * as audioPlayerModule from '../useAudioPlayer';
import * as wordSyncModule from '../useWordSync';
import fs from 'fs';
import path from 'path';

test('useAudioPlayer module exports something', () => {
  expect(Object.keys(audioPlayerModule).length).toBeGreaterThan(0);
});

test('useWordSync module exports something', () => {
  expect(Object.keys(wordSyncModule).length).toBeGreaterThan(0);
});

test('useWordSync source still contains the tuned ANTICIPATION_OFFSET_MS = 85', () => {
  const src = fs.readFileSync(path.join(__dirname, '../useWordSync.ts'), 'utf8');
  expect(src).toMatch(/ANTICIPATION_OFFSET_MS\s*=\s*85/);
});

test('useWordSync source still uses ~50ms poll cadence', () => {
  const src = fs.readFileSync(path.join(__dirname, '../useWordSync.ts'), 'utf8');
  // Look for either inline 50 in setInterval or a POLL_MS / SYNC_INTERVAL_MS constant set to 50
  const hasInline = /setInterval[\s\S]{0,80}50/.test(src);
  const hasConstant = /(POLL_(MS|INTERVAL)|SYNC_INTERVAL_MS)\s*=\s*50/i.test(src);
  expect(hasInline || hasConstant).toBe(true);
});
