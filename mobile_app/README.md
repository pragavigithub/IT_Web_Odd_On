# WMS Mobile App - Flutter

A comprehensive mobile application for the Warehouse Management System (WMS) built with Flutter. This app provides offline-capable warehouse operations including inventory transfers, goods receipt (GRPO), quality control workflows, and barcode scanning.

## Features

### 🏢 Core Functionality
- **User Authentication** - Secure login with role-based access control
- **Offline Support** - Local SQLite database with automatic sync
- **Barcode Scanning** - Fast, accurate barcode and QR code scanning
- **Real-time Sync** - Background synchronization with WMS server

### 📦 Warehouse Operations
- **Inventory Transfers** - Create, edit, and manage warehouse transfers
- **GRPO (Goods Receipt PO)** - Process purchase order receipts
- **Quality Control** - QC approval/rejection workflows
- **Bin Management** - Track items across warehouse locations

### 📱 Mobile Optimized
- **Progressive Web App** features
- **Offline-first** architecture
- **Touch-friendly** UI designed for warehouse workers
- **Camera integration** for barcode scanning

## Architecture

### Technology Stack
- **Frontend**: Flutter 3.10+
- **State Management**: Provider pattern
- **Local Database**: SQLite with sqflite
- **HTTP Client**: Dio for REST API calls
- **Barcode Scanning**: mobile_scanner
- **Background Tasks**: WorkManager

### Project Structure
```
lib/
├── main.dart                 # App entry point
├── models/                   # Data models
│   ├── user.dart
│   ├── inventory_transfer.dart
│   └── grpo_document.dart
├── services/                 # Business logic
│   ├── api_service.dart      # REST API communication
│   ├── auth_service.dart     # Authentication
│   ├── database_service.dart # Local SQLite operations
│   └── sync_service.dart     # Data synchronization
├── screens/                  # UI screens
│   ├── login_screen.dart
│   ├── dashboard_screen.dart
│   ├── barcode_scanner_screen.dart
│   └── main_navigation.dart
├── widgets/                  # Reusable UI components
├── utils/                    # Utilities and helpers
│   ├── constants.dart
│   └── app_theme.dart
└── data/                     # Data layer
    ├── repositories/         # Repository pattern
    ├── database/            # Database helpers
    └── api/                 # API endpoints
```

## Setup Instructions

### Prerequisites
- Flutter SDK 3.10 or higher
- Dart SDK 3.0 or higher
- Android Studio / VS Code with Flutter extensions
- Android device or emulator for testing

### 1. Install Dependencies
```bash
cd mobile_app
flutter pub get
```

### 2. Configure API Endpoint
Update the API base URL in `lib/utils/constants.dart`:
```dart
static const String apiBaseUrl = 'https://your-wms-server.replit.app';
```

### 3. Generate Code
Generate JSON serialization code:
```bash
flutter packages pub run build_runner build
```

### 4. Run the App
```bash
# Debug mode
flutter run

# Release mode
flutter run --release
```

## Integration with WMS Backend

### API Endpoints
The mobile app integrates with your Flask WMS backend through these endpoints:

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /api/health` - Health check

#### Inventory Transfers
- `GET /api/inventory_transfers` - List transfers
- `GET /api/inventory_transfers/{id}` - Get transfer details
- `POST /api/inventory_transfers` - Create transfer
- `PUT /api/inventory_transfers/{id}` - Update transfer
- `POST /api/inventory_transfers/{id}/submit` - Submit for QC
- `POST /api/inventory_transfers/{id}/qc_approve` - QC approve
- `POST /api/inventory_transfers/{id}/qc_reject` - QC reject
- `POST /api/inventory_transfers/{id}/reopen` - Reopen rejected

#### GRPO Operations
- `GET /api/grpo_documents` - List GRPOs
- `GET /api/grpo_documents/{id}` - Get GRPO details
- `POST /api/grpo_documents` - Create GRPO
- `POST /api/grpo_documents/{id}/submit` - Submit for QC
- `POST /api/grpo_documents/{id}/approve` - QC approve
- `POST /api/grpo_documents/{id}/reject` - QC reject

#### Barcode Operations
- `POST /api/validate_barcode` - Validate item barcode
- `POST /api/validate_transfer_request` - Validate transfer request

### Backend API Updates Required

To fully support the mobile app, add these routes to your Flask backend:

```python
# Add to routes.py
@app.route('/auth/login', methods=['POST'])
def mobile_login():
    """Mobile app login endpoint"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        # Generate JWT token or session
        token = generate_auth_token(user)
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'branch_code': user.branch_code,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat(),
                'updated_at': user.updated_at.isoformat()
            }
        })
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for mobile app"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

@app.route('/api/inventory_transfers', methods=['GET'])
@login_required
def api_get_inventory_transfers():
    """Get inventory transfers for mobile app"""
    transfers = InventoryTransfer.query.filter_by(user_id=current_user.id).all()
    return jsonify({
        'transfers': [transfer.to_dict() for transfer in transfers]
    })
```

## Features

### 1. Offline-First Architecture
- All data is stored locally in SQLite
- Operations work without internet connection
- Automatic sync when connection is restored
- Conflict resolution for concurrent edits

### 2. Barcode Scanner
- High-performance camera-based scanning
- Support for multiple barcode formats
- Manual entry fallback
- Instant feedback with haptic response

### 3. Role-Based Access Control
- Admin, Manager, QC, and User roles
- Permission-based feature access
- Secure authentication with token storage

### 4. Status Management
- Complete workflow tracking
- Status history and audit trail
- Visual status indicators
- Reopen functionality for rejected items

### 5. Background Sync
- Periodic data synchronization
- Queue failed operations for retry
- Progress indicators during sync
- Graceful handling of network issues

## Customization

### Branding
Update app branding in:
- `lib/utils/app_theme.dart` - Colors and theme
- `lib/utils/constants.dart` - App name and configuration
- `android/app/src/main/res/` - App icons and launcher

### API Configuration
Modify API endpoints in:
- `lib/services/api_service.dart` - REST API calls
- `lib/utils/constants.dart` - Base URL and settings

### UI Customization
Customize screens in:
- `lib/screens/` - Main application screens
- `lib/widgets/` - Reusable UI components
- `lib/utils/app_theme.dart` - Colors and styling

## Deployment

### Android APK
```bash
flutter build apk --release
```

### Android App Bundle (Recommended)
```bash
flutter build appbundle --release
```

### iOS (requires macOS)
```bash
flutter build ios --release
```

## Testing

### Unit Tests
```bash
flutter test
```

### Integration Tests
```bash
flutter drive --target=test_driver/app.dart
```

## Performance Optimization

### Database
- Indexed queries for fast lookups
- Pagination for large datasets
- Connection pooling
- Lazy loading of related data

### Network
- Request caching
- Compression for large payloads
- Timeout handling
- Retry mechanisms with exponential backoff

### UI
- Lazy loading of lists
- Image caching and optimization
- Smooth animations
- Responsive design

## Security

### Data Protection
- Encrypted local storage
- Secure token management
- HTTPS-only communication
- Input validation and sanitization

### Authentication
- JWT token-based authentication
- Automatic token refresh
- Secure logout and session cleanup
- Biometric authentication support (optional)

## Troubleshooting

### Common Issues

1. **Build Errors**
   - Run `flutter clean && flutter pub get`
   - Check Flutter and Dart versions
   - Verify all dependencies are compatible

2. **API Connection Issues**
   - Verify API base URL in constants.dart
   - Check network connectivity
   - Ensure backend server is running

3. **Database Issues**
   - Clear app data and reinstall
   - Check database migration scripts
   - Verify SQLite version compatibility

4. **Barcode Scanner Issues**
   - Grant camera permissions
   - Test on physical device (not emulator)
   - Check lighting conditions

### Debug Mode
Enable debug logging in `lib/utils/constants.dart`:
```dart
static const bool enableDebugLogging = true;
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Refer to the WMS backend documentation