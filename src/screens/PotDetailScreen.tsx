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
import type { Pot } from '@eb-packages/garden';
import { deletePot } from '@eb-packages/logic';
import { Screen } from '@eb-packages/ui';
import { CareScheduleList } from '../components/Care/CareScheduleList';

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
      <ScrollView>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Photo */}
        {pot.photo_url ? (
          <>
            {console.log('Pot photo URL:', pot.photo_url)}
            <Image
              source={{ uri: pot.photo_url }}
              style={styles.photo}
              onLoad={() =>
                console.log('Image loaded successfully:', pot.photo_url)
              }
              onError={(error) =>
                console.error(
                  'Image failed to load:',
                  error.nativeEvent.error,
                  'URL:',
                  pot.photo_url,
                )
              }
            />
          </>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>🌱</Text>
          </View>
        )}

        {/* Pot Information */}
        <View style={styles.content}>
          <Text style={styles.name}>{pot.name}</Text>
          <Text style={styles.species}>{pot.species}</Text>

          <View style={styles.divider} />

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>State</Text>
              <Text style={styles.detailValue}>
                {getStateLabel(pot.initial_state)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Moisture Threshold</Text>
              <Text style={styles.detailValue}>
                💧 {pot.moisture_threshold}%
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Registered</Text>
              <Text style={styles.detailValue}>
                {formatDate(pot.registered_at)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Day of Year</Text>
              <Text style={styles.detailValue}>
                Day {pot.registered_day_of_year}
              </Text>
            </View>

            {pot.sensor_id && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Sensor ID</Text>
                <Text style={styles.detailValue}>{pot.sensor_id}</Text>
              </View>
            )}
          </View>

          {/* Location & Weather Section */}
          {pot.latitude && pot.longitude && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>📍 Location & Climate</Text>
              <View style={styles.detailsGrid}>
                {pot.address && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Address</Text>
                    <Text style={styles.detailValue}>{pot.address}</Text>
                  </View>
                )}

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>GPS Coordinates</Text>
                  <Text style={styles.detailValue}>
                    {pot.latitude.toFixed(6)}, {pot.longitude.toFixed(6)}
                  </Text>
                </View>

                {pot.temperature && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>
                      Temperature at Registration
                    </Text>
                    <Text style={styles.detailValue}>
                      🌡️ {pot.temperature}°C
                    </Text>
                  </View>
                )}

                {pot.humidity && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>
                      Humidity at Registration
                    </Text>
                    <Text style={styles.detailValue}>💧 {pot.humidity}%</Text>
                  </View>
                )}

                {pot.weather_condition && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Weather Conditions</Text>
                    <Text style={styles.detailValue}>
                      ☁️ {pot.weather_description || pot.weather_condition}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Care Schedule</Text>
            <TouchableOpacity onPress={onCareSettings}>
              <Text style={styles.linkButton}>⚙️ Settings</Text>
            </TouchableOpacity>
          </View>

          <CareScheduleList potId={pot.id} />

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Text style={styles.editButtonText}>✏️ Edit Pot</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>🗑️ Delete Pot</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '600',
  },
  photo: {
    width: '100%',
    height: 300,
    backgroundColor: '#e0e0e0',
  },
  photoPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 80,
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  species: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  actions: {
    marginTop: 32,
    gap: 12,
  },
  editButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d32f2f',
  },
  deleteButtonText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  linkButton: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: '600',
  },
});
