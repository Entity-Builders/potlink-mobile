import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { identifyPlant } from '@eb-packages/logic';
import { createPot } from '@eb-packages/logic';
import type { PotFormData } from '@eb-packages/garden';
import { ARGlassOverlay } from '../components/ARGlassOverlay';

const { width } = Dimensions.get('window');

export const ARPotRegistrationScreen = ({
  onSuccess,
  onCancel,
}: {
  onSuccess?: () => void;
  onCancel?: () => void;
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  const [isScanning, setIsScanning] = useState(false);
  const [identifiedData, setIdentifiedData] = useState<{
    species: string;
    variety?: string;
    description?: string;
  } | null>(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
          We need your permission to show the camera
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScan = async () => {
    if (!cameraRef.current) return;

    setIsScanning(true);
    setIdentifiedData(null);
    setCapturedPhotoUri(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      if (photo?.base64) {
        setCapturedPhotoUri(photo.uri);
        const result = await identifyPlant(photo.base64);

        if (result.species && result.species !== 'Desconocido') {
          setIdentifiedData({
            species: result.species,
            variety: result.variety,
            description: result.description,
          });
        } else {
          Alert.alert(
            'Not Identified',
            'Could not identify the plant. Try getting closer or better lighting.',
          );
          setCapturedPhotoUri(null); // Reset to allow trying again immediately
        }
      }
    } catch (error) {
      console.error('Error scanning:', error);
      Alert.alert('Error', 'Failed to scan plant.');
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
        initial_state: 'young', // Default
        moisture_threshold: 50, // Default
        photo_uri: capturedPhotoUri,
      };

      const result = await createPot(potData);
      if (result) {
        Alert.alert('Success', 'Pot registered! 🌱', [
          { text: 'OK', onPress: onSuccess },
        ]);
      } else {
        Alert.alert('Error', 'Failed to save pot.');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleRetake = () => {
    setIdentifiedData(null);
    setCapturedPhotoUri(null);
  };

  return (
    <View style={styles.container}>
      {capturedPhotoUri && !isScanning ? (
        // Preview Mode
        <View style={styles.previewContainer}>
          {/* We could show the image here, but the camera preview behind the overlay might be confusing if static. 
                 Actually, since we have the photo, let's just show the Card Overlay on top of the Camera View (frozen? No CameraView doesn't freeze easily).
                 Let's stay in CameraView but overlay the result. 
              */}
          <CameraView style={styles.camera} ref={cameraRef} facing='back'>
            <View style={styles.overlayContainer}>
              {/* Result Card */}
              {identifiedData && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                      <Text style={styles.plantIcon}>🌿</Text>
                    </View>
                    <View>
                      <Text style={styles.plantName}>
                        {identifiedData.species}
                      </Text>
                      {identifiedData.variety && (
                        <Text style={styles.plantVariety}>
                          {identifiedData.variety}
                        </Text>
                      )}
                    </View>
                  </View>
                  {identifiedData.description && (
                    <Text style={styles.description} numberOfLines={2}>
                      {identifiedData.description}
                    </Text>
                  )}

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.retakeButton}
                      onPress={handleRetake}
                    >
                      <Text style={styles.retakeText}>Retake</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color='#fff' />
                      ) : (
                        <Text style={styles.saveText}>Confirm & Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </CameraView>
        </View>
      ) : (
        // Scanning Mode
        <CameraView style={styles.camera} ref={cameraRef} facing='back'>
          <View style={[styles.uiContainer, { paddingTop: insets.top }]}>
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <Ionicons name='close' size={28} color='#fff' />
            </TouchableOpacity>

            <View style={styles.scanTarget}>
              <ARGlassOverlay isScanning={isScanning} />
            </View>

            <View style={styles.bottomControls}>
              <Text style={styles.hintText}>Point at a plant and tap Scan</Text>
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
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
  previewContainer: {
    flex: 1,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 50,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  plantIcon: {
    fontSize: 24,
  },
  plantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  plantVariety: {
    fontSize: 14,
    color: '#636e72',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#636e72',
    lineHeight: 20,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f1f2f6',
    alignItems: 'center',
  },
  retakeText: {
    color: '#636e72',
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
