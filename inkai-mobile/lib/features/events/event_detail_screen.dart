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
    } catch (e) {
      debugPrint('Error fetching event: $e');
    } finally {
      setState(() => _isLoading = false);
    }
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
    final bool isRegularMember = roles.contains('MEMBER') && !isAdmin;
    
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
                    Text(
                      isUKTEvent ? 'Ujian Kenaikan Sabuk' : 'Kategori Lomba',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),
                    if (_event['categories'] != null && (_event['categories'] as List).isNotEmpty)
                      ...(_event['categories'] as List).map((cat) => _buildCategorySelectionItem(cat))
                    else
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 20),
                          child: Text('Tidak ada kategori khusus', style: TextStyle(color: Colors.grey, fontSize: 13)),
                        ),
                      ),

                    if (!isRegularMember) ...[
                      const SizedBox(height: 40),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Daftar Peserta',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
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
                      const SizedBox(height: 16),
                      if (_event['registrations'] != null && (_event['registrations'] as List).isNotEmpty)
                        ...(_event['registrations'] as List).map((reg) => _buildParticipantItem(reg['member']))
                      else
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.symmetric(vertical: 20),
                            child: Text('Belum ada peserta terdaftar', style: TextStyle(color: Colors.grey, fontSize: 13)),
                          ),
                        ),
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
        child: ElevatedButton(
          onPressed: _isRegistering ? null : _register,
          style: ElevatedButton.styleFrom(
            backgroundColor: InkaiTheme.primaryGold,
            foregroundColor: Colors.black,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          child: _isRegistering
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
              : Text(_userRegistration == null ? 'DAFTAR SEKARANG' : 'UPDATE PENDAFTARAN', style: const TextStyle(fontWeight: FontWeight.bold)),
        ),
      ) : null,
    );
  }

  Widget _buildCategorySelectionItem(dynamic category) {
    final isSelected = _selectedCategoryId == category['id'].toString();
    
    return InkWell(
      onTap: () {
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

  Widget _buildParticipantItem(Map<String, dynamic> member) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: InkaiTheme.primaryGold.withOpacity(0.1),
            child: Text(
              (member['fullName'] as String? ?? 'U')[0].toUpperCase(),
              style: const TextStyle(color: InkaiTheme.primaryGold, fontSize: 12, fontWeight: FontWeight.bold),
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
                  'NIA: ${member['nia'] ?? '-'}',
                  style: const TextStyle(color: Colors.grey, fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
