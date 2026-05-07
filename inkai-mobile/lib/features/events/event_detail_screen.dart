import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../auth/providers/auth_provider.dart';
import '../billing/billing_screen.dart';
import '../../../core/network/api_service.dart';
import '../../../core/theme.dart';
import 'edit_event_screen.dart';
import 'package:intl/intl.dart';
import 'package:dio/dio.dart';

class EventDetailScreen extends StatefulWidget {
  final dynamic event;
  const EventDetailScreen({super.key, required this.event});

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  final ApiService _apiService = ApiService();
  bool _isRegistering = false;
  late dynamic _event;
  bool _isLoading = false;
  bool _isParticipantsExpanded = false;
  bool _isCategoriesExpanded = true;
  String? _selectedCategoryId;
  dynamic _userRegistration;

  @override
  void initState() {
    super.initState();
    _event = widget.event;
    _checkUserRegistration();
    _fetchEvent(); // Get full details (including registrations)
  }

  void _checkUserRegistration() {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    final registrations = _event['registrations'] as List?;
    if (registrations != null && user != null) {
      try {
        _userRegistration = registrations.firstWhere(
          (r) => r['memberId'] == user['id'],
          orElse: () => null,
        );
        if (_userRegistration != null) {
          _selectedCategoryId = _userRegistration['categoryId']?.toString();
        }
      } catch (e) {
        _userRegistration = null;
      }
    }
  }

  Future<void> _fetchEvent() async {
    setState(() => _isLoading = true);
    try {
      final response = await _apiService.dio.get('/events/${_event['id']}');
      if (response.data['status'] == 'success') {
        setState(() {
          _event = response.data['data'];
          _checkUserRegistration();
        });
      }

      // Also check for pending billing verifications
      final billingResponse = await _apiService.getMyBillings();
      if (billingResponse.data['status'] == 'success') {
        final List billings = billingResponse.data['data'];
        setState(() {
          _hasPendingVerification = billings.any((b) => b['status'] == 'WAITING_VERIFICATION');
        });
      }
    } catch (e) {
      debugPrint('Error fetching data: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  bool _hasPendingVerification = false;

  bool get isRegularMember {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    final roles = List<String>.from(user?['roles'] ?? []);
    final isAdmin = roles.any((r) => ['ADMIN_BRANCH', 'ADMIN_PROVINCE', 'ADMIN_PUSAT', 'ADMINISTRATOR'].contains(r));
    return roles.contains('MEMBER') && !isAdmin;
  }

  Future<void> _register() async {
    if (_selectedCategoryId == null && (_event['categories'] as List?)?.isNotEmpty == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Silakan pilih kategori sabuk terlebih dahulu')),
      );
      return;
    }

    setState(() => _isRegistering = true);
    try {
      if (_userRegistration == null) {
        // Create new registration
        await _apiService.dio.post('/events/register', data: {
          'eventId': _event['id'],
          'memberId': Provider.of<AuthProvider>(context, listen: false).user?['id'],
          'categoryId': _selectedCategoryId,
        });
      } else {
        // Update existing registration
        await _apiService.dio.put('/events/register/${_userRegistration['id']}', data: {
          'categoryId': _selectedCategoryId,
        });
      }
      
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            backgroundColor: const Color(0xFF1E1E24),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            title: Text(_userRegistration == null ? 'Pendaftaran Berhasil!' : 'Pembaruan Berhasil!', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            content: Text(
              _userRegistration == null 
                ? 'Pendaftaran Anda telah diterima. Silakan lanjut ke pembayaran untuk menyelesaikan proses.'
                : 'Pembaruan kategori pendaftaran Anda telah berhasil disimpan.',
              style: const TextStyle(color: Colors.white70),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('NANTI', style: TextStyle(color: Colors.grey)),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context); // Close dialog
                  Navigator.pop(context); // Close detail screen
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const BillingScreen()));
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: InkaiTheme.primaryGold,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('BAYAR SEKARANG'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      String errorMessage = e.toString();
      if (e is DioException && e.response?.data != null) {
        errorMessage = e.response?.data['message'] ?? errorMessage;
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $errorMessage')),
        );
      }
    } finally {
      setState(() => _isRegistering = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;
    final roles = List<String>.from(user?['roles'] ?? []);
    
    // Check if admin OR owner
    final bool isAdmin = roles.any((r) => ['ADMIN_BRANCH', 'ADMIN_PROVINCE', 'ADMIN_PUSAT', 'ADMINISTRATOR'].contains(r));
    final bool isOwner = _event['createdById'] != null && user?['id'] == _event['createdById'];
    final bool canEdit = isAdmin || isOwner;
    // Removed local isRegularMember as it is now a class getter
    
    final bool isUKTEvent = _event['title'].toString().toUpperCase().contains('UKT') || 
                            _event['title'].toString().toUpperCase().contains('UJIAN KENAIKAN TINGKAT');

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            actions: [
              if (canEdit)
                IconButton(
                  icon: const Icon(LucideIcons.user_round_pen, color: InkaiTheme.primaryGold),
                  onPressed: () async {
                    final updated = await Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => EditEventScreen(event: _event)),
                    );
                    if (updated == true) {
                      _fetchEvent();
                    }
                  },
                ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              title: Text(_event['title'], style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF1E1E24), Color(0xFF0A0A0C)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: Center(
                  child: Icon(
                    isUKTEvent ? LucideIcons.award : LucideIcons.trophy, 
                    size: 80, 
                    color: InkaiTheme.primaryGold
                  ),
                ),
              ),
            ),
          ),
          if (_isLoading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator(color: InkaiTheme.primaryGold)),
            )
          else
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildInfoRow(LucideIcons.calendar, 'Tanggal', 
                      '${DateFormat('dd-MM-yyyy').format(DateTime.parse(_event['startDate']))} - ${_event['endDate'] != null ? DateFormat('dd-MM-yyyy').format(DateTime.parse(_event['endDate'])) : ''}'),
                    const SizedBox(height: 16),
                    _buildInfoRow(LucideIcons.map_pin, 'Lokasi', _event['location'] ?? 'Indonesia'),
                    const SizedBox(height: 32),
                    const Text(
                      'Deskripsi Kegiatan',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _event['description'] ?? 'Tidak ada deskripsi tersedia untuk kegiatan ini.',
                      style: const TextStyle(color: Colors.grey, height: 1.5),
                    ),
                    const SizedBox(height: 40),
                    InkWell(
                      onTap: () {
                        setState(() {
                          _isCategoriesExpanded = !_isCategoriesExpanded;
                          if (_isCategoriesExpanded) {
                            _isParticipantsExpanded = false;
                          }
                        });
                      },
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Text(
                                isUKTEvent ? 'Ujian Kenaikan Sabuk' : 'Kategori Lomba',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(width: 8),
                              Icon(
                                _isCategoriesExpanded ? LucideIcons.chevron_up : LucideIcons.chevron_down,
                                size: 18,
                                color: Colors.grey,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (_isCategoriesExpanded) ...[
                      if (_event['categories'] != null && (_event['categories'] as List).isNotEmpty)
                        ...(_event['categories'] as List)
                          .where((cat) {
                            // If already registered, only show the selected category
                            if (_userRegistration != null) {
                              return cat['id'].toString() == _userRegistration['categoryId']?.toString();
                            }
                            return true;
                          })
                          .map((cat) => _buildCategorySelectionItem(cat))
                      else
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.symmetric(vertical: 20),
                            child: Text('Tidak ada kategori khusus', style: TextStyle(color: Colors.grey, fontSize: 13)),
                          ),
                        ),
                    ],

                    if (!isRegularMember) ...[
                      const SizedBox(height: 40),
                      InkWell(
                        onTap: () {
                          setState(() {
                            _isParticipantsExpanded = !_isParticipantsExpanded;
                            if (_isParticipantsExpanded) {
                              _isCategoriesExpanded = false;
                            }
                          });
                        },
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Text(
                                  'Daftar Peserta',
                                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(width: 8),
                                Icon(
                                  _isParticipantsExpanded ? LucideIcons.chevron_up : LucideIcons.chevron_down,
                                  size: 18,
                                  color: Colors.grey,
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: InkaiTheme.primaryGold.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                '${(_event['registrations'] as List?)?.length ?? 0} Orang',
                                style: const TextStyle(color: InkaiTheme.primaryGold, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (_isParticipantsExpanded) ...[
                        if (_event['registrations'] != null && _event['registrations'] is List)
                          ...(_event['registrations'] as List).where((reg) {
                            if (isRegularMember) return true;
                            // For Admins, show only those who have paid or are waiting for verification
                            final billings = reg['member']['billings'];
                            if (billings is! List) return false;
                            
                            final isPaid = reg['status'] == 'PAID' || (billings.any((b) => b['status'] == 'PAID'));
                            final isWaiting = billings.any((b) => b['status'] == 'WAITING_VERIFICATION');
                            return isPaid || isWaiting;
                          }).map((reg) => _buildParticipantItem(reg))
                        else
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.symmetric(vertical: 20),
                              child: Text('Tidak ada peserta yang perlu verifikasi', style: TextStyle(color: Colors.grey, fontSize: 13)),
                            ),
                          ),
                      ],
                    ],
                  ],
                ),
              ),
            ),
        ],
      ),
      bottomNavigationBar: isRegularMember ? Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.black,
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 10, offset: const Offset(0, -5))
          ]
        ),
        child: Builder(
          builder: (context) {
            final bool isPaid = _userRegistration != null && _userRegistration['status'] == 'PAID';
            final bool isRegistered = _userRegistration != null;

            return ElevatedButton(
              onPressed: (_isRegistering || _hasPendingVerification || isRegistered) 
                ? (isPaid ? () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Anda sudah terdaftar dan pembayaran telah diverifikasi.'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  } : (isRegistered ? () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Anda sudah terdaftar. Selesaikan pembayaran untuk memproses.'),
                        backgroundColor: Colors.blue,
                      ),
                    );
                  } : (_hasPendingVerification ? () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Selesaikan verifikasi pembayaran sebelumnya terlebih dahulu.'),
                        backgroundColor: Colors.amber,
                      ),
                    );
                  } : null)))
                : _register,
              style: ElevatedButton.styleFrom(
                backgroundColor: (isRegistered || _hasPendingVerification) ? Colors.grey.withOpacity(0.2) : InkaiTheme.primaryGold,
                foregroundColor: (isRegistered || _hasPendingVerification) ? Colors.white38 : Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: _isRegistering
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                  : Text(
                      isRegistered 
                        ? 'SUDAH TERDAFTAR'
                        : (_hasPendingVerification 
                          ? 'MENUNGGU VERIFIKASI' 
                          : 'DAFTAR SEKARANG'), 
                      style: const TextStyle(fontWeight: FontWeight.bold)
                    ),
            );
          },
        ),
      ) : null,
    );
  }

  Widget _buildCategorySelectionItem(dynamic category) {
    final isSelected = _selectedCategoryId == category['id'].toString();
    
    final isRegistered = _userRegistration != null;
    
    return InkWell(
      onTap: isRegistered ? null : () {
        setState(() {
          _selectedCategoryId = category['id'].toString();
        });
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? InkaiTheme.primaryGold.withOpacity(0.1) : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isSelected ? InkaiTheme.primaryGold : Colors.white.withOpacity(0.05)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(category['name'] ?? '', style: TextStyle(color: isSelected ? InkaiTheme.primaryGold : Colors.white, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
            Text(
              'Rp ${NumberFormat('#,###', 'id_ID').format(category['fee'])}',
              style: TextStyle(color: isSelected ? InkaiTheme.primaryGold : Colors.white54, fontSize: 13, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 20, color: InkaiTheme.primaryGold),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
              Text(value, style: const TextStyle(fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryItem(String name, String price) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.w500))),
          Text(price, style: const TextStyle(color: InkaiTheme.primaryGold, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildParticipantItem(Map<String, dynamic> reg) {
    final member = reg['member'];
    final billings = member['billings'] as List?;
    final waitingBilling = billings?.firstWhere((b) => b['status'] == 'WAITING_VERIFICATION', orElse: () => null);
    final isWaiting = waitingBilling != null;
    final isPaid = reg['status'] == 'PAID' || (billings?.any((b) => b['status'] == 'PAID') ?? false);

    return InkWell(
      onTap: (!isRegularMember && isWaiting) ? () => _showVerifyDialog(waitingBilling['id'], member['fullName']) : null,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isWaiting ? Colors.purple.withOpacity(0.05) : Colors.white.withOpacity(0.02),
          borderRadius: BorderRadius.circular(12),
          border: isWaiting ? Border.all(color: Colors.purple.withOpacity(0.2)) : null,
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: (isWaiting ? Colors.purple : (isPaid ? Colors.green : InkaiTheme.primaryGold)).withOpacity(0.1),
              child: Text(
                (member['fullName'] as String? ?? 'U')[0].toUpperCase(),
                style: TextStyle(color: isWaiting ? Colors.purpleAccent : (isPaid ? Colors.green : InkaiTheme.primaryGold), fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    member['fullName'] ?? 'User',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                  Text(
                    isWaiting ? 'Menunggu Verifikasi Tunai' : 'NIA: ${member['nia'] ?? '-'}',
                    style: TextStyle(color: isWaiting ? Colors.purpleAccent : Colors.grey, fontSize: 11),
                  ),
                ],
              ),
            ),
            if (!isRegularMember && isWaiting)
              const Icon(LucideIcons.shield_check, color: Colors.purpleAccent, size: 20),
            if (isPaid)
              const Icon(LucideIcons.circle_check, color: Colors.green, size: 16),
          ],
        ),
      ),
    );
  }

  void _showVerifyDialog(String billingId, String name) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E24),
        title: const Text('Verifikasi Pembayaran', style: TextStyle(color: Colors.white)),
        content: Text('Konfirmasi bahwa $name telah membayar secara tunai? Status akan berubah menjadi LUNAS.', style: const TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('BATAL')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(dialogContext);
              try {
                await _apiService.verifyPayment(billingId: billingId);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pembayaran berhasil diverifikasi!'), backgroundColor: Colors.green));
                  _fetchEvent(); // Refresh data
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
            child: const Text('VERIFIKASI'),
          ),
        ],
      ),
    );
  }
}
