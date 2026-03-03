import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { getUserPots } from '@eb-packages/logic';
import type { Pot } from '@eb-packages/garden';
import { Screen, SharedHeader } from '@eb-packages/ui';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@eb-packages/logic';
import { analytics } from '../services/analyticsService';
import { useScreenLogger } from '../hooks/useScreenLogger';

interface PotsListScreenProps {
  session: Session | null;
  onAddPot: () => void;
  onPotPress: (pot: Pot) => void;
  onOpenCalendar: () => void;
  onLogout: () => void;
}

const STATE_CONFIG = {
  seeds: { emoji: '🌱', label: 'Semillas' },
  seedling: { emoji: '🌿', label: 'Brote' },
  young: { emoji: '🪴', label: 'Joven' },
  mature: { emoji: '🌳', label: 'Madura' },
} as const;

const getDaysSinceRegistration = (registeredAt: Date): number => {
  const now = new Date();
  const reg = new Date(registeredAt);
  return Math.floor((now.getTime() - reg.getTime()) / (1000 * 60 * 60 * 24));
};

export const PotsListScreen = ({
  session,
  onAddPot,
  onPotPress,
  onOpenCalendar,
  onLogout,
}: PotsListScreenProps) => {
  const [pots, setPots] = useState<Pot[]>([]);
  const [loading, setLoading] = useState(true);

  useScreenLogger('PotsListScreen');

  const loadPots = async () => {
    setLoading(true);
    try {
      const userPots = await getUserPots();
      setPots(userPots);
    } catch (error) {
      analytics.captureError(error, {
        screen: 'PotsListScreen',
        action: 'loadPots',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPots();
  }, []);

  const renderPotRow = ({ item }: { item: Pot }) => {
    const stateInfo = STATE_CONFIG[item.initial_state] || {
      emoji: '🌱',
      label: item.initial_state,
    };
    const days = getDaysSinceRegistration(item.registered_at);

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => {
          analytics.track('pot_opened', {
            pot_id: item.id,
            species: item.species,
          });
          onPotPress(item);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.rowIcon}>
          <Text style={styles.rowIconText}>{stateInfo.emoji}</Text>
        </View>

        <View style={styles.rowContent}>
          <View style={styles.rowTopLine}>
            <Text style={styles.rowName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.rowDays}>{days}d</Text>
          </View>

          <Text style={styles.rowSpecies} numberOfLines={1}>
            {item.species}
            {item.variety ? ` · ${item.variety}` : ''}
          </Text>

          <View style={styles.rowTags}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{stateInfo.label}</Text>
            </View>
            <View
              style={[
                styles.tag,
                item.location_type === 'indoor'
                  ? styles.tagIndoor
                  : styles.tagOutdoor,
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  item.location_type === 'indoor'
                    ? styles.tagIndoorText
                    : styles.tagOutdoorText,
                ]}
              >
                {item.location_type === 'indoor'
                  ? '🏠 Interior'
                  : '☀️ Exterior'}
              </Text>
            </View>
            <View style={[styles.tag, styles.tagWater]}>
              <Text style={[styles.tagText, styles.tagWaterText]}>
                💧 {item.moisture_threshold}%
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.rowChevron}>›</Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🪴</Text>
      <Text style={styles.emptyStateTitle}>No tenés plantas aún</Text>
      <Text style={styles.emptyStateText}>
        ¡Empezá tu jardín registrando tu primera maceta!
      </Text>
      <TouchableOpacity style={styles.emptyStateButton} onPress={onAddPot}>
        <Text style={styles.emptyStateButtonText}>
          Registrar primera maceta
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#2e7d32' />
        <Text style={styles.loadingText}>Cargando tu jardín...</Text>
      </View>
    );
  }

  return (
    <Screen style={styles.container}>
      <SharedHeader
        session={session}
        onLogin={() => {}}
        onLogout={async () => {
          try {
            await supabase.auth.signOut({ scope: 'local' });
          } catch (e) {
            console.error('Logout exception:', e);
            analytics.captureError(e, {
              screen: 'PotsListScreen',
              action: 'logout',
            });
          }
          onLogout();
        }}
        title='PotLink'
        logo={<Text style={styles.logoEmoji}>🪴</Text>}
        themeColor='#2e7d32'
        variant='light'
        showUserInfo={false}
        actions={[
          <TouchableOpacity
            key='calendar'
            style={styles.iconButton}
            onPress={onOpenCalendar}
          >
            <Text style={styles.iconButtonText}>📅</Text>
          </TouchableOpacity>,
          <TouchableOpacity
            key='add'
            style={styles.addButton}
            onPress={onAddPot}
          >
            <Text style={styles.addButtonText}>+ Agregar</Text>
          </TouchableOpacity>,
        ]}
      />

      <FlatList
        data={pots}
        renderItem={renderPotRow}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmptyState}
        refreshing={loading}
        onRefresh={() => {
          analytics.track('pots_list_refreshed');
          loadPots();
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Screen>
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
  logoEmoji: {
    fontSize: 24,
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  iconButtonText: {
    fontSize: 20,
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
    padding: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#e8e8e8',
    marginHorizontal: 4,
  },
  // Row layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowIconText: {
    fontSize: 22,
  },
  rowContent: {
    flex: 1,
    gap: 3,
  },
  rowTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b5e20',
    flex: 1,
  },
  rowDays: {
    fontSize: 12,
    color: '#9e9e9e',
    fontWeight: '500',
    marginLeft: 8,
  },
  rowSpecies: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  rowTags: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    color: '#555',
    fontWeight: '500',
  },
  tagIndoor: {
    backgroundColor: '#fff3e0',
  },
  tagIndoorText: {
    color: '#e65100',
  },
  tagOutdoor: {
    backgroundColor: '#e8f5e9',
  },
  tagOutdoorText: {
    color: '#2e7d32',
  },
  tagWater: {
    backgroundColor: '#e3f2fd',
  },
  tagWaterText: {
    color: '#1565c0',
  },
  rowChevron: {
    fontSize: 20,
    color: '#ccc',
    fontWeight: '300',
  },
  // Empty state
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
