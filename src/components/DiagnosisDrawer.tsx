import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import type { Pot, PotDiagnosisLog } from '@eb-packages/garden';
import { diagnosePlant } from '@eb-packages/logic';

interface DiagnosisDrawerProps {
  visible: boolean;
  pot: Pot;
  onClose: () => void;
  onSuccess: (log: PotDiagnosisLog) => void;
}

type DrawerState = 'IDLE' | 'ANALYZING' | 'RESULT';

const ANALYZING_MESSAGES = [
  'Analizando las hojas...',
  'Verificando humedad de la tierra...',
  'Consultando nuestra base botánica...',
  'Generando el diagnóstico...',
];

export const DiagnosisDrawer: React.FC<DiagnosisDrawerProps> = ({
  visible,
  pot,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<DrawerState>('IDLE');

  // Images
  const [generalImage, setGeneralImage] = useState<string | null>(null);
  const [soilImage, setSoilImage] = useState<string | null>(null);

  // Analyzing State
  const [messageIndex, setMessageIndex] = useState(0);

  // Result State
  const [resultLog, setResultLog] = useState<PotDiagnosisLog | null>(null);

  // Reset state when opened
  useEffect(() => {
    if (visible) {
      setStep('IDLE');
      setGeneralImage(null);
      setSoilImage(null);
      setResultLog(null);
      setMessageIndex(0);
    }
  }, [visible]);

  // Rotator for analyzing messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'ANALYZING') {
      interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % ANALYZING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const takePhoto = async (type: 'GENERAL' | 'SOIL') => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Error', 'Necesitás darle permisos a la cámara.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets || !result.assets[0].base64) {
      return;
    }

    const imageBase64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
    if (type === 'GENERAL') {
      setGeneralImage(imageBase64);
    } else {
      setSoilImage(imageBase64);
    }
  };

  const startDiagnosis = async () => {
    if (!generalImage || !soilImage) {
      Alert.alert('Faltan fotos', 'Por favor tomá ambas fotos para continuar.');
      return;
    }

    setStep('ANALYZING');
    try {
      const newLog = await diagnosePlant({
        potId: pot.id,
        generalImage,
        soilImage,
        name: pot.name,
        species: pot.species,
      });

      setResultLog(newLog);
      setStep('RESULT');
      onSuccess(newLog);
    } catch (error) {
      console.error('Diagnostic error:', error);
      Alert.alert('Error', 'No pudimos consultar al doctor en este momento.');
      setStep('IDLE');
    }
  };

  const renderIdle = () => (
    <View style={styles.idleContainer}>
      <Text style={styles.instructions}>
        Para un diagnóstico preciso, el doctor necesita ver el estado general de
        tu planta y un primer plano de su tierra.
      </Text>

      <View style={styles.photoRow}>
        <TouchableOpacity
          style={styles.photoBox}
          onPress={() => takePhoto('GENERAL')}
        >
          {generalImage ? (
            <Image source={{ uri: generalImage }} style={styles.previewImage} />
          ) : (
            <>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoLabel}>Macetas y hojas</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.photoBox}
          onPress={() => takePhoto('SOIL')}
        >
          {soilImage ? (
            <Image source={{ uri: soilImage }} style={styles.previewImage} />
          ) : (
            <>
              <Text style={styles.photoIcon}>🪴</Text>
              <Text style={styles.photoLabel}>Tierra y tallo</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          (!generalImage || !soilImage) && styles.submitButtonDisabled,
        ]}
        onPress={startDiagnosis}
        disabled={!generalImage || !soilImage}
      >
        <Text style={styles.submitButtonText}>Iniciar Diagnóstico</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAnalyzing = () => (
    <View style={styles.analyzingContainer}>
      <ActivityIndicator size='large' color='#2D6A4F' />
      <Text style={styles.analyzingMessage}>
        {ANALYZING_MESSAGES[messageIndex]}
      </Text>
    </View>
  );

  const renderResult = () => {
    if (!resultLog) return null;
    return (
      <ScrollView
        style={styles.resultContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.chatBubble}>
          <Text style={styles.doctorName}>👨‍⚕️ Plant Doctor</Text>
          <Text style={styles.chatText}>{resultLog.ai_diagnosis}</Text>

          <View
            style={[
              styles.urgencyBadge,
              resultLog.urgency === 'high'
                ? styles.urgencyHigh
                : resultLog.urgency === 'medium'
                  ? styles.urgencyMedium
                  : styles.urgencyLow,
            ]}
          >
            <Text style={styles.urgencyText}>
              Urgencia: {resultLog.urgency.toUpperCase()}
            </Text>
          </View>

          {resultLog.action_plan && resultLog.action_plan.length > 0 && (
            <View style={styles.actionPlanContainer}>
              <Text style={styles.actionPlanTitle}>Plan de Acción:</Text>
              {resultLog.action_plan.map((step, idx) => (
                <Text key={idx} style={styles.actionPlanStep}>
                  • {step}
                </Text>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.closeResultButton} onPress={onClose}>
          <Text style={styles.closeResultText}>Ok, entiendo</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} transparent animationType='slide'>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          disabled={step === 'ANALYZING'}
        />
        <View style={styles.drawerCard}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>
              {step === 'IDLE'
                ? 'Nuevo Diagnóstico'
                : step === 'ANALYZING'
                  ? 'Analizando...'
                  : 'Resultados'}
            </Text>
            {step !== 'ANALYZING' && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.drawerContent}>
            {step === 'IDLE' && renderIdle()}
            {step === 'ANALYZING' && renderAnalyzing()}
            {step === 'RESULT' && renderResult()}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawerCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '45%',
    paddingBottom: 40, // for safe area
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B4332',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
  },
  drawerContent: {
    padding: 24,
    flexShrink: 1,
  },

  // IDLE State
  idleContainer: {
    alignItems: 'center',
  },
  instructions: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
    width: '100%',
  },
  photoBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  photoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#1B4332',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // ANALYZING State
  analyzingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  analyzingMessage: {
    marginTop: 20,
    fontSize: 16,
    color: '#2D6A4F',
    fontWeight: '600',
    textAlign: 'center',
  },

  // RESULT State
  resultContainer: {
    maxHeight: 500,
  },
  chatBubble: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    marginBottom: 24,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1B4332',
    marginBottom: 8,
  },
  chatText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  urgencyHigh: { backgroundColor: '#FFCDD2' },
  urgencyMedium: { backgroundColor: '#FFF9C4' },
  urgencyLow: { backgroundColor: '#C8E6C9' },
  urgencyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#555',
  },
  actionPlanContainer: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
  },
  actionPlanTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: 8,
  },
  actionPlanStep: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
    lineHeight: 20,
  },
  closeResultButton: {
    width: '100%',
    backgroundColor: '#888',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeResultText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
