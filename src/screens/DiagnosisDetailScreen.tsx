import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Leaf,
  Droplets,
  Bug,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';
import type { Pot, PotDiagnosisLog } from '@eb-packages/garden';
import { Screen } from '@eb-packages/ui';
import { useScreenLogger } from '../hooks/useScreenLogger';

interface DiagnosisDetailScreenProps {
  pot: Pot;
  log: PotDiagnosisLog;
  onBack: () => void;
}

export const DiagnosisDetailScreen = ({
  pot,
  log,
  onBack,
}: DiagnosisDetailScreenProps) => {
  useScreenLogger('DiagnosisDetailScreen');

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Diagnóstico</Text>
        <View style={styles.placeholderRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerInfo}>
          <Text style={styles.dateText}>
            {new Date(log.created_at).toLocaleDateString('es-AR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <View
            style={[
              styles.urgencyBadge,
              log.urgency === 'high'
                ? styles.urgencyHigh
                : log.urgency === 'medium'
                  ? styles.urgencyMedium
                  : styles.urgencyLow,
            ]}
          >
            <Text
              style={[
                styles.urgencyText,
                log.urgency === 'high' ? styles.urgencyTextHigh : {},
              ]}
            >
              PRIORIDAD: {log.urgency.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Images */}
        <View style={styles.imagesContainer}>
          {log.general_image_url && log.general_image_url !== 'pending' && (
            <Image
              source={{ uri: log.general_image_url }}
              style={[
                styles.logImage,
                log.soil_image_url && log.soil_image_url !== 'pending'
                  ? { width: '48%' }
                  : { width: '100%' },
              ]}
            />
          )}
          {log.soil_image_url && log.soil_image_url !== 'pending' && (
            <Image
              source={{ uri: log.soil_image_url }}
              style={[
                styles.logImage,
                log.general_image_url && log.general_image_url !== 'pending'
                  ? { width: '48%' }
                  : { width: '100%' },
              ]}
            />
          )}
        </View>

        {/* AI Diagnosis Text */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análisis del Doctor 🩺</Text>
          <View style={styles.card}>
            <Text style={styles.diagnosisText}>{log.ai_diagnosis}</Text>
          </View>
        </View>

        {/* Bento Box */}
        {log.metadata && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Signos Vitales</Text>
            <View style={styles.bentoGrid}>
              <View style={styles.bentoRow}>
                <View style={styles.bentoCard}>
                  <View
                    style={[
                      styles.bentoIconBadge,
                      { backgroundColor: '#e3f2fd' },
                    ]}
                  >
                    <Droplets size={24} color='#1976d2' strokeWidth={2.5} />
                  </View>
                  <Text style={styles.bentoTitle}>Humedad Tierra</Text>
                  <Text
                    style={[
                      styles.bentoValue,
                      log.metadata.soil_condition === 'dry'
                        ? styles.colorWarning
                        : log.metadata.soil_condition === 'waterlogged'
                          ? styles.colorDanger
                          : styles.colorGood,
                    ]}
                  >
                    {log.metadata.soil_condition === 'dry'
                      ? 'Reseca'
                      : log.metadata.soil_condition === 'moist'
                        ? 'Adecuada'
                        : log.metadata.soil_condition === 'waterlogged'
                          ? 'Encharcada'
                          : 'Desconocida'}
                  </Text>
                </View>

                <View style={styles.bentoCard}>
                  <View
                    style={[
                      styles.bentoIconBadge,
                      { backgroundColor: '#e8f5e9' },
                    ]}
                  >
                    <Leaf size={24} color='#388e3c' strokeWidth={2.5} />
                  </View>
                  <Text style={styles.bentoTitle}>Vitalidad</Text>
                  <Text
                    style={[
                      styles.bentoValue,
                      log.metadata.plant_vitality === 'healthy'
                        ? styles.colorGood
                        : log.metadata.plant_vitality === 'wilted'
                          ? styles.colorWarning
                          : log.metadata.plant_vitality === 'drooping'
                            ? styles.colorDanger
                            : styles.colorNeutral,
                    ]}
                  >
                    {log.metadata.plant_vitality === 'healthy'
                      ? 'Excelente'
                      : log.metadata.plant_vitality === 'wilted'
                        ? 'Marchita'
                        : log.metadata.plant_vitality === 'drooping'
                          ? 'Caída'
                          : 'Desconocida'}
                  </Text>
                </View>
              </View>

              <View style={[styles.bentoCard, styles.bentoCardFull]}>
                <View style={styles.bentoRow}>
                  <View
                    style={[
                      styles.bentoIconBadge,
                      {
                        backgroundColor:
                          log.metadata.has_pests ||
                          log.metadata.suspected_disease !== 'none'
                            ? '#ffebee'
                            : '#f1f8f5',
                      },
                    ]}
                  >
                    <Bug
                      size={32}
                      color={
                        log.metadata.has_pests ||
                        log.metadata.suspected_disease !== 'none'
                          ? '#d32f2f'
                          : '#2D6A4F'
                      }
                    />
                  </View>
                  <View style={styles.bentoContentRight}>
                    <Text style={styles.bentoTitle}>Sistema Inmunológico</Text>
                    {log.metadata.has_pests ||
                    (log.metadata.suspected_disease &&
                      log.metadata.suspected_disease !== 'none') ? (
                      <View style={styles.bentoPestAlert}>
                        <AlertCircle
                          size={16}
                          color='#d32f2f'
                          style={{ marginRight: 6 }}
                        />
                        <Text style={styles.bentoPestText}>
                          {log.metadata.has_pests
                            ? `Plaga detectada: ${log.metadata.pest_type?.[0] || 'Desconocida'}`
                            : 'Riesgo de enfermedad'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.bentoPestAlert}>
                        <CheckCircle2
                          size={16}
                          color='#388e3c'
                          style={{ marginRight: 6 }}
                        />
                        <Text style={styles.bentoPestTextGood}>
                          Ninguna plaga visible
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Action Plan */}
        {log.action_plan && log.action_plan.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plan de Acción</Text>
            <View style={styles.actionPlanCard}>
              {log.action_plan.map((action, idx) => (
                <View key={idx} style={styles.actionItem}>
                  <View style={styles.actionBullet}>
                    <Text style={styles.actionBulletText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.actionText}>{action}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAF9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#F9FAF9',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: { fontSize: 18, color: '#2e7d32', fontWeight: '700' },
  placeholderRight: { width: 36, height: 36 },
  scrollContent: { paddingBottom: 60 },

  headerInfo: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#555',
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  urgencyBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  urgencyLow: { backgroundColor: '#e8f5e9' },
  urgencyMedium: { backgroundColor: '#fff3e0' },
  urgencyHigh: { backgroundColor: '#ffebee' },
  urgencyText: { fontSize: 13, fontWeight: '700', color: '#2e7d32' },
  urgencyTextHigh: { color: '#c62828' },

  imagesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  logImage: { height: 200, borderRadius: 24, backgroundColor: '#f0f0f0' },

  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B4332',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  diagnosisText: { fontSize: 16, color: '#333', lineHeight: 26 },

  bentoGrid: { gap: 12 },
  bentoRow: { flexDirection: 'row', gap: 12 },
  bentoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoCardFull: {
    flex: 0,
    alignItems: 'flex-start',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  bentoIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bentoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 4,
    textAlign: 'center',
  },
  bentoValue: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  colorGood: { color: '#2e7d32' },
  colorWarning: { color: '#ed6c02' },
  colorDanger: { color: '#d32f2f' },
  colorNeutral: { color: '#333333' },
  bentoContentRight: { flex: 1, justifyContent: 'center', marginLeft: 4 },
  bentoPestAlert: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  bentoPestText: { fontSize: 15, fontWeight: '700', color: '#d32f2f' },
  bentoPestTextGood: { fontSize: 15, fontWeight: '700', color: '#388e3c' },

  actionPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  actionItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  actionBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D8F3DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  actionBulletText: { color: '#1B4332', fontWeight: '800', fontSize: 14 },
  actionText: { flex: 1, fontSize: 16, color: '#333', lineHeight: 24 },
});
