import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:provider/provider.dart';
import '../auth/providers/auth_provider.dart';
import '../../core/theme.dart';

import '../billing/billing_screen.dart';
import '../events/event_list_screen.dart';
import '../profile/profile_screen.dart';
import '../store/store_screen.dart';
import '../organization/dojo_search_screen.dart';
import '../membership/membership_screen.dart';
import '../membership/attendance_history_screen.dart';
import '../membership/digital_library_screen.dart';
import '../membership/achievement_history_screen.dart';
import '../membership/dojo_transfer_screen.dart';
import 'widgets/admin_dashboard_widgets.dart';
import 'providers/notification_provider.dart';
import 'providers/admin_provider.dart';
import 'notification_screen.dart';
import '../chat/chat_list_screen.dart';
import '../events/providers/event_provider.dart';
import '../events/event_detail_screen.dart';
import 'package:intl/intl.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<NotificationProvider>(context, listen: false).fetchNotifications();
      Provider.of<AdminProvider>(context, listen: false).fetchStats();
      Provider.of<EventProvider>(context, listen: false).fetchEvents();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;
    final roles = List<String>.from(user?['roles'] ?? []);

    String? primaryRole;
    if (roles.contains('ADMIN_PUSAT') || roles.contains('ADMINISTRATOR')) {
      primaryRole = 'ADMIN_PUSAT';
    } else if (roles.contains('ADMIN_PROVINCE')) {
      primaryRole = 'ADMIN_PROVINCE';
    } else if (roles.contains('ADMIN_BRANCH')) {
      primaryRole = 'ADMIN_BRANCH';
    } else if (roles.contains('ADMIN_DOJO')) {
      primaryRole = 'ADMIN_DOJO';
    } else {
      primaryRole = 'MEMBER';
    }

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(context, user, primaryRole),
              const SizedBox(height: 32),
              _buildDashboardContent(user, primaryRole),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNav(context, primaryRole),
    );
  }

  Widget _buildDashboardContent(Map<String, dynamic>? user, String primaryRole) {
    if (_currentIndex == 2 && primaryRole.contains('ADMIN')) {
      // ADMIN TAB: Show KPIs and Executive Menu
      switch (primaryRole) {
        case 'ADMIN_DOJO':
          return DojoAdminDashboard(user: user);
        case 'ADMIN_BRANCH':
          return BranchAdminDashboard(user: user);
        case 'ADMIN_PROVINCE':
          return ProvinceAdminDashboard(user: user);
        case 'ADMIN_PUSAT':
          return NationalAdminDashboard(user: user);
      }
    }

    // HOME TAB (Index 0) or DEFAULT
    if (primaryRole.contains('ADMIN')) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildUpcomingEvents(context),
          const SizedBox(height: 32),
          _buildQuickActions(context),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildMemberCard(user),
        const SizedBox(height: 32),
        _buildQuickActions(context),
        const SizedBox(height: 32),
        _buildUpcomingEvents(context),
      ],
    );
  }

  Widget _buildHeader(BuildContext context, Map<String, dynamic>? user, String primaryRole) {
    String greeting = 'Oss';
    String subGreeting = 'Anggota Aktif';

    if (user?['roles']?.contains('PARENT') ?? false) subGreeting = 'Orang Tua / Wali';
    if (primaryRole == 'ADMIN_DOJO') subGreeting = user?['dojo']?['name'] ?? 'Ketua Dojo';
    if (primaryRole == 'ADMIN_BRANCH') subGreeting = user?['managedBranchName'] ?? 'Pengurus Cabang';
    if (primaryRole == 'ADMIN_PROVINCE') subGreeting = user?['managedProvinceName'] ?? 'Pengurus Provinsi';
    if (primaryRole == 'ADMIN_PUSAT') subGreeting = 'Superadmin • ${user?['email'] ?? ''}';

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: InkaiTheme.primaryGold, width: 2),
                ),
                child: ClipOval(
                  child: Image.asset(
                    'assets/images/inkai-logo.png',
                    width: 40,
                    height: 40,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => const Icon(LucideIcons.user, color: Colors.white, size: 20),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${greeting}, ${user?['fullName']?.split(' ')[0] ?? user?['email']?.split('@')[0] ?? 'Anggota'}!',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: InkaiTheme.textLight,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      subGreeting,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: InkaiTheme.primaryGold,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        Row(
          children: [
            if (user?['roles']?.contains('PARENT') ?? false)
              Padding(
                padding: const EdgeInsets.only(right: 8.0),
                child: InkWell(
                  onTap: () {},
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: InkaiTheme.primaryGold.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: InkaiTheme.primaryGold.withOpacity(0.2)),
                    ),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.users_round, size: 14, color: InkaiTheme.primaryGold),
                        const SizedBox(width: 4),
                        Text('Switch', style: GoogleFonts.inter(fontSize: 10, color: InkaiTheme.primaryGold, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              ),
            const SizedBox(width: 12),
            InkWell(
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChatListScreen())),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(LucideIcons.message_circle, size: 20, color: Colors.white),
              ),
            ),
            const SizedBox(width: 12),
            Consumer<NotificationProvider>(
              builder: (context, notificationProvider, _) {
                return Stack(
                  clipBehavior: Clip.none,
                  children: [
                    InkWell(
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationScreen())),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(LucideIcons.bell, size: 20, color: Colors.white),
                      ),
                    ),
                    if (notificationProvider.unreadCount > 0)
                      Positioned(
                        right: -4,
                        top: -4,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                          constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                          child: Text(
                            '${notificationProvider.unreadCount}',
                            style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
            const SizedBox(width: 12),
            InkWell(
              onTap: () => _showLogoutDialog(context),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(LucideIcons.log_out, size: 20, color: Colors.redAccent),
              ),
            ),
          ],
        ),
      ],
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Konfirmasi Logout',
          style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Apakah Anda yakin ingin keluar dari aplikasi?',
          style: GoogleFonts.inter(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Batal',
              style: GoogleFonts.inter(color: Colors.white60),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Provider.of<AuthProvider>(context, listen: false).logout();
            },
            child: Text(
              'Logout',
              style: GoogleFonts.inter(color: Colors.redAccent, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMemberCard(Map<String, dynamic>? user) {
    return Container(
      width: double.infinity,
      height: 220,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E1E24), Color(0xFF0F0F12)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: InkaiTheme.primaryGold.withOpacity(0.1),
            blurRadius: 30,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -20,
            bottom: -20,
            child: Icon(
              LucideIcons.shield,
              size: 150,
              color: Colors.white.withOpacity(0.02),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: InkaiTheme.primaryGold,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Center(
                              child: Text(
                                'I',
                                style: TextStyle(
                                    fontWeight: FontWeight.bold, color: Colors.black),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          const Text(
                            'KARTU ANGGOTA',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ],
                      ),
                      const Spacer(),
                      Text(
                        user?['nia'] ?? '000.000.000',
                        style: GoogleFonts.inter(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${user?['dojo']?['name'] ?? 'Dojo Pusat Jakarta'} - ${user?['dojo']?['branch']?['province']?['name'] ?? 'Pusat'}',
                        style: const TextStyle(fontSize: 14, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: QrImageView(
                    data: user?['nia'] ?? 'N/A',
                    version: QrVersions.auto,
                    size: 100.0,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _actionItem(LucideIcons.qr_code, 'Absensi', () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const AttendanceHistoryScreen()));
            }),
            _actionItem(LucideIcons.wallet, 'Iuran', () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const BillingScreen()));
            }),
            _actionItem(LucideIcons.book_open, 'Materi', () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const DigitalLibraryScreen()));
            }),
            _actionItem(LucideIcons.shopping_bag, 'Store', () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const StoreScreen()));
            }),
          ],
        ),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _actionItem(LucideIcons.award, 'Sabuk', () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => AchievementHistoryScreen(initialIndex: 0)));
            }),
            _actionItem(LucideIcons.scroll, 'Piagam', () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => AchievementHistoryScreen(initialIndex: 1)));
            }),
            _actionItem(LucideIcons.graduation_cap, 'Pelatihan', () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => AchievementHistoryScreen(initialIndex: 2)));
            }),
            _actionItem(LucideIcons.arrow_right_left, 'Pindah', () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => DojoTransferScreen()));
            }),
          ],
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            _actionItem(LucideIcons.file_text, 'Dokumen', () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => MembershipScreen()));
            }),
          ],
        ),
      ],
    );
  }

  Widget _actionItem(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Icon(icon, color: InkaiTheme.primaryGold),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildUpcomingEvents(BuildContext context) {
    return Consumer<EventProvider>(
      builder: (context, eventProvider, _) {
        final events = eventProvider.events;
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Event Terdekat',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                TextButton(
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EventListScreen())),
                  child: const Text('Lihat Semua', style: TextStyle(color: InkaiTheme.primaryGold, fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (eventProvider.isLoading)
              const Center(child: Padding(
                padding: EdgeInsets.all(20.0),
                child: CircularProgressIndicator(color: InkaiTheme.primaryGold),
              ))
            else if (events.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.03),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withOpacity(0.05)),
                ),
                child: const Center(
                  child: Text('Belum ada event terdekat.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                ),
              )
            else
              ...events.take(3).map((event) => _buildEventItem(context, event)),
          ],
        );
      },
    );
  }

  Widget _buildEventItem(BuildContext context, dynamic event) {
    final bool isUKTEvent = event['title'].toString().toUpperCase().contains('UKT') || 
                            event['title'].toString().toUpperCase().contains('UJIAN');
    
    return InkWell(
      onTap: () {
        Navigator.push(
          context, 
          MaterialPageRoute(builder: (_) => EventDetailScreen(event: event))
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.03),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: (isUKTEvent ? Colors.blue : Colors.amber).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                isUKTEvent ? LucideIcons.award : LucideIcons.trophy, 
                color: isUKTEvent ? Colors.blue : Colors.amber,
                size: 20,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event['title'] ?? 'Judul Event',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${DateFormat('dd MMM').format(DateTime.parse(event['startDate']))} | ${event['location'] ?? 'Indonesia'}',
                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                  ),
                ],
              ),
            ),
            const Icon(LucideIcons.chevron_right, color: Colors.grey, size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNav(BuildContext context, String primaryRole) {
    final List<Map<String, dynamic>> items = [
      {'icon': LucideIcons.house, 'label': 'Home', 'index': 0},
    ];

    if (primaryRole.contains('ADMIN') && primaryRole != 'ADMIN_BRANCH' && primaryRole != 'ADMIN_DOJO') {
      items.add({'icon': LucideIcons.map, 'label': 'Provinsi', 'index': 1});
    }

    if (primaryRole.toUpperCase().contains('ADMIN')) {
      items.add({'icon': LucideIcons.shield, 'label': 'Admin', 'index': 2});
    }

    items.add({'icon': LucideIcons.user, 'label': 'Profil', 'index': 3});

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: InkaiTheme.backgroundDark,
        border: Border(top: BorderSide(color: Colors.white.withOpacity(0.05))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: items.map((item) {
          final int itemIndex = item['index'];
          final bool isCurrent = _currentIndex == itemIndex;

          return _navIcon(item['icon'], item['label'], isCurrent, () {
            if (itemIndex == 0 || itemIndex == 2) {
              setState(() => _currentIndex = itemIndex);
            } else if (itemIndex == 1) {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const DojoSearchScreen()));
            } else if (itemIndex == 3) {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen()));
            }
          });
        }).toList(),
      ),
    );
  }

  Widget _navIcon(IconData icon, String label, bool isActive, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 20,
            color: isActive ? InkaiTheme.primaryGold : Colors.white24,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 9,
              fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
              color: isActive ? InkaiTheme.primaryGold : Colors.white24,
            ),
          ),
        ],
      ),
    );
  }
}

