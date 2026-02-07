import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from '@eb-packages/core';
import { getHealthStatus, Plant } from '@eb-packages/garden';
import { useEffect, useState } from 'react';

export default function App() {
  const [status, setStatus] = useState<string>('Checking sensors...');

  useEffect(() => {
    // Basic verification that Supabase client is initialized
    console.log('Supabase initialized:', !!supabase);

    // Basic verification of Garden logic
    const currentMoisture = 45;
    const threshold = 50;
    const health = getHealthStatus(currentMoisture, threshold);
    setStatus(`Moisture: ${currentMoisture}% - Status: ${health}`);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌱 PotLink Mobile</Text>
      <Text style={styles.subtitle}>Garden Domain Connected</Text>
      <View style={styles.card}>
        <Text>{status}</Text>
      </View>
      <StatusBar style='auto' />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2e7d32',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
