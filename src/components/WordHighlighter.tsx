import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';

interface WordHighlighterProps {
  word: string;
  isHighlighted: boolean;
  fontSize: number;
  isHebrew: boolean;
  onPress?: () => void;
}

/**
 * Renders a single word with optional highlight styling.
 * Used within ReadAlongView to create the word-by-word highlight effect.
 */
export const WordHighlighter: React.FC<WordHighlighterProps> = ({
  word,
  isHighlighted,
  fontSize,
  isHebrew,
  onPress,
}) => {
  const content = (
    <Text
      style={[
        isHebrew ? styles.hebrewWord : styles.latinWord,
        { fontSize },
        isHighlighted && (isHebrew ? styles.highlightedHebrew : styles.highlightedLatin),
      ]}
    >
      {word}{' '}
    </Text>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  hebrewWord: {
    color: '#1A365D',
    fontWeight: '500',
    lineHeight: 40,
  },
  latinWord: {
    color: '#718096',
    lineHeight: 24,
  },
  highlightedHebrew: {
    backgroundColor: '#FBD38D',
    color: '#744210',
    fontWeight: '700',
    borderRadius: 4,
    overflow: 'hidden',
  },
  highlightedLatin: {
    color: '#975A16',
    fontWeight: '600',
  },
});
