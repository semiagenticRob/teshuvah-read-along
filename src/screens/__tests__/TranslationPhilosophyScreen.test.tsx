// Note: written with React.createElement instead of JSX so ts-jest (with the
// project's `jsx: "react"` jest tsconfig override) doesn't crash the Node
// test runner. Follows the precedent set by SiddurScrollScreen.test.tsx.
import React from 'react';
// @ts-expect-error — react-test-renderer ships without types in this project.
import TestRenderer from 'react-test-renderer';
import { Pressable } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import TranslationPhilosophyScreen from '../TranslationPhilosophyScreen';

test('renders the translation note title and Feigenbaum example', () => {
  const tree = TestRenderer.create(
    React.createElement(TranslationPhilosophyScreen, {
      mode: 'onboarding',
      onComplete: jest.fn(),
    }),
  ).toJSON();
  const flat = JSON.stringify(tree);
  expect(flat).toMatch('About this translation');
  expect(flat).toMatch('wherever they are');
});

test('shows specific word choices (Baruch, Kadosh, Shem)', () => {
  const tree = TestRenderer.create(
    React.createElement(TranslationPhilosophyScreen, {
      mode: 'onboarding',
      onComplete: jest.fn(),
    }),
  ).toJSON();
  const flat = JSON.stringify(tree);
  expect(flat).toMatch('Source of everything');
  expect(flat).toMatch('separate and removed');
  expect(flat).toMatch('impact and presence');
});

test('onboarding mode: tapping "Got it" invokes onComplete', () => {
  const onComplete = jest.fn();
  const instance = TestRenderer.create(
    React.createElement(TranslationPhilosophyScreen, {
      mode: 'onboarding',
      onComplete,
    }),
  );
  const pressables = instance.root.findAllByType(Pressable);
  // In onboarding mode there is only the one Pressable (the "Got it" CTA).
  expect(pressables.length).toBe(1);
  pressables[0].props.onPress();
  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('settings mode: shows a back affordance instead of "Got it"', () => {
  const goBack = jest.fn();
  const tree = TestRenderer.create(
    React.createElement(TranslationPhilosophyScreen, {
      mode: 'settings',
      navigation: { goBack },
    }),
  ).toJSON();
  const flat = JSON.stringify(tree);
  expect(flat).not.toMatch('Got it');
  expect(flat).toMatch('Settings');
});
