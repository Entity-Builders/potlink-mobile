import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import type { Session } from '@supabase/supabase-js';
import type { Pot } from '@eb-packages/garden';

// Screens
import { PotsListScreen } from '../screens/PotsListScreen';
import { CareCalendarScreen } from '../screens/CareCalendarScreen';
import { ARPotRegistrationScreen } from '../screens/ARPotRegistrationScreen';
import { analytics } from '../services/analyticsService';

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = 'home' | 'calendar' | 'add' | 'plants';

export type HomeNavAction =
  | { type: 'OPEN_DETAIL'; pot: Pot }
  | { type: 'OPEN_EDIT'; pot: Pot }
  | { type: 'OPEN_CARE_SETTINGS'; pot: Pot };

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
  isFab?: boolean;
}

const TABS: TabConfig[] = [
  { id: 'home', label: 'Inicio', icon: '🏠' },
  { id: 'calendar', label: 'Calendario', icon: '📅' },
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
              <TouchableOpacity
                key={tab.id}
                style={styles.fabButton}
                onPress={() => {
                  analytics.track('tab_pressed', { tab: tab.id });
                  onTabPress(tab.id);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.fabIcon}>{tab.icon}</Text>
              </TouchableOpacity>
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
          />
        );
      case 'calendar':
        return <CareCalendarScreen />;
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
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 16,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.4,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#1B4332',
    fontWeight: '700',
  },
  fabButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2D6A4F',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 22,
  },
});
