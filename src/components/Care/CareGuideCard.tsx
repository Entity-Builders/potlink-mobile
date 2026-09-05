import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SpeciesCareGuide } from '@entity-builders/garden';

interface CareGuideCardProps {
  guide: SpeciesCareGuide;
}

export const CareGuideCard = ({ guide }: CareGuideCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.speciesName}>{guide.species_name}</Text>
        {guide.variety && <Text style={styles.variety}>{guide.variety}</Text>}
      </View>

      <View style={styles.tagsContainer}>
        {guide.care_level && (
          <View style={[styles.tag, styles.careLevelTag]}>
            <Text style={[styles.tagText, styles.careLevelText]}>
              {guide.care_level} Care
            </Text>
          </View>
        )}
      </View>

      <View style={styles.grid}>
        <InfoItem icon='💧' label='Watering' value={guide.watering_frequency} />
        <InfoItem icon='☀️' label='Climate' value={guide.climate} />
        <InfoItem
          icon='🌤️'
          label='Sun Exposure'
          value={guide.light_requirements}
        />
        <InfoItem
          icon='🧪'
          label='Fertilizer'
          value={guide.fertilizer_frequency}
        />
        <InfoItem icon='✂️' label='Pruning' value={guide.pruning_info} />
      </View>

      {guide.companions && (
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>Good Companions:</Text>
          <Text style={styles.footerText}>{guide.companions}</Text>
        </View>
      )}
    </View>
  );
};

const InfoItem = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value?: string;
}) => {
  if (!value) return null;
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginVertical: 8,
  },
  header: {
    marginBottom: 12,
  },
  speciesName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  variety: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  careLevelTag: {
    backgroundColor: '#e8f5e9',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  careLevelText: {
    color: '#2e7d32',
  },
  grid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 10,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 1,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    lineHeight: 20,
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
