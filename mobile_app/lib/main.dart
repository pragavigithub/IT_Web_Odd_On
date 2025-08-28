import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:workmanager/workmanager.dart';
import 'package:permission_handler/permission_handler.dart';

import 'services/auth_service.dart';
import 'services/sync_service.dart';
import 'services/database_service.dart';
import 'services/api_service.dart';
import 'data/repositories/inventory_repository.dart';
import 'data/repositories/transfer_repository.dart';
import 'data/repositories/grpo_repository.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/main_navigation.dart';
import 'utils/app_theme.dart';
import 'utils/constants.dart';

// Background task dispatcher
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    print("Background task executed: $task");
    
    switch (task) {
      case 'syncData':
        // Initialize services for background sync
        final apiService = ApiService();
        final dbService = DatabaseService();
        await dbService.initDatabase();
        
        final syncService = SyncService(apiService, dbService);
        await syncService.syncAllData();
        break;
    }
    return Future.value(true);
  });
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize WorkManager for background sync
  await Workmanager().initialize(callbackDispatcher);
  
  // Request permissions
  await _requestPermissions();
  
  // Initialize core services
  final databaseService = DatabaseService();
  await databaseService.initDatabase();
  
  runApp(WMSMobileApp(databaseService: databaseService));
}

Future<void> _requestPermissions() async {
  await [
    Permission.camera,
    Permission.storage,
    Permission.notification,
  ].request();
}

class WMSMobileApp extends StatelessWidget {
  final DatabaseService databaseService;
  
  const WMSMobileApp({Key? key, required this.databaseService}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Core Services
        Provider<DatabaseService>.value(value: databaseService),
        Provider<ApiService>(create: (_) => ApiService()),
        
        // Auth Service
        ChangeNotifierProvider<AuthService>(
          create: (context) => AuthService(
            context.read<ApiService>(),
            context.read<DatabaseService>(),
          ),
        ),
        
        // Sync Service
        ChangeNotifierProvider<SyncService>(
          create: (context) => SyncService(
            context.read<ApiService>(),
            context.read<DatabaseService>(),
          ),
        ),
        
        // Repositories
        ChangeNotifierProvider<InventoryRepository>(
          create: (context) => InventoryRepository(
            context.read<ApiService>(),
            context.read<DatabaseService>(),
          ),
        ),
        
        ChangeNotifierProvider<TransferRepository>(
          create: (context) => TransferRepository(
            context.read<ApiService>(),
            context.read<DatabaseService>(),
          ),
        ),
        
        ChangeNotifierProvider<GRPORepository>(
          create: (context) => GRPORepository(
            context.read<ApiService>(),
            context.read<DatabaseService>(),
          ),
        ),
      ],
      child: MaterialApp(
        title: 'WMS Mobile',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        home: const SplashScreen(),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/main': (context) => const MainNavigation(),
        },
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}