import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { AuthScreen as SharedAuthScreen, Screen } from '@eb-packages/ui';
import { supabase } from '@eb-packages/core';
import type { Session } from '@supabase/supabase-js';

interface AuthScreenProps {
  onNavigateToList?: () => void;
}

export const AuthScreen = ({ onNavigateToList }: AuthScreenProps = {}) => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && onNavigateToList) {
        // If session exists, redirect to PotsList screen
        onNavigateToList();
      }
      setSession(session);
    });
  }, [onNavigateToList]);

  return (
    <Screen style={styles.container}>
      <SharedAuthScreen title='PotLink' themeColor='#2e7d32' />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2e7d32',
  },
});
