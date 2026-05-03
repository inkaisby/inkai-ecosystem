import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/network/api_service.dart';
import '../../../core/theme.dart';

class DojoMembersScreen extends StatefulWidget {
  final String dojoId;
  final String dojoName;

  const DojoMembersScreen({super.key, required this.dojoId, required this.dojoName});

  @override
  State<DojoMembersScreen> createState() => _DojoMembersScreenState();
}

class _DojoMembersScreenState extends State<DojoMembersScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _members = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchMembers();
  }

  Future<void> _fetchMembers() async {
    try {
      final response = await _apiService.getMembers(dojoId: widget.dojoId);
      setState(() {
        _members = response.data['data'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: InkaiTheme.backgroundDark,
      appBar: AppBar(
        title: Column(
          children: [
            Text('DAFTAR ANGGOTA', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
            Text(widget.dojoName, style: GoogleFonts.inter(fontSize: 10, color: InkaiTheme.primaryGold)),
          ],
        ),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: InkaiTheme.primaryGold))
          : _members.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(LucideIcons.users, size: 64, color: Colors.white10),
                      const SizedBox(height: 16),
                      Text('Belum ada anggota terdaftar', style: GoogleFonts.inter(color: Colors.grey)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(24),
                  itemCount: _members.length,
                  itemBuilder: (context, index) {
                    final member = _members[index];
                    return _buildMemberCard(member);
                  },
                ),
    );
  }

  Widget _buildMemberCard(dynamic member) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: InkWell(
        onTap: () => _showMemberDetails(member),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: InkaiTheme.primaryGold.withOpacity(0.1),
                child: Text(
                  (member['fullName'] as String).substring(0, 1).toUpperCase(),
                  style: const TextStyle(color: InkaiTheme.primaryGold, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      member['fullName'],
                      style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    Text(
                      'NIA: ${member['nia'] ?? '-'} | ${member['currentRank'] ?? 'Sabuk Putih'}',
                      style: GoogleFonts.inter(fontSize: 11, color: Colors.grey),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: member['status'] == 'AKTIF' || member['status'] == 'Active' ? Colors.green.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  member['status'] ?? 'PENDING',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    color: member['status'] == 'AKTIF' || member['status'] == 'Active' ? Colors.greenAccent : Colors.orangeAccent,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showMemberDetails(dynamic member) {
    showModalBottomSheet(
      context: context,
      backgroundColor: InkaiTheme.backgroundDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 32,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: InkaiTheme.primaryGold.withOpacity(0.1),
                  child: Text(
                    (member['fullName'] as String).substring(0, 1).toUpperCase(),
                    style: const TextStyle(color: InkaiTheme.primaryGold, fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        member['fullName'],
                        style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      Text(
                        'Anggota INKAI',
                        style: GoogleFonts.inter(color: InkaiTheme.primaryGold, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            _buildDetailRow(LucideIcons.id_card, 'NIA', member['nia'] ?? 'Belum ada NIA'),
            _buildDetailRow(LucideIcons.award, 'Sabuk', member['currentRank'] ?? 'Sabuk Putih'),
            _buildDetailRow(LucideIcons.user, 'Gender', member['gender'] == 'M' ? 'Laki-laki' : 'Perempuan'),
            _buildDetailRow(LucideIcons.calendar, 'Tgl Lahir', member['birthDate']?.toString().split('T')[0] ?? '-'),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: InkaiTheme.primaryGold,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('TUTUP', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 14, color: Colors.white24),
          const SizedBox(width: 12),
          Text(label, style: GoogleFonts.inter(fontSize: 10, color: Colors.grey)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: GoogleFonts.inter(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
