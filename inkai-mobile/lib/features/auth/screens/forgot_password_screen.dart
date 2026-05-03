import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../../core/network/api_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _identifierController = TextEditingController();
  final ApiService _apiService = ApiService();
  bool _isLoading = false;

  Future<void> _handleRecovery() async {
    final identifier = _identifierController.text.trim();
    if (identifier.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Silakan masukkan Email atau NIA Anda')),
      );
      return;
    }

    setState(() => _isLoading = true);
    
    try {
      final response = await _apiService.forgotPassword(identifier);
      
      if (mounted) {
        setState(() => _isLoading = false);
        if (response.data['status'] == 'success') {
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              backgroundColor: InkaiTheme.backgroundDark,
              title: const Text('Permintaan Terkirim', style: TextStyle(color: Colors.white)),
              content: const Text(
                'Instruksi pemulihan telah dikirim. Silakan cek email Anda (termasuk folder spam).\n\n(Selama tahap pengembangan, link reset juga muncul di terminal server)',
                style: TextStyle(color: Colors.white70),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(context); // close dialog
                    Navigator.pop(context); // go back to login
                  },
                  child: const Text('MENGERTI', style: TextStyle(color: InkaiTheme.primaryGold)),
                ),
              ],
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Gagal: ${response.data['message']}')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: InkaiTheme.backgroundDark,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('KEMBALI KE LOGIN', style: TextStyle(fontSize: 12, color: Colors.white70)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 40),
            // Logo
            Center(
              child: Image.asset(
                'assets/images/inkai-logo.png',
                height: 120,
                fit: BoxFit.contain,
              ),
            ),
            const SizedBox(height: 48),
            const Text(
              'PEMULIHAN KATA SANDI',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            const Text(
              'Masukkan Email atau NIA Anda untuk menerima instruksi pemulihan.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
            const SizedBox(height: 40),

            const Text(
              'Email / NIA:',
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _identifierController,
              style: const TextStyle(color: Colors.white),
              decoration: _inputDecoration('budi@email.com / 123456789'),
            ),
            const SizedBox(height: 32),

            ElevatedButton(
              onPressed: _isLoading ? null : _handleRecovery,
              style: ElevatedButton.styleFrom(
                backgroundColor: InkaiTheme.primaryGold,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: _isLoading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                  : const Text('KIRIM LINK PEMULIHAN', style: TextStyle(fontWeight: FontWeight.bold)),
            ),

            const SizedBox(height: 48),
            Divider(color: Colors.white.withOpacity(0.1)),
            const SizedBox(height: 24),
            const Text(
              'Bantuan? Hubungi Admin / Dojo Anda',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ],
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
