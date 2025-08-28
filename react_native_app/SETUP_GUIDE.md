# WMS Mobile App Setup Guide

This guide will help you set up and run the React Native mobile application for your Warehouse Management System.

## 🔧 Prerequisites

### Required Software
1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **React Native CLI** - Install globally:
   ```bash
   npm install -g react-native-cli
   ```
3. **Android Studio** - [Download](https://developer.android.com/studio)
4. **JDK 11** - Required for Android development
5. **Xcode** (macOS only) - For iOS development

### Environment Setup

#### Android Development
1. Install Android Studio
2. Install Android SDK (API level 29 or higher)
3. Set up Android Virtual Device (AVD) or connect physical device
4. Add environment variables to your shell profile:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

#### iOS Development (macOS only)
1. Install Xcode from App Store
2. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```
3. Install CocoaPods:
   ```bash
   sudo gem install cocoapods
   ```

## 🚀 Quick Start

### 1. Navigate to Project Directory
```bash
cd react_native_app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Backend Connection
Edit `src/config/config.js`:
```javascript
export const API_CONFIG = {
  BASE_URL: 'https://your-replit-app.replit.app', // Replace with your backend URL
  TIMEOUT: 30000,
};
```

### 4. iOS Setup (macOS only)
```bash
cd ios && pod install && cd ..
```

### 5. Start Metro Bundler
```bash
npx react-native start
```

### 6. Run the Application

#### Android
```bash
# In a new terminal
npx react-native run-android
```

#### iOS
```bash
# In a new terminal
npx react-native run-ios
```

## 🔗 Backend Integration

### Backend API Requirements
Your Flask backend must provide these endpoints:

#### Authentication
- `POST /auth/login` - User login with JWT token
- `POST /auth/logout` - User logout
- `GET /api/health` - Health check

#### GRPO Module
- `GET /api/grpo_documents` - List GRPO documents
- `POST /api/grpo_documents` - Create GRPO document
- `GET /api/grpo_documents/{id}` - Get GRPO details
- `PUT /api/grpo_documents/{id}` - Update GRPO

#### Inventory Transfer Module
- `GET /api/inventory_transfers` - List inventory transfers
- `POST /api/inventory_transfers` - Create inventory transfer
- `GET /api/inventory_transfers/{id}` - Get transfer details
- `PUT /api/inventory_transfers/{id}` - Update transfer

#### Pick List Module
- `GET /api/pick_lists` - List pick lists
- `POST /api/pick_lists` - Create pick list
- `GET /api/pick_lists/{id}` - Get pick list details
- `PUT /api/pick_lists/{id}` - Update pick list

#### Barcode Operations
- `POST /api/validate_barcode` - Validate item barcode
- `POST /api/validate_transfer_request` - Validate transfer request
- `POST /api/validate_purchase_order` - Validate purchase order

### Example Flask API Implementation

Add these routes to your Flask backend:

```python
# Add JWT support
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

app.config['JWT_SECRET_KEY'] = 'your-secret-key'
jwt = JWTManager(app)

@app.route('/auth/login', methods=['POST'])
def mobile_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        token = create_access_token(identity=user.id)
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'branch_code': user.branch_code
            }
        })
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/grpo_documents', methods=['GET'])
@jwt_required()
def api_get_grpo_documents():
    user_id = get_jwt_identity()
    grpos = GRPODocument.query.filter_by(user_id=user_id).all()
    return jsonify({
        'grpos': [grpo_to_dict(grpo) for grpo in grpos]
    })
```

## 📱 Testing on Device

### Android Device
1. Enable Developer Options and USB Debugging
2. Connect device via USB
3. Run: `npx react-native run-android`

### iOS Device
1. Open project in Xcode: `ios/WMSMobileApp.xcworkspace`
2. Select your device as target
3. Click Run button in Xcode

## 🛠 Troubleshooting

### Common Issues

#### Metro Bundler Issues
```bash
npx react-native start --reset-cache
```

#### Android Build Errors
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

#### iOS Build Errors
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npx react-native run-ios
```

#### Camera Permission Issues
1. Ensure camera permissions are added to AndroidManifest.xml
2. For iOS, add camera usage description to Info.plist
3. Request permissions at runtime in the app

### Debug Tools
- **Flipper** - React Native debugging
- **Chrome DevTools** - JavaScript debugging
- **Android Studio** - Android-specific debugging
- **Xcode** - iOS-specific debugging

## 🔄 Database Synchronization

The app uses a two-tier database approach:

### Local SQLite Database
- Stores data for offline functionality
- Mirrors MySQL backend schema
- Automatic sync when online

### MySQL Backend Integration
- Primary data store accessed via Flask API
- Real-time synchronization
- Conflict resolution with server precedence

### Sync Process
1. Local operations stored in SQLite
2. Changes queued for sync when offline
3. Background sync when connection restored
4. Server data downloaded and merged
5. Conflicts resolved (server wins)

## 📊 Features Overview

### GRPO Module
- Create GRPO documents by scanning PO numbers
- View and manage GRPO list with filtering
- QC approval workflow
- Offline support with sync

### Inventory Transfer Module
- Create transfers with barcode scanning
- Track transfer status and workflow
- QC approval and rejection
- Reopen rejected transfers

### Pick List Module
- Manage sales order picking
- Priority-based filtering
- Status tracking (draft → picking → completed)
- Customer and warehouse information

### Barcode Scanner
- Camera-based scanning
- Multiple barcode format support
- Manual entry fallback
- Integration with validation APIs

## 🔒 Security Features

### Authentication
- JWT token-based authentication
- Secure token storage
- Automatic session management
- Role-based access control

### Data Protection
- Local database encryption (configurable)
- HTTPS API communication
- Input validation and sanitization
- Secure credential storage

## 📈 Performance Optimization

### Database
- Indexed queries for fast lookups
- Pagination for large datasets
- Optimized sync algorithms
- Background processing

### Network
- Request caching and compression
- Retry mechanisms with exponential backoff
- Timeout handling
- Offline queue management

### UI
- FlatList for efficient rendering
- Image optimization and caching
- Smooth animations
- Memory management

## 🚀 Deployment

### Development Build
Use the commands above for development testing.

### Production Build

#### Android APK
```bash
cd android
./gradlew assembleRelease
```
APK location: `android/app/build/outputs/apk/release/app-release.apk`

#### Android App Bundle (Google Play)
```bash
cd android
./gradlew bundleRelease
```
Bundle location: `android/app/build/outputs/bundle/release/app-release.aab`

#### iOS (Xcode required)
1. Open `ios/WMSMobileApp.xcworkspace` in Xcode
2. Select "Generic iOS Device" as target
3. Go to Product → Archive
4. Follow Xcode's distribution process

## 🆘 Support

### Getting Help
1. Check this setup guide first
2. Review troubleshooting section
3. Check React Native documentation
4. Contact development team

### Useful Commands
```bash
# Reset Metro cache
npx react-native start --reset-cache

# Check React Native environment
npx react-native doctor

# Generate APK
cd android && ./gradlew assembleRelease

# Check device connection
adb devices

# iOS simulator list
xcrun simctl list devices
```

## 📝 Next Steps

1. ✅ Complete setup following this guide
2. ✅ Test login with your backend credentials
3. ✅ Verify all three modules (GRPO, Inventory Transfer, Pick List)
4. ✅ Test barcode scanning functionality
5. ✅ Validate offline/online sync
6. ✅ Deploy to test devices
7. ✅ Train warehouse staff on mobile app usage

Your React Native mobile app is now ready to integrate with your MySQL-based WMS backend!