import * as Updates from 'expo-updates';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { supabase } from '@eb-packages/logic';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PostHogProvider, PostHogErrorBoundary } from 'posthog-react-native';
import { AuthScreen } from './src/screens/AuthScreen';
import { PotsListScreen } from './src/screens/PotsListScreen';
import { ARPotRegistrationScreen } from './src/screens/ARPotRegistrationScreen';
import { PotDetailScreen } from './src/screens/PotDetailScreen';
import { PotEditScreen } from './src/screens/PotEditScreen';
import type { Pot } from '@eb-packages/garden';
import { NotificationService } from './src/services/NotificationService';
import {
  analytics,
  initAnalytics,
  getPostHogClient,
} from './src/services/analyticsService';

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

// ── Error Boundary Fallback UI ──────────────────────────────────────────────
const ErrorFallback = ({
  error,
}: {
  error: Error | unknown;
  componentStack?: string;
}) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorEmoji}>🌿</Text>
    <Text style={styles.errorTitle}>Algo salió mal</Text>
    <Text style={styles.errorMessage}>
      El error fue registrado. Reiniciá la app para continuar.
    </Text>
    {__DEV__ && (
      <Text style={styles.errorDev}>
        {error instanceof Error ? error.message : String(error)}
      </Text>
    )}
  </View>
);

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
    // Check for OTA updates on launch (production only)
    if (!__DEV__) {
      Updates.checkForUpdateAsync()
        .then(({ isAvailable }) => {
          if (isAvailable) {
            Updates.fetchUpdateAsync().then(() => Updates.reloadAsync());
          }
        })
        .catch((err) =>
          analytics.captureError(err, {
            screen: 'App',
            action: 'checkForUpdate',
          }),
        );
    }
  }, []);

  useEffect(() => {
    NotificationService.registerForPushNotificationsAsync()
      .then((token) => {
        if (token) console.log('Push token:', token);
      })
      .catch((err) => {
        analytics.captureError(err, {
          screen: 'App',
          action: 'registerPushNotifications',
        });
      });
  }, []);

  if (!session) {
    return (
      <View style={styles.container}>
        <AuthScreen
          onNavigateToList={() => setNavigation({ screen: 'list' })}
        />
        <StatusBar style='auto' />
      </View>
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
    <PostHogProvider client={getPostHogClient()}>
      <PostHogErrorBoundary fallback={ErrorFallback}>
        <SafeAreaProvider>
          <View style={styles.container}>
            {renderScreen()}
            <StatusBar style='auto' />
          </View>
        </SafeAreaProvider>
      </PostHogErrorBoundary>
    </PostHogProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f5f5f5',
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorDev: {
    fontSize: 11,
    color: '#c00',
    fontFamily: 'monospace',
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#fff0f0',
    borderRadius: 4,
  },
});
