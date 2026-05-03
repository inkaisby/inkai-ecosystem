import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../auth/providers/auth_provider.dart';
import '../../core/theme.dart';
import '../../core/network/api_service.dart';
import '../billing/billing_screen.dart';
import 'attendance_history_screen.dart';
import 'dojo_transfer_screen.dart';
import 'achievement_history_screen.dart';
import 'digital_library_screen.dart';

class MembershipScreen extends StatefulWidget {
  const MembershipScreen({super.key});

  @override
  State<MembershipScreen> createState() => _MembershipScreenState();
}

class _MembershipScreenState extends State<MembershipScreen> {
  final ApiService _apiService = ApiService();
  final ImagePicker _picker = ImagePicker();
  bool _isUploading = false;

  void _showPickerMenu(String fieldName) {
    showModalBottomSheet(
      context: context,
      backgroundColor: InkaiTheme.backgroundDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'PILIH SUMBER DOKUMEN',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white70),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildPickerOption(
                  icon: LucideIcons.camera,
                  label: 'Kamera',
                  onTap: () {
                    Navigator.pop(context);
                    _pickFromCamera(fieldName);
                  },
                ),
                _buildPickerOption(
                  icon: LucideIcons.image,
                  label: 'Galeri',
                  onTap: () {
                    Navigator.pop(context);
                    _pickFromGallery(fieldName);
                  },
                ),
                _buildPickerOption(
                  icon: LucideIcons.file_search,
                  label: 'File/Drive',
                  onTap: () {
                    Navigator.pop(context);
                    _pickFromFile(fieldName);
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildPickerOption({required IconData icon, required String label, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: InkaiTheme.primaryGold, size: 24),
          ),
          const SizedBox(height: 8),
          Text(label, style: GoogleFonts.inter(fontSize: 11, color: Colors.white54)),
        ],
      ),
    );
  }

  Future<void> _pickFromCamera(String fieldName) async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera, 
      imageQuality: 70,
      maxWidth: 1200,
      maxHeight: 1200,
    );
    if (image != null) _processUpload(fieldName, image.path);
  }

  Future<void> _pickFromGallery(String fieldName) async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery, 
      imageQuality: 70,
      maxWidth: 1200,
      maxHeight: 1200,
    );
    if (image != null) _processUpload(fieldName, image.path);
  }

  Future<void> _pickFromFile(String fieldName) async {
    try {
      final FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
      );
      if (result != null && result.files.single.path != null) {
        _processUpload(fieldName, result.files.single.path!);
      }
    } catch (e) {
      debugPrint('FilePicker Error: $e');
    }
  }

  Future<void> _processUpload(String fieldName, String filePath) async {
    try {
      final file = File(filePath);
      final fileSize = await file.length();
      
      if (fileSize > 2 * 1024 * 1024) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Ukuran file terlalu besar (Maks. 2MB). Silakan kompres atau perkecil resolusi.')),
          );
        }
        return;
      }

      setState(() => _isUploading = true);

      final response = await _apiService.uploadDocument(fieldName, filePath);

      if (mounted) {
        if (response.data['status'] == 'success') {
          Provider.of<AuthProvider>(context, listen: false).fetchProfile();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Dokumen berhasil diunggah')),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Gagal: ${response.data['message']}')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  void _viewDocument(String? url) async {
    if (url == null || url.isEmpty) return;
    
    final baseUrl = 'http://127.0.0.1:5001';
    final absoluteUrl = url.startsWith('http') ? url : '$baseUrl$url';
    
    final uri = Uri.parse(absoluteUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tidak bisa membuka dokumen')),
        );
      }
    }
  }

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
              icon: LucideIcons.book_open,
              title: 'Materi Teknik (Digital Library)',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DigitalLibraryScreen())),
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
                if (_isUploading)
                  const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: InkaiTheme.primaryGold))
                else
                  Icon(LucideIcons.info, size: 16, color: Colors.white.withOpacity(0.3)),
              ],
            ),
            const SizedBox(height: 16),
            _buildDocumentItem(
              'Akte Lahir', 
              user?['birthCertificateUrl'], 
              () => _showPickerMenu('akte_lahir'),
              () => _viewDocument(user?['birthCertificateUrl']),
            ),
            const SizedBox(height: 12),
            _buildDocumentItem(
              'Kartu BPJS', 
              user?['bpjsCardUrl'], 
              () => _showPickerMenu('bpjs'),
              () => _viewDocument(user?['bpjsCardUrl']),
            ),
            
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

  Widget _buildDocumentItem(String name, String? url, VoidCallback onUpload, VoidCallback onView) {
    final isUploaded = url != null && url.isNotEmpty;
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
            onPressed: isUploaded ? onView : onUpload,
            child: Text(
              isUploaded ? 'Lihat' : 'Upload',
              style: GoogleFonts.inter(
                color: isUploaded ? Colors.blueAccent : InkaiTheme.primaryGold,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
          if (isUploaded)
             IconButton(
               icon: const Icon(LucideIcons.refresh_cw, size: 14, color: Colors.white30),
               onPressed: onUpload,
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
