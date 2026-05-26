// src/siddur/components/SectionJumpSheet.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { FONTS, INK, PARCHMENT } from '../../theme/siddurTheme';

interface Section {
  id: string;
  title: { he: string; en: string };
}

interface Props {
  visible: boolean;
  sections: Section[];
  activeSectionId: string | null;
  onSelect: (sectionId: string) => void;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function SectionJumpSheet({
  visible,
  sections,
  activeSectionId,
  onSelect,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      presentationStyle="overFullScreen"
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>Jump to section</Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        {/* Section list */}
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {sections.map((section) => {
            const isActive = section.id === activeSectionId;
            return (
              <Pressable
                key={section.id}
                style={[styles.row, isActive && styles.rowActive]}
                onPress={() => onSelect(section.id)}
              >
                <Text style={styles.rowEn}>{section.title.en}</Text>
                <Text style={styles.rowHe}>{section.title.he}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.5,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0d4c0',
  },
  headerLabel: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: INK.strong,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontFamily: FONTS.serifBody,
    fontSize: 16,
    color: INK.soft,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0d4c0',
  },
  rowActive: {
    backgroundColor: '#fdf0d5', // amber tint
  },
  rowEn: {
    fontFamily: FONTS.serifBody,
    fontSize: 15,
    color: INK.strong,
  },
  rowHe: {
    fontFamily: FONTS.hebrew,
    fontSize: 14,
    color: INK.soft,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 2,
  },
});
