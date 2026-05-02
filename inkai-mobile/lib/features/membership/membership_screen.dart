import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../auth/providers/auth_provider.dart';
import '../../core/theme.dart';
import '../billing/billing_screen.dart';
import 'attendance_history_screen.dart';
import 'dojo_transfer_screen.dart';
import 'achievement_history_screen.dart';

class MembershipScreen extends StatelessWidget {
  const MembershipScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;

    return Scaffold(
      backgroundColor: InkaiTheme.backgroundDark,
      appBar: AppBar(
        title: Text(
          'KEANGGOTAAN',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionTitle('KARTU ANGGOTA DIGITAL'),
            const SizedBox(height: 16),
            _buildKTAGlassCard(user),
            const SizedBox(height: 12),
            Text(
              '*Tunjukkan QR ini saat latihan untuk absensi digital.',
              style: GoogleFonts.inter(fontSize: 11, color: Colors.grey, fontStyle: FontStyle.italic),
            ),
            const SizedBox(height: 32),
            
            _buildMenuLink(
              icon: LucideIcons.calendar_check_2,
              title: 'Lihat Riwayat Absensi',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AttendanceHistoryScreen())),
            ),
            const SizedBox(height: 12),
            _buildMenuLink(
              icon: LucideIcons.award,
              title: 'Lihat Riwayat & Prestasi',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AchievementHistoryScreen())),
            ),
            const SizedBox(height: 12),
            _buildMenuLink(
              icon: LucideIcons.wallet,
              title: 'Lihat Detail Iuran',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BillingScreen())),
            ),
            
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildSectionTitle('DOKUMEN PENDUKUNG'),
                Icon(LucideIcons.info, size: 16, color: Colors.white.withOpacity(0.3)),
              ],
            ),
            const SizedBox(height: 16),
            _buildDocumentItem('Akte Lahir', true),
            const SizedBox(height: 12),
            _buildDocumentItem('Kartu BPJS', false),
            
            const SizedBox(height: 32),
            _buildDojoTransferInfo(context),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        letterSpacing: 1.2,
        color: Colors.white.withOpacity(0.6),
      ),
    );
  }

  Widget _buildKTAGlassCard(Map<String, dynamic>? user) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.white.withOpacity(0.1), Colors.white.withOpacity(0.05)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          children: [
            Positioned(
              right: -30,
              top: -30,
              child: Icon(LucideIcons.shield, size: 180, color: Colors.white.withOpacity(0.03)),
            ),
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Official Photo Placeholder
                      Container(
                        width: 80,
                        height: 100,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.white.withOpacity(0.1)),
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Icon(LucideIcons.user, size: 40, color: Colors.white.withOpacity(0.2)),
                            Positioned(
                              bottom: 4,
                              right: 4,
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(color: InkaiTheme.primaryGold, shape: BoxShape.circle),
                                child: const Icon(LucideIcons.camera, size: 10, color: Colors.black),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user?['fullName']?.toUpperCase() ?? 'NAMA ANGGOTA',
                              style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'NIA: ${user?['nia'] ?? '000.000.000'}',
                              style: GoogleFonts.jetBrainsMono(fontSize: 12, color: InkaiTheme.primaryGold),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(LucideIcons.map_pin, size: 12, color: Colors.grey),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    user?['dojo']?['name'] ?? 'Dojo Pusat Jakarta',
                                    style: GoogleFonts.inter(fontSize: 12, color: Colors.grey),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Icon(LucideIcons.lock, size: 12, color: Colors.white.withOpacity(0.3)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: QrImageView(
                      data: user?['nia'] ?? 'INKAI-MEMBER',
                      version: QrVersions.auto,
                      size: 100.0,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuLink({required IconData icon, required String title, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.03),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: InkaiTheme.primaryGold.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 20, color: InkaiTheme.primaryGold),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.white),
              ),
            ),
            const Icon(LucideIcons.chevron_right, size: 16, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildDocumentItem(String name, bool isUploaded) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(LucideIcons.file_text, size: 20, color: isUploaded ? Colors.greenAccent : Colors.grey),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              name,
              style: GoogleFonts.inter(color: Colors.white),
            ),
          ),
          TextButton(
            onPressed: () {},
            child: Text(
              isUploaded ? 'Lihat' : 'Upload',
              style: GoogleFonts.inter(
                color: isUploaded ? Colors.blueAccent : InkaiTheme.primaryGold,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDojoTransferInfo(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.red.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.info, size: 16, color: Colors.redAccent),
              const SizedBox(width: 8),
              Text(
                'Pindah Dojo?',
                style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.redAccent),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Silakan hubungi Ketua Ranting atau ajukan perpindahan melalui formulir digital.',
            style: GoogleFonts.inter(fontSize: 12, color: Colors.white70),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DojoTransferScreen())),
              style: TextButton.styleFrom(
                backgroundColor: Colors.white.withOpacity(0.05),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                'Ajukan Pindah Dojo',
                style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
