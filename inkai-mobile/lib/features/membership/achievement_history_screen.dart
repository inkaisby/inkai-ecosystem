import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../auth/providers/auth_provider.dart';

import 'add_achievement_screen.dart';

class AchievementHistoryScreen extends StatelessWidget {
  final int initialIndex;
  const AchievementHistoryScreen({super.key, this.initialIndex = 0});

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final List<dynamic> ranks = user?['ranks'] ?? [];
    
    return DefaultTabController(
      length: 3,
      initialIndex: initialIndex,
      child: Scaffold(
        backgroundColor: InkaiTheme.backgroundDark,
        appBar: AppBar(
          title: Text(
            'RIWAYAT & PRESTASI',
            style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
          centerTitle: true,
          bottom: TabBar(
            indicatorColor: InkaiTheme.primaryGold,
            labelColor: InkaiTheme.primaryGold,
            unselectedLabelColor: Colors.grey,
            labelStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold),
            tabs: const [
              Tab(text: 'Sabuk'),
              Tab(text: 'Piagam'),
              Tab(text: 'Pelatihan'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildSabukTab(context, ranks),
            _buildPiagamTab(context, user),
            _buildPelatihanTab(context, user),
          ],
        ),
      ),
    );
  }

  Widget _buildSabukTab(BuildContext context, List<dynamic> ranks) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('RIWAYAT KENAIKAN TINGKAT:'),
          const SizedBox(height: 16),
          if (ranks.isEmpty)
            _buildEmptyState('Belum ada riwayat kenaikan tingkat.')
          else
            ...ranks.map((rank) => _buildHistoryCard(
                  title: rank['rank'] ?? 'Sabuk',
                  date: rank['date'] != null 
                    ? DateFormat('dd MMM yyyy').format(DateTime.parse(rank['date']))
                    : '-',
                  location: rank['location'] ?? 'N/A',
                  isValidated: rank['isVerified'] ?? false,
                )),
          const SizedBox(height: 32),
          _buildStatusLegend(),
          const SizedBox(height: 32),
          _buildAddButton(context, 'TAMBAH DATA KENAIKAN MANUAL'),
        ],
      ),
    );
  }

  Widget _buildPiagamTab(BuildContext context, Map<String, dynamic>? user) {
    // For now using eventRegistrations as proxy for certificates if they are 'COMPLETED'
    final List<dynamic> events = user?['eventRegistrations'] ?? [];
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('RIWAYAT PIAGAM & PERTANDINGAN:'),
          const SizedBox(height: 16),
          if (events.isEmpty)
            _buildEmptyState('Belum ada riwayat pertandingan.')
          else
            ...events.map((e) => _buildHistoryCard(
                  title: e['event']?['title'] ?? 'Pertandingan',
                  date: e['createdAt'] != null 
                    ? DateFormat('dd MMM yyyy').format(DateTime.parse(e['createdAt']))
                    : '-',
                  location: e['event']?['location'] ?? 'Lokasi Terdaftar',
                  isValidated: e['status'] == 'APPROVED',
                )),
          const SizedBox(height: 32),
          _buildAddButton(context, 'TAMBAH PIAGAM / PERTANDINGAN'),
        ],
      ),
    );
  }

  Widget _buildPelatihanTab(BuildContext context, Map<String, dynamic>? user) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('RIWAYAT PELATIHAN & TEKNIS:'),
          const SizedBox(height: 16),
          _buildEmptyState('Belum ada riwayat pelatihan.'),
          const SizedBox(height: 32),
          _buildAddButton(context, 'TAMBAH RIWAYAT PELATIHAN'),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(LucideIcons.folder_open, size: 40, color: Colors.white.withOpacity(0.1)),
          const SizedBox(height: 12),
          Text(
            message,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 12, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
    );
  }

  Widget _buildHistoryCard({
    required String title,
    required String date,
    required String location,
    required bool isValidated,
  }) {
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
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white)),
                const SizedBox(height: 4),
                Text('Tanggal: $date', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey)),
                Text('Lokasi : $location', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey)),
              ],
            ),
          ),
          Icon(
            isValidated ? LucideIcons.check : LucideIcons.info,
            color: isValidated ? Colors.greenAccent : Colors.amber,
            size: 20,
          ),
        ],
      ),
    );
  }

  Widget _buildStatusLegend() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'STATUS VERIFIKASI:', 
            style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white54, letterSpacing: 1)
          ),
          const SizedBox(height: 12),
          _legendItem(LucideIcons.check, Colors.greenAccent, 'Data sudah divalidasi Pusat'),
          const SizedBox(height: 8),
          _legendItem(LucideIcons.info, Colors.amber, 'Menunggu Validasi'),
        ],
      ),
    );
  }

  Widget _legendItem(IconData icon, Color color, String label) {
    return Row(
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 10),
        Text(label, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey)),
      ],
    );
  }

  Widget _buildAddButton(BuildContext context, String label) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddAchievementScreen())),
        icon: const Icon(LucideIcons.plus, size: 18),
        label: Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold)),
        style: OutlinedButton.styleFrom(
          foregroundColor: InkaiTheme.primaryGold,
          side: const BorderSide(color: InkaiTheme.primaryGold),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }
}
