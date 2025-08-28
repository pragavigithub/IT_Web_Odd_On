/**
 * Pick List Screen for WMS Mobile App
 * Displays list of all pick lists with filtering and search
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
import { STATUS_COLORS, PRIORITIES } from '../../config/config';

const PickListScreen = ({ navigation }) => {
  const [pickLists, setPickLists] = useState([]);
  const [filteredPickLists, setFilteredPickLists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const { db, syncWithServer } = useDatabase();

  const statusFilters = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'picking', label: 'Picking' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const priorityFilters = [
    { key: 'all', label: 'All Priority' },
    { key: 'low', label: 'Low' },
    { key: 'normal', label: 'Normal' },
    { key: 'high', label: 'High' },
    { key: 'urgent', label: 'Urgent' },
  ];

  useFocusEffect(
    useCallback(() => {
      loadPickLists();
    }, [])
  );

  const loadPickLists = async () => {
    try {
      setLoading(true);
      const pickListData = await db.getPickLists(
        user?.role === 'admin' || user?.role === 'manager' ? null : user?.id
      );
      setPickLists(pickListData);
      filterPickLists(pickListData, searchQuery, selectedStatus, selectedPriority);
    } catch (error) {
      console.error('Error loading pick lists:', error);
      Alert.alert('Error', 'Failed to load pick lists');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncWithServer();
      await loadPickLists();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filterPickLists = (pickListData, query, status, priority) => {
    let filtered = [...pickListData];

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(pickList => pickList.status === status);
    }

    // Filter by priority
    if (priority !== 'all') {
      filtered = filtered.filter(pickList => pickList.priority === priority);
    }

    // Filter by search query
    if (query.trim()) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(pickList => 
        pickList.sales_order_number?.toLowerCase().includes(lowercaseQuery) ||
        pickList.customer_name?.toLowerCase().includes(lowercaseQuery) ||
        pickList.customer_code?.toLowerCase().includes(lowercaseQuery) ||
        pickList.warehouse_code?.toLowerCase().includes(lowercaseQuery)
      );
    }

    setFilteredPickLists(filtered);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    filterPickLists(pickLists, query, selectedStatus, selectedPriority);
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    filterPickLists(pickLists, searchQuery, status, selectedPriority);
  };

  const handlePriorityFilter = (priority) => {
    setSelectedPriority(priority);
    filterPickLists(pickLists, searchQuery, selectedStatus, priority);
  };

  const handlePickListPress = (pickList) => {
    navigation.navigate('PickListDetail', { 
      pickListId: pickList.id, 
      pickList 
    });
  };

  const handleCreatePickList = () => {
    navigation.navigate('CreatePickList');
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || theme.colors.disabled;
  };

  const getPriorityColor = (priority) => {
    return PRIORITIES[priority]?.color || theme.colors.disabled;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const renderPickListItem = ({ item }) => (
    <Card style={styles.pickListCard} onPress={() => handlePickListPress(item)}>
      <Card.Content>
        <View style={styles.pickListHeader}>
          <View style={styles.pickListInfo}>
            <Text style={styles.salesOrderNumber}>
              SO: {item.sales_order_number || 'N/A'}
            </Text>
            <Text style={styles.customerInfo}>
              {item.customer_name || item.customer_code || 'Unknown Customer'}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <Chip 
              mode="flat" 
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
              textStyle={styles.statusText}
            >
              {item.status?.toUpperCase()}
            </Chip>
            {item.priority && (
              <Chip 
                mode="outlined" 
                style={[styles.priorityChip, { borderColor: getPriorityColor(item.priority) }]}
                textStyle={[styles.priorityText, { color: getPriorityColor(item.priority) }]}
              >
                {item.priority?.toUpperCase()}
              </Chip>
            )}
          </View>
        </View>

        <View style={styles.pickListDetails}>
          <View style={styles.detailRow}>
            <Icon name="warehouse" size={16} color={theme.colors.onSurface} />
            <Text style={styles.detailText}>
              {item.warehouse_code || 'No Warehouse'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="calendar" size={16} color={theme.colors.onSurface} />
            <Text style={styles.detailText}>
              Created: {formatDate(item.created_at)}
            </Text>
          </View>

          {item.due_date && (
            <View style={styles.detailRow}>
              <Icon name="calendar-clock" size={16} color={theme.colors.onSurface} />
              <Text style={styles.detailText}>
                Due: {formatDate(item.due_date)}
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
      <Icon name="clipboard-list-outline" size={64} color={theme.colors.disabled} />
      <Text style={styles.emptyTitle}>No Pick Lists</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedStatus !== 'all' || selectedPriority !== 'all'
          ? 'No pick lists match your filters' 
          : 'Create your first pick list'}
      </Text>
      {(!searchQuery && selectedStatus === 'all' && selectedPriority === 'all') && (
        <Button
          mode="contained"
          onPress={handleCreatePickList}
          style={styles.emptyButton}
        >
          Create Pick List
        </Button>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading pick lists...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search SO number, customer..."
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

      {/* Priority Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={priorityFilters}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <Chip
              mode={selectedPriority === item.key ? 'flat' : 'outlined'}
              selected={selectedPriority === item.key}
              onPress={() => handlePriorityFilter(item.key)}
              style={styles.filterChip}
            >
              {item.label}
            </Chip>
          )}
        />
      </View>

      {/* Pick List List */}
      <FlatList
        data={filteredPickLists}
        renderItem={renderPickListItem}
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
        onPress={handleCreatePickList}
        label="New Pick List"
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
  pickListCard: {
    marginBottom: spacing.md,
  },
  pickListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  pickListInfo: {
    flex: 1,
  },
  salesOrderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  customerInfo: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.8,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: spacing.xs,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  priorityChip: {
    backgroundColor: 'transparent',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  pickListDetails: {
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

export default PickListScreen;