import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/dashboard/dashboard_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
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
