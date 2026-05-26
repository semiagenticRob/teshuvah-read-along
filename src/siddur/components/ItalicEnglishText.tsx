// src/siddur/components/ItalicEnglishText.tsx
import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { FONTS, INK } from '../../theme/siddurTheme';
import type { EnglishSpan } from '../types';

interface Props {
  spans: EnglishSpan[];
  baseStyle?: TextStyle;
}

/**
 * Renders an array of EnglishSpan as a single Text with inline style runs.
 * Italic spans use FONTS.serifBodyItalic — these are Feigenbaum's
 * interpretive translation additions (see spec §3, pp. XVI-XVII of the PDF).
 */
function ItalicEnglishText({ spans, baseStyle }: Props) {
  return (
    <Text style={[styles.base, baseStyle]}>
      {spans.map((span, i) => (
        <Text key={i} style={styleForSpan(span)}>
          {span.text}
        </Text>
      ))}
    </Text>
  );
}

function styleForSpan(span: EnglishSpan): TextStyle {
  switch (span.style) {
    case 'italic':
      return { fontFamily: FONTS.serifBodyItalic, fontStyle: 'italic' };
    case 'bold':
      return { fontFamily: FONTS.serifBody, fontWeight: '700' };
    default:
      return { fontFamily: FONTS.serifBody };
  }
}

export default React.memo(ItalicEnglishText);

const styles = StyleSheet.create({
  base: {
    fontSize: 16,
    lineHeight: 24,
    color: INK.strong,
  },
});
