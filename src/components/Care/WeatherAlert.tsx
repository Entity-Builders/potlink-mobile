import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WeatherAlertProps {
  weatherCondition?: string;
  weatherDescription?: string;
  temperature?: number;
  humidity?: number;
}

interface AlertInfo {
  icon: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
}

const getWeatherAlerts = ({
  weatherCondition,
  temperature,
  humidity,
}: WeatherAlertProps): AlertInfo[] => {
  const alerts: AlertInfo[] = [];
  const condition = weatherCondition?.toLowerCase() || '';

  if (
    condition.includes('rain') ||
    condition.includes('drizzle') ||
    condition.includes('thunderstorm')
  ) {
    alerts.push({
      icon: '🌧️',
      message: 'Lluvia detectada — podrías saltarte el riego',
      severity: 'info',
    });
  }

  if (temperature !== undefined && temperature >= 35) {
    alerts.push({
      icon: '🔥',
      message: `Calor extremo (${temperature}°C) — regá más seguido y dá sombra`,
      severity: 'danger',
    });
  } else if (temperature !== undefined && temperature >= 30) {
    alerts.push({
      icon: '☀️',
      message: `Día caluroso (${temperature}°C) — revisá que la tierra no esté seca`,
      severity: 'warning',
    });
  }

  if (temperature !== undefined && temperature <= 3) {
    alerts.push({
      icon: '🥶',
      message: `Riesgo de helada (${temperature}°C) — protegé tu planta`,
      severity: 'danger',
    });
  } else if (temperature !== undefined && temperature <= 8) {
    alerts.push({
      icon: '❄️',
      message: `Temperatura baja (${temperature}°C) — cuidado con plantas sensibles`,
      severity: 'warning',
    });
  }

  if (humidity !== undefined && humidity >= 85) {
    alerts.push({
      icon: '💦',
      message: `Humedad alta (${humidity}%) — ojo con hongos`,
      severity: 'warning',
    });
  }

  if (condition.includes('snow')) {
    alerts.push({
      icon: '🌨️',
      message: 'Nieve — llevá la planta adentro',
      severity: 'danger',
    });
  }

  return alerts;
};

const severityConfig = {
  info: {
    bg: '#e3f2fd',
    border: '#64b5f6',
    text: '#1565c0',
    dot: '#1e88e5',
  },
  warning: {
    bg: '#fff8e1',
    border: '#ffd54f',
    text: '#e65100',
    dot: '#ff8f00',
  },
  danger: {
    bg: '#fce4ec',
    border: '#ef9a9a',
    text: '#c62828',
    dot: '#e53935',
  },
};

const getWeatherEmoji = (condition?: string): string => {
  if (!condition) return '🌤️';
  const c = condition.toLowerCase();
  if (c.includes('clear')) return '☀️';
  if (c.includes('cloud')) return '☁️';
  if (c.includes('rain') || c.includes('drizzle')) return '🌧️';
  if (c.includes('thunder')) return '⛈️';
  if (c.includes('snow')) return '🌨️';
  if (c.includes('mist') || c.includes('fog') || c.includes('haze'))
    return '🌫️';
  return '🌤️';
};

export const WeatherAlert = (props: WeatherAlertProps) => {
  const { weatherCondition, weatherDescription, temperature, humidity } = props;

  if (!weatherCondition && temperature === undefined) return null;

  const alerts = getWeatherAlerts(props);

  return (
    <View style={styles.container}>
      {/* Current Weather */}
      <View style={styles.weatherCard}>
        <Text style={styles.weatherEmoji}>
          {getWeatherEmoji(weatherCondition)}
        </Text>
        <View style={styles.weatherInfo}>
          <Text style={styles.weatherLabel}>Clima ahora</Text>
          <Text style={styles.weatherValue}>
            {weatherDescription || weatherCondition || 'Desconocido'}
          </Text>
        </View>
        <View style={styles.weatherStats}>
          {temperature !== undefined && (
            <View style={styles.weatherStat}>
              <Text style={styles.statValue}>{temperature}°</Text>
              <Text style={styles.statLabel}>Temp</Text>
            </View>
          )}
          {humidity !== undefined && (
            <View style={styles.weatherStat}>
              <Text style={styles.statValue}>{humidity}%</Text>
              <Text style={styles.statLabel}>Hum</Text>
            </View>
          )}
        </View>
      </View>

      {/* Alerts */}
      {alerts.map((alert, index) => {
        const config = severityConfig[alert.severity];
        return (
          <View
            key={index}
            style={[
              styles.alertCard,
              {
                backgroundColor: config.bg,
                borderLeftColor: config.dot,
              },
            ]}
          >
            <Text style={styles.alertIcon}>{alert.icon}</Text>
            <Text style={[styles.alertText, { color: config.text }]}>
              {alert.message}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#d0daf8',
    gap: 12,
  },
  weatherEmoji: {
    fontSize: 30,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7986cb',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  weatherValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a237e',
    textTransform: 'capitalize',
  },
  weatherStats: {
    flexDirection: 'row',
    gap: 12,
  },
  weatherStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#283593',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7986cb',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderLeftWidth: 4,
    gap: 10,
  },
  alertIcon: {
    fontSize: 20,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
