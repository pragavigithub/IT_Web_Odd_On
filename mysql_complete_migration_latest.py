#!/usr/bin/env python3
"""
Complete MySQL Migration Script - Latest Version (August 2025)
Includes all latest enhancements for Serial Number Transfers, Serial Item Transfers, QC Approval, and Performance optimizations

ENHANCEMENTS INCLUDED:
✅ Serial Number Transfer Module with duplicate prevention
✅ Serial Item Transfer Module with SAP B1 validation (NEW - August 26, 2025)
✅ QC Approval workflow with proper status transitions
✅ Performance optimizations for 1000+ item validation
✅ Unique constraints to prevent data corruption
✅ Comprehensive indexing for optimal performance
✅ Latest schema updates for all WMS modules
"""

import os
import sys
import logging
import pymysql
from datetime import datetime
from werkzeug.security import generate_password_hash

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MySQLMigration:
    def __init__(self):
        self.connection = None
        self.cursor = None
    
    def get_database_config(self):
        """Get database configuration from environment or user input"""
        config = {
            'host': os.getenv('MYSQL_HOST') or input('MySQL Host (localhost): ') or 'localhost',
            'port': int(os.getenv('MYSQL_PORT') or input('MySQL Port (3306): ') or '3306'),
            'user': os.getenv('MYSQL_USER') or input('MySQL User (root): ') or 'root',
            'password': os.getenv('MYSQL_PASSWORD') or input('MySQL Password: '),
            'database': os.getenv('MYSQL_DATABASE') or input('Database Name (wms_db_dev): ') or 'wms_db_dev',
            'charset': 'utf8mb4',
            'autocommit': False
        }
        return config
    
    def connect(self, config):
        """Connect to MySQL database"""
        try:
            self.connection = pymysql.connect(**config)
            self.cursor = self.connection.cursor()
            logger.info(f"✅ Connected to MySQL: {config['database']}")
            return True
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False
    
    def create_tables(self):
        """Create all WMS tables with latest schema"""
        
        tables = {
            # 1. Document Number Series for auto-numbering
            'document_number_series': '''
                CREATE TABLE IF NOT EXISTS document_number_series (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    document_type VARCHAR(20) NOT NULL UNIQUE,
                    prefix VARCHAR(10) NOT NULL,
                    current_number INT DEFAULT 1,
                    year_suffix BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_document_type (document_type)
                )
            ''',
            
            # 2. Branches/Locations
            'branches': '''
                CREATE TABLE IF NOT EXISTS branches (
                    id VARCHAR(10) PRIMARY KEY,
                    name VARCHAR(100),
                    description VARCHAR(255),
                    branch_code VARCHAR(10) UNIQUE NOT NULL,
                    branch_name VARCHAR(100) NOT NULL,
                    address VARCHAR(255),
                    city VARCHAR(50),
                    state VARCHAR(50),
                    postal_code VARCHAR(20),
                    country VARCHAR(50),
                    phone VARCHAR(20),
                    email VARCHAR(120),
                    manager_name VARCHAR(100),
                    warehouse_codes TEXT,
                    active BOOLEAN DEFAULT TRUE,
                    is_default BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_branch_code (branch_code),
                    INDEX idx_active (active)
                )
            ''',
            
            # 3. Users with comprehensive role management
            'users': '''
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(80) UNIQUE NOT NULL,
                    email VARCHAR(120) UNIQUE NOT NULL,
                    password_hash VARCHAR(256) NOT NULL,
                    first_name VARCHAR(80),
                    last_name VARCHAR(80),
                    role VARCHAR(20) NOT NULL DEFAULT 'user',
                    branch_id VARCHAR(10),
                    branch_name VARCHAR(100),
                    default_branch_id VARCHAR(10),
                    active BOOLEAN DEFAULT TRUE,
                    must_change_password BOOLEAN DEFAULT FALSE,
                    last_login TIMESTAMP NULL,
                    permissions TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_username (username),
                    INDEX idx_email (email),
                    INDEX idx_role (role),
                    INDEX idx_active (active),
                    INDEX idx_branch_id (branch_id)
                )
            ''',
            
            # 4. User Sessions for security tracking
            'user_sessions': '''
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    session_token VARCHAR(256) NOT NULL,
                    branch_id VARCHAR(10),
                    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    logout_time TIMESTAMP NULL,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    active BOOLEAN DEFAULT TRUE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_session_token (session_token),
                    INDEX idx_user_id (user_id),
                    INDEX idx_active (active)
                )
            ''',
            
            # 5. Password Reset Tokens
            'password_reset_tokens': '''
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    token VARCHAR(256) NOT NULL UNIQUE,
                    expires_at TIMESTAMP NOT NULL,
                    used BOOLEAN DEFAULT FALSE,
                    created_by INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                    INDEX idx_token (token),
                    INDEX idx_expires_at (expires_at)
                )
            ''',
            
            # 6. GRPO Documents
            'grpo_documents': '''
                CREATE TABLE IF NOT EXISTS grpo_documents (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    po_number VARCHAR(20) NOT NULL,
                    sap_document_number VARCHAR(20),
                    supplier_code VARCHAR(50),
                    supplier_name VARCHAR(200),
                    po_date TIMESTAMP NULL,
                    po_total DECIMAL(15,4),
                    status VARCHAR(20) DEFAULT 'draft',
                    user_id INT NOT NULL,
                    qc_user_id INT,
                    qc_approved_at TIMESTAMP NULL,
                    qc_notes TEXT,
                    notes TEXT,
                    draft_or_post VARCHAR(10) DEFAULT 'draft',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (qc_user_id) REFERENCES users(id),
                    INDEX idx_po_number (po_number),
                    INDEX idx_status (status),
                    INDEX idx_user_id (user_id),
                    INDEX idx_created_at (created_at)
                )
            ''',
            
            # 7. GRPO Items
            'grpo_items': '''
                CREATE TABLE IF NOT EXISTS grpo_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    grpo_document_id INT NOT NULL,
                    po_line_number INT,
                    item_code VARCHAR(50) NOT NULL,
                    item_name VARCHAR(200) NOT NULL,
                    po_quantity DECIMAL(15,4),
                    open_quantity DECIMAL(15,4),
                    received_quantity DECIMAL(15,4) NOT NULL,
                    unit_of_measure VARCHAR(10) NOT NULL,
                    unit_price DECIMAL(15,4),
                    bin_location VARCHAR(20) NOT NULL,
                    batch_number VARCHAR(50),
                    serial_number VARCHAR(50),
                    expiration_date TIMESTAMP NULL,
                    supplier_barcode VARCHAR(100),
                    generated_barcode VARCHAR(100),
                    barcode_printed BOOLEAN DEFAULT FALSE,
                    qc_status VARCHAR(20) DEFAULT 'pending',
                    qc_notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (grpo_document_id) REFERENCES grpo_documents(id) ON DELETE CASCADE,
                    INDEX idx_grpo_document_id (grpo_document_id),
                    INDEX idx_item_code (item_code),
                    INDEX idx_qc_status (qc_status)
                )
            ''',
            
            # 8. Inventory Transfers
            'inventory_transfers': '''
                CREATE TABLE IF NOT EXISTS inventory_transfers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    transfer_request_number VARCHAR(20) NOT NULL,
                    sap_document_number VARCHAR(20),
                    status VARCHAR(20) DEFAULT 'draft',
                    user_id INT NOT NULL,
                    qc_approver_id INT,
                    qc_approved_at TIMESTAMP NULL,
                    qc_notes TEXT,
                    from_warehouse VARCHAR(20),
                    to_warehouse VARCHAR(20),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (qc_approver_id) REFERENCES users(id),
                    INDEX idx_transfer_request_number (transfer_request_number),
                    INDEX idx_status (status),
                    INDEX idx_user_id (user_id),
                    INDEX idx_created_at (created_at)
                )
            ''',
            
            # 9. Inventory Transfer Items
            'inventory_transfer_items': '''
                CREATE TABLE IF NOT EXISTS inventory_transfer_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    inventory_transfer_id INT NOT NULL,
                    item_code VARCHAR(50) NOT NULL,
                    item_name VARCHAR(200) NOT NULL,
                    quantity DECIMAL(15,4) NOT NULL,
                    requested_quantity DECIMAL(15,4) NOT NULL,
                    transferred_quantity DECIMAL(15,4) DEFAULT 0,
                    remaining_quantity DECIMAL(15,4) NOT NULL,
                    unit_of_measure VARCHAR(10) NOT NULL,
                    from_bin VARCHAR(20),
                    to_bin VARCHAR(20),
                    from_bin_location VARCHAR(50),
                    to_bin_location VARCHAR(50),
                    batch_number VARCHAR(50),
                    available_batches TEXT,
                    qc_status VARCHAR(20) DEFAULT 'pending',
                    qc_notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (inventory_transfer_id) REFERENCES inventory_transfers(id) ON DELETE CASCADE,
                    INDEX idx_inventory_transfer_id (inventory_transfer_id),
                    INDEX idx_item_code (item_code),
                    INDEX idx_qc_status (qc_status)
                )
            ''',
            
            # 10. Serial Number Transfers (Enhanced)
            'serial_number_transfers': '''
                CREATE TABLE IF NOT EXISTS serial_number_transfers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    transfer_number VARCHAR(50) NOT NULL UNIQUE,
                    sap_document_number VARCHAR(50),
                    status VARCHAR(20) DEFAULT 'draft',
                    user_id INT NOT NULL,
                    qc_approver_id INT,
                    qc_approved_at TIMESTAMP NULL,
                    qc_notes TEXT,
                    from_warehouse VARCHAR(10) NOT NULL,
                    to_warehouse VARCHAR(10) NOT NULL,
                    priority VARCHAR(10) DEFAULT 'normal',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (qc_approver_id) REFERENCES users(id),
                    INDEX idx_transfer_number (transfer_number),
                    INDEX idx_status (status),
                    INDEX idx_user_id (user_id),
                    INDEX idx_from_warehouse (from_warehouse),
                    INDEX idx_to_warehouse (to_warehouse),
                    INDEX idx_created_at (created_at)
                )
            ''',
            
            # 11. Serial Number Transfer Items (Enhanced with Duplication Prevention)
            'serial_number_transfer_items': '''
                CREATE TABLE IF NOT EXISTS serial_number_transfer_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    serial_transfer_id INT NOT NULL,
                    item_code VARCHAR(50) NOT NULL,
                    item_name VARCHAR(200),
                    unit_of_measure VARCHAR(10) DEFAULT 'EA',
                    from_warehouse_code VARCHAR(10) NOT NULL,
                    to_warehouse_code VARCHAR(10) NOT NULL,
                    qc_status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (serial_transfer_id) REFERENCES serial_number_transfers(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_item_per_transfer (serial_transfer_id, item_code),
                    INDEX idx_serial_transfer_id (serial_transfer_id),
                    INDEX idx_item_code (item_code),
                    INDEX idx_qc_status (qc_status)
                )
            ''',
            
            # 12. Serial Number Transfer Serials (Enhanced with Performance Optimizations)
            'serial_number_transfer_serials': '''
                CREATE TABLE IF NOT EXISTS serial_number_transfer_serials (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    transfer_item_id INT NOT NULL,
                    serial_number VARCHAR(100) NOT NULL,
                    internal_serial_number VARCHAR(100) NOT NULL,
                    system_serial_number INT,
                    is_validated BOOLEAN DEFAULT FALSE,
                    validation_error TEXT,
                    manufacturing_date DATE,
                    expiry_date DATE,
                    admission_date DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (transfer_item_id) REFERENCES serial_number_transfer_items(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_serial_per_item (transfer_item_id, serial_number),
                    INDEX idx_transfer_item_id (transfer_item_id),
                    INDEX idx_serial_number (serial_number),
                    INDEX idx_is_validated (is_validated),
                    INDEX idx_internal_serial_number (internal_serial_number)
                )
            ''',
            
            # 13. Pick Lists (SAP B1 Compatible)
            'pick_lists': '''
                CREATE TABLE IF NOT EXISTS pick_lists (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    absolute_entry INT,
                    name VARCHAR(50) NOT NULL,
                    owner_code INT,
                    owner_name VARCHAR(100),
                    pick_date TIMESTAMP NULL,
                    remarks TEXT,
                    status VARCHAR(20) DEFAULT 'pending',
                    object_type VARCHAR(10) DEFAULT '156',
                    use_base_units VARCHAR(5) DEFAULT 'tNO',
                    sales_order_number VARCHAR(20),
                    pick_list_number VARCHAR(20),
                    user_id INT NOT NULL,
                    approver_id INT,
                    priority VARCHAR(10) DEFAULT 'normal',
                    warehouse_code VARCHAR(10),
                    customer_code VARCHAR(20),
                    customer_name VARCHAR(100),
                    total_items INT DEFAULT 0,
                    picked_items INT DEFAULT 0,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (approver_id) REFERENCES users(id),
                    INDEX idx_name (name),
                    INDEX idx_status (status),
                    INDEX idx_user_id (user_id),
                    INDEX idx_absolute_entry (absolute_entry)
                )
            ''',
            
            # 14. Serial Item Transfers (New Module - Serial-driven transfers)
            'serial_item_transfers': '''
                CREATE TABLE IF NOT EXISTS serial_item_transfers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    transfer_number VARCHAR(50) NOT NULL UNIQUE,
                    sap_document_number VARCHAR(50),
                    status VARCHAR(20) DEFAULT 'draft',
                    user_id INT NOT NULL,
                    qc_approver_id INT,
                    qc_approved_at TIMESTAMP NULL,
                    qc_notes TEXT,
                    from_warehouse VARCHAR(10) NOT NULL,
                    to_warehouse VARCHAR(10) NOT NULL,
                    priority VARCHAR(10) DEFAULT 'normal',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
                    FOREIGN KEY (qc_approver_id) REFERENCES users(id) ON DELETE SET NULL,
                    INDEX idx_transfer_number (transfer_number),
                    INDEX idx_status (status),
                    INDEX idx_user_id (user_id),
                    INDEX idx_qc_approver_id (qc_approver_id),
                    INDEX idx_from_warehouse (from_warehouse),
                    INDEX idx_to_warehouse (to_warehouse),
                    INDEX idx_priority (priority),
                    INDEX idx_created_at (created_at)
                )
            ''',
            
            # 15. Serial Item Transfer Items (Auto-populated from SAP B1 validation)
            'serial_item_transfer_items': '''
                CREATE TABLE IF NOT EXISTS serial_item_transfer_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    serial_item_transfer_id INT NOT NULL,
                    serial_number VARCHAR(100) NOT NULL,
                    item_code VARCHAR(50) NOT NULL,
                    item_description VARCHAR(200) NOT NULL,
                    warehouse_code VARCHAR(10) NOT NULL,
                    quantity INT DEFAULT 1,
                    unit_of_measure VARCHAR(10) DEFAULT 'EA',
                    from_warehouse_code VARCHAR(10) NOT NULL,
                    to_warehouse_code VARCHAR(10) NOT NULL,
                    qc_status VARCHAR(20) DEFAULT 'pending',
                    validation_status VARCHAR(20) DEFAULT 'pending',
                    validation_error TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (serial_item_transfer_id) REFERENCES serial_item_transfers(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_serial_per_transfer (serial_item_transfer_id, serial_number),
                    INDEX idx_serial_item_transfer_id (serial_item_transfer_id),
                    INDEX idx_serial_number (serial_number),
                    INDEX idx_item_code (item_code),
                    INDEX idx_warehouse_code (warehouse_code),
                    INDEX idx_qc_status (qc_status),
                    INDEX idx_validation_status (validation_status),
                    INDEX idx_from_warehouse_code (from_warehouse_code),
                    INDEX idx_to_warehouse_code (to_warehouse_code)
                )
            ''',
            
            # 13. Pick Lists (SAP B1 Compatible)
            'pick_lists': '''
                CREATE TABLE IF NOT EXISTS pick_lists (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    absolute_entry INT,
                    name VARCHAR(50) NOT NULL,
                    owner_code INT,
                    owner_name VARCHAR(100),
                    pick_date TIMESTAMP NULL,
                    remarks TEXT,
                    status VARCHAR(20) DEFAULT 'pending',
                    object_type VARCHAR(10) DEFAULT '156',
                    use_base_units VARCHAR(5) DEFAULT 'tNO',
                    sales_order_number VARCHAR(20),
                    pick_list_number VARCHAR(20),
                    user_id INT NOT NULL,
                    approver_id INT,
                    priority VARCHAR(10) DEFAULT 'normal',
                    warehouse_code VARCHAR(10),
                    customer_code VARCHAR(20),
                    customer_name VARCHAR(100),
                    total_items INT DEFAULT 0,
                    picked_items INT DEFAULT 0,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (approver_id) REFERENCES users(id),
                    INDEX idx_name (name),
                    INDEX idx_status (status),
                    INDEX idx_user_id (user_id),
                    INDEX idx_absolute_entry (absolute_entry)
                )
            ''',
            
            # Additional tables for comprehensive WMS functionality...
            # (Continuing with other essential tables)
            
            # 14. Bin Locations
            'bin_locations': '''
                CREATE TABLE IF NOT EXISTS bin_locations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    bin_code VARCHAR(100) UNIQUE NOT NULL,
                    warehouse_code VARCHAR(50) NOT NULL,
                    description VARCHAR(255),
                    active BOOLEAN DEFAULT TRUE,
                    is_system_bin BOOLEAN DEFAULT FALSE,
                    sap_abs_entry INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_bin_code (bin_code),
                    INDEX idx_warehouse_code (warehouse_code),
                    INDEX idx_active (active)
                )
            ''',
            
            # 15. Bin Items
            'bin_items': '''
                CREATE TABLE IF NOT EXISTS bin_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    bin_code VARCHAR(100) NOT NULL,
                    item_code VARCHAR(100) NOT NULL,
                    item_name VARCHAR(255),
                    batch_number VARCHAR(100),
                    quantity DECIMAL(15,4) DEFAULT 0,
                    available_quantity DECIMAL(15,4) DEFAULT 0,
                    committed_quantity DECIMAL(15,4) DEFAULT 0,
                    uom VARCHAR(20) DEFAULT 'EA',
                    expiry_date DATE,
                    manufacturing_date DATE,
                    admission_date DATE,
                    warehouse_code VARCHAR(50),
                    sap_abs_entry INT,
                    sap_system_number INT,
                    sap_doc_entry INT,
                    batch_attribute1 VARCHAR(100),
                    batch_attribute2 VARCHAR(100),
                    batch_status VARCHAR(50) DEFAULT 'bdsStatus_Released',
                    last_sap_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (bin_code) REFERENCES bin_locations(bin_code),
                    INDEX idx_bin_code (bin_code),
                    INDEX idx_item_code (item_code),
                    INDEX idx_batch_number (batch_number),
                    INDEX idx_warehouse_code (warehouse_code)
                )
            '''
        }
        
        logger.info("Creating database tables...")
        for table_name, create_sql in tables.items():
            try:
                self.cursor.execute(create_sql)
                logger.info(f"✅ Created table: {table_name}")
            except Exception as e:
                logger.error(f"❌ Failed to create table {table_name}: {e}")
                raise
        
        self.connection.commit()
        logger.info("✅ All tables created successfully")
    
    def insert_default_data(self):
        """Insert default data including enhanced configurations"""
        
        logger.info("Inserting default data...")
        
        # 1. Document Number Series
        document_series = [
            ('GRPO', 'GRPO-', 1, True),
            ('TRANSFER', 'TR-', 1, True),
            ('SERIAL_TRANSFER', 'STR-', 1, True),
            ('PICKLIST', 'PL-', 1, True)
        ]
        
        for series in document_series:
            try:
                self.cursor.execute('''
                    INSERT IGNORE INTO document_number_series 
                    (document_type, prefix, current_number, year_suffix)
                    VALUES (%s, %s, %s, %s)
                ''', series)
            except Exception as e:
                logger.warning(f"Document series {series[0]} might already exist: {e}")
        
        # 2. Default Branch
        try:
            self.cursor.execute('''
                INSERT IGNORE INTO branches 
                (id, name, description, branch_code, branch_name, address, phone, email, manager_name, active, is_default)
                VALUES ('BR001', 'Main Branch', 'Main Office Branch', 'BR001', 'Main Branch', 'Main Office', '123-456-7890', 'main@company.com', 'Branch Manager', TRUE, TRUE)
            ''')
        except Exception as e:
            logger.warning(f"Default branch might already exist: {e}")
        
        # 3. Default Users with Enhanced Roles
        users = [
            ('admin', 'admin@company.com', generate_password_hash('admin123'), 'System', 'Administrator', 'admin', 'BR001', 'Main Branch', 'BR001', True, False),
            ('manager', 'manager@company.com', generate_password_hash('manager123'), 'Branch', 'Manager', 'manager', 'BR001', 'Main Branch', 'BR001', True, False),
            ('qc', 'qc@company.com', generate_password_hash('qc123'), 'Quality', 'Controller', 'qc', 'BR001', 'Main Branch', 'BR001', True, False),
            ('user', 'user@company.com', generate_password_hash('user123'), 'Test', 'User', 'user', 'BR001', 'Main Branch', 'BR001', True, False)
        ]
        
        for user in users:
            try:
                self.cursor.execute('''
                    INSERT IGNORE INTO users 
                    (username, email, password_hash, first_name, last_name, role, branch_id, branch_name, default_branch_id, active, must_change_password)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ''', user)
            except Exception as e:
                logger.warning(f"User {user[0]} might already exist: {e}")
        
        self.connection.commit()
        logger.info("✅ Default data inserted successfully")
    
    def create_performance_indexes(self):
        """Create additional performance indexes for optimal query performance"""
        
        logger.info("Creating performance indexes...")
        
        indexes = [
            # Serial Number Transfer Performance Indexes
            "CREATE INDEX IF NOT EXISTS idx_serial_transfers_status_user ON serial_number_transfers(status, user_id)",
            "CREATE INDEX IF NOT EXISTS idx_serial_transfers_warehouses ON serial_number_transfers(from_warehouse, to_warehouse)",
            "CREATE INDEX IF NOT EXISTS idx_serial_items_transfer_item ON serial_number_transfer_items(serial_transfer_id, item_code)",
            "CREATE INDEX IF NOT EXISTS idx_serial_serials_validation ON serial_number_transfer_serials(is_validated, transfer_item_id)",
            
            # GRPO Performance Indexes
            "CREATE INDEX IF NOT EXISTS idx_grpo_status_user ON grpo_documents(status, user_id)",
            "CREATE INDEX IF NOT EXISTS idx_grpo_items_document ON grpo_items(grpo_document_id, qc_status)",
            
            # Inventory Transfer Performance Indexes
            "CREATE INDEX IF NOT EXISTS idx_inv_transfer_status_user ON inventory_transfers(status, user_id)",
            "CREATE INDEX IF NOT EXISTS idx_inv_items_transfer ON inventory_transfer_items(inventory_transfer_id, qc_status)",
            
            # User and Session Performance Indexes
            "CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, active)",
            "CREATE INDEX IF NOT EXISTS idx_password_tokens_valid ON password_reset_tokens(token, expires_at, used)",
            
            # Bin and Item Performance Indexes
            "CREATE INDEX IF NOT EXISTS idx_bin_items_location_item ON bin_items(bin_code, item_code)",
            "CREATE INDEX IF NOT EXISTS idx_bin_items_warehouse_batch ON bin_items(warehouse_code, batch_number)",
        ]
        
        for index_sql in indexes:
            try:
                self.cursor.execute(index_sql)
                logger.info(f"✅ Created performance index")
            except Exception as e:
                logger.warning(f"Index might already exist: {e}")
        
        self.connection.commit()
        logger.info("✅ Performance indexes created successfully")
    
    def create_env_file(self, config):
        """Create .env file with database configuration"""
        
        logger.info("Creating .env configuration file...")
        
        env_content = f'''# WMS Database Configuration - Generated by MySQL Migration
# Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

# MySQL Database Configuration (Primary)
MYSQL_HOST={config['host']}
MYSQL_PORT={config['port']}
MYSQL_USER={config['user']}
MYSQL_PASSWORD={config['password']}
MYSQL_DATABASE={config['database']}

# Alternative DATABASE_URL format
DATABASE_URL=mysql+pymysql://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}

# Session Configuration
SESSION_SECRET=your-secret-key-change-in-production

# SAP B1 Configuration (Update with your SAP server details)
SAP_B1_SERVER=https://192.168.1.5:50000
SAP_B1_USERNAME=manager
SAP_B1_PASSWORD=1422
SAP_B1_COMPANY_DB=EINV-TESTDB-LIVE-HUST

# Application Settings
FLASK_ENV=development
FLASK_DEBUG=True

# Enhanced Performance Settings
BATCH_SIZE=50
MAX_SERIAL_NUMBERS_PER_BATCH=50
ENABLE_QUERY_LOGGING=False
'''
        
        try:
            with open('.env', 'w') as f:
                f.write(env_content)
            logger.info("✅ .env file created successfully")
        except Exception as e:
            logger.error(f"❌ Failed to create .env file: {e}")
    
    def run_migration(self):
        """Run complete migration process"""
        
        logger.info("🚀 Starting Complete WMS MySQL Migration - Latest Version")
        logger.info("=" * 60)
        
        try:
            # Get configuration
            config = self.get_database_config()
            
            # Connect to database
            if not self.connect(config):
                return False
            
            # Run migration steps
            self.create_tables()
            self.insert_default_data()
            self.create_performance_indexes()
            self.create_env_file(config)
            
            logger.info("=" * 60)
            logger.info("✅ MIGRATION COMPLETED SUCCESSFULLY!")
            logger.info("=" * 60)
            logger.info("🔑 DEFAULT LOGIN CREDENTIALS:")
            logger.info("   Admin: admin / admin123")
            logger.info("   Manager: manager / manager123") 
            logger.info("   QC: qc / qc123")
            logger.info("   User: user / user123")
            logger.info("=" * 60)
            logger.info("📊 ENHANCED FEATURES INCLUDED:")
            logger.info("   ✅ Serial Number Transfer with duplicate prevention")
            logger.info("   ✅ QC Approval workflow with proper status transitions")
            logger.info("   ✅ Performance optimizations for 1000+ item validation")
            logger.info("   ✅ Comprehensive indexing for optimal performance")
            logger.info("   ✅ Database constraints to prevent data corruption")
            logger.info("=" * 60)
            logger.info("🚀 NEXT STEPS:")
            logger.info("   1. Start your Flask application: python main.py")
            logger.info("   2. Access the WMS at: http://localhost:5000")
            logger.info("   3. Test Serial Number Transfer functionality")
            logger.info("   4. Verify QC Dashboard and approval workflow")
            logger.info("=" * 60)
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            return False
        
        finally:
            if self.connection:
                self.connection.close()

def main():
    """Main function"""
    migration = MySQLMigration()
    success = migration.run_migration()
    
    if success:
        print("\n🎉 Migration completed successfully!")
        print("Your WMS database is ready with all latest enhancements!")
    else:
        print("\n❌ Migration failed. Please check the error messages above.")
        sys.exit(1)

if __name__ == "__main__":
    main()