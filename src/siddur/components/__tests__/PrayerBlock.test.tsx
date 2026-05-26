// Note: written with React.createElement instead of JSX so ts-jest (with the
// project's existing `jsx: "react-native"` tsconfig) doesn't preserve JSX
// syntax in the emitted output, which would crash the Node-side test runner.
import React from 'react';
// @ts-expect-error — react-test-renderer ships without types in this project;
// no @types/react-test-renderer dependency yet (Plan A Task 9 scope).
import TestRenderer from 'react-test-renderer';
import PrayerBlock from '../PrayerBlock';
import type { PrayerBlock as PrayerBlockData } from '../../types';

const fixture: PrayerBlockData = {
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

function renderPrayerBlock(props: {
  activeWordIndex: number | null;
  showHebrew: boolean;
  showTranslit: boolean;
  showEnglish: boolean;
}) {
  return TestRenderer.create(
    React.createElement(PrayerBlock, { data: fixture, ...props }),
  );
}

test('renders Hebrew words from a PrayerBlock', () => {
  const tree = renderPrayerBlock({
    activeWordIndex: null,
    showHebrew: true,
    showTranslit: false,
    showEnglish: false,
  }).toJSON();
  const flat = flattenText(tree);
  expect(flat).toMatch('מוֹדֶה');
  expect(flat).toMatch('אֲנִי');
});

test('renders English when showEnglish is true', () => {
  const tree = renderPrayerBlock({
    activeWordIndex: null,
    showHebrew: false,
    showTranslit: false,
    showEnglish: true,
  }).toJSON();
  const flat = flattenText(tree);
  expect(flat).toMatch(/I thank You/);
});

test('does not import or render commentary markers', () => {
  const tree = renderPrayerBlock({
    activeWordIndex: null,
    showHebrew: true,
    showTranslit: false,
    showEnglish: true,
  }).toJSON();
  const flat = JSON.stringify(tree);
  expect(flat).not.toMatch(/FootnoteMarker/);
  expect(flat).not.toMatch(/commentary/i);
});
