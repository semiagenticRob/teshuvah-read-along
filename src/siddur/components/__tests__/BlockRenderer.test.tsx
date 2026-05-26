// Note: written with React.createElement instead of JSX so ts-jest (with the
// project's existing `jsx: "react-native"` tsconfig) doesn't preserve JSX
// syntax in the emitted output, which would crash the Node-side test runner.
import React from 'react';
// @ts-expect-error — react-test-renderer ships without types in this project;
// no @types/react-test-renderer dependency yet (Plan A Task 9 scope).
import TestRenderer from 'react-test-renderer';
import BlockRenderer from '../BlockRenderer';
import type {
  PrayerBlock as PrayerBlockData,
  HeadingBlock,
  RubricBlock,
  FaqBlock,
  MinyanOnlyBlock,
  LearnCrossLinkBlock,
} from '../../types';

const defaultProps = {
  activeWordIndex: null,
  showHebrew: true,
  showTranslit: false,
  showEnglish: true,
  onLearnLinkPress: jest.fn(),
};

/** Collect all string children from a rendered react-test-renderer tree. */
function flattenText(node: unknown): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join(' ');
  if (typeof node === 'object' && node !== null && 'children' in (node as Record<string, unknown>)) {
    return flattenText((node as { children: unknown }).children);
  }
  return '';
}

test('prayer block renders Hebrew word text', () => {
  const block: PrayerBlockData = {
    kind: 'prayer',
    he: [
      {
        lineIndex: 0,
        words: [
          { globalIndex: 0, text: 'מוֹדֶה' },
          { globalIndex: 1, text: 'אֲנִי' },
        ],
      },
    ],
    en: [
      {
        spans: [{ text: 'I thank You' }],
        anchorLine: 0,
      },
    ],
    wordIndexStart: 0,
    wordIndexEnd: 1,
  };
  const tree = TestRenderer.create(
    React.createElement(BlockRenderer, { block, ...defaultProps }),
  ).toJSON();
  const flat = flattenText(tree);
  expect(flat).toMatch('מוֹדֶה');
});

test('heading block renders English text', () => {
  const block: HeadingBlock = {
    kind: 'heading',
    he: 'בִּרְכוֹת הַשַּׁחַר',
    en: 'Morning Blessings',
  };
  const tree = TestRenderer.create(
    React.createElement(BlockRenderer, { block, ...defaultProps }),
  ).toJSON();
  const flat = flattenText(tree);
  expect(flat).toMatch(/Morning Blessings/);
});

test('rubric block renders English text', () => {
  const block: RubricBlock = {
    kind: 'rubric',
    text: { he: 'יֹאמַר', en: 'Recite while standing' },
    italic: true,
  };
  const tree = TestRenderer.create(
    React.createElement(BlockRenderer, { block, ...defaultProps }),
  ).toJSON();
  const flat = flattenText(tree);
  expect(flat).toMatch(/Recite while standing/);
});

test('faq block renders the title; body not in tree initially (collapsed)', () => {
  const block: FaqBlock = {
    kind: 'faq',
    title: 'Why do we say Modeh Ani?',
    body: [{ spans: [{ text: 'Because we thank God for restoring our soul.' }] }],
  };
  const tree = TestRenderer.create(
    React.createElement(BlockRenderer, { block, ...defaultProps }),
  ).toJSON();
  const flat = flattenText(tree);
  expect(flat).toMatch(/Why do we say Modeh Ani\?/);
  expect(flat).not.toMatch(/restoring our soul/);
});

test('minyan_only block renders the minyan prompt; Hebrew not in tree initially', () => {
  const block: MinyanOnlyBlock = {
    kind: 'minyan_only',
    reason: 'kaddish',
    he: [
      {
        lineIndex: 0,
        words: [{ globalIndex: -1, text: 'יִתְגַּדַּל' }],
      },
    ],
    en: [{ spans: [{ text: 'Magnified and sanctified...' }] }],
  };
  const tree = TestRenderer.create(
    React.createElement(BlockRenderer, { block, ...defaultProps }),
  ).toJSON();
  const flat = flattenText(tree);
  expect(flat).toMatch(/minyan/i);
  expect(flat).not.toMatch('יִתְגַּדַּל');
});

test('learn_link block renders prompt and accepts onLearnLinkPress callback', () => {
  const onLearnLinkPress = jest.fn();
  const block: LearnCrossLinkBlock = {
    kind: 'learn_link',
    essayId: 'why-modeh-ani',
    promptText: 'Why we open with Modeh Ani',
  };
  const tree = TestRenderer.create(
    React.createElement(BlockRenderer, {
      block,
      ...defaultProps,
      onLearnLinkPress,
    }),
  ).toJSON();
  const flat = flattenText(tree);
  expect(flat).toMatch(/Why we open with Modeh Ani/);
});
