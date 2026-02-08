import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { supabase } from '@eb-packages/core';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthScreen } from './src/screens/AuthScreen';
import { PotsListScreen } from './src/screens/PotsListScreen';
import { PotRegistrationScreen } from './src/screens/PotRegistrationScreen';
import { PotDetailScreen } from './src/screens/PotDetailScreen';
import { PotEditScreen } from './src/screens/PotEditScreen';
import type { Pot } from '@eb-packages/garden';

type Screen = 'list' | 'register' | 'detail' | 'edit';

interface NavigationState {
  screen: Screen;
  pot?: Pot;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [navigation, setNavigation] = useState<NavigationState>({
    screen: 'list',
  });

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
      setNavigation({ screen: 'list' });
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

  const renderScreen = () => {
    switch (navigation.screen) {
      case 'list':
        return (
          <PotsListScreen
            onAddPot={() => setNavigation({ screen: 'register' })}
            onPotPress={(pot) => setNavigation({ screen: 'detail', pot })}
          />
        );

      case 'register':
        return (
          <PotRegistrationScreen
            onSuccess={() => setNavigation({ screen: 'list' })}
          />
        );

      case 'detail':
        return navigation.pot ? (
          <PotDetailScreen
            pot={navigation.pot}
            onBack={() => setNavigation({ screen: 'list' })}
            onEdit={() =>
              setNavigation({ screen: 'edit', pot: navigation.pot })
            }
            onDeleted={() => setNavigation({ screen: 'list' })}
          />
        ) : null;

      case 'edit':
        return navigation.pot ? (
          <PotEditScreen
            pot={navigation.pot}
            onBack={() =>
              setNavigation({ screen: 'detail', pot: navigation.pot })
            }
            onSaved={(updatedPot) =>
              setNavigation({ screen: 'detail', pot: updatedPot })
            }
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {renderScreen()}
        <StatusBar style='auto' />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
