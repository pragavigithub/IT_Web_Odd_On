# WMS Mobile App - React Native

A comprehensive mobile application for the Warehouse Management System (WMS) built with React Native. This app provides offline-capable warehouse operations including GRPO, Inventory Transfer, Pick List modules with barcode scanning and MySQL database integration.

## 🚀 Features

### Core Modules
- **GRPO Module** - Goods Receipt against Purchase Orders
- **Inventory Transfer Module** - Inter-warehouse and bin-to-bin transfers  
- **Pick List Module** - Sales order-based picking operations
- **Barcode Scanning** - Camera-based scanning with manual entry fallback
- **Offline Support** - Local SQLite database with automatic sync to MySQL backend

### Technical Features
- **MySQL Database Integration** - Seamless sync with MySQL backend as per user preference
- **Offline-First Architecture** - All operations work without internet connection
- **Real-time Synchronization** - Background sync when connection is restored
- **Role-Based Access Control** - Admin, Manager, QC, and User roles
- **Modern UI** - Material Design with React Native Paper components

## 📱 Screenshots

The app features a clean, professional interface optimized for warehouse workers with:
- Dashboard with quick access to all modules
- Barcode scanner with manual entry option
- Comprehensive GRPO creation and management
- Inventory transfer workflows with QC approval
- Pick list management for order fulfillment

## 🛠 Setup Instructions

### Prerequisites
- Node.js 16+ and npm/yarn
- React Native CLI installed globally
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Physical device or emulator for testing

### 1. Install Dependencies
```bash
cd react_native_app
npm install
```

### 2. Configure Backend Connection
Update `src/config/config.js`:
```javascript
export const API_CONFIG = {
  BASE_URL: 'https://your-replit-app.replit.app', // Your Flask backend URL
  TIMEOUT: 30000,
};
```

### 3. Install iOS Dependencies (iOS only)
```bash
cd ios && pod install && cd ..
```

### 4. Run the Application

#### Android
```bash
npx react-native run-android
```

#### iOS
```bash
npx react-native run-ios
```

## 🏗 Project Structure

```
src/
├── config/
│   └── config.js              # App configuration
├── contexts/
│   ├── AuthContext.js         # Authentication state
│   └── DatabaseContext.js     # Database state
├── navigation/
│   └── AppNavigator.js        # Navigation structure
├── screens/
│   ├── grpo/                  # GRPO Module screens
│   │   ├── GRPOListScreen.js
│   │   ├── GRPODetailScreen.js
│   │   └── CreateGRPOScreen.js
│   ├── inventory/             # Inventory Transfer screens
│   │   ├── InventoryTransferListScreen.js
│   │   ├── InventoryTransferDetailScreen.js
│   │   └── CreateInventoryTransferScreen.js
│   ├── picklist/              # Pick List screens
│   │   ├── PickListScreen.js
│   │   ├── PickListDetailScreen.js
│   │   └── CreatePickListScreen.js
│   ├── LoginScreen.js
│   ├── DashboardScreen.js
│   └── BarcodeScannerScreen.js
├── services/
│   ├── ApiService.js          # REST API communication
│   ├── DatabaseService.js     # Local SQLite operations
│   └── SyncService.js         # Data synchronization
└── theme/
    └── theme.js               # UI theme configuration
```

## 🔌 Backend Integration

### Required Flask API Endpoints

The mobile app requires these endpoints in your Flask backend:

#### Authentication
```python
POST /auth/login           # User login with JWT token
POST /auth/logout          # User logout
GET  /api/health          # Health check
```

#### GRPO Module
```python
GET  /api/grpo_documents           # List GRPOs
GET  /api/grpo_documents/{id}      # Get GRPO details
POST /api/grpo_documents           # Create GRPO
PUT  /api/grpo_documents/{id}      # Update GRPO
POST /api/grpo_documents/{id}/submit    # Submit for QC
POST /api/grpo_documents/{id}/approve   # QC approve
POST /api/grpo_documents/{id}/reject    # QC reject
```

#### Inventory Transfer Module
```python
GET  /api/inventory_transfers           # List transfers
GET  /api/inventory_transfers/{id}      # Get transfer details
POST /api/inventory_transfers           # Create transfer
PUT  /api/inventory_transfers/{id}      # Update transfer
POST /api/inventory_transfers/{id}/submit      # Submit for QC
POST /api/inventory_transfers/{id}/qc_approve  # QC approve
POST /api/inventory_transfers/{id}/qc_reject   # QC reject
POST /api/inventory_transfers/{id}/reopen      # Reopen rejected
```

#### Pick List Module
```python
GET  /api/pick_lists           # List pick lists
GET  /api/pick_lists/{id}      # Get pick list details
POST /api/pick_lists           # Create pick list
PUT  /api/pick_lists/{id}      # Update pick list
```

#### Barcode Operations
```python
POST /api/validate_barcode            # Validate item barcode
POST /api/validate_transfer_request   # Validate transfer request
POST /api/validate_purchase_order     # Validate purchase order
```

### MySQL Database Integration

The app is designed to work with your MySQL database backend. The local SQLite database mirrors the MySQL schema for offline functionality:

- **Local SQLite** - For offline operations and caching
- **MySQL Backend** - Primary data store via Flask API
- **Automatic Sync** - Bidirectional synchronization when online

## 📊 Database Schema

The app uses a local SQLite database that mirrors your MySQL backend:

### Core Tables
- `users` - User authentication and profile data
- `grpo_documents` - GRPO header information
- `grpo_items` - GRPO line items with batch/serial tracking
- `inventory_transfers` - Transfer header information
- `inventory_transfer_items` - Transfer line items
- `pick_lists` - Pick list headers
- `pick_list_items` - Pick list line items
- `sync_queue` - Offline operations queue

### Key Features
- Foreign key relationships maintained
- Offline operation tracking with `synced` flag
- Automatic timestamp management
- Conflict resolution for concurrent edits

## 🔄 Offline Functionality

### How It Works
1. **Offline Operations** - All CRUD operations work without internet
2. **Sync Queue** - Failed operations are queued for retry
3. **Background Sync** - Automatic synchronization every 30 seconds when online
4. **Conflict Resolution** - Server data takes precedence on conflicts
5. **Status Indicators** - Visual feedback for sync status

### Sync Process
```
1. Upload local changes to server
2. Download server updates
3. Resolve any conflicts
4. Update local database
5. Clear sync queue
```

## 🔐 Security Features

### Authentication
- JWT token-based authentication
- Secure token storage in AsyncStorage
- Automatic token refresh handling
- Session management with logout capability

### Data Protection
- Local database encryption (configurable)
- HTTPS-only API communication
- Input validation and sanitization
- Role-based feature access

## 🎨 UI/UX Features

### Material Design
- Clean, professional interface
- Consistent color scheme and typography
- Touch-friendly controls for warehouse workers
- Responsive design for various screen sizes

### User Experience
- Quick access dashboard
- Floating action buttons for common actions
- Pull-to-refresh functionality
- Search and filter capabilities
- Status-based color coding

## 📷 Barcode Scanning

### Supported Formats
- QR Code
- EAN-13, EAN-8
- Code 128, Code 39
- PDF417, Aztec
- Data Matrix

### Features
- Camera-based scanning with overlay
- Manual entry fallback
- Validation against backend systems
- Haptic feedback on successful scan
- Flash toggle for low-light conditions

## ⚙️ Configuration

### Environment Variables
Update `src/config/config.js` with your settings:

```javascript
export const API_CONFIG = {
  BASE_URL: 'https://your-backend-url.com',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

export const APP_CONFIG = {
  APP_NAME: 'WMS Mobile',
  SYNC_INTERVAL: 30000,
  OFFLINE_STORAGE_LIMIT: 100,
};
```

### Permissions Required
- **Camera** - For barcode scanning
- **Storage** - For local database
- **Network** - For API communication

## 🚀 Build and Deployment

### Debug Build
```bash
# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

### Release Build

#### Android APK
```bash
cd android
./gradlew assembleRelease
```

#### Android App Bundle (Google Play)
```bash
cd android
./gradlew bundleRelease
```

#### iOS (requires Xcode)
```bash
npx react-native run-ios --configuration Release
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### End-to-End Testing
```bash
# Install Detox
npm install -g detox-cli
detox build --configuration ios.sim.debug
detox test --configuration ios.sim.debug
```

## 🔧 Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx react-native start --reset-cache
   ```

2. **Android build errors**
   ```bash
   cd android && ./gradlew clean && cd ..
   npx react-native run-android
   ```

3. **iOS pod issues**
   ```bash
   cd ios && pod deintegrate && pod install && cd ..
   ```

4. **API connection issues**
   - Verify backend URL in config.js
   - Check network connectivity
   - Ensure backend server is running

### Debug Tools
- Flipper for React Native debugging
- React DevTools for component inspection
- Network inspector for API calls
- SQLite browser for database inspection

## 📈 Performance Optimization

### Database
- Indexed queries for fast lookups
- Pagination for large datasets
- Lazy loading of related data
- Optimized sync algorithms

### Network
- Request caching and compression
- Retry mechanisms with exponential backoff
- Timeout handling
- Offline queue management

### UI
- FlatList for efficient rendering
- Image optimization and caching
- Smooth animations with React Native Reanimated
- Memory management for large datasets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support:
- Check this README and troubleshooting section
- Review the Flask backend integration guide
- Contact the development team
- Create an issue in the repository

## 🔄 Integration with Existing WMS

This React Native app integrates seamlessly with your existing Flask WMS system:

1. **Database Compatibility** - Designed for MySQL as per your preference
2. **API Standards** - RESTful endpoints with JSON communication
3. **Authentication** - JWT token-based system
4. **Offline Support** - Local SQLite mirrors MySQL schema
5. **Real-time Sync** - Bidirectional data synchronization

The app provides a mobile-first experience for your warehouse workers while maintaining data consistency with your MySQL backend through the Flask API layer.