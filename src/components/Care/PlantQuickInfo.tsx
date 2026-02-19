import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CareSchedule, SpeciesCareGuide } from '@eb-packages/garden';

interface PlantQuickInfoProps {
  registeredAt: Date;
  schedules: CareSchedule[];
  careGuide: SpeciesCareGuide | null;
}

const getDaysUntil = (date: Date | null): number | null => {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getPlantAgeDays = (registeredAt: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reg = new Date(registeredAt);
  reg.setHours(0, 0, 0, 0);
  const diff = today.getTime() - reg.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const getDaysUntilLabel = (days: number | null): string => {
  if (days === null) return 'Sin fecha';
  if (days < 0) return `¡${Math.abs(days)}d atrasado!`;
  if (days === 0) return '¡Hoy!';
  if (days === 1) return 'Mañana';
  return `${days} días`;
};

const getDaysUntilEmoji = (days: number | null): string => {
  if (days === null) return '⏳';
  if (days < 0) return '🚨';
  if (days === 0) return '💧';
  if (days === 1) return '⏰';
  return '✅';
};

export const PlantQuickInfo = ({
  registeredAt,
  schedules,
  careGuide,
}: PlantQuickInfoProps) => {
  const wateringSchedule = schedules.find((s) => s.care_type === 'watering');
  const fertilizingSchedule = schedules.find(
    (s) => s.care_type === 'fertilizing',
  );

  const wateringDaysUntil = getDaysUntil(
    wateringSchedule?.next_care_date ?? null,
  );
  const fertilizingDaysUntil = getDaysUntil(
    fertilizingSchedule?.next_care_date ?? null,
  );

  const plantAge = getPlantAgeDays(registeredAt);

  // Determine urgency color for watering card
  const getWateringCardStyle = () => {
    if (wateringDaysUntil === null) return styles.cardDefault;
    if (wateringDaysUntil < 0) return styles.cardOverdue;
    if (wateringDaysUntil === 0) return styles.cardToday;
    if (wateringDaysUntil === 1) return styles.cardSoon;
    return styles.cardGood;
  };

  const getWateringTextStyle = () => {
    if (wateringDaysUntil === null) return styles.cardValueDefault;
    if (wateringDaysUntil < 0) return styles.cardValueOverdue;
    if (wateringDaysUntil === 0) return styles.cardValueToday;
    if (wateringDaysUntil === 1) return styles.cardValueSoon;
    return styles.cardValueGood;
  };

  return (
    <View style={styles.container}>
      {/* Badges Row */}
      <View style={styles.badgeRow}>
        <View style={styles.ageBadge}>
          <Text style={styles.badgeText}>
            🌱 {plantAge === 0 ? 'Registrada hoy' : `${plantAge} días contigo`}
          </Text>
        </View>
        {careGuide?.care_level && (
          <View style={styles.careBadge}>
            <Text style={styles.careBadgeText}>⭐ {careGuide.care_level}</Text>
          </View>
        )}
      </View>

      {/* Main Watering Cards */}
      <View style={styles.cardsRow}>
        {/* Watering Frequency */}
        <View style={[styles.card, styles.cardWatering]}>
          <Text style={styles.cardIconLarge}>💧</Text>
          <Text style={styles.cardLabelWatering}>Riego</Text>
          {wateringSchedule ? (
            <Text style={styles.cardValueWatering}>
              cada {wateringSchedule.frequency_days} días
            </Text>
          ) : (
            <Text style={styles.cardValueMuted}>Sin configurar</Text>
          )}
        </View>

        {/* Days Until Next Watering */}
        <View style={[styles.card, getWateringCardStyle()]}>
          <Text style={styles.cardIconLarge}>
            {getDaysUntilEmoji(wateringDaysUntil)}
          </Text>
          <Text style={styles.cardLabelNext}>Próximo riego</Text>
          <Text style={[styles.cardValueNext, getWateringTextStyle()]}>
            {wateringSchedule
              ? getDaysUntilLabel(wateringDaysUntil)
              : 'Sin configurar'}
          </Text>
        </View>
      </View>

      {/* Info Pills */}
      <View style={styles.pillsContainer}>
        {fertilizingSchedule && (
          <View style={styles.pill}>
            <View style={[styles.pillDot, { backgroundColor: '#7c4dff' }]} />
            <Text style={styles.pillText}>
              🧪 Fertilizar cada {fertilizingSchedule.frequency_days}d
              {fertilizingDaysUntil !== null && (
                <Text style={styles.pillHighlight}>
                  {' · '}
                  {getDaysUntilLabel(fertilizingDaysUntil)}
                </Text>
              )}
            </Text>
          </View>
        )}

        {careGuide?.light_requirements && (
          <View style={styles.pill}>
            <View style={[styles.pillDot, { backgroundColor: '#ffab00' }]} />
            <Text style={styles.pillText}>
              ☀️ {careGuide.light_requirements}
            </Text>
          </View>
        )}

        {careGuide?.climate && (
          <View style={styles.pill}>
            <View style={[styles.pillDot, { backgroundColor: '#ff6d00' }]} />
            <Text style={styles.pillText}>🌡️ {careGuide.climate}</Text>
          </View>
        )}

        {careGuide?.companions && (
          <View style={styles.pill}>
            <View style={[styles.pillDot, { backgroundColor: '#00c853' }]} />
            <Text style={styles.pillText}>🤝 {careGuide.companions}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  // Badges
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  ageBadge: {
    backgroundColor: '#1b5e20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  careBadge: {
    backgroundColor: '#ff8f00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  careBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  // Main Cards
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  card: {
    flex: 1,
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  cardIconLarge: {
    fontSize: 32,
    marginBottom: 8,
  },

  // Watering frequency card
  cardWatering: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1.5,
    borderColor: '#90caf9',
  },
  cardLabelWatering: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1565c0',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardValueWatering: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0d47a1',
    textAlign: 'center',
  },

  // Next watering card states
  cardDefault: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  cardGood: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1.5,
    borderColor: '#81c784',
  },
  cardSoon: {
    backgroundColor: '#fff8e1',
    borderWidth: 1.5,
    borderColor: '#ffd54f',
  },
  cardToday: {
    backgroundColor: '#fff3e0',
    borderWidth: 1.5,
    borderColor: '#ffb74d',
  },
  cardOverdue: {
    backgroundColor: '#fce4ec',
    borderWidth: 1.5,
    borderColor: '#ef9a9a',
  },

  cardLabelNext: {
    fontSize: 11,
    fontWeight: '800',
    color: '#555',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardValueNext: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardValueDefault: { color: '#888' },
  cardValueGood: { color: '#2e7d32' },
  cardValueSoon: { color: '#f9a825' },
  cardValueToday: { color: '#e65100' },
  cardValueOverdue: { color: '#c62828' },

  cardValueMuted: {
    fontSize: 14,
    fontWeight: '600',
    color: '#aaa',
    textAlign: 'center',
  },

  // Info Pills
  pillsContainer: {
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 10,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    lineHeight: 20,
  },
  pillHighlight: {
    fontWeight: '700',
    color: '#7c4dff',
  },
});
