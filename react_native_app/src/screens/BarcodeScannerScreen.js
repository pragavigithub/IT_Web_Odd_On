/**
 * Barcode Scanner Screen for WMS Mobile App
 * Uses camera to scan barcodes and QR codes
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text,
  Alert,
  Vibration,
  TouchableOpacity
} from 'react-native';
import { 
  Button, 
  TextInput, 
  Card,
  ActivityIndicator,
  Snackbar
} from 'react-native-paper';
import { RNCamera } from 'react-native-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';
import { ApiService } from '../services/ApiService';
import { theme, spacing } from '../theme/theme';

const BarcodeScannerScreen = ({ navigation, route }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');

  const { onBarcodeScanned, scanType = 'barcode' } = route.params || {};

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;
      
      const result = await request(permission);
      
      if (result === RESULTS.GRANTED) {
        setHasPermission(true);
      } else {
        Alert.alert(
          'Camera Permission',
          'Camera permission is required to scan barcodes. You can enter the barcode manually instead.',
          [
            { text: 'Manual Entry', onPress: () => setManualEntry(true) },
            { text: 'Cancel', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      console.error('Permission error:', error);
      setManualEntry(true);
    }
  };

  const handleBarCodeRead = (event) => {
    if (scanned || isValidating) return;

    const { data, type } = event;
    
    if (data) {
      setScanned(true);
      Vibration.vibrate(100);
      validateAndProcessBarcode(data);
    }
  };

  const validateAndProcessBarcode = async (barcode) => {
    setIsValidating(true);
    
    try {
      let validationResult;
      
      if (scanType === 'transfer_request') {
        validationResult = await ApiService.validateTransferRequest(barcode);
      } else if (scanType === 'purchase_order') {
        validationResult = await ApiService.validatePurchaseOrder(barcode);
      } else {
        validationResult = await ApiService.validateBarcode(barcode);
      }

      if (validationResult.success) {
        setSnackMessage('Barcode validated successfully!');
        
        if (onBarcodeScanned) {
          onBarcodeScanned(barcode, validationResult);
        }
        
        setTimeout(() => {
          navigation.goBack();
        }, 1000);
      } else {
        setSnackMessage('Invalid barcode. Please try again.');
        setScanned(false);
      }
    } catch (error) {
      setSnackMessage('Validation failed. Check your connection.');
      setScanned(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleManualSubmit = () => {
    if (!barcodeValue.trim()) {
      Alert.alert('Error', 'Please enter a barcode value');
      return;
    }

    validateAndProcessBarcode(barcodeValue.trim());
  };

  const resetScanner = () => {
    setScanned(false);
    setBarcodeValue('');
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  if (manualEntry) {
    return (
      <View style={styles.container}>
        <Card style={styles.manualCard}>
          <Card.Content>
            <Text style={styles.manualTitle}>Enter Barcode Manually</Text>
            <TextInput
              label={`Enter ${scanType === 'transfer_request' ? 'Transfer Request Number' : 
                      scanType === 'purchase_order' ? 'Purchase Order Number' : 'Barcode'}`}
              value={barcodeValue}
              onChangeText={setBarcodeValue}
              mode="outlined"
              style={styles.input}
              autoCapitalize="characters"
              autoCorrect={false}
              disabled={isValidating}
            />
            
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={handleManualSubmit}
                loading={isValidating}
                disabled={isValidating || !barcodeValue.trim()}
                style={styles.submitButton}
              >
                Validate
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                disabled={isValidating}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
            </View>

            {hasPermission && (
              <Button
                mode="text"
                onPress={() => setManualEntry(false)}
                disabled={isValidating}
                style={styles.cameraButton}
              >
                Use Camera Instead
              </Button>
            )}
          </Card.Content>
        </Card>

        <Snackbar
          visible={!!snackMessage}
          onDismiss={() => setSnackMessage('')}
          duration={3000}
        >
          {snackMessage}
        </Snackbar>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Icon name="camera-off" size={64} color={theme.colors.disabled} />
        <Text style={styles.permissionText}>Camera permission is required</Text>
        <Button
          mode="contained"
          onPress={requestCameraPermission}
          style={styles.permissionButton}
        >
          Grant Permission
        </Button>
        <Button
          mode="outlined"
          onPress={() => setManualEntry(true)}
          style={styles.manualButton}
        >
          Enter Manually
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RNCamera
        style={styles.camera}
        onBarCodeRead={handleBarCodeRead}
        barCodeTypes={[
          RNCamera.Constants.BarCodeType.qr,
          RNCamera.Constants.BarCodeType.ean13,
          RNCamera.Constants.BarCodeType.ean8,
          RNCamera.Constants.BarCodeType.code128,
          RNCamera.Constants.BarCodeType.code39,
          RNCamera.Constants.BarCodeType.pdf417,
          RNCamera.Constants.BarCodeType.aztec,
          RNCamera.Constants.BarCodeType.datamatrix,
        ]}
        flashMode={flashOn ? RNCamera.Constants.FlashMode.torch : RNCamera.Constants.FlashMode.off}
        captureAudio={false}
      >
        {/* Scanning overlay */}
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>
              {scanType === 'transfer_request' ? 'Scan Transfer Request' :
               scanType === 'purchase_order' ? 'Scan Purchase Order' : 'Scan Barcode'}
            </Text>
            
            <TouchableOpacity 
              style={styles.flashButton}
              onPress={toggleFlash}
            >
              <Icon 
                name={flashOn ? "flashlight" : "flashlight-off"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              {/* Corner indicators */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            
            <Text style={styles.scanInstruction}>
              Position the barcode within the frame
            </Text>
          </View>

          <View style={styles.footer}>
            {isValidating && (
              <View style={styles.validatingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.validatingText}>Validating...</Text>
              </View>
            )}
            
            <Button
              mode="outlined"
              onPress={() => setManualEntry(true)}
              style={styles.manualEntryButton}
              labelStyle={styles.manualEntryButtonText}
            >
              Enter Manually
            </Button>
          </View>
        </View>
      </RNCamera>

      <Snackbar
        visible={!!snackMessage}
        onDismiss={() => setSnackMessage('')}
        duration={3000}
      >
        {snackMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  flashButton: {
    padding: spacing.sm,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'white',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanInstruction: {
    color: 'white',
    textAlign: 'center',
    marginTop: spacing.lg,
    fontSize: 16,
  },
  footer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  validatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  validatingText: {
    color: 'white',
    marginLeft: spacing.sm,
  },
  manualEntryButton: {
    borderColor: 'white',
  },
  manualEntryButtonText: {
    color: 'white',
  },
  // Manual entry styles
  manualCard: {
    margin: spacing.lg,
    marginTop: spacing.xl,
  },
  manualTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  submitButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  cameraButton: {
    marginTop: spacing.sm,
  },
  // Permission styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: spacing.lg,
    color: theme.colors.onSurface,
  },
  permissionButton: {
    marginBottom: spacing.md,
  },
  manualButton: {
    marginTop: spacing.sm,
  },
});

export default BarcodeScannerScreen;