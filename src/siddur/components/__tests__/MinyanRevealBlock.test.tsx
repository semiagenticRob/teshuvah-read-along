// Note: written with React.createElement instead of JSX so ts-jest (with the
// project's existing `jsx: "react-native"` tsconfig) doesn't preserve JSX
// syntax in the emitted output, which would crash the Node-side test runner.
import React from 'react';
// @ts-expect-error — react-test-renderer ships without types in this project.
import TestRenderer from 'react-test-renderer';
import { Pressable } from 'react-native';
import MinyanRevealBlock from '../MinyanRevealBlock';
import type { MinyanOnlyBlock } from '../../types';

const fixture: MinyanOnlyBlock = {
  kind: 'minyan_only',
  reason: 'barchu',
  he: [
    {
      lineIndex: 0,
      words: [
        { globalIndex: -1, text: 'בָּרְכוּ' },
        { globalIndex: -1, text: 'אֶת' },
      ],
    },
  ],
  en: [{ spans: [{ text: 'Bless Hashem.' }] }],
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

test('MinyanRevealBlock is collapsed by default — Hebrew not visible, prompt visible', () => {
  const renderer = TestRenderer.create(React.createElement(MinyanRevealBlock, { data: fixture }));
  const flat = flattenText(renderer.toJSON());
  expect(flat).toMatch(/minyan/i);
  expect(flat).not.toMatch('בָּרְכוּ');
});

test('MinyanRevealBlock reveals content when prompt is pressed', () => {
  const renderer = TestRenderer.create(React.createElement(MinyanRevealBlock, { data: fixture }));
  const pressables = renderer.root.findAllByType(Pressable);
  expect(pressables.length).toBeGreaterThan(0);
  TestRenderer.act(() => {
    (pressables[0].props.onPress as () => void)();
  });
  const flat = flattenText(renderer.toJSON());
  expect(flat).toMatch('בָּרְכוּ');
  expect(flat).toMatch(/Bless Hashem/);
});

test('Revealed MinyanRevealBlock does not render any Halo component', () => {
  const renderer = TestRenderer.create(React.createElement(MinyanRevealBlock, { data: fixture }));
  const pressables = renderer.root.findAllByType(Pressable);
  TestRenderer.act(() => {
    (pressables[0].props.onPress as () => void)();
  });
  const serialized = JSON.stringify(renderer.toJSON());
  expect(serialized).not.toMatch(/Halo/);
});
