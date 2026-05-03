import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/network/api_service.dart';
import '../../../core/theme.dart';
import 'package:url_launcher/url_launcher.dart';
import '../membership/membership_screen.dart';
import 'dojo_members_screen.dart';

class DojoSearchScreen extends StatefulWidget {
  const DojoSearchScreen({super.key});

  @override
  State<DojoSearchScreen> createState() => _DojoSearchScreenState();
}

class _DojoSearchScreenState extends State<DojoSearchScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _dojos = [];
  bool _isLoading = false;
  final _searchController = TextEditingController();
  bool _hasSearched = false;

  Future<void> _searchDojos(String query) async {
    if (query.isEmpty) return;
    setState(() {
      _isLoading = true;
      _hasSearched = true;
    });
    try {
      final response = await _apiService.searchDojos(query);
      setState(() {
        _dojos = response.data['data'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Terjadi kesalahan saat mencari dojo')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: InkaiTheme.backgroundDark,
      appBar: AppBar(
        title: Text(
          'Cari Dojo',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: TextField(
              controller: _searchController,
              onSubmitted: _searchDojos,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Cari nama dojo atau kota...',
                hintStyle: const TextStyle(color: Colors.white24),
                prefixIcon: const Icon(LucideIcons.search, size: 20, color: InkaiTheme.primaryGold),
                suffixIcon: _searchController.text.isNotEmpty 
                  ? IconButton(
                      icon: const Icon(LucideIcons.x, size: 16, color: Colors.white24),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _dojos = [];
                          _hasSearched = false;
                        });
                      },
                    )
                  : null,
                filled: true,
                fillColor: Colors.white.withOpacity(0.05),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16), 
                  borderSide: BorderSide(color: Colors.white.withOpacity(0.05)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16), 
                  borderSide: const BorderSide(color: InkaiTheme.primaryGold),
                ),
              ),
              onChanged: (val) => setState(() {}),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: InkaiTheme.primaryGold))
                : _dojos.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _hasSearched ? LucideIcons.search_x : LucideIcons.map_pin,
                              size: 64,
                              color: Colors.white.withOpacity(0.05),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _hasSearched 
                                ? 'Dojo tidak ditemukan untuk "${_searchController.text}"' 
                                : 'Masukkan nama dojo atau lokasi\nuntuk mulai mencari',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(color: Colors.grey, fontSize: 14),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        itemCount: _dojos.length,
                        itemBuilder: (context, index) {
                          final dojo = _dojos[index];
                          return _buildDojoCard(dojo);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildDojoCard(dynamic dojo) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: InkWell(
        onTap: () => _showDojoDetails(dojo),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: InkaiTheme.primaryGold.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(LucideIcons.house, color: InkaiTheme.primaryGold, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      dojo['name']?.toUpperCase() ?? 'TANPA NAMA', 
                      style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      dojo['address'] ?? 'Alamat tidak tersedia',
                      style: GoogleFonts.inter(fontSize: 11, color: Colors.grey),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const Icon(LucideIcons.chevron_right, color: Colors.white24, size: 16),
            ],
          ),
        ),
      ),
    );
  }

  void _contactDojo(dynamic dojo) async {
    final phone = dojo['phoneNumber']?.toString();
    if (phone == null || phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nomor telepon tidak tersedia')),
      );
      return;
    }

    // Clean phone number for WhatsApp
    String cleanPhone = phone.replaceAll(RegExp(r'\D'), '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62${cleanPhone.substring(1)}';
    }

    final whatsappUrl = Uri.parse('https://wa.me/$cleanPhone');
    final telUrl = Uri.parse('tel:$phone');

    if (await canLaunchUrl(whatsappUrl)) {
      await launchUrl(whatsappUrl, mode: LaunchMode.externalApplication);
    } else if (await canLaunchUrl(telUrl)) {
      await launchUrl(telUrl);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tidak dapat membuka aplikasi komunikasi')),
      );
    }
  }

  void _showDojoDetails(dynamic dojo) {
    showModalBottomSheet(
      context: context,
      backgroundColor: InkaiTheme.backgroundDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: InkaiTheme.primaryGold.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(LucideIcons.house, color: InkaiTheme.primaryGold, size: 32),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        dojo['name'] ?? '',
                        style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18),
                      ),
                      Text(
                        'Dojo INKAI',
                        style: GoogleFonts.inter(color: InkaiTheme.primaryGold, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            _buildDetailRow(LucideIcons.map_pin, 'Alamat', dojo['address'] ?? '-'),
            _buildDetailRow(LucideIcons.user, 'Kontak Person', dojo['contactPerson'] ?? '-'),
            _buildDetailRow(LucideIcons.phone, 'Telepon', dojo['phoneNumber'] ?? '-'),
            _buildDetailRow(LucideIcons.building_2, 'Cabang', dojo['branch']?['name'] ?? '-'),
            _buildDetailRow(LucideIcons.map, 'Provinsi', dojo['branch']?['province']?['name'] ?? '-'),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      _contactDojo(dojo);
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: InkaiTheme.primaryGold,
                      side: const BorderSide(color: InkaiTheme.primaryGold),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Text('HUBUNGI', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => DojoMembersScreen(
                            dojoId: dojo['id'],
                            dojoName: dojo['name'] ?? 'Dojo',
                          ),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: InkaiTheme.primaryGold,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Text('LIHAT ANGGOTA', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: Colors.white24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: GoogleFonts.inter(fontSize: 10, color: Colors.grey)),
                Text(value, style: GoogleFonts.inter(fontSize: 13, color: Colors.white)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

