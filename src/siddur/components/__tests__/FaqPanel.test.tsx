// Note: written with React.createElement instead of JSX so ts-jest (with the
// project's existing `jsx: "react-native"` tsconfig) doesn't preserve JSX
// syntax in the emitted output, which would crash the Node-side test runner.
import React from 'react';
// @ts-expect-error — react-test-renderer ships without types in this project.
import TestRenderer from 'react-test-renderer';
import { Pressable } from 'react-native';
import FaqPanel from '../FaqPanel';
import type { FaqBlock } from '../../types';

const faqFixture: FaqBlock = {
  kind: 'faq',
  title: 'Why this prayer first?',
  body: [{ spans: [{ text: 'Because gratitude opens the day.' }] }],
};

const insightFixture: FaqBlock = {
  kind: 'instant_insight',
  title: 'A quick thought',
  body: [{ spans: [{ text: 'A flash of insight.' }] }],
};

function flattenText(node: unknown): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join(' ');
  if (typeof node === 'object' && node !== null && 'children' in (node as Record<string, unknown>)) {
    return flattenText((node as { children: unknown }).children);
  }
  return '';
}

test('FaqPanel is collapsed by default — body not in tree, title visible', () => {
  const renderer = TestRenderer.create(React.createElement(FaqPanel, { data: faqFixture }));
  const tree = renderer.toJSON();
  const flat = flattenText(tree);
  expect(flat).toMatch('Why this prayer first?');
  expect(flat).not.toMatch(/Because gratitude opens the day\./);
});

test('FaqPanel expands when the chip is pressed', () => {
  const renderer = TestRenderer.create(React.createElement(FaqPanel, { data: faqFixture }));
  const pressables = renderer.root.findAllByType(Pressable);
  expect(pressables.length).toBeGreaterThan(0);
  TestRenderer.act(() => {
    (pressables[0].props.onPress as () => void)();
  });
  const flat = flattenText(renderer.toJSON());
  expect(flat).toMatch(/Because gratitude opens the day\./);
});

test('FaqPanel uses ❓ icon for kind: faq', () => {
  const renderer = TestRenderer.create(React.createElement(FaqPanel, { data: faqFixture }));
  const flat = flattenText(renderer.toJSON());
  expect(flat).toMatch('❓');
});

test('FaqPanel uses 💡 icon for kind: instant_insight', () => {
  const renderer = TestRenderer.create(React.createElement(FaqPanel, { data: insightFixture }));
  const flat = flattenText(renderer.toJSON());
  expect(flat).toMatch('💡');
});
