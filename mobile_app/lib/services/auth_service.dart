import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import 'api_service.dart';
import 'database_service.dart';

class AuthService extends ChangeNotifier {
  final ApiService _apiService;
  final DatabaseService _databaseService;
  
  User? _currentUser;
  bool _isLoggedIn = false;
  bool _isLoading = false;

  AuthService(this._apiService, this._databaseService) {
    _initializeAuth();
  }

  User? get currentUser => _currentUser;
  bool get isLoggedIn => _isLoggedIn;
  bool get isLoading => _isLoading;

  Future<void> _initializeAuth() async {
    _isLoading = true;
    notifyListeners();

    try {
      // Check if user is already logged in
      final hasToken = await _apiService.loadStoredToken();
      if (hasToken) {
        // Try to validate token with server
        final isValid = await _apiService.checkConnection();
        if (isValid) {
          // Load user data from local storage
          await _loadUserFromStorage();
          _isLoggedIn = _currentUser != null;
        } else {
          // Token invalid, clear stored data
          await logout();
        }
      }
    } catch (e) {
      print('Auth initialization error: $e');
      await logout();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.login(username, password);
      
      if (response['success'] == true || response['token'] != null) {
        // Parse user data
        final userData = response['user'];
        _currentUser = User.fromJson(userData);
        
        // Save user to local database
        await _databaseService.insertUser(_currentUser!);
        
        // Save user data to SharedPreferences
        await _saveUserToStorage();
        
        _isLoggedIn = true;
        
        print('✅ Login successful for user: ${_currentUser!.username}');
        return true;
      } else {
        throw Exception(response['message'] ?? 'Login failed');
      }
    } catch (e) {
      print('❌ Login error: $e');
      _currentUser = null;
      _isLoggedIn = false;
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      // Logout from server
      await _apiService.logout();
      
      // Clear local data
      await _clearUserData();
      
      _currentUser = null;
      _isLoggedIn = false;
      
      print('✅ Logout successful');
    } catch (e) {
      print('❌ Logout error: $e');
      // Clear local data even if server logout fails
      await _clearUserData();
      _currentUser = null;
      _isLoggedIn = false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _saveUserToStorage() async {
    if (_currentUser != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_id', _currentUser!.id.toString());
      await prefs.setString('username', _currentUser!.username);
      await prefs.setString('email', _currentUser!.email);
      await prefs.setString('role', _currentUser!.role);
      await prefs.setString('full_name', _currentUser!.fullName);
      await prefs.setString('branch_code', _currentUser!.branchCode ?? '');
    }
  }

  Future<void> _loadUserFromStorage() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('user_id');
    
    if (userId != null) {
      // Try to load from local database first
      final user = await _databaseService.getUser(int.parse(userId));
      if (user != null) {
        _currentUser = user;
        return;
      }
      
      // Fallback to SharedPreferences data
      final username = prefs.getString('username');
      final email = prefs.getString('email');
      final role = prefs.getString('role');
      
      if (username != null && email != null && role != null) {
        _currentUser = User(
          id: int.parse(userId),
          username: username,
          email: email,
          role: role,
          isActive: true,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
      }
    }
  }

  Future<void> _clearUserData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_id');
    await prefs.remove('username');
    await prefs.remove('email');
    await prefs.remove('role');
    await prefs.remove('full_name');
    await prefs.remove('branch_code');
    await prefs.remove('user_data');
  }

  // Permission checks
  bool hasPermission(String permission) {
    return _currentUser?.hasPermission(permission) ?? false;
  }

  bool get canAccessGRPO => hasPermission('grpo');
  bool get canAccessInventoryTransfer => hasPermission('inventory_transfer');
  bool get canAccessQCDashboard => hasPermission('qc_dashboard');
  bool get canAccessBarcodeLabels => hasPermission('barcode_labels');
  bool get canAccessPickList => hasPermission('pick_list');
  bool get canAccessInventoryCounting => hasPermission('inventory_counting');

  // Role checks
  bool get isAdmin => _currentUser?.isAdmin ?? false;
  bool get isManager => _currentUser?.isManager ?? false;
  bool get isQC => _currentUser?.isQC ?? false;
  bool get isUser => _currentUser?.isUser ?? false;

  // User info
  String get userDisplayName => _currentUser?.fullName.isNotEmpty == true 
      ? _currentUser!.fullName 
      : _currentUser?.username ?? 'Unknown User';
      
  String get userRole => _currentUser?.role.toUpperCase() ?? '';
  String get userBranch => _currentUser?.branchCode ?? '';
}