import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../core/theme.dart';

class DojoTransferScreen extends StatefulWidget {
  const DojoTransferScreen({super.key});

  @override
  State<DojoTransferScreen> createState() => _DojoTransferScreenState();
}

class _DojoTransferScreenState extends State<DojoTransferScreen> {
  final _reasonController = TextEditingController();
  String? _selectedProvince;
  String? _selectedBranch;
  String? _selectedDojo;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: InkaiTheme.backgroundDark,
      appBar: AppBar(
        title: const Text('Pengajuan Pindah Dojo'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildInfoBox('DATA SAAT INI', 'Dojo Pusat Jakarta\nCabang Jakarta Pusat'),
            const SizedBox(height: 32),
            
            Text(
              'TUJUAN PINDAH:',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: InkaiTheme.primaryGold),
            ),
            const SizedBox(height: 16),
            
            _buildLabel('Pilih Wilayah Tujuan:'),
            _buildDropdown('-- Pilih Wilayah --'),
            const SizedBox(height: 16),
            
            _buildLabel('Pilih Cabang Tujuan:'),
            _buildDropdown('-- Pilih Cabang --'),
            const SizedBox(height: 16),
            
            _buildLabel('Pilih Dojo Tujuan:'),
            _buildDropdown('-- Pilih Dojo --'),
            const SizedBox(height: 24),
            
            _buildLabel('Alasan Kepindahan:'),
            TextField(
              controller: _reasonController,
              maxLines: 3,
              style: const TextStyle(color: Colors.white),
              decoration: _inputDecoration('Tuliskan alasan Anda pindah...'),
            ),
            const SizedBox(height: 32),
            
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Pengajuan sedang diproses')),
                  );
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: InkaiTheme.primaryGold,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('KIRIM PENGAJUAN', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
            
            const SizedBox(height: 32),
            const Divider(color: Colors.white10),
            const SizedBox(height: 16),
            
            Text(
              'STATUS VERIFIKASI:',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            _statusItem('Diajukan (Anggota)', true),
            _statusItem('Verifikasi Ketua Ranting', false),
            _statusItem('Verifikasi Ketua Cabang', false),
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
          Text(title, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
          const SizedBox(height: 8),
          Text(content, style: const TextStyle(fontSize: 14, color: Colors.white, height: 1.5)),
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

  Widget _buildDropdown(String hint) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          hint: Text(hint, style: const TextStyle(color: Colors.grey, fontSize: 14)),
          isExpanded: true,
          dropdownColor: const Color(0xFF1E1E24),
          icon: const Icon(LucideIcons.chevron_down, color: InkaiTheme.primaryGold, size: 16),
          items: const [],
          onChanged: (val) {},
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
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        children: [
          Icon(isDone ? Icons.check_circle : Icons.radio_button_unchecked, size: 16, color: isDone ? Colors.greenAccent : Colors.grey),
          const SizedBox(width: 12),
          Text(label, style: TextStyle(color: isDone ? Colors.white : Colors.grey, fontSize: 13)),
        ],
      ),
    );
  }
}
