/**
 * Database Service for WMS Mobile App
 * Manages local SQLite database for offline functionality
 * Integrates with MySQL backend as per user preference
 */

import SQLite from 'react-native-sqlite-storage';

// Enable SQLite debugging in development
SQLite.DEBUG(true);
SQLite.enablePromise(true);

class DatabaseServiceClass {
  constructor() {
    this.database = null;
    this.databaseName = 'WMSMobile.db';
    this.databaseVersion = '1.0';
    this.databaseDisplayName = 'WMS Mobile Database';
    this.databaseSize = 200000;
  }

  async initializeDatabase() {
    if (this.database) {
      console.log('Database already initialized');
      return this.database;
    }

    try {
      this.database = await SQLite.openDatabase({
        name: this.databaseName,
        location: 'default',
      });

      console.log('Database opened successfully');
      await this.createTables();
      return this.database;
    } catch (error) {
      console.error('Failed to open database:', error);
      throw error;
    }
  }

  async createTables() {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        first_name TEXT,
        last_name TEXT,
        role TEXT,
        branch_code TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT,
        updated_at TEXT,
        synced INTEGER DEFAULT 0
      )`,

      // GRPO Documents table
      `CREATE TABLE IF NOT EXISTS grpo_documents (
        id INTEGER PRIMARY KEY,
        po_number TEXT NOT NULL,
        supplier_code TEXT,
        supplier_name TEXT,
        warehouse_code TEXT,
        user_id INTEGER,
        qc_approver_id INTEGER,
        qc_approved_at TEXT,
        qc_notes TEXT,
        status TEXT DEFAULT 'draft',
        po_total REAL,
        sap_document_number TEXT,
        notes TEXT,
        created_at TEXT,
        updated_at TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // GRPO Items table
      `CREATE TABLE IF NOT EXISTS grpo_items (
        id INTEGER PRIMARY KEY,
        grpo_document_id INTEGER,
        line_number INTEGER,
        item_code TEXT,
        item_name TEXT,
        received_quantity REAL,
        ordered_quantity REAL,
        unit_of_measure TEXT,
        batch_number TEXT,
        expiration_date TEXT,
        serial_number TEXT,
        warehouse_code TEXT,
        bin_location TEXT,
        created_at TEXT,
        updated_at TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (grpo_document_id) REFERENCES grpo_documents (id)
      )`,

      // Inventory Transfers table
      `CREATE TABLE IF NOT EXISTS inventory_transfers (
        id INTEGER PRIMARY KEY,
        transfer_request_number TEXT,
        sap_document_number TEXT,
        status TEXT DEFAULT 'draft',
        user_id INTEGER,
        qc_approver_id INTEGER,
        qc_approved_at TEXT,
        qc_notes TEXT,
        from_warehouse TEXT,
        to_warehouse TEXT,
        transfer_type TEXT,
        priority TEXT,
        reason_code TEXT,
        notes TEXT,
        created_at TEXT,
        updated_at TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Inventory Transfer Items table
      `CREATE TABLE IF NOT EXISTS inventory_transfer_items (
        id INTEGER PRIMARY KEY,
        inventory_transfer_id INTEGER,
        line_number INTEGER,
        item_code TEXT,
        item_name TEXT,
        quantity REAL,
        unit_of_measure TEXT,
        batch_number TEXT,
        from_bin_location TEXT,
        to_bin_location TEXT,
        created_at TEXT,
        updated_at TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (inventory_transfer_id) REFERENCES inventory_transfers (id)
      )`,

      // Pick Lists table
      `CREATE TABLE IF NOT EXISTS pick_lists (
        id INTEGER PRIMARY KEY,
        sales_order_number TEXT,
        customer_code TEXT,
        customer_name TEXT,
        warehouse_code TEXT,
        user_id INTEGER,
        status TEXT DEFAULT 'draft',
        priority TEXT,
        due_date TEXT,
        notes TEXT,
        created_at TEXT,
        updated_at TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Pick List Items table
      `CREATE TABLE IF NOT EXISTS pick_list_items (
        id INTEGER PRIMARY KEY,
        pick_list_id INTEGER,
        line_number INTEGER,
        item_code TEXT,
        item_name TEXT,
        ordered_quantity REAL,
        picked_quantity REAL,
        unit_of_measure TEXT,
        batch_number TEXT,
        bin_location TEXT,
        created_at TEXT,
        updated_at TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (pick_list_id) REFERENCES pick_lists (id)
      )`,

      // Sync Queue table for offline operations
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        operation TEXT NOT NULL,
        data TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        retry_count INTEGER DEFAULT 0,
        last_error TEXT
      )`,
    ];

    try {
      for (const sql of tables) {
        await this.database.executeSql(sql);
      }
      console.log('All tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  // Generic CRUD operations
  async insert(tableName, data) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
    
    try {
      const result = await this.database.executeSql(sql, values);
      return result[0].insertId;
    } catch (error) {
      console.error(`Error inserting into ${tableName}:`, error);
      throw error;
    }
  }

  async update(tableName, data, whereClause, whereParams = []) {
    const setClause = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(data), ...whereParams];

    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
    
    try {
      const result = await this.database.executeSql(sql, values);
      return result[0].rowsAffected;
    } catch (error) {
      console.error(`Error updating ${tableName}:`, error);
      throw error;
    }
  }

  async select(tableName, whereClause = '', params = [], orderBy = '') {
    let sql = `SELECT * FROM ${tableName}`;
    if (whereClause) sql += ` WHERE ${whereClause}`;
    if (orderBy) sql += ` ORDER BY ${orderBy}`;

    try {
      const result = await this.database.executeSql(sql, params);
      const rows = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        rows.push(result[0].rows.item(i));
      }
      return rows;
    } catch (error) {
      console.error(`Error selecting from ${tableName}:`, error);
      throw error;
    }
  }

  async delete(tableName, whereClause, params = []) {
    const sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;
    
    try {
      const result = await this.database.executeSql(sql, params);
      return result[0].rowsAffected;
    } catch (error) {
      console.error(`Error deleting from ${tableName}:`, error);
      throw error;
    }
  }

  // GRPO specific operations
  async getGRPODocuments(userId = null) {
    const whereClause = userId ? 'user_id = ?' : '';
    const params = userId ? [userId] : [];
    return await this.select('grpo_documents', whereClause, params, 'created_at DESC');
  }

  async createGRPODocument(grpoData) {
    const data = {
      ...grpoData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: 0,
    };
    return await this.insert('grpo_documents', data);
  }

  async updateGRPODocument(id, grpoData) {
    const data = {
      ...grpoData,
      updated_at: new Date().toISOString(),
      synced: 0,
    };
    return await this.update('grpo_documents', data, 'id = ?', [id]);
  }

  // Inventory Transfer specific operations
  async getInventoryTransfers(userId = null) {
    const whereClause = userId ? 'user_id = ?' : '';
    const params = userId ? [userId] : [];
    return await this.select('inventory_transfers', whereClause, params, 'created_at DESC');
  }

  async createInventoryTransfer(transferData) {
    const data = {
      ...transferData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: 0,
    };
    return await this.insert('inventory_transfers', data);
  }

  async updateInventoryTransfer(id, transferData) {
    const data = {
      ...transferData,
      updated_at: new Date().toISOString(),
      synced: 0,
    };
    return await this.update('inventory_transfers', data, 'id = ?', [id]);
  }

  // Pick List specific operations
  async getPickLists(userId = null) {
    const whereClause = userId ? 'user_id = ?' : '';
    const params = userId ? [userId] : [];
    return await this.select('pick_lists', whereClause, params, 'created_at DESC');
  }

  async createPickList(pickListData) {
    const data = {
      ...pickListData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: 0,
    };
    return await this.insert('pick_lists', data);
  }

  async updatePickList(id, pickListData) {
    const data = {
      ...pickListData,
      updated_at: new Date().toISOString(),
      synced: 0,
    };
    return await this.update('pick_lists', data, 'id = ?', [id]);
  }

  // Sync queue operations
  async addToSyncQueue(tableName, recordId, operation, data = null) {
    const queueData = {
      table_name: tableName,
      record_id: recordId,
      operation: operation,
      data: data ? JSON.stringify(data) : null,
      created_at: new Date().toISOString(),
    };
    return await this.insert('sync_queue', queueData);
  }

  async getSyncQueue() {
    return await this.select('sync_queue', '', [], 'created_at ASC');
  }

  async removeSyncQueueItem(id) {
    return await this.delete('sync_queue', 'id = ?', [id]);
  }

  async closeDatabase() {
    if (this.database) {
      await this.database.close();
      this.database = null;
      console.log('Database closed');
    }
  }
}

export const DatabaseService = new DatabaseServiceClass();