import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserPots, getAllUserCareSchedules } from '@eb-packages/logic';
import type { Pot, CareSchedule } from '@eb-packages/garden';
import type { Session } from '@supabase/supabase-js';
import { analytics } from '../services/analyticsService';
import { useScreenLogger } from '../hooks/useScreenLogger';

// ── Constants ─────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CARE_ICONS: Record<string, string> = {
  watering: '💧',
  fertilizing: '🌿',
  pruning: '✂️',
  repotting: '🪴',
};

const CARE_LABELS: Record<string, string> = {
  watering: 'Regar',
  fertilizing: 'Fertilizar',
  pruning: 'Podar',
  repotting: 'Replantar',
};

const STATE_EMOJI: Record<string, string> = {
  seeds: '🌱',
  seedling: '🌿',
  young: '🪴',
  mature: '🌳',
};

// ── Urgency helpers ───────────────────────────────────────────────────────────

type Urgency = 'urgent' | 'today' | 'week';

function getUrgency(nextCareDate: Date | string): Urgency {
  const now = new Date();
  const care = new Date(nextCareDate);
  const diffDays = Math.floor(
    (care.getTime() - now.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0) return 'urgent';
  if (diffDays === 0) return 'today';
  return 'week';
}

function getUrgencyLabel(u: Urgency): string {
  if (u === 'urgent') return 'URGENTE';
  if (u === 'today') return 'HOY';
  return 'ESTA SEMANA';
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface CareTaskWithPot {
  schedule: CareSchedule;
  pot: Pot;
  urgency: Urgency;
}

interface PotsListScreenProps {
  session: Session | null;
  onPotPress: (pot: Pot) => void;
  onLogout: () => void;
  /** When true, shows a full plant collection list view instead of the home layout */
  collectionMode?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const PotsListScreen = ({
  session,
  onPotPress,
  onLogout,
  collectionMode = false,
}: PotsListScreenProps) => {
  const [pots, setPots] = useState<Pot[]>([]);
  const [tasks, setTasks] = useState<CareTaskWithPot[]>([]);
  const [loading, setLoading] = useState(true);

  useScreenLogger('PotsListScreen');

  const userName =
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split('@')[0] ||
    'Jardinero';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userPots = await getUserPots();
      setPots(userPots);

      // Load all care schedules in a single query (more efficient)
      const potsMap = userPots.reduce<Record<string, Pot>>((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});

      const allSchedules = await getAllUserCareSchedules();
      const allTasks: CareTaskWithPot[] = allSchedules
        .filter((s) => s.next_care_date)
        .map((s) => ({
          schedule: s,
          pot:
            potsMap[s.pot_id] ?? ({ ...s.pot, id: s.pot_id } as unknown as Pot),
          urgency: getUrgency(s.next_care_date!),
        }))
        .sort((a, b) => {
          const order: Urgency[] = ['urgent', 'today', 'week'];
          return order.indexOf(a.urgency) - order.indexOf(b.urgency);
        });

      setTasks(allTasks);
    } catch (error) {
      analytics.captureError(error, {
        screen: 'PotsListScreen',
        action: 'load',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <LinearGradient
        colors={['#1B4332', '#2D6A4F']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size='large' color='#B7E4C7' />
        <Text style={styles.loadingText}>Cargando tu jardín...</Text>
      </LinearGradient>
    );
  }

  // ── Collection mode (Mis plantas tab) ──────────────────────────────────────

  if (collectionMode) {
    return (
      <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.flex}>
        <SafeAreaView style={styles.flex}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis plantas</Text>
            <Text style={styles.potCount}>{pots.length} registradas</Text>
          </View>
          <FlatList
            data={pots}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.collectionList}
            onRefresh={load}
            refreshing={loading}
            ListEmptyComponent={<EmptyPlants />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.collectionRow}
                onPress={() => onPotPress(item)}
                activeOpacity={0.75}
              >
                <View style={styles.collectionRowIcon}>
                  <Text style={styles.collectionRowEmoji}>
                    {STATE_EMOJI[item.initial_state] ?? '🌱'}
                  </Text>
                </View>
                <View style={styles.collectionRowContent}>
                  <Text style={styles.collectionRowName}>{item.name}</Text>
                  <Text style={styles.collectionRowSpecies}>
                    {item.species}
                    {item.variety ? ` · ${item.variety}` : ''}
                  </Text>
                </View>
                <Text style={styles.collectionRowLocation}>
                  {item.location_type === 'indoor' ? '🏠' : '☀️'}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Home mode ──────────────────────────────────────────────────────────────

  const todayTasks = tasks.filter((t) => t.urgency !== 'week');
  const weekTasks = tasks.filter((t) => t.urgency === 'week');
  const visibleTasks = todayTasks.length > 0 ? todayTasks : tasks.slice(0, 3);
  const allDone = tasks.length === 0;

  return (
    <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <View style={styles.topBarBrand}>
            <Text style={styles.topBarLogo}>🪴</Text>
            <Text style={styles.topBarName}>Potlink</Text>
          </View>
          <TouchableOpacity style={styles.avatarCircle} onPress={onLogout}>
            <Text style={styles.avatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Greeting ── */}
          <View style={styles.greeting}>
            <Text style={styles.greetingMain}>
              {getGreeting()}, {userName} 👋
            </Text>
            <Text style={styles.greetingSubtitle}>
              {allDone
                ? '🎉 Todo al día, tu jardín está contento'
                : 'Tus plantas te necesitan hoy'}
            </Text>
          </View>

          {/* ── Card: Tareas de hoy ── */}
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>📋 Tareas de hoy</Text>

            {visibleTasks.length === 0 ? (
              <View style={styles.allDoneRow}>
                <Text style={styles.allDoneText}>
                  ✅ Todo al día — ¡buen trabajo!
                </Text>
              </View>
            ) : (
              visibleTasks.map((task) => (
                <CareTaskRow key={task.schedule.id} task={task} />
              ))
            )}

            {weekTasks.length > 0 && visibleTasks.length > 0 && (
              <Text style={styles.weekTasksHint}>
                +{weekTasks.length} tareas esta semana
              </Text>
            )}
          </View>

          {/* ── Mis plantas ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Mis plantas{pots.length > 0 ? ` (${pots.length})` : ''}
            </Text>
          </View>

          {pots.length === 0 ? (
            <EmptyPlants />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.plantCardsRow}
            >
              {pots.map((pot) => (
                <PlantCard
                  key={pot.id}
                  pot={pot}
                  onPress={() => onPotPress(pot)}
                />
              ))}
            </ScrollView>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

function CareTaskRow({ task }: { task: CareTaskWithPot }) {
  const icon = CARE_ICONS[task.schedule.care_type] ?? '🌱';
  const label = CARE_LABELS[task.schedule.care_type] ?? task.schedule.care_type;

  return (
    <View style={styles.taskRow}>
      <Text style={styles.taskIcon}>{icon}</Text>
      <Text style={styles.taskLabel} numberOfLines={1}>
        <Text style={styles.taskAction}>{label}</Text>
        {' · '}
        {task.pot.name}
      </Text>
      <UrgencyBadge urgency={task.urgency} />
      <View style={styles.taskCheckbox} />
    </View>
  );
}

function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return (
    <View
      style={[
        styles.badge,
        urgency === 'urgent' && styles.badgeUrgent,
        urgency === 'today' && styles.badgeToday,
        urgency === 'week' && styles.badgeWeek,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          urgency === 'urgent' && styles.badgeTextUrgent,
          urgency === 'today' && styles.badgeTextToday,
          urgency === 'week' && styles.badgeTextWeek,
        ]}
      >
        {getUrgencyLabel(urgency)}
      </Text>
    </View>
  );
}

function PlantCard({ pot, onPress }: { pot: Pot; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.plantCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {pot.photo_url ? (
        <Image
          source={{ uri: pot.photo_url }}
          style={styles.plantCardImage}
          resizeMode='cover'
        />
      ) : (
        <Text style={styles.plantCardEmoji}>
          {STATE_EMOJI[pot.initial_state] ?? '🌱'}
        </Text>
      )}
      <Text style={styles.plantCardName} numberOfLines={1}>
        {pot.name}
      </Text>
      <Text style={styles.plantCardSpecies} numberOfLines={1}>
        {pot.species}
      </Text>
      <View style={styles.plantCardFooter}>
        <Text style={styles.plantCardLocation}>
          {pot.location_type === 'indoor' ? '🔵 Interior' : '🟢 Exterior'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyPlants() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🪴</Text>
      <Text style={styles.emptyTitle}>No tenés plantas aún</Text>
      <Text style={styles.emptySubtitle}>
        Tocá ➕ para registrar tu primera maceta
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#B7E4C7',
    fontSize: 15,
  },

  // ── Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  topBarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topBarLogo: { fontSize: 22 },
  topBarName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Scroll
  scroll: {
    paddingBottom: 110, // space for floating tab bar
    gap: 20,
  },

  // ── Greeting
  greeting: {
    paddingHorizontal: 20,
    gap: 4,
  },
  greetingMain: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
  },

  // ── Glass Card
  glassCard: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    gap: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },

  // ── Task Row
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  taskIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  taskLabel: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  taskAction: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  // ── Badges
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeUrgent: { backgroundColor: '#FF8C00' },
  badgeTextUrgent: { color: '#FFFFFF' },
  badgeToday: { backgroundColor: '#52B788' },
  badgeTextToday: { color: '#FFFFFF' },
  badgeWeek: { backgroundColor: 'rgba(255,255,255,0.15)' },
  badgeTextWeek: { color: 'rgba(255,255,255,0.7)' },

  allDoneRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  allDoneText: {
    color: '#B7E4C7',
    fontSize: 15,
    fontWeight: '600',
  },
  weekTasksHint: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    textAlign: 'center',
    paddingTop: 8,
  },

  // ── Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  potCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
  },

  // ── Plant Cards (horizontal)
  plantCardsRow: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  plantCard: {
    width: 130,
    backgroundColor: '#D8F3DC',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  plantCardImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
  },
  plantCardEmoji: {
    fontSize: 44,
    height: 70,
    textAlignVertical: 'center',
    lineHeight: 70,
  },
  plantCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B4332',
    textAlign: 'center',
  },
  plantCardSpecies: {
    fontSize: 11,
    color: '#555',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  plantCardFooter: {
    marginTop: 2,
  },
  plantCardLocation: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },

  // ── Collection Mode
  collectionList: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 10,
  },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  collectionRowIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#D8F3DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionRowEmoji: { fontSize: 24 },
  collectionRowContent: { flex: 1, gap: 2 },
  collectionRowName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  collectionRowSpecies: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
  },
  collectionRowLocation: {
    fontSize: 20,
  },

  // ── Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
});
