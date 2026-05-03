import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/network/api_service.dart';
import '../../../core/theme.dart';
import 'dojo_members_screen.dart';

class RegionalListScreen extends StatefulWidget {
  final String title;
  final String type; // 'PROVINCE', 'BRANCH', 'DOJO'
  final String? parentId;

  const RegionalListScreen({
    super.key, 
    required this.title, 
    required this.type, 
    this.parentId
  });

  @override
  State<RegionalListScreen> createState() => _RegionalListScreenState();
}

class _RegionalListScreenState extends State<RegionalListScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _items = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      dynamic response;
      if (widget.type == 'PROVINCE') {
        response = await _apiService.getProvinces();
      } else if (widget.type == 'BRANCH') {
        response = await _apiService.getBranches(widget.parentId ?? '');
      } else {
        response = await _apiService.getDojos(widget.parentId ?? '');
      }

      setState(() {
        _items = response.data['data'];
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
        title: Text(widget.title, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: InkaiTheme.primaryGold))
          : _items.isEmpty
              ? const Center(child: Text('Data tidak ditemukan', style: TextStyle(color: Colors.grey)))
              : ListView.builder(
                  padding: const EdgeInsets.all(24),
                  itemCount: _items.length,
                  itemBuilder: (context, index) {
                    final item = _items[index];
                    return _buildItemCard(item);
                  },
                ),
    );
  }

  Widget _buildItemCard(dynamic item) {
    IconData icon;
    String subLabel = '';
    VoidCallback? onTap;

    if (widget.type == 'PROVINCE') {
      icon = LucideIcons.map;
      subLabel = '${item['_count']?['branches'] ?? 0} Cabang';
      onTap = () => Navigator.push(context, MaterialPageRoute(
        builder: (_) => RegionalListScreen(title: item['name'], type: 'BRANCH', parentId: item['id'])
      ));
    } else if (widget.type == 'BRANCH') {
      icon = LucideIcons.building_2;
      subLabel = '${item['_count']?['dojos'] ?? 0} Dojo';
      onTap = () => Navigator.push(context, MaterialPageRoute(
        builder: (_) => RegionalListScreen(title: item['name'], type: 'DOJO', parentId: item['id'])
      ));
    } else {
      icon = LucideIcons.house;
      subLabel = '${item['_count']?['members'] ?? 0} Anggota';
      onTap = () => Navigator.push(context, MaterialPageRoute(
        builder: (_) => DojoMembersScreen(dojoId: item['id'], dojoName: item['name'])
      ));
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(icon, color: InkaiTheme.primaryGold, size: 20),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item['name'], style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text(subLabel, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ),
              ),
              const Icon(LucideIcons.chevron_right, size: 16, color: Colors.white24),
            ],
          ),
        ),
      ),
    );
  }
}
