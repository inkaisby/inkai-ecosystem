import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:google_fonts/google_fonts.dart';
import 'providers/notification_provider.dart';
import '../../core/theme.dart';
import 'package:timeago/timeago.dart' as timeago;

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  @override
  void initState() {
    super.initState();
    timeago.setLocaleMessages('id', timeago.IdMessages());
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<NotificationProvider>(context, listen: false).fetchNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: InkaiTheme.backgroundDark,
      appBar: AppBar(
        title: Text(
          'NOTIFIKASI',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: Consumer<NotificationProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.notifications.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: InkaiTheme.primaryGold));
          }

          if (provider.notifications.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.bell_off, size: 64, color: Colors.white.withOpacity(0.1)),
                  const SizedBox(height: 16),
                  Text(
                    'Tidak ada notifikasi baru',
                    style: GoogleFonts.inter(color: Colors.grey),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: provider.fetchNotifications,
            color: InkaiTheme.primaryGold,
            child: ListView.builder(
              padding: const EdgeInsets.all(24),
              itemCount: provider.notifications.length,
              itemBuilder: (context, index) {
                final notification = provider.notifications[index];
                final bool isRead = notification['isRead'] ?? false;
                final DateTime createdAt = DateTime.parse(notification['createdAt']);

                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: isRead ? Colors.white.withOpacity(0.02) : Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isRead ? Colors.white.withOpacity(0.05) : InkaiTheme.primaryGold.withOpacity(0.2),
                    ),
                  ),
                  child: ListTile(
                    onTap: () {
                      if (!isRead) {
                        provider.markAsRead(notification['id']);
                      }
                    },
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: _getIconColor(notification['type']).withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _getIcon(notification['type']),
                        size: 20,
                        color: _getIconColor(notification['type']),
                      ),
                    ),
                    title: Text(
                      notification['title'] ?? 'Notifikasi',
                      style: GoogleFonts.inter(
                        fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        Text(
                          notification['content'] ?? '',
                          style: GoogleFonts.inter(fontSize: 12, color: Colors.grey),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          timeago.format(createdAt, locale: 'id'),
                          style: GoogleFonts.inter(fontSize: 10, color: Colors.white24),
                        ),
                      ],
                    ),
                    trailing: !isRead 
                      ? Container(width: 8, height: 8, decoration: const BoxDecoration(color: InkaiTheme.primaryGold, shape: BoxShape.circle))
                      : null,
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  IconData _getIcon(String? type) {
    switch (type) {
      case 'INFO': return LucideIcons.info;
      case 'BILLING': return LucideIcons.wallet;
      case 'EVENT': return LucideIcons.calendar;
      case 'VERIFICATION': return LucideIcons.shield_check;
      default: return LucideIcons.bell;
    }
  }

  Color _getIconColor(String? type) {
    switch (type) {
      case 'INFO': return Colors.blueAccent;
      case 'BILLING': return Colors.amberAccent;
      case 'EVENT': return Colors.greenAccent;
      case 'VERIFICATION': return Colors.purpleAccent;
      default: return InkaiTheme.primaryGold;
    }
  }
}
