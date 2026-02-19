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
import { updatePot, uploadPotPhoto } from '@eb-packages/logic';
import type { Pot } from '@eb-packages/garden';
import { supabase } from '@eb-packages/logic';
import { Screen } from '@eb-packages/ui';

interface PotEditScreenProps {
  pot: Pot;
  onBack: () => void;
  onSaved: (updatedPot: Pot) => void;
}

export const PotEditScreen = ({ pot, onBack, onSaved }: PotEditScreenProps) => {
  const [photoUri, setPhotoUri] = useState<string | null>(
    pot.photo_url || null,
  );
  const [hasNewPhoto, setHasNewPhoto] = useState(false);
  const [name, setName] = useState(pot.name);
  const [species, setSpecies] = useState(pot.species);
  const [initialState, setInitialState] = useState<
    'seeds' | 'seedling' | 'young' | 'mature'
  >(pot.initial_state);
  const [moistureThreshold, setMoistureThreshold] = useState(
    pot.moisture_threshold,
  );
  const [locationType, setLocationType] = useState<'indoor' | 'outdoor'>(
    pot.location_type || 'outdoor',
  );
  const [loading, setLoading] = useState(false);

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
      setHasNewPhoto(true);
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
      setHasNewPhoto(true);
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

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let newPhotoUrl = pot.photo_url;

      // Upload new photo if changed
      if (hasNewPhoto && photoUri) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const uploadedUrl = await uploadPotPhoto(user.id, photoUri);
          if (uploadedUrl) {
            newPhotoUrl = uploadedUrl;
          }
        }
      }

      const updates = {
        name: name.trim(),
        species: species.trim(),
        initial_state: initialState,
        location_type: locationType,
        moisture_threshold: moistureThreshold,
        photo_url: newPhotoUrl,
      };

      const result = await updatePot(pot.id, updates);

      if (result) {
        Alert.alert('Success', 'Pot updated successfully! 🌱', [
          { text: 'OK', onPress: () => onSaved(result) },
        ]);
      } else {
        Alert.alert('Error', 'Failed to update pot. Please try again.');
      }
    } catch (error) {
      console.error('Error updating pot:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
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
    <Screen style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Edit Pot</Text>
          </View>

          {/* Photo Section */}
          <View style={styles.photoSection}>
            {photoUri ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photoUri }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={() => {
                    setPhotoUri(null);
                    setHasNewPhoto(true);
                  }}
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
            <TextInput
              style={styles.input}
              placeholder='e.g., Tomato, Basil, Cactus'
              value={species}
              onChangeText={setSpecies}
              editable={!loading}
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

            <Text style={styles.label}>Ubicación</Text>
            <View style={styles.stateButtons}>
              <TouchableOpacity
                style={[
                  styles.stateButton,
                  locationType === 'indoor' && styles.stateButtonActive,
                ]}
                onPress={() => setLocationType('indoor')}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.stateButtonText,
                    locationType === 'indoor' && styles.stateButtonTextActive,
                  ]}
                >
                  🏠 Interior
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.stateButton,
                  locationType === 'outdoor' && styles.stateButtonActive,
                ]}
                onPress={() => setLocationType('outdoor')}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.stateButtonText,
                    locationType === 'outdoor' && styles.stateButtonTextActive,
                  ]}
                >
                  🌳 Exterior
                </Text>
              </TouchableOpacity>
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

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color='#fff' />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
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
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
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
  saveButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
