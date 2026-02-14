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
import type { Pot, SpeciesCareGuide } from '@eb-packages/garden';
import { deletePot, getSpeciesCareGuide } from '@eb-packages/logic';
import { Screen } from '@eb-packages/ui';
import { CareScheduleList } from '../components/Care/CareScheduleList';
import { CareHistoryList } from '../components/Care/CareHistoryList';

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

  React.useEffect(() => {
    if (__DEV__ && pot.species) {
      getSpeciesCareGuide(pot.species).then(setCareGuide);
    }
  }, [pot.species]);

  const handleDelete = async () => {
    console.log('Delete button clicked for pot:', pot.id, pot.name);

    // For web, use window.confirm as fallback
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${pot.name}"? This cannot be undone.`,
      );
      if (!confirmed) return;

      console.log('User confirmed delete');
      const success = await deletePot(pot.id);
      if (success) {
        alert('Pot deleted successfully');
        onDeleted();
      } else {
        alert('Failed to delete pot. Please try again.');
      }
      return;
    }

    // For native platforms
    Alert.alert(
      'Delete Pot',
      `Are you sure you want to delete "${pot.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('User confirmed delete');
            const success = await deletePot(pot.id);
            if (success) {
              Alert.alert('Success', 'Pot deleted successfully', [
                { text: 'OK', onPress: onDeleted },
              ]);
            } else {
              Alert.alert('Error', 'Failed to delete pot. Please try again.');
            }
          },
        },
      ],
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStateLabel = (state: string) => {
    const labels = {
      seeds: '🌱 Seeds',
      seedling: '🌿 Seedling',
      young: '🪴 Young Plant',
      mature: '🌳 Mature Plant',
    };
    return labels[state as keyof typeof labels] || state;
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editButtonHeader} onPress={onEdit}>
          <Text style={styles.editButtonTextHeader}>Edit</Text>
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
        </View>

        {/* Status Cards */}
        <View style={styles.statusContainer}>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>MOISTURE</Text>
            <Text style={styles.statusValue}>{pot.moisture_threshold}%</Text>
          </View>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>STATE</Text>
            <Text style={styles.statusValue}>
              {getStateLabel(pot.initial_state)}
            </Text>
          </View>
        </View>

        {/* Care Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Care</Text>
            <TouchableOpacity onPress={onCareSettings}>
              <Text style={styles.linkButton}>Manage Schedule</Text>
            </TouchableOpacity>
          </View>
          <CareScheduleList potId={pot.id} />
        </View>

        {/* About Section (Collapsible details) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Registered</Text>
              <Text style={styles.aboutValue}>
                {formatDate(pot.registered_at)}
              </Text>
            </View>

            {pot.sensor_id && (
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Sensor Device</Text>
                <Text style={styles.aboutValue}>{pot.sensor_id}</Text>
              </View>
            )}

            {pot.latitude && pot.longitude && (
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Location</Text>
                <Text style={styles.aboutValue}>
                  {pot.address ||
                    `${pot.latitude.toFixed(4)}, ${pot.longitude.toFixed(4)}`}
                </Text>
              </View>
            )}

            {pot.weather_condition && (
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Weather</Text>
                <Text style={styles.aboutValue}>
                  {pot.weather_description || pot.weather_condition}
                  {pot.temperature ? ` (${pot.temperature}°C)` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* History Section (Lower priority) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          <CareHistoryList potId={pot.id} />
        </View>

        {/* Danger Zone */}
        <TouchableOpacity style={styles.deleteLink} onPress={handleDelete}>
          <Text style={styles.deleteLinkText}>Delete Pot</Text>
        </TouchableOpacity>

        {__DEV__ && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>Debug Metadata</Text>
            <Text style={styles.debugContent}>
              {JSON.stringify(pot, null, 2)}
            </Text>

            <Text style={[styles.debugTitle, { marginTop: 16 }]}>
              Species Care Guide
            </Text>
            <Text style={styles.debugContent}>
              {careGuide
                ? JSON.stringify(careGuide, null, 2)
                : 'Loading or not found...'}
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  editButtonHeader: {
    padding: 8,
    marginRight: -8,
  },
  editButtonTextHeader: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
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
    width: 160,
    height: 160,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: 160,
    height: 160,
    borderRadius: 24,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
  },
  heroName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSpecies: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  linkButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  aboutCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  aboutLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  aboutValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  deleteLink: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  deleteLinkText: {
    color: '#d32f2f',
    fontSize: 15,
    fontWeight: '600',
  },
  debugSection: {
    marginTop: 24,
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
