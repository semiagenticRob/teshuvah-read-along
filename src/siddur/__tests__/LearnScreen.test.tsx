// Note: written with React.createElement instead of JSX so ts-jest (with the
// project's `jsx: "react"` jest tsconfig override) doesn't crash the Node
// test runner. Follows the precedent set by SiddurScrollScreen.test.tsx.
import React from 'react';
// @ts-expect-error — react-test-renderer ships without types in this project.
import TestRenderer from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import LearnScreen from '../LearnScreen';
import EssayScreen from '../EssayScreen';

const navigation = {
  push: jest.fn(),
  goBack: jest.fn(),
  navigate: jest.fn(),
} as any;

test('LearnScreen renders the four-section header', () => {
  const tree = TestRenderer.create(
    React.createElement(LearnScreen, { navigation, route: {} }),
  ).toJSON();
  const flat = JSON.stringify(tree);
  expect(flat).toMatch('Essays from the siddur');
  expect(flat).toMatch('From Rabbi Feigenbaum');
  expect(flat).toMatch('Glossary');
});

test('LearnScreen shows the empty-state notice', () => {
  const tree = TestRenderer.create(
    React.createElement(LearnScreen, { navigation, route: {} }),
  ).toJSON();
  const flat = JSON.stringify(tree);
  expect(flat).toMatch("Content for Learn hasn't been bundled yet");
});

test('EssayScreen renders the essay title from the route param', () => {
  const tree = TestRenderer.create(
    React.createElement(EssayScreen, {
      navigation,
      route: { params: { essayId: 'appendix_01' } },
    }),
  ).toJSON();
  const flat = JSON.stringify(tree);
  expect(flat).toMatch('appendix_01');
});
