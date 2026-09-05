import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CareSchedule, SpeciesCareGuide } from '@entity-builders/garden';

interface PlantAdvisorProps {
  species: string;
  registeredAt: Date;
  schedules: CareSchedule[];
  careGuide: SpeciesCareGuide | null;
  weatherCondition?: string;
  temperature?: number;
  humidity?: number;
  latitude?: number;
  locationType?: 'indoor' | 'outdoor';
}

interface QA {
  question: string;
  answer: string;
  icon: string;
  color: string;
}

// ── Helpers ──────────────────────────────────────────────

const getSeason = (latitude?: number): string => {
  const month = new Date().getMonth(); // 0-11
  const isSouthern = latitude !== undefined ? latitude < 0 : true; // default south

  if (isSouthern) {
    if (month >= 2 && month <= 4) return 'otoño';
    if (month >= 5 && month <= 7) return 'invierno';
    if (month >= 8 && month <= 10) return 'primavera';
    return 'verano';
  } else {
    if (month >= 2 && month <= 4) return 'primavera';
    if (month >= 5 && month <= 7) return 'verano';
    if (month >= 8 && month <= 10) return 'otoño';
    return 'invierno';
  }
};

const getDaysUntil = (date: Date | null): number | null => {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
};

// ── Answer generators ────────────────────────────────────

const getWateringAnswer = (
  watering: CareSchedule | undefined,
  weatherCondition?: string,
  temperature?: number,
): QA => {
  const days = getDaysUntil(watering?.next_care_date ?? null);
  const condition = weatherCondition?.toLowerCase() || '';
  const isRainy =
    condition.includes('rain') ||
    condition.includes('drizzle') ||
    condition.includes('thunderstorm');

  let answer: string;

  if (!watering) {
    answer =
      'Todavía no configuraste un horario de riego. ¡Configuralo para recibir recordatorios!';
  } else if (days !== null && days < 0) {
    const overdue = Math.abs(days);
    answer = `¡Sí! Tenés ${overdue} día${overdue > 1 ? 's' : ''} de atraso. Regá cuanto antes.`;
    if (isRainy) {
      answer += ' Aunque hay lluvia, revisá que haya llegado bien a la tierra.';
    }
  } else if (days === 0) {
    if (isRainy) {
      answer =
        'Hoy tocaba regar, pero está lloviendo. Podés saltártelo si la tierra ya se mojó bien.';
    } else if (temperature !== undefined && temperature >= 32) {
      answer = `¡Sí, hoy toca! Y con ${temperature}°C, mejor regá temprano a la mañana o al atardecer para que no se evapore.`;
    } else {
      answer =
        '¡Sí, hoy toca regar! Revisá que la tierra esté húmeda hasta abajo.';
    }
  } else if (days === 1) {
    answer = 'Mañana toca regar. Hoy podés tranquilamente no hacer nada.';
  } else if (days !== null && days <= 3) {
    answer = `No, todavía falta${days === 1 ? '' : 'n'} ${days} día${days === 1 ? '' : 's'}. La planta está bien por ahora.`;
    if (isRainy) {
      answer += ' Y como hay lluvia, podría estirarse un día más.';
    }
  } else if (days !== null) {
    answer = `No, recién en ${days} días. Está bien de agua.`;
  } else {
    answer = 'No hay fecha programada. Configurá el horario de riego.';
  }

  return {
    question: '¿Hoy riego?',
    answer,
    icon: '💧',
    color: '#1565c0',
  };
};

const getCareAlertAnswer = (
  weatherCondition?: string,
  temperature?: number,
  humidity?: number,
  season?: string,
  locationType?: 'indoor' | 'outdoor',
): QA => {
  const condition = weatherCondition?.toLowerCase() || '';
  const alerts: string[] = [];

  // Temperature alerts
  if (temperature !== undefined) {
    if (temperature <= 5) {
      alerts.push(
        `Hace ${temperature}°C, cuidado con las heladas. Si podés, entrá la planta o cubrila con una tela.`,
      );
    } else if (temperature <= 10) {
      alerts.push(
        `La temperatura está baja (${temperature}°C). Las plantas tropicales pueden sufrir.`,
      );
    } else if (temperature >= 35) {
      alerts.push(
        `Calor extremo (${temperature}°C). Buscá sombra para tu planta y regá más seguido.`,
      );
    }
  }

  // Weather alerts
  if (condition.includes('thunderstorm')) {
    alerts.push('Se vienen tormentas. Protegé la planta del viento fuerte.');
  }
  if (condition.includes('snow')) {
    alerts.push('¡Nieve! Llevá la planta adentro urgente.');
  }

  // Humidity
  if (humidity !== undefined && humidity >= 85) {
    alerts.push(
      'Humedad muy alta, ojo con los hongos. Asegurá buena ventilación.',
    );
  }

  // Indoor-specific advice
  if (locationType === 'indoor') {
    if (season === 'invierno') {
      alerts.push(
        'Al estar adentro, asegurate de que reciba suficiente luz natural.',
      );
    }
    if (humidity !== undefined && humidity < 30) {
      alerts.push(
        'El aire interior puede estar muy seco. Considerá rociar las hojas.',
      );
    }
  }

  // Outdoor-specific advice
  if (locationType === 'outdoor') {
    if (temperature !== undefined && temperature <= 10) {
      alerts.push(
        'Está afuera y hace frío. Considerá moverla adentro o cubrirla.',
      );
    }
  }

  // Season context
  if (season === 'invierno' && alerts.length === 0) {
    alerts.push(
      'Estamos en invierno. Regá menos y no fertilices hasta primavera.',
    );
  }

  const answer =
    alerts.length > 0
      ? alerts.join(' ')
      : 'Todo tranquilo. No hay alertas por ahora. Tu planta está en buenas condiciones. 👍';

  return {
    question: '¿Algún cuidado especial?',
    answer,
    icon: '⚠️',
    color: alerts.length > 0 ? '#e65100' : '#2e7d32',
  };
};

const getFertilizingAnswer = (
  fertilizing: CareSchedule | undefined,
  season: string,
  species: string,
): QA => {
  const days = getDaysUntil(fertilizing?.next_care_date ?? null);

  let answer: string;

  if (!fertilizing) {
    answer =
      'No tenés fertilización configurada. En general, fertilizar una vez al mes en primavera/verano es un buen punto de partida.';
  } else if (days !== null && days < 0) {
    answer = `¡Atrasado ${Math.abs(days)} día${Math.abs(days) > 1 ? 's' : ''}! Fertilizá pronto.`;
  } else if (days === 0) {
    answer = '¡Hoy toca fertilizar! Usá la dosis recomendada, nunca de más.';
  } else if (days !== null) {
    answer = `En ${days} día${days > 1 ? 's' : ''}.`;
    if (season === 'otoño') {
      answer += ` Es otoño, así que podría ser la última dosis fuerte antes del reposo invernal.`;
    } else if (season === 'invierno') {
      answer +=
        ' En invierno muchas plantas no necesitan fertilizante. Podés saltártelo.';
    }
  } else {
    answer = 'No hay fecha programada para fertilizar.';
  }

  return {
    question: '¿En cuánto fertilizo?',
    answer,
    icon: '🧪',
    color: '#7c4dff',
  };
};

const getSeasonAnswer = (
  season: string,
  species: string,
  careGuide: SpeciesCareGuide | null,
): QA => {
  const seasonEmoji: Record<string, string> = {
    verano: '☀️',
    otoño: '🍂',
    invierno: '❄️',
    primavera: '🌸',
  };

  let answer: string;

  switch (season) {
    case 'primavera':
      answer = `¡Es primavera! Época de crecimiento. Tu ${species} debería estar sacando hojas nuevas. Buen momento para fertilizar y aumentar el riego.`;
      break;
    case 'verano':
      answer = `Es verano, máximo crecimiento. Regá más seguido y cuidá del sol directo en las horas pico.`;
      if (careGuide?.climate?.toLowerCase().includes('tropical')) {
        answer += ` Como tu ${species} es tropical, le encanta esta época.`;
      }
      break;
    case 'otoño':
      answer = `Es otoño. Tu ${species} va a frenar el crecimiento, es normal. Reducí el riego y prepará la última fertilización fuerte.`;
      break;
    case 'invierno':
      answer = `Es invierno. Tu ${species} está en reposo. Regá poco, no fertilices, y protegela del frío si es sensible.`;
      break;
    default:
      answer = 'No pude determinar la estación.';
  }

  return {
    question: '¿Es buena época?',
    answer,
    icon: seasonEmoji[season] || '🌤️',
    color: '#00897b',
  };
};

// ── Component ────────────────────────────────────────────

export const PlantAdvisor = ({
  species,
  registeredAt,
  schedules,
  careGuide,
  weatherCondition,
  temperature,
  humidity,
  latitude,
  locationType,
}: PlantAdvisorProps) => {
  const season = getSeason(latitude);
  const watering = schedules.find((s) => s.care_type === 'watering');
  const fertilizing = schedules.find((s) => s.care_type === 'fertilizing');

  const qaItems: QA[] = [
    getWateringAnswer(watering, weatherCondition, temperature),
    getCareAlertAnswer(
      weatherCondition,
      temperature,
      humidity,
      season,
      locationType,
    ),
    getFertilizingAnswer(fertilizing, season, species),
    getSeasonAnswer(season, species, careGuide),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerIcon}>🪴</Text>
        <Text style={styles.headerTitle}>Tu planta te dice...</Text>
      </View>

      {qaItems.map((qa, index) => (
        <View key={index} style={styles.qaCard}>
          <View style={styles.questionRow}>
            <Text style={styles.qaIcon}>{qa.icon}</Text>
            <Text style={[styles.question, { color: qa.color }]}>
              {qa.question}
            </Text>
          </View>
          <Text style={styles.answer}>{qa.answer}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1b5e20',
  },
  qaCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  qaIcon: {
    fontSize: 18,
  },
  question: {
    fontSize: 15,
    fontWeight: '800',
  },
  answer: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
    lineHeight: 21,
    paddingLeft: 26,
  },
});
