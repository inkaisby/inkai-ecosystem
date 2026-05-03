import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme.dart';

class AdminStatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const AdminStatCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    this.color = InkaiTheme.primaryGold,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: InkaiTheme.cardDark,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: Colors.grey,
            ),
          ),
        ],
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
      child: Column(
        children: [
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.03),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 10),
          Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 11, color: Colors.white70),
          ),
        ],
      ),
    );
  }
}

class DojoAdminDashboard extends StatelessWidget {
  final Map<String, dynamic>? user;
  const DojoAdminDashboard({super.key, this.user});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('RINGKASAN DOJO'),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 1.3,
          children: const [
            AdminStatCard(title: 'Total Anggota', value: '85', icon: LucideIcons.users),
            AdminStatCard(title: 'Aktif', value: '72', icon: LucideIcons.user_check, color: Colors.greenAccent),
            AdminStatCard(title: 'Pending Transfer', value: '3', icon: LucideIcons.arrow_right_left, color: Colors.amberAccent),
            AdminStatCard(title: 'Menunggak', value: '12', icon: LucideIcons.wallet, color: Colors.redAccent),
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
          childAspectRatio: 0.7,
          children: [
            AdminMenuItem(icon: LucideIcons.users, label: 'Daftar\nAnggota', onTap: () {}),
            AdminMenuItem(icon: LucideIcons.banknote, label: 'Laporan\nIuran', onTap: () {}),
            AdminMenuItem(icon: LucideIcons.trophy, label: 'Daftar\nKolektif', onTap: () {}),
            AdminMenuItem(icon: LucideIcons.shield_check, label: 'Verifikasi', onTap: () {}),
          ],
        ),
      ],
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('STATISTIK CABANG'),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 1.3,
          children: const [
            AdminStatCard(title: 'Total Dojo', value: '12', icon: LucideIcons.house),
            AdminStatCard(title: 'Total Anggota', value: '450', icon: LucideIcons.users),
            AdminStatCard(title: 'Pending Approval', value: '5', icon: LucideIcons.clock, color: Colors.amberAccent),
            AdminStatCard(title: 'Anggota Baru', value: '18', icon: LucideIcons.user_plus, color: Colors.greenAccent),
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
          childAspectRatio: 0.7,
          children: [
            AdminMenuItem(icon: LucideIcons.layout_dashboard, label: 'Daftar\nDojo', onTap: () {}),
            AdminMenuItem(icon: LucideIcons.users_round, label: 'Semua\nAnggota', onTap: () {}),
            AdminMenuItem(icon: LucideIcons.megaphone, label: 'Buat\nInfo', onTap: () {}),
            AdminMenuItem(icon: LucideIcons.trending_up, label: 'Laporan\nCabang', onTap: () {}),
          ],
        ),
      ],
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

class ProvinceAdminDashboard extends StatelessWidget {
  final Map<String, dynamic>? user;
  const ProvinceAdminDashboard({super.key, this.user});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('STATISTIK PROVINSI'),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 1.3,
          children: const [
            AdminStatCard(title: 'Total Cabang', value: '25', icon: LucideIcons.building_2),
            AdminStatCard(title: 'Total Dojo', value: '180', icon: LucideIcons.house),
            AdminStatCard(title: 'Total Anggota', value: '4.250', icon: LucideIcons.users),
            AdminStatCard(title: 'Pending Verif', value: '12', icon: LucideIcons.file_check, color: Colors.amberAccent),
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
          childAspectRatio: 0.7,
          children: [
            AdminMenuItem(icon: LucideIcons.building, label: 'Daftar\nCabang', onTap: () {}),
            AdminMenuItem(icon: LucideIcons.house, label: 'Semua\nDojo', onTap: () {}),
            AdminMenuItem(icon: LucideIcons.users, label: 'Data\nAnggota', onTap: () {}),
            AdminMenuItem(icon: LucideIcons.megaphone, label: 'Info\nProvinsi', onTap: () {}),
            AdminMenuItem(icon: LucideIcons.chart_pie, label: 'Lap.\nTahunan', onTap: () {}),
            AdminMenuItem(icon: LucideIcons.mail_check, label: 'Persetujuan', onTap: () {}),
          ],
        ),
      ],
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
