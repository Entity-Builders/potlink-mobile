import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createPot, extractPotMetadata } from '@eb-packages/logic';
import type { PotFormData } from '@eb-packages/garden';
import { VoiceInput } from '@eb-packages/ui';

export const PotRegistrationScreen = ({
  onSuccess,
}: {
  onSuccess?: () => void;
}) => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [seedType, setSeedType] = useState('');
  const [notes, setNotes] = useState('');
  const [initialState, setInitialState] = useState<
    'seeds' | 'seedling' | 'young' | 'mature'
  >('seeds');
  const [moistureThreshold, setMoistureThreshold] = useState(50);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is needed to take photos of your pots.',
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a name for your pot');
      return false;
    }
    if (!species.trim()) {
      Alert.alert('Validation Error', 'Please enter the plant species');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setLoadingStatus('Capturing location and weather...');
    try {
      const potData: PotFormData = {
        name: name.trim(),
        species: species.trim(),
        seed_type: seedType.trim() || undefined,
        notes: notes.trim() || undefined,
        initial_state: initialState,
        moisture_threshold: moistureThreshold,
        photo_uri: photoUri || undefined,
      };

      setLoadingStatus('Uploading and saving pot...');
      const result = await createPot(potData);

      if (result) {
        Alert.alert('Success', 'Pot registered successfully! 🌱', [
          { text: 'OK', onPress: () => onSuccess?.() },
        ]);
        // Reset form
        setPhotoUri(null);
        setName('');
        setSpecies('');
        setSeedType('');
        setNotes('');
        setInitialState('seeds');
        setMoistureThreshold(50);
      } else {
        Alert.alert('Error', 'Failed to register pot. Please try again.');
      }
    } catch (error) {
      console.error('Error registering pot:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  const stateOptions: Array<{
    value: 'seeds' | 'seedling' | 'young' | 'mature';
    label: string;
  }> = [
    { value: 'seeds', label: '🌱 Seeds' },
    { value: 'seedling', label: '🌿 Seedling' },
    { value: 'young', label: '🪴 Young Plant' },
    { value: 'mature', label: '🌳 Mature Plant' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Register New Pot</Text>

        {/* Photo Section */}
        <View style={styles.photoSection}>
          {photoUri ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={() => setPhotoUri(null)}
              >
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>📷</Text>
              <Text style={styles.photoPlaceholderLabel}>Add a photo</Text>
              <View style={styles.photoButtons}>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={takePhoto}
                >
                  <Text style={styles.photoButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={pickImage}
                >
                  <Text style={styles.photoButtonText}>
                    Choose from Gallery
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Pot Name *</Text>
          <TextInput
            style={styles.input}
            placeholder='e.g., Balcony Tomato'
            value={name}
            onChangeText={setName}
            editable={!loading}
          />

          <Text style={styles.label}>Plant Species *</Text>
          <View style={styles.speciesInputContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder='e.g., Tomato, Basil, Cactus'
              value={species}
              onChangeText={setSpecies}
              editable={!loading}
            />
            <VoiceInput
              onResult={async (text) => {
                const metadata = await extractPotMetadata(text);
                if (metadata.name) setName(metadata.name);
                if (metadata.species) setSpecies(metadata.species);
                if (metadata.seed_type) setSeedType(metadata.seed_type);
                if (metadata.notes) setNotes(metadata.notes);
              }}
              style={styles.voiceButton}
            />
          </View>

          <Text style={styles.label}>Seed Type (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder='e.g., Heirloom, Hybrid'
            value={seedType}
            onChangeText={setSeedType}
            editable={!loading}
          />

          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder='Any additional details...'
            value={notes}
            onChangeText={setNotes}
            editable={!loading}
            multiline
          />

          <Text style={styles.label}>Initial State</Text>
          <View style={styles.stateButtons}>
            {stateOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.stateButton,
                  initialState === option.value && styles.stateButtonActive,
                ]}
                onPress={() => setInitialState(option.value)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.stateButtonText,
                    initialState === option.value &&
                      styles.stateButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>
            Moisture Threshold: {moistureThreshold}%
          </Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Dry</Text>
            <View style={styles.sliderTrack}>
              {[30, 40, 50, 60, 70].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.sliderDot,
                    moistureThreshold === value && styles.sliderDotActive,
                  ]}
                  onPress={() => setMoistureThreshold(value)}
                  disabled={loading}
                />
              ))}
            </View>
            <Text style={styles.sliderLabel}>Wet</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color='#fff' />
              {loadingStatus ? (
                <Text style={styles.loadingStatusText}>{loadingStatus}</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Register Pot 🌱</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 20,
  },
  photoSection: {
    marginBottom: 24,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  changePhotoButton: {
    marginTop: 12,
    padding: 8,
  },
  changePhotoText: {
    color: '#2e7d32',
    fontSize: 14,
  },
  photoPlaceholder: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  photoPlaceholderLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  speciesInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceButton: {
    width: 44,
    height: 44,
  },
  stateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stateButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  stateButtonActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  stateButtonText: {
    color: '#666',
    fontSize: 14,
  },
  stateButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  sliderTrack: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  sliderDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  sliderDotActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  submitButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingStatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
