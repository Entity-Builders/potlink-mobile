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
import { getUserPots } from '@eb-packages/logic';
import type { Pot } from '@eb-packages/garden';
import type { Session } from '@supabase/supabase-js';
import { analytics } from '../services/analyticsService';
import { useScreenLogger } from '../hooks/useScreenLogger';

// ── Constants ─────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATE_EMOJI: Record<string, string> = {
  seeds: '🌱',
  seedling: '🌿',
  young: '🪴',
  mature: '🌳',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface PotsListScreenProps {
  session: Session | null;
  onPotPress: (pot: Pot) => void;
  onLogout: () => void;
  onCameraPress?: () => void;
  onAddPress?: () => void;
  /** When true, shows a full plant collection list view instead of the home layout */
  collectionMode?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const PotsListScreen = ({
  session,
  onPotPress,
  onLogout,
  onCameraPress,
  onAddPress,
  collectionMode = false,
}: PotsListScreenProps) => {
  const [pots, setPots] = useState<Pot[]>([]);
  const [loading, setLoading] = useState(true);

  useScreenLogger('PotsListScreen');

  const userName =
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split('@')[0] ||
    'Jardinero';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userPots = await getUserPots();
      setPots(userPots);
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
        <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
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
          {onAddPress && (
            <View style={styles.fabContainer}>
              <TouchableOpacity
                style={styles.fabButton}
                onPress={() => {
                  analytics.track('fab_add_pressed');
                  onAddPress();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.fabText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Home mode (Plant Doctor Pivot) ───────────────────────────────────────────

  return (
    <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
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
            <Text style={styles.greetingMain}>Hola, {userName} 👋</Text>
          </View>

          {/* ── Camera Hero CTA (El Doctor) ── */}
          <TouchableOpacity
            style={styles.cameraHero}
            onPress={onCameraPress}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.08)']}
              style={styles.cameraHeroGradient}
            >
              <Text style={styles.cameraIcon}>📸</Text>
              <View style={styles.cameraHeroTextWrap}>
                <Text style={styles.cameraHeroTitle}>
                  ¿Alguna planta se ve mal?
                </Text>
                <Text style={styles.cameraHeroSubtitle}>
                  Tómale una foto y descubramos qué le pasa juntas.
                </Text>
              </View>
              <View style={styles.cameraHeroAction}>
                <Text style={styles.cameraHeroActionText}>
                  Consultar al doctor →
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── Mis plantas (Agenda Visual) ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Tus Plantas{pots.length > 0 ? ` (${pots.length})` : ''}
            </Text>
          </View>

          {pots.length === 0 ? (
            <EmptyPlants />
          ) : (
            <View style={styles.plantsGrid}>
              {pots.map((pot) => (
                <PlantCard
                  key={pot.id}
                  pot={pot}
                  onPress={() => onPotPress(pot)}
                />
              ))}
            </View>
          )}
        </ScrollView>
        {onAddPress && (
          <View style={styles.fabContainer}>
            <TouchableOpacity
              style={styles.fabButton}
              onPress={() => {
                analytics.track('fab_add_pressed');
                onAddPress();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

function PlantCard({ pot, onPress }: { pot: Pot; onPress: () => void }) {
  // Compute width for 2 columns with gaps
  const cardWidth = (SCREEN_WIDTH - 32 - 16) / 2;

  return (
    <TouchableOpacity
      style={[styles.plantCard, { width: cardWidth }]}
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
        <View style={styles.plantCardEmojiWrap}>
          <Text style={styles.plantCardEmoji}>
            {STATE_EMOJI[pot.initial_state] ?? '🌱'}
          </Text>
        </View>
      )}
      <View style={styles.plantCardTextWrap}>
        <Text style={styles.plantCardName} numberOfLines={1}>
          {pot.name}
        </Text>
        <Text style={styles.plantCardSpecies} numberOfLines={1}>
          {pot.species || 'Especie oculta'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyPlants() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🪴</Text>
      <Text style={styles.emptyTitle}>Aún no diagnosticaste plantas</Text>
      <Text style={styles.emptySubtitle}>
        Tus plantas aparecerán aquí cuando las registres
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
    paddingBottom: 40,
    gap: 20,
  },

  // ── Greeting
  greeting: {
    paddingHorizontal: 20,
  },
  greetingMain: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  // ── Camera Hero
  cameraHero: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  cameraHeroGradient: {
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
  },
  cameraIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  cameraHeroTextWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cameraHeroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  cameraHeroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  cameraHeroAction: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
  },
  cameraHeroActionText: {
    color: '#1B4332',
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Section Header
  sectionHeaderRow: {
    paddingHorizontal: 20,
    marginTop: 8,
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
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  potCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
  },

  // ── Plant Grid (Agenda Visual)
  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 24,
  },
  plantCard: {
    backgroundColor: '#D8F3DC',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  plantCardImage: {
    width: '100%',
    aspectRatio: 1,
  },
  plantCardEmojiWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#eaf8ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantCardEmoji: {
    fontSize: 50,
  },
  plantCardTextWrap: {
    padding: 12,
    alignItems: 'center',
  },
  plantCardName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B4332',
    textAlign: 'center',
    marginBottom: 4,
  },
  plantCardSpecies: {
    fontSize: 12,
    color: '#407a52',
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Collection Mode
  collectionList: {
    paddingHorizontal: 16,
    paddingBottom: 40,
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
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 8 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── FAB
  fabContainer: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    zIndex: 100,
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#316E50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: {
    fontSize: 36,
    color: '#1B4332',
    fontWeight: '400',
    marginTop: -4,
  },
});
