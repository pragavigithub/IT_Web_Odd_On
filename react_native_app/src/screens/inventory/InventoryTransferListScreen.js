/**
 * Inventory Transfer List Screen for WMS Mobile App
 * Displays list of all inventory transfers with filtering and search
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  Alert
} from 'react-native';
import { 
  Text, 
  Card, 
  Chip, 
  Searchbar,
  FAB,
  Button,
  ActivityIndicator
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useDatabase } from '../../contexts/DatabaseContext';
import { theme, spacing } from '../../theme/theme';
import { STATUS_COLORS } from '../../config/config';

const InventoryTransferListScreen = ({ navigation }) => {
  const [transfers, setTransfers] = useState([]);
  const [filteredTransfers, setFilteredTransfers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const { db, syncWithServer } = useDatabase();

  const statusFilters = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'qc_approved', label: 'QC Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'posted', label: 'Posted' },
  ];

  useFocusEffect(
    useCallback(() => {
      loadInventoryTransfers();
    }, [])
  );

  const loadInventoryTransfers = async () => {
    try {
      setLoading(true);
      const transferData = await db.getInventoryTransfers(
        user?.role === 'admin' || user?.role === 'manager' ? null : user?.id
      );
      setTransfers(transferData);
      filterTransfers(transferData, searchQuery, selectedStatus);
    } catch (error) {
      console.error('Error loading inventory transfers:', error);
      Alert.alert('Error', 'Failed to load inventory transfers');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncWithServer();
      await loadInventoryTransfers();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filterTransfers = (transferData, query, status) => {
    let filtered = [...transferData];

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(transfer => transfer.status === status);
    }

    // Filter by search query
    if (query.trim()) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(transfer => 
        transfer.transfer_request_number?.toLowerCase().includes(lowercaseQuery) ||
        transfer.from_warehouse?.toLowerCase().includes(lowercaseQuery) ||
        transfer.to_warehouse?.toLowerCase().includes(lowercaseQuery) ||
        transfer.sap_document_number?.toLowerCase().includes(lowercaseQuery)
      );
    }

    setFilteredTransfers(filtered);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    filterTransfers(transfers, query, selectedStatus);
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    filterTransfers(transfers, searchQuery, status);
  };

  const handleTransferPress = (transfer) => {
    navigation.navigate('InventoryTransferDetail', { 
      transferId: transfer.id, 
      transfer 
    });
  };

  const handleCreateTransfer = () => {
    navigation.navigate('CreateInventoryTransfer');
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || theme.colors.disabled;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const renderTransferItem = ({ item }) => (
    <Card style={styles.transferCard} onPress={() => handleTransferPress(item)}>
      <Card.Content>
        <View style={styles.transferHeader}>
          <View style={styles.transferInfo}>
            <Text style={styles.requestNumber}>
              Req: {item.transfer_request_number || 'N/A'}
            </Text>
            <Text style={styles.warehouseInfo}>
              {item.from_warehouse} → {item.to_warehouse}
            </Text>
          </View>
          <Chip 
            mode="flat" 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.statusText}
          >
            {item.status?.replace('_', ' ').toUpperCase()}
          </Chip>
        </View>

        <View style={styles.transferDetails}>
          <View style={styles.detailRow}>
            <Icon name="swap-horizontal" size={16} color={theme.colors.onSurface} />
            <Text style={styles.detailText}>
              Type: {item.transfer_type || 'warehouse'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="flag" size={16} color={theme.colors.onSurface} />
            <Text style={styles.detailText}>
              Priority: {item.priority || 'normal'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="calendar" size={16} color={theme.colors.onSurface} />
            <Text style={styles.detailText}>
              Created: {formatDate(item.created_at)}
            </Text>
          </View>

          {item.sap_document_number && (
            <View style={styles.detailRow}>
              <Icon name="file-document" size={16} color={theme.colors.onSurface} />
              <Text style={styles.detailText}>
                SAP Doc: {item.sap_document_number}
              </Text>
            </View>
          )}
        </View>

        {item.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {item.notes}
          </Text>
        )}

        <View style={styles.syncIndicator}>
          {item.synced === 0 && (
            <Chip 
              icon="sync-alert" 
              mode="outlined" 
              compact 
              style={styles.syncChip}
            >
              Pending Sync
            </Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="swap-horizontal" size={64} color={theme.colors.disabled} />
      <Text style={styles.emptyTitle}>No Inventory Transfers</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedStatus !== 'all' 
          ? 'No transfers match your filters' 
          : 'Create your first inventory transfer'}
      </Text>
      {(!searchQuery && selectedStatus === 'all') && (
        <Button
          mode="contained"
          onPress={handleCreateTransfer}
          style={styles.emptyButton}
        >
          Create Transfer
        </Button>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading inventory transfers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search request number, warehouse..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusFilters}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <Chip
              mode={selectedStatus === item.key ? 'flat' : 'outlined'}
              selected={selectedStatus === item.key}
              onPress={() => handleStatusFilter(item.key)}
              style={styles.filterChip}
            >
              {item.label}
            </Chip>
          )}
        />
      </View>

      {/* Transfer List */}
      <FlatList
        data={filteredTransfers}
        renderItem={renderTransferItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleCreateTransfer}
        label="New Transfer"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: theme.colors.onSurface,
  },
  searchBar: {
    margin: spacing.md,
  },
  filtersContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  listContainer: {
    padding: spacing.md,
    paddingBottom: 80, // Space for FAB
  },
  transferCard: {
    marginBottom: spacing.md,
  },
  transferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  transferInfo: {
    flex: 1,
  },
  requestNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  warehouseInfo: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.8,
    fontWeight: '500',
  },
  statusChip: {
    marginLeft: spacing.sm,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  transferDetails: {
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  notes: {
    fontSize: 14,
    fontStyle: 'italic',
    color: theme.colors.onSurface,
    opacity: 0.6,
    marginBottom: spacing.sm,
  },
  syncIndicator: {
    alignItems: 'flex-end',
  },
  syncChip: {
    backgroundColor: theme.colors.warning + '20',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.onSurface,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
  },
});

export default InventoryTransferListScreen;