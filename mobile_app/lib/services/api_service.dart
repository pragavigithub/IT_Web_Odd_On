import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../models/inventory_transfer.dart';
import '../models/grpo_document.dart';
import '../utils/constants.dart';

class ApiService {
  late final Dio _dio;
  String? _authToken;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: Constants.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Add interceptors
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add auth token to requests
          if (_authToken != null) {
            options.headers['Authorization'] = 'Bearer $_authToken';
          }
          
          print('🌐 API Request: ${options.method} ${options.path}');
          handler.next(options);
        },
        onResponse: (response, handler) {
          print('✅ API Response: ${response.statusCode} ${response.requestOptions.path}');
          handler.next(response);
        },
        onError: (error, handler) {
          print('❌ API Error: ${error.response?.statusCode} ${error.requestOptions.path}');
          print('Error message: ${error.message}');
          handler.next(error);
        },
      ),
    );
  }

  // Authentication
  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'username': username,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        _authToken = data['token'];
        
        // Save token to shared preferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _authToken!);
        await prefs.setString('user_data', data['user'].toString());
        
        return data;
      } else {
        throw Exception('Login failed');
      }
    } catch (e) {
      throw Exception('Login error: $e');
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } catch (e) {
      print('Logout error: $e');
    } finally {
      _authToken = null;
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      await prefs.remove('user_data');
    }
  }

  Future<bool> loadStoredToken() async {
    final prefs = await SharedPreferences.getInstance();
    _authToken = prefs.getString('auth_token');
    return _authToken != null;
  }

  // Inventory Transfers
  Future<List<InventoryTransfer>> getInventoryTransfers() async {
    try {
      final response = await _dio.get('/api/inventory_transfers');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['transfers'] ?? response.data;
        return data.map((json) => InventoryTransfer.fromJson(json)).toList();
      } else {
        throw Exception('Failed to fetch inventory transfers');
      }
    } catch (e) {
      throw Exception('API error: $e');
    }
  }

  Future<InventoryTransfer> getInventoryTransfer(int id) async {
    try {
      final response = await _dio.get('/api/inventory_transfers/$id');
      
      if (response.statusCode == 200) {
        return InventoryTransfer.fromJson(response.data);
      } else {
        throw Exception('Failed to fetch inventory transfer');
      }
    } catch (e) {
      throw Exception('API error: $e');
    }
  }

  Future<InventoryTransfer> createInventoryTransfer(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/api/inventory_transfers', data: data);
      
      if (response.statusCode == 201) {
        return InventoryTransfer.fromJson(response.data);
      } else {
        throw Exception('Failed to create inventory transfer');
      }
    } catch (e) {
      throw Exception('API error: $e');
    }
  }

  Future<InventoryTransfer> updateInventoryTransfer(int id, Map<String, dynamic> data) async {
    try {
      final response = await _dio.put('/api/inventory_transfers/$id', data: data);
      
      if (response.statusCode == 200) {
        return InventoryTransfer.fromJson(response.data);
      } else {
        throw Exception('Failed to update inventory transfer');
      }
    } catch (e) {
      throw Exception('API error: $e');
    }
  }

  Future<Map<String, dynamic>> submitTransferForQC(int id) async {
    try {
      final response = await _dio.post('/api/inventory_transfers/$id/submit');
      
      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Failed to submit transfer for QC');
      }
    } catch (e) {
      throw Exception('API error: $e');
    }
  }

  Future<Map<String, dynamic>> reopenTransfer(int id) async {
    try {
      final response = await _dio.post('/api/inventory_transfers/$id/reopen');
      
      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Failed to reopen transfer');
      }
    } catch (e) {
      throw Exception('API error: $e');
    }
  }

  // GRPO Documents
  Future<List<GRPODocument>> getGRPODocuments() async {
    try {
      final response = await _dio.get('/api/grpo_documents');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['grpos'] ?? response.data;
        return data.map((json) => GRPODocument.fromJson(json)).toList();
      } else {
        throw Exception('Failed to fetch GRPO documents');
      }
    } catch (e) {
      throw Exception('API error: $e');
    }
  }

  Future<GRPODocument> getGRPODocument(int id) async {
    try {
      final response = await _dio.get('/api/grpo_documents/$id');
      
      if (response.statusCode == 200) {
        return GRPODocument.fromJson(response.data);
      } else {
        throw Exception('Failed to fetch GRPO document');
      }
    } catch (e) {
      throw Exception('API error: $e');
    }
  }

  Future<GRPODocument> createGRPODocument(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/api/grpo_documents', data: data);
      
      if (response.statusCode == 201) {
        return GRPODocument.fromJson(response.data);
      } else {
        throw Exception('Failed to create GRPO document');
      }
    } catch (e) {
      throw Exception('API error: $e');
    }
  }

  // Barcode Validation
  Future<Map<String, dynamic>> validateBarcode(String barcode) async {
    try {
      final response = await _dio.post('/api/validate_barcode', data: {
        'barcode': barcode,
      });
      
      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Failed to validate barcode');
      }
    } catch (e) {
      throw Exception('API error: $e');
    }
  }

  // Transfer Request Validation  
  Future<Map<String, dynamic>> validateTransferRequest(String requestNumber) async {
    try {
      final response = await _dio.post('/api/validate_transfer_request', data: {
        'request_number': requestNumber,
      });
      
      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Failed to validate transfer request');
      }
    } catch (e) {
      throw Exception('API error: $e');
    }
  }

  // QC Operations
  Future<Map<String, dynamic>> qcApproveTransfer(int id, String? notes) async {
    try {
      final response = await _dio.post('/api/inventory_transfers/$id/qc_approve', data: {
        'qc_notes': notes ?? '',
      });
      
      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Failed to approve transfer');
      }
    } catch (e) {
      throw Exception('API error: $e');
    }
  }

  Future<Map<String, dynamic>> qcRejectTransfer(int id, String reason) async {
    try {
      final response = await _dio.post('/api/inventory_transfers/$id/qc_reject', data: {
        'qc_notes': reason,
      });
      
      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Failed to reject transfer');
      }
    } catch (e) {
      throw Exception('API error: $e');
    }
  }

  // Health Check
  Future<bool> checkConnection() async {
    try {
      final response = await _dio.get('/api/health');
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}