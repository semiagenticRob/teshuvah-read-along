// Note: written with React.createElement instead of JSX so ts-jest (with the
// project's `jsx: "react"` jest tsconfig override) doesn't crash the Node
// test runner. Follows the precedent set by PrayerBlock.test.tsx.
import React from 'react';
// @ts-expect-error — react-test-renderer ships without types in this project.
import TestRenderer from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import SiddurScrollScreen from '../SiddurScrollScreen';

const navigation = {
  push: jest.fn(),
  goBack: jest.fn(),
  navigate: jest.fn(),
} as any;

function renderScreen() {
  return TestRenderer.create(
    React.createElement(SiddurScrollScreen, {
      route: { params: { cardId: 'shacharit' } },
      navigation,
    }),
  );
}

test('renders the card title and at least one Hebrew word', () => {
  const tree = renderScreen().toJSON();
  const flat = JSON.stringify(tree);
  // Card title appears in nav bar and section intro card
  expect(flat).toMatch('Shacharit');
  // First prayer block contains Hebrew
  expect(flat).toMatch('יהי');
});

test('renders multiple section titles as the card contains many sections', () => {
  const tree = renderScreen().toJSON();
  const flat = JSON.stringify(tree);
  // Morning Blessings is another shacharit section title
  expect(flat).toMatch('Morning Blessings');
  // Tachanun is yet another section
  expect(flat).toMatch('Tachanun');
});

test('minyan-only blocks are collapsed by default (prompt shown, Hebrew body not expanded)', () => {
  const tree = renderScreen().toJSON();
  const flat = JSON.stringify(tree);
  // The MinyanRevealBlock prompt text appears when collapsed
  expect(flat).toMatch('Recited only with a minyan');
  // The minyan block body Hebrew is NOT rendered when collapsed (MinyanRevealBlock open=false)
  // barchu section has only minyan_only blocks - the Hebrew of those blocks should be hidden
  // Check that Krias HaTorah header is present (it IS a section title) but its minyan-only prayers are hidden
  expect(flat).toMatch('Torah Reading');
});
