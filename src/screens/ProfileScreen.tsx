import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@eb-packages/logic';
import { analytics } from '../services/analyticsService';
import { useScreenLogger } from '../hooks/useScreenLogger';

interface ProfileScreenProps {
  session: Session;
  onBack: () => void;
  onLogout: () => void;
}

export const ProfileScreen = ({
  session,
  onBack,
  onLogout,
}: ProfileScreenProps) => {
  useScreenLogger('ProfileScreen');
  const insets = useSafeAreaInsets();

  const userName =
    session.user?.user_metadata?.name ||
    session.user?.email?.split('@')[0] ||
    'Jardinero';
  const userEmail = session.user?.email;

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            analytics.track('User Logged Out');
            await supabase.auth.signOut();
            onLogout();
          } catch (error) {
            console.error('Logout error:', error);
          }
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.headerButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <View style={styles.headerButtonPad} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar & User Info */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeIcon}>🪴</Text>
              </View>
            </View>
            <Text style={styles.userName}>{userName}</Text>
            {userEmail && <Text style={styles.userEmail}>{userEmail}</Text>}
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ajustes</Text>

            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardIconWrap}>
                  <Text style={styles.cardIconText}>🔔</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardRowTitle}>Notificaciones</Text>
                  <Text style={styles.cardRowSubtitle}>
                    Alertas de riego y cuidados
                  </Text>
                </View>
                <Text style={styles.cardChevron}>→</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardRow}>
                <View style={styles.cardIconWrap}>
                  <Text style={styles.cardIconText}>🛡️</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardRowTitle}>Privacidad</Text>
                  <Text style={styles.cardRowSubtitle}>Gestión de datos</Text>
                </View>
                <Text style={styles.cardChevron}>→</Text>
              </View>
            </View>
          </View>

          {/* App Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acerca de</Text>

            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardRowTitle}>Versión de la App</Text>
                  <Text style={styles.cardRowSubtitle}>Potlink 1.0.0</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>Made with 💚 by Entity Builders</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerButtonPad: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 10,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 36,
    color: '#FFF',
    fontWeight: '800',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D8F3DC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1B4332',
  },
  avatarBadgeIcon: {
    fontSize: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardIconText: {
    fontSize: 18,
  },
  cardContent: {
    flex: 1,
  },
  cardRowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  cardRowSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  cardChevron: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 72,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontWeight: '500',
  },
});
