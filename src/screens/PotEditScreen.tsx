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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { updatePot, uploadPotPhoto } from '@eb-packages/logic';
import type { Pot } from '@eb-packages/garden';
import { supabase } from '@eb-packages/logic';
import { Screen } from '@eb-packages/ui';
import { analytics, trackPotEdited } from '../services/analyticsService';
import { useScreenLogger } from '../hooks/useScreenLogger';

interface PotEditScreenProps {
  pot: Pot;
  onBack: () => void;
  onSaved: (updatedPot: Pot) => void;
}

export const PotEditScreen = ({ pot, onBack, onSaved }: PotEditScreenProps) => {
  useScreenLogger('PotEditScreen');
  const [photoUri, setPhotoUri] = useState<string | null>(
    pot.photo_url || null,
  );
  const [hasNewPhoto, setHasNewPhoto] = useState(false);
  const [name, setName] = useState(pot.name);
  const [species, setSpecies] = useState(pot.species);
  const [variety, setVariety] = useState(pot.variety || '');
  const [seedType, setSeedType] = useState(pot.seed_type || '');
  const [notes, setNotes] = useState(pot.notes || '');
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
        'Permiso requerido',
        'Se necesita acceso a la cámara para tomar fotos de tus plantas.',
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
      aspect: [1, 1],
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
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setHasNewPhoto(true);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert('Cambiar foto', 'Elegí una opción', [
      { text: '📷 Tomar foto', onPress: takePhoto },
      { text: '🖼️ Galería', onPress: pickImage },
      {
        text: '🗑️ Quitar foto',
        style: 'destructive',
        onPress: () => {
          setPhotoUri(null);
          setHasNewPhoto(true);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Campo requerido', 'Ingresá un nombre para tu planta');
      return false;
    }
    if (!species.trim()) {
      Alert.alert('Campo requerido', 'Ingresá la especie de la planta');
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
      } else if (hasNewPhoto && !photoUri) {
        newPhotoUrl = undefined;
      }

      const updates = {
        name: name.trim(),
        species: species.trim(),
        variety: variety.trim() || undefined,
        seed_type: seedType.trim() || undefined,
        notes: notes.trim() || undefined,
        initial_state: initialState,
        location_type: locationType,
        moisture_threshold: moistureThreshold,
        photo_url: newPhotoUrl,
      };

      const result = await updatePot(pot.id, updates);

      if (result) {
        trackPotEdited(pot.id);
        Alert.alert('Listo', 'Planta actualizada 🌱', [
          { text: 'OK', onPress: () => onSaved(result) },
        ]);
      } else {
        Alert.alert('Error', 'No se pudo guardar. Intentá de nuevo.');
      }
    } catch (error) {
      console.error('Error updating pot:', error);
      analytics.captureError(error, {
        screen: 'PotEditScreen',
        action: 'handleSave',
        potId: pot.id,
      });
      Alert.alert('Error', 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const stateOptions: Array<{
    value: 'seeds' | 'seedling' | 'young' | 'mature';
    label: string;
    emoji: string;
  }> = [
    { value: 'seeds', label: 'Semillas', emoji: '🌱' },
    { value: 'seedling', label: 'Brote', emoji: '🌿' },
    { value: 'young', label: 'Joven', emoji: '🪴' },
    { value: 'mature', label: 'Madura', emoji: '🌳' },
  ];

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onBack}>
            <Text style={styles.headerButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar planta</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          {/* Photo Avatar */}
          <TouchableOpacity
            style={styles.avatarSection}
            onPress={handleChangePhoto}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderEmoji}>🌱</Text>
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeText}>📷</Text>
              </View>
            </View>
            <Text style={styles.avatarHint}>Tocar para cambiar foto</Text>
          </TouchableOpacity>

          {/* Card: Información */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Información</Text>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              placeholder='ej: Tomate del balcón'
              placeholderTextColor='#aaa'
              value={name}
              onChangeText={setName}
              editable={!loading}
            />

            <Text style={styles.label}>Especie *</Text>
            <TextInput
              style={styles.input}
              placeholder='ej: Tomate, Albahaca, Cactus'
              placeholderTextColor='#aaa'
              value={species}
              onChangeText={setSpecies}
              editable={!loading}
            />

            <Text style={styles.label}>Variedad</Text>
            <TextInput
              style={styles.input}
              placeholder='ej: Cherry, San Marzano'
              placeholderTextColor='#aaa'
              value={variety}
              onChangeText={setVariety}
              editable={!loading}
            />

            <Text style={styles.label}>Tipo de semilla</Text>
            <TextInput
              style={styles.input}
              placeholder='ej: Orgánica, Híbrida'
              placeholderTextColor='#aaa'
              value={seedType}
              onChangeText={setSeedType}
              editable={!loading}
            />
          </View>

          {/* Card: Estado y ubicación */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Estado y ubicación</Text>

            <Text style={styles.label}>Estado actual</Text>
            <View style={styles.chipRow}>
              {stateOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.chip,
                    initialState === option.value && styles.chipActive,
                  ]}
                  onPress={() => setInitialState(option.value)}
                  disabled={loading}
                >
                  <Text style={styles.chipEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.chipText,
                      initialState === option.value && styles.chipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Ubicación</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  styles.chipWide,
                  locationType === 'indoor' && styles.chipActive,
                ]}
                onPress={() => setLocationType('indoor')}
                disabled={loading}
              >
                <Text style={styles.chipEmoji}>🏠</Text>
                <Text
                  style={[
                    styles.chipText,
                    locationType === 'indoor' && styles.chipTextActive,
                  ]}
                >
                  Interior
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chip,
                  styles.chipWide,
                  locationType === 'outdoor' && styles.chipActive,
                ]}
                onPress={() => setLocationType('outdoor')}
                disabled={loading}
              >
                <Text style={styles.chipEmoji}>🌳</Text>
                <Text
                  style={[
                    styles.chipText,
                    locationType === 'outdoor' && styles.chipTextActive,
                  ]}
                >
                  Exterior
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card: Configuración */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Configuración</Text>

            <Text style={styles.label}>
              Umbral de humedad: {moistureThreshold}%
            </Text>
            <View style={styles.moistureContainer}>
              <Text style={styles.moistureLabel}>🏜️ Seco</Text>
              <View style={styles.moistureTrack}>
                {[30, 40, 50, 60, 70].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.moistureDot,
                      moistureThreshold === value && styles.moistureDotActive,
                    ]}
                    onPress={() => setMoistureThreshold(value)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.moistureDotLabel,
                        moistureThreshold === value && { color: '#fff' },
                      ]}
                    >
                      {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.moistureLabel}>💧 Húmedo</Text>
            </View>
          </View>

          {/* Card: Notas */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notas</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder='Detalles adicionales sobre tu planta...'
              placeholderTextColor='#aaa'
              value={notes}
              onChangeText={setNotes}
              editable={!loading}
              multiline
              textAlignVertical='top'
            />
          </View>

          {/* Spacer for bottom button */}
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Sticky Save Button */}
        <View style={styles.saveContainer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color='#fff' />
            ) : (
              <Text style={styles.saveButtonText}>Guardar cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7f5',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#f5f7f5',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 18,
    color: '#2e7d32',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
  },
  avatarContainer: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#c8e6c9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderEmoji: {
    fontSize: 40,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e8f5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarBadgeText: {
    fontSize: 14,
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 13,
    color: '#4caf50',
    fontWeight: '500',
  },
  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e8f0e8',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1b5e20',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Form
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8faf8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e8e0',
  },
  textArea: {
    height: 90,
    marginTop: 4,
  },
  // Chips (state & location selectors)
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f5f7f5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0e8e0',
  },
  chipWide: {
    flex: 1,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  chipTextActive: {
    color: '#2e7d32',
  },
  // Moisture slider
  moistureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  moistureLabel: {
    fontSize: 11,
    color: '#888',
  },
  moistureTrack: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  moistureDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f4f0',
    borderWidth: 1.5,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moistureDotActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  moistureDotLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
  },
  // Sticky save button
  saveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    paddingTop: 12,
    backgroundColor: '#f5f7f5',
    borderTopWidth: 1,
    borderTopColor: '#e8f0e8',
  },
  saveButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
