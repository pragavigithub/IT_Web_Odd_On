/**
 * Splash Screen for WMS Mobile App
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>WMS Mobile</Text>
      <Text style={styles.subtitle}>Warehouse Management System</Text>
      <ActivityIndicator 
        size="large" 
        color={theme.colors.primary}
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
    marginBottom: 32,
  },
  loader: {
    marginTop: 32,
  },
});

export default SplashScreen;