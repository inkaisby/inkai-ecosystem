import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../../core/theme.dart';

class AddAchievementScreen extends StatefulWidget {
  const AddAchievementScreen({super.key});

  @override
  State<AddAchievementScreen> createState() => _AddAchievementScreenState();
}

class _AddAchievementScreenState extends State<AddAchievementScreen> {
  final _formKey = GlobalKey<FormState>();
  String _selectedType = 'SABUK';
  final _titleController = TextEditingController();
  final _dateController = TextEditingController();
  final _locationController = TextEditingController();
  bool _isSaving = false;

  @override
  void dispose() {
    _titleController.dispose();
    _dateController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: InkaiTheme.backgroundDark,
      appBar: AppBar(
        title: Text('TAMBAH PRESTASI', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildLabel('Tipe Riwayat'),
              _buildDropdown(),
              const SizedBox(height: 24),
              _buildLabel('Judul Prestasi / Tingkatan'),
              _buildTextField(_titleController, 'Contoh: Juara 1 Kumite atau Sabuk Kuning Kyu 8', LucideIcons.award),
              const SizedBox(height: 24),
              _buildLabel('Tanggal'),
              _buildTextField(_dateController, 'DD/MM/YYYY', LucideIcons.calendar),
              const SizedBox(height: 24),
              _buildLabel('Lokasi'),
              _buildTextField(_locationController, 'Contoh: Dojo Pusat atau Jakarta', LucideIcons.map_pin),
              const SizedBox(height: 32),
              _buildLabel('Upload Sertifikat (Opsional)'),
              _buildUploadPlaceholder(),
              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _saveAchievement,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: InkaiTheme.primaryGold,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: _isSaving
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                      : const Text('KIRIM UNTUK VALIDASI', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: Text(
                  '*Data akan divalidasi oleh admin sebelum muncul di profil.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontSize: 11, color: Colors.grey, fontStyle: FontStyle.italic),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(
        label,
        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
      ),
    );
  }

  Widget _buildDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedType,
          isExpanded: true,
          dropdownColor: const Color(0xFF1E1E24),
          style: const TextStyle(color: Colors.white),
          items: const [
            DropdownMenuItem(value: 'SABUK', child: Text('Kenaikan Sabuk')),
            DropdownMenuItem(value: 'PIAGAM', child: Text('Piagam / Pertandingan')),
            DropdownMenuItem(value: 'PELATIHAN', child: Text('Pelatihan / Sertifikasi')),
          ],
          onChanged: (val) => setState(() => _selectedType = val!),
        ),
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint, IconData icon) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: TextFormField(
        controller: controller,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          prefixIcon: Icon(icon, size: 20, color: InkaiTheme.primaryGold.withOpacity(0.5)),
          hintText: hint,
          hintStyle: const TextStyle(color: Colors.white24),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
        validator: (value) => value == null || value.isEmpty ? 'Field ini tidak boleh kosong' : null,
      ),
    );
  }

  Widget _buildUploadPlaceholder() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05), style: BorderStyle.solid),
      ),
      child: Column(
        children: [
          Icon(LucideIcons.cloud_upload, size: 32, color: InkaiTheme.primaryGold.withOpacity(0.5)),
          const SizedBox(height: 12),
          Text('Klik untuk pilih file sertifikat', style: GoogleFonts.inter(color: Colors.grey, fontSize: 12)),
        ],
      ),
    );
  }

  void _saveAchievement() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isSaving = true);
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Data berhasil dikirim untuk validasi!'), backgroundColor: Colors.blueAccent),
        );
        Navigator.pop(context);
      }
    }
  }
}
