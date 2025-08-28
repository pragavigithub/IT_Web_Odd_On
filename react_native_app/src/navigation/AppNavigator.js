/**
 * Main App Navigator for WMS Mobile App
 * Handles navigation between authenticated and unauthenticated screens
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from '../contexts/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';

// GRPO Module Screens
import GRPOListScreen from '../screens/grpo/GRPOListScreen';
import GRPODetailScreen from '../screens/grpo/GRPODetailScreen';
import CreateGRPOScreen from '../screens/grpo/CreateGRPOScreen';

// Inventory Transfer Module Screens
import InventoryTransferListScreen from '../screens/inventory/InventoryTransferListScreen';
import InventoryTransferDetailScreen from '../screens/inventory/InventoryTransferDetailScreen';
import CreateInventoryTransferScreen from '../screens/inventory/CreateInventoryTransferScreen';

// Pick List Module Screens
import PickListScreen from '../screens/picklist/PickListScreen';
import PickListDetailScreen from '../screens/picklist/PickListDetailScreen';
import CreatePickListScreen from '../screens/picklist/CreatePickListScreen';

// Settings and Profile
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

const GRPOStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="GRPOList" 
      component={GRPOListScreen}
      options={{ title: 'GRPO Documents' }}
    />
    <Stack.Screen 
      name="GRPODetail" 
      component={GRPODetailScreen}
      options={{ title: 'GRPO Details' }}
    />
    <Stack.Screen 
      name="CreateGRPO" 
      component={CreateGRPOScreen}
      options={{ title: 'Create GRPO' }}
    />
    <Stack.Screen 
      name="BarcodeScanner" 
      component={BarcodeScannerScreen}
      options={{ title: 'Scan Barcode' }}
    />
  </Stack.Navigator>
);

const InventoryStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="InventoryTransferList" 
      component={InventoryTransferListScreen}
      options={{ title: 'Inventory Transfers' }}
    />
    <Stack.Screen 
      name="InventoryTransferDetail" 
      component={InventoryTransferDetailScreen}
      options={{ title: 'Transfer Details' }}
    />
    <Stack.Screen 
      name="CreateInventoryTransfer" 
      component={CreateInventoryTransferScreen}
      options={{ title: 'Create Transfer' }}
    />
    <Stack.Screen 
      name="BarcodeScanner" 
      component={BarcodeScannerScreen}
      options={{ title: 'Scan Barcode' }}
    />
  </Stack.Navigator>
);

const PickListStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="PickListList" 
      component={PickListScreen}
      options={{ title: 'Pick Lists' }}
    />
    <Stack.Screen 
      name="PickListDetail" 
      component={PickListDetailScreen}
      options={{ title: 'Pick List Details' }}
    />
    <Stack.Screen 
      name="CreatePickList" 
      component={CreatePickListScreen}
      options={{ title: 'Create Pick List' }}
    />
    <Stack.Screen 
      name="BarcodeScanner" 
      component={BarcodeScannerScreen}
      options={{ title: 'Scan Barcode' }}
    />
  </Stack.Navigator>
);

const SettingsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="SettingsList" 
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
    <Stack.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        switch (route.name) {
          case 'Dashboard':
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
            break;
          case 'GRPO':
            iconName = focused ? 'package-variant' : 'package-variant-closed';
            break;
          case 'Inventory':
            iconName = focused ? 'swap-horizontal' : 'swap-horizontal-variant';
            break;
          case 'PickList':
            iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
            break;
          case 'Settings':
            iconName = focused ? 'cog' : 'cog-outline';
            break;
          default:
            iconName = 'circle';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#2196F3',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="GRPO" component={GRPOStack} />
    <Tab.Screen name="Inventory" component={InventoryStack} />
    <Tab.Screen name="PickList" component={PickListStack} />
    <Tab.Screen name="Settings" component={SettingsStack} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { isLoading, isSignedIn } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isSignedIn ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;