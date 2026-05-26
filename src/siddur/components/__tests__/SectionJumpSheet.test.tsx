// @ts-expect-error — react-test-renderer ships without types in this project
import TestRenderer from 'react-test-renderer';
import React from 'react';
import SectionJumpSheet from '../SectionJumpSheet';
import { Pressable } from 'react-native';

const SECTIONS = [
  { id: 'modeh-ani', title: { he: 'מוֹדֶה אֲנִי', en: 'Modeh Ani' } },
  { id: 'netilas-yadayim', title: { he: 'נְטִילַת יָדַיִם', en: 'Netilas Yadayim' } },
  { id: 'birchos-hashachar', title: { he: 'בִּרְכוֹת הַשַּׁחַר', en: 'Birchos Hashachar' } },
];

const noop = () => {};

test('renders all section rows when visible', () => {
  const tree = TestRenderer.create(
    React.createElement(SectionJumpSheet, {
      visible: true,
      sections: SECTIONS,
      activeSectionId: null,
      onSelect: noop,
      onClose: noop,
    }),
  ).toJSON();
  const json = JSON.stringify(tree);
  expect(json).toMatch('Modeh Ani');
  expect(json).toMatch('Netilas Yadayim');
  expect(json).toMatch('Birchos Hashachar');
});

test('calls onSelect when a row is tapped', () => {
  const onSelect = jest.fn();
  const instance = TestRenderer.create(
    React.createElement(SectionJumpSheet, {
      visible: true,
      sections: SECTIONS,
      activeSectionId: null,
      onSelect,
      onClose: noop,
    }),
  );

  // Find all Pressables; the first is the backdrop, then header close button, then section rows
  const pressables = instance.root.findAllByType(Pressable);
  // Rows start at index 2 (0=backdrop, 1=close button); SECTIONS index 1 = 'netilas-yadayim'
  const netilasPressable = pressables[3]; // backdrop(0) + close(1) + modeh-ani(2) + netilas(3)
  expect(netilasPressable).toBeDefined();
  TestRenderer.act(() => {
    netilasPressable.props.onPress();
  });
  expect(onSelect).toHaveBeenCalledWith('netilas-yadayim');
});

test('calls onClose when backdrop is tapped', () => {
  const onClose = jest.fn();
  const instance = TestRenderer.create(
    React.createElement(SectionJumpSheet, {
      visible: true,
      sections: SECTIONS,
      activeSectionId: null,
      onSelect: noop,
      onClose,
    }),
  );

  // The first Pressable in the tree is the backdrop
  const pressables = instance.root.findAllByType(Pressable);
  const backdrop = pressables[0];
  TestRenderer.act(() => {
    backdrop.props.onPress();
  });
  expect(onClose).toHaveBeenCalled();
});
