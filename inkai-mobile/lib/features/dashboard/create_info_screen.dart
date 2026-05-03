import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/network/api_service.dart';
import '../../core/theme.dart';

class CreateInfoScreen extends StatefulWidget {
  const CreateInfoScreen({super.key});

  @override
  State<CreateInfoScreen> createState() => _CreateInfoScreenState();
}

class _CreateInfoScreenState extends State<CreateInfoScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  String _selectedType = 'ANNOUNCEMENT';
  bool _isSubmitting = false;

  final List<String> _types = ['ANNOUNCEMENT', 'EVENT', 'URGENT', 'INFO'];

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      final apiService = ApiService();
      final response = await apiService.broadcastNotification(
        title: _titleController.text.trim(),
        content: _contentController.text.trim(),
        type: _selectedType,
      );

      if (mounted) {
        if (response.data['status'] == 'success') {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Pengumuman berhasil dikirim')),
          );
          Navigator.pop(context);
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
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: InkaiTheme.backgroundDark,
      appBar: AppBar(
        title: Text('BUAT PENGUMUMAN', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Informasi apa yang ingin Anda bagikan kepada seluruh anggota?',
                style: GoogleFonts.inter(color: Colors.white70, fontSize: 13),
              ),
              const SizedBox(height: 32),
              _buildLabel('Judul Pengumuman'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _titleController,
                style: const TextStyle(color: Colors.white),
                decoration: _inputDecoration('Contoh: Latihan Gabungan Minggu Ini'),
                validator: (val) => val == null || val.isEmpty ? 'Judul harus diisi' : null,
              ),
              const SizedBox(height: 24),
              _buildLabel('Kategori'),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _selectedType,
                dropdownColor: InkaiTheme.backgroundDark,
                style: const TextStyle(color: Colors.white),
                decoration: _inputDecoration(' Pilih Kategori'),
                items: _types.map((type) => DropdownMenuItem(
                  value: type,
                  child: Text(type),
                )).toList(),
                onChanged: (val) => setState(() => _selectedType = val!),
              ),
              const SizedBox(height: 24),
              _buildLabel('Isi Pengumuman'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _contentController,
                maxLines: 5,
                style: const TextStyle(color: Colors.white),
                decoration: _inputDecoration('Tulis detail pengumuman di sini...'),
                validator: (val) => val == null || val.isEmpty ? 'Isi harus diisi' : null,
              ),
              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: InkaiTheme.primaryGold,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    disabledBackgroundColor: Colors.grey,
                  ),
                  child: _isSubmitting 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                    : const Text('KIRIM PENGUMUMAN', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String label) {
    return Text(
      label.toUpperCase(),
      style: GoogleFonts.inter(
        fontSize: 11,
        fontWeight: FontWeight.bold,
        color: InkaiTheme.primaryGold,
        letterSpacing: 1.2,
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.white24, fontSize: 13),
      filled: true,
      fillColor: Colors.white.withOpacity(0.05),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }
}
