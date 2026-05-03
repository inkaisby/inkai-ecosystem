import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart' as fp;
import '../auth/providers/auth_provider.dart';
import '../../core/theme.dart';
import '../../core/network/api_service.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  final ApiService _apiService = ApiService();
  final ImagePicker _picker = ImagePicker();
  
  bool _isSaving = false;
  bool _isUploadingPhoto = false;
  String? _currentPhotoUrl;

  @override
  void initState() {
    super.initState();
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    _nameController = TextEditingController(text: user?['fullName']);
    _phoneController = TextEditingController(text: user?['phoneNumber']);
    _currentPhotoUrl = user?['photoUrl'];
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _showPickerMenu() {
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
              'GANTI FOTO PROFIL',
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
                    if (Platform.isWindows) {
                      _pickFromGallery(); // Windows fallback
                    } else {
                      _pickFromCamera();
                    }
                  },
                ),
                _buildPickerOption(
                  icon: LucideIcons.image,
                  label: 'Galeri',
                  onTap: () {
                    Navigator.pop(context);
                    _pickFromGallery();
                  },
                ),
                _buildPickerOption(
                  icon: LucideIcons.file_search,
                  label: 'Pilih File',
                  onTap: () {
                    Navigator.pop(context);
                    _pickFromFile();
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

  Future<void> _pickFromCamera() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 50,
      maxWidth: 600,
      maxHeight: 600,
    );
    if (image != null) _processUpload(image.path);
  }

  Future<void> _pickFromGallery() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 50,
      maxWidth: 600,
      maxHeight: 600,
    );
    if (image != null) _processUpload(image.path);
  }

  Future<void> _pickFromFile() async {
    try {
      final fp.FilePickerResult? result = await fp.FilePicker.platform.pickFiles(
        type: fp.FileType.image,
      );
      if (result != null && result.files.single.path != null) {
        _processUpload(result.files.single.path!);
      }
    } catch (e) {
      debugPrint('FilePicker Error: $e');
    }
  }

  // Helper method for actual upload
  Future<void> _processUpload(String filePath) async {
    setState(() => _isUploadingPhoto = true);
    try {
      final response = await _apiService.uploadProfilePhoto(filePath);
      if (mounted) {
        if (response.data['status'] == 'success') {
          setState(() {
            _currentPhotoUrl = response.data['photoUrl'];
          });
          Provider.of<AuthProvider>(context, listen: false).fetchProfile();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Foto profil berhasil diperbarui')),
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
      if (mounted) setState(() => _isUploadingPhoto = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final baseUrl = 'http://127.0.0.1:5001';

    return Scaffold(
      backgroundColor: InkaiTheme.backgroundDark,
      appBar: AppBar(
        title: Text('EDIT PROFIL', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
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
              Center(
                child: GestureDetector(
                  onTap: _isUploadingPhoto ? null : _showPickerMenu,
                  child: Stack(
                    children: [
                      Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.05),
                          shape: BoxShape.circle,
                          border: Border.all(color: InkaiTheme.primaryGold.withOpacity(0.3), width: 2),
                          image: _currentPhotoUrl != null
                              ? DecorationImage(
                                  image: NetworkImage(_currentPhotoUrl!.startsWith('http') ? _currentPhotoUrl! : '$baseUrl$_currentPhotoUrl'),
                                  fit: BoxFit.cover,
                                )
                              : null,
                        ),
                        child: _currentPhotoUrl == null
                            ? const Icon(LucideIcons.user, size: 50, color: Colors.white24)
                            : null,
                      ),
                      if (_isUploadingPhoto)
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.5),
                            shape: BoxShape.circle,
                          ),
                          child: const Center(
                            child: CircularProgressIndicator(color: InkaiTheme.primaryGold),
                          ),
                        ),
                      Positioned(
                        bottom: 4,
                        right: 4,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(color: InkaiTheme.primaryGold, shape: BoxShape.circle),
                          child: const Icon(LucideIcons.camera, size: 18, color: Colors.black),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 40),
              _buildLabel('Nama Lengkap'),
              _buildTextField(_nameController, 'Masukkan nama lengkap', LucideIcons.user),
              const SizedBox(height: 24),
              _buildLabel('Nomor WhatsApp'),
              _buildTextField(_phoneController, 'Contoh: 08123456789', LucideIcons.phone, keyboardType: TextInputType.phone),
              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _saveProfile,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: InkaiTheme.primaryGold,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: _isSaving
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                      : const Text('SIMPAN PERUBAHAN', style: TextStyle(fontWeight: FontWeight.bold)),
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

  Widget _buildTextField(TextEditingController controller, String hint, IconData icon, {TextInputType? keyboardType}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
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

  void _saveProfile() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isSaving = true);
      
      try {
        final response = await _apiService.updateProfile(
          _nameController.text,
          _phoneController.text,
        );

        if (mounted) {
          if (response.data['status'] == 'success') {
            Provider.of<AuthProvider>(context, listen: false).fetchProfile();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Profil berhasil diperbarui!'), backgroundColor: Colors.green),
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
        if (mounted) setState(() => _isSaving = false);
      }
    }
  }
}
