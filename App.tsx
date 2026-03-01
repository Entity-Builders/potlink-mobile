import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { supabase } from '@eb-packages/logic';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthScreen } from './src/screens/AuthScreen';
import { PotsListScreen } from './src/screens/PotsListScreen';
import { ARPotRegistrationScreen } from './src/screens/ARPotRegistrationScreen';
import { PotDetailScreen } from './src/screens/PotDetailScreen';
import { PotEditScreen } from './src/screens/PotEditScreen';
import type { Pot } from '@eb-packages/garden';
import { NotificationService } from './src/services/NotificationService';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { analytics, initAnalytics } from './src/services/analyticsService';

import { CareSettingsScreen } from './src/screens/CareSettingsScreen';
import { CareCalendarScreen } from './src/screens/CareCalendarScreen';

// Initialize analytics as early as possible
initAnalytics();

type Screen =
  | 'list'
  | 'register'
  | 'detail'
  | 'edit'
  | 'care-settings'
  | 'calendar';

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
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        analytics.captureError(error, { screen: 'App', action: 'getSession' });
        if (error.message && error.message.includes('Invalid Refresh Token')) {
          supabase.auth.signOut();
          setSession(null);
          return;
        }
      }
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setNavigation({ screen: 'list' });

      // Identify user in PostHog on login, reset on logout
      if (session?.user?.id) {
        analytics.identify(session.user.id, { email: session.user.email });
      } else {
        analytics.reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    NotificationService.registerForPushNotificationsAsync()
      .then((token) => {
        if (token) console.log('Push token:', token);
      })
      .catch((err) => {
        analytics.captureError(err, { screen: 'App', action: 'registerPushNotifications' });
      });
  }, []);

  if (!session) {
    return (
      <ErrorBoundary>
        <View style={styles.container}>
          <AuthScreen
            onNavigateToList={() => setNavigation({ screen: 'list' })}
          />
          <StatusBar style='auto' />
        </View>
      </ErrorBoundary>
    );
  }

  const renderScreen = () => {
    switch (navigation.screen) {
      case 'list':
        return (
          <PotsListScreen
            session={session}
            onAddPot={() => setNavigation({ screen: 'register' })}
            onPotPress={(pot) => setNavigation({ screen: 'detail', pot })}
            onOpenCalendar={() => setNavigation({ screen: 'calendar' })}
            onLogout={() => setSession(null)}
          />
        );

      case 'register':
        return (
          <ARPotRegistrationScreen
            onSuccess={() => setNavigation({ screen: 'list' })}
            onCancel={() => setNavigation({ screen: 'list' })}
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
            onCareSettings={() =>
              setNavigation({ screen: 'care-settings', pot: navigation.pot })
            }
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

      case 'care-settings':
        return navigation.pot ? (
          <CareSettingsScreen
            pot={navigation.pot}
            onBack={() =>
              setNavigation({ screen: 'detail', pot: navigation.pot })
            }
          />
        ) : null;

      case 'calendar':
        return <CareCalendarScreen />;

      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <View style={styles.container}>
          {renderScreen()}
          <StatusBar style='auto' />
        </View>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
