/**
 * Sync Service for WMS Mobile App
 * Handles data synchronization between local SQLite and MySQL backend
 */

import { DatabaseService } from './DatabaseService';
import { ApiService } from './ApiService';
import NetInfo from '@react-native-community/netinfo';

class SyncServiceClass {
  constructor() {
    this.isSyncing = false;
    this.syncQueue = [];
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  async performFullSync() {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      throw new Error('No internet connection available');
    }

    this.isSyncing = true;
    
    try {
      console.log('Starting full synchronization...');
      
      // Sync in order: Upload local changes first, then download server data
      await this.uploadLocalChanges();
      await this.downloadServerData();
      
      console.log('Full synchronization completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  async uploadLocalChanges() {
    console.log('Uploading local changes...');
    
    try {
      // Get all pending sync queue items
      const syncItems = await DatabaseService.getSyncQueue();
      
      for (const item of syncItems) {
        try {
          await this.processSyncItem(item);
          await DatabaseService.removeSyncQueueItem(item.id);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          // Update retry count
          await DatabaseService.update(
            'sync_queue',
            { 
              retry_count: item.retry_count + 1,
              last_error: error.message 
            },
            'id = ?',
            [item.id]
          );
        }
      }
    } catch (error) {
      console.error('Error uploading local changes:', error);
      throw error;
    }
  }

  async downloadServerData() {
    console.log('Downloading server data...');
    
    try {
      // Download GRPO documents
      const grpoResponse = await ApiService.getGRPODocuments();
      if (grpoResponse.grpos) {
        await this.syncGRPODocuments(grpoResponse.grpos);
      }

      // Download Inventory Transfers
      const transferResponse = await ApiService.getInventoryTransfers();
      if (transferResponse.transfers) {
        await this.syncInventoryTransfers(transferResponse.transfers);
      }

      // Download Pick Lists
      const pickListResponse = await ApiService.getPickLists();
      if (pickListResponse.pick_lists) {
        await this.syncPickLists(pickListResponse.pick_lists);
      }

    } catch (error) {
      console.error('Error downloading server data:', error);
      throw error;
    }
  }

  async processSyncItem(item) {
    const { table_name, record_id, operation, data } = item;
    const parsedData = data ? JSON.parse(data) : null;

    switch (table_name) {
      case 'grpo_documents':
        await this.syncGRPOOperation(operation, record_id, parsedData);
        break;
      case 'inventory_transfers':
        await this.syncTransferOperation(operation, record_id, parsedData);
        break;
      case 'pick_lists':
        await this.syncPickListOperation(operation, record_id, parsedData);
        break;
      default:
        console.warn(`Unknown table for sync: ${table_name}`);
    }
  }

  async syncGRPOOperation(operation, recordId, data) {
    switch (operation) {
      case 'INSERT':
        await ApiService.createGRPODocument(data);
        break;
      case 'UPDATE':
        await ApiService.updateGRPODocument(recordId, data);
        break;
      case 'SUBMIT':
        await ApiService.submitGRPOForQC(recordId);
        break;
      case 'APPROVE':
        await ApiService.approveGRPO(recordId, data?.qc_notes);
        break;
      case 'REJECT':
        await ApiService.rejectGRPO(recordId, data?.qc_notes);
        break;
    }
  }

  async syncTransferOperation(operation, recordId, data) {
    switch (operation) {
      case 'INSERT':
        await ApiService.createInventoryTransfer(data);
        break;
      case 'UPDATE':
        await ApiService.updateInventoryTransfer(recordId, data);
        break;
      case 'SUBMIT':
        await ApiService.submitTransferForQC(recordId);
        break;
      case 'APPROVE':
        await ApiService.approveTransfer(recordId, data?.qc_notes);
        break;
      case 'REJECT':
        await ApiService.rejectTransfer(recordId, data?.qc_notes);
        break;
      case 'REOPEN':
        await ApiService.reopenTransfer(recordId);
        break;
    }
  }

  async syncPickListOperation(operation, recordId, data) {
    switch (operation) {
      case 'INSERT':
        await ApiService.createPickList(data);
        break;
      case 'UPDATE':
        await ApiService.updatePickList(recordId, data);
        break;
    }
  }

  async syncGRPODocuments(serverGRPOs) {
    for (const serverGRPO of serverGRPOs) {
      try {
        // Check if GRPO exists locally
        const localGRPOs = await DatabaseService.select(
          'grpo_documents',
          'id = ?',
          [serverGRPO.id]
        );

        if (localGRPOs.length === 0) {
          // Insert new GRPO
          await DatabaseService.insert('grpo_documents', {
            ...serverGRPO,
            synced: 1,
          });
        } else {
          // Update existing GRPO if server version is newer
          const localGRPO = localGRPOs[0];
          const serverUpdated = new Date(serverGRPO.updated_at);
          const localUpdated = new Date(localGRPO.updated_at);
          
          if (serverUpdated > localUpdated) {
            await DatabaseService.update(
              'grpo_documents',
              { ...serverGRPO, synced: 1 },
              'id = ?',
              [serverGRPO.id]
            );
          }
        }
      } catch (error) {
        console.error(`Error syncing GRPO ${serverGRPO.id}:`, error);
      }
    }
  }

  async syncInventoryTransfers(serverTransfers) {
    for (const serverTransfer of serverTransfers) {
      try {
        const localTransfers = await DatabaseService.select(
          'inventory_transfers',
          'id = ?',
          [serverTransfer.id]
        );

        if (localTransfers.length === 0) {
          await DatabaseService.insert('inventory_transfers', {
            ...serverTransfer,
            synced: 1,
          });
        } else {
          const localTransfer = localTransfers[0];
          const serverUpdated = new Date(serverTransfer.updated_at);
          const localUpdated = new Date(localTransfer.updated_at);
          
          if (serverUpdated > localUpdated) {
            await DatabaseService.update(
              'inventory_transfers',
              { ...serverTransfer, synced: 1 },
              'id = ?',
              [serverTransfer.id]
            );
          }
        }
      } catch (error) {
        console.error(`Error syncing transfer ${serverTransfer.id}:`, error);
      }
    }
  }

  async syncPickLists(serverPickLists) {
    for (const serverPickList of serverPickLists) {
      try {
        const localPickLists = await DatabaseService.select(
          'pick_lists',
          'id = ?',
          [serverPickList.id]
        );

        if (localPickLists.length === 0) {
          await DatabaseService.insert('pick_lists', {
            ...serverPickList,
            synced: 1,
          });
        } else {
          const localPickList = localPickLists[0];
          const serverUpdated = new Date(serverPickList.updated_at);
          const localUpdated = new Date(localPickList.updated_at);
          
          if (serverUpdated > localUpdated) {
            await DatabaseService.update(
              'pick_lists',
              { ...serverPickList, synced: 1 },
              'id = ?',
              [serverPickList.id]
            );
          }
        }
      } catch (error) {
        console.error(`Error syncing pick list ${serverPickList.id}:`, error);
      }
    }
  }

  // Schedule background sync
  async scheduleBackgroundSync() {
    // This would integrate with a background task scheduler
    // For React Native, you might use @react-native-async-storage/async-storage
    // or react-native-background-job
    setInterval(async () => {
      try {
        const netState = await NetInfo.fetch();
        if (netState.isConnected && !this.isSyncing) {
          await this.performFullSync();
        }
      } catch (error) {
        console.log('Background sync failed:', error);
      }
    }, 30000); // Sync every 30 seconds when connected
  }
}

export const SyncService = new SyncServiceClass();