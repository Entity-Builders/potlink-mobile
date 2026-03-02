import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Screen } from '@eb-packages/ui';
import type { Pot, CareType } from '@eb-packages/garden';
import { upsertCareSchedule } from '@eb-packages/logic';
import { analytics } from '../services/analyticsService';
import { useScreenLogger } from '../hooks/useScreenLogger';

interface CareSettingsScreenProps {
  pot: Pot;
  onBack: () => void;
}

export const CareSettingsScreen = ({
  pot,
  onBack,
}: CareSettingsScreenProps) => {
  useScreenLogger('CareSettingsScreen');
  const [selectedType, setSelectedType] = useState<CareType>('watering');
  const [frequency, setFrequency] = useState('7');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const careTypes: { type: CareType; label: string; icon: string }[] = [
    { type: 'watering', label: 'Watering', icon: '💧' },
    { type: 'fertilizing', label: 'Fertilizing', icon: '🌿' },
    { type: 'pruning', label: 'Pruning', icon: '✂️' },
    { type: 'repotting', label: 'Repotting', icon: '🪴' },
    { type: 'other', label: 'Other', icon: '📅' },
  ];

  const handleSave = async () => {
    if (!frequency || isNaN(parseInt(frequency))) {
      alert('Please enter a valid frequency (days)');
      return;
    }

    setSaving(true);
    try {
      const result = await upsertCareSchedule({
        pot_id: pot.id,
        care_type: selectedType,
        frequency_days: parseInt(frequency),
        notes: notes,
      });

      if (result) {
        analytics.track('care_schedule_saved', {
          pot_id: pot.id,
          care_type: selectedType,
          frequency_days: parseInt(frequency),
        });
        alert('Schedule saved successfully!');
        onBack();
      } else {
        analytics.captureError(new Error('upsertCareSchedule returned null'), {
          screen: 'CareSettingsScreen',
          action: 'handleSave',
          potId: pot.id,
        });
        alert('Failed to save schedule. Please try again.');
      }
    } catch (error) {
      analytics.captureError(error, {
        screen: 'CareSettingsScreen',
        action: 'handleSave',
        potId: pot.id,
      });
      alert('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Care Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.potName}>{pot.name}</Text>
        <Text style={styles.sectionTitle}>Select Care Type</Text>

        <View style={styles.typeGrid}>
          {careTypes.map((item) => (
            <TouchableOpacity
              key={item.type}
              style={[
                styles.typeButton,
                selectedType === item.type && styles.selectedTypeButton,
              ]}
              onPress={() => setSelectedType(item.type)}
            >
              <Text style={styles.typeIcon}>{item.icon}</Text>
              <Text
                style={[
                  styles.typeLabel,
                  selectedType === item.type && styles.selectedTypeLabel,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Frequency (days)</Text>
          <TextInput
            style={styles.input}
            value={frequency}
            onChangeText={setFrequency}
            keyboardType='number-pad'
            placeholder='e.g. 7'
          />
          <Text style={styles.helperText}>
            Repeat every {frequency || '...'} days
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholder='Add specific instructions...'
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Schedule'}
          </Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 20,
  },
  potName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  typeButton: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedTypeButton: {
    borderColor: '#2e7d32',
    backgroundColor: '#e8f5e9',
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedTypeLabel: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
