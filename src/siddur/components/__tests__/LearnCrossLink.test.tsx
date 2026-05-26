// Note: written with React.createElement instead of JSX so ts-jest (with the
// project's existing `jsx: "react-native"` tsconfig) doesn't preserve JSX
// syntax in the emitted output, which would crash the Node-side test runner.
import React from 'react';
// @ts-expect-error — react-test-renderer ships without types in this project.
import TestRenderer from 'react-test-renderer';
import { Pressable } from 'react-native';
import LearnCrossLink from '../LearnCrossLink';

function flattenText(node: unknown): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join(' ');
  if (typeof node === 'object' && node !== null && 'children' in (node as Record<string, unknown>)) {
    return flattenText((node as { children: unknown }).children);
  }
  return '';
}

test('LearnCrossLink renders the prompt text when provided', () => {
  const renderer = TestRenderer.create(
    React.createElement(LearnCrossLink, {
      essayId: 'why-we-pray',
      promptText: 'Read more about morning gratitude',
      onPress: () => {},
    }),
  );
  const flat = flattenText(renderer.toJSON());
  expect(flat).toMatch(/Read more about morning gratitude/);
});

test('LearnCrossLink falls back to essayId when promptText is missing', () => {
  const renderer = TestRenderer.create(
    React.createElement(LearnCrossLink, {
      essayId: 'why-we-pray',
      onPress: () => {},
    }),
  );
  const flat = flattenText(renderer.toJSON());
  expect(flat).toMatch(/why-we-pray/);
});

test('LearnCrossLink invokes onPress with the essayId when tapped', () => {
  const calls: string[] = [];
  const renderer = TestRenderer.create(
    React.createElement(LearnCrossLink, {
      essayId: 'why-we-pray',
      promptText: 'Read more',
      onPress: (id: string) => calls.push(id),
    }),
  );
  const pressables = renderer.root.findAllByType(Pressable);
  expect(pressables.length).toBeGreaterThan(0);
  TestRenderer.act(() => {
    (pressables[0].props.onPress as () => void)();
  });
  expect(calls).toEqual(['why-we-pray']);
});
