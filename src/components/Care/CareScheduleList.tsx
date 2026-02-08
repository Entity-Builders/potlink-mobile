import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { getCareSchedules, logCare } from '@eb-packages/logic';
import type { CareSchedule } from '@eb-packages/garden';
import { Alert, TouchableOpacity } from 'react-native';

interface CareScheduleListProps {
  potId: string;
}

export const CareScheduleList = ({ potId }: CareScheduleListProps) => {
  const [schedules, setSchedules] = useState<CareSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    setLoading(true);
    const data = await getCareSchedules(potId);
    setSchedules(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedules();
  }, [potId]);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not scheduled';
    return date.toLocaleDateString();
  };

  const getEmoji = (type: string) => {
    switch (type) {
      case 'watering':
        return '💧';
      case 'fertilizing':
        return '🌿';
      case 'pruning':
        return '✂️';
      case 'repotting':
        return '🪴';
      default:
        return '📅';
    }
  };

  const handleLog = async (schedule: CareSchedule) => {
    Alert.alert('Log Care', `Mark ${schedule.care_type} as done today?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setLoading(true);
          const result = await logCare({
            pot_id: potId,
            care_type: schedule.care_type,
            notes: 'Logged from schedule list',
          });
          if (result) {
            await fetchSchedules(); // Refresh to show new next date
            alert('Care logged!');
          } else {
            setLoading(false);
            alert('Failed to log care.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return <ActivityIndicator size='small' color='#2e7d32' />;
  }

  if (schedules.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No care schedules set.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Care Schedule</Text>
      {schedules.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.type}>
              {getEmoji(item.care_type)}{' '}
              {item.care_type.charAt(0).toUpperCase() + item.care_type.slice(1)}
            </Text>
            <Text style={styles.frequency}>
              Every {item.frequency_days} days
            </Text>
          </View>
          <View style={styles.details}>
            <Text style={styles.dateLabel}>Next:</Text>
            <Text style={styles.dateValue}>
              {formatDate(item.next_care_date)}
            </Text>
          </View>
          {item.notes && <Text style={styles.notes}>{item.notes}</Text>}

          <TouchableOpacity
            style={styles.logButton}
            onPress={() => handleLog(item)}
          >
            <Text style={styles.logButtonText}>✅ Mark Done</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  type: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  frequency: {
    fontSize: 14,
    color: '#666',
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 14,
    color: '#999',
    marginRight: 4,
  },
  dateValue: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
  },
  notes: {
    marginTop: 8,
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  logButton: {
    marginTop: 12,
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  logButtonText: {
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: 14,
  },
});
