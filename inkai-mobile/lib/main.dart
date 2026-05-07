import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/dashboard/providers/notification_provider.dart';
import 'features/dashboard/providers/admin_provider.dart';
import 'features/events/providers/event_provider.dart';
import 'core/services/chat_service.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/dashboard/dashboard_screen.dart';

import 'core/network/sync_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Start background sync
  SyncService().syncData().catchError((e) => print('Sync Error: $e'));

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
        ChangeNotifierProvider(create: (_) => AdminProvider()),
        ChangeNotifierProvider(create: (_) => EventProvider()),
        ChangeNotifierProvider(create: (_) => ChatService()),
      ],
      child: const InkaiApp(),
    ),
  );
}

class InkaiApp extends StatelessWidget {
  const InkaiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'INKAI Mobile',
      debugShowCheckedModeBanner: false,
      theme: InkaiTheme.darkTheme,
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return auth.isAuthenticated ? const DashboardScreen() : const LoginScreen();
        },
      ),
    );
  }
}
