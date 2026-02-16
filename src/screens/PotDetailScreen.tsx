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
} from 'react-native';
import type { Pot, SpeciesCareGuide, CareSchedule } from '@eb-packages/garden';
import {
  deletePot,
  getSpeciesCareGuide,
  getCareSchedules,
} from '@eb-packages/logic';
import { Screen } from '@eb-packages/ui';
import { CareHistoryList } from '../components/Care/CareHistoryList';
import { PlantQuickInfo } from '../components/Care/PlantQuickInfo';
import { WeatherAlert } from '../components/Care/WeatherAlert';
import { PlantAdvisor } from '../components/Care/PlantAdvisor';

interface PotDetailScreenProps {
  pot: Pot;
  onBack: () => void;
  onEdit: () => void;
  onDeleted: () => void;
  onCareSettings: () => void;
}

export const PotDetailScreen = ({
  pot,
  onBack,
  onEdit,
  onDeleted,
  onCareSettings,
}: PotDetailScreenProps) => {
  const [careGuide, setCareGuide] = React.useState<SpeciesCareGuide | null>(
    null,
  );
  const [schedules, setSchedules] = React.useState<CareSchedule[]>([]);

  React.useEffect(() => {
    if (pot.species) {
      getSpeciesCareGuide(pot.species).then(setCareGuide);
    }
    getCareSchedules(pot.id).then(setSchedules);
  }, [pot.species, pot.id]);

  const handleDelete = async () => {
    // For web, use window.confirm as fallback
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `¿Estás seguro de que querés eliminar "${pot.name}"? No se puede deshacer.`,
      );
      if (!confirmed) return;

      const success = await deletePot(pot.id);
      if (success) {
        alert('Pot eliminado');
        onDeleted();
      } else {
        alert('Error al eliminar. Intentá de nuevo.');
      }
      return;
    }

    // For native platforms
    Alert.alert(
      'Eliminar Pot',
      `¿Estás seguro de que querés eliminar "${pot.name}"? No se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await deletePot(pot.id);
            if (success) {
              Alert.alert('Listo', 'Pot eliminado', [
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

  const getStateLabel = (state: string) => {
    const labels = {
      seeds: '🌱 Semillas',
      seedling: '🌿 Brote',
      young: '🪴 Planta joven',
      mature: '🌳 Planta madura',
    };
    return labels[state as keyof typeof labels] || state;
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pot.name}</Text>
        <TouchableOpacity style={styles.editButtonHeader} onPress={onEdit}>
          <Text style={styles.editButtonTextHeader}>✏️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.imageContainer}>
            {pot.photo_url ? (
              <Image source={{ uri: pot.photo_url }} style={styles.heroImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderIcon}>🌱</Text>
              </View>
            )}
          </View>
          <Text style={styles.heroName}>{pot.name}</Text>
          <Text style={styles.heroSpecies}>{pot.species}</Text>
          <View style={styles.chipRow}>
            <View style={styles.stateChip}>
              <Text style={styles.stateChipText}>
                {getStateLabel(pot.initial_state)}
              </Text>
            </View>
            <View
              style={[
                styles.stateChip,
                pot.location_type === 'indoor'
                  ? { backgroundColor: '#fff3e0', borderColor: '#ffe0b2' }
                  : { backgroundColor: '#e8f5e9', borderColor: '#c8e6c9' },
              ]}
            >
              <Text
                style={[
                  styles.stateChipText,
                  {
                    color:
                      pot.location_type === 'indoor' ? '#e65100' : '#2e7d32',
                  },
                ]}
              >
                {pot.location_type === 'indoor' ? '🏠 Interior' : '🌳 Exterior'}
              </Text>
            </View>
          </View>
        </View>

        {/* Smart Plant Advisor — contextual Q&A */}
        <PlantAdvisor
          species={pot.species}
          registeredAt={pot.registered_at}
          schedules={schedules}
          careGuide={careGuide}
          weatherCondition={pot.weather_condition}
          temperature={pot.temperature}
          humidity={pot.humidity}
          latitude={pot.latitude}
          locationType={pot.location_type}
        />

        {/* Quick Info Cards */}
        <PlantQuickInfo
          registeredAt={pot.registered_at}
          schedules={schedules}
          careGuide={careGuide}
        />

        {/* Weather Alerts */}
        <WeatherAlert
          weatherCondition={pot.weather_condition}
          weatherDescription={pot.weather_description}
          temperature={pot.temperature}
          humidity={pot.humidity}
        />

        {/* Care Management Link */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cuidados</Text>
            <TouchableOpacity onPress={onCareSettings}>
              <Text style={styles.linkButton}>Configurar ⚙️</Text>
            </TouchableOpacity>
          </View>
          {schedules.length === 0 && (
            <TouchableOpacity
              style={styles.emptyScheduleCard}
              onPress={onCareSettings}
            >
              <Text style={styles.emptyScheduleIcon}>📋</Text>
              <Text style={styles.emptyScheduleText}>
                No tenés horarios configurados.{'\n'}
                <Text style={styles.emptyScheduleLink}>
                  Tocá aquí para crear uno
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial</Text>
          <CareHistoryList potId={pot.id} />
        </View>

        {/* About Section (Technical Details — less prominent) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleSmall}>Detalles</Text>
          <View style={styles.aboutCard}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Registrada</Text>
              <Text style={styles.aboutValue}>
                {new Date(pot.registered_at).toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>

            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Humedad umbral</Text>
              <Text style={styles.aboutValue}>{pot.moisture_threshold}%</Text>
            </View>

            {pot.sensor_id && (
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Sensor</Text>
                <Text style={styles.aboutValue}>{pot.sensor_id}</Text>
              </View>
            )}

            {pot.latitude && pot.longitude && (
              <View style={[styles.aboutRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.aboutLabel}>Ubicación</Text>
                <Text style={styles.aboutValue}>
                  {pot.address ||
                    `${pot.latitude.toFixed(4)}, ${pot.longitude.toFixed(4)}`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Danger Zone */}
        <TouchableOpacity style={styles.deleteLink} onPress={handleDelete}>
          <Text style={styles.deleteLinkText}>Eliminar Pot</Text>
        </TouchableOpacity>

        {__DEV__ && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>Debug Metadata</Text>
            <Text style={styles.debugContent}>
              {JSON.stringify(pot, null, 2)}
            </Text>

            <Text style={[styles.debugTitle, { marginTop: 16 }]}>
              Care Schedules ({schedules.length})
            </Text>
            <Text style={styles.debugContent}>
              {JSON.stringify(schedules, null, 2)}
            </Text>

            <Text style={[styles.debugTitle, { marginTop: 16 }]}>
              Species Care Guide
            </Text>
            <Text style={styles.debugContent}>
              {careGuide
                ? JSON.stringify(careGuide, null, 2)
                : 'Not found or loading...'}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#f5f7f5',
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
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 20,
    backgroundColor: '#edf7ed',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 16,
  },
  imageContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  heroImage: {
    width: 130,
    height: 130,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: 130,
    height: 130,
    borderRadius: 28,
    backgroundColor: '#c8e6c9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 52,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1b5e20',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSpecies: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '600',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  stateChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  stateChipText: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1b5e20',
    marginBottom: 12,
  },
  sectionTitleSmall: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9e9e9e',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  linkButton: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2e7d32',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  emptyScheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    gap: 12,
  },
  emptyScheduleIcon: {
    fontSize: 28,
  },
  emptyScheduleText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyScheduleLink: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  aboutCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  aboutLabel: {
    fontSize: 13,
    color: '#888',
    flex: 1,
  },
  aboutValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  deleteLink: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
    marginHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  deleteLinkText: {
    color: '#c62828',
    fontSize: 14,
    fontWeight: '700',
  },
  debugSection: {
    marginTop: 24,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  debugContent: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#333',
  },
});
