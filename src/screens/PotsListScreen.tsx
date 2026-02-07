import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { getUserPots } from '@eb-packages/logic';
import type { Pot } from '@eb-packages/garden';

interface PotsListScreenProps {
  onAddPot: () => void;
  onPotPress: (pot: Pot) => void;
}

export const PotsListScreen = ({
  onAddPot,
  onPotPress,
}: PotsListScreenProps) => {
  const [pots, setPots] = useState<Pot[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPots = async () => {
    setLoading(true);
    const userPots = await getUserPots();
    setPots(userPots);
    setLoading(false);
  };

  useEffect(() => {
    loadPots();
  }, []);

  const renderPotCard = ({ item }: { item: Pot }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPotPress(item)}
      activeOpacity={0.7}
    >
      {item.photo_url ? (
        <Image source={{ uri: item.photo_url }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Text style={styles.cardImagePlaceholderText}>🌱</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSpecies}>{item.species}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaText}>
            {item.initial_state === 'seeds' && '🌱 Seeds'}
            {item.initial_state === 'seedling' && '🌿 Seedling'}
            {item.initial_state === 'young' && '🪴 Young'}
            {item.initial_state === 'mature' && '🌳 Mature'}
          </Text>
          <Text style={styles.cardMetaText}>💧 {item.moisture_threshold}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🪴</Text>
      <Text style={styles.emptyStateTitle}>No pots yet</Text>
      <Text style={styles.emptyStateText}>
        Start your garden by registering your first pot!
      </Text>
      <TouchableOpacity style={styles.emptyStateButton} onPress={onAddPot}>
        <Text style={styles.emptyStateButtonText}>Register First Pot</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#2e7d32' />
        <Text style={styles.loadingText}>Loading your garden...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Garden 🌱</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddPot}>
          <Text style={styles.addButtonText}>+ Add Pot</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={pots}
        renderItem={renderPotCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmptyState}
        refreshing={loading}
        onRefresh={loadPots}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  addButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImagePlaceholderText: {
    fontSize: 64,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSpecies: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  cardMetaText: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
