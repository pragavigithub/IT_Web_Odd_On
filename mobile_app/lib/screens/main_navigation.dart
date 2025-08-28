import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../widgets/custom_bottom_nav.dart';
import 'dashboard_screen.dart';
import 'inventory_transfer_screen.dart';
import 'grpo_screen.dart';
import 'qc_dashboard_screen.dart';
import 'barcode_scanner_screen.dart';

class MainNavigation extends StatefulWidget {
  const MainNavigation({Key? key}) : super(key: key);

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;
  final PageController _pageController = PageController();

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onTabTapped(int index) {
    setState(() {
      _currentIndex = index;
    });
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void _showQuickScanDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _QuickScanBottomSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    
    if (!authService.isLoggedIn) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    final List<Widget> screens = [
      const DashboardScreen(),
      if (authService.canAccessInventoryTransfer) const InventoryTransferScreen(),
      if (authService.canAccessGRPO) const GRPOScreen(),
      if (authService.canAccessQCDashboard) const QCDashboardScreen(),
    ];

    final List<BottomNavItem> navItems = [
      const BottomNavItem(
        icon: Icons.dashboard,
        label: 'Dashboard',
      ),
      if (authService.canAccessInventoryTransfer)
        const BottomNavItem(
          icon: Icons.swap_horiz,
          label: 'Transfers',
        ),
      if (authService.canAccessGRPO)
        const BottomNavItem(
          icon: Icons.inventory,
          label: 'GRPO',
        ),
      if (authService.canAccessQCDashboard)
        const BottomNavItem(
          icon: Icons.verified,
          label: 'QC',
        ),
    ];

    return Scaffold(
      body: PageView(
        controller: _pageController,
        onPageChanged: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        children: screens,
      ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: _currentIndex,
        items: navItems,
        onTap: _onTabTapped,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showQuickScanDialog,
        child: const Icon(Icons.qr_code_scanner),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
    );
  }
}

class _QuickScanBottomSheet extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Quick Scan',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 20),
          _QuickScanOption(
            icon: Icons.inventory_2,
            title: 'Scan Item Barcode',
            subtitle: 'Scan product barcode for inventory',
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => BarcodeScannerScreen(
                    title: 'Scan Item Barcode',
                    hint: 'Point camera at item barcode',
                    onBarcodeDetected: (barcode) {
                      // Handle item barcode scan
                      _showBarcodeResult(context, 'Item Barcode', barcode);
                    },
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 12),
          _QuickScanOption(
            icon: Icons.location_on,
            title: 'Scan Bin Location',
            subtitle: 'Scan bin location barcode',
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => BarcodeScannerScreen(
                    title: 'Scan Bin Location',
                    hint: 'Point camera at bin location barcode',
                    onBarcodeDetected: (barcode) {
                      // Handle bin location scan
                      _showBarcodeResult(context, 'Bin Location', barcode);
                    },
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 12),
          _QuickScanOption(
            icon: Icons.qr_code,
            title: 'Scan Transfer Request',
            subtitle: 'Scan transfer request QR code',
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => BarcodeScannerScreen(
                    title: 'Scan Transfer Request',
                    hint: 'Point camera at transfer request QR code',
                    onBarcodeDetected: (barcode) {
                      // Handle transfer request scan
                      _showBarcodeResult(context, 'Transfer Request', barcode);
                    },
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  void _showBarcodeResult(BuildContext context, String type, String barcode) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('$type Scanned'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Code: $barcode'),
            const SizedBox(height: 12),
            const Text('What would you like to do?'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Navigate to appropriate screen based on type
              // This would be implemented based on your specific requirements
            },
            child: const Text('View Details'),
          ),
        ],
      ),
    );
  }
}

class _QuickScanOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _QuickScanOption({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                color: Theme.of(context).primaryColor,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: Colors.grey,
            ),
          ],
        ),
      ),
    );
  }
}