import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../core/theme.dart';

class AchievementHistoryScreen extends StatelessWidget {
  const AchievementHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: InkaiTheme.backgroundDark,
        appBar: AppBar(
          title: const Text('Riwayat & Prestasi'),
          backgroundColor: Colors.transparent,
          elevation: 0,
          bottom: TabBar(
            indicatorColor: InkaiTheme.primaryGold,
            labelColor: InkaiTheme.primaryGold,
            unselectedLabelColor: Colors.grey,
            tabs: const [
              Tab(text: 'Sabuk'),
              Tab(text: 'Piagam/Latih'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildSabukTab(),
            _buildPiagamTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildSabukTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('RIWAYAT KENAIKAN TINGKAT:'),
          const SizedBox(height: 16),
          _buildHistoryCard(
            title: 'Sabuk Hitam - DAN 1',
            date: '20 Feb 2027',
            location: 'Jakarta (Pusat)',
            isValidated: true,
          ),
          _buildHistoryCard(
            title: 'Sabuk Coklat - KYU 1',
            date: '15 Jan 2026',
            location: 'Surabaya',
            isValidated: true,
          ),
          _buildHistoryCard(
            title: 'Sabuk Biru - KYU 2',
            date: '10 Juli 2025',
            location: 'Sidoarjo',
            isValidated: false,
          ),
          const SizedBox(height: 32),
          _buildStatusLegend(),
          const SizedBox(height: 32),
          _buildAddButton('TAMBAH DATA KENAIKAN MANUAL'),
        ],
      ),
    );
  }

  Widget _buildPiagamTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('RIWAYAT PIAGAM & PELATIHAN:'),
          const SizedBox(height: 16),
          _buildHistoryCard(
            title: 'Juara 1 Kumite - Kejurnas',
            date: '15 Agustus 2026',
            location: 'Jakarta',
            isValidated: true,
          ),
          _buildHistoryCard(
            title: 'Peserta Gashuku Nasional',
            date: '10 Mei 2026',
            location: 'Semarang',
            isValidated: true,
          ),
          const SizedBox(height: 32),
          _buildAddButton('TAMBAH PIAGAM / PELATIHAN'),
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
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 4),
                Text('Tanggal: $date', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                Text('Lokasi : $location', style: const TextStyle(fontSize: 12, color: Colors.grey)),
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
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('STATUS VERIFIKASI:', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
          const SizedBox(height: 8),
          _legendItem(LucideIcons.check, Colors.greenAccent, 'Data sudah divalidasi Pusat'),
          const SizedBox(height: 4),
          _legendItem(LucideIcons.info, Colors.amber, 'Menunggu Validasi'),
        ],
      ),
    );
  }

  Widget _legendItem(IconData icon, Color color, String label) {
    return Row(
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 8),
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
      ],
    );
  }

  Widget _buildAddButton(String label) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () {},
        icon: const Icon(Icons.add, size: 18),
        label: Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
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
