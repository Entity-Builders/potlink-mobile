import React from 'react';
import { StyleSheet } from 'react-native';
import { AuthScreen as SharedAuthScreen, Screen } from '@eb-packages/ui';

export const AuthScreen = () => {
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
