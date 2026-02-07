import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Auth } from '@eb-packages/ui';
import { supabase } from '@eb-packages/core';

export const AuthScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      Alert.alert('Login Error', error.message);
    }
  };

  const handleRegister = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      Alert.alert('Registration Error', error.message);
    } else {
      Alert.alert('Success', 'Please check your email for verification.');
    }
  };

  return (
    <View style={styles.container}>
      <Auth
        onLogin={handleLogin}
        onRegister={handleRegister}
        loading={loading}
        error={error}
        title='PotLink Login'
        themeColor='#2e7d32'
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
