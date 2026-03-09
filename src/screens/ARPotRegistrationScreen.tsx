import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { identifyPlant } from '@eb-packages/logic';
import { createPot, createDefaultCareSchedules } from '@eb-packages/logic';
import type { PotFormData } from '@eb-packages/garden';
import { ARGlassOverlay } from '../components/ARGlassOverlay';
import {
  analytics,
  trackPotCreated,
  trackPlantIdentified,
} from '../services/analyticsService';
import { useScreenLogger } from '../hooks/useScreenLogger';
import { compressImageForUpload } from '../utils/imageUtils';

interface CareInfo {
  climate?: string;
  watering_frequency?: string;
  fertilizer_frequency?: string;
  pruning_info?: string;
  companions?: string;
  care_level?: string;
  sun_exposure?: string;
}

interface IdentifiedData {
  species: string;
  variety?: string;
  confidence?: string;
  description?: string;
}

export const ARPotRegistrationScreen = ({
  onSuccess,
  onCancel,
}: {
  onSuccess?: () => void;
  onCancel?: () => void;
}) => {
  useScreenLogger('ARPotRegistrationScreen');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  const [isScanning, setIsScanning] = useState(false);
  const [identifiedData, setIdentifiedData] = useState<IdentifiedData | null>(
    null,
  );
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [careInfo, setCareInfo] = useState<CareInfo | null>(null);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.message}>
          Necesitamos permiso para usar la cámara
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Dar Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScan = async () => {
    if (!cameraRef.current) return;

    setIsScanning(true);
    setIdentifiedData(null);
    setCapturedPhotoUri(null);
    setCareInfo(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1, // We let imageManipulator handle the heavy compression
        base64: false, // Don't block the UI thread generating huge base64 strings yet
      });

      if (photo?.uri) {
        // Compress the image before anything else
        const { uri: compressedUri, base64 } = await compressImageForUpload(
          photo.uri,
          true,
        );

        if (base64) {
          setCapturedPhotoUri(compressedUri);
          const result = await identifyPlant(base64);

          if (result.species && result.species !== 'Desconocido') {
            setIdentifiedData({
              species: result.species,
              variety: result.variety,
              confidence: result.confidence,
              description: result.description,
            });
            if (result.care_info) {
              setCareInfo(result.care_info);
            }
            trackPlantIdentified(
              result.species,
              result.confidence,
              'ar_camera',
            );
          } else {
            Alert.alert(
              'No Identificada',
              'No se pudo identificar la planta. Intentá acercarte más o mejorar la iluminación.',
            );
            setCapturedPhotoUri(null);
          }
        }
      }
    } catch (error) {
      console.error('Error scanning:', error);
      analytics.captureError(error, {
        screen: 'ARPotRegistrationScreen',
        action: 'scan',
      });
      Alert.alert('Error', 'Falló el escaneo de la planta.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    if (!identifiedData || !capturedPhotoUri) return;

    setSaving(true);
    try {
      const potData: PotFormData = {
        name: identifiedData.variety
          ? `${identifiedData.species} ${identifiedData.variety}`
          : identifiedData.species,
        species: identifiedData.species,
        variety: identifiedData.variety,
        initial_state: 'young',
        location_type: 'outdoor',
        moisture_threshold: 50,
        photo_uri: capturedPhotoUri,
      };

      const result = await createPot(potData);
      if (result) {
        await createDefaultCareSchedules(result.id, careInfo || undefined);
        trackPotCreated(result.id, identifiedData.species, 'ar_camera');
        Alert.alert('¡Listo!', 'Maceta registrada 🌱', [
          { text: 'OK', onPress: onSuccess },
        ]);
      } else {
        Alert.alert('Error', 'No se pudo guardar la maceta.');
      }
    } catch (error) {
      console.error('Save error:', error);
      analytics.captureError(error, {
        screen: 'ARPotRegistrationScreen',
        action: 'save',
      });
      Alert.alert('Error', 'Ocurrió un error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleRetake = () => {
    analytics.track('ar_scan_retake');
    setIdentifiedData(null);
    setCapturedPhotoUri(null);
    setCareInfo(null);
  };

  // Build care info items for display
  const careItems: { icon: string; label: string; value: string }[] = [];
  if (careInfo) {
    if (careInfo.care_level)
      careItems.push({
        icon: '📊',
        label: 'Nivel de cuidado',
        value: careInfo.care_level,
      });
    if (careInfo.watering_frequency)
      careItems.push({
        icon: '💧',
        label: 'Riego',
        value: careInfo.watering_frequency,
      });
    if (careInfo.fertilizer_frequency)
      careItems.push({
        icon: '🧪',
        label: 'Fertilización',
        value: careInfo.fertilizer_frequency,
      });
    if (careInfo.sun_exposure)
      careItems.push({
        icon: '☀️',
        label: 'Exposición solar',
        value: careInfo.sun_exposure,
      });
    if (careInfo.climate)
      careItems.push({
        icon: '🌡️',
        label: 'Clima',
        value: careInfo.climate,
      });
    if (careInfo.pruning_info)
      careItems.push({
        icon: '✂️',
        label: 'Poda',
        value: careInfo.pruning_info,
      });
    if (careInfo.companions)
      careItems.push({
        icon: '🌻',
        label: 'Compañeras',
        value: careInfo.companions,
      });
  }

  // ---------- FULL-SCREEN RESULT VIEW ----------
  if (capturedPhotoUri && identifiedData && !isScanning) {
    return (
      <View style={styles.resultContainer}>
        <ScrollView
          style={styles.resultScroll}
          contentContainerStyle={[
            styles.resultContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo */}
          <Image
            source={{ uri: capturedPhotoUri }}
            style={styles.resultPhoto}
          />

          {/* Header: Name + Variety */}
          <View style={styles.resultHeader}>
            <View style={styles.resultIconContainer}>
              <Text style={styles.resultPlantIcon}>🌿</Text>
            </View>
            <View style={styles.resultTitleContainer}>
              <Text style={styles.resultSpecies}>{identifiedData.species}</Text>
              {identifiedData.variety && (
                <Text style={styles.resultVariety}>
                  {identifiedData.variety}
                </Text>
              )}
            </View>
            {identifiedData.confidence && (
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {identifiedData.confidence}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {identifiedData.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.descriptionText}>
                {identifiedData.description}
              </Text>
            </View>
          )}

          {/* Care Info */}
          {careItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cuidados</Text>
              <View style={styles.careGrid}>
                {careItems.map((item, index) => (
                  <View key={index} style={styles.careCard}>
                    <Text style={styles.careIcon}>{item.icon}</Text>
                    <Text style={styles.careLabel}>{item.label}</Text>
                    <Text style={styles.careValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Sticky Bottom Buttons */}
        <View
          style={[styles.stickyButtons, { paddingBottom: insets.bottom + 16 }]}
        >
          <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
            <Ionicons name='camera-reverse-outline' size={20} color='#636e72' />
            <Text style={styles.retakeText}>Retomar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color='#fff' />
            ) : (
              <>
                <Ionicons
                  name='checkmark-circle-outline'
                  size={20}
                  color='#fff'
                />
                <Text style={styles.saveText}>Confirmar y Guardar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ---------- SCANNING MODE ----------
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing='back'>
        <View style={[styles.uiContainer, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <Ionicons name='close' size={28} color='#fff' />
          </TouchableOpacity>

          <View style={styles.scanTarget}>
            <ARGlassOverlay isScanning={isScanning} />
          </View>

          <View style={styles.bottomControls}>
            <Text style={styles.hintText}>
              Apuntá a una planta y tocá Escanear
            </Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <ActivityIndicator size='large' color='#2e7d32' />
              ) : (
                <View style={styles.scanButtonInner} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  // ── Scanning Mode ──
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  message: {
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  uiContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 40,
  },
  closeButton: {
    alignSelf: 'flex-start',
    padding: 20,
  },
  scanTarget: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    alignItems: 'center',
    gap: 20,
  },
  hintText: {
    color: '#fff',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scanButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
  },

  // ── Full-Screen Result View ──
  resultContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  resultScroll: {
    flex: 1,
  },
  resultContent: {
    paddingBottom: 120,
  },
  resultPhoto: {
    width: '100%',
    height: 280,
    backgroundColor: '#e0e0e0',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 8,
  },
  resultIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  resultPlantIcon: {
    fontSize: 26,
  },
  resultTitleContainer: {
    flex: 1,
  },
  resultSpecies: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  resultVariety: {
    fontSize: 15,
    color: '#636e72',
    marginTop: 2,
  },
  confidenceBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // ── Sections ──
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 15,
    color: '#4a4a5a',
    lineHeight: 22,
  },

  // ── Care Grid ──
  careGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  careCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  careIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  careLabel: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 4,
    fontWeight: '500',
  },
  careValue: {
    fontSize: 14,
    color: '#1a1a2e',
    fontWeight: '600',
  },

  // ── Sticky Buttons ──
  stickyButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#f1f2f6',
  },
  retakeText: {
    color: '#636e72',
    fontWeight: '600',
    fontSize: 15,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#2e7d32',
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
