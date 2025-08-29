#!/usr/bin/env python3
"""
MySQL Migration: Add BPL columns to invoice_documents table
Adds bpl_id and bpl_name columns to existing invoice_documents table
Run: python mysql_add_bpl_columns_migration.py
"""

import os
import sys
import logging
import pymysql
from pymysql.cursors import DictCursor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BPLColumnsMigration:
    def __init__(self):
        self.connection = None
        
    def get_mysql_config(self):
        """Get MySQL configuration interactively or from environment"""
        print("=== MySQL Configuration ===")
        config = {
            'host': os.getenv('MYSQL_HOST') or input("MySQL Host (localhost): ").strip() or 'localhost',
            'port': int(os.getenv('MYSQL_PORT') or input("MySQL Port (3306): ").strip() or '3306'),
            'user': os.getenv('MYSQL_USER') or input("MySQL Username: ").strip(),
            'password': os.getenv('MYSQL_PASSWORD') or input("MySQL Password: ").strip(),
            'database': os.getenv('MYSQL_DATABASE') or input("Database Name (wms_db_dev): ").strip() or 'wms_db_dev',
            'charset': 'utf8mb4',
            'autocommit': False
        }
        return config
    
    def connect(self, config):
        """Connect to MySQL database"""
        try:
            self.connection = pymysql.connect(
                host=config['host'],
                port=config['port'], 
                user=config['user'],
                password=config['password'],
                database=config['database'],
                charset=config['charset'],
                cursorclass=DictCursor,
                autocommit=config['autocommit']
            )
            logger.info(f"✅ Connected to MySQL: {config['database']} at {config['host']}:{config['port']}")
            return True
        except Exception as e:
            logger.error(f"❌ MySQL connection failed: {e}")
            return False
    
    def execute_query(self, query, params=None):
        """Execute query with error handling"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()
        except Exception as e:
            logger.error(f"❌ Query execution failed: {e}")
            raise
    
    def column_exists(self, table_name, column_name):
        """Check if column exists in table"""
        try:
            query = """
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = %s 
                AND COLUMN_NAME = %s
            """
            result = self.execute_query(query, (table_name, column_name))
            return result[0]['count'] > 0
        except Exception as e:
            logger.error(f"❌ Error checking column existence: {e}")
            return False
    
    def add_bpl_columns(self):
        """Add bpl_id and bpl_name columns to invoice_documents table"""
        try:
            logger.info("🔍 Checking for existing BPL columns...")
            
            # Check if invoice_documents table exists
            table_exists_query = """
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'invoice_documents'
            """
            result = self.execute_query(table_exists_query)
            if result[0]['count'] == 0:
                logger.warning("⚠️ invoice_documents table does not exist. Creating it first...")
                self.create_invoice_documents_table()
            
            # Check and add bpl_id column
            if not self.column_exists('invoice_documents', 'bpl_id'):
                logger.info("➕ Adding bpl_id column...")
                add_bpl_id_query = """
                    ALTER TABLE invoice_documents 
                    ADD COLUMN bpl_id INT AFTER branch_name
                """
                self.execute_query(add_bpl_id_query)
                logger.info("✅ bpl_id column added successfully")
            else:
                logger.info("ℹ️ bpl_id column already exists")
            
            # Check and add bpl_name column
            if not self.column_exists('invoice_documents', 'bpl_name'):
                logger.info("➕ Adding bpl_name column...")
                add_bpl_name_query = """
                    ALTER TABLE invoice_documents 
                    ADD COLUMN bpl_name VARCHAR(100) AFTER bpl_id
                """
                self.execute_query(add_bpl_name_query)
                logger.info("✅ bpl_name column added successfully")
            else:
                logger.info("ℹ️ bpl_name column already exists")
            
            # Add index for bpl_id if it doesn't exist
            try:
                index_query = """
                    SELECT COUNT(*) as count
                    FROM INFORMATION_SCHEMA.STATISTICS 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = 'invoice_documents' 
                    AND INDEX_NAME = 'idx_bpl_id'
                """
                result = self.execute_query(index_query)
                if result[0]['count'] == 0:
                    logger.info("➕ Adding index for bpl_id...")
                    add_index_query = """
                        ALTER TABLE invoice_documents 
                        ADD INDEX idx_bpl_id (bpl_id)
                    """
                    self.execute_query(add_index_query)
                    logger.info("✅ Index for bpl_id added successfully")
                else:
                    logger.info("ℹ️ Index for bpl_id already exists")
            except Exception as e:
                logger.warning(f"⚠️ Could not add index for bpl_id: {e}")
            
            self.connection.commit()
            logger.info("✅ BPL columns migration completed successfully")
            
        except Exception as e:
            logger.error(f"❌ Error adding BPL columns: {e}")
            self.connection.rollback()
            raise
    
    def create_invoice_documents_table(self):
        """Create invoice_documents table if it doesn't exist"""
        create_table_query = """
            CREATE TABLE IF NOT EXISTS invoice_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                invoice_number VARCHAR(50) UNIQUE,
                customer_code VARCHAR(20),
                customer_name VARCHAR(200),
                branch_id VARCHAR(10),
                branch_name VARCHAR(100),
                bpl_id INT,
                bpl_name VARCHAR(100),
                user_id INT NOT NULL,
                status VARCHAR(20) DEFAULT 'draft',
                doc_date DATE,
                due_date DATE,
                total_amount DECIMAL(15,2),
                sap_doc_entry INT,
                sap_doc_num VARCHAR(50),
                notes TEXT,
                json_payload JSON,
                sap_response TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_invoice_number (invoice_number),
                INDEX idx_customer_code (customer_code),
                INDEX idx_status (status),
                INDEX idx_user_id (user_id),
                INDEX idx_branch_id (branch_id),
                INDEX idx_bpl_id (bpl_id),
                INDEX idx_doc_date (doc_date),
                INDEX idx_sap_doc_entry (sap_doc_entry),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
        self.execute_query(create_table_query)
        logger.info("✅ invoice_documents table created successfully")
    
    def verify_migration(self):
        """Verify that the migration was successful"""
        try:
            logger.info("🔍 Verifying migration...")
            
            # Check table structure
            describe_query = "DESCRIBE invoice_documents"
            columns = self.execute_query(describe_query)
            
            column_names = [col['Field'] for col in columns]
            
            if 'bpl_id' in column_names and 'bpl_name' in column_names:
                logger.info("✅ Migration verification successful - BPL columns found")
                
                # Show the table structure
                logger.info("📋 Current invoice_documents table structure:")
                for col in columns:
                    logger.info(f"   {col['Field']} - {col['Type']} - {col['Null']} - {col['Key']}")
                
                return True
            else:
                logger.error("❌ Migration verification failed - BPL columns not found")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error verifying migration: {e}")
            return False
    
    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            logger.info("✅ Database connection closed")

def main():
    """Main migration function"""
    print("🚀 Starting BPL Columns Migration for Invoice Documents")
    print("=" * 60)
    
    migration = BPLColumnsMigration()
    
    try:
        # Get configuration and connect
        config = migration.get_mysql_config()
        if not migration.connect(config):
            print("❌ Failed to connect to MySQL. Exiting.")
            return False
        
        # Perform migration
        migration.add_bpl_columns()
        
        # Verify migration
        if migration.verify_migration():
            print("\n✅ BPL Columns Migration completed successfully!")
            print("The invoice_documents table now has bpl_id and bpl_name columns.")
            return True
        else:
            print("\n❌ Migration verification failed!")
            return False
            
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        return False
    finally:
        migration.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)