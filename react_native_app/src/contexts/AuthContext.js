/**
 * Authentication Context for WMS Mobile App
 * Handles user authentication, login state, and JWT token management
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../services/ApiService';

const AuthContext = createContext();

const initialState = {
  isLoading: true,
  isSignedIn: false,
  user: null,
  token: null,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        isLoading: false,
        isSignedIn: action.token ? true : false,
        token: action.token,
        user: action.user,
      };
    case 'SIGN_IN':
      return {
        ...state,
        isLoading: false,
        isSignedIn: true,
        token: action.token,
        user: action.user,
        error: null,
      };
    case 'SIGN_OUT':
      return {
        ...state,
        isLoading: false,
        isSignedIn: false,
        token: null,
        user: null,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.error,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.loading,
      };
    default:
      return state;
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Bootstrap async data
    const bootstrapAsync = async () => {
      let userToken;
      let userData;

      try {
        userToken = await AsyncStorage.getItem('userToken');
        userData = await AsyncStorage.getItem('userData');
        
        if (userData) {
          userData = JSON.parse(userData);
        }
      } catch (e) {
        // Restoring token failed
        console.log('Failed to restore authentication state:', e);
      }

      dispatch({ type: 'RESTORE_TOKEN', token: userToken, user: userData });
    };

    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async (username, password) => {
        dispatch({ type: 'SET_LOADING', loading: true });
        
        try {
          const response = await ApiService.login(username, password);
          
          if (response.success) {
            await AsyncStorage.setItem('userToken', response.token);
            await AsyncStorage.setItem('userData', JSON.stringify(response.user));
            
            dispatch({ 
              type: 'SIGN_IN', 
              token: response.token, 
              user: response.user 
            });
            
            return { success: true };
          } else {
            dispatch({ type: 'SET_ERROR', error: response.message });
            return { success: false, message: response.message };
          }
        } catch (error) {
          dispatch({ type: 'SET_ERROR', error: error.message });
          return { success: false, message: error.message };
        }
      },
      
      signOut: async () => {
        try {
          await ApiService.logout();
        } catch (error) {
          console.log('Logout API error:', error);
        }
        
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        dispatch({ type: 'SIGN_OUT' });
      },
      
      clearError: () => {
        dispatch({ type: 'SET_ERROR', error: null });
      },
    }),
    []
  );

  return (
    <AuthContext.Provider value={{ ...state, ...authContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};