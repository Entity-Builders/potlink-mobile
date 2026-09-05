import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { getCareHistory } from '@entity-builders/logic';
import type { CareLog } from '@entity-builders/garden';

interface CareHistoryListProps {
  potId: string;
}

export const CareHistoryList = ({ potId }: CareHistoryListProps) => {
  const [history, setHistory] = useState<CareLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    const data = await getCareHistory(potId);
    setHistory(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [potId]);

  const formatDate = (date: Date) => {
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

  if (loading) {
    return <ActivityIndicator size='small' color='#2e7d32' />;
  }

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No care history yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      {history.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.type}>
              {getEmoji(item.care_type)}{' '}
              {item.care_type.charAt(0).toUpperCase() + item.care_type.slice(1)}
            </Text>
            <Text style={styles.date}>{formatDate(item.performed_at)}</Text>
          </View>
          {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
          {item.photo_url && (
            <Image source={{ uri: item.photo_url }} style={styles.photo} />
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 20,
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
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ccc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  notes: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  photo: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#eee',
  },
});
