import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ARGlassOverlay } from './ARGlassOverlay';
import { compressImageForUpload } from '../utils/imageUtils';

interface CameraDiagnosisOverlayProps {
  visible: boolean;
  onCancel: () => void;
  onComplete: (generalImageBase64: string, soilImageBase64: string) => void;
}

export const CameraDiagnosisOverlay: React.FC<CameraDiagnosisOverlayProps> = ({
  visible,
  onCancel,
  onComplete,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<'HOJAS' | 'TIERRA'>('HOJAS');
  const [generalImage, setGeneralImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep('HOJAS');
      setGeneralImage(null);
      setIsCapturing(false);
      if (permission && !permission.granted) {
        requestPermission();
      }
    }
  }, [visible, permission]);

  if (!visible) return null;

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType='slide' transparent={false}>
        <View style={styles.permissionContainer}>
          <Text style={styles.message}>
            Necesitamos permiso para usar la cámara
          </Text>
          <TouchableOpacity onPress={requestPermission} style={styles.button}>
            <Text style={styles.buttonText}>Dar Permiso</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.button, { marginTop: 12, backgroundColor: '#555' }]}
          >
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
      });

      if (photo?.uri) {
        // Compress the image and ask for base64 back
        const { base64 } = await compressImageForUpload(photo.uri, true);

        if (base64) {
          const imageBase64 = `data:image/jpeg;base64,${base64}`;

          if (step === 'HOJAS') {
            setGeneralImage(imageBase64);
            setStep('TIERRA');
          } else {
            // Ya tenemos generalImage, ahora tomamos soil
            onComplete(generalImage!, imageBase64);
          }
        }
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Modal visible={visible} animationType='slide' transparent={false}>
      <View style={styles.container}>
        <CameraView style={styles.camera} ref={cameraRef} facing='back'>
          <View style={[styles.uiContainer, { paddingTop: insets.top }]}>
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <Ionicons name='close' size={28} color='#fff' />
            </TouchableOpacity>

            <View style={styles.scanTarget}>
              <ARGlassOverlay isScanning={isCapturing} />
            </View>

            <View
              style={[
                styles.bottomControls,
                { paddingBottom: Math.max(insets.bottom, 20) },
              ]}
            >
              <View style={styles.instructionBubble}>
                <Text style={styles.stepText}>
                  {step === 'HOJAS' ? 'Paso 1 de 2' : 'Paso 2 de 2'}
                </Text>
                <Text style={styles.hintText}>
                  {step === 'HOJAS'
                    ? 'Toma una foto de las hojas y parte superior'
                    : 'Ahora por último toma la tierra y maceta'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <ActivityIndicator size='large' color='#2e7d32' />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    width: '100%',
    paddingHorizontal: 20,
    gap: 30,
  },
  instructionBubble: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  stepText: {
    color: '#A5D6A7',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  hintText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
  },
});
