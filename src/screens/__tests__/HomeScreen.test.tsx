// Written with React.createElement instead of JSX so ts-jest (with the
// project's `jsx: "react"` jest tsconfig override) doesn't crash the Node
// test runner. Follows the precedent set by SiddurScrollScreen.test.tsx.
import React from 'react';
// @ts-expect-error — react-test-renderer ships without types in this project.
import TestRenderer from 'react-test-renderer';
import { Pressable } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('../../components/ZmanimHeader', () => ({
  ZmanimHeader: () => null,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => children ?? null,
}));


import { HomeScreen } from '../HomeScreen';
import { CARDS } from '../../data/siddur/cards';

function makeNav() {
  return { navigate: jest.fn(), push: jest.fn(), goBack: jest.fn() } as any;
}

function renderScreen(nav: any) {
  return TestRenderer.create(
    React.createElement(HomeScreen, {
      route: { params: {} },
      navigation: nav,
    }),
  );
}

function collectStrings(node: any, out: string[]): void {
  if (node == null) return;
  if (typeof node === 'string' || typeof node === 'number') {
    out.push(String(node));
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) collectStrings(child, out);
    return;
  }
  const children = node?.props?.children ?? node?.children;
  collectStrings(children, out);
}

function pressableContaining(root: any, text: string): any | null {
  const pressables = root.findAllByType(Pressable);
  for (const p of pressables) {
    const strings: string[] = [];
    collectStrings(p.props.children, strings);
    if (strings.some((s) => s.includes(text))) return p;
  }
  return null;
}

test('renders all six card titles in print order', () => {
  const nav = makeNav();
  const tree = renderScreen(nav).toJSON();
  const flat = JSON.stringify(tree);
  for (const card of CARDS) {
    expect(flat).toContain(card.title.en);
    expect(flat).toContain(card.title.he);
  }
});

test('tapping the Learn card navigates to the Learn screen', () => {
  const nav = makeNav();
  const r = renderScreen(nav);
  const p = pressableContaining(r.root, 'Learn');
  expect(p).not.toBeNull();
  p.props.onPress();
  expect(nav.navigate).toHaveBeenCalledWith('Learn');
});

test('tapping the Mincha card navigates to SiddurScroll with cardId=mincha', () => {
  const nav = makeNav();
  const r = renderScreen(nav);
  const p = pressableContaining(r.root, 'Mincha');
  expect(p).not.toBeNull();
  p.props.onPress();
  expect(nav.navigate).toHaveBeenCalledWith('SiddurScroll', { cardId: 'mincha' });
});

test('tapping the Shacharit card respects the feature flag', () => {
  const nav = makeNav();
  const r = renderScreen(nav);
  const p = pressableContaining(r.root, 'Shacharit');
  expect(p).not.toBeNull();
  p.props.onPress();
  expect(nav.navigate).toHaveBeenCalledWith('ShacharitScroll');
});
