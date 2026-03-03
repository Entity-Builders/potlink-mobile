import * as Updates from 'expo-updates';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { supabase } from '@eb-packages/logic';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PostHogProvider, PostHogErrorBoundary } from 'posthog-react-native';
import { AuthScreen } from './src/screens/AuthScreen';
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
import { AppNavigator } from './src/navigation/AppNavigator';
import type { HomeNavAction } from './src/navigation/AppNavigator';

initAnalytics();

type ModalScreen = 'none' | 'detail' | 'edit' | 'care-settings';
interface ModalState {
  screen: ModalScreen;
  pot?: Pot;
}

// ── Error Boundary Fallback ──────────────────────────────────────────────────
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

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [modal, setModal] = useState<ModalState>({ screen: 'none' });

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        analytics.captureError(error, { screen: 'App', action: 'getSession' });
        if (error.message?.includes('Invalid Refresh Token')) {
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
      setModal({ screen: 'none' });
      if (session?.user?.id) {
        analytics.identify(session.user.id, { email: session.user.email });
      } else {
        analytics.reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // OTA updates
  useEffect(() => {
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

  // Push notifications
  useEffect(() => {
    NotificationService.registerForPushNotificationsAsync()
      .then((token) => {
        if (token) console.log('Push token:', token);
      })
      .catch((err) =>
        analytics.captureError(err, {
          screen: 'App',
          action: 'registerPushNotifications',
        }),
      );
  }, []);

  // Navigate to detail/edit/care-settings from within navigator
  const handleNavAction = (action: HomeNavAction) => {
    if (action.type === 'OPEN_DETAIL')
      setModal({ screen: 'detail', pot: action.pot });
    if (action.type === 'OPEN_EDIT')
      setModal({ screen: 'edit', pot: action.pot });
    if (action.type === 'OPEN_CARE_SETTINGS')
      setModal({ screen: 'care-settings', pot: action.pot });
  };

  const renderModal = () => {
    switch (modal.screen) {
      case 'detail':
        return modal.pot ? (
          <PotDetailScreen
            pot={modal.pot}
            onBack={() => setModal({ screen: 'none' })}
            onEdit={() => setModal({ screen: 'edit', pot: modal.pot })}
            onDeleted={() => setModal({ screen: 'none' })}
            onCareSettings={() =>
              setModal({ screen: 'care-settings', pot: modal.pot })
            }
          />
        ) : null;

      case 'edit':
        return modal.pot ? (
          <PotEditScreen
            pot={modal.pot}
            onBack={() => setModal({ screen: 'detail', pot: modal.pot })}
            onSaved={(updatedPot) =>
              setModal({ screen: 'detail', pot: updatedPot })
            }
          />
        ) : null;

      case 'care-settings':
        return modal.pot ? (
          <CareSettingsScreen
            pot={modal.pot}
            onBack={() => setModal({ screen: 'detail', pot: modal.pot })}
          />
        ) : null;

      default:
        return null;
    }
  };

  if (!session) {
    return (
      <View style={styles.container}>
        <AuthScreen onNavigateToList={() => {}} />
        <StatusBar style='light' />
      </View>
    );
  }

  return (
    <PostHogProvider client={getPostHogClient()}>
      <PostHogErrorBoundary fallback={ErrorFallback}>
        <SafeAreaProvider>
          <View style={styles.container}>
            {modal.screen !== 'none' ? (
              renderModal()
            ) : (
              <AppNavigator
                session={session}
                onLogout={() => setSession(null)}
                onNavigateTo={handleNavAction}
              />
            )}
            <StatusBar style='light' />
          </View>
        </SafeAreaProvider>
      </PostHogErrorBoundary>
    </PostHogProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B4332',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#1B4332',
  },
  errorEmoji: { fontSize: 48, marginBottom: 16 },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorDev: {
    fontSize: 11,
    color: '#ffb3b3',
    fontFamily: 'monospace',
    textAlign: 'center',
    padding: 8,
    backgroundColor: 'rgba(255,0,0,0.1)',
    borderRadius: 4,
  },
});
