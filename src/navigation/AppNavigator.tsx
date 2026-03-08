import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import type { Session } from '@supabase/supabase-js';
import type { Pot, PotDiagnosisLog } from '@eb-packages/garden';

// Screens
import { PotsListScreen } from '../screens/PotsListScreen';
import { ARPotRegistrationScreen } from '../screens/ARPotRegistrationScreen';
import { analytics } from '../services/analyticsService';

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = 'home' | 'add' | 'plants';

export type HomeNavAction =
  | { type: 'OPEN_DETAIL'; pot: Pot }
  | { type: 'OPEN_EDIT'; pot: Pot }
  | { type: 'OPEN_CARE_SETTINGS'; pot: Pot }
  | { type: 'OPEN_DIAGNOSIS_DETAIL'; pot: Pot; log: PotDiagnosisLog };

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
  isFab?: boolean;
}

const TABS: TabConfig[] = [
  { id: 'home', label: 'Inicio', icon: '🏠' },
  { id: 'add', label: 'Agregar', icon: '➕', isFab: true },
  { id: 'plants', label: 'Mis plantas', icon: '🌱' },
];

// ── Tab Bar ───────────────────────────────────────────────────────────────────

function TabBar({
  activeTab,
  onTabPress,
}: {
  activeTab: TabId;
  onTabPress: (id: TabId) => void;
}) {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          if (tab.isFab) {
            return (
              <View key={tab.id} style={styles.fabContainer}>
                <TouchableOpacity
                  style={styles.fabButton}
                  onPress={() => {
                    analytics.track('tab_pressed', { tab: tab.id });
                    onTabPress(tab.id);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.fabText}>+</Text>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => {
                analytics.track('tab_pressed', { tab: tab.id });
                onTabPress(tab.id);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                {tab.icon}
              </Text>
              <Text
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Navigator ─────────────────────────────────────────────────────────────────

interface AppNavigatorProps {
  session: Session;
  onLogout: () => void;
  onNavigateTo: (action: HomeNavAction) => void;
}

export function AppNavigator({
  session,
  onLogout,
  onNavigateTo,
}: AppNavigatorProps) {
  const [activeTab, setActiveTab] = useState<TabId>('home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <PotsListScreen
            session={session}
            onPotPress={(pot) => onNavigateTo({ type: 'OPEN_DETAIL', pot })}
            onLogout={onLogout}
            onCameraPress={() =>
              Alert.alert(
                'Diagnóstico Médico',
                'Elegí una planta de tu agenda verde abajo, y tocá "Consultar al Doctor" para sacar la foto 🚑.',
              )
            }
          />
        );
      case 'add':
        return (
          <ARPotRegistrationScreen
            onSuccess={() => setActiveTab('home')}
            onCancel={() => setActiveTab('home')}
          />
        );
      case 'plants':
        return (
          <PotsListScreen
            session={session}
            onPotPress={(pot) => onNavigateTo({ type: 'OPEN_DETAIL', pot })}
            onLogout={onLogout}
            collectionMode
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>{renderScreen()}</View>
      <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 100 : 90, // Ensure content isn't hidden behind the floating tab bar
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 24,
    left: 20,
    right: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.4,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#1B4332',
    fontWeight: '700',
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    height: 48,
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#316E50',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -28,
    shadowColor: '#316E50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: {
    fontSize: 36,
    color: '#1B4332',
    fontWeight: '400',
    marginTop: -4,
  },
});
