/**
 * Create GRPO Screen for WMS Mobile App
 * Allows users to create new GRPO documents by scanning PO numbers
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card,
  Title,
  Snackbar,
  ActivityIndicator,
  Chip
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../contexts/AuthContext';
import { useDatabase } from '../../contexts/DatabaseContext';
import { ApiService } from '../../services/ApiService';
import { theme, spacing } from '../../theme/theme';

const CreateGRPOScreen = ({ navigation }) => {
  const [poNumber, setPoNumber] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [warehouseCode, setWarehouseCode] = useState('');
  const [notes, setNotes] = useState('');
  const [poDetails, setPoDetails] = useState(null);
  const [validating, setValidating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');

  const { user } = useAuth();
  const { db } = useDatabase();

  const handleScanPO = () => {
    navigation.navigate('BarcodeScanner', {
      scanType: 'purchase_order',
      onBarcodeScanned: (barcode, validationResult) => {
        if (validationResult.success && validationResult.purchase_order) {
          const po = validationResult.purchase_order;
          setPoNumber(barcode);
          setSupplierCode(po.supplier_code || '');
          setSupplierName(po.supplier_name || '');
          setWarehouseCode(po.warehouse_code || '');
          setPoDetails(po);
          setSnackMessage('PO validated successfully!');
        }
      }
    });
  };

  const validatePONumber = async () => {
    if (!poNumber.trim()) {
      Alert.alert('Error', 'Please enter a PO number');
      return;
    }

    setValidating(true);
    try {
      const result = await ApiService.validatePurchaseOrder(poNumber.trim());
      
      if (result.success && result.purchase_order) {
        const po = result.purchase_order;
        setSupplierCode(po.supplier_code || '');
        setSupplierName(po.supplier_name || '');
        setWarehouseCode(po.warehouse_code || '');
        setPoDetails(po);
        setSnackMessage('PO validated successfully!');
      } else {
        Alert.alert('Validation Failed', result.message || 'Invalid PO number');
        setPoDetails(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to validate PO number. Check your connection.');
      setPoDetails(null);
    } finally {
      setValidating(false);
    }
  };

  const handleCreate = async () => {
    // Validation
    if (!poNumber.trim()) {
      Alert.alert('Error', 'PO Number is required');
      return;
    }

    if (!warehouseCode.trim()) {
      Alert.alert('Error', 'Warehouse Code is required');
      return;
    }

    // Check if GRPO already exists
    try {
      const existingGRPOs = await db.select(
        'grpo_documents',
        'po_number = ? AND user_id = ?',
        [poNumber.trim(), user.id]
      );

      if (existingGRPOs.length > 0) {
        Alert.alert('Error', 'GRPO already exists for this PO number');
        return;
      }
    } catch (error) {
      console.error('Error checking existing GRPO:', error);
    }

    setCreating(true);
    try {
      const grpoData = {
        po_number: poNumber.trim(),
        supplier_code: supplierCode.trim() || null,
        supplier_name: supplierName.trim() || null,
        warehouse_code: warehouseCode.trim(),
        user_id: user.id,
        notes: notes.trim() || null,
        status: 'draft',
        po_total: poDetails?.total || null,
        po_date: poDetails?.po_date || null,
      };

      const grpoId = await db.createGRPODocument(grpoData);

      // Add to sync queue
      await db.addToSyncQueue('grpo_documents', grpoId, 'INSERT', grpoData);

      setSnackMessage('GRPO created successfully!');
      
      // Navigate to GRPO detail screen
      setTimeout(() => {
        navigation.replace('GRPODetail', { 
          grpoId: grpoId,
          grpo: { id: grpoId, ...grpoData }
        });
      }, 1000);

    } catch (error) {
      console.error('Error creating GRPO:', error);
      Alert.alert('Error', 'Failed to create GRPO. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const PODetailsCard = () => {
    if (!poDetails) return null;

    return (
      <Card style={styles.poDetailsCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Purchase Order Details</Title>
          
          <View style={styles.detailRow}>
            <Icon name="identifier" size={20} color={theme.colors.primary} />
            <Text style={styles.detailLabel}>PO Number:</Text>
            <Text style={styles.detailValue}>{poDetails.po_number}</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="account" size={20} color={theme.colors.primary} />
            <Text style={styles.detailLabel}>Supplier:</Text>
            <Text style={styles.detailValue}>
              {poDetails.supplier_name || poDetails.supplier_code || 'N/A'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="warehouse" size={20} color={theme.colors.primary} />
            <Text style={styles.detailLabel}>Warehouse:</Text>
            <Text style={styles.detailValue}>{poDetails.warehouse_code || 'N/A'}</Text>
          </View>

          {poDetails.total && (
            <View style={styles.detailRow}>
              <Icon name="currency-usd" size={20} color={theme.colors.primary} />
              <Text style={styles.detailLabel}>Total:</Text>
              <Text style={styles.detailValue}>
                ${parseFloat(poDetails.total).toFixed(2)}
              </Text>
            </View>
          )}

          {poDetails.status && (
            <View style={styles.detailRow}>
              <Icon name="flag" size={20} color={theme.colors.primary} />
              <Text style={styles.detailLabel}>Status:</Text>
              <Chip mode="flat" style={styles.statusChip}>
                {poDetails.status}
              </Chip>
            </View>
          )}

          {poDetails.total_lines && (
            <View style={styles.detailRow}>
              <Icon name="format-list-numbered" size={20} color={theme.colors.primary} />
              <Text style={styles.detailLabel}>Line Items:</Text>
              <Text style={styles.detailValue}>{poDetails.total_lines}</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <Card style={styles.formCard}>
          <Card.Content>
            <Title style={styles.formTitle}>Create New GRPO</Title>
            
            {/* PO Number Input */}
            <View style={styles.inputContainer}>
              <TextInput
                label="Purchase Order Number *"
                value={poNumber}
                onChangeText={setPoNumber}
                mode="outlined"
                style={styles.input}
                autoCapitalize="characters"
                autoCorrect={false}
                disabled={validating || creating}
                right={
                  <TextInput.Icon 
                    icon="barcode-scan" 
                    onPress={handleScanPO}
                    disabled={validating || creating}
                  />
                }
              />
              
              <Button
                mode="outlined"
                onPress={validatePONumber}
                loading={validating}
                disabled={validating || creating || !poNumber.trim()}
                style={styles.validateButton}
              >
                {validating ? 'Validating...' : 'Validate PO'}
              </Button>
            </View>

            {/* Supplier Information */}
            <TextInput
              label="Supplier Code"
              value={supplierCode}
              onChangeText={setSupplierCode}
              mode="outlined"
              style={styles.input}
              disabled={creating}
            />

            <TextInput
              label="Supplier Name"
              value={supplierName}
              onChangeText={setSupplierName}
              mode="outlined"
              style={styles.input}
              disabled={creating}
            />

            {/* Warehouse Code */}
            <TextInput
              label="Warehouse Code *"
              value={warehouseCode}
              onChangeText={setWarehouseCode}
              mode="outlined"
              style={styles.input}
              autoCapitalize="characters"
              disabled={creating}
            />

            {/* Notes */}
            <TextInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              disabled={creating}
            />

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleCreate}
                loading={creating}
                disabled={creating || !poNumber.trim() || !warehouseCode.trim()}
                style={styles.createButton}
                contentStyle={styles.buttonContent}
              >
                {creating ? 'Creating...' : 'Create GRPO'}
              </Button>

              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                disabled={creating}
                style={styles.cancelButton}
                contentStyle={styles.buttonContent}
              >
                Cancel
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* PO Details Card */}
        <PODetailsCard />
      </ScrollView>

      <Snackbar
        visible={!!snackMessage}
        onDismiss={() => setSnackMessage('')}
        duration={3000}
      >
        {snackMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  formCard: {
    margin: spacing.md,
    marginBottom: spacing.sm,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
  },
  validateButton: {
    marginTop: -spacing.sm,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  createButton: {
    marginBottom: spacing.md,
  },
  cancelButton: {
    marginBottom: spacing.sm,
  },
  buttonContent: {
    height: 48,
  },
  poDetailsCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginLeft: spacing.sm,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onSurface,
    textAlign: 'right',
  },
  statusChip: {
    backgroundColor: theme.colors.primary + '20',
  },
});

export default CreateGRPOScreen;