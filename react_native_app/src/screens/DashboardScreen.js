/**
 * Dashboard Screen for WMS Mobile App
 * Main overview screen with quick access to all modules
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  Dimensions
} from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Button,
  Chip,
  FAB,
  Portal
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { theme, spacing } from '../theme/theme';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    grpoCount: 0,
    transferCount: 0,
    pickListCount: 0,
    pendingSync: 0,
  });
  const [fabOpen, setFabOpen] = useState(false);

  const { user, signOut } = useAuth();
  const { syncWithServer, syncStatus, db } = useDatabase();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const grpos = await db.getGRPODocuments(user?.id);
      const transfers = await db.getInventoryTransfers(user?.id);
      const pickLists = await db.getPickLists(user?.id);
      const syncQueue = await db.getSyncQueue();

      setStats({
        grpoCount: grpos.length,
        transferCount: transfers.length,
        pickListCount: pickLists.length,
        pendingSync: syncQueue.length,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncWithServer();
      await loadDashboardStats();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const StatCard = ({ title, count, color, icon, onPress }) => (
    <Card style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <Card.Content style={styles.statContent}>
        <View style={styles.statHeader}>
          <Icon name={icon} size={24} color={color} />
          <Text style={[styles.statCount, { color }]}>{count}</Text>
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </Card.Content>
    </Card>
  );

  const QuickActionCard = ({ title, subtitle, icon, color, onPress }) => (
    <Card style={styles.actionCard} onPress={onPress}>
      <Card.Content style={styles.actionContent}>
        <Icon name={icon} size={32} color={color} />
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Title style={styles.welcomeTitle}>
              Welcome, {user?.first_name || user?.username}
            </Title>
            <Text style={styles.roleText}>
              {user?.role?.toUpperCase()} • {user?.branch_code}
            </Text>
          </View>
          <View style={styles.syncStatus}>
            <Chip 
              icon={syncStatus === 'syncing' ? 'sync' : 'check'}
              mode="outlined"
              compact
            >
              {syncStatus === 'syncing' ? 'Syncing...' : 'Synced'}
            </Chip>
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="GRPO Documents"
              count={stats.grpoCount}
              color={theme.colors.primary}
              icon="package-variant"
              onPress={() => navigation.navigate('GRPO')}
            />
            <StatCard
              title="Inventory Transfers"
              count={stats.transferCount}
              color={theme.colors.warning}
              icon="swap-horizontal"
              onPress={() => navigation.navigate('Inventory')}
            />
            <StatCard
              title="Pick Lists"
              count={stats.pickListCount}
              color={theme.colors.success}
              icon="clipboard-list"
              onPress={() => navigation.navigate('PickList')}
            />
            <StatCard
              title="Pending Sync"
              count={stats.pendingSync}
              color={theme.colors.error}
              icon="sync-alert"
              onPress={() => handleRefresh()}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickActionCard
              title="Scan Barcode"
              subtitle="Scan items quickly"
              icon="barcode-scan"
              color={theme.colors.primary}
              onPress={() => navigation.navigate('BarcodeScanner')}
            />
            <QuickActionCard
              title="New GRPO"
              subtitle="Goods receipt"
              icon="package-variant-plus"
              color={theme.colors.primary}
              onPress={() => navigation.navigate('GRPO', { screen: 'CreateGRPO' })}
            />
            <QuickActionCard
              title="New Transfer"
              subtitle="Move inventory"
              icon="swap-horizontal"
              color={theme.colors.warning}
              onPress={() => navigation.navigate('Inventory', { screen: 'CreateInventoryTransfer' })}
            />
            <QuickActionCard
              title="New Pick List"
              subtitle="Pick orders"
              icon="clipboard-plus"
              color={theme.colors.success}
              onPress={() => navigation.navigate('PickList', { screen: 'CreatePickList' })}
            />
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <Portal>
        <FAB.Group
          open={fabOpen}
          icon={fabOpen ? 'close' : 'plus'}
          actions={[
            {
              icon: 'barcode-scan',
              label: 'Scan Barcode',
              onPress: () => navigation.navigate('BarcodeScanner'),
            },
            {
              icon: 'sync',
              label: 'Sync Data',
              onPress: handleRefresh,
            },
            {
              icon: 'logout',
              label: 'Logout',
              onPress: signOut,
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          visible={true}
        />
      </Portal>
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  roleText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  syncStatus: {
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.md,
  },
  statsContainer: {
    padding: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - spacing.lg * 3) / 2,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  statContent: {
    alignItems: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statCount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  actionsContainer: {
    padding: spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - spacing.lg * 3) / 2,
    marginBottom: spacing.md,
  },
  actionContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: spacing.xs,
    color: theme.colors.onSurface,
  },
  actionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: theme.colors.onSurface,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
});

export default DashboardScreen;