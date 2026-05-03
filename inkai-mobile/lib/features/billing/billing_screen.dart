import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../../core/network/api_service.dart';
import '../../../core/theme.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';

class BillingScreen extends StatefulWidget {
  const BillingScreen({super.key});

  @override
  State<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends State<BillingScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _billings = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchBillings();
  }

  Future<void> _fetchBillings() async {
    try {
      // In a real app, we'd get the memberId from AuthProvider
      // For this implementation, we'll add a generic getMyBillings to ApiService
      final response = await _apiService.getMyBillings();
      setState(() {
        _billings = response.data['data'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Iuran & Pembayaran'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: InkaiTheme.primaryGold))
          : _error != null
              ? Center(child: Text('Error: $_error'))
              : Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildSummaryCard(currencyFormat),
                      const SizedBox(height: 32),
                      const Text(
                        'Riwayat Tagihan',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 16),
                      Expanded(
                        child: _billings.isEmpty
                            ? const Center(child: Text('Tidak ada tagihan.'))
                            : ListView.builder(
                                itemCount: _billings.length,
                                itemBuilder: (context, index) {
                                  final bill = _billings[index];
                                  return _buildBillingItem(bill, currencyFormat);
                                },
                              ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildSummaryCard(NumberFormat formatter) {
    final totalUnpaid = _billings
        .where((b) => b['status'] == 'PENDING')
        .fold(0.0, (sum, b) => sum + double.parse(b['amount'].toString()));

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2C2C34), Color(0xFF1E1E24)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Total Belum Dibayar',
            style: TextStyle(color: Colors.grey, fontSize: 12),
          ),
          const SizedBox(height: 8),
          Text(
            formatter.format(totalUnpaid),
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: InkaiTheme.primaryGold),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: totalUnpaid > 0 ? () => _showPaymentDialog(context, totalUnpaid, formatter) : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: InkaiTheme.primaryGold,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('BAYAR SEKARANG', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  void _showPaymentDialog(BuildContext context, double amount, NumberFormat formatter) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E1E24),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Konfirmasi Pembayaran', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total Tagihan', style: TextStyle(color: Colors.grey)),
                Text(formatter.format(amount), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              ],
            ),
            const SizedBox(height: 32),
            const Text('Pilih Metode Pembayaran:', style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            _methodItem(LucideIcons.landmark, 'Virtual Account (Dojo)'),
            _methodItem(LucideIcons.qr_code, 'QRIS / E-Wallet'),
            _methodItem(LucideIcons.banknote, 'Tunai ke Bendahara Dojo'),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Permintaan pembayaran dikirim!')));
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: InkaiTheme.primaryGold,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('LANJUTKAN PEMBAYARAN', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _methodItem(IconData icon, String title) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: InkaiTheme.primaryGold),
          const SizedBox(width: 16),
          Text(title, style: const TextStyle(color: Colors.white, fontSize: 13)),
          const Spacer(),
          const Icon(LucideIcons.chevron_right, size: 14, color: Colors.grey),
        ],
      ),
    );
  }


  Widget _buildBillingItem(dynamic bill, NumberFormat formatter) {
    final isPaid = bill['status'] == 'PAID';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: (isPaid ? Colors.green : Colors.amber).withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isPaid ? LucideIcons.check : LucideIcons.clock,
              color: isPaid ? Colors.green : Colors.amber,
              size: 16,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  bill['type'] == 'MONTHLY_IURAN' ? 'Iuran Bulanan' : 'Biaya Event',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  'Jatuh tempo: ${bill['dueDate']}',
                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                ),
              ],
            ),
          ),
          Text(
            formatter.format(double.parse(bill['amount'].toString())),
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: isPaid ? Colors.grey : Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

