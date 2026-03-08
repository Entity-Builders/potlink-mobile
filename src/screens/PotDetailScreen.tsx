import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
// Removed direct ImagePicker import since Drawer handles it
import { LinearGradient } from 'expo-linear-gradient';
import type {
  Pot,
  SpeciesCareGuide,
  PotDiagnosisLog,
} from '@eb-packages/garden';
import {
  deletePot,
  getSpeciesCareGuide,
  getDiagnosisLogs,
  diagnosePlant,
} from '@eb-packages/logic';
import { Screen } from '@eb-packages/ui';
import { analytics, trackPotDeleted } from '../services/analyticsService';
import { useScreenLogger } from '../hooks/useScreenLogger';
import { DiagnosisDrawer } from '../components/DiagnosisDrawer';

interface PotDetailScreenProps {
  pot: Pot;
  onBack: () => void;
  onEdit: () => void;
  onDeleted: () => void;
  // Note: onCareSettings is removed as we dropped manual schedules
}

export const PotDetailScreen = ({
  pot,
  onBack,
  onEdit,
  onDeleted,
}: PotDetailScreenProps) => {
  const [careGuide, setCareGuide] = React.useState<SpeciesCareGuide | null>(
    null,
  );
  const [logs, setLogs] = React.useState<PotDiagnosisLog[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  useScreenLogger('PotDetailScreen');

  React.useEffect(() => {
    if (pot.species) {
      getSpeciesCareGuide(pot.species)
        .then(setCareGuide)
        .catch((err) =>
          analytics.captureError(err, {
            screen: 'PotDetailScreen',
            action: 'getSpeciesCareGuide',
            species: pot.species,
          }),
        );
    }

    getDiagnosisLogs(pot.id)
      .then(setLogs)
      .catch((err) => console.error('Error fetching logs:', err));
  }, [pot.id, pot.species]);

  const handleDelete = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `¿Estás seguro de que querés eliminar "${pot.name}"? No se puede deshacer.`,
      );
      if (!confirmed) return;

      const success = await deletePot(pot.id);
      if (success) {
        alert('Planta eliminada');
        onDeleted();
      } else {
        alert('Error al eliminar. Intentá de nuevo.');
      }
      return;
    }

    Alert.alert(
      'Eliminar Planta',
      `¿Estás seguro de que querés eliminar "${pot.name}"? No se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await deletePot(pot.id);
            if (success) {
              trackPotDeleted(pot.id);
              Alert.alert('Listo', 'Planta eliminada', [
                { text: 'OK', onPress: onDeleted },
              ]);
            } else {
              Alert.alert('Error', 'No se pudo eliminar. Intentá de nuevo.');
            }
          },
        },
      ],
    );
  };

  const getStateEmoji = (state: string) => {
    const emojis = {
      seeds: '🌱',
      seedling: '🌿',
      young: '🪴',
      mature: '🌳',
    };
    return emojis[state as keyof typeof emojis] || '🌱';
  };

  const handleDiagnose = () => {
    setIsDrawerOpen(true);
  };

  const handleDiagnosisSuccess = (newLog: PotDiagnosisLog) => {
    // prepend new log
    setLogs((prev) => [newLog, ...prev]);
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ficha Clínica</Text>
        <TouchableOpacity style={styles.editButtonHeader} onPress={onEdit}>
          <Text style={styles.editButtonTextHeader}>✏️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Profile ── */}
        <View style={styles.heroSection}>
          <View style={styles.imageContainer}>
            {pot.photo_url ? (
              <Image source={{ uri: pot.photo_url }} style={styles.heroImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderIcon}>
                  {getStateEmoji(pot.initial_state)}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.heroName}>{pot.name}</Text>
          <Text style={styles.heroSpecies}>
            {pot.species || 'Especie oculta'}
          </Text>

          {/* ── Action: Diagnosticar ── */}
          <TouchableOpacity
            style={styles.diagnoseButton}
            onPress={handleDiagnose}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#1B4332', '#2D6A4F']}
              style={styles.diagnoseGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.diagnoseIcon}>🚑</Text>
              <Text style={styles.diagnoseText}>Consultar al Doctor</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Reglas de Oro (Basic Care) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reglas de Oro</Text>
          <View style={styles.rulesCard}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleIconWrap}>
                <Text style={styles.ruleIcon}>💧</Text>
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleLabel}>Riego</Text>
                <Text style={styles.ruleValue}>
                  {careGuide
                    ? careGuide.watering_frequency
                    : 'Chequeá si la tierra está seca antes de regar.'}
                </Text>
              </View>
            </View>

            <View style={styles.ruleDivider} />

            <View style={styles.ruleItem}>
              <View
                style={[styles.ruleIconWrap, { backgroundColor: '#fff8e1' }]}
              >
                <Text style={styles.ruleIcon}>☀️</Text>
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleLabel}>Luz</Text>
                <Text style={styles.ruleValue}>
                  {careGuide
                    ? careGuide.light_requirements
                    : pot.location_type === 'indoor'
                      ? 'Luz indirecta brillante.'
                      : 'Sol directo o semisombra.'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Historial Clínico ── */}
        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>
            Historial Clínico
          </Text>
          {logs.length === 0 ? (
            <View style={[styles.historyEmptyCard, { marginHorizontal: 20 }]}>
              <Text style={styles.historyEmptyEmoji}>📝</Text>
              <Text style={styles.historyEmptyTitle}>
                No hay consultas previas
              </Text>
              <Text style={styles.historyEmptySubtitle}>
                Cuando tengas dudas sobre {pot.name}, tocá en "Consultar al
                Doctor" para recibir un diagnóstico.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.historyScrollContent}
              decelerationRate='fast'
              snapToInterval={296} // 280 width + 16 gap
            >
              {logs.map((log) => (
                <View key={log.id} style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logDate}>
                      {new Date(log.created_at).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                    <View
                      style={[
                        styles.urgencyBadge,
                        log.urgency === 'high'
                          ? styles.urgencyHigh
                          : log.urgency === 'medium'
                            ? styles.urgencyMedium
                            : styles.urgencyLow,
                      ]}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          log.urgency === 'high' ? styles.urgencyTextHigh : {},
                        ]}
                      >
                        {log.urgency.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.logImagesRow}>
                    {log.general_image_url &&
                      log.general_image_url !== 'pending' && (
                        <Image
                          source={{ uri: log.general_image_url }}
                          style={[
                            styles.logImage,
                            log.soil_image_url &&
                            log.soil_image_url !== 'pending'
                              ? { flex: 1, marginRight: 8 }
                              : { width: '100%' },
                          ]}
                        />
                      )}
                    {log.soil_image_url && log.soil_image_url !== 'pending' && (
                      <Image
                        source={{ uri: log.soil_image_url }}
                        style={[styles.logImage, { flex: 1 }]}
                      />
                    )}
                  </View>

                  <Text style={styles.logDiagnosis} numberOfLines={4}>
                    {log.ai_diagnosis}
                  </Text>

                  {log.action_plan && log.action_plan.length > 0 && (
                    <View style={styles.actionPlanTag}>
                      <Text style={styles.actionPlanTagText}>
                        📋 Hay un plan de acción sugerido
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Danger Zone ── */}
        <TouchableOpacity style={styles.deleteLink} onPress={handleDelete}>
          <Text style={styles.deleteLinkText}>Eliminar Planta</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <DiagnosisDrawer
        visible={isDrawerOpen}
        pot={pot}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={handleDiagnosisSuccess}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAF9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#F9FAF9',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: '#2e7d32',
    fontWeight: '700',
  },
  editButtonHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonTextHeader: {
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ── Hero Section ──
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  imageContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
    borderRadius: 36,
    backgroundColor: '#fff',
  },
  heroImage: {
    width: 160,
    height: 160,
    borderRadius: 36,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: 160,
    height: 160,
    borderRadius: 36,
    backgroundColor: '#D8F3DC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 70,
  },
  heroName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B4332',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSpecies: {
    fontSize: 15,
    color: '#52B788',
    fontWeight: '600',
    marginBottom: 24,
    fontStyle: 'italic',
  },

  // ── Diagnose Button ──
  diagnoseButton: {
    width: '100%',
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderRadius: 20,
  },
  diagnoseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
    gap: 12,
  },
  diagnoseIcon: {
    fontSize: 24,
  },
  diagnoseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Sections ──
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B4332',
    marginBottom: 16,
  },

  // ── Rules Card ──
  rulesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ruleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eaf8ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleIcon: {
    fontSize: 20,
  },
  ruleContent: {
    flex: 1,
  },
  ruleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: 2,
  },
  ruleValue: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  ruleDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 16,
    marginLeft: 60,
  },

  // ── History Empty ──
  historySection: {
    marginBottom: 28,
  },
  historyScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  historyEmptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderStyle: 'dashed',
    gap: 8,
  },
  historyEmptyEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  historyEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B4332',
  },
  historyEmptySubtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Log Cards ──
  logCard: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logDate: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1B4332',
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  urgencyHigh: {
    backgroundColor: '#FFCDD2',
  },
  urgencyMedium: {
    backgroundColor: '#FFF9C4',
  },
  urgencyLow: {
    backgroundColor: '#C8E6C9',
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#333',
  },
  urgencyTextHigh: {
    color: '#B71C1C',
  },
  logImagesRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  logImage: {
    height: 110,
    borderRadius: 14,
  },
  logDiagnosis: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 12,
  },
  actionPlanTag: {
    backgroundColor: '#f1f8f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionPlanTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D6A4F',
  },

  // ── Danger Zone ──
  deleteLink: {
    alignItems: 'center',
    padding: 18,
    marginHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginTop: 10,
  },
  deleteLinkText: {
    color: '#C62828',
    fontSize: 15,
    fontWeight: '700',
  },
});
