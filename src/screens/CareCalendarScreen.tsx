import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Screen } from '@eb-packages/ui';
import { getAllUserCareSchedules, logCare } from '@eb-packages/logic';
import type { CareSchedule } from '@eb-packages/garden';
import { analytics, trackCareLogged } from '../services/analyticsService';
import { useScreenLogger } from '../hooks/useScreenLogger';

export const CareCalendarScreen = ({ navigation }: any) => {
  useScreenLogger('CareCalendarScreen');
  const [schedules, setSchedules] = useState<
    (CareSchedule & { pot: { name: string; photo_url?: string } })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const data = await getAllUserCareSchedules();
      setSchedules(data);
    } catch (error) {
      console.error(error);
      analytics.captureError(error, {
        screen: 'CareCalendarScreen',
        action: 'fetchData',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const handleLog = async (item: CareSchedule & { pot: any }) => {
    Alert.alert(
      'Log Care',
      `Mark ${item.care_type} for ${item.pot.name} as done today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const result = await logCare({
              pot_id: item.pot_id,
              care_type: item.care_type,
              notes: 'Logged from Calendar',
            });
            if (result) {
              trackCareLogged(item.pot_id, item.care_type);
              onRefresh();
            } else {
              analytics.captureError(new Error('logCare returned null'), {
                screen: 'CareCalendarScreen',
                action: 'handleLog',
                potId: item.pot_id,
                careType: item.care_type,
              });
              alert('Failed to log care');
            }
          },
        },
      ],
    );
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

  const isOverdue = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return target < today;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    const target = new Date(date);
    return (
      today.getDate() === target.getDate() &&
      today.getMonth() === target.getMonth() &&
      today.getFullYear() === target.getFullYear()
    );
  };

  const renderItem = (item: CareSchedule & { pot: any }) => {
    const overdue = isOverdue(item.next_care_date);
    const today = isToday(item.next_care_date);

    return (
      <View key={item.id} style={[styles.card, overdue && styles.overdueCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.potName}>{item.pot.name}</Text>
          <View style={styles.badge}>
            {overdue && <Text style={styles.overdueText}>OVERDUE</Text>}
            {today && <Text style={styles.todayText}>TODAY</Text>}
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.careType}>
            {getEmoji(item.care_type)} {item.care_type}
          </Text>
          <Text style={styles.date}>
            Due: {item.next_care_date?.toLocaleDateString() || 'Not set'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLog(item)}
        >
          <Text style={styles.actionButtonText}>✅ Mark Done</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size='large' color='#2e7d32' />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Care Calendar</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {schedules.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No upcoming care tasks.</Text>
          </View>
        ) : (
          schedules.map(renderItem)
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  content: {
    padding: 16,
  },
  empty: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  overdueCard: {
    borderLeftColor: '#d32f2f',
    backgroundColor: '#fff5f5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  potName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    flexDirection: 'row',
  },
  overdueText: {
    color: '#d32f2f',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#ffcdd2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#bbdefb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  careType: {
    fontSize: 14,
    color: '#555',
    textTransform: 'capitalize',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  actionButtonText: {
    color: '#2e7d32',
    fontWeight: '600',
  },
});
