import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AuthScreen as SharedAuthScreen } from '@eb-packages/ui';

export const AuthScreen = () => {
  return (
    <View style={styles.container}>
      <SharedAuthScreen title='PotLink' themeColor='#2e7d32' />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2e7d32',
  },
});
