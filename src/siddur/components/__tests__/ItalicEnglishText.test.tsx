// Note: written with React.createElement instead of JSX so ts-jest (with the
// project's existing `jsx: "react-native"` tsconfig) doesn't preserve JSX
// syntax in the emitted output, which would crash the Node-side test runner.
import React from 'react';
// @ts-expect-error — react-test-renderer ships without types in this project;
// no @types/react-test-renderer dependency yet (Plan A Task 9 scope).
import TestRenderer from 'react-test-renderer';
import ItalicEnglishText from '../ItalicEnglishText';
import type { EnglishSpan } from '../../types';

function render(spans: EnglishSpan[]) {
  return TestRenderer.create(
    React.createElement(ItalicEnglishText, { spans }),
  );
}

/** Collect all string children from a rendered react-test-renderer tree. */
function flattenText(node: unknown): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join('');
  if (typeof node === 'object' && node !== null && 'children' in (node as Record<string, unknown>)) {
    return flattenText((node as { children: unknown }).children);
  }
  return '';
}

/**
 * Walk the rendered tree and find the first node whose flattened text
 * exactly matches `text`. Returns the node (with `.props`) or null.
 */
function findNodeByText(node: unknown, text: string): { props: Record<string, unknown> } | null {
  if (node == null || typeof node === 'boolean') return null;
  if (typeof node === 'string' || typeof node === 'number') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findNodeByText(child, text);
      if (found) return found;
    }
    return null;
  }
  if (typeof node === 'object' && node !== null) {
    const n = node as { children?: unknown; props?: Record<string, unknown> };
    if (n.children != null && flattenText(n.children) === text) {
      return n as { props: Record<string, unknown> };
    }
    if (n.children != null) {
      const found = findNodeByText(n.children, text);
      if (found) return found;
    }
  }
  return null;
}

function flattenStyle(style: unknown): Record<string, unknown> {
  if (style == null) return {};
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.filter(Boolean).map(flattenStyle));
  }
  if (typeof style === 'object') return style as Record<string, unknown>;
  return {};
}

test('renders plain spans as default-styled text', () => {
  const tree = render([{ text: 'Blessed are You' }]).toJSON();
  const flat = flattenText(tree);
  expect(flat).toMatch('Blessed are You');
});

test('renders italic spans with serifBodyItalic font', () => {
  const tree = render([
    { text: 'Happy are those who ' },
    { text: 'wherever they are', style: 'italic' },
    { text: ' are living in the house of Hashem.' },
  ]).toJSON();
  const node = findNodeByText(tree, 'wherever they are');
  expect(node).not.toBeNull();
  const flat = flattenStyle(node!.props.style);
  expect(String(flat.fontFamily)).toMatch(/Italic/);
});

test('handles consecutive italic spans without collapsing them', () => {
  const tree = render([
    { text: 'one', style: 'italic' },
    { text: 'two', style: 'italic' },
  ]).toJSON();
  const flat = flattenText(tree);
  expect(flat).toMatch(/one/);
  expect(flat).toMatch(/two/);
  // Both rendered as separate nodes (not concatenated into a single span).
  const oneNode = findNodeByText(tree, 'one');
  const twoNode = findNodeByText(tree, 'two');
  expect(oneNode).not.toBeNull();
  expect(twoNode).not.toBeNull();
});
