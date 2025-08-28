/**
 * WMS Mobile App - Main Application Component
 * React Native implementation for Warehouse Management System
 * 
 * Features:
 * - PickList Module
 * - GRPO Module  
 * - Inventory Transfer Module
 * - Barcode Scanning
 * - Offline Support with SQLite
 * - MySQL Database Integration
 */

import React from 'react';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import { DatabaseProvider } from './src/contexts/DatabaseContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import { theme } from './src/theme/theme';

const Stack = createStackNavigator();

const App = () => {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <PaperProvider theme={theme}>
        <DatabaseProvider>
          <AuthProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </AuthProvider>
        </DatabaseProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;