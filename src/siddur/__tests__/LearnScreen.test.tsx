// Note: written with React.createElement instead of JSX so ts-jest (with the
// project's `jsx: "react"` jest tsconfig override) doesn't crash the Node
// test runner. Follows the precedent set by SiddurScrollScreen.test.tsx.
import React from 'react';
// @ts-expect-error — react-test-renderer ships without types in this project.
import TestRenderer from 'react-test-renderer';
import { ESSAYS } from '../../data/siddur/learn';
import type { LearnEssay } from '../types';

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

test('renders at least 12 appendix rows', () => {
  const appendixEssays: LearnEssay[] = Object.values(ESSAYS)
    .map((load) => load())
    .filter((e) => e.essayKind === 'appendix');
  expect(appendixEssays.length).toBeGreaterThanOrEqual(12);

  const tree = TestRenderer.create(
    React.createElement(LearnScreen, { navigation, route: {} }),
  ).toJSON();
  const flat = JSON.stringify(tree);

  let renderedCount = 0;
  for (const essay of appendixEssays) {
    // Use a substring that avoids special characters in quotes / slashes
    const snippet = essay.title.en.substring(0, 10);
    if (flat.includes(snippet)) renderedCount++;
  }
  expect(renderedCount).toBeGreaterThanOrEqual(12);
});

test('tapping an appendix calls navigate Essay', () => {
  const nav = { ...navigation, navigate: jest.fn() };
  const renderer = TestRenderer.create(
    React.createElement(LearnScreen, { navigation: nav, route: {} }),
  );

  // Find all Pressable nodes (component type)
  const { Pressable } = require('react-native');
  const pressables = renderer.root.findAllByType(Pressable);
  // First pressable is the back button; second is the first essay row
  // (no "recently relevant" section since there is no mock progress)
  expect(pressables.length).toBeGreaterThan(1);
  const firstEssayRow = pressables[1]; // skip back button at index 0
  firstEssayRow.props.onPress();
  expect(nav.navigate).toHaveBeenCalledWith(
    'Essay',
    { essayId: expect.stringContaining('appendix') },
  );
});

test('renders From Rabbi Feigenbaum section header', () => {
  const tree = TestRenderer.create(
    React.createElement(LearnScreen, { navigation, route: {} }),
  ).toJSON();
  const flat = JSON.stringify(tree);
  expect(flat).toMatch('From Rabbi Feigenbaum');
});

test('renders Glossary section header', () => {
  const tree = TestRenderer.create(
    React.createElement(LearnScreen, { navigation, route: {} }),
  ).toJSON();
  const flat = JSON.stringify(tree);
  expect(flat).toMatch('Glossary');
});

test('EssayScreen renders the essay title', () => {
  const tree = TestRenderer.create(
    React.createElement(EssayScreen, {
      navigation,
      route: { params: { essayId: 'appendix_09_korbanos' } },
    }),
  ).toJSON();
  const flat = JSON.stringify(tree);
  expect(flat).toMatch('Korbanos');
});

test('EssayScreen renders body content', () => {
  const tree = TestRenderer.create(
    React.createElement(EssayScreen, {
      navigation,
      route: { params: { essayId: 'appendix_09_korbanos' } },
    }),
  ).toJSON();
  const flat = JSON.stringify(tree);
  // Body should have content beyond just the title
  expect(flat.length).toBeGreaterThan(200);
  expect(flat).toMatch('Korbanos');
});

test('EssayScreen shows anchoredFrom rows', () => {
  const tree = TestRenderer.create(
    React.createElement(EssayScreen, {
      navigation,
      route: { params: { essayId: 'appendix_09_korbanos' } },
    }),
  ).toJSON();
  const flat = JSON.stringify(tree);
  expect(flat).toMatch('pitum_haketores');
});

test('EssayScreen tapping a reverse-link navigates to SiddurScroll', () => {
  const nav = { ...navigation, navigate: jest.fn() };
  const renderer = TestRenderer.create(
    React.createElement(EssayScreen, {
      navigation: nav,
      route: { params: { essayId: 'appendix_09_korbanos' } },
    }),
  );

  const { Pressable } = require('react-native');
  const pressables = renderer.root.findAllByType(Pressable);
  // Find the anchor row pressable (not the back button)
  // The back button is first; anchor rows come after body content
  const anchorPressable = pressables.find((p: any) => {
    const onPress = p.props.onPress;
    return onPress && p !== pressables[0];
  });
  expect(anchorPressable).toBeDefined();
  anchorPressable.props.onPress();
  expect(nav.navigate).toHaveBeenCalledWith(
    'SiddurScroll',
    expect.objectContaining({ cardId: 'shacharit' }),
  );
});
