/**
 * Database Context for WMS Mobile App
 * Manages local SQLite database and synchronization with MySQL backend
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { DatabaseService } from '../services/DatabaseService';
import { SyncService } from '../services/SyncService';

const DatabaseContext = createContext();

export const DatabaseProvider = ({ children }) => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error, success

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      await DatabaseService.initializeDatabase();
      setIsDbReady(true);
      console.log('Local SQLite database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  };

  const syncWithServer = async () => {
    if (!isDbReady) return;
    
    setSyncStatus('syncing');
    try {
      await SyncService.performFullSync();
      setSyncStatus('success');
      console.log('Database sync completed successfully');
    } catch (error) {
      setSyncStatus('error');
      console.error('Database sync failed:', error);
    }
  };

  const value = {
    isDbReady,
    syncStatus,
    syncWithServer,
    // Direct access to database operations
    db: DatabaseService,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};