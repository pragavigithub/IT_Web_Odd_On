"""
Invoice Creation Routes
Handles invoice creation workflow including serial number lookup and SAP integration
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from app import db
from modules.invoice_creation.models import InvoiceDocument, InvoiceLine, InvoiceSerialNumber, SerialNumberLookup
from sap_integration import SAPIntegration
import logging
import json
from datetime import datetime, timedelta

invoice_bp = Blueprint('invoice_creation', __name__, url_prefix='/invoice_creation')

@invoice_bp.route('/')
@login_required
def index():
    """Invoice creation main page - list all invoices for current user"""
    if not current_user.has_permission('invoice_creation'):
        flash('Access denied - Invoice Creation permissions required', 'error')
        return redirect(url_for('dashboard'))
    
    invoices = InvoiceDocument.query.filter_by(user_id=current_user.id).order_by(InvoiceDocument.created_at.desc()).all()
    return render_template('invoice_creation/index.html', invoices=invoices)

@invoice_bp.route('/create', methods=['GET', 'POST'])
@login_required
def create():
    """Create new invoice page and handle creation"""
    if not current_user.has_permission('invoice_creation'):
        flash('Access denied - Invoice Creation permissions required', 'error')
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        try:
            # Handle JSON data from the new interface
            if request.is_json:
                data = request.get_json()
                customer_code = data.get('customer_code')
                invoice_date = data.get('invoice_date')
                serial_items = data.get('serial_items', [])
                
                if not customer_code:
                    return jsonify({'success': False, 'error': 'Please select a customer'}), 400
                
                if not serial_items:
                    return jsonify({'success': False, 'error': 'Please add at least one serial item'}), 400
                
                # Create invoice document
                invoice = InvoiceDocument()
                invoice.user_id = current_user.id
                invoice.customer_code = customer_code
                invoice.doc_date = datetime.strptime(invoice_date, '%Y-%m-%d').date() if invoice_date else datetime.now().date()
                invoice.status = 'draft'
                invoice.total_amount = 0.0
                
                db.session.add(invoice)
                db.session.flush()  # Get the invoice ID
                
                # Add invoice items
                total_amount = 0.0
                for item_data in serial_items:
                    # Store serial number lookup data first
                    serial_lookup = SerialNumberLookup()
                    serial_lookup.serial_number = item_data.get('serial_number')
                    serial_lookup.item_code = item_data.get('item_code')
                    serial_lookup.item_name = item_data.get('item_name')
                    serial_lookup.warehouse_code = item_data.get('warehouse')
                    serial_lookup.lookup_status = 'validated'
                    serial_lookup.sap_response = json.dumps(item_data)
                    serial_lookup.last_updated = datetime.utcnow()
                    db.session.add(serial_lookup)
                
                db.session.commit()
                
                return jsonify({
                    'success': True, 
                    'message': 'Invoice created successfully',
                    'invoice_id': invoice.id
                })
                
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error creating invoice: {str(e)}")
            if request.is_json:
                return jsonify({'success': False, 'error': f'Error creating invoice: {str(e)}'}), 500
            else:
                flash(f'Error creating invoice: {str(e)}', 'error')
    
    return render_template('invoice_creation/create.html')

@invoice_bp.route('/detail/<int:invoice_id>')
@login_required
def detail(invoice_id):
    """Invoice detail page"""
    invoice = InvoiceDocument.query.get_or_404(invoice_id)
    
    # Check permissions
    if invoice.user_id != current_user.id and current_user.role not in ['admin', 'manager']:
        flash('Access denied - You can only view your own invoices', 'error')
        return redirect(url_for('invoice_creation.index'))
    
    return render_template('invoice_creation/detail.html', invoice=invoice)

@invoice_bp.route('/api/business-partners')
@login_required
def get_business_partners():
    """API endpoint to get business partners from SAP B1"""
    try:
        sap = SAPIntegration()
        if not sap.ensure_logged_in():
            return jsonify({
                'success': False,
                'error': 'SAP connection failed'
            }), 500
        
        try:
            # Get all business partners with proper header for unlimited results
            url = f"{sap.base_url}/b1s/v1/BusinessPartners?$select=CardCode,CardName"
            headers = {"Prefer": "odata.pagemaxsize=0"}
            response = sap.session.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                business_partners = data.get('value', [])
                return jsonify({
                    'success': True,
                    'business_partners': business_partners
                })
            else:
                return jsonify({
                    'success': False,
                    'error': f'SAP API error: {response.status_code}'
                }), 500
        except Exception as e:
            logging.error(f"Error fetching business partners: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'Request failed: {str(e)}'
            }), 500
    except Exception as e:
        logging.error(f"Business partners API error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@invoice_bp.route('/api/validate-serial-number')
@login_required
def validate_serial_number():
    """API endpoint to validate serial number and fetch item details from SAP B1"""
    serial_number = request.args.get('serial_number', '').strip()
    
    if not serial_number:
        return jsonify({
            'success': False,
            'error': 'Serial number is required'
        }), 400
    
    try:
        sap = SAPIntegration()
        if not sap.ensure_logged_in():
            return jsonify({
                'success': False,
                'error': 'SAP connection failed'
            }), 500
        
        try:
            # Use SAP SQL Query for Invoice Creation serial number validation (Note: SAP query name is 'Invoise_creation')
            url = f"{sap.base_url}/b1s/v1/SQLQueries('Invoise_creation')/List"
            payload = {
                "ParamList": f"serial_number='{serial_number}'"
            }
            
            response = sap.session.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('value', [])
                
                if results:
                    # Return the first result with item details
                    item_data = results[0]
                    return jsonify({
                        'success': True,
                        'item_data': {
                            'ItemCode': item_data.get('ItemCode', ''),
                            'ItemName': item_data.get('itemName', ''),
                            'DistNumber': item_data.get('DistNumber', ''),
                            'WhsCode': item_data.get('WhsCode', ''),
                            'WhsName': item_data.get('WhsName', ''),
                            'BPLName': item_data.get('BPLName', ''),
                            'BPLid': item_data.get('BPLid', '')
                        }
                    })
                else:
                    return jsonify({
                        'success': False,
                        'error': 'Serial number not found or has no available quantity'
                    })
            else:
                return jsonify({
                    'success': False,
                    'error': f'SAP API error: {response.status_code} - {response.text}'
                }), 500
                
        except Exception as e:
            logging.error(f"Error validating serial number: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'Validation request failed: {str(e)}'
            }), 500
    except Exception as e:
        logging.error(f"Serial number validation API error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@invoice_bp.route('/api/lookup_serial', methods=['POST'])
@login_required
def lookup_serial():
    """API endpoint to lookup serial number details from SAP"""
    try:
        data = request.get_json()
        serial_number = data.get('serial_number', '').strip()
        
        if not serial_number:
            return jsonify({
                'success': False,
                'message': 'Serial number is required'
            }), 400
        
        logging.info(f"🔍 Looking up serial number: {serial_number}")
        
        # Check cache first
        cached_lookup = SerialNumberLookup.query.filter_by(serial_number=serial_number).first()
        if cached_lookup and (datetime.utcnow() - cached_lookup.last_updated) < timedelta(hours=1):
            logging.info(f"✅ Found cached data for serial number: {serial_number}")
            return jsonify({
                'success': True,
                'data': {
                    'ItemCode': cached_lookup.item_code,
                    'itemName': cached_lookup.item_name,
                    'DistNumber': serial_number,
                    'WhsCode': cached_lookup.warehouse_code,
                    'WhsName': cached_lookup.warehouse_name,
                    'BPLid': cached_lookup.branch_id,
                    'BPLName': cached_lookup.branch_name
                },
                'cached': True
            })
        
        # Lookup from SAP
        sap = SAPIntegration()
        if not sap.ensure_logged_in():
            return jsonify({
                'success': False,
                'message': 'SAP connection failed'
            }), 500
        
        try:
            # Use the SQL Query API as specified by user (Note: SAP query name is 'Invoise_creation')
            url = f"{sap.base_url}/b1s/v1/SQLQueries('Invoise_creation')/List"
            payload = {
                "ParamList": f"serial_number='{serial_number}'"
            }
            
            response = sap.session.post(url, json=payload, timeout=30)
            logging.info(f"SAP SQL Query Response Status: {response.status_code}")
            
            if response.status_code == 200:
                sap_data = response.json()
                logging.info(f"SAP SQL Query Response: {json.dumps(sap_data, indent=2)}")
                
                values = sap_data.get('value', [])
                if values:
                    item_data = values[0]  # Take first result
                    
                    # Cache the result
                    if cached_lookup:
                        cached_lookup.item_code = item_data.get('ItemCode')
                        cached_lookup.item_name = item_data.get('itemName')
                        cached_lookup.warehouse_code = item_data.get('WhsCode')
                        cached_lookup.warehouse_name = item_data.get('WhsName')
                        cached_lookup.branch_id = item_data.get('BPLid')
                        cached_lookup.branch_name = item_data.get('BPLName')
                        cached_lookup.lookup_status = 'validated'
                        cached_lookup.sap_response = json.dumps(item_data)
                        cached_lookup.last_updated = datetime.utcnow()
                    else:
                        cached_lookup = SerialNumberLookup()
                        cached_lookup.serial_number = serial_number
                        cached_lookup.item_code = item_data.get('ItemCode')
                        cached_lookup.item_name = item_data.get('itemName')
                        cached_lookup.warehouse_code = item_data.get('WhsCode')
                        cached_lookup.warehouse_name = item_data.get('WhsName')
                        cached_lookup.branch_id = item_data.get('BPLid')
                        cached_lookup.branch_name = item_data.get('BPLName')
                        cached_lookup.lookup_status = 'validated'
                        cached_lookup.sap_response = json.dumps(item_data)
                        cached_lookup.last_updated = datetime.utcnow()
                        db.session.add(cached_lookup)
                    
                    db.session.commit()
                    
                    return jsonify({
                        'success': True,
                        'data': item_data,
                        'cached': False
                    })
                else:
                    return jsonify({
                        'success': False,
                        'message': f'Serial number {serial_number} not found in SAP'
                    }), 404
            else:
                logging.error(f"SAP SQL Query failed: {response.status_code} - {response.text}")
                return jsonify({
                    'success': False,
                    'message': f'SAP query failed: {response.status_code}'
                }), 500
        
        except Exception as e:
            logging.error(f"Error during SAP lookup: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'SAP lookup error: {str(e)}'
            }), 500
            
    except Exception as e:
        logging.error(f"Error in lookup_serial API: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Internal error: {str(e)}'
        }), 500

@invoice_bp.route('/api/create_invoice', methods=['POST'])
@login_required
def create_invoice():
    """API endpoint to create invoice in SAP"""
    try:
        data = request.get_json()
        customer_code = data.get('customer_code', '').strip()
        serial_numbers = data.get('serial_numbers', [])
        
        if not customer_code:
            return jsonify({
                'success': False,
                'message': 'Customer code is required'
            }), 400
        
        if not serial_numbers:
            return jsonify({
                'success': False,
                'message': 'At least one serial number is required'
            }), 400
        
        logging.info(f"🏗️ Creating invoice for customer: {customer_code} with {len(serial_numbers)} serial numbers")
        
        # Create local invoice record
        invoice = InvoiceDocument()
        invoice.customer_code = customer_code
        invoice.user_id = current_user.id
        invoice.status = 'draft'
        db.session.add(invoice)
        db.session.flush()  # Get the ID
        
        # Group serial numbers by item and warehouse
        items_data = {}
        line_number = 0
        
        for serial_number in serial_numbers:
            # Get serial number details from cache or SAP
            cached_lookup = SerialNumberLookup.query.filter_by(serial_number=serial_number).first()
            if not cached_lookup:
                return jsonify({
                    'success': False,
                    'message': f'Serial number {serial_number} not found. Please lookup first.'
                }), 400
            
            # Group by item code and warehouse
            key = f"{cached_lookup.item_code}_{cached_lookup.warehouse_code}"
            if key not in items_data:
                items_data[key] = {
                    'ItemCode': cached_lookup.item_code,
                    'ItemDescription': cached_lookup.item_name,
                    'WarehouseCode': cached_lookup.warehouse_code,
                    'TaxCode': 'CSGST@18',
                    'Quantity': 0,
                    'SerialNumbers': [],
                    'BPL_IDAssignedToInvoice': cached_lookup.branch_id,
                    'BPLName': cached_lookup.branch_name
                }
            
            items_data[key]['Quantity'] += 1
            items_data[key]['SerialNumbers'].append({
                'InternalSerialNumber': serial_number,
                'BaseLineNumber': line_number,
                'Quantity': 1.0
            })
        
        # Build SAP invoice JSON
        current_date = datetime.now()
        sap_invoice = {
            "DocDate": current_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "DocDueDate": (current_date + timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "CardCode": customer_code,
            "DocumentLines": []
        }
        
        # Set BPL_IDAssignedToInvoice from first item
        first_item = list(items_data.values())[0]
        sap_invoice["BPL_IDAssignedToInvoice"] = first_item['BPL_IDAssignedToInvoice']
        sap_invoice["BPLName"] = first_item['BPLName']
        
        # Add document lines
        for key, item_data in items_data.items():
            document_line = {
                "ItemCode": item_data['ItemCode'],
                "ItemDescription": item_data['ItemDescription'],
                "Quantity": float(item_data['Quantity']),
                "WarehouseCode": item_data['WarehouseCode'],
                "TaxCode": item_data['TaxCode'],
                "SerialNumbers": item_data['SerialNumbers']
            }
            sap_invoice["DocumentLines"].append(document_line)
            
            # Create local invoice line
            invoice_line = InvoiceLine()
            invoice_line.invoice_id = invoice.id
            invoice_line.line_number = line_number
            invoice_line.item_code = item_data['ItemCode']
            invoice_line.item_description = item_data['ItemDescription']
            invoice_line.quantity = item_data['Quantity']
            invoice_line.warehouse_code = item_data['WarehouseCode']
            invoice_line.tax_code = item_data['TaxCode']
            db.session.add(invoice_line)
            db.session.flush()
            
            # Add serial numbers
            for serial_data in item_data['SerialNumbers']:
                invoice_serial = InvoiceSerialNumber()
                invoice_serial.invoice_line_id = invoice_line.id
                invoice_serial.serial_number = serial_data['InternalSerialNumber']
                invoice_serial.base_line_number = serial_data['BaseLineNumber']
                invoice_serial.quantity = serial_data['Quantity']
                db.session.add(invoice_serial)
            
            line_number += 1
        
        # Store JSON payload
        invoice.json_payload = json.dumps(sap_invoice, indent=2)
        
        # Create invoice in SAP
        sap = SAPIntegration()
        if not sap.ensure_logged_in():
            return jsonify({
                'success': False,
                'message': 'SAP connection failed'
            }), 500
        
        try:
            url = f"{sap.base_url}/b1s/v1/Invoices"
            response = sap.session.post(url, json=sap_invoice, timeout=60)
            
            logging.info(f"SAP Invoice Creation Response Status: {response.status_code}")
            logging.info(f"SAP Invoice Creation Response: {response.text}")
            
            if response.status_code == 201:
                sap_response = response.json()
                invoice.sap_response = json.dumps(sap_response, indent=2)
                invoice.sap_doc_entry = sap_response.get('DocEntry')
                invoice.sap_doc_num = sap_response.get('DocNum')
                invoice.invoice_number = str(sap_response.get('DocNum'))
                invoice.status = 'created'
                invoice.total_amount = sap_response.get('DocTotal', 0)
                
                db.session.commit()
                
                logging.info(f"✅ Invoice created successfully: DocEntry={invoice.sap_doc_entry}, DocNum={invoice.sap_doc_num}")
                
                return jsonify({
                    'success': True,
                    'message': f'Invoice {invoice.invoice_number} created successfully',
                    'invoice_id': invoice.id,
                    'sap_doc_entry': invoice.sap_doc_entry,
                    'sap_doc_num': invoice.sap_doc_num,
                    'total_amount': float(invoice.total_amount or 0)
                })
            else:
                error_message = f"SAP invoice creation failed: {response.status_code}"
                if response.text:
                    try:
                        error_data = response.json()
                        error_message = error_data.get('error', {}).get('message', {}).get('value', error_message)
                    except:
                        error_message = response.text
                
                invoice.sap_response = response.text
                invoice.status = 'failed'
                db.session.commit()
                
                logging.error(f"SAP invoice creation failed: {error_message}")
                return jsonify({
                    'success': False,
                    'message': error_message
                }), 500
        
        except Exception as e:
            invoice.sap_response = str(e)
            invoice.status = 'failed'
            db.session.commit()
            
            logging.error(f"Error during SAP invoice creation: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'SAP invoice creation error: {str(e)}'
            }), 500
            
    except Exception as e:
        logging.error(f"Error in create_invoice API: {str(e)}")
        if 'invoice' in locals():
            try:
                db.session.rollback()
            except:
                pass
        return jsonify({
            'success': False,
            'message': f'Internal error: {str(e)}'
        }), 500

@invoice_bp.route('/api/get_customers', methods=['GET'])
@login_required
def get_customers():
    """API endpoint to get customer list from SAP"""
    try:
        sap = SAPIntegration()
        if not sap.ensure_logged_in():
            return jsonify({
                'success': False,
                'message': 'SAP connection failed'
            }), 500
        
        try:
            url = f"{sap.base_url}/b1s/v1/BusinessPartners?$filter=CardType eq 'cCustomer'&$select=CardCode,CardName&$top=100"
            response = sap.session.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                customers = data.get('value', [])
                return jsonify({
                    'success': True,
                    'customers': customers
                })
            else:
                return jsonify({
                    'success': False,
                    'message': f'Failed to get customers: {response.status_code}'
                }), 500
        
        except Exception as e:
            logging.error(f"Error getting customers from SAP: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'SAP error: {str(e)}'
            }), 500
            
    except Exception as e:
        logging.error(f"Error in get_customers API: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Internal error: {str(e)}'
        }), 500