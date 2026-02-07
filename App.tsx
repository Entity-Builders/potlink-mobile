import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from '@eb-packages/core';
import { useEffect, useState } from 'react';
import { AuthScreen } from './src/screens/AuthScreen';
import { PotsListScreen } from './src/screens/PotsListScreen';
import { PotRegistrationScreen } from './src/screens/PotRegistrationScreen';

type Screen = 'list' | 'register';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('list');

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Reset to list screen when logging in/out
      setCurrentScreen('list');
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <View style={styles.container}>
        <AuthScreen />
        <StatusBar style='auto' />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentScreen === 'list' ? (
        <PotsListScreen onAddPot={() => setCurrentScreen('register')} />
      ) : (
        <PotRegistrationScreen onSuccess={() => setCurrentScreen('list')} />
      )}
      <StatusBar style='auto' />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
