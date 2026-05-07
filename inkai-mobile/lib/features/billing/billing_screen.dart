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
        title: const Text('Pembayaran'),
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

    final hasWaiting = _billings.any((b) => b['status'] == 'WAITING_VERIFICATION');

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
              onPressed: (totalUnpaid > 0 && !hasWaiting) 
                ? () => _showPaymentDialog(context, totalUnpaid, formatter) 
                : (hasWaiting ? () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Selesaikan verifikasi pembayaran sebelumnya terlebih dahulu.'),
                        backgroundColor: Colors.amber,
                      ),
                    );
                  } : null),
              style: ElevatedButton.styleFrom(
                backgroundColor: hasWaiting ? Colors.grey.withOpacity(0.2) : InkaiTheme.primaryGold,
                foregroundColor: hasWaiting ? Colors.white38 : Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                hasWaiting ? 'MENUNGGU VERIFIKASI' : 'BAYAR SEKARANG', 
                style: const TextStyle(fontWeight: FontWeight.bold)
              ),
            ),
          ),
        ],
      ),
    );
  }

  String? _selectedMethod = 'VA'; // Default selection
  bool _isProcessing = false;

  void _showPaymentDialog(BuildContext context, double amount, NumberFormat formatter) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E1E24),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return Padding(
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
                _methodItem(LucideIcons.landmark, 'Virtual Account (Dojo)', 'VA', setModalState),
                _methodItem(LucideIcons.qr_code, 'QRIS / E-Wallet', 'QRIS', setModalState),
                _methodItem(LucideIcons.banknote, 'Tunai ke Bendahara Dojo', 'CASH', setModalState),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isProcessing ? null : () => _handlePayment(context, setModalState),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: InkaiTheme.primaryGold,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _isProcessing 
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                      : const Text('LANJUTKAN PEMBAYARAN', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          );
        }
      ),
    );
  }

  Future<void> _handlePayment(BuildContext context, StateSetter setModalState) async {
    final pendingBillings = _billings.where((b) => b['status'] == 'PENDING').toList();
    if (pendingBillings.isEmpty) return;

    setModalState(() => _isProcessing = true);
    setState(() => _isProcessing = true);

    try {
      for (var billing in pendingBillings) {
        await _apiService.processPayment(
          billingId: billing['id'],
          paymentMethod: _selectedMethod ?? 'VA',
        );
      }

      if (mounted) {
        Navigator.pop(context); // Close bottom sheet
        
        String message = _selectedMethod == 'CASH' 
          ? 'Permintaan terkirim. Silakan lakukan pembayaran ke Bendahara Dojo.' 
          : 'Pembayaran Berhasil!';
        Color bgColor = _selectedMethod == 'CASH' ? Colors.amber : Colors.green;

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: bgColor,
          ),
        );
        _fetchBillings(); // Refresh list
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setModalState(() => _isProcessing = false);
        setState(() => _isProcessing = false);
      }
    }
  }

  void _confirmDeleteBilling(String id) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E24),
        title: const Text('Batalkan Tagihan?', style: TextStyle(color: Colors.white)),
        content: const Text('Ini juga akan membatalkan pendaftaran event Anda. Lanjutkan?', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('BATAL')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(dialogContext);
              try {
                await _apiService.deleteBilling(id);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tagihan berhasil dibatalkan'), backgroundColor: Colors.green));
                  _fetchBillings();
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            child: const Text('HAPUS'),
          ),
        ],
      ),
    );
  }

  Widget _methodItem(IconData icon, String title, [String? value, StateSetter? setModalState]) {
    final isSelected = _selectedMethod == value;

    return InkWell(
      onTap: () {
        if (setModalState != null && value != null) {
          setModalState(() {
            _selectedMethod = value;
          });
        }
        setState(() {
          if (value != null) _selectedMethod = value;
        });
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? InkaiTheme.primaryGold.withOpacity(0.1) : Colors.white.withOpacity(0.03),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? InkaiTheme.primaryGold : Colors.white.withOpacity(0.05)),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: isSelected ? InkaiTheme.primaryGold : Colors.grey),
            const SizedBox(width: 16),
            Text(
              title, 
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.grey, 
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              )
            ),
            const Spacer(),
            if (isSelected)
              const Icon(LucideIcons.check, size: 14, color: InkaiTheme.primaryGold)
            else
              const Icon(LucideIcons.chevron_right, size: 14, color: Colors.grey),
          ],
        ),
      ),
    );
  }


  Widget _buildBillingItem(dynamic bill, NumberFormat formatter) {
    final isPaid = bill['status'] == 'PAID';
    final isWaiting = bill['status'] == 'WAITING_VERIFICATION';

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
              color: (isPaid ? Colors.green : (isWaiting ? Colors.purple : Colors.amber)).withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isPaid ? LucideIcons.check : (isWaiting ? LucideIcons.shield_alert : LucideIcons.clock),
              color: isPaid ? Colors.green : (isWaiting ? Colors.purple : Colors.amber),
              size: 16,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  bill['description'] ?? (bill['type'] == 'MONTHLY_IURAN' ? 'Iuran Bulanan' : 'Biaya Event'),
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  isPaid 
                    ? 'Lunas pada: ${DateFormat('dd-MM-yyyy HH:mm').format(DateTime.parse((bill['payment'] is List && (bill['payment'] as List).isNotEmpty) ? ((bill['payment'] as List).first['paidAt'] ?? bill['updatedAt']) : bill['updatedAt']))}'
                    : (isWaiting ? 'Menunggu Verifikasi' : 'Jatuh tempo: ${DateFormat('dd-MM-yyyy').format(DateTime.parse(bill['dueDate']))}'),
                  style: TextStyle(fontSize: 10, color: isPaid ? Colors.greenAccent : (isWaiting ? Colors.purpleAccent : Colors.grey)),
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
          if (!isPaid && !isWaiting) ...[
            const SizedBox(width: 8),
            InkWell(
              onTap: () => _confirmDeleteBilling(bill['id']),
              child: const Icon(LucideIcons.trash_2, size: 16, color: Colors.redAccent),
            ),
          ],
        ],
      ),
    );
  }
}

