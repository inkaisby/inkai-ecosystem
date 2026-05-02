import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../../core/network/api_service.dart';
import '../auth/providers/auth_provider.dart';

class DojoTransferScreen extends StatefulWidget {
  const DojoTransferScreen({super.key});

  @override
  State<DojoTransferScreen> createState() => _DojoTransferScreenState();
}

class _DojoTransferScreenState extends State<DojoTransferScreen> {
  final _apiService = ApiService();
  final _reasonController = TextEditingController();
  
  List<dynamic> _provinces = [];
  List<dynamic> _branches = [];
  List<dynamic> _dojos = [];

  String? _selectedProvinceId;
  String? _selectedBranchId;
  String? _selectedDojoId;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _fetchProvinces();
  }

  Future<void> _fetchProvinces() async {
    try {
      final response = await _apiService.getProvinces();
      setState(() {
        _provinces = response.data['data'];
      });
    } catch (e) {
      debugPrint('Error fetching provinces: $e');
    }
  }

  Future<void> _fetchBranches(String provinceId) async {
    try {
      final response = await _apiService.getBranches(provinceId);
      setState(() {
        _branches = response.data['data'];
        _selectedBranchId = null;
        _dojos = [];
        _selectedDojoId = null;
      });
    } catch (e) {
      debugPrint('Error fetching branches: $e');
    }
  }

  Future<void> _fetchDojos(String branchId) async {
    try {
      final response = await _apiService.getDojos(branchId);
      setState(() {
        _dojos = response.data['data'];
        _selectedDojoId = null;
      });
    } catch (e) {
      debugPrint('Error fetching dojos: $e');
    }
  }

  Future<void> _handleSubmit() async {
    if (_selectedDojoId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Silakan pilih Dojo tujuan terlebih dahulu')),
      );
      return;
    }

    if (_reasonController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Silakan tuliskan alasan kepindahan')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      await _apiService.submitDojoTransfer(
        targetDojoId: _selectedDojoId!,
        reason: _reasonController.text,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pengajuan pindah dojo berhasil dikirim!')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal mengirim pengajuan: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final currentDojo = user?['dojo']?['name'] ?? 'Dojo Belum Terdaftar';
    final currentBranch = user?['dojo']?['branch']?['name'] ?? '-';

    return Scaffold(
      backgroundColor: InkaiTheme.backgroundDark,
      appBar: AppBar(
        title: Text(
          'PENGAJUAN PINDAH DOJO',
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
            _buildInfoBox('DATA SAAT INI', '$currentDojo\n$currentBranch'),
            const SizedBox(height: 32),
            
            Text(
              'TUJUAN PINDAH:',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: InkaiTheme.primaryGold),
            ),
            const SizedBox(height: 16),
            
            _buildLabel('Pilih Wilayah Tujuan:'),
            _buildDropdown(
              value: _selectedProvinceId,
              items: _provinces,
              hint: '-- Pilih Wilayah --',
              onChanged: (val) {
                setState(() => _selectedProvinceId = val);
                _fetchBranches(val!);
              },
            ),
            const SizedBox(height: 16),
            
            _buildLabel('Pilih Cabang Tujuan:'),
            _buildDropdown(
              value: _selectedBranchId,
              items: _branches,
              hint: '-- Pilih Cabang --',
              enabled: _selectedProvinceId != null,
              onChanged: (val) {
                setState(() => _selectedBranchId = val);
                _fetchDojos(val!);
              },
            ),
            const SizedBox(height: 16),
            
            _buildLabel('Pilih Dojo Tujuan:'),
            _buildDropdown(
              value: _selectedDojoId,
              items: _dojos,
              hint: '-- Pilih Dojo --',
              enabled: _selectedBranchId != null,
              onChanged: (val) => setState(() => _selectedDojoId = val),
            ),
            const SizedBox(height: 24),
            
            _buildLabel('Alasan Kepindahan:'),
            TextField(
              controller: _reasonController,
              maxLines: 3,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: _inputDecoration('Tuliskan alasan Anda pindah...'),
            ),
            const SizedBox(height: 32),
            
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: InkaiTheme.primaryGold,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  disabledBackgroundColor: InkaiTheme.primaryGold.withOpacity(0.3),
                ),
                child: _isLoading 
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                  : const Text('KIRIM PENGAJUAN', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
            
            const SizedBox(height: 32),
            const Divider(color: Colors.white10),
            const SizedBox(height: 16),
            
            Text(
              'ALUR VERIFIKASI:',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            _statusItem('1. Diajukan oleh Anggota', true),
            _statusItem('2. Persetujuan Dojo Asal (PIC)', false),
            _statusItem('3. Verifikasi Cabang (Admin)', false),
            _statusItem('4. Update Otomatis NIA/Dojo', false),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoBox(String title, String content) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.1)),
          const SizedBox(height: 8),
          Text(content, style: GoogleFonts.inter(fontSize: 14, color: Colors.white, height: 1.5, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(label, style: const TextStyle(fontSize: 13, color: Colors.white70)),
    );
  }

  Widget _buildDropdown({
    required String? value,
    required List<dynamic> items,
    required String hint,
    required ValueChanged<String?> onChanged,
    bool enabled = true,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          hint: Text(hint, style: const TextStyle(color: Colors.grey, fontSize: 14)),
          isExpanded: true,
          dropdownColor: const Color(0xFF1E1E24),
          icon: const Icon(LucideIcons.chevron_down, color: InkaiTheme.primaryGold, size: 16),
          items: items.map<DropdownMenuItem<String>>((item) {
            return DropdownMenuItem<String>(
              value: item['id'],
              child: Text(item['name'], style: const TextStyle(color: Colors.white, fontSize: 14)),
            );
          }).toList(),
          onChanged: enabled ? onChanged : null,
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.white24, fontSize: 14),
      filled: true,
      fillColor: Colors.white.withOpacity(0.05),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
    );
  }

  Widget _statusItem(String label, bool isDone) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        children: [
          Icon(isDone ? LucideIcons.circle_check : LucideIcons.circle, size: 16, color: isDone ? Colors.greenAccent : Colors.grey),
          const SizedBox(width: 12),
          Text(label, style: TextStyle(color: isDone ? Colors.white : Colors.grey, fontSize: 13)),
        ],
      ),
    );
  }
}
