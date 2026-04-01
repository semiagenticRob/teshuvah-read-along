import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DisplayMode } from '../types';
import { useSettingsStore } from '../store/settingsStore';

const MODES: { value: DisplayMode; label: string }[] = [
  { value: 'hebrew', label: 'Hebrew Only' },
  { value: 'hebrew_translit', label: 'Hebrew + Transliteration' },
  { value: 'hebrew_english', label: 'Hebrew + English' },
  { value: 'all', label: 'All Three' },
];

export const DisplayModeMenu: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const { displayMode, setDisplayMode } = useSettingsStore();

  const handleSelect = (mode: DisplayMode) => {
    setDisplayMode(mode);
    setVisible(false);
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.trigger}>
        <Ionicons name="ellipsis-vertical" size={20} color="#4A5568" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <View style={styles.menu}>
            {MODES.map((mode) => (
              <TouchableOpacity
                key={mode.value}
                style={styles.menuItem}
                onPress={() => handleSelect(mode.value)}
              >
                <Text style={[styles.menuItemText, displayMode === mode.value && styles.menuItemActive]}>
                  {mode.label}
                </Text>
                {displayMode === mode.value && (
                  <Ionicons name="checkmark" size={18} color="#3182CE" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  trigger: {
    padding: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 16,
  },
  menu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 4,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: '#4A5568',
  },
  menuItemActive: {
    color: '#3182CE',
    fontWeight: '600',
  },
});
