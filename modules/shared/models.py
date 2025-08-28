"""
Shared Models for WMS Application
Contains common models used across modules
"""
from app import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User(UserMixin, db.Model):
    """User model for authentication and authorization"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    role = db.Column(db.String(20), default='user')  # admin, manager, user, qc
    branch_code = db.Column(db.String(10))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, password):
        """Set password hash"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)

    def has_permission(self, permission):
        """Check if user has specific permission"""
        role_permissions = {
            'admin': ['dashboard', 'grpo', 'inventory_transfer', 'pick_list', 'inventory_counting', 'qc_dashboard', 'barcode_labels'],
            'manager': ['dashboard', 'grpo', 'inventory_transfer', 'pick_list', 'inventory_counting', 'qc_dashboard', 'barcode_labels'],
            'qc': ['dashboard', 'qc_dashboard', 'barcode_labels'],
            'user': ['dashboard', 'grpo', 'inventory_transfer', 'pick_list', 'inventory_counting', 'barcode_labels']
        }
        return permission in role_permissions.get(self.role, [])

class Warehouse(db.Model):
    """Warehouse master data"""
    id = db.Column(db.Integer, primary_key=True)
    warehouse_code = db.Column(db.String(10), unique=True, nullable=False)
    warehouse_name = db.Column(db.String(100), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class BinLocation(db.Model):
    """Bin location master data"""
    id = db.Column(db.Integer, primary_key=True)
    warehouse_code = db.Column(db.String(10), nullable=False)
    bin_code = db.Column(db.String(20), nullable=False)
    bin_name = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class BusinessPartner(db.Model):
    """Business partner (supplier/customer) master data"""
    id = db.Column(db.Integer, primary_key=True)
    card_code = db.Column(db.String(20), unique=True, nullable=False)
    card_name = db.Column(db.String(100), nullable=False)
    card_type = db.Column(db.String(10))  # Supplier, Customer
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)