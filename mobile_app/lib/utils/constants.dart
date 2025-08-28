class Constants {
  // API Configuration
  static const String apiBaseUrl = 'https://your-wms-server.replit.app'; // Replace with your Replit app URL
  static const String apiVersion = 'v1';
  
  // App Configuration
  static const String appName = 'WMS Mobile';
  static const String appVersion = '1.0.0';
  
  // Database Configuration
  static const String databaseName = 'wms_mobile.db';
  static const int databaseVersion = 1;
  
  // Sync Configuration
  static const Duration syncInterval = Duration(minutes: 15);
  static const int maxRetryAttempts = 3;
  static const Duration retryDelay = Duration(seconds: 5);
  
  // UI Configuration
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  
  // Barcode Scanner Configuration
  static const Duration scanTimeout = Duration(seconds: 30);
  static const bool enableHapticFeedback = true;
  
  // Status Colors
  static const Map<String, String> statusColors = {
    'draft': '#6B7280',      // Gray
    'submitted': '#3B82F6',  // Blue
    'qc_approved': '#10B981', // Green
    'posted': '#059669',     // Dark Green
    'rejected': '#EF4444',   // Red
  };
  
  // Priority Colors
  static const Map<String, String> priorityColors = {
    'low': '#6B7280',       // Gray
    'normal': '#3B82F6',    // Blue
    'high': '#F59E0B',      // Amber
    'urgent': '#EF4444',    // Red
  };
  
  // Role Permissions
  static const Map<String, List<String>> rolePermissions = {
    'admin': [
      'dashboard',
      'grpo',
      'inventory_transfer',
      'pick_list',
      'inventory_counting',
      'qc_dashboard',
      'barcode_labels'
    ],
    'manager': [
      'dashboard',
      'grpo',
      'inventory_transfer',
      'pick_list',
      'inventory_counting',
      'qc_dashboard',
      'barcode_labels'
    ],
    'qc': ['dashboard', 'qc_dashboard', 'barcode_labels'],
    'user': [
      'dashboard',
      'grpo',
      'inventory_transfer',
      'pick_list',
      'inventory_counting',
      'barcode_labels'
    ]
  };
  
  // Sync Status
  static const int syncStatusPending = 0;
  static const int syncStatusSynced = 1;
  static const int syncStatusError = 2;
  
  // Error Messages
  static const String errorNetworkConnection = 'No internet connection. Please check your network settings.';
  static const String errorServerConnection = 'Unable to connect to server. Please try again later.';
  static const String errorUnauthorized = 'Unauthorized access. Please login again.';
  static const String errorGeneric = 'An unexpected error occurred. Please try again.';
  
  // Success Messages
  static const String successLogin = 'Login successful';
  static const String successLogout = 'Logout successful';
  static const String successSync = 'Data synchronized successfully';
  static const String successCreate = 'Created successfully';
  static const String successUpdate = 'Updated successfully';
  static const String successDelete = 'Deleted successfully';
  
  // Validation Messages
  static const String validationRequired = 'This field is required';
  static const String validationEmail = 'Please enter a valid email address';
  static const String validationPassword = 'Password must be at least 6 characters';
  static const String validationNumber = 'Please enter a valid number';
  
  // Date Formats
  static const String dateFormat = 'yyyy-MM-dd';
  static const String dateTimeFormat = 'yyyy-MM-dd HH:mm';
  static const String displayDateFormat = 'MMM dd, yyyy';
  static const String displayDateTimeFormat = 'MMM dd, yyyy HH:mm';
  
  // Shared Preferences Keys
  static const String keyAuthToken = 'auth_token';
  static const String keyUserId = 'user_id';
  static const String keyUsername = 'username';
  static const String keyUserRole = 'user_role';
  static const String keyLastSync = 'last_sync';
  static const String keyOfflineMode = 'offline_mode';
  
  // Cache Keys
  static const String cacheInventoryTransfers = 'inventory_transfers';
  static const String cacheGRPODocuments = 'grpo_documents';
  static const String cacheWarehouses = 'warehouses';
  static const String cacheBinLocations = 'bin_locations';
  
  // File Upload
  static const int maxFileSize = 10 * 1024 * 1024; // 10MB
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png'];
  static const List<String> allowedDocumentTypes = ['pdf', 'doc', 'docx'];
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  
  // Timeouts
  static const Duration networkTimeout = Duration(seconds: 30);
  static const Duration cacheTimeout = Duration(hours: 1);
  
  // Feature Flags
  static const bool enableOfflineMode = true;
  static const bool enablePushNotifications = true;
  static const bool enableBiometricAuth = false;
  static const bool enableAnalytics = false;
}