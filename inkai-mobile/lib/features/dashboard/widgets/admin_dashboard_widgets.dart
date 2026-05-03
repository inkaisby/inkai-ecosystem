import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/admin_provider.dart';
import '../../../core/theme.dart';
import '../../billing/billing_screen.dart';
import '../../organization/dojo_search_screen.dart';
import '../../membership/membership_screen.dart';
import '../../membership/achievement_history_screen.dart';
import '../../events/event_list_screen.dart';
import '../../organization/regional_list_screen.dart';
import '../../organization/dojo_members_screen.dart';
import '../create_info_screen.dart';
import '../branch_report_screen.dart';

class AdminStatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  const AdminStatCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    this.color = InkaiTheme.primaryGold,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            children: [
              Icon(icon, size: 16, color: color.withOpacity(0.8)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        value,
                        style: GoogleFonts.jetBrainsMono(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ),
                    Text(
                      title.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 8,
                        fontWeight: FontWeight.w600,
                        color: Colors.white30,
                        letterSpacing: 0.2,
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
      ),
    );
  }
}

class AdminMenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;

  const AdminMenuItem({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
    this.color = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Column(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.03),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 32, // Fixed height for 2 lines of text
              child: Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(fontSize: 10, color: Colors.white70, height: 1.2),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class DojoAdminDashboard extends StatelessWidget {
  final Map<String, dynamic>? user;
  const DojoAdminDashboard({super.key, this.user});

  @override
  Widget build(BuildContext context) {
    return Consumer<AdminProvider>(
      builder: (context, adminProvider, _) {
        final stats = adminProvider.stats;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildSectionTitle('RINGKASAN DOJO'),
                if (adminProvider.isLoading)
                  const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: InkaiTheme.primaryGold)),
              ],
            ),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 2.5,
              children: [
                AdminStatCard(title: 'Total Anggota', value: '${stats['totalMembers'] ?? 0}', icon: LucideIcons.users),
                AdminStatCard(title: 'Aktif', value: '${stats['activeMembers'] ?? stats['totalMembers'] ?? 0}', icon: LucideIcons.user_check, color: Colors.greenAccent),
                AdminStatCard(title: 'Pending Transfer', value: '${stats['pendingTransfers'] ?? 0}', icon: LucideIcons.arrow_right_left, color: Colors.amberAccent),
                AdminStatCard(title: 'Menunggak', value: '${stats['latePayment'] ?? 0}', icon: LucideIcons.wallet, color: Colors.redAccent),
              ],
            ),
            const SizedBox(height: 32),
            _buildSectionTitle('MENU ADMIN'),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 4,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 16,
              childAspectRatio: 0.55,
              children: [
                AdminMenuItem(icon: LucideIcons.users, label: 'Daftar\nAnggota', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const MembershipScreen()));
                }),
                AdminMenuItem(icon: LucideIcons.banknote, label: 'Laporan\nIuran', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const BillingScreen()));
                }),
                AdminMenuItem(icon: LucideIcons.trophy, label: 'Daftar\nKolektif', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => AchievementHistoryScreen(initialIndex: 0)));
                }),
                AdminMenuItem(icon: LucideIcons.shield_check, label: 'Verifikasi', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const MembershipScreen()));
                }),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.bold,
        letterSpacing: 1.2,
        color: Colors.white54,
      ),
    );
  }
}

class BranchAdminDashboard extends StatelessWidget {
  final Map<String, dynamic>? user;
  const BranchAdminDashboard({super.key, this.user});

  @override
  Widget build(BuildContext context) {
    return Consumer<AdminProvider>(
      builder: (context, adminProvider, _) {
        final stats = adminProvider.stats;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildSectionTitle('STATISTIK CABANG'),
                if (adminProvider.isLoading)
                  const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: InkaiTheme.primaryGold)),
              ],
            ),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 2.5,
              children: [
                AdminStatCard(title: 'Total Dojo', value: '${stats['totalDojos'] ?? 0}', icon: LucideIcons.house),
                AdminStatCard(title: 'Total Anggota', value: '${stats['totalMembers'] ?? 0}', icon: LucideIcons.users),
                AdminStatCard(title: 'Pending Approval', value: '${stats['pendingVerifications'] ?? 0}', icon: LucideIcons.clock, color: Colors.amberAccent),
                AdminStatCard(title: 'Anggota Baru', value: '${stats['newMembers'] ?? 0}', icon: LucideIcons.user_plus, color: Colors.greenAccent),
              ],
            ),
            const SizedBox(height: 32),
            _buildSectionTitle('MENU UTAMA'),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 4,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 16,
              childAspectRatio: 0.55,
              children: [
                AdminMenuItem(icon: LucideIcons.layout_dashboard, label: 'Daftar\nDojo', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => RegionalListScreen(
                    title: 'Daftar Dojo', 
                    type: 'DOJO', 
                    parentId: user?['managedBranchId'] ?? ''
                  )));
                }),
                AdminMenuItem(icon: LucideIcons.users_round, label: 'Semua\nAnggota', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const DojoMembersScreen(
                    dojoId: '', 
                    dojoName: 'Seluruh Anggota Cabang'
                  )));
                }),
                AdminMenuItem(icon: LucideIcons.megaphone, label: 'Buat\nInfo', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateInfoScreen()));
                }),
                AdminMenuItem(icon: LucideIcons.trending_up, label: 'Laporan\nCabang', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const BranchReportScreen()));
                }),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.bold,
        letterSpacing: 1.2,
        color: Colors.white54,
      ),
    );
  }
}

class NationalAdminDashboard extends StatelessWidget {
  final Map<String, dynamic>? user;
  const NationalAdminDashboard({super.key, this.user});

  @override
  Widget build(BuildContext context) {
    return Consumer<AdminProvider>(
      builder: (context, adminProvider, _) {
        final stats = adminProvider.stats;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildSectionTitle('STATISTIK NASIONAL'),
                if (adminProvider.isLoading)
                  const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: InkaiTheme.primaryGold)),
              ],
            ),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 2.5,
              children: [
                AdminStatCard(
                  title: 'TOTAL PROVINSI', 
                  value: '${stats['totalProvinces'] ?? 38}', 
                  icon: LucideIcons.map,
                  onTap: () => Navigator.push(context, MaterialPageRoute(
                    builder: (_) => RegionalListScreen(title: 'Daftar Provinsi', type: 'PROVINCE')
                  )),
                ),
                AdminStatCard(
                  title: 'TOTAL CABANG', 
                  value: '${stats['totalBranches'] ?? 520}', 
                  icon: LucideIcons.building_2,
                  onTap: () => Navigator.push(context, MaterialPageRoute(
                    builder: (_) => RegionalListScreen(title: 'Daftar Cabang', type: 'BRANCH')
                  )),
                ),
                AdminStatCard(
                  title: 'TOTAL ANGGOTA', 
                  value: '${stats['totalMembers'] ?? '125k'}', 
                  icon: LucideIcons.users,
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => DojoMembersScreen(dojoId: '', dojoName: 'Seluruh Anggota'))),
                ),
                AdminStatCard(
                  title: 'TOTAL DOJO', 
                  value: '${stats['totalDojos'] ?? '3.4k'}', 
                  icon: LucideIcons.house,
                  onTap: () => Navigator.push(context, MaterialPageRoute(
                    builder: (_) => RegionalListScreen(title: 'Daftar Dojo', type: 'DOJO')
                  )),
                ),
              ],
            ),
            const SizedBox(height: 32),
            _buildSectionTitle('MENU EKSEKUTIF PUSAT'),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 4,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 16,
              childAspectRatio: 0.55,
              children: [
                AdminMenuItem(icon: LucideIcons.map, label: 'Daftar\nProvinsi', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const RegionalListScreen(
                    title: 'Daftar Provinsi', 
                    type: 'PROVINCE'
                  )));
                }),
                AdminMenuItem(icon: LucideIcons.trending_up, label: 'Laporan\nNasional', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const BranchReportScreen()));
                }),
                AdminMenuItem(icon: LucideIcons.users, label: 'Data\nAnggota', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const DojoMembersScreen(
                    dojoId: '', 
                    dojoName: 'Data Anggota Nasional'
                  )));
                }),
                AdminMenuItem(icon: LucideIcons.megaphone, label: 'Info\nNasional', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateInfoScreen()));
                }),
                AdminMenuItem(icon: LucideIcons.calendar_days, label: 'Event &\nUjian', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const EventListScreen()));
                }),
                AdminMenuItem(icon: LucideIcons.mail_check, label: 'Approval\nPP', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const MembershipScreen()));
                }),
              ],
            ),
            const SizedBox(height: 32),
            _buildSectionTitle('AGENDA NASIONAL TERDEKAT'),
            const SizedBox(height: 16),
            _buildAgendaItem('Kejurnas INKAI 2026 - Jakarta', '12 - 15 Agustus 2026'),
            _buildAgendaItem('Ujian DAN Nasional Gelombang I', '20 September 2026'),
          ],
        );
      },
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.bold,
        letterSpacing: 1.2,
        color: Colors.white54,
      ),
    );
  }

  Widget _buildAgendaItem(String title, String date) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.calendar, size: 20, color: InkaiTheme.primaryGold),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                Text(date, style: const TextStyle(color: Colors.white54, fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ProvinceAdminDashboard extends StatelessWidget {
  final Map<String, dynamic>? user;
  const ProvinceAdminDashboard({super.key, this.user});

  @override
  Widget build(BuildContext context) {
    return Consumer<AdminProvider>(
      builder: (context, adminProvider, _) {
        final stats = adminProvider.stats;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildSectionTitle('STATISTIK PROVINSI'),
                if (adminProvider.isLoading)
                  const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: InkaiTheme.primaryGold)),
              ],
            ),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 2.5,
              children: [
                AdminStatCard(title: 'Total Cabang', value: '${stats['totalBranches'] ?? stats['totalProvinces'] ?? 0}', icon: LucideIcons.building_2),
                AdminStatCard(title: 'Total Dojo', value: '${stats['totalDojos'] ?? 0}', icon: LucideIcons.house),
                AdminStatCard(title: 'Total Anggota', value: '${stats['totalMembers'] ?? 0}', icon: LucideIcons.users),
                AdminStatCard(title: 'Pending Verif', value: '${stats['pendingVerifications'] ?? 0}', icon: LucideIcons.file_check, color: Colors.amberAccent),
              ],
            ),
            const SizedBox(height: 32),
            _buildSectionTitle('MENU EKSEKUTIF'),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 4,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 16,
              childAspectRatio: 0.55,
              children: [
                AdminMenuItem(icon: LucideIcons.building, label: 'Daftar\nCabang', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => RegionalListScreen(
                    title: 'Daftar Cabang', 
                    type: 'BRANCH', 
                    parentId: user?['managedProvinceId'] ?? ''
                  )));
                }),
                AdminMenuItem(icon: LucideIcons.house, label: 'Semua\nDojo', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => RegionalListScreen(
                    title: 'Daftar Dojo', 
                    type: 'DOJO', 
                    parentId: user?['managedProvinceId'] ?? ''
                  )));
                }),
                AdminMenuItem(icon: LucideIcons.users, label: 'Data\nAnggota', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const DojoMembersScreen(
                    dojoId: '', 
                    dojoName: 'Seluruh Anggota Provinsi'
                  )));
                }),
                AdminMenuItem(icon: LucideIcons.megaphone, label: 'Info\nProvinsi', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateInfoScreen()));
                }),
                AdminMenuItem(icon: LucideIcons.chart_pie, label: 'Lap.\nTahunan', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const BranchReportScreen()));
                }),
                AdminMenuItem(icon: LucideIcons.mail_check, label: 'Persetujuan', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const MembershipScreen()));
                }),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.bold,
        letterSpacing: 1.2,
        color: Colors.white54,
      ),
    );
  }
}
