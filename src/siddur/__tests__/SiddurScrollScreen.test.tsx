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

test('renders the seed section header and at least one Hebrew word', () => {
  const tree = renderScreen().toJSON();
  const flat = JSON.stringify(tree);
  expect(flat).toMatch('Modeh Ani');
  expect(flat).toMatch('מוֹדֶה');
});

test('renders the FAQ collapsed by default', () => {
  const tree = renderScreen().toJSON();
  const flat = JSON.stringify(tree);
  expect(flat).toMatch('Why this prayer first');
  expect(flat).not.toMatch('gratitude opens the day');
});

test('renders the minyan-only block collapsed by default', () => {
  const tree = renderScreen().toJSON();
  const flat = JSON.stringify(tree);
  expect(flat).not.toMatch('בָּרְכוּ');
});
