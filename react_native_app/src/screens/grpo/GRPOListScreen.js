/**
 * GRPO List Screen for WMS Mobile App
 * Displays list of all GRPO documents with filtering and search
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

const GRPOListScreen = ({ navigation }) => {
  const [grpoDocuments, setGrpoDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
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
      loadGRPODocuments();
    }, [])
  );

  const loadGRPODocuments = async () => {
    try {
      setLoading(true);
      const documents = await db.getGRPODocuments(
        user?.role === 'admin' || user?.role === 'manager' ? null : user?.id
      );
      setGrpoDocuments(documents);
      filterDocuments(documents, searchQuery, selectedStatus);
    } catch (error) {
      console.error('Error loading GRPO documents:', error);
      Alert.alert('Error', 'Failed to load GRPO documents');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncWithServer();
      await loadGRPODocuments();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filterDocuments = (documents, query, status) => {
    let filtered = [...documents];

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(doc => doc.status === status);
    }

    // Filter by search query
    if (query.trim()) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.po_number?.toLowerCase().includes(lowercaseQuery) ||
        doc.supplier_name?.toLowerCase().includes(lowercaseQuery) ||
        doc.supplier_code?.toLowerCase().includes(lowercaseQuery) ||
        doc.warehouse_code?.toLowerCase().includes(lowercaseQuery)
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    filterDocuments(grpoDocuments, query, selectedStatus);
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    filterDocuments(grpoDocuments, searchQuery, status);
  };

  const handleGRPOPress = (grpo) => {
    navigation.navigate('GRPODetail', { grpoId: grpo.id, grpo });
  };

  const handleCreateGRPO = () => {
    navigation.navigate('CreateGRPO');
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || theme.colors.disabled;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const renderGRPOItem = ({ item }) => (
    <Card style={styles.grpoCard} onPress={() => handleGRPOPress(item)}>
      <Card.Content>
        <View style={styles.grpoHeader}>
          <View style={styles.grpoInfo}>
            <Text style={styles.poNumber}>PO: {item.po_number}</Text>
            <Text style={styles.supplierName}>
              {item.supplier_name || item.supplier_code || 'Unknown Supplier'}
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

        <View style={styles.grpoDetails}>
          <View style={styles.detailRow}>
            <Icon name="warehouse" size={16} color={theme.colors.onSurface} />
            <Text style={styles.detailText}>
              {item.warehouse_code || 'No Warehouse'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="calendar" size={16} color={theme.colors.onSurface} />
            <Text style={styles.detailText}>
              {formatDate(item.created_at)}
            </Text>
          </View>

          {item.po_total && (
            <View style={styles.detailRow}>
              <Icon name="currency-usd" size={16} color={theme.colors.onSurface} />
              <Text style={styles.detailText}>
                ${parseFloat(item.po_total).toFixed(2)}
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
      <Icon name="package-variant-closed" size={64} color={theme.colors.disabled} />
      <Text style={styles.emptyTitle}>No GRPO Documents</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedStatus !== 'all' 
          ? 'No documents match your filters' 
          : 'Create your first GRPO document'}
      </Text>
      {(!searchQuery && selectedStatus === 'all') && (
        <Button
          mode="contained"
          onPress={handleCreateGRPO}
          style={styles.emptyButton}
        >
          Create GRPO
        </Button>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading GRPO documents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search PO number, supplier..."
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

      {/* GRPO List */}
      <FlatList
        data={filteredDocuments}
        renderItem={renderGRPOItem}
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
        onPress={handleCreateGRPO}
        label="New GRPO"
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
  grpoCard: {
    marginBottom: spacing.md,
  },
  grpoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  grpoInfo: {
    flex: 1,
  },
  poNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  supplierName: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.8,
  },
  statusChip: {
    marginLeft: spacing.sm,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  grpoDetails: {
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

export default GRPOListScreen;