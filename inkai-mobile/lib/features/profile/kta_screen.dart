import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:provider/provider.dart';
import '../auth/providers/auth_provider.dart';
import '../../../core/theme.dart';

class KTAScreen extends StatelessWidget {
  const KTAScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kartu Anggota Digital'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // KTA Card
              AspectRatio(
                aspectRatio: 1.586, // Standard ID Card ratio
                child: Container(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1E1E24), Color(0xFF0A0A0C)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: InkaiTheme.primaryGold.withOpacity(0.3), width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: InkaiTheme.primaryGold.withOpacity(0.1),
                        blurRadius: 40,
                        spreadRadius: 5,
                      )
                    ],
                  ),
                  child: Stack(
                    children: [
                      // Background Watermark Logo
                      Positioned(
                        right: -50,
                        bottom: -50,
                        child: Opacity(
                          opacity: 0.05,
                          child: Icon(Icons.shield, size: 250, color: InkaiTheme.primaryGold),
                        ),
                      ),
                      
                      Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'INSTITUT KARATE-DO INDONESIA',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.2,
                                        color: InkaiTheme.primaryGold,
                                      ),
                                    ),
                                    Text(
                                      'PENGURUS PUSAT',
                                      style: TextStyle(
                                        fontSize: 8,
                                        color: Colors.white.withOpacity(0.6),
                                      ),
                                    ),
                                  ],
                                ),
                                Container(
                                  width: 40,
                                  height: 40,
                                  decoration: const BoxDecoration(
                                    color: InkaiTheme.primaryGold,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Center(
                                    child: Text('I', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black)),
                                  ),
                                ),
                              ],
                            ),
                            const Spacer(),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        user?['fullName']?.toUpperCase() ?? 'NAMA ANGGOTA',
                                        style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'NIA: ${user?['nia'] ?? '000.000.000'}',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontFamily: 'Courier',
                                          color: InkaiTheme.primaryGold,
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      Text(
                                        'SABUK: ${user?['currentRank'] ?? 'PUTIH'}',
                                        style: const TextStyle(fontSize: 10, color: Colors.grey),
                                      ),
                                    ],
                                  ),
                                ),
                                // QR Code for verification
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: QrImageView(
                                    data: user?['nia'] ?? 'INKAI-MEMBER',
                                    version: QrVersions.auto,
                                    size: 60.0,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 48),
              const Text(
                'Tunjukkan kartu ini saat pendaftaran event\natau saat verifikasi di Dojo.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
              const SizedBox(height: 32),
              
              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.download),
                      label: const Text('Simpan Gambar'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: BorderSide(color: Colors.white.withOpacity(0.1)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.share),
                      label: const Text('Bagikan'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: InkaiTheme.primaryGold,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
