# WMS Mobile App Integration Guide

This guide explains how to integrate the Flutter mobile app with your existing Flask WMS backend.

## Backend API Extensions Required

### 1. Add Mobile Authentication Endpoints

Add these routes to your Flask application:

```python
# Add to routes.py
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import jwt
from datetime import datetime, timedelta

# Initialize JWT
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')
jwt_manager = JWTManager(app)

@app.route('/auth/login', methods=['POST'])
def mobile_login():
    """Mobile app login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password required'}), 400
        
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password) and user.is_active:
            # Create JWT token
            token = create_access_token(
                identity=user.id,
                expires_delta=timedelta(days=7)
            )
            
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
            
    except Exception as e:
        logging.error(f"Mobile login error: {str(e)}")
        return jsonify({'success': False, 'message': 'Login failed'}), 500

@app.route('/auth/logout', methods=['POST'])
@jwt_required()
def mobile_logout():
    """Mobile app logout endpoint"""
    return jsonify({'success': True, 'message': 'Logout successful'})

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for mobile app"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })
```

### 2. Add Mobile API Endpoints for Inventory Transfers

```python
@app.route('/api/inventory_transfers', methods=['GET'])
@jwt_required()
def api_get_inventory_transfers():
    """Get inventory transfers for mobile app"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get transfers based on user role
        if user.role in ['admin', 'manager']:
            transfers = InventoryTransfer.query.order_by(InventoryTransfer.created_at.desc()).all()
        else:
            transfers = InventoryTransfer.query.filter_by(user_id=user_id).order_by(InventoryTransfer.created_at.desc()).all()
        
        return jsonify({
            'transfers': [transfer_to_dict(transfer) for transfer in transfers]
        })
        
    except Exception as e:
        logging.error(f"Error fetching transfers: {str(e)}")
        return jsonify({'error': 'Failed to fetch transfers'}), 500

@app.route('/api/inventory_transfers/<int:transfer_id>', methods=['GET'])
@jwt_required()
def api_get_inventory_transfer(transfer_id):
    """Get specific inventory transfer for mobile app"""
    try:
        user_id = get_jwt_identity()
        transfer = InventoryTransfer.query.get_or_404(transfer_id)
        
        # Check permissions
        user = User.query.get(user_id)
        if transfer.user_id != user_id and user.role not in ['admin', 'manager', 'qc']:
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify(transfer_to_dict(transfer))
        
    except Exception as e:
        logging.error(f"Error fetching transfer: {str(e)}")
        return jsonify({'error': 'Failed to fetch transfer'}), 500

@app.route('/api/inventory_transfers', methods=['POST'])
@jwt_required()
def api_create_inventory_transfer():
    """Create inventory transfer from mobile app"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['transfer_request_number', 'from_warehouse', 'to_warehouse']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if transfer already exists
        existing = InventoryTransfer.query.filter_by(
            transfer_request_number=data['transfer_request_number'],
            user_id=user_id
        ).first()
        
        if existing:
            return jsonify({'error': 'Transfer already exists for this request number'}), 409
        
        # Create new transfer
        transfer = InventoryTransfer(
            transfer_request_number=data['transfer_request_number'],
            user_id=user_id,
            from_warehouse=data['from_warehouse'],
            to_warehouse=data['to_warehouse'],
            transfer_type=data.get('transfer_type', 'warehouse'),
            priority=data.get('priority', 'normal'),
            reason_code=data.get('reason_code'),
            notes=data.get('notes'),
            status='draft'
        )
        
        db.session.add(transfer)
        db.session.commit()
        
        logging.info(f"✅ Mobile: Inventory Transfer created for request {data['transfer_request_number']}")
        return jsonify(transfer_to_dict(transfer)), 201
        
    except Exception as e:
        logging.error(f"Error creating transfer: {str(e)}")
        return jsonify({'error': 'Failed to create transfer'}), 500

def transfer_to_dict(transfer):
    """Convert InventoryTransfer to dictionary for API response"""
    return {
        'id': transfer.id,
        'transfer_request_number': transfer.transfer_request_number,
        'sap_document_number': transfer.sap_document_number,
        'status': transfer.status,
        'user_id': transfer.user_id,
        'qc_approver_id': transfer.qc_approver_id,
        'qc_approved_at': transfer.qc_approved_at.isoformat() if transfer.qc_approved_at else None,
        'qc_notes': transfer.qc_notes,
        'from_warehouse': transfer.from_warehouse,
        'to_warehouse': transfer.to_warehouse,
        'transfer_type': transfer.transfer_type,
        'priority': transfer.priority,
        'reason_code': transfer.reason_code,
        'notes': transfer.notes,
        'created_at': transfer.created_at.isoformat(),
        'updated_at': transfer.updated_at.isoformat()
    }
```

### 3. Add GRPO Mobile API Endpoints

```python
@app.route('/api/grpo_documents', methods=['GET'])
@jwt_required()
def api_get_grpo_documents():
    """Get GRPO documents for mobile app"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get GRPOs based on user role
        if user.role in ['admin', 'manager']:
            grpos = GRPODocument.query.order_by(GRPODocument.created_at.desc()).all()
        else:
            grpos = GRPODocument.query.filter_by(user_id=user_id).order_by(GRPODocument.created_at.desc()).all()
        
        return jsonify({
            'grpos': [grpo_to_dict(grpo) for grpo in grpos]
        })
        
    except Exception as e:
        logging.error(f"Error fetching GRPOs: {str(e)}")
        return jsonify({'error': 'Failed to fetch GRPOs'}), 500

@app.route('/api/grpo_documents', methods=['POST'])
@jwt_required()
def api_create_grpo_document():
    """Create GRPO document from mobile app"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('po_number'):
            return jsonify({'error': 'PO number is required'}), 400
        
        # Check if GRPO already exists
        existing = GRPODocument.query.filter_by(
            po_number=data['po_number'],
            user_id=user_id
        ).first()
        
        if existing:
            return jsonify({'error': 'GRPO already exists for this PO'}), 409
        
        # Create new GRPO
        grpo = GRPODocument(
            po_number=data['po_number'],
            user_id=user_id,
            supplier_code=data.get('supplier_code'),
            supplier_name=data.get('supplier_name'),
            warehouse_code=data.get('warehouse_code'),
            notes=data.get('notes'),
            status='draft'
        )
        
        db.session.add(grpo)
        db.session.commit()
        
        logging.info(f"✅ Mobile: GRPO created for PO {data['po_number']}")
        return jsonify(grpo_to_dict(grpo)), 201
        
    except Exception as e:
        logging.error(f"Error creating GRPO: {str(e)}")
        return jsonify({'error': 'Failed to create GRPO'}), 500

def grpo_to_dict(grpo):
    """Convert GRPODocument to dictionary for API response"""
    return {
        'id': grpo.id,
        'po_number': grpo.po_number,
        'supplier_code': grpo.supplier_code,
        'supplier_name': grpo.supplier_name,
        'warehouse_code': grpo.warehouse_code,
        'user_id': grpo.user_id,
        'qc_approver_id': grpo.qc_approver_id,
        'qc_approved_at': grpo.qc_approved_at.isoformat() if grpo.qc_approved_at else None,
        'qc_notes': grpo.qc_notes,
        'status': grpo.status,
        'po_total': float(grpo.po_total) if grpo.po_total else None,
        'sap_document_number': grpo.sap_document_number,
        'notes': grpo.notes,
        'created_at': grpo.created_at.isoformat(),
        'updated_at': grpo.updated_at.isoformat()
    }
```

### 4. Add Barcode Validation APIs

```python
@app.route('/api/validate_barcode', methods=['POST'])
@jwt_required()
def api_validate_barcode():
    """Validate barcode from mobile app"""
    try:
        data = request.get_json()
        barcode = data.get('barcode')
        
        if not barcode:
            return jsonify({'error': 'Barcode is required'}), 400
        
        # Here you would integrate with SAP B1 or your item master
        # For now, return mock validation
        
        # Check if barcode exists in your system
        # This is a placeholder - implement your actual validation logic
        item_info = {
            'barcode': barcode,
            'item_code': 'ITEM-' + barcode[-8:],
            'item_name': f'Product for barcode {barcode}',
            'unit_of_measure': 'PCS',
            'is_valid': True,
            'warehouse_locations': ['WH01', 'WH02'],
            'current_stock': 100
        }
        
        return jsonify({
            'success': True,
            'item': item_info
        })
        
    except Exception as e:
        logging.error(f"Error validating barcode: {str(e)}")
        return jsonify({'error': 'Failed to validate barcode'}), 500

@app.route('/api/validate_transfer_request', methods=['POST'])
@jwt_required()
def api_validate_transfer_request():
    """Validate transfer request from mobile app"""
    try:
        data = request.get_json()
        request_number = data.get('request_number')
        
        if not request_number:
            return jsonify({'error': 'Request number is required'}), 400
        
        # Validate with SAP B1 or your transfer request system
        # This is a placeholder - implement your actual validation logic
        
        transfer_request_info = {
            'request_number': request_number,
            'from_warehouse': '3001-QRM',
            'to_warehouse': 'REJ_BDS',
            'status': 'Open',
            'total_lines': 5,
            'is_valid': True,
            'items': [
                {
                    'item_code': 'ITEM001',
                    'item_name': 'Sample Item 1',
                    'quantity': 10,
                    'unit_of_measure': 'PCS'
                }
            ]
        }
        
        return jsonify({
            'success': True,
            'transfer_request': transfer_request_info
        })
        
    except Exception as e:
        logging.error(f"Error validating transfer request: {str(e)}")
        return jsonify({'error': 'Failed to validate transfer request'}), 500
```

## Required Dependencies

Add these to your Flask app's requirements.txt:

```txt
flask-jwt-extended==4.6.0
PyJWT==2.8.0
```

Install with:
```bash
pip install flask-jwt-extended PyJWT
```

## Environment Variables

Add these to your `.env` file:

```env
# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_ACCESS_TOKEN_EXPIRES=7  # days

# CORS Configuration (if needed)
CORS_ORIGINS=*
```

## CORS Configuration (Optional)

If your mobile app and backend are on different domains, add CORS support:

```python
from flask_cors import CORS

# Add after creating Flask app
CORS(app, origins=['*'])  # Configure origins as needed for production
```

## Mobile App Configuration

### 1. Update API Base URL

In `mobile_app/lib/utils/constants.dart`, update:

```dart
static const String apiBaseUrl = 'https://your-replit-app-name.replit.app';
```

### 2. Build and Test

```bash
cd mobile_app
flutter pub get
flutter packages pub run build_runner build
flutter run
```

## Testing the Integration

### 1. Test Authentication
- Open mobile app
- Login with existing WMS credentials
- Verify user data is received correctly

### 2. Test Inventory Transfers
- Create a new transfer from mobile app
- Verify it appears in web dashboard
- Test status updates (submit, approve, reject, reopen)

### 3. Test GRPO
- Create a new GRPO from mobile app
- Verify it appears in web dashboard
- Test QC workflow

### 4. Test Barcode Scanner
- Use barcode scanner in mobile app
- Verify barcode validation works
- Test manual entry fallback

## Deployment Checklist

### Backend (Replit)
- [ ] Add all new API routes
- [ ] Install JWT dependencies
- [ ] Configure environment variables
- [ ] Test all API endpoints
- [ ] Deploy to production

### Mobile App
- [ ] Update API base URL
- [ ] Test on real devices
- [ ] Build release APK/iOS
- [ ] Test offline functionality
- [ ] Deploy to app stores (optional)

## Security Considerations

### JWT Token Security
- Use strong secret keys
- Set appropriate expiration times
- Implement token refresh mechanism
- Validate tokens on each request

### API Security
- Validate all input data
- Implement rate limiting
- Use HTTPS in production
- Log security events

### Mobile App Security
- Store tokens securely
- Validate SSL certificates
- Encrypt local database
- Implement app-level authentication

## Monitoring and Analytics

### Backend Monitoring
```python
import logging

# Add API request logging
@app.before_request
def log_request_info():
    if request.path.startswith('/api/'):
        logging.info(f"Mobile API: {request.method} {request.path} - User: {get_jwt_identity() if 'Authorization' in request.headers else 'Anonymous'}")

@app.after_request
def log_response_info(response):
    if request.path.startswith('/api/'):
        logging.info(f"Mobile API Response: {response.status_code} for {request.method} {request.path}")
    return response
```

### Mobile App Analytics
Add analytics tracking in the mobile app for:
- User login/logout events
- Feature usage statistics
- Error tracking and crash reports
- Performance metrics

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Check JWT secret key configuration
   - Verify token format and expiration
   - Ensure user credentials are correct

2. **API Connection Issues**
   - Verify API base URL
   - Check network connectivity
   - Ensure backend server is running

3. **Database Sync Issues**
   - Check local SQLite database
   - Verify sync service configuration
   - Review error logs

4. **Barcode Scanner Issues**
   - Grant camera permissions
   - Test on physical device
   - Check lighting conditions

### Debug Mode

Enable debug logging in mobile app:
```dart
// In lib/main.dart
void main() {
  if (kDebugMode) {
    Logger.root.level = Level.ALL;
    Logger.root.onRecord.listen((record) {
      print('${record.level.name}: ${record.time}: ${record.message}');
    });
  }
  runApp(WMSMobileApp());
}
```

Enable debug logging in Flask backend:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

This integration guide provides a complete setup for connecting your Flutter mobile app with the Flask WMS backend. The mobile app will work offline and sync data when connected, providing a seamless warehouse management experience on mobile devices.