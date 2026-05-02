import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/network/api_service.dart';
import '../../../core/theme.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();

  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _waController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;

  List<dynamic> _provinces = [];
  List<dynamic> _branches = [];
  List<dynamic> _dojos = [];

  String? _selectedProvinceId;
  String? _selectedBranchId;
  String? _selectedDojoId;

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

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedDojoId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Silakan pilih Dojo terlebih dahulu')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final response = await _apiService.register(
        email: _emailController.text,
        password: _passwordController.text,
        fullName: _fullNameController.text,
        dojoId: _selectedDojoId!,
        phoneNumber: _waController.text,
      );

      if (response.data['status'] == 'success' && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pendaftaran berhasil! Silakan login.')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Pendaftaran gagal: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: InkaiTheme.backgroundDark,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('PENDAFTARAN ANGGOTA', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildLabel('Nama Lengkap:'),
              TextFormField(
                controller: _fullNameController,
                autofocus: true,
                textCapitalization: TextCapitalization.characters,
                inputFormatters: [
                  UpperCaseTextFormatter(),
                ],
                decoration: _inputDecoration('CONTOH: BUDI SANTOSO'),
                validator: (v) => v!.isEmpty ? 'Nama tidak boleh kosong' : null,
              ),
              const SizedBox(height: 16),

              _buildLabel('Email:'),
              TextFormField(
                controller: _emailController,
                decoration: _inputDecoration('email@contoh.com'),
                keyboardType: TextInputType.emailAddress,
                validator: (v) => v!.isEmpty ? 'Email tidak boleh kosong' : null,
              ),
              const SizedBox(height: 16),

              _buildLabel('Nomor WA:'),
              TextFormField(
                controller: _waController,
                decoration: _inputDecoration('081234567890'),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 24),

              _buildLabel('Pilih Wilayah (Provinsi):'),
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

              _buildLabel('Pilih Cabang (Kota/Kab):'),
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

              _buildLabel('Pilih Dojo (Ranting):'),
              _buildDropdown(
                value: _selectedDojoId,
                items: _dojos,
                hint: '-- Pilih Dojo --',
                enabled: _selectedBranchId != null,
                onChanged: (val) => setState(() => _selectedDojoId = val),
              ),
              const Text(
                '*Pilihan Dojo tidak dapat diubah sendiri setelah mendaftar.',
                style: TextStyle(color: Colors.grey, fontSize: 11, fontStyle: FontStyle.italic),
              ),
              const SizedBox(height: 24),

              _buildLabel('Kata Sandi Baru:'),
              TextFormField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: _inputDecoration('Min. 6 karakter').copyWith(
                  suffixIcon: IconButton(
                    icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility, color: Colors.grey),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
                validator: (v) => v!.length < 6 ? 'Minimal 6 karakter' : null,
              ),
              const SizedBox(height: 16),

              _buildLabel('Ulangi Kata Sandi:'),
              TextFormField(
                controller: _confirmPasswordController,
                obscureText: _obscureConfirmPassword,
                decoration: _inputDecoration('Ulangi kata sandi').copyWith(
                  suffixIcon: IconButton(
                    icon: Icon(_obscureConfirmPassword ? Icons.visibility_off : Icons.visibility, color: Colors.grey),
                    onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                  ),
                ),
                validator: (v) => v != _passwordController.text ? 'Kata sandi tidak cocok' : null,
              ),
              const SizedBox(height: 32),

              ElevatedButton(
                onPressed: _isLoading ? null : _handleRegister,
                style: ElevatedButton.styleFrom(
                  backgroundColor: InkaiTheme.primaryGold,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: _isLoading 
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                  : const Text('DAFTAR SEKARANG', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
              
              const SizedBox(height: 24),
              Center(
                child: GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: RichText(
                    text: const TextSpan(
                      text: 'Sudah punya akun? ',
                      style: TextStyle(color: Colors.grey),
                      children: [
                        TextSpan(
                          text: 'Login di sini',
                          style: TextStyle(color: InkaiTheme.primaryGold, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
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
          icon: const Icon(Icons.keyboard_arrow_down, color: InkaiTheme.primaryGold),
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
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: InkaiTheme.primaryGold, width: 1),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
    );
  }
}

class UpperCaseTextFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    return newValue.copyWith(text: newValue.text.toUpperCase());
  }
}
