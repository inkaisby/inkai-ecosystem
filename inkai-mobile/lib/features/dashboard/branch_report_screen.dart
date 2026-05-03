import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'providers/admin_provider.dart';
import '../../core/theme.dart';
import 'package:intl/intl.dart';

class BranchReportScreen extends StatelessWidget {
  const BranchReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

    return Scaffold(
      backgroundColor: InkaiTheme.backgroundDark,
      appBar: AppBar(
        title: Text('LAPORAN CABANG', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Consumer<AdminProvider>(
        builder: (context, adminProvider, _) {
          final stats = adminProvider.stats;
          
          if (adminProvider.isLoading) {
            return const Center(child: CircularProgressIndicator(color: InkaiTheme.primaryGold));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSummarySection(stats),
                const SizedBox(height: 32),
                _buildSectionTitle('PERTUMBUHAN ANGGOTA'),
                const SizedBox(height: 16),
                _buildChartPlaceholder(),
                const SizedBox(height: 32),
                _buildSectionTitle('REKAPITULASI IURAN'),
                const SizedBox(height: 16),
                _buildFinancialCard(currencyFormat, stats['iuranTotal'] ?? 0),
                const SizedBox(height: 32),
                _buildSectionTitle('DISTRIBUSI TINGKATAN'),
                const SizedBox(height: 16),
                _buildRankDistribution(),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        color: InkaiTheme.primaryGold,
        letterSpacing: 1.2,
      ),
    );
  }

  Widget _buildSummarySection(Map<String, dynamic> stats) {
    return Row(
      children: [
        Expanded(child: _buildMiniStat('TOTAL DOJO', '${stats['totalDojos'] ?? 0}', LucideIcons.house)),
        const SizedBox(width: 16),
        Expanded(child: _buildMiniStat('TOTAL ANGGOTA', '${stats['totalMembers'] ?? 0}', LucideIcons.users)),
      ],
    );
  }

  Widget _buildMiniStat(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: Colors.white30),
          const SizedBox(height: 12),
          Text(value, style: GoogleFonts.jetBrainsMono(fontSize: 20, fontWeight: FontWeight.bold)),
          Text(label, style: GoogleFonts.inter(fontSize: 9, color: Colors.white24)),
        ],
      ),
    );
  }

  Widget _buildChartPlaceholder() {
    return Container(
      height: 180,
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              _buildBar(0.3, 'Jan'),
              _buildBar(0.45, 'Feb'),
              _buildBar(0.6, 'Mar'),
              _buildBar(0.55, 'Apr'),
              _buildBar(0.8, 'Mei'),
              _buildBar(1.0, 'Jun'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBar(double heightFactor, String label) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Container(
          width: 20,
          height: 120 * heightFactor,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [InkaiTheme.primaryGold, InkaiTheme.primaryGold.withOpacity(0.1)],
            ),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(fontSize: 9, color: Colors.white24)),
      ],
    );
  }

  Widget _buildFinancialCard(NumberFormat formatter, dynamic total) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.green.withOpacity(0.1), Colors.green.withOpacity(0.02)],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.green.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), shape: BoxShape.circle),
            child: const Icon(LucideIcons.banknote, color: Colors.greenAccent),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('TOTAL PENERIMAAN IURAN', style: TextStyle(fontSize: 10, color: Colors.white30)),
                Text(
                  formatter.format(total),
                  style: GoogleFonts.jetBrainsMono(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.greenAccent),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRankDistribution() {
    final ranks = [
      {'label': 'Sabuk Putih', 'count': 45, 'color': Colors.white70},
      {'label': 'Sabuk Kuning', 'count': 32, 'color': Colors.amber},
      {'label': 'Sabuk Hijau', 'count': 28, 'color': Colors.green},
      {'label': 'Sabuk Biru', 'count': 15, 'color': Colors.blue},
      {'label': 'Sabuk Coklat', 'count': 10, 'color': Colors.brown},
      {'label': 'Sabuk Hitam', 'count': 5, 'color': Colors.black},
    ];

    return Column(
      children: ranks.map((rank) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            children: [
              Container(width: 12, height: 12, decoration: BoxDecoration(color: rank['color'] as Color, shape: BoxShape.circle)),
              const SizedBox(width: 12),
              Expanded(child: Text(rank['label'] as String, style: const TextStyle(fontSize: 12))),
              Text('${rank['count']}', style: GoogleFonts.jetBrainsMono(fontWeight: FontWeight.bold)),
              const SizedBox(width: 8),
              Container(
                width: 60,
                height: 4,
                decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(2)),
                child: FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: (rank['count'] as int) / 50,
                  child: Container(decoration: BoxDecoration(color: rank['color'] as Color, borderRadius: BorderRadius.circular(2))),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
