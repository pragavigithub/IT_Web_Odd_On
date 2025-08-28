/**
 * API Service for WMS Mobile App
 * Handles all HTTP communication with Flask backend
 * Supports MySQL database integration as per user preference
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/config';

class ApiServiceClass {
  constructor() {
    // Create axios instance with base configuration
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, logout user
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userData');
          // Redirect to login screen
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async login(username, password) {
    try {
      const response = await this.api.post('/auth/login', {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout() {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.log('Logout error:', error);
    }
  }

  async healthCheck() {
    try {
      const response = await this.api.get('/api/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // GRPO Module API
  async getGRPODocuments() {
    try {
      const response = await this.api.get('/api/grpo_documents');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getGRPODocument(id) {
    try {
      const response = await this.api.get(`/api/grpo_documents/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createGRPODocument(grpoData) {
    try {
      const response = await this.api.post('/api/grpo_documents', grpoData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateGRPODocument(id, grpoData) {
    try {
      const response = await this.api.put(`/api/grpo_documents/${id}`, grpoData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async submitGRPOForQC(id) {
    try {
      const response = await this.api.post(`/api/grpo_documents/${id}/submit`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async approveGRPO(id, notes = '') {
    try {
      const response = await this.api.post(`/api/grpo_documents/${id}/approve`, {
        qc_notes: notes,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async rejectGRPO(id, notes = '') {
    try {
      const response = await this.api.post(`/api/grpo_documents/${id}/reject`, {
        qc_notes: notes,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Inventory Transfer Module API
  async getInventoryTransfers() {
    try {
      const response = await this.api.get('/api/inventory_transfers');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getInventoryTransfer(id) {
    try {
      const response = await this.api.get(`/api/inventory_transfers/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createInventoryTransfer(transferData) {
    try {
      const response = await this.api.post('/api/inventory_transfers', transferData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateInventoryTransfer(id, transferData) {
    try {
      const response = await this.api.put(`/api/inventory_transfers/${id}`, transferData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async submitTransferForQC(id) {
    try {
      const response = await this.api.post(`/api/inventory_transfers/${id}/submit`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async approveTransfer(id, notes = '') {
    try {
      const response = await this.api.post(`/api/inventory_transfers/${id}/qc_approve`, {
        qc_notes: notes,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async rejectTransfer(id, notes = '') {
    try {
      const response = await this.api.post(`/api/inventory_transfers/${id}/qc_reject`, {
        qc_notes: notes,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async reopenTransfer(id) {
    try {
      const response = await this.api.post(`/api/inventory_transfers/${id}/reopen`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Pick List Module API
  async getPickLists() {
    try {
      const response = await this.api.get('/api/pick_lists');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPickList(id) {
    try {
      const response = await this.api.get(`/api/pick_lists/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createPickList(pickListData) {
    try {
      const response = await this.api.post('/api/pick_lists', pickListData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updatePickList(id, pickListData) {
    try {
      const response = await this.api.put(`/api/pick_lists/${id}`, pickListData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Barcode and Validation API
  async validateBarcode(barcode) {
    try {
      const response = await this.api.post('/api/validate_barcode', {
        barcode,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async validateTransferRequest(requestNumber) {
    try {
      const response = await this.api.post('/api/validate_transfer_request', {
        request_number: requestNumber,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async validatePurchaseOrder(poNumber) {
    try {
      const response = await this.api.post('/api/validate_purchase_order', {
        po_number: poNumber,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || 'Server error occurred';
      return new Error(message);
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export const ApiService = new ApiServiceClass();