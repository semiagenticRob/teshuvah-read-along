import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, Prayer } from '../types';
import { usePrayerStore } from '../store/prayerStore';
import { getShacharitPrayers } from '../data/prayerOrder';

type Props = NativeStackScreenProps<RootStackParamList, 'PrayerList'>;

export const PrayerListScreen: React.FC<Props> = ({ navigation, route }) => {
  const { serviceId } = route.params;
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const { completedPrayers, currentPrayerIndex, setCurrentService } = usePrayerStore();

  useEffect(() => {
    setCurrentService(serviceId);
    // Load prayer list based on service
    if (serviceId === 'shacharit') {
      setPrayers(getShacharitPrayers());
    }
  }, [serviceId, setCurrentService]);

  const renderPrayerItem = ({ item, index }: { item: Prayer; index: number }) => {
    const isCompleted = completedPrayers.has(item.id);
    const isCurrent = index === currentPrayerIndex;

    return (
      <TouchableOpacity
        style={[
          styles.prayerItem,
          isCurrent && styles.currentPrayer,
          isCompleted && styles.completedPrayer,
        ]}
        onPress={() => navigation.navigate('ReadAlong', { serviceId, prayerIndex: index })}
      >
        <View style={styles.prayerNumber}>
          <Text style={styles.numberText}>
            {isCompleted ? '\u2713' : index + 1}
          </Text>
        </View>
        <View style={styles.prayerInfo}>
          <Text style={styles.prayerHebrew}>{item.name.hebrew}</Text>
          <Text style={styles.prayerEnglish}>{item.name.english}</Text>
          {item.instructions && (
            <Text style={styles.instructions}>{item.instructions}</Text>
          )}
        </View>
        <View style={styles.audioIndicator}>
          <Text style={styles.audioIcon}>
            {item.audioSource === 'recorded' ? '\u266B' : '\u{1F50A}'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.serviceTitle}>
          {serviceId === 'shacharit' ? 'שחרית' : serviceId}
        </Text>
        <Text style={styles.serviceTitleEnglish}>
          {serviceId === 'shacharit' ? 'Shacharit — Morning Prayers' : serviceId}
        </Text>
        <Text style={styles.progressText}>
          {completedPrayers.size} of {prayers.length} prayers completed
        </Text>
      </View>

      <FlatList
        data={prayers}
        renderItem={renderPrayerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFAF6',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A365D',
  },
  serviceTitleEnglish: {
    fontSize: 16,
    color: '#4A5568',
    marginTop: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#718096',
    marginTop: 8,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  prayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  currentPrayer: {
    borderColor: '#3182CE',
    borderWidth: 2,
    backgroundColor: '#EBF8FF',
  },
  completedPrayer: {
    opacity: 0.7,
  },
  prayerNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  numberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  prayerInfo: {
    flex: 1,
  },
  prayerHebrew: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A365D',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  prayerEnglish: {
    fontSize: 14,
    color: '#4A5568',
    marginTop: 2,
  },
  instructions: {
    fontSize: 12,
    color: '#718096',
    fontStyle: 'italic',
    marginTop: 4,
  },
  audioIndicator: {
    marginLeft: 8,
  },
  audioIcon: {
    fontSize: 18,
  },
});
