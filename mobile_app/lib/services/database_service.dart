import 'dart:async';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import '../models/user.dart';
import '../models/inventory_transfer.dart';
import '../models/grpo_document.dart';

class DatabaseService {
  static Database? _database;
  static const String _databaseName = 'wms_mobile.db';
  static const int _databaseVersion = 1;

  Future<Database> get database async {
    _database ??= await _initDatabase();
    return _database!;
  }

  Future<void> initDatabase() async {
    if (_database == null) {
      await database;
    }
  }

  Future<Database> _initDatabase() async {
    final documentsDirectory = await getApplicationDocumentsDirectory();
    final path = join(documentsDirectory.path, _databaseName);
    
    return await openDatabase(
      path,
      version: _databaseVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    print('📱 Creating local database tables...');
    
    // Users table
    await db.execute('''
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        first_name TEXT,
        last_name TEXT,
        role TEXT NOT NULL,
        branch_code TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status INTEGER DEFAULT 1,
        last_synced_at TEXT
      )
    ''');

    // Inventory Transfers table
    await db.execute('''
      CREATE TABLE inventory_transfers (
        id INTEGER PRIMARY KEY,
        transfer_request_number TEXT NOT NULL,
        sap_document_number TEXT,
        status TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        qc_approver_id INTEGER,
        qc_approved_at TEXT,
        qc_notes TEXT,
        from_warehouse TEXT,
        to_warehouse TEXT,
        transfer_type TEXT NOT NULL,
        priority TEXT NOT NULL,
        reason_code TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0,
        last_synced_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (qc_approver_id) REFERENCES users (id)
      )
    ''');

    // GRPO Documents table
    await db.execute('''
      CREATE TABLE grpo_documents (
        id INTEGER PRIMARY KEY,
        po_number TEXT NOT NULL,
        supplier_code TEXT,
        supplier_name TEXT,
        warehouse_code TEXT,
        user_id INTEGER NOT NULL,
        qc_approver_id INTEGER,
        qc_approved_at TEXT,
        qc_notes TEXT,
        status TEXT NOT NULL,
        po_total REAL,
        sap_document_number TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0,
        last_synced_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (qc_approver_id) REFERENCES users (id)
      )
    ''');

    // Transfer Items table
    await db.execute('''
      CREATE TABLE transfer_items (
        id INTEGER PRIMARY KEY,
        transfer_id INTEGER NOT NULL,
        item_code TEXT NOT NULL,
        item_name TEXT,
        quantity REAL NOT NULL,
        unit_of_measure TEXT,
        from_warehouse_code TEXT,
        to_warehouse_code TEXT,
        from_bin TEXT,
        to_bin TEXT,
        batch_number TEXT,
        serial_number TEXT,
        expiry_date TEXT,
        unit_price REAL,
        total_value REAL,
        qc_status TEXT DEFAULT 'pending',
        base_entry INTEGER,
        base_line INTEGER,
        sap_line_number INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0,
        FOREIGN KEY (transfer_id) REFERENCES inventory_transfers (id) ON DELETE CASCADE
      )
    ''');

    // GRPO Items table
    await db.execute('''
      CREATE TABLE grpo_items (
        id INTEGER PRIMARY KEY,
        grpo_id INTEGER NOT NULL,
        item_code TEXT NOT NULL,
        item_name TEXT,
        quantity REAL NOT NULL,
        received_quantity REAL DEFAULT 0,
        unit_price REAL,
        line_total REAL,
        unit_of_measure TEXT,
        warehouse_code TEXT,
        bin_location TEXT,
        batch_number TEXT,
        serial_number TEXT,
        expiry_date TEXT,
        barcode TEXT,
        qc_status TEXT DEFAULT 'pending',
        po_line_number INTEGER,
        base_entry INTEGER,
        base_line INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0,
        FOREIGN KEY (grpo_id) REFERENCES grpo_documents (id) ON DELETE CASCADE
      )
    ''');

    // Sync Queue table for offline operations
    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        operation TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
        data TEXT, -- JSON data
        created_at TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        last_error TEXT
      )
    ''');

    print('✅ Database tables created successfully');
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    print('📱 Upgrading database from version $oldVersion to $newVersion');
    // Handle database upgrades here
  }

  // User operations
  Future<int> insertUser(User user) async {
    final db = await database;
    return await db.insert(
      'users',
      _userToMap(user),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<User?> getUser(int id) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'users',
      where: 'id = ?',
      whereArgs: [id],
    );

    if (maps.isNotEmpty) {
      return _userFromMap(maps.first);
    }
    return null;
  }

  Future<List<User>> getAllUsers() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query('users');
    return List.generate(maps.length, (i) => _userFromMap(maps[i]));
  }

  // Inventory Transfer operations
  Future<int> insertInventoryTransfer(InventoryTransfer transfer) async {
    final db = await database;
    return await db.insert(
      'inventory_transfers',
      _transferToMap(transfer),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<InventoryTransfer>> getAllInventoryTransfers() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'inventory_transfers',
      orderBy: 'created_at DESC',
    );
    return List.generate(maps.length, (i) => _transferFromMap(maps[i]));
  }

  Future<InventoryTransfer?> getInventoryTransfer(int id) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'inventory_transfers',
      where: 'id = ?',
      whereArgs: [id],
    );

    if (maps.isNotEmpty) {
      return _transferFromMap(maps.first);
    }
    return null;
  }

  Future<List<InventoryTransfer>> getInventoryTransfersByUser(int userId) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'inventory_transfers',
      where: 'user_id = ?',
      whereArgs: [userId],
      orderBy: 'created_at DESC',
    );
    return List.generate(maps.length, (i) => _transferFromMap(maps[i]));
  }

  Future<int> updateInventoryTransfer(InventoryTransfer transfer) async {
    final db = await database;
    return await db.update(
      'inventory_transfers',
      _transferToMap(transfer),
      where: 'id = ?',
      whereArgs: [transfer.id],
    );
  }

  Future<int> deleteInventoryTransfer(int id) async {
    final db = await database;
    return await db.delete(
      'inventory_transfers',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // GRPO Document operations
  Future<int> insertGRPODocument(GRPODocument grpo) async {
    final db = await database;
    return await db.insert(
      'grpo_documents',
      _grpoToMap(grpo),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<GRPODocument>> getAllGRPODocuments() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'grpo_documents',
      orderBy: 'created_at DESC',
    );
    return List.generate(maps.length, (i) => _grpoFromMap(maps[i]));
  }

  Future<GRPODocument?> getGRPODocument(int id) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'grpo_documents',
      where: 'id = ?',
      whereArgs: [id],
    );

    if (maps.isNotEmpty) {
      return _grpoFromMap(maps.first);
    }
    return null;
  }

  Future<List<GRPODocument>> getGRPODocumentsByUser(int userId) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'grpo_documents',
      where: 'user_id = ?',
      whereArgs: [userId],
      orderBy: 'created_at DESC',
    );
    return List.generate(maps.length, (i) => _grpoFromMap(maps[i]));
  }

  // Sync operations
  Future<List<InventoryTransfer>> getPendingSyncTransfers() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'inventory_transfers',
      where: 'sync_status = ?',
      whereArgs: [0], // 0 = pending sync
    );
    return List.generate(maps.length, (i) => _transferFromMap(maps[i]));
  }

  Future<void> markTransferAsSynced(int id) async {
    final db = await database;
    await db.update(
      'inventory_transfers',
      {
        'sync_status': 1, // 1 = synced
        'last_synced_at': DateTime.now().toIso8601String(),
      },
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<void> clearDatabase() async {
    final db = await database;
    await db.delete('users');
    await db.delete('inventory_transfers');
    await db.delete('grpo_documents');
    await db.delete('transfer_items');
    await db.delete('grpo_items');
    await db.delete('sync_queue');
  }

  // Helper methods for data conversion
  Map<String, dynamic> _userToMap(User user) {
    return {
      'id': user.id,
      'username': user.username,
      'email': user.email,
      'first_name': user.firstName,
      'last_name': user.lastName,
      'role': user.role,
      'branch_code': user.branchCode,
      'is_active': user.isActive ? 1 : 0,
      'created_at': user.createdAt.toIso8601String(),
      'updated_at': user.updatedAt.toIso8601String(),
      'sync_status': 1,
      'last_synced_at': DateTime.now().toIso8601String(),
    };
  }

  User _userFromMap(Map<String, dynamic> map) {
    return User(
      id: map['id'],
      username: map['username'],
      email: map['email'],
      firstName: map['first_name'],
      lastName: map['last_name'],
      role: map['role'],
      branchCode: map['branch_code'],
      isActive: map['is_active'] == 1,
      createdAt: DateTime.parse(map['created_at']),
      updatedAt: DateTime.parse(map['updated_at']),
    );
  }

  Map<String, dynamic> _transferToMap(InventoryTransfer transfer) {
    return {
      'id': transfer.id,
      'transfer_request_number': transfer.transferRequestNumber,
      'sap_document_number': transfer.sapDocumentNumber,
      'status': transfer.status,
      'user_id': transfer.userId,
      'qc_approver_id': transfer.qcApproverId,
      'qc_approved_at': transfer.qcApprovedAt?.toIso8601String(),
      'qc_notes': transfer.qcNotes,
      'from_warehouse': transfer.fromWarehouse,
      'to_warehouse': transfer.toWarehouse,
      'transfer_type': transfer.transferType,
      'priority': transfer.priority,
      'reason_code': transfer.reasonCode,
      'notes': transfer.notes,
      'created_at': transfer.createdAt.toIso8601String(),
      'updated_at': transfer.updatedAt.toIso8601String(),
      'sync_status': transfer.syncStatus,
      'last_synced_at': transfer.lastSyncedAt?.toIso8601String(),
    };
  }

  InventoryTransfer _transferFromMap(Map<String, dynamic> map) {
    return InventoryTransfer(
      id: map['id'],
      transferRequestNumber: map['transfer_request_number'],
      sapDocumentNumber: map['sap_document_number'],
      status: map['status'],
      userId: map['user_id'],
      qcApproverId: map['qc_approver_id'],
      qcApprovedAt: map['qc_approved_at'] != null 
          ? DateTime.parse(map['qc_approved_at']) 
          : null,
      qcNotes: map['qc_notes'],
      fromWarehouse: map['from_warehouse'],
      toWarehouse: map['to_warehouse'],
      transferType: map['transfer_type'],
      priority: map['priority'],
      reasonCode: map['reason_code'],
      notes: map['notes'],
      createdAt: DateTime.parse(map['created_at']),
      updatedAt: DateTime.parse(map['updated_at']),
      syncStatus: map['sync_status'] ?? 0,
      lastSyncedAt: map['last_synced_at'] != null 
          ? DateTime.parse(map['last_synced_at']) 
          : null,
    );
  }

  Map<String, dynamic> _grpoToMap(GRPODocument grpo) {
    return {
      'id': grpo.id,
      'po_number': grpo.poNumber,
      'supplier_code': grpo.supplierCode,
      'supplier_name': grpo.supplierName,
      'warehouse_code': grpo.warehouseCode,
      'user_id': grpo.userId,
      'qc_approver_id': grpo.qcApproverId,
      'qc_approved_at': grpo.qcApprovedAt?.toIso8601String(),
      'qc_notes': grpo.qcNotes,
      'status': grpo.status,
      'po_total': grpo.poTotal,
      'sap_document_number': grpo.sapDocumentNumber,
      'notes': grpo.notes,
      'created_at': grpo.createdAt.toIso8601String(),
      'updated_at': grpo.updatedAt.toIso8601String(),
      'sync_status': grpo.syncStatus,
      'last_synced_at': grpo.lastSyncedAt?.toIso8601String(),
    };
  }

  GRPODocument _grpoFromMap(Map<String, dynamic> map) {
    return GRPODocument(
      id: map['id'],
      poNumber: map['po_number'],
      supplierCode: map['supplier_code'],
      supplierName: map['supplier_name'],
      warehouseCode: map['warehouse_code'],
      userId: map['user_id'],
      qcApproverId: map['qc_approver_id'],
      qcApprovedAt: map['qc_approved_at'] != null 
          ? DateTime.parse(map['qc_approved_at']) 
          : null,
      qcNotes: map['qc_notes'],
      status: map['status'],
      poTotal: map['po_total'],
      sapDocumentNumber: map['sap_document_number'],
      notes: map['notes'],
      createdAt: DateTime.parse(map['created_at']),
      updatedAt: DateTime.parse(map['updated_at']),
      syncStatus: map['sync_status'] ?? 0,
      lastSyncedAt: map['last_synced_at'] != null 
          ? DateTime.parse(map['last_synced_at']) 
          : null,
    );
  }
}