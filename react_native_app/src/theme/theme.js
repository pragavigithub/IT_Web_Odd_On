/**
 * Theme configuration for WMS Mobile App
 * Based on Material Design guidelines
 */

import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2196F3',
    accent: '#03DAC6',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    error: '#B00020',
    text: '#000000',
    onSurface: '#000000',
    disabled: '#C4C4C4',
    placeholder: '#666666',
    backdrop: '#000000',
    notification: '#F50057',
    // Custom colors for WMS app
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
    draft: '#FFA500',
    submitted: '#87CEEB',
    approved: '#32CD32',
    rejected: '#FF6347',
    posted: '#228B22',
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'Roboto-Regular',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'Roboto-Medium',
      fontWeight: 'normal',
    },
    light: {
      fontFamily: 'Roboto-Light',
      fontWeight: 'normal',
    },
    thin: {
      fontFamily: 'Roboto-Thin',
      fontWeight: 'normal',
    },
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
};

export const shadows = {
  light: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  heavy: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};