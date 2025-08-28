/**
 * Configuration file for WMS Mobile App
 * Update the API_BASE_URL to match your Flask backend server
 */

export const API_CONFIG = {
  // Update this URL to your Replit app URL or local development server
  BASE_URL: 'https://your-replit-app-name.replit.app',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 seconds
};

export const APP_CONFIG = {
  APP_NAME: 'WMS Mobile',
  VERSION: '1.0.0',
  DATABASE_NAME: 'WMSMobile.db',
  SYNC_INTERVAL: 30000, // 30 seconds
  OFFLINE_STORAGE_LIMIT: 100, // Maximum offline records
};

export const PERMISSIONS = {
  CAMERA: 'camera',
  STORAGE: 'storage',
  LOCATION: 'location',
};

export const STATUS_COLORS = {
  draft: '#FFA500',
  submitted: '#87CEEB',
  qc_approved: '#32CD32',
  rejected: '#FF6347',
  posted: '#228B22',
};

export const PRIORITIES = {
  low: { label: 'Low', color: '#90EE90' },
  normal: { label: 'Normal', color: '#87CEEB' },
  high: { label: 'High', color: '#FFA500' },
  urgent: { label: 'Urgent', color: '#FF6347' },
};