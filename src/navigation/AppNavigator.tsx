import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import type { Session } from '@supabase/supabase-js';
import type { Pot } from '@eb-packages/garden';

// Screens
import { PotsListScreen } from '../screens/PotsListScreen';
import { CareCalendarScreen } from '../screens/CareCalendarScreen';
import { ARPotRegistrationScreen } from '../screens/ARPotRegistrationScreen';
import { analytics } from '../services/analyticsService';

// ── Types ────────────────────────────────────────────────────────────────────

export type RootTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Add: undefined;
  Plants: undefined;
};

// ── Sub-navigation types for stack-like navigation within tabs ───────────────

export type HomeNavAction =
  | { type: 'OPEN_DETAIL'; pot: Pot }
  | { type: 'OPEN_EDIT'; pot: Pot }
  | { type: 'OPEN_CARE_SETTINGS'; pot: Pot };

// ── Custom Tab Bar ────────────────────────────────────────────────────────────

function CustomTabBar({
  state,
  descriptors,
  navigation,
}: {
  state: any;
  descriptors: any;
  navigation: any;
}) {
  const tabs = [
    { key: 'Home', label: 'Inicio', icon: '🏠' },
    { key: 'Calendar', label: 'Calendario', icon: '📅' },
    { key: 'Add', label: 'Agregar', icon: '➕', isFab: true },
    { key: 'Plants', label: 'Mis plantas', icon: '🌱' },
  ];

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const route = state.routes.find((r: any) => r.name === tab.key);
          const isFocused = route
            ? state.index === state.routes.indexOf(route)
            : false;

          const onPress = () => {
            if (!route) return;
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              analytics.track('tab_pressed', { tab: tab.key });
              navigation.navigate(route.name);
            }
          };

          if (tab.isFab) {
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.fabButton}
                onPress={onPress}
                activeOpacity={0.85}
              >
                <Text style={styles.fabIcon}>{tab.icon}</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
                {tab.icon}
              </Text>
              <Text
                style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
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

const Tab = createBottomTabNavigator<RootTabParamList>();

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
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name='Home'>
          {() => (
            <PotsListScreen
              session={session}
              onPotPress={(pot) => onNavigateTo({ type: 'OPEN_DETAIL', pot })}
              onLogout={onLogout}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name='Calendar' component={CareCalendarScreen} />

        <Tab.Screen name='Add'>
          {() => (
            <ARPotRegistrationScreen onSuccess={() => {}} onCancel={() => {}} />
          )}
        </Tab.Screen>

        <Tab.Screen name='Plants'>
          {() => (
            <PotsListScreen
              session={session}
              onPotPress={(pot) => onNavigateTo({ type: 'OPEN_DETAIL', pot })}
              onLogout={onLogout}
              collectionMode
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
    opacity: 0.45,
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
